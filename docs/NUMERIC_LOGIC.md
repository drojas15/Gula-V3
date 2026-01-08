# Lógica Numérica Exacta - GULA

## 1. HEALTH SCORE - MATH EXACTA

### A. Pesos por Biomarcador (suman 100)

| Biomarcador | Peso | Razón |
|-------------|------|-------|
| LDL | 15 | Cardiometabólico pesa más |
| Triglicéridos | 10 | Cardiometabólico |
| HDL | 8 | Cardiometabólico |
| Glucosa ayunas | 12 | Cardiometabólico |
| HbA1c | 12 | Cardiometabólico |
| ALT | 8 | Hepático |
| AST | 5 | Contextual (pesa menos) |
| hs-CRP | 10 | Inflamación |
| Creatinina/eGFR | 10 | Renal |
| Ácido úrico | 10 | Metabólico |

**Total: 100**

### B. Puntaje por Estado (Determinístico)

| Estado | Multiplicador |
|--------|---------------|
| OPTIMAL | 1.00 |
| GOOD | 0.75 |
| OUT_OF_RANGE | 0.40 |
| CRITICAL | 0.10 |

### C. Fórmula

```
health_score = round(Σ (biomarker_weight × status_multiplier))
```

**Ejemplo LDL OUT_OF_RANGE:**
- 15 × 0.40 = 6 pts

**Score final:** 0-100, sin magia, sin IA opaca.

## 2. TREND LOGIC (por Biomarcador)

### Input Mínimo
- Últimos 2 valores válidos
- Fecha
- Dirección "mejor es ↓ o ↑" (ej. LDL ↓ mejora, HDL ↑ mejora)

### A. Delta Normalizado

```
delta = (current_value - previous_value) / previous_value
```

### B. Umbrales (Anti-ruido)

| Condición | Resultado |
|-----------|-----------|
| \|delta\| < 3% | STABLE |
| ≥ +3% en dirección saludable | IMPROVING |
| ≥ +3% en dirección no saludable | WORSENING |

**Ejemplo LDL:**
- -5% → IMPROVING (↓ es mejor para LDL)
- +4% → WORSENING

### C. Trend Output (Solo Flecha)

- IMPROVING → ↑
- STABLE → →
- WORSENING → ↓
- NONE → (primer examen)

No gráficos aún. Dirección primero.

## 3. SCORE TREND (Macro)

### Regla Simple y Explicable

```
score_delta = current_health_score - previous_health_score
```

| Condición | Resultado |
|-----------|-----------|
| ≥ +2 pts | UP |
| ≤ -2 pts | DOWN |
| else | STABLE |

Esto evita falsos "mejoré" por ruido.

## 4. INTERACCIÓN SCORE ↔ ACCIONES

### El Score NO Decide Colores
- Los colores se basan SOLO en status
- OPTIMAL → GREEN, GOOD → YELLOW, etc.

### El Score SÍ Decide Narrativa
- Score bajo → mensajes más urgentes
- Score alto → mensajes de mantenimiento

### Las Acciones se Deciden por:

1. **Severidad (estado)**
   - CRITICAL > OUT_OF_RANGE > GOOD

2. **Peso**
   - Mayor peso = mayor prioridad

3. **Tendencia** (empeorando > estable > mejorando)
   - WORSENING > STABLE > IMPROVING

**Ejemplo:**
- LDL y TG ambos OUT_OF_RANGE (naranja)
- LDL empeora, TG mejora → LDL se prioriza

## 5. EDGE CASES (Importantes)

### Primer Examen
- `trend = NONE` para todos los biomarkers
- `score_trend = STABLE` (no hay comparación)

### Cambio de Laboratorio
- Ignora trend esa semana
- Muestra STABLE para evitar comparaciones inválidas

### AST Alto pero ALT Normal
- Baja prioridad (AST pesa menos: 5 vs ALT: 8)
- Mismo color según status
- No se prioriza en acciones

### Todo OPTIMAL
- `score ≥ 90` (todos en OPTIMAL = 100 pts teóricos, pero puede haber variaciones)
- 1 acción de mantenimiento solamente
- Dashboard en "modo mantenimiento"

## 6. Validaciones de Color

### STRICT COLOR LOGIC

Los colores se basan **SOLO** en status:

- OPTIMAL → GREEN
- GOOD → YELLOW
- OUT_OF_RANGE → ORANGE
- CRITICAL → RED

**IMPORTANTE:**
- Peso, score impact o prioridad **NUNCA** cambian el color
- Dos biomarkers OUT_OF_RANGE **DEBEN** tener el mismo color (ORANGE)

## 7. Ejemplos de Cálculo

### Ejemplo 1: Health Score

**Biomarkers:**
- LDL: 145 (OUT_OF_RANGE) → 15 × 0.40 = 6.0
- HDL: 45 (GOOD) → 8 × 0.75 = 6.0
- FASTING_GLUCOSE: 105 (OUT_OF_RANGE) → 12 × 0.40 = 4.8
- HBA1C: 5.8 (GOOD) → 12 × 0.75 = 9.0
- TRIGLYCERIDES: 180 (OUT_OF_RANGE) → 10 × 0.40 = 4.0
- ALT: 35 (GOOD) → 8 × 0.75 = 6.0
- AST: 32 (GOOD) → 5 × 0.75 = 3.75
- HS_CRP: 2.5 (GOOD) → 10 × 0.75 = 7.5
- EGFR: 85 (GOOD) → 10 × 0.75 = 7.5
- URIC_ACID: 6.2 (GOOD) → 10 × 0.75 = 7.5

**Total:** 6.0 + 6.0 + 4.8 + 9.0 + 4.0 + 6.0 + 3.75 + 7.5 + 7.5 + 7.5 = 62.05

**Health Score:** round(62.05) = **62**

### Ejemplo 2: Trend Calculation

**LDL:**
- Previous: 150 mg/dL
- Current: 142.5 mg/dL
- Delta: (142.5 - 150) / 150 = -0.05 = -5%
- |delta| = 5% ≥ 3% → Cambio significativo
- Delta < 0 (mejorando) → **IMPROVING** ↑

**HDL:**
- Previous: 42 mg/dL
- Current: 45 mg/dL
- Delta: (45 - 42) / 42 = 0.071 = +7.1%
- |delta| = 7.1% ≥ 3% → Cambio significativo
- Delta > 0 (mejorando para HDL) → **IMPROVING** ↑

### Ejemplo 3: Score Trend

- Previous Score: 58
- Current Score: 62
- Delta: 62 - 58 = +4 pts
- Delta ≥ +2 → **UP** ↑

## 8. Implementación

Toda la lógica está implementada en:
- `backend/src/config/biomarkers.config.ts` - Pesos y multiplicadores
- `backend/src/services/scoring-engine.service.ts` - Cálculo de health score
- `backend/src/services/dashboard.service.ts` - Cálculo de trends

