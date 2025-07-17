import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { 
  Camera, 
  Upload, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Minus,
  X,
  RotateCcw,
  Scan,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { parseQRCode } from '../../utils/qrCodeUtils';
import { DataStorage } from '../../utils/dataStorage';
import { Material, MaterialLog } from '../../types';
import { OfflineDataManager } from '../../utils/offlineDataManager';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseDataService } from '../../utils/supabaseDataService';
import { LogManager } from '../../utils/logManager';
import { OfflineSyncManager } from '../../utils/offlineSync';

interface MaterialScannerProps {
  onClose: () => void;
}

type OperationType = 'in' | 'out' | null;

interface MaterialOperation {
  material: Material;
  operation: OperationType;
  quantity: number;
  notes: string;
}

const MaterialScanner: React.FC<MaterialScannerProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'scan' | 'process'>('select');
  const [selectedOperation, setSelectedOperation] = useState<OperationType>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Material | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string>('');
  const [operation, setOperation] = useState<MaterialOperation>({
    material: {} as Material,
    operation: null,
    quantity: 0,
    notes: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMaterials();
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const loadMaterials = () => {
    const loadedMaterials = DataStorage.loadMaterials();
    setMaterials(loadedMaterials);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOperationSelect = (operationType: OperationType) => {
    setSelectedOperation(operationType);
    setCurrentStep('scan');
    setError('');
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
    const parsed = parseQRCode(qrData);
    
    if (parsed.type !== 'material') {
      setError('Invalid material QR code. Please scan a material QR code.');
      return;
    }

    let material = materials.find(mat => mat.id === parsed.id);
    
    // If material not found locally and Supabase is configured, try loading from Supabase
    if (!material && AuthManager.useSupabase()) {
      try {
        setError('Loading material data from server...');
        const supabaseMaterials = await SupabaseDataService.getMaterials();
        material = supabaseMaterials.find(mat => mat.id === parsed.id);
        
        if (material) {
          // Update local materials list
          setMaterials(prev => {
            const updated = [...prev, material!];
            return updated;
          });
          setError(''); // Clear loading message
        }
      } catch (error) {
        console.error('Failed to load material from Supabase:', error);
        setError('Failed to load material from server.');
        return;
      }
    }
    
    if (!material) {
      setError(`Material with ID ${parsed.id} not found in system. Please register this material first.`);
      return;
    }

    // Check for Material OUT operation if material is out of stock
    if (selectedOperation === 'out' && material.quantity <= 0) {
      setError(`Material "${material.name}" is not in stock. Current quantity: ${material.quantity} ${material.unit}`);
      return;
    }

    setScanResult(material);
    setOperation({
      material,
      operation: selectedOperation,
      quantity: 0,
      notes: ''
    });
    setCurrentStep('process');
    setError('');
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

  const validateOperation = async (): Promise<string | null> => {
    if (operation.quantity <= 0) {
      return 'Quantity must be greater than 0';
    }

    // Always fetch the latest available quantity from the source before Material OUT
    if (selectedOperation === 'out') {
      let latestMaterial: Material | undefined;
      if (AuthManager.useSupabase()) {
        try {
          const supabaseMaterials = await SupabaseDataService.getMaterials();
          latestMaterial = supabaseMaterials.find(m => m.id === operation.material.id);
        } catch (e) {
          return 'Failed to fetch latest material data from server.';
        }
      } else {
        const localMaterials = DataStorage.loadMaterials();
        latestMaterial = localMaterials.find(m => m.id === operation.material.id);
      }
      const availableQty = latestMaterial ? latestMaterial.quantity : 0;
      if (availableQty < operation.quantity) {
        return `Cannot remove ${operation.quantity} ${operation.material.unit}. Only ${availableQty} ${operation.material.unit} available in stock.`;
      }
    }

    return null;
  };

  const confirmOperation = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const validationError = await validateOperation();
      if (validationError) {
        setError(validationError);
        setIsProcessing(false);
        return;
      }

      // Ensure we're in Supabase mode for proper sync
      if (!AuthManager.useSupabase()) {
        console.log('Switching to Supabase mode for material operations...');
        AuthManager.setUseSupabase(true);
      }

      // Check authentication
      const isAuthenticated = await AuthManager.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Please log in to Supabase to perform material operations. Material operations require Supabase authentication to sync properly.');
      }

      const currentUser = await AuthManager.getCurrentUser();
      if (!currentUser) {
        throw new Error('User authentication required');
      }

      console.log('Material operation - User authenticated:', currentUser.username || currentUser.email);
      console.log('Material operation - Supabase mode:', AuthManager.useSupabase());

      const previousStock = operation.material.quantity;
      const newStock = selectedOperation === 'in' 
        ? previousStock + operation.quantity
        : previousStock - operation.quantity;

      // Update material quantity and status
      const updatedMaterial = {
        ...operation.material,
        quantity: newStock,
        status: newStock === 0 ? 'out-of-stock' as const : 
                newStock < 50 ? 'low-stock' as const : 
                'available' as const,
        lastUpdated: new Date().toISOString()
      };

      // Create material log using LogManager
      const logManager = LogManager.getInstance();
      const logNotes = `Material ${selectedOperation?.toUpperCase()} operation${operation.notes ? ` - ${operation.notes}` : ''} | Previous: ${previousStock}, New: ${newStock} | User: ${currentUser.name}`;
      
      console.log('Updating material:', updatedMaterial.id, 'from', previousStock, 'to', newStock);
      
      // Update material using offline data manager
      await OfflineDataManager.updateMaterial(updatedMaterial);
      console.log('Material updated in offline data manager');
      
      // Create material log
      await logManager.createMaterialLog(
        operation.material,
        selectedOperation === 'in' ? 'material-in' : 'material-out',
        operation.quantity,
        operation.material.site,
        updatedMaterial.status,
        logNotes
      );
      console.log('Material log created');

      // Add a small delay to ensure operations are fully queued before forcing sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force immediate sync to Supabase
      const syncManager = OfflineSyncManager.getInstance();
      if (syncManager) {
        console.log('Forcing immediate sync to Supabase...');
        let retries = 0;
        let syncSuccess = false;
        while (retries < 3 && !syncSuccess) {
          try {
            await syncManager.processSyncQueue();
            console.log('Sync completed successfully');
            syncSuccess = true;
          } catch (syncError) {
            console.error(`Sync attempt ${retries + 1} failed:`, syncError);
            retries++;
            if (retries < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
          }
        }
        if (!syncSuccess) {
          showNotification('error', 'Operation successful locally, but sync to server failed after 3 attempts. Please try manual sync later.');
        }
      }

      // Update local state
      setMaterials(prev => prev.map(m => 
        m.id === operation.material.id ? updatedMaterial : m
      ));

      showNotification('success', 
        `Successfully ${selectedOperation === 'in' ? 'added' : 'removed'} ${operation.quantity} ${operation.material.unit} ${selectedOperation === 'in' ? 'to' : 'from'} ${operation.material.name}. New stock: ${newStock} ${operation.material.unit}. Syncing to database...`
      );
      setIsCompleted(true);
      setIsSuccess(true);

      // Close modal after showing notification
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error('Failed to update inventory:', error);
      setError(`Failed to update inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToSelection = () => {
    setCurrentStep('select');
    setSelectedOperation(null);
    setScanResult(null);
    setOperation({
      material: {} as Material,
      operation: null,
      quantity: 0,
      notes: ''
    });
    setError('');
    stopScanning();
  };

  const goBackToScan = () => {
    setCurrentStep('scan');
    setScanResult(null);
    setOperation({
      material: {} as Material,
      operation: selectedOperation,
      quantity: 0,
      notes: ''
    });
    setError('');
  };

  const formatMaterialCode = (id: string) => {
    const match = id.match(/^([A-Z]+)-(.+)$/);
    if (match) {
      return `${match[1]}-${match[2].padStart(4, '0')}`;
    }
    return id;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Material Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Step 1: Operation Selection */}
          {currentStep === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Operation Type</h3>
                <p className="text-gray-600">Please select Material IN or Material OUT to proceed.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleOperationSelect('in')}
                  className="flex flex-col items-center p-8 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <ArrowUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Material IN</h4>
                  <p className="text-gray-600 text-center">Add materials to inventory</p>
                  <ul className="text-sm text-gray-500 mt-3 space-y-1">
                    <li>• Scan material QR code</li>
                    <li>• Enter quantity to add</li>
                    <li>• Update inventory stock</li>
                  </ul>
                </button>

                <button
                  onClick={() => handleOperationSelect('out')}
                  className="flex flex-col items-center p-8 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                    <ArrowDown className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Material OUT</h4>
                  <p className="text-gray-600 text-center">Remove materials from inventory</p>
                  <ul className="text-sm text-gray-500 mt-3 space-y-1">
                    <li>• Scan material QR code</li>
                    <li>• Check available stock</li>
                    <li>• Enter quantity to remove</li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: QR Scanning */}
          {currentStep === 'scan' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Scan Material QR Code - {selectedOperation === 'in' ? 'Material IN' : 'Material OUT'}
                  </h3>
                  <p className="text-gray-600">Scan the QR code on the material package</p>
                </div>
                <button
                  onClick={resetToSelection}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Back to Selection
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}

              {/* Camera Preview */}
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                
                {!isScanning && (
                  <div className="h-64 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Material QR Scanner</p>
                      <p className="text-sm text-gray-500">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={isScanning ? stopScanning : startScanning}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isScanning
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>{isScanning ? 'Stop Scanner' : 'Start Scanner'}</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
          )}

          {/* Step 3: Process Operation */}
          {currentStep === 'process' && scanResult && (
            <div className="space-y-6">
              {isSuccess ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900 mb-2">Operation Successful</h3>
                  <p className="text-gray-600">Closing in 3 seconds...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedOperation === 'in' ? 'Material IN' : 'Material OUT'} - {scanResult.name}
                    </h3>
                    <button
                      onClick={goBackToScan}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Scan Different Material
                    </button>
                  </div>

                  {/* Material Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="font-medium">Material Code:</span> {formatMaterialCode(scanResult.id)}</div>
                      <div><span className="font-medium">Material Name:</span> {scanResult.name}</div>
                      <div><span className="font-medium">Category:</span> {scanResult.type}</div>
                      <div><span className="font-medium">Unit:</span> {scanResult.unit}</div>
                      <div className="col-span-2">
                        <span className="font-medium">Current Stock:</span> 
                        <span className={`ml-2 font-bold ${
                          scanResult.quantity <= 0 ? 'text-red-600' : 
                          scanResult.quantity < 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {scanResult.quantity} {scanResult.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Material OUT - Stock Check */}
                  {selectedOperation === 'out' && scanResult.quantity <= 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">Material is not in stock</span>
                      </div>
                      <p className="text-red-700 mt-2">
                        Current quantity: {scanResult.quantity} {scanResult.unit}. Cannot proceed with Material OUT operation.
                      </p>
                    </div>
                  )}

                  {/* Operation Form */}
                  {!(selectedOperation === 'out' && scanResult.quantity <= 0) && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity to {selectedOperation === 'in' ? 'Add' : 'Remove'} ({scanResult.unit}) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedOperation === 'out' ? scanResult.quantity : undefined}
                          value={operation.quantity}
                          onChange={(e) => setOperation({...operation, quantity: parseInt(e.target.value) || 0})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder={`Enter quantity in ${scanResult.unit}`}
                          required
                        />
                        {selectedOperation === 'out' && (
                          <p className="text-sm text-gray-500 mt-1">
                            Maximum available: {scanResult.quantity} {scanResult.unit}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                          value={operation.notes}
                          onChange={(e) => setOperation({...operation, notes: e.target.value})}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Optional notes about this transaction..."
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                          {error}
                        </div>
                      )}

                      {/* Summary */}
                      {operation.quantity > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Transaction Summary</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div>Current Stock: {scanResult.quantity} {scanResult.unit}</div>
                            <div>
                              {selectedOperation === 'in' ? 'Adding' : 'Removing'}: {operation.quantity} {scanResult.unit}
                            </div>
                            <div className="font-medium">
                              New Stock: {selectedOperation === 'in' 
                                ? scanResult.quantity + operation.quantity 
                                : scanResult.quantity - operation.quantity} {scanResult.unit}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={confirmOperation}
                          disabled={isProcessing || !operation.quantity || operation.quantity <= 0 || isCompleted}
                          className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {isProcessing ? 'Processing...' : isCompleted ? 'Completed' : `Confirm ${selectedOperation === 'in' ? 'Material IN' : 'Material OUT'}`}
                        </button>
                        <button
                          onClick={resetToSelection}
                          className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialScanner;