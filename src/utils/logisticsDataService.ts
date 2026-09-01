// Logistics Data Service
// Comprehensive logistics management with local storage persistence

import {
  LogisticsTrigger,
  QRScanEvent,
  LogisticsAction,
  ActionExecution,
  LogisticsRecord,
  LogisticsPriceSheet,
  CostProfitMapping,
  CrossCharge,
  LogisticsDashboardData,
  LogisticsKPI,
  DepartmentAllocation,
  AssetMovementSummary,
  LogisticsAlert,
  LogisticsConfiguration,
  TriggerFormData,
  ActionFormData,
  PriceSheetFormData,
  LogisticsFilterOptions,
  TriggerTypes,
  ActionTypes,
  EntityTypes,
  PriorityLevels,
  StatusTypes
} from '../types/logistics';

import { supabase } from './supabaseClient';

class LogisticsDataService {
  private static instance: LogisticsDataService;
  private storageKey = 'logistics_data';

  // ===== PREDEFINED ACTIONS =====
  private defaultActions: LogisticsAction[] = [
    {
      id: 'action-001',
      action_type: 'deliver_to_site',
      action_name: 'Deliver to Site',
      description: 'Deliver equipment, materials, or crew to project site',
      applicable_entities: ['equipment', 'material', 'employee'],
      cost_center: 'LOGISTICS',
      profit_center: 'PC-PROJECTS',
      estimated_duration: 120,
      required_resources: ['truck', 'driver', 'helper'],
      is_active: true
    },
    {
      id: 'action-002',
      action_type: 'pickup_from_vendor',
      action_name: 'Pickup from Vendor',
      description: 'Pickup repaired equipment or new materials from vendor',
      applicable_entities: ['equipment', 'material'],
      cost_center: 'LOGISTICS',
      profit_center: 'PC-PROCUREMENT',
      estimated_duration: 90,
      required_resources: ['truck', 'driver'],
      is_active: true
    },
    {
      id: 'action-003',
      action_type: 'send_to_workshop',
      action_name: 'Send to Workshop',
      description: 'Send equipment for repair or maintenance to workshop',
      applicable_entities: ['equipment'],
      cost_center: 'LOGISTICS',
      profit_center: 'PC-WORKSHOP',
      estimated_duration: 60,
      required_resources: ['truck', 'driver'],
      is_active: true
    },
    {
      id: 'action-004',
      action_type: 'replenish_store',
      action_name: 'Replenish Store',
      description: 'Replenish inventory in central store or warehouse',
      applicable_entities: ['material'],
      cost_center: 'LOGISTICS',
      profit_center: 'PC-INVENTORY',
      estimated_duration: 45,
      required_resources: ['truck', 'driver', 'helper'],
      is_active: true
    },
    {
      id: 'action-005',
      action_type: 'crew_transfer',
      action_name: 'Crew Transfer',
      description: 'Transfer crew members between sites or facilities',
      applicable_entities: ['employee'],
      cost_center: 'LOGISTICS',
      profit_center: 'PC-HR',
      estimated_duration: 75,
      required_resources: ['van', 'driver'],
      is_active: true
    }
  ];

  // ===== COST/PROFIT CENTER MAPPINGS =====
  private defaultMappings: CostProfitMapping[] = [
    {
      id: 'mapping-001',
      department: 'Logistics',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-LOGISTICS',
      description: 'Logistics department cost and profit center',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mapping-002',
      department: 'Projects',
      cost_center: 'CC-PROJECTS',
      profit_center: 'PC-PROJECTS',
      description: 'Project department cost and profit center',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mapping-003',
      department: 'Workshop',
      cost_center: 'CC-WORKSHOP',
      profit_center: 'PC-WORKSHOP',
      description: 'Workshop department cost and profit center',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mapping-004',
      department: 'HR',
      cost_center: 'CC-HR',
      profit_center: 'PC-HR',
      description: 'HR department cost and profit center',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mapping-005',
      department: 'Inventory',
      cost_center: 'CC-INVENTORY',
      profit_center: 'PC-INVENTORY',
      description: 'Inventory department cost and profit center',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // ===== PRICE SHEET =====
  private defaultPriceSheet: LogisticsPriceSheet[] = [
    {
      id: 'price-001',
      service_name: 'Equipment Delivery',
      service_type: 'delivery',
      base_rate: 500,
      unit: 'per delivery',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-LOGISTICS',
      is_active: true,
      effective_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'price-002',
      service_name: 'Material Transport',
      service_type: 'transport',
      base_rate: 300,
      unit: 'per ton',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-LOGISTICS',
      is_active: true,
      effective_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'price-003',
      service_name: 'Crew Transfer',
      service_type: 'transfer',
      base_rate: 200,
      unit: 'per person',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-LOGISTICS',
      is_active: true,
      effective_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // ===== SAMPLE TRIGGERS =====
  private sampleTriggers: LogisticsTrigger[] = [
    {
      id: 'trigger-001',
      trigger_type: 'maintenance',
      trigger_subtype: 'repair_needed',
      entity_id: 'equipment-001',
      entity_type: 'equipment',
      entity_name: 'Excavator CAT320',
      description: 'Hydraulic system failure, needs repair at workshop',
      priority: 'high',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location_from: 'Site A',
      location_to: 'Central Workshop',
      reference_id: 'JOB-2024-001'
    },
    {
      id: 'trigger-002',
      trigger_type: 'project',
      trigger_subtype: 'crew_movement',
      entity_id: 'employee-001',
      entity_type: 'employee',
      entity_name: 'Ahmed Hassan',
      description: 'Crew transfer from Site A to Site B for new project',
      priority: 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location_from: 'Site A',
      location_to: 'Site B',
      reference_id: 'PROJ-2024-002'
    },
    {
      id: 'trigger-003',
      trigger_type: 'inventory',
      trigger_subtype: 'low_stock',
      entity_id: 'material-001',
      entity_type: 'material',
      entity_name: 'Steel Beams',
      description: 'Low stock alert, need replenishment from supplier',
      priority: 'high',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location_from: 'Supplier Warehouse',
      location_to: 'Central Store',
      quantity: 50,
      unit: 'pieces',
      reference_id: 'PO-2024-003'
    },
    {
      id: 'trigger-004',
      trigger_type: 'procurement',
      trigger_subtype: 'material_received',
      entity_id: 'material-002',
      entity_type: 'material',
      entity_name: 'Cement Bags',
      description: 'New cement shipment received, needs distribution to sites',
      priority: 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location_from: 'Central Store',
      location_to: 'Site A',
      quantity: 1000,
      unit: 'bags',
      reference_id: 'PO-2024-004'
    },
    {
      id: 'trigger-005',
      trigger_type: 'hr',
      trigger_subtype: 'new_joiner',
      entity_id: 'employee-002',
      entity_type: 'employee',
      entity_name: 'Sarah Al-Rashid',
      description: 'New employee joining, needs pickup from airport',
      priority: 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      location_from: 'King Khalid Airport',
      location_to: 'Company HQ',
      reference_id: 'HR-2024-005'
    }
  ];

  // ===== SAMPLE QR SCAN EVENTS =====
  private sampleQRScans: QRScanEvent[] = [
    {
      id: 'qr-001',
      qr_code: 'EQ-001-2024',
      entity_type: 'equipment',
      entity_id: 'equipment-001',
      entity_name: 'Excavator CAT320',
      scanned_at: new Date().toISOString(),
      scanned_by: 'Mohammed Ali',
      location: 'Site A',
      available_actions: this.defaultActions.filter(a => a.applicable_entities.includes('equipment')),
      trigger_id: 'trigger-001'
    },
    {
      id: 'qr-002',
      qr_code: 'EMP-001-2024',
      entity_type: 'employee',
      entity_id: 'employee-001',
      entity_name: 'Ahmed Hassan',
      scanned_at: new Date().toISOString(),
      scanned_by: 'Logistics Team',
      location: 'Site A',
      available_actions: this.defaultActions.filter(a => a.applicable_entities.includes('employee')),
      trigger_id: 'trigger-002'
    },
    {
      id: 'qr-003',
      qr_code: 'MAT-001-2024',
      entity_type: 'material',
      entity_id: 'material-001',
      entity_name: 'Steel Beams',
      scanned_at: new Date().toISOString(),
      scanned_by: 'Store Keeper',
      location: 'Central Store',
      available_actions: this.defaultActions.filter(a => a.applicable_entities.includes('material')),
      trigger_id: 'trigger-003'
    }
  ];

  // ===== SAMPLE EXECUTIONS =====
  private sampleExecutions: ActionExecution[] = [
    {
      id: 'exec-001',
      trigger_id: 'trigger-001',
      qr_scan_id: 'qr-001',
      action_id: 'action-003',
      action_name: 'Send to Workshop',
      entity_id: 'equipment-001',
      entity_type: 'equipment',
      entity_name: 'Excavator CAT320',
      location_from: 'Site A',
      location_to: 'Central Workshop',
      executed_by: 'Logistics Team',
      executed_at: new Date().toISOString(),
      status: 'completed',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-WORKSHOP',
      cross_charge_amount: 500,
      reference_id: 'JOB-2024-001',
      notes: 'Equipment safely delivered to workshop for hydraulic repair'
    },
    {
      id: 'exec-002',
      trigger_id: 'trigger-002',
      qr_scan_id: 'qr-002',
      action_id: 'action-005',
      action_name: 'Crew Transfer',
      entity_id: 'employee-001',
      entity_type: 'employee',
      entity_name: 'Ahmed Hassan',
      location_from: 'Site A',
      location_to: 'Site B',
      executed_by: 'Transport Team',
      executed_at: new Date().toISOString(),
      status: 'completed',
      cost_center: 'LOGISTICS',
      profit_center: 'PC-HR',
      cross_charge_amount: 200,
      reference_id: 'PROJ-2024-002',
      notes: 'Crew member successfully transferred to new project site'
    }
  ];

  // ===== SAMPLE RECORDS =====
  private sampleRecords: LogisticsRecord[] = [
    {
      id: 'record-001',
      record_type: 'equipment_transfer',
      entity_id: 'equipment-001',
      entity_type: 'equipment',
      entity_name: 'Excavator CAT320',
      quantity: 1,
      unit: 'unit',
      value: 500000,
      location_from: 'Site A',
      location_to: 'Central Workshop',
      cost_element: 'Equipment Movement',
      uom: 'per delivery',
      trigger_id: 'trigger-001',
      execution_id: 'exec-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'completed',
      notes: 'Equipment transferred for repair'
    },
    {
      id: 'record-002',
      record_type: 'crew_transfer',
      entity_id: 'employee-001',
      entity_type: 'employee',
      entity_name: 'Ahmed Hassan',
      quantity: 1,
      unit: 'person',
      value: 200,
      location_from: 'Site A',
      location_to: 'Site B',
      cost_element: 'Crew Movement',
      uom: 'per person',
      trigger_id: 'trigger-002',
      execution_id: 'exec-002',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'completed',
      notes: 'Crew member transferred to new project'
    }
  ];

  // ===== SAMPLE CROSS CHARGES =====
  private sampleCrossCharges: CrossCharge[] = [
    {
      id: 'cross-001',
      execution_id: 'exec-001',
      from_cost_center: 'LOGISTICS',
      to_cost_center: 'CC-WORKSHOP',
      from_profit_center: 'PC-LOGISTICS',
      to_profit_center: 'PC-WORKSHOP',
      amount: 500,
      quantity: 1,
      unit: 'delivery',
      rate: 500,
      description: 'Equipment delivery service charge',
      created_at: new Date().toISOString(),
      reference_id: 'JOB-2024-001'
    },
    {
      id: 'cross-002',
      execution_id: 'exec-002',
      from_cost_center: 'LOGISTICS',
      to_cost_center: 'CC-HR',
      from_profit_center: 'PC-LOGISTICS',
      to_profit_center: 'PC-HR',
      amount: 200,
      quantity: 1,
      unit: 'person',
      rate: 200,
      description: 'Crew transfer service charge',
      created_at: new Date().toISOString(),
      reference_id: 'PROJ-2024-002'
    }
  ];

  // ===== SAMPLE ALERTS =====
  private sampleAlerts: LogisticsAlert[] = [
    {
      id: 'alert-001',
      alert_type: 'trigger_pending',
      severity: 'high',
      title: 'High Priority Maintenance Trigger',
      message: 'Excavator CAT320 needs immediate repair - hydraulic system failure',
      entity_id: 'equipment-001',
      entity_type: 'equipment',
      trigger_id: 'trigger-001',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'alert-002',
      alert_type: 'action_overdue',
      severity: 'medium',
      title: 'Crew Transfer Overdue',
      message: 'Crew transfer from Site A to Site B is overdue by 2 hours',
      entity_id: 'employee-001',
      entity_type: 'employee',
      trigger_id: 'trigger-002',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ];

  // ===== CONFIGURATION =====
  private defaultConfiguration: LogisticsConfiguration = {
    auto_trigger_enabled: true,
    qr_scan_required: true,
    cross_charge_enabled: true,
    price_sheet_enabled: true,
    notification_settings: {
      trigger_alerts: true,
      completion_notifications: true,
      cost_overrun_alerts: true
    },
    default_cost_center: 'LOGISTICS',
    default_profit_center: 'PC-LOGISTICS',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): LogisticsDataService {
    if (!LogisticsDataService.instance) {
      LogisticsDataService.instance = new LogisticsDataService();
    }
    return LogisticsDataService.instance;
  }

  // ===== INITIALIZATION =====
  private initializeData(): void {
    const existingData = this.getStoredData();
    if (!existingData) {
      const initialData = {
        triggers: this.sampleTriggers,
        qrScans: this.sampleQRScans,
        actions: this.defaultActions,
        executions: this.sampleExecutions,
        records: this.sampleRecords,
        priceSheet: this.defaultPriceSheet,
        mappings: this.defaultMappings,
        crossCharges: this.sampleCrossCharges,
        alerts: this.sampleAlerts,
        configuration: this.defaultConfiguration
      };
      this.saveData(initialData);
    }
  }

  // ===== DATA PERSISTENCE =====
  private getStoredData(): any {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading logistics data:', error);
      return null;
    }
  }

  private saveData(data: any): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving logistics data:', error);
    }
  }

  // ===== TRIGGER MANAGEMENT =====
  public getTriggers(): LogisticsTrigger[] {
    const data = this.getStoredData();
    return data?.triggers || [];
  }

  public getTriggerById(id: string): LogisticsTrigger | null {
    const triggers = this.getTriggers();
    return triggers.find(t => t.id === id) || null;
  }

  public createTrigger(triggerData: TriggerFormData): LogisticsTrigger {
    const data = this.getStoredData();
    const newTrigger: LogisticsTrigger = {
      id: `trigger-${Date.now()}`,
      trigger_type: triggerData.trigger_type as any,
      trigger_subtype: triggerData.trigger_subtype,
      entity_id: triggerData.entity_id,
      entity_type: triggerData.entity_type as any,
      entity_name: triggerData.entity_id, // This should be resolved from entity data
      description: triggerData.description,
      priority: triggerData.priority as any,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reference_id: triggerData.reference_id,
      location_from: triggerData.location_from,
      location_to: triggerData.location_to,
      quantity: triggerData.quantity,
      unit: triggerData.unit
    };

    data.triggers.push(newTrigger);
    this.saveData(data);
    return newTrigger;
  }

  public updateTrigger(id: string, updates: Partial<LogisticsTrigger>): LogisticsTrigger | null {
    const data = this.getStoredData();
    const index = data.triggers.findIndex((t: LogisticsTrigger) => t.id === id);
    if (index !== -1) {
      data.triggers[index] = { ...data.triggers[index], ...updates, updated_at: new Date().toISOString() };
      this.saveData(data);
      return data.triggers[index];
    }
    return null;
  }

  public deleteTrigger(id: string): boolean {
    const data = this.getStoredData();
    const index = data.triggers.findIndex((t: LogisticsTrigger) => t.id === id);
    if (index !== -1) {
      data.triggers.splice(index, 1);
      this.saveData(data);
      return true;
    }
    return false;
  }

  // ===== QR SCAN MANAGEMENT =====
  public getQRScans(): QRScanEvent[] {
    const data = this.getStoredData();
    return data?.qrScans || [];
  }

  public async uploadQRScanToSupabase(qrScan: QRScanEvent) {
    if (!supabase) {
      console.warn('Supabase client not configured. Skipping upload of QR scan event.');
      return;
    }
    try {
      const { data, error } = await supabase.from('qr_scan_events').insert([qrScan]);
      if (error) {
        console.error('Failed to upload QR scan event to Supabase:', error);
      } else {
        console.log('QR scan event uploaded to Supabase:', data);
      }
    } catch (err) {
      console.error('Error uploading QR scan event to Supabase:', err);
    }
  }

  public createQRScan(qrData: Partial<QRScanEvent>): QRScanEvent {
    const data = this.getStoredData();
    const newScan: QRScanEvent = {
      id: `qr-${Date.now()}`,
      qr_code: qrData.qr_code || '',
      entity_type: qrData.entity_type || 'equipment',
      entity_id: qrData.entity_id || '',
      entity_name: qrData.entity_name || '',
      scanned_at: new Date().toISOString(),
      scanned_by: qrData.scanned_by || 'System',
      location: qrData.location || '',
      available_actions: qrData.available_actions || [],
      trigger_id: qrData.trigger_id
    };
    data.qrScans.push(newScan);
    this.saveData(data);
    // Upload to Supabase for audit/analytics
    this.uploadQRScanToSupabase(newScan);
    return newScan;
  }

  // ===== ACTION MANAGEMENT =====
  public getActions(): LogisticsAction[] {
    const data = this.getStoredData();
    return data?.actions || [];
  }

  public getActionsByEntityType(entityType: string): LogisticsAction[] {
    const actions = this.getActions();
    return actions.filter(a => a.applicable_entities.includes(entityType));
  }

  // ===== EXECUTION MANAGEMENT =====
  public getExecutions(): ActionExecution[] {
    const data = this.getStoredData();
    return data?.executions || [];
  }

  public createExecution(executionData: ActionFormData, triggerId: string, qrScanId: string): ActionExecution {
    const data = this.getStoredData();
    const action = this.getActions().find(a => a.action_type === executionData.action_type);
    
    const newExecution: ActionExecution = {
      id: `exec-${Date.now()}`,
      trigger_id: triggerId,
      qr_scan_id: qrScanId,
      action_id: action?.id || '',
      action_name: action?.action_name || executionData.action_type,
      entity_id: executionData.entity_id,
      entity_type: executionData.entity_type,
      entity_name: executionData.entity_id, // Should be resolved from entity data
      quantity: executionData.quantity,
      unit: executionData.unit,
      location_from: executionData.location_from,
      location_to: executionData.location_to,
      executed_by: 'Current User', // Should be from auth context
      executed_at: new Date().toISOString(),
      status: 'in_progress',
      cost_center: action?.cost_center || 'LOGISTICS',
      profit_center: action?.profit_center || 'PC-LOGISTICS',
      reference_id: triggerId,
      notes: executionData.notes
    };

    data.executions.push(newExecution);
    this.saveData(data);
    return newExecution;
  }

  public updateExecutionStatus(id: string, status: 'in_progress' | 'completed' | 'failed'): ActionExecution | null {
    const data = this.getStoredData();
    const index = data.executions.findIndex((e: ActionExecution) => e.id === id);
    if (index !== -1) {
      data.executions[index].status = status;
      data.executions[index].executed_at = new Date().toISOString();
      this.saveData(data);
      return data.executions[index];
    }
    return null;
  }

  // ===== RECORD MANAGEMENT =====
  public getRecords(): LogisticsRecord[] {
    const data = this.getStoredData();
    return data?.records || [];
  }

  public createRecord(recordData: Partial<LogisticsRecord>): LogisticsRecord {
    const data = this.getStoredData();
    const newRecord: LogisticsRecord = {
      id: `record-${Date.now()}`,
      record_type: recordData.record_type || 'material_movement',
      entity_id: recordData.entity_id || '',
      entity_type: recordData.entity_type || '',
      entity_name: recordData.entity_name || '',
      quantity: recordData.quantity || 0,
      unit: recordData.unit || '',
      value: recordData.value || 0,
      location_from: recordData.location_from || '',
      location_to: recordData.location_to || '',
      cost_element: recordData.cost_element || '',
      uom: recordData.uom || '',
      trigger_id: recordData.trigger_id || '',
      execution_id: recordData.execution_id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      notes: recordData.notes
    };

    data.records.push(newRecord);
    this.saveData(data);
    return newRecord;
  }

  // ===== PRICE SHEET MANAGEMENT =====
  public getPriceSheet(): LogisticsPriceSheet[] {
    const data = this.getStoredData();
    return data?.priceSheet || [];
  }

  public createPriceSheet(priceData: PriceSheetFormData): LogisticsPriceSheet {
    const data = this.getStoredData();
    const newPrice: LogisticsPriceSheet = {
      id: `price-${Date.now()}`,
      service_name: priceData.service_name,
      service_type: priceData.service_type,
      base_rate: priceData.base_rate,
      unit: priceData.unit,
      cost_center: priceData.cost_center,
      profit_center: priceData.profit_center,
      is_active: true,
      effective_from: priceData.effective_from,
      effective_to: priceData.effective_to,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    data.priceSheet.push(newPrice);
    this.saveData(data);
    return newPrice;
  }

  // ===== CROSS CHARGE MANAGEMENT =====
  public getCrossCharges(): CrossCharge[] {
    const data = this.getStoredData();
    return data?.crossCharges || [];
  }

  public createCrossCharge(executionId: string, amount: number, quantity: number, unit: string, rate: number): CrossCharge {
    const data = this.getStoredData();
    const execution = data.executions.find((e: ActionExecution) => e.id === executionId);
    
    if (!execution) {
      throw new Error('Execution not found');
    }

    const newCrossCharge: CrossCharge = {
      id: `cross-${Date.now()}`,
      execution_id: executionId,
      from_cost_center: execution.cost_center,
      to_cost_center: execution.cost_center, // This should be determined by business logic
      from_profit_center: execution.profit_center,
      to_profit_center: execution.profit_center, // This should be determined by business logic
      amount: amount,
      quantity: quantity,
      unit: unit,
      rate: rate,
      description: `Cross charge for ${execution.action_name}`,
      created_at: new Date().toISOString(),
      reference_id: execution.reference_id
    };

    data.crossCharges.push(newCrossCharge);
    this.saveData(data);
    return newCrossCharge;
  }

  // ===== ALERT MANAGEMENT =====
  public getAlerts(): LogisticsAlert[] {
    const data = this.getStoredData();
    return data?.alerts || [];
  }

  public createAlert(alertData: Partial<LogisticsAlert>): LogisticsAlert {
    const data = this.getStoredData();
    const newAlert: LogisticsAlert = {
      id: `alert-${Date.now()}`,
      alert_type: alertData.alert_type || 'trigger_pending',
      severity: alertData.severity || 'medium',
      title: alertData.title || 'Logistics Alert',
      message: alertData.message || '',
      entity_id: alertData.entity_id,
      entity_type: alertData.entity_type,
      trigger_id: alertData.trigger_id,
      action_id: alertData.action_id,
      is_read: false,
      created_at: new Date().toISOString()
    };

    data.alerts.push(newAlert);
    this.saveData(data);
    return newAlert;
  }

  public markAlertAsRead(id: string): boolean {
    const data = this.getStoredData();
    const index = data.alerts.findIndex((a: LogisticsAlert) => a.id === id);
    if (index !== -1) {
      data.alerts[index].is_read = true;
      this.saveData(data);
      return true;
    }
    return false;
  }

  // ===== CONFIGURATION MANAGEMENT =====
  public getConfiguration(): LogisticsConfiguration {
    const data = this.getStoredData();
    return data?.configuration || this.defaultConfiguration;
  }

  public updateConfiguration(updates: Partial<LogisticsConfiguration>): LogisticsConfiguration {
    const data = this.getStoredData();
    data.configuration = { ...data.configuration, ...updates, updated_at: new Date().toISOString() };
    this.saveData(data);
    return data.configuration;
  }

  // ===== DASHBOARD DATA =====
  public getDashboardData(): LogisticsDashboardData {
    const triggers = this.getTriggers();
    const executions = this.getExecutions();
    const records = this.getRecords();
    const crossCharges = this.getCrossCharges();

    const kpis: LogisticsKPI[] = [
      {
        id: 'kpi-001',
        kpi_name: 'Trigger Response Time',
        kpi_value: 2.5,
        kpi_unit: 'hours',
        kpi_type: 'time',
        target_value: 4,
        actual_value: 2.5,
        variance_percentage: -37.5,
        period: 'This Month',
        trend: 'up'
      },
      {
        id: 'kpi-002',
        kpi_name: 'Action Completion Rate',
        kpi_value: 95,
        kpi_unit: '%',
        kpi_type: 'efficiency',
        target_value: 90,
        actual_value: 95,
        variance_percentage: 5.6,
        period: 'This Month',
        trend: 'up'
      },
      {
        id: 'kpi-003',
        kpi_name: 'Average Cost per Movement',
        kpi_value: 350,
        kpi_unit: 'SAR',
        kpi_type: 'cost',
        target_value: 400,
        actual_value: 350,
        variance_percentage: -12.5,
        period: 'This Month',
        trend: 'up'
      }
    ];

    const departmentAllocations: DepartmentAllocation[] = [
      {
        department: 'Projects',
        cost_center: 'CC-PROJECTS',
        total_allocated: 15000,
        total_charged: 12000,
        net_amount: 3000,
        movement_count: 25,
        period: 'This Month'
      },
      {
        department: 'Workshop',
        cost_center: 'CC-WORKSHOP',
        total_allocated: 8000,
        total_charged: 7500,
        net_amount: 500,
        movement_count: 15,
        period: 'This Month'
      },
      {
        department: 'HR',
        cost_center: 'CC-HR',
        total_allocated: 5000,
        total_charged: 4800,
        net_amount: 200,
        movement_count: 10,
        period: 'This Month'
      }
    ];

    const assetMovementSummary: AssetMovementSummary[] = [
      {
        asset_type: 'Equipment',
        total_movements: 20,
        total_value: 5000000,
        average_duration: 120,
        most_common_destination: 'Central Workshop',
        period: 'This Month'
      },
      {
        asset_type: 'Materials',
        total_movements: 35,
        total_value: 250000,
        average_duration: 90,
        most_common_destination: 'Site A',
        period: 'This Month'
      },
      {
        asset_type: 'Crew',
        total_movements: 15,
        total_value: 3000,
        average_duration: 75,
        most_common_destination: 'Site B',
        period: 'This Month'
      }
    ];

    return {
      total_triggers: triggers.length,
      active_triggers: triggers.filter(t => t.status === 'active').length,
      completed_actions: executions.filter(e => e.status === 'completed').length,
      pending_actions: executions.filter(e => e.status === 'in_progress').length,
      total_movements: records.length,
      total_cross_charges: crossCharges.length,
      logistics_kpis: kpis,
      recent_movements: records.slice(-5),
      department_allocations: departmentAllocations,
      asset_movement_summary: assetMovementSummary
    };
  }

  // ===== FILTERING AND SEARCH =====
  public filterTriggers(filters: LogisticsFilterOptions): LogisticsTrigger[] {
    let triggers = this.getTriggers();

    if (filters.trigger_type) {
      triggers = triggers.filter(t => t.trigger_type === filters.trigger_type);
    }

    if (filters.entity_type) {
      triggers = triggers.filter(t => t.entity_type === filters.entity_type);
    }

    if (filters.status) {
      triggers = triggers.filter(t => t.status === filters.status);
    }

    if (filters.priority) {
      triggers = triggers.filter(t => t.priority === filters.priority);
    }

    if (filters.date_range) {
      triggers = triggers.filter(t => {
        const createdDate = new Date(t.created_at);
        const startDate = new Date(filters.date_range!.start_date);
        const endDate = new Date(filters.date_range!.end_date);
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    return triggers;
  }

  // ===== UTILITY METHODS =====
  public getEntityName(entityId: string, entityType: string): string {
    // This should integrate with the main system's entity data
    // For now, return a placeholder
    return `${entityType} ${entityId}`;
  }

  public calculateCrossCharge(quantity: number, rate: number): number {
    return quantity * rate;
  }

  public generateReferenceId(type: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}`;
  }

  // ===== RESET DATA (FOR TESTING) =====
  public resetToSampleData(): void {
    localStorage.removeItem(this.storageKey);
    this.initializeData();
  }
}

export default LogisticsDataService; 