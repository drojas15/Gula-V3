# GUÍA RÁPIDA DE TESTING - AUTENTICACIÓN

## 🧪 TESTS OBLIGATORIOS

### TEST 1: SIGNUP COMPLETO ✅

**Pasos:**
1. Abrir http://localhost:3000/signup
2. Llenar formulario:
   - Nombre: "Usuario Test"
   - Email: "test@example.com"
   - Contraseña: "password123"
   - Edad: 30
   - Sexo: Masculino
3. Click "Crear Cuenta"

**Resultado esperado:**
- ✅ Redirección automática a `/dashboard`
- ✅ Header muestra: "Bienvenido, Usuario Test"
- ✅ Botón "Cerrar Sesión" visible

**Verificar en DevTools (F12 → Application → Local Storage):**
```
auth_token: "eyJhbGci..."
token: "eyJhbGci..."
user: {"id":"user_...","email":"test@example.com","name":"Usuario Test"}
```

---

### TEST 2: LOGIN COMPLETO ✅

**Preparación:**
- Usar el usuario creado en Test 1
- O crear uno nuevo

**Pasos:**
1. Abrir http://localhost:3000/login
2. Ingresar credenciales:
   - Email: "test@example.com"
   - Contraseña: "password123"
3. Click "Iniciar Sesión"

**Resultado esperado:**
- ✅ Redirección automática a `/dashboard`
- ✅ Dashboard carga correctamente
- ✅ Nombre del usuario visible

---

### TEST 3: SESIÓN PERSISTENTE ✅

**Pasos:**
1. Hacer login exitoso (Test 2)
2. **Cerrar completamente el navegador**
3. Abrir navegador de nuevo
4. Ir a http://localhost:3000/dashboard

**Resultado esperado:**
- ✅ Dashboard carga sin pedir login
- ✅ Usuario sigue autenticado
- ✅ localStorage aún tiene auth_token y user

**SI FALLA:**
- Verificar localStorage antes de cerrar (debe tener datos)
- Usar navegador normal (NO modo incógnito)

---

### TEST 4: PROTECCIÓN DE RUTAS ✅

**Pasos:**
1. Abrir navegador en **modo incógnito**
2. Ir directamente a http://localhost:3000/dashboard

**Resultado esperado:**
- ✅ Redirección automática a `/login`
- ✅ URL incluye: `/login?returnUrl=/dashboard`
- ✅ NO muestra el dashboard

**Luego:**
4. Hacer login desde esa página
5. ✅ Debe redirigir a `/dashboard` (returnUrl)

---

### TEST 5: LOGOUT ✅

**Pasos:**
1. Estar logueado en `/dashboard`
2. Click en botón "Cerrar Sesión" (arriba a la derecha)

**Resultado esperado:**
- ✅ Redirección inmediata a `/login`
- ✅ localStorage vacío (sin auth_token ni user)

**Verificar:**
4. Intentar ir manualmente a `/dashboard`
5. ✅ Debe redirigir de nuevo a `/login`

---

## 🔍 VERIFICACIONES EN NETWORK TAB

### Signup Request
```
POST http://localhost:3001/api/auth/signup
Status: 201 Created

Request:
{
  "email": "test@example.com",
  "name": "Usuario Test",
  "password": "password123",
  "age": 30,
  "sex": "M"
}

Response:
{
  "token": "eyJhbGci...",
  "user": {
    "id": "user_...",
    "email": "test@example.com",
    "name": "Usuario Test"
  }
}
```

### Login Request
```
POST http://localhost:3001/api/auth/login
Status: 200 OK

Request:
{
  "email": "test@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGci...",
  "user": {
    "id": "user_...",
    "email": "test@example.com",
    "name": "Usuario Test"
  }
}
```

---

## ❌ ERRORES COMUNES

### Error: "Respuesta inválida del servidor"

**Causa:** Backend no está corriendo

**Solución:**
```bash
# Verificar que backend esté corriendo
lsof -i :3001

# Si no está, iniciar:
cd /Users/dr/Gula\ V3
npm run dev
```

---

### Error: "useAuth must be used within an AuthProvider"

**Causa:** AuthProvider no envuelve la app

**Solución:**
- Verificar que `/frontend/app/layout.tsx` incluye `<ClientProviders>`
- Reiniciar servidor de desarrollo

---

### Sesión no persiste (Test 3 falla)

**Causa:** localStorage no se está guardando

**Diagnóstico:**
1. Abrir DevTools → Application → Local Storage
2. Verificar que `auth_token` y `user` existen después de login

**Soluciones:**
- NO usar modo incógnito para este test
- Verificar que el navegador no está bloqueando localStorage
- Limpiar cookies/caché y reintentar

---

### Redirección infinita en /login

**Causa:** ProtectedRoute envolviendo rutas públicas

**Solución:**
- Verificar que `/login` y `/signup` NO están envueltos en `<ProtectedRoute>`
- Solo `/dashboard` debe estar protegido

---

### Dashboard no muestra nombre del usuario

**Causa:** `user` no se está guardando en localStorage

**Diagnóstico:**
```bash
# En DevTools Console:
console.log(localStorage.getItem('user'));
// Debe mostrar: {"id":"...","email":"...","name":"..."}
```

**Solución:**
- Hacer logout
- Login de nuevo
- Verificar Network tab que response incluye `user`

---

## ✅ CHECKLIST DE ACEPTACIÓN

Marca cada uno después de probar:

- [ ] Signup crea usuario y redirige a dashboard
- [ ] Login autentica y redirige a dashboard
- [ ] Sesión persiste después de cerrar navegador
- [ ] Dashboard protegido (redirige a login si no autenticado)
- [ ] Logout limpia sesión y redirige a login
- [ ] localStorage guarda `auth_token` y `user` después de login
- [ ] localStorage se limpia después de logout
- [ ] Header del dashboard muestra nombre del usuario
- [ ] Botón "Cerrar Sesión" funciona
- [ ] Errores de login/signup se muestran claramente
- [ ] Network tab muestra requests correctos a `/api/auth/*`

---

## 🚀 COMANDOS ÚTILES

### Limpiar localStorage (para testing)
```javascript
// En DevTools Console:
localStorage.clear();
// Luego recargar página
```

### Verificar estado de auth
```javascript
// En DevTools Console:
console.log({
  token: localStorage.getItem('auth_token'),
  user: JSON.parse(localStorage.getItem('user') || 'null')
});
```

### Verificar backend
```bash
# Backend corriendo?
lsof -i :3001

# Probar signup manualmente
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"curl@test.com","name":"Curl Test","password":"password123","age":30,"sex":"M"}'
```

---

## 📊 ESTADO ESPERADO DESPUÉS DE TESTS

### localStorage (después de login)
```
✅ auth_token = "eyJhbGci..."
✅ token = "eyJhbGci..."
✅ user = {"id":"user_...","email":"...","name":"..."}
```

### localStorage (después de logout)
```
✅ (vacío)
```

### Rutas accesibles SIN login
```
✅ / (homepage)
✅ /signup
✅ /login
```

### Rutas PROTEGIDAS (requieren login)
```
🔒 /dashboard → redirige a /login si no autenticado
🔒 /upload → redirige a /login si no autenticado
```

---

## 🎯 CRITERIOS DE ÉXITO

**El sistema de autenticación está completo si:**
1. Puedes crear una cuenta sin errores
2. Puedes hacer login sin errores
3. La sesión persiste después de cerrar el navegador
4. No puedes acceder al dashboard sin estar logueado
5. El logout funciona y limpia todo correctamente

**Si todos los tests pasan → ✅ AUTENTICACIÓN COMPLETADA**
