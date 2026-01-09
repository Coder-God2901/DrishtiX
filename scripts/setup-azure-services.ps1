#!/usr/bin/env pwsh
# Azure ML & AI Services Setup Script for DrishtiX
# This script helps configure Azure services for production deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DrishtiX Azure ML & AI Services Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✓ Azure CLI installed: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI not found. Please install from: https://aka.ms/azure-cli" -ForegroundColor Red
    exit 1
}

# Check if logged in
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
    Write-Host "  Subscription: $($account.name) ($($account.id))" -ForegroundColor Gray
} catch {
    Write-Host "✗ Not logged in. Running 'az login'..." -ForegroundColor Yellow
    az login
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get configuration from user
$resourceGroup = Read-Host "Resource Group name (default: drishtix-rg)"
if ([string]::IsNullOrEmpty($resourceGroup)) { $resourceGroup = "drishtix-rg" }

$location = Read-Host "Azure Region (default: eastus)"
if ([string]::IsNullOrEmpty($location)) { $location = "eastus" }

$prefix = Read-Host "Resource name prefix (default: drishtix)"
if ([string]::IsNullOrEmpty($prefix)) { $prefix = "drishtix" }

Write-Host ""
Write-Host "Creating resources in:" -ForegroundColor Cyan
Write-Host "  Resource Group: $resourceGroup" -ForegroundColor Gray
Write-Host "  Location: $location" -ForegroundColor Gray
Write-Host "  Prefix: $prefix" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Resources" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Create Resource Group
Write-Host "[1/10] Creating Resource Group..." -ForegroundColor Yellow
try {
    az group create --name $resourceGroup --location $location --output none
    Write-Host "✓ Resource Group created" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create Resource Group" -ForegroundColor Red
}

# Create Azure ML Workspace
Write-Host "[2/10] Creating Azure ML Workspace..." -ForegroundColor Yellow
$mlWorkspace = "$prefix-ml"
try {
    az ml workspace create `
        --name $mlWorkspace `
        --resource-group $resourceGroup `
        --location $location `
        --output none
    Write-Host "✓ Azure ML Workspace created: $mlWorkspace" -ForegroundColor Green
} catch {
    Write-Host "! Azure ML Workspace may already exist" -ForegroundColor Yellow
}

# Create Computer Vision
Write-Host "[3/10] Creating Computer Vision service..." -ForegroundColor Yellow
$cvAccount = "$prefix-cv"
try {
    az cognitiveservices account create `
        --name $cvAccount `
        --resource-group $resourceGroup `
        --kind ComputerVision `
        --sku S1 `
        --location $location `
        --yes `
        --output none
    Write-Host "✓ Computer Vision created: $cvAccount" -ForegroundColor Green
} catch {
    Write-Host "! Computer Vision may already exist" -ForegroundColor Yellow
}

# Create Cognitive Services (Multi-service)
Write-Host "[4/10] Creating Cognitive Services..." -ForegroundColor Yellow
$cogAccount = "$prefix-cognitive"
try {
    az cognitiveservices account create `
        --name $cogAccount `
        --resource-group $resourceGroup `
        --kind CognitiveServices `
        --sku S0 `
        --location $location `
        --yes `
        --output none
    Write-Host "✓ Cognitive Services created: $cogAccount" -ForegroundColor Green
} catch {
    Write-Host "! Cognitive Services may already exist" -ForegroundColor Yellow
}

# Create Service Bus Namespace
Write-Host "[5/10] Creating Service Bus namespace..." -ForegroundColor Yellow
$sbNamespace = "$prefix-sb"
try {
    az servicebus namespace create `
        --name $sbNamespace `
        --resource-group $resourceGroup `
        --location $location `
        --sku Standard `
        --output none
    Write-Host "✓ Service Bus namespace created: $sbNamespace" -ForegroundColor Green
    
    # Create topics
    $topics = @("crowd-density-updates", "prediction-results", "anomaly-detections", "emergency-alerts")
    foreach ($topic in $topics) {
        az servicebus topic create `
            --name $topic `
            --namespace-name $sbNamespace `
            --resource-group $resourceGroup `
            --output none
    }
    Write-Host "✓ Service Bus topics created" -ForegroundColor Green
} catch {
    Write-Host "! Service Bus may already exist" -ForegroundColor Yellow
}

# Create Storage Account
Write-Host "[6/10] Creating Storage Account..." -ForegroundColor Yellow
$storageAccount = "$prefix" + "storage"
try {
    az storage account create `
        --name $storageAccount `
        --resource-group $resourceGroup `
        --location $location `
        --sku Standard_LRS `
        --output none
    Write-Host "✓ Storage Account created: $storageAccount" -ForegroundColor Green
    
    # Create containers
    $containers = @("models", "videos", "simulations")
    foreach ($container in $containers) {
        az storage container create `
            --name $container `
            --account-name $storageAccount `
            --output none
    }
    Write-Host "✓ Storage containers created" -ForegroundColor Green
} catch {
    Write-Host "! Storage Account may already exist" -ForegroundColor Yellow
}

# Create Cosmos DB
Write-Host "[7/10] Creating Cosmos DB..." -ForegroundColor Yellow
$cosmosAccount = "$prefix-cosmos"
try {
    az cosmosdb create `
        --name $cosmosAccount `
        --resource-group $resourceGroup `
        --locations regionName=$location `
        --output none
    Write-Host "✓ Cosmos DB created: $cosmosAccount" -ForegroundColor Green
    
    # Create database
    az cosmosdb sql database create `
        --account-name $cosmosAccount `
        --resource-group $resourceGroup `
        --name drishtix-db `
        --output none
    Write-Host "✓ Cosmos DB database created" -ForegroundColor Green
} catch {
    Write-Host "! Cosmos DB may already exist" -ForegroundColor Yellow
}

# Create Azure OpenAI
Write-Host "[8/10] Creating Azure OpenAI..." -ForegroundColor Yellow
$openaiAccount = "$prefix-openai"
try {
    az cognitiveservices account create `
        --name $openaiAccount `
        --resource-group $resourceGroup `
        --kind OpenAI `
        --sku S0 `
        --location eastus `
        --yes `
        --output none
    Write-Host "✓ Azure OpenAI created: $openaiAccount" -ForegroundColor Green
} catch {
    Write-Host "! Azure OpenAI may already exist or not available in region" -ForegroundColor Yellow
}

# Create Application Insights
Write-Host "[9/10] Creating Application Insights..." -ForegroundColor Yellow
$appInsights = "$prefix-appinsights"
try {
    az monitor app-insights component create `
        --app $appInsights `
        --location $location `
        --resource-group $resourceGroup `
        --output none
    Write-Host "✓ Application Insights created: $appInsights" -ForegroundColor Green
} catch {
    Write-Host "! Application Insights may already exist" -ForegroundColor Yellow
}

# Create Azure Maps
Write-Host "[10/10] Creating Azure Maps..." -ForegroundColor Yellow
$mapsAccount = "$prefix-maps"
try {
    az maps account create `
        --name $mapsAccount `
        --resource-group $resourceGroup `
        --sku S1 `
        --output none
    Write-Host "✓ Azure Maps created: $mapsAccount" -ForegroundColor Green
} catch {
    Write-Host "! Azure Maps may already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Retrieving Connection Strings" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get Computer Vision keys
try {
    $cvKeys = az cognitiveservices account keys list `
        --name $cvAccount `
        --resource-group $resourceGroup `
        --output json | ConvertFrom-Json
    $cvEndpoint = az cognitiveservices account show `
        --name $cvAccount `
        --resource-group $resourceGroup `
        --query "properties.endpoint" `
        --output tsv
} catch {}

# Get Cognitive Services keys
try {
    $cogKeys = az cognitiveservices account keys list `
        --name $cogAccount `
        --resource-group $resourceGroup `
        --output json | ConvertFrom-Json
    $cogEndpoint = az cognitiveservices account show `
        --name $cogAccount `
        --resource-group $resourceGroup `
        --query "properties.endpoint" `
        --output tsv
} catch {}

# Get Service Bus connection string
try {
    $sbConnectionString = az servicebus namespace authorization-rule keys list `
        --namespace-name $sbNamespace `
        --resource-group $resourceGroup `
        --name RootManageSharedAccessKey `
        --query "primaryConnectionString" `
        --output tsv
} catch {}

# Get Storage connection string
try {
    $storageConnectionString = az storage account show-connection-string `
        --name $storageAccount `
        --resource-group $resourceGroup `
        --query "connectionString" `
        --output tsv
} catch {}

# Get Cosmos DB connection strings
try {
    $cosmosKeys = az cosmosdb keys list `
        --name $cosmosAccount `
        --resource-group $resourceGroup `
        --output json | ConvertFrom-Json
    $cosmosEndpoint = az cosmosdb show `
        --name $cosmosAccount `
        --resource-group $resourceGroup `
        --query "documentEndpoint" `
        --output tsv
} catch {}

# Get Application Insights instrumentation key
try {
    $appInsightsKey = az monitor app-insights component show `
        --app $appInsights `
        --resource-group $resourceGroup `
        --query "instrumentationKey" `
        --output tsv
} catch {}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generating .env file" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$envContent = @"
# Azure Configuration - Generated by setup-azure-services.ps1
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Azure Core
AZURE_SUBSCRIPTION_ID=$(az account show --query "id" --output tsv)
AZURE_TENANT_ID=$(az account show --query "tenantId" --output tsv)
AZURE_RESOURCE_GROUP=$resourceGroup
AZURE_LOCATION=$location

# Azure ML
AZURE_ML_WORKSPACE_NAME=$mlWorkspace
AZURE_ML_RESOURCE_GROUP=$resourceGroup

# Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=$cvEndpoint
AZURE_COMPUTER_VISION_KEY=$($cvKeys.key1)

# Cognitive Services
AZURE_COGNITIVE_SERVICES_ENDPOINT=$cogEndpoint
AZURE_COGNITIVE_SERVICES_KEY=$($cogKeys.key1)

# Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=$sbConnectionString

# Storage
AZURE_STORAGE_ACCOUNT_NAME=$storageAccount
AZURE_STORAGE_CONNECTION_STRING=$storageConnectionString

# Cosmos DB
AZURE_COSMOS_ENDPOINT=$cosmosEndpoint
AZURE_COSMOS_KEY=$($cosmosKeys.primaryMasterKey)
AZURE_COSMOS_DATABASE_ID=drishtix-db

# Application Insights
AZURE_MONITOR_INSTRUMENTATION_KEY=$appInsightsKey

# Feature Flags
AZURE_ML_ENABLED=true
AZURE_COMPUTER_VISION_ENABLED=true
AZURE_COGNITIVE_SERVICES_ENABLED=true
"@

$envFile = ".env.azure"
$envContent | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "✓ Configuration saved to: $envFile" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the generated .env.azure file" -ForegroundColor Gray
Write-Host "2. Copy variables to your main .env file" -ForegroundColor Gray
Write-Host "3. Install required packages: pnpm install" -ForegroundColor Gray
Write-Host "4. Test the configuration: pnpm verify-setup" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: docs/AZURE_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Group: $resourceGroup" -ForegroundColor Cyan
Write-Host "Azure Portal: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query "id" --output tsv)/resourceGroups/$resourceGroup" -ForegroundColor Cyan
Write-Host ""
