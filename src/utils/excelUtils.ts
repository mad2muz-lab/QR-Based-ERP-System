import * as XLSX from 'xlsx';
import { Employee, Equipment, Material, Site } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Excel template generators with correct column names matching database schema
export const generateEmployeeTemplate = () => {
  const employeeId = uuidv4();
  const template = [
    {
      name: 'John Doe',
      type: 'full-time',
      department: 'Construction',
      position: 'Site Engineer',
      blood_group: 'O+',
      site: 'site-001',
      status: 'active',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      photo: 'https://example.com/photo.jpg',
      email: 'john.doe@example.com',
      phone: '+966501234567',
      old_id: 'LEGACY-123',
      companyId: 'company-001',
      cost_center_code: 'CC001',
      profit_center_code: 'PC001',
      hourly_rate: 25
    }
  ];
  return template;
};

export const generateEquipmentTemplate = () => {
  const template = [
    {
      name: 'Asphalt Paver',
      type: 'Heavy Machinery',
      model: 'CAT AP655F',
      site: 'site-001',
      status: 'available',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      serial_number: 'AP655F-2024-001',
      custom_equipment_id: 'CUST-001',
      old_id: 'LEGACY-456',
      operational_status: 'working',
      cost_center_code: 'CC002',
      profit_center_code: 'PC002',
      hourly_rate: 150.00,
      usage_duration: 0,
      standby_duration: 0,
      maintenance_duration: 0
    }
  ];
  return template;
};

export const generateMaterialTemplate = () => {
  const template = [
    {
      name: 'Bitumen (60/70)',
      type: 'Bituminous Materials',
      unit: 'Tons',
      site: 'site-001',
      quantity: 150,
      status: 'available',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      use: 'Main binder in asphalt mix',
      access_level: 'basic',
      old_id: 'LEGACY-789',
      cost_center_code: 'CC003',
      profit_center_code: 'PC003',
      cost: 2500.00
    }
  ];
  return template;
};

export const generateSiteTemplate = () => {
  const template = [
    {
      name: 'Al Khobar Construction Site',
      province: 'Eastern Province',
      coordinates: '26.2170,50.1971',
      address: 'King Fahd Road, Al Khobar',
      manager: 'Ahmed Al-Sayed',
      last_updated: '2024-01-01T08:00:00Z',
      type: 'Construction',
      cost_center_code: 'CC004',
      profit_center_code: 'PC004'
    }
  ];
  return template;
};

// Export functions with proper column mapping
export const exportEmployeesToExcel = (employees: Employee[], filename: string = 'employees.xlsx') => {
  const data = employees.map(emp => ({
    'ID': emp.id,
    'Name': emp.name,
    'Type': emp.type || '',
    'Department': emp.department,
    'Position': emp.position,
    'Blood Group': emp.bloodGroup || '',
    'Site': emp.site,
    'QR Code': emp.qrCode,
    'Status': emp.status,
    'Created At': emp.createdAt,
    'Last Updated': emp.lastUpdated,
    'Photo': emp.photo || '',
    'Email': emp.email || '',
    'Phone': emp.phone || '',
    'Old ID': emp.oldId || '',
    'Company ID': emp.companyId || '',
    'Cost Center Code': emp.costCenterCode || '',
    'Profit Center Code': emp.profitCenterCode || '',
    'Hourly Rate': emp.hourlyRate || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  XLSX.writeFile(workbook, filename);
};

export const exportEquipmentToExcel = (equipment: Equipment[], filename: string = 'equipment.xlsx') => {
  const data = equipment.map(eq => ({
    'ID': eq.id,
    'Name': eq.name,
    'Type': eq.type,
    'Model': eq.model,
    'Site': eq.site,
    'QR Code': eq.qrCode,
    'Status': eq.status,
    'Created At': eq.createdAt,
    'Last Updated': eq.lastUpdated,
    'Serial Number': eq.serialNumber || '',
    'Custom Equipment ID': eq.custom_equipment_id || '',
    'Old ID': eq.oldId || '',
    'Operational Status': eq.operational_status || 'working',
    'Cost Center Code': eq.costCenterCode || '',
    'Profit Center Code': eq.profitCenterCode || '',
    'Hourly Rate': eq.hourly_rate || 0,
    'Usage Duration': eq.usageDuration || 0,
    'Standby Duration': eq.standbyDuration || 0,
    'Maintenance Duration': eq.maintenanceDuration || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
  XLSX.writeFile(workbook, filename);
};

export const exportMaterialsToExcel = (materials: Material[], filename: string = 'materials.xlsx') => {
  const data = materials.map(mat => ({
    'ID': mat.id,
    'Name': mat.name,
    'Type': mat.type,
    'Unit': mat.unit,
    'Site': mat.site,
    'QR Code': mat.qrCode,
    'Quantity': mat.quantity,
    'Status': mat.status,
    'Created At': mat.createdAt,
    'Last Updated': mat.lastUpdated,
    'Use': mat.use || '',
    'Access Level': mat.accessLevel || 'basic',
    'Old ID': mat.oldId || '',
    'Company ID': mat.companyId || '',
    'Cost Center Code': mat.costCenterCode || '',
    'Profit Center Code': mat.profitCenterCode || '',
    'Cost': mat.cost || 0
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
  XLSX.writeFile(workbook, filename);
};

export const exportSitesToExcel = (sites: Site[], filename: string = 'sites.xlsx') => {
  const data = sites.map(site => ({
    'ID': site.id,
    'Name': site.name,
    'Province': site.province,
    'Coordinates': `(${site.coordinates[0]},${site.coordinates[1]})`,
    'Address': site.address,
    'Manager': site.manager,
    'Last Updated': site.lastUpdated,
    'Type': site.type || '',
    'QR Code': site.qrCode,
    'Cost Center Code': site.costCenterCode || '',
    'Profit Center Code': site.profitCenterCode || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
  XLSX.writeFile(workbook, filename);
};

// Template download functions with comprehensive instructions
export const downloadEmployeeTemplate = () => {
  const template = generateEmployeeTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');

  // Add instructions sheet
  const instructions = [
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'uuid-string' },
    { Field: 'name', Description: 'Full name of the employee', Required: 'Yes', Example: 'John Doe' },
    { Field: 'type', Description: 'Employment type', Required: 'No', Example: 'full-time, part-time, contract' },
    { Field: 'department', Description: 'Employee department', Required: 'Yes', Example: 'Construction, Operations, Maintenance' },
    { Field: 'position', Description: 'Job position/title', Required: 'Yes', Example: 'Site Engineer, Operator' },
    { Field: 'blood_group', Description: 'Blood group', Required: 'No', Example: 'O+, A+, B+' },
    { Field: 'site', Description: 'ID of the site where employee works', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Employee QR code (auto-generated if blank)', Required: 'No', Example: 'uuid-string' },
    { Field: 'status', Description: 'Employee status', Required: 'Yes', Example: 'active, inactive' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'photo', Description: 'Photo URL', Required: 'No', Example: 'https://example.com/photo.jpg' },
    { Field: 'email', Description: 'Email address', Required: 'No', Example: 'john.doe@example.com' },
    { Field: 'phone', Description: 'Phone number', Required: 'No', Example: '+966501234567' },
    { Field: 'old_id', Description: 'Legacy/old system ID (MANDATORY FIELD)', Required: 'Yes', Example: 'LEGACY-123' },
    { Field: 'companyId', Description: 'Company UUID (if multi-company setup)', Required: 'No', Example: 'company-001' },
    { Field: 'cost_center_code', Description: 'Cost center code for financial analysis', Required: 'No', Example: 'CC001' },
    { Field: 'profit_center_code', Description: 'Profit center code for financial analysis', Required: 'No', Example: 'PC001' },
    { Field: 'hourly_rate', Description: 'Hourly rate in SAR', Required: 'No', Example: '25' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'employee_template.xlsx');
};

export const downloadEquipmentTemplate = () => {
  const template = generateEquipmentTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Template');

  const instructions = [
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'uuid-string' },
    { Field: 'name', Description: 'Name of the equipment', Required: 'Yes', Example: 'Asphalt Paver' },
    { Field: 'type', Description: 'Equipment category', Required: 'Yes', Example: 'Heavy Machinery, Lifting Equipment' },
    { Field: 'model', Description: 'Equipment model', Required: 'Yes', Example: 'CAT AP655F' },
    { Field: 'site', Description: 'ID of the site where equipment is located', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Equipment QR code (auto-generated if blank)', Required: 'No', Example: 'uuid-string' },
    { Field: 'status', Description: 'Equipment status', Required: 'Yes', Example: 'available, in-use, maintenance, down' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'serial_number', Description: 'Equipment serial number', Required: 'No', Example: 'AP655F-2024-001' },
    { Field: 'custom_equipment_id', Description: 'User-defined unique identifier', Required: 'No', Example: 'CUST-001' },
    { Field: 'old_id', Description: 'Legacy/old system ID (MANDATORY FIELD)', Required: 'Yes', Example: 'LEGACY-456' },
    { Field: 'operational_status', Description: 'Operational status', Required: 'No', Example: 'working, not_working, in_use, standby, under_repair, under_service' },
    { Field: 'cost_center_code', Description: 'Cost center code for financial analysis', Required: 'No', Example: 'CC002' },
    { Field: 'profit_center_code', Description: 'Profit center code for financial analysis', Required: 'No', Example: 'PC002' },
    { Field: 'hourly_rate', Description: 'Hourly rate for usage revenue calculation', Required: 'No', Example: '150.00' },
    { Field: 'usage_duration', Description: 'Cumulative usage duration in hours', Required: 'No', Example: '0' },
    { Field: 'standby_duration', Description: 'Cumulative standby duration in hours', Required: 'No', Example: '0' },
    { Field: 'maintenance_duration', Description: 'Cumulative maintenance duration in hours', Required: 'No', Example: '0' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'equipment_template.xlsx');
};

export const downloadMaterialTemplate = () => {
  const template = generateMaterialTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Template');

  const instructions = [
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'uuid-string' },
    { Field: 'name', Description: 'Name of the material', Required: 'Yes', Example: 'Bitumen (60/70)' },
    { Field: 'type', Description: 'Material category', Required: 'Yes', Example: 'Bituminous Materials, Aggregates' },
    { Field: 'unit', Description: 'Unit of measurement', Required: 'Yes', Example: 'Tons, Pieces, Liters' },
    { Field: 'site', Description: 'ID of the site where material is stored', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Material QR code (auto-generated if blank)', Required: 'No', Example: 'uuid-string' },
    { Field: 'quantity', Description: 'Current quantity', Required: 'Yes', Example: '150' },
    { Field: 'status', Description: 'Material status', Required: 'Yes', Example: 'available, low-stock, out-of-stock' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'use', Description: 'How the material is used', Required: 'No', Example: 'Main binder in asphalt mix' },
    { Field: 'access_level', Description: 'Access level for material', Required: 'No', Example: 'basic, restricted, admin' },
    { Field: 'createdAt', Description: 'Legacy createdAt field', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'old_id', Description: 'Legacy/old system ID (MANDATORY FIELD)', Required: 'Yes', Example: 'LEGACY-789' },
    { Field: 'cost_center_code', Description: 'Cost center code for financial analysis', Required: 'No', Example: 'CC003' },
    { Field: 'profit_center_code', Description: 'Profit center code for financial analysis', Required: 'No', Example: 'PC003' },
    { Field: 'cost', Description: 'Cost per material unit', Required: 'No', Example: '2500.00' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'material_template.xlsx');
};

export const downloadSiteTemplate = () => {
  const template = generateSiteTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Site Template');

  const instructions = [
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'uuid-string' },
    { Field: 'name', Description: 'Name of the site', Required: 'Yes', Example: 'Al Khobar Construction Site' },
    { Field: 'province', Description: 'KSA Province', Required: 'Yes', Example: 'Riyadh, Eastern Province, Makkah' },
    { Field: 'coordinates', Description: 'GPS coordinates as (longitude,latitude)', Required: 'No', Example: '(50.2089,26.2172)' },
    { Field: 'address', Description: 'Site address', Required: 'Yes', Example: 'Al Khobar, Eastern Province' },
    { Field: 'manager', Description: 'Name of site manager', Required: 'Yes', Example: 'Ahmed Al-Rashid' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'type', Description: 'Type of site', Required: 'No', Example: 'Construction Site, Infrastructure Project' },
    { Field: 'qr_code', Description: 'Site QR code (auto-generated if blank)', Required: 'No', Example: 'uuid-string' },
    { Field: 'cost_center_code', Description: 'Cost center code for financial analysis', Required: 'No', Example: 'CC004' },
    { Field: 'profit_center_code', Description: 'Profit center code for financial analysis', Required: 'No', Example: 'PC004' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'site_template.xlsx');
};

// Import functions with proper validation and error handling
export const importEmployeesFromExcel = (file: File): Promise<Partial<Employee>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const employees = jsonData.map((row: any, index: number) => {
          // Validate required fields
          const name = row['name'] || row['Name'] || '';
          const department = row['department'] || row['Department'] || '';
          const position = row['position'] || row['Position'] || '';
          const site = row['site'] || row['Site'] || '';
          
          if (!name || !department || !position || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, department, position, site)`);
          }

          // Return object WITHOUT id field - let database auto-generate
          return {
            name: name,
            type: row['type'] || row['Type'] || '',
            department: department,
            position: position,
            bloodGroup: row['blood_group'] || row['Blood Group'] || '',
            site: site,
            status: (row['status'] || row['Status'] || 'active') as 'active' | 'inactive',
            createdAt: row['created_at'] || row['Created At'] || new Date().toISOString(),
            lastUpdated: row['last_updated'] || row['Last Updated'] || new Date().toISOString(),
            photo: row['photo'] || row['Photo'] || '',
            email: row['email'] || row['Email'] || '',
            phone: row['phone'] || row['Phone'] || '',
            oldId: row['old_id'] || row['Old ID'] || '',
            companyId: row['companyId'] || row['Company ID'] || '',
            costCenterCode: row['cost_center_code'] || row['Cost Center Code'] || '',
            profitCenterCode: row['profit_center_code'] || row['Profit Center Code'] || '',
            hourlyRate: parseFloat(row['hourly_rate'] || row['Hourly Rate'] || '0') || 0
          };
        });
        resolve(employees);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importEquipmentFromExcel = (file: File): Promise<Partial<Equipment>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const equipment = jsonData.map((row: any, index: number) => {
          // Validate required fields
          const name = row['name'] || row['Name'] || '';
          const type = row['type'] || row['Type'] || '';
          const model = row['model'] || row['Model'] || '';
          const site = row['site'] || row['Site'] || '';
          
          if (!name || !type || !model || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, type, model, site)`);
          }

          // Return object WITHOUT id field - let database auto-generate
          return {
            name: name,
            type: type,
            model: model,
            site: site,
            status: (row['status'] || row['Status'] || 'available') as 'available' | 'in-use' | 'maintenance' | 'down',
            createdAt: row['created_at'] || row['Created At'] || new Date().toISOString(),
            lastUpdated: row['last_updated'] || row['Last Updated'] || new Date().toISOString(),
            serialNumber: row['serial_number'] || row['Serial Number'] || '',
            custom_equipment_id: row['custom_equipment_id'] || row['Custom Equipment ID'] || '',
            oldId: row['old_id'] || row['Old ID'] || '',
            operational_status: (row['operational_status'] || row['Operational Status'] || 'working') as 'working' | 'not_working' | 'in_use' | 'standby' | 'under_repair' | 'under_service',
            costCenterCode: row['cost_center_code'] || row['Cost Center Code'] || '',
            profitCenterCode: row['profit_center_code'] || row['Profit Center Code'] || '',
            hourly_rate: parseFloat(row['hourly_rate'] || row['Hourly Rate'] || '0') || 0,
            usageDuration: parseFloat(row['usage_duration'] || row['Usage Duration'] || '0') || 0,
            standbyDuration: parseFloat(row['standby_duration'] || row['Standby Duration'] || '0') || 0,
            maintenanceDuration: parseFloat(row['maintenance_duration'] || row['Maintenance Duration'] || '0') || 0
          };
        });
        resolve(equipment);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importMaterialsFromExcel = (file: File): Promise<Partial<Material>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const materials = jsonData.map((row: any, index: number) => {
          // Validate required fields
          const name = row['name'] || row['Name'] || '';
          const type = row['type'] || row['Type'] || '';
          const unit = row['unit'] || row['Unit'] || '';
          const site = row['site'] || row['Site'] || '';
          
          if (!name || !type || !unit || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, type, unit, site)`);
          }

          // Return object WITHOUT id field - let database auto-generate
          return {
            name: name,
            type: type,
            unit: unit,
            site: site,
            quantity: parseInt(row['quantity'] || row['Quantity'] || '0') || 0,
            status: (row['status'] || row['Status'] || 'available') as 'available' | 'low-stock' | 'out-of-stock',
            createdAt: row['created_at'] || row['Created At'] || new Date().toISOString(),
            lastUpdated: row['last_updated'] || row['Last Updated'] || new Date().toISOString(),
            use: row['use'] || row['Use'] || '',
            accessLevel: (row['access_level'] || row['Access Level'] || 'basic') as 'basic' | 'restricted' | 'admin',
            oldId: row['old_id'] || row['Old ID'] || '',
            costCenterCode: row['cost_center_code'] || row['Cost Center Code'] || '',
            profitCenterCode: row['profit_center_code'] || row['Profit Center Code'] || '',
            cost: parseFloat(row['cost'] || row['Cost'] || '0') || 0
          };
        });
        resolve(materials);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const importSitesFromExcel = (file: File): Promise<Partial<Site>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const sites = jsonData.map((row: any, index: number) => {
          // Validate required fields
          const name = row['name'] || row['Name'] || '';
          const province = row['province'] || row['Province'] || '';
          const address = row['address'] || row['Address'] || '';
          const manager = row['manager'] || row['Manager'] || '';
          
          if (!name || !province || !address || !manager) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, province, address, manager)`);
          }

          // Parse coordinates if provided
          let coordinates: [number, number] = [0, 0];
          if (row['coordinates'] || row['Coordinates']) {
            const coordStr = row['coordinates'] || row['Coordinates'];
            const coordMatch = coordStr.match(/(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)/);
            if (coordMatch) {
              coordinates = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
            }
          }

          // Return object WITHOUT id field - let database auto-generate
          return {
            name: name,
            province: province,
            coordinates: coordinates,
            address: address,
            manager: manager,
            lastUpdated: row['last_updated'] || row['Last Updated'] || new Date().toISOString(),
            type: row['type'] || row['Type'] || '',
            costCenterCode: row['cost_center_code'] || row['Cost Center Code'] || '',
            profitCenterCode: row['profit_center_code'] || row['Profit Center Code'] || ''
          };
        });
        resolve(sites);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
};