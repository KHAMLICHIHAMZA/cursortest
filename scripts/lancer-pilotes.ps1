# Script PowerShell pour lancer les 4 pilotes de test
# Usage: .\scripts\lancer-pilotes.ps1

Write-Host "🚀 Lancement des 4 Pilotes - MalocAuto" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "📡 Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/auth/me" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Backend accessible sur http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend non accessible. Démarrage du backend..." -ForegroundColor Red
    Write-Host "   Commande: cd backend; npm run dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Dans un nouveau terminal, exécutez:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    $startBackend = Read-Host "Voulez-vous démarrer le backend maintenant ? (O/N)"
    if ($startBackend -eq "O" -or $startBackend -eq "o") {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
        Write-Host 'Attente du demarrage du backend (10 secondes)...' -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

Write-Host ""
Write-Host "📋 INSTRUCTIONS POUR LES 4 PILOTES" -ForegroundColor Cyan
Write-Host ""

# PILOTE 1 - Backend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "👤 PILOTE 1 - Backend API" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Guide: GUIDE_PILOTE_1_BACKEND.md" -ForegroundColor Yellow
Write-Host "⏱️  Durée estimée: 4-6 heures" -ForegroundColor Yellow
Write-Host "🔧 Outils nécessaires:" -ForegroundColor Yellow
Write-Host "   - Postman ou Insomnia" -ForegroundColor White
Write-Host "   - Swagger UI: http://localhost:3000/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comptes de test:" -ForegroundColor Yellow
Write-Host "   SUPER_ADMIN: admin@malocauto.com / admin123" -ForegroundColor White
Write-Host "   COMPANY_ADMIN: admin@autolocation.fr / admin123" -ForegroundColor White
Write-Host "   AGENCY_MANAGER: manager1@autolocation.fr / manager123" -ForegroundColor White
Write-Host "   AGENT: agent1@autolocation.fr / agent123" -ForegroundColor White
Write-Host ""
Write-Host 'Focus: Endpoints API, validations backend, regles metier (R1.3, R2.2, R3, R4, R5, R6)' -ForegroundColor Cyan
Write-Host ""

# PILOTE 2 - Frontend Agency
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "👤 PILOTE 2 - Frontend Web (Agency)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Guide: GUIDE_PILOTE_2_FRONTEND_AGENCY.md" -ForegroundColor Yellow
Write-Host "⏱️  Durée estimée: 4-6 heures" -ForegroundColor Yellow
Write-Host "🔧 Outils nécessaires:" -ForegroundColor Yellow
Write-Host "   - Navigateur Chrome ou Firefox" -ForegroundColor White
Write-Host "   - DevTools (F12)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comptes de test:" -ForegroundColor Yellow
Write-Host "   AGENCY_MANAGER: manager1@autolocation.fr / manager123" -ForegroundColor White
Write-Host "   AGENT: agent1@autolocation.fr / agent123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Vérifier que le frontend est démarré:" -ForegroundColor Yellow
Write-Host "   cd frontend-web" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Focus: Interface agence, formulaires, validations frontend, override frais" -ForegroundColor Cyan
Write-Host ""

# PILOTE 3 - Frontend Admin
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "👤 PILOTE 3 - Frontend Admin (Super Admin)" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Guide: GUIDE_PILOTE_3_FRONTEND_ADMIN.md" -ForegroundColor Yellow
Write-Host "⏱️  Durée estimée: 3-4 heures" -ForegroundColor Yellow
Write-Host "🔧 Outils nécessaires:" -ForegroundColor Yellow
Write-Host "   - Navigateur Chrome ou Firefox" -ForegroundColor White
Write-Host ""
Write-Host "📝 Compte de test:" -ForegroundColor Yellow
Write-Host "   SUPER_ADMIN: admin@malocauto.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URL: http://localhost:3001/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 Focus: Gestion entreprises/agences/utilisateurs, santé companies, analytics" -ForegroundColor Cyan
Write-Host ""

# PILOTE 4 - Mobile Agent
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "👤 PILOTE 4 - Mobile Agent" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Guide: GUIDE_PILOTE_4_MOBILE_AGENT.md" -ForegroundColor Yellow
Write-Host "⏱️  Durée estimée: 4-6 heures" -ForegroundColor Yellow
Write-Host "🔧 Outils nécessaires:" -ForegroundColor Yellow
Write-Host "   - iOS Simulator (Mac) ou Android Emulator" -ForegroundColor White
Write-Host "   - Expo Go app (pour téléphone physique)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Comptes de test:" -ForegroundColor Yellow
Write-Host "   AGENT: agent1@autolocation.fr / agent123" -ForegroundColor White
Write-Host "   AGENCY_MANAGER: manager1@autolocation.fr / manager123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Vérifier que l'app mobile est démarrée:" -ForegroundColor Yellow
Write-Host "   cd mobile-agent" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Focus: Check-in/check-out, persistance, mode offline, pré-remplissage" -ForegroundColor Cyan
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 PLAN DE TEST COMPLET" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📄 Fichier: PLAN_TEST_COMPLET.md" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 Chaque pilote doit:" -ForegroundColor Yellow
Write-Host "   1. Lire son guide dédié (GUIDE_PILOTE_X_*.md)" -ForegroundColor White
Write-Host "   2. Suivre la checklist phase par phase" -ForegroundColor White
Write-Host "   3. Remplir le rapport de test" -ForegroundColor White
Write-Host "   4. Reporter les bugs trouvés" -ForegroundColor White
Write-Host ""

Write-Host "📝 Format du rapport:" -ForegroundColor Yellow
Write-Host "   - Tests réussis / échoués" -ForegroundColor White
Write-Host "   - Bugs trouvés (avec sévérité)" -ForegroundColor White
Write-Host "   - Suggestions d'amélioration" -ForegroundColor White
Write-Host ""

Write-Host "✅ Prêt pour les tests !" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Les 4 pilotes peuvent commencer maintenant !" -ForegroundColor Cyan
Write-Host ""

