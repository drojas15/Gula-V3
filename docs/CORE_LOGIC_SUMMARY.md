# GULA Core Logic Summary

## ✅ Implementation Complete

All core logic for the preventive health decision-support system has been implemented according to specifications.

## 1. Biomarkers (V1) ✅

**Exactly 10 biomarkers** with exact ranges:

| Biomarker | Weight | Unit | OPTIMAL | GOOD | OUT_OF_RANGE | CRITICAL |
|-----------|--------|------|---------|------|--------------|----------|
| LDL | 18 | mg/dL | <80 | 80-99 | 100-159 | >=160 |
| HBA1C | 16 | % | <5.4 | 5.4-5.6 | 5.7-6.4 | >=6.5 |
| FASTING_GLUCOSE | 12 | mg/dL | 70-89 | 90-99 | 100-125 | >=126 |
| TRIGLYCERIDES | 10 | mg/dL | <100 | 100-149 | 150-399 | >=400 |
| ALT | 10 | U/L | <25 | 25-40 | 41-100 | >100 |
| HS_CRP | 10 | mg/L | <0.7 | 0.7-2.0 | 2.1-10 | >10 |
| HDL | 8 | mg/dL | >=60 | 45-59 | 30-44 | <30 |
| AST | 6 | U/L | <25 | 25-40 | 41-100 | >100 |
| EGFR | 6 | ml/min | >=90 | 75-89 | 45-74 | <45 |
| URIC_ACID | 4 | mg/dL | 4.0-5.5 | 5.6-6.5 | 6.6-8.0 | >8.0 |

**Total Weight:** 100 points

## 2. Health Score ✅

**Formula:**
```
Score = (Σ(biomarker_weight × status_multiplier) / total_weight) × 100
```

**Multipliers:**
- OPTIMAL: 1.0
- GOOD: 0.8
- OUT_OF_RANGE: 0.4
- CRITICAL: 0.0

**Returns:**
- `total_score` (0-100)
- `contribution` per biomarker (weight × multiplier)
- `contribution_percentage` per biomarker
- Priority ranking by risk

## 3. Recommendations (Key-Based) ✅

Each biomarker + status returns:
- `status`: OPTIMAL | GOOD | OUT_OF_RANGE | CRITICAL
- `traffic_light`: GREEN | YELLOW | ORANGE | RED
- `risk_key`: e.g., "ldl.out_of_range.risk"
- `recommendation_keys[]`: max 3 lifestyle actions

**All keys are lowercase with dots:**
- `ldl.reduce_saturated_fat`
- `hba1c.add_cardio`
- `glucose.increase_fiber`

## 4. Weekly Action System ✅

**Action Structure:**
```typescript
{
  action_id: string;
  category: ACTIVITY | NUTRITION | ELIMINATION | RECOVERY;
  weekly_target: string; // "150_minutes", "5_days", "0_servings"
  success_metric: string;
  impacted_biomarkers: BiomarkerKey[];
  difficulty: LOW | MEDIUM | HIGH;
  progress: number; // 0-100
  completion_state: PENDING | IN_PROGRESS | COMPLETED;
}
```

**Action Categories:**
- **ACTIVITY**: Cardio, exercise, movement
- **NUTRITION**: Increase fiber, water, omega-3
- **ELIMINATION**: Remove alcohol, trans fats, sugar
- **RECOVERY**: Sleep, stress reduction

## 5. Weekly Action Selection Logic ✅

**Rules:**
1. Identify biomarkers NOT in OPTIMAL
2. Sort by:
   - CRITICAL first
   - Then OUT_OF_RANGE
   - Weighted by biomarker score weight
3. Select:
   - 1 primary action (highest risk biomarker)
   - Up to 2 secondary actions
4. Do NOT repeat completed actions unless biomarker still OUT_OF_RANGE

**Max 3 actions per week**

## 6. Dashboard Output ✅

API returns:
```json
{
  "healthScore": 73,
  "biomarkers": [
    {
      "biomarker": "LDL",
      "value": 145,
      "unit": "mg/dL",
      "status": "OUT_OF_RANGE",
      "trafficLight": "ORANGE",
      "weight": 18,
      "contribution": 7.2,
      "contribution_percentage": 7.2,
      "riskKey": "ldl.out_of_range.risk",
      "recommendationKeys": ["ldl.reduce_saturated_fat", "ldl.increase_fiber", "ldl.add_cardio"]
    }
  ],
  "priorities": [
    {
      "biomarker": "LDL",
      "urgency": "HIGH",
      "messageKey": "ldl.priority.high",
      "contribution_percentage": 7.2
    }
  ],
  "weekly_actions": [
    {
      "action_id": "ldl.add_cardio",
      "category": "ACTIVITY",
      "weekly_target": "150_minutes",
      "success_metric": "minutes_completed",
      "impacted_biomarkers": ["LDL", "HDL", "HS_CRP", "TRIGLYCERIDES"],
      "difficulty": "MEDIUM",
      "progress": 0,
      "completion_state": "PENDING"
    }
  ],
  "primary_biomarker": "LDL",
  "week_start_date": "2024-01-15"
}
```

## 7. Non-Goals ✅

**NOT implemented:**
- ❌ Medical diagnosis
- ❌ Medication recommendations
- ❌ Supplement recommendations
- ❌ Medical advice

**ONLY implemented:**
- ✅ Lifestyle recommendations
- ✅ Decision-support system
- ✅ Actionable weekly goals

## File Structure

```
backend/src/
├── config/
│   ├── biomarkers.config.ts      # 10 biomarkers, ranges, weights
│   ├── recommendations.config.ts  # Recommendation keys
│   └── actions.config.ts          # Action definitions
├── services/
│   ├── scoring-engine.service.ts  # Core scoring logic
│   ├── weekly-actions.service.ts  # Action selection
│   ├── pdf-parser.service.ts      # PDF extraction
│   └── biomarker-analyzer.service.ts # Value extraction
└── routes/
    └── exam.routes.ts             # API endpoints
```

## Key Principles

1. **Backend logic in English only** ✅
2. **No medical diagnosis** ✅
3. **No user-facing text in backend** ✅
4. **Message keys + recommendation keys** ✅
5. **Max 3 actions per week** ✅
6. **Lifestyle-based only** ✅

## Testing

Unit tests available in `backend/tests/scoring-engine.test.ts`

## Next Steps

1. Connect to database (PostgreSQL)
2. Implement action progress tracking
3. Add weekly action history
4. Frontend i18n translations for all keys

