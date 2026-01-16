# ROBUST BIOMARKER PARSER - IMPLEMENTACIÓN

## Resumen

Se implementó un parser robusto de biomarcadores que tolera múltiples formatos de laboratorios LATAM y extrae valores correctamente incluso cuando:
- El valor NO es el primer número en la línea
- Hay fechas, rangos de referencia u otros números en la misma línea
- El formato del laboratorio varía

## Archivos Creados

### 1. `/backend/src/services/robust-biomarker-parser.service.ts`
Parser principal que implementa todas las reglas de parsing especificadas.

**Funciones principales:**
- `parseLineForBiomarker(rawLine)`: Parsea UNA línea y extrae biomarcador + valor
- `parseFullText(pdfText)`: Parsea texto completo línea por línea
- `convertToLegacyFormat(parsed)`: Convierte al formato BiomarkerValue para compatibilidad

### 2. `/backend/tests/robust-biomarker-parser.test.ts`
Suite completa de tests unitarios con 27 casos de prueba que cubren:
- Valores con rangos en la misma línea
- Líneas con fechas
- Valor que NO es el primer número
- Formatos reales de Sura, Colsanitas, Compensar
- Separación hs-CRP vs PCR normal
- eGFR y ácido úrico
- Casos sin valor válido
- Aliases alternativos (TGP/ALT, TGO/AST)
- Parsing de texto completo
- Niveles de confianza

## Reglas de Parsing Implementadas

### 1. Normalización Previa
```typescript
- Lowercase
- Eliminar tildes/acentos
- Eliminar *, paréntesis
- Unificar separadores (: – - → espacio)
- Eliminar dobles espacios
```

### 2. Parseo Línea por Línea
- Cada línea es una unidad independiente
- NO se parsea por bloques
- Un biomarcador = un valor (primer match válido)

### 3. Detección por Concepto
Para cada línea:
1. Detectar si contiene alias de biomarcador
2. Si NO → ignorar línea
3. Si SÍ → intentar extraer valor

### 4. Extracción de Valor
Proceso:
1. Extraer TODOS los números decimales de la línea
2. Filtrar números inválidos:
   - Fechas (dd/mm/yyyy, dd-mm-yyyy, etc.)
   - Rangos (0-200, 50-150, etc.)
   - Referencias (precedidos por REF, VR, RANGO, etc.)
3. Seleccionar el número MÁS CERCANO al alias detectado
4. Si no hay candidato claro → `value = null`

### 5. Separación Conceptual
- **hs-CRP** ≠ **PCR normal**
- Se usa unidad + texto contextual ("ultrasensible", "hs", "us")
- Cada uno tiene rangos y pesos diferentes

### 6. Nivel de Confianza
```typescript
- high: 1 candidato + unidad detectada
- medium: 1 candidato sin unidad, o múltiples con unidad
- low: múltiples candidatos sin unidad clara
- none: no se pudo extraer valor
```

## Output del Parser

```typescript
interface ParsedBiomarker {
  biomarker: BiomarkerKey | null;
  raw_line: string;
  value: number | null;
  unit: string | null;
  confidence: ConfidenceLevel;
}
```

### Ejemplo con valor:
```json
{
  "biomarker": "TRIGLYCERIDES",
  "raw_line": "Triglicéridos en suero 111 50 - 150 mg/dL",
  "value": 111,
  "unit": "mg/dl",
  "confidence": "high"
}
```

### Ejemplo sin valor:
```json
{
  "biomarker": "HDL",
  "raw_line": "Colesterol HDL",
  "value": null,
  "unit": null,
  "confidence": "none"
}
```

## Integración con Sistema Existente

### Modificación en `pdf-parser.service.ts`
```typescript
// ANTES (parser antiguo)
const biomarkers = extractBiomarkers(text);

// AHORA (parser robusto)
const parsedBiomarkers = parseFullText(text);
const biomarkers = convertToLegacyFormat(parsedBiomarkers);
```

El nuevo parser es **drop-in compatible** con el sistema existente.

## Tests

### Ejecución
```bash
cd backend
npm test -- robust-biomarker-parser.test.ts
```

### Resultados
```
✓ 27 tests pasando
✓ Todos los formatos LATAM soportados
✓ Separación correcta hs-CRP vs PCR normal
✓ Detección de fechas y rangos funciona
✓ Valor más cercano al alias se selecciona correctamente
```

### Tests de Integración
```bash
npm test  # Ejecuta TODOS los tests (101 tests)
```

Todos los tests existentes siguen pasando, confirmando compatibilidad total.

## Casos de Uso Reales

### Caso 1: Sura
```
COLESTEROL LDL     145     0-100     mg/dL     ALTO
```
✓ Detecta: LDL = 145 mg/dL (ignora rango 0-100)

### Caso 2: Colsanitas
```
Triglicéridos – 175 – Rango: 0-150 – mg/dL
```
✓ Detecta: TRIGLYCERIDES = 175 mg/dL (ignora rango)

### Caso 3: Compensar
```
GLUCOSA EN AYUNAS: 102 (70-100) mg/dL
```
✓ Detecta: FASTING_GLUCOSE = 102 mg/dL (ignora rango)

### Caso 4: Con fecha
```
Glucosa en ayunas 12/01/2024 95 mg/dL
```
✓ Detecta: FASTING_GLUCOSE = 95 mg/dL (ignora fecha)

### Caso 5: Valor no es primer número
```
001 ALT (TGP) 45 U/L REF: 0-40
```
✓ Detecta: ALT = 45 U/L (ignora código 001 y rango)

## Ventajas sobre Parser Anterior

1. **Tolerante a formatos**: No depende del orden del texto
2. **Inteligente**: Selecciona el número correcto por proximidad semántica
3. **Robusto**: Filtra fechas, rangos y referencias automáticamente
4. **Confiable**: Devuelve `null` si no está seguro (no inventa valores)
5. **Trazable**: Logs detallados de cada decisión
6. **Testeado**: 27 casos de prueba con PDFs reales LATAM

## Logging

El parser genera logs detallados para debugging:

```
[Parser] Línea: "Triglicéridos en suero 111 50 - 150 mg/dL"
[Parser] Alias detectado: TRIGLYCERIDES → TRIGLYCERIDES
[Parser] Números encontrados: [111, 50, 150]
  [Parser] Ignorando 50 (es parte de rango): "suero 111 50 150 mg/dl"
  [Parser] Ignorando 150 (es parte de rango): "ro 111 50 150 mg/dl"
[Parser] Candidatos válidos: [111]
[Parser] Posición del alias: 13
[Parser] ✓ Valor final: 111 mg/dL [confianza: high]
```

## Próximos Pasos (Opcional)

1. **Validación de rangos fisiológicos**: Rechazar valores imposibles (ej: LDL = 5000)
2. **Machine Learning**: Entrenar modelo con PDFs reales para mejorar detección
3. **OCR mejorado**: Pre-procesamiento de PDFs escaneados
4. **Feedback loop**: Permitir corrección manual y aprender de ella

## Notas Importantes

- El parser NUNCA inventa valores
- Si no está seguro, devuelve `null` (mejor que valor incorrecto)
- Primer match válido gana (no sobrescribe)
- Compatible 100% con sistema existente
- Todos los tests pasan (101/101)
