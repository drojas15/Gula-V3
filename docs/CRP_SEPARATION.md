# Separación de PCR Ultrasensible y PCR Normal

**Fecha:** 2026-01-08  
**Estado:** ✅ Completado y Testeado

---

## 🎯 Objetivo

Evitar comparaciones incorrectas entre PCR ultrasensible (HS_CRP) y PCR normal (CRP_STANDARD), protegiendo el health score, las tendencias y la confianza del usuario.

**Problema crítico:** Ambos tipos de PCR tienen rangos de valores completamente diferentes y NO son intercambiables. Comparar PCR normal con PCR ultrasensible genera:
- Tendencias falsas ("empeoró" o "mejoró")
- Contradicciones clínicas
- Confusión del usuario
- Scores incorrectos

---

## 📊 Diferencias entre HS_CRP y CRP_STANDARD

### HS_CRP (PCR Ultrasensible)

| Característica | Valor |
|---------------|-------|
| **Rango normal** | < 1.0 mg/L |
| **Riesgo moderado** | 1.0 - 3.0 mg/L |
| **Riesgo alto** | 3.1 - 10.0 mg/L |
| **Crítico** | > 10 mg/L |
| **Uso clínico** | Evaluación de riesgo cardiovascular |
| **Sensibilidad** | Alta (detecta inflamación subclínica) |
| **Peso en score** | 1.3 (entra al health score) |

### CRP_STANDARD (PCR Normal)

| Característica | Valor |
|---------------|-------|
| **Rango normal** | < 3.0 mg/L |
| **Elevado** | 3.1 - 10.0 mg/L |
| **Alto** | 10.1 - 50.0 mg/L |
| **Muy alto** | > 50 mg/L |
| **Uso clínico** | Detección de inflamación/infección aguda |
| **Sensibilidad** | Estándar (inflamación activa) |
| **Peso en score** | 0 (NO entra al health score) |

**CRÍTICO:** Un valor de 5 mg/L puede ser:
- **HS_CRP:** OUT_OF_RANGE (riesgo cardiovascular)
- **CRP_STANDARD:** OPTIMAL/GOOD (sin inflamación aguda)

**Por eso NUNCA deben compararse entre sí.**

---

## ✅ Solución Implementada

### 1. Dos Biomarcadores Distintos

```typescript
export type BiomarkerKey = 
  | 'HS_CRP'        // PCR ultrasensible
  | 'CRP_STANDARD'  // PCR normal
  | ...
```

- Claves diferentes
- Historiales independientes
- NO se comparan entre sí
- Rangos diferentes

### 2. Detección Inteligente en PDF Parser

```typescript
// Lógica en findCanonicalBiomarker()
if (isPCR) {
  const isUltrasensitive = 
    text.includes('ULTRASENSIBLE') ||
    text.includes('HS-CRP') ||
    text.includes('PCR HS') ||
    text.includes('PCR US') ||
    text.includes('HIGH SENSITIVITY');
  
  return isUltrasensitive ? 'HS_CRP' : 'CRP_STANDARD';
}
```

**Palabras clave para HS_CRP:**
- "ultrasensible", "us", "hs"
- "hs-CRP", "hscrp"
- "high sensitivity"
- "PCR HS", "PCR US"

**Palabras clave para CRP_STANDARD:**
- "PCR" sin "ultrasensible"
- "Proteína C Reactiva" sin "ultrasensible"
- "C Reactive Protein"
- "PCR Cuantitativa" (sin "ultrasensible")

**Regla de oro:** NUNCA asumir HS_CRP por defecto. Si no está claro que es ultrasensible, mapear a CRP_STANDARD.

### 3. Pesos Diferenciados

```typescript
export const BIOMARKERS = {
  HS_CRP: { weight: 1.3, unit: 'mg/L' },       // Entra al score
  CRP_STANDARD: { weight: 0, unit: 'mg/L' },   // NO entra al score
  // ...
};
```

**HS_CRP (peso = 1.3):**
- ✅ Entra al health score
- ✅ Entra a fiabilidad
- ✅ Genera acciones semanales
- ✅ Muestra tendencias

**CRP_STANDARD (peso = 0):**
- ❌ NO entra al health score
- ❌ NO entra a fiabilidad
- ❌ NO genera acciones
- ℹ️ Solo informativo

### 4. Comparaciones Solo del Mismo Tipo

La lógica de tendencias en `biomarker-state.service.ts` usa queries SQL que filtran por `biomarker_code`:

```sql
SELECT exam_date, value, status_at_time, unit
FROM biomarker_result
WHERE user_id = ?
  AND biomarker_code = ?  -- ← CLAVE: Solo el mismo tipo
ORDER BY exam_date DESC
LIMIT 2
```

**Esto garantiza:**
- HS_CRP solo se compara con HS_CRP anterior
- CRP_STANDARD solo se compara con CRP_STANDARD anterior
- NUNCA se mezclan

### 5. Rangos de Referencia Separados

```typescript
export const RANGES = {
  HS_CRP: {
    OPTIMAL: { max: 1.0 },
    GOOD: { min: 1.0, max: 3.0 },
    OUT_OF_RANGE: { min: 3.1, max: 10.0 },
    CRITICAL: { min: 10.1 }
  },
  CRP_STANDARD: {
    OPTIMAL: { max: 3.0 },
    GOOD: { min: 3.1, max: 10.0 },
    OUT_OF_RANGE: { min: 10.1, max: 50.0 },
    CRITICAL: { min: 50.1 }
  }
};
```

Cada uno tiene su propia evaluación de status.

---

## 🧪 Tests Implementados

Se creó una suite completa de tests en:  
`backend/tests/crp-separation.test.ts`

### Tests Críticos

1. **Detección de alias** ✅
   - "PCR ultrasensible" → HS_CRP
   - "Proteína C Reactiva" → CRP_STANDARD
   - "PCR" → CRP_STANDARD (conservador)
   - "hs-CRP" → HS_CRP

2. **Configuración de pesos** ✅
   - HS_CRP peso > 0
   - CRP_STANDARD peso = 0

3. **Impacto en health score** ✅
   - HS_CRP afecta el score
   - CRP_STANDARD NO afecta el score
   - Ambos juntos: solo HS_CRP cuenta

4. **Edge cases** ✅
   - Texto con "PCR" y "ultrasensible" separados
   - Minúsculas/mayúsculas
   - NUNCA asumir HS_CRP por defecto

### Cobertura de Tests

```bash
Test Suites: 1 passed
Tests:       18 passed, 18 total
```

**Todos los tests pasan** ✅

---

## 📁 Archivos Modificados

### Backend - Configuración

1. **`backend/src/config/biomarkers.config.ts`**
   - Agregado `CRP_STANDARD` al tipo `BiomarkerKey`
   - Agregado configuración con peso = 0
   - Agregados rangos de referencia para CRP_STANDARD

2. **`backend/src/config/recommendations.config.ts`**
   - Agregadas recomendaciones vacías para CRP_STANDARD
   - (No genera acciones por ser informativo)

### Backend - Servicios

3. **`backend/src/services/biomarker-alias.service.ts`**
   - Agregado `CRP_STANDARD` al tipo `CanonicalBiomarker`
   - Separados alias de HS_CRP y CRP_STANDARD
   - Implementada lógica de detección inteligente en `findCanonicalBiomarker()`
   - Actualizado mapeo en `mapCanonicalToBiomarkerKey()`

4. **`backend/src/services/scoring-engine.service.ts`**
   - Agregada validación para excluir biomarcadores con peso = 0
   - Log cuando se salta CRP_STANDARD

5. **`backend/src/services/biomarker-state.service.ts`**
   - Agregado `CRP_STANDARD` a lista de biomarcadores soportados
   - En `getLatestBiomarkerState()` y `calculateReliability()`

### Backend - Tests

6. **`backend/tests/crp-separation.test.ts`** (NUEVO)
   - 18 tests exhaustivos
   - Cobertura completa de casos edge
   - Validación de alias, pesos, scores, y tipos

### Documentación

7. **`docs/CRP_SEPARATION.md`** (NUEVO - este archivo)
   - Documentación completa de la separación
   - Explicación de diferencias clínicas
   - Ejemplos y casos de uso

---

## 📖 Casos de Uso

### Caso 1: Usuario sube examen con PCR Ultrasensible

**Input:** PDF con "PCR ultrasensible = 4.5 mg/L"

**Proceso:**
1. Parser detecta "ULTRASENSIBLE" → mapea a HS_CRP
2. Valor 4.5 mg/L evaluado con rangos de HS_CRP → OUT_OF_RANGE
3. HS_CRP entra al health score (peso 1.3)
4. Se genera acción semanal antiinflamatoria
5. Se muestra en dashboard con tendencia

**Resultado:** ✅ Correcto

---

### Caso 2: Usuario sube examen con PCR Normal

**Input:** PDF con "Proteína C Reactiva = 8.0 mg/L"

**Proceso:**
1. Parser detecta "PROTEINA C REACTIVA" sin "ultrasensible" → mapea a CRP_STANDARD
2. Valor 8.0 mg/L evaluado con rangos de CRP_STANDARD → GOOD
3. CRP_STANDARD NO entra al health score (peso 0)
4. NO se genera acción semanal
5. Opcionalmente se muestra como informativo

**Resultado:** ✅ Correcto

---

### Caso 3: Usuario tiene historial de HS_CRP y sube PCR Normal

**Historial previo:**
- 2024-01-15: HS_CRP = 2.5 mg/L (GOOD)
- 2024-06-15: HS_CRP = 3.2 mg/L (OUT_OF_RANGE)

**Nuevo examen:**
- 2025-01-08: PCR (normal) = 5.0 mg/L

**Proceso:**
1. Parser detecta que NO es ultrasensible → CRP_STANDARD
2. CRP_STANDARD se guarda como registro independiente
3. HS_CRP conserva su último valor (3.2 mg/L en 2024-06-15)
4. NO se comparan entre sí
5. NO aparece tendencia falsa de "mejoró" o "empeoró"

**Resultado:** ✅ Correcto - Sin comparación incorrecta

---

### Caso 4: Usuario sube ambos tipos en el mismo examen

**Input:** PDF con:
- "PCR ultrasensible = 2.8 mg/L"
- "Proteína C Reactiva = 6.0 mg/L"

**Proceso:**
1. Parser detecta ambos como biomarcadores distintos
2. HS_CRP = 2.8 mg/L → GOOD
3. CRP_STANDARD = 6.0 mg/L → GOOD
4. Solo HS_CRP entra al health score
5. Ambos se guardan en historial independiente

**Resultado:** ✅ Correcto - Ambos coexisten sin conflicto

---

## ⚠️ Reglas Críticas

### PROHIBIDO ❌

1. **NUNCA** asumir HS_CRP por defecto
   - Si no está claro que es ultrasensible → CRP_STANDARD

2. **NUNCA** comparar HS_CRP con CRP_STANDARD
   - Son biomarcadores distintos con rangos diferentes

3. **NUNCA** mostrar tendencia entre tipos diferentes
   - Solo comparar el mismo tipo consigo mismo

4. **NUNCA** hacer que CRP_STANDARD entre al score
   - Peso debe ser = 0 siempre

5. **NUNCA** generar acciones desde CRP_STANDARD
   - Solo HS_CRP genera acciones

### OBLIGATORIO ✅

1. **SIEMPRE** usar detección inteligente
   - Buscar palabras clave "ultrasensible", "hs", "us"

2. **SIEMPRE** filtrar por `biomarker_code` en queries
   - Garantiza comparación solo del mismo tipo

3. **SIEMPRE** respetar peso = 0 para informativos
   - CRP_STANDARD NO afecta score ni fiabilidad

4. **SIEMPRE** mostrar fecha de última medición
   - Cada biomarcador tiene su propio historial

5. **SIEMPRE** ejecutar tests antes de deploy
   - `npm test -- crp-separation.test.ts`

---

## 🎯 Resultado Final

### Antes (Incorrecto)

```
Examen 1 (2024-01): HS_CRP = 2.5 mg/L
Examen 2 (2025-01): PCR normal = 5.0 mg/L

❌ Dashboard muestra: "PCR empeoró ↑"
❌ Score afectado por PCR normal
❌ Usuario confundido
```

### Después (Correcto)

```
Examen 1 (2024-01): HS_CRP = 2.5 mg/L
Examen 2 (2025-01): CRP_STANDARD = 5.0 mg/L

✅ Dashboard muestra:
   - HS_CRP: 2.5 mg/L (última: 2024-01) → sin tendencia
   - CRP_STANDARD: 5.0 mg/L (informativo)
✅ Score solo cuenta HS_CRP
✅ Sin comparaciones incorrectas
```

---

## 🚀 Verificación

### Checklist de Deploy

- [x] CRP_STANDARD agregado a tipos y configuración
- [x] Alias separados correctamente
- [x] Peso = 0 para CRP_STANDARD
- [x] Detección inteligente implementada
- [x] Comparaciones solo del mismo tipo
- [x] Tests implementados y pasando (18/18)
- [x] Documentación completa
- [x] Health score excluye CRP_STANDARD

### Ejecutar Tests

```bash
cd backend
npm test -- crp-separation.test.ts
```

Debe mostrar: **18 passed, 18 total** ✅

### Verificar en Desarrollo

1. Subir PDF con "PCR ultrasensible" → debe detectar HS_CRP
2. Subir PDF con "Proteína C Reactiva" → debe detectar CRP_STANDARD
3. Verificar que CRP_STANDARD NO afecte health score
4. Verificar que no haya comparaciones entre tipos

---

## 📚 Referencias

### Documentación Relacionada

- `docs/BIOMARKER_HISTORY.md` - Historial independiente por biomarcador
- `docs/SCORING_LOGIC.md` - Cómo se calcula el health score
- `docs/DATABASE_SCHEMA.md` - Tabla biomarker_result

### Archivos Clave

- `backend/src/config/biomarkers.config.ts` - Configuración de pesos y rangos
- `backend/src/services/biomarker-alias.service.ts` - Detección de alias
- `backend/src/services/biomarker-state.service.ts` - Historial independiente
- `backend/tests/crp-separation.test.ts` - Tests de validación

---

**Implementado por:** Sistema GULA  
**Fecha de implementación:** 2026-01-08  
**Tests:** ✅ 18/18 passing  
**Estado:** ✅ Listo para producción
