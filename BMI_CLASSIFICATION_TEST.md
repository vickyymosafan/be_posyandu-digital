# BMI Classification Test Cases

## Updated BMI Classification (WHO Asia-Pacific - Revised)

### Test Cases

| BMI Value | Expected Category | Test Case |
|-----------|------------------|-----------|
| 16.5 | Sangat Kurang | < 17.0 |
| 17.0 | Kurang | 17.0 - 18.4 |
| 18.0 | Kurang | 17.0 - 18.4 |
| 18.5 | Normal | 18.5 - 25.0 |
| 20.0 | Normal | 18.5 - 25.0 |
| 23.0 | Normal | 18.5 - 25.0 (CHANGED from "Kelebihan") |
| 25.0 | Normal | 18.5 - 25.0 |
| 25.1 | Berlebih | 25.1 - 27.0 |
| 26.0 | Berlebih | 25.1 - 27.0 |
| 27.0 | Berlebih | 25.1 - 27.0 |
| 27.1 | Obesitas I | 27.1 - 30.0 |
| 28.0 | Obesitas I | 27.1 - 30.0 |
| 30.0 | Obesitas I | 27.1 - 30.0 |
| 30.1 | Obesitas II | > 30.0 |
| 35.0 | Obesitas II | > 30.0 (CHANGED from "Obesitas III") |
| 40.0 | Obesitas II | > 30.0 (CHANGED from "Obesitas III") |

## Key Changes from Previous Classification

### 1. Normal Range Extended
- **Old**: 18.5 - 22.9
- **New**: 18.5 - 25.0
- **Impact**: BMI 23.0-25.0 now classified as "Normal" instead of "Kelebihan"

### 2. Berlebih (Overweight) Range Adjusted
- **Old**: 23.0 - 24.9 (called "Kelebihan Berat Badan")
- **New**: 25.1 - 27.0 (called "Berlebih")
- **Impact**: Narrower range, starts at 25.1

### 3. Obesitas I Range Adjusted
- **Old**: 25.0 - 29.9
- **New**: 27.1 - 30.0
- **Impact**: Starts at 27.1 instead of 25.0

### 4. Obesitas II Simplified
- **Old**: 30.0 - 34.9
- **New**: > 30.0
- **Impact**: All BMI > 30.0 now classified as "Obesitas II"

### 5. Obesitas III Removed
- **Old**: ≥ 35.0 (separate category)
- **New**: Merged into "Obesitas II"
- **Impact**: Simplified classification, no more Obesitas III

## Example Calculations

### Example 1: Normal Weight
- Height: 160 cm
- Weight: 60 kg
- BMI: 23.44
- **Old Classification**: Kelebihan Berat Badan
- **New Classification**: Normal ✅

### Example 2: Overweight
- Height: 165 cm
- Weight: 72 kg
- BMI: 26.45
- **Old Classification**: Obesitas I
- **New Classification**: Berlebih ✅

### Example 3: Obesity
- Height: 170 cm
- Weight: 90 kg
- BMI: 31.14
- **Old Classification**: Obesitas II
- **New Classification**: Obesitas II ✅ (same)

### Example 4: Severe Obesity
- Height: 160 cm
- Weight: 95 kg
- BMI: 37.11
- **Old Classification**: Obesitas III
- **New Classification**: Obesitas II ✅ (merged)

## Implementation Details

### Constants Updated
```typescript
const BMI_THRESHOLD = {
  SANGAT_KURANG: 17.0,
  KURANG: 18.5,
  NORMAL: 25.1,      // Changed from 23.0
  BERLEBIH: 27.1,    // Changed from 25.0
  OBESITAS_I: 30.1,  // Changed from 30.0
} as const;

const KATEGORI_BMI = {
  SANGAT_KURANG: 'Sangat Kurang',
  KURANG: 'Kurang',
  NORMAL: 'Normal',
  BERLEBIH: 'Berlebih',           // Changed from 'Kelebihan Berat Badan'
  OBESITAS_I: 'Obesitas I',
  OBESITAS_II: 'Obesitas II',     // Obesitas III removed
} as const;
```

### Classification Logic
```typescript
function klasifikasiBMI(bmi: number): string {
  if (bmi < 17.0) return 'Sangat Kurang';
  if (bmi < 18.5) return 'Kurang';
  if (bmi < 25.1) return 'Normal';        // Extended range
  if (bmi < 27.1) return 'Berlebih';      // New range
  if (bmi < 30.1) return 'Obesitas I';    // Adjusted range
  return 'Obesitas II';                    // Simplified (includes old Obesitas III)
}
```

## Migration Impact

### Database
- No schema changes required
- Existing `kategoriBmi` field can store new category names
- Historical data will have old category names (acceptable)

### Frontend
- No changes required (displays category from backend)
- Charts and displays will automatically show new categories

### API
- No breaking changes
- Response format remains the same
- Only category values change

## Testing Recommendations

1. ✅ Unit test BMI classification function
2. ✅ Test edge cases (17.0, 18.5, 25.0, 25.1, 27.0, 27.1, 30.0, 30.1)
3. ✅ Integration test with pemeriksaan service
4. ✅ Verify API responses include correct categories
5. ✅ Manual testing with various height/weight combinations
