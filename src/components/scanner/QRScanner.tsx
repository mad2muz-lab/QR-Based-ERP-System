import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, Upload, Clock, AlertCircle, CheckCircle, UserPlus, Package, Scan, User, Wrench, Building, Pause, AlertTriangle, Settings } from 'lucide-react';
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
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { fetchData, getAllLogs } from '../../utils/dataProxy';
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
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load all entities on mount for search
  useEffect(() => {
    (async () => {
      const [employees, equipment, materials] = await Promise.all([
        fetchData('employees'),
        fetchData('equipment'),
        fetchData('materials'),
      ]);
      
      // If no equipment exists, create some test equipment
      if (equipment.length === 0) {
        console.log('No equipment found, creating test equipment...');
        const testEquipment: Equipment[] = [
          {
            id: 'eqp-001',
            custom_equipment_id: 'EQP-TEST-001',
            name: 'Test Excavator',
            type: 'Excavator',
            model: 'CAT 320',
            site: 'Riyadh Site',
            qrCode: 'EQP-TEST-001',
            status: 'available' as const,
            operational_status: 'working' as const,
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
            status: 'available' as const,
            operational_status: 'working' as const,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          }
        ];
        
        DataStorage.saveEquipment(testEquipment);
        setAllEntities({ employees, equipment: testEquipment, materials });
      } else {
        setAllEntities({ employees, equipment, materials });
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
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const emp = allEntities.employees.filter(e => e.name?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q));
      const eq = allEntities.equipment.filter(e => e.name?.toLowerCase().includes(q) || e.id?.toLowerCase().includes(q) || e.custom_equipment_id?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q));
      const mat = allEntities.materials.filter(m => m.name?.toLowerCase().includes(q) || m.id?.toLowerCase().includes(q) || m.type?.toLowerCase().includes(q));
      setSearchResults([
        ...emp.map(e => ({ ...e, _entityType: 'employee' })),
        ...eq.map(e => ({ ...e, _entityType: 'equipment' })),
        ...mat.map(m => ({ ...m, _entityType: 'material' })),
      ]);
      setIsSearching(false);
    }, 200);
    // eslint-disable-next-line
  }, [searchQuery, allEntities]);

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

    // Load data through centralized proxy
    let employees, equipment, materials, sites, allLogs;
    try {
      setError('Loading data...');
      [employees, equipment, materials, sites, allLogs] = await Promise.all([
        fetchData('employees'),
        fetchData('equipment'),
        fetchData('materials'),
        fetchData('sites'),
        getAllLogs()
      ]);
      
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
          
          // Set up equipment-specific actions based on current status
          if (currentStatus === 'available') {
            actions = [
              {
                id: 'start_use',
                label: 'Start Use',
                description: 'Begin equipment usage',
                icon: Clock,
                color: 'green'
              },
              {
                id: 'standby_start',
                label: 'Start Standby',
                description: 'Set equipment to standby mode',
                icon: Pause,
                color: 'blue'
              },
              {
                id: 'mark_for_maintenance',
                label: 'Mark for Maintenance',
                description: 'Mark equipment for maintenance inspection',
                icon: Wrench,
                color: 'orange'
              }
            ];
          } else if (currentStatus === 'in_use') {
            // Calculate usage time from the start log
            let usageHours = 0;
            if (recentLog) {
              const startTime = new Date(recentLog.timestamp);
              const now = new Date();
              usageHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert to hours
            }
            
            actions = [
              {
                id: 'stop_use',
                label: 'Stop Use',
                description: `End usage (${usageHours.toFixed(1)}h used)`,
                icon: Clock,
                color: 'red'
              }
            ];
          } else if (currentStatus === 'standby') {
            // Calculate standby time from the standby start log
            let standbyHours = 0;
            if (recentLog) {
              const startTime = new Date(recentLog.timestamp);
              const now = new Date();
              standbyHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60); // Convert to hours
            }
            
            actions = [
              {
                id: 'standby_end',
                label: 'End Standby',
                description: `End standby (${standbyHours.toFixed(1)}h in standby)`,
                icon: Pause,
                color: 'orange'
              }
            ];
          } else if (currentStatus === 'maintenance') {
            // Equipment is under maintenance
            // Check for active maintenance log
            let hasActiveMaintenanceLog = false;
            let hasScheduledMaintenanceLog = false;
            try {
              const logs = await maintenanceService.getMaintenanceLogs(entity.id);
              hasActiveMaintenanceLog = logs && logs.length > 0 && logs.some(log => log.status === 'in_progress');
              hasScheduledMaintenanceLog = logs && logs.length > 0 && logs.some(log => log.status === 'scheduled');
            } catch {}
            
            if (hasActiveMaintenanceLog) {
              actions = [
                {
                  id: 'complete_maintenance',
                  label: 'Maintenance Completed',
                  description: 'Mark maintenance as completed and equipment ready',
                  icon: CheckCircle,
                  color: 'green'
                }
              ];
            } else if (hasScheduledMaintenanceLog) {
              actions = [
                {
                  id: 'start_maintenance_work',
                  label: 'Start Maintenance Work',
                  description: 'Begin maintenance work on equipment',
                  icon: Wrench,
                  color: 'orange'
                }
              ];
            } else {
              actions = [
                {
                  id: 'mark_working',
                  label: 'Mark as Working',
                  description: 'Mark equipment as operational',
                  icon: CheckCircle,
                  color: 'green'
                }
              ];
            }
          }
          
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

  const handleAction = async (actionId: string, quantity?: number) => {
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
    const materials = await fetchData('materials');

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
          if (actionId === 'start_use') {
            // Convert start_use to start-use
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'start-use',
              scanResult.entity.site || 'Unknown',
              'in-use', // Use valid status
              notes
            );
          } else if (actionId === 'stop_use') {
            // Convert stop_use to stop-use
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'stop-use',
              scanResult.entity.site || 'Unknown',
              'available', // Use valid status
              notes
            );
          } else if (actionId === 'standby_start') {
            // Handle standby start action
            notes = 'Equipment set to standby mode';
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'standby-start',
              scanResult.entity.site || 'Unknown',
              'standby',
              notes
            );
          } else if (actionId === 'standby_end') {
            // Handle standby end action
            notes = 'Equipment standby ended';
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'standby-end',
              scanResult.entity.site || 'Unknown',
              'available',
              notes
            );
          } else if (actionId === 'mark_for_maintenance') {
            // Directly mark equipment for maintenance and start time tracker
            setIsProcessingAction(true);
            setError('');
            
            try {
              const timestamp = new Date().toISOString();
              const notes = 'Equipment marked for maintenance - time tracking started';
              
              // Create equipment log for maintenance start
              const operationId = await logManager.createEquipmentLog(
                scanResult.entity,
                'maintenance-start',
                scanResult.entity.site || 'Unknown',
                'maintenance',
                notes
              );
              
              // Create maintenance log with 'in_progress' status to start time tracking
              const maintenanceLogId = await maintenanceService.createMaintenanceLog({
                equipment_id: scanResult.entity.id,
                maintenance_type: 'service', // Default to service type
                status: 'in_progress',
                description: 'Equipment marked for maintenance - time tracking active',
                start_date: timestamp,
                estimated_duration_hours: 1,
                equipment: scanResult.entity
              });
              
              setSuccess('Equipment marked for maintenance and time tracking started!');
              setTimeout(() => setSuccess(''), 3000);
              resetScanner();
            } catch (error: any) {
              console.error('Error marking equipment for maintenance:', error);
              setError(`Failed to mark equipment for maintenance. Please try again.`);
            } finally {
              setIsProcessingAction(false);
            }
            return; // Don't proceed with the action, we've handled it
          } else if (actionId === 'mark_working') {
            // Handle marking equipment as working
            notes = 'Equipment marked as operational';
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'maintenance-end',
              scanResult.entity.site || 'Unknown',
              'available',
              notes
            );
          } else if (actionId === 'start_maintenance_work') {
            // Handle starting maintenance work
            notes = 'Maintenance work started';
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'maintenance-start',
              scanResult.entity.site || 'Unknown',
              'maintenance',
              notes
            );
            
            // Update maintenance log status to in_progress
            try {
              const logs = await maintenanceService.getMaintenanceLogs(scanResult.entity.id);
              const scheduledLog = logs.find(log => log.status === 'scheduled');
              if (scheduledLog) {
                await maintenanceService.updateMaintenanceStatus(scheduledLog.id, 'in_progress');
              }
            } catch (error) {
              console.error('Failed to update maintenance log status:', error);
            }
          } else if (actionId === 'complete_maintenance') {
            // Handle completing maintenance
            notes = 'Maintenance completed - equipment ready for use';
            operationId = await logManager.createEquipmentLog(
              scanResult.entity,
              'maintenance-end',
              scanResult.entity.site || 'Unknown',
              'available',
              notes
            );
            
            // Update maintenance log status to completed
            try {
              const logs = await maintenanceService.getMaintenanceLogs(scanResult.entity.id);
              const inProgressLog = logs.find(log => log.status === 'in_progress');
              if (inProgressLog) {
                await maintenanceService.updateMaintenanceStatus(inProgressLog.id, 'completed');
              }
            } catch (error) {
              console.error('Failed to update maintenance log status:', error);
            }
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
    <div className="space-y-6">
      {/* Equipment scanner functionality now integrated directly into main QR scanner */}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Unified QR Scanner
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Scan any QR code for employees, equipment, materials, or sites.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          {!scanResult ? (
            <div className="space-y-6">
              {/* --- SEARCH FIELD --- */}
              <div className="mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search employee, equipment, or material..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  autoComplete="off"
                />
                {searchQuery && (
                  <div className="absolute z-50 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-64 overflow-y-auto shadow-xl">
                    {isSearching ? (
                      <div className="p-4 text-gray-500 text-center">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">No results found</div>
                    ) : (
                      <>
                        {/* Grouped results */}
                        {['employee', 'equipment', 'material'].map(type => {
                          const group = searchResults.filter(r => r._entityType === type);
                          if (group.length === 0) return null;
                          return (
                            <div key={type}>
                              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">{type.charAt(0).toUpperCase() + type.slice(1)}s</div>
                              {group.map(entity => (
                                <button
                                  key={entity.id + (entity.custom_equipment_id || '')}
                                  onClick={() => handleEntitySelect(entity)}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center space-x-3"
                                >
                                  {type === 'employee' && <User className="w-4 h-4 text-blue-500" />}
                                  {type === 'equipment' && <Wrench className="w-4 h-4 text-green-500" />}
                                  {type === 'material' && <Package className="w-4 h-4 text-orange-500" />}
                                  <span className="font-medium">{entity.name}</span>
                                  <span className="ml-2 text-xs text-gray-500">{entity.id}</span>
                                  {type === 'equipment' && entity.custom_equipment_id && (
                                    <span className="ml-2 text-xs text-gray-400">({entity.custom_equipment_id})</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* --- END SEARCH FIELD --- */}
              {error && (
                <div className={`p-4 rounded-lg border ${
                  error.includes('✅') 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center space-x-2">
                    {error.includes('✅') ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Hidden input for hardware scanner */}
              <input
                ref={inputRef}
                type="text"
                className="opacity-0 h-0 w-0 absolute"
                aria-hidden="true"
                onChange={handleHardwareInput}
                onKeyDown={handleHardwareKeyDown}
              />

              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-48 sm:h-64 object-cover"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                
                {!isScanning && (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-100">
                    <div className="text-center p-4">
                      <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-4">
                        <User className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
                        <Wrench className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
                        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400" />
                      </div>
                      <p className="text-gray-600 text-sm sm:text-base mb-2">Ready to scan any QR code</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">Camera preview will appear here</p>
                      {cameraPermission === 'denied' && (
                        <p className="text-red-600 text-xs sm:text-sm">
                          Camera access denied. Please enable camera permissions in your browser settings.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={cameraPermission === 'denied'}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isScanning
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : cameraPermission === 'denied'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>{isScanning ? 'Stop Scanning' : 'Start Camera'}</span>
                </button>

                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          ) : (
            <UnifiedScanResult
              scanResult={scanResult} 
              onAction={handleAction}
              onBack={() => setScanResult(null)}
              isProcessing={isProcessingAction}
            />
          )}
        </div>
      </div>

      {/* Maintenance Type Selection Modal */}


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