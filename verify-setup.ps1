# ============================================
# DrishtiX - Quick Verification Script
# ============================================
# Verifies all critical configurations are in place

$ProjectRoot = "c:\Users\akjai\Desktop\open-source\DrishtiX"
$ProjectId = "drishtix-479606"

function Write-Success { Write-Host "✓ " -ForegroundColor Green -NoNewline; Write-Host $args }
function Write-Fail { Write-Host "✗ " -ForegroundColor Red -NoNewline; Write-Host $args }
function Write-Info { Write-Host "→ " -ForegroundColor Cyan -NoNewline; Write-Host $args }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DrishtiX Configuration Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# Check 1: Service Account Key Files
Write-Info "Checking service account key files..."
if (Test-Path "$ProjectRoot\config\gcp-service-account-key.json") {
    Write-Success "Root config key exists"
} else {
    Write-Fail "Root config key MISSING"
    $allGood = $false
}

if (Test-Path "$ProjectRoot\server\config\gcp-service-account-key.json") {
    Write-Success "Server config key exists"
} else {
    Write-Fail "Server config key MISSING"
    $allGood = $false
}

# Check 2: Validate Key
Write-Info "`nValidating service account key..."
try {
    $key = Get-Content "$ProjectRoot\config\gcp-service-account-key.json" -Raw | ConvertFrom-Json
    if ($key.project_id -eq $ProjectId) {
        Write-Success "Key is for project: $ProjectId"
    } else {
        Write-Fail "Key is for wrong project: $($key.project_id)"
        $allGood = $false
    }
} catch {
    Write-Fail "Error reading key file"
    $allGood = $false
}

# Check 3: Environment Files
Write-Info "`nChecking environment files..."
if (Test-Path "$ProjectRoot\.env") {
    Write-Success ".env exists"
    $envContent = Get-Content "$ProjectRoot\.env" -Raw
    if ($envContent -match "drishtix-479606") {
        Write-Success ".env has correct project ID"
    } else {
        Write-Fail ".env missing project ID"
        $allGood = $false
    }
} else {
    Write-Fail ".env MISSING"
    $allGood = $false
}

if (Test-Path "$ProjectRoot\server\.env") {
    Write-Success "server/.env exists"
} else {
    Write-Fail "server/.env MISSING"
    $allGood = $false
}

# Check 4: Node Modules
Write-Info "`nChecking dependencies..."
if (Test-Path "$ProjectRoot\node_modules") {
    Write-Success "Root node_modules installed"
} else {
    Write-Fail "Root node_modules MISSING - run: pnpm install"
    $allGood = $false
}

if (Test-Path "$ProjectRoot\server\node_modules") {
    Write-Success "Server node_modules installed"
} else {
    Write-Fail "Server node_modules MISSING - run: pnpm install"
    $allGood = $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nYou're ready to start development:" -ForegroundColor Green
    Write-Host "  cd ""$ProjectRoot""" -ForegroundColor Yellow
    Write-Host "  pnpm dev" -ForegroundColor Yellow
} else {
    Write-Host "  ✗ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nPlease fix the issues above before starting." -ForegroundColor Red
    Write-Host "See SETUP_COMPLETE.md for help." -ForegroundColor Yellow
}
Write-Host ""
