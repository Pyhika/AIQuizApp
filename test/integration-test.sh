#!/bin/bash

echo "========================================="
echo "AIQuizApp 統合テスト"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval $test_command; then
        echo -e "${GREEN}✓ $test_name passed${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ $test_name failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to check if service is running
check_service() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

echo -e "\n${YELLOW}1. サービスの起動状態チェック${NC}"
echo "========================================="

# Check Docker services
run_test "PostgreSQL (Port 5432)" "check_service postgres 5432"
run_test "Redis (Port 6379)" "check_service redis 6379"
run_test "Backend API (Port 3000/3001)" "check_service backend 3000 || check_service backend 3001"

echo -e "\n${YELLOW}2. バックエンド依存関係チェック${NC}"
echo "========================================="

cd packages/back
run_test "Backend dependencies" "pnpm list --depth=0 > /dev/null 2>&1"
run_test "TypeScript compilation" "npx tsc --noEmit"
cd ../..

echo -e "\n${YELLOW}3. モバイルアプリ依存関係チェック${NC}"
echo "========================================="

cd packages/mobile
run_test "Mobile dependencies" "npm list --depth=0 > /dev/null 2>&1"
run_test "TypeScript compilation" "npx tsc --noEmit"
cd ../..

echo -e "\n${YELLOW}4. APIエンドポイントテスト${NC}"
echo "========================================="

API_URL="http://localhost:3000"
if ! check_service backend 3000; then
    API_URL="http://localhost:3001"
fi

# Health check
run_test "Health check endpoint" "curl -s -o /dev/null -w '%{http_code}' $API_URL/health | grep -q '200'"

# Auth endpoints
run_test "Auth register endpoint exists" "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/auth/register -H 'Content-Type: application/json' -d '{}' | grep -E '400|201'"
run_test "Auth login endpoint exists" "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/auth/login -H 'Content-Type: application/json' -d '{}' | grep -E '400|401|200'"

# Quiz endpoints
run_test "Quiz list endpoint" "curl -s -o /dev/null -w '%{http_code}' $API_URL/quiz | grep -q '200'"
run_test "Quiz search endpoint" "curl -s -o /dev/null -w '%{http_code}' '$API_URL/quiz/search?searchText=test' | grep -q '200'"

echo -e "\n${YELLOW}5. データベース接続テスト${NC}"
echo "========================================="

# Test database connection
run_test "Database connection" "PGPASSWORD=apppass psql -h localhost -U appuser -d appdb -c 'SELECT 1' > /dev/null 2>&1 || PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -c 'SELECT 1' > /dev/null 2>&1"

echo -e "\n${YELLOW}6. ファイル構造チェック${NC}"
echo "========================================="

# Check required files exist
run_test "Backend main.ts exists" "[ -f packages/back/src/main.ts ]"
run_test "Mobile App.tsx exists" "[ -f packages/mobile/app/_layout.tsx ]"
run_test "Docker Compose file exists" "[ -f docker-compose.yml ]"
run_test "Quiz taking screen exists" "[ -f packages/mobile/screens/QuizTakingScreen.tsx ]"
run_test "Quiz result screen exists" "[ -f packages/mobile/screens/QuizResultScreen.tsx ]"
run_test "Learning report screen exists" "[ -f packages/mobile/screens/LearningReportScreen.tsx ]"
run_test "Review screen exists" "[ -f packages/mobile/screens/ReviewScreen.tsx ]"
run_test "Chat screen exists" "[ -f packages/mobile/screens/ChatScreen.tsx ]"
run_test "Profile edit screen exists" "[ -f packages/mobile/screens/ProfileEditScreen.tsx ]"
run_test "Export module exists" "[ -d packages/back/src/export ]"

echo -e "\n${YELLOW}7. 環境設定チェック${NC}"
echo "========================================="

run_test "Backend .env.example exists" "[ -f packages/back/.env.example ]"
run_test "Mobile .env.example exists" "[ -f packages/mobile/.env.example ]"
run_test "Backend config files exist" "[ -d packages/back/src/config ]"

echo -e "\n${YELLOW}8. セキュリティ設定チェック${NC}"
echo "========================================="

run_test "Security config exists" "[ -f packages/back/src/config/security.config.ts ]"
run_test "Password validator exists" "[ -f packages/back/src/common/validators/password.validator.ts ]"
run_test "Secure Dockerfile exists" "[ -f packages/back/Dockerfile.secure ]"
run_test "Nginx security config exists" "[ -f nginx/conf.d/security.conf ]"

echo -e "\n${YELLOW}9. 機能モジュールチェック${NC}"
echo "========================================="

# Backend modules
run_test "Auth module exists" "[ -d packages/back/src/auth ]"
run_test "Quiz module exists" "[ -d packages/back/src/quiz ]"
run_test "Export module exists" "[ -d packages/back/src/export ]"
run_test "Entities exist" "[ -d packages/back/src/entities ]"

# Mobile screens
run_test "All main screens exist" "[ -f packages/mobile/app/\(tabs\)/index.tsx ] && [ -f packages/mobile/app/\(tabs\)/create.tsx ] && [ -f packages/mobile/app/\(tabs\)/learn.tsx ]"

echo -e "\n========================================="
echo -e "${BLUE}テスト結果サマリー${NC}"
echo "========================================="
echo -e "総テスト数: $TOTAL_TESTS"
echo -e "${GREEN}成功: $PASSED_TESTS${NC}"
echo -e "${RED}失敗: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✅ すべてのテストが成功しました！${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  $FAILED_TESTS 個のテストが失敗しました${NC}"
    echo -e "${YELLOW}失敗したテストを確認して修正してください${NC}"
    exit 1
fi