import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download } from 'lucide-react';
import { InventoryStorageService } from '../utils/inventoryStorage';
import { MaterialItem, StockMovement } from '../data/ksaData';

const InventoryAuditTrail: React.FC = () => {
  const navigate = useNavigate();
  const inventoryStorage = InventoryStorageService.getInstance();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string>('');

  useEffect(() => {
    setMovements(inventoryStorage.getMovements());
  }, []);

  const filteredMovements = movements.filter(m => {
    if (searchQuery && !m.itemName.toLowerCase().includes(searchQuery.toLowerCase()) && !m.reference.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && m.type !== filterType) {
      return false;
    }
    if (selectedItem && m.itemId !== selectedItem) {
      return false;
    }
    return true;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'received': return 'bg-green-100 text-green-700';
      case 'issued': return 'bg-red-100 text-red-700';
      case 'transferred': return 'bg-blue-100 text-blue-700';
      case 'adjusted': return 'bg-yellow-100 text-yellow-700';
      case 'returned': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/scan')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Inventory Movement Audit Trail</h1>
                <p className="text-sm text-gray-500">Unified log of all inventory movements, filterable by item, date, and type</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by item name or reference..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="received">Received</option>
                <option value="issued">Issued</option>
                <option value="transferred">Transferred</option>
                <option value="adjusted">Adjusted</option>
                <option value="returned">Returned</option>
              </select>
              <select
                value={selectedItem}
                onChange={e => setSelectedItem(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                {inventoryStorage.getItems().map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">From / To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">No movements found</td>
                    </tr>
                  ) : filteredMovements.map(movement => (
                    <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{movement.reference}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{movement.itemName}</div>
                          <div className="text-xs text-gray-500">{movement.sku}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(movement.type)}`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {movement.fromLocation && <div>From: {movement.fromLocation}</div>}
                        {movement.toLocation && <div>To: {movement.toLocation}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(movement.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{movement.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryAuditTrail;
