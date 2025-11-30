<#
.SYNOPSIS
    Setup Python Virtual Environment for ML Training Scripts
    
.DESCRIPTION
    Creates a Python virtual environment in the scripts directory and installs
    all required ML dependencies for training anomaly detection models.
    
.EXAMPLE
    .\scripts\setup-python-env.ps1
#>

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "DrishtiX - Python ML Environment Setup" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvPath = Join-Path $ScriptDir "venv"
$RequirementsPath = Join-Path $ScriptDir "requirements.txt"

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $PythonVersion = python --version 2>&1
    Write-Host "✓ Found: $PythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host "  Please install Python 3.9+ from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

# Check Python version (need 3.9+)
$VersionMatch = $PythonVersion -match "Python (\d+)\.(\d+)"
if ($VersionMatch) {
    $Major = [int]$Matches[1]
    $Minor = [int]$Matches[2]
    
    if ($Major -lt 3 -or ($Major -eq 3 -and $Minor -lt 9)) {
        Write-Host "✗ Python 3.9+ required, found $Major.$Minor" -ForegroundColor Red
        exit 1
    }
}

# Create virtual environment
if (Test-Path $VenvPath) {
    Write-Host ""
    Write-Host "Virtual environment already exists at: $VenvPath" -ForegroundColor Yellow
    $Response = Read-Host "Do you want to recreate it? (y/N)"
    
    if ($Response -eq 'y' -or $Response -eq 'Y') {
        Write-Host "Removing existing virtual environment..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $VenvPath
    } else {
        Write-Host "Using existing virtual environment." -ForegroundColor Green
        $SkipCreate = $true
    }
}

if (-not $SkipCreate) {
    Write-Host ""
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv $VenvPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
$ActivateScript = Join-Path $VenvPath "Scripts\Activate.ps1"

if (-not (Test-Path $ActivateScript)) {
    Write-Host "✗ Activation script not found" -ForegroundColor Red
    exit 1
}

& $ActivateScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Virtual environment activated" -ForegroundColor Green

# Upgrade pip
Write-Host ""
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host "✓ pip upgraded" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing ML dependencies from requirements.txt..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

if (Test-Path $RequirementsPath) {
    pip install -r $RequirementsPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ All dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ requirements.txt not found at: $RequirementsPath" -ForegroundColor Red
    exit 1
}

# Verify key packages
Write-Host ""
Write-Host "Verifying installed packages..." -ForegroundColor Yellow

$KeyPackages = @(
    "tensorflow",
    "scikit-learn",
    "google-cloud-bigquery",
    "google-cloud-storage",
    "opencv-python",
    "pandas",
    "numpy"
)

$AllInstalled = $true
foreach ($Package in $KeyPackages) {
    $Installed = pip show $Package 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $Package" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $Package - NOT INSTALLED" -ForegroundColor Red
        $AllInstalled = $false
    }
}

Write-Host ""
if ($AllInstalled) {
    Write-Host ("=" * 60) -ForegroundColor Green
    Write-Host "✅ Python ML environment setup complete!" -ForegroundColor Green
    Write-Host ("=" * 60) -ForegroundColor Green
    Write-Host ""
    Write-Host "Virtual environment location: $VenvPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To activate the environment in the future, run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\venv\Scripts\Activate.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "To run the training scripts:" -ForegroundColor Yellow
    Write-Host "  python .\scripts\train-isolation-forest.py --mode full --use-synthetic" -ForegroundColor White
    Write-Host "  python .\scripts\train-autoencoder.py --mode full --use-synthetic" -ForegroundColor White
    Write-Host "  python .\scripts\train-convlstm.py --mode full --use-synthetic" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ("=" * 60) -ForegroundColor Red
    Write-Host "⚠️  Setup completed with warnings" -ForegroundColor Yellow
    Write-Host ("=" * 60) -ForegroundColor Red
    Write-Host "Some packages failed to install. Please check the errors above." -ForegroundColor Yellow
}
