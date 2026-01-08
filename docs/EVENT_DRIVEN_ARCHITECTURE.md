# Event-Driven Architecture - GULA

## Overview

GULA uses an event-driven architecture for health score recalculation. This ensures:
- **No unnecessary computation** - Score only recalculates on clinical events
- **No user confusion** - Score doesn't change on clicks or actions
- **Clinical integrity** - Score is clinical-operational, not gamified

## Events That Trigger Recalculation

### 1. LabResultsIngested (Event #1 - Most Important)

**Trigger:** New exam uploaded (PDF / values)

**What happens:**
1. Parse values
2. Recalculate states (optimal / good / out of range / critical)
3. Recalculate score
4. Recalculate trends
5. Reset Weekly Action Engine

**UX:** "Nuevo examen recibido → Score actualizado"

**Handler:** `handleLabResultsIngested()`

### 2. BiomarkerValueEdited

**Trigger:** Manual correction of data

**Cases:**
- User corrects misparsed value
- Changes unit
- Uploads new PDF for same exam

**What happens:**
1. Recalculate only the affected biomarker
2. Recalculate score
3. Recalculate trend ONLY if previous value changed

**Handler:** `handleBiomarkerValueEdited()`

### 3. MonthlyHealthSnapshot

**Trigger:** Monthly cycle closure (every 30 days)

**What happens:**
- Does NOT change clinical values
- Does change:
  - Projection
  - Narrative
  - Next action

**Use:** Show "expected trend" vs real, prepare user for next exam

**Important:** Do not invent clinical improvement without exam

**Handler:** `handleMonthlyHealthSnapshot()`

## Events That DO NOT Recalculate Score

### ❌ ActionCompleted
- Actions influence focus
- Actions influence projection
- Actions do NOT directly influence score
- If they did, it would break trust: "I walked 3 days and my cholesterol magically dropped"

### ❌ DailyHabitTracking
- This is soft input, not clinical output
- Used for projections only

## Services Architecture

### BiomarkerEvaluator
- Evaluates biomarker values
- Determines status (OPTIMAL / GOOD / OUT_OF_RANGE / CRITICAL)
- Pure function - no side effects

### HealthScoreCalculator
- Calculates health score from evaluations
- Formula: `round(Σ (biomarker_weight × status_multiplier))`
- Pure function - no side effects

### TrendAnalyzer
- Analyzes trends for biomarkers and health score
- Uses normalized delta with 3% threshold
- Compares last 2 data points

### WeeklyActionEngine
- Selects weekly actions based on biomarker analysis
- Max 3 actions per week
- Considers severity, weight, and trend

### ProjectionEngine (Soft Logic)
- Provides projections based on actions
- Does NOT touch actual health score
- Used for narrative and guidance only

## Event Bus

Simple event bus implementation:

```typescript
eventBus.on('LabResultsIngested', handler);
eventBus.emit(event);
```

**Events:**
- `LabResultsIngested`
- `BiomarkerValueEdited`
- `MonthlyHealthSnapshot`

**Nothing else.**

## Cron Jobs (Only 2)

### Weekly (Monday 00:00 UTC)
- **Job:** `generateWeeklyActions()`
- **Purpose:** Generate weekly actions for all active users
- **Does NOT:** Recalculate health scores

### Monthly (1st of month 00:00 UTC)
- **Job:** `generateMonthlySnapshot()`
- **Purpose:** Generate monthly health snapshot (narrative, projections)
- **Does NOT:** Recalculate health scores

## Projection Logic (Without Touching Score)

### Function
```typescript
projected_trend = function(
  biomarker_status,
  trend_direction,
  actions_completed_last_30d
)
```

### Example
- LDL OUT_OF_RANGE
- Trend: ↓ (improving)
- Actions completed: 80%
- → "Probabilidad alta de mejora en próximo examen"

**Projection ≠ Score**

Projections are informational only. They do NOT affect clinical scores.

## Implementation Flow

### Exam Upload Flow
1. User uploads PDF
2. Parse biomarkers
3. Emit `LabResultsIngested` event
4. Event handler:
   - Evaluates biomarkers
   - Calculates score
   - Analyzes trends
   - Generates weekly actions
5. Save to database
6. Return response to user

### Action Completion Flow
1. User completes action
2. Update action progress
3. **DO NOT** emit any score recalculation event
4. Update projection only (soft logic)

### Monthly Snapshot Flow
1. Cron job runs on 1st of month
2. Emit `MonthlyHealthSnapshot` event
3. Event handler:
   - Gets current health data
   - Gets actions completed in last 30 days
   - Generates projections (soft logic)
   - Generates narrative
   - **DO NOT** recalculate score

## Important Principles

1. **Score is clinical-operational, not gamified**
2. **Score only changes with clinical data (exams)**
3. **Actions influence projections, not scores**
4. **Projections are informational, not clinical**
5. **Event-driven = predictable and explainable**

## File Structure

```
backend/src/
├── events/
│   ├── event-bus.ts          # Event bus implementation
│   └── event-handlers.ts     # Event handlers
├── services/
│   ├── biomarker-evaluator.service.ts
│   ├── health-score-calculator.service.ts
│   ├── trend-analyzer.service.ts
│   ├── projection-engine.service.ts
│   └── weekly-actions.service.ts
└── jobs/
    ├── cron.ts                # Cron job initialization
    ├── weekly-actions.job.ts  # Weekly job
    └── monthly-snapshot.job.ts # Monthly job
```

