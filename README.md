# GULA - Health Decision-Support System

## 🚀 Inicio Rápido

### Opción 1: Script NPM (Recomendado)

```bash
# Instalar dependencias (solo la primera vez)
npm run install:all

# Iniciar backend y frontend simultáneamente
npm run dev
```

### Opción 2: Script Bash

```bash
# Dar permisos de ejecución (solo la primera vez)
chmod +x start.sh

# Iniciar ambos servidores
./start.sh
```

### Opción 3: Manual

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Backend:** http://localhost:3001  
**Frontend:** http://localhost:3000

---

# GULA - Health Decision-Support System

Sistema de soporte para decisiones de salud preventivo que convierte PDFs de exámenes médicos en prioridades de salud accionables.

## Principios Core (NO NEGOCIABLES)
- NO diagnosticamos
- NO reemplazamos doctores
- NO recomendamos medicamentos o dosis
- SOLO proporcionamos recomendaciones de estilo de vida accionables
- Claridad vence a completitud
- Si el usuario sabe qué hacer esta semana, ganamos

## Stack Tecnológico

### Frontend
- Next.js 14+ con App Router
- React 18+
- TypeScript (modo estricto)
- Tailwind CSS
- i18n (es-LATAM por defecto, en-US futuro)

### Backend
- Node.js + Express
- TypeScript (modo estricto)
- REST API stateless
- JWT para autenticación
- PostgreSQL para almacenamiento
- pdf-parse para parsing de PDFs

## Estructura del Proyecto

```
gula/
├── frontend/          # Next.js App Router
├── backend/           # Express + TypeScript
└── docs/              # Documentación
```

## Desarrollo

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Notas Importantes

- El backend NUNCA retorna texto legible por humanos - solo keys
- El frontend NUNCA calcula lógica médica - solo muestra
- Toda la lógica de biomarcadores en inglés (código, keys, comentarios)
- Todo el contenido para usuarios en español LATAM

