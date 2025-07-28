# Import Field Mapping Fix - QR-Based ERP System

## Issue Summary

**Error**: `Could not find the 'oldId' column of 'employees' in the schema cache`

**Root Cause**: The import functionality was trying to use camelCase field names (`oldId`, `bloodGroup`, `qrCode`, etc.) when the database expects snake_case field names (`old_id`, `blood_group`, `qr_code`, etc.).

## Problem Details

### Database Schema vs TypeScript Interface Mismatch

The database uses snake_case column names:
- `old_id` (not `oldId`)
- `blood_group` (not `bloodGroup`)
- `qr_code` (not `qrCode`)
- `created_at` (not `createdAt`)
- `last_updated` (not `lastUpdated`)
- `cost_center_code` (not `costCenterCode`)
- `profit_center_code` (not `profitCenterCode`)
- `hourly_rate` (not `hourlyRate`)

### Import Process Flow

1. **Excel Template**: Uses snake_case column names (correct)
2. **Excel Import**: Reads data with snake_case field names (correct)
3. **Processing**: Maps to camelCase for TypeScript interface (correct)
4. **Database Insert**: SupabaseRegistrationService transforms camelCase back to snake_case (correct)

## Solution Implemented

### 1. Fixed Field Mapping in RegistrationForm.tsx

Updated the import processing to handle both snake_case and camelCase field names:

```typescript
// Before (only camelCase)
bloodGroup: item.bloodGroup || '',
qrCode: item.qrCode || employeeId,
oldId: item.oldId || '',

// After (supports both snake_case and camelCase)
bloodGroup: item.blood_group || item.bloodGroup || '',
qrCode: item.qr_code || item.qrCode || employeeId,
oldId: item.old_id || item.oldId || '',
```

### 2. Applied Fix to All Entity Types

**Employees**:
- `blood_group` → `bloodGroup`
- `qr_code` → `qrCode`
- `created_at` → `createdAt`
- `last_updated` → `lastUpdated`
- `old_id` → `oldId`
- `cost_center_code` → `costCenterCode`
- `profit_center_code` → `profitCenterCode`
- `hourly_rate` → `hourlyRate`

**Equipment**:
- `qr_code` → `qrCode`
- `created_at` → `createdAt`
- `last_updated` → `lastUpdated`
- `serial_number` → `serialNumber`
- `old_id` → `oldId`
- `cost_center_code` → `costCenterCode`
- `profit_center_code` → `profitCenterCode`
- `usage_duration` → `usageDuration`
- `standby_duration` → `standbyDuration`
- `maintenance_duration` → `maintenanceDuration`

**Materials**:
- `qr_code` → `qrCode`
- `created_at` → `createdAt`
- `last_updated` → `lastUpdated`
- `access_level` → `accessLevel`
- `old_id` → `oldId`
- `cost_center_code` → `costCenterCode`
- `profit_center_code` → `profitCenterCode`

**Sites**:
- `qr_code` → `qrCode`
- `last_updated` → `lastUpdated`
- `cost_center_code` → `costCenterCode`
- `profit_center_code` → `profitCenterCode`

## Files Modified

1. **`src/components/registration/RegistrationForm.tsx`**
   - Updated import processing for all entity types
   - Added support for both snake_case and camelCase field names
   - Ensured proper field mapping to TypeScript interfaces

2. **`src/utils/excelUtils.ts`** (already correct)
   - Templates use snake_case column names
   - Import functions handle snake_case data correctly

3. **`src/utils/supabaseRegistrationService.ts`** (already correct)
   - Bulk create methods transform camelCase to snake_case for database
   - Return data is transformed back to camelCase for TypeScript

## Testing

### Test Script: `test_import_fix.js`

The test script verifies:
1. **Field Mapping**: Snake_case Excel data is correctly mapped to camelCase TypeScript
2. **Mixed Field Names**: System handles inconsistent field naming in Excel files
3. **Data Integrity**: All required fields are properly mapped

### Test Results

```bash
✅ blood_group → bloodGroup: O+ (expected: O+)
✅ qr_code → qrCode: test-emp-001 (expected: test-emp-001)
✅ created_at → createdAt: 2024-01-01T08:00:00Z (expected: 2024-01-01T08:00:00Z)
✅ last_updated → lastUpdated: 2024-01-01T08:00:00Z (expected: 2024-01-01T08:00:00Z)
✅ old_id → oldId: LEGACY-123 (expected: LEGACY-123)
✅ cost_center_code → costCenterCode: CC001 (expected: CC001)
✅ profit_center_code → profitCenterCode: PC001 (expected: PC001)
✅ hourly_rate → hourlyRate: 25 (expected: 25)

🎯 Overall Result: PASSED
```

## Benefits of the Fix

1. **Robust Import**: Handles Excel files with any field naming convention
2. **Backward Compatibility**: Works with existing templates and data
3. **Error Prevention**: Eliminates database column not found errors
4. **Flexible**: Supports both snake_case and camelCase field names
5. **Consistent**: Maintains proper TypeScript interface compliance

## Usage Instructions

### For Users

1. **Download Templates**: Use the "Download Template" button (already uses correct column names)
2. **Fill Data**: Follow the template format
3. **Import**: The system now handles field name variations automatically

### For Developers

1. **Excel Templates**: Continue using snake_case column names
2. **Import Processing**: The system automatically maps to camelCase
3. **Database Operations**: SupabaseRegistrationService handles the transformation

## Verification Steps

1. **Test Employee Import**: Try importing an employee Excel file
2. **Check Console**: No more "column not found" errors
3. **Verify Data**: Imported data appears correctly in the system
4. **Test Other Entities**: Equipment, Materials, and Sites imports work

## Future Considerations

1. **Standardization**: Consider standardizing on one naming convention
2. **Validation**: Add field name validation in Excel utilities
3. **Documentation**: Update user guides with field mapping information
4. **Testing**: Add automated tests for import functionality

## Conclusion

The import field mapping fix resolves the database column not found error by properly handling the conversion between snake_case (database/Excel) and camelCase (TypeScript interface) field names. The system is now robust and can handle various field naming conventions in Excel files. 