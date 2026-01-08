# GULA Actions Library

## Overview

The Actions Library contains 33+ predefined lifestyle actions organized by category. These actions can be selected by the Weekly Action Engine based on biomarker analysis.

## Action Categories

### 🏃 ACTIVITY (8 actions)

Physical exercise and movement activities.

| Action ID | Weekly Target | Success Metric | Impacted Biomarkers | Difficulty |
|-----------|---------------|----------------|---------------------|------------|
| `activity.cardio_150` | 150_minutes | minutes_completed | LDL, HDL, HS_CRP, TRIGLYCERIDES | MEDIUM |
| `activity.daily_walk` | 30_minutes_x_5_days | days_completed | FASTING_GLUCOSE, HBA1C, HS_CRP | LOW |
| `activity.strength_2x` | 2_sessions | sessions_completed | HBA1C, FASTING_GLUCOSE, HDL | MEDIUM |
| `activity.no_sedentary_days` | no_zero_activity_days | active_days | TRIGLYCERIDES, HS_CRP | LOW |

### 🥗 NUTRITION (9 actions)

Dietary improvements and eating patterns.

| Action ID | Weekly Target | Success Metric | Impacted Biomarkers | Difficulty |
|-----------|---------------|----------------|---------------------|------------|
| `nutrition.fiber_25g` | 25g_fiber_daily | days_completed | LDL, TRIGLYCERIDES, FASTING_GLUCOSE | MEDIUM |
| `nutrition.no_sugary_drinks` | 0_sugary_drinks | days_completed | TRIGLYCERIDES, FASTING_GLUCOSE, HBA1C | LOW |
| `nutrition.vegetables_daily` | 2_servings_daily | days_completed | HS_CRP, ALT | LOW |
| `nutrition.low_refined_carbs` | 5_days_low_refined_carbs | days_completed | FASTING_GLUCOSE, HBA1C | MEDIUM |
| `nutrition.mediterranean_pattern` | 5_days | days_completed | LDL, HS_CRP, ALT | MEDIUM |
| `hydration.water_2l` | 2L_daily | days_completed | URIC_ACID, EGFR | LOW |

### 🚫 ELIMINATION (6 actions)

Removing harmful items from diet/lifestyle.

| Action ID | Weekly Target | Success Metric | Impacted Biomarkers | Difficulty |
|-----------|---------------|----------------|---------------------|------------|
| `elimination.no_alcohol` | 0_alcohol_days | days_completed | TRIGLYCERIDES, ALT, AST | MEDIUM |
| `elimination.no_ultra_processed` | 5_days | days_completed | LDL, HS_CRP | MEDIUM |
| `elimination.no_beer` | 0_beer | days_completed | URIC_ACID, TRIGLYCERIDES | LOW |
| `elimination.limit_fructose` | 0_sugary_snacks | days_completed | URIC_ACID, HBA1C | MEDIUM |
| `safety.no_nsaids` | 0_nsaids | days_completed | EGFR | LOW |

### 😴 RECOVERY (5 actions)

Sleep, stress reduction, and recovery activities.

| Action ID | Weekly Target | Success Metric | Impacted Biomarkers | Difficulty |
|-----------|---------------|----------------|---------------------|------------|
| `recovery.sleep_7h` | 7h_sleep_4_nights | nights_completed | HBA1C, FASTING_GLUCOSE, HS_CRP | MEDIUM |
| `recovery.fixed_sleep_schedule` | same_bedtime_4_days | days_completed | FASTING_GLUCOSE, HS_CRP | LOW |
| `recovery.stress_breaks` | 10min_x_5_days | sessions_completed | HS_CRP, HBA1C | LOW |
| `hydration.extra_on_training` | hydration_after_training | sessions_completed | AST, EGFR | LOW |

## Usage

### Direct Access

Actions can be accessed directly by their `action_id`:

```typescript
import { getActionByKey } from './config/actions.config';

const action = getActionByKey('activity.cardio_150');
```

### By Category

Get all actions in a category:

```typescript
import { getActionsByCategory } from './config/actions.config';

const activityActions = getActionsByCategory('ACTIVITY');
```

### By Biomarker

Get all actions that impact a specific biomarker:

```typescript
import { getActionsByBiomarker } from './config/actions.config';

const ldlActions = getActionsByBiomarker('LDL');
```

### Library Actions Only

Get only actions from the library (excludes biomarker-specific actions):

```typescript
import { getLibraryActions } from './config/actions.config';

const libraryActions = getLibraryActions();
```

## Action Selection

The Weekly Action Engine automatically selects actions from this library based on:

1. **Biomarker status** (CRITICAL > OUT_OF_RANGE > GOOD)
2. **Biomarker weight** (higher weight = higher priority)
3. **Action difficulty** (can be used for filtering)
4. **Impact overlap** (actions affecting multiple biomarkers are preferred)

## Weekly Target Formats

Actions use various target formats:

- **Time-based**: `150_minutes`, `30_minutes_x_5_days`, `10min_x_5_days`
- **Frequency-based**: `2_sessions`, `5_days`, `4_nights`
- **Elimination**: `0_sugary_drinks`, `0_alcohol_days`, `0_nsaids`
- **Daily goals**: `25g_fiber_daily`, `2_servings_daily`, `2L_daily`
- **Pattern-based**: `no_zero_activity_days`, `same_bedtime_4_days`

## Success Metrics

Each action has a `success_metric` that defines how progress is tracked:

- `minutes_completed` - For time-based activities
- `days_completed` - For daily compliance goals
- `sessions_completed` - For frequency-based activities
- `nights_completed` - For sleep-related goals
- `active_days` - For avoiding sedentary days
- `servings_eliminated` - For elimination goals
- `grams_consumed` - For nutrition goals
- `liters_consumed` - For hydration goals

## Adding New Actions

To add a new action to the library:

1. Add the action definition to `ACTION_DEFINITIONS` in `actions.config.ts`
2. Use the format: `{category}.{action_name}`
3. Specify all required fields:
   - `action_id`: Unique identifier
   - `category`: ACTIVITY | NUTRITION | ELIMINATION | RECOVERY
   - `weekly_target`: Measurable target string
   - `success_metric`: How to track progress
   - `impacted_biomarkers`: Array of affected biomarkers
   - `difficulty`: LOW | MEDIUM | HIGH

## Notes

- All actions are lifestyle-based (no medications or supplements)
- Actions are measurable and completable within 7 days
- Maximum 3 actions selected per week
- Actions can impact multiple biomarkers simultaneously
- Difficulty levels help prioritize actions for users

