#!/usr/bin/env pwsh
<#
.SYNOPSIS
Deploy Cloud Run ETL Worker to Google Cloud Platform

.DESCRIPTION
Builds Docker image, pushes to GCR, and deploys to Cloud Run
#>

param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "us-central1",
    [string]$ServiceName = "etl-worker",
    [string]$Memory = "2Gi",
    [int]$Cpu = 2,
    [int]$MinInstances = 1,
    [int]$MaxInstances = 100,
    [int]$Concurrency = 80
)

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Cyan
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Validate GCP_PROJECT_ID
if (-not $ProjectId) {
    Write-Error-Custom "GCP_PROJECT_ID not set. Please set environment variable or pass -ProjectId parameter"
    exit 1
}

Write-Info "Starting ETL Worker deployment to GCP..."
Write-Info "Project: $ProjectId"
Write-Info "Region: $Region"
Write-Info "Service: $ServiceName"

# Check if gcloud is installed
try {
    gcloud --version | Out-Null
    Write-Step "Google Cloud SDK found"
} catch {
    Write-Error-Custom "Google Cloud SDK not found. Please install from https://cloud.google.com/sdk"
    exit 1
}

# Set GCP project
Write-Info "Setting GCP project to $ProjectId..."
gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to set GCP project"
    exit 1
}
Write-Step "GCP project configured"

# Enable required APIs
Write-Info "Enabling required GCP APIs..."
$apis = @(
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "pubsub.googleapis.com",
    "bigquery.googleapis.com"
)

foreach ($api in $apis) {
    Write-Info "Enabling $api..."
    gcloud services enable $api --quiet
}
Write-Step "APIs enabled"

# Build Docker image
$imageName = "gcr.io/$ProjectId/$ServiceName"
$imageTag = "latest"
$fullImageName = "${imageName}:${imageTag}"

Write-Info "Building Docker image: $fullImageName..."
Push-Location workers/etl-worker

docker build -t $fullImageName .
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error-Custom "Docker build failed"
    exit 1
}

Pop-Location
Write-Step "Docker image built successfully"

# Push to GCR
Write-Info "Pushing image to Google Container Registry..."
docker push $fullImageName
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to push image to GCR"
    exit 1
}
Write-Step "Image pushed to GCR"

# Deploy to Cloud Run
Write-Info "Deploying to Cloud Run..."
gcloud run deploy $ServiceName `
    --image $fullImageName `
    --platform managed `
    --region $Region `
    --memory $Memory `
    --cpu $Cpu `
    --min-instances $MinInstances `
    --max-instances $MaxInstances `
    --concurrency $Concurrency `
    --timeout 300 `
    --allow-unauthenticated `
    --set-env-vars "GCP_PROJECT_ID=$ProjectId,BIGQUERY_DATASET=drishtix_analytics" `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Cloud Run deployment failed"
    exit 1
}
Write-Step "Deployed to Cloud Run"

# Get service URL
$serviceUrl = gcloud run services describe $ServiceName --region $Region --format "value(status.url)"
Write-Step "Service URL: $serviceUrl"

# Create Pub/Sub push subscription
Write-Info "Creating Pub/Sub push subscription..."
$subscriptionName = "etl-worker-sub"
$topicName = "raw-data-stream"

# Create topic if doesn't exist
gcloud pubsub topics create $topicName --quiet 2>$null

# Delete existing subscription if exists
gcloud pubsub subscriptions delete $subscriptionName --quiet 2>$null

# Create push subscription
gcloud pubsub subscriptions create $subscriptionName `
    --topic $topicName `
    --push-endpoint "${serviceUrl}/process" `
    --ack-deadline 60 `
    --message-retention-duration 7d `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to create Pub/Sub subscription"
    exit 1
}
Write-Step "Pub/Sub subscription created"

# Health check
Write-Info "Performing health check..."
Start-Sleep -Seconds 5
try {
    $response = Invoke-RestMethod -Uri "${serviceUrl}/health" -Method Get -TimeoutSec 10
    if ($response.status -eq "healthy") {
        Write-Step "Health check passed"
    } else {
        Write-Error-Custom "Health check failed: $($response.status)"
    }
} catch {
    Write-Error-Custom "Health check failed: $_"
}

# Update .env file
Write-Info "Updating .env file with ETL_WORKER_URL..."
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "ETL_WORKER_URL=") {
        $envContent = $envContent -replace "ETL_WORKER_URL=.*", "ETL_WORKER_URL=$serviceUrl"
    } else {
        $envContent += "`nETL_WORKER_URL=$serviceUrl"
    }
    Set-Content -Path $envPath -Value $envContent
    Write-Step ".env file updated"
} else {
    Write-Error-Custom ".env file not found"
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ETL Worker Deployment Complete!                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Service URL: " -NoNewline
Write-Host $serviceUrl -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the worker: curl $serviceUrl/health" -ForegroundColor White
Write-Host "2. Update backend .env: ETL_WORKER_URL=$serviceUrl" -ForegroundColor White
Write-Host "3. Restart backend server to load new configuration" -ForegroundColor White
Write-Host "4. Monitor logs: gcloud run logs read $ServiceName --region $Region --limit 50" -ForegroundColor White
Write-Host ""
