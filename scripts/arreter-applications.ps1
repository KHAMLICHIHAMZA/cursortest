# Script pour arreter toutes les applications MalocAuto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ARRET DE TOUTES LES APPLICATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ports = @(3000, 3001, 8080, 5173, 8081)
$portNames = @{
    3000 = "Backend API"
    3001 = "Frontend Web"
    8080 = "Frontend Agency"
    5173 = "Frontend Admin"
    8081 = "Mobile Agent"
}

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processIds = $connection | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processIds) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Arret de $($portNames[$port]) (PID: $pid)..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 1
                }
            } catch {
                Write-Host "Erreur lors de l'arret du processus $pid" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "Attente de 3 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Verification des ports..." -ForegroundColor Cyan
Write-Host ""

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "ATTENTION Port $port - $($portNames[$port]) : TOUJOURS ACTIF" -ForegroundColor Yellow
    } else {
        Write-Host "OK Port $port - $($portNames[$port]) : LIBERE" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ARRET TERMINE" -ForegroundColor Green
Write-Host ""
