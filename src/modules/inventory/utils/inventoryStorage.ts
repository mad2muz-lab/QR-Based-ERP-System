import { MaterialItem, StockMovement, Region, Warehouse, Zone, INVENTORY_ITEMS, STOCK_MOVEMENTS, REGIONS, ZONES, MaterialCategory, CATEGORIES } from '../data/ksaData';
import { ItemStatus, MovementType } from '../data/ksaData';

const STORAGE_KEY = 'inventory_data_v2';
const MOVEMENTS_KEY = 'inventory_movements_v2';

interface InventoryData {
  items: MaterialItem[];
  movements: StockMovement[];
  initialized: boolean;
}

export class InventoryStorageService {
  private static instance: InventoryStorageService;
  private data: InventoryData | null = null;

  private constructor() {}

  static getInstance(): InventoryStorageService {
    if (!InventoryStorageService.instance) {
      InventoryStorageService.instance = new InventoryStorageService();
    }
    return InventoryStorageService.instance;
  }

  private loadData(): InventoryData {
    if (this.data) return this.data;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
        return this.data!;
      } catch {
        this.data = null;
      }
    }

    // Initialize with sample data
    this.data = {
      items: [...INVENTORY_ITEMS],
      movements: [...STOCK_MOVEMENTS],
      initialized: true
    };
    this.saveData();
    return this.data;
  }

  private saveData(): void {
    if (this.data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }
  }

  // --- Items ---
  getItems(): MaterialItem[] {
    return this.loadData().items;
  }

  getItemsByWarehouse(warehouseId: string): MaterialItem[] {
    const items = this.loadData().items;
    return items.filter(item => item.warehouseId === warehouseId);
  }

  getItemBySku(sku: string): MaterialItem | undefined {
    return this.loadData().items.find(item => item.sku === sku);
  }

  getItemById(id: string): MaterialItem | undefined {
    return this.loadData().items.find(item => item.id === id);
  }

  getItemByQR(qrCode: string): MaterialItem | undefined {
    return this.loadData().items.find(item => item.qrCode === qrCode);
  }

  updateItem(itemId: string, updates: Partial<MaterialItem>): MaterialItem | null {
    const data = this.loadData();
    const item = data.items.find(i => i.id === itemId);
    if (!item) return null;
    
    const oldQuantity = item.quantity;
    Object.assign(item, updates);
    
    // Recalculate status
    const qty = item.quantity;
    item.status = qty === 0 ? 'out_of_stock' : qty <= item.reorderLevel ? 'low_stock' : 'in_stock';
    
    // Log stock movement if quantity changed
    if (oldQuantity !== qty) {
      this.addMovement({
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: qty > oldQuantity ? 'received' : 'issued',
        quantity: qty - oldQuantity,
        reference: 'MANUAL_ADJUSTMENT',
        performedBy: 'Current User',
        timestamp: new Date().toISOString()
      });
    }
    
    this.saveData();
    return item;
  }

  addItem(item: Omit<MaterialItem, 'id'>): MaterialItem {
    const data = this.loadData();
    const newItem: MaterialItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    data.items.push(newItem);
    this.saveData();
    return newItem;
  }

  deleteItem(itemId: string): boolean {
    const data = this.loadData();
    const initialLength = data.items.length;
    data.items = data.items.filter(i => i.id !== itemId);
    if (data.items.length !== initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Stock Movements ---
  getMovements(): StockMovement[] {
    return this.loadData().movements;
  }

  getMovementsByWarehouse(warehouseId: string): StockMovement[] {
    const items = this.getItemsByWarehouse(warehouseId);
    const itemIds = new Set(items.map(i => i.id));
    return this.loadData().movements.filter(m => itemIds.has(m.itemId));
  }

  addMovement(movement: Omit<StockMovement, 'id'>): StockMovement {
    const data = this.loadData();
    const newMovement: StockMovement = {
      ...movement,
      id: `mv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    data.movements.unshift(newMovement);
    
    // Update item quantity if it was a stock operation
    if (movement.type === 'received' || movement.type === 'issued' || movement.type === 'returned') {
      const item = data.items.find(i => i.id === movement.itemId);
      if (item) {
        if (movement.type === 'issued') {
          item.quantity = Math.max(0, item.quantity - movement.quantity);
        } else {
          item.quantity += movement.quantity;
        }
        item.status = item.quantity === 0 ? 'out_of_stock' : 
                      item.quantity <= item.reorderLevel ? 'low_stock' : 'in_stock';
      }
    }
    
    this.saveData();
    return newMovement;
  }

  // --- Warehouses ---
  getWarehouses(): Warehouse[] {
    return REGIONS.flatMap(r => r.warehouses);
  }

  getWarehouse(id: string): Warehouse | undefined {
    return this.getWarehouses().find(w => w.id === id);
  }

  getWarehousesByRegion(regionId: string): Warehouse[] {
    const region = REGIONS.find(r => r.id === regionId);
    return region ? region.warehouses : [];
  }

  // --- Zones ---
  getZonesByWarehouse(warehouseId: string): Zone[] {
    return ZONES.filter(z => z.warehouseId === warehouseId);
  }

  getZone(id: string): Zone | undefined {
    return ZONES.find(z => z.id === id);
  }

  // --- Stats ---
  getStats() {
    const items = this.getItems();
    const warehouses = this.getWarehouses();
    const movements = this.getMovements();
    
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
    const lowStockItems = items.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');
    const reservedItems = items.filter(i => i.reserved > 0);
    const criticalStock = items.filter(i => i.quantity === 0);
    const today = new Date().toISOString().split('T')[0];
    const recentMovements = movements.filter(m => m.timestamp.startsWith(today));
    
    return {
      totalItems,
      totalQuantity,
      totalValue,
      totalWarehouses: warehouses.length,
      totalRegions: REGIONS.length,
      lowStockItems: lowStockItems.length,
      reservedItems: reservedItems.length,
      reservedValue: reservedItems.reduce((sum, i) => sum + (i.reserved * i.unitCost), 0),
      criticalStock: criticalStock.length,
      recentMovements: recentMovements.length,
      totalMovements: movements.length
    };
  }

  // --- Categories ---
  getCategories(): MaterialCategory[] {
    return CATEGORIES;
  }

  getCategoryStats() {
    const items = this.getItems();
    return CATEGORIES.map(cat => {
      const catItems = items.filter(i => i.category === cat.name);
      return {
        ...cat,
        itemCount: catItems.length,
        totalQuantity: catItems.reduce((sum, i) => sum + i.quantity, 0),
        totalValue: catItems.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0)
      };
    });
  }

  // --- Search ---
  searchItems(query: string): MaterialItem[] {
    const items = this.getItems();
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.sku.toLowerCase().includes(lowerQuery) ||
      item.qrCode.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery) ||
      item.supplier?.toLowerCase().includes(lowerQuery)
    );
  }

  // --- Reset ---
  resetData(): void {
    this.data = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MOVEMENTS_KEY);
  }
}

export const inventoryStorage = InventoryStorageService.getInstance();
