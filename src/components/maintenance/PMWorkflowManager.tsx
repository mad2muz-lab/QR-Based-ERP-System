import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  QrCode, 
  Wrench, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Camera, 
  Monitor,
  ChevronRight,
  ChevronLeft,
  Shield,
  FileText,
  Settings,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { useHardwareScanner } from '../../hooks/useHardwareScanner';
import QrScanner from 'qr-scanner';
import PMChecklistWorkflow from './PMChecklistWorkflow';

interface Equipment {
  id: string;
  "Equipment Name": string; // Using actual database column name
  "Equipment Type": string; // Using actual database column name
  model: string;
  site: string;
  status: 'available' | 'in_use' | 'maintenance' | 'down';
  is_pm: boolean;
  pm_class?: string;
  usage_hours?: number;
  last_pm_date?: string;
  next_pm_date?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  qr_code: string;
  department?: string;
  position?: string;
  oldId?: string;
}

interface PMConfig {
  equipment_type: string;
  class_a_hours: number;
  class_b_hours: number;
  class_c_hours: number;
  class_a_threshold_hours: number;
  class_b_threshold_hours: number;
  class_c_threshold_hours: number;
  description: string;
  is_active: boolean;
  spare_parts?: string[];
  estimated_quantities?: string[];
}

interface SparePart {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  available?: boolean;
  in_stock?: number;
  material_id?: string; // Added for inventory integration
  required_quantity?: number; // Added for tracking required quantity
}

interface PMTask {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  maintenance_class: string;
  scheduled_date: string;
  status: 'scheduled' | 'assigned' | 'in_progress' | 'completed';
  technician_id?: string;
  technician_name?: string;
  assigned_date?: string;
  completed_date?: string;
  checklist_completed?: boolean;
  quality_score?: number;
  required_spare_parts?: SparePart[];
  spare_parts_verified?: boolean;
}

type WorkflowStep = 
  | 'initial' 
  | 'equipment_scan' 
  | 'pm_selection' 
  | 'technician_scan' 
  | 'assignment_confirmation'
  | 'technician_dashboard'
  | 'start_pm'
  | 'pm_checklist'
  | 'completion_confirmation'
  | 'pm_complete';

const PMWorkflowManager: React.FC = () => {
  // Core state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('initial');
  const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
  const [scannedTechnician, setScannedTechnician] = useState<Employee | null>(null);
  const [selectedPMTask, setSelectedPMTask] = useState<PMTask | null>(null);
  const [availablePMTasks, setAvailablePMTasks] = useState<PMTask[]>([]);
  const [pmConfigs, setPmConfigs] = useState<PMConfig[]>([]);
  const [technicianTasks, setTechnicianTasks] = useState<PMTask[]>([]);
  const [requiredSpareParts, setRequiredSpareParts] = useState<SparePart[]>([]);
  const [sparePartsVerified, setSparePartsVerified] = useState(false);
  const [showPurchaseRequestModal, setShowPurchaseRequestModal] = useState(false);
  const [missingSpareParts, setMissingSpareParts] = useState<SparePart[]>([]);
  const [showInventoryReleaseModal, setShowInventoryReleaseModal] = useState(false);
  const [availableSpareParts, setAvailableSpareParts] = useState<SparePart[]>([]);
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'hardware'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedQR, setScannedQR] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [workflowMode, setWorkflowMode] = useState<'assignment' | 'execution'>('assignment');

  // Hardware scanner hook
  useHardwareScanner({
    onScan: async (data) => {
      if (data && scanMode === 'hardware') {
        await handleQRScanned(data);
      }
    },
    inputRef,
    enabled: showScanner && scanMode === 'hardware'
  });

  useEffect(() => {
    loadPMConfigs();
  }, []);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        stopCameraScanning();
      }
    };
  }, []);

  useEffect(() => {
    if (!showScanner && qrScannerRef.current) {
      stopCameraScanning();
    }
  }, [showScanner]);

  const loadPMConfigs = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('is_active', true)
        .order('equipment_type');
      
      if (error) throw error;
      setPmConfigs(data || []);
    } catch (err) {
      console.error('Error loading PM configs:', err);
    }
  };

  const loadSparePartsForTask = async (equipmentType: string, maintenanceClass: string) => {
    if (!supabase) return;
    try {
      console.log('🔍 Loading spare parts for equipment type:', equipmentType, 'maintenance class:', maintenanceClass);
      
      if (!equipmentType || equipmentType === 'Unknown' || equipmentType === '') {
        console.log('🔍 Equipment type is undefined, null, or Unknown, using default spare parts');
        const defaultSpareParts = getDefaultSpareParts('Unknown', maintenanceClass);
        setRequiredSpareParts(defaultSpareParts);
        return;
      }

      const { data: config, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('spare_parts, estimated_quantities')
        .eq('equipment_type', equipmentType)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error
      
      if (error) {
        console.warn('No PM config found for spare parts:', error);
        // Add default spare parts for common equipment types
        const defaultSpareParts = getDefaultSpareParts(equipmentType, maintenanceClass);
        setRequiredSpareParts(defaultSpareParts);
        return;
      }

      if (config?.spare_parts && Array.isArray(config.spare_parts)) {
        // Check inventory for each spare part
        const spareParts: SparePart[] = await Promise.all(
          config.spare_parts.map(async (part, index) => {
            const requiredQuantity = parseInt(config.estimated_quantities?.[index] || '1', 10);
            
            // Check inventory for this part
            let available = false;
            let in_stock = 0;
            let material_id = null;
            let unit = 'pcs';
            
            if (supabase) {
              try {
                // First, let's check if the materials table is accessible
                const { data: testData, error: testError } = await supabase
                  .from('materials')
                  .select('id, name')
                  .limit(1);
                
                if (testError) {
                  console.warn(`❌ Materials table not accessible:`, testError);
                } else {
                  // Query materials table with a more robust approach
                  const { data: inventoryItems, error: inventoryError } = await supabase
                    .from('materials')
                    .select('id, name, quantity, unit, status')
                    .eq('name', part);
                  
                  if (!inventoryError && inventoryItems && inventoryItems.length > 0) {
                    const inventoryItem = inventoryItems[0]; // Take the first match
                    material_id = inventoryItem.id;
                    in_stock = inventoryItem.quantity || 0;
                    available = in_stock >= requiredQuantity;
                    unit = inventoryItem.unit || 'pcs';
                    console.log(`✅ Found material "${part}" in inventory:`, { in_stock, requiredQuantity, available });
                  } else if (inventoryError) {
                    console.warn(`❌ Error querying materials for part "${part}":`, inventoryError);
                    // Continue with default values if query fails
                  } else {
                    console.log(`⚠️ Material "${part}" not found in inventory`);
                  }
                }
              } catch (queryError) {
                console.warn(`❌ Exception querying materials for part "${part}":`, queryError);
                // Continue with default values if query fails
              }
            }
            
            return {
              id: `part-${index}`,
              name: part,
              quantity: requiredQuantity.toString(),
              unit,
              available,
              in_stock,
              material_id,
              required_quantity: requiredQuantity
            };
          })
        );
        
        setRequiredSpareParts(spareParts);
      } else {
        // Add default spare parts for common equipment types
        const defaultSpareParts = getDefaultSpareParts(equipmentType, maintenanceClass);
        setRequiredSpareParts(defaultSpareParts);
      }
    } catch (err) {
      console.error('Error loading spare parts:', err);
      // Add default spare parts for common equipment types
      const defaultSpareParts = getDefaultSpareParts(equipmentType || 'Unknown', maintenanceClass);
      setRequiredSpareParts(defaultSpareParts);
    }
  };

  const getDefaultSpareParts = (equipmentType: string, pmClass: string): SparePart[] => {
    // Default spare parts based on equipment type and PM class
    const defaultSpareParts: Record<string, string[]> = {
      'Transportation Bus': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Excavator': ['Hydraulic Oil', 'Engine Oil Filter', 'Air Filter', 'Grease'],
      'Bulldozer': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Fluid', 'Grease'],
      'Asphalt Paver': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Oil', 'Conveyor Belt'],
      'Dump Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Concrete Mixer Truck': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Oil', 'Mixer Paddles'],
      'Water Tanker': ['Engine Oil Filter', 'Air Filter', 'Water Pump', 'Hoses'],
      'Fuel Tanker': ['Engine Oil Filter', 'Air Filter', 'Fuel Pump', 'Safety Equipment'],
      'Flatbed Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Pickup Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Service Van': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes']
    };

    const spareParts = defaultSpareParts[equipmentType] || ['Engine Oil Filter', 'Air Filter', 'Grease'];
    
    return spareParts.map((part, index) => ({
      id: `default-part-${index}`,
      name: part,
      quantity: '1',
      unit: 'pcs',
      available: false,
      in_stock: 0,
      material_id: undefined,
      required_quantity: 1
    }));
  };

  const createPurchaseRequestForMissingParts = async () => {
    console.log('🔍 createPurchaseRequestForMissingParts called - Button clicked!');
    if (!supabase) {
      console.log('❌ Supabase not available');
      alert('Database connection not available');
      return;
    }
    
    try {
      const missingParts = requiredSpareParts.filter(part => !part.available);
      console.log('🔍 Missing parts:', missingParts);
      
      if (missingParts.length === 0) {
        console.log('❌ No missing parts found');
        alert('No missing parts to create purchase request for');
        return;
      }

      // Check if we have valid department and site
      const department = scannedTechnician?.department || 'Maintenance';
      const site = scannedEquipment?.site || 'SITE-20250803-003-316438';

      console.log('🔍 Creating purchase request with data:', {
        title: `PM Spare Parts - ${scannedEquipment?.["Equipment Name"] || 'Equipment'}`,
        description: `Auto-generated purchase request for missing spare parts required for PM task on ${scannedEquipment?.["Equipment Name"] || 'equipment'}`,
        requested_by: scannedTechnician?.id || 'system',
        department,
        site,
        priority: 'high',
        status: 'draft'
      });

      // First, check if purchase_requests table exists by trying to select from it
      console.log('🔍 Checking if purchase_requests table exists...');
      const { data: tableCheck, error: tableError } = await supabase
        .from('purchase_requests')
        .select('id')
        .limit(1);

      if (tableError) {
        console.error('❌ Purchase requests table not accessible:', tableError);
        if (tableError.code === '42P01') {
          alert('Purchase request table does not exist. Please run the database migration first. Contact your administrator.');
        } else {
          alert(`Purchase request functionality is not available: ${tableError.message}`);
        }
        return;
      }

      console.log('✅ Purchase requests table exists, proceeding with creation...');

      // Check if departments table exists (required for foreign key)
      const { data: deptCheck, error: deptError } = await supabase
        .from('departments')
        .select('name')
        .eq('name', department)
        .single();

      if (deptError) {
        console.error('❌ Department not found:', deptError);
        alert(`Department '${department}' not found. Please check if the departments table exists and contains the required department.`);
        return;
      }

      console.log('✅ Department found:', deptCheck);

      // Check if sites table exists (required for foreign key)
      const { data: siteCheck, error: siteError } = await supabase
        .from('sites')
        .select('id')
        .eq('id', site)
        .single();

      if (siteError) {
        console.error('❌ Site not found:', siteError);
        alert(`Site '${site}' not found. Please check if the sites table exists and contains the required site.`);
        return;
      }

      console.log('✅ Site found:', siteCheck);

      // Create purchase request
      const { data: pr, error: prError } = await supabase
        .from('purchase_requests')
        .insert([{
          title: `PM Spare Parts - ${scannedEquipment?.["Equipment Name"] || 'Equipment'}`,
          description: `Auto-generated purchase request for missing spare parts required for PM task on ${scannedEquipment?.["Equipment Name"] || 'equipment'}`,
          requested_by: scannedTechnician?.id || 'system',
          department: department,
          site: site,
          priority: 'high',
          status: 'draft',
          total_estimated_cost: 0,
          currency: 'SAR',
          requested_date: new Date().toISOString(),
          required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select()
        .single();

      if (prError) {
        console.error('❌ Error creating purchase request:', prError);
        // Check if it's a foreign key constraint error
        if (prError.code === '23503') {
          alert('Error: Invalid department or site. Please check if the department and site exist in the database.');
        } else if (prError.code === '42P01') {
          alert('Purchase request table does not exist. Please run the database migration first.');
        } else {
          alert(`Failed to create purchase request: ${prError.message}`);
        }
        return;
      }

      console.log('✅ Purchase request created:', pr);

      // Create purchase request items
      const prItems = missingParts.map(part => ({
        pr_id: pr.id,
        material_name: part.name,
        material_type: 'Spare Part',
        quantity_required: part.required_quantity || parseInt(part.quantity),
        quantity_available: part.in_stock || 0,
        unit: part.unit,
        estimated_unit_cost: 0,
        total_estimated_cost: 0,
        urgency_reason: `Required for PM task on ${scannedEquipment?.["Equipment Name"] || 'equipment'}`,
        specifications: `Spare part for ${scannedEquipment?.["Equipment Type"] || 'equipment'} maintenance`
      }));

      console.log('🔍 Creating purchase request items:', prItems);

      const { error: itemsError } = await supabase
        .from('purchase_request_items')
        .insert(prItems);

      if (itemsError) {
        console.error('❌ Error creating purchase request items:', itemsError);
        alert('Purchase request created but failed to add items');
        return;
      }

      console.log('✅ Purchase request items created successfully');

      setMissingSpareParts(missingParts);
      setShowPurchaseRequestModal(true);
      console.log('✅ Modal should be shown now');
      
    } catch (error) {
      console.error('❌ Error creating purchase request:', error);
      alert('Failed to create purchase request');
    }
  };

  const releaseInventoryForAvailableParts = async () => {
    if (!supabase) {
      alert('Database connection not available');
      return;
    }
    
    try {
      const availableParts = requiredSpareParts.filter(part => part.available && part.material_id);
      if (availableParts.length === 0) {
        alert('No available parts to release from inventory');
        return;
      }

      console.log('🔍 Releasing inventory for available parts:', availableParts);

      // Update inventory for each available part
      const updatePromises = availableParts.map(async (part) => {
        if (!part.material_id || !part.required_quantity || !supabase) return;

        console.log(`🔍 Processing part: ${part.name}, required: ${part.required_quantity}`);

        // Get current inventory
        const { data: currentMaterial, error: fetchError } = await supabase
          .from('materials')
          .select('quantity, status')
          .eq('id', part.material_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching material ${part.name}:`, fetchError);
          throw new Error(`Failed to fetch material ${part.name}: ${fetchError.message}`);
        }

        const currentQuantity = currentMaterial?.quantity || 0;
        const newQuantity = Math.max(0, currentQuantity - part.required_quantity);
        const newStatus = newQuantity === 0 ? 'out-of-stock' : 
                         newQuantity < 50 ? 'low-stock' : 'available';

        console.log(`🔍 Updating ${part.name}: ${currentQuantity} -> ${newQuantity} (${newStatus})`);

        // Update material quantity
        const { error: updateError } = await supabase
          .from('materials')
          .update({
            quantity: newQuantity,
            status: newStatus,
            last_updated: new Date().toISOString()
          })
          .eq('id', part.material_id);

        if (updateError) {
          console.error(`Error updating material ${part.name}:`, updateError);
          throw new Error(`Failed to update material ${part.name}: ${updateError.message}`);
        }

        // Create material log for the release
        const { error: logError } = await supabase
          .from('material_logs')
          .insert([{
            material_id: part.material_id,
            material_name: part.name,
            material_type: 'Spare Part',
            action: 'material-out',
            quantity: part.required_quantity,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            timestamp: new Date().toISOString(),
            site: scannedEquipment?.site || 'Unknown',
            status: newStatus,
            notes: `Released for PM task on ${scannedEquipment?.["Equipment Name"] || 'equipment'} - ${scannedEquipment?.["Equipment Type"] || 'equipment'}`
          }]);

        if (logError) {
          console.error(`Error creating material log for ${part.name}:`, logError);
          // Don't throw error for log creation failure as the main update succeeded
        }

        console.log(`✅ Released ${part.required_quantity} ${part.unit} of ${part.name} from inventory`);
        return { success: true, part, previousQuantity: currentQuantity, newQuantity };
      });

      const results = await Promise.all(updatePromises);
      const successfulReleases = results.filter((result): result is { success: true; part: SparePart; previousQuantity: number; newQuantity: number } => 
        result !== undefined && result.success === true
      );
      
      if (successfulReleases.length === 0) {
        throw new Error('Failed to release any parts from inventory');
      }

      setAvailableSpareParts(availableParts);
      setShowInventoryReleaseModal(true);
      
      console.log(`✅ Successfully released ${successfulReleases.length} parts from inventory`);
      
      // Show success message
      const releasedPartsList = successfulReleases.map(r => `${r.part.name} (${r.part.required_quantity} ${r.part.unit})`).join(', ');
      alert(`Successfully released ${successfulReleases.length} parts from inventory:\n${releasedPartsList}`);
      
    } catch (error) {
      console.error('Error releasing inventory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to release inventory: ${errorMessage}`);
    }
  };

  const startCameraScanning = async () => {
    if (!videoRef.current) {
      setCameraError('Video element not available');
      return;
    }

    try {
      setCameraError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'environment'
        } 
      });

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleQRScanned(result.data);
          stopCameraScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
    } catch (error: any) {
      console.error('Camera error:', error);
      setIsScanning(false);
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera.');
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
    }
  };

  const stopCameraScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRScanned = async (qrData: string) => {
    if (!qrData.trim()) return;
    
    console.log('🔍 QR Scan initiated with data:', qrData);
    setScannedQR(qrData);
    setLoading(true);
    setError(null);

    try {
      // Determine if this is equipment or employee QR
      if (qrData.startsWith('EQ-') || qrData.startsWith('equipment-')) {
        console.log('🔍 Detected equipment QR pattern');
        await handleEquipmentScanned(qrData);
      } else if (qrData.startsWith('EMP-') || qrData.startsWith('employee-')) {
        console.log('🔍 Detected employee QR pattern');
        await handleEmployeeScanned(qrData);
      } else {
        console.log('🔍 Using generic QR lookup');
        // Try to find by QR code in database
        await handleGenericQRScanned(qrData);
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setError('Failed to process QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentScanned = async (equipmentQR: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      console.log('🔍 Scanning equipment QR:', equipmentQR);
      
      // Try to find equipment by QR code first
      let { data: equipment, error: qrError } = await supabase
        .from('equipment')
        .select('*')
        .eq('qr_code', equipmentQR)
        .single();

      if (qrError) {
        console.log('🔍 Equipment not found by qr_code, trying by id');
        // If not found by QR code, try by ID
        const { data: equipmentById, error: idError } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', equipmentQR)
          .single();

        if (idError) {
          console.log('🔍 Equipment not found by id either:', idError);
          setError('Equipment not found');
          return;
        }
        equipment = equipmentById;
      }

      if (!equipment) {
        setError('Equipment not found');
        return;
      }

      // Check if this is the same equipment we already have
      if (scannedEquipment && scannedEquipment.id === equipment.id) {
        console.log('🔍 Equipment already scanned:', equipment["Equipment Name"]);
        return;
      }

      console.log('🔍 Equipment found:', equipment);
      setScannedEquipment(equipment);
      setError(null);

      // Load available PM tasks for this equipment
      await loadAvailablePMTasks(equipment.id);

      // Move to PM selection step
      setCurrentStep('pm_selection');
    } catch (error) {
      console.error('Error scanning equipment:', error);
      setError('Failed to scan equipment');
    }
  };

  const handleEmployeeScanned = async (employeeQR: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      console.log('🔍 Scanning employee QR:', employeeQR);
      
      // Try to find employee by QR code first
      let { data: employee, error: qrError } = await supabase
        .from('employees')
        .select('*')
        .eq('qr_code', employeeQR)
        .single();

      if (qrError) {
        console.log('🔍 Employee not found by qr_code, trying by id');
        // If not found by QR code, try by ID
        const { data: employeeById, error: idError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeQR)
          .single();

        if (idError) {
          console.log('🔍 Employee not found by id either:', idError);
          setError('Employee not found');
          return;
        }
        employee = employeeById;
      }

      if (!employee) {
        setError('Employee not found');
        return;
      }

      // Check if this is the same employee we already have
      if (scannedTechnician && scannedTechnician.id === employee.id) {
        console.log('🔍 Employee already scanned:', employee.name);
        return;
      }

      console.log('🔍 Employee found:', employee);
      setScannedTechnician(employee);
      setError(null);

      // If we're in assignment mode and have equipment, proceed to assignment
      if (workflowMode === 'assignment' && scannedEquipment) {
        // Load available PM tasks if not already loaded
        if (availablePMTasks.length === 0) {
          await loadAvailablePMTasks(scannedEquipment.id);
        }
        setCurrentStep('pm_selection');
      } else if (workflowMode === 'execution') {
        // Load technician's tasks
        await loadTechnicianTasks(employee.id);
        setCurrentStep('technician_dashboard');
      } else {
        // In assignment mode but no equipment scanned yet
        setError('Please scan equipment first before scanning technician');
      }
    } catch (error) {
      console.error('Error scanning employee:', error);
      setError('Failed to scan employee');
    }
  };

  const handleGenericQRScanned = async (qrData: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      console.log('🔍 Scanning QR data:', qrData);
      
      // First, try to find employee by ID (most common case)
      let { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', qrData)
        .single();

      if (employeeError) {
        console.log('🔍 Employee not found by ID, trying QR code');
        // If not found by ID, try by QR code
        const { data: employeeByQR, error: employeeQRError } = await supabase
          .from('employees')
          .select('*')
          .eq('qr_code', qrData)
          .single();

        if (!employeeQRError && employeeByQR) {
          employee = employeeByQR;
        }
      }

      if (employee) {
        // Check if this is the same employee we already have
        if (scannedTechnician && scannedTechnician.id === employee.id) {
          console.log('🔍 Employee already scanned:', employee.name);
          return;
        }
        
        console.log('🔍 Employee found:', employee);
        setScannedTechnician(employee);
        setError(null);

        // If we're in assignment mode and have equipment, proceed to assignment
        if (workflowMode === 'assignment' && scannedEquipment) {
          // Load available PM tasks if not already loaded
          if (availablePMTasks.length === 0) {
            await loadAvailablePMTasks(scannedEquipment.id);
          }
          setCurrentStep('pm_selection');
        } else if (workflowMode === 'execution') {
          // Load technician's tasks
          await loadTechnicianTasks(employee.id);
          setCurrentStep('technician_dashboard');
        } else {
          // In assignment mode but no equipment scanned yet
          setError('Please scan equipment first before scanning technician');
        }
        return;
      }

      // If not an employee, try to find equipment by ID first
      let { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', qrData)
        .single();

      if (equipmentError) {
        console.log('🔍 Equipment not found by ID, trying QR code');
        // If not found by ID, try by QR code
        const { data: equipmentByQR, error: equipmentQRError } = await supabase
          .from('equipment')
          .select('*')
          .eq('qr_code', qrData)
          .single();

        if (!equipmentQRError && equipmentByQR) {
          equipment = equipmentByQR;
        }
      }

      if (equipment) {
        // Check if this is the same equipment we already have
        if (scannedEquipment && scannedEquipment.id === equipment.id) {
          console.log('🔍 Equipment already scanned:', equipment["Equipment Name"]);
          return;
        }
        
        console.log('🔍 Equipment found:', equipment);
        setScannedEquipment(equipment);
        setError(null);

        // Load available PM tasks for this equipment
        await loadAvailablePMTasks(equipment.id);

        // Move to PM selection step
        setCurrentStep('pm_selection');
      } else {
        console.log('🔍 QR code not recognized as employee or equipment:', qrData);
        setError('QR code not recognized. Please scan a valid employee or equipment QR code.');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setError('Failed to process QR scan');
    }
  };

  const loadAvailablePMTasks = async (equipmentId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      console.log('🔍 Loading PM tasks for equipment:', equipmentId);
      
      // Get equipment details
      const { data: equipment } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (!equipment) {
        console.log('🔍 Equipment not found');
        return;
      }

      console.log('🔍 Equipment found:', equipment);
      console.log('🔍 Equipment is_pm:', equipment.is_pm);
      console.log('🔍 Equipment pm_class:', equipment.pm_class);
      console.log('🔍 Equipment next_pm_date:', equipment.next_pm_date);
      console.log('🔍 Equipment Equipment Type:', equipment["Equipment Type"]);
      console.log('🔍 Equipment Equipment Name:', equipment["Equipment Name"]);

      // Check if equipment is enrolled in PM
      if (!equipment.is_pm) {
        console.log('🔍 Equipment not enrolled in PM');
        setAvailablePMTasks([]);
        return;
      }

      // Get PM configuration for this equipment type
      const equipmentType = equipment["Equipment Type"] || equipment["Equipment type"] || null;
      console.log('🔍 PM configs available:', pmConfigs);
      console.log('🔍 Looking for equipment type:', equipmentType);
      
      if (!equipmentType || equipmentType === 'Unknown' || equipmentType === '') {
        console.log('🔍 Equipment type is undefined, null, or Unknown, using default config');
        // Continue with default config
      }
      
      const config = equipmentType && equipmentType !== 'Unknown' && equipmentType !== '' ? pmConfigs.find(cfg => cfg.equipment_type === equipmentType) : null;
      console.log('🔍 PM config found:', config);
      
      // For now, let's create tasks even without config for testing
      // if (!config) {
      //   console.log('🔍 No PM config found for equipment type');
      //   setAvailablePMTasks([]);
      //   return;
      // }

      // Calculate PM tasks based on equipment enrollment and next PM date
      const tasks: PMTask[] = [];
      const now = new Date();
      const nextPMDate = equipment.next_pm_date ? new Date(equipment.next_pm_date) : null;
      const lastPMDate = equipment.last_pm_date ? new Date(equipment.last_pm_date) : null;

      console.log('🔍 Current date:', now);
      console.log('🔍 Next PM date:', nextPMDate);
      console.log('🔍 Last PM date:', lastPMDate);

      // Create a task for the current PM class if equipment is enrolled
      if (equipment.pm_class && equipment.next_pm_date) {
        const task: PMTask = {
          id: `task-${equipment.id}-${equipment.pm_class}`,
          equipment_id: equipment.id,
          equipment_name: equipment["Equipment Name"] || equipment["Equipment name"] || 'Unknown',
          equipment_type: equipmentType || 'Unknown',
          maintenance_class: equipment.pm_class,
          scheduled_date: equipment.next_pm_date,
          status: 'scheduled' as const
        };
        tasks.push(task);
      }

      console.log('🔍 Created tasks:', tasks);
      setAvailablePMTasks(tasks);
    } catch (error) {
      console.error('Error loading PM tasks:', error);
      setAvailablePMTasks([]);
    }
  };

  const loadTechnicianTasks = async (technicianId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select(`
          *,
          equipment:equipment_id("Equipment Name", "Equipment type", model)
        `)
        .eq('technician_id', technicianId)
        .in('status', ['assigned', 'in_progress'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const tasks: PMTask[] = (data || []).map(log => ({
        id: log.id,
        equipment_id: log.equipment_id,
        equipment_name: log.equipment?.["Equipment Name"] || 'Unknown',
        equipment_type: log.equipment?.["Equipment type"] || 'Unknown',
        maintenance_class: log.maintenance_class,
        scheduled_date: log.scheduled_date,
        status: log.status,
        technician_id: log.technician_id,
        assigned_date: log.created_at
      }));

      setTechnicianTasks(tasks);
    } catch (error) {
      console.error('Error loading technician tasks:', error);
    }
  };

  const loadTechnicianTasksForEquipment = async (equipmentId: string) => {
    if (!scannedTechnician) return;

    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const { data, error } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('technician_id', scannedTechnician.id)
        .in('status', ['assigned', 'in_progress'])
        .single();

      if (error) throw error;

      if (data) {
        // Ensure we have the equipment information
        let equipmentInfo = scannedEquipment;
        if (!equipmentInfo) {
          const { data: equipment, error: equipmentError } = await supabase
            .from('equipment')
            .select('*')
            .eq('id', equipmentId)
            .single();

          if (!equipmentError && equipment) {
            equipmentInfo = equipment;
            setScannedEquipment(equipment);
          }
        }

        setSelectedPMTask({
          id: data.id,
          equipment_id: data.equipment_id,
          equipment_name: equipmentInfo?.["Equipment Name"] || 'Unknown',
          equipment_type: equipmentInfo?.["Equipment Type"] || 'Unknown',
          maintenance_class: data.maintenance_class,
          scheduled_date: data.scheduled_date,
          status: data.status,
          technician_id: data.technician_id
        });
      }
    } catch (error) {
      console.error('Error loading technician task for equipment:', error);
    }
  };

  const assignPMTaskToTechnician = async (task: PMTask, technician: Employee) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      console.log('🔍 Attempting to assign PM task:', task);
      console.log('🔍 Looking for maintenance class:', task.maintenance_class);
      
      // First, let's check what columns exist in preventive_maintenance_types
      const { data: pmTypes, error: pmTypesError } = await supabase
        .from('preventive_maintenance_types')
        .select('*')
        .limit(5);

      if (pmTypesError) {
        console.error('Error checking PM types table structure:', pmTypesError);
        // Fallback: try to create the PM log without preventive_type_id for now
        console.log('🔍 Using fallback approach - creating PM log without preventive_type_id');
        
        const { error } = await supabase
          .from('preventive_maintenance_logs')
          .upsert({
            equipment_id: task.equipment_id,
            maintenance_class: task.maintenance_class,
            maintenance_type: 'preventive',
            preventive_type_id: null, // Temporarily set to null
            scheduled_date: task.scheduled_date,
            status: 'assigned',
            technician_id: technician.id,
            checklist_completed: false,
            notes: `Assigned to ${technician.name} on ${new Date().toLocaleDateString()}`
          });

        if (error) throw error;

        console.log('🔍 PM task assigned successfully (fallback mode)');
        return;
      }

      console.log('🔍 PM types table structure:', pmTypes);
      
      // Try to find the PM type by maintenance class
      // We'll try different possible column names
      let pmType = null;
      
                        // Try to find by 'maintenance_type' column (this is the correct column name)
                  if (pmTypes && pmTypes.length > 0 && 'maintenance_type' in pmTypes[0]) {
                    const { data: pmTypeByMaintenanceType, error: pmTypeByMaintenanceTypeError } = await supabase
                      .from('preventive_maintenance_types')
                      .select('id')
                      .eq('maintenance_type', task.maintenance_class)
                      .single();
                    
                    if (!pmTypeByMaintenanceTypeError) {
                      pmType = pmTypeByMaintenanceType;
                    }
                  }
                  
                  // Fallback: try to find by 'name' column if it exists
                  if (!pmType && pmTypes && pmTypes.length > 0 && 'name' in pmTypes[0]) {
                    const { data: pmTypeByName, error: pmTypeByNameError } = await supabase
                      .from('preventive_maintenance_types')
                      .select('id')
                      .eq('name', task.maintenance_class)
                      .single();
                    
                    if (!pmTypeByNameError) {
                      pmType = pmTypeByName;
                    }
                  }
                  
                  // Fallback: try to find by 'type' column if it exists
                  if (!pmType && pmTypes && pmTypes.length > 0 && 'type' in pmTypes[0]) {
                    const { data: pmTypeByType, error: pmTypeByTypeError } = await supabase
                      .from('preventive_maintenance_types')
                      .select('id')
                      .eq('type', task.maintenance_class)
                      .single();
                    
                    if (!pmTypeByTypeError) {
                      pmType = pmTypeByType;
                    }
                  }

      if (!pmType) {
        console.log('🔍 No PM type found, using fallback approach');
        // Fallback: create PM log without preventive_type_id
        const { error } = await supabase
          .from('preventive_maintenance_logs')
          .upsert({
            equipment_id: task.equipment_id,
            maintenance_class: task.maintenance_class,
            maintenance_type: 'preventive',
            preventive_type_id: null, // Temporarily set to null
            scheduled_date: task.scheduled_date,
            status: 'assigned',
            technician_id: technician.id,
            checklist_completed: false,
            notes: `Assigned to ${technician.name} on ${new Date().toLocaleDateString()}`
          });

        if (error) throw error;

        console.log('🔍 PM task assigned successfully (fallback mode)');
        return;
      }

      console.log('🔍 Found PM type:', pmType);

      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .upsert({
          equipment_id: task.equipment_id,
          maintenance_class: task.maintenance_class,
          maintenance_type: 'preventive',
          preventive_type_id: pmType.id,
          scheduled_date: task.scheduled_date,
          status: 'assigned',
          technician_id: technician.id,
          checklist_completed: false,
          notes: `Assigned to ${technician.name} on ${new Date().toLocaleDateString()}`
        });

      if (error) throw error;

      console.log('🔍 PM task assigned successfully');
    } catch (error) {
      console.error('Error assigning PM task:', error);
      throw new Error('Failed to assign PM task');
    }
  };

  const startPMTask = async () => {
    if (!selectedPMTask) return;

    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Update task status to in_progress
      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .update({ status: 'in_progress' })
        .eq('id', selectedPMTask.id);

      if (error) throw error;

      // Ensure we have the equipment information
      if (!scannedEquipment) {
        console.log('🔍 Loading equipment information for task:', selectedPMTask.equipment_id);
        const { data: equipment, error: equipmentError } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', selectedPMTask.equipment_id)
          .single();

        if (equipmentError) {
          console.error('Error loading equipment:', equipmentError);
          setError('Failed to load equipment information');
          return;
        }

        if (equipment) {
          console.log('🔍 Equipment loaded:', equipment);
          setScannedEquipment(equipment);
        }
      }

      // Ensure we have the technician information
      if (!scannedTechnician && selectedPMTask.technician_id) {
        console.log('🔍 Loading technician information for task:', selectedPMTask.technician_id);
        const { data: technician, error: technicianError } = await supabase
          .from('employees')
          .select('*')
          .eq('id', selectedPMTask.technician_id)
          .single();

        if (technicianError) {
          console.error('Error loading technician:', technicianError);
          setError('Failed to load technician information');
          return;
        }

        if (technician) {
          console.log('🔍 Technician loaded:', technician);
          setScannedTechnician(technician);
        }
      }

      // Check if we have all required information
      if (!scannedEquipment || !scannedTechnician) {
        console.error('Missing required information:', { 
          scannedEquipment: !!scannedEquipment, 
          scannedTechnician: !!scannedTechnician 
        });
        setError('Missing equipment or technician information. Please try again.');
        return;
      }

      setCurrentStep('pm_checklist');
    } catch (error) {
      console.error('Error starting PM task:', error);
      setError('Failed to start PM task');
    }
  };

  const completePMTask = async (checklistData: any) => {
    if (!selectedPMTask) return;

    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Extract and convert values from checklistData with proper null/undefined handling
      const progress = checklistData.progress || {};
      const totalItems = parseInt(checklistData.totalItems || progress.total || '0', 10) || 0;
      const completedItems = parseInt(checklistData.completedCount || progress.completed || '0', 10) || 0;
      
      // Calculate requiredItemsCompleted properly
      let requiredItemsCompleted = 0;
      if (progress.completedRequired !== undefined && progress.completedRequired !== null) {
        requiredItemsCompleted = parseInt(progress.completedRequired.toString(), 10) || 0;
      } else if (checklistData.completedItems && Array.isArray(checklistData.completedItems)) {
        // If progress.completedRequired is not available, calculate from completedItems
        requiredItemsCompleted = checklistData.completedItems.length;
      } else {
        // Fallback: use completedItems count
        requiredItemsCompleted = completedItems;
      }
      
      const qualityScore = parseInt(checklistData.qualityScore || '0', 10) || 0;
      const safetyChecksPassed = Boolean(checklistData.safetyChecksPassed || false);

      console.log('🔍 Completing PM task with data:', {
        taskId: selectedPMTask.id,
        totalItems,
        completedItems,
        requiredItemsCompleted,
        qualityScore,
        safetyChecksPassed,
        progress: progress,
        completedItemsArray: checklistData.completedItems
      });

      const { error } = await supabase
        .from('preventive_maintenance_logs')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          checklist_completed: true,
          quality_score: qualityScore,
          safety_checks_passed: safetyChecksPassed,
          total_items: totalItems,
          completed_items: completedItems,
          required_items_completed: requiredItemsCompleted
        })
        .eq('id', selectedPMTask.id);

      if (error) throw error;

      setSuccessMessage('PM task completed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setCurrentStep('pm_complete');
    } catch (error) {
      console.error('Error completing PM task:', error);
      setError('Failed to complete PM task');
    }
  };

  const resetWorkflow = () => {
    setCurrentStep('initial');
    setScannedEquipment(null);
    setScannedTechnician(null);
    setSelectedPMTask(null);
    setAvailablePMTasks([]);
    setTechnicianTasks([]);
    setError(null);
    setSuccessMessage(null);
    setScannedQR('');
  };

  const renderInitialScreen = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">PM Workflow Manager</h1>
        <p className="text-gray-600">Manage preventive maintenance tasks with QR scanning</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assignment Mode */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <User className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">PM Assignment</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Assign preventive maintenance tasks to technicians using QR scanning.
          </p>
          <button
            onClick={() => {
              setWorkflowMode('assignment');
              setCurrentStep('equipment_scan');
              setShowScanner(true);
            }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Start Assignment
          </button>
        </div>

        {/* Execution Mode */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <Wrench className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">PM Execution</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Technicians can execute assigned PM tasks using QR scanning.
          </p>
          <button
            onClick={() => {
              setWorkflowMode('execution');
              setCurrentStep('technician_scan');
              setShowScanner(true);
            }}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Start Execution
          </button>
        </div>
      </div>
    </div>
  );

  const renderScanner = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                 <div className="text-center mb-4">
           <h3 className="text-lg font-semibold text-gray-900 mb-2">
             {workflowMode === 'assignment' 
               ? (scannedEquipment ? 'Scan Technician QR' : 'Scan Equipment QR')
               : 'Scan Technician QR'
             }
           </h3>
           <p className="text-sm text-gray-600">
             {workflowMode === 'assignment' 
               ? (scannedEquipment 
                   ? 'Scan technician QR code to assign PM task'
                   : 'Scan equipment QR code first to select which equipment needs PM'
                 )
               : 'Scan technician QR code to view assigned tasks'
             }
           </p>
           
           {/* Workflow Progress Indicator */}
           {workflowMode === 'assignment' && (
             <div className="mt-4 p-3 bg-blue-50 rounded-lg">
               <div className="flex items-center justify-center space-x-2 text-sm">
                 <div className={`w-3 h-3 rounded-full ${scannedEquipment ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                 <span className={scannedEquipment ? 'text-green-700 font-medium' : 'text-gray-500'}>
                   Equipment Selected
                 </span>
                 <div className="w-4 h-px bg-gray-300"></div>
                 <div className={`w-3 h-3 rounded-full ${selectedPMTask ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                 <span className={selectedPMTask ? 'text-green-700 font-medium' : 'text-gray-500'}>
                   PM Task Selected
                 </span>
                 <div className="w-4 h-px bg-gray-300"></div>
                 <div className={`w-3 h-3 rounded-full ${scannedTechnician ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                 <span className={scannedTechnician ? 'text-green-700 font-medium' : 'text-gray-500'}>
                   Technician Assigned
                 </span>
               </div>
             </div>
           )}
         </div>

        <div className="mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setScanMode('camera');
                setCameraError(null);
                if (qrScannerRef.current) stopCameraScanning();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                scanMode === 'camera'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>
            <button
              onClick={() => {
                setScanMode('hardware');
                setCameraError(null);
                if (qrScannerRef.current) stopCameraScanning();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                scanMode === 'hardware'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Hardware Scanner
            </button>
          </div>
        </div>

        {scanMode === 'camera' && (
          <div className="mb-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-100 rounded-lg"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Scanning...
                  </div>
                </div>
              )}
            </div>
            {cameraError && (
              <p className="text-red-600 text-sm mt-2">{cameraError}</p>
            )}
            {!isScanning && !cameraError && (
              <button
                onClick={startCameraScanning}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Camera
              </button>
            )}
          </div>
        )}

        {scanMode === 'hardware' && (
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="Scan QR code with hardware scanner..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={scannedQR}
              onChange={(e) => setScannedQR(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQRScanned(scannedQR)}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowScanner(false);
              stopCameraScanning();
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderPMSelection = () => {
    if (!scannedEquipment) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PM Task Selection</h2>
            <p className="text-gray-600">
              Equipment: {scannedEquipment["Equipment Name"]} • Type: {scannedEquipment["Equipment Type"]}
            </p>
          </div>
          <button
            onClick={resetWorkflow}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        {/* Equipment Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Equipment Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-blue-600">PM Class:</span>
              <p className="font-medium">{scannedEquipment.pm_class || 'Not Set'}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Next PM Due:</span>
              <p className="font-medium">
                {scannedEquipment.next_pm_date 
                  ? new Date(scannedEquipment.next_pm_date).toLocaleDateString()
                  : 'Not Scheduled'
                }
              </p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Status:</span>
              <p className="font-medium">{scannedEquipment.status}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Site:</span>
              <p className="font-medium">{scannedEquipment.site}</p>
            </div>
          </div>
        </div>

        {/* Available PM Tasks */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available PM Tasks</h3>
          {availablePMTasks.length > 0 ? (
            <div className="space-y-3">
              {availablePMTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPMTask?.id === task.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={async () => {
                    setSelectedPMTask(task);
                    // Load spare parts for this task
                    await loadSparePartsForTask(task.equipment_type || 'Unknown', task.maintenance_class);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {task.maintenance_class} Maintenance
                      </h4>
                      <p className="text-sm text-gray-600">
                        Scheduled: {task.scheduled_date ? new Date(task.scheduled_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                        task.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">No PM tasks available for this equipment.</p>
              <button
                onClick={() => {
                  // Create a manual task for testing
                  const manualTask: PMTask = {
                    id: `manual-${Date.now()}`,
                    equipment_id: scannedEquipment.id,
                    equipment_name: scannedEquipment["Equipment Name"] || 'Unknown',
                    equipment_type: scannedEquipment["Equipment Type"] || 'Unknown',
                    maintenance_class: scannedEquipment.pm_class || 'Class A',
                    scheduled_date: new Date().toISOString(),
                    status: 'scheduled'
                  };
                  setSelectedPMTask(manualTask);
                  loadSparePartsForTask(manualTask.equipment_type || 'Unknown', manualTask.maintenance_class);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Manual Task for Testing
              </button>
            </div>
          )}
        </div>

        {/* Required Spare Parts */}
        {selectedPMTask && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Spare Parts</h3>
            {requiredSpareParts.length > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-yellow-900">Spare Parts Required</h4>
                </div>
                
                {/* Spare Parts Summary */}
                <div className="mb-4 p-3 bg-white rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{requiredSpareParts.length}</div>
                      <div className="text-sm text-gray-600">Total Parts</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {requiredSpareParts.filter(part => part.available).length}
                      </div>
                      <div className="text-sm text-gray-600">Available</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {requiredSpareParts.filter(part => !part.available).length}
                      </div>
                      <div className="text-sm text-gray-600">Missing</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {requiredSpareParts.some(part => !part.available) && (
                    <button
                      onClick={createPurchaseRequestForMissingParts}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create Purchase Request</span>
                    </button>
                  )}
                  {requiredSpareParts.some(part => part.available) && (
                    <button
                      onClick={releaseInventoryForAvailableParts}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>Request from Inventory</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSparePartsVerified(!sparePartsVerified)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                      sparePartsVerified
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{sparePartsVerified ? '✓ Verified' : 'Mark as Verified'}</span>
                  </button>
                </div>

                {/* Spare Parts List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requiredSpareParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{part.name}</span>
                        <p className="text-sm text-gray-600">
                          Required: {part.quantity} {part.unit}
                        </p>
                        <p className="text-sm text-gray-500">
                          In Stock: {part.in_stock || 0} {part.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          part.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {part.available ? 'Available' : 'Not Available'}
                        </span>
                        {!part.available && part.in_stock && part.in_stock > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Low Stock
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action Messages */}
                {requiredSpareParts.some(part => !part.available) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm text-red-800 font-medium">
                        Some spare parts are not available in sufficient quantity. 
                        You can create a purchase request for missing parts or proceed with the PM task.
                      </p>
                    </div>
                  </div>
                )}
                {requiredSpareParts.some(part => part.available) && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-800 font-medium">
                        Some spare parts are available in inventory. You can request them for this PM task.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No spare parts required for this PM task.</p>
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setCurrentStep('technician_scan')}
            disabled={!selectedPMTask}
            className={`px-6 py-2 rounded-lg font-medium ${
              selectedPMTask
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue to Technician Assignment →
          </button>
        </div>
      </div>
    );
  };

  const renderAssignmentConfirmation = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">PM Task Assigned Successfully!</h2>
        <p className="text-gray-600">The preventive maintenance task has been assigned to the technician.</p>
      </div>

      {/* Task Details */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-4">Task Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-blue-600">Equipment:</span>
            <p className="font-medium">{selectedPMTask?.equipment_name}</p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Equipment Type:</span>
            <p className="font-medium">{selectedPMTask?.equipment_type}</p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Maintenance Class:</span>
            <p className="font-medium">{selectedPMTask?.maintenance_class}</p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Scheduled Date:</span>
            <p className="font-medium">
              {selectedPMTask?.scheduled_date ? new Date(selectedPMTask.scheduled_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Technician:</span>
            <p className="font-medium">{scannedTechnician?.name}</p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Assignment Date:</span>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Spare Parts Information */}
      {requiredSpareParts.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-4">Required Spare Parts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredSpareParts.map((part) => (
              <div key={part.id} className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <span className="font-medium text-gray-900">{part.name}</span>
                  <p className="text-sm text-gray-600">
                    Quantity: {part.quantity} {part.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    part.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {part.available ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {sparePartsVerified && (
            <div className="mt-3 p-3 bg-green-100 rounded border border-green-300">
              <p className="text-sm text-green-800">
                <strong>✓ Verified:</strong> All required spare parts have been verified as available.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Technician receives notification</p>
              <p className="text-sm text-gray-600">The assigned technician will be notified of the new PM task.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Gather required spare parts</p>
              <p className="text-sm text-gray-600">
                {requiredSpareParts.length > 0 
                  ? `Ensure all ${requiredSpareParts.length} required spare parts are available.`
                  : 'No spare parts required for this task.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Begin PM task execution</p>
              <p className="text-sm text-gray-600">Technician can start the PM task using the QR scanner or mobile app.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={resetWorkflow}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Start New Assignment
        </button>
        <button
          onClick={() => setCurrentStep('technician_dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Technician Dashboard →
        </button>
      </div>
    </div>
  );

  const renderTechnicianDashboard = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('technician_scan')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Technician Scan
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My PM Tasks</h2>
          <div className="flex items-center text-gray-600">
            <User className="h-5 w-5 mr-2" />
            <span>{scannedTechnician?.name} ({scannedTechnician?.position})</span>
          </div>
        </div>

        {technicianTasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No PM tasks assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {technicianTasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={async () => {
                  setSelectedPMTask(task);
                  
                  // Ensure we have the equipment information
                  if (!scannedEquipment && task.equipment_id) {
                    try {
                      if (!supabase) {
                        console.error('Supabase client not initialized');
                        return;
                      }
                      
                      const { data: equipment, error: equipmentError } = await supabase
                        .from('equipment')
                        .select('*')
                        .eq('id', task.equipment_id)
                        .single();

                      if (equipmentError) {
                        console.error('Error loading equipment:', equipmentError);
                        setError('Failed to load equipment information');
                        return;
                      }

                      if (equipment) {
                        console.log('🔍 Equipment loaded for task:', equipment);
                        setScannedEquipment(equipment);
                      }
                    } catch (error) {
                      console.error('Error loading equipment for task:', error);
                      setError('Failed to load equipment information');
                      return;
                    }
                  }
                  
                  setCurrentStep('start_pm');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.maintenance_class} Maintenance</h3>
                    <p className="text-sm text-gray-600">Equipment: {task.equipment_name}</p>
                    <p className="text-sm text-gray-500">Scheduled: {new Date(task.scheduled_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {task.status === 'assigned' ? 'Assigned' : 'In Progress'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStartPM = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep('technician_dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Start PM Task</h2>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Equipment</p>
                <p className="font-semibold">{selectedPMTask?.equipment_name || 'No task selected'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">PM Class</p>
                <p className="font-semibold">{selectedPMTask?.maintenance_class || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Technician</p>
                <p className="font-semibold">{scannedTechnician?.name || 'No technician'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">{selectedPMTask?.status || 'No task'}</p>
              </div>
            </div>
            {!selectedPMTask && (
              <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Debug:</strong> No PM task selected. You need to assign a task to a technician first.
                </p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">Safety Reminder</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Before starting maintenance, ensure all safety protocols are followed:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• Equipment is properly shut down and secured</li>
                  <li>• Personal protective equipment is worn</li>
                  <li>• Work area is properly marked and isolated</li>
                  <li>• All tools and materials are ready</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={startPMTask}
            disabled={!selectedPMTask}
            className={`px-6 py-3 rounded-lg flex items-center ${
              selectedPMTask 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <Play className="h-5 w-5 mr-2" />
            Start PM Task {!selectedPMTask && '(No Task Selected)'}
          </button>
          <button
            onClick={() => setCurrentStep('technician_dashboard')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderPMChecklist = () => {
    if (!selectedPMTask || !scannedEquipment || !scannedTechnician) {
      console.log('🔍 Missing information in renderPMChecklist:', {
        selectedPMTask: !!selectedPMTask,
        scannedEquipment: !!scannedEquipment,
        scannedTechnician: !!scannedTechnician,
        selectedPMTaskDetails: selectedPMTask ? {
          id: selectedPMTask.id,
          equipment_id: selectedPMTask.equipment_id,
          equipment_name: selectedPMTask.equipment_name,
          technician_id: selectedPMTask.technician_id
        } : null,
        scannedEquipmentDetails: scannedEquipment ? {
          id: scannedEquipment.id,
          "Equipment Name": scannedEquipment["Equipment Name"],
          "Equipment Type": scannedEquipment["Equipment Type"]
        } : null,
        scannedTechnicianDetails: scannedTechnician ? {
          id: scannedTechnician.id,
          name: scannedTechnician.name
        } : null
      });
      
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Missing Information</h2>
            <p className="text-red-700 mb-4">
              Required information is missing. Please go back and try again.
              {!selectedPMTask && <br />}
              {!selectedPMTask && <span className="text-sm">• No PM task selected</span>}
              {!scannedEquipment && <br />}
              {!scannedEquipment && <span className="text-sm">• Equipment information not loaded</span>}
              {!scannedTechnician && <br />}
              {!scannedTechnician && <span className="text-sm">• Technician information not loaded</span>}
            </p>
            <button
              onClick={() => setCurrentStep('start_pm')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return (
      <PMChecklistWorkflow
        equipmentId={selectedPMTask.equipment_id}
        equipmentName={selectedPMTask.equipment_name}
        equipmentType={selectedPMTask.equipment_type}
        pmClass={selectedPMTask.maintenance_class}
        technicianId={scannedTechnician.id}
        onComplete={completePMTask}
        onBack={() => setCurrentStep('start_pm')}
      />
    );
  };

  const renderPMComplete = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-4">PM Task Completed Successfully!</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-left">
          <div>
            <p className="text-sm text-gray-600">Equipment</p>
            <p className="font-semibold">{scannedEquipment?.["Equipment Name"]}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Equipment Type</p>
            <p className="font-semibold">{scannedEquipment?.["Equipment Type"]}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">PM Class</p>
            <p className="font-semibold">{selectedPMTask?.maintenance_class}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed By</p>
            <p className="font-semibold">{scannedTechnician?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completion Date</p>
            <p className="font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetWorkflow}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start New Task
          </button>
          <button
            onClick={() => setCurrentStep('initial')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  );

  const renderPurchaseRequestModal = () => {
    if (!showPurchaseRequestModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Purchase Request Created</h2>
            <button
              onClick={() => setShowPurchaseRequestModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              A purchase request has been created for the following missing spare parts:
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Missing Parts:</h3>
            <div className="space-y-2">
              {missingSpareParts.map((part) => (
                <div key={part.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium text-gray-900">{part.name}</span>
                    <p className="text-sm text-gray-600">
                      Required: {part.quantity} {part.unit} | In Stock: {part.in_stock || 0} {part.unit}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Missing
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Purchase request has been submitted to procurement</li>
              <li>• You will be notified when parts are available</li>
              <li>• PM task can be completed once parts are received</li>
              <li>• Check purchase request status in the inventory module</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowPurchaseRequestModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryReleaseModal = () => {
    if (!showInventoryReleaseModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Inventory Released</h2>
            <button
              onClick={() => setShowInventoryReleaseModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              The following spare parts have been successfully released from inventory:
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-green-900 mb-2">Released Parts:</h3>
            <div className="space-y-2">
              {availableSpareParts.map((part) => (
                <div key={part.id} className="flex justify-between items-center p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium text-gray-900">{part.name}</span>
                    <p className="text-sm text-gray-600">
                      Released: {part.quantity} {part.unit} | Previous Stock: {(part.in_stock || 0) + (part.required_quantity || 0)} {part.unit}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Released
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Spare parts have been released from inventory</li>
              <li>• Parts are now available for the PM task</li>
              <li>• Inventory levels have been updated automatically</li>
              <li>• Material logs have been created for tracking</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowInventoryReleaseModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render based on current step
  // Error and success messages should be handled first
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={resetWorkflow}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-800 mb-2">Success</h2>
          <p className="text-green-700 mb-4">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 'initial':
      return (
        <>
          {renderInitialScreen()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'equipment_scan':
    case 'technician_scan':
      return (
        <>
          {renderInitialScreen()}
          {showScanner && renderScanner()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'pm_selection':
      return (
        <>
          {renderPMSelection()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'assignment_confirmation':
      return (
        <>
          {renderAssignmentConfirmation()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'technician_dashboard':
      return (
        <>
          {renderTechnicianDashboard()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'start_pm':
      return (
        <>
          {renderStartPM()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'pm_checklist':
      return (
        <>
          {renderPMChecklist()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    case 'pm_complete':
      return (
        <>
          {renderPMComplete()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
    default:
      return (
        <>
          {renderInitialScreen()}
          {renderPurchaseRequestModal()}
          {renderInventoryReleaseModal()}
        </>
      );
  }
};

export default PMWorkflowManager;
