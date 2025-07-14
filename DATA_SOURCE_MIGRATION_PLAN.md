# Data Source Migration Plan

## ✅ Completed Phase 1: Core Infrastructure

### Files Created:
1. **src/services/DataSource.js** - Centralized data source selector (15 lines)
2. **src/utils/dataProxy.js** - Proxy functions for fetchData/saveData
3. **src/components/common/DataSourceToggle.tsx** - UI component for switching sources

### Files Updated:
1. **src/components/dashboard/Dashboard.tsx** - Updated to use dataProxy (DEMO COMPLETE)

## 🔄 Phase 2: Component Migration (Remaining)

### High Priority Components (Core Data Loading):

#### 1. QRScanner.tsx
**Current patterns to replace:**
```javascript
// Lines 133-136
SupabaseDataService.getEmployees(),
SupabaseDataService.getEquipment(),
SupabaseDataService.getMaterials(),
SupabaseDataService.getSites()

// Lines 121-125
let employees = DataStorage.loadEmployees();
let equipment = DataStorage.loadEquipment();
let materials = DataStorage.loadMaterials();
let sites = DataStorage.loadSites();
```

**Replace with:**
```javascript
import { fetchData } from '../../utils/dataProxy.js';

// Replace all with:
const [employees, equipment, materials, sites] = await Promise.all([
  fetchData('employees'),
  fetchData('equipment'),
  fetchData('materials'),
  fetchData('sites')
]);
```

#### 2. RegistrationForm.tsx
**Current patterns to replace:**
```javascript
// Lines 116-119 (Supabase calls)
SupabaseDataService.getEmployees(),
SupabaseDataService.getEquipment(),
SupabaseDataService.getMaterials(),
SupabaseDataService.getSites()

// Lines 129-132, 139-142 (DataStorage calls)
setEmployees(DataStorage.loadEmployees());
setEquipment(DataStorage.loadEquipment());
setMaterials(DataStorage.loadMaterials());
setSites(DataStorage.loadSites());

// Save operations (Lines 187, 199, 234, etc.)
DataStorage.saveEmployees(updatedEmployees);
DataStorage.saveEquipment(updatedEquipment);
DataStorage.saveMaterials(updatedMaterials);
DataStorage.saveSites(updatedSites);
```

**Replace with:**
```javascript
import { fetchData, saveData } from '../../utils/dataProxy.js';

// Load operations:
const [employees, equipment, materials, sites] = await Promise.all([
  fetchData('employees'),
  fetchData('equipment'),
  fetchData('materials'),
  fetchData('sites')
]);

// Save operations:
await saveData('employees', updatedEmployees);
await saveData('equipment', updatedEquipment);
await saveData('materials', updatedMaterials);
await saveData('sites', updatedSites);
```

#### 3. UnifiedListView.tsx
**Current patterns to replace:**
```javascript
// Lines 83-92 (Supabase)
loadedItems = await SupabaseDataService.getEmployees();
loadedItems = await SupabaseDataService.getEquipment();
loadedItems = await SupabaseDataService.getMaterials();
loadedItems = await SupabaseDataService.getSites();

// Lines 103-115 (DataStorage)
loadedItems = DataStorage.loadEmployees();
loadedItems = DataStorage.loadEquipment();
loadedItems = DataStorage.loadMaterials();
loadedItems = DataStorage.loadSites();
```

**Replace with:**
```javascript
import { fetchData } from '../../utils/dataProxy.js';

// Unified loading:
switch (entityType) {
  case 'employees':
    loadedItems = await fetchData('employees');
    break;
  case 'equipment':
    loadedItems = await fetchData('equipment');
    break;
  case 'materials':
    loadedItems = await fetchData('materials');
    break;
  case 'sites':
    loadedItems = await fetchData('sites');
    break;
}
```

### Medium Priority Components:

#### 4. ReportsPanel.tsx
- Replace `DataStorage.loadAllLogs()` with `getAllLogs()`
- Replace individual load calls with `fetchData()`

#### 5. Page Components (EmployeesPage, EquipmentPage, MaterialsPage, SitesPage)
- Replace `DataStorage.load*()` calls with `fetchData()`

#### 6. Form Components (EmployeeForm, EquipmentForm)
- Replace `DataStorage.load*()` calls with `fetchData()`

#### 7. MaterialScanner.tsx
- Replace both Supabase and DataStorage calls with `fetchData()`

### Low Priority Components:

#### 8. MapView.tsx
- Replace `DataStorage.load*()` calls with `fetchData()`

#### 9. AdminPanel.tsx & DepartmentManager.tsx
- Replace `DataStorage.load*()` and save calls with proxy functions

#### 10. ProfileView.tsx
- Replace `DataStorage.loadSites()` with `fetchData('sites')`

## 🔧 Phase 3: Utility Updates

### 1. offlineDataManager.ts
**Challenge:** This file has extensive DataStorage calls (40+ instances)
**Strategy:** Update incrementally, focusing on main CRUD operations first

### 2. dataMigrationUtils.ts
**Current:** Lines 115-120 have DataStorage calls
**Replace with:** fetchData() calls

### 3. authUtils.ts
**Current:** Lines 49, 61 have DataStorage calls for users
**Note:** May need to add 'users' support to dataProxy

## 📋 Implementation Checklist

### For Each Component Update:
1. ✅ Add import: `import { fetchData, saveData, getAllLogs } from '../../utils/dataProxy.js';`
2. ✅ Replace `SupabaseDataService.get*()` calls with `fetchData(tableName)`
3. ✅ Replace `DataStorage.load*()` calls with `fetchData(tableName)`
4. ✅ Replace `DataStorage.save*()` calls with `saveData(tableName, data)`
5. ✅ Remove conditional Supabase/localStorage logic
6. ✅ Test both data source modes

### Table Name Mapping:
- `employees` → `fetchData('employees')`
- `equipment` → `fetchData('equipment')`
- `materials` → `fetchData('materials')`
- `sites` → `fetchData('sites')`
- `employee_logs` → `fetchData('employee_logs')`
- `equipment_logs` → `fetchData('equipment_logs')`
- `material_logs` → `fetchData('material_logs')`
- `time_logs` → `fetchData('time_logs')`
- All logs → `getAllLogs()`

## 🚀 Next Steps

1. **Immediate:** Update QRScanner.tsx (highest impact)
2. **Next:** Update RegistrationForm.tsx (most complex)
3. **Then:** Update UnifiedListView.tsx
4. **Continue:** Work through medium priority components
5. **Finally:** Update utility files

## 🧪 Testing Strategy

1. **Smoke Test:** Toggle data source → refresh → verify network tab
2. **Functionality Test:** Ensure all CRUD operations work in both modes
3. **Regression Test:** Verify existing features still work
4. **Performance Test:** Check load times in both modes

## 📊 Progress Tracking

- ✅ Phase 1: Core Infrastructure (100%)
- 🔄 Phase 2: Component Migration (5% - Dashboard only)
- ⏳ Phase 3: Utility Updates (0%)

**Estimated Remaining Work:** 15-20 components to update
**Priority:** Focus on high-impact components first (QRScanner, RegistrationForm)