# ✅ Checklist Préprod - MalocAuto

**Date :** 2025-01-26  
**Statut :** En cours de préparation

---

## 🧹 Nettoyage Effectué

### ✅ Fichiers Temporaires
- [x] Fichiers `.log` supprimés
- [x] Fichiers `.tmp` et `.temp` supprimés
- [x] Fichiers de cache nettoyés
- [x] Dossiers de build nettoyés

### ✅ Code Backend
- [x] `console.log` de debug nettoyés (6 fichiers)
  - `backend/src/modules/payment/payment.service.ts`
  - `backend/src/main.ts`
  - `backend/src/modules/audit/audit.service.ts`
  - `backend/src/modules/notification/email.service.ts`
  - `backend/src/modules/notification/whatsapp.service.ts`
  - `backend/src/services/email.service.ts`

### ✅ Scripts de Test
- [x] Script de test backend corrigé (`backend/scripts/test-pilote1-api.ts`)

---

## ⚠️ Points d'Attention

### Fichiers .env
- [ ] **backend/.env** - Vérifier qu'il n'est pas commité dans Git
- [ ] **frontend-web/.env.local** - Vérifier qu'il n'est pas commité dans Git
- [ ] S'assurer que `.gitignore` contient bien `.env*`

### Fichiers .env.example
- [x] **backend/.env.example** - ✅ Existe
- [ ] **frontend-web/.env.example** - ⚠️ Manquant (à créer)

### .gitignore
- [ ] Ajouter `*.log` dans `.gitignore` si manquant

### Scripts de Build
- [x] **backend** - ✅ Script build présent
- [x] **frontend-web** - ✅ Script build présent
- [x] **frontend-agency** - ✅ Script build présent
- [x] **frontend-admin** - ✅ Script build présent
- [ ] **mobile-agent** - ⚠️ Pas de script build (normal pour Expo)

---

## 🚀 Tests de Build

### Backend
```bash
cd backend
npm run build
```

### Frontend Web
```bash
cd frontend-web
npm run build
```

### Frontend Agency
```bash
cd frontend-agency
npm run build
```

### Frontend Admin
```bash
cd frontend-admin
npm run build
```

---

## 🔐 Sécurité

### Variables d'Environnement
- [ ] Vérifier que tous les secrets sont dans `.env` (pas dans le code)
- [ ] Vérifier que les tokens API ne sont pas hardcodés
- [ ] Vérifier les clés JWT
- [ ] Vérifier les credentials de base de données

### CORS
- [ ] Vérifier la configuration CORS pour la production
- [ ] Limiter les origines autorisées (pas `origin: true`)

### Rate Limiting
- [ ] Vérifier que le rate limiting est activé
- [ ] Configurer les limites appropriées

---

## 📊 Tests

### Tests Unitaires
- [x] Backend : 84/84 tests PASS
- [x] Frontend Web : 150/150 tests PASS
- [ ] Mobile Agent : Tests à corriger (problèmes de configuration)

### Tests d'Intégration
- [ ] Backend API : Script corrigé, à exécuter
- [ ] Frontend Web : Tests unitaires OK
- [ ] Frontend Admin : Tests manuels requis
- [ ] Mobile Agent : Tests d'intégration à corriger

---

## 📝 Documentation

### Fichiers à Vérifier
- [ ] README.md à jour
- [ ] Documentation API (Swagger) complète
- [ ] Guide de déploiement
- [ ] Guide de configuration

### Fichiers de Documentation Temporaires
- [x] Rapports de tests récents conservés (< 7 jours)
- [ ] Anciens rapports supprimés (> 7 jours)

---

## 🗄️ Base de Données

### Migrations
- [ ] Toutes les migrations sont appliquées
- [ ] Pas de migrations en attente
- [ ] Backup de la base de données effectué

### Seed
- [ ] Données de test appropriées pour la préprod
- [ ] Pas de données sensibles dans le seed

---

## 🌐 Configuration Serveur

### Variables d'Environnement Production
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` configuré
- [ ] `JWT_SECRET` configuré et sécurisé
- [ ] `FRONTEND_URL` configuré
- [ ] `FRONTEND_AGENCY_URL` configuré
- [ ] SMTP configuré
- [ ] Variables d'API externes configurées

### Ports
- [ ] Backend : Port configuré (3000 ou autre)
- [ ] Frontend Web : Port configuré
- [ ] Frontend Agency : Port configuré
- [ ] Frontend Admin : Port configuré

---

## 📦 Déploiement

### Builds
- [ ] Tous les builds réussissent sans erreur
- [ ] Les builds sont optimisés (pas de source maps en prod)
- [ ] Les assets sont minifiés

### Docker (si applicable)
- [ ] Dockerfile à jour
- [ ] docker-compose.yml configuré
- [ ] Images Docker testées

---

## ✅ Validation Finale

- [ ] Tous les tests passent
- [ ] Tous les builds réussissent
- [ ] Aucun secret dans le code
- [ ] Documentation à jour
- [ ] Configuration production vérifiée
- [ ] Backup effectué

---

**Dernière mise à jour :** 2025-01-26

