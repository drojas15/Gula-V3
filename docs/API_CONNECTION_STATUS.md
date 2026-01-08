# Estado de Conexión API - Backend ↔️ Frontend

**Última verificación:** 2026-01-08  
**Estado general:** 🟢 OPERATIVO

---

## ✅ Rutas Conectadas y Funcionando

### 1. Autenticación (`/api/auth`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/auth/signup` | POST | ✅ `authAPI.signup()` | ✅ `auth.routes.ts` | 🟢 OK |
| `/api/auth/login` | POST | ✅ `authAPI.login()` | ✅ `auth.routes.ts` | 🟢 OK |

### 2. Exámenes (`/api/exams`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/exams/upload` | POST | ✅ `examAPI.upload()` | ✅ `exam.routes.ts` | 🟢 OK |
| `/api/exams` | GET | ✅ `examAPI.list()` | ✅ `exam.routes.ts` | 🟢 OK |
| `/api/exams/:examId` | GET | ✅ `examAPI.getById()` | ✅ `exam.routes.ts` | 🟢 OK |

### 3. Usuario (`/api/users`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/users/me` | GET | ✅ `userAPI.getMe()` | ✅ `user.routes.ts` | 🟢 OK |

### 4. Dashboard (`/api/dashboard`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/dashboard` | GET | ✅ `dashboardAPI.getDashboard()` | ✅ `dashboard.routes.ts` | 🟢 OK |

### 5. Acciones Semanales (`/api/weekly-actions`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/weekly-actions/:id/progress` | PATCH | ✅ `dashboardAPI.updateActionProgress()` | ✅ `weekly-actions.routes.ts` | 🟢 OK |
| `/api/weekly-actions/current` | GET | ❌ No implementado | ✅ `weekly-actions.routes.ts` | ⚠️ Backend listo |
| `/api/weekly-actions/dashboard` | GET | ❌ No usado | ✅ `weekly-actions.routes.ts` | ⚠️ Redundante con `/api/dashboard` |

### 6. Transición Semanal (`/api/weekly-transition`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/weekly-transition` | GET | ✅ `weeklyTransitionAPI.getTransitionData()` | ✅ `weekly-transition.routes.ts` | 🟢 OK |
| `/api/weekly-transition/confirm` | POST | ✅ `weeklyTransitionAPI.confirmTransition()` | ✅ `weekly-transition.routes.ts` | 🟢 OK |
| `/api/weekly-transition/dismiss` | POST | ✅ `weeklyTransitionAPI.dismissTransition()` | ✅ `weekly-transition.routes.ts` | 🟢 OK |

### 7. Historial de Biomarcadores (`/api/biomarkers`)

| Endpoint | Método | Frontend | Backend | Status |
|----------|--------|----------|---------|--------|
| `/api/biomarkers/history` | GET | ❌ No implementado | ✅ `biomarker-history.routes.ts` | ⚠️ Backend listo |
| `/api/biomarkers/:biomarker/history` | GET | ❌ No implementado | ✅ `biomarker-history.routes.ts` | ⚠️ Backend listo |

---

## 📊 Resumen de Estado

### Conexiones Activas
- ✅ **11 endpoints** completamente conectados y funcionando
- ⚠️ **3 endpoints** con backend listo pero sin cliente frontend
- 🔴 **0 endpoints** rotos o con problemas críticos

### Registro en Backend (`backend/src/index.ts`)
```typescript
✅ app.use('/api/auth', authRoutes);                    // Línea 33
✅ app.use('/api/exams', examRoutes);                   // Línea 34
✅ app.use('/api/users', userRoutes);                   // Línea 35
✅ app.use('/api/dashboard', dashboardRoutes);          // Línea 36
✅ app.use('/api/weekly-actions', weeklyActionsRoutes); // Línea 37
✅ app.use('/api/biomarkers', biomarkerHistoryRoutes);  // Línea 38
✅ app.use('/api/weekly-transition', weeklyTransitionRoutes); // Línea 39
```

### Clientes Frontend (`frontend/lib/api.ts`)
```typescript
✅ authAPI              // Líneas 44-124
✅ userAPI              // Líneas 141-157
✅ examAPI              // Líneas 172-227
✅ dashboardAPI         // Líneas 264-300
✅ weeklyTransitionAPI  // Líneas 325-382
```

---

## 🔧 Correcciones Aplicadas Hoy

### ✅ Problema 1: Ruta `/api/dashboard` faltante
- **Antes:** El dashboard solo estaba en `/api/weekly-actions/dashboard`
- **Después:** Creado `dashboard.routes.ts` y registrado en `/api/dashboard`
- **Commit:** Creación de archivo y registro en index.ts

### ✅ Problema 2: Ruta `/api/weekly-transition` no registrada
- **Antes:** El archivo existía pero no estaba en `index.ts`
- **Después:** Registrado correctamente en línea 39
- **Commit:** Agregado import y app.use()

### ✅ Problema 3: Ruta incorrecta para actualizar progreso
- **Antes:** Frontend llamaba a `/api/dashboard/actions/:id/progress`
- **Después:** Corregido a `/api/weekly-actions/:id/progress`
- **Commit:** Actualizado `frontend/lib/api.ts` línea 285

---

## 🧪 Cómo Verificar las Rutas

### Opción 1: Script Bash (Rápido)
```bash
npm run verify:routes
```

Este script hace curl a todos los endpoints y muestra el código HTTP de respuesta.

### Opción 2: Script TypeScript (Detallado)
```bash
npm run check:api
```

Este script analiza el código fuente y verifica que:
- Todas las rutas del backend estén registradas en `index.ts`
- Todas las llamadas del frontend tengan un endpoint correspondiente
- Los controladores existan

### Opción 3: Manual con curl
```bash
# 1. Obtener token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  | jq -r '.token')

# 2. Probar dashboard
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/dashboard

# 3. Probar exámenes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/exams
```

---

## 📝 Próximos Pasos (Backlog)

### Prioridad Media
1. Implementar cliente frontend para `/api/biomarkers/history`
2. Implementar cliente frontend para `/api/weekly-actions/current`
3. Agregar endpoint `PATCH /api/users/me` al frontend (`userAPI.updateMe()`)

### Prioridad Baja
4. Deprecar `/api/weekly-actions/dashboard` (redundante)
5. Agregar tests de integración E2E
6. Documentar tipos TypeScript compartidos
7. Crear OpenAPI/Swagger spec

---

## 🛡️ Garantía de Calidad

### Checklist de Nueva Ruta
Cuando agregues una nueva ruta API, sigue estos pasos:

- [ ] 1. Crear archivo de rutas en `backend/src/routes/`
- [ ] 2. Importar en `backend/src/index.ts`
- [ ] 3. Registrar con `app.use()` en `backend/src/index.ts`
- [ ] 4. Crear función cliente en `frontend/lib/api.ts`
- [ ] 5. Agregar tipos TypeScript en ambos lados
- [ ] 6. Probar con curl o Postman
- [ ] 7. Probar desde el frontend
- [ ] 8. Actualizar este documento
- [ ] 9. Ejecutar `npm run check:api`

### Monitoreo Continuo
```bash
# Ejecutar antes de cada commit
npm run check:api

# Ejecutar después de cambios en rutas
npm run verify:routes
```

---

**Mantenido por:** Sistema de desarrollo  
**Última actualización:** 2026-01-08  
**Próxima revisión:** Cuando se agreguen nuevas rutas
