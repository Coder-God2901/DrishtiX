#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Adds proprietary license headers to all source code files.
.DESCRIPTION
    This script adds copyright and proprietary license notices to all TypeScript, 
    TypeScript React, JavaScript, and Python files in the DrishtiX project.
.NOTES
    Copyright © 2025 DrishtiX. All Rights Reserved.
#>

param(
    [string]$ProjectRoot = (Get-Location).Path,
    [switch]$DryRun = $false
)

# License header templates
$licenseHeaderTS = @"
/**
 * Copyright © 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */

"@

$licenseHeaderPython = @"
# Copyright © 2025 DrishtiX. All Rights Reserved.
#
# PROPRIETARY AND CONFIDENTIAL
#
# This software is the proprietary information of DrishtiX.
# Unauthorized copying, distribution, modification, or use of this software,
# via any medium, is strictly prohibited without the express written permission
# of DrishtiX.
#
# This software is provided "as is" without warranty of any kind, express or implied.
#
# For licensing inquiries: licensing@drishtix.com
# License: See LICENSE file in the project root

"@

# Directories to process
$directories = @(
    "server",
    "src",
    "ml-service",
    "workers",
    "functions",
    "scripts"
)

# File patterns to process
$filePatterns = @(
    "*.ts",
    "*.tsx",
    "*.js",
    "*.jsx",
    "*.py"
)

# Files to exclude (config, generated, third-party)
$excludePatterns = @(
    "node_modules",
    ".next",
    "dist",
    "build",
    "coverage",
    "*.config.ts",
    "*.config.js",
    "vite.config.*",
    "vitest.config.*",
    "tailwind.config.*",
    "postcss.config.*",
    "eslint.config.*"
)

function Test-ShouldExclude {
    param([string]$FilePath)
    
    foreach ($pattern in $excludePatterns) {
        if ($FilePath -like "*$pattern*") {
            return $true
        }
    }
    return $false
}

function Test-HasLicenseHeader {
    param([string]$FilePath)
    
    $content = Get-Content -Path $FilePath -Raw -ErrorAction SilentlyContinue
    return $content -match "Copyright.*DrishtiX.*All Rights Reserved"
}

function Add-LicenseHeader {
    param(
        [string]$FilePath,
        [string]$Header
    )
    
    # Read current content
    $content = Get-Content -Path $FilePath -Raw
    
    # Add header
    $newContent = $Header + $content
    
    if (-not $DryRun) {
        # Write back to file with UTF-8 encoding (no BOM)
        [System.IO.File]::WriteAllText($FilePath, $newContent, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "[OK] Added header to: $FilePath" -ForegroundColor Green
    } else {
        Write-Host "[DRY RUN] Would add header to: $FilePath" -ForegroundColor Yellow
    }
}

# Statistics
$stats = @{
    Total = 0
    Added = 0
    Skipped = 0
    Excluded = 0
}

Write-Host "`nDrishtiX License Header Addition Tool" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No files will be modified`n" -ForegroundColor Yellow
}

foreach ($dir in $directories) {
    $dirPath = Join-Path $ProjectRoot $dir
    
    if (-not (Test-Path $dirPath)) {
        Write-Host "Skipping non-existent directory: $dir" -ForegroundColor Gray
        continue
    }
    
    Write-Host "`nProcessing directory: $dir" -ForegroundColor Cyan
    
    foreach ($pattern in $filePatterns) {
        $files = Get-ChildItem -Path $dirPath -Filter $pattern -Recurse -File
        
        foreach ($file in $files) {
            $stats.Total++
            
            # Check if file should be excluded
            if (Test-ShouldExclude -FilePath $file.FullName) {
                $stats.Excluded++
                continue
            }
            
            # Check if file already has license header
            if (Test-HasLicenseHeader -FilePath $file.FullName) {
                Write-Host "Already has header: $($file.FullName)" -ForegroundColor Gray
                $stats.Skipped++
                continue
            }
            
            # Determine header type based on file extension
            $header = switch ($file.Extension) {
                { $_ -in ".ts", ".tsx", ".js", ".jsx" } { $licenseHeaderTS }
                ".py" { $licenseHeaderPython }
                default { $licenseHeaderTS }
            }
            
            # Add license header
            Add-LicenseHeader -FilePath $file.FullName -Header $header
            $stats.Added++
        }
    }
}

# Print statistics
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files processed: $($stats.Total)" -ForegroundColor White
Write-Host "Headers added: $($stats.Added)" -ForegroundColor Green
Write-Host "Already had headers: $($stats.Skipped)" -ForegroundColor Yellow
Write-Host "Excluded (node_modules, config, etc.): $($stats.Excluded)" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "To apply changes, run without -DryRun flag" -ForegroundColor Cyan
} else {
    Write-Host "License headers added successfully!" -ForegroundColor Green
}
