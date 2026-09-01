# Column Name Fix - QR-Based ERP System

## Issue Summary

**Error**: `Could not find the 'company_id' column of 'employees' in the schema cache`

**Root Cause**: The code was trying to map `companyId` (camelCase) to `company_id` (snake_case), but the actual database column is `companyId` (camelCase).

## Problem Details

### Database Schema vs Code Mapping

**Actual Database Schema** (from Supabase):
- **Employees table**: `companyId` (camelCase, UUID type)
- **Equipment table**: No `companyId` column exists

**Code Mapping** (Incorrect):
- **Employees**: `company_id: employee.companyId` ❌
- **Equipment**: `company_id: eq.companyId` ❌

### The Conflict

The import processing was:
1. **Mapping to wrong column names** that don't exist in the database
2. **Using snake_case for camelCase columns** in the database
3. **Including non-existent columns** for equipment

## Solution Applied

### 1. Fixed Employee Field Mapping

**File**: `src/utils/supabaseRegistrationService.ts`

**Before (Problematic)**:
```typescript
const supabaseEmployees = employees.map(employee => ({
  // ... other fields
  company_id: employee.companyId, // ❌ Wrong column name
  // ... other fields
}));
```

**After (Fixed)**:
```typescript
const supabaseEmployees = employees.map(employee => ({
  // ... other fields
  companyId: employee.companyId, // ✅ Correct camelCase column name
  // ... other fields
}));
```

### 2. Fixed Equipment Field Mapping

**Before (Problematic)**:
```typescript
const supabaseEquipment = equipment.map(eq => ({
  // ... other fields
  company_id: eq.companyId, // ❌ Non-existent column
  // ... other fields
}));
```

**After (Fixed)**:
```typescript
const supabaseEquipment = equipment.map(eq => ({
  // ... other fields
  // ✅ Removed company_id mapping (column doesn't exist)
  // ... other fields
}));
```

### 3. Fixed Reverse Mapping

**Employees (Fixed)**:
```typescript
const transformedData: Employee[] = (data || []).map(employee => ({
  // ... other fields
  companyId: employee.companyId, // ✅ Use correct camelCase column name
  // ... other fields
}));
```

**Equipment (Fixed)**:
```typescript
const transformedData: Equipment[] = (data || []).map(eq => ({
  // ... other fields
  // ✅ Removed companyId mapping (column doesn't exist)
  // ... other fields
}));
```

## Database Schema Analysis

### Employees Table
- ✅ `companyId` (camelCase, UUID) - **Exists**
- ✅ `old_id` (snake_case, VARCHAR) - **Exists**
- ✅ `cost_center_code` (snake_case, TEXT) - **Exists**
- ✅ `profit_center_code` (snake_case, TEXT) - **Exists**
- ✅ `hourly_rate` (snake_case, INTEGER) - **Exists**

### Equipment Table
- ❌ `companyId` - **Does NOT exist**
- ✅ `old_id` (snake_case, VARCHAR) - **Exists**
- ✅ `cost_center_code` (snake_case, TEXT) - **Exists**
- ✅ `profit_center_code` (snake_case, TEXT) - **Exists**
- ✅ `hourly_rate` (snake_case, NUMERIC) - **Exists**

## Applied to All Entity Types

The same fix was applied to all entity types:

### Employees
- ✅ `companyId` (camelCase) - Correct mapping
- ✅ `old_id` (snake_case) - Correct mapping
- ✅ All other fields - Correct mapping

### Equipment
- ✅ `old_id` (snake_case) - Correct mapping
- ✅ Removed `companyId` - Column doesn't exist
- ✅ All other fields - Correct mapping

### Materials
- ✅ Individual create methods (no bulk method exists)
- ✅ Correct field mapping based on schema

### Sites
- ✅ Individual create methods (no bulk method exists)
- ✅ Correct field mapping based on schema

## Testing

### Test Script
Created `test_column_name_fix.js` to verify the fix works correctly.

### Test Results
- ✅ Employees: `companyId` (camelCase) and `old_id` (snake_case) correctly mapped
- ✅ Equipment: `old_id` (snake_case) correctly mapped, no `companyId` field
- ✅ No column name conflicts with database schema
- ✅ Reverse mapping works correctly

## Impact

### Before Fix
- ❌ `Could not find the 'company_id' column` error
- ❌ Bulk import completely broken
- ❌ Column name conflicts with database schema

### After Fix
- ✅ Bulk import works correctly
- ✅ No column name conflicts
- ✅ Proper field mapping based on actual database schema
- ✅ Consistent with database column naming conventions

## Files Modified

1. **`src/utils/supabaseRegistrationService.ts`**
   - Fixed `companyId` mapping for employees (camelCase)
   - Removed `companyId` mapping for equipment (column doesn't exist)
   - Fixed reverse mapping for both entities

2. **`test_column_name_fix.js`** (new)
   - Test script to verify the fix

3. **`COLUMN_NAME_FIX.md`** (new)
   - Documentation of the fix

## Usage

The import functionality now works correctly:

1. **Employees**: Uses `companyId` (camelCase) as per database schema
2. **Equipment**: No `companyId` field as per database schema
3. **All entities**: Correct field mapping based on actual database columns
4. **No conflicts**: Proper alignment with database schema

## Verification

To verify the fix is working:

1. Try importing employees with Supabase enabled
2. Check the browser console for any column name errors
3. Verify the data is properly saved with correct column names
4. Run the test script: `node test_column_name_fix.js`

The error `Could not find the 'company_id' column` should no longer occur.

## Key Benefits

1. **Database Schema Alignment**: Code matches actual database column names
2. **No Column Conflicts**: Eliminates column name mismatch errors
3. **Consistent Mapping**: Proper camelCase vs snake_case handling
4. **Scalable**: Works for bulk imports of any size
5. **Maintainable**: Clear separation between different entity schemas

## Database Schema Reference

### Employees Table Columns
- `id` (TEXT, auto-generated UUID)
- `name` (TEXT)
- `type` (TEXT)
- `department` (TEXT)
- `position` (TEXT)
- `blood_group` (TEXT)
- `site` (TEXT)
- `qr_code` (TEXT)
- `status` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `last_updated` (TIMESTAMPTZ)
- `photo` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `old_id` (VARCHAR)
- `companyId` (UUID) ← **This was the issue**
- `cost_center_code` (TEXT)
- `profit_center_code` (TEXT)
- `hourly_rate` (INTEGER)

### Equipment Table Columns
- `id` (TEXT, auto-generated UUID)
- `name` (TEXT)
- `type` (TEXT)
- `model` (TEXT)
- `site` (TEXT)
- `qr_code` (TEXT)
- `status` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `last_updated` (TIMESTAMPTZ)
- `serial_number` (TEXT)
- `custom_equipment_id` (TEXT)
- `old_id` (VARCHAR)
- `operational_status` (TEXT)
- `cost_center_code` (TEXT)
- `profit_center_code` (TEXT)
- `hourly_rate` (NUMERIC)
- `usage_duration` (NUMERIC)
- `standby_duration` (NUMERIC)
- `maintenance_duration` (NUMERIC)
- ← **No companyId column exists** 