# CIERRE SEMANAL - IMPLEMENTACIÓN COMPLETA

**Objetivo:** Implementar un cierre semanal claro y repetible que resuma la semana sin juicio, marque transición y refuerce el hábito de volver
**Estado:** ✅ IMPLEMENTADO - LISTO PARA INTEGRACIÓN

---

## OVERVIEW

Sistema de cierre semanal que:
1. ✅ Se muestra **SOLO 1 vez por semana** (al inicio de nueva semana o primera entrada)
2. ✅ Tiene **3 bloques claros**: Resumen, Acciones, Transición
3. ✅ Ejecuta **re-cálculo semanal** con adaptación y reemplazos
4. ✅ **Copy empático** sin culpa ni deuda
5. ✅ Integración con **sistema de adaptación V2**

---

## ARCHIVOS CREADOS

### 1. `/frontend/components/WeeklyTransitionModal.tsx`
**Componente de UI del cierre semanal**

**PASO 2 — CONTENIDO DEL CIERRE (3 BLOQUES):**

#### Bloque 1: Resumen Corto
```tsx
<h2>Semana cerrada</h2>
<p>
  {hadProgress 
    ? 'Hubo avances en algunas prioridades.'
    : 'Esta semana fue tranquila. Recalculamos con lo que hay.'
  }
</p>
```

#### Bloque 2: Acciones (Sin Culpa)
```tsx
<h3>Estas fueron tus prioridades</h3>
{actions.map(action => (
  <div>
    {/* Check / progreso, SIN porcentajes grandes */}
    {isCompleted ? '✓' : hasProgress ? '→' : '○'}
    <span>{action.title}</span>
    {/* NO listar fallos */}
  </div>
))}
```

#### Bloque 3: Transición
```tsx
<p>Esta semana nos enfocamos en lo que más impacto tiene ahora.</p>
<button>Ver prioridades de esta semana</button>
```

### 2. `/backend/src/services/weekly-transition.service.ts`
**Lógica de Detección y Re-cálculo**

**PASO 1 — MOMENTO DE CIERRE:**
```typescript
function hasSeenWeeklyTransition(userId: string): boolean {
  // Compara last_transition_seen con inicio de semana actual
  // Si last_transition_seen >= currentWeekStart → ya vio esta semana
}
```

**PASO 3 — RE-CÁLCULO:**
```typescript
async function executeWeeklyRecalculation(userId: string): Promise<boolean> {
  // 1. Obtener acciones de semana anterior
  // 2. Evaluar cada acción con evaluateActionAdaptation()
  // 3. Aplicar decisiones (DEGRADE, REPLACE, RETIRE)
  // 4. Generar nuevo set de 3 acciones
}
```

**PASO 6 — FRECUENCIA:**
- `hasSeenWeeklyTransition()`: Verifica si ya vio transición esta semana
- `markWeeklyTransitionSeen()`: Marca que vio la transición
- Solo 1 vez por semana, NO repetir

### 3. `/backend/src/routes/weekly-transition.routes.ts`
**Endpoints REST**

#### `GET /api/weekly-transition`
Obtiene datos para mostrar el modal:
```json
{
  "shouldShowTransition": true,
  "previousWeek": {
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "weekRange": "8-14 Enero",
    "actions": [
      {
        "id": "action_1",
        "title": "activity.cardio.title",
        "progress": 50,
        "completion_state": "IN_PROGRESS"
      }
    ]
  },
  "currentWeek": {
    "weekStart": "2024-01-15",
    "weekEnd": "2024-01-21"
  }
}
```

#### `POST /api/weekly-transition/confirm`
Confirma transición y ejecuta re-cálculo:
- Ejecuta `executeWeeklyRecalculation()`
- Marca `last_transition_seen`
- Retorna éxito

#### `POST /api/weekly-transition/dismiss`
Usuario cierra sin confirmar:
- Marca `last_transition_seen` (para no volver a mostrar)
- NO ejecuta re-cálculo

### 4. `/frontend/lib/api.ts`
**Cliente API**

```typescript
export const weeklyTransitionAPI = {
  getTransitionData: async (): Promise<WeeklyTransitionData> => {},
  confirmTransition: async (): Promise<{ success: boolean }> => {},
  dismissTransition: async (): Promise<{ success: boolean }> => {}
};
```

### 5. `/backend/DATABASE_MIGRATION_WEEKLY_TRANSITION.md`
**Migración de DB**

```sql
ALTER TABLE users 
ADD COLUMN last_transition_seen TEXT DEFAULT NULL;
```

---

## COPY - PROHIBIDO vs RECOMENDADO

### ❌ PASO 4 — COPY PROHIBIDO
```
"Fallaste"
"No cumpliste"
"Deberías"
"Objetivo no alcanzado"
```

### ✅ PASO 5 — COPY RECOMENDADO
```
"Seguimos ajustando"
"Probamos un enfoque distinto"
"Vamos paso a paso"
"Hubo avances en algunas prioridades"
"Esta semana fue tranquila. Recalculamos con lo que hay."
```

---

## FLUJO COMPLETO

### Usuario entra el Lunes (nueva semana)

```
1. Dashboard carga
   ↓
2. Fetch /api/weekly-transition
   ↓
3. Backend verifica:
   - last_transition_seen = "2024-01-08"
   - currentWeekStart = "2024-01-15"
   - last_transition_seen < currentWeekStart
   ↓
4. Backend retorna:
   shouldShowTransition = true
   previousWeek = { actions: [...] }
   ↓
5. Frontend muestra WeeklyTransitionModal
   ├─ Bloque 1: "Semana cerrada" + resumen dinámico
   ├─ Bloque 2: Lista de acciones con checks
   └─ Bloque 3: "Ver prioridades de esta semana"
   ↓
6. Usuario hace click en "Ver prioridades..."
   ↓
7. Frontend llama POST /api/weekly-transition/confirm
   ↓
8. Backend ejecuta:
   ├─ executeWeeklyRecalculation()
   │  ├─ Obtiene acciones previas
   │  ├─ Evalúa adaptación (DEGRADE/REPLACE)
   │  └─ Genera 3 nuevas acciones
   └─ markWeeklyTransitionSeen("2024-01-15")
   ↓
9. Frontend cierra modal
   ↓
10. Dashboard se refresca con 3 nuevas acciones
```

### Usuario entra el Martes (misma semana)

```
1. Dashboard carga
   ↓
2. Fetch /api/weekly-transition
   ↓
3. Backend verifica:
   - last_transition_seen = "2024-01-15"
   - currentWeekStart = "2024-01-15"
   - last_transition_seen >= currentWeekStart
   ↓
4. Backend retorna:
   shouldShowTransition = false
   ↓
5. Frontend NO muestra modal
   ↓
6. Usuario ve dashboard normal
```

---

## INTEGRACIÓN EN DASHBOARD

Añadir al `dashboard/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import WeeklyTransitionModal from '@/components/WeeklyTransitionModal';
import { weeklyTransitionAPI, WeeklyTransitionData } from '@/lib/api';

export default function DashboardPage() {
  const [transitionData, setTransitionData] = useState<WeeklyTransitionData | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // Cargar datos de transición al montar
  useEffect(() => {
    async function checkTransition() {
      try {
        const data = await weeklyTransitionAPI.getTransitionData();
        setTransitionData(data);
        setShowTransitionModal(data.shouldShowTransition);
      } catch (error) {
        console.error('Error checking weekly transition:', error);
      }
    }
    
    checkTransition();
  }, []);

  // Handler para confirmar transición
  const handleConfirmTransition = async () => {
    try {
      await weeklyTransitionAPI.confirmTransition();
      setShowTransitionModal(false);
      
      // Refrescar dashboard con nuevas acciones
      window.location.reload();
    } catch (error) {
      console.error('Error confirming transition:', error);
    }
  };

  // Handler para cerrar sin confirmar
  const handleCloseTransition = async () => {
    try {
      await weeklyTransitionAPI.dismissTransition();
      setShowTransitionModal(false);
    } catch (error) {
      console.error('Error dismissing transition:', error);
    }
  };

  return (
    <div>
      {/* Modal de transición */}
      {transitionData && (
        <WeeklyTransitionModal
          isOpen={showTransitionModal}
          onClose={handleCloseTransition}
          onConfirm={handleConfirmTransition}
          previousWeekActions={transitionData.previousWeek?.actions || []}
          weekRange={transitionData.previousWeek?.weekRange || ''}
        />
      )}
      
      {/* Resto del dashboard */}
      <HealthScoreCard />
      <WeeklyActionsCard />
      {/* ... */}
    </div>
  );
}
```

---

## TESTING

### Test Case 1: Primera vez (Lunes, nueva semana)
```
Setup:
- user.last_transition_seen: NULL
- currentWeekStart: "2024-01-15"
- previousWeek.actions: [action1, action2, action3]

Expected:
- shouldShowTransition: true ✅
- Modal se muestra
- Bloque 1: "Semana cerrada"
- Bloque 2: Lista de 3 acciones
- Bloque 3: "Ver prioridades..."
```

### Test Case 2: Múltiples entradas en la misma semana
```
Setup:
- Lunes: user.last_transition_seen = "2024-01-15" (después de confirmar)
- Martes: currentWeekStart = "2024-01-15"

Expected:
- shouldShowTransition: false ❌
- Modal NO se muestra
- Dashboard normal
```

### Test Case 3: Con progreso vs sin progreso
```
Caso A (con progreso):
- previousWeek.actions: [{ progress: 50 }, { progress: 100 }]
- Bloque 1: "Hubo avances en algunas prioridades."

Caso B (sin progreso):
- previousWeek.actions: [{ progress: 0 }, { progress: 0 }]
- Bloque 1: "Esta semana fue tranquila. Recalculamos con lo que hay."
```

### Test Case 4: Re-cálculo ejecuta adaptación
```
Setup:
- action1: HARD, progress=0 por 2 semanas

Expected después de confirm:
- action1: MEDIUM (degradada)
- message: "Reducimos el objetivo..."
- 3 nuevas acciones en dashboard
```

---

## CRITERIOS DE ACEPTACIÓN

### ✅ Usuario entiende que una semana terminó
- Modal con "Semana cerrada" en grande
- Rango de fechas visible ("8-14 Enero")
- Separación clara entre semana anterior y actual

### ✅ No siente deuda
- Copy: "Hubo avances" o "Esta semana fue tranquila"
- NO "Fallaste" o "No cumpliste"
- Checks verdes para completadas
- Arrow para en progreso
- Circle para pendientes (neutro)

### ✅ Ve claramente que empieza otra
- Bloque 3: "Esta semana nos enfocamos en..."
- Botón claro: "Ver prioridades de esta semana"
- Después de confirmar: dashboard se actualiza con 3 nuevas acciones

### ✅ Siempre termina con 3 nuevas prioridades
- `executeWeeklyRecalculation()` genera máximo 3
- Adaptación aplicada antes de selección
- Usuario ve exactamente 3 acciones

---

## PRÓXIMOS PASOS

### 1. Migración de DB ⚠️
```bash
cd backend
sqlite3 gula.db
> ALTER TABLE users ADD COLUMN last_transition_seen TEXT DEFAULT NULL;
```

### 2. Añadir Rutas al Backend
En `backend/src/index.ts`:
```typescript
import weeklyTransitionRoutes from './routes/weekly-transition.routes';
app.use('/api/weekly-transition', weeklyTransitionRoutes);
```

### 3. Integrar en Dashboard
Copiar el código de integración en `frontend/app/dashboard/page.tsx`

### 4. Testing End-to-End
- Crear usuario de prueba
- Simular semana con progress=0
- Verificar que modal aparece el lunes
- Confirmar transición
- Verificar que NO aparece el martes

---

## CONCLUSIÓN

✅ **Sistema completamente implementado**
- Modal con 3 bloques claros
- Lógica de detección de nueva semana
- Re-cálculo semanal integrado
- Copy empático y positivo
- Frecuencia: 1 vez por semana

🔧 **Listo para integración**
- Migrar DB (1 campo)
- Añadir rutas al backend
- Integrar en dashboard

🎯 **Criterios cumplidos**
- Usuario entiende cierre de semana
- No siente deuda
- Ve transición clara
- Siempre 3 nuevas prioridades

**Siguiente acción:** Migrar DB y añadir rutas al backend
