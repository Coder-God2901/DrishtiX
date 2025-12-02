# ============================================
# DrishtiX - Service Account Key Setup Script
# ============================================
# This script helps you download the GCP service account key
# Run this in PowerShell after reviewing the options

param(
    [Parameter(Mandatory=$false)]
    [string]$OriginalProjectPath,
    
    [Parameter(Mandatory=$false)]
    [switch]$DownloadNew,
    
    [Parameter(Mandatory=$false)]
    [switch]$Help
)

$ProjectRoot = "c:\Users\akjai\Desktop\open-source\DrishtiX"
$ConfigDir = Join-Path $ProjectRoot "config"
$ServerConfigDir = Join-Path $ProjectRoot "server\config"
$KeyFileName = "gcp-service-account-key.json"
$TargetKeyPath = Join-Path $ConfigDir $KeyFileName
$ServerKeyPath = Join-Path $ServerConfigDir $KeyFileName

# Color output functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Help message
if ($Help) {
    Write-Info "`n=== DrishtiX Service Account Key Setup ==="
    Write-Host "`nThis script helps you set up the GCP service account key file."
    Write-Host "`nOptions:"
    Write-Host "  1. Copy from original project:"
    Write-Host "     .\setup-service-account-key.ps1 -OriginalProjectPath 'C:\path\to\original\DrishtiX'"
    Write-Host "`n  2. Download new key from GCP:"
    Write-Host "     .\setup-service-account-key.ps1 -DownloadNew"
    Write-Host "`n  3. Manual setup (this script will guide you):"
    Write-Host "     .\setup-service-account-key.ps1"
    exit 0
}

Write-Info "`n=== DrishtiX Service Account Key Setup ==="
Write-Info "Project: drishtix-479606"
Write-Info "Target: $TargetKeyPath`n"

# Check if key already exists
if (Test-Path $TargetKeyPath) {
    Write-Success "✓ Service account key already exists!"
    Write-Host "  Location: $TargetKeyPath"
    
    # Also copy to server config if not there
    if (-not (Test-Path $ServerKeyPath)) {
        Write-Info "`nCopying key to server config directory..."
        Copy-Item $TargetKeyPath $ServerKeyPath -Force
        Write-Success "✓ Key copied to: $ServerKeyPath"
    }
    
    Write-Info "`nVerifying key file..."
    try {
        $keyContent = Get-Content $TargetKeyPath -Raw | ConvertFrom-Json
        if ($keyContent.project_id -eq "drishtix-479606") {
            Write-Success "✓ Key file is valid for project: drishtix-479606"
            Write-Success "`n✓ Setup complete! You're ready to start development."
            exit 0
        } else {
            Write-Warning "⚠ Key file is for project: $($keyContent.project_id)"
            Write-Warning "  Expected: drishtix-479606"
        }
    } catch {
        Write-Error-Custom "✗ Error reading key file. It may be corrupted."
    }
    exit 1
}

Write-Warning "⚠ Service account key file not found!`n"

# Option 1: Copy from original project
if ($OriginalProjectPath) {
    Write-Info "Attempting to copy from original project..."
    $OriginalKeyPath = Join-Path $OriginalProjectPath "config\$KeyFileName"
    
    if (Test-Path $OriginalKeyPath) {
        Copy-Item $OriginalKeyPath $TargetKeyPath -Force
        Copy-Item $OriginalKeyPath $ServerKeyPath -Force
        Write-Success "✓ Key copied successfully!"
        Write-Success "  From: $OriginalKeyPath"
        Write-Success "  To: $TargetKeyPath"
        Write-Success "  And: $ServerKeyPath"
        Write-Success "`n✓ Setup complete! You're ready to start development."
        exit 0
    } else {
        Write-Error-Custom "✗ Key file not found at: $OriginalKeyPath"
        Write-Info "Falling back to download option..."
        $DownloadNew = $true
    }
}

# Option 2: Download new key from GCP
if ($DownloadNew) {
    Write-Info "Downloading new service account key from GCP..."
    Write-Warning "Note: This will create a new key. Old keys will remain valid."
    
    $GCloudPath = "C:\Users\akjai\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
    
    if (-not (Test-Path $GCloudPath)) {
        Write-Error-Custom "✗ Google Cloud SDK not found at: $GCloudPath"
        Write-Info "Please install Google Cloud SDK first."
        exit 1
    }
    
    Write-Info "Creating new service account key..."
    
    try {
        & $GCloudPath iam service-accounts keys create `
            $TargetKeyPath `
            --iam-account=drishtix-sa@drishtix-479606.iam.gserviceaccount.com `
            --project=drishtix-479606
        
        if (Test-Path $TargetKeyPath) {
            Write-Success "✓ Key downloaded successfully!"
            Write-Success "  Location: $TargetKeyPath"
            
            # Copy to server config
            Copy-Item $TargetKeyPath $ServerKeyPath -Force
            Write-Success "  Copied to: $ServerKeyPath"
            
            Write-Success "`n✓ Setup complete! You're ready to start development."
            exit 0
        } else {
            Write-Error-Custom "✗ Failed to download key file."
            exit 1
        }
    } catch {
        Write-Error-Custom "✗ Error downloading key: $_"
        exit 1
    }
}

# Option 3: Interactive guidance
Write-Info "Choose an option to set up the service account key:`n"
Write-Host "1. Copy from original project location"
Write-Host "2. Download new key using gcloud CLI"
Write-Host "3. Download manually from GCP Console"
Write-Host "4. Cancel"

$choice = Read-Host "`nEnter choice (1-4)"

switch ($choice) {
    "1" {
        $originalPath = Read-Host "Enter path to original DrishtiX project"
        if ($originalPath) {
            & $PSCommandPath -OriginalProjectPath $originalPath
        }
    }
    "2" {
        Write-Info "`nDownloading key using gcloud CLI..."
        & $PSCommandPath -DownloadNew
    }
    "3" {
        Write-Info "`nManual Download Instructions:`n"
        Write-Host "1. Open browser: https://console.cloud.google.com/iam-admin/serviceaccounts?project=drishtix-479606"
        Write-Host "2. Click on: drishtix-sa@drishtix-479606.iam.gserviceaccount.com"
        Write-Host "3. Click 'KEYS' tab"
        Write-Host "4. Click 'ADD KEY' → 'Create new key'"
        Write-Host "5. Choose 'JSON' format"
        Write-Host "6. Click 'CREATE'"
        Write-Host "7. Save the downloaded file as:`n"
        Write-Info "   $TargetKeyPath"
        Write-Host "`n8. Then copy it to:`n"
        Write-Info "   $ServerKeyPath"
        Write-Host "`nPress Enter to open the GCP Console..."
        Read-Host
        Start-Process "https://console.cloud.google.com/iam-admin/serviceaccounts?project=drishtix-479606"
        
        Write-Info "`nWaiting for you to download the key..."
        Write-Host "After downloading, press Enter to verify..."
        Read-Host
        
        if (Test-Path $TargetKeyPath) {
            Copy-Item $TargetKeyPath $ServerKeyPath -Force
            Write-Success "`n✓ Key file found and copied!"
            Write-Success "✓ Setup complete!"
        } else {
            Write-Warning "`n⚠ Key file not found. Please place it at: $TargetKeyPath"
        }
    }
    "4" {
        Write-Info "Setup cancelled."
        exit 0
    }
    default {
        Write-Error-Custom "Invalid choice. Setup cancelled."
        exit 1
    }
}

# Final verification
if (Test-Path $TargetKeyPath) {
    Write-Success "`n✓ Service account key is ready!"
    Write-Info "`nNext steps:"
    Write-Host "1. Review CONFIG_STATUS_CHECKLIST.md for remaining setup"
    Write-Host "2. Run: pnpm install (if not already done)"
    Write-Host "3. Run: pnpm dev (to start development server)"
} else {
    Write-Warning "`n⚠ Service account key still missing."
    Write-Info "Run this script again or manually download the key."
}
