import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X, RotateCcw, Camera } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';
import { SearchableSelect } from '../../../components/common/SearchableSelect';

const ReturnToVendor: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [vendor, setVendor] = useState('');
  const [reason, setReason] = useState('');
  const [rmaNumber, setRmaNumber] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateRMA = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RMA-${year}${month}${day}-${random}`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) {
      setError('Please select a material');
      return;
    }

    if (quantity > selectedMaterial.quantity) {
      setError(`Cannot return more than available quantity (${selectedMaterial.quantity} ${selectedMaterial.unit})`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const rmaNo = rmaNumber || generateRMA();
      const updatedMaterial = {
        ...selectedMaterial,
        quantity: selectedMaterial.quantity - quantity,
        lastIssued: new Date().toISOString().split('T')[0]
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      const now = new Date();
      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialType: selectedMaterial.type,
        action: 'material-out' as const,
        quantity: quantity,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: warehouse?.name || 'Warehouse',
        status: selectedMaterial.status,
        notes: `Return to Vendor (RMA #${rmaNo}) | Vendor: ${vendor || 'Supplier'} | Reason: ${reason}${notes ? ` | ${notes}` : ''}`,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      inventoryStorage.addMovement({
        itemId: selectedMaterial.id,
        itemName: selectedMaterial.name,
        sku: selectedMaterial.sku,
        type: 'issued',
        quantity: quantity,
        fromLocation: warehouse?.name || 'Warehouse',
        toLocation: vendor || 'Vendor',
        reference: rmaNo,
        performedBy: 'Current User',
        timestamp: now.toISOString(),
        notes: `RMA Return: ${reason}`
      });

      setSuccess(`Return to vendor processed successfully! RMA: ${rmaNo}`);
      setTimeout(() => navigate('/scan'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
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
              <SearchableSelect
                label="Material"
                required
                placeholder="Select material..."
                searchPlaceholder="Search available material by name, SKU..."
                value={selectedMaterial?.id || ''}
                onChange={val => {
                  const item = inventoryStorage.getItemById(val);
                  setSelectedMaterial(item || null);
                }}
                options={inventoryStorage.getItems().filter(m => m.quantity > 0).map(m => ({
                  value: m.id,
                  label: m.name,
                  sublabel: m.sku,
                  badge: `${m.quantity} ${m.unit}`
                }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    label="Warehouse"
                    placeholder="Select warehouse..."
                    searchPlaceholder="Search warehouse..."
                    value={warehouse?.id || ''}
                    onChange={val => {
                      const wh = warehouses.find(w => w.id === val);
                      setWarehouse(wh || null);
                    }}
                    options={warehouses.map(w => ({
                      value: w.id,
                      label: w.name,
                      sublabel: `${w.city} • Code: ${w.code}`
                    }))}
                  />
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

