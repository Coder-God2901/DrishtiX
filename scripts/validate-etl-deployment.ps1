#!/usr/bin/env pwsh
<#
.SYNOPSIS
Validate Cloud Run ETL Worker deployment

.DESCRIPTION
Performs comprehensive validation of ETL worker deployment
#>

param(
    [string]$ServiceUrl = $env:ETL_WORKER_URL,
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region = "us-central1"
)

# Colors
function Write-Pass {
    param([string]$Message)
    Write-Host "✓ PASS: $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "✗ FAIL: $Message" -ForegroundColor Red
}

function Write-Info-Custom {
    param([string]$Message)
    Write-Host "ℹ INFO: $Message" -ForegroundColor Cyan
}

$ErrorCount = 0
$PassCount = 0

Write-Host "================================" -ForegroundColor Yellow
Write-Host "ETL Worker Deployment Validation" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

# 1. Check environment variables
Write-Info-Custom "Checking environment variables..."

if ($ServiceUrl) {
    Write-Pass "ETL_WORKER_URL is set: $ServiceUrl"
    $PassCount++
} else {
    Write-Fail "ETL_WORKER_URL not set"
    $ErrorCount++
}

if ($ProjectId) {
    Write-Pass "GCP_PROJECT_ID is set: $ProjectId"
    $PassCount++
} else {
    Write-Fail "GCP_PROJECT_ID not set"
    $ErrorCount++
}

Write-Host ""

# 2. Health check
Write-Info-Custom "Testing health endpoint..."

try {
    $healthUrl = "$ServiceUrl/health"
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    
    if ($response.status -eq "healthy") {
        Write-Pass "Health check passed"
        Write-Host "  Status: $($response.status)" -ForegroundColor Gray
        Write-Host "  Timestamp: $($response.timestamp)" -ForegroundColor Gray
        $PassCount++
    } else {
        Write-Fail "Health check returned unexpected status: $($response.status)"
        $ErrorCount++
    }
} catch {
    Write-Fail "Health check failed: $_"
    $ErrorCount++
}

Write-Host ""

# 3. Test process endpoint
Write-Info-Custom "Testing process endpoint..."

try {
    $processUrl = "$ServiceUrl/process"
    $testData = @{
        event_id = "test-validation-$(Get-Random)"
        data = @(
            @{
                type = "CCTV"
                timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
                cameraId = "test-cam-001"
                location = @{
                    lat = 28.6139
                    lon = 77.2090
                }
                peopleCount = 100
                densityValue = 0.5
            }
        )
    } | ConvertTo-Json -Depth 10

    $response = Invoke-RestMethod -Uri $processUrl -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 30
    
    if ($response.success -eq $true) {
        Write-Pass "Process endpoint working"
        Write-Host "  Processed: $($response.processed) features" -ForegroundColor Gray
        $PassCount++
    } else {
        Write-Fail "Process endpoint returned success=false"
        $ErrorCount++
    }
} catch {
    Write-Fail "Process endpoint test failed: $_"
    $ErrorCount++
}

Write-Host ""

# 4. Check Cloud Run service (if gcloud available)
if (Get-Command gcloud -ErrorAction SilentlyContinue) {
    Write-Info-Custom "Checking Cloud Run service status..."
    
    try {
        $serviceInfo = gcloud run services describe etl-worker --region $Region --format json 2>&1 | ConvertFrom-Json
        
        if ($serviceInfo) {
            Write-Pass "Cloud Run service found"
            
            $status = $serviceInfo.status
            if ($status.conditions) {
                $readyCondition = $status.conditions | Where-Object { $_.type -eq "Ready" }
                if ($readyCondition.status -eq "True") {
                    Write-Pass "Service is ready"
                    $PassCount++
                } else {
                    Write-Fail "Service not ready"
                    $ErrorCount++
                }
            }
            
            # Check instances
            if ($serviceInfo.spec.template.metadata.annotations) {
                $minInstances = $serviceInfo.spec.template.metadata.annotations.'autoscaling.knative.dev/minScale'
                $maxInstances = $serviceInfo.spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
                Write-Host "  Min instances: $minInstances" -ForegroundColor Gray
                Write-Host "  Max instances: $maxInstances" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Fail "Failed to check Cloud Run service: $_"
        $ErrorCount++
    }
    
    Write-Host ""
    
    # 5. Check Pub/Sub subscription
    Write-Info-Custom "Checking Pub/Sub subscription..."
    
    try {
        $subInfo = gcloud pubsub subscriptions describe etl-worker-sub --format json 2>&1 | ConvertFrom-Json
        
        if ($subInfo) {
            Write-Pass "Pub/Sub subscription exists"
            $PassCount++
            
            if ($subInfo.pushConfig.pushEndpoint) {
                $pushEndpoint = $subInfo.pushConfig.pushEndpoint
                if ($pushEndpoint -match "etl-worker.*\/process") {
                    Write-Pass "Push endpoint configured correctly"
                    Write-Host "  Endpoint: $pushEndpoint" -ForegroundColor Gray
                    $PassCount++
                } else {
                    Write-Fail "Push endpoint incorrect: $pushEndpoint"
                    $ErrorCount++
                }
            }
        }
    } catch {
        Write-Fail "Pub/Sub subscription not found"
        $ErrorCount++
    }
} else {
    Write-Info-Custom "gcloud CLI not found, skipping Cloud Run checks"
}

Write-Host ""

# 6. Check backend integration
Write-Info-Custom "Checking backend integration files..."

$backendService = "server\services\cloudrun-etl.service.ts"
if (Test-Path $backendService) {
    Write-Pass "Backend ETL service exists"
    $PassCount++
    
    $content = Get-Content $backendService -Raw
    if ($content -match "sendCCTVData|sendDroneData|sendUserGPSData") {
        Write-Pass "ETL service has required methods"
        $PassCount++
    } else {
        Write-Fail "ETL service missing required methods"
        $ErrorCount++
    }
} else {
    Write-Fail "Backend ETL service not found"
    $ErrorCount++
}

Write-Host ""

# 7. Check .env configuration
Write-Info-Custom "Checking .env configuration..."

$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    if ($envContent -match "ETL_WORKER_URL=") {
        Write-Pass ".env has ETL_WORKER_URL"
        $PassCount++
    } else {
        Write-Fail ".env missing ETL_WORKER_URL"
        $ErrorCount++
    }
    
    if ($envContent -match "GCP_PROJECT_ID=") {
        Write-Pass ".env has GCP_PROJECT_ID"
        $PassCount++
    } else {
        Write-Fail ".env missing GCP_PROJECT_ID"
        $ErrorCount++
    }
} else {
    Write-Fail ".env file not found"
    $ErrorCount++
}

Write-Host ""
Write-Host "================================" -ForegroundColor Yellow
Write-Host "Validation Summary" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Passed: " -NoNewline -ForegroundColor Green
Write-Host $PassCount

Write-Host "Failed: " -NoNewline -ForegroundColor Red
Write-Host $ErrorCount

Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "✓ All validations passed! ETL Worker is ready." -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ $ErrorCount validation(s) failed. Please review errors above." -ForegroundColor Red
    exit 1
}
