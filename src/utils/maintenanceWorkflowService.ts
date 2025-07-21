import { MaintenanceMaterialRequest, MaintenanceMaterialRequestItem, Equipment, ClassMaintenanceType } from '../types';
import { DataStorage } from './dataStorage';
import { OfflineDataManager } from './offlineDataManager';
import { AuthManager } from './authUtils';
import { PurchaseRequestService } from './purchaseRequestService';

export class MaintenanceWorkflowService {
  private static instance: MaintenanceWorkflowService;

  static getInstance(): MaintenanceWorkflowService {
    if (!MaintenanceWorkflowService.instance) {
      MaintenanceWorkflowService.instance = new MaintenanceWorkflowService();
    }
    return MaintenanceWorkflowService.instance;
  }

  // Determine maintenance class based on equipment usage and configs
  async determineMaintenanceClass(equipment: Equipment): Promise<'A' | 'B' | 'C'> {
    try {
      // Get equipment usage hours
      const usageHours = await this.calculateEquipmentUsageHours(equipment.id);
      
      // Get preventive maintenance config for this equipment type
      const configs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
      const config = configs.find(c => c.equipment_type === equipment.type && c.is_active);
      
      if (!config) {
        console.warn(`No preventive maintenance config found for equipment type: ${equipment.type}`);
        return 'A'; // Default to Class A
      }

      // Determine class based on usage hours vs thresholds
      if (usageHours >= config.class_c_threshold_hours) {
        return 'C';
      } else if (usageHours >= config.class_b_threshold_hours) {
        return 'B';
      } else {
        return 'A';
      }
    } catch (error) {
      console.error('Error determining maintenance class:', error);
      return 'A'; // Default to Class A
    }
  }

  // Calculate equipment usage hours from time logs
  private async calculateEquipmentUsageHours(equipmentId: string): Promise<number> {
    try {
      const logs = await OfflineDataManager.getAllTimeLogs();
      const equipmentLogs = logs.filter(log => log.entity_id === equipmentId);
      
      let totalHours = 0;
      let sessionStart: Date | null = null;

      for (const log of equipmentLogs) {
        if (log.action === 'start-use' && !sessionStart) {
          sessionStart = new Date(log.timestamp);
        } else if (log.action === 'stop-use' && sessionStart) {
          const sessionEnd = new Date(log.timestamp);
          const sessionHours = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60 * 60);
          totalHours += sessionHours;
          sessionStart = null;
        }
      }

      return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating equipment usage hours:', error);
      return 0;
    }
  }

  // Get materials for maintenance class from Class Maintenance Types
  async getMaterialsForMaintenanceClass(maintenanceClass: 'A' | 'B' | 'C'): Promise<ClassMaintenanceType[]> {
    try {
      const classTypes = await OfflineDataManager.getAllClassMaintenanceTypes();
      return classTypes.filter(type => type.is_active);
    } catch (error) {
      console.error('Error getting materials for maintenance class:', error);
      return [];
    }
  }

  // Create maintenance material request
  async createMaintenanceMaterialRequest(
    equipment: Equipment,
    maintenanceLogId: string,
    maintenanceClass: 'A' | 'B' | 'C',
    maintenanceType: string,
    estimatedDurationHours?: number
  ): Promise<{ success: boolean; data?: MaintenanceMaterialRequest; error?: string }> {
    try {
      const currentUser = AuthManager.getCurrentUserSync();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get materials for this maintenance class
      const classMaterials = await this.getMaterialsForMaintenanceClass(maintenanceClass);
      
      // Create the main request
      const requestData: Omit<MaintenanceMaterialRequest, 'id' | 'created_at' | 'updated_at'> = {
        maintenance_log_id: maintenanceLogId,
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        maintenance_class: maintenanceClass,
        maintenance_type: maintenanceType,
        status: 'pending',
        requested_by: currentUser.name || currentUser.username || 'System',
        site: equipment.site,
        priority: this.determinePriority(maintenanceClass, equipment),
        estimated_duration_hours: estimatedDurationHours,
        total_estimated_cost: 0
      };

      // Save to database
      const result = await OfflineDataManager.createMaintenanceMaterialRequest(requestData);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Failed to create maintenance material request' };
      }

      // Create request items for each material
      const requestItems: Omit<MaintenanceMaterialRequestItem, 'id' | 'created_at' | 'updated_at'>[] = [];
      
      for (const material of classMaterials) {
        // Check if material exists in inventory
        const inventoryMaterial = await this.findMaterialInInventory(material.spare_part);
        
        const item: Omit<MaintenanceMaterialRequestItem, 'id' | 'created_at' | 'updated_at'> = {
          request_id: result.data.id!,
          material_name: material.spare_part,
          material_type: material.maintenance_type,
          quantity_requested: material.estimated_quantity,
          quantity_issued: 0,
          uom: material.uom,
          estimated_unit_cost: 0, // Will be updated from inventory
          actual_unit_cost: 0,
          status: inventoryMaterial ? 'available' : 'unavailable',
          material_id: inventoryMaterial?.id,
          inventory_notes: inventoryMaterial ? 'Available in inventory' : 'Not available in inventory'
        };

        requestItems.push(item);
      }

      // Save request items
      for (const item of requestItems) {
        await OfflineDataManager.createMaintenanceMaterialRequestItem(item);
      }

      // Auto-generate PR for unavailable materials
      const unavailableItems = requestItems.filter(item => item.status === 'unavailable');
      if (unavailableItems.length > 0) {
        await this.autoGeneratePRForUnavailableMaterials(result.data, unavailableItems);
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error creating maintenance material request:', error);
      return { success: false, error: 'Failed to create maintenance material request' };
    }
  }

  // Find material in inventory by name
  private async findMaterialInInventory(materialName: string): Promise<any> {
    try {
      const materials = await OfflineDataManager.getAllMaterials();
      return materials.find(m => 
        m.name.toLowerCase().includes(materialName.toLowerCase()) ||
        materialName.toLowerCase().includes(m.name.toLowerCase())
      );
    } catch (error) {
      console.error('Error finding material in inventory:', error);
      return null;
    }
  }

  // Determine priority based on maintenance class and equipment
  private determinePriority(maintenanceClass: 'A' | 'B' | 'C', equipment: Equipment): 'low' | 'medium' | 'high' | 'urgent' {
    // Class C maintenance is typically urgent
    if (maintenanceClass === 'C') return 'urgent';
    
    // Class B maintenance is high priority
    if (maintenanceClass === 'B') return 'high';
    
    // Class A maintenance is medium priority
    return 'medium';
  }

  // Auto-generate PR for unavailable materials
  private async autoGeneratePRForUnavailableMaterials(
    request: MaintenanceMaterialRequest,
    unavailableItems: Omit<MaintenanceMaterialRequestItem, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<void> {
    try {
      const prItems = unavailableItems.map(item => ({
        material_name: item.material_name,
        material_type: item.material_type,
        quantity_required: item.quantity_requested,
        quantity_available: 0,
        unit: item.uom,
        estimated_unit_cost: item.estimated_unit_cost,
        total_estimated_cost: item.estimated_unit_cost * item.quantity_requested,
        urgency_reason: `Required for ${request.maintenance_class} maintenance of ${request.equipment_name}`,
        specifications: `Maintenance material request: ${request.id}`
      }));

      const prResult = await PurchaseRequestService.autoGeneratePRFromMaintenance(
        request.equipment_id,
        request.equipment_name,
        request.maintenance_type,
        prItems.map(item => ({
          materialId: '',
          materialName: item.material_name,
          materialType: item.material_type,
          quantity: item.quantity_required,
          unit: item.unit,
          availableStock: 0,
          estimatedCost: item.estimated_unit_cost,
          isSparePart: true,
          urgencyLevel: 'critical' as const,
          autoPRGenerated: true
        })),
        request.site,
        'Maintenance'
      );

      if (prResult.success && prResult.data) {
        // Update request items with PR reference
        // Note: We can't update items that haven't been saved yet, so we'll skip this for now
        // The PR reference will be updated when the items are actually saved
        console.log('PR generated for unavailable materials:', prResult.data.id);
      }
    } catch (error) {
      console.error('Error auto-generating PR for unavailable materials:', error);
    }
  }

  // Get all maintenance material requests
  async getAllMaintenanceMaterialRequests(): Promise<MaintenanceMaterialRequest[]> {
    try {
      return await OfflineDataManager.getAllMaintenanceMaterialRequests();
    } catch (error) {
      console.error('Error getting maintenance material requests:', error);
      return [];
    }
  }

  // Get maintenance material request by ID
  async getMaintenanceMaterialRequest(requestId: string): Promise<MaintenanceMaterialRequest | null> {
    try {
      return await OfflineDataManager.getMaintenanceMaterialRequest(requestId);
    } catch (error) {
      console.error('Error getting maintenance material request:', error);
      return null;
    }
  }

  // Get maintenance material request items
  async getMaintenanceMaterialRequestItems(requestId: string): Promise<MaintenanceMaterialRequestItem[]> {
    try {
      const allItems = await OfflineDataManager.getAllMaintenanceMaterialRequestItems();
      return allItems.filter(item => item.request_id === requestId);
    } catch (error) {
      console.error('Error getting maintenance material request items:', error);
      return [];
    }
  }

  // Issue materials for a request
  async issueMaterials(
    requestId: string,
    issuedBy: string,
    issuedItems: { itemId: string; quantityIssued: number; actualUnitCost: number }[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update each item
      for (const item of issuedItems) {
        await OfflineDataManager.updateMaintenanceMaterialRequestItem(item.itemId, {
          quantity_issued: item.quantityIssued,
          actual_unit_cost: item.actualUnitCost,
          status: 'issued'
        });

        // Update inventory if material_id exists
        const requestItem = await OfflineDataManager.getMaintenanceMaterialRequestItem(item.itemId);
        if (requestItem?.material_id) {
          await this.updateInventoryQuantity(requestItem.material_id, item.quantityIssued);
        }
      }

      // Update request status
      await OfflineDataManager.updateMaintenanceMaterialRequest(requestId, {
        issued_by: issuedBy,
        issued_at: new Date().toISOString(),
        status: 'pending_service'
      });

      return { success: true };
    } catch (error) {
      console.error('Error issuing materials:', error);
      return { success: false, error: 'Failed to issue materials' };
    }
  }

  // Update inventory quantity
  private async updateInventoryQuantity(materialId: string, quantityIssued: number): Promise<void> {
    try {
      const materials = await OfflineDataManager.getAllMaterials();
      const material = materials.find(m => m.id === materialId);
      
      if (material) {
        const newQuantity = Math.max(0, material.quantity - quantityIssued);
        const updatedMaterial = {
          ...material,
          quantity: newQuantity,
          status: newQuantity === 0 ? 'out-of-stock' : newQuantity < 50 ? 'low-stock' : 'available'
        };
        
        await OfflineDataManager.updateMaterial(updatedMaterial);
      }
    } catch (error) {
      console.error('Error updating inventory quantity:', error);
    }
  }

  // Complete maintenance
  async completeMaintenance(
    requestId: string,
    completedBy: string,
    actualDurationHours: number,
    actualCost: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await OfflineDataManager.updateMaintenanceMaterialRequest(requestId, {
        completed_by: completedBy,
        completed_at: new Date().toISOString(),
        status: 'completed',
        actual_duration_hours: actualDurationHours,
        total_actual_cost: actualCost
      });

      return { success: true };
    } catch (error) {
      console.error('Error completing maintenance:', error);
      return { success: false, error: 'Failed to complete maintenance' };
    }
  }

  // Get maintenance statistics for reporting
  async getMaintenanceStatistics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    awaitingInventory: number;
    pendingService: number;
    completedRequests: number;
    totalEstimatedCost: number;
    totalActualCost: number;
    averageCompletionTime: number;
    classBreakdown: { A: number; B: number; C: number };
    priorityBreakdown: { low: number; medium: number; high: number; urgent: number };
  }> {
    try {
      const requests = await this.getAllMaintenanceMaterialRequests();
      
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const awaitingInventory = requests.filter(r => r.status === 'awaiting_inventory').length;
      const pendingService = requests.filter(r => r.status === 'pending_service').length;
      const completedRequests = requests.filter(r => r.status === 'completed').length;
      
      const totalEstimatedCost = requests.reduce((sum, r) => sum + (r.total_estimated_cost || 0), 0);
      const totalActualCost = requests.reduce((sum, r) => sum + (r.total_actual_cost || 0), 0);
      
      const classBreakdown = {
        A: requests.filter(r => r.maintenance_class === 'A').length,
        B: requests.filter(r => r.maintenance_class === 'B').length,
        C: requests.filter(r => r.maintenance_class === 'C').length
      };
      
      const priorityBreakdown = {
        low: requests.filter(r => r.priority === 'low').length,
        medium: requests.filter(r => r.priority === 'medium').length,
        high: requests.filter(r => r.priority === 'high').length,
        urgent: requests.filter(r => r.priority === 'urgent').length
      };

      // Calculate average completion time
      const completedRequestsWithTime = requests.filter(r => 
        r.status === 'completed' && r.requested_at && r.completed_at
      );
      
      let averageCompletionTime = 0;
      if (completedRequestsWithTime.length > 0) {
        const totalTime = completedRequestsWithTime.reduce((sum, r) => {
          const requested = new Date(r.requested_at!).getTime();
          const completed = new Date(r.completed_at!).getTime();
          return sum + (completed - requested);
        }, 0);
        averageCompletionTime = totalTime / completedRequestsWithTime.length / (1000 * 60 * 60); // Convert to hours
      }

      return {
        totalRequests,
        pendingRequests,
        awaitingInventory,
        pendingService,
        completedRequests,
        totalEstimatedCost,
        totalActualCost,
        averageCompletionTime,
        classBreakdown,
        priorityBreakdown
      };
    } catch (error) {
      console.error('Error getting maintenance statistics:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        awaitingInventory: 0,
        pendingService: 0,
        completedRequests: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0,
        averageCompletionTime: 0,
        classBreakdown: { A: 0, B: 0, C: 0 },
        priorityBreakdown: { low: 0, medium: 0, high: 0, urgent: 0 }
      };
    }
  }
} 