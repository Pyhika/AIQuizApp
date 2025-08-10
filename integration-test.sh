#!/bin/bash

# Integration Test for AllAI Quiz Application
# Tests all implemented features across Phase 1-3

echo "========================================="
echo "AllAI Integration Test Suite"
echo "========================================="

PASS=0
FAIL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test function
test_feature() {
    local description=$1
    local command=$2
    
    echo -n "Testing: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗${NC}"
        ((FAIL++))
    fi
}

echo ""
echo "1. Backend Services"
echo "-----------------------------------------"

# Backend structure tests
test_feature "Auth module exists" "[ -d packages/back/src/auth ]"
test_feature "Quiz module exists" "[ -d packages/back/src/quiz ]"
test_feature "Quiz attempts module exists" "[ -d packages/back/src/quiz-attempts ]"
test_feature "AI module exists" "[ -d packages/back/src/ai ]"
test_feature "Export module exists" "[ -d packages/back/src/export ]"
test_feature "Security config exists" "[ -f packages/back/src/config/security.config.ts ]"
test_feature "Environment config exists" "[ -f packages/back/src/config/config.module.ts ]"

# Backend feature files
test_feature "JWT blacklist service" "[ -f packages/back/src/auth/jwt-blacklist.service.ts ]"
test_feature "Password change DTO" "[ -f packages/back/src/auth/dto/change-password.dto.ts ]"
test_feature "Quiz difficulty service" "[ -f packages/back/src/quiz-attempts/quiz-difficulty.service.ts ]"
test_feature "Export service" "[ -f packages/back/src/export/export.service.ts ]"

echo ""
echo "2. Mobile App Features"
echo "-----------------------------------------"

# Phase 1 features
test_feature "Quiz taking screen" "[ -f packages/mobile/screens/QuizTakingScreen.tsx ]"
test_feature "Quiz result screen" "[ -f packages/mobile/screens/QuizResultScreen.tsx ]"
test_feature "Quiz route" "[ -f packages/mobile/app/quiz/[id].tsx ]"
test_feature "Result route" "[ -f packages/mobile/app/quiz-result.tsx ]"

# Phase 2 features
test_feature "AI chat screen" "[ -f packages/mobile/screens/AIChatScreen.tsx ]"
test_feature "Learning report screen" "[ -f packages/mobile/screens/LearningReportScreen.tsx ]"
test_feature "Review screen" "[ -f packages/mobile/screens/ReviewScreen.tsx ]"
test_feature "Chat tab route" "[ -f packages/mobile/app/(tabs)/chat.tsx ]"
test_feature "Review tab route" "[ -f packages/mobile/app/(tabs)/review.tsx ]"

echo ""
echo "3. Dependencies"
echo "-----------------------------------------"

# Backend dependencies
test_feature "Helmet security" "grep -q '\"helmet\"' packages/back/package.json"
test_feature "Express rate limit" "grep -q '\"express-rate-limit\"' packages/back/package.json"
test_feature "JSON2CSV export" "grep -q '\"json2csv\"' packages/back/package.json"
test_feature "Redis cache" "grep -q '\"ioredis\"' packages/back/package.json"
test_feature "JWT support" "grep -q '\"@nestjs/jwt\"' packages/back/package.json"

# Mobile dependencies
test_feature "React Native Paper" "grep -q '\"react-native-paper\"' packages/mobile/package.json"
test_feature "Expo Router" "grep -q '\"expo-router\"' packages/mobile/package.json"
test_feature "React Native Charts" "grep -q '\"react-native-chart-kit\"' packages/mobile/package.json"
test_feature "Gifted Chat" "grep -q '\"react-native-gifted-chat\"' packages/mobile/package.json"
test_feature "Circular Progress" "grep -q '\"react-native-circular-progress\"' packages/mobile/package.json"

echo ""
echo "4. Configuration Files"
echo "-----------------------------------------"

test_feature "Docker compose" "[ -f docker-compose.yml ]"
test_feature "Backend .env.example" "[ -f packages/back/.env.example ]"
test_feature "Mobile app.json" "[ -f packages/mobile/app.json ]"
test_feature "Mobile EAS config" "[ -f packages/mobile/eas.json ]"
test_feature "TypeScript config" "[ -f packages/back/tsconfig.json ]"

echo ""
echo "5. Docker Services"
echo "-----------------------------------------"

test_feature "PostgreSQL in Docker" "grep -q 'postgres:' docker-compose.yml"
test_feature "Redis in Docker" "grep -q 'redis:' docker-compose.yml"
test_feature "Backend service in Docker" "grep -q 'backend:' docker-compose.yml"

echo ""
echo "========================================="
echo "Test Results"
echo "========================================="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo "Success Rate: $PERCENTAGE%"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the implementation.${NC}"
    exit 1
fi