# Script pour demarrer toutes les applications MalocAuto

Write-Host "Demarrage de toutes les applications - MalocAuto" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Fonction pour demarrer une application
function Start-App {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$Port,
        [string]$Url
    )
    
    Write-Host "Demarrage $Name..." -ForegroundColor Yellow
    
    $parentDir = Split-Path $PSScriptRoot -Parent
    $fullPath = Join-Path $parentDir $Path
    $fullPath = Resolve-Path $fullPath -ErrorAction SilentlyContinue
    
    if (-not $fullPath) {
        Write-Host "   ERREUR: Repertoire introuvable: $Path" -ForegroundColor Red
        return $false
    }
    
    # Verifier si le port est deja utilise
    $portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($portInUse) {
        Write-Host "   ATTENTION: Port $Port deja utilise - Application peut-etre deja demarree" -ForegroundColor Yellow
        Write-Host "   OK: $Name accessible sur $Url" -ForegroundColor Green
        return $true
    }
    
    # Demarrer l'application en arriere-plan
    $workingDir = $fullPath.Path
    $scriptBlock = [scriptblock]::Create("cd '$workingDir'; $Command")
    
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock.ToString() -PassThru -WindowStyle Minimized
    
    if ($process) {
        Write-Host "   OK: $Name demarre (PID: $($process.Id))" -ForegroundColor Green
        Write-Host "   URL: $Url" -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        return $true
    } else {
        Write-Host "   ERREUR: Echec du demarrage de $Name" -ForegroundColor Red
        return $false
    }
}

# Demarrer Backend
Write-Host "1. BACKEND API" -ForegroundColor Cyan
$backendStarted = Start-App -Name "Backend API" -Path "backend" -Command "npm run dev" -Port 3000 -Url "http://localhost:3000"
Start-Sleep -Seconds 3

# Demarrer Frontend Web (Agency)
Write-Host ""
Write-Host "2. FRONTEND WEB (Agency)" -ForegroundColor Cyan
$frontendWebStarted = Start-App -Name "Frontend Web" -Path "frontend-web" -Command "npm run dev" -Port 3001 -Url "http://localhost:3001"
Start-Sleep -Seconds 3

# Demarrer Frontend Agency
Write-Host ""
Write-Host "3. FRONTEND AGENCY" -ForegroundColor Cyan
$frontendAgencyStarted = Start-App -Name "Frontend Agency" -Path "frontend-agency" -Command "npm run dev" -Port 8080 -Url "http://localhost:8080"
Start-Sleep -Seconds 3

# Demarrer Frontend Admin
Write-Host ""
Write-Host "4. FRONTEND ADMIN" -ForegroundColor Cyan
$frontendAdminStarted = Start-App -Name "Frontend Admin" -Path "frontend-admin" -Command "npm run dev" -Port 5173 -Url "http://localhost:5173"
Start-Sleep -Seconds 3

# Demarrer Mobile Agent
Write-Host ""
Write-Host "5. MOBILE AGENT" -ForegroundColor Cyan
$mobileAgentStarted = Start-App -Name "Mobile Agent" -Path "mobile-agent" -Command "npm start" -Port 8081 -Url "http://localhost:8081"
Start-Sleep -Seconds 3

# Resume
Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "RESUME DU DEMARRAGE" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

if ($backendStarted) {
    Write-Host "OK Backend API        -> http://localhost:3000" -ForegroundColor Green
    Write-Host "   API Docs          -> http://localhost:3000/api/docs" -ForegroundColor Gray
} else {
    Write-Host "ERREUR Backend API        -> Echec" -ForegroundColor Red
}

if ($frontendWebStarted) {
    Write-Host "OK Frontend Web       -> http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Web       -> Echec" -ForegroundColor Red
}

if ($frontendAgencyStarted) {
    Write-Host "OK Frontend Agency    -> http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Agency    -> Echec" -ForegroundColor Red
}

if ($frontendAdminStarted) {
    Write-Host "OK Frontend Admin     -> http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Admin     -> Echec" -ForegroundColor Red
}

if ($mobileAgentStarted) {
    Write-Host "OK Mobile Agent       -> http://localhost:8081 (Expo)" -ForegroundColor Green
    Write-Host "   Scanner le QR code avec Expo Go" -ForegroundColor Gray
} else {
    Write-Host "ERREUR Mobile Agent       -> Echec" -ForegroundColor Red
}

Write-Host ""
Write-Host "Attente de 10 secondes pour que les applications demarrent..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verifier les ports
Write-Host ""
Write-Host "VERIFICATION DES PORTS" -ForegroundColor Cyan
Write-Host ""

$ports = @(
    @{Port=3000; Name="Backend API"},
    @{Port=3001; Name="Frontend Web"},
    @{Port=8080; Name="Frontend Agency"},
    @{Port=5173; Name="Frontend Admin"},
    @{Port=8081; Name="Mobile Agent"}
)

foreach ($portInfo in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $portInfo.Port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "OK Port $($portInfo.Port) - $($portInfo.Name) : ACTIF" -ForegroundColor Green
    } else {
        Write-Host "ERREUR Port $($portInfo.Port) - $($portInfo.Name) : INACTIF" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE TERMINE" -ForegroundColor Green
Write-Host ""
Write-Host "Astuce: Les applications tournent en arriere-plan." -ForegroundColor Yellow
Write-Host "Pour les arreter, fermez les fenetres PowerShell ou utilisez:" -ForegroundColor Yellow
Write-Host "Get-Process | Where-Object {`$_.ProcessName -eq 'node'} | Stop-Process" -ForegroundColor Gray
Write-Host ""
