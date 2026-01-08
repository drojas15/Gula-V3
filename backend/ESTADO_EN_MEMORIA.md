# 🔍 ANÁLISIS: ESTADO EN MEMORIA - EXÁMENES Y BIOMARCADORES

## ✅ ELIMINADO (Ya reemplazado por SQLite)
- `examStore` en `src/routes/exam.routes.ts` - **ELIMINADO** ✅
- Store en memoria para exámenes - **REEMPLAZADO POR SQLite** ✅

## ❌ PROBLEMA IDENTIFICADO: DASHBOARD USA MOCK DATA

### Archivo: `src/controllers/weekly-actions.controller.ts`

**Líneas 51-62**: Mock data hardcodeado
```typescript
// Mock data for structure - replace with actual DB queries
const mockBiomarkerValues: BiomarkerValue[] = [
  { biomarker: 'LDL', value: 145, unit: 'mg/dL' },
  { biomarker: 'HDL', value: 45, unit: 'mg/dL' },
  // ... más mock data
];
```

**Líneas 70-71**: Previous exam data hardcodeado a `null`
```typescript
const previousScore = null; // TODO: Get from database
const previousBiomarkers: Array<{ biomarker: BiomarkerKey; value: number }> | null = null;
```

**Líneas 113-114**: Exam dates hardcodeados a `null`
```typescript
const currentExamDate = null; // TODO: Get from latest exam.examDate
const previousExamDate = null; // TODO: Get from second-to-last exam.examDate
```

### Archivo: `src/services/weekly-actions-db.service.ts`

**Líneas 139-157**: `getLatestExamData()` retorna `null`
```typescript
export async function getLatestExamData(userId: string): Promise<{...} | null> {
  // TODO: Implement database query
  return null; // ❌ NO LEE DESDE SQLite
}
```

**Líneas 162-180**: `getPreviousExamData()` retorna `null`
```typescript
export async function getPreviousExamData(userId: string): Promise<{...} | null> {
  // TODO: Implement database query
  return null; // ❌ NO LEE DESDE SQLite
}
```

**Líneas 192-209**: `getBiomarkerHistoryFromDB()` retorna array vacío
```typescript
export async function getBiomarkerHistoryFromDB(...): Promise<Array<{...}>> {
  // TODO: Implement database query
  return []; // ❌ NO LEE DESDE SQLite
}
```

## ✅ ARCHIVOS LIMPIOS (Sin estado en memoria)

### `src/services/biomarker-history.service.ts`
- ✅ Solo funciones puras
- ✅ No tiene estado global
- ✅ Recibe datos como parámetros
- ✅ Los arrays encontrados son locales a funciones (temporales)

### `src/services/dashboard.service.ts`
- ✅ Solo funciones puras
- ✅ No tiene estado global
- ✅ Recibe datos como parámetros
- ✅ No mantiene estado volátil

## 🎯 ACCIÓN REQUERIDA

**REEMPLAZAR en `src/controllers/weekly-actions.controller.ts`:**

1. **Eliminar mock data** (líneas 51-62)
2. **Leer desde SQLite** usando la tabla `exams` que ya existe
3. **Implementar `getLatestExamData()`** para leer desde SQLite
4. **Implementar `getPreviousExamData()`** para leer desde SQLite
5. **Parsear biomarkers JSON** desde la columna `biomarkers` en SQLite

## 📋 QUERIES SQL NECESARIAS

```sql
-- Latest exam
SELECT examId, examDate, healthScore, biomarkers
FROM exams
WHERE userId = ?
ORDER BY examDate DESC
LIMIT 1;

-- Previous exam
SELECT examId, examDate, healthScore, biomarkers
FROM exams
WHERE userId = ?
ORDER BY examDate DESC
LIMIT 1 OFFSET 1;
```

## ✅ CRITERIO DE ÉXITO

- Dashboard lee desde SQLite (no mock data)
- `getLatestExamData()` retorna datos reales
- `getPreviousExamData()` retorna datos reales o `null` si no hay previo
- Comparación funciona con datos reales
- "Primer registro" desaparece cuando hay 2+ exámenes

