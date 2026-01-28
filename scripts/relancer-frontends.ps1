# Script pour relancer les applications frontend avec les bons ports
# Backend reste sur port 3000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RELANCE DES APPLICATIONS FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Arreter les processus existants sur les ports frontend
Write-Host "Arret des processus existants..." -ForegroundColor Yellow

$frontendPorts = @(3001, 8080, 5173, 8081)
foreach ($port in $frontendPorts) {
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

# Fonction pour demarrer une application frontend
function Start-Frontend {
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

# Demarrer Frontend Web (Next.js) sur port 3001
Write-Host "1. FRONTEND WEB (Next.js) - Port 3001" -ForegroundColor Cyan
$frontendWebStarted = Start-Frontend -Name "Frontend Web" -Path "frontend-web" -Command "npm run dev -- -p 3001" -Port 3001 -Url "http://localhost:3001"

# Demarrer Frontend Agency sur port 8080 (deja configure)
Write-Host ""
Write-Host "2. FRONTEND AGENCY - Port 8080" -ForegroundColor Cyan
$frontendAgencyStarted = Start-Frontend -Name "Frontend Agency" -Path "frontend-agency" -Command "npm run dev" -Port 8080 -Url "http://localhost:8080"

# Demarrer Frontend Admin sur port 5173 (deja configure par Vite)
Write-Host ""
Write-Host "3. FRONTEND ADMIN - Port 5173" -ForegroundColor Cyan
$frontendAdminStarted = Start-Frontend -Name "Frontend Admin" -Path "frontend-admin" -Command "npm run dev" -Port 5173 -Url "http://localhost:5173"

# Demarrer Mobile Agent sur port 8081
Write-Host ""
Write-Host "4. MOBILE AGENT (Expo) - Port 8081" -ForegroundColor Cyan
$mobileAgentStarted = Start-Frontend -Name "Mobile Agent" -Path "mobile-agent" -Command "npm start" -Port 8081 -Url "http://localhost:8081"

# Resume
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Backend API       : Port 3000 (non touche)" -ForegroundColor Gray
if ($frontendWebStarted) {
    Write-Host "Frontend Web      : Port 3001 -> http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "Frontend Web      : ERREUR" -ForegroundColor Red
}

if ($frontendAgencyStarted) {
    Write-Host "Frontend Agency   : Port 8080 -> http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "Frontend Agency   : ERREUR" -ForegroundColor Red
}

if ($frontendAdminStarted) {
    Write-Host "Frontend Admin    : Port 5173 -> http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "Frontend Admin    : ERREUR" -ForegroundColor Red
}

if ($mobileAgentStarted) {
    Write-Host "Mobile Agent      : Port 8081 -> http://localhost:8081" -ForegroundColor Green
    Write-Host "                    Scanner le QR code avec Expo Go" -ForegroundColor Gray
} else {
    Write-Host "Mobile Agent      : ERREUR" -ForegroundColor Red
}

Write-Host ""
Write-Host "Attente de 10 secondes pour que les applications demarrent..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verifier les ports
Write-Host ""
Write-Host "Verification des ports..." -ForegroundColor Cyan
Write-Host ""

$ports = @(
    @{Port=3000; Name="Backend API (non touche)"},
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

