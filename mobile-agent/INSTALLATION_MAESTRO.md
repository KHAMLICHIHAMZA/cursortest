# 📱 Installation Maestro pour Tests E2E

Maestro est un outil de test E2E pour applications mobiles. Voici comment l'installer et l'utiliser.

## 🔧 Installation

### Windows

1. **Télécharger Maestro** :
   - Aller sur https://maestro.mobile.dev/
   - Télécharger le binaire Windows
   - Ou utiliser Chocolatey : `choco install maestro`

2. **Ajouter au PATH** :
   - Extraire le binaire dans un dossier (ex: `C:\maestro`)
   - Ajouter ce dossier au PATH système

3. **Vérifier l'installation** :
   ```bash
   maestro --version
   ```

### Mac/Linux

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## 🚀 Utilisation

### 1. Lancer l'application

Avant de lancer les tests, assurez-vous que :
- L'application est lancée sur un appareil/simulateur
- Expo Go est installé (pour Expo)
- L'app est accessible

### 2. Exécuter les tests

```bash
# Tous les tests
maestro test .maestro

# Test spécifique
maestro test .maestro/login.yaml

# Test avec rapport
maestro test .maestro --format junit --output results.xml
```

## 📝 Configuration

Les fichiers de test sont dans `.maestro/` :
- `config.yaml` - Configuration globale
- `login.yaml` - Test de login
- `bookings-flow.yaml` - Test du flux de réservations
- `checkin-flow.yaml` - Test du flux de check-in

## 🔍 Sélecteurs

Maestro utilise plusieurs types de sélecteurs :
- **Texte** : `"auth.email"` (cherche le texte exact)
- **ID** : `"#booking-1"` (cherche un ID)
- **Partiel** : `"#booking-"` (cherche un ID partiel)
- **Point** : `"50%,50%"` (coordonnées)

## 📚 Documentation

Pour plus d'informations :
- Documentation officielle : https://maestro.mobile.dev/
- Exemples : https://maestro.mobile.dev/examples




