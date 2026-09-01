import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';
import QrScanner from 'qr-scanner';
import {
  Camera,
  Upload,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  RotateCcw,
  Scan,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { parseQRCode } from '../../../utils/qrCodeUtils';

interface InventoryOperationsPanelProps {
  onClose?: () => void;
  onOperationComplete?: () => void;
  defaultOperation?: 'in' | 'out' | 'transfer' | null;
}

type OperationType = 'in' | 'out' | 'transfer' | null;

interface InventoryOperation {
  material: MaterialItem;
  operation: OperationType;
  quantity: number;
  notes: string;
  fromLocation: string;
  toLocation: string;
}

const InventoryOperationsPanel: React.FC<InventoryOperationsPanelProps> = ({ onClose, onOperationComplete, defaultOperation }) => {
  const { items, warehouses, refreshData } = useInventory();
  const [currentStep, setCurrentStep] = useState<'select' | 'scan' | 'process'>(defaultOperation ? 'scan' : 'select');
  const [selectedOperation, setSelectedOperation] = useState<OperationType>(defaultOperation || null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<MaterialItem | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [operation, setOperation] = useState<InventoryOperation>({
    material: {} as MaterialItem,
    operation: null,
    quantity: 0,
    notes: '',
    fromLocation: '',
    toLocation: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setMaterials(items);
  }, [items]);

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOperationSelect = (operationType: OperationType) => {
    setSelectedOperation(operationType);
    setCurrentStep('scan');
    setError('');
  };

  const startScanning = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      setError('');
      setIsScanning(true);
      await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640, min: 320 }, height: { ideal: 480, min: 240 }, facingMode: 'environment' }
      });
      qrScannerRef.current = new QrScanner(
        videoRef.current!,
        async (result) => { await handleScanResult(result.data); stopScanning(); },
        { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: 'environment' }
      );
      await qrScannerRef.current.start();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') setError('Camera permission denied.');
      else if (err instanceof Error && err.name === 'NotFoundError') setError('No camera found.');
      else setError('Failed to start camera.');
      setIsScanning(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      const parsed = parseQRCode(qrData);
      if (parsed.type !== 'material') {
        setError('Invalid material QR code. Please scan a material QR code.');
        return;
      }
      let material = materials.find(mat => mat.id === parsed.id);
      if (!material) {
        const inventoryMaterial = InventoryStorageService.getInstance().getItemByQR(qrData);
        if (inventoryMaterial) material = inventoryMaterial;
      }
      if (!material) {
        setError('Material not found. Please register this material first.');
        return;
      }
      if (selectedOperation === 'out' && material.quantity <= 0) {
        setError(`Material "${material.name}" is out of stock.`);
        return;
      }
      setScanResult(material);
      setOperation({ material, operation: selectedOperation, quantity: 0, notes: '', fromLocation: '', toLocation: '' });
      setCurrentStep('process');
      setError('');
    } catch {
      setError('Invalid QR code format');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      QrScanner.scanImage(file)
        .then(async result => await handleScanResult(result))
        .catch(() => setError('No QR code found in image'));
    }
  };

  const validateOperation = (): string | null => {
    if (operation.quantity <= 0) return 'Quantity must be greater than 0';
    if (selectedOperation === 'out') {
      const latest = InventoryStorageService.getInstance().getItemById(operation.material.id);
      const availableQty = latest ? latest.quantity : 0;
      if (availableQty < operation.quantity) {
        return `Cannot remove ${operation.quantity} ${operation.material.unit}. Only ${availableQty} available.`;
      }
    }
    if (selectedOperation === 'transfer') {
      if (!operation.fromLocation) return 'Please select source warehouse';
      if (!operation.toLocation) return 'Please select destination warehouse';
      if (operation.fromLocation === operation.toLocation) return 'Source and destination must be different';
    }
    return null;
  };

  const confirmOperation = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const validationError = validateOperation();
      if (validationError) { setError(validationError); setIsProcessing(false); return; }

      const previousStock = operation.material.quantity;
      let newStock = previousStock;
      if (selectedOperation === 'in') newStock = previousStock + operation.quantity;
      else if (selectedOperation === 'out') newStock = previousStock - operation.quantity;
      else if (selectedOperation === 'transfer') newStock = previousStock - operation.quantity;

      const inventoryService = InventoryStorageService.getInstance();
      const updatedMaterial = inventoryService.updateItem(operation.material.id, {
        quantity: newStock,
        status: newStock === 0 ? 'out_of_stock' : newStock <= (operation.material.reorderLevel || 0) ? 'low_stock' : 'in_stock'
      });
      if (!updatedMaterial) throw new Error('Failed to update material');

      inventoryService.addMovement({
        itemId: operation.material.id,
        itemName: operation.material.name,
        sku: operation.material.sku,
        type: selectedOperation === 'in' ? 'received' : selectedOperation === 'out' ? 'issued' : 'transferred',
        quantity: Math.abs(operation.quantity),
        fromLocation: selectedOperation === 'transfer' ? operation.fromLocation : operation.fromLocation || 'WAREHOUSE',
        toLocation: selectedOperation === 'transfer' ? operation.toLocation : (selectedOperation === 'in' ? 'WAREHOUSE' : 'ISSUED'),
        reference: selectedOperation === 'in' ? 'REC-' + Date.now().toString().slice(-6) :
                   selectedOperation === 'out' ? 'ISS-' + Date.now().toString().slice(-6) :
                   'TRF-' + Date.now().toString().slice(-6),
        performedBy: 'Current User',
        timestamp: new Date().toISOString(),
        notes: operation.notes
      });

      setMaterials(prev => prev.map(m => m.id === operation.material.id ? updatedMaterial : m));
      refreshData();

      const opLabel = selectedOperation === 'in' ? 'Added' : selectedOperation === 'out' ? 'Removed' : 'Transferred';
      const prep = selectedOperation === 'in' ? 'to' : selectedOperation === 'out' ? 'from' : `from ${operation.fromLocation} to ${operation.toLocation}`;
      showNotification('success', `${opLabel} ${operation.quantity} ${operation.material.unit} ${prep} ${operation.material.name}. New stock: ${newStock}.`);
      setIsCompleted(true);
      setIsSuccess(true);
      if (onOperationComplete) setTimeout(onOperationComplete, 1500);
      if (onClose) setTimeout(() => onClose(), 3000);
    } catch (err) {
      setError(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetToSelection = () => {
    setCurrentStep('select');
    setSelectedOperation(null);
    setScanResult(null);
    setOperation({ material: {} as MaterialItem, operation: null, quantity: 0, notes: '', fromLocation: '', toLocation: '' });
    setError('');
    stopScanning();
  };

  const goBackToScan = () => {
    setCurrentStep('scan');
    setScanResult(null);
    setOperation({ material: {} as MaterialItem, operation: null, quantity: 0, notes: '', fromLocation: '', toLocation: '' });
    setError('');
  };

  const formatMaterialCode = (id: string) => {
    const match = id.match(/^([A-Z]+)-(.+)$/);
    if (match) return `${match[1]}-${match[2].padStart(4, '0')}`;
    return id;
  };

  if (isSuccess && isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-900 mb-2">Operation Complete</h3>
            <p className="text-gray-600">Closing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Inventory Operations</h2>
          </div>
          <button onClick={onClose || resetToSelection} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border flex items-center space-x-3 ${
            notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          {currentStep === 'select' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Operation Type</h3>
                <p className="text-gray-600">Please select Material IN, OUT, or Transfer to proceed.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={() => handleOperationSelect('in')} className="flex flex-col items-center p-8 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <ArrowUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Material IN</h4>
                  <p className="text-gray-600 text-center">Add materials to inventory</p>
                </button>
                <button onClick={() => handleOperationSelect('out')} className="flex flex-col items-center p-8 border-2 border-red-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <ArrowDown className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Material OUT</h4>
                  <p className="text-gray-600 text-center">Remove materials from inventory</p>
                </button>
                <button onClick={() => handleOperationSelect('transfer')} className="flex flex-col items-center p-8 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <RotateCcw className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Transfer</h4>
                  <p className="text-gray-600 text-center">Move between warehouses</p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 'scan' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Scan Material QR Code - {selectedOperation === 'in' ? 'IN' : selectedOperation === 'out' ? 'OUT' : 'Transfer'}
                  </h3>
                  <p className="text-gray-600">Scan the QR code on the material package</p>
                </div>
                <button onClick={resetToSelection} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Back
                </button>
              </div>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              )}
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <video ref={videoRef} className="w-full h-64 object-cover" style={{ display: isScanning ? 'block' : 'none' }} />
                {!isScanning && (
                  <div className="h-64 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Material QR Scanner</p>
                      <p className="text-sm text-gray-500">Camera preview will appear here</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={isScanning ? stopScanning : startScanning} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium ${
                  isScanning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}>
                  <Camera className="w-5 h-5" />
                  <span>{isScanning ? 'Stop' : 'Start'} Scanner</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {currentStep === 'process' && scanResult && !isSuccess && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedOperation === 'in' ? 'IN' : selectedOperation === 'out' ? 'OUT' : 'Transfer'} - {scanResult.name}
                </h3>
                <button onClick={goBackToScan} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Scan Different
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Code:</span> {formatMaterialCode(scanResult.id)}</div>
                  <div><span className="font-medium">Name:</span> {scanResult.name}</div>
                  <div><span className="font-medium">Category:</span> {scanResult.category}</div>
                  <div><span className="font-medium">Unit:</span> {scanResult.unit}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Current Stock: </span>
                    <span className={`ml-2 font-bold ${
                      scanResult.quantity <= 0 ? 'text-red-600' : scanResult.quantity <= (scanResult.reorderLevel || 0) ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {scanResult.quantity} {scanResult.unit}
                    </span>
                  </div>
                </div>
              </div>

              {selectedOperation === 'out' && scanResult.quantity <= 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Material is out of stock</span>
                  </div>
                </div>
              )}

              {!(selectedOperation === 'out' && scanResult.quantity <= 0) && (
                <div className="space-y-4">
                  {selectedOperation === 'transfer' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse *</label>
                        <select value={operation.fromLocation} onChange={(e) => setOperation({...operation, fromLocation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                          <option value="">Select source warehouse</option>
                          {warehouses.map(wh => (
                            <option key={wh.id} value={wh.name}>{wh.code} - {wh.name} ({wh.city})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse *</label>
                        <select value={operation.toLocation} onChange={(e) => setOperation({...operation, toLocation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required>
                          <option value="">Select destination warehouse</option>
                          {warehouses.map(wh => (
                            <option key={wh.id} value={wh.name}>{wh.code} - {wh.name} ({wh.city})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity to {selectedOperation === 'in' ? 'Add' : selectedOperation === 'out' ? 'Remove' : 'Transfer'} ({scanResult.unit}) *
                    </label>
                    <input type="number" min="1" max={selectedOperation === 'out' || selectedOperation === 'transfer' ? scanResult.quantity : undefined}
                      value={operation.quantity} onChange={(e) => setOperation({...operation, quantity: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter quantity in ${scanResult.unit}`} required />
                    {selectedOperation !== 'in' && scanResult.quantity > 0 && (
                      <p className="text-sm text-gray-500 mt-1">Maximum available: {scanResult.quantity} {scanResult.unit}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea value={operation.notes} onChange={(e) => setOperation({...operation, notes: e.target.value})}
                      rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional notes..." />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
                  )}

                  {operation.quantity > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>Current Stock: {scanResult.quantity} {scanResult.unit}</div>
                        {selectedOperation === 'transfer' && (
                          <div>From: {operation.fromLocation || '—'} → To: {operation.toLocation || '—'}</div>
                        )}
                        <div>
                          {selectedOperation === 'in' ? 'Adding' : selectedOperation === 'out' ? 'Removing' : 'Transferring'}: {operation.quantity} {scanResult.unit}
                        </div>
                        <div className="font-medium">
                          New Stock: {selectedOperation === 'in' ? scanResult.quantity + operation.quantity : scanResult.quantity - operation.quantity} {scanResult.unit}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button onClick={confirmOperation} disabled={isProcessing || !operation.quantity || operation.quantity <= 0 || isCompleted}
                      className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium">
                      {isProcessing ? 'Processing...' : 
                        selectedOperation === 'in' ? 'Confirm Material IN' : 
                        selectedOperation === 'out' ? 'Confirm Material OUT' : 'Confirm Transfer'}
                    </button>
                    <button onClick={resetToSelection} className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { InventoryOperationsPanel };
export default InventoryOperationsPanel;

