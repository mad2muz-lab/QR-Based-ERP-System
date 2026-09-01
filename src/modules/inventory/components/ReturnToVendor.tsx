import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X, RotateCcw, FileText, Camera } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const ReturnToVendor: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [reason, setReason] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !warehouse || quantity <= 0) {
      setError('Please select material, warehouse, and quantity');
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
      const returnNotes = `Return to Vendor | Credit Note: ${creditNote || 'N/A'} | Reason: ${reason || 'N/A'} | ${notes} | Photos: ${photos.length}`;
      
      const now = new Date();
      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: warehouse.name,
        status: selectedMaterial.status,
        notes: returnNotes,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      const updatedMaterial = {
        ...selectedMaterial,
        warehouseId: warehouse.id,
        quantity: Math.max(0, selectedMaterial.quantity - quantity),
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Return processed: ${quantity} ${selectedMaterial.unit} of ${selectedMaterial.name} returned to vendor from ${warehouse.name}`);
      setTimeout(() => {
        navigate('/scan');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Return failed. Please try again.');
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
                <h1 className="text-xl font-bold text-gray-900">Return to Vendor</h1>
                <p className="text-sm text-gray-500">Return defective or excess materials</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select value={selectedMaterial?.id || ''} onChange={e => {
                  const item = inventoryStorage.getItemById(e.target.value);
                  setSelectedMaterial(item || null);
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select material</option>
                  {inventoryStorage.getItems().filter(m => m.quantity > 0).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku}) - Stock: {m.quantity} {m.unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                  <select value={warehouse?.id || ''} onChange={e => {
                    const wh = warehouses.find(w => w.id === e.target.value);
                    setWarehouse(wh || null);
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.code}) - {w.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Return *</label>
                  <input type="number" min="1" max={selectedMaterial?.quantity || 0} value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  {selectedMaterial && (
                    <p className="text-xs text-gray-500 mt-1">Available: {selectedMaterial.quantity} {selectedMaterial.unit}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return *</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select reason</option>
                  <option value="defective">Defective / Damaged</option>
                  <option value="excess">Excess Stock</option>
                  <option value="wrong-item">Wrong Item Received</option>
                  <option value="expired">Expired / Near Expiry</option>
                  <option value="quality">Quality Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Note Number</label>
                <input type="text" value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="CN-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Additional details about the return..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach Photos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img src={photo} alt={`Upload ${index + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Camera className="w-4 h-4" />
                  Add Photo
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial || !warehouse || !reason} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Process Return'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReturnToVendor;

