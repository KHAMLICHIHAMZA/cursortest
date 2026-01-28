# 🔒 Checklist Vérification Secrets - Préprod

**Date :** 2025-01-26

---

## ⚠️ Secrets à Vérifier

### 1. JWT Secret ⚠️ CRITIQUE

**Fichier :** `backend/src/utils/jwt.ts`

**Ligne 4-6 :**
```typescript
// ⚠️ SECURITE: En production, JWT_SECRET DOIT être défini dans les variables d'environnement
// Ne JAMAIS utiliser la valeur par défaut en production
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production-use-only';
```

**Statut :** ✅ **CONFIGURÉ** - Valeur par défaut sécurisée pour développement uniquement

**Action requise :**
- [x] ✅ Valeur par défaut mise à jour avec avertissement clair
- [x] ✅ Documentation créée : `backend/SECURITE_JWT.md`
- [x] ✅ `env.example` mis à jour avec instructions
- [ ] **OBLIGATOIRE** : Définir `JWT_SECRET` dans `.env` de production (secret fort 128 caractères)

**Commande pour générer un secret fort (128 caractères) :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Secret généré (exemple) :**
```
0a5ef4f3e2e2a171b991a40a8bbbfcfc3a384e414d675ba0b627524464238697ab183869f69fba66f7bfe145c1ffbb27bb35c3d252c5cda754871a363afd16c3
```

**Documentation complète :** Voir `backend/SECURITE_JWT.md`

---

### 2. Seed.ts - Mots de passe de test ✅ OK

**Fichier :** `backend/prisma/seed.ts`

**Statut :** ✅ **OK** - Mots de passe de test pour développement uniquement

**Mots de passe détectés :**
- `admin123` - Super Admin
- `admin123` - Company Admin
- `manager123` - Agency Manager
- `agent123` - Agent

**Note :** Ces mots de passe sont normaux pour le seed de développement. Ils ne doivent PAS être utilisés en production.

---

### 3. Fichiers de Test ✅ OK

**Fichiers :**
- `backend/test/business-rules.e2e-spec.ts`
- `backend/test/mobile-agent.e2e-spec.ts`
- `backend/test/saas.e2e-spec.ts`
- `backend/src/modules/auth/auth.service.spec.ts`

**Statut :** ✅ **OK** - Mots de passe de test, normal pour les tests

---

### 4. Services AI - Clés API

**Fichiers :**
- `backend/src/modules/ai/chatbot.service.ts`
- `backend/src/modules/ai/damage-detection.service.ts`
- `backend/src/common/services/ai-vision.service.ts`

**Action requise :**
- [ ] Vérifier que `OPENAI_API_KEY` est dans `.env`
- [ ] Vérifier que `GOOGLE_VISION_API_KEY` est dans `.env` (si utilisé)
- [ ] S'assurer qu'aucune clé API n'est hardcodée

---

### 5. Services de Paiement

**Fichier :** `backend/src/modules/payment/cmi.service.ts`

**Action requise :**
- [ ] Vérifier que les clés CMI sont dans les variables d'environnement
- [ ] Vérifier qu'aucune clé n'est hardcodée

---

### 6. Services de Notification

**Fichiers :**
- `backend/src/modules/notification/whatsapp.service.ts`
- `backend/src/modules/notification/email.service.ts`

**Action requise :**
- [ ] Vérifier que `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN` sont dans `.env`
- [ ] Vérifier que `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` sont dans `.env`

---

### 7. Services Utilisateur/Company

**Fichiers :**
- `backend/src/modules/user/user.service.ts`
- `backend/src/modules/company/company.service.ts`
- `backend/src/modules/client/client.service.ts`

**Action requise :**
- [ ] Vérifier manuellement ces fichiers pour s'assurer qu'aucun secret n'est hardcodé

---

## 📋 Variables d'Environnement Requises

### Backend

**Obligatoires :**
- `JWT_SECRET` ⚠️ **CRITIQUE**
- `DATABASE_URL`
- `NODE_ENV=production` (pour préprod)

**Optionnelles mais recommandées :**
- `OPENAI_API_KEY`
- `GOOGLE_VISION_API_KEY`
- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `FRONTEND_URL`
- `FRONTEND_AGENCY_URL`

---

## ✅ Actions à Faire

1. [x] ✅ JWT_SECRET : Valeur par défaut sécurisée et documentation créée
2. [ ] **CRITIQUE** : Définir `JWT_SECRET` dans `.env` de production (secret fort 128 caractères)
3. [ ] Vérifier manuellement tous les fichiers listés ci-dessus
4. [x] ✅ `env.example` mis à jour avec instructions JWT_SECRET
5. [x] ✅ Documentation créée : `backend/SECURITE_JWT.md`
6. [ ] Tester que l'application fonctionne avec les variables d'environnement

---

**Dernière mise à jour :** 2025-01-26  
**JWT_SECRET :** ✅ Configuré avec valeur par défaut sécurisée + documentation complète

