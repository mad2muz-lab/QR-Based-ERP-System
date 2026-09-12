import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { Region, Warehouse } from '../data/ksaData';
import {
  Package, AlertTriangle, MapPin, BarChart3,
  RefreshCw, Box, ArrowRight, TrendingUp
} from 'lucide-react';
import { RegionCard, StatsCard, WarehouseCard } from './cards';
import { KpiCard } from './KpiCard';
import { WarehouseView } from './WarehouseView';
import { MaterialDetailSheet } from './MaterialDetailSheet';
import { LowStockAlerts } from './LowStockAlerts';
import { StockMovementLog } from './StockMovementLog';
import { QRScannerModal } from './QRScannerModal';
import { InventoryOperationsPanel } from './InventoryOperationsPanel';
import { REGIONS } from '../data/ksaData';
import { SaudiRiyalSymbol } from '../../../components/common/SaudiRiyalSymbol';

type ViewMode = 'dashboard' | 'region' | 'warehouse' | 'zone' | 'material';

const CentralizedInventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with back button when in drilldown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/90 dark:border-[#202C3F] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            {currentView !== 'dashboard' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
              >
                ← Back
              </button>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentView === 'dashboard' && 'Enterprise Inventory Overview'}
              {currentView === 'region' && selectedRegion?.name}
              {currentView === 'warehouse' && (warehouses.find(w => w.id === selectedWarehouse)?.name || 'Warehouse View')}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              LIVE STREAM ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {currentView === 'dashboard' && 'Enterprise multi-region network • 6 KSA Regions • 17 Facilities • 510+ Managed Assets'}
            {currentView === 'region' && 'Select warehouse or return to national dashboard'}
            {currentView === 'warehouse' && 'Select zone or return to regional view'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Operations Hub</span>
          </button>
          <button
            onClick={() => setShowMovements(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs transition shadow-sm"
          >
            <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Movements ({stats.totalMovements})</span>
          </button>
          <button
            onClick={refreshData}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Refresh inventory metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <>
        {/* KPI Overview using KpiCard components */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Leading KPIs</h2>
                               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[9rem] items-stretch">
            <KpiCard
              label="Inventory Turnover"
              value={(stats.totalMovements / (stats.totalQuantity || 1)).toFixed(2)}
              icon={<TrendingUp className="w-5 h-5" />}
              description="Shows how many times inventory is sold and replaced over a period, indicating efficiency of stock usage."
              type="lead"
            />
            <KpiCard
              label="Days of Inventory on Hand"
              value={(stats.totalQuantity / (stats.totalMovements || 1)).toFixed(1)}
              icon={<Package className="w-5 h-5" />}
              description="Average number of days the current inventory will last based on sales velocity."
              type="lead"
            />
            <KpiCard
              label="Average Unit Cost"
              value={(stats.totalValue && stats.totalQuantity) ? (
                <span className="inline-flex items-center gap-1.5">
                  <SaudiRiyalSymbol size={18} />
                  {(stats.totalValue / stats.totalQuantity).toFixed(2)}
                </span>
              ) : 'N/A'}
              icon={<Package className="w-5 h-5" />}
              description="Average cost per unit across all inventory items."
              type="lead"
            />
            <KpiCard
              label="Critical Stock Items"
              value={stats.criticalStock ?? 0}
              icon={<AlertTriangle className="w-5 h-5" />}
              description="Number of items that are out of stock or below reorder level. Helps prioritize replenishment actions."
              type="lead"
            />
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Lagging KPIs</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[9rem] items-stretch">
            <KpiCard
              label="Stockout Rate"
              value={stats.totalItems ? ((stats.criticalStock / stats.totalItems) * 100).toFixed(1) + '%' : '0%'}
              icon={<AlertTriangle className="w-5 h-5" />}
              description="Percentage of items that are out of stock, reflecting supply risk."
              type="lag"
            />
            <KpiCard
              label="Total Stock Value"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <SaudiRiyalSymbol className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <span>{(stats.totalValue / 1000000).toFixed(1)}M</span>
                </span>
              }
              icon={<Package className="w-5 h-5" />}
              description="Total monetary value of all inventory items, useful for financial reporting."
              type="lag"
            />
          </div>
        </div>
        
          {/* Executive Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white dark:bg-[#131B2A] rounded-2xl p-6 border border-slate-200/90 dark:border-[#202C3F] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Warehouses & Hubs</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.totalWarehouses}</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                    <span>{stats.totalRegions} Administrative Regions</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131B2A] rounded-2xl p-6 border border-slate-200/90 dark:border-[#202C3F] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Cataloged Materials</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.totalItems}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 flex items-center gap-1">
                    <span>Valuation:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-black inline-flex items-center gap-1">
                      <SaudiRiyalSymbol className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{(stats.totalValue / 1000000).toFixed(1)}M</span>
                    </strong>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131B2A] rounded-2xl p-6 border border-slate-200/90 dark:border-[#202C3F] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Stock Volume</span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.totalQuantity.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
                    {stats.totalMovements} logged movements
                  </div>
                </div>
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm">
                  <Box className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131B2A] rounded-2xl p-6 border border-slate-200/90 dark:border-[#202C3F] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Stock Alerts & Discrepancies</span>
                  <div className={`text-3xl sm:text-4xl font-black mt-2 ${stats.criticalStock > 0 ? 'text-rose-600 dark:text-rose-400' : stats.lowStockItems > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {stats.lowStockItems}
                  </div>
                  <div className="text-xs font-bold mt-2">
                    {stats.criticalStock > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">{stats.criticalStock} Critical Out-of-Stock</span>
                    ) : stats.lowStockItems > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">Below Reorder Level</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">All Stocks Optimal</span>
                    )}
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-sm ${stats.criticalStock > 0 ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600' : stats.lowStockItems > 0 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-600'}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {stats.lowStockItems > 0 && <LowStockAlerts items={items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock')} />}

          {/* KSA Regions Grid Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">KSA Regional Operations</h2>
                <p className="text-xs text-slate-500 font-medium">Click on any region to inspect localized facility capacity and zone allocations</p>
              </div>
              <button
                onClick={() => navigate('/inventory')}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
              >
                <span>Full Operations Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back to Dashboard</button>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 20px 0' }}>{selectedRegion.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '2px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600', margin: '0 0 8px 0' }}>Total Items</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{regionStats.totalItems}</p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '2px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600', margin: '0 0 8px 0' }}>Total Qty</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{regionStats.totalQuantity.toLocaleString()}</p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '2px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600', margin: '0 0 8px 0' }}>Total Value</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SaudiRiyalSymbol style={{ width: '22px', height: '22px', color: '#059669' }} />
                <span>{(regionStats.totalValue / 1000000).toFixed(2)}M</span>
              </p>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '2px solid #e2e8f0' }}>
              <p style={{ fontSize: '14px', color: '#475569', fontWeight: '600', margin: '0 0 8px 0' }}>Low Stock</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', margin: 0 }}>{regionStats.lowStock}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
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
          <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>← Back to Region</button>
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
