#!/bin/bash

# GULA - Start Script
# Inicia backend y frontend simultáneamente

echo "🚀 Iniciando GULA..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturar Ctrl+C
trap cleanup INT TERM

# Iniciar backend
echo -e "${BLUE}📦 Iniciando backend...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend inicie
sleep 2

# Iniciar frontend
echo -e "${GREEN}🌐 Iniciando frontend...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}✅ Servidores iniciados!${NC}"
echo -e "${BLUE}Backend: http://localhost:3001${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

# Esperar a que terminen
wait

