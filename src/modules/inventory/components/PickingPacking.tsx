import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, ClipboardList, Truck, FileText } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { REGIONS, MaterialItem, Warehouse } from '../data/ksaData';
import { OfflineDataManager } from '../../../utils/offlineDataManager';
import { SearchableSelect } from '../../../components/common/SearchableSelect';

const PickingPacking: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const warehouses = REGIONS.flatMap(r => r.warehouses);
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [sourceWarehouse, setSourceWarehouse] = useState<Warehouse | null>(null);
  const [destinationWarehouse, setDestinationWarehouse] = useState<Warehouse | null>(null);
  const [destinationType, setDestinationType] = useState<'warehouse' | 'project'>('warehouse');
  const [projectSite, setProjectSite] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [pickListNumber, setPickListNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePickList = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PICK-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !sourceWarehouse) {
      setError('Please select a material and source warehouse');
      return;
    }

    if (quantity > selectedMaterial.quantity) {
      setError(`Insufficient stock. Available: ${selectedMaterial.quantity}`);
      return;
    }

    if (destinationType === 'warehouse' && !destinationWarehouse) {
      setError('Please select a destination warehouse');
      return;
    }

    if (destinationType === 'project' && !projectSite) {
      setError('Please enter a project/site name');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const pickNo = pickListNumber || generatePickList();
      const destination = destinationType === 'warehouse' 
        ? destinationWarehouse?.name || 'Warehouse' 
        : projectSite;

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
        site: sourceWarehouse.name,
        status: selectedMaterial.status,
        notes: `Pick List #${pickNo} | Destination: ${destination} | Requested By: ${requestedBy || 'Field Ops'}${notes ? ` | ${notes}` : ''}`,
        oldId: selectedMaterial.id
      };

      await OfflineDataManager.createMaterialLog(materialLog);

      setSuccess(`Picking completed: ${quantity} ${selectedMaterial.unit} of ${selectedMaterial.name} issued to ${destination}`);
      setTimeout(() => {
        navigate('/scan');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Picking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Picking / Issue</h1>
                <p className="text-sm text-gray-500">Pick and issue materials to warehouse or project</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between text-xs text-cyan-900">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                <span>Dispatching / issuing <strong>multiple goods</strong> on a single Gate Pass / Delivery Note?</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inventory/manifest')}
                className="font-bold text-cyan-700 hover:text-cyan-900 underline whitespace-nowrap ml-2"
              >
                Use Multi-Item GDN &rarr;
              </button>
            </div>
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
                placeholder="Select material from inventory..."
                searchPlaceholder="Search material by name, SKU..."
                value={selectedMaterial?.id || ''}
                onChange={val => {
                  const item = inventoryStorage.getItemById(val);
                  setSelectedMaterial(item || null);
                  if (item) {
                    const source = warehouses.find(w => w.id === item.warehouseId);
                    setSourceWarehouse(source || null);
                  }
                }}
                options={inventoryStorage.getItems().map(m => ({
                  value: m.id,
                  label: m.name,
                  sublabel: m.sku,
                  badge: `${m.quantity} ${m.unit}`
                }))}
              />

              <SearchableSelect
                label="Source Warehouse"
                required
                placeholder="Select source warehouse..."
                searchPlaceholder="Search warehouse..."
                value={sourceWarehouse?.id || ''}
                onChange={val => {
                  const wh = warehouses.find(w => w.id === val);
                  setSourceWarehouse(wh || null);
                }}
                options={warehouses.map(w => ({
                  value: w.id,
                  label: w.name,
                  sublabel: `${w.city} • Code: ${w.code}`,
                  badge: w.status
                }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="warehouse" checked={destinationType === 'warehouse'} onChange={() => setDestinationType('warehouse')} />
                    <span>Warehouse</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="project" checked={destinationType === 'project'} onChange={() => setDestinationType('project')} />
                    <span>Project / Site</span>
                  </label>
                </div>
              </div>

              {destinationType === 'warehouse' ? (
                <div>
                  <SearchableSelect
                    label="Destination Warehouse"
                    required
                    placeholder="Select destination warehouse..."
                    searchPlaceholder="Search destination..."
                    value={destinationWarehouse?.id || ''}
                    onChange={val => {
                      const wh = warehouses.find(w => w.id === val);
                      setDestinationWarehouse(wh || null);
                    }}
                    options={warehouses.filter(w => w.id !== sourceWarehouse?.id).map(w => ({
                      value: w.id,
                      label: w.name,
                      sublabel: `${w.city} • Code: ${w.code}`
                    }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project / Site Name</label>
                  <input type="text" value={projectSite} onChange={e => setProjectSite(e.target.value)} placeholder="e.g. King Abdullah Road Project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Issue *</label>
                  <input type="number" min="1" max={selectedMaterial?.quantity || 0} value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  {selectedMaterial && (
                    <p className="text-xs text-gray-500 mt-1">Available: {selectedMaterial.quantity} {selectedMaterial.unit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pick List Reference</label>
                  <input type="text" value={pickListNumber} onChange={e => setPickListNumber(e.target.value)} placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Picking notes, instructions, special handling..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/scan')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={isSubmitting || !selectedMaterial || !sourceWarehouse} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSubmitting ? 'Processing...' : 'Complete Picking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PickingPacking;

