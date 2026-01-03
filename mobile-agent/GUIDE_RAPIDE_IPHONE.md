# 📱 GUIDE RAPIDE - Tester sur iPhone

## ✅ ÉTAPES RAPIDES

### 1️⃣ Vérifier que le backend est démarré

```bash
cd backend
npm run start:dev
```

**Vérifier** : Le backend doit être accessible sur `http://localhost:3000`

---

### 2️⃣ Installer Expo Go sur votre iPhone

1. Ouvrir l'**App Store** sur iPhone
2. Rechercher **"Expo Go"**
3. Installer l'application (gratuite)

---

### 3️⃣ Démarrer l'application mobile en mode TUNNEL (recommandé)

**Dans un nouveau terminal** :

```bash
cd mobile-agent
npm start
```

**OU explicitement** :

```bash
cd mobile-agent
npm run tunnel
```

**OU** :

```bash
cd mobile-agent
npx expo start --tunnel
```

**✅ Avantages du mode tunnel** :
- ✅ Fonctionne même si iPhone et ordinateur ne sont pas sur le même Wi-Fi
- ✅ Pas besoin de configurer le pare-feu
- ✅ Plus simple et plus fiable
- ⚠️ Un peu plus lent que LAN (mais acceptable)

---

### 4️⃣ Scanner le QR code avec Expo Go

1. **Ouvrir Expo Go** sur votre iPhone
2. **Scanner le QR code** affiché dans le terminal
3. L'application va se charger automatiquement

**ℹ️ Note** : Avec le tunnel, le QR code contiendra une URL `exp://` via ngrok (ex: `exp://xxx.ngrok.io`)

---

## 🔧 MODE ALTERNATIF : LAN (si tunnel ne fonctionne pas)

Si le tunnel est trop lent ou ne fonctionne pas, vous pouvez utiliser le mode LAN :

```bash
cd mobile-agent
npm run lan
```

**⚠️ Prérequis pour LAN** :
- iPhone et ordinateur sur le **même réseau Wi-Fi**
- IP correcte dans `mobile-agent/src/config/api.ts` (`172.20.10.12`)
- Pare-feu Windows autorisant le port **8081**

---

## 🔧 DÉPANNAGE RAPIDE

### ❌ Le tunnel ne démarre pas

**Solution 1** : Installer ngrok (si nécessaire)
```bash
npm install -g @expo/ngrok@latest
```

**Solution 2** : Utiliser le mode LAN à la place
```bash
cd mobile-agent
npm run lan
```

---

### ❌ "Network request failed" dans l'app

**Vérifier** :
1. ✅ Le backend est démarré (`http://localhost:3000`)
2. ✅ L'IP dans `mobile-agent/src/config/api.ts` est correcte (`172.20.10.12`)
3. ✅ Testez l'API depuis Safari sur iPhone : `http://172.20.10.12:3000/api/docs`

---

### ❌ Impossible de scanner le QR code

**Solution** : Copier l'URL manuellement
1. Dans Expo Go, appuyer sur **"Enter URL manually"**
2. Entrer : `exp://172.20.10.12:8081`

---

## 📝 NOTES

- **IP actuelle configurée** : `172.20.10.12`
- **Port backend** : `3000`
- **Port Expo** : `8081`
- Si votre IP change, mettre à jour `mobile-agent/src/config/api.ts`

---

## ✅ CHECKLIST AVANT DE TESTER

- [ ] Backend démarré et accessible (`http://localhost:3000`)
- [ ] Expo Go installé sur iPhone
- [ ] Expo démarré en mode tunnel (`npm start` ou `npm run tunnel`)
- [ ] QR code scanné avec Expo Go

**Note** : Avec le tunnel, pas besoin d'être sur le même Wi-Fi ! 🎉

---

**Bon test ! 🚀**
