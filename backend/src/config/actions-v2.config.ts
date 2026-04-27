/**
 * WEEKLY ACTIONS V2 - MVP COMPLETO
 * 
 * Sistema de acciones semanales con:
 * - Catálogo de 25 acciones principales
 * - Dificultades HARD / MEDIUM / EASY
 * - isDegradable para adaptación automática
 * - Acciones complementarias para reemplazo inteligente
 * 
 * REGLAS DE ADAPTACIÓN:
 * 1. Si progress == 0 por 1 semana: NO hacer nada
 * 2. Si progress == 0 por 2 semanas consecutivas:
 *    - Si isDegradable: HARD → MEDIUM → EASY
 *    - Si NO es degradable: marcar para posible reemplazo
 * 3. Si acción está en EASY y progress == 0 por 2 semanas:
 *    - Retirar acción (state = COOLDOWN)
 *    - Seleccionar acción complementaria
 */

export type ActionCategory = 'ACTIVITY' | 'NUTRITION' | 'ELIMINATION' | 'RECOVERY';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type ActionState = 'ACTIVE' | 'INTERNALIZED' | 'COMPLETED' | 'COOLDOWN';

export interface ActionDefinition {
  id: string;
  title: string; // i18n key
  targetBiomarkers: string[];
  category: ActionCategory;
  isDegradable: boolean; // Si true, puede bajar dificultad HARD → MEDIUM → EASY
  
  // Variantes por dificultad
  variants: {
    [K in DifficultyLevel]?: {
      difficulty_level: DifficultyLevel;
      target_value: number;
      unit: string;
      weekly_target: string; // e.g., "150_minutes", "5_days"
    };
  };
}

/**
 * CATÁLOGO PRINCIPAL - 25 ACCIONES MVP
 * 
 * Estas son las acciones core que cubren los biomarcadores principales
 */
export const MAIN_ACTION_CATALOG: Record<string, ActionDefinition> = {
  // ========================================
  // ACTIVIDAD FÍSICA (5 acciones)
  // ========================================
  'activity.cardio': {
    id: 'activity.cardio',
    title: 'activity.cardio.title',
    targetBiomarkers: ['LDL', 'HDL', 'TRIGLYCERIDES', 'HS_CRP', 'FASTING_GLUCOSE'],
    category: 'ACTIVITY',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 210,
        unit: 'minutes',
        weekly_target: '210_minutes' // 30 min x 7 días
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 150,
        unit: 'minutes',
        weekly_target: '150_minutes' // 30 min x 5 días
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 90,
        unit: 'minutes',
        weekly_target: '90_minutes' // 30 min x 3 días
      }
    }
  },
  
  'activity.daily_walk': {
    id: 'activity.daily_walk',
    title: 'activity.daily_walk.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'HS_CRP'],
    category: 'ACTIVITY',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days' // Todos los días
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days' // 5 días
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days' // 3 días
      }
    }
  },
  
  'activity.strength_training': {
    id: 'activity.strength_training',
    title: 'activity.strength_training.title',
    targetBiomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HDL'],
    category: 'ACTIVITY',
    isDegradable: false, // No degradable - es específico
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 2,
        unit: 'sessions',
        weekly_target: '2_sessions'
      }
    }
  },
  
  'activity.no_sedentary_days': {
    id: 'activity.no_sedentary_days',
    title: 'activity.no_sedentary_days.title',
    targetBiomarkers: ['TRIGLYCERIDES', 'HS_CRP', 'FASTING_GLUCOSE'],
    category: 'ACTIVITY',
    isDegradable: false, // No degradable - es binario
    variants: {
      EASY: {
        difficulty_level: 'EASY',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days'
      }
    }
  },
  
  'activity.active_breaks': {
    id: 'activity.active_breaks',
    title: 'activity.active_breaks.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'HS_CRP'],
    category: 'ACTIVITY',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  // ========================================
  // NUTRICIÓN (9 acciones)
  // ========================================
  'nutrition.fiber_intake': {
    id: 'nutrition.fiber_intake',
    title: 'nutrition.fiber_intake.title',
    targetBiomarkers: ['LDL', 'TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 35,
        unit: 'grams',
        weekly_target: '35g_daily'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 25,
        unit: 'grams',
        weekly_target: '25g_daily'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 20,
        unit: 'grams',
        weekly_target: '20g_daily'
      }
    }
  },
  
  'nutrition.vegetables_daily': {
    id: 'nutrition.vegetables_daily',
    title: 'nutrition.vegetables_daily.title',
    targetBiomarkers: ['HS_CRP', 'ALT', 'LDL'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days' // 3 porciones diarias
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days' // 2 porciones diarias
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days' // 1 porción diaria
      }
    }
  },
  
  'nutrition.healthy_fats': {
    id: 'nutrition.healthy_fats',
    title: 'nutrition.healthy_fats.title',
    targetBiomarkers: ['HDL', 'LDL', 'HS_CRP'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'servings',
        weekly_target: '5_servings_weekly'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'servings',
        weekly_target: '3_servings_weekly'
      }
    }
  },
  
  'nutrition.omega3_fish': {
    id: 'nutrition.omega3_fish',
    title: 'nutrition.omega3_fish.title',
    targetBiomarkers: ['HS_CRP', 'HDL', 'TRIGLYCERIDES'],
    category: 'NUTRITION',
    isDegradable: false,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 3,
        unit: 'servings',
        weekly_target: '3_servings_weekly'
      }
    }
  },
  
  'nutrition.water_intake': {
    id: 'nutrition.water_intake',
    title: 'nutrition.water_intake.title',
    targetBiomarkers: ['URIC_ACID', 'EGFR', 'ALT', 'AST'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 7,
        unit: 'days',
        weekly_target: '2L_daily'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 5,
        unit: 'days',
        weekly_target: '1.5L_daily'
      }
    }
  },
  
  'nutrition.mediterranean_pattern': {
    id: 'nutrition.mediterranean_pattern',
    title: 'nutrition.mediterranean_pattern.title',
    targetBiomarkers: ['LDL', 'HS_CRP', 'ALT', 'HDL'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  'nutrition.protein_breakfast': {
    id: 'nutrition.protein_breakfast',
    title: 'nutrition.protein_breakfast.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'HBA1C'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  'nutrition.limit_refined_carbs': {
    id: 'nutrition.limit_refined_carbs',
    title: 'nutrition.limit_refined_carbs.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'HBA1C', 'TRIGLYCERIDES'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  'nutrition.portion_control': {
    id: 'nutrition.portion_control',
    title: 'nutrition.portion_control.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'TRIGLYCERIDES', 'LDL'],
    category: 'NUTRITION',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  // ========================================
  // ELIMINACIÓN (6 acciones)
  // ========================================
  'elimination.no_sugary_drinks': {
    id: 'elimination.no_sugary_drinks',
    title: 'elimination.no_sugary_drinks.title',
    targetBiomarkers: ['TRIGLYCERIDES', 'FASTING_GLUCOSE', 'HBA1C'],
    category: 'ELIMINATION',
    isDegradable: false, // Eliminación es binaria
    variants: {
      EASY: {
        difficulty_level: 'EASY',
        target_value: 7,
        unit: 'days',
        weekly_target: '0_sugary_drinks'
      }
    }
  },
  
  'elimination.no_alcohol': {
    id: 'elimination.no_alcohol',
    title: 'elimination.no_alcohol.title',
    targetBiomarkers: ['TRIGLYCERIDES', 'ALT', 'AST', 'URIC_ACID'],
    category: 'ELIMINATION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '0_alcohol_days' // Cero alcohol
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_alcohol_free_days' // 5 días sin alcohol
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_alcohol_free_days' // 3 días sin alcohol
      }
    }
  },
  
  'elimination.no_ultra_processed': {
    id: 'elimination.no_ultra_processed',
    title: 'elimination.no_ultra_processed.title',
    targetBiomarkers: ['LDL', 'HS_CRP', 'TRIGLYCERIDES'],
    category: 'ELIMINATION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '7_days'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days'
      }
    }
  },
  
  'elimination.reduce_saturated_fat': {
    id: 'elimination.reduce_saturated_fat',
    title: 'elimination.reduce_saturated_fat.title',
    targetBiomarkers: ['LDL', 'HDL'],
    category: 'ELIMINATION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '0_servings'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days_controlled'
      }
    }
  },
  
  'elimination.limit_sodium': {
    id: 'elimination.limit_sodium',
    title: 'elimination.limit_sodium.title',
    targetBiomarkers: ['EGFR'],
    category: 'ELIMINATION',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days_low_sodium'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days_low_sodium'
      }
    }
  },
  
  'elimination.avoid_purines': {
    id: 'elimination.avoid_purines',
    title: 'elimination.avoid_purines.title',
    targetBiomarkers: ['URIC_ACID'],
    category: 'ELIMINATION',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'days',
        weekly_target: '0_purine_foods'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days_low_purines'
      }
    }
  },
  
  // ========================================
  // RECUPERACIÓN (5 acciones)
  // ========================================
  'recovery.sleep_7h': {
    id: 'recovery.sleep_7h',
    title: 'recovery.sleep_7h.title',
    targetBiomarkers: ['HBA1C', 'FASTING_GLUCOSE', 'HS_CRP'],
    category: 'RECOVERY',
    isDegradable: true,
    variants: {
      HARD: {
        difficulty_level: 'HARD',
        target_value: 7,
        unit: 'nights',
        weekly_target: '7_nights'
      },
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'nights',
        weekly_target: '5_nights'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'nights',
        weekly_target: '3_nights'
      }
    }
  },
  
  'recovery.consistent_schedule': {
    id: 'recovery.consistent_schedule',
    title: 'recovery.consistent_schedule.title',
    targetBiomarkers: ['FASTING_GLUCOSE', 'HS_CRP', 'HBA1C'],
    category: 'RECOVERY',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'days',
        weekly_target: '5_days_same_bedtime'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'days',
        weekly_target: '3_days_same_bedtime'
      }
    }
  },
  
  'recovery.stress_management': {
    id: 'recovery.stress_management',
    title: 'recovery.stress_management.title',
    targetBiomarkers: ['HS_CRP', 'HBA1C', 'FASTING_GLUCOSE'],
    category: 'RECOVERY',
    isDegradable: true,
    variants: {
      MEDIUM: {
        difficulty_level: 'MEDIUM',
        target_value: 5,
        unit: 'sessions',
        weekly_target: '10min_x_5_days'
      },
      EASY: {
        difficulty_level: 'EASY',
        target_value: 3,
        unit: 'sessions',
        weekly_target: '10min_x_3_days'
      }
    }
  },
  
  'recovery.rest_days': {
    id: 'recovery.rest_days',
    title: 'recovery.rest_days.title',
    targetBiomarkers: ['HS_CRP', 'AST', 'ALT'],
    category: 'RECOVERY',
    isDegradable: false,
    variants: {
      EASY: {
        difficulty_level: 'EASY',
        target_value: 1,
        unit: 'days',
        weekly_target: '1_rest_day'
      }
    }
  },
  
  'recovery.hydration_post_exercise': {
    id: 'recovery.hydration_post_exercise',
    title: 'recovery.hydration_post_exercise.title',
    targetBiomarkers: ['AST', 'EGFR', 'URIC_ACID'],
    category: 'RECOVERY',
    isDegradable: false,
    variants: {
      EASY: {
        difficulty_level: 'EASY',
        target_value: 5,
        unit: 'sessions',
        weekly_target: 'hydration_after_training'
      }
    }
  }
};

/**
 * ACCIONES COMPLEMENTARIAS
 * 
 * Cuando una acción llega a EASY y no se cumple por 2 semanas,
 * se reemplaza por una acción complementaria del mismo objetivo.
 * 
 * Estructura: { action_id: [complementary_action_ids] }
 */
export const COMPLEMENTARY_ACTIONS: Record<string, string[]> = {
  // Actividad física
  'activity.cardio': ['activity.daily_walk', 'activity.active_breaks', 'activity.no_sedentary_days'],
  'activity.daily_walk': ['activity.active_breaks', 'activity.no_sedentary_days'],
  'activity.strength_training': ['activity.cardio', 'activity.daily_walk'],
  'activity.no_sedentary_days': ['activity.daily_walk', 'activity.active_breaks'],
  'activity.active_breaks': ['activity.daily_walk', 'activity.no_sedentary_days'],
  
  // Nutrición
  'nutrition.fiber_intake': ['nutrition.vegetables_daily', 'nutrition.mediterranean_pattern'],
  'nutrition.vegetables_daily': ['nutrition.fiber_intake', 'nutrition.mediterranean_pattern'],
  'nutrition.healthy_fats': ['nutrition.omega3_fish', 'nutrition.mediterranean_pattern'],
  'nutrition.omega3_fish': ['nutrition.healthy_fats', 'nutrition.mediterranean_pattern'],
  'nutrition.water_intake': ['nutrition.vegetables_daily', 'nutrition.mediterranean_pattern'],
  'nutrition.mediterranean_pattern': ['nutrition.vegetables_daily', 'nutrition.healthy_fats'],
  'nutrition.protein_breakfast': ['nutrition.portion_control', 'nutrition.limit_refined_carbs'],
  'nutrition.limit_refined_carbs': ['nutrition.fiber_intake', 'nutrition.protein_breakfast'],
  'nutrition.portion_control': ['nutrition.protein_breakfast', 'nutrition.limit_refined_carbs'],
  
  // Eliminación
  'elimination.no_sugary_drinks': ['elimination.limit_refined_carbs', 'nutrition.water_intake'],
  'elimination.no_alcohol': ['elimination.no_ultra_processed', 'recovery.sleep_7h'],
  'elimination.no_ultra_processed': ['elimination.reduce_saturated_fat', 'nutrition.mediterranean_pattern'],
  'elimination.reduce_saturated_fat': ['elimination.no_ultra_processed', 'nutrition.healthy_fats'],
  'elimination.limit_sodium': ['nutrition.water_intake', 'nutrition.mediterranean_pattern'],
  'elimination.avoid_purines': ['nutrition.water_intake', 'elimination.no_alcohol'],
  
  // Recuperación
  'recovery.sleep_7h': ['recovery.consistent_schedule', 'recovery.stress_management'],
  'recovery.consistent_schedule': ['recovery.sleep_7h', 'recovery.stress_management'],
  'recovery.stress_management': ['recovery.sleep_7h', 'recovery.rest_days'],
  'recovery.rest_days': ['recovery.sleep_7h', 'recovery.hydration_post_exercise'],
  'recovery.hydration_post_exercise': ['nutrition.water_intake', 'recovery.rest_days']
};

/**
 * COPY UX PARA ADAPTACIÓN Y REEMPLAZO
 */
export const ADAPTATION_MESSAGES = {
  difficulty_reduced: 'Reducimos el objetivo para que sea más fácil de cumplir.',
  action_replaced: 'Probamos una estrategia distinta esta semana para seguir avanzando.',
  action_retired: 'Acción completada. Continuamos con otras prioridades.',
  no_change: 'Continuamos con las mismas prioridades esta semana.'
};

/**
 * Obtiene la siguiente dificultad (degradación)
 */
export function getNextDifficultyLevel(current: DifficultyLevel): DifficultyLevel | null {
  if (current === 'HARD') return 'MEDIUM';
  if (current === 'MEDIUM') return 'EASY';
  return null; // Ya está en EASY, no puede bajar más
}

/**
 * Obtiene acciones complementarias para una acción dada
 */
export function getComplementaryActions(actionId: string, targetBiomarkers: string[]): ActionDefinition[] {
  const complementaryIds = COMPLEMENTARY_ACTIONS[actionId] || [];
  
  return complementaryIds
    .map(id => MAIN_ACTION_CATALOG[id])
    .filter(action => {
      // Filtrar acciones que impactan al menos 1 biomarcador objetivo
      return action && action.targetBiomarkers.some(b => targetBiomarkers.includes(b));
    });
}

/**
 * Valida si una acción puede ser degradada
 */
export function canDegrade(actionId: string, currentDifficulty: DifficultyLevel): boolean {
  const action = MAIN_ACTION_CATALOG[actionId];
  if (!action || !action.isDegradable) return false;
  
  const nextDifficulty = getNextDifficultyLevel(currentDifficulty);
  return nextDifficulty !== null && action.variants[nextDifficulty] !== undefined;
}

/**
 * Obtiene el número total de acciones en el catálogo principal
 */
export function getMainCatalogSize(): number {
  return Object.keys(MAIN_ACTION_CATALOG).length;
}

/**
 * Obtiene todas las acciones que impactan un biomarcador específico
 */
export function getActionsByBiomarker(biomarker: string): ActionDefinition[] {
  return Object.values(MAIN_ACTION_CATALOG).filter(action =>
    action.targetBiomarkers.includes(biomarker)
  );
}

/**
 * Obtiene todas las acciones por categoría
 */
export function getActionsByCategory(category: ActionCategory): ActionDefinition[] {
  return Object.values(MAIN_ACTION_CATALOG).filter(action =>
    action.category === category
  );
}
