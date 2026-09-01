import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { REGIONS, Warehouse, MaterialItem } from '../data/ksaData';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const InterWarehouseTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get('materialId');
  const preselectedWarehouseId = searchParams.get('warehouseId');

  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [sourceWarehouse, setSourceWarehouse] = useState<Warehouse | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<Warehouse | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const items = inventoryStorage.getItems();
    
    if (materialId) {
      const material = items.find(m => m.id === materialId);
      if (material) {
        setSelectedMaterial(material);
        const source = warehouses.find(w => w.id === material.warehouseId);
        setSourceWarehouse(source || null);
      }
    }

    if (preselectedWarehouseId) {
      const destination = warehouses.find(w => w.id === preselectedWarehouseId);
      setDestinationWarehouse(destination || null);
    }
  }, [materialId, preselectedWarehouseId, warehouses]);

  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRF-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !sourceWarehouse || !destinationWarehouse) {
      setError('Please select material, source, and destination');
      return;
    }
    if (sourceWarehouse.id === destinationWarehouse.id) {
      setError('Source and destination warehouses cannot be the same');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (quantity > selectedMaterial.quantity) {
      setError(`Insufficient stock. Available: ${selectedMaterial.quantity} ${selectedMaterial.unit}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const reference = generateReference();
      const transferNotes = `Inter-warehouse transfer | Ref: ${reference} | From: ${sourceWarehouse.name} | To: ${destinationWarehouse.name} | Date: ${transferDate} | ${notes}`;
      
      const now = new Date();
      const materialLogOut = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: sourceWarehouse.name,
        status: selectedMaterial.status,
        notes: transferNotes,
        oldId: selectedMaterial.id
      };

      const materialLogIn = {
        ...materialLogOut,
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        action: 'material-in' as const,
        site: destinationWarehouse.name
      };

      await OfflineDataManager.createMaterialLog(materialLogOut);
      await OfflineDataManager.createMaterialLog(materialLogIn);

      const updatedMaterial = {
        ...selectedMaterial,
        warehouseId: destinationWarehouse.id,
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Transfer completed: ${quantity} ${selectedMaterial.unit} of ${selectedMaterial.name} moved from ${sourceWarehouse.name} to ${destinationWarehouse.name}`);
      setTimeout(() => {
        navigate('/scan');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/scan')}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inter Warehouse Transfer</h1>
                <p className="text-sm text-gray-500">Move materials between warehouses</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {success && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={selectedMaterial?.id || ''}
                  onChange={e => {
                    const item = inventoryStorage.getItemById(e.target.value);
                    if (item) {
                      setSelectedMaterial(item);
                      const source = warehouses.find(w => w.id === item.warehouseId);
                      setSourceWarehouse(source || null);
                    } else {
                      setSelectedMaterial(null);
                      setSourceWarehouse(null);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select material</option>
                  {inventoryStorage.getItems().map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku}) - Stock: {m.quantity} {m.unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
                  <select
                    value={sourceWarehouse?.id || ''}
                    onChange={e => {
                      const wh = warehouses.find(w => w.id === e.target.value);
                      setSourceWarehouse(wh || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
                  <select
                    value={destinationWarehouse?.id || ''}
                    onChange={e => {
                      const wh = warehouses.find(w => w.id === e.target.value);
                      setDestinationWarehouse(wh || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select destination warehouse</option>
                    {warehouses.filter(w => w.id !== sourceWarehouse?.id).map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {selectedMaterial && (
                    <p className="text-xs text-gray-500 mt-1">Available: {selectedMaterial.quantity} {selectedMaterial.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={e => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={generateReference()}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated reference number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Transfer notes, reason, or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/scan')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedMaterial || !sourceWarehouse || !destinationWarehouse}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Complete Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterWarehouseTransfer;

