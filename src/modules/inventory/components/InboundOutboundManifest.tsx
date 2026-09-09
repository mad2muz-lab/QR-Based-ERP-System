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
    return `${manifestType === 'inbound' ? 'GRN' : 'DN'}-${year}${month}${day}-${random}`;
  };

  const handleAddItem = () => {
    if (!selectedMaterial) return;
    setItems(prev => [...prev, {
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      quantity,
      unit: selectedMaterial.unit,
      type: manifestType,
      reference: reference || `REF-${Date.now()}`
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
      setError('Please add at least one item to the document');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const docNo = manifestNumber || generateManifestNumber();
      const docTypeLabel = manifestType === 'inbound' ? 'Goods Receipt Note (GRN)' : 'Delivery Note / Gate Pass (DN)';
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
          notes: `${docTypeLabel} #${docNo} | ${manifestType} | Ref: ${item.reference}`,
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

      setSuccess(`✅ ${docTypeLabel} #${docNo} issued and recorded successfully with ${items.length} items`);
      setTimeout(() => {
        setItems([]);
        setManifestNumber('');
        setSuccess(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] py-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl shadow-sm border border-slate-200/90 dark:border-[#202C3F] overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-[#202C3F] bg-slate-50/70 dark:bg-[#182235]/60">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Delivery Note & Receiving Vouchers</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    DISPATCH ENGINE
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Generate Delivery Notes, Outbound Gate Passes, or Inbound Goods Receiving Notes (GRN)</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Document Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManifestType('outbound')}
                    className={`px-3.5 py-2.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      manifestType === 'outbound'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500 shadow-sm'
                        : 'border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Package className="w-4 h-4" />Delivery Note / Gate Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setManifestType('inbound')}
                    className={`px-3.5 py-2.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      manifestType === 'inbound'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500 shadow-sm'
                        : 'border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />Goods Receipt (GRN)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Document Reference #</label>
                <input
                  type="text"
                  value={manifestNumber}
                  onChange={e => setManifestNumber(e.target.value)}
                  placeholder="Auto-generated (e.g. DN-20260909-xxxx)"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-[#0e1624] border border-slate-300 dark:border-[#202C3F] rounded-xl font-mono text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-[#202C3F] rounded-xl p-5 bg-slate-50/60 dark:bg-[#0e1624]">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Add Items to {manifestType === 'outbound' ? 'Delivery Note' : 'Goods Receipt Note'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Material</label>
                  <select
                    value={selectedMaterial?.id || ''}
                    onChange={e => {
                      const item = materials.find(m => m.id === e.target.value);
                      setSelectedMaterial(item || null);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
                  >
                    <option value="">Select material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.sku}) - {m.quantity} {m.unit} in stock</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-sm outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedMaterial}
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-950/20"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="overflow-x-auto border border-slate-200 dark:border-[#202C3F] rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-[#182235]">
                    <tr className="border-b border-slate-200 dark:border-[#202C3F]">
                      <th className="text-left py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Material</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Quantity</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Reference / Batch</th>
                      <th className="text-center py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#202C3F]">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-[#182235]/50">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{item.materialName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.reference}</td>
                        <td className="py-3 px-4 text-center">
                          <button type="button" onClick={() => handleRemoveItem(index)} className="text-rose-600 hover:text-rose-700 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#202C3F]">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-slate-300 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || items.length === 0} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-950/20 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">
                {isSubmitting ? 'Recording...' : manifestType === 'outbound' ? 'Issue Delivery Note / Gate Pass' : 'Confirm Goods Receipt (GRN)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InboundOutboundManifest;
