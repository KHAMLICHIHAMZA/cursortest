# 🔒 Sécurité JWT - Configuration Production

**Date :** 2025-01-26  
**Criticité :** ⚠️ **CRITIQUE**

---

## ⚠️ IMPORTANT : Configuration JWT_SECRET

Le `JWT_SECRET` est utilisé pour signer et vérifier tous les tokens JWT de l'application.  
**Il est CRITIQUE de définir un secret fort et unique en production.**

---

## 🔐 Génération d'un Secret Fort

### Méthode 1 : Node.js (Recommandé)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Exemple de sortie :**
```
0a5ef4f3e2e2a171b991a40a8bbbfcfc3a384e414d675ba0b627524464238697ab183869f69fba66f7bfe145c1ffbb27bb35c3d252c5cda754871a363afd16c3
```

### Méthode 2 : OpenSSL

```bash
openssl rand -hex 64
```

### Méthode 3 : PowerShell

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 📝 Configuration

### 1. Générer le Secret

Exécutez une des commandes ci-dessus pour générer un secret de 128 caractères (64 bytes en hex).

### 2. Ajouter dans .env

Créez ou modifiez le fichier `.env` dans le répertoire `backend/` :

```env
JWT_SECRET=0a5ef4f3e2e2a171b991a40a8bbbfcfc3a384e414d675ba0b627524464238697ab183869f69fba66f7bfe145c1ffbb27bb35c3d252c5cda754871a363afd16c3
JWT_REFRESH_SECRET=<générer-un-autre-secret-different>
```

### 3. Vérifier la Configuration

Le code dans `backend/src/utils/jwt.ts` utilise :
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-not-for-production-use-only';
```

**En production :**
- ✅ `process.env.JWT_SECRET` sera utilisé (depuis .env)
- ❌ La valeur par défaut ne sera JAMAIS utilisée

---

## ✅ Checklist Production

- [ ] Secret généré avec au moins 64 bytes (128 caractères hex)
- [ ] Secret unique (différent pour chaque environnement)
- [ ] Secret stocké dans `.env` (NE JAMAIS commiter .env)
- [ ] `.env` ajouté à `.gitignore`
- [ ] Secret stocké dans un gestionnaire de secrets (AWS Secrets Manager, Azure Key Vault, etc.)
- [ ] Secret différent pour JWT_SECRET et JWT_REFRESH_SECRET
- [ ] Secret roté régulièrement (tous les 6-12 mois)

---

## 🚨 Sécurité

### ❌ À NE JAMAIS FAIRE

1. ❌ Commiter le fichier `.env` dans Git
2. ❌ Partager le secret par email ou chat
3. ❌ Utiliser le même secret pour tous les environnements
4. ❌ Utiliser un secret faible ou prévisible
5. ❌ Hardcoder le secret dans le code source

### ✅ Bonnes Pratiques

1. ✅ Utiliser un gestionnaire de secrets
2. ✅ Roter les secrets régulièrement
3. ✅ Utiliser des secrets différents par environnement
4. ✅ Limiter l'accès au secret (principe du moindre privilège)
5. ✅ Logger les tentatives d'accès non autorisées

---

## 🔄 Rotation du Secret

Si vous devez changer le JWT_SECRET :

1. **Générer un nouveau secret**
2. **Mettre à jour** `.env` avec le nouveau secret
3. **Redémarrer** l'application
4. **Note :** Tous les tokens existants deviendront invalides
   - Les utilisateurs devront se reconnecter
   - Les refresh tokens devront être régénérés

---

## 📋 Variables d'Environnement Requises

```env
# Production - OBLIGATOIRE
JWT_SECRET=<secret-fort-128-caracteres>
JWT_REFRESH_SECRET=<secret-fort-128-caracteres-different>

# Optionnel (valeurs par défaut)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

**Dernière mise à jour :** 2025-01-26  
**Statut :** ⚠️ **CRITIQUE - À CONFIGURER AVANT PRODUCTION**



