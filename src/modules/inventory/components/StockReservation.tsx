import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';

const StockReservation: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [reservedQuantity, setReservedQuantity] = useState<number>(0);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
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
    const availableQty = selectedMaterial.quantity - (selectedMaterial.reservedQuantity || 0);
    if (reservedQuantity <= 0 || reservedQuantity > availableQty) {
      setError(`Reserved quantity must be between 1 and ${availableQty}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedMaterial = {
        ...selectedMaterial,
        reservedQuantity: (selectedMaterial.reservedQuantity || 0) + reservedQuantity,
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Reserved ${reservedQuantity} ${selectedMaterial.unit} of ${selectedMaterial.name} for: ${purpose || 'General'}`);
      setTimeout(() => {
        setSelectedMaterial(null);
        setReservedQuantity(0);
        setPurpose('');
        setNotes('');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Reservation failed. Please try again.');
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
                <h1 className="text-xl font-bold text-gray-900">Stock Reservation</h1>
                <p className="text-sm text-gray-500">Reserve available stock for upcoming works</p>
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
                  if (item) setReservedQuantity(0);
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select material</option>
                  {materials.map(m => {
                    const available = m.quantity - (m.reservedQuantity || 0);
                    return (
                      <option key={m.id} value={m.id}>{m.name} ({m.sku}) - Total: {m.quantity} {m.unit}, Available: {available} {m.unit}</option>
                    );
                  })}
                </select>
              </div>

              {selectedMaterial && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Material:</span> {selectedMaterial.name}</div>
                    <div><span className="font-medium">SKU:</span> {selectedMaterial.sku}</div>
                    <div><span className="font-medium">Total Stock:</span> {selectedMaterial.quantity} {selectedMaterial.unit}</div>
                    <div><span className="font-medium">Already Reserved:</span> {selectedMaterial.reservedQuantity || 0} {selectedMaterial.unit}</div>
                    <div className="col-span-2">
                      <span className="font-medium">Available to Reserve: </span>
                      <span className="text-green-700 font-bold">{selectedMaterial.quantity - (selectedMaterial.reservedQuantity || 0)} {selectedMaterial.unit}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Quantity *</label>
                <input type="number" min="1" max={selectedMaterial ? selectedMaterial.quantity - (selectedMaterial.reservedQuantity || 0) : 0} value={reservedQuantity} onChange={e => setReservedQuantity(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select purpose</option>
                  <option value="project">Project Work</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="emergency">Emergency / Urgent</option>
                  <option value="event">Special Event</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Reservation notes, project details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Reserve Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockReservation;

