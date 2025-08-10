#!/bin/bash

echo "🚀 Starting AllAI Development Environment (Simple Mode)"
echo "=========================================="

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📱 Local IP Address: $LOCAL_IP"
echo ""

# Update mobile .env with current IP
echo "# Development environment variables for Expo
# Use your local IP address for testing on physical devices
EXPO_PUBLIC_API_URL=http://$LOCAL_IP:3000" > packages/mobile/.env

echo "✅ Updated mobile environment with IP: $LOCAL_IP"
echo ""

# Start PostgreSQL and Redis using simple docker commands
echo "🐳 Starting PostgreSQL..."
docker run -d \
  --name aiapp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aiapp_dev \
  -p 5432:5432 \
  postgres:15-alpine 2>/dev/null || echo "PostgreSQL container already exists"

echo "🐳 Starting Redis..."
docker run -d \
  --name aiapp-redis \
  -p 6379:6379 \
  redis:7-alpine 2>/dev/null || echo "Redis container already exists"

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
docker ps | grep aiapp-postgres > /dev/null && echo "✅ PostgreSQL is running"
docker ps | grep aiapp-redis > /dev/null && echo "✅ Redis is running"

echo ""
echo "📦 Installing backend dependencies..."
cd packages/back
if [ ! -d "node_modules" ]; then
    pnpm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating backend .env file..."
    cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=aiapp_dev

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
fi

# Start backend server in background
echo "🖥️  Starting backend server..."
pnpm run start:dev &
BACKEND_PID=$!
echo "Backend server PID: $BACKEND_PID"
cd ../..

# Wait for backend to be ready
echo "⏳ Waiting for backend server..."
sleep 10
echo "✅ Backend should be ready at http://localhost:3000"
echo ""

# Install mobile dependencies
echo "📦 Checking mobile dependencies..."
cd packages/mobile
if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
fi

echo ""
echo "=========================================="
echo "🎉 Development environment is ready!"
echo "=========================================="
echo ""
echo "📱 Starting Expo..."
echo "   Local IP: $LOCAL_IP"
echo "   API URL: http://$LOCAL_IP:3000"
echo ""
echo "📲 To test on your device:"
echo "   1. Install Expo Go app on your phone"
echo "   2. Connect to the same WiFi network"
echo "   3. Scan the QR code that will appear"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"
echo "=========================================="
echo ""

# Start Expo server
npx expo start

# Cleanup on exit
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID 2>/dev/null; docker stop aiapp-postgres aiapp-redis; docker rm aiapp-postgres aiapp-redis; exit" INT TERM

wait