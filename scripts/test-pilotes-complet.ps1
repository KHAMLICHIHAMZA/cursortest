# Script complet pour tester tous les pilotes
# Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS COMPLETS DES 4 PILOTES - MalocAuto" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportsDir = "RAPPORTS_PILOTES_$timestamp"
New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null

Write-Host "Dossier rapports: $reportsDir" -ForegroundColor Green
Write-Host ""

# Fonction pour tester une URL
function Test-Url {
    param(
        [string]$Url,
        [string]$Name
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "OK $Name -> $Url" -ForegroundColor Green
            return $true
        } else {
            Write-Host "ERREUR $Name -> Status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "ERREUR $Name -> Non accessible" -ForegroundColor Red
        return $false
    }
}

# PILOTE 1 - Backend API
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 1 - Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend est accessible
$backendOk = Test-Url -Url "http://localhost:3000/api/docs" -Name "Backend API Docs"
$apiOk = Test-Url -Url "http://localhost:3000/api/v1/auth/login" -Name "Backend API Auth"

if ($backendOk -or $apiOk) {
    Write-Host ""
    Write-Host "Execution des tests backend..." -ForegroundColor Yellow
    Set-Location backend
    
    # Tests unitaires
    Write-Host "Tests unitaires..." -ForegroundColor Yellow
    npm test 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_1_TESTS_UNITAIRES.txt"
    
    # Tests d'intégration API (si backend accessible)
    Write-Host ""
    Write-Host "Tests d'integration API..." -ForegroundColor Yellow
    try {
        npx ts-node scripts/test-pilote1-api.ts 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_1_TESTS_INTEGRATION.txt"
    } catch {
        Write-Host "ERREUR: Impossible d'executer les tests d'integration" -ForegroundColor Red
        Write-Host "Assurez-vous que le backend est demarre: cd backend && npm run dev" -ForegroundColor Yellow
    }
    
    Set-Location ..
} else {
    Write-Host ""
    Write-Host "ATTENTION: Backend non accessible" -ForegroundColor Yellow
    Write-Host "Demarrez le backend: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# PILOTE 2 - Frontend Agency
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 2 - Frontend Agency" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendWebOk = Test-Url -Url "http://localhost:3001" -Name "Frontend Web"

if ($frontendWebOk) {
    Write-Host ""
    Write-Host "Tests frontend web..." -ForegroundColor Yellow
    Set-Location frontend-web
    
    # Tests unitaires frontend
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            Write-Host "Execution des tests frontend..." -ForegroundColor Yellow
            npm run test:run 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_2_TESTS_FRONTEND.txt"
        } else {
            Write-Host "Pas de script de test configure" -ForegroundColor Yellow
        }
    }
    
    Set-Location ..
} else {
    Write-Host "ATTENTION: Frontend Web non accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tests manuels requis - Consultez GUIDE_PILOTE_2_FRONTEND_AGENCY.md" -ForegroundColor Yellow
Write-Host ""

# PILOTE 3 - Frontend Admin
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 3 - Frontend Admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendAdminOk = Test-Url -Url "http://localhost:5173" -Name "Frontend Admin"

if ($frontendAdminOk) {
    Write-Host "Frontend Admin accessible" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Frontend Admin non accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tests manuels requis - Consultez GUIDE_PILOTE_3_FRONTEND_ADMIN.md" -ForegroundColor Yellow
Write-Host ""

# PILOTE 4 - Mobile Agent
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 4 - Mobile Agent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$mobileAgentOk = Test-Url -Url "http://localhost:8081" -Name "Mobile Agent"

if ($mobileAgentOk) {
    Write-Host "Mobile Agent accessible" -ForegroundColor Green
    Write-Host "Scanner le QR code avec Expo Go" -ForegroundColor Gray
} else {
    Write-Host "ATTENTION: Mobile Agent non accessible" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tests manuels requis - Consultez GUIDE_PILOTE_4_MOBILE_AGENT.md" -ForegroundColor Yellow
Write-Host ""

# Résumé
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PILOTE 1 - Backend API:" -ForegroundColor Cyan
if ($backendOk -or $apiOk) {
    Write-Host "  OK Tests unitaires executes" -ForegroundColor Green
    Write-Host "  OK Tests d'integration executes" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Backend non accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "PILOTE 2 - Frontend Agency:" -ForegroundColor Cyan
if ($frontendWebOk) {
    Write-Host "  OK Application accessible" -ForegroundColor Green
    Write-Host "  Tests manuels requis" -ForegroundColor Yellow
} else {
    Write-Host "  ERREUR Application non accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "PILOTE 3 - Frontend Admin:" -ForegroundColor Cyan
if ($frontendAdminOk) {
    Write-Host "  OK Application accessible" -ForegroundColor Green
    Write-Host "  Tests manuels requis" -ForegroundColor Yellow
} else {
    Write-Host "  ERREUR Application non accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "PILOTE 4 - Mobile Agent:" -ForegroundColor Cyan
if ($mobileAgentOk) {
    Write-Host "  OK Application accessible" -ForegroundColor Green
    Write-Host "  Tests manuels requis" -ForegroundColor Yellow
} else {
    Write-Host "  ERREUR Application non accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "Rapports disponibles dans: $reportsDir" -ForegroundColor Green
Write-Host ""







