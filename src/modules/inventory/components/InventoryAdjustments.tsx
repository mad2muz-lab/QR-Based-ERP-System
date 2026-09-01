import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X, AlertTriangle, FileText } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const InventoryAdjustments: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = InventoryStorageService.getInstance().getWarehouses();

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(inventoryStorage.getItems());
  }, []);

  const generateReference = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ADJ-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }
    if (quantity <= 0 && adjustmentType !== 'set') {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!reason) {
      setError('Please provide a reason for adjustment');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const ref = reference || generateReference();
      let newQuantity = selectedMaterial.quantity;
      let adjustmentQty = 0;

      if (adjustmentType === 'add') {
        adjustmentQty = quantity;
        newQuantity = selectedMaterial.quantity + quantity;
      } else if (adjustmentType === 'remove') {
        adjustmentQty = -quantity;
        newQuantity = Math.max(0, selectedMaterial.quantity - quantity);
      } else if (adjustmentType === 'set') {
        adjustmentQty = quantity - selectedMaterial.quantity;
        newQuantity = quantity;
      }

      const now = new Date();
      const notes = `Inventory Adjustment | Ref: ${ref} | Type: ${adjustmentType} | Qty: ${adjustmentQty} | Reason: ${reason} | Old: ${selectedMaterial.quantity} | New: ${newQuantity}`;

      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity: Math.abs(adjustmentQty),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: selectedMaterial.warehouseId || 'Unknown',
        status: selectedMaterial.status,
        notes,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      const updatedMaterial = {
        ...selectedMaterial,
        quantity: newQuantity,
        lastUpdated: now.toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Adjustment completed: ${selectedMaterial.name} updated to ${newQuantity} ${selectedMaterial.unit}`);
      setTimeout(() => {
        setSelectedMaterial(null);
        setQuantity(0);
        setReason('');
        setReference('');
        setAdjustmentType('add');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Adjustment failed. Please try again.');
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
                <h1 className="text-xl font-bold text-gray-900">Inventory Adjustment</h1>
                <p className="text-sm text-gray-500">Record stock adjustments with reason and approval</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
                <select value={selectedMaterial?.id || ''} onChange={e => {
                  const item = inventoryStorage.getItemById(e.target.value);
                  setSelectedMaterial(item || null);
                  if (item) setQuantity(item.quantity);
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku}) - Current: {m.quantity} {m.unit}</option>
                  ))}
                </select>
              </div>

              {selectedMaterial && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Material:</span> {selectedMaterial.name}</div>
                    <div><span className="font-medium">SKU:</span> {selectedMaterial.sku}</div>
                    <div><span className="font-medium">Current Qty:</span> {selectedMaterial.quantity} {selectedMaterial.unit}</div>
                    <div><span className="font-medium">Warehouse:</span> {selectedMaterial.warehouseId}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['add', 'remove', 'set'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentType(type)}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                        adjustmentType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {type === 'add' ? 'Add Stock' : type === 'remove' ? 'Remove Stock' : 'Set Qty'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {adjustmentType === 'set' ? 'New Quantity *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {selectedMaterial && adjustmentType === 'remove' && quantity > selectedMaterial.quantity && (
                  <div className="mt-2 flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Cannot remove more than current stock ({selectedMaterial.quantity})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select reason</option>
                  <option value="damaged">Damaged / Spoiled</option>
                  <option value="theft">Theft / Loss</option>
                  <option value="data-entry">Data Entry Error</option>
                  <option value="found">Found / Unrecorded Stock</option>
                  <option value="expired">Expired</option>
                  <option value="obsolescence">Obsolescence</option>
                  <option value="quality-hold">Quality Hold</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Submit Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InventoryAdjustments;
