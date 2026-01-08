# ONBOARDING ULTRA CORTO - IMPLEMENTACIÓN

**Objetivo:** Onboarding de ≤30 segundos que explica el modelo mental del producto
**Estado:** ✅ IMPLEMENTADO

---

## PRINCIPIO FUNDAMENTAL

**El onboarding NO educa en salud.**  
**El onboarding solo explica el modelo mental del producto.**

Usuario debe poder responder después:
> "Estoy X, esto es confiable en Y%, y hago estas 3 cosas"

---

## FORMATO ELEGIDO

✅ **Opción B: 3 tooltips secuenciales sobre el dashboard**

**Razón:** Menos fricción que pantallas full-screen, mejor para MVP.

---

## CONTENIDO IMPLEMENTADO

### PASO 1 — HEALTH SCORE ✅

**Anclado a:** Número del score

```
Título: "Tu estado general"
Texto: "Resume cómo estás hoy según tus exámenes."
CTA: "Siguiente"
```

**Reglas cumplidas:**
- ✅ No explica cálculo
- ✅ No habla de biomarcadores
- ✅ No usa términos médicos
- ✅ 1 línea, <12 palabras

---

### PASO 2 — FIABILIDAD ✅

**Anclado a:** Barra de fiabilidad

```
Título: "Qué tan completa es esta evaluación"
Texto: "Depende de cuántos biomarcadores se midieron."
Nota: "No cambia tu puntuación."
CTA: "Siguiente"
```

**Reglas cumplidas:**
- ✅ Explica concepto sin tecnicismos
- ✅ Clarifica que no afecta el score
- ✅ 1 línea principal + nota pequeña

---

### PASO 3 — ACCIONES SEMANALES ✅

**Anclado a:** Sección de acciones

```
Título: "Qué hacer esta semana"
Texto: "Máximo 3 prioridades. Nada más."
CTA: "Empezar"
```

**Reglas cumplidas:**
- ✅ Mensaje claro y directo
- ✅ Enfatiza límite de 3
- ✅ CTA final diferente ("Empezar")

---

## COMPORTAMIENTO

### Mostrar SOLO la primera vez ✅
```typescript
useEffect(() => {
  const hasSeenOnboarding = localStorage.getItem('gula_onboarding_completed');
  if (!hasSeenOnboarding) {
    setTimeout(() => setShouldShowOnboarding(true), 500);
  }
}, []);
```

### Permitir "Saltar" en cualquier paso ✅
- Botón "Saltar" visible en todos los tooltips
- Guarda estado en localStorage
- NO vuelve a mostrar

### No bloquear el uso ✅
- Tooltips con overlay semi-transparente
- Usuario puede interactuar (aunque no recomendado)
- Si cierra browser, no reaparece

---

## REGLAS DE COPY CUMPLIDAS

### ✅ Máx. 12 palabras por tooltip
```
Paso 1: "Resume cómo estás hoy según tus exámenes." (8 palabras)
Paso 2: "Depende de cuántos biomarcadores se midieron." (7 palabras)
Paso 3: "Máximo 3 prioridades. Nada más." (5 palabras)
```

### ✅ Frases simples, sin subordinadas
- Sin "que", "porque", "para que"
- Oraciones directas
- Puntos, no comas

### ✅ Lenguaje cotidiano
- "Cómo estás" vs "tu estado de salud"
- "Qué hacer" vs "recomendaciones"
- "Nada más" vs "únicamente"

### ✅ Sin tono médico
- NO: "evaluación clínica", "diagnóstico", "tratamiento"
- SÍ: "estado general", "prioridades", "qué hacer"

### ✅ Sin promesas
- NO: "Mejora tu salud"
- SÍ: "Resume cómo estás"

---

## COMPONENTES CREADOS

### 1. `/frontend/components/OnboardingTooltips.tsx`

**Componente principal:**
```typescript
<OnboardingTooltips
  onComplete={completeOnboarding}
  onSkip={skipOnboarding}
/>
```

**Features:**
- 3 tooltips secuenciales
- Control de flujo con estados
- Overlay semi-transparente
- Indicadores de progreso (●○○)
- Botones Saltar/Siguiente

**Hook personalizado:**
```typescript
const { 
  shouldShowOnboarding, 
  completeOnboarding, 
  skipOnboarding 
} = useOnboarding();
```

### 2. Integración en `/frontend/app/dashboard/page.tsx`

```typescript
// Import
import OnboardingTooltips, { useOnboarding } from '@/components/OnboardingTooltips';

// En el componente
const { shouldShowOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

// Render
{shouldShowOnboarding && (
  <OnboardingTooltips
    onComplete={completeOnboarding}
    onSkip={skipOnboarding}
  />
)}
```

---

## FLUJO COMPLETO

### Usuario nuevo entra al dashboard por primera vez

```
1. Dashboard carga normalmente
   ↓
2. Espera 500ms (mejor UX)
   ↓
3. Verifica localStorage: gula_onboarding_completed
   ├─ Si existe: NO mostrar onboarding
   └─ Si NO existe: Mostrar paso 1
   ↓
4. PASO 1: Tooltip en Health Score
   ├─ Usuario lee (3-5 segundos)
   ├─ Click "Siguiente" o "Saltar"
   └─ Si Saltar: guarda estado y termina
   ↓
5. PASO 2: Tooltip en Fiabilidad
   ├─ Usuario lee (3-5 segundos)
   ├─ Click "Siguiente" o "Saltar"
   └─ Si Saltar: guarda estado y termina
   ↓
6. PASO 3: Tooltip en Acciones
   ├─ Usuario lee (3-5 segundos)
   └─ Click "Empezar"
   ↓
7. Guarda en localStorage: gula_onboarding_completed = true
   ↓
8. Usuario usa dashboard sin interrupciones

TIEMPO TOTAL: 10-20 segundos ✅ (<30 segundos)
```

### Usuario que ya vio el onboarding

```
1. Dashboard carga
   ↓
2. Verifica localStorage: gula_onboarding_completed = true
   ↓
3. NO muestra onboarding
   ↓
4. Dashboard normal sin interrupciones
```

---

## PROHIBIDO (CUMPLIDO)

❌ Videos  
❌ GIFs  
❌ Tour largo  
❌ Explicaciones científicas  
❌ Texto en párrafos  
❌ Repetir onboarding en cada login  

**Todo evitado exitosamente.**

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Usuario completa onboarding en <30 segundos
**Tiempo estimado:** 10-20 segundos
- Paso 1: 3-5 seg
- Paso 2: 3-5 seg
- Paso 3: 3-5 seg
- Total: 9-15 seg de lectura + clicks

### ✅ Puede usar dashboard sin ayuda
- Onboarding explica las 3 piezas core
- Tooltips no bloquean funcionalidad
- Usuario puede empezar inmediatamente

### ✅ Puede responder la pregunta clave
**"Estoy X, esto es confiable en Y%, y hago estas 3 cosas"**

- Paso 1 → "Estoy X" (Health Score)
- Paso 2 → "Es confiable en Y%" (Fiabilidad)
- Paso 3 → "Hago estas 3 cosas" (Acciones)

### ✅ Onboarding no interrumpe el flujo
- Solo aparece 1ra vez
- Puede saltarse en cualquier momento
- Overlay semi-transparente (no completamente bloqueante)
- Si salta, NO vuelve a aparecer

---

## DISEÑO VISUAL

### Tooltip Card
```
┌─────────────────────────────┐
│  Tu estado general          │ ← Título (xl, bold)
│                             │
│  Resume cómo estás hoy      │ ← Texto (base)
│  según tus exámenes.        │
│                             │
│  [Saltar]  [Siguiente]      │ ← Botones
│                             │
│       ● ○ ○                 │ ← Progreso
└─────────────────────────────┘
```

### Colores
- **Overlay:** bg-black bg-opacity-50 (semi-transparente)
- **Card:** bg-white rounded-xl shadow-2xl
- **Título:** text-gray-900 font-bold
- **Texto:** text-gray-700
- **Nota:** text-gray-500 (más pequeño)
- **CTA:** bg-primary text-white

### Posicionamiento
- **Paso 1:** top-32 (cerca del score)
- **Paso 2:** top-64 (cerca de fiabilidad)
- **Paso 3:** top-96 (cerca de acciones)
- Todos: centrados horizontalmente

---

## LOCALSTORAGE

### Key
```
gula_onboarding_completed
```

### Valor
```
"true"
```

### Cuándo se guarda
- Al completar paso 3 (click en "Empezar")
- Al hacer click en "Saltar" en cualquier paso

### Cómo resetear (para testing)
```javascript
// En DevTools Console
localStorage.removeItem('gula_onboarding_completed')
// Recargar página
```

---

## TESTING

### Test 1: Primera vez (nuevo usuario)
```
1. Abrir dashboard en navegador limpio
2. Esperar 500ms
3. Debe aparecer Paso 1 ✅
4. Click "Siguiente"
5. Debe aparecer Paso 2 ✅
6. Click "Siguiente"
7. Debe aparecer Paso 3 ✅
8. Click "Empezar"
9. Tooltips desaparecen ✅
10. Recargar página
11. NO debe aparecer onboarding ✅
```

### Test 2: Saltar onboarding
```
1. Resetear localStorage
2. Abrir dashboard
3. Aparece Paso 1
4. Click "Saltar" ✅
5. Tooltips desaparecen inmediatamente ✅
6. Recargar página
7. NO debe aparecer onboarding ✅
```

### Test 3: Usuario existente
```
1. Usuario que ya completó onboarding
2. Abrir dashboard
3. NO debe aparecer onboarding ✅
4. Dashboard funciona normalmente ✅
```

### Test 4: Timing
```
1. Cronometrar desde Paso 1 hasta "Empezar"
2. Leer cada tooltip
3. Click en "Siguiente" entre pasos
4. Tiempo total: <20 segundos ✅
```

---

## MEJORAS FUTURAS (NO MVP)

### Opcionales (solo si datos lo justifican)
1. Posicionamiento más preciso de tooltips (arrows)
2. Animaciones suaves entre pasos
3. Opción de "Ver de nuevo" en Settings
4. Analytics de qué paso abandona más gente

### NO hacer sin data
- Añadir más pasos
- Explicar biomarcadores
- Tour completo del dashboard
- Videos o demos

---

## CONCLUSIÓN

✅ **Onboarding ultra corto completado**

Características:
- 3 tooltips secuenciales
- ≤30 segundos de duración
- Explica modelo mental del producto
- No educa en salud
- Solo aparece 1ra vez
- Puede saltarse

Estado:
- Listo para producción
- Listo para testing con usuarios
- Listo para iterar basado en data

**Principio cumplido:** Explicar el modelo mental, NO educar en salud.
