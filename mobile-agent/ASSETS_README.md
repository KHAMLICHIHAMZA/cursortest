# Assets de l'application mobile-agent

## Fichiers requis

L'application nécessite les fichiers d'assets suivants dans le dossier `assets/` :

- **icon.png** : Icône principale de l'application (1024x1024px recommandé)
- **splash.png** : Image de l'écran de démarrage (splash screen)
- **adaptive-icon.png** : Icône adaptative pour Android (1024x1024px)
- **favicon.png** : Favicon pour le support web (48x48px ou 192x192px)

## Fichiers actuels

Les fichiers actuels sont des placeholders (images minimales de 1x1px) créés automatiquement pour permettre le démarrage de l'application.

## Remplacement des assets

Pour remplacer ces assets par vos propres images :

1. **Préparer les images** :
   - Format : PNG avec transparence
   - Taille recommandée :
     - `icon.png` : 1024x1024px
     - `splash.png` : 1242x2436px (iPhone) ou 2048x2732px (iPad)
     - `adaptive-icon.png` : 1024x1024px
     - `favicon.png` : 48x48px ou 192x192px

2. **Remplacer les fichiers** :
   ```bash
   # Copier vos images dans le dossier assets/
   cp votre-icon.png assets/icon.png
   cp votre-splash.png assets/splash.png
   cp votre-adaptive-icon.png assets/adaptive-icon.png
   cp votre-favicon.png assets/favicon.png
   ```

3. **Redémarrer Expo** :
   ```bash
   npm start
   ```

## Outils recommandés

- [Expo Asset Generator](https://www.npmjs.com/package/@expo/asset-generator) : Génère automatiquement tous les assets nécessaires
- [App Icon Generator](https://www.appicon.co/) : Outil en ligne pour générer les icônes
- [Splash Screen Generator](https://www.figma.com/community/plugin/972939895300088268/Expo-Splash-Screen-Generator) : Plugin Figma pour créer les splash screens

