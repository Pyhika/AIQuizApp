#!/bin/bash

echo "🚀 AIQuizApp Development Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"

# Create necessary directories
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p docker/init-scripts
mkdir -p docker/volumes/postgres
mkdir -p docker/volumes/redis
mkdir -p docker/volumes/uploads
mkdir -p packages/back/uploads

# Copy environment files if they don't exist
echo -e "\n${YELLOW}Setting up environment files...${NC}"

# Backend .env
if [ ! -f packages/back/.env ]; then
    cp packages/back/.env.development packages/back/.env
    echo -e "${GREEN}✓ Created packages/back/.env${NC}"
else
    echo -e "${YELLOW}⚠ packages/back/.env already exists${NC}"
fi

# Mobile .env
if [ ! -f packages/mobile/.env ]; then
    cp packages/mobile/.env.development packages/mobile/.env
    echo -e "${GREEN}✓ Created packages/mobile/.env${NC}"
else
    echo -e "${YELLOW}⚠ packages/mobile/.env already exists${NC}"
fi

# Docker .env
if [ ! -f .env ]; then
    cp .env.docker .env
    echo -e "${GREEN}✓ Created .env for Docker${NC}"
else
    echo -e "${YELLOW}⚠ .env already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"

# Backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd packages/back
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi
cd ../..

# Mobile dependencies
echo -e "${YELLOW}Installing mobile dependencies...${NC}"
cd packages/mobile
npm install
cd ../..

# Start Docker services
echo -e "\n${YELLOW}Starting Docker services...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if services are running
if docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL failed to start${NC}"
fi

if docker-compose ps | grep -q "redis.*Up"; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis failed to start${NC}"
fi

echo -e "\n${GREEN}=============================="
echo "Setup completed successfully!"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Add your API keys to packages/back/.env"
echo "2. Start the backend: cd packages/back && pnpm run start:dev"
echo "3. Start the mobile app: cd packages/mobile && npx expo start"
echo ""
echo "Optional:"
echo "- Start pgAdmin: docker-compose --profile tools up -d pgadmin"
echo "- Access pgAdmin at http://localhost:8080"
echo -e "${NC}"