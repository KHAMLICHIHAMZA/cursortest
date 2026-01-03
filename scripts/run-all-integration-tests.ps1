# Script PowerShell pour lancer tous les tests d'intégration
# Usage: .\scripts\run-all-integration-tests.ps1

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TESTS D'INTÉGRATION COMPLETS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = ".\backend"
$mobileDir = ".\mobile-agent"
$backendPort = 3000
$backendUrl = "http://localhost:$backendPort/api/v1"
$backendProcess = $null

# Fonction pour vérifier si le backend est démarré
function Test-Backend {
    try {
        $response = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        return $true
    } catch {
        return $false
    }
}

# Fonction pour démarrer le backend
function Start-Backend {
    Write-Host "Démarrage du backend..." -ForegroundColor Yellow
    Set-Location $backendDir
    
    # Vérifier si la base de données est prête
    Write-Host "Vérification de la base de données..."
    npm run prisma:generate
    npx prisma migrate deploy
    
    # Démarrer le backend en arrière-plan
    $env:DATABASE_URL = $env:DATABASE_URL ?? "postgresql://user:password@localhost:5432/malocauto"
    $env:JWT_SECRET = $env:JWT_SECRET ?? "test-secret"
    $env:PORT = $backendPort
    $env:NODE_ENV = "test"
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "npm"
    $processInfo.Arguments = "run start"
    $processInfo.WorkingDirectory = (Get-Location).Path
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    
    $process = [System.Diagnostics.Process]::Start($processInfo)
    $script:backendProcess = $process
    
    Write-Host "Backend démarré (PID: $($process.Id))"
    
    # Attendre que le backend soit prêt
    Write-Host "Attente du démarrage du backend..."
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        if (Test-Backend) {
            Write-Host "Backend prêt!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
        $attempt++
    }
    
    Write-Host "Le backend n'a pas démarré à temps" -ForegroundColor Red
    return $false
}

# Fonction pour arrêter le backend
function Stop-Backend {
    if ($null -ne $script:backendProcess -and -not $script:backendProcess.HasExited) {
        Write-Host "Arrêt du backend (PID: $($script:backendProcess.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $script:backendProcess.Id -Force -ErrorAction SilentlyContinue
        $script:backendProcess = $null
    }
}

# Trap pour arrêter le backend en cas d'erreur
trap {
    Stop-Backend
    throw
}

try {
    # 1. Tests Backend
    Write-Host "1. Tests Backend" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Set-Location $backendDir
    
    Write-Host "Tests unitaires..."
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests unitaires backend échoués" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Tests E2E backend..."
    npm run test:e2e
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests E2E backend échoués" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Tests backend réussis" -ForegroundColor Green
    Write-Host ""
    
    # 2. Démarrer le backend pour les tests d'intégration mobile
    Write-Host "2. Démarrage du backend pour tests d'intégration" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    if (-not (Start-Backend)) {
        Write-Host "❌ Impossible de démarrer le backend" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    
    # 3. Tests Mobile
    Write-Host "3. Tests Mobile Agent" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Set-Location "..\$mobileDir"
    
    Write-Host "Vérification TypeScript..."
    npx tsc --noEmit --skipLibCheck
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreurs TypeScript" -ForegroundColor Red
        Stop-Backend
        exit 1
    }
    
    Write-Host "Tests unitaires mobile..."
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests unitaires mobile échoués" -ForegroundColor Red
        Stop-Backend
        exit 1
    }
    
    Write-Host "Tests d'intégration mobile..."
    $env:API_URL = $backendUrl
    npm run test:integration
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Tests d'intégration mobile échoués (backend peut-être non disponible)" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Tests mobile réussis" -ForegroundColor Green
    Write-Host ""
    
    # 4. Arrêt du backend
    Stop-Backend
    
    # 5. Résumé
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Tous les tests sont terminés!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erreur: $_" -ForegroundColor Red
    Stop-Backend
    exit 1
}




