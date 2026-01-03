# Script PowerShell pour démarrer Expo avec workaround Windows
# Usage: .\start-expo.ps1

$env:EXPO_NO_METRO_LAZY = "1"
npx expo start --clear

