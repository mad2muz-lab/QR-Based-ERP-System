import React from 'react';
import { Search, Filter, Package, AlertTriangle, ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { MaterialItem, Zone } from '../data/ksaData';
import { Warehouse } from '../data/ksaData';
import { useInventory } from '../hooks/useInventory';

interface WarehouseViewProps {
  warehouse: Warehouse;
  items: MaterialItem[];
  zones: Zone[];
  onViewMaterial: (material: any) => void;
  onZoneClick: (zoneId: string) => void;
  activeFilter: 'all' | 'low_stock' | 'out_of_stock';
  onFilterChange: (filter: 'all' | 'low_stock' | 'out_of_stock') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  warehouse,
  items,
  zones,
  onViewMaterial,
  onZoneClick,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange
}) => {
  const [sortBy, setSortBy] = React.useState<'name' | 'quantity' | 'cost'>('name');
  const [sortAsc, setSortAsc] = React.useState(true);
  const [showZones, setShowZones] = React.useState(true);

  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.qrCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.supplier?.toLowerCase().includes(query)
      );
    }
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      if (sortBy === 'cost') return a.unitCost - b.unitCost;
      return 0;
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [items, searchQuery, sortBy, sortAsc]);

  const handleSort = (field: 'name' | 'quantity' | 'cost') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const statusColors = {
    in_stock: 'bg-emerald-100 text-emerald-700',
    low_stock: 'bg-amber-100 text-amber-700',
    out_of_stock: 'bg-rose-100 text-rose-700',
    reserved: 'bg-blue-100 text-blue-700',
    quarantine: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials by name or SKU..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(['all', 'low_stock', 'out_of_stock'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
          <button
            onClick={() => setShowZones(!showZones)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
          >
            <Package className="w-3 h-3" />
            Zones
          </button>
        </div>
      </div>

      {/* Zones Breakdown */}
      {showZones && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Zone Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {zones.map(zone => {
              const zoneItems = items.filter(i => i.zoneId === zone.id);
              const usedPercent = Math.round((zone.usedCapacity / zone.capacity) * 100);
              return (
                <button
                  key={zone.id}
                  onClick={() => onZoneClick(zone.id)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{zone.name}</p>
                    <p className="text-xs text-slate-500">{zoneItems.length} items • {zone.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs text-slate-500">Capacity</p>
                    <p className="text-sm font-semibold">{usedPercent}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Material Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  { key: 'name', label: 'Material', sortable: true },
                  { key: 'quantity', label: 'Qty', sortable: true },
                  { key: 'cost', label: 'Unit Cost', sortable: true },
                  { key: 'status', label: 'Status', sortable: false },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key as any)}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-900 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="text-[10px] text-slate-400">
                          {sortBy === col.key ? (sortAsc ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAndSortedItems.map(item => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onViewMaterial(item)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-slate-900">{item.quantity.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 ml-1.5">{item.unit}</span>
                      {item.reserved > 0 && (
                        <span className="text-xs text-blue-600 ml-1">({item.reserved} res)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">SAR {item.unitCost}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[item.status] || statusColors.in_stock}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{item.location}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewMaterial(item);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedItems.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No materials found matching your criteria</p>
          </div>
        )}

        <div className="px-4 py-3 bg-slate-50 border-t text-xs text-slate-500 flex justify-between">
          <span>{filteredAndSortedItems.length} materials{searchQuery && ` matching "${searchQuery}"`}</span>
          <span>Total: SAR {filteredAndSortedItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};