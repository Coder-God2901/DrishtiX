# Setup ML Service - Replaces Vertex AI with Local Docker
# PowerShell version for Windows

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ML Service Setup - Replacing Vertex AI with Local Docker" -ForegroundColor Cyan
Write-Host "  Cost Savings: `$100/month → `$10/month (90% reduction)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create models directory
Write-Host "📁 Creating models directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "ml-service\models" | Out-Null
Write-Host "✓ Models directory created" -ForegroundColor Green

# Step 2: Check Docker
Write-Host ""
Write-Host "🐳 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Step 3: Build ML service
Write-Host ""
Write-Host "🔨 Building ML service Docker image..." -ForegroundColor Yellow
Set-Location ml-service
docker build -t ml-service:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✓ ML service image built successfully" -ForegroundColor Green

# Step 4: Start services
Write-Host ""
Write-Host "🚀 Starting ML service..." -ForegroundColor Yellow
docker-compose up -d ml-service
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start ML service" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ML service started" -ForegroundColor Green

# Step 5: Wait for service to be ready
Write-Host ""
Write-Host "⏳ Waiting for ML service to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ ML service is healthy" -ForegroundColor Green
            $healthy = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $attempt++
    }
}

if (-not $healthy) {
    Write-Host ""
    Write-Host "❌ ML service health check timeout" -ForegroundColor Red
    docker logs ml-service
    exit 1
}

# Step 6: Display status
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ ML Service Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Yellow
docker ps | Select-String "ml-service"
Write-Host ""
Write-Host "Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health"
    $health | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Failed to get health status" -ForegroundColor Red
}
Write-Host ""
Write-Host "API Endpoints:" -ForegroundColor Yellow
Write-Host "  - http://localhost:8000/api/forecast"
Write-Host "  - http://localhost:8000/api/detect-anomaly"
Write-Host "  - http://localhost:8000/api/predict-risk"
Write-Host "  - http://localhost:8000/health"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Train models: docker exec ml-service python train_models.py"
Write-Host "  2. Set ML_SERVICE_ENDPOINT=http://ml-service:8000 in backend"
Write-Host "  3. Remove VERTEX_AI_* environment variables"
Write-Host ""
Write-Host "Documentation: ML_SERVICE_README.md" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
