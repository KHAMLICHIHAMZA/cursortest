# Script PowerShell pour démarrer toutes les applications nécessaires
# Usage: .\scripts\demarrer-toutes-applications.ps1

Write-Host "🚀 Démarrage de toutes les applications - MalocAuto" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $PSScriptRoot

# Terminal 1 : Backend
Write-Host "📡 Terminal 1 : Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\backend'; Write-Host '🚀 Backend API - Port 3000' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2

# Terminal 2 : Frontend Web
Write-Host "🌐 Terminal 2 : Frontend Web..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\frontend-web'; Write-Host '🚀 Frontend Web - Port 3001' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 2

# Terminal 3 : Mobile Agent
Write-Host "📱 Terminal 3 : Mobile Agent..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath\mobile-agent'; Write-Host '🚀 Mobile Agent - Expo' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ Applications démarrées dans 3 terminaux séparés" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs:" -ForegroundColor Cyan
Write-Host "   Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "   Swagger: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host "   Frontend Web: http://localhost:3001" -ForegroundColor White
Write-Host "   Frontend Admin: http://localhost:3001/admin" -ForegroundColor White
Write-Host "   Mobile Agent: Expo DevTools (voir terminal 3)" -ForegroundColor White
Write-Host ""
Write-Host 'Attente du demarrage complet (15 secondes)...' -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "✅ Toutes les applications sont prêtes !" -ForegroundColor Green
Write-Host ""
Write-Host "📖 Maintenant, lancez les pilotes:" -ForegroundColor Cyan
Write-Host "   .\scripts\lancer-pilotes.ps1" -ForegroundColor White
Write-Host ""

