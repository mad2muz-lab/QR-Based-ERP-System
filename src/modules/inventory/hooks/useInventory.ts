import { useState, useEffect, useCallback } from 'react';
import { MaterialItem, StockMovement, Warehouse, Zone, MaterialCategory } from '../data/ksaData';
import { inventoryStorage } from '../utils/inventoryStorage';

export interface InventoryStats {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  totalWarehouses: number;
  totalRegions: number;
  lowStockItems: number;
  reservedItems: number;
  reservedValue: number;
  criticalStock: number;
  recentMovements: number;
  totalMovements: number;
}

export interface CategoryStat extends MaterialCategory {
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
}

export const useInventory = () => {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setItems(inventoryStorage.getItems());
      setMovements(inventoryStorage.getMovements());
      setWarehouses(inventoryStorage.getWarehouses());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(() => {
    setItems(inventoryStorage.getItems());
    setMovements(inventoryStorage.getMovements());
    setWarehouses(inventoryStorage.getWarehouses());
  }, []);

  const updateQuantity = useCallback((
    itemId: string,
    newQuantity: number,
    type: 'received' | 'issued' | 'adjusted'
  ): StockMovement | null => {
    const item = items.find(i => i.id === itemId);
    if (!item) return null;

    const diff = newQuantity - item.quantity;
    if (diff === 0 && type !== 'adjusted') return null;

    const movement = inventoryStorage.addMovement({
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: type === 'adjusted' ? 'adjusted' : type,
      quantity: Math.abs(diff),
      reference: type === 'adjusted' ? 'ADJ-' + Date.now().toString().slice(-6) : 'MANUAL',
      performedBy: 'Current User',
      timestamp: new Date().toISOString(),
      notes: type === 'adjusted' ? 'Quantity adjustment' : undefined
    });

    refreshData();
    return movement;
  }, [items, refreshData]);

  const transferItem = useCallback((
    itemId: string,
    fromWarehouse: string,
    toWarehouse: string,
    quantity: number
  ): StockMovement | null => {
    const item = items.find(i => i.id === itemId);
    if (!item || item.quantity < quantity) return null;

    const movement = inventoryStorage.addMovement({
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      type: 'transferred',
      quantity,
      fromLocation: fromWarehouse,
      toLocation: toWarehouse,
      reference: 'TR-' + Date.now().toString().slice(-6),
      performedBy: 'Current User',
      timestamp: new Date().toISOString()
    });

    refreshData();
    return movement;
  }, [items, refreshData]);

  const searchItems = useCallback((query: string): MaterialItem[] => {
    return inventoryStorage.searchItems(query);
  }, []);

  const getItemByQR = useCallback((qrCode: string): MaterialItem | undefined => {
    return inventoryStorage.getItemByQR(qrCode);
  }, []);

  const getStats = useCallback((): InventoryStats => {
    return inventoryStorage.getStats();
  }, []);

  const getCategoryStats = useCallback((): CategoryStat[] => {
    return inventoryStorage.getCategoryStats();
  }, []);

  const getZonesByWarehouse = useCallback((warehouseId: string): Zone[] => {
    return inventoryStorage.getZonesByWarehouse(warehouseId);
  }, []);

  const getItemsByWarehouse = useCallback((warehouseId: string): MaterialItem[] => {
    return inventoryStorage.getItemsByWarehouse(warehouseId);
  }, []);

  const getItemsByWarehouseWithFilter = useCallback((
    warehouseId: string,
    status?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock' | 'reserved'
  ): MaterialItem[] => {
    let whItems = inventoryStorage.getItemsByWarehouse(warehouseId);
    if (status && status !== 'all') {
      whItems = whItems.filter(item => item.status === status);
    }
    return whItems;
  }, []);

  return {
    items,
    movements,
    warehouses,
    loading,
    error,
    refreshData,
    updateQuantity,
    transferItem,
    searchItems,
    getItemByQR,
    getStats,
    getCategoryStats,
    getZonesByWarehouse,
    getItemsByWarehouse,
    getItemsByWarehouseWithFilter,
  };
};
