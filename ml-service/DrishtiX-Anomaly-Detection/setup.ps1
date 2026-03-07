# DrishtiX Setup Script for PowerShell
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "DrishtiX Setup Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create virtual environment
Write-Host "[1/5] Creating virtual environment..." -ForegroundColor Yellow
python -m venv .venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Virtual environment created successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Activate virtual environment
Write-Host "[2/5] Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
Write-Host "✓ Virtual environment activated!" -ForegroundColor Green
Write-Host ""

# Step 3: Upgrade pip
Write-Host "[3/5] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host "✓ pip upgraded!" -ForegroundColor Green
Write-Host ""

# Step 4: Install dependencies
Write-Host "[4/5] Installing dependencies from requirements.txt..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
pip install --no-cache-dir -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ WARNING: Some packages may have failed to install" -ForegroundColor Yellow
    Write-Host "You can continue or press Ctrl+C to abort" -ForegroundColor Yellow
    Read-Host "Press Enter to continue"
}
Write-Host "✓ Dependencies installed!" -ForegroundColor Green
Write-Host ""

# Step 5: Install CLIP
Write-Host "[5/5] Installing OpenAI CLIP..." -ForegroundColor Yellow
pip install ftfy regex tqdm
pip install git+https://github.com/openai/CLIP.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ WARNING: CLIP installation failed." -ForegroundColor Yellow
    Write-Host "Make sure Git is installed on your system." -ForegroundColor Yellow
    Write-Host "You can install it manually later with:" -ForegroundColor Gray
    Write-Host "  pip install git+https://github.com/openai/CLIP.git" -ForegroundColor Gray
} else {
    Write-Host "✓ CLIP installed successfully!" -ForegroundColor Green
}
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure Redis is running" -ForegroundColor White
Write-Host "2. Run vision API: python .\vision_api\app.py" -ForegroundColor White
Write-Host "3. Or run stream engine: python .\stream_engine\main.py" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
