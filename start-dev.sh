#!/bin/bash

echo "🚀 Starting AllAI Development Environment"
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if PostgreSQL is ready
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Check if Redis is ready
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo "Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"
echo ""

# Check if backend is already running in Docker
if docker ps | grep -q aiquizapp-backend; then
    echo "🐳 Backend is already running in Docker container"
    BACKEND_PID=""
else
    # Install backend dependencies if needed
    echo "📦 Checking backend dependencies..."
    cd packages/back
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        pnpm install
    fi

    # Start backend server in background
    echo "🖥️  Starting backend server..."
    pnpm run start:dev &
    BACKEND_PID=$!
    echo "Backend server PID: $BACKEND_PID"
    cd ../..
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend server..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Backend server is ready at http://localhost:3000"
echo ""

# Install mobile dependencies if needed
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
if [ -n "$BACKEND_PID" ]; then
    trap "echo '🛑 Stopping services...'; kill $BACKEND_PID 2>/dev/null; docker-compose down; exit" INT TERM
else
    trap "echo '🛑 Stopping services...'; docker-compose down; exit" INT TERM
fi

wait