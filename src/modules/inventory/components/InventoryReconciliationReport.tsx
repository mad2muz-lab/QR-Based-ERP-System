import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, X, FileText, RefreshCw } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';

const InventoryReconciliationReport: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [reconciliationItems, setReconciliationItems] = useState<Array<{
    material: MaterialItem;
    countedQty: number;
    variance: number;
    status: 'matched' | 'discrepancy' | 'pending';
    action: 'approve' | 'investigate' | 'pending';
  }>>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMaterials(inventoryStorage.getItems());
  }, []);

  const handleAddReconciliation = () => {
    if (!selectedMaterial) return;
    const variance = countedQty - selectedMaterial.quantity;
    const status = variance === 0 ? 'matched' : 'discrepancy';
    const action = variance === 0 ? 'approve' : 'investigate';

    setReconciliationItems(prev => [...prev, {
      material: selectedMaterial,
      countedQty,
      variance,
      status,
      action
    }]);
    setSelectedMaterial(null);
    setCountedQty(0);
  };

  const handleApprove = async (index: number) => {
    const item = reconciliationItems[index];
    if (!item) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const materialLog = {
        id: `mat-log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        materialId: item.material.id,
        materialName: item.material.name,
        materialType: item.material.type,
        action: 'material-out' as const,
        quantity: Math.abs(item.variance),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: item.material.warehouseId || 'Unknown',
        status: item.material.status,
        notes: `Reconciliation | System: ${item.material.quantity} | Counted: ${item.countedQty} | Variance: ${item.variance}`,
        oldId: item.material.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      const updatedMaterial = {
        ...item.material,
        quantity: item.countedQty,
        lastUpdated: now.toISOString()
      };
      inventoryStorage.updateItem(item.material.id, updatedMaterial);

      setReconciliationItems(prev => prev.map((entry, i) =>
        i === index ? { ...entry, status: 'matched' as const, action: 'approve' as const } : entry
      ));
      setSuccess(`Reconciliation approved for ${item.material.name}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchedCount = reconciliationItems.filter(i => i.status === 'matched').length;
  const discrepancyCount = reconciliationItems.filter(i => i.status === 'discrepancy').length;
  const totalValue = reconciliationItems.reduce((sum, i) => sum + (i.material.quantity * i.material.unitCost), 0);
  const discrepancyValue = reconciliationItems.filter(i => i.status === 'discrepancy').reduce((sum, i) => sum + (Math.abs(i.variance) * i.material.unitCost), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory Reconciliation Report</h1>
                <p className="text-sm text-gray-500">Compare cycle count results vs system and flag discrepancies</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {success && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">{error}</div>
            )}

            {reconciliationItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Items</div>
                  <div className="text-2xl font-bold text-blue-700">{reconciliationItems.length}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Matched</div>
                  <div className="text-2xl font-bold text-green-700">{matchedCount}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 font-medium">Discrepancies</div>
                  <div className="text-2xl font-bold text-red-700">{discrepancyCount}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-sm text-amber-600 font-medium">Discrepancy Value</div>
                  <div className="text-2xl font-bold text-amber-700">SAR {discrepancyValue.toFixed(2)}</div>
                </div>
              </div>
            )}

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Add Reconciliation Entry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select value={selectedMaterial?.id || ''} onChange={e => {
                    const item = inventoryStorage.getItemById(e.target.value);
                    setSelectedMaterial(item || null);
                    if (item) setCountedQty(item.quantity);
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select material</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counted Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={countedQty}
                    onChange={e => setCountedQty(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddReconciliation}
                    disabled={!selectedMaterial}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>

            {reconciliationItems.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">System Qty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Counted Qty</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Variance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationItems.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{entry.material.name}</td>
                        <td className="py-3 px-4 text-gray-600">{entry.material.quantity}</td>
                        <td className="py-3 px-4 text-gray-600">{entry.countedQty}</td>
                        <td className={`py-3 px-4 font-medium ${entry.variance > 0 ? 'text-green-600' : entry.variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {entry.variance > 0 ? '+' : ''}{entry.variance}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            entry.status === 'matched' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {entry.status === 'matched' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {entry.status === 'discrepancy' && (
                            <button
                              onClick={() => handleApprove(index)}
                              disabled={isSubmitting}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Approve Adjustment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReconciliationReport;
