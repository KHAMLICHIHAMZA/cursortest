# 🚀 LANCEZ LES PILOTES - Instructions Complètes

**Date :** 2025-01-26  
**Statut :** ✅ PRÊT POUR LANCEMENT

---

## 🎯 Objectif

Lancer les 4 pilotes pour tester exhaustivement toutes les applications et use cases.

---

## 📋 Préparation

### 1. Démarrer Toutes les Applications

**Option A : Script Automatique (Recommandé)**
```powershell
.\scripts\demarrer-toutes-applications.ps1
```

**Option B : Manuel (3 Terminaux)**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Vérifier : http://localhost:3000/api/docs (Swagger)

**Terminal 2 - Frontend Web:**
```bash
cd frontend-web
npm run dev
```
✅ Vérifier : http://localhost:3001

**Terminal 3 - Mobile Agent:**
```bash
cd mobile-agent
npm start
```
✅ Scanner QR code avec Expo Go (iOS/Android)

---

## 👥 Répartition des Pilotes

### PILOTE 1 - Backend API
**Profil :** Développeur Backend / QA Backend  
**Guide :** `GUIDE_PILOTE_1_BACKEND.md`  
**Durée :** 4-6 heures

**Démarrer :**
```powershell
# Lire le guide
Get-Content GUIDE_PILOTE_1_BACKEND.md

# Ou ouvrir dans l'éditeur
code GUIDE_PILOTE_1_BACKEND.md
```

**Outils :**
- Postman ou Insomnia
- Swagger UI : http://localhost:3000/api/docs

**Comptes :**
- SUPER_ADMIN: admin@malocauto.com / admin123
- COMPANY_ADMIN: admin@autolocation.fr / admin123
- AGENCY_MANAGER: manager1@autolocation.fr / manager123
- AGENT: agent1@autolocation.fr / agent123

---

### PILOTE 2 - Frontend Web (Agency)
**Profil :** Développeur Frontend / QA Frontend  
**Guide :** `GUIDE_PILOTE_2_FRONTEND_AGENCY.md`  
**Durée :** 4-6 heures

**Démarrer :**
```powershell
Get-Content GUIDE_PILOTE_2_FRONTEND_AGENCY.md
```

**URL :** http://localhost:3001

**Comptes :**
- AGENCY_MANAGER: manager1@autolocation.fr / manager123
- AGENT: agent1@autolocation.fr / agent123

**Outils :**
- Navigateur Chrome/Firefox
- DevTools (F12)

---

### PILOTE 3 - Frontend Admin (Super Admin)
**Profil :** Administrateur Système / QA Admin  
**Guide :** `GUIDE_PILOTE_3_FRONTEND_ADMIN.md`  
**Durée :** 3-4 heures

**Démarrer :**
```powershell
Get-Content GUIDE_PILOTE_3_FRONTEND_ADMIN.md
```

**URL :** http://localhost:3001/admin

**Compte :**
- SUPER_ADMIN: admin@malocauto.com / admin123

---

### PILOTE 4 - Mobile Agent
**Profil :** Agent Terrain / QA Mobile  
**Guide :** `GUIDE_PILOTE_4_MOBILE_AGENT.md`  
**Durée :** 4-6 heures

**Démarrer :**
```powershell
Get-Content GUIDE_PILOTE_4_MOBILE_AGENT.md
```

**Plateforme :** iOS/Android/Émulateur

**Comptes :**
- AGENT: agent1@autolocation.fr / agent123
- AGENCY_MANAGER: manager1@autolocation.fr / manager123

---

## 🚀 Lancement Rapide

### Script Principal
```powershell
.\scripts\lancer-pilotes.ps1
```

Ce script :
- ✅ Vérifie que le backend est accessible
- ✅ Affiche les instructions pour chaque pilote
- ✅ Donne les comptes de test
- ✅ Indique les URLs et outils nécessaires

---

## 📝 Rapports de Test

Chaque pilote doit créer un rapport avec :

```markdown
# Rapport de Test - [Application]
**Date :** [DATE]
**Pilote :** [NOM]
**Durée :** [X heures]

## Résumé
- Tests réussis : X/Y
- Tests échoués : X/Y
- Bugs trouvés : X

## Détails par Phase
[Phase 1] : X/Y réussis
[Phase 2] : X/Y réussis
...

## Bugs
1. [Description] - [Sévérité] - [Endpoint/Page/Écran]
2. ...

## Suggestions
1. [Suggestion]
2. ...
```

**Format de fichier :** `RAPPORT_PILOTE_X_[NOM].md`

---

## ✅ Checklist Avant de Commencer

### Backend
- [ ] Backend démarré sur http://localhost:3000
- [ ] Swagger accessible : http://localhost:3000/api/docs
- [ ] Base de données accessible

### Frontend Web
- [ ] Frontend démarré sur http://localhost:3001
- [ ] Application accessible dans le navigateur

### Mobile Agent
- [ ] Expo démarré
- [ ] Application accessible (simulateur ou téléphone)

### Documentation
- [ ] Guide pilote lu
- [ ] Plan de test consulté
- [ ] Comptes de test notés

---

## 🎯 Ordre de Priorité

1. **PILOTE 1 - Backend** (Critique)
   - Valide toutes les règles métier
   - Vérifie tous les endpoints
   - Détecte les bugs backend

2. **PILOTE 2 - Frontend Agency** (Important)
   - Valide l'interface utilisateur
   - Vérifie les formulaires
   - Détecte les bugs frontend

3. **PILOTE 3 - Frontend Admin** (Important)
   - Valide la gouvernance
   - Vérifie les configurations
   - Détecte les bugs admin

4. **PILOTE 4 - Mobile Agent** (Important)
   - Valide l'application mobile
   - Vérifie le mode offline
   - Détecte les bugs mobile

---

## 📊 Consolidation des Rapports

Une fois tous les pilotes terminés :

1. **Consolider** les 4 rapports dans un document unique
2. **Prioriser** les bugs par sévérité
3. **Créer des tickets** pour chaque bug
4. **Planifier** les corrections

---

## 🐛 Gestion des Bugs

### Sévérité
- **Critique** : Bloque l'utilisation
- **Majeur** : Fonctionnalité importante non fonctionnelle
- **Mineur** : Problème cosmétique

### Format
Pour chaque bug :
- Titre court
- Sévérité
- Localisation
- Étapes de reproduction
- Comportement attendu vs obtenu
- Screenshots/Logs

---

## ✅ Critères de Succès

### Backend
- ✅ Tous les endpoints fonctionnent
- ✅ Toutes les validations fonctionnent
- ✅ Toutes les règles métier respectées
- ✅ Performance < 2s par requête

### Frontend Web
- ✅ Toutes les pages accessibles
- ✅ Tous les formulaires fonctionnent
- ✅ Validations frontend correctes
- ✅ Performance < 3s chargement

### Mobile Agent
- ✅ Check-in/check-out complets
- ✅ Persistance fonctionnelle
- ✅ Mode offline robuste
- ✅ UX fluide

---

## 🚀 COMMANDES RAPIDES

### Démarrer toutes les applications
```powershell
.\scripts\demarrer-toutes-applications.ps1
```

### Lancer les pilotes
```powershell
.\scripts\lancer-pilotes.ps1
```

### Voir le plan de test complet
```powershell
Get-Content PLAN_TEST_COMPLET.md
```

### Voir l'organisation des pilotes
```powershell
Get-Content ORGANISATION_PILOTES.md
```

---

## 📞 Support

Si un pilote rencontre un problème :
1. Vérifier que les applications sont démarrées
2. Vérifier les logs dans les terminaux
3. Consulter la documentation correspondante
4. Reporter le problème dans le rapport

---

**🎉 TOUT EST PRÊT ! LES 4 PILOTES PEUVENT COMMENCER ! 🚀**

---

**Date :** 2025-01-26  
**Version :** 2.0.0 Enterprise


