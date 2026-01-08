# FIX: CONEXIÓN FRONTEND → BACKEND

## PROBLEMA DIAGNOSTICADO

**Error:** `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Causa raíz:**
- Frontend intentaba llamar a rutas relativas que no existen
- Next.js devolvía HTML 404 en lugar de JSON
- El navegador tenía código cacheado

---

## SOLUCIÓN IMPLEMENTADA

### 1. ✅ API Base URL Configurada

**Archivo:** `/frontend/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

**Todas las llamadas usan esta base:**
- `${API_BASE_URL}/auth/signup` → `http://localhost:3001/api/auth/signup`
- `${API_BASE_URL}/auth/login` → `http://localhost:3001/api/auth/login`
- `${API_BASE_URL}/dashboard` → `http://localhost:3001/api/dashboard`

### 2. ✅ Validación de Content-Type

**Agregado en authAPI.signup y authAPI.login:**

```typescript
// Validar que la respuesta sea JSON
const contentType = response.headers.get('content-type');
if (!contentType?.includes('application/json')) {
  throw new Error('Respuesta inválida del servidor. Asegúrate de que el backend esté corriendo en el puerto correcto.');
}
```

**Beneficio:** Error claro en lugar de "Unexpected token"

### 3. ✅ Variable de Entorno

**Archivo:** `/frontend/.env.local` (NUEVO)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Nota:** Next.js requiere reinicio para detectar nuevos archivos `.env`

---

## HEADERS OBLIGATORIOS (YA IMPLEMENTADOS)

Todas las llamadas incluyen:

```typescript
headers: {
  'Content-Type': 'application/json',
}
```

Para llamadas autenticadas:

```typescript
headers: {
  ...getAuthHeaders(), // Agrega Authorization: Bearer <token>
  'Content-Type': 'application/json',
}
```

---

## ENDPOINTS VERIFICADOS

### ✅ POST /api/auth/signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"password123","age":30,"sex":"M"}'

# Respuesta: 201 Created
# { "token": "...", "user": {...} }
```

### ✅ Backend corriendo
```
🚀 GULA Backend running on port 3001
[Cron] Cron jobs initialized
```

---

## PASOS PARA APLICAR EL FIX

### 1️⃣ Reiniciar el servidor de desarrollo

El archivo `.env.local` es nuevo, Next.js necesita reiniciarse:

```bash
# Detener el servidor actual (Ctrl+C en la terminal)
# Luego:
npm run dev
```

### 2️⃣ Limpiar caché del navegador

**Opción A: Recarga forzada**
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

**Opción B: Limpiar manualmente**
1. Abrir DevTools (F12)
2. Application → Local Storage → `http://localhost:3000`
3. Click derecho → Clear
4. Recargar página

### 3️⃣ Probar signup

1. Ir a http://localhost:3000/signup
2. Completar formulario
3. Click "Crear Cuenta"

**Resultado esperado:**
- ✅ Network tab muestra: `POST http://localhost:3001/api/auth/signup → 201`
- ✅ Response es JSON con `token` y `user`
- ✅ Redirección a `/dashboard`
- ✅ NO aparece error de "Unexpected token"

---

## VERIFICACIÓN EN NETWORK TAB

Abre DevTools → Network → XHR/Fetch:

### ✅ Request correcto:
```
POST http://localhost:3001/api/auth/signup
Status: 201 Created
Content-Type: application/json

Request Headers:
  Content-Type: application/json

Request Payload:
{
  "email": "test@test.com",
  "name": "Test User",
  "password": "password123",
  "age": 30,
  "sex": "M"
}

Response:
{
  "token": "eyJhbGci...",
  "user": {
    "id": "user_...",
    "email": "test@test.com",
    "name": "Test User"
  }
}
```

### ❌ Request incorrecto (antes del fix):
```
POST http://localhost:3000/signup
Status: 404 Not Found
Content-Type: text/html

Response:
<!DOCTYPE html>
<html>...
```

---

## CRITERIOS DE ACEPTACIÓN

- [x] API_BASE_URL apunta a `http://localhost:3001/api`
- [x] Todas las llamadas usan `${API_BASE_URL}/...`
- [x] Headers incluyen `Content-Type: application/json`
- [x] Validación de Content-Type antes de parsear JSON
- [x] Backend verificado funcionando (curl test exitoso)
- [x] Variable de entorno `.env.local` creada
- [ ] **PENDIENTE:** Reiniciar servidor de desarrollo
- [ ] **PENDIENTE:** Limpiar caché del navegador
- [ ] **PENDIENTE:** Probar signup end-to-end

---

## TROUBLESHOOTING

### Error persiste después del fix

**1. Verificar que el backend esté corriendo:**
```bash
curl http://localhost:3001/api/auth/signup
# Debe devolver error de validación (esperado sin body)
# NO debe devolver "Connection refused"
```

**2. Verificar puerto del backend:**
```bash
lsof -i :3001
# Debe mostrar proceso node/tsx
```

**3. Verificar que Next.js recargó el .env:**
```bash
# En la consola del navegador:
console.log(process.env.NEXT_PUBLIC_API_URL)
# Debe mostrar: undefined (porque es server-side)

# Verificar en Network tab que las llamadas vayan a localhost:3001
```

**4. Limpiar todo y empezar de cero:**
```bash
# Detener todos los servidores
pkill -f "npm run dev"

# Limpiar caché de Next.js
rm -rf frontend/.next

# Reiniciar
npm run dev
```

---

## RESUMEN

**Problema:** Frontend llamaba a URLs relativas que no existen  
**Solución:** Configurar API_BASE_URL apuntando al backend en puerto 3001  
**Estado:** Código corregido, **requiere reinicio del servidor**  

**Próximo paso:** Reiniciar `npm run dev` y probar signup con caché limpio.
