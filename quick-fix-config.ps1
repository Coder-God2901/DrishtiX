# ============================================
# Quick Fix Script for GCP Configuration Issues
# ============================================
# Automatically fixes configuration mismatches and creates missing resources

param(
    [Parameter(Mandatory=$false)]
    [switch]$FixEnv,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreatePubSubTopics,
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateBigQueryDataset,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableEarthEngine,
    
    [Parameter(Mandatory=$false)]
    [switch]$All
)

$ProjectRoot = "c:\Users\akjai\Desktop\open-source\DrishtiX"
$GCloudPath = "C:\Users\akjai\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$ProjectId = "drishtix-479606"

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "`n=== DrishtiX Configuration Quick Fix ==="
Write-Info "Project: $ProjectId`n"

# Fix environment variable issues
if ($FixEnv -or $All) {
    Write-Info "Fixing environment variable issues..."
    
    $envFile = Join-Path $ProjectRoot ".env"
    
    if (Test-Path $envFile) {
        # Fix 1: Storage bucket name
        Write-Info "  → Fixing storage bucket name..."
        $content = Get-Content $envFile -Raw
        $content = $content -replace 'GCS_BUCKET_NAME=drishtix-data-storage', 'GCS_BUCKET_NAME=drishtix-479606-data-storage'
        
        # Fix 2: Add Gemini API key if missing
        if ($content -notmatch 'VITE_GEMINI_API_KEY=AIzaSyBEQNQIQ0qBUZRX78u8enuLcy2HtRaVifA') {
            Write-Info "  → Adding Gemini API key..."
            $geminiKey = "`nVITE_GEMINI_API_KEY=AIzaSyBEQNQIQ0qBUZRX78u8enuLcy2HtRaVifA"
            
            # Insert after GEMINI_VISION_MODEL line
            $content = $content -replace '(GEMINI_VISION_MODEL=gemini-1\.5-flash)', "`$1$geminiKey"
        }
        
        Set-Content $envFile $content -NoNewline
        Write-Success "  ✓ Environment file updated"
    } else {
        Write-Error-Custom "  ✗ .env file not found"
    }
    
    # Generate JWT secret
    Write-Info "`n  → Generating secure JWT secret..."
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Success "  ✓ Generated JWT Secret:"
    Write-Host "    $jwtSecret" -ForegroundColor Yellow
    Write-Warning "    Please add this to server/.env as JWT_SECRET"
}

# Create missing Pub/Sub topics
if ($CreatePubSubTopics -or $All) {
    Write-Info "`nCreating missing Pub/Sub topics..."
    
    if (-not (Test-Path $GCloudPath)) {
        Write-Error-Custom "  ✗ gcloud CLI not found"
    } else {
        $missingTopics = @(
            "video-analytics",
            "social-signals",
            "gps-tracking",
            "incident-alerts",
            "crowd-predictions",
            "drone-heatmaps",
            "cctv-density-reports",
            "user-density",
            "weather-updates",
            "traffic-updates",
            "anomaly-events",
            "heatgrid-stream"
        )
        
        foreach ($topic in $missingTopics) {
            Write-Info "  → Creating topic: $topic"
            try {
                & $GCloudPath pubsub topics create $topic --project=$ProjectId 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "    ✓ Created: $topic"
                } else {
                    Write-Warning "    ⚠ May already exist: $topic"
                }
            } catch {
                Write-Warning "    ⚠ Error creating $topic : $_"
            }
        }
        
        Write-Success "`n  ✓ Pub/Sub topics creation complete"
    }
}

# Create BigQuery dataset
if ($CreateBigQueryDataset -or $All) {
    Write-Info "`nCreating BigQuery dataset..."
    
    if (-not (Test-Path $GCloudPath)) {
        Write-Error-Custom "  ✗ gcloud CLI not found"
    } else {
        Write-Info "  → Opening BigQuery Console..."
        Write-Host "    Please create dataset manually in web console:" -ForegroundColor Yellow
        Write-Host "    1. Dataset ID: drishtix_analytics"
        Write-Host "    2. Location: US (multi-region)"
        Write-Host "    3. Click CREATE DATASET"
        
        $response = Read-Host "`n    Open BigQuery Console now? (y/n)"
        if ($response -eq 'y') {
            Start-Process "https://console.cloud.google.com/bigquery?project=$ProjectId"
        }
    }
}

# Enable Earth Engine API
if ($EnableEarthEngine -or $All) {
    Write-Info "`nEnabling Earth Engine API..."
    
    if (-not (Test-Path $GCloudPath)) {
        Write-Error-Custom "  ✗ gcloud CLI not found"
    } else {
        try {
            & $GCloudPath services enable earthengine.googleapis.com --project=$ProjectId
            Write-Success "  ✓ Earth Engine API enabled"
            Write-Warning "  ⚠ You also need to register at: https://signup.earthengine.google.com/"
        } catch {
            Write-Error-Custom "  ✗ Error enabling Earth Engine API: $_"
        }
    }
}

# Summary
Write-Info "`n=== Summary ==="
if ($FixEnv -or $All) {
    Write-Success "✓ Environment variables fixed"
    Write-Warning "⚠ Remember to update JWT_SECRET in server/.env"
}
if ($CreatePubSubTopics -or $All) {
    Write-Success "✓ Pub/Sub topics created"
}
if ($CreateBigQueryDataset -or $All) {
    Write-Warning "⚠ BigQuery dataset - manual creation required"
}
if ($EnableEarthEngine -or $All) {
    Write-Success "✓ Earth Engine API enabled"
    Write-Warning "⚠ Earth Engine registration still required"
}

Write-Info "`nNext critical step:"
Write-Error-Custom "→ Download service account key (see QUICK_SETUP.md)"
Write-Host ""
