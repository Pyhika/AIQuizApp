#!/bin/bash

# Development helper script
echo "🚀 Starting AIQuizApp Development Environment"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Start Docker services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker-compose up -d postgres redis

# Wait for services
sleep 3

# Start backend in new terminal tab (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/packages/back && pnpm run start:dev"'
    echo -e "${GREEN}✓ Backend starting in new terminal tab${NC}"
fi

# Start mobile app
echo -e "${YELLOW}Starting Expo development server...${NC}"
cd packages/mobile
npx expo start

echo -e "${GREEN}Development environment is running!${NC}"