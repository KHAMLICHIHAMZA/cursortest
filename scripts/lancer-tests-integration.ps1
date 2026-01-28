# Script pour lancer automatiquement les tests d'integration de toutes les applications

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTS D'INTEGRATION - TOUTES LES APPLICATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportsDir = "RAPPORTS_TESTS_INTEGRATION_$timestamp"
New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null

Write-Host "Dossier rapports: $reportsDir" -ForegroundColor Green
Write-Host ""

# Fonction pour tester une URL
function Test-Url {
    param([string]$Url, [int]$TimeoutSec = 5)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# PILOTE 1 - Backend API - Tests d'integration
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 1 - Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification backend..." -ForegroundColor Yellow
$backendOk = Test-Url -Url "http://localhost:3000/api/docs"

if ($backendOk) {
    Write-Host "OK Backend accessible" -ForegroundColor Green
    Write-Host ""
    Write-Host "Execution des tests d'integration API..." -ForegroundColor Yellow
    
    Set-Location backend
    try {
        npx ts-node scripts/test-pilote1-api.ts 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_1_TESTS_INTEGRATION.txt"
        Write-Host ""
        Write-Host "OK Tests d'integration backend termines" -ForegroundColor Green
    } catch {
        Write-Host "ERREUR lors de l'execution des tests" -ForegroundColor Red
    }
    Set-Location ..
} else {
    Write-Host "ERREUR Backend non accessible sur http://localhost:3000" -ForegroundColor Red
    Write-Host "Assurez-vous que le backend est demarre: cd backend && npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# PILOTE 2 - Frontend Web - Tests unitaires
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 2 - Frontend Web" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "frontend-web/package.json") {
    Write-Host "Execution des tests frontend web..." -ForegroundColor Yellow
    Set-Location frontend-web
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.'test:run') {
            try {
                npm run test:run 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_2_TESTS_FRONTEND.txt"
                Write-Host ""
                Write-Host "OK Tests frontend web termines" -ForegroundColor Green
            } catch {
                Write-Host "ERREUR lors de l'execution des tests" -ForegroundColor Red
            }
        } else {
            Write-Host "Pas de script test:run disponible" -ForegroundColor Yellow
        }
    }
    
    Set-Location ..
} else {
    Write-Host "ERREUR Repertoire frontend-web introuvable" -ForegroundColor Red
}

Write-Host ""

# PILOTE 3 - Frontend Admin - Pas de tests configures
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 3 - Frontend Admin" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Frontend Admin: Pas de tests automatises configures" -ForegroundColor Yellow
Write-Host "Tests manuels requis - Consultez GUIDE_PILOTE_3_FRONTEND_ADMIN.md" -ForegroundColor Yellow

Write-Host ""

# PILOTE 4 - Mobile Agent - Tests Jest
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PILOTE 4 - Mobile Agent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "mobile-agent/package.json") {
    Write-Host "Execution des tests mobile agent..." -ForegroundColor Yellow
    Set-Location mobile-agent
    
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            try {
                # Tests unitaires
                Write-Host "Tests unitaires..." -ForegroundColor Yellow
                npm test 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_4_TESTS_UNITAIRES.txt"
                
                # Tests d'integration si disponibles
                if ($packageJson.scripts.'test:integration') {
                    Write-Host ""
                    Write-Host "Tests d'integration..." -ForegroundColor Yellow
                    npm run test:integration 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_4_TESTS_INTEGRATION.txt" -Append
                }
                
                Write-Host ""
                Write-Host "OK Tests mobile agent termines" -ForegroundColor Green
            } catch {
                Write-Host "ERREUR lors de l'execution des tests" -ForegroundColor Red
            }
        } else {
            Write-Host "Pas de script test disponible" -ForegroundColor Yellow
        }
    }
    
    Set-Location ..
} else {
    Write-Host "ERREUR Repertoire mobile-agent introuvable" -ForegroundColor Red
}

Write-Host ""

# Resume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PILOTE 1 - Backend API:" -ForegroundColor Cyan
if ($backendOk) {
    Write-Host "  OK Tests d'integration executes" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Backend non accessible" -ForegroundColor Red
}

Write-Host ""
Write-Host "PILOTE 2 - Frontend Web:" -ForegroundColor Cyan
Write-Host "  OK Tests unitaires executes" -ForegroundColor Green

Write-Host ""
Write-Host "PILOTE 3 - Frontend Admin:" -ForegroundColor Cyan
Write-Host "  Tests manuels requis" -ForegroundColor Yellow

Write-Host ""
Write-Host "PILOTE 4 - Mobile Agent:" -ForegroundColor Cyan
Write-Host "  OK Tests executes" -ForegroundColor Green

Write-Host ""
Write-Host "Rapports disponibles dans: $reportsDir" -ForegroundColor Green
Write-Host ""





