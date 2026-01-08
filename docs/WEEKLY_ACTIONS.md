# Weekly Actions System Documentation

## Overview

The Weekly Actions Engine selects up to 3 actionable lifestyle recommendations per week based on biomarker analysis. All actions are measurable and completable within 7 days.

## Action Structure

Each action includes:

```typescript
{
  action_id: string;              // e.g., "ldl.add_cardio"
  category: ActionCategory;       // ACTIVITY | NUTRITION | ELIMINATION | RECOVERY
  weekly_target: string;          // e.g., "150_minutes", "5_days", "0_servings"
  success_metric: string;         // e.g., "minutes_completed", "days_completed"
  impacted_biomarkers: string[]; // Biomarkers this action affects
  difficulty: DifficultyLevel;    // LOW | MEDIUM | HIGH
  progress: number;              // 0-100
  completion_state: CompletionState; // PENDING | IN_PROGRESS | COMPLETED
}
```

## Selection Logic

### Priority Order

1. **Filter**: Only biomarkers NOT in OPTIMAL status
2. **Sort by**:
   - Status severity: CRITICAL > OUT_OF_RANGE > GOOD
   - Then by biomarker weight (higher = higher priority)
3. **Select**:
   - 1 primary action from highest priority biomarker
   - Up to 2 secondary actions (from same or other biomarkers)
4. **Avoid repeats**: Skip completed actions unless biomarker is still OUT_OF_RANGE

### Example

If user has:
- LDL: OUT_OF_RANGE (weight 18)
- HDL: CRITICAL (weight 8)
- FASTING_GLUCOSE: GOOD (weight 12)

Selection:
1. Primary: HDL action (CRITICAL status takes priority)
2. Secondary 1: LDL action (OUT_OF_RANGE, higher weight than FASTING_GLUCOSE)
3. Secondary 2: FASTING_GLUCOSE action (GOOD status)

## Action Categories

### ACTIVITY
Physical exercise and movement
- Examples: cardio, strength training, walking
- Metrics: minutes_completed, sessions_completed

### NUTRITION
Dietary improvements
- Examples: increase fiber, increase water, increase omega-3
- Metrics: grams_consumed, servings_consumed, liters_consumed

### ELIMINATION
Removing harmful items
- Examples: eliminate alcohol, eliminate trans fats, reduce sugar
- Metrics: servings_eliminated, drinks_eliminated

### RECOVERY
Rest and recovery activities
- Examples: sleep quality, stress reduction
- Metrics: days_completed, hours_completed

## Weekly Target Format

Targets use format: `{number}_{unit}`

Examples:
- `150_minutes` - 150 minutes of activity
- `5_days` - 5 days of compliance
- `0_servings` - eliminate completely
- `35_grams_daily` - 35 grams per day
- `2_liters_daily` - 2 liters per day

## Progress Tracking

Progress is calculated as:
```
progress = (current_value / target_value) * 100
```

Completion states:
- **PENDING**: progress = 0
- **IN_PROGRESS**: 0 < progress < 100
- **COMPLETED**: progress >= 100

## API Response

Weekly actions are included in exam results:

```json
{
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

## Important Notes

- Maximum 3 actions per week
- Actions are lifestyle-based only (no medications, supplements, or medical advice)
- All action text is handled by frontend i18n (backend returns only keys)
- Actions are selected fresh each week based on current biomarker status
- Completed actions are not repeated unless biomarker is still out of range

