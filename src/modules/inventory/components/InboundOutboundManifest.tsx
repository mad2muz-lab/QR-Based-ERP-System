import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Package, CheckCircle, X, FileText, Plus } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

interface ManifestItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  type: 'inbound' | 'outbound';
  reference: string;
}

const InboundOutboundManifest: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [manifestType, setManifestType] = useState<'inbound' | 'outbound'>('inbound');
  const [manifestNumber, setManifestNumber] = useState('');
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const materials = inventoryStorage.getItems();

  const generateManifestNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${manifestType === 'inbound' ? 'IN' : 'OUT'}-${year}${month}${day}-${random}`;
  };

  const handleAddItem = () => {
    if (!selectedMaterial) return;
    setItems(prev => [...prev, {
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      quantity,
      unit: selectedMaterial.unit,
      type: manifestType,
      reference: reference || `MAN-${Date.now()}`
    }]);
    setSelectedMaterial(null);
    setQuantity(1);
    setReference('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError('Please add at least one item to the manifest');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const manifestNo = manifestNumber || generateManifestNumber();
      const now = new Date();

      for (const item of items) {
        const material = inventoryStorage.getItemById(item.materialId);
        if (!material) continue;

        const materialLog = {
          id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          materialId: item.materialId,
          materialName: item.materialName,
          materialType: material.type,
          action: manifestType === 'inbound' ? 'material-in' as const : 'material-out' as const,
          quantity: item.quantity,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0],
          timestamp: now.toISOString(),
          site: material.warehouseId || 'Unknown',
          status: material.status,
          notes: `Manifest ${manifestNo} | ${manifestType} | Ref: ${item.reference}`,
          oldId: material.id
        };

        await OfflineDataManager.createMaterialLog(materialLog);

        if (manifestType === 'inbound') {
          const updatedMaterial = {
            ...material,
            quantity: material.quantity + item.quantity,
            lastUpdated: now.toISOString()
          };
          inventoryStorage.updateItem(material.id, updatedMaterial);
        } else {
          const updatedMaterial = {
            ...material,
            quantity: Math.max(0, material.quantity - item.quantity),
            lastUpdated: now.toISOString()
          };
          inventoryStorage.updateItem(material.id, updatedMaterial);
        }
      }

      setSuccess(`Manifest ${manifestNo} processed successfully with ${items.length} items`);
      setTimeout(() => {
        setItems([]);
        setManifestNumber('');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Manifest processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inbound / Outbound Manifest</h1>
                <p className="text-sm text-gray-500">Create shipment manifests for loading verification</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manifest Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManifestType('inbound')}
                    className={`px-4 py-2 rounded-lg border-2 font-medium ${manifestType === 'inbound' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700'}`}
                  >
                    <Truck className="w-4 h-4 inline mr-2" />Inbound
                  </button>
                  <button
                    type="button"
                    onClick={() => setManifestType('outbound')}
                    className={`px-4 py-2 rounded-lg border-2 font-medium ${manifestType === 'outbound' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700'}`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />Outbound
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manifest Number</label>
                <input
                  type="text"
                  value={manifestNumber}
                  onChange={e => setManifestNumber(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Add Items to Manifest</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select value={selectedMaterial?.id || ''} onChange={e => {
                    const item = materials.find(m => m.id === e.target.value);
                    setSelectedMaterial(item || null);
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedMaterial}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{item.materialName}</td>
                        <td className="py-3 px-4">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-4 text-gray-600">{item.reference}</td>
                        <td className="py-3 px-4">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || items.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Process Manifest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InboundOutboundManifest;
