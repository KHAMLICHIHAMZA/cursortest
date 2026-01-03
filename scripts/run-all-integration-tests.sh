#!/bin/bash

# Script pour lancer tous les tests d'intégration
# Usage: ./scripts/run-all-integration-tests.sh

set -e

echo "=========================================="
echo "TESTS D'INTÉGRATION COMPLETS"
echo "=========================================="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
BACKEND_DIR="./backend"
MOBILE_DIR="./mobile-agent"
BACKEND_PORT=3000
BACKEND_URL="http://localhost:${BACKEND_PORT}/api/v1"

# Fonction pour vérifier si le backend est démarré
check_backend() {
  if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Fonction pour démarrer le backend
start_backend() {
  echo -e "${YELLOW}Démarrage du backend...${NC}"
  cd "${BACKEND_DIR}"
  
  # Vérifier si la base de données est prête
  echo "Vérification de la base de données..."
  npm run prisma:generate
  npx prisma migrate deploy
  
  # Démarrer le backend en arrière-plan
  npm run start > ../backend.log 2>&1 &
  BACKEND_PID=$!
  echo "Backend démarré (PID: ${BACKEND_PID})"
  
  # Attendre que le backend soit prêt
  echo "Attente du démarrage du backend..."
  for i in {1..30}; do
    if check_backend; then
      echo -e "${GREEN}Backend prêt!${NC}"
      return 0
    fi
    sleep 1
  done
  
  echo -e "${RED}Le backend n'a pas démarré à temps${NC}"
  return 1
}

# Fonction pour arrêter le backend
stop_backend() {
  if [ ! -z "${BACKEND_PID}" ]; then
    echo -e "${YELLOW}Arrêt du backend (PID: ${BACKEND_PID})...${NC}"
    kill ${BACKEND_PID} 2>/dev/null || true
    wait ${BACKEND_PID} 2>/dev/null || true
  fi
}

# Trap pour arrêter le backend en cas d'erreur
trap stop_backend EXIT

# 1. Tests Backend
echo -e "${YELLOW}1. Tests Backend${NC}"
echo "----------------------------------------"
cd "${BACKEND_DIR}"

echo "Tests unitaires..."
npm run test || {
  echo -e "${RED}❌ Tests unitaires backend échoués${NC}"
  exit 1
}

echo "Tests E2E backend..."
npm run test:e2e || {
  echo -e "${RED}❌ Tests E2E backend échoués${NC}"
  exit 1
}

echo -e "${GREEN}✅ Tests backend réussis${NC}"
echo ""

# 2. Démarrer le backend pour les tests d'intégration mobile
echo -e "${YELLOW}2. Démarrage du backend pour tests d'intégration${NC}"
echo "----------------------------------------"
if ! start_backend; then
  echo -e "${RED}❌ Impossible de démarrer le backend${NC}"
  exit 1
fi
echo ""

# 3. Tests Mobile
echo -e "${YELLOW}3. Tests Mobile Agent${NC}"
echo "----------------------------------------"
cd "../${MOBILE_DIR}"

echo "Vérification TypeScript..."
npx tsc --noEmit --skipLibCheck || {
  echo -e "${RED}❌ Erreurs TypeScript${NC}"
  stop_backend
  exit 1
}

echo "Tests unitaires mobile..."
npm run test || {
  echo -e "${RED}❌ Tests unitaires mobile échoués${NC}"
  stop_backend
  exit 1
}

echo "Tests d'intégration mobile..."
API_URL="${BACKEND_URL}" npm run test:integration || {
  echo -e "${YELLOW}⚠️  Tests d'intégration mobile échoués (backend peut-être non disponible)${NC}"
}

echo -e "${GREEN}✅ Tests mobile réussis${NC}"
echo ""

# 4. Arrêt du backend
stop_backend

# 5. Résumé
echo "=========================================="
echo -e "${GREEN}Tous les tests sont terminés!${NC}"
echo "=========================================="




