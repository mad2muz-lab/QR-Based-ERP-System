import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { 
  Camera, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Settings,
  Hammer,
  AlertCircle,
  Play,
  Pause,
  X,
  RotateCcw,
  Scan,
  User,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { parseQRCode } from '../../utils/qrCodeUtils';
import { DataStorage } from '../../utils/dataStorage';
import { Equipment } from '../../types';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { logManager } from '../../utils/logManager';

interface EquipmentScannerProps {
  onClose: () => void;
}

type EquipmentStatus = 'working' | 'not_working';
type WorkingAction = 'start_use' | 'standby';
type MaintenanceAction = 'need_repair' | 'regular_service';

interface EquipmentScanResult {
  equipment: Equipment;
  currentStatus: string;
  operationalStatus: Equipment['operational_status'];
}

const EquipmentScanner: React.FC<EquipmentScannerProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<'scan' | 'status_selection' | 'action_selection'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EquipmentScanResult | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | null>(null);
  const [selectedAction, setSelectedAction] = useState<WorkingAction | MaintenanceAction | null>(null);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEquipment();
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const loadEquipment = () => {
    try {
      const loadedEquipment = DataStorage.loadEquipment();
      console.log('Loaded equipment from storage:', loadedEquipment);
      
      // If no equipment exists, create some test equipment
      if (loadedEquipment.length === 0) {
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
        
        DataStorage.saveEquipment(testEquipment);
        setEquipment(testEquipment);
        console.log('Test equipment created:', testEquipment);
      } else {
        setEquipment(loadedEquipment);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('Failed to load equipment data');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setIsScanning(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'environment'
        }
      });

      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          await handleScanResult(result.data);
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
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
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
    try {
      console.log('QR Data received:', qrData);
      const parsed = await parseQRCode(qrData);
      console.log('Parsed QR code:', parsed);
      
      if (parsed.type !== 'equipment') {
        setError('Invalid equipment QR code. Please scan an equipment QR code.');
        return;
      }

      console.log('Available equipment:', equipment);
      let foundEquipment = equipment.find(eq => 
        eq.custom_equipment_id === parsed.id || eq.id === parsed.id
      );
      console.log('Found equipment:', foundEquipment);
      
      // If equipment not found locally and Supabase is configured, try loading from Supabase
      if (!foundEquipment) {
        try {
          const useSupabase = await AuthManager.useSupabase();
          if (useSupabase) {
            setError('Loading equipment data from server...');
            const supabaseEquipment = await SupabaseDataService.getEquipment();
            console.log('Supabase equipment:', supabaseEquipment);
            foundEquipment = supabaseEquipment.find(eq => 
              eq.custom_equipment_id === parsed.id || eq.id === parsed.id
            );
            
            if (foundEquipment) {
              setEquipment(prev => {
                const updated = [...prev, foundEquipment!];
                return updated;
              });
              setError(''); // Clear loading message
            }
          }
        } catch (error) {
          console.error('Failed to load equipment from Supabase:', error);
          setError('Failed to load equipment from server.');
          return;
        }
      }
      
      if (!foundEquipment) {
        setError(`Equipment with ID ${parsed.id} not found in system. Please register this equipment first.`);
        return;
      }

      console.log('Setting scan result with equipment:', foundEquipment);
      setScanResult({
        equipment: foundEquipment,
        currentStatus: foundEquipment.status,
        operationalStatus: foundEquipment.operational_status || 'working'
      });
      setCurrentStep('status_selection');
      setError('');
    } catch (error) {
      console.error('Error handling scan result:', error);
      setError('Failed to process QR code. Please try again.');
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

  const handleStatusSelection = (status: EquipmentStatus) => {
    setSelectedStatus(status);
    setCurrentStep('action_selection');
  };

  const handleActionSelection = async (action: WorkingAction | MaintenanceAction) => {
    setSelectedAction(action);
    
    if (selectedStatus === 'working') {
      // Handle working equipment actions
      await handleWorkingEquipmentAction(action as WorkingAction);
    } else {
      // Handle not working equipment actions
      await handleNotWorkingEquipmentAction(action as MaintenanceAction);
    }
  };

  const handleWorkingEquipmentAction = async (action: WorkingAction) => {
    if (!scanResult) return;

    setIsProcessing(true);
    setError('');

    try {
      const timestamp = new Date().toISOString();
      let notes = '';

      if (action === 'start_use') {
        notes = 'Equipment usage started via QR scan';
        
        // Create equipment log
        await logManager.createEquipmentLog(
          scanResult.equipment,
          'start-use',
          scanResult.equipment.site || 'Unknown',
          scanResult.equipment.status || 'active',
          notes
        );
      } else if (action === 'standby') {
        notes = 'Equipment set to standby mode';
      }

      showNotification('success', `Equipment ${action.replace('_', ' ')} recorded successfully!`);
      resetScanner();
    } catch (error: any) {
      console.error('Error handling working equipment action:', error);
      setError(`Failed to record ${action.replace('_', ' ')}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotWorkingEquipmentAction = async (action: MaintenanceAction) => {
    if (!scanResult) return;

    setIsProcessing(true);
    setError('');

    try {
      const timestamp = new Date().toISOString();
      let notes = '';

      if (action === 'need_repair') {
        notes = 'Equipment needs repair - maintenance request created';
      } else if (action === 'regular_service') {
        notes = 'Equipment scheduled for regular service';
      }

      // Create equipment log for maintenance
      await logManager.createEquipmentLog(
        scanResult.equipment,
        'stop-use',
        scanResult.equipment.site || 'Unknown',
        'maintenance',
        notes
      );

      showNotification('success', `Maintenance request for ${action.replace('_', ' ')} created successfully!`);
      resetScanner();
    } catch (error: any) {
      console.error('Error handling maintenance action:', error);
      setError(`Failed to create maintenance request. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setCurrentStep('scan');
    setScanResult(null);
    setSelectedStatus(null);
    setSelectedAction(null);
    setError('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
      case 'in_use':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'standby':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not_working':
      case 'under_repair':
      case 'under_service':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Wrench className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Equipment Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {notification && (
            <div className={`mb-4 p-4 rounded-lg ${
              notification.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {notification.message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Scan Step */}
          {currentStep === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Equipment QR Code</h3>
                <p className="text-gray-600">Position the QR code within the camera view</p>
              </div>

              {/* Camera View */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                {!isScanning ? (
                  <div className="aspect-video flex items-center justify-center">
                    <button
                      onClick={startScanning}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Start Camera</span>
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    className="w-full aspect-video object-cover"
                  />
                )}
              </div>

              {/* File Upload */}
              <div className="text-center space-y-3">
                <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>Or upload QR code image</span>
                </label>
                
                {/* Test Button for Debugging */}
                <button
                  onClick={() => handleScanResult('EQP-TEST-001')}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <span>Test Equipment Scan (EQP-TEST-001)</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Selection Step */}
          {currentStep === 'status_selection' && scanResult && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Status</h3>
                <p className="text-gray-600">Select the current operational status</p>
              </div>

              {/* Equipment Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{scanResult.equipment.name}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Type:</span> {scanResult.equipment.type}</div>
                  <div><span className="font-medium">Model:</span> {scanResult.equipment.model}</div>
                  <div><span className="font-medium">ID:</span> {scanResult.equipment.custom_equipment_id || scanResult.equipment.id}</div>
                  <div><span className="font-medium">Site:</span> {scanResult.equipment.site}</div>
                </div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(scanResult.operationalStatus)}`}>
                    {scanResult.operationalStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Status Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStatusSelection('working')}
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-700">Working</span>
                </button>
                <button
                  onClick={() => handleStatusSelection('not_working')}
                  className="flex items-center justify-center space-x-2 p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <span className="font-medium text-red-700">Not Working</span>
                </button>
              </div>

              <button
                onClick={resetScanner}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Scan Another Equipment</span>
              </button>
            </div>
          )}

          {/* Action Selection Step */}
          {currentStep === 'action_selection' && selectedStatus && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedStatus === 'working' ? 'Working Equipment Actions' : 'Maintenance Actions'}
                </h3>
                <p className="text-gray-600">Select the appropriate action</p>
              </div>

              {selectedStatus === 'working' ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleActionSelection('start_use')}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <Play className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-blue-700">Start Use</span>
                  </button>
                  <button
                    onClick={() => handleActionSelection('standby')}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors disabled:opacity-50"
                  >
                    <Pause className="w-6 h-6 text-yellow-600" />
                    <span className="font-medium text-yellow-700">Standby</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleActionSelection('need_repair')}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Hammer className="w-6 h-6 text-red-600" />
                    <span className="font-medium text-red-700">Need Repair</span>
                  </button>
                  <button
                    onClick={() => handleActionSelection('regular_service')}
                    disabled={isProcessing}
                    className="flex items-center justify-center space-x-2 p-4 border-2 border-orange-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    <Settings className="w-6 h-6 text-orange-600" />
                    <span className="font-medium text-orange-700">Regular Service</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setCurrentStep('status_selection')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Status Selection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentScanner; 