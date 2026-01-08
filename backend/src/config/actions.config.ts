/**
 * WEEKLY ACTIONS CONFIGURATION
 * 
 * Maps recommendation_keys to structured action objects.
 * Each action is measurable and completable within 7 days.
 * 
 * IMPORTANT: Backend returns only keys and structured data - no human-readable text
 */

import { BiomarkerKey } from './biomarkers.config';

export type ActionCategory = 'ACTIVITY' | 'NUTRITION' | 'ELIMINATION' | 'RECOVERY';
export type DifficultyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type CompletionState = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface WeeklyAction {
  action_id: string;
  category: ActionCategory;
  weekly_target: string; // e.g., "150_minutes", "5_days", "0_servings"
  success_metric: string; // e.g., "minutes_completed", "days_completed", "servings_eliminated"
  impacted_biomarkers: BiomarkerKey[];
  difficulty: DifficultyLevel;
}

/**
 * ACTION DEFINITIONS
 * Maps recommendation_key to structured action
 */
export const ACTION_DEFINITIONS: Record<string, WeeklyAction> = {
  // LDL Actions
  'ldl.reduce_saturated_fat': {
    action_id: 'ldl.reduce_saturated_fat',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['LDL', 'HDL'],
    difficulty: 'MEDIUM'
  },
  'ldl.increase_fiber': {
    action_id: 'ldl.increase_fiber',
    category: 'NUTRITION',
    weekly_target: '35_grams_daily',
    success_metric: 'grams_consumed',
    impacted_biomarkers: ['LDL', 'HDL', 'FASTING_GLUCOSE'],
    difficulty: 'MEDIUM'
  },
  'ldl.add_cardio': {
    action_id: 'ldl.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['LDL', 'HDL', 'HS_CRP', 'TRIGLYCERIDES'],
    difficulty: 'MEDIUM'
  },
  'ldl.eliminate_trans_fats': {
    action_id: 'ldl.eliminate_trans_fats',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['LDL', 'HDL'],
    difficulty: 'HIGH'
  },
  'ldl.daily_cardio': {
    action_id: 'ldl.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['LDL', 'HDL', 'HS_CRP', 'TRIGLYCERIDES'],
    difficulty: 'HIGH'
  },
  'ldl.maintain_diet': {
    action_id: 'ldl.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['LDL', 'HDL'],
    difficulty: 'LOW'
  },
  'ldl.keep_exercise': {
    action_id: 'ldl.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['LDL', 'HDL', 'HS_CRP'],
    difficulty: 'LOW'
  },

  // HBA1C Actions
  'hba1c.reduce_sugar': {
    action_id: 'hba1c.reduce_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'TRIGLYCERIDES'],
    difficulty: 'MEDIUM'
  },
  'hba1c.increase_fiber': {
    action_id: 'hba1c.increase_fiber',
    category: 'NUTRITION',
    weekly_target: '35_grams_daily',
    success_metric: 'grams_consumed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE'],
    difficulty: 'MEDIUM'
  },
  'hba1c.add_cardio': {
    action_id: 'hba1c.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'hba1c.eliminate_refined_sugar': {
    action_id: 'hba1c.eliminate_refined_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'TRIGLYCERIDES'],
    difficulty: 'HIGH'
  },
  'hba1c.daily_cardio': {
    action_id: 'hba1c.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'hba1c.maintain_diet': {
    action_id: 'hba1c.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE'],
    difficulty: 'LOW'
  },
  'hba1c.keep_exercise': {
    action_id: 'hba1c.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE'],
    difficulty: 'LOW'
  },

  // FASTING_GLUCOSE Actions (same as HBA1C)
  'glucose.reduce_sugar': {
    action_id: 'glucose.reduce_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'TRIGLYCERIDES'],
    difficulty: 'MEDIUM'
  },
  'glucose.increase_fiber': {
    action_id: 'glucose.increase_fiber',
    category: 'NUTRITION',
    weekly_target: '35_grams_daily',
    success_metric: 'grams_consumed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'MEDIUM'
  },
  'glucose.add_cardio': {
    action_id: 'glucose.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'glucose.eliminate_refined_sugar': {
    action_id: 'glucose.eliminate_refined_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'TRIGLYCERIDES'],
    difficulty: 'HIGH'
  },
  'glucose.daily_cardio': {
    action_id: 'glucose.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'glucose.maintain_diet': {
    action_id: 'glucose.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'LOW'
  },
  'glucose.keep_exercise': {
    action_id: 'glucose.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'LOW'
  },

  // TRIGLYCERIDES Actions
  'triglycerides.reduce_sugar': {
    action_id: 'triglycerides.reduce_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'MEDIUM'
  },
  'triglycerides.increase_fiber': {
    action_id: 'triglycerides.increase_fiber',
    category: 'NUTRITION',
    weekly_target: '35_grams_daily',
    success_metric: 'grams_consumed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'FASTING_GLUCOSE'],
    difficulty: 'MEDIUM'
  },
  'triglycerides.add_cardio': {
    action_id: 'triglycerides.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'HDL', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'triglycerides.eliminate_refined_sugar': {
    action_id: 'triglycerides.eliminate_refined_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'HIGH'
  },
  'triglycerides.daily_cardio': {
    action_id: 'triglycerides.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'HDL', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'triglycerides.maintain_diet': {
    action_id: 'triglycerides.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['TRIGLYCERIDES'],
    difficulty: 'LOW'
  },
  'triglycerides.keep_exercise': {
    action_id: 'triglycerides.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'HDL'],
    difficulty: 'LOW'
  },

  // ALT Actions
  'alt.reduce_alcohol': {
    action_id: 'alt.reduce_alcohol',
    category: 'ELIMINATION',
    weekly_target: '0_drinks',
    success_metric: 'drinks_eliminated',
    impacted_biomarkers: ['ALT', 'AST'],
    difficulty: 'MEDIUM'
  },
  'alt.increase_water': {
    action_id: 'alt.increase_water',
    category: 'NUTRITION',
    weekly_target: '2_liters_daily',
    success_metric: 'liters_consumed',
    impacted_biomarkers: ['ALT', 'AST', 'EGFR'],
    difficulty: 'LOW'
  },
  'alt.add_cardio': {
    action_id: 'alt.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['ALT', 'AST', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'alt.eliminate_alcohol': {
    action_id: 'alt.eliminate_alcohol',
    category: 'ELIMINATION',
    weekly_target: '0_drinks',
    success_metric: 'drinks_eliminated',
    impacted_biomarkers: ['ALT', 'AST'],
    difficulty: 'HIGH'
  },
  'alt.daily_cardio': {
    action_id: 'alt.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['ALT', 'AST', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'alt.maintain_diet': {
    action_id: 'alt.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['ALT', 'AST'],
    difficulty: 'LOW'
  },
  'alt.keep_exercise': {
    action_id: 'alt.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['ALT', 'AST'],
    difficulty: 'LOW'
  },

  // HS_CRP Actions
  'crp.reduce_inflammation': {
    action_id: 'crp.reduce_inflammation',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['HS_CRP', 'LDL', 'HDL'],
    difficulty: 'MEDIUM'
  },
  'crp.increase_omega3': {
    action_id: 'crp.increase_omega3',
    category: 'NUTRITION',
    weekly_target: '3_servings_weekly',
    success_metric: 'servings_consumed',
    impacted_biomarkers: ['HS_CRP', 'HDL'],
    difficulty: 'MEDIUM'
  },
  'crp.add_cardio': {
    action_id: 'crp.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HS_CRP', 'HDL', 'LDL'],
    difficulty: 'MEDIUM'
  },
  'crp.eliminate_processed_foods': {
    action_id: 'crp.eliminate_processed_foods',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['HS_CRP', 'LDL', 'TRIGLYCERIDES'],
    difficulty: 'HIGH'
  },
  'crp.daily_cardio': {
    action_id: 'crp.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HS_CRP', 'HDL', 'LDL'],
    difficulty: 'HIGH'
  },
  'crp.maintain_diet': {
    action_id: 'crp.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['HS_CRP'],
    difficulty: 'LOW'
  },
  'crp.keep_exercise': {
    action_id: 'crp.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HS_CRP', 'HDL'],
    difficulty: 'LOW'
  },

  // HDL Actions
  'hdl.increase_healthy_fats': {
    action_id: 'hdl.increase_healthy_fats',
    category: 'NUTRITION',
    weekly_target: '5_servings_weekly',
    success_metric: 'servings_consumed',
    impacted_biomarkers: ['HDL', 'LDL'],
    difficulty: 'MEDIUM'
  },
  'hdl.add_cardio': {
    action_id: 'hdl.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HDL', 'LDL', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'hdl.reduce_sugar': {
    action_id: 'hdl.reduce_sugar',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['HDL', 'TRIGLYCERIDES'],
    difficulty: 'MEDIUM'
  },
  'hdl.daily_cardio': {
    action_id: 'hdl.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HDL', 'LDL', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'hdl.maintain_diet': {
    action_id: 'hdl.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['HDL'],
    difficulty: 'LOW'
  },
  'hdl.keep_exercise': {
    action_id: 'hdl.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['HDL', 'LDL'],
    difficulty: 'LOW'
  },

  // AST Actions (same as ALT)
  'ast.reduce_alcohol': {
    action_id: 'ast.reduce_alcohol',
    category: 'ELIMINATION',
    weekly_target: '0_drinks',
    success_metric: 'drinks_eliminated',
    impacted_biomarkers: ['AST', 'ALT'],
    difficulty: 'MEDIUM'
  },
  'ast.increase_water': {
    action_id: 'ast.increase_water',
    category: 'NUTRITION',
    weekly_target: '2_liters_daily',
    success_metric: 'liters_consumed',
    impacted_biomarkers: ['AST', 'ALT', 'EGFR'],
    difficulty: 'LOW'
  },
  'ast.add_cardio': {
    action_id: 'ast.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['AST', 'ALT', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'ast.eliminate_alcohol': {
    action_id: 'ast.eliminate_alcohol',
    category: 'ELIMINATION',
    weekly_target: '0_drinks',
    success_metric: 'drinks_eliminated',
    impacted_biomarkers: ['AST', 'ALT'],
    difficulty: 'HIGH'
  },
  'ast.daily_cardio': {
    action_id: 'ast.daily_cardio',
    category: 'ACTIVITY',
    weekly_target: '210_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['AST', 'ALT', 'HS_CRP'],
    difficulty: 'HIGH'
  },
  'ast.maintain_diet': {
    action_id: 'ast.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['AST', 'ALT'],
    difficulty: 'LOW'
  },
  'ast.keep_exercise': {
    action_id: 'ast.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['AST', 'ALT'],
    difficulty: 'LOW'
  },

  // EGFR Actions
  'egfr.increase_water': {
    action_id: 'egfr.increase_water',
    category: 'NUTRITION',
    weekly_target: '2_liters_daily',
    success_metric: 'liters_consumed',
    impacted_biomarkers: ['EGFR', 'URIC_ACID'],
    difficulty: 'LOW'
  },
  'egfr.reduce_sodium': {
    action_id: 'egfr.reduce_sodium',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['EGFR'],
    difficulty: 'MEDIUM'
  },
  'egfr.add_cardio': {
    action_id: 'egfr.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['EGFR', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'egfr.maintain_diet': {
    action_id: 'egfr.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['EGFR'],
    difficulty: 'LOW'
  },
  'egfr.keep_exercise': {
    action_id: 'egfr.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['EGFR'],
    difficulty: 'LOW'
  },

  // URIC_ACID Actions
  'uric_acid.reduce_purines': {
    action_id: 'uric_acid.reduce_purines',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['URIC_ACID'],
    difficulty: 'MEDIUM'
  },
  'uric_acid.increase_water': {
    action_id: 'uric_acid.increase_water',
    category: 'NUTRITION',
    weekly_target: '2_liters_daily',
    success_metric: 'liters_consumed',
    impacted_biomarkers: ['URIC_ACID', 'EGFR'],
    difficulty: 'LOW'
  },
  'uric_acid.add_cardio': {
    action_id: 'uric_acid.add_cardio',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['URIC_ACID', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'uric_acid.eliminate_purines': {
    action_id: 'uric_acid.eliminate_purines',
    category: 'ELIMINATION',
    weekly_target: '0_servings',
    success_metric: 'servings_eliminated',
    impacted_biomarkers: ['URIC_ACID'],
    difficulty: 'HIGH'
  },
  'uric_acid.maintain_diet': {
    action_id: 'uric_acid.maintain_diet',
    category: 'NUTRITION',
    weekly_target: '7_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['URIC_ACID'],
    difficulty: 'LOW'
  },
  'uric_acid.keep_exercise': {
    action_id: 'uric_acid.keep_exercise',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['URIC_ACID'],
    difficulty: 'LOW'
  },

  // ============================================
  // ACTIVITY LIBRARY (8 actions)
  // ============================================
  'activity.cardio_150': {
    action_id: 'activity.cardio_150',
    category: 'ACTIVITY',
    weekly_target: '150_minutes',
    success_metric: 'minutes_completed',
    impacted_biomarkers: ['LDL', 'HDL', 'HS_CRP', 'TRIGLYCERIDES'],
    difficulty: 'MEDIUM'
  },
  'activity.daily_walk': {
    action_id: 'activity.daily_walk',
    category: 'ACTIVITY',
    weekly_target: '30_minutes_x_5_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'HS_CRP'],
    difficulty: 'LOW'
  },
  'activity.strength_2x': {
    action_id: 'activity.strength_2x',
    category: 'ACTIVITY',
    weekly_target: '2_sessions',
    success_metric: 'sessions_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HDL'],
    difficulty: 'MEDIUM'
  },
  'activity.no_sedentary_days': {
    action_id: 'activity.no_sedentary_days',
    category: 'ACTIVITY',
    weekly_target: 'no_zero_activity_days',
    success_metric: 'active_days',
    impacted_biomarkers: ['TRIGLYCERIDES', 'HS_CRP'],
    difficulty: 'LOW'
  },

  // ============================================
  // NUTRITION LIBRARY (9 actions)
  // ============================================
  'nutrition.fiber_25g': {
    action_id: 'nutrition.fiber_25g',
    category: 'NUTRITION',
    weekly_target: '25g_fiber_daily',
    success_metric: 'days_completed',
    impacted_biomarkers: ['LDL', 'TRIGLYCERIDES', 'FASTING_GLUCOSE'],
    difficulty: 'MEDIUM'
  },
  'nutrition.no_sugary_drinks': {
    action_id: 'nutrition.no_sugary_drinks',
    category: 'NUTRITION',
    weekly_target: '0_sugary_drinks',
    success_metric: 'days_completed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'LOW'
  },
  'nutrition.vegetables_daily': {
    action_id: 'nutrition.vegetables_daily',
    category: 'NUTRITION',
    weekly_target: '2_servings_daily',
    success_metric: 'days_completed',
    impacted_biomarkers: ['HS_CRP', 'ALT'],
    difficulty: 'LOW'
  },
  'nutrition.low_refined_carbs': {
    action_id: 'nutrition.low_refined_carbs',
    category: 'NUTRITION',
    weekly_target: '5_days_low_refined_carbs',
    success_metric: 'days_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HBA1C'],
    difficulty: 'MEDIUM'
  },
  'nutrition.mediterranean_pattern': {
    action_id: 'nutrition.mediterranean_pattern',
    category: 'NUTRITION',
    weekly_target: '5_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['LDL', 'HS_CRP', 'ALT'],
    difficulty: 'MEDIUM'
  },

  // ============================================
  // ELIMINATION LIBRARY (6 actions)
  // ============================================
  'elimination.no_alcohol': {
    action_id: 'elimination.no_alcohol',
    category: 'ELIMINATION',
    weekly_target: '0_alcohol_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['TRIGLYCERIDES', 'ALT', 'AST'],
    difficulty: 'MEDIUM'
  },
  'elimination.no_ultra_processed': {
    action_id: 'elimination.no_ultra_processed',
    category: 'ELIMINATION',
    weekly_target: '5_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['LDL', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'elimination.no_beer': {
    action_id: 'elimination.no_beer',
    category: 'ELIMINATION',
    weekly_target: '0_beer',
    success_metric: 'days_completed',
    impacted_biomarkers: ['URIC_ACID', 'TRIGLYCERIDES'],
    difficulty: 'LOW'
  },
  'elimination.limit_fructose': {
    action_id: 'elimination.limit_fructose',
    category: 'ELIMINATION',
    weekly_target: '0_sugary_snacks',
    success_metric: 'days_completed',
    impacted_biomarkers: ['URIC_ACID', 'HBA1C'],
    difficulty: 'MEDIUM'
  },

  // ============================================
  // RECOVERY LIBRARY (5 actions)
  // ============================================
  'recovery.sleep_7h': {
    action_id: 'recovery.sleep_7h',
    category: 'RECOVERY',
    weekly_target: '7h_sleep_4_nights',
    success_metric: 'nights_completed',
    impacted_biomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HS_CRP'],
    difficulty: 'MEDIUM'
  },
  'recovery.fixed_sleep_schedule': {
    action_id: 'recovery.fixed_sleep_schedule',
    category: 'RECOVERY',
    weekly_target: 'same_bedtime_4_days',
    success_metric: 'days_completed',
    impacted_biomarkers: ['FASTING_GLUCOSE', 'HS_CRP'],
    difficulty: 'LOW'
  },
  'recovery.stress_breaks': {
    action_id: 'recovery.stress_breaks',
    category: 'RECOVERY',
    weekly_target: '10min_x_5_days',
    success_metric: 'sessions_completed',
    impacted_biomarkers: ['HS_CRP', 'HBA1C'],
    difficulty: 'LOW'
  },

  // ============================================
  // HYDRATION / SAFETY LIBRARY (5 actions)
  // ============================================
  'hydration.water_2l': {
    action_id: 'hydration.water_2l',
    category: 'NUTRITION',
    weekly_target: '2L_daily',
    success_metric: 'days_completed',
    impacted_biomarkers: ['URIC_ACID', 'EGFR'],
    difficulty: 'LOW'
  },
  'safety.no_nsaids': {
    action_id: 'safety.no_nsaids',
    category: 'ELIMINATION',
    weekly_target: '0_nsaids',
    success_metric: 'days_completed',
    impacted_biomarkers: ['EGFR'],
    difficulty: 'LOW'
  },
  'hydration.extra_on_training': {
    action_id: 'hydration.extra_on_training',
    category: 'RECOVERY',
    weekly_target: 'hydration_after_training',
    success_metric: 'sessions_completed',
    impacted_biomarkers: ['AST', 'EGFR'],
    difficulty: 'LOW'
  }
};

/**
 * Gets action definition by recommendation key
 */
export function getActionByKey(recommendationKey: string): WeeklyAction | undefined {
  return ACTION_DEFINITIONS[recommendationKey];
}

/**
 * Gets all actions by category
 */
export function getActionsByCategory(category: ActionCategory): WeeklyAction[] {
  return Object.values(ACTION_DEFINITIONS).filter(action => action.category === category);
}

/**
 * Gets all actions that impact a specific biomarker
 */
export function getActionsByBiomarker(biomarker: BiomarkerKey): WeeklyAction[] {
  return Object.values(ACTION_DEFINITIONS).filter(action =>
    action.impacted_biomarkers.includes(biomarker)
  );
}

/**
 * Gets all actions from the action library (activity.*, nutrition.*, etc.)
 */
export function getLibraryActions(): WeeklyAction[] {
  return Object.values(ACTION_DEFINITIONS).filter(action =>
    action.action_id.startsWith('activity.') ||
    action.action_id.startsWith('nutrition.') ||
    action.action_id.startsWith('elimination.') ||
    action.action_id.startsWith('recovery.') ||
    action.action_id.startsWith('hydration.') ||
    action.action_id.startsWith('safety.')
  );
}

/**
 * Gets actions by difficulty level
 */
export function getActionsByDifficulty(difficulty: DifficultyLevel): WeeklyAction[] {
  return Object.values(ACTION_DEFINITIONS).filter(action => action.difficulty === difficulty);
}

