# Biomarker History & Progress Graph System

## Overview

System for displaying historical biomarker evolution. Used ONLY for historical visualization, never for diagnosis.

## Source of Truth

Biomarker history is **immutable**.

Data comes from `biomarker_result` table:
- `exam_date` - Real exam date, NOT upload date
- `value` - Raw biomarker value
- `unit` - Unit of measurement
- `status_at_time` - Status at time of exam (OPTIMAL | GOOD | OUT_OF_RANGE | CRITICAL)

**Never recalculate historical status.**

## Data Query

```sql
SELECT
  exam_date,
  value,
  status_at_time,
  unit
FROM biomarker_result
WHERE user_id = ?
  AND biomarker_code = ?
ORDER BY exam_date ASC
```

## Graph Rendering Rules

### X-axis
- `exam_date` (chronological)

### Y-axis
- Raw biomarker value
- Auto scale with ±10% padding
- No normalization

### Points
- Each exam = one point
- Point color depends ONLY on `status_at_time`:
  - OPTIMAL → GREEN
  - GOOD → YELLOW
  - OUT_OF_RANGE → ORANGE
  - CRITICAL → RED

### Lines
- Connect points with straight lines
- No smoothing
- No prediction
- No interpolation

## Threshold Lines

Draw horizontal reference lines using biomarker config:

- `optimal_upper_bound` - From RANGES[biomarker].OPTIMAL.max
- `good_upper_bound` - From RANGES[biomarker].GOOD.max
- `out_of_range_upper_bound` - From RANGES[biomarker].OUT_OF_RANGE.max

These lines are **static and global**. They do NOT depend on user data.

## Tooltip Content

On hover, show ONLY:
- Exam date
- Value + unit
- Status at that time (translated to Spanish in UI)

**Example:**
```
Examen: 12 Jun 2025
Valor: 148 mg/dL
Estado: Fuera de rango
```

**Do NOT show:**
- Health score
- Recommendations
- Predictions

## Trend Logic (UI Only)

Trend is calculated **ONLY** using the last two valid exams.

### Formula
```
delta = (last_value - previous_value) / previous_value
```

### Noise Threshold
- |delta| < 3% → STABLE

### Direction
Depends on biomarker:
- **Lower is better:** LDL, TG, Glucose, ALT, AST, hsCRP, Uric Acid
- **Higher is better:** HDL, eGFR

### Trend Output
- IMPROVING → ↑
- STABLE → →
- WORSENING → ↓
- NONE → (less than 2 exams)

### Display Text
"Comparado con tu examen anterior"

## Empty States

### 0 Exams
```
"Sube tus exámenes para empezar a ver tu evolución."
```

### 1 Exam
```
"Necesitamos al menos dos exámenes para mostrar tendencia."
```

## Time Gaps

If time between exams > 90 days:
- Keep straight line (no interpolation)
- Show tooltip note: "X meses entre exámenes"

**Do NOT interpolate missing time.**

## API Response Format

### GET /api/biomarkers/:biomarker/history

```json
{
  "biomarker": "LDL",
  "unit": "mg/dL",
  "points": [
    {
      "exam_date": "2024-01-15",
      "value": 150,
      "status_at_time": "OUT_OF_RANGE",
      "unit": "mg/dL"
    },
    {
      "exam_date": "2024-04-20",
      "value": 145,
      "status_at_time": "OUT_OF_RANGE",
      "unit": "mg/dL"
    }
  ],
  "trend": "IMPROVING",
  "trend_message_key": "biomarker_history.trend.improving",
  "threshold_lines": {
    "optimal_upper_bound": 80,
    "good_upper_bound": 99,
    "out_of_range_upper_bound": 159
  },
  "empty_state": "HAS_DATA",
  "time_gaps": [
    {
      "from_date": "2024-01-15",
      "to_date": "2024-04-20",
      "days": 95
    }
  ]
}
```

## Strict Non-Goals

**DO NOT:**
- Smooth curves
- Predict future values
- Change historical statuses
- Overlay health score
- Compare with other users
- Recalculate values

## Design Principle

**Historical clinical data is factual, not motivational.**
**Accuracy beats aesthetics.**
**Trust beats engagement.**

## Implementation

- `backend/src/models/BiomarkerResult.model.ts` - Data model
- `backend/src/services/biomarker-history.service.ts` - History logic
- `backend/src/controllers/biomarker-history.controller.ts` - API endpoints
- `backend/src/routes/biomarker-history.routes.ts` - Routes

## Database Schema (TODO)

```sql
CREATE TABLE biomarker_result (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  biomarker_code TEXT NOT NULL,
  exam_date DATE NOT NULL, -- Real exam date, NOT upload date
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  status_at_time TEXT NOT NULL, -- OPTIMAL | GOOD | OUT_OF_RANGE | CRITICAL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_biomarker_result_user_biomarker ON biomarker_result(user_id, biomarker_code);
CREATE INDEX idx_biomarker_result_exam_date ON biomarker_result(exam_date);
```

