# LÓGICA DE ROTACIÓN DE ACCIONES SEMANALES

## PRINCIPIO FUNDAMENTAL

**Acciones semanales = SLOTS ROTATIVOS, no backlog acumulativo**

- Máximo 3 acciones activas en cualquier momento
- Cada semana se genera un NUEVO set basado en estado actual
- NO hay "deuda" de semanas anteriores
- NO hay acumulación de acciones pendientes

---

## CONCEPTO: SLOTS vs BACKLOG

### ❌ MAL - Sistema de Backlog
```
Semana 1: [A, B, C] pendientes
Semana 2: [A, B, C, D, E, F] ← Se acumulan
Semana 3: [A, B, C, D, E, F, G, H, I] ← Usuario abrumado
```

### ✅ BIEN - Sistema de Slots
```
Semana 1: [A, B, C] ← 3 slots
Semana 2: [B, D, E] ← 3 slots (A se eliminó, D y E entraron)
Semana 3: [D, E, F] ← 3 slots (B se completó, F entró)
```

---

## REGLA GLOBAL: CADA INICIO DE SEMANA

```typescript
function generateWeeklyActions(userId: string): void {
  // 1. Re-evaluar estado de biomarcadores
  const currentBiomarkers = getCurrentBiomarkerState(userId);
  
  // 2. Evaluar acciones de la semana anterior (no se arrastran)
  const previousActions = getLastWeekActions(userId);
  
  // 3. Construir NUEVO set de 3 acciones
  const newActions = selectTopPriorities(currentBiomarkers, previousActions);
  
  // 4. Guardar como acciones de ESTA semana (reemplaza anteriores)
  saveWeeklyActions(userId, newActions, currentWeek);
}
```

**Resultado:** Siempre hay exactamente 3 acciones para la semana actual.

---

## LÓGICA DE DECISIÓN POR ACCIÓN

Para cada acción de la semana anterior:

### Caso 1: Problema Persiste + Acción Relevante
```
Biomarcador: LDL = 180 (OUT_OF_RANGE)
Acción previa: "Caminar 30 min diarios"
Estado acción: PENDING (0% completado)

→ Decisión: CONTINUAR (ocupa 1 slot)
→ Razón: El problema sigue y la acción es apropiada
```

### Caso 2: Problema Mejoró
```
Biomarcador: LDL = 120 (GOOD) ← Antes era 180
Acción previa: "Caminar 30 min diarios"
Estado acción: COMPLETED (100%)

→ Decisión: ELIMINAR
→ Razón: La acción cumplió su propósito, usuario ya la internalizó
```

### Caso 3: Problema Más Prioritario Apareció
```
Biomarcador: LDL = 180 (OUT_OF_RANGE) ← Sigue igual
Nueva situación: HbA1c = 6.8% (CRITICAL) ← Apareció
Acción previa: "Caminar 30 min diarios" (para LDL)

→ Decisión: REEMPLAZAR con acción para HbA1c
→ Razón: HbA1c es más crítico (diabetes)
```

### Caso 4: Acción Completada en últimos 14 días
```
Acción: "Eliminar refrescos azucarados"
Estado: COMPLETED hace 10 días

→ Decisión: NO REPETIR (cooldown de 14 días)
→ Razón: Usuario ya la internalizó, evitar fatiga
```

---

## REGLA DE EJERCICIO (ESPECIAL)

El ejercicio es un **hábito recurrente**, no una tarea única.

### ✅ Correcto: Puede Repetirse
```
Semana 1: "Caminar 30 min, 5 días" → COMPLETED
Semana 2: "Caminar 30 min, 5 días" → Puede volver si sigue siendo prioridad
Semana 3: "Caminar 30 min, 5 días" → Sin límite de repeticiones
```

### ❌ Incorrecto: Duplicación
```
Semana 1: 
  - "Caminar 30 min, 5 días"
  - "Trotar 150 min semanales"  ← DUPLICACIÓN, ambos son cardio
```

### Regla de Implementación
```typescript
// Al seleccionar acciones, verificar que NO haya 2 acciones de la misma categoría
const usedCategories = new Set<ActionCategory>();

for (const action of candidates) {
  if (usedCategories.has(action.category)) {
    continue; // Skip, ya hay acción de esta categoría
  }
  
  selectedActions.push(action);
  usedCategories.add(action.category);
}
```

---

## CONSTRUCCIÓN DEL SET SEMANAL

### Paso 1: Identificar Top Problemas (max 3)
```typescript
const problems = analyzedBiomarkers
  .filter(b => b.status !== 'OPTIMAL')
  .sort((a, b) => {
    // Prioridad: CRITICAL > OUT_OF_RANGE > GOOD
    // Desempate: mayor peso gana
    return priorityScore(b) - priorityScore(a);
  })
  .slice(0, 3); // MAX 3 problemas
```

### Paso 2: Mapear 1 Acción por Problema
```typescript
const actions = [];
for (const problem of problems) {
  const action = selectBestAction(problem, completedActions);
  if (action) {
    actions.push(action);
  }
}
```

### Paso 3: Priorizar por Impacto y Facilidad
```typescript
// Dentro de cada problema, elegir acción con:
// 1. Mayor impacto en el biomarcador
// 2. Menor dificultad (si hay empate)
// 3. Que no haya sido completada en últimos 14 días

function selectBestAction(problem, completedActions) {
  const candidates = getActionsForBiomarker(problem.biomarker)
    .filter(a => !completedActions.includes(a.id))
    .sort((a, b) => {
      // Ordenar por dificultad (easy primero)
      return difficultyScore(a) - difficultyScore(b);
    });
  
  return candidates[0];
}
```

### Paso 4: Limitar a 3 Acciones Finales
```typescript
// HARD LIMIT: Nunca más de 3
const finalActions = actions.slice(0, 3);
```

---

## REGLA UX: COMUNICACIÓN AL USUARIO

### ❌ MAL - Sugiere Acumulación
```
"Se agregaron 3 nuevas acciones"
"Tienes 6 acciones pendientes"
"Completa las 9 acciones de este mes"
```

### ✅ BIEN - Comunica Slots Rotativos
```
"Estas son las 3 prioridades de esta semana"
"Tus acciones semanales se actualizaron"
"Enfócate en estas 3 acciones esta semana"
```

### Implementación en Frontend
```typescript
// NUNCA mostrar contador total de acciones
// SIEMPRE comunicar como "set semanal"

<h2>Tus 3 prioridades esta semana</h2>
<p>Estas acciones se basan en tu estado actual.</p>

{/* NO hacer esto: */}
<p>Tienes {totalActions} acciones pendientes</p> // ❌

{/* Hacer esto: */}
<p>Semana del {weekStart} al {weekEnd}</p> // ✅
```

---

## VALIDACIONES DEL SISTEMA

### Validación 1: Max 3 Acciones Activas
```typescript
function validateMaxActions(actions: Action[]): void {
  if (actions.length > 3) {
    throw new Error('Cannot have more than 3 active actions');
  }
}
```

### Validación 2: No Duplicación de Categorías
```typescript
function validateNoDuplicateCategories(actions: Action[]): void {
  const categories = actions.map(a => a.category);
  const uniqueCategories = new Set(categories);
  
  if (categories.length !== uniqueCategories.size) {
    throw new Error('Cannot have duplicate action categories');
  }
}
```

### Validación 3: No Acumulación Semanal
```typescript
function validateNoAccumulation(userId: string, week: string): void {
  const activeActions = getActiveActionsForWeek(userId, week);
  const previousWeekActions = getActiveActionsForWeek(userId, previousWeek);
  
  // Las acciones de esta semana NO deben incluir acciones "pendientes" 
  // de semanas anteriores
  // Cada semana es un set NUEVO
}
```

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Criterio 1: No existe semana con >3 acciones
```sql
SELECT week, COUNT(*) as action_count
FROM weekly_actions
WHERE user_id = ?
GROUP BY week
HAVING COUNT(*) > 3;

-- Resultado esperado: 0 filas
```

### ✅ Criterio 2: Acciones pueden repetirse sin acumularse
```
Semana 1: ["Caminar", "Vegetales", "Dormir 7h"]
Semana 2: ["Caminar", "Sin azúcar", "Dormir 7h"]  ← "Caminar" repite, pero NO se suma

Total acciones Semana 2: 3 (no 6)
```

### ✅ Criterio 3: Usuario no siente deuda de semanas anteriores
```
Semana 1: Usuario no completa "Caminar"
Semana 2: Sistema genera NUEVO set de 3 acciones
          → Usuario NO ve "Caminar (pendiente de semana 1)"
          → Usuario solo ve 3 acciones nuevas para esta semana
```

---

## EJEMPLOS DE ROTACIÓN

### Ejemplo 1: Mejora de Biomarcador
```
📅 Semana 1:
- LDL = 180 (OUT_OF_RANGE)
- Acciones: ["Caminar 30min", "Reduce grasas", "Sin trans"]

Usuario completa "Caminar" y "Sin trans" (66% completado)

📅 Semana 2:
- LDL = 150 (OUT_OF_RANGE) ← Mejoró pero sigue elevado
- Acciones: ["Reduce grasas", "Aumenta fibra", "Control porciones"]
  → "Caminar" y "Sin trans" SALIERON (ya completadas + internalizado)
  → "Reduce grasas" CONTINÚA (problema persiste + no completada)
  → "Aumenta fibra" y "Control porciones" ENTRARON (nuevas estrategias)
```

### Ejemplo 2: Nueva Prioridad Crítica
```
📅 Semana 1:
- LDL = 180 (OUT_OF_RANGE)
- Acciones: ["Caminar", "Reduce grasas", "Sin trans"]

📅 Semana 2:
- LDL = 180 (OUT_OF_RANGE) ← Sin cambio
- HbA1c = 7.0% (CRITICAL) ← NUEVO PROBLEMA CRÍTICO
- Acciones: ["Sin azúcar", "Aumenta fibra", "Controla carbohidratos"]
  → TODAS las acciones de LDL SALIERON
  → ENTRARON 3 acciones para HbA1c (más urgente)
```

### Ejemplo 3: Mantenimiento (Todo Optimal)
```
📅 Semana 1:
- Todos los biomarcadores: OPTIMAL
- Acciones: ["Caminar 30min"] ← Solo 1 acción de mantenimiento

Usuario la completa (100%)

📅 Semana 2:
- Todos los biomarcadores: OPTIMAL
- Acciones: ["Caminar 30min"] ← Misma acción (hábito recurrente)
  → Puede repetirse indefinidamente para mantener salud
```

---

## DIAGRAMA DE FLUJO

```
┌─────────────────────────────────────┐
│ Inicio de Semana (Lunes 00:00)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 1. Obtener biomarcadores actuales   │
│    - Calcular health score          │
│    - Identificar problemas          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Evaluar acciones semana anterior │
│    - ¿Completadas?                  │
│    - ¿Problema persiste?            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Seleccionar top 3 prioridades    │
│    - CRITICAL primero               │
│    - OUT_OF_RANGE después           │
│    - Max 1 GOOD si quedan slots     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Mapear acciones (max 3)          │
│    - 1 acción por problema          │
│    - No duplicar categorías         │
│    - Evitar completadas <14 días    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Guardar nuevo set                │
│    - Reemplaza set anterior         │
│    - week_start = HOY               │
│    - week_end = Domingo             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Usuario ve: "Tus 3 prioridades      │
│             de esta semana"         │
└─────────────────────────────────────┘
```

---

## RESUMEN EJECUTIVO

**NUNCA:**
- ❌ Acumular acciones de semanas anteriores
- ❌ Mostrar más de 3 acciones activas
- ❌ Duplicar ejercicios en la misma semana
- ❌ Decir "tienes X acciones pendientes"
- ❌ Crear deuda psicológica en el usuario

**SIEMPRE:**
- ✅ Generar NUEVO set cada semana
- ✅ Máximo 3 acciones activas
- ✅ Permitir repetición de hábitos (sin duplicación)
- ✅ Comunicar como "prioridades de esta semana"
- ✅ Liberar al usuario de semanas anteriores

**RESULTADO:**
Usuario enfocado, sin abrumar, con progreso sostenible.
