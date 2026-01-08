# INTERNALIZACIÓN DE ACCIONES SEMANALES

## CONCEPTO FUNDAMENTAL

**Una acción se internaliza cuando deja de ser la mejor palanca semanal, no cuando el problema desaparece por completo.**

Internalización = La acción sale del set semanal (libera 1 slot) porque:
- Ya cumplió su propósito inmediato
- El usuario la adoptó como hábito
- Existe otra acción con mayor impacto que necesita el slot

---

## REGLA GENERAL DE INTERNALIZACIÓN

Una acción se marca como **INTERNALIZADA** si se cumple **AL MENOS UNA** de estas condiciones:

### ✅ Condición 1: Biomarcador Mejoró o Estabilizó
```
Ejemplo:
- LDL bajó de 180 → 120 (OUT_OF_RANGE → GOOD)
- Acción: "Caminar 30 min diarios"

→ La acción fue efectiva
→ El problema mejoró (no desapareció, pero mejoró)
→ INTERNALIZAR: Liberar slot para otro problema
```

### ✅ Condición 2: Completada ≥2 Semanas Consecutivas
```
Ejemplo:
- Acción: "Caminar 30 min, 5 días/semana"
- Semana 1: 100% completado ✅
- Semana 2: 100% completado ✅

→ Usuario adoptó el hábito
→ Ya no necesita "recordatorio" semanal
→ INTERNALIZAR: Pasa a mantenimiento
```

### ✅ Condición 3: Acción de Mayor Impacto Necesita el Slot
```
Ejemplo:
- LDL = 180 (OUT_OF_RANGE) ← Problema continúa
- HbA1c = 7.0% (CRITICAL) ← NUEVO problema más grave

→ LDL sigue elevado, pero HbA1c es urgente
→ Prioridad cambia de LDL a HbA1c
→ INTERNALIZAR acción de LDL: Liberar slot para HbA1c
```

---

## TIPOS DE ACCIÓN Y SU INTERNALIZACIÓN

### 🏃 HÁBITOS (Ejercicio, Pasos, Sueño)

**Características:**
- No se "completan" definitivamente
- Son recurrentes por naturaleza
- Objetivo: formar rutina permanente

**Regla de Internalización:**
```typescript
if (action.category === 'ACTIVITY' || action.category === 'RECOVERY') {
  // Si se cumplen ≥2 semanas seguidas
  if (consecutiveWeeksCompleted >= 2) {
    action.status = 'INTERNALIZED';
    action.internalization_reason = 'HABIT_FORMED';
    // → Pasa a mantenimiento
    // → Deja de ocupar slot
  }
}
```

**Ejemplo:**
```
Semana 1: "Caminar 30 min, 5 días" → 100% ✅
Semana 2: "Caminar 30 min, 5 días" → 100% ✅
Semana 3: [INTERNALIZADA]
         → Slot liberado
         → Usuario continúa caminando (hábito formado)
```

**Pueden Reaparecer Si:**
- Biomarcador vuelve a empeorar
- Usuario no cumple varias semanas seguidas
- No hay problemas más urgentes

**Ejemplo de Reaparición:**
```
Semana 1-2: "Caminar" → INTERNALIZADA
Semana 3-6: Sin acción de ejercicio
Semana 7: LDL = 190 (CRITICAL) ← Empeoró mucho
         → "Caminar" REAPARECE en slots
```

---

### 🍎 CORRECCIONES (Alimentación, Alcohol, Azúcar)

**Características:**
- Buscan cambio de comportamiento específico
- Se mantienen mientras el problema persiste
- Objetivo: corregir factor de riesgo

**Regla de Internalización:**
```typescript
if (action.category === 'NUTRITION' || action.category === 'ELIMINATION') {
  // Opción 1: Biomarcador mejoró
  if (biomarker.status === 'GOOD' || biomarker.status === 'OPTIMAL') {
    action.status = 'INTERNALIZED';
    action.internalization_reason = 'BIOMARKER_IMPROVED';
  }
  
  // Opción 2: Completada ≥3 semanas (baja fricción)
  if (consecutiveWeeksCompleted >= 3 && action.difficulty === 'EASY') {
    action.status = 'INTERNALIZED';
    action.internalization_reason = 'LOW_FRICTION_ADOPTED';
  }
}
```

**Ejemplo 1: Mejora de Biomarcador**
```
Semana 1: HbA1c = 6.2% (OUT_OF_RANGE)
         Acción: "Eliminar refrescos azucarados"
         Progress: 100% ✅
         
Semana 2: HbA1c = 5.5% (GOOD) ← Mejoró
         → Acción INTERNALIZADA
         → Slot liberado
```

**Ejemplo 2: Baja Fricción**
```
Semana 1: "Sin refrescos" → 100% (fácil)
Semana 2: "Sin refrescos" → 100% (ya es natural)
Semana 3: "Sin refrescos" → 100% (cero fricción)
Semana 4: → Acción INTERNALIZADA (baja fricción)
```

**NO Se Internalizan Si:**
- Problema persiste Y acción es difícil
- Usuario tiene dificultad para cumplir
- Biomarcador empeora

---

### 📚 EDUCATIVAS

**Características:**
- Proporcionan información/contexto
- Duración: máximo 1 semana
- No requieren "completado" tradicional

**Regla de Internalización:**
```typescript
if (action.category === 'EDUCATION') {
  // Se internalizan automáticamente después de 1 semana
  if (weeksPassed >= 1) {
    action.status = 'INTERNALIZED';
    action.internalization_reason = 'EDUCATION_DELIVERED';
  }
}
```

**Ejemplo:**
```
Semana 1: "Aprende sobre índice glucémico"
         → Mostrado al usuario
         
Semana 2: → INTERNALIZADA automáticamente
         → Nunca se repite (conocimiento ya transmitido)
```

**Reglas Estrictas:**
- Nunca ocupan slots por >1 semana
- Nunca se repiten
- Se priorizan por debajo de hábitos y correcciones

---

## RE-CÁLCULO SEMANAL COMPLETO

Cada inicio de semana (Lunes 00:00):

```typescript
function weeklyRecalculation(userId: string): void {
  // PASO 1: Evaluar estado actual
  const currentBiomarkers = getCurrentBiomarkerState(userId);
  
  // PASO 2: Obtener acciones de semana previa
  const previousWeekActions = getLastWeekActions(userId);
  
  // PASO 3: Marcar acciones que deben internalizarse
  const internalizedActions = [];
  
  for (const action of previousWeekActions) {
    // Verificar condiciones de internalización
    if (shouldInternalize(action, currentBiomarkers)) {
      action.status = 'INTERNALIZED';
      action.internalized_at = new Date();
      internalizedActions.push(action);
      saveActionLog(action); // Para historial
    }
  }
  
  // PASO 4: Identificar acciones que continúan
  const continuingActions = previousWeekActions.filter(
    a => !internalizedActions.includes(a) && 
         isBiomarkerStillRelevant(a, currentBiomarkers)
  );
  
  // PASO 5: Calcular slots disponibles
  const slotsUsed = continuingActions.length;
  const slotsAvailable = 3 - slotsUsed;
  
  // PASO 6: Seleccionar nuevas acciones para slots disponibles
  const newActions = selectNewActions(
    currentBiomarkers,
    slotsAvailable,
    [...internalizedActions, ...continuingActions] // Evitar repeticiones
  );
  
  // PASO 7: Construir set final (max 3)
  const finalActions = [
    ...continuingActions,
    ...newActions
  ].slice(0, 3);
  
  // PASO 8: Guardar como acciones de ESTA semana
  saveWeeklyActions(userId, finalActions, getCurrentWeek());
}
```

---

## LÓGICA DE DECISIÓN: shouldInternalize()

```typescript
function shouldInternalize(
  action: WeeklyAction,
  currentBiomarkers: BiomarkerState[]
): boolean {
  // Obtener biomarcador objetivo de la acción
  const targetBiomarker = getTargetBiomarker(action);
  const currentState = currentBiomarkers.find(b => b.biomarker === targetBiomarker);
  
  // CONDICIÓN 1: Biomarcador mejoró o estabilizó
  if (currentState) {
    const previousState = getPreviousState(targetBiomarker);
    
    if (previousState && hasImproved(previousState, currentState)) {
      return true; // INTERNALIZAR por mejora
    }
  }
  
  // CONDICIÓN 2: Completada ≥2 semanas consecutivas (hábitos)
  if (action.category === 'ACTIVITY' || action.category === 'RECOVERY') {
    const consecutiveWeeks = getConsecutiveCompletedWeeks(action);
    
    if (consecutiveWeeks >= 2 && action.completion_state === 'COMPLETED') {
      return true; // INTERNALIZAR por hábito formado
    }
  }
  
  // CONDICIÓN 2.5: Completada ≥3 semanas (correcciones fáciles)
  if (action.category === 'NUTRITION' || action.category === 'ELIMINATION') {
    const consecutiveWeeks = getConsecutiveCompletedWeeks(action);
    
    if (consecutiveWeeks >= 3 && 
        action.completion_state === 'COMPLETED' &&
        action.difficulty === 'EASY') {
      return true; // INTERNALIZAR por baja fricción
    }
  }
  
  // CONDICIÓN 3: Acción educativa >1 semana
  if (action.category === 'EDUCATION') {
    const weeksSince = getWeeksSinceCreated(action);
    
    if (weeksSince >= 1) {
      return true; // INTERNALIZAR automáticamente
    }
  }
  
  // CONDICIÓN 4: Problema más prioritario necesita el slot
  const topPriorities = getTopPriorities(currentBiomarkers, 3);
  const actionPriority = getPriority(action, currentBiomarkers);
  
  if (!topPriorities.map(p => p.biomarker).includes(targetBiomarker)) {
    // Este biomarcador ya no está en top 3
    if (hasHigherPriorityProblems(currentBiomarkers, targetBiomarker)) {
      return true; // INTERNALIZAR por menor prioridad
    }
  }
  
  return false; // NO internalizar, continúa en slots
}
```

---

## EJEMPLOS DE INTERNALIZACIÓN

### Ejemplo 1: Hábito Formado (Ejercicio)

```
📅 Semana 1:
Biomarcador: LDL = 180 (OUT_OF_RANGE)
Acción: "Caminar 30 min, 5 días/semana"
Progress: 100% (5/5 días) ✅

📅 Semana 2:
Biomarcador: LDL = 165 (OUT_OF_RANGE) ← Mejoró pero sigue elevado
Acción: "Caminar 30 min, 5 días/semana"
Progress: 100% (5/5 días) ✅

📅 Semana 3:
Biomarcador: LDL = 150 (OUT_OF_RANGE)
Evaluación: 
  - Consecutivas completadas: 2 semanas ✅
  - Hábito formado: SÍ
  
→ Acción INTERNALIZADA
→ Slot liberado
→ Mensaje: "¡Excelente! Caminar ya forma parte de tu rutina diaria."
→ Usuario continúa caminando (no necesita recordatorio)
→ LDL sigue mejorando (acción sigue funcionando en background)
```

### Ejemplo 2: Biomarcador Mejoró

```
📅 Semana 1:
Biomarcador: HbA1c = 6.0% (OUT_OF_RANGE)
Acción: "Eliminar refrescos azucarados"
Progress: 100% ✅

📅 Semana 2:
Biomarcador: HbA1c = 5.5% (GOOD) ← Mejoró significativamente
Evaluación:
  - Biomarcador mejoró: OUT_OF_RANGE → GOOD ✅
  - Acción fue efectiva
  
→ Acción INTERNALIZADA
→ Mensaje: "Tu HbA1c mejoró. Mantén este cambio."
→ Slot liberado para otro problema
```

### Ejemplo 3: Prioridad Cambió

```
📅 Semana 1:
Problemas:
- LDL = 180 (OUT_OF_RANGE)
- HDL = 45 (GOOD)
- TG = 160 (OUT_OF_RANGE)

Acciones:
1. "Caminar 30 min" (para LDL)
2. "Reducir grasas" (para LDL)
3. "Sin azúcar" (para TG)

📅 Semana 2:
Problemas:
- LDL = 175 (OUT_OF_RANGE) ← Sigue igual
- HDL = 45 (GOOD)
- TG = 155 (OUT_OF_RANGE)
- HbA1c = 7.2% (CRITICAL) ← NUEVO PROBLEMA CRÍTICO

Evaluación:
  - HbA1c es más prioritario que LDL (CRITICAL > OUT_OF_RANGE)
  - Necesito 3 slots para HbA1c
  
→ Acciones de LDL INTERNALIZADAS (por menor prioridad)
→ Nuevas acciones para HbA1c ocupan los 3 slots

Nuevas Acciones:
1. "Control de carbohidratos" (para HbA1c)
2. "Aumentar fibra" (para HbA1c)
3. "Ejercicio moderado" (para HbA1c)
```

### Ejemplo 4: Educativa (Automática)

```
📅 Semana 1:
Biomarcador: hs-CRP = 5.0 (OUT_OF_RANGE)
Acciones:
1. "Aprende sobre inflamación crónica" (EDUCATIVA)
2. "Reduce alimentos procesados"
3. "Aumenta omega-3"

📅 Semana 2:
Evaluación:
  - Acción educativa cumplió 1 semana
  
→ "Aprende sobre inflamación" INTERNALIZADA automáticamente
→ Conocimiento ya transmitido
→ Slot liberado para nueva acción práctica
```

---

## RAZONES DE INTERNALIZACIÓN

```typescript
enum InternalizationReason {
  BIOMARKER_IMPROVED = 'BIOMARKER_IMPROVED',      // Biomarcador mejoró
  HABIT_FORMED = 'HABIT_FORMED',                   // Hábito formado (≥2 semanas)
  LOW_FRICTION_ADOPTED = 'LOW_FRICTION_ADOPTED',   // Baja fricción (≥3 semanas)
  LOWER_PRIORITY = 'LOWER_PRIORITY',               // Problema menos urgente
  EDUCATION_DELIVERED = 'EDUCATION_DELIVERED',     // Conocimiento transmitido
  BIOMARKER_OPTIMAL = 'BIOMARKER_OPTIMAL'         // Biomarcador alcanzó OPTIMAL
}
```

---

## REGLAS UX: COMUNICACIÓN

### ❌ MAL - Sugiere Logro Médico
```
"¡Felicidades! Has curado tu colesterol alto."
"Esta acción está completada permanentemente."
"Ya no necesitas hacer ejercicio."
```

### ✅ BIEN - Comunica Internalización
```
"Esta acción ya forma parte de tu rutina" (hábito)
"Tu biomarcador mejoró, enfócate en otras prioridades" (mejora)
"Sigue manteniendo este cambio" (corrección internalizada)
```

### Implementación en Frontend

```typescript
function getInternalizationMessage(action: Action): string {
  switch (action.internalization_reason) {
    case 'HABIT_FORMED':
      return "Esta acción ya forma parte de tu rutina diaria. ¡Sigue así!";
    
    case 'BIOMARKER_IMPROVED':
      return `Tu ${action.target_biomarker} mejoró. Mantén este cambio.`;
    
    case 'LOW_FRICTION_ADOPTED':
      return "Ya adoptaste este cambio. Continúa con este hábito.";
    
    case 'LOWER_PRIORITY':
      return "Enfócate en problemas más urgentes esta semana.";
    
    case 'EDUCATION_DELIVERED':
      return "Conocimiento adquirido. Aplícalo en tu día a día.";
    
    default:
      return "Esta acción ya cumplió su propósito semanal.";
  }
}
```

---

## TABLA DE DECISIÓN

| Tipo Acción | Completada 1 Semana | Completada 2 Semanas | Completada 3 Semanas | Biomarcador Mejoró | ¿Internalizar? |
|-------------|---------------------|----------------------|----------------------|-------------------|----------------|
| **HÁBITO** | ❌ No | ✅ Sí | ✅ Sí | N/A | ✅/❌ Basado en semanas |
| **CORRECCIÓN** | ❌ No | ❌ No | ✅ Sí (si fácil) | ✅ Sí | ✅ Si mejora o ≥3 semanas |
| **EDUCATIVA** | ✅ Sí (auto) | ✅ Sí (auto) | ✅ Sí (auto) | N/A | ✅ Siempre después 1 sem |

---

## VALIDACIONES DEL SISTEMA

### Validación 1: Max 3 Acciones Activas
```typescript
function validateMaxActiveActions(userId: string, week: string): void {
  const activeActions = getActiveActions(userId, week);
  
  if (activeActions.length > 3) {
    throw new Error(`User has ${activeActions.length} active actions (max 3)`);
  }
}
```

### Validación 2: Acciones Internalizadas No Ocupan Slots
```typescript
function validateInternalizedNotActive(userId: string): void {
  const actions = getAllActions(userId);
  
  const internalizedButActive = actions.filter(
    a => a.status === 'INTERNALIZED' && a.is_active === true
  );
  
  if (internalizedButActive.length > 0) {
    throw new Error('Internalized actions cannot be active');
  }
}
```

### Validación 3: Historial de Internalización
```typescript
// Para cada acción internalizada, guardar:
interface InternalizationLog {
  action_id: string;
  user_id: string;
  internalized_at: Date;
  reason: InternalizationReason;
  biomarker_state_at_time: BiomarkerState;
  consecutive_weeks_completed: number;
}
```

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Criterio 1: Nunca hay más de 3 acciones activas
```typescript
const activeActions = getActiveActions(userId, currentWeek);
assert(activeActions.length <= 3);
```

### ✅ Criterio 2: Acciones pueden desaparecer sin fricción
```
Usuario cumple "Caminar" por 2 semanas
→ Acción desaparece de slots
→ Usuario NO pregunta "¿por qué desapareció?"
→ Copy claro: "Ya forma parte de tu rutina"
```

### ✅ Criterio 3: Ejercicio no se acumula semana a semana
```
Semana 1: "Caminar" → 100%
Semana 2: "Caminar" → 100%
Semana 3: [INTERNALIZADA]
         → Solo 2 slots ocupados (no 3)
         → Usuario no ve "Caminar (pendiente)"
```

### ✅ Criterio 4: Usuario no siente deuda
```
Usuario no completa "Reducir grasas" en Semana 1
Semana 2: Aparece HbA1c crítico
        → "Reducir grasas" se INTERNALIZA (menor prioridad)
        → Usuario NO ve "Reducir grasas (pendiente de S1)"
        → Usuario ve 3 acciones NUEVAS para HbA1c
```

---

## DIAGRAMA DE FLUJO

```
┌──────────────────────────────────────┐
│ Inicio de Semana                     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ Para cada acción de semana anterior  │
└────────────┬─────────────────────────┘
             │
             ▼
      ┌──────┴──────┐
      │ ¿Mejoró el  │
      │ biomarcador?│
      └──────┬──────┘
         SÍ │   │ NO
            │   ▼
            │  ┌──────────────────┐
            │  │ ¿Completada ≥2   │
            │  │ semanas (hábito)?│
            │  └──────┬───────────┘
            │     SÍ │   │ NO
            │        │   ▼
            │        │  ┌──────────────────┐
            │        │  │ ¿Completada ≥3   │
            │        │  │ semanas (fácil)? │
            │        │  └──────┬───────────┘
            │        │     SÍ │   │ NO
            │        │        │   ▼
            │        │        │  ┌──────────────┐
            │        │        │  │ ¿Problema    │
            │        │        │  │ más urgente? │
            │        │        │  └──────┬───────┘
            │        │        │     SÍ │   │ NO
            ▼        ▼        ▼        ▼   │
      ┌─────────────────────────────────┐ │
      │ INTERNALIZAR                    │ │
      │ - Marcar como internalized      │ │
      │ - Liberar slot                  │ │
      │ - Guardar en historial          │ │
      └─────────────────────────────────┘ │
                                          │
                                          ▼
                                    ┌─────────────┐
                                    │ CONTINUAR   │
                                    │ - Ocupa slot│
                                    └─────────────┘
```

---

## RESUMEN EJECUTIVO

**CONCEPTO:**
Internalización = Acción sale del set semanal porque ya cumplió su propósito inmediato.

**REGLAS:**
1. ✅ Biomarcador mejoró → INTERNALIZAR
2. ✅ Hábito formado (≥2 sem) → INTERNALIZAR
3. ✅ Baja fricción (≥3 sem fácil) → INTERNALIZAR
4. ✅ Menor prioridad → INTERNALIZAR
5. ✅ Educativa (>1 sem) → INTERNALIZAR automáticamente

**RESULTADO:**
- Siempre ≤3 acciones activas
- Acciones salen sin fricción
- Usuario enfocado, no abrumado
- Sin deuda psicológica
