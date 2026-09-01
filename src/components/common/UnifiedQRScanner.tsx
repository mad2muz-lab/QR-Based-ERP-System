import React, { useState, useEffect } from 'react';
import { X, QrCode, Users, Wrench, Package, Truck, MapPin, Clock, AlertTriangle, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import QRScanner from '../scanner/QRScanner';

export interface EntityData {
  id: string;
  name: string;
  type: 'employee' | 'equipment' | 'material' | 'vehicle';
  details?: Record<string, any>;
}

export interface ScannerContext {
  module: 'movement' | 'maintenance' | 'hr' | 'qhse' | 'audit' | 'finance';
  context: string;
  onEntitySelected: (entity: EntityData, action: string) => void;
}

interface UnifiedQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  context: ScannerContext;
}

const UnifiedQRScanner: React.FC<UnifiedQRScannerProps> = ({ isOpen, onClose, context }) => {
  const [scanning, setScanning] = useState(true);
  const [scannedEntity, setScannedEntity] = useState<EntityData | null>(null);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  // Entity type detection logic
  const detectEntityType = (result: string): EntityData | null => {
    try {
      // Try to parse as JSON first
      const parsedData = JSON.parse(result);
      
      // Check if it's an employee
      if (parsedData.name && (
        parsedData.type?.toLowerCase().includes('employee') || 
        parsedData.position || 
        parsedData.department ||
        parsedData.role ||
        parsedData.job_title ||
        parsedData.employee_id ||
        parsedData.staff_id
      )) {
        return {
          id: parsedData.id || parsedData.employee_id || parsedData.staff_id || result,
          name: parsedData.name,
          type: 'employee',
          details: parsedData
        };
      }
      
      // Check if it's equipment or vehicle
      else if (parsedData.name && (
        parsedData.type?.toLowerCase().includes('equipment') || 
        parsedData.model || 
        parsedData.make ||
        parsedData.equipment_id ||
        parsedData.asset_id ||
        parsedData.serial_number ||
        parsedData.registration_number
      )) {
        // Check if it's specifically a vehicle
        const nameLower = parsedData.name.toLowerCase();
        const typeLower = parsedData.type?.toLowerCase() || '';
        const modelLower = parsedData.model?.toLowerCase() || '';
        
        const isVehicle = typeLower.includes('vehicle') || nameLower.includes('vehicle') || 
          nameLower.includes('truck') || nameLower.includes('car') || 
          nameLower.includes('bus') || nameLower.includes('van') || 
          nameLower.includes('pickup') || nameLower.includes('trailer') ||
          nameLower.includes('loader') || nameLower.includes('excavator') ||
          nameLower.includes('bulldozer') || nameLower.includes('crane') ||
          nameLower.includes('grader') || modelLower.includes('vehicle');

        return {
          id: parsedData.id || parsedData.equipment_id || parsedData.asset_id || result,
          name: parsedData.name,
          type: isVehicle ? 'vehicle' : 'equipment',
          details: parsedData
        };
      }
      
      // Check if it's material
      else if (parsedData.name && (
        parsedData.type?.toLowerCase().includes('material') || 
        parsedData.category || 
        parsedData.specification ||
        parsedData.material_id ||
        parsedData.stock_id
      )) {
        return {
          id: parsedData.id || parsedData.material_id || parsedData.stock_id || result,
          name: parsedData.name,
          type: 'material',
          details: parsedData
        };
      }
    } catch (e) {
      // If not JSON, try to detect from content patterns
      const lowerResult = result.toLowerCase();
      
      // Check for employee indicators
      if (lowerResult.includes('employee') || lowerResult.includes('staff') || 
          lowerResult.includes('worker') || lowerResult.includes('technician') ||
          lowerResult.includes('engineer') || lowerResult.includes('supervisor') ||
          lowerResult.includes('manager') || lowerResult.includes('operator')) {
        return {
          id: result,
          name: result,
          type: 'employee',
          details: { rawData: result }
        };
      }
      // Check for vehicle indicators
      else if (lowerResult.includes('vehicle') || lowerResult.includes('truck') || 
               lowerResult.includes('car') || lowerResult.includes('bus') || 
               lowerResult.includes('van') || lowerResult.includes('pickup') ||
               lowerResult.includes('trailer') || lowerResult.includes('loader') ||
               lowerResult.includes('excavator') || lowerResult.includes('bulldozer') ||
               lowerResult.includes('crane') || lowerResult.includes('grader')) {
        return {
          id: result,
          name: result,
          type: 'vehicle',
          details: { rawData: result }
        };
      }
      // Check for material indicators
      else if (lowerResult.includes('material') || lowerResult.includes('part') || 
               lowerResult.includes('component') || lowerResult.includes('supply') ||
               lowerResult.includes('tool') || lowerResult.includes('spare') ||
               lowerResult.includes('consumable') || lowerResult.includes('inventory')) {
        return {
          id: result,
          name: result,
          type: 'material',
          details: { rawData: result }
        };
      }
      // Default to equipment for construction/industrial items
      else if (lowerResult.includes('equipment') || lowerResult.includes('machine') ||
               lowerResult.includes('plant') || lowerResult.includes('system')) {
        return {
          id: result,
          name: result,
          type: 'equipment',
          details: { rawData: result }
        };
      }
    }
    
    return null;
  };

  // Get context-specific actions for Resource Movement Management
  const getMovementActions = (entityType: string): string[] => {
    switch (entityType) {
      case 'employee':
        return [
          'Add to Transport List',
          'Assign as Driver',
          'Assign as Crew Member',
          'View Employee Details'
        ];
      case 'equipment':
        return [
          'Add to Equipment Transfer',
          'Mark for Relocation',
          'Include in Fleet Movement',
          'View Equipment Details'
        ];
      case 'material':
        return [
          'Add to Material Transfer',
          'Include in Shipment',
          'Add to Cargo List',
          'View Material Details'
        ];
      case 'vehicle':
        return [
          'Add to Fleet Deployment',
          'Assign Route',
          'Include in Convoy',
          'View Vehicle Details'
        ];
      default:
        return ['View Details'];
    }
  };

  // Get context-specific actions based on module and context
  const getContextSpecificActions = (entityType: string): string[] => {
    // For movement module, use movement-specific actions
    if (context.module === 'movement') {
      return getMovementActions(entityType);
    }
    
    // For other modules, provide general actions
    switch (entityType) {
      case 'employee':
        return [
          'View Employee Details',
          'Check In/Out',
          'Assign to Project',
          'View Schedule'
        ];
      case 'equipment':
        return [
          'View Equipment Details',
          'Start Use',
          'Stop Use',
          'Mark for Maintenance',
          'View Usage History'
        ];
      case 'material':
        return [
          'View Material Details',
          'Check Stock Level',
          'Request More',
          'View Usage History'
        ];
      case 'vehicle':
        return [
          'View Vehicle Details',
          'Start Trip',
          'End Trip',
          'Schedule Maintenance',
          'View Trip History'
        ];
      default:
        return ['View Details'];
    }
  };

  const handleScanResult = (result: string) => {
    const entity = detectEntityType(result);
    
    if (entity) {
      setScannedEntity(entity);
      const actions = getContextSpecificActions(entity.type);
      setAvailableActions(actions);
      setScanning(false);
    } else {
      // Handle unrecognized QR code
      alert('Unrecognized QR code format. Please try again.');
    }
  };

  const handleActionSelect = (action: string) => {
    if (scannedEntity) {
      // For movement module, we want to capture the entity regardless of the action
      // The action is mainly for UI feedback, but the entity data is what matters
      context.onEntitySelected(scannedEntity, action);
      onClose();
    }
  };

  const handleScanClose = () => {
    setScanning(false);
  };

  const resetScanner = () => {
    setScanning(true);
    setScannedEntity(null);
    setAvailableActions([]);
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'employee': return Users;
      case 'equipment': return Wrench;
      case 'material': return Package;
      case 'vehicle': return Truck;
      default: return QrCode;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'employee': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'equipment': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'material': return 'bg-green-50 border-green-200 text-green-800';
      case 'vehicle': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Unified QR Scanner</h2>
            <p className="text-sm text-gray-600">Scan any entity for Resource Movement Management</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scanner or Results */}
        {scanning ? (
          <div className="p-6">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Scan QR Code</span>
              </div>
              <p className="text-sm text-blue-700">
                Scan any QR code for employees, equipment, materials, or vehicles to add them to your movement request.
              </p>
            </div>
            
            <QRScanner
              onResult={handleScanResult}
              onError={(error) => console.error('QR Scan error:', error)}
              onClose={handleScanClose}
            />
          </div>
        ) : scannedEntity ? (
          <div className="p-6">
            {/* Scanned Entity Summary */}
            <div className={`mb-6 p-4 border rounded-lg ${getEntityColor(scannedEntity.type)}`}>
              <div className="flex items-center space-x-3">
                {React.createElement(getEntityIcon(scannedEntity.type), { 
                  className: "w-8 h-8" 
                })}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{scannedEntity.name}</h3>
                  <p className="text-sm capitalize">
                    {scannedEntity.type} • {scannedEntity.id}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>

            {/* Entity Details */}
            {scannedEntity.details && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Entity Details:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {scannedEntity.details.department && (
                    <p>Department: {scannedEntity.details.department}</p>
                  )}
                  {scannedEntity.details.position && (
                    <p>Position: {scannedEntity.details.position}</p>
                  )}
                  {scannedEntity.details.model && (
                    <p>Model: {scannedEntity.details.model}</p>
                  )}
                  {scannedEntity.details.category && (
                    <p>Category: {scannedEntity.details.category}</p>
                  )}
                </div>
              </div>
            )}

            {/* Available Actions */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Available Actions:</h4>
              <div className="grid grid-cols-1 gap-3">
                {availableActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionSelect(action)}
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Plus className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{action}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={resetScanner}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Scan Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UnifiedQRScanner; 