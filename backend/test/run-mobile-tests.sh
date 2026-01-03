#!/bin/bash

# Script to run mobile agent E2E tests
# Usage: ./run-mobile-tests.sh

echo "🧪 Starting Mobile Agent E2E Tests..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking if backend is running..."
if ! curl -s http://localhost:3000/api/docs > /dev/null; then
    echo -e "${RED}❌ Backend is not running on port 3000${NC}"
    echo "Please start the backend first: npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Run tests
echo "🚀 Running E2E tests..."
npm run test:e2e -- mobile-agent.e2e-spec.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

