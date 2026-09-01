import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const CycleCount: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [countedQuantity, setCountedQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(inventoryStorage.getItems());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }
    if (countedQuantity < 0) {
      setError('Counted quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const variance = countedQuantity - selectedMaterial.quantity;
      const varianceNotes = `Cycle Count | System: ${selectedMaterial.quantity} | Counted: ${countedQuantity} | Variance: ${variance} | Reason: ${reason || 'N/A'}`;
      
      const now = new Date();
      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity: Math.abs(variance),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: selectedMaterial.warehouseId || 'Unknown',
        status: selectedMaterial.status,
        notes: varianceNotes,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      const updatedMaterial = {
        ...selectedMaterial,
        quantity: countedQuantity,
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Cycle count completed for ${selectedMaterial.name}. Variance: ${variance > 0 ? '+' : ''}${variance}`);
      setTimeout(() => {
        setSelectedMaterial(null);
        setCountedQuantity(0);
        setReason('');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Cycle count failed. Please try again.');
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
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Cycle Count</h1>
                <p className="text-sm text-gray-500">Physical stock count and adjustment</p>
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
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Material</label>
                <select value={selectedMaterial?.id || ''} onChange={e => {
                  const item = inventoryStorage.getItemById(e.target.value);
                  setSelectedMaterial(item || null);
                  if (item) setCountedQuantity(item.quantity);
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku}) - System: {m.quantity} {m.unit}</option>
                  ))}
                </select>
              </div>

              {selectedMaterial && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Material:</span> {selectedMaterial.name}</div>
                    <div><span className="font-medium">SKU:</span> {selectedMaterial.sku}</div>
                    <div><span className="font-medium">System Quantity:</span> {selectedMaterial.quantity} {selectedMaterial.unit}</div>
                    <div><span className="font-medium">Unit:</span> {selectedMaterial.unit}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Counted Quantity *</label>
                <input type="number" min="0" value={countedQuantity} onChange={e => setCountedQuantity(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                {selectedMaterial && countedQuantity !== selectedMaterial.quantity && (
                  <div className={`mt-2 flex items-center gap-2 ${countedQuantity > selectedMaterial.quantity ? 'text-green-600' : 'text-red-600'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      Variance: {countedQuantity > selectedMaterial.quantity ? '+' : ''}{countedQuantity - selectedMaterial.quantity} {selectedMaterial.unit}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Variance (if any)</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select reason (optional)</option>
                  <option value="damaged">Damaged / Spoiled</option>
                  <option value="theft">Theft / Loss</option>
                  <option value="data-entry">Data Entry Error</option>
                  <option value="found">Found / Unrecorded Stock</option>
                  <option value="expired">Expired</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Submit Count'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CycleCount;

