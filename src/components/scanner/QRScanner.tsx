import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, Upload, Clock, AlertCircle, CheckCircle, UserPlus, Package, Scan, User, Wrench, Building } from 'lucide-react';
import TimeTrackingPanel from './TimeTrackingPanel';
import MaterialScanner from './MaterialScanner';
import { parseQRCode } from '../../utils/qrCodeUtils';
import { DataStorage } from '../../utils/dataStorage';
import { getShiftStatus } from '../../utils/timeUtils';
import { useHardwareScanner } from '../../hooks/useHardwareScanner';
import { OfflineDataManager } from '../../utils/offlineDataManager';
import UnifiedScanResult from './UnifiedScanResult';

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use hardware scanner hook
  useHardwareScanner({
    onScan: (data) => {
      if (data && !scanResult) {
        handleScanResult(data);
      }
    },
    inputRef,
    enabled: !scanResult && !isScanning
  });

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
        (result) => {
          handleScanResult(result.data);
          stopScanning();
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

  const handleScanResult = (qrData: string) => {
    const parsed = parseQRCode(qrData);
    
    if (!parsed.type) {
      setError('Invalid QR code format');
      return;
    }

    // Load data from storage
    const employees = DataStorage.loadEmployees();
    const equipment = DataStorage.loadEquipment();
    const materials = DataStorage.loadMaterials();
    const sites = DataStorage.loadSites();
    const timeLogs = DataStorage.loadTimeLogs();

    let entity = null;
    let currentStatus = '';
    let actions: any[] = [];
    let entityType = parsed.type;

    // Find the entity based on type and ID
    switch (parsed.type) {
      case 'employee':
        entity = employees.find(emp => emp.id === parsed.id);
        if (entity) {
          // Check current status from recent logs
          const recentLog = timeLogs
            .filter(log => log.entityId === parsed.id && log.entityType === 'employee')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
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
              type: parsed.type,
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
              type: parsed.type,
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
        entity = equipment.find(eq => eq.id === parsed.id);
        if (entity) {
          const recentLog = timeLogs
            .filter(log => log.entityId === parsed.id && log.entityType === 'equipment')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          
          const isInUse = recentLog?.action === 'start-use';
          currentStatus = isInUse ? 'in-use' : 'available';
          
          if (isInUse) {
            const usageInfo = getShiftStatus(recentLog.timestamp);
            actions = [{
              id: 'stop-use',
              label: 'Stop Use',
              description: `End usage (${usageInfo.hoursWorked.toFixed(1)}h used)`,
              icon: Clock,
              color: 'red'
            }];
          } else {
            actions = [{
              id: 'start-use',
              label: 'Start Use',
              description: 'Begin equipment usage',
              icon: Clock,
              color: 'green'
            }];
          }
          
          setScanResult({
            type: parsed.type,
            entity,
            currentStatus,
            actions
          });
        } else {
          setError(`Equipment with ID ${parsed.id} not found in system. Please register this equipment first.`);
          return;
        }
        break;

      case 'material':
        entity = materials.find(mat => mat.id === parsed.id);
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
            type: parsed.type,
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
        entity = sites.find(site => site.id === parsed.id);
        if (entity) {
          actions = [{
            id: 'site-checkin',
            label: 'Site Check-in',
            description: 'Register presence at site',
            icon: CheckCircle,
            color: 'blue'
          }];
          
          setScanResult({
            type: parsed.type,
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
    if (!scanResult) return;

    // Load current data from storage
    const timeLogs = DataStorage.loadTimeLogs();
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
      
      // Update material quantity in mock data
      const materialIndex = materials.findIndex(m => m.id === scanResult.entity.id);
      if (materialIndex !== -1) {
        if (actionId === 'material-in') {
          materials[materialIndex].quantity += quantity;
        } else {
          materials[materialIndex].quantity = Math.max(0, materials[materialIndex].quantity - quantity);
        }
        
        // Update status based on quantity
        const newQuantity = materials[materialIndex].quantity;
        if (newQuantity === 0) {
          materials[materialIndex].status = 'out-of-stock';
        } else if (newQuantity < 50) {
          materials[materialIndex].status = 'low-stock';
        } else {
          materials[materialIndex].status = 'available';
        }
      }
    }

    // Create new log entry
    const newLog: any = {
      id: `log-${Date.now()}`,
      entityId: scanResult.entity.id,
      entityType: scanResult.type,
      action: actionId,
      timestamp,
      site: scanResult.entity.site || 'Unknown',
      notes,
      quantity
    };

    try {
      // Use offline data manager for proper sync queuing
      await OfflineDataManager.createTimeLog(newLog);
      
      // Update materials if needed
      if (actionId === 'material-in' || actionId === 'material-out') {
        const materialIndex = materials.findIndex(m => m.id === scanResult.entity.id);
        if (materialIndex !== -1) {
          await OfflineDataManager.updateMaterial(materials[materialIndex]);
        }
      }
      
      console.log('Action logged and queued for sync:', newLog);
      
      // Show success message
      setError(`✅ ${actionId.replace('-', ' ').toUpperCase()} recorded successfully!`);
    } catch (error) {
      console.error('Failed to log action:', error);
      setError(`❌ Failed to record ${actionId.replace('-', ' ')}. Please try again.`);
    }
    
    // Reset scan result to allow new scan
    setScanResult(null);
    setTimeout(() => setError(''), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      QrScanner.scanImage(file)
        .then(result => handleScanResult(result))
        .catch(error => {
          console.error('QR scan error:', error);
          setError('No QR code found in image');
        });
    }
  };


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3">
              <Camera className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Unified QR Scanner
              </h2>
            </div>
            <p className="text-gray-600 mt-2">
              Scan any QR code (employee, equipment, material, or site)
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          {!scanResult ? (
            <div className="space-y-6">
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
              />

              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                
                {!isScanning && (
                  <div className="h-64 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <User className="w-10 h-10 text-blue-400" />
                        <Wrench className="w-10 h-10 text-green-400" />
                        <Package className="w-10 h-10 text-orange-400" />
                      </div>
                      <p className="text-gray-600 mb-2">Ready to scan any QR code</p>
                      <p className="text-sm text-gray-500 mb-4">Camera preview will appear here</p>
                      {cameraPermission === 'denied' && (
                        <p className="text-red-600 text-sm">
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
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;