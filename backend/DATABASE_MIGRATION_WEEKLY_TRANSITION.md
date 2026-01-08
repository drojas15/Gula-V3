# DATABASE MIGRATION - Weekly Transition

**Objetivo:** Añadir campo para rastrear cuando el usuario vio la última transición semanal

## Nuevo Campo en `users`

```sql
ALTER TABLE users 
ADD COLUMN last_transition_seen TEXT DEFAULT NULL; -- YYYY-MM-DD format
```

## Descripción

### `last_transition_seen`
- Tipo: `TEXT` (YYYY-MM-DD)
- Default: `NULL`
- Descripción: Fecha del inicio de la semana en que el usuario vio por última vez la transición semanal
- Uso: Evitar mostrar el modal múltiples veces en la misma semana

**Lógica:**
- Al inicio de cada semana (lunes), si `last_transition_seen < inicio_semana_actual`:
  - Mostrar modal de transición
- Después de que el usuario confirma o descarta:
  - Actualizar `last_transition_seen = inicio_semana_actual`
- Si el usuario entra múltiples veces en la misma semana:
  - NO mostrar modal (ya está actualizado)

## Índice Adicional

```sql
-- Índice para consultas rápidas de transición
CREATE INDEX idx_users_last_transition 
ON users(last_transition_seen) 
WHERE last_transition_seen IS NOT NULL;
```

## Migración de Datos Existentes

```sql
-- Usuarios existentes empiezan con NULL
-- Verán la transición en su próximo login del lunes
```

## Testing

```sql
-- Verificar que el campo existe
PRAGMA table_info(users);

-- Verificar que el índice existe
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users';

-- Actualizar para usuario de prueba
UPDATE users 
SET last_transition_seen = '2024-01-01' 
WHERE id = 'test_user_1';

-- Verificar actualización
SELECT id, last_transition_seen FROM users WHERE id = 'test_user_1';

-- Simular nueva semana (cambiar fecha a semana anterior)
UPDATE users 
SET last_transition_seen = '2023-12-25' 
WHERE id = 'test_user_1';

-- Usuario debería ver transición en próximo login
```

## Rollback

```sql
-- Si necesitas revertir:
ALTER TABLE users DROP COLUMN last_transition_seen;
DROP INDEX IF EXISTS idx_users_last_transition;
```

## Notas de Implementación

1. **Null Safety:** Siempre verificar NULL antes de comparar con fecha actual
2. **Timezone:** Usar fecha local del usuario (o UTC consistente)
3. **Formato:** YYYY-MM-DD para fácil comparación de strings
4. **Performance:** El índice mejora las consultas de verificación

## Ejemplo de Uso

```typescript
// Backend: weekly-transition.service.ts
function hasSeenWeeklyTransition(userId: string): boolean {
  const currentWeekStart = getCurrentWeekStart(); // "2024-01-15"
  
  const user = db.query(`
    SELECT last_transition_seen 
    FROM users 
    WHERE id = ?
  `, userId);
  
  if (!user || !user.last_transition_seen) {
    return false; // Nunca ha visto transición
  }
  
  // Comparar: si last_transition_seen >= currentWeekStart, ya vio esta semana
  return user.last_transition_seen >= currentWeekStart;
}

function markTransitionSeen(userId: string): void {
  const currentWeekStart = getCurrentWeekStart(); // "2024-01-15"
  
  db.query(`
    UPDATE users 
    SET last_transition_seen = ? 
    WHERE id = ?
  `, currentWeekStart, userId);
}
```

## Escenarios de Prueba

### Escenario 1: Primera vez (nuevo usuario)
```
user.last_transition_seen: NULL
currentWeekStart: "2024-01-15"
shouldShow: true ✅
```

### Escenario 2: Ya vio esta semana
```
user.last_transition_seen: "2024-01-15"
currentWeekStart: "2024-01-15"
shouldShow: false ❌
```

### Escenario 3: Nueva semana
```
user.last_transition_seen: "2024-01-08"
currentWeekStart: "2024-01-15"
shouldShow: true ✅
```

### Escenario 4: Múltiples entradas en la misma semana
```
Lunes:    shouldShow: true ✅ → confirm → last_transition_seen = "2024-01-15"
Martes:   shouldShow: false ❌
Miércoles: shouldShow: false ❌
Jueves:   shouldShow: false ❌
```
