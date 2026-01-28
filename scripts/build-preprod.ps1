# Script de Build Préprod - MalocAuto
# Build toutes les applications pour la préprod

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUILD PREPROD - MalocAuto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$buildErrors = @()

# Fonction pour build une application
function Build-App {
    param(
        [string]$AppName,
        [string]$AppPath,
        [string]$BuildCommand = "npm run build"
    )
    
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "Building: $AppName" -ForegroundColor Yellow
    Write-Host "Path: $AppPath" -ForegroundColor Gray
    Write-Host "Command: $BuildCommand" -ForegroundColor Gray
    Write-Host ""
    
    if (-not (Test-Path $AppPath)) {
        Write-Host "  ERROR: Path not found: $AppPath" -ForegroundColor Red
        $script:buildErrors += "${AppName}: Path not found"
        return $false
    }
    
    Push-Location $AppPath
    
    try {
        # Vérifier que node_modules existe
        if (-not (Test-Path "node_modules")) {
            Write-Host "  Installing dependencies..." -ForegroundColor Yellow
            npm install | Out-Host
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
        }
        
        # Exécuter le build
        Write-Host "  Running build..." -ForegroundColor Yellow
        Invoke-Expression $BuildCommand | Out-Host
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
        
        Write-Host "  SUCCESS: $AppName built successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ERROR: Build failed for $AppName" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $script:buildErrors += "${AppName}: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# 1. Backend
Write-Host "1. Backend API" -ForegroundColor Cyan
$backendSuccess = Build-App -AppName "Backend API" -AppPath "backend" -BuildCommand "npm run build"
Write-Host ""

# 2. Frontend Web
Write-Host "2. Frontend Web (Company Admin)" -ForegroundColor Cyan
$frontendWebSuccess = Build-App -AppName "Frontend Web" -AppPath "frontend-web" -BuildCommand "npm run build"
Write-Host ""

# 3. Frontend Agency
Write-Host "3. Frontend Agency" -ForegroundColor Cyan
$frontendAgencySuccess = Build-App -AppName "Frontend Agency" -AppPath "frontend-agency" -BuildCommand "npm run build"
Write-Host ""

# 4. Frontend Admin
Write-Host "4. Frontend Admin" -ForegroundColor Cyan
$frontendAdminSuccess = Build-App -AppName "Frontend Admin" -AppPath "frontend-admin" -BuildCommand "npm run build"
Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME BUILD PREPROD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
if ($backendSuccess) { $successCount++; Write-Host "  Backend API:        OK" -ForegroundColor Green }
else { Write-Host "  Backend API:        FAIL" -ForegroundColor Red }

if ($frontendWebSuccess) { $successCount++; Write-Host "  Frontend Web:       OK" -ForegroundColor Green }
else { Write-Host "  Frontend Web:       FAIL" -ForegroundColor Red }

if ($frontendAgencySuccess) { $successCount++; Write-Host "  Frontend Agency:    OK" -ForegroundColor Green }
else { Write-Host "  Frontend Agency:    FAIL" -ForegroundColor Red }

if ($frontendAdminSuccess) { $successCount++; Write-Host "  Frontend Admin:     OK" -ForegroundColor Green }
else { Write-Host "  Frontend Admin:     FAIL" -ForegroundColor Red }

Write-Host ""
Write-Host "Total: $successCount/4 applications built successfully" -ForegroundColor $(if ($successCount -eq 4) { "Green" } else { "Yellow" })

if ($buildErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "Errors:" -ForegroundColor Red
    foreach ($error in $buildErrors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "All builds completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify .env files are configured for preprod" -ForegroundColor Gray
Write-Host "  2. Verify JWT_SECRET is set in production .env" -ForegroundColor Gray
Write-Host "  3. Test the builds in preprod environment" -ForegroundColor Gray



