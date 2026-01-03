# Script PowerShell pour lancer tous les tests
# Usage: .\scripts\lancer-tous-les-tests.ps1

Write-Host "🧪 Lancement de tous les tests - MalocAuto" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "📡 Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/me" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Backend accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend non accessible. Veuillez démarrer le backend d'abord." -ForegroundColor Red
    Write-Host "   Commande: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Guides disponibles pour les pilotes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. PILOTE 1 - Backend API" -ForegroundColor White
Write-Host "   Guide: GUIDE_PILOTE_1_BACKEND.md" -ForegroundColor Gray
Write-Host "   Durée: 4-6 heures" -ForegroundColor Gray
Write-Host ""
Write-Host "2. PILOTE 2 - Frontend Web (Agency)" -ForegroundColor White
Write-Host "   Guide: GUIDE_PILOTE_2_FRONTEND_AGENCY.md" -ForegroundColor Gray
Write-Host "   Durée: 4-6 heures" -ForegroundColor Gray
Write-Host ""
Write-Host "3. PILOTE 3 - Frontend Admin (Super Admin)" -ForegroundColor White
Write-Host "   Guide: GUIDE_PILOTE_3_FRONTEND_ADMIN.md" -ForegroundColor Gray
Write-Host "   Durée: 3-4 heures" -ForegroundColor Gray
Write-Host ""
Write-Host "4. PILOTE 4 - Mobile Agent" -ForegroundColor White
Write-Host "   Guide: GUIDE_PILOTE_4_MOBILE_AGENT.md" -ForegroundColor Gray
Write-Host "   Durée: 4-6 heures" -ForegroundColor Gray
Write-Host ""

Write-Host "📊 Plan de test complet:" -ForegroundColor Cyan
Write-Host "   Fichier: PLAN_TEST_COMPLET.md" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Prêt pour les tests !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Chaque pilote doit:" -ForegroundColor Yellow
Write-Host "   1. Lire son guide dédié" -ForegroundColor Gray
Write-Host "   2. Suivre la checklist" -ForegroundColor Gray
Write-Host "   3. Remplir le rapport de test" -ForegroundColor Gray
Write-Host ""


