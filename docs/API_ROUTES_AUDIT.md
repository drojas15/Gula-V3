# API Routes Audit - Backend ↔️ Frontend

**Última actualización:** 2026-01-08

Este documento mapea todas las rutas API entre el backend y el frontend para asegurar que estén correctamente conectadas.

## ✅ Estado General

| Backend Route | Frontend Client | Status | Notas |
|--------------|----------------|---------|-------|
| ✅ Registradas | ✅ Implementadas | 🟢 COMPLETO | Todas las rutas conectadas |

---

## 📋 Inventario de Rutas

### 1️⃣ **AUTH API** - `/api/auth`

**Backend:** `backend/src/routes/auth.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → `authAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| POST | `/api/auth/signup` | `authAPI.signup()` | ✅ Conectado |
| POST | `/api/auth/login` | `authAPI.login()` | ✅ Conectado |
| - | - | `authAPI.logout()` | ✅ Local only |

**Registrado en backend:** ✅ `app.use('/api/auth', authRoutes)` - línea 33

---

### 2️⃣ **EXAMS API** - `/api/exams`

**Backend:** `backend/src/routes/exam.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → `examAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| POST | `/api/exams/upload` | `examAPI.upload()` | ✅ Conectado |
| GET | `/api/exams` | `examAPI.list()` | ✅ Conectado |
| GET | `/api/exams/:examId` | `examAPI.getById()` | ✅ Conectado |

**Registrado en backend:** ✅ `app.use('/api/exams', examRoutes)` - línea 34

---

### 3️⃣ **USERS API** - `/api/users`

**Backend:** `backend/src/routes/user.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → `userAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| GET | `/api/users/me` | `userAPI.getMe()` | ✅ Conectado |
| PATCH | `/api/users/me` | ❌ No implementado | ⚠️ Backend listo, falta frontend |

**Registrado en backend:** ✅ `app.use('/api/users', userRoutes)` - línea 35

**⚠️ NOTA:** El endpoint PATCH `/api/users/me` existe en el backend pero no tiene cliente en el frontend.

---

### 4️⃣ **DASHBOARD API** - `/api/dashboard`

**Backend:** `backend/src/routes/dashboard.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → `dashboardAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| GET | `/api/dashboard` | `dashboardAPI.getDashboard()` | ✅ Conectado |
| PUT | `/api/dashboard/actions/:actionId/progress` | `dashboardAPI.updateActionProgress()` | ⚠️ Ver nota |

**Registrado en backend:** ✅ `app.use('/api/dashboard', dashboardRoutes)` - línea 36

**⚠️ NOTA:** El endpoint de `updateActionProgress` está implementado en el frontend pero la ruta real está en `/api/weekly-actions/:weeklyActionId/progress` (ver sección 5).

---

### 5️⃣ **WEEKLY ACTIONS API** - `/api/weekly-actions`

**Backend:** `backend/src/routes/weekly-actions.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → Integrado en `dashboardAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| GET | `/api/weekly-actions/dashboard` | ❌ No usado directamente | ⚠️ Duplicado con `/api/dashboard` |
| GET | `/api/weekly-actions/current` | ❌ No implementado | ⚠️ Backend listo, falta frontend |
| PATCH | `/api/weekly-actions/:weeklyActionId/progress` | `dashboardAPI.updateActionProgress()` | 🔴 DESCONEXIÓN |

**Registrado en backend:** ✅ `app.use('/api/weekly-actions', weeklyActionsRoutes)` - línea 37

**🔴 PROBLEMA DETECTADO:** 
- Frontend llama a `/api/dashboard/actions/:actionId/progress`
- Backend espera `/api/weekly-actions/:weeklyActionId/progress`
- **Acción requerida:** Corregir la ruta en el frontend

---

### 6️⃣ **BIOMARKERS API** - `/api/biomarkers`

**Backend:** `backend/src/routes/biomarker-history.routes.ts`  
**Frontend:** ❌ No implementado

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| GET | `/api/biomarkers/:biomarker/history` | ❌ No implementado | ⚠️ Backend listo, falta frontend |
| GET | `/api/biomarkers/history` | ❌ No implementado | ⚠️ Backend listo, falta frontend |

**Registrado en backend:** ✅ `app.use('/api/biomarkers', biomarkerHistoryRoutes)` - línea 38

**⚠️ NOTA:** Estas rutas están listas en el backend pero no tienen cliente en el frontend. Serán necesarias para gráficas históricas de biomarcadores.

---

### 7️⃣ **WEEKLY TRANSITION API** - `/api/weekly-transition`

**Backend:** `backend/src/routes/weekly-transition.routes.ts`  
**Frontend:** `frontend/lib/api.ts` → `weeklyTransitionAPI`

| Método | Ruta Backend | Función Frontend | Status |
|--------|--------------|------------------|---------|
| GET | `/api/weekly-transition` | `weeklyTransitionAPI.getTransitionData()` | ✅ Conectado |
| POST | `/api/weekly-transition/confirm` | `weeklyTransitionAPI.confirmTransition()` | ✅ Conectado |
| POST | `/api/weekly-transition/dismiss` | `weeklyTransitionAPI.dismissTransition()` | ✅ Conectado |

**Registrado en backend:** ❌ **NO REGISTRADO EN `index.ts`**

**🔴 PROBLEMA CRÍTICO:** La ruta `weekly-transition.routes.ts` existe pero NO está registrada en `backend/src/index.ts`.

---

## 🔴 Problemas Detectados

### Críticos (Bloquean funcionalidad)

1. **Weekly Transition Routes NO registradas**
   - **Archivo:** `backend/src/routes/weekly-transition.routes.ts` existe
   - **Problema:** No está registrado en `backend/src/index.ts`
   - **Impacto:** Modal de transición semanal no funcionará
   - **Solución:** Agregar `app.use('/api/weekly-transition', weeklyTransitionRoutes)` en `index.ts`

2. **Ruta incorrecta para actualizar progreso de acciones**
   - **Frontend llama:** `/api/dashboard/actions/:actionId/progress`
   - **Backend espera:** `/api/weekly-actions/:weeklyActionId/progress`
   - **Impacto:** No se puede actualizar el progreso de acciones semanales
   - **Solución:** Corregir ruta en `frontend/lib/api.ts`

### Advertencias (Funcionalidad incompleta)

3. **Biomarker History API sin cliente frontend**
   - Rutas backend: `/api/biomarkers/:biomarker/history` y `/api/biomarkers/history`
   - No hay funciones en el frontend para consumir estos endpoints
   - Serán necesarias para gráficas históricas

4. **User Update sin cliente frontend**
   - Ruta backend: `PATCH /api/users/me`
   - No hay función en `userAPI` para actualizar perfil
   - Será necesaria para configuración de usuario

5. **Weekly Actions Current sin cliente frontend**
   - Ruta backend: `GET /api/weekly-actions/current`
   - No hay función en el frontend
   - Puede ser útil para obtener acciones actuales sin todo el dashboard

6. **Ruta duplicada para dashboard**
   - `/api/dashboard` (nueva, correcta)
   - `/api/weekly-actions/dashboard` (antigua, redundante)
   - Considerar deprecar la ruta antigua

---

## ✅ Checklist de Validación

Para verificar que todas las rutas funcionen correctamente:

```bash
# 1. Verificar que el backend esté corriendo
curl http://localhost:3001/health

# 2. Auth - Signup (sin autenticación)
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test","password":"12345678","age":30,"sex":"M"}'

# 3. Auth - Login (sin autenticación)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"12345678"}'

# Para las siguientes rutas, necesitas el token JWT:
# TOKEN="tu_token_aqui"

# 4. Users - Get Me
curl http://localhost:3001/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Exams - List
curl http://localhost:3001/api/exams \
  -H "Authorization: Bearer $TOKEN"

# 6. Dashboard - Get
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# 7. Weekly Transition - Get (FALLARÁ si no está registrada)
curl http://localhost:3001/api/weekly-transition \
  -H "Authorization: Bearer $TOKEN"

# 8. Biomarkers - History
curl http://localhost:3001/api/biomarkers/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Plan de Acción

### Prioridad Alta (Hacer ahora)

1. ✅ Registrar `weekly-transition.routes.ts` en `backend/src/index.ts`
2. ✅ Corregir ruta de actualización de progreso en `frontend/lib/api.ts`

### Prioridad Media (Próximas semanas)

3. Implementar cliente frontend para Biomarker History API
4. Implementar función `userAPI.updateMe()` en el frontend
5. Deprecar ruta `/api/weekly-actions/dashboard` en favor de `/api/dashboard`

### Prioridad Baja (Backlog)

6. Agregar tests de integración para todas las rutas
7. Documentar tipos TypeScript compartidos entre backend y frontend
8. Crear script automatizado de validación de rutas

---

## 🛠️ Mantenimiento

Cada vez que agregues una nueva ruta:

1. ✅ Crear el archivo de rutas en `backend/src/routes/`
2. ✅ Registrar en `backend/src/index.ts` con `app.use()`
3. ✅ Agregar cliente en `frontend/lib/api.ts`
4. ✅ Actualizar este documento
5. ✅ Probar con curl o Postman
6. ✅ Verificar en el frontend que funcione

---

**Última revisión:** 2026-01-08  
**Estado:** 🟡 Funcional con correcciones pendientes
