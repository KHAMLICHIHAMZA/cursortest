# Script d'exécution des 4 pilotes - MalocAuto
# Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Write-Host "🚀 EXÉCUTION DES 4 PILOTES - MalocAuto" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportsDir = "RAPPORTS_PILOTES_$timestamp"
New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null

Write-Host "📁 Dossier rapports créé: $reportsDir" -ForegroundColor Green
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "🔍 Vérification backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/docs" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend démarré sur http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend non accessible sur http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Assurez-vous que le backend est démarré: cd backend && npm run dev" -ForegroundColor Yellow
}
Write-Host ""

# PILOTE 1 - Backend API
Write-Host "🧪 PILOTE 1 - Backend API" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Exécution des tests backend..." -ForegroundColor Yellow
Set-Location backend
npm test 2>&1 | Tee-Object -FilePath "../$reportsDir/PILOTE_1_BACKEND_TESTS.txt"
Set-Location ..

Write-Host ""
Write-Host "✅ Tests backend terminés" -ForegroundColor Green
Write-Host ""

# PILOTE 2 - Frontend Agency
Write-Host "🧪 PILOTE 2 - Frontend Agency" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "⚠️  Tests manuels requis - Consultez GUIDE_PILOTE_2_FRONTEND_AGENCY.md" -ForegroundColor Yellow
Write-Host ""

# PILOTE 3 - Frontend Admin
Write-Host "🧪 PILOTE 3 - Frontend Admin" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host "⚠️  Tests manuels requis - Consultez GUIDE_PILOTE_3_FRONTEND_ADMIN.md" -ForegroundColor Yellow
Write-Host ""

# PILOTE 4 - Mobile Agent
Write-Host "🧪 PILOTE 4 - Mobile Agent" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "⚠️  Tests manuels requis - Consultez GUIDE_PILOTE_4_MOBILE_AGENT.md" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 Résumé" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan
Write-Host "✅ PILOTE 1 - Tests automatisés exécutés" -ForegroundColor Green
Write-Host "⏳ PILOTE 2 - Tests manuels requis" -ForegroundColor Yellow
Write-Host "⏳ PILOTE 3 - Tests manuels requis" -ForegroundColor Yellow
Write-Host "⏳ PILOTE 4 - Tests manuels requis" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 Rapports disponibles dans: $reportsDir" -ForegroundColor Green
Write-Host ""







