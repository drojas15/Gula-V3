# 🧪 CÓMO VERIFICAR EL AISLAMIENTO DE DATOS POR USUARIO

## Opción 1: Script Automatizado (Recomendado)

### Requisitos
- Backend corriendo en `http://localhost:8000`
- `jq` instalado (para parsear JSON)

```bash
# Instalar jq si no lo tienes
brew install jq  # macOS
# o
sudo apt-get install jq  # Linux
```

### Ejecutar tests

```bash
cd backend
./test-user-isolation.sh
```

### Qué verifica el script

1. ✅ Crear 3 usuarios únicos con emails diferentes
2. ✅ Login con autenticación real (no hardcoded)
3. ✅ Cada usuario empieza con 0 exámenes
4. ✅ Intentar acceder a examen de otro usuario retorna 404
5. ✅ Dashboard aislado por usuario
6. ✅ Weekly actions aisladas por usuario

---

## Opción 2: Verificación Manual

### Paso 1: Iniciar el backend

```bash
cd backend
npm run dev
```

### Paso 2: Crear 3 usuarios diferentes

**Usuario 1:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "name": "Alice",
    "password": "SecurePass123!",
    "age": 30,
    "sex": "F"
  }'
```

Guarda el `token` en una variable:
```bash
TOKEN_ALICE="<token_aqui>"
```

**Usuario 2:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "name": "Bob",
    "password": "SecurePass123!",
    "age": 28,
    "sex": "M"
  }'
```

Guarda el token:
```bash
TOKEN_BOB="<token_aqui>"
```

**Usuario 3:**
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "charlie@test.com",
    "name": "Charlie",
    "password": "SecurePass123!",
    "age": 35,
    "sex": "M"
  }'
```

Guarda el token:
```bash
TOKEN_CHARLIE="<token_aqui>"
```

---

### Paso 3: Verificar que cada usuario tiene su propia identidad

```bash
# Alice hace login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "SecurePass123!"
  }'

# ✅ Debe retornar un user.id DIFERENTE a Bob y Charlie
```

---

### Paso 4: Subir exámenes (requiere archivos PDF)

**Alice sube un examen:**
```bash
curl -X POST http://localhost:8000/api/exams/upload \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -F "file=@example_lab_results_alice.pdf"
```

**Bob sube un examen:**
```bash
curl -X POST http://localhost:8000/api/exams/upload \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -F "file=@example_lab_results_bob.pdf"
```

**Charlie sube un examen:**
```bash
curl -X POST http://localhost:8000/api/exams/upload \
  -H "Authorization: Bearer $TOKEN_CHARLIE" \
  -F "file=@example_lab_results_charlie.pdf"
```

---

### Paso 5: Verificar que cada usuario solo ve SUS exámenes

**Alice lista exámenes:**
```bash
curl http://localhost:8000/api/exams \
  -H "Authorization: Bearer $TOKEN_ALICE"
```

✅ **Debe retornar SOLO el examen de Alice (1 examen)**

**Bob lista exámenes:**
```bash
curl http://localhost:8000/api/exams \
  -H "Authorization: Bearer $TOKEN_BOB"
```

✅ **Debe retornar SOLO el examen de Bob (1 examen)**

**Charlie lista exámenes:**
```bash
curl http://localhost:8000/api/exams \
  -H "Authorization: Bearer $TOKEN_CHARLIE"
```

✅ **Debe retornar SOLO el examen de Charlie (1 examen)**

---

### Paso 6: Intentar acceder a examen de otro usuario

```bash
# Obtener el examId de Bob
EXAM_ID_BOB=$(curl -s http://localhost:8000/api/exams \
  -H "Authorization: Bearer $TOKEN_BOB" | jq -r '.exams[0].examId')

# Alice intenta acceder al examen de Bob
curl http://localhost:8000/api/exams/$EXAM_ID_BOB \
  -H "Authorization: Bearer $TOKEN_ALICE"
```

✅ **Debe retornar `404: Exam not found or unauthorized`**

❌ **NO debe retornar los datos del examen**

---

### Paso 7: Verificar dashboard

**Alice:**
```bash
curl http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN_ALICE"
```

**Bob:**
```bash
curl http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN_BOB"
```

**Charlie:**
```bash
curl http://localhost:8000/api/dashboard \
  -H "Authorization: Bearer $TOKEN_CHARLIE"
```

✅ **Cada dashboard debe mostrar datos DIFERENTES (del usuario correspondiente)**

---

### Paso 8: Verificar historial de biomarcadores

**Alice:**
```bash
curl http://localhost:8000/api/biomarkers/GLUCOSE/history \
  -H "Authorization: Bearer $TOKEN_ALICE"
```

**Bob:**
```bash
curl http://localhost:8000/api/biomarkers/GLUCOSE/history \
  -H "Authorization: Bearer $TOKEN_BOB"
```

✅ **Cada historial debe mostrar SOLO los datos del usuario correspondiente**

---

## ✅ Criterios de Aprobación

El aislamiento de datos está garantizado si:

1. ✅ Cada usuario recibe un `user.id` único (UUID) al hacer signup
2. ✅ El login NO retorna siempre el mismo `userId`
3. ✅ Cada usuario ve solo SUS exámenes (GET /api/exams)
4. ✅ Intentar acceder a examen de otro usuario retorna 404
5. ✅ El dashboard muestra datos diferentes para cada usuario
6. ✅ El historial de biomarcadores muestra solo datos del usuario autenticado
7. ✅ Las weekly actions son diferentes para cada usuario

---

## ❌ Señales de Alerta (Bugs)

Si ves alguno de estos comportamientos, **HAY UN BUG CRÍTICO:**

- ❌ Todos los usuarios reciben el mismo `user.id` (ej. `user_123`)
- ❌ Alice ve exámenes de Bob o Charlie
- ❌ Alice puede acceder a `/api/exams/:examId` de Bob (retorna 200 en lugar de 404)
- ❌ El dashboard muestra los mismos datos para todos los usuarios
- ❌ El historial de biomarcadores muestra datos de múltiples usuarios

---

## 🔍 Debugging

### Ver base de datos directamente

```bash
cd backend
sqlite3 gula.db
```

```sql
-- Ver todos los usuarios
SELECT id, email, name FROM users;

-- Ver todos los exámenes con su userId
SELECT examId, userId, examDate, healthScore FROM exams;

-- Contar exámenes por usuario
SELECT userId, COUNT(*) as exam_count 
FROM exams 
GROUP BY userId;

-- Ver biomarcadores por usuario
SELECT user_id, biomarker_code, COUNT(*) as count
FROM biomarker_result
GROUP BY user_id, biomarker_code;
```

### Verificar que las queries filtran por user_id

```bash
# Buscar queries sin filtro de usuario (esto NO debería encontrar nada)
cd backend
grep -r "SELECT.*FROM.*exams" src/ | grep -v "WHERE.*userId"
grep -r "SELECT.*FROM.*biomarker_result" src/ | grep -v "WHERE.*user_id"
grep -r "SELECT.*FROM.*weekly_action_instances" src/ | grep -v "WHERE.*user_id"
```

✅ **Si no encuentra nada, las queries están correctas**

❌ **Si encuentra algo, hay una query SIN filtro de usuario (bug crítico)**

---

## 📊 Verificar en el Frontend

### Paso 1: Abrir navegador en modo incógnito

```
http://localhost:3000
```

### Paso 2: Crear cuenta como Alice

1. Ir a `/signup`
2. Crear cuenta con `alice@test.com`
3. Subir un examen
4. Ver dashboard (debe mostrar datos de Alice)

### Paso 3: Logout y crear cuenta como Bob (nueva ventana incógnita)

1. Abrir NUEVA ventana incógnita
2. Ir a `/signup`
3. Crear cuenta con `bob@test.com`
4. Subir un examen diferente
5. Ver dashboard (debe mostrar datos de Bob, NO de Alice)

### Paso 4: Verificar que no hay mezcla

✅ **El dashboard de Bob NO debe mostrar datos de Alice**

✅ **El historial de Bob NO debe incluir biomarcadores de Alice**

✅ **Las weekly actions de Bob deben ser diferentes a las de Alice**

---

## 🎯 Resumen

**Aislamiento garantizado significa:**

- Cada usuario tiene su propia identidad única
- Los datos se crean con el `user_id` del token JWT
- Las queries filtran SIEMPRE por `user_id`
- No existe forma de acceder a datos de otros usuarios
- El logout limpia completamente el estado del frontend

**Si alguna de estas condiciones no se cumple, hay un bug de seguridad crítico.**

---

**Última actualización:** 9 de febrero de 2026  
**Verificado con:** Auditoría completa de backend y frontend
