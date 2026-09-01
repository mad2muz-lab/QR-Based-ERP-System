import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, CheckCircle } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem, Warehouse } from '../data/ksaData';

const BatchLotTracker: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [batchNumber, setBatchNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [manufacturingDate, setManufacturingDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [supplier, setSupplier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(inventoryStorage.getItems());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !batchNumber) {
      setError('Please select a material and enter batch number');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedMaterial = {
        ...selectedMaterial,
        batchNumber,
        lotNumber,
        expiryDate: expiryDate || selectedMaterial.expiryDate,
        manufacturer: manufacturer || selectedMaterial.manufacturer,
        supplier: supplier || selectedMaterial.supplier,
        lastUpdated: new Date().toISOString()
      };
      inventoryStorage.updateItem(selectedMaterial.id, updatedMaterial);

      setSuccess(`Batch/lot tracking updated for ${selectedMaterial.name}`);
      setTimeout(() => {
        setSelectedMaterial(null);
        setBatchNumber('');
        setLotNumber('');
        setManufacturingDate('');
        setExpiryDate('');
        setManufacturer('');
        setSupplier('');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Update failed. Please try again.');
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
                <h1 className="text-xl font-bold text-gray-900">Batch / Lot Tracking</h1>
                <p className="text-sm text-gray-500">Track batch numbers, expiry dates, and manufacturer details</p>
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
                  if (item) {
                    setBatchNumber(item.batchNumber || '');
                    setLotNumber(item.lotNumber || '');
                    setExpiryDate(item.expiryDate || '');
                    setManufacturer(item.manufacturer || '');
                    setSupplier(item.supplier || '');
                  }
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                  <option value="">Select material</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number *</label>
                <input type="text" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="BATCH-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                  <input type="text" value={lotNumber} onChange={e => setLotNumber(e.target.value)} placeholder="LOT-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label>
                  <input type="date" value={manufacturingDate} onChange={e => setManufacturingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="Manufacturer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial || !batchNumber} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Saving...' : 'Save Batch/Lot Info'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BatchLotTracker;

