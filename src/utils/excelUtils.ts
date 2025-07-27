import * as XLSX from 'xlsx';
import { Employee, Equipment, Material, Site } from '../types';

import { v4 as uuidv4 } from 'uuid';

// Excel template generators
export const generateEmployeeTemplate = () => {
  const employeeId = uuidv4();
  const template = [
    {
      id: employeeId,
      name: 'John Doe',
      type: 'full-time',
      department: 'Construction',
      position: 'Site Engineer',
      blood_group: 'O+',
      site: 'site-001',
      qr_code: employeeId, // Use UUID for QR code (like equipment)
      status: 'active',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      photo: 'https://example.com/photo.jpg',
      email: 'john.doe@example.com',
      phone: '+966501234567',
      old_id: 'LEGACY-123',
      companyId: 'company-001'
    }
  ];
  return template;
};

export const generateEquipmentTemplate = () => {
  const template = [
    {
      id: 'EQP-001',
      name: 'Asphalt Paver',
      type: 'Heavy Machinery',
      model: 'CAT AP655F',
      site: 'site-001',
      qr_code: 'EQP-001',
      status: 'available',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      serial_number: 'AP655F-2024-001',
      custom_equipment_id: 'CUST-001',
      old_id: 'LEGACY-456'
    }
  ];
  return template;
};

export const generateMaterialTemplate = () => {
  const materialId = uuidv4();
  const template = [
    {
      id: materialId,
      name: 'Bitumen (60/70)',
      type: 'Bituminous Materials',
      unit: 'Tons',
      site: 'site-001',
      qr_code: materialId, // Use UUID for QR code (like equipment)
      quantity: 150,
      status: 'available',
      created_at: '2024-01-01T08:00:00Z',
      last_updated: '2024-01-01T08:00:00Z',
      use: 'Main binder in asphalt mix',
      access_level: 'basic',
      createdAt: '2024-01-01T08:00:00Z',
      old_id: 'LEGACY-789'
    }
  ];
  return template;
};

export const generateSiteTemplate = () => {
  const template = [
    {
      id: 'SITE-001',
      name: 'Al Khobar Construction Site',
      province: 'Eastern Province',
      coordinates: '(50.2089,26.2172)',
      address: 'Al Khobar, Eastern Province',
      manager: 'Ahmed Al-Rashid',
      last_updated: '2024-01-01T08:00:00Z',
      type: 'Construction Site',
      qr_code: 'SITE-001'
    }
  ];
  return template;
};

// Export functions
export const exportEmployeesToExcel = (employees: Employee[], filename: string = 'employees.xlsx') => {
  const data = employees.map(emp => ({
    'Employee ID': emp.id,
    'Employee Name': emp.name,
    'Department': emp.department,
    'Position': emp.position,
    'Site ID': emp.site,
    'Status': emp.status,
    'Created Date': new Date(emp.createdAt).toLocaleDateString(),
    'QR Code': emp.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  XLSX.writeFile(workbook, filename);
};

export const exportEquipmentToExcel = (equipment: Equipment[], filename: string = 'equipment.xlsx') => {
  const data = equipment.map(eq => ({
    'Equipment ID': eq.id,
    'Equipment Name': eq.name,
    'Type': eq.type,
    'Model': eq.model,
    'Serial Number': eq.serialNumber || '',
    'Site ID': eq.site,
    'Status': eq.status,
    'Created Date': new Date(eq.createdAt).toLocaleDateString(),
    'QR Code': eq.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment');
  XLSX.writeFile(workbook, filename);
};

export const exportMaterialsToExcel = (materials: Material[], filename: string = 'materials.xlsx') => {
  const data = materials.map(mat => ({
    'Material ID': mat.id,
    'Material Name': mat.name,
    'Type': mat.type,
    'Unit': mat.unit,
    'Current Quantity': mat.quantity,
    'Site ID': mat.site,
    'Status': mat.status,
    'Usage Description': mat.use || '',
    'Created Date': new Date(mat.createdAt).toLocaleDateString(),
    'QR Code': mat.qrCode
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
  XLSX.writeFile(workbook, filename);
};

export const exportSitesToExcel = (sites: Site[], filename: string = 'sites.xlsx') => {
  const data = sites.map(site => ({
    'Site ID': site.id,
    'Site Name': site.name,
    'Site Type': site.type || '',
    'Province': site.province,
    'Address': site.address,
    'Site Manager': site.manager,
    'Latitude': site.coordinates[1],
    'Longitude': site.coordinates[0]
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');
  XLSX.writeFile(workbook, filename);
};

// Template download functions
export const downloadEmployeeTemplate = () => {
  const template = generateEmployeeTemplate();
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Template');

  // Add instructions sheet
  const instructions = [
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'EMP-001' },
    { Field: 'name', Description: 'Full name of the employee', Required: 'Yes', Example: 'John Doe' },
    { Field: 'type', Description: 'Employment type', Required: 'No', Example: 'full-time, part-time, contract' },
    { Field: 'department', Description: 'Employee department', Required: 'Yes', Example: 'Construction, Operations, Maintenance' },
    { Field: 'position', Description: 'Job position/title', Required: 'Yes', Example: 'Site Engineer, Operator' },
    { Field: 'blood_group', Description: 'Blood group', Required: 'No', Example: 'O+, A+, B+' },
    { Field: 'site', Description: 'ID of the site where employee works', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Employee QR code (auto-generated if blank)', Required: 'No', Example: 'EMP-001' },
    { Field: 'status', Description: 'Employee status', Required: 'Yes', Example: 'active, inactive' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'photo', Description: 'Photo URL', Required: 'No', Example: 'https://example.com/photo.jpg' },
    { Field: 'email', Description: 'Email address', Required: 'No', Example: 'john.doe@example.com' },
    { Field: 'phone', Description: 'Phone number', Required: 'No', Example: '+966501234567' },
    { Field: 'old_id', Description: 'Legacy/old system ID (if any)', Required: 'No', Example: 'LEGACY-123' },
    { Field: 'companyId', Description: 'Company UUID (if multi-company setup)', Required: 'No', Example: 'company-001' }
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
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'EQP-001' },
    { Field: 'name', Description: 'Name of the equipment', Required: 'Yes', Example: 'Asphalt Paver' },
    { Field: 'type', Description: 'Equipment category', Required: 'Yes', Example: 'Heavy Machinery, Lifting Equipment' },
    { Field: 'model', Description: 'Equipment model', Required: 'Yes', Example: 'CAT AP655F' },
    { Field: 'site', Description: 'ID of the site where equipment is located', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Equipment QR code (auto-generated if blank)', Required: 'No', Example: 'EQP-001' },
    { Field: 'status', Description: 'Equipment status', Required: 'Yes', Example: 'available, in-use, maintenance, down' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'serial_number', Description: 'Equipment serial number', Required: 'No', Example: 'AP655F-2024-001' },
    { Field: 'custom_equipment_id', Description: 'User-defined unique identifier', Required: 'No', Example: 'CUST-001' },
    { Field: 'old_id', Description: 'Legacy/old system ID (if any)', Required: 'No', Example: 'LEGACY-456' }
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
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'MAT-001' },
    { Field: 'name', Description: 'Name of the material', Required: 'Yes', Example: 'Bitumen (60/70)' },
    { Field: 'type', Description: 'Material category', Required: 'Yes', Example: 'Bituminous Materials, Aggregates' },
    { Field: 'unit', Description: 'Unit of measurement', Required: 'Yes', Example: 'Tons, Pieces, Liters' },
    { Field: 'site', Description: 'ID of the site where material is stored', Required: 'Yes', Example: 'site-001' },
    { Field: 'qr_code', Description: 'Material QR code (auto-generated if blank)', Required: 'No', Example: 'MAT-001' },
    { Field: 'quantity', Description: 'Current quantity', Required: 'Yes', Example: '150' },
    { Field: 'status', Description: 'Material status', Required: 'Yes', Example: 'available, low-stock, out-of-stock' },
    { Field: 'created_at', Description: 'Creation date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'use', Description: 'How the material is used', Required: 'No', Example: 'Main binder in asphalt mix' },
    { Field: 'access_level', Description: 'Access level for material', Required: 'No', Example: 'basic, restricted, admin' },
    { Field: 'createdAt', Description: 'Legacy/old system createdAt (if any)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'old_id', Description: 'Legacy/old system ID (if any)', Required: 'No', Example: 'LEGACY-789' }
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
    { Field: 'id', Description: 'System-generated unique ID (leave blank for new records)', Required: 'No', Example: 'SITE-001' },
    { Field: 'name', Description: 'Name of the site', Required: 'Yes', Example: 'Al Khobar Construction Site' },
    { Field: 'province', Description: 'KSA Province', Required: 'Yes', Example: 'Riyadh, Eastern Province, Makkah' },
    { Field: 'coordinates', Description: 'GPS coordinates as (longitude,latitude)', Required: 'No', Example: '(50.2089,26.2172)' },
    { Field: 'address', Description: 'Site address', Required: 'Yes', Example: 'Al Khobar, Eastern Province' },
    { Field: 'manager', Description: 'Name of site manager', Required: 'Yes', Example: 'Ahmed Al-Rashid' },
    { Field: 'last_updated', Description: 'Last update date (ISO string)', Required: 'No', Example: '2024-01-01T08:00:00Z' },
    { Field: 'type', Description: 'Type of site', Required: 'No', Example: 'Construction Site, Infrastructure Project' },
    { Field: 'qr_code', Description: 'Site QR code (auto-generated if blank)', Required: 'No', Example: 'SITE-001' }
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');
  XLSX.writeFile(workbook, 'site_template.xlsx');
};

// Import functions
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
          // Use exact DB column names
          const id = row['id'] || '';
          const name = row['name'] || '';
          const department = row['department'] || '';
          const position = row['position'] || '';
          const site = row['site'] || '';
          const status = row['status'] || 'active';
          // Required fields check
          if (!name || !department || !position || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, department, position, site)`);
          }
          return {
            id: id,
            name: name,
            type: row['type'] || '',
            department: department,
            position: position,
            blood_group: row['blood_group'] || '',
            site: site,
            qr_code: row['qr_code'] || '',
            status: status,
            created_at: row['created_at'] || '',
            last_updated: row['last_updated'] || '',
            photo: row['photo'] || '',
            email: row['email'] || '',
            phone: row['phone'] || '',
            old_id: row['old_id'] || '',
            companyId: row['companyId'] || ''
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
          const id = row['id'] || '';
          const name = row['name'] || '';
          const type = row['type'] || '';
          const model = row['model'] || '';
          const site = row['site'] || '';
          const status = row['status'] || 'available';
          // Required fields check
          if (!name || !type || !model || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, type, model, site)`);
          }
          return {
            id: id,
            name: name,
            type: type,
            model: model,
            site: site,
            qr_code: row['qr_code'] || '',
            status: status,
            created_at: row['created_at'] || '',
            last_updated: row['last_updated'] || '',
            serial_number: row['serial_number'] || '',
            custom_equipment_id: row['custom_equipment_id'] || '',
            old_id: row['old_id'] || ''
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
          const id = row['id'] || '';
          const name = row['name'] || '';
          const type = row['type'] || '';
          const unit = row['unit'] || '';
          const site = row['site'] || '';
          const status = row['status'] || 'available';
          // Required fields check
          if (!name || !type || !unit || !site) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, type, unit, site)`);
          }
          return {
            id: id,
            name: name,
            type: type,
            unit: unit,
            site: site,
            qr_code: row['qr_code'] || '',
            quantity: row['quantity'] || 0,
            status: status,
            created_at: row['created_at'] || '',
            last_updated: row['last_updated'] || '',
            use: row['use'] || '',
            access_level: row['access_level'] || '',
            createdAt: row['createdAt'] || '',
            old_id: row['old_id'] || ''
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
          const id = row['id'] || '';
          const name = row['name'] || '';
          const province = row['province'] || '';
          const address = row['address'] || '';
          const manager = row['manager'] || '';
          // Required fields check
          if (!name || !province || !address || !manager) {
            throw new Error(`Row ${index + 2}: Missing required fields (name, province, address, manager)`);
          }
          return {
            id: id,
            name: name,
            province: province,
            coordinates: row['coordinates'] || '',
            address: address,
            manager: manager,
            last_updated: row['last_updated'] || '',
            type: row['type'] || '',
            qr_code: row['qr_code'] || ''
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