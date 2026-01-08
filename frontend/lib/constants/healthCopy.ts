/**
 * HEALTH COPY DICTIONARY
 * 
 * Centralized mapping of all technical keys to human-readable Spanish (LATAM) text.
 * This ensures NO technical keys are ever visible to users.
 */

export const HEALTH_COPY: Record<string, string> = {
  // ===== RISK / DESCRIPTIVE TEXT =====
  'uric_acid.optimal.risk': 'Tu ácido úrico está en un rango ideal.',
  'uric_acid.good.risk': 'Tu ácido úrico está en buen rango.',
  'uric_acid.out_of_range.risk': 'Tu ácido úrico está elevado. Puede causar gota.',
  'uric_acid.critical.risk': 'Tu ácido úrico está críticamente elevado. Consulta con tu médico urgentemente.',

  'fasting_glucose.optimal.risk': 'Tu glucosa en ayunas está en rango óptimo.',
  'fasting_glucose.good.risk': 'Tu glucosa está dentro de rango, pero cerca del límite superior.',
  'fasting_glucose.out_of_range.risk': 'Tu glucosa en ayunas está elevada. Indica posible prediabetes.',
  'fasting_glucose.critical.risk': 'Tu glucosa en ayunas está críticamente elevada. Consulta con tu médico urgentemente.',

  'ldl.optimal.risk': 'Tu colesterol LDL está en rango óptimo. ¡Sigue así!',
  'ldl.good.risk': 'Tu colesterol LDL está en buen rango, pero hay margen de mejora.',
  'ldl.out_of_range.risk': 'El colesterol LDL elevado aumenta el riesgo cardiovascular si se mantiene en el tiempo.',
  'ldl.critical.risk': 'Tu colesterol LDL está críticamente elevado. Consulta con tu médico urgentemente.',

  'triglycerides.optimal.risk': 'Tus triglicéridos están en rango óptimo.',
  'triglycerides.good.risk': 'Tus triglicéridos están en buen rango.',
  'triglycerides.out_of_range.risk': 'Triglicéridos elevados suelen asociarse a exceso de azúcar, alcohol o sedentarismo.',
  'triglycerides.critical.risk': 'Tus triglicéridos están críticamente elevados. Consulta con tu médico urgentemente.',

  'hba1c.optimal.risk': 'Tu control de glucosa a largo plazo es óptimo.',
  'hba1c.good.risk': 'Tu hemoglobina glicosilada está en buen rango.',
  'hba1c.out_of_range.risk': 'Tu hemoglobina glicosilada está elevada. Indica posible prediabetes.',
  'hba1c.critical.risk': 'Tu hemoglobina glicosilada está críticamente elevada. Consulta con tu médico urgentemente.',

  'alt.optimal.risk': 'Tu ALT está en rango óptimo.',
  'alt.good.risk': 'Tu ALT está en buen rango.',
  'alt.out_of_range.risk': 'Tu ALT está elevada. Puede indicar problemas hepáticos.',
  'alt.critical.risk': 'Tu ALT está críticamente elevada. Consulta con tu médico urgentemente.',

  'ast.optimal.risk': 'La función hepática se encuentra en buen estado.',
  'ast.good.risk': 'Tu AST está en buen rango.',
  'ast.out_of_range.risk': 'Tu AST está elevada. Puede indicar problemas hepáticos.',
  'ast.critical.risk': 'Tu AST está críticamente elevada. Consulta con tu médico urgentemente.',

  'hs_crp.optimal.risk': 'Tu PCR ultrasensible está en rango óptimo.',
  'hs_crp.good.risk': 'Tu PCR ultrasensible está en buen rango.',
  'hs_crp.out_of_range.risk': 'Tu PCR ultrasensible está elevada. Indica inflamación sistémica.',
  'hs_crp.critical.risk': 'Tu PCR ultrasensible está críticamente elevada. Consulta con tu médico urgentemente.',

  'hdl.optimal.risk': 'Tu colesterol HDL está en rango óptimo. ¡Excelente!',
  'hdl.good.risk': 'Tu colesterol HDL está en buen rango.',
  'hdl.out_of_range.risk': 'Tu colesterol HDL está bajo. Aumenta riesgo cardiovascular.',
  'hdl.critical.risk': 'Tu colesterol HDL está críticamente bajo. Consulta con tu médico urgentemente.',

  'egfr.optimal.risk': 'Tu función renal está en rango óptimo.',
  'egfr.good.risk': 'Tu función renal está en buen rango.',
  'egfr.out_of_range.risk': 'Tu función renal está disminuida. Consulta con tu médico.',
  'egfr.critical.risk': 'Tu función renal está críticamente disminuida. Consulta con tu médico urgentemente.',

  // ===== RECOMMENDATIONS =====
  // URIC ACID
  'uric_acid.maintain_diet': 'Mantén una alimentación balanceada.',
  'uric_acid.keep_exercise': 'Continúa con actividad física regular.',
  'uric_acid.reduce_purines': 'Reduce alimentos ricos en purinas (carnes rojas, mariscos).',
  'uric_acid.increase_water': 'Aumenta consumo de agua significativamente.',
  'uric_acid.eliminate_purines': 'Elimina alimentos ricos en purinas completamente.',

  // GLUCOSE / FASTING GLUCOSE
  'glucose.reduce_sugar': 'Reduce el consumo de azúcares añadidos.',
  'glucose.increase_fiber': 'Aumenta el consumo de fibra (verduras, frutas, legumbres).',
  'glucose.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'glucose.eliminate_refined_sugar': 'Elimina azúcares refinados completamente.',
  'glucose.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'glucose.maintain_diet': 'Mantén una dieta balanceada.',
  'glucose.keep_exercise': 'Continúa con ejercicio regular.',

  'fasting_glucose.reduce_sugar': 'Reduce el consumo de azúcares añadidos.',
  'fasting_glucose.increase_fiber': 'Aumenta el consumo de fibra (verduras, frutas, legumbres).',
  'fasting_glucose.add_cardio': 'Agrega ejercicio cardiovascular regular.',

  // LDL
  'ldl.reduce_saturated_fat': 'Reduce grasas saturadas y fritos.',
  'ldl.increase_fiber': 'Aumenta la fibra diaria.',
  'ldl.add_cardio': 'Realiza al menos 150 minutos de cardio a la semana.',
  'ldl.eliminate_trans_fats': 'Elimina grasas trans completamente.',
  'ldl.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'ldl.maintain_diet': 'Mantén una dieta baja en grasas saturadas.',
  'ldl.keep_exercise': 'Continúa con ejercicio regular.',

  // TRIGLYCERIDES
  'triglycerides.reduce_sugar': 'Reduce azúcar y alcohol.',
  'triglycerides.increase_fiber': 'Aumenta el consumo de fibra.',
  'triglycerides.add_cardio': 'Incluye actividad cardiovascular regularmente.',
  'triglycerides.eliminate_refined_sugar': 'Elimina azúcares refinados completamente.',
  'triglycerides.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'triglycerides.maintain_diet': 'Mantén una dieta balanceada.',
  'triglycerides.keep_exercise': 'Continúa con ejercicio regular.',

  // HBA1C
  'hba1c.reduce_sugar': 'Reduce consumo de azúcares refinados.',
  'hba1c.increase_fiber': 'Aumenta fibra en tu dieta.',
  'hba1c.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'hba1c.eliminate_refined_sugar': 'Elimina azúcares refinados completamente.',
  'hba1c.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'hba1c.maintain_diet': 'Mantén una dieta balanceada.',
  'hba1c.keep_exercise': 'Continúa con ejercicio regular.',

  // ALT
  'alt.reduce_alcohol': 'Reduce consumo de alcohol.',
  'alt.increase_water': 'Aumenta consumo de agua.',
  'alt.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'alt.eliminate_alcohol': 'Elimina alcohol completamente.',
  'alt.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'alt.maintain_diet': 'Mantén una dieta balanceada.',
  'alt.keep_exercise': 'Continúa con ejercicio regular.',

  // AST
  'ast.maintain_diet': 'Mantén hábitos alimenticios saludables.',
  'ast.keep_exercise': 'Continúa con actividad física moderada.',
  'ast.reduce_alcohol': 'Reduce consumo de alcohol.',
  'ast.increase_water': 'Aumenta consumo de agua.',
  'ast.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'ast.eliminate_alcohol': 'Elimina alcohol completamente.',
  'ast.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',

  // HS_CRP
  'crp.reduce_inflammation': 'Reduce alimentos inflamatorios.',
  'crp.increase_omega3': 'Aumenta consumo de omega-3.',
  'crp.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'crp.eliminate_processed_foods': 'Elimina alimentos procesados completamente.',
  'crp.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'crp.maintain_diet': 'Mantén una dieta balanceada.',
  'crp.keep_exercise': 'Continúa con ejercicio regular.',

  'hs_crp.reduce_inflammation': 'Reduce alimentos inflamatorios.',
  'hs_crp.increase_omega3': 'Aumenta consumo de omega-3.',
  'hs_crp.add_cardio': 'Agrega ejercicio cardiovascular regular.',

  // HDL
  'hdl.increase_healthy_fats': 'Aumenta grasas saludables (aguacate, pescado).',
  'hdl.add_cardio': 'Agrega ejercicio cardiovascular.',
  'hdl.reduce_sugar': 'Reduce consumo de azúcares.',
  'hdl.daily_cardio': 'Ejercicio cardiovascular diario (30-45 min).',
  'hdl.maintain_diet': 'Mantén una dieta balanceada.',
  'hdl.keep_exercise': 'Continúa con ejercicio regular.',

  // EGFR
  'egfr.increase_water': 'Aumenta consumo de agua significativamente.',
  'egfr.reduce_sodium': 'Reduce consumo de sodio.',
  'egfr.add_cardio': 'Agrega ejercicio cardiovascular regular.',
  'egfr.maintain_diet': 'Mantén una dieta balanceada.',
  'egfr.keep_exercise': 'Continúa con ejercicio regular.',

  // ===== PRIORITIES =====
  'ldl.priority.high': 'Reducir colesterol LDL es tu prioridad principal.',
  'ldl.priority.medium': 'Mantener colesterol LDL bajo control.',
  'ldl.priority.low': 'Tu colesterol LDL está bien, continúa así.',

  'triglycerides.priority.high': 'Reducir triglicéridos es una prioridad alta.',
  'triglycerides.priority.medium': 'Mantener triglicéridos bajo control.',
  'triglycerides.priority.low': 'Tus triglicéridos están bien, continúa así.',

  'fasting_glucose.priority.high': 'Controlar glucosa es tu prioridad principal.',
  'fasting_glucose.priority.medium': 'Mejorar la glucosa ahora ayuda a prevenir problemas futuros.',
  'fasting_glucose.priority.low': 'Tu glucosa está bien, continúa así.',

  'hba1c.priority.high': 'Controlar hemoglobina glicosilada es tu prioridad principal.',
  'hba1c.priority.medium': 'Mantener hemoglobina glicosilada bajo control.',
  'hba1c.priority.low': 'Tu hemoglobina glicosilada está bien, continúa así.',

  'alt.priority.high': 'Controlar ALT es tu prioridad principal.',
  'alt.priority.medium': 'Mantener ALT bajo control.',
  'alt.priority.low': 'Tu ALT está bien, continúa así.',

  'ast.priority.high': 'Controlar AST es tu prioridad principal.',
  'ast.priority.medium': 'Mantener AST bajo control.',
  'ast.priority.low': 'Tu AST está bien, continúa así.',

  'hs_crp.priority.high': 'Reducir inflamación es tu prioridad principal.',
  'hs_crp.priority.medium': 'Mantener inflamación bajo control.',
  'hs_crp.priority.low': 'Tu inflamación está bien, continúa así.',

  'hdl.priority.high': 'Aumentar colesterol HDL es tu prioridad principal.',
  'hdl.priority.medium': 'Mantener colesterol HDL en buen nivel.',
  'hdl.priority.low': 'Tu colesterol HDL está bien, continúa así.',

  'egfr.priority.high': 'Mejorar función renal es tu prioridad principal.',
  'egfr.priority.medium': 'Mantener función renal en buen nivel.',
  'egfr.priority.low': 'Tu función renal está bien, continúa así.',

  'uric_acid.priority.high': 'Reducir ácido úrico es tu prioridad principal.',
  'uric_acid.priority.medium': 'Mantener ácido úrico bajo control.',
  'uric_acid.priority.low': 'Tu ácido úrico está bien, continúa así.',

  // ===== ACTION TITLES =====
  'ldl.add_cardio.title': 'Haz 150 minutos de cardio esta semana',
  'ldl.reduce_saturated_fat.title': 'Reduce grasas saturadas esta semana',
  'ldl.increase_fiber.title': 'Aumenta tu consumo de fibra diaria',
  'ldl.eliminate_trans_fats.title': 'Elimina grasas trans completamente',
  'ldl.daily_cardio.title': 'Ejercicio cardiovascular diario',
  'ldl.maintain_diet.title': 'Mantén una dieta saludable',
  'ldl.keep_exercise.title': 'Continúa con ejercicio regular',

  'activity.cardio_150.title': 'Haz 150 minutos de cardio esta semana',
  'activity.daily_walk.title': 'Camina 30 minutos, 5 días esta semana',
  'activity.strength_2x.title': 'Haz 2 sesiones de fuerza esta semana',
  'activity.no_sedentary_days.title': 'Evita días sin actividad física',
  'nutrition.fiber_25g.title': 'Consume 25g de fibra diaria',
  'nutrition.no_sugary_drinks.title': 'Elimina bebidas azucaradas',
  'nutrition.vegetables_daily.title': 'Consume 2 porciones de verduras diarias',
  'nutrition.low_refined_carbs.title': 'Reduce carbohidratos refinados 5 días',
  'nutrition.mediterranean_pattern.title': 'Sigue patrón mediterráneo 5 días',
  'elimination.no_alcohol.title': 'Elimina alcohol esta semana',
  'elimination.no_ultra_processed.title': 'Evita alimentos ultraprocesados 5 días',
  'elimination.no_beer.title': 'Elimina cerveza esta semana',
  'elimination.limit_fructose.title': 'Elimina snacks azucarados',
  'recovery.sleep_7h.title': 'Duerme 7 horas, 4 noches esta semana',
  'recovery.fixed_sleep_schedule.title': 'Mantén horario de sueño fijo 4 días',
  'recovery.stress_breaks.title': 'Toma pausas de 10 min, 5 días',
  'hydration.water_2l.title': 'Bebe 2 litros de agua diarios',
  'safety.no_nsaids.title': 'Evita antiinflamatorios esta semana',
  'hydration.extra_on_training.title': 'Hidrátate después del entrenamiento',

  'hba1c.reduce_sugar.title': 'Reduce azúcares refinados',
  'hba1c.increase_fiber.title': 'Aumenta consumo de fibra',
  'hba1c.add_cardio.title': 'Agrega ejercicio cardiovascular',
  'glucose.reduce_sugar.title': 'Reduce azúcares añadidos',
  'glucose.increase_fiber.title': 'Aumenta consumo de fibra',
  'glucose.add_cardio.title': 'Agrega ejercicio cardiovascular',
  'triglycerides.reduce_sugar.title': 'Reduce azúcar y alcohol',
  'triglycerides.increase_fiber.title': 'Aumenta consumo de fibra',
  'triglycerides.add_cardio.title': 'Incluye actividad cardiovascular',
  'alt.reduce_alcohol.title': 'Reduce consumo de alcohol',
  'alt.increase_water.title': 'Aumenta consumo de agua',
  'alt.add_cardio.title': 'Agrega ejercicio cardiovascular',
  'crp.reduce_inflammation.title': 'Reduce alimentos inflamatorios',
  'crp.increase_omega3.title': 'Aumenta consumo de omega-3',
  'hdl.increase_healthy_fats.title': 'Aumenta grasas saludables',
  'egfr.increase_water.title': 'Aumenta consumo de agua',
  'egfr.reduce_sodium.title': 'Reduce consumo de sodio',
  'uric_acid.reduce_purines.title': 'Reduce alimentos ricos en purinas',
  'uric_acid.increase_water.title': 'Aumenta consumo de agua',
};

