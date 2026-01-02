#!/usr/bin/env pwsh
# Quick Setup Script for DrishtiX Frontend-Backend Integration
# This script helps set up the frontend to connect with the backend

Write-Host "`n🚀 DrishtiX Frontend-Backend Integration Setup`n" -ForegroundColor Cyan

# Check if in correct directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the drishti-frontend directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Step 1: Checking dependencies..." -ForegroundColor Yellow

# Check if socket.io-client is installed
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasSocketIO = $packageJson.dependencies."socket.io-client"

if (!$hasSocketIO) {
    Write-Host "📦 Installing socket.io-client..." -ForegroundColor Green
    npm install socket.io-client
} else {
    Write-Host "✅ socket.io-client already installed" -ForegroundColor Green
}

Write-Host "`n📋 Step 2: Setting up environment..." -ForegroundColor Yellow

# Check if .env.local exists
if (!(Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local file..." -ForegroundColor Green
    
    $envContent = @"
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000

# Application Settings
VITE_APP_NAME=DrishtiX
VITE_ENABLE_MOCK_MODE=false
VITE_DEBUG_MODE=false
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ .env.local created successfully" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

Write-Host "`n📋 Step 3: Verifying backend connection..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 3 -ErrorAction Stop
    $health = $response.Content | ConvertFrom-Json
    Write-Host "✅ Backend is running and healthy!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Database: $($health.database)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Warning: Backend not running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Please start the backend server:" -ForegroundColor Gray
    Write-Host "   cd ../server && npm run dev" -ForegroundColor Gray
}

Write-Host "`n📋 Step 4: Configuration Summary" -ForegroundColor Yellow
Write-Host "   API URL: http://localhost:3000/api" -ForegroundColor Gray
Write-Host "   WebSocket: ws://localhost:3000" -ForegroundColor Gray
Write-Host "   Mock Mode: Disabled" -ForegroundColor Gray

Write-Host "`n✅ Setup Complete!`n" -ForegroundColor Green

Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Ensure backend is running: cd ../server && npm run dev" -ForegroundColor White
Write-Host "   2. Start frontend: npm run dev" -ForegroundColor White
Write-Host "   3. Open http://localhost:5173" -ForegroundColor White
Write-Host "`n📚 Documentation: See BACKEND_INTEGRATION_COMPLETE.md for details`n" -ForegroundColor Cyan

# Ask if user wants to start dev server
$start = Read-Host "Would you like to start the development server now? (y/n)"
if ($start -eq "y" -or $start -eq "Y") {
    Write-Host "`n🚀 Starting development server...`n" -ForegroundColor Green
    npm run dev
}
