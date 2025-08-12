#!/bin/bash

set -euo pipefail

MODE="lan"   # lan | tunnel
PUBLIC_API_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tunnel)
      MODE="tunnel"
      shift
      ;;
    --api-url)
      PUBLIC_API_URL="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

echo "🚀 Starting AIQuizApp Development Environment ($MODE)"
echo "=========================================="

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📱 Local IP Address: $LOCAL_IP"
echo ""

# Determine API URL
if [[ "$MODE" == "lan" ]]; then
  API_URL="http://$LOCAL_IP:3000"
  WS_URL="ws://$LOCAL_IP:3000"
else
  if [[ -z "$PUBLIC_API_URL" ]]; then
    echo "ℹ️  WAN(トンネル)利用時は --api-url で外部から到達可能なAPIのURLを指定してください"
    echo "    例) ./start-dev.sh --tunnel --api-url https://<your-domain-or-ngrok>.ngrok-free.app"
    exit 1
  fi
  API_URL="$PUBLIC_API_URL"
  # Convert HTTP to WS, HTTPS to WSS
  if [[ "$API_URL" == https://* ]]; then
    WS_URL="${API_URL/https:/wss:}"
  else
    WS_URL="${API_URL/http:/ws:}"
  fi
fi

# Update mobile .env with selected API URL
cat > packages/mobile/.env <<EOF
# Development environment variables for Expo
EXPO_PUBLIC_API_URL=${API_URL}
EXPO_PUBLIC_WS_URL=${WS_URL}
EXPO_PUBLIC_ENV=development
EOF

echo "✅ Set mobile environment:"
echo "   API URL: ${API_URL}"
echo "   WS URL : ${WS_URL}"
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
    pushd packages/back >/dev/null
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        pnpm install
    fi

    # Start backend server in background
    echo "🖥️  Starting backend server..."
    pnpm run start:dev &
    BACKEND_PID=$!
    echo "Backend server PID: $BACKEND_PID"
    popd >/dev/null
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend server (${API_URL})..."
until curl -s "${API_URL}" > /dev/null 2>&1; do
    sleep 2
done
echo "✅ Backend server is ready at ${API_URL}"
echo ""

# Install mobile dependencies if needed
echo "📦 Checking mobile dependencies..."
pushd packages/mobile >/dev/null
if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies (pnpm)..."
    pnpm install
fi

echo ""
echo "=========================================="
echo "🎉 Development environment is ready!"
echo "=========================================="
echo ""
echo "📱 Starting Expo..."
echo "   Mode   : $MODE"
echo "   API URL: ${API_URL}"
echo ""
echo "📲 To test on your device:"
echo "   - LAN     : Same WiFi and scan QR"
echo "   - TUNNEL  : Expo will use a tunnel; device can be on 4G/5G"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"
echo "=========================================="
echo ""

# Ensure default port is free
if lsof -ti:8081 >/dev/null 2>&1; then
  lsof -ti:8081 | xargs -I {} kill -9 {} 2>/dev/null || true
fi

# Start Expo server (lan or tunnel)
if [[ "$MODE" == "tunnel" ]]; then
  pnpm exec expo start -c --tunnel
else
  pnpm exec expo start -c --lan
fi

# Cleanup on exit
if [ -n "${BACKEND_PID:-}" ]; then
    trap "echo '🛑 Stopping services...'; kill ${BACKEND_PID} 2>/dev/null; docker-compose down; exit" INT TERM
else
    trap "echo '🛑 Stopping services...'; docker-compose down; exit" INT TERM
fi

wait
