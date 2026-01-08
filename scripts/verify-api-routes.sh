#!/bin/bash

# Script para verificar que todas las rutas API estén funcionando correctamente
# Uso: ./scripts/verify-api-routes.sh [TOKEN]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
TOKEN="${1:-}"

echo ""
echo "🔍 Verificando rutas API de GULA"
echo "=================================="
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local needs_auth=$3
    local description=$4
    local data=$5
    
    printf "${BLUE}Testing:${NC} %-40s" "$description"
    
    if [ "$needs_auth" = "true" ] && [ -z "$TOKEN" ]; then
        printf "${YELLOW}[SKIP - No token]${NC}\n"
        return
    fi
    
    local headers="-H 'Content-Type: application/json'"
    if [ "$needs_auth" = "true" ]; then
        headers="$headers -H 'Authorization: Bearer $TOKEN'"
    fi
    
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}' -X $method"
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    curl_cmd="$curl_cmd $headers $BASE_URL$path"
    
    local response=$(eval $curl_cmd)
    
    if [ "$response" -ge 200 ] && [ "$response" -lt 300 ]; then
        printf "${GREEN}[✓ $response]${NC}\n"
    elif [ "$response" -eq 401 ]; then
        printf "${YELLOW}[! 401 - Auth required]${NC}\n"
    elif [ "$response" -eq 404 ]; then
        printf "${RED}[✗ 404 - NOT FOUND]${NC}\n"
    else
        printf "${RED}[✗ $response]${NC}\n"
    fi
}

# Health check
echo "📋 Health Check"
echo "---------------"
test_endpoint "GET" "/health" "false" "Health endpoint"
echo ""

# Auth endpoints
echo "🔐 Auth Endpoints"
echo "-----------------"
test_endpoint "POST" "/api/auth/signup" "false" "POST /api/auth/signup"
test_endpoint "POST" "/api/auth/login" "false" "POST /api/auth/login"
echo ""

# User endpoints
echo "👤 User Endpoints"
echo "-----------------"
test_endpoint "GET" "/api/users/me" "true" "GET /api/users/me"
test_endpoint "PATCH" "/api/users/me" "true" "PATCH /api/users/me"
echo ""

# Exam endpoints
echo "📄 Exam Endpoints"
echo "-----------------"
test_endpoint "GET" "/api/exams" "true" "GET /api/exams (list)"
test_endpoint "GET" "/api/exams/test-id" "true" "GET /api/exams/:examId"
test_endpoint "POST" "/api/exams/upload" "true" "POST /api/exams/upload"
echo ""

# Dashboard endpoints
echo "📊 Dashboard Endpoints"
echo "----------------------"
test_endpoint "GET" "/api/dashboard" "true" "GET /api/dashboard"
echo ""

# Weekly Actions endpoints
echo "📅 Weekly Actions Endpoints"
echo "---------------------------"
test_endpoint "GET" "/api/weekly-actions/dashboard" "true" "GET /api/weekly-actions/dashboard (deprecated)"
test_endpoint "GET" "/api/weekly-actions/current" "true" "GET /api/weekly-actions/current"
test_endpoint "PATCH" "/api/weekly-actions/test-id/progress" "true" "PATCH /api/weekly-actions/:id/progress"
echo ""

# Biomarker endpoints
echo "🧬 Biomarker Endpoints"
echo "----------------------"
test_endpoint "GET" "/api/biomarkers/history" "true" "GET /api/biomarkers/history"
test_endpoint "GET" "/api/biomarkers/HDL/history" "true" "GET /api/biomarkers/:biomarker/history"
echo ""

# Weekly Transition endpoints
echo "🔄 Weekly Transition Endpoints"
echo "------------------------------"
test_endpoint "GET" "/api/weekly-transition" "true" "GET /api/weekly-transition"
test_endpoint "POST" "/api/weekly-transition/confirm" "true" "POST /api/weekly-transition/confirm"
test_endpoint "POST" "/api/weekly-transition/dismiss" "true" "POST /api/weekly-transition/dismiss"
echo ""

echo "=================================="
echo "✅ Verificación completada"
echo ""

if [ -z "$TOKEN" ]; then
    echo "${YELLOW}💡 Consejo:${NC} Para probar endpoints autenticados, ejecuta:"
    echo "   1. Crea un usuario o haz login"
    echo "   2. Copia el token JWT"
    echo "   3. Ejecuta: ./scripts/verify-api-routes.sh 'TU_TOKEN_AQUI'"
    echo ""
fi
