# Connexion depuis un appareil mobile

## 🔐 Identifiants de connexion

Pour vous connecter à l'application mobile, utilisez les identifiants suivants :

### Compte Agent (recommandé pour l'application mobile)
- **Email** : `agent1@autolocation.fr`
- **Mot de passe** : `agent123`
- **Rôle** : AGENT
- **Agence** : Agence Paris Centre

### Autres comptes de test disponibles

**Compte Manager** :
- **Email** : `manager1@autolocation.fr`
- **Mot de passe** : `manager123`
- **Rôle** : AGENCY_MANAGER

**Compte Admin** :
- **Email** : `admin@autolocation.fr`
- **Mot de passe** : `admin123`
- **Rôle** : COMPANY_ADMIN

> 💡 **Note** : L'application mobile est principalement conçue pour les agents. Utilisez le compte `agent1@autolocation.fr` pour tester toutes les fonctionnalités.

---

## Problème

Si vous voyez `exp://127.0.0.1:8081` dans le QR code, votre téléphone ne pourra pas se connecter car `127.0.0.1` est l'adresse localhost (machine locale uniquement).

## Solution

Expo a été configuré pour utiliser le mode `--lan` qui permet la connexion depuis d'autres appareils sur le même réseau Wi-Fi.

### Étape 1 : Vérifier que vous êtes sur le même réseau Wi-Fi

- Votre ordinateur et votre téléphone doivent être connectés au **même réseau Wi-Fi**
- Vérifiez que le Wi-Fi est activé sur les deux appareils

### Étape 2 : Redémarrer Expo

```bash
npm start
```

Ou si Expo est déjà en cours d'exécution, appuyez sur `r` dans le terminal pour redémarrer.

### Étape 3 : Scanner le QR code

Le QR code devrait maintenant afficher `exp://192.168.1.99:8081` (ou votre IP locale) au lieu de `exp://127.0.0.1:8081`.

**Sur iOS** :
- Ouvrez l'application **Expo Go** depuis l'App Store
- Utilisez l'appareil photo natif ou le scanner dans Expo Go
- Scannez le QR code

**Sur Android** :
- Ouvrez l'application **Expo Go** depuis le Play Store
- Utilisez le scanner dans Expo Go
- Scannez le QR code

## Dépannage

### Erreur : "Could not connect to server"

1. **Vérifiez le pare-feu Windows** :
   - Ouvrez "Pare-feu Windows Defender"
   - Cliquez sur "Paramètres avancés"
   - Vérifiez que le port 8081 est autorisé pour les connexions entrantes

2. **Vérifiez votre IP locale** :
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object IPAddress, InterfaceAlias
   ```

3. **Utilisez le mode tunnel** (si le LAN ne fonctionne pas) :
   ```bash
   npx expo start --tunnel
   ```
   Note : Le mode tunnel est plus lent mais fonctionne même si vous n'êtes pas sur le même réseau.

### Erreur : "Network request failed"

- Vérifiez que le backend API est accessible depuis votre téléphone
- Si le backend utilise `localhost`, modifiez-le pour utiliser votre IP locale (`192.168.1.99:3000`)
- Vérifiez les paramètres CORS du backend

### Vérifier la connexion

Dans le terminal Expo, vous devriez voir :
```
Metro waiting on exp://192.168.1.99:8081
```

Si vous voyez toujours `exp://127.0.0.1:8081`, appuyez sur `shift+m` dans le terminal Expo pour changer le mode de connexion.

## Commandes utiles dans le terminal Expo

- `r` : Redémarrer le serveur
- `shift+m` : Changer le mode de connexion (LAN/Tunnel/Localhost)
- `a` : Ouvrir sur Android
- `i` : Ouvrir sur iOS (macOS uniquement)
- `w` : Ouvrir dans le navigateur web
- `c` : Effacer le cache

