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
        entity = (materials as any[]).find((mat: any) => 
          mat.id === parsed.id || 
          mat.qrCode === parsed.id || 
          (mat.oldId && mat.oldId === parsed.id) ||
          (mat.sku && mat.sku === parsed.id) ||
          (mat.barcode && mat.barcode === parsed.id)
        );
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
                label: 'Delivery Note / Gate Pass',
                description: 'Outbound dispatch & gate pass verification',
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
            
            // Calculate and immediately reflect updated inventory stock
            const currentQty = typeof scanResult.entity.quantity === 'number'
              ? scanResult.entity.quantity
              : (Number(scanResult.entity.quantity) || 0);
            const newQty = actionId === 'material-in' ? currentQty + quantity : Math.max(0, currentQty - quantity);
            const newStatus = newQty === 0 ? 'out-of-stock' : newQty < 50 ? 'low-stock' : 'available';
            
            const updatedEntity = {
              ...scanResult.entity,
              quantity: newQty,
              status: newStatus,
              lastUpdated: new Date().toISOString()
            };

            // Update live scanResult so UI updates immediately
            setScanResult(prev => prev ? {
              ...prev,
              entity: updatedEntity,
              currentStatus: newStatus
            } : null);

            // Update local allEntities state so search reflects new stock
            setAllEntities(prev => ({
              ...prev,
              materials: prev.materials.map(m => (m.id === updatedEntity.id || (updatedEntity.qrCode && m.qrCode === updatedEntity.qrCode)) ? updatedEntity : m)
            }));

            const actionLabel = actionId === 'material-in' ? 'Material IN' : 'Material OUT';
            setSuccess(`✅ ${actionLabel} recorded! Updated Stock: ${newQty} ${scanResult.entity.unit || 'units'} (previously ${currentQty})`);
            setTimeout(() => setSuccess(''), 6000);
            return;
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
      

      
      // Show success message for non-material actions (material actions already set specific message with stock)
      setSuccess(`✅ ${actionId.replace('-', ' ').toUpperCase()} recorded successfully!`);
      setTimeout(() => setSuccess(''), 5000);
      
      // For equipment actions, add a small delay to ensure log is persisted before potential re-scan
      if (scanResult.type === 'equipment' && (actionId === 'start-use' || actionId === 'stop-use')) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      console.error('Failed to log action:', error);
      const errMsg = error?.message || `Failed to record ${actionId.replace('-', ' ')}. Please try again.`;
      setError(`❌ ${errMsg}`);
      setTimeout(() => setError(''), 6000);
    } finally {
      console.log('🏁 Action completed:', actionId);
      isProcessingRef.current = false;
      setIsProcessingAction(false);
      
      // For equipment stop-use, clear debounce immediately to allow instant re-scanning
      if (actionId === 'stop-use') {
        setLastScannedCode('');
        setLastScanTime(0);
      }
      
      // For materials, keep the card visible with the latest stock so user can inspect or do another action!
      // For other entities, clear scan result after delay to allow quick rescanning
      if (scanResult && scanResult.type !== 'material') {
        setTimeout(() => {
          console.log('🔄 Clearing scan result for non-material entity:', actionId);
          setScanResult(null);
          setLastScannedCode('');
          setLastScanTime(0);
        }, actionId === 'stop-use' ? 500 : 800);
      }
    }
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-950/20">
              <Camera className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">QR Scanner Engine</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Auto-Detection
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Scan any asset tag, employee badge, equipment QR, or warehouse location code</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] shadow-sm overflow-hidden mb-8 transition-colors">
        <div className="p-6 sm:p-8">
          {/* Alerts: Visible whether scanning or viewing scan results */}
          {error && (
            <div className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-semibold flex items-center gap-2 border ${
              error.includes('✅') ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}>
              {error.includes('✅') ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl mb-6 text-xs sm:text-sm font-semibold flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!scanResult ? (
            <div>
              {/* Search Field */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  <span>Direct Entity Quick Search</span>
                  <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {allEntities.employees.length} Personnel • {allEntities.equipment.length} Assets • {allEntities.materials.length} Materials
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by code, SKU, or name (e.g. EMP-001, Portland, Excavator)..."
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none transition shadow-sm"
                    autoComplete="off"
                  />
                </div>
                {searchQuery && (
                  <div className="mt-2 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] rounded-xl max-h-64 overflow-y-auto shadow-xl z-20">
                    {isSearching ? (
                      <div className="p-4 text-slate-400 dark:text-slate-500 text-center text-xs font-medium">Searching registry...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-slate-400 dark:text-slate-500 text-center text-xs font-medium">No matching entities found in database</div>
                    ) : (
                      <>
                        {['employee', 'equipment', 'material'].map(type => {
                          const group = searchResults.filter(r => r._entityType === type);
                          if (group.length === 0) return null;
                          return (
                            <div key={type} className="border-t first:border-t-0 border-slate-100 dark:border-[#202C3F]">
                              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#182235]">
                                {type.charAt(0).toUpperCase() + type.slice(1)}s
                              </div>
                              <div className="divide-y divide-slate-50 dark:divide-[#202C3F]/60">
                                {group.map(entity => (
                                  <button
                                    key={entity.id + (entity.custom_equipment_id || '')}
                                    onClick={() => handleEntitySelect(entity)}
                                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/50 dark:hover:bg-[#182235] flex items-center gap-2.5 text-xs transition"
                                  >
                                    {type === 'employee' && <User className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                    {type === 'equipment' && <Wrench className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                                    {type === 'material' && <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                                    <span className="font-semibold text-slate-900 dark:text-white">{entity.name}</span>
                                    <span className="ml-auto text-[11px] font-mono text-slate-400 dark:text-slate-500">{entity.id}</span>
                                    {type === 'equipment' && entity.custom_equipment_id && (
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500">({entity.custom_equipment_id})</span>
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
              <div className="rounded-2xl overflow-hidden mb-6 border border-slate-200 dark:border-[#202C3F] bg-slate-900">
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: isScanning ? 'block' : 'none' }}
                />
                {!isScanning && (
                  <div className="h-80 flex items-center justify-center bg-slate-100 dark:bg-[#0e1624]">
                    <div className="text-center p-6">
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <User className="w-10 h-10 text-blue-500" />
                        <Wrench className="w-10 h-10 text-emerald-500" />
                        <Package className="w-10 h-10 text-amber-500" />
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-lg font-bold mb-2">Ready to scan any QR code</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Camera preview will appear here</p>
                      {cameraPermission === 'denied' && (
                        <p className="text-rose-600 font-semibold text-sm">
                          Camera access denied. Please enable camera permissions in your browser settings.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={cameraPermission === 'denied'}
                  className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                    cameraPermission === 'denied'
                      ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isScanning
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-950/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-950/20'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>{isScanning ? 'Halt Scanner' : 'Activate Live Camera'}</span>
                </button>

                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-white dark:bg-[#0e1624] hover:bg-slate-50 dark:hover:bg-[#182235] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#202C3F] transition-all duration-150 shadow-sm"
                >
                  <Upload className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span>Upload QR Image File</span>
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