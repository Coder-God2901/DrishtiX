<#
.SYNOPSIS
    Quick launcher for Python ML training scripts
    
.DESCRIPTION
    Automatically activates the virtual environment and runs the specified training script.
    
.PARAMETER Script
    Which training script to run: isolation-forest, autoencoder, or convlstm
    
.PARAMETER Mode
    Execution mode: fetch-data, train, deploy, upload, or full
    
.PARAMETER UseSynthetic
    Use synthetic data instead of fetching from GCP
    
.PARAMETER DaysBack
    Number of days of historical data to fetch (default: 90)
    
.EXAMPLE
    .\scripts\run-training.ps1 -Script isolation-forest -Mode full -UseSynthetic
    .\scripts\run-training.ps1 -Script autoencoder -Mode train
    .\scripts\run-training.ps1 -Script convlstm -Mode fetch-data -DaysBack 60
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('isolation-forest', 'autoencoder', 'convlstm')]
    [string]$Script,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('fetch-data', 'train', 'deploy', 'upload', 'full')]
    [string]$Mode = 'full',
    
    [Parameter(Mandatory=$false)]
    [switch]$UseSynthetic,
    
    [Parameter(Mandatory=$false)]
    [int]$DaysBack = 90
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvPath = Join-Path $ScriptDir "venv"
$ActivateScript = Join-Path $VenvPath "Scripts\Activate.ps1"

# Check if venv exists
if (-not (Test-Path $ActivateScript)) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Run setup first: .\scripts\setup-python-env.ps1" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
Write-Host "Activating Python virtual environment..." -ForegroundColor Cyan
& $ActivateScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}

# Map script names to file names
$ScriptFiles = @{
    'isolation-forest' = 'train-isolation-forest.py'
    'autoencoder' = 'train-autoencoder.py'
    'convlstm' = 'train-convlstm.py'
}

$ScriptFile = $ScriptFiles[$Script]
$ScriptPath = Join-Path $ScriptDir $ScriptFile

# Build command arguments
$Args = @("--mode", $Mode, "--days-back", $DaysBack)

if ($UseSynthetic) {
    $Args += "--use-synthetic"
}

# Run the training script
Write-Host ""
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Running: $ScriptFile" -ForegroundColor Cyan
Write-Host "Mode: $Mode | Days Back: $DaysBack | Synthetic: $UseSynthetic" -ForegroundColor Gray
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

python $ScriptPath @Args

$ExitCode = $LASTEXITCODE

# Deactivate virtual environment
deactivate

exit $ExitCode
