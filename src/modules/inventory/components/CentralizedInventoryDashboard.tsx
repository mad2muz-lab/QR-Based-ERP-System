import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../hooks/useInventory';
import { Region, Warehouse } from '../data/ksaData';
import {
  Package, AlertTriangle, MapPin, BarChart3,
  RefreshCw, Box, ArrowRight, TrendingUp
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
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            {currentView === 'dashboard' && 'KSA Inventory Dashboard'}
            {currentView === 'region' && selectedRegion?.name}
            {currentView === 'warehouse' && warehouse?.name}
            {currentView === 'material' && selectedMaterial?.name}
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', marginTop: '6px', fontWeight: '500' }}>
            {currentView === 'dashboard' && '6 KSA Regions • 17 Warehouses • 510+ Materials'}
            {currentView === 'region' && 'Select warehouse or return to dashboard'}
            {currentView === 'warehouse' && 'Select zone or return to region'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/inventory')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#2563eb', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
          >
            <Package style={{ width: '20px', height: '20px' }} />
            Inventory Hub
          </button>
          <button
            onClick={() => setShowMovements(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f1f5f9', color: '#334155', borderRadius: '12px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}
          >
            <BarChart3 style={{ width: '20px', height: '20px' }} />
            Movements ({stats.totalMovements})
          </button>
          <button
            onClick={refreshData}
            style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}
          >
            <RefreshCw style={{ width: '20px', height: '20px', color: '#475569' }} />
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {currentView === 'dashboard' && (
        <>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', borderRadius: '16px', padding: '24px', border: '2px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Warehouses</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#1e3a8a', marginTop: '8px' }}>{stats.totalWarehouses}</p>
                  <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: '600', marginTop: '4px' }}>{stats.totalRegions} Regions</p>
                </div>
                <div style={{ background: '#bfdbfe', padding: '16px', borderRadius: '14px' }}>
                  <MapPin style={{ width: '28px', height: '28px', color: '#1d4ed8' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', borderRadius: '16px', padding: '24px', border: '2px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Materials</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#064e3b', marginTop: '8px' }}>{stats.totalItems}</p>
                  <p style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', marginTop: '4px' }}>SAR {(stats.totalValue / 1000000).toFixed(1)}M value</p>
                </div>
                <div style={{ background: '#a7f3d0', padding: '16px', borderRadius: '14px' }}>
                  <Package style={{ width: '28px', height: '28px', color: '#059669' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '16px', padding: '24px', border: '2px solid #ddd6fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inventory Units</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#4c1d95', marginTop: '8px' }}>{stats.totalQuantity.toLocaleString()}</p>
                  <p style={{ fontSize: '14px', color: '#5b21b6', fontWeight: '600', marginTop: '4px' }}>{stats.totalMovements} movements</p>
                </div>
                <div style={{ background: '#ddd6fe', padding: '16px', borderRadius: '14px' }}>
                  <Box style={{ width: '28px', height: '28px', color: '#7c3aed' }} />
                </div>
              </div>
            </div>

            <div style={{ background: stats.criticalStock > 0 ? 'linear-gradient(135deg, #fef2f2, #fecaca)' : stats.lowStockItems > 0 ? 'linear-gradient(135deg, #fffbeb, #fde68a)' : 'linear-gradient(135deg, #ecfdf5, #a7f3d0)', borderRadius: '16px', padding: '24px', border: stats.criticalStock > 0 ? '2px solid #fca5a5' : stats.lowStockItems > 0 ? '2px solid #fcd34d' : '2px solid #6ee7b7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: stats.criticalStock > 0 ? '#991b1b' : stats.lowStockItems > 0 ? '#92400e' : '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Low Stock Alerts</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: stats.criticalStock > 0 ? '#7f1d1d' : stats.lowStockItems > 0 ? '#78350f' : '#064e3b', marginTop: '8px' }}>{stats.lowStockItems}</p>
                  <p style={{ fontSize: '14px', color: stats.criticalStock > 0 ? '#991b1b' : stats.lowStockItems > 0 ? '#92400e' : '#065f46', fontWeight: '600', marginTop: '4px' }}>{stats.criticalStock > 0 ? `${stats.criticalStock} critical` : 'needs attention'}</p>
                </div>
                <div style={{ background: stats.criticalStock > 0 ? '#fecaca' : stats.lowStockItems > 0 ? '#fde68a' : '#a7f3d0', padding: '16px', borderRadius: '14px' }}>
                  <AlertTriangle style={{ width: '28px', height: '28px', color: stats.criticalStock > 0 ? '#dc2626' : stats.lowStockItems > 0 ? '#d97706' : '#059669' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {stats.lowStockItems > 0 && <LowStockAlerts items={items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock')} />}

          {/* KSA Regions */}
          <div style={{ background: 'white', borderRadius: '16px', border: '2px solid #e2e8f0', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>KSA Regions</h2>
              <button
                onClick={() => navigate('/inventory')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                View All Operations <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
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
              <p style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>SAR {(regionStats.totalValue / 1000000).toFixed(2)}M</p>
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
