import React from 'react';
import { Search, Filter, Package, AlertTriangle, ArrowDown, ArrowUp, ChevronDown } from 'lucide-react';
import { MaterialItem, Zone } from '../data/ksaData';
import { Warehouse } from '../data/ksaData';
import { useInventory } from '../hooks/useInventory';
import { SaudiRiyalSymbol } from '../../../components/common/SaudiRiyalSymbol';

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
          <div className="relative flex-1 sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search materials by name, SKU, or QR code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#131B2A] border border-slate-300 dark:border-[#202C3F] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(['all', 'low_stock', 'out_of_stock'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                activeFilter === filter
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                  : 'bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {filter === 'all' ? 'All Materials' : filter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
          <button
            onClick={() => setShowZones(!showZones)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#202C3F] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
          >
            <Package className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Zones ({zones.length})
          </button>
        </div>
      </div>

      {/* Zones Breakdown */}
      {showZones && (
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 tracking-wide uppercase">Zone Storage Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map(zone => {
              const zoneItems = items.filter(i => i.zoneId === zone.id);
              const usedPercent = Math.round((zone.usedCapacity / zone.capacity) * 100);
              return (
                <button
                  key={zone.id}
                  onClick={() => onZoneClick(zone.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all text-left shadow-sm group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{zone.name}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{zoneItems.length} items • {zone.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Capacity</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{usedPercent}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Material Table */}
      <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-[#0B0F17]/80">
              <tr>
                {[
                  { key: 'name', label: 'Material', sortable: true },
                  { key: 'quantity', label: 'Qty On Hand', sortable: true },
                  { key: 'cost', label: 'Unit Cost', sortable: true },
                  { key: 'status', label: 'Status', sortable: false },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key as any)}
                    className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <span className="text-xs text-slate-400 font-bold">
                          {sortBy === col.key ? (sortAsc ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#131B2A] divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredAndSortedItems.map(item => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => onViewMaterial(item)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="ml-3.5 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.quantity.toLocaleString()}</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1.5">{item.unit}</span>
                      {item.reserved > 0 && (
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 ml-1.5 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">
                          {item.reserved} reserved
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-1">
                      <SaudiRiyalSymbol className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.unitCost.toLocaleString()}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${statusColors[item.status] || statusColors.in_stock}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{item.location}</td>
                  <td className="px-5 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{item.category}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewMaterial(item);
                      }}
                      className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedItems.length === 0 && (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">No materials found matching your criteria</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or active filter</p>
          </div>
        )}

        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#0B0F17]/80 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 flex justify-between items-center">
          <span>{filteredAndSortedItems.length} materials{searchQuery && ` matching "${searchQuery}"`}</span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1">
            <span>Total Value:</span>
            <SaudiRiyalSymbol className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{filteredAndSortedItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0).toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

