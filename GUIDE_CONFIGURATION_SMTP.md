# 📧 Guide : Configuration SMTP Gratuite pour les Tests

Ce guide vous explique comment configurer un serveur SMTP gratuitement pour envoyer des emails pendant la période de tests.

## 🎯 Options Gratuites Recommandées

### 1. **Mailtrap** (⭐ Recommandé pour les tests)
- ✅ **Gratuit** : 500 emails/mois
- ✅ **Parfait pour les tests** : Les emails ne sont pas envoyés réellement, ils sont capturés dans une boîte de test
- ✅ **Aucune configuration Gmail nécessaire**
- ✅ **Interface web pour voir les emails**

### 2. **Gmail** (Gratuit mais limité)
- ✅ **Gratuit** : Illimité mais avec des limites de taux
- ⚠️ **Nécessite un "App Password"** (pas votre mot de passe normal)
- ⚠️ **Limite** : 500 emails/jour pour les comptes gratuits

### 3. **Ethereal Email** (Pour les tests uniquement)
- ✅ **100% gratuit** et illimité
- ✅ **Génère des comptes de test automatiquement**
- ⚠️ **Les emails ne sont pas envoyés réellement** (uniquement pour les tests)

---

## 📋 Option 1 : Mailtrap (Recommandé)

### Étape 1 : Créer un compte Mailtrap

1. Allez sur [https://mailtrap.io/](https://mailtrap.io/)
2. Cliquez sur **"Sign Up"** (gratuit)
3. Créez un compte (email + mot de passe)

### Étape 2 : Créer une boîte de test

1. Une fois connecté, cliquez sur **"Add Inbox"** ou **"Create Inbox"**
2. Donnez un nom à votre boîte (ex: "MalocAuto Tests")
3. Cliquez sur la boîte créée

### Étape 3 : Récupérer les identifiants SMTP

Dans la boîte de test, vous verrez un onglet **"SMTP Settings"** avec deux options :

**Option A : SMTP Standard (Recommandé)**
```
Host: smtp.mailtrap.io
Port: 2525
User: [votre username]
Pass: [votre password]
```

**Option B : SMTP avec TLS**
```
Host: smtp.mailtrap.io
Port: 465
User: [votre username]
Pass: [votre password]
```

### Étape 4 : Configurer le fichier `.env`

Ouvrez `backend/.env` et ajoutez/modifiez ces lignes :

```env
# SMTP Configuration (Mailtrap)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=votre_username_mailtrap
SMTP_PASS=votre_password_mailtrap
SMTP_FROM=noreply@malocauto.com
```

**⚠️ Important** : Remplacez `votre_username_mailtrap` et `votre_password_mailtrap` par les valeurs réelles de votre boîte Mailtrap.

### Étape 5 : Redémarrer le backend

```bash
cd backend
npm run start:dev
```

### Étape 6 : Tester l'envoi d'email

1. Créez un nouvel utilisateur via l'API ou l'interface admin
2. Allez sur [https://mailtrap.io/inboxes](https://mailtrap.io/inboxes)
3. Cliquez sur votre boîte de test
4. Vous devriez voir l'email de bienvenue dans la liste !

---

## 📋 Option 2 : Gmail (Pour les tests réels)

### Étape 1 : Activer la validation en 2 étapes

1. Allez sur [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Activez la **"Validation en 2 étapes"** si ce n'est pas déjà fait

### Étape 2 : Créer un "App Password"

1. Toujours dans la section Sécurité, cherchez **"Mots de passe des applications"**
2. Cliquez sur **"Mots de passe des applications"**
3. Sélectionnez **"Autre (nom personnalisé)"** et tapez "MalocAuto Backend"
4. Cliquez sur **"Générer"**
5. **Copiez le mot de passe généré** (16 caractères, espaces inclus) - vous ne pourrez plus le voir après !

### Étape 3 : Configurer le fichier `.env`

Ouvrez `backend/.env` et ajoutez/modifiez ces lignes :

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_app_password_16_caracteres
SMTP_FROM=noreply@malocauto.com
```

**⚠️ Important** : 
- Utilisez votre **email Gmail complet** (ex: `monemail@gmail.com`)
- Utilisez le **App Password** (16 caractères), **PAS** votre mot de passe Gmail normal
- Si le mot de passe contient des espaces, incluez-les dans le `.env`

### Étape 4 : Redémarrer le backend

```bash
cd backend
npm run start:dev
```

### Étape 5 : Tester l'envoi d'email

1. Créez un nouvel utilisateur via l'API ou l'interface admin
2. Vérifiez la boîte de réception de l'email de destination
3. Vérifiez aussi les **spams** au cas où

**⚠️ Limites Gmail** :
- **500 emails/jour** pour les comptes gratuits
- Si vous dépassez, vous recevrez une erreur temporaire

---

## 📋 Option 3 : Ethereal Email (Tests uniquement)

Ethereal Email génère automatiquement des comptes de test. Les emails ne sont **pas envoyés réellement**, mais vous pouvez les voir dans l'interface Ethereal.

### Étape 1 : Installer Ethereal (optionnel)

```bash
npm install -g ethereal-email
```

### Étape 2 : Générer un compte de test

Vous pouvez utiliser ce script Node.js pour générer un compte :

```javascript
// generate-ethereal-account.js
const nodemailer = require('nodemailer');

async function generateAccount() {
  const account = await nodemailer.createTestAccount();
  console.log('Ethereal Account:');
  console.log('User:', account.user);
  console.log('Pass:', account.pass);
  console.log('SMTP:', account.smtp.host);
  console.log('Web:', account.web);
}

generateAccount();
```

Exécutez-le :
```bash
node generate-ethereal-account.js
```

### Étape 3 : Configurer le fichier `.env`

```env
# SMTP Configuration (Ethereal - Tests uniquement)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=votre_user_ethereal
SMTP_PASS=votre_pass_ethereal
SMTP_FROM=noreply@malocauto.com
```

---

## 🔧 Configuration Avancée

### Variables d'environnement complètes

Voici toutes les variables SMTP disponibles dans `backend/.env` :

```env
# SMTP Configuration
SMTP_HOST=smtp.mailtrap.io          # Serveur SMTP
SMTP_PORT=2525                       # Port SMTP (587 pour TLS, 465 pour SSL, 2525 pour Mailtrap)
SMTP_USER=votre_username            # Nom d'utilisateur SMTP
SMTP_PASS=votre_password            # Mot de passe SMTP
SMTP_FROM=noreply@malocauto.com     # Adresse email expéditeur
```

### Ports SMTP courants

- **587** : TLS (recommandé pour Gmail)
- **465** : SSL (ancien, mais toujours utilisé)
- **2525** : Mailtrap standard
- **25** : Non sécurisé (non recommandé)

---

## 🧪 Tester la Configuration

### Test 1 : Créer un utilisateur

1. Connectez-vous à l'interface admin : http://localhost:5173
2. Allez dans **"Utilisateurs"** → **"Nouvel utilisateur"**
3. Remplissez le formulaire avec un email valide
4. Cliquez sur **"Créer"**
5. L'utilisateur devrait recevoir un email de bienvenue

### Test 2 : Réinitialiser un mot de passe

1. Dans l'interface admin, cliquez sur l'icône **"Clé"** à côté d'un utilisateur
2. Un email de réinitialisation devrait être envoyé

### Test 3 : Vérifier les logs

Regardez les logs du backend dans le terminal. Vous devriez voir :
- ✅ `Email sent successfully` si tout fonctionne
- ❌ `Email send error: ...` s'il y a un problème

---

## 🐛 Dépannage

### Erreur : "535 5.7.8 Bad Credentials"

**Cause** : Identifiants SMTP incorrects

**Solution** :
1. Vérifiez que `SMTP_USER` et `SMTP_PASS` sont corrects dans `.env`
2. Pour Gmail, assurez-vous d'utiliser un **App Password**, pas votre mot de passe normal
3. Pour Mailtrap, copiez-collez exactement les identifiants de la boîte de test

### Erreur : "Connection timeout"

**Cause** : Serveur SMTP inaccessible ou port incorrect

**Solution** :
1. Vérifiez que `SMTP_HOST` et `SMTP_PORT` sont corrects
2. Vérifiez votre connexion internet
3. Essayez un autre port (587 au lieu de 465, ou vice versa)

### Erreur : "550 5.7.1 Relay access denied"

**Cause** : Le serveur SMTP refuse de relayer les emails

**Solution** :
1. Pour Gmail, assurez-vous d'utiliser un **App Password**
2. Pour Mailtrap, vérifiez que vous utilisez les bons identifiants de la boîte de test

### Les emails arrivent dans les spams

**Cause** : Configuration SPF/DKIM manquante (normal pour les tests)

**Solution** :
- Pour les tests, c'est normal. Vérifiez votre dossier spam.
- Pour la production, configurez SPF/DKIM avec votre domaine.

---

## 📊 Comparaison des Options

| Option | Gratuit | Limite | Facile | Tests | Production |
|--------|---------|--------|--------|-------|------------|
| **Mailtrap** | ✅ Oui | 500/mois | ⭐⭐⭐⭐⭐ | ✅ Parfait | ❌ Non |
| **Gmail** | ✅ Oui | 500/jour | ⭐⭐⭐ | ⚠️ Limité | ⚠️ Limité |
| **Ethereal** | ✅ Oui | Illimité | ⭐⭐⭐⭐ | ✅ Parfait | ❌ Non |

**Recommandation** :
- **Tests** : Utilisez **Mailtrap** (le plus simple et le plus fiable)
- **Production** : Utilisez un service payant comme **SendGrid**, **Mailgun**, ou **AWS SES**

---

## 🚀 Pour la Production

Quand vous passerez en production, considérez ces services :

1. **SendGrid** : 100 emails/jour gratuit, puis payant
2. **Mailgun** : 5000 emails/mois gratuit pendant 3 mois
3. **AWS SES** : Très économique, $0.10 pour 1000 emails
4. **Postmark** : Excellent pour les emails transactionnels

---

## ✅ Checklist de Configuration

- [ ] Compte créé (Mailtrap/Gmail/Ethereal)
- [ ] Identifiants SMTP récupérés
- [ ] Fichier `.env` mis à jour avec les bonnes valeurs
- [ ] Backend redémarré
- [ ] Test d'envoi d'email réussi
- [ ] Email reçu dans la boîte de test/boîte de réception

---

**Besoin d'aide ?** Consultez les logs du backend ou vérifiez la documentation de votre service SMTP.


