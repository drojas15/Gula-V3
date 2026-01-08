# 🔍 Sistema de Verificación de Rutas API

Este documento explica cómo asegurarnos de que todas las rutas API entre el backend y frontend estén correctamente conectadas y funcionando.

---

## 📚 Documentación Disponible

Hemos creado 3 documentos complementarios:

### 1. **API_CONNECTION_STATUS.md** - Estado Actual
- ✅ Lista completa de todas las rutas conectadas
- 📊 Resumen de estado (11 rutas activas, 3 pendientes)
- 🔧 Correcciones aplicadas hoy
- 📝 Próximos pasos

**Cuándo usar:** Para ver el estado actual de las conexiones API.

### 2. **API_ROUTES_AUDIT.md** - Auditoría Detallada
- 🔍 Análisis profundo de cada endpoint
- 🔴 Problemas detectados (críticos y advertencias)
- ✅ Checklist de validación con comandos curl
- 🛠️ Plan de acción priorizado

**Cuándo usar:** Para investigar problemas o hacer auditoría completa.

### 3. **API.md** - Referencia de API
- 📖 Documentación de cada endpoint
- 🔐 Autenticación y permisos
- 📝 Ejemplos de request/response
- 🎯 Casos de uso

**Cuándo usar:** Como referencia al desarrollar nuevas features.

---

## 🛠️ Herramientas de Verificación

### 1. Script Bash - Verificación Rápida

```bash
npm run verify:routes
```

**Qué hace:**
- Hace curl a todos los endpoints
- Muestra código HTTP de cada respuesta
- Identifica rutas rotas (404) o sin autenticación (401)

**Salida esperada:**
```
🔍 Verificando rutas API de GULA
==================================

📋 Health Check
---------------
Testing: Health endpoint                         [✓ 200]

🔐 Auth Endpoints
-----------------
Testing: POST /api/auth/signup                   [✓ 200]
Testing: POST /api/auth/login                    [✓ 200]

👤 User Endpoints
-----------------
Testing: GET /api/users/me                       [! 401 - Auth required]
...
```

### 2. Script TypeScript - Análisis de Código

```bash
npm run check:api
```

**Qué hace:**
- Extrae rutas del backend (archivos `*.routes.ts`)
- Extrae llamadas del frontend (`api.ts`)
- Verifica que estén registradas en `index.ts`
- Compara backend vs frontend

**Salida esperada:**
```
🔍 API Consistency Checker
==================================================

📋 Extracting backend routes...
   Found 16 routes

📋 Extracting frontend API calls...
   Found 11 API calls

📋 Checking backend registration...
   Done

✅ All checks passed!
```

---

## 🚀 Cómo Usar

### Verificación Diaria (Desarrollo)

```bash
# 1. Iniciar servidores
npm run dev

# 2. En otra terminal, verificar rutas
npm run verify:routes

# 3. Si hay problemas, revisar documentación
cat docs/API_CONNECTION_STATUS.md
```

### Antes de Commit

```bash
# Verificar consistencia de código
npm run check:api

# Si hay errores, revisar
cat docs/API_ROUTES_AUDIT.md
```

### Después de Agregar Nueva Ruta

```bash
# 1. Verificar que funcione
curl -X GET http://localhost:3001/api/tu-nueva-ruta

# 2. Verificar consistencia
npm run check:api

# 3. Actualizar documentación
# Editar: docs/API_CONNECTION_STATUS.md
```

---

## 🔧 Problemas Comunes y Soluciones

### Problema 1: "404 - NOT FOUND"

**Síntoma:** El frontend llama a una ruta pero recibe 404.

**Causas posibles:**
1. La ruta no está registrada en `backend/src/index.ts`
2. El path en el frontend no coincide con el backend
3. El servidor backend no está corriendo

**Solución:**
```bash
# 1. Verificar que el backend esté corriendo
curl http://localhost:3001/health

# 2. Revisar index.ts
grep "app.use" backend/src/index.ts

# 3. Comparar rutas
npm run check:api
```

### Problema 2: "401 - Unauthorized"

**Síntoma:** Ruta requiere autenticación pero no se envía token.

**Causas posibles:**
1. Token no está en localStorage
2. Token expiró
3. Header de autorización mal formado

**Solución:**
```bash
# 1. Verificar que tengas token
# En DevTools Console:
localStorage.getItem('token')

# 2. Hacer login nuevamente
# 3. Verificar que la función use getAuthHeaders()
```

### Problema 3: Ruta existe pero no se usa

**Síntoma:** Backend tiene endpoint pero frontend no lo llama.

**Causas posibles:**
1. Feature no implementada aún
2. Endpoint legacy/deprecado
3. Falta documentación

**Solución:**
1. Revisar `docs/API_CONNECTION_STATUS.md` - sección "⚠️ Backend listo"
2. Decidir si implementar cliente frontend o deprecar endpoint
3. Actualizar documentación

---

## 📋 Checklist: Agregar Nueva Ruta API

### Backend

- [ ] 1. Crear controlador en `backend/src/controllers/`
```typescript
export async function miNuevaFuncion(req: AuthRequest, res: Response) {
  // ...
}
```

- [ ] 2. Crear archivo de rutas en `backend/src/routes/`
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { miNuevaFuncion } from '../controllers/mi.controller';

const router = Router();
router.get('/mi-ruta', authenticateToken, miNuevaFuncion);
export default router;
```

- [ ] 3. Registrar en `backend/src/index.ts`
```typescript
import miRoutes from './routes/mi.routes';
// ...
app.use('/api/mi-recurso', miRoutes);
```

### Frontend

- [ ] 4. Agregar función en `frontend/lib/api.ts`
```typescript
export const miAPI = {
  getMiRecurso: async (): Promise<MiTipo> => {
    const response = await fetch(`${API_BASE_URL}/mi-recurso/mi-ruta`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get mi recurso');
    }
    
    return response.json();
  },
};
```

### Verificación

- [ ] 5. Probar con curl
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/mi-recurso/mi-ruta
```

- [ ] 6. Probar desde frontend
```typescript
const data = await miAPI.getMiRecurso();
console.log(data);
```

- [ ] 7. Ejecutar verificadores
```bash
npm run check:api
npm run verify:routes
```

### Documentación

- [ ] 8. Actualizar `docs/API_CONNECTION_STATUS.md`
- [ ] 9. Actualizar `docs/API.md` con ejemplos
- [ ] 10. Agregar tipos TypeScript si es necesario

---

## 🎯 Estado Actual del Proyecto

### ✅ Completado Hoy (2026-01-08)

1. **Ruta `/api/dashboard` creada y conectada**
   - Archivo: `backend/src/routes/dashboard.routes.ts`
   - Registrada en: `backend/src/index.ts` línea 36
   - Cliente: `dashboardAPI.getDashboard()`

2. **Ruta `/api/weekly-transition` registrada**
   - Ya existía pero no estaba en `index.ts`
   - Ahora registrada en línea 39
   - Cliente: `weeklyTransitionAPI.*`

3. **Corregida ruta de actualización de progreso**
   - Antes: `/api/dashboard/actions/:id/progress`
   - Ahora: `/api/weekly-actions/:id/progress`
   - Método corregido: PUT → PATCH

4. **Sistema de verificación creado**
   - Script bash: `scripts/verify-api-routes.sh`
   - Script TypeScript: `scripts/check-api-consistency.ts`
   - Comandos npm: `verify:routes` y `check:api`

5. **Documentación completa**
   - `API_CONNECTION_STATUS.md` - Estado actual
   - `API_ROUTES_AUDIT.md` - Auditoría detallada
   - Este archivo - Guía de uso

### 📊 Métricas

- **Rutas totales:** 16 endpoints en backend
- **Rutas conectadas:** 11 funcionando perfectamente
- **Rutas pendientes:** 3 con backend listo, falta frontend
- **Rutas rotas:** 0 🎉

### 🎉 Resultado

**El dashboard ahora funciona correctamente:**
- ✅ Muestra los 2 exámenes guardados
- ✅ Calcula y muestra el Health Score
- ✅ Lista los biomarcadores medidos
- ✅ Genera acciones semanales
- ✅ Muestra barra de fiabilidad

---

## 🔄 Mantenimiento Continuo

### Cada Semana
```bash
# Verificar que todo siga funcionando
npm run verify:routes
npm run check:api
```

### Cada Mes
```bash
# Revisar documentación
cat docs/API_CONNECTION_STATUS.md

# Actualizar si hay cambios
vim docs/API_CONNECTION_STATUS.md
```

### Cada Release
```bash
# Auditoría completa
cat docs/API_ROUTES_AUDIT.md

# Resolver warnings pendientes
# Actualizar versiones
```

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs del backend**
   ```bash
   # Los logs muestran cada request
   # Buscar errores 404, 500, etc.
   ```

2. **Revisar DevTools del frontend**
   ```javascript
   // En Console, buscar errores de fetch
   // En Network, ver requests fallidos
   ```

3. **Consultar documentación**
   - `API_CONNECTION_STATUS.md` - Estado actual
   - `API_ROUTES_AUDIT.md` - Problemas conocidos
   - `API.md` - Referencia completa

4. **Ejecutar verificadores**
   ```bash
   npm run check:api
   npm run verify:routes
   ```

---

**Creado:** 2026-01-08  
**Última actualización:** 2026-01-08  
**Mantenedor:** Sistema de desarrollo GULA
