# HOMEPAGE MVP - GULA

**Objetivo:** Puerta de entrada clara y directa que explica qué es Gula en <7 segundos
**Estado:** ✅ IMPLEMENTADO

---

## PRINCIPIO FUNDAMENTAL

**NO es marketing. NO es landing SaaS.**
**Es desambiguación + acción.**

El usuario debe entender:
1. Qué es Gula
2. Qué hace exactamente
3. Qué NO hace
4. Qué acción tomar

Todo en <7 segundos, sin scroll.

---

## ESTRUCTURA IMPLEMENTADA

### 1. LOGO ✅
```
Ubicación: Superior, centrado
Tamaño: Texto "Gula" en 2xl (32px)
Color: Verde primary
```

**Reglas cumplidas:**
- ✅ Logo pequeño (NO hero)
- ✅ Sin slogan junto al logo
- ✅ No distrae del mensaje

---

### 2. HEADLINE ✅
```
Principal (5xl):
"Entiende tu salud y qué hacer esta semana."

Subheadline (xl):
"Gula convierte tus exámenes médicos en prioridades simples y accionables."
```

**Reglas cumplidas:**
- ✅ Headline protagonista (NO el logo)
- ✅ Sin metáforas
- ✅ Sin promesas exageradas
- ✅ 1 línea subheadline

---

### 3. QUÉ HACE ✅
**Exactamente 3 bullets:**

```
✓ Traduce exámenes confusos a un estado claro
✓ Prioriza solo 3 acciones para esta semana
✓ Te muestra progreso en el tiempo, sin magia
```

**Reglas cumplidas:**
- ✅ Texto corto
- ✅ Íconos simples (✓)
- ✅ NO más de 3 bullets
- ✅ Formato consistente

---

### 4. QUÉ NO ES ✅
```
"Gula no da diagnósticos ni reemplaza a tu médico."
```

**Reglas cumplidas:**
- ✅ Visible (NO en footer)
- ✅ NO lenguaje legal
- ✅ Texto pequeño pero claro

---

### 5. CTA ÚNICO ✅
```
Botón: "Sube tus exámenes y empieza"
Acción: → /signup
```

**Reglas cumplidas:**
- ✅ 1 solo CTA primario
- ✅ NO CTAs secundarios
- ✅ NO enlaces alternativos (excepto login discreto)

---

### 6. OPCIONAL ✅
```
"Funciona incluso si tus exámenes están incompletos."
```

**Reglas cumplidas:**
- ✅ Texto pequeño
- ✅ NO genera scroll (laptop estándar)
- ✅ Refuerza confianza

---

## COLORES Y ESTILO

### Variables CSS
```css
--color-primary: #10b981 (green-500)
--color-primary-hover: #059669 (green-600)
--color-primary-soft: #d1fae5 (green-100)
--color-background: #fafaf9 (stone-50 - blanco cálido)
--color-text-main: #1c1917 (stone-900 - negro suave)
```

### Uso
```
Fondo principal: #fafaf9 (stone-50)
Texto principal: #1c1917 (stone-900)
CTA fondo: #10b981 (green-500)
CTA texto: blanco
CTA hover: #059669 (green-600)
```

### PROHIBIDO (cumplido)
- ❌ Fondos verdes grandes
- ❌ Gradientes
- ❌ Sombras pesadas
- ❌ Animaciones
- ❌ Navbar compleja
- ❌ Footer largo
- ❌ Testimonios
- ❌ Pricing
- ❌ Secciones extra

---

## REGLAS UX CLAVE

### ✅ Todo sin scroll
- Layout: `flex flex-col min-h-screen`
- Main: `flex-1 flex items-center justify-center`
- Contenido centrado vertical y horizontalmente

### ✅ Una sola acción
- 1 botón primario: "Sube tus exámenes y empieza"
- 1 link discreto: "¿Ya tienes cuenta? Inicia sesión"

### ✅ Mensaje antes que marca
- Headline 5xl (grande)
- Logo 2xl (pequeño)
- Jerarquía visual clara

### ✅ Desambiguación clara
- Qué hace (3 bullets)
- Qué NO hace (disclaimer)
- Cómo empezar (CTA)

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Usuario entiende qué es Gula en <7 segundos
**Test:**
```
[0-2s] Lee headline: "Entiende tu salud y qué hacer esta semana"
       → Usuario sabe QUÉ es
       
[2-4s] Lee subheadline: "Convierte exámenes en prioridades accionables"
       → Usuario sabe CÓMO funciona
       
[4-7s] Escanea 3 bullets rápidamente
       → Usuario confirma entendimiento
```

### ✅ Sabe exactamente qué hacer después
- Botón grande y claro: "Sube tus exámenes y empieza"
- 1 sola acción posible (no hay confusión)

### ✅ Homepage no distrae del producto
- Sin secciones extra
- Sin testimonios o social proof
- Sin videos o demos
- Directo al grano

### ✅ Parece puerta de entrada, no marketing
- Tono directo, no promocional
- "Qué hace" vs "Por qué es mejor"
- "Empieza" vs "Prueba gratis"
- Funcional, no aspiracional

---

## RESPONSIVE

### Desktop (laptop estándar)
```
Max width: 2xl (672px)
Todo visible sin scroll
Headline: 5xl
```

### Tablet
```
Mismo layout
Headline: 4xl
Padding: reducido
```

### Mobile
```
Headline: 3xl
Bullets: más compactos
CTA: full width
Scroll OK (permitido en mobile)
```

---

## ARCHIVOS MODIFICADOS

### 1. `/frontend/app/page.tsx`
- Reemplazó homepage anterior
- Estructura de 6 pasos implementada
- Sin lógica, solo UI

### 2. `/frontend/app/globals.css`
- Variables de color añadidas
- Clases de utilidad personalizadas
- Colores consistentes

### 3. `/frontend/tailwind.config.js`
- Colores primary actualizados (azul → verde)
- Green-500 como primary
- Green-600 como hover

---

## TESTING

### Test Visual
```
1. Abrir homepage en laptop (1440x900)
2. Todo debe ser visible sin scroll
3. Headline debe ser lo más grande
4. Logo debe ser discreto
5. CTA debe destacar (verde)
```

### Test de Comprensión
```
Mostrar homepage a usuario nuevo por 7 segundos
Preguntar:
- ¿Qué es Gula?
  → Esperado: "Convierte exámenes en prioridades"
  
- ¿Qué hace específicamente?
  → Esperado: "Te dice qué hacer esta semana"
  
- ¿Qué hago ahora?
  → Esperado: "Subir mis exámenes"
```

### Test de Distracción
```
Usuario NO debe:
- Buscar más información
- Preguntar "¿cómo funciona?"
- Dudar de qué hacer
- Sentir que falta algo
```

---

## MÉTRICAS DE ÉXITO

### Tiempo de comprensión
**Objetivo:** <7 segundos
**Medición:** Usuario puede explicar qué es Gula después de ver homepage

### Claridad de acción
**Objetivo:** 100% saben qué hacer
**Medición:** Usuario hace click en CTA sin dudar

### Tasa de rebote
**Objetivo:** <50%
**Medición:** Usuario NO sale sin hacer nada

---

## NO IMPLEMENTADO (INTENCIONALMENTE)

❌ Animaciones
❌ Videos o demos
❌ Testimonios
❌ Logos de clientes
❌ Features detallados
❌ Pricing
❌ FAQ
❌ Blog preview
❌ Newsletter signup
❌ Social proof
❌ Comparaciones
❌ "Cómo funciona" paso a paso

**Razón:** Todo eso distrae del mensaje core y la acción única.

---

## PRÓXIMOS PASOS (SI NECESARIO)

### Mejoras opcionales (solo si datos lo justifican)
1. A/B test de headlines diferentes
2. Ajustar copy de bullets si confunde
3. Añadir screenshot sutil del dashboard (solo si ayuda)

### NO hacer sin data
- Añadir más secciones
- Hacer logo más grande
- Agregar CTAs secundarios
- Crear versión "completa"

---

## CONCLUSIÓN

✅ **Homepage MVP completado**

Características:
- Explica qué es Gula en <7 segundos
- 1 sola acción clara
- Sin distracciones
- Sin marketing fluff
- Todo visible sin scroll (laptop)

Estado:
- Listo para producción
- Listo para testing con usuarios
- Listo para iterar basado en data

**Principio cumplido:** Desambiguación + Acción, no Marketing.
