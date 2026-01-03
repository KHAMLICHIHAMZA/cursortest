# 🔍 Explication - Écran de Sélection de Langue

## ❓ Pourquoi cet écran apparaît brièvement ?

L'écran de **sélection de langue** (`LanguageSelectionScreen`) s'affiche rapidement avant l'écran de connexion pour la raison suivante :

### Comportement actuel

1. **Au démarrage** : L'app affiche toujours `LanguageSelectionScreen` en premier (défini dans `AuthStack`)
2. **Vérification asynchrone** : Un `useEffect` vérifie si une langue est déjà stockée
3. **Navigation automatique** : Si une langue existe, navigation vers `Login`
4. **Problème** : Il y a un délai entre le rendu et la vérification, donc l'écran est visible brièvement

### Solution appliquée

✅ **Ajout d'un écran de chargement** :
- Affiche un `ActivityIndicator` pendant la vérification
- Masque l'écran de sélection de langue si une langue est déjà stockée
- Utilise `navigation.replace()` au lieu de `navigate()` pour éviter le retour en arrière

### Résultat

- **Première utilisation** : L'utilisateur voit l'écran de sélection de langue
- **Utilisations suivantes** : L'utilisateur voit un bref chargement puis va directement à l'écran de connexion

---

## 🔧 Code modifié

**Avant** :
- L'écran se rendait immédiatement
- La vérification se faisait après le rendu
- Navigation avec `navigate()` (permet retour en arrière)

**Après** :
- État `isChecking` pour masquer l'écran pendant la vérification
- Affichage d'un `ActivityIndicator` pendant la vérification
- Navigation avec `replace()` (remplace l'écran, pas de retour)

---

## ✅ Amélioration

L'écran de sélection de langue ne devrait plus apparaître brièvement si une langue est déjà stockée. Un indicateur de chargement s'affiche à la place.




