##############################################################################
# EventSphere GCP Infrastructure Deployment Script (PowerShell)
# 
# This script deploys all Google Cloud Platform resources using Terraform
# Includes: Pub/Sub, BigQuery, Cloud Storage, Cloud Armor, KMS, IAM, etc.
#
# Usage: .\scripts\deploy-infrastructure.ps1 [-Action <plan|apply|destroy>]
##############################################################################

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('plan', 'apply', 'destroy', 'outputs', 'deploy')]
    [string]$Action = 'deploy'
)

# Configuration
$TerraformDir = ".\terraform"
$ProjectID = $env:VITE_GCP_PROJECT_ID
$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }

# Colors for output
function Write-Header {
    param([string]$Message)
    Write-Host "===========================================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "===========================================================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check if Terraform is installed
    try {
        $terraformVersion = terraform version 2>$null | Select-Object -First 1
        Write-Success "Terraform installed: $terraformVersion"
    } catch {
        Write-Error "Terraform not found. Please install Terraform first."
        Write-Host "Visit: https://developer.hashicorp.com/terraform/downloads"
        exit 1
    }
    
    # Check if gcloud is installed
    try {
        $gcloudVersion = gcloud version 2>$null | Select-Object -First 1
        Write-Success "gcloud CLI installed: $gcloudVersion"
    } catch {
        Write-Error "gcloud CLI not found. Please install Google Cloud SDK first."
        Write-Host "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    # Check if logged in to gcloud
    try {
        $account = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
        if (-not $account) {
            Write-Warning "Not logged in to gcloud. Running authentication..."
            gcloud auth login
        }
        Write-Success "Authenticated to gcloud"
    } catch {
        Write-Error "Failed to authenticate with gcloud"
        exit 1
    }
    
    # Check project ID
    if (-not $ProjectID) {
        Write-Error "PROJECT_ID not set. Please set VITE_GCP_PROJECT_ID environment variable."
        Write-Host "Example: `$env:VITE_GCP_PROJECT_ID = 'your-project-id'"
        exit 1
    }
    Write-Success "Project ID: $ProjectID"
    
    # Set gcloud project
    gcloud config set project $ProjectID | Out-Null
    
    Write-Host ""
}

# Initialize Terraform
function Initialize-Terraform {
    Write-Header "Initializing Terraform"
    
    Push-Location $TerraformDir
    
    # Create terraform.tfvars if it doesn't exist
    if (-not (Test-Path "terraform.tfvars")) {
        Write-Info "Creating terraform.tfvars..."
        @"
project_id = "$ProjectID"
region     = "$Region"
"@ | Out-File -FilePath "terraform.tfvars" -Encoding UTF8
        Write-Success "Created terraform.tfvars"
    }
    
    # Initialize Terraform
    terraform init
    
    Write-Success "Terraform initialized"
    Pop-Location
    Write-Host ""
}

# Plan Terraform deployment
function Invoke-TerraformPlan {
    Write-Header "Planning Terraform Deployment"
    
    Push-Location $TerraformDir
    terraform plan -out=tfplan
    Write-Success "Terraform plan created (saved to tfplan)"
    Pop-Location
    Write-Host ""
}

# Apply Terraform deployment
function Invoke-TerraformApply {
    Write-Header "Applying Terraform Deployment"
    
    Push-Location $TerraformDir
    
    # Check if plan exists
    if (Test-Path "tfplan") {
        Write-Info "Applying saved plan..."
        terraform apply tfplan
        Remove-Item "tfplan" -Force
    } else {
        Write-Warning "No saved plan found. Creating new plan..."
        terraform apply -auto-approve
    }
    
    Write-Success "Infrastructure deployed successfully!"
    Pop-Location
    Write-Host ""
}

# Destroy Terraform deployment
function Invoke-TerraformDestroy {
    Write-Header "Destroying Terraform Deployment"
    
    Write-Warning "This will destroy ALL infrastructure!"
    $confirmation = Read-Host "Are you sure? Type 'yes' to confirm"
    
    if ($confirmation -ne "yes") {
        Write-Info "Destruction cancelled."
        exit 0
    }
    
    Push-Location $TerraformDir
    terraform destroy -auto-approve
    Write-Success "Infrastructure destroyed"
    Pop-Location
    Write-Host ""
}

# Show Terraform outputs
function Show-TerraformOutputs {
    Write-Header "Terraform Outputs"
    
    Push-Location $TerraformDir
    terraform output
    Pop-Location
    Write-Host ""
}

# Enable required GCP APIs
function Enable-GCPAPIs {
    Write-Header "Enabling Required GCP APIs"
    
    $apis = @(
        "compute.googleapis.com",
        "storage-api.googleapis.com",
        "bigquery.googleapis.com",
        "pubsub.googleapis.com",
        "cloudfunctions.googleapis.com",
        "aiplatform.googleapis.com",
        "vision.googleapis.com",
        "cloudkms.googleapis.com",
        "monitoring.googleapis.com",
        "logging.googleapis.com",
        "compute.googleapis.com",
        "firestore.googleapis.com",
        "cloudresourcemanager.googleapis.com",
        "iam.googleapis.com"
    )
    
    foreach ($api in $apis) {
        Write-Info "Enabling $api..."
        gcloud services enable $api --project=$ProjectID 2>$null | Out-Null
    }
    
    Write-Success "All required APIs enabled"
    Write-Host ""
}

# Create service account key
function New-ServiceAccountKey {
    Write-Header "Creating Service Account Key"
    
    $SAName = "cloud-functions-sa"
    $SAEmail = "${SAName}@${ProjectID}.iam.gserviceaccount.com"
    $KeyFile = ".\service-account-key.json"
    
    # Check if service account exists (will be created by Terraform)
    try {
        gcloud iam service-accounts describe $SAEmail --project=$ProjectID 2>$null | Out-Null
        Write-Info "Service account exists: $SAEmail"
        
        # Create key if it doesn't exist
        if (-not (Test-Path $KeyFile)) {
            Write-Info "Creating service account key..."
            gcloud iam service-accounts keys create $KeyFile `
                --iam-account=$SAEmail `
                --project=$ProjectID
            Write-Success "Service account key created: $KeyFile"
        } else {
            Write-Warning "Service account key already exists: $KeyFile"
        }
    } catch {
        Write-Warning "Service account not found. It will be created by Terraform."
    }
    
    Write-Host ""
}

# Update .env file
function Update-EnvFile {
    Write-Header "Updating .env File"
    
    Push-Location $TerraformDir
    
    # Get Terraform outputs
    try {
        $BucketName = terraform output -raw bucket_name 2>$null
        $DatasetID = terraform output -raw bigquery_dataset 2>$null
    } catch {
        $BucketName = ""
        $DatasetID = ""
    }
    
    Pop-Location
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
        } else {
            New-Item ".env" -ItemType File | Out-Null
        }
    }
    
    # Update .env with infrastructure details
    Write-Info "Updating .env with infrastructure details..."
    
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    
    if ($BucketName) {
        $envContent = $envContent -replace "^VITE_GCS_BUCKET=.*", "VITE_GCS_BUCKET=$BucketName"
    }
    
    if ($DatasetID) {
        $envContent = $envContent -replace "^VITE_BIGQUERY_DATASET=.*", "VITE_BIGQUERY_DATASET=$DatasetID"
    }
    
    $envContent = $envContent -replace "^VITE_GCP_PROJECT_ID=.*", "VITE_GCP_PROJECT_ID=$ProjectID"
    $envContent = $envContent -replace "^VITE_GCP_REGION=.*", "VITE_GCP_REGION=$Region"
    
    $envContent | Out-File ".env" -Encoding UTF8
    
    Write-Success ".env file updated"
    Write-Host ""
}

# Main deployment flow
function Start-Deployment {
    Write-Header "🚀 EventSphere GCP Infrastructure Deployment"
    Write-Host ""
    
    Test-Prerequisites
    Enable-GCPAPIs
    Initialize-Terraform
    Invoke-TerraformPlan
    Invoke-TerraformApply
    Show-TerraformOutputs
    New-ServiceAccountKey
    Update-EnvFile
    
    Write-Header "✅ Deployment Complete!"
    Write-Info "Next steps:"
    Write-Host "  1. Review the Terraform outputs above"
    Write-Host "  2. Deploy Cloud Functions: .\scripts\deploy-cloud-functions.ps1 -FunctionName all"
    Write-Host "  3. Run end-to-end tests: node scripts\test-e2e-pipeline.js"
    Write-Host ""
    Write-Success "Infrastructure is ready! 🎉"
}

# Main script
switch ($Action) {
    'plan' {
        Test-Prerequisites
        Initialize-Terraform
        Invoke-TerraformPlan
    }
    'apply' {
        Test-Prerequisites
        Initialize-Terraform
        Invoke-TerraformApply
        Show-TerraformOutputs
    }
    'destroy' {
        Test-Prerequisites
        Initialize-Terraform
        Invoke-TerraformDestroy
    }
    'outputs' {
        Show-TerraformOutputs
    }
    'deploy' {
        Start-Deployment
    }
}
