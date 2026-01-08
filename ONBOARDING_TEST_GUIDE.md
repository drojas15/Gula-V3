# GUÍA RÁPIDA DE TESTING - ONBOARDING

## CÓMO PROBAR EL ONBOARDING

### 1️⃣ Resetear el onboarding (para testing)

Abre la consola del navegador (F12 o Cmd+Option+I) y ejecuta:

```javascript
localStorage.removeItem('gula_onboarding_completed')
```

Luego recarga la página (F5 o Cmd+R)

---

### 2️⃣ Flujo completo

1. **Crear una cuenta nueva** (o usar una existente)
2. **Subir un examen** para tener datos en el dashboard
3. **Ir al dashboard** → `/dashboard`
4. **Esperar 500ms** → Aparecerá el primer tooltip

**PASO 1 - Health Score**
- ✅ Título: "Tu estado general"
- ✅ Texto: "Resume cómo estás hoy según tus exámenes."
- ✅ Botones: "Saltar" | "Siguiente"
- ✅ Indicador: ● ○ ○

**PASO 2 - Fiabilidad**
- ✅ Título: "Qué tan completa es esta evaluación"
- ✅ Texto: "Depende de cuántos biomarcadores se midieron."
- ✅ Nota: "No cambia tu puntuación."
- ✅ Botones: "Saltar" | "Siguiente"
- ✅ Indicador: ○ ● ○

**PASO 3 - Acciones**
- ✅ Título: "Qué hacer esta semana"
- ✅ Texto: "Máximo 3 prioridades. Nada más."
- ✅ Botones: "Saltar" | "Empezar"
- ✅ Indicador: ○ ○ ●

---

### 3️⃣ Test de "Saltar"

1. Resetear localStorage
2. Recargar dashboard
3. Aparece Paso 1
4. **Click en "Saltar"**
5. ✅ Tooltips desaparecen inmediatamente
6. ✅ Recargar página → NO vuelve a aparecer

---

### 4️⃣ Test de usuario existente

1. Completar el onboarding una vez
2. Salir del dashboard
3. Volver a entrar
4. ✅ NO debe aparecer el onboarding

---

### 5️⃣ Test de timing

Con un cronómetro:
1. Resetear localStorage
2. Ir al dashboard
3. **Iniciar cronómetro** cuando aparece Paso 1
4. Leer cada tooltip
5. Click "Siguiente" en cada uno
6. **Parar cronómetro** al hacer click en "Empezar"

**Resultado esperado:** < 20 segundos

---

## ERRORES COMUNES

### ❌ El onboarding NO aparece
**Solución:** 
```javascript
localStorage.removeItem('gula_onboarding_completed')
```
Luego recargar.

### ❌ Los botones no responden
**Solución:** Verificar que no haya errores en la consola. Recargar la página.

### ❌ Los tooltips están mal posicionados
**Solución:** Esto es normal en las primeras iteraciones. Pueden ajustarse más adelante.

---

## CHECKLIST DE ACEPTACIÓN

Marca cada uno después de probar:

- [ ] Onboarding aparece en primer uso
- [ ] Se puede completar en < 30 segundos
- [ ] Botón "Saltar" funciona en cualquier paso
- [ ] Indicadores de progreso muestran paso correcto
- [ ] Después de completar, NO vuelve a aparecer
- [ ] Después de saltar, NO vuelve a aparecer
- [ ] Copy es claro y no usa términos médicos
- [ ] Botones tienen hover effect (verde más oscuro)
- [ ] Overlay semi-transparente visible
- [ ] Usuario entiende: "Estoy X, es confiable en Y%, hago estas 3 cosas"

---

## NOTAS PARA ITERACIÓN

Si encuentras algo que mejorar, anótalo aquí:

- Posicionamiento de tooltips (arrows apuntando al elemento exacto)
- Timing del delay inicial (actualmente 500ms)
- Copy específico que no queda claro
- Orden de los pasos

**Principio:** Solo iterar basado en data de usuarios reales.
