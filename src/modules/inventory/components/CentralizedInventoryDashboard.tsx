import React, { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Region, Warehouse } from '../data/ksaData';
import {
  Package, AlertTriangle, MapPin, BarChart3,
  RefreshCw, ChevronRight, Box, ArrowRight
} from 'lucide-react';
import { RegionCard, StatsCard, WarehouseCard } from './cards';
import { WarehouseView } from './WarehouseView';
import { MaterialDetailSheet } from './MaterialDetailSheet';
import { LowStockAlerts } from './LowStockAlerts';
import { StockMovementLog } from './StockMovementLog';
import { QRScannerModal } from './QRScannerModal';
import { InventoryOperationsPanel } from './InventoryOperationsPanel';
import { REGIONS } from '../data/ksaData';

type ViewMode = 'dashboard' | 'region' | 'warehouse' | 'zone' | 'material';

const CentralizedInventoryDashboard: React.FC = () => {
  const {
    items, warehouses, getStats, movements, refreshData,
    getItemsByWarehouseWithFilter, getZonesByWarehouse, searchItems
  } = useInventory();

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showOperationsPanel, setShowOperationsPanel] = useState(false);
  const [showMovements, setShowMovements] = useState(false);

  const stats = getStats();

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    setCurrentView('region');
  };

  const handleWarehouseClick = (warehouseId: string) => {
    setSelectedWarehouse(warehouseId);
    setCurrentView('warehouse');
  };

  const handleViewMaterial = (material: any) => {
    setSelectedMaterial(material);
    setCurrentView('material');
  };

  const handleBack = () => {
    if (currentView === 'region') {
      setCurrentView('dashboard');
      setSelectedRegion(null);
    } else if (currentView === 'warehouse') {
      setCurrentView('region');
      setSelectedWarehouse(null);
      setSelectedZone(null);
    } else if (currentView === 'zone') {
      setCurrentView('warehouse');
      setSelectedZone(null);
    } else if (currentView === 'material') {
      setCurrentView('warehouse');
      setSelectedMaterial(null);
    }
  };

  const handleQRScanned = (qrCode: string) => {
    const found = searchItems(qrCode);
    const item = found.find((i: any) => i.qrCode === qrCode || i.sku === qrCode);
    if (item) {
      setSelectedMaterial(item);
      setCurrentView('material');
    }
    setShowQRScanner(false);
  };

  // Calculate region stats
  const regionStats = selectedRegion ? {
    totalItems: items.filter(i => selectedRegion.warehouses.some(w => w.id === i.warehouseId)).length,
    totalQuantity: items.filter(i => selectedRegion.warehouses.some(w => w.id === i.warehouseId))
      .reduce((sum: number, i: any) => sum + i.quantity, 0),
    totalValue: items.filter(i => selectedRegion.warehouses.some(w => w.id === i.warehouseId))
      .reduce((sum: number, i: any) => sum + (i.quantity * i.unitCost), 0),
    lowStock: items.filter(i => selectedRegion.warehouses.some(w => w.id === i.warehouseId) &&
      (i.status === 'low_stock' || i.status === 'out_of_stock')).length
  } : undefined;

  const warehouse = warehouses.find(w => w.id === selectedWarehouse);
  const zones = selectedWarehouse ? getZonesByWarehouse(selectedWarehouse) : [];
  const filteredMaterials = selectedWarehouse
    ? getItemsByWarehouseWithFilter(selectedWarehouse, activeFilter)
    : items;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
{/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold text-slate-900">
             {currentView === 'dashboard' && 'KSA Inventory Dashboard'}
             {currentView === 'region' && selectedRegion?.name}
             {currentView === 'warehouse' && warehouse?.name}
             {currentView === 'material' && selectedMaterial?.name}
           </h1>
           <div className="text-sm text-slate-500 mt-1">
             {currentView === 'dashboard' && '6 KSA Regions • 17 Warehouses • 510+ Materials'}
             {currentView === 'region' && 'Select warehouse or return to dashboard'}
             {currentView === 'warehouse' && 'Select zone or return to region'}
           </div>
         </div>

         <div className="flex items-center gap-3">
           <button
             onClick={() => setShowOperationsPanel(true)}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
           >
             <Package className="w-4 h-4" />
             Stock Operations
           </button>
           <button
             onClick={() => setShowMovements(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
           >
             <BarChart3 className="w-4 h-4" />
             Movements ({stats.totalMovements})
           </button>
           <button
             onClick={refreshData}
             className="p-2 rounded-lg hover:bg-slate-100"
           >
             <RefreshCw className="w-5 h-5 text-slate-600" />
           </button>
         </div>
       </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Warehouses" value={stats.totalWarehouses} icon={MapPin} change={`${stats.totalRegions} Regions`} color="blue" />
            <StatsCard title="Total Materials" value={stats.totalItems} icon={Package} subtitle={`SAR ${(stats.totalValue / 1000000).toFixed(1)}M`} color="green" />
            <StatsCard title="Inventory Units" value={stats.totalQuantity.toLocaleString()} icon={Box} change={`${stats.totalMovements} movements`} color="purple" />
            <StatsCard title="Low Stock Alerts" value={stats.lowStockItems} icon={AlertTriangle} change={stats.criticalStock > 0 ? `${stats.criticalStock} critical` : 'needs attention'} color={stats.criticalStock > 0 ? 'red' : stats.lowStockItems > 0 ? 'yellow' : 'green'} />
          </div>

          {stats.lowStockItems > 0 && <LowStockAlerts items={items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock')} />}

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">KSA Regions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REGIONS.map(region => (
                <RegionCard key={region.id} region={region} onClick={handleRegionClick} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Region View */}
      {currentView === 'region' && selectedRegion && regionStats && (
        <>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline">← Back to Dashboard</button>
          <h2 className="text-2xl font-bold text-slate-900">{selectedRegion.name}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div><p className="text-xs text-slate-500">Total Items</p><p className="font-bold">{regionStats.totalItems}</p></div>
            <div><p className="text-xs text-slate-500">Total Qty</p><p className="font-bold">{regionStats.totalQuantity.toLocaleString()}</p></div>
            <div><p className="text-xs text-slate-500">Total Value</p><p className="font-bold">SAR {(regionStats.totalValue / 1000000).toFixed(2)}M</p></div>
            <div><p className="text-xs text-slate-500">Low Stock</p><p className="font-bold text-amber-600">{regionStats.lowStock}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {selectedRegion.warehouses.map(wh => {
              const whItems = items.filter(i => i.warehouseId === wh.id);
              const lowCount = whItems.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length;
              return (
                <WarehouseCard
                  key={wh.id}
                  warehouse={wh}
                  stats={{
                    totalItems: whItems.length,
                    totalQuantity: whItems.reduce((s, i) => s + i.quantity, 0),
                    totalValue: whItems.reduce((s, i) => s + (i.quantity * i.unitCost), 0),
                    lowStockCount: lowCount
                  }}
                  onClick={handleWarehouseClick}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Warehouse View */}
      {currentView === 'warehouse' && warehouse && (
        <>
          <button onClick={handleBack} className="text-sm text-blue-600 hover:underline">← Back to Region</button>
          <WarehouseView
            warehouse={warehouse}
            items={filteredMaterials}
            zones={zones}
            onViewMaterial={handleViewMaterial}
            onZoneClick={() => {}}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </>
      )}

      {/* Material Detail Sheet */}
      {selectedMaterial && currentView === 'material' && (
        <MaterialDetailSheet material={selectedMaterial} onClose={() => { setCurrentView('warehouse'); setSelectedMaterial(null); }} onUpdate={refreshData} />
      )}

      {/* Modals */}
      {showMovements && <div className="fixed inset-0 bg-black bg-opacity-50 z-50"><StockMovementLog movements={movements} onClose={() => setShowMovements(false)} /></div>}
      {showQRScanner && <div className="fixed inset-0 bg-black bg-opacity-50 z-50"><QRScannerModal onClose={() => setShowQRScanner(false)} onScanned={handleQRScanned} /></div>}
      {showOperationsPanel && <InventoryOperationsPanel onClose={() => setShowOperationsPanel(false)} onOperationComplete={refreshData} />}
    </div>
  );
};

export default CentralizedInventoryDashboard;