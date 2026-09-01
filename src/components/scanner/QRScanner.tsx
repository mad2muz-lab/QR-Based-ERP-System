import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { Camera, Upload, Clock, AlertCircle, CheckCircle, UserPlus, Package, Scan, User, Wrench, Building, Pause, AlertTriangle, Settings, FileText, ArrowLeft, MapPin, TrendingUp } from 'lucide-react';
import TimeTrackingPanel from './TimeTrackingPanel';
import MaterialScanner from './MaterialScanner';
// Equipment scanner functionality now integrated directly into main QR scanner
import { parseQRCode } from '../../utils/qrCodeUtils';
import { DataStorage } from '../../utils/dataStorage';
import { getShiftStatus } from '../../utils/timeUtils';
import { useHardwareScanner } from '../../hooks/useHardwareScanner';
import { OfflineDataManager } from '../../utils/offlineDataManager';
import { logManager } from '../../utils/logManager';
import { AuthManager } from '../../utils/authUtils';
import { Employee, Equipment, Material, Site, TimeLog } from '../../types';
import UnifiedScanResult from './UnifiedScanResult';
import { maintenanceService } from '../../utils/maintenanceService';
import EquipmentMaintenanceModal from './EquipmentMaintenanceModal';


const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: string;
    entity?: any;
    entityId?: string;
    currentStatus?: string;
    actions: any[];
    currentShift?: {
      startTime: Date;
      currentHours: number;
      isOvertime: boolean;
    };
    icon?: any;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  // Equipment scanner functionality now integrated directly into main QR scanner
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef<boolean>(false);
  const navigate = useNavigate();
  
  // Maintenance modal state
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  
  // Use hardware scanner hook
  useHardwareScanner({
    onScan: async (data) => {
      if (data && !scanResult && !isProcessingAction) {
        await handleScanResult(data);
      }
    },
    inputRef,
    enabled: !scanResult && !isScanning && !isProcessingAction
  });

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allEntities, setAllEntities] = useState<{ employees: any[]; equipment: any[]; materials: any[] }>({ employees: [], equipment: [], materials: [] });
  const [sites, setSites] = useState<any[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load all entities on mount for search
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [entitiesError, setEntitiesError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let employees = DataStorage.loadEmployees();
        let equipment = DataStorage.loadEquipment();
        let materials = DataStorage.loadMaterials();
        const loadedSites = DataStorage.loadSites();
        
        if (employees.length === 0) {
          employees = [
            { id: 'emp-001', name: 'Test Employee 1', department: 'Operations', qrCode: 'EMP-001' },
            { id: 'emp-002', name: 'Test Employee 2', department: 'Maintenance', qrCode: 'EMP-002' }
          ];
          DataStorage.saveEmployees(employees);
        }
        
        if (equipment.length === 0) {
          equipment = [
            {
              id: 'eqp-001',
              custom_equipment_id: 'EQP-TEST-001',
              name: 'Test Excavator',
              type: 'Excavator',
              model: 'CAT 320',
              site: 'Riyadh Site',
              qrCode: 'EQP-TEST-001',
              status: 'available',
              operational_status: 'working',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            },
            {
              id: 'eqp-002',
              custom_equipment_id: 'EQP-TEST-002',
              name: 'Test Bulldozer',
              type: 'Bulldozer',
              model: 'CAT D6',
              site: 'Jeddah Site',
              qrCode: 'EQP-TEST-002',
              status: 'available',
              operational_status: 'working',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            }
          ];
          DataStorage.saveEquipment(equipment);
        }
        
        if (materials.length === 0) {
          materials = [
            { id: 'mat-001', name: 'Test Cement', type: 'Construction', qrCode: 'MAT-001', status: 'available' },
            { id: 'mat-002', name: 'Test Steel', type: 'Construction', qrCode: 'MAT-002', status: 'available' }
          ];
          DataStorage.saveMaterials(materials);
        }
        
        setAllEntities({ employees, equipment, materials });
        setSites(loadedSites);
      } catch (error) {
        console.error('Failed to load search entities:', error);
        setEntitiesError('Failed to load search data');
        setAllEntities({ employees: [], equipment: [], materials: [] });
        setSites([]);
      } finally {
        setEntitiesLoading(false);
      }
    })();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    console.log('Searching for:', searchQuery, 'Entities:', { employees: allEntities.employees.length, equipment: allEntities.equipment.length, materials: allEntities.materials.length });
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const emp = allEntities.employees.filter(e => e.name?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q));
      const eq = allEntities.equipment.filter(e => e.name?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q) || e.custom_equipment_id?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q));
      const mat = allEntities.materials.filter(m => m.name?.toLowerCase().includes(q) || m.id?.toLowerCase().includes(q) || m.type?.toLowerCase().includes(q));
      console.log('Search results:', { employees: emp.length, equipment: eq.length, materials: mat.length });
      setSearchResults([
        ...emp.map(e => ({ ...e, _entityType: 'employee' })),
        ...eq.map(e => ({ ...e, _entityType: 'equipment' })),
        ...mat.map(m => ({ ...m, _entityType: 'material' })),
      ]);
      setIsSearching(false);
    }, 200);
    // eslint-disable-next-line
  }, [searchQuery, allEntities]);

  // Debug: log when entities change
  useEffect(() => {
    console.log('All entities updated:', allEntities);
  }, [allEntities]);

  // Simulate QR scan on selection
  const handleEntitySelect = async (entity: any) => {
    let qrString = '';
    if (entity._entityType === 'employee') {
      qrString = entity.id; // EMP-... format
    } else if (entity._entityType === 'equipment') {
      qrString = entity.id.startsWith('EQP-') ? entity.id : entity.custom_equipment_id || entity.id;
    } else if (entity._entityType === 'material') {
      qrString = entity.id; // MAT-... format
    }
    setSearchQuery('');
    setSearchResults([]);
    await handleScanResult(qrString);
  };

  useEffect(() => {
    checkCameraPermission();
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state);
      
      result.addEventListener('change', () => {
        setCameraPermission(result.state);
      });
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      // Request camera permission explicitly
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          if (!scanResult && !isProcessingAction) {
            await handleScanResult(result.data);
            stopScanning();
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment'
        }
      );

      await qrScannerRef.current.start();
    } catch (error: any) {
      // Don't log error for user-dismissed permission
      if (!(error.name === 'NotAllowedError' && error.message?.includes('Permission dismissed'))) {
        console.error('Camera error:', error);
      }
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else {
        setError('Failed to start camera. Please try again.');
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (qrData: string) => {
    // Improved debounce: Allow re-scanning after actions complete, but prevent rapid duplicate scans
    const now = Date.now();
if (qrData === lastScannedCode && now - lastScanTime < 5000) { // Increased to 5 seconds to prevent immediate re-scan
  return;
}
    
    setLastScannedCode(qrData);
    setLastScanTime(now);
    
    const parsed = await parseQRCode(qrData);
    
    if (!parsed.type || parsed.type === null) {
      setError('Invalid QR code format');
      return;
    }

    // Load data directly from localStorage to avoid Supabase dependency
    let employees, equipment, materials, sites, allLogs;
    try {
      setError('Loading data...');
      employees = DataStorage.loadEmployees();
      equipment = DataStorage.loadEquipment();
      materials = DataStorage.loadMaterials();
      sites = DataStorage.loadSites();
      allLogs = DataStorage.loadAllLogs();
      
      setError(''); // Clear loading message
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data. Please try again.');
      return;
    }

    let entity = null;
    let currentStatus = '';
    let actions: Array<{
      id: string;
      label: string;
      description: string;
      icon: any;
      color: string;
    }> = [];
    let entityType = parsed.type;

    // Handle unknown QR codes by detecting entity type
    if (parsed.type === 'unknown') {
      // Check equipment first (most likely for custom IDs)
      entity = (equipment as any[]).find((eq: any) => 
        eq.custom_equipment_id === parsed.id || eq.id === parsed.id
      );
      if (entity) {
        entityType = 'equipment';
      } else {
        // Check other entity types
        entity = (employees as any[]).find((emp: any) => emp.id === parsed.id);
        if (entity) {
          entityType = 'employee';
        } else {
          entity = (materials as any[]).find((mat: any) => mat.id === parsed.id);
          if (entity) {
            entityType = 'material';
          } else {
            entity = (sites as any[]).find((site: any) => site.id === parsed.id);
            if (entity) {
              entityType = 'site';
            }
          }
        }
      }
      
      if (!entity) {
        setError(`No entity found with ID: ${parsed.id}`);
        return;
      }
    }

    // Find the entity based on type and ID
    switch (entityType) {
      case 'employee':
        if (!entity) {
          entity = (employees as any[]).find((emp: any) => emp.id === parsed.id);
        }
        if (entity) {
          // Check current status from recent employee logs
          const employeeLogs = allLogs.employeeLogs || allLogs || [];
          const recentLog = employeeLogs
            .filter((log: any) => log.entity_id === parsed.id || log.entityId === parsed.id || log.employeeId === parsed.id || log.employee_id === parsed.id)
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          const isClockedIn = recentLog?.action === 'clock-in';
          currentStatus = isClockedIn ? 'clocked-in' : 'clocked-out';
          
          // Determine available actions
          if (isClockedIn) {
            // Get shift info for overtime calculation
            const shiftInfo = getShiftStatus(recentLog.timestamp);
            actions = [{
              id: 'clock-out',
              label: 'Clock Out',
              description: `End shift (${shiftInfo.hoursWorked.toFixed(1)}h worked)`,
              icon: Clock,
              color: 'red'
            }];
            
            // Add current shift info to scan result
            setScanResult({
              type: entityType,
              entity,
              currentStatus,
              actions,
              currentShift: {
                startTime: new Date(recentLog.timestamp),
                currentHours: shiftInfo.hoursWorked,
                isOvertime: shiftInfo.isOvertime
              }
            });
          } else {
            actions = [{
              id: 'clock-in',
              label: 'Clock In',
              description: 'Start new shift',
              icon: Clock,
              color: 'green'
            }];
            
            setScanResult({
              type: entityType,
              entity,
              currentStatus,
              actions
            });
          }
        } else {
          // Employee not found in registration system
          setError(`Employee with ID ${parsed.id} not found in the system.`);
          setScanResult({
            type: 'unregistered_employee',
            entityId: parsed.id,
            actions: [{
              id: 'register-employee',
              label: 'Register Employee',
              description: 'This employee ID is not registered in the system',
              icon: UserPlus,
              color: 'blue'
            }]
          });
        }
        break;

      case 'equipment':
        // For equipment, implement the new workflow directly here
        console.log('🔍 Searching for equipment with ID:', parsed.id);
        console.log('🔍 Available equipment:', equipment);
        
        // Find equipment by custom_equipment_id first, then by id
        if (!entity) {
          entity = (equipment as any[]).find((eq: any) => 
            eq.custom_equipment_id === parsed.id || eq.id === parsed.id
          );
        }
        
        console.log('🔍 Found equipment:', entity);
        
        if (entity) {
          // Check equipment logs to determine current status
          const equipmentLogs = allLogs.equipmentLogs || [];
          const equipmentUUID = entity.id;
          
          // Find the most recent equipment log for this equipment
          const recentLog = equipmentLogs
            .filter((log: any) => 
              log.entity_id === equipmentUUID || log.entityId === equipmentUUID || 
              log.equipmentId === equipmentUUID || log.equipment_id === equipmentUUID ||
              // Also check for custom_equipment_id in logs for backward compatibility
              log.entity_id === parsed.id || log.entityId === parsed.id
            )
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          console.log('🔍 Recent equipment log:', recentLog);
          
          // Determine current status based on recent log
          let currentStatus = 'available';
          if (recentLog) {
            console.log('🔍 Recent log action:', recentLog.action);
            if (recentLog.action === 'start-use') {
              currentStatus = 'in_use';
            } else if (recentLog.action === 'standby-start') {
              currentStatus = 'standby';
            } else if (recentLog.action === 'maintenance-start') {
              currentStatus = 'maintenance';
            } else if (recentLog.action === 'stop-use' || recentLog.action === 'standby-end' || recentLog.action === 'maintenance-end') {
              currentStatus = 'available';
            }
          } else {
            console.log('🔍 No recent log found, using equipment status:', entity.status);
            // Fallback to equipment's own status if no logs found
            if (entity.status === 'in-use' || entity.status === 'maintenance' || entity.status === 'standby') {
              currentStatus = entity.status;
            }
          }
          
          console.log('🔍 Equipment current status:', currentStatus);
          
          actions = [
            {
              id: 'view_equipment_details',
              label: 'View Details',
              description: 'View equipment information',
              icon: CheckCircle,
              color: 'blue'
            },
            {
              id: 'update_equipment_location',
              label: 'Update Location',
              description: 'Change equipment site/warehouse',
              icon: Building,
              color: 'green'
            },
            {
              id: 'update_equipment_status',
              label: 'Update Status',
              description: 'Change operational status',
              icon: AlertTriangle,
              color: 'orange'
            }
          ];
          
          setScanResult({
            type: entityType,
            entity,
            currentStatus: currentStatus,
            actions
          });
        } else {
          setError(`Equipment with ID ${parsed.id} not found in system. Please register this equipment first.`);
          return;
        }
        break;

      case 'material':
        entity = (materials as any[]).find((mat: any) => mat.id === parsed.id);
        if (entity) {
          currentStatus = entity.status;
          actions = [
            {
              id: 'material-in',
              label: 'Material In',
              description: 'Add to inventory',
              icon: Upload,
              color: 'green'
            },
            {
              id: 'material-out',
              label: 'Material Out',
              description: 'Issue from inventory',
              icon: Upload,
              color: 'orange'
            },
            {
              id: 'transfer-material',
              label: 'Transfer Material',
              description: 'Move between sites/warehouses',
              icon: Package,
              color: 'blue'
            },
            {
              id: 'goods-receipt',
              label: 'Goods Receipt',
              description: 'Receive materials from supplier',
              icon: FileText,
              color: 'emerald'
            },
            {
              id: 'return-to-vendor',
              label: 'Return to Vendor',
              description: 'Return defective/excess materials',
              icon: ArrowLeft,
              color: 'red'
            },
            {
              id: 'quarantine-material',
              label: 'Quarantine / Hold',
              description: 'Flag material for quality review',
              icon: AlertTriangle,
              color: 'yellow'
            },
            {
              id: 'picking',
              label: 'Picking / Issue',
              description: 'Pick and issue to project/warehouse',
              icon: Package,
              color: 'blue'
            },
              {
                id: 'register-material',
                label: 'Register New Material',
                description: 'Create new material record',
                icon: UserPlus,
                color: 'purple'
              },
              {
                id: 'batch-lot',
                label: 'Batch/Lot Tracking',
                description: 'Track batch numbers and expiry',
                icon: FileText,
                color: 'teal'
              },
              {
                id: 'zone-bin',
                label: 'Zone / Bin Tracking',
                description: 'Update storage location',
                icon: MapPin,
                color: 'indigo'
              },
              {
                id: 'reservation',
                label: 'Reserve Stock',
                description: 'Reserve available stock for works',
                icon: Package,
                color: 'purple'
              },
              {
                id: 'inventory-adjustment',
                label: 'Inventory Adjustment',
                description: 'Record stock adjustments',
                icon: Settings,
                color: 'orange'
              },
              {
                id: 'stock-alerts',
                label: 'Stock Alerts',
                description: 'View low stock and threshold alerts',
                icon: AlertTriangle,
                color: 'red'
              },
              {
                id: 'barcode-label',
                label: 'Barcode Labels',
                description: 'Generate and print QR/barcode labels',
                icon: FileText,
                color: 'teal'
              },
              {
                id: 'reconciliation',
                label: 'Reconciliation',
                description: 'Cycle count reconciliation report',
                icon: CheckCircle,
                color: 'green'
              },
              {
                id: 'manifest',
                label: 'Manifest',
                description: 'Inbound/outbound shipment manifest',
                icon: Package,
                color: 'blue'
              },
              {
                id: 'master',
                label: 'Item Master',
                description: 'Manage item metadata and suppliers',
                icon: Building,
                color: 'indigo'
              },
              {
                id: 'audit-trail',
                label: 'Audit Trail',
                description: 'View inventory movement history',
                icon: FileText,
                color: 'gray'
              },
              {
                id: 'valuation',
                label: 'Valuation',
                description: 'Inventory valuation by warehouse',
                icon: TrendingUp,
                color: 'purple'
              }
          ];
          
          setScanResult({
            type: entityType,
            entity,
            currentStatus,
            actions
          });
        } else {
          setError(`Material with ID ${parsed.id} not found in system. Please register this material first.`);
          return;
        }
        break;

      case 'site':
        entity = (sites as any[]).find((site: any) => site.id === parsed.id);
        if (entity) {
          actions = [{
            id: 'site-checkin',
            label: 'Site Check-in',
            description: 'Register presence at site',
            icon: CheckCircle,
            color: 'blue'
          }];
          
          setScanResult({
            type: entityType,
            entity,
            currentStatus: 'active',
            actions
          });
        } else {
          setError(`Site with ID ${parsed.id} not found in system. Please register this site first.`);
          return;
        }
        break;
        
      default:
        setError(`Unrecognized QR code format: ${parsed.id}. Please scan a valid QR code.`);
        return;
    }
    
    // Add entity type icon
    const entityIcon = getEntityIcon(entityType);
    if (scanResult) {
      scanResult.icon = entityIcon;
    }
  };
  
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'employee': return User;
      case 'equipment': return Wrench;
      case 'material': return Package;
      case 'site': return Building;
      default: return Scan;
    }
  };

  const handleAction = async (actionId: string, quantity?: number, destination?: any) => {
    // Immediate synchronous protection against rapid clicks
    if (!scanResult || isProcessingAction || isProcessingRef.current) {
      console.log('🚫 Action blocked:', { actionId, hasResult: !!scanResult, isProcessingAction, isProcessingRef: isProcessingRef.current });
      return;
    }
    
    console.log('✅ Action starting:', actionId, 'for', scanResult.type);
    console.log('✅ Equipment entity:', scanResult.entity);
    isProcessingRef.current = true;
    setIsProcessingAction(true);

    // Load current data from storage
    const materials = DataStorage.loadMaterials();

    const timestamp = new Date().toISOString();
    let notes = '';
    
    // Calculate overtime for employee clock-out
    if (actionId === 'clock-out' && scanResult.currentShift) {
      const totalHours = scanResult.currentShift.currentHours;
      const regularHours = Math.min(totalHours, 8);
      const overtimeHours = Math.max(totalHours - 8, 0);
      
      notes = `End of shift - Total: ${totalHours.toFixed(1)}h, Regular: ${regularHours.toFixed(1)}h, Overtime: ${overtimeHours.toFixed(1)}h`;
    }
    
    // Add quantity info for material actions
    if ((actionId === 'material-in' || actionId === 'material-out') && quantity) {
      notes = `${actionId} via QR scan - Quantity: ${quantity}`;
    }

    try {
      let operationId: string;
      
      // Use the new LogManager to create entity-specific logs
      switch (scanResult.type) {
        case 'employee':
          if (actionId === 'clock-in' || actionId === 'clock-out') {
            operationId = await logManager.createEmployeeLog(
              scanResult.entity,
              actionId as 'clock-in' | 'clock-out',
              scanResult.entity.site || 'Unknown',
              notes
            );
          } else {
            throw new Error(`Invalid action for employee: ${actionId}`);
          }
          break;
          
        case 'equipment':
          if (actionId === 'view_equipment_details') {
            setSuccess(`Equipment: ${scanResult.entity.name} | Status: ${currentStatus} | Site: ${scanResult.entity.site || 'Unknown'}`);
          } else if (actionId === 'update_equipment_location') {
            setSuccess('Location update - feature coming soon');
          } else if (actionId === 'update_equipment_status') {
            setSuccess('Status update - feature coming soon');
          } else {
            throw new Error(`Invalid action for equipment: ${actionId}`);
          }
          break;
          
        case 'material':
          if (actionId === 'material-in' || actionId === 'material-out') {
            if (!quantity || quantity <= 0) {
              throw new Error('Valid quantity is required for material operations');
            }
            operationId = await logManager.createMaterialLog(
              scanResult.entity,
              actionId as 'material-in' | 'material-out',
              quantity,
              scanResult.entity.site || 'Unknown',
              scanResult.entity.status || 'available',
              notes
            );
            
            // Material quantity update is now handled within logManager.createMaterialLog
          } else if (actionId === 'transfer-material') {
            if (!quantity || quantity <= 0) {
              throw new Error('Valid quantity is required for material transfer');
            }
            const destName = destination?.name || 'Unknown Site';
            const destProvince = destination?.province || '';
            notes = `Material transfer via QR scan - Quantity: ${quantity} - To: ${destName}${destProvince ? ` (${destProvince})` : ''}`;
            operationId = await logManager.createMaterialLog(
              scanResult.entity,
              'material-out',
              quantity,
              scanResult.entity.site || 'Unknown',
              scanResult.entity.status || 'available',
              notes
            );
            setSuccess(`Material transfer initiated for ${quantity} units to ${destName}`);
          } else if (actionId === 'register-material') {
            setSuccess('Redirecting to material registration...');
            setTimeout(() => {
              navigate('/register?tab=materials');
            }, 800);
            return;
          } else if (actionId === 'goods-receipt') {
            setSuccess('Redirecting to goods receipt...');
            setTimeout(() => {
              navigate('/inventory/goods-receipt');
            }, 800);
            return;
          } else if (actionId === 'return-to-vendor') {
            setSuccess('Redirecting to return to vendor...');
            setTimeout(() => {
              navigate('/inventory/return-to-vendor');
            }, 800);
            return;
          } else if (actionId === 'quarantine-material') {
            setSuccess('Redirecting to quarantine...');
            setTimeout(() => {
              navigate('/inventory/quarantine');
            }, 800);
            return;
          } else if (actionId === 'picking') {
            setSuccess('Redirecting to picking...');
            setTimeout(() => {
              navigate('/inventory/picking');
            }, 800);
            return;
          } else if (actionId === 'batch-lot') {
            setSuccess('Redirecting to batch/lot tracking...');
            setTimeout(() => {
              navigate('/inventory/batch-lot');
            }, 800);
            return;
          } else if (actionId === 'zone-bin') {
            setSuccess('Redirecting to zone/bin tracking...');
            setTimeout(() => {
              navigate('/inventory/zone-bin');
            }, 800);
            return;
          } else if (actionId === 'reservation') {
            setSuccess('Redirecting to stock reservation...');
            setTimeout(() => {
              navigate('/inventory/reservation');
            }, 800);
            return;
          } else if (actionId === 'inventory-adjustment') {
            setSuccess('Redirecting to inventory adjustments...');
            setTimeout(() => {
              navigate('/inventory/adjustments');
            }, 800);
            return;
          } else if (actionId === 'stock-alerts') {
            setSuccess('Redirecting to stock alerts...');
            setTimeout(() => {
              navigate('/inventory/alerts');
            }, 800);
            return;
          } else if (actionId === 'barcode-label') {
            setSuccess('Redirecting to label generator...');
            setTimeout(() => {
              navigate('/inventory/labels');
            }, 800);
            return;
          } else if (actionId === 'reconciliation') {
            setSuccess('Redirecting to reconciliation...');
            setTimeout(() => {
              navigate('/inventory/reconciliation');
            }, 800);
            return;
          } else if (actionId === 'manifest') {
            setSuccess('Redirecting to manifest...');
            setTimeout(() => {
              navigate('/inventory/manifest');
            }, 800);
            return;
          } else if (actionId === 'master') {
            setSuccess('Redirecting to item master...');
            setTimeout(() => {
              navigate('/inventory/master');
            }, 800);
            return;
          } else if (actionId === 'audit-trail') {
            setSuccess('Redirecting to audit trail...');
            setTimeout(() => {
              navigate('/inventory/audit-trail');
            }, 800);
            return;
          } else if (actionId === 'valuation') {
            setSuccess('Redirecting to valuation report...');
            setTimeout(() => {
              navigate('/inventory/valuation');
            }, 800);
            return;
          } else {
            throw new Error(`Invalid action for material: ${actionId}`);
          }
          break;
          
        case 'site':
          // For site check-ins, use the legacy method for now
          operationId = await logManager.createTimeLog(
            scanResult.entity.id,
            'employee', // Assuming site check-ins are employee-related
            actionId,
            scanResult.entity.name || 'Unknown',
            notes
          );
          break;
          
        default:
          throw new Error(`Unsupported entity type: ${scanResult.type}`);
      }
      

      
      // Show success message
      setError(`✅ ${actionId.replace('-', ' ').toUpperCase()} recorded successfully!`);
      
      // For equipment actions, add a small delay to ensure log is persisted before potential re-scan
      if (scanResult.type === 'equipment' && (actionId === 'start-use' || actionId === 'stop-use')) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Failed to log action:', error);
      setError(`❌ Failed to record ${actionId.replace('-', ' ')}. Please try again.`);
    } finally {
        console.log('🏁 Action completed:', actionId);
        
        // For equipment stop-use, clear debounce immediately to allow instant re-scanning
        if (actionId === 'stop-use') {
          setLastScannedCode('');
          setLastScanTime(0);
        }
        
        // Clear scan result after action to allow rescanning
        // Keep processing state active until scan result is cleared to prevent duplicate actions
        setTimeout(() => {
  console.log('🔄 Clearing scan result and processing state for:', actionId);
  setScanResult(null);
  isProcessingRef.current = false;
  setIsProcessingAction(false);
  setLastScannedCode(''); // Reset to allow future scans after delay
  if (actionId !== 'stop-use') {
            setLastScannedCode('');
            setLastScanTime(0);
          }
        }, actionId === 'stop-use' ? 500 : 800);
      }
    
    setTimeout(() => setError(''), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      QrScanner.scanImage(file)
        .then(async result => await handleScanResult(result))
        .catch(error => {
          console.error('QR scan error:', error);
          setError('No QR code found in image');
        });
    }
  };

  // Keep hardware scanner input focused when ready to scan
  useEffect(() => {
    if (inputRef.current && !scanResult && !isScanning && !isProcessingAction) {
      inputRef.current.focus();
    }
  }, [scanResult, isScanning, isProcessingAction]);

  // Handler for hardware scanner input
  const handleHardwareInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value) {
      handleScanResult(value);
      e.target.value = '';
    }
  };

  // Optionally, handle Enter key for some scanners
  const handleHardwareKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputRef.current) {
      const value = inputRef.current.value.trim();
      if (value) {
        handleScanResult(value);
        inputRef.current.value = '';
      }
    }
  };

  // Maintenance modal handlers
  const handleMaintenanceStart = async (maintenanceData: any) => {
    try {
      // Create equipment log for maintenance start
      const notes = `Maintenance started: ${maintenanceData.description}`;
      await logManager.createEquipmentLog(
        selectedEquipment,
        'maintenance-start',
        selectedEquipment.site || 'Unknown',
        'maintenance',
        notes
      );

      // Create detailed maintenance log
      await maintenanceService.startMaintenance(maintenanceData);

      setSuccess('Maintenance started successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to start maintenance:', error);
      setError('Failed to start maintenance. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };



  const handleMaintenanceComplete = async (maintenanceData: any) => {
    try {
      // Create equipment log for maintenance end
      const notes = `Maintenance completed: ${maintenanceData.description}`;
      await logManager.createEquipmentLog(
        selectedEquipment,
        'maintenance-end',
        selectedEquipment.site || 'Unknown',
        'available',
        notes
      );

      // Update maintenance log
      await maintenanceService.completeMaintenance(maintenanceData.maintenanceId, {
        actual_duration_hours: maintenanceData.actual_duration_hours,
        cost: maintenanceData.cost,
        completed_by: maintenanceData.completed_by,
        technician_notes: maintenanceData.technician_notes,
        parts_used: maintenanceData.parts_used
      });

      setSuccess('Maintenance completed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to complete maintenance:', error);
      setError('Failed to complete maintenance. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setSuccess('');
    setIsProcessingAction(false);
    setSelectedEquipment(null);
    setIsMaintenanceModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #002e17, #004d26)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          QR Scanner
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Scan any QR code for employees, equipment, materials, or warehouses</p>
      </div>

      {/* Main Card */}
      <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '32px' }}>
          {!scanResult ? (
            <div>
              {/* Search Field */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>
                  Search database: {allEntities.employees.length} employees, {allEntities.equipment.length} equipment, {allEntities.materials.length} materials
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search employee, equipment, or material..."
                  style={{ width: '100%', padding: '14px 18px', border: '2px solid #d1d5db', borderRadius: '12px', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
                  autoComplete="off"
                />
                {searchQuery && (
                  <div style={{ marginTop: '8px', background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', maxHeight: '256px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {isSearching ? (
                      <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center', fontSize: '16px' }}>Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center', fontSize: '16px' }}>No results found</div>
                    ) : (
                      <>
                        {['employee', 'equipment', 'material'].map(type => {
                          const group = searchResults.filter(r => r._entityType === type);
                          if (group.length === 0) return null;
                          return (
                            <div key={type} style={{ marginTop: type !== 'employee' ? '8px' : '0', paddingTop: type !== 'employee' ? '8px' : '0', borderTop: type !== 'employee' ? '1px solid #f3f4f6' : 'none' }}>
                              <div style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', background: '#f9fafb' }}>{type.charAt(0).toUpperCase() + type.slice(1)}s</div>
                              <div>
                                {group.map(entity => (
                                  <button
                                    key={entity.id + (entity.custom_equipment_id || '')}
                                    onClick={() => handleEntitySelect(entity)}
                                    style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}
                                  >
                                    {type === 'employee' && <User style={{ width: '18px', height: '18px', color: '#2563eb', flexShrink: 0 }} />}
                                    {type === 'equipment' && <Wrench style={{ width: '18px', height: '18px', color: '#059669', flexShrink: 0 }} />}
                                    {type === 'material' && <Package style={{ width: '18px', height: '18px', color: '#ea580c', flexShrink: 0 }} />}
                                    <span style={{ fontWeight: '600', color: '#111827' }}>{entity.name}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '14px', color: '#6b7280', flexShrink: 0 }}>{entity.id}</span>
                                    {type === 'equipment' && entity.custom_equipment_id && (
                                      <span style={{ fontSize: '14px', color: '#9ca3af', flexShrink: 0 }}>({entity.custom_equipment_id})</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Error/Success Message */}
              {error && (
                <div style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontSize: '16px', fontWeight: '600', background: error.includes('✅') ? '#d1fae5' : '#fee2e2', color: error.includes('✅') ? '#065f46' : '#991b1b', border: `2px solid ${error.includes('✅') ? '#6ee7b7' : '#fca5a5'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {error.includes('✅') ? <CheckCircle style={{ width: '20px', height: '20px' }} /> : <AlertCircle style={{ width: '20px', height: '20px' }} />}
                  <span>{error}</span>
                </div>
              )}

              {/* Hidden input for hardware scanner */}
              <input
                ref={inputRef}
                type="text"
                style={{ opacity: 0, height: 0, width: 0, position: 'absolute' }}
                aria-hidden="true"
                onChange={handleHardwareInput}
                onKeyDown={handleHardwareKeyDown}
              />

              {/* Camera Preview */}
              <div style={{ background: '#111827', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: isScanning ? 'block' : 'none' }}
                />
                {!isScanning && (
                  <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                        <User style={{ width: '40px', height: '40px', color: '#60a5fa' }} />
                        <Wrench style={{ width: '40px', height: '40px', color: '#34d399' }} />
                        <Package style={{ width: '40px', height: '40px', color: '#fb923c' }} />
                      </div>
                      <p style={{ color: '#374151', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Ready to scan any QR code</p>
                      <p style={{ color: '#6b7280', fontSize: '16px', margin: '0 0 16px 0' }}>Camera preview will appear here</p>
                      {cameraPermission === 'denied' && (
                        <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: '600' }}>
                          Camera access denied. Please enable camera permissions in your browser settings.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={cameraPermission === 'denied'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '17px',
                    border: 'none',
                    cursor: cameraPermission === 'denied' ? 'not-allowed' : 'pointer',
                    background: isScanning ? '#dc2626' : '#002e17',
                    color: 'white',
                    boxShadow: isScanning ? '0 4px 12px rgba(220,38,38,0.3)' : '0 4px 12px rgba(0,46,23,0.3)'
                  }}
                >
                  <Camera style={{ width: '22px', height: '22px' }} />
                  <span>{isScanning ? 'Stop Scanning' : 'Start Camera'}</span>
                </button>

                <button
                  onClick={() => inputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '17px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#374151',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(55,65,81,0.3)'
                  }}
                >
                  <Upload style={{ width: '22px', height: '22px' }} />
                  <span>Upload Image</span>
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <UnifiedScanResult
              scanResult={scanResult}
              onAction={handleAction}
              onBack={() => setScanResult(null)}
              isProcessing={isProcessingAction}
              sites={sites}
              navigate={navigate}
              onNavigateToTransfer={(materialId, destinationId) => {
                const params = new URLSearchParams({ materialId });
                if (destinationId) params.set('destinationId', destinationId);
                navigate(`/inventory/transfer?${params.toString()}`);
              }}
            />
          )}
        </div>
      </div>

      {/* Maintenance Modal */}
      {selectedEquipment && (
        <EquipmentMaintenanceModal
          equipment={selectedEquipment}
          isOpen={isMaintenanceModalOpen}
          onClose={() => {
            setIsMaintenanceModalOpen(false);
            setSelectedEquipment(null);
          }}
          onMaintenanceStart={handleMaintenanceStart}
          onMaintenanceComplete={handleMaintenanceComplete}
        />
      )}
    </div>
  );
};

export default QRScanner;