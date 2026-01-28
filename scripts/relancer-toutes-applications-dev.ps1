# Script pour relancer toutes les applications en mode dev avec les bons ports
# Ports: Backend 3000, Frontend Web 3001, Frontend Agency 8080, Frontend Admin 5173, Mobile Agent 8081

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RELANCE DE TOUTES LES APPLICATIONS EN DEV" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Arreter les processus existants
Write-Host "Arret des processus existants..." -ForegroundColor Yellow

$ports = @(3000, 3001, 8080, 5173, 8081)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processIds = $connection | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($processId in $processIds) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  Processus $processId sur port $port arrete" -ForegroundColor Gray
            } catch {
                # Ignorer les erreurs
            }
        }
    }
}

Start-Sleep -Seconds 2
Write-Host ""

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
    
    $workingDir = $fullPath.Path
    $scriptBlock = [scriptblock]::Create("cd '$workingDir'; $Command")
    
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock.ToString() -PassThru -WindowStyle Normal
    
    if ($process) {
        Write-Host "   OK: $Name demarre (PID: $($process.Id))" -ForegroundColor Green
        Write-Host "   URL: $Url" -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        return $true
    } else {
        Write-Host "   ERREUR: Echec du demarrage de $Name" -ForegroundColor Red
        return $false
    }
}

# Demarrer Backend API sur port 3000
Write-Host "1. BACKEND API - Port 3000" -ForegroundColor Cyan
$backendStarted = Start-App -Name "Backend API" -Path "backend" -Command "npm run dev" -Port 3000 -Url "http://localhost:3000"

# Demarrer Frontend Web (Next.js) sur port 3001
Write-Host ""
Write-Host "2. FRONTEND WEB (Next.js) - Port 3001" -ForegroundColor Cyan
$frontendWebStarted = Start-App -Name "Frontend Web" -Path "frontend-web" -Command "npm run dev -- -p 3001" -Port 3001 -Url "http://localhost:3001"

# Demarrer Frontend Agency sur port 8080
Write-Host ""
Write-Host "3. FRONTEND AGENCY - Port 8080" -ForegroundColor Cyan
$frontendAgencyStarted = Start-App -Name "Frontend Agency" -Path "frontend-agency" -Command "npm run dev" -Port 8080 -Url "http://localhost:8080"

# Demarrer Frontend Admin sur port 5173
Write-Host ""
Write-Host "4. FRONTEND ADMIN - Port 5173" -ForegroundColor Cyan
$frontendAdminStarted = Start-App -Name "Frontend Admin" -Path "frontend-admin" -Command "npm run dev" -Port 5173 -Url "http://localhost:5173"

# Demarrer Mobile Agent sur port 8081
Write-Host ""
Write-Host "5. MOBILE AGENT (Expo) - Port 8081" -ForegroundColor Cyan
$mobileAgentStarted = Start-App -Name "Mobile Agent" -Path "mobile-agent" -Command "npm start" -Port 8081 -Url "http://localhost:8081"

# Resume
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($backendStarted) {
    Write-Host "OK Backend API       : Port 3000 -> http://localhost:3000" -ForegroundColor Green
    Write-Host "   API Docs         : http://localhost:3000/api/docs" -ForegroundColor Gray
} else {
    Write-Host "ERREUR Backend API       : Echec" -ForegroundColor Red
}

if ($frontendWebStarted) {
    Write-Host "OK Frontend Web      : Port 3001 -> http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Web      : Echec" -ForegroundColor Red
}

if ($frontendAgencyStarted) {
    Write-Host "OK Frontend Agency   : Port 8080 -> http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Agency   : Echec" -ForegroundColor Red
}

if ($frontendAdminStarted) {
    Write-Host "OK Frontend Admin    : Port 5173 -> http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "ERREUR Frontend Admin    : Echec" -ForegroundColor Red
}

if ($mobileAgentStarted) {
    Write-Host "OK Mobile Agent      : Port 8081 -> http://localhost:8081" -ForegroundColor Green
    Write-Host "   Scanner le QR code avec Expo Go" -ForegroundColor Gray
} else {
    Write-Host "ERREUR Mobile Agent      : Echec" -ForegroundColor Red
}

Write-Host ""
Write-Host "Attente de 15 secondes pour que les applications demarrent..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Verifier les ports
Write-Host ""
Write-Host "Verification des ports..." -ForegroundColor Cyan
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
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RELANCE TERMINEE" -ForegroundColor Green
Write-Host ""
Write-Host "Toutes les applications sont demarrees dans des fenetres PowerShell separees." -ForegroundColor Yellow
Write-Host ""





