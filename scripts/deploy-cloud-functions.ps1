# Cloud Functions Deployment Script (PowerShell)
# 
# Deploys all Cloud Functions for EventSphere (Project Drishti)
# 
# Usage:
#   .\scripts\deploy-cloud-functions.ps1 [function-name]
# 
# Functions:
#   - alert-triggers
#   - reward-automation
#   - twilio-webhooks
#   - all (default)

param(
    [string]$FunctionName = "all"
)

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = $env:GCP_PROJECT_ID
$REGION = if ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$SERVICE_ACCOUNT = $env:GCP_SERVICE_ACCOUNT

# Colors
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success { Write-ColorOutput "✓ $args" -Color Green }
function Write-Error { Write-ColorOutput "✗ $args" -Color Red }
function Write-Info { Write-ColorOutput "ℹ $args" -Color Cyan }
function Write-Warning { Write-ColorOutput "⚠ $args" -Color Yellow }

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "============================================================" -Color Cyan
    Write-ColorOutput $Message -Color Cyan
    Write-ColorOutput "============================================================" -Color Cyan
}

# Check prerequisites
function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check if gcloud is installed
    try {
        $null = Get-Command gcloud -ErrorAction Stop
        Write-Success "gcloud CLI found"
    }
    catch {
        Write-Error "gcloud CLI not found. Please install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    }
    
    # Check if project ID is set
    if (-not $PROJECT_ID) {
        $PROJECT_ID = gcloud config get-value project 2>$null
        if (-not $PROJECT_ID) {
            Write-Error "GCP_PROJECT_ID not set. Set it with: `$env:GCP_PROJECT_ID='your-project-id'"
            exit 1
        }
    }
    Write-Success "Project ID: $PROJECT_ID"
    
    # Check if APIs are enabled
    Write-Info "Checking required APIs..."
    
    $requiredAPIs = @(
        "cloudfunctions.googleapis.com",
        "cloudbuild.googleapis.com",
        "pubsub.googleapis.com",
        "firestore.googleapis.com"
    )
    
    foreach ($api in $requiredAPIs) {
        $enabled = gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>$null
        if ($enabled -match $api) {
            Write-Success "$api enabled"
        }
        else {
            Write-Warning "$api not enabled. Enabling..."
            gcloud services enable $api --project=$PROJECT_ID
            Write-Success "$api enabled"
        }
    }
}

# Create Pub/Sub topics
function New-PubSubTopics {
    Write-Header "Creating Pub/Sub Topics"
    
    $topics = @(
        "incident-alerts",
        "reward-events",
        "alert-escalation"
    )
    
    foreach ($topic in $topics) {
        try {
            gcloud pubsub topics describe $topic --project=$PROJECT_ID 2>$null | Out-Null
            Write-Success "Topic $topic already exists"
        }
        catch {
            Write-Info "Creating topic $topic..."
            gcloud pubsub topics create $topic --project=$PROJECT_ID
            Write-Success "Topic $topic created"
        }
    }
}

# Deploy Alert Triggers function
function Deploy-AlertTriggers {
    Write-Header "Deploying Alert Triggers Function"
    
    Push-Location functions\alert-triggers
    
    Write-Info "Installing dependencies..."
    npm install
    
    Write-Info "Deploying function..."
    
    $envVars = "GCP_PROJECT_ID=$PROJECT_ID"
    if ($env:TWILIO_ACCOUNT_SID) { $envVars += ",TWILIO_ACCOUNT_SID=$env:TWILIO_ACCOUNT_SID" }
    if ($env:TWILIO_AUTH_TOKEN) { $envVars += ",TWILIO_AUTH_TOKEN=$env:TWILIO_AUTH_TOKEN" }
    if ($env:TWILIO_PHONE_NUMBER) { $envVars += ",TWILIO_PHONE_NUMBER=$env:TWILIO_PHONE_NUMBER" }
    if ($env:API_BASE_URL) { $envVars += ",API_BASE_URL=$env:API_BASE_URL" }
    
    $deployArgs = @(
        "functions", "deploy", "handleAlertTrigger",
        "--gen2",
        "--runtime=nodejs20",
        "--region=$REGION",
        "--source=.",
        "--entry-point=handleAlertTrigger",
        "--trigger-topic=incident-alerts",
        "--set-env-vars=$envVars",
        "--memory=256MB",
        "--timeout=60s",
        "--max-instances=10",
        "--project=$PROJECT_ID"
    )
    
    if ($SERVICE_ACCOUNT) {
        $deployArgs += "--service-account=$SERVICE_ACCOUNT"
    }
    
    & gcloud $deployArgs
    
    Write-Success "Alert Triggers function deployed"
    Pop-Location
}

# Deploy Reward Automation function
function Deploy-RewardAutomation {
    Write-Header "Deploying Reward Automation Function"
    
    Push-Location functions\reward-automation
    
    Write-Info "Installing dependencies..."
    npm install
    
    Write-Info "Deploying function..."
    
    $deployArgs = @(
        "functions", "deploy", "handleRewardTrigger",
        "--gen2",
        "--runtime=nodejs20",
        "--region=$REGION",
        "--source=.",
        "--entry-point=handleRewardTrigger",
        "--trigger-topic=reward-events",
        "--set-env-vars=GCP_PROJECT_ID=$PROJECT_ID",
        "--memory=256MB",
        "--timeout=60s",
        "--max-instances=10",
        "--project=$PROJECT_ID"
    )
    
    if ($SERVICE_ACCOUNT) {
        $deployArgs += "--service-account=$SERVICE_ACCOUNT"
    }
    
    & gcloud $deployArgs
    
    Write-Success "Reward Automation function deployed"
    Pop-Location
}

# Deploy Twilio Webhooks function
function Deploy-TwilioWebhooks {
    Write-Header "Deploying Twilio Webhooks Function"
    
    Push-Location functions\twilio-webhooks
    
    Write-Info "Installing dependencies..."
    npm install
    
    Write-Info "Deploying function..."
    
    $webhookBaseUrl = "https://$REGION-$PROJECT_ID.cloudfunctions.net"
    
    $envVars = "GCP_PROJECT_ID=$PROJECT_ID,WEBHOOK_BASE_URL=$webhookBaseUrl"
    if ($env:TWILIO_ACCOUNT_SID) { $envVars += ",TWILIO_ACCOUNT_SID=$env:TWILIO_ACCOUNT_SID" }
    if ($env:TWILIO_AUTH_TOKEN) { $envVars += ",TWILIO_AUTH_TOKEN=$env:TWILIO_AUTH_TOKEN" }
    if ($env:GEMINI_API_KEY) { $envVars += ",GEMINI_API_KEY=$env:GEMINI_API_KEY" }
    
    $deployArgs = @(
        "functions", "deploy", "handleTwilioWebhook",
        "--gen2",
        "--runtime=nodejs20",
        "--region=$REGION",
        "--source=.",
        "--entry-point=handleTwilioWebhook",
        "--trigger-http",
        "--allow-unauthenticated",
        "--set-env-vars=$envVars",
        "--memory=512MB",
        "--timeout=120s",
        "--max-instances=20",
        "--project=$PROJECT_ID"
    )
    
    if ($SERVICE_ACCOUNT) {
        $deployArgs += "--service-account=$SERVICE_ACCOUNT"
    }
    
    & gcloud $deployArgs
    
    # Get function URL
    $webhookUrl = gcloud functions describe handleTwilioWebhook `
        --gen2 `
        --region=$REGION `
        --project=$PROJECT_ID `
        --format='value(serviceConfig.uri)'
    
    Write-Success "Twilio Webhooks function deployed"
    Write-Info "Webhook URL: $webhookUrl"
    Write-Warning "Configure this URL in Twilio Console for SMS/WhatsApp webhooks"
    
    Pop-Location
}

# Display deployment summary
function Show-Summary {
    Write-Header "Deployment Summary"
    
    Write-Host ""
    Write-Success "All Cloud Functions deployed successfully!"
    Write-Host ""
    
    Write-Info "Project ID: $PROJECT_ID"
    Write-Info "Region: $REGION"
    Write-Host ""
    
    Write-Host "Deployed Functions:"
    Write-Host "  • handleAlertTrigger (Pub/Sub: incident-alerts)"
    Write-Host "  • handleRewardTrigger (Pub/Sub: reward-events)"
    Write-Host "  • handleTwilioWebhook (HTTP)"
    Write-Host ""
    
    Write-Info "Next Steps:"
    Write-Host "  1. Configure Twilio webhook URL in Twilio Console"
    Write-Host "  2. Set up Firebase Admin SDK for FCM notifications"
    Write-Host "  3. Add on-call responders to Firestore 'responders' collection"
    Write-Host "  4. Test functions with: node scripts\test-cloud-functions.js"
    Write-Host "  5. Monitor logs: gcloud functions logs read --follow"
    Write-Host ""
    
    Write-Info "View functions in Console:"
    Write-Host "  https://console.cloud.google.com/functions/list?project=$PROJECT_ID"
    Write-Host ""
}

# Check environment variables
function Test-EnvironmentVariables {
    $missingVars = @()
    
    if (-not $env:TWILIO_ACCOUNT_SID) { $missingVars += "TWILIO_ACCOUNT_SID" }
    if (-not $env:TWILIO_AUTH_TOKEN) { $missingVars += "TWILIO_AUTH_TOKEN" }
    if (-not $env:TWILIO_PHONE_NUMBER) { $missingVars += "TWILIO_PHONE_NUMBER" }
    if (-not $env:GEMINI_API_KEY) { $missingVars += "GEMINI_API_KEY" }
    if (-not $env:API_BASE_URL) { $missingVars += "API_BASE_URL" }
    
    if ($missingVars.Count -gt 0) {
        Write-Warning "Missing environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var"
        }
        Write-Host ""
        Write-Warning "Functions will deploy but may not work correctly without these values."
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            exit 1
        }
    }
}

# Main
function Main {
    Write-Host ""
    Write-ColorOutput "============================================================" -Color Cyan
    Write-ColorOutput "Cloud Functions Deployment - EventSphere (Project Drishti)" -Color Cyan
    Write-ColorOutput "============================================================" -Color Cyan
    Write-Host ""
    
    Test-Prerequisites
    New-PubSubTopics
    
    switch ($FunctionName) {
        "alert-triggers" {
            Deploy-AlertTriggers
        }
        "reward-automation" {
            Deploy-RewardAutomation
        }
        "twilio-webhooks" {
            Deploy-TwilioWebhooks
        }
        "all" {
            Deploy-AlertTriggers
            Deploy-RewardAutomation
            Deploy-TwilioWebhooks
        }
        default {
            Write-Error "Invalid function name: $FunctionName"
            Write-Host "Valid options: alert-triggers, reward-automation, twilio-webhooks, all"
            exit 1
        }
    }
    
    Show-Summary
}

# Run
Test-EnvironmentVariables
Main
