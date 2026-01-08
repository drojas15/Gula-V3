# DATABASE MIGRATION - Actions V2

**Objetivo:** Añadir campos necesarios para el sistema de adaptación de dificultad y reemplazo inteligente

## Nuevos Campos en `weekly_action_instances`

```sql
ALTER TABLE weekly_action_instances 
ADD COLUMN consecutive_weeks_zero INTEGER DEFAULT 0;

ALTER TABLE weekly_action_instances 
ADD COLUMN cooldown_until TEXT DEFAULT NULL; -- YYYY-MM-DD format

ALTER TABLE weekly_action_instances 
ADD COLUMN original_action_id TEXT DEFAULT NULL; -- Para rastrear reemplazos

ALTER TABLE weekly_action_instances 
ADD COLUMN adaptation_history TEXT DEFAULT NULL; -- JSON con historial de adaptaciones
```

## Descripción de Campos

### `consecutive_weeks_zero`
- Tipo: `INTEGER`
- Default: `0`
- Descripción: Contador de semanas consecutivas con `progress == 0`
- Uso: Determinar cuándo aplicar adaptación o reemplazo

### `cooldown_until`
- Tipo: `TEXT` (YYYY-MM-DD)
- Default: `NULL`
- Descripción: Fecha hasta la que la acción está en cooldown y no debe ser seleccionada
- Uso: Evitar repetir acciones que no funcionaron inmediatamente

### `original_action_id`
- Tipo: `TEXT`
- Default: `NULL`
- Descripción: ID de la acción original si esta es un reemplazo
- Uso: Rastrear cadenas de reemplazos y evitar loops

### `adaptation_history`
- Tipo: `TEXT` (JSON)
- Default: `NULL`
- Descripción: Historial de adaptaciones aplicadas a esta acción
- Formato JSON:
```json
[
  {
    "week_start": "2024-01-01",
    "action": "DEGRADE",
    "from_difficulty": "HARD",
    "to_difficulty": "MEDIUM",
    "reason": "Two consecutive weeks with zero progress"
  },
  {
    "week_start": "2024-01-15",
    "action": "REPLACE",
    "replaced_with": "activity.daily_walk",
    "reason": "EASY difficulty with zero progress for 2 weeks"
  }
]
```

## Índices Adicionales

```sql
-- Índice para consultas de cooldown
CREATE INDEX idx_weekly_actions_cooldown 
ON weekly_action_instances(user_id, cooldown_until) 
WHERE cooldown_until IS NOT NULL;

-- Índice para consultas de historial
CREATE INDEX idx_weekly_actions_history 
ON weekly_action_instances(user_id, action_id, week_start);
```

## Migración de Datos Existentes

```sql
-- Todos los registros existentes empiezan con valores default
-- No se requiere migración adicional de datos
```

## Rollback

```sql
-- Si necesitas revertir la migración:
ALTER TABLE weekly_action_instances DROP COLUMN consecutive_weeks_zero;
ALTER TABLE weekly_action_instances DROP COLUMN cooldown_until;
ALTER TABLE weekly_action_instances DROP COLUMN original_action_id;
ALTER TABLE weekly_action_instances DROP COLUMN adaptation_history;

DROP INDEX IF EXISTS idx_weekly_actions_cooldown;
DROP INDEX IF EXISTS idx_weekly_actions_history;
```

## Notas de Implementación

1. **Backward Compatibility:** Todos los campos tienen valores default, por lo que el código existente seguirá funcionando sin modificaciones

2. **Null Safety:** Siempre verificar si `cooldown_until` es NULL antes de comparar fechas

3. **JSON Validation:** Antes de parsear `adaptation_history`, verificar que no sea NULL y que sea JSON válido

4. **Performance:** Los índices nuevos mejoran las consultas de cooldown y historial, que son frecuentes en el sistema de adaptación

## Testing

```sql
-- Verificar que los campos existen
PRAGMA table_info(weekly_action_instances);

-- Verificar que los índices existen
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='weekly_action_instances';

-- Insertar registro de prueba con campos nuevos
INSERT INTO weekly_action_instances (
  id, user_id, action_id, category, weekly_target, success_metric,
  impacted_biomarkers, difficulty, progress, completion_state,
  week_start, week_end, created_at,
  consecutive_weeks_zero, cooldown_until, original_action_id, adaptation_history
) VALUES (
  'test_action_1',
  'test_user_1',
  'activity.cardio',
  'ACTIVITY',
  '150_minutes',
  'minutes_completed',
  '["LDL","HDL"]',
  'MEDIUM',
  0,
  'PENDING',
  '2024-01-01',
  '2024-01-07',
  datetime('now'),
  1,
  NULL,
  NULL,
  NULL
);

-- Verificar inserción
SELECT * FROM weekly_action_instances WHERE id = 'test_action_1';

-- Limpiar
DELETE FROM weekly_action_instances WHERE id = 'test_action_1';
```
