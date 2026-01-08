# GULA Scoring Logic Documentation

## Overview

The scoring engine is the core IP of GULA. It calculates a health score (0-100) based on 10 biomarkers with specific weights and reference ranges.

## Biomarkers

Exactly 10 biomarkers are used (DO NOT ADD MORE):

1. **LDL** (Weight: 18) - Low-density lipoprotein cholesterol
2. **HBAIC** (Weight: 16) - Hemoglobin A1c
3. **FASTING_GLUCOSE** (Weight: 12) - Fasting blood glucose
4. **TRIGLYCERIDES** (Weight: 10) - Triglycerides
5. **ALT** (Weight: 10) - Alanine aminotransferase
6. **HS_CRP** (Weight: 10) - High-sensitivity C-reactive protein
7. **HDL** (Weight: 8) - High-density lipoprotein cholesterol
8. **AST** (Weight: 6) - Aspartate aminotransferase
9. **EGFR** (Weight: 6) - Estimated glomerular filtration rate
10. **URIC_ACID** (Weight: 4) - Uric acid

**Total Weight:** 100

## Status Levels

Each biomarker is assigned one of four status levels:

1. **OPTIMAL** - Best possible range
2. **GOOD** - Acceptable range
3. **OUT_OF_RANGE** - Concerning range
4. **CRITICAL** - Requires immediate attention

## Status Multipliers

Each status has a multiplier used in score calculation:

- **OPTIMAL:** 1.0
- **GOOD:** 0.8
- **OUT_OF_RANGE:** 0.4
- **CRITICAL:** 0.0

## Score Calculation

The health score is calculated using the following formula:

```
Score = (Σ(biomarker_weight × status_multiplier) / total_weight) × 100
```

### Example

If we have:
- LDL (weight 18) = OPTIMAL (multiplier 1.0) → contribution = 18 × 1.0 = 18
- HDL (weight 8) = CRITICAL (multiplier 0.0) → contribution = 8 × 0.0 = 0
- FASTING_GLUCOSE (weight 12) = GOOD (multiplier 0.8) → contribution = 12 × 0.8 = 9.6

Total contribution = 18 + 0 + 9.6 = 27.6
Total weight = 18 + 8 + 12 = 38

Score = (27.6 / 38) × 100 = 72.6 ≈ 73

## Reference Ranges

Reference ranges are defined in `backend/src/config/biomarkers.config.ts`.

Each biomarker has ranges for each status level. The engine checks values in order:
1. CRITICAL (most severe)
2. OUT_OF_RANGE
3. GOOD
4. OPTIMAL (default if no other matches)

### Range Matching Logic

For ranges with both min and max:
- Value must be >= min AND <= max

For ranges with only min:
- Value must be >= min

For ranges with only max:
- Value must be <= max

## Traffic Lights

Each biomarker status maps to a traffic light color:

- **OPTIMAL** → GREEN
- **GOOD** → YELLOW
- **OUT_OF_RANGE** → ORANGE
- **CRITICAL** → RED

## Priorities

The system determines top 3 priorities based on:

1. Status severity (CRITICAL > OUT_OF_RANGE > GOOD > OPTIMAL)
2. Biomarker weight (higher weight = higher priority within same status)

Each priority has an urgency level:
- **HIGH:** CRITICAL or OUT_OF_RANGE status
- **MEDIUM:** GOOD status
- **LOW:** OPTIMAL status

## Recommendations

Each biomarker-status combination has up to 3 recommendation keys. These keys are translated by the frontend using i18n.

Recommendation keys follow the pattern:
```
{biomarker}.{action}
```

Example: `ldl.reduce_saturated_fat`

## Important Notes

1. **Backend NEVER returns human-readable text** - only keys
2. **Frontend NEVER calculates medical logic** - only displays
3. **All biomarker logic in English** (code, keys, comments)
4. **All user-facing content in Spanish LATAM**
5. **Scoring is deterministic** - same inputs always produce same outputs
6. **Scoring is stateless** - no dependencies on previous calculations

## Testing

Unit tests are located in `backend/tests/scoring-engine.test.ts`.

Test coverage includes:
- Status determination for all biomarkers
- Score calculation with various combinations
- Priority ordering
- Edge cases (all optimal, all critical, etc.)

