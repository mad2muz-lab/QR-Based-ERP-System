import React, { useState, useEffect } from 'react';
import { X, QrCode, Users, Wrench, Package, Truck, MapPin, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { fetchData } from '../../utils/dataProxy';
import { createMovementRequest } from '../../utils/resourceMovementDataService';

interface MovementRequestFormData {
  reference_id: string;
  movement_type: 'equipment' | 'crew' | 'material' | 'fleet';
  entity_type: string;
  entity_name: string;
  entity_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_duration: number;
  estimated_cost: number;
  notes: string;
  // Dynamic fields based on movement type
  crew_members: Array<{ id: string; name: string; position: string; customId: string; department?: string }>;
  equipment_list: Array<{ id: string; name: string; type: string; customId: string; site?: string }>;
  materials_list: Array<{ id: string; name: string; quantity: number; customId: string; category?: string }>;
  vehicles_list: Array<{ id: string; name: string; type: string; customId: string; licensePlate?: string }>;
}

interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Simple QR Scanner Component for Movement Modal
const SimpleQRScanner: React.FC<{
  onResult: (result: string) => void;
  onError: (error: any) => void;
  onClose: () => void;
}> = ({ onResult, onError, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);
  const [scanLock, setScanLock] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const qrScannerRef = React.useRef<QrScanner | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!videoRef.current) return;

      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          // Global scan lock to prevent any further processing
          if (scanLock || hasScanned) {
            console.log('QR Scanner: Scan locked or already scanned, ignoring:', result.data);
            return;
          }

          // Set locks immediately
          setScanLock(true);
          setHasScanned(true);
          
          console.log('QR Scanner: First scan detected:', result.data);
          
          // Stop scanning immediately
          stopScanning();
          
          // Process result after a small delay to ensure scanner is stopped
          setTimeout(() => {
            onResult(result.data);
          }, 50);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          overlay: undefined,
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();
      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
      setError('Failed to start camera. Please check camera permissions.');
      onError(err);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-64 object-cover rounded-lg"
      />
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      {hasScanned && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          QR Code detected! Processing...
        </div>
      )}
      {scanLock && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
          Scanner locked to prevent duplicates
        </div>
      )}
    </div>
  );
};

const NewMovementModal: React.FC<NewMovementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<MovementRequestFormData>({
    reference_id: '',
    movement_type: 'equipment',
    entity_type: '',
    entity_name: '',
    entity_id: '',
    quantity: 1,
    from_location: '',
    to_location: '',
    priority: 'medium',
    estimated_duration: 60,
    estimated_cost: 0,
    notes: '',
    crew_members: [],
    equipment_list: [],
    materials_list: [],
    vehicles_list: []
  });

  const [showScanner, setShowScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [recentlyScannedIds, setRecentlyScannedIds] = useState<Set<string>>(new Set());
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [processedScans, setProcessedScans] = useState<Set<string>>(new Set());
  const [globalScanLock, setGlobalScanLock] = useState(false);

  // Auto-generate reference ID on component mount
  useEffect(() => {
    const generateReferenceId = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `MOV-${timestamp}-${random}`;
    };
    setFormData(prev => ({ ...prev, reference_id: generateReferenceId() }));
  }, []);

  // Reset form when movement type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      entity_type: '',
      entity_name: '',
      entity_id: '',
      crew_members: [],
      equipment_list: [],
      materials_list: [],
      vehicles_list: []
    }));
  }, [formData.movement_type]);

  const handleInputChange = (field: keyof MovementRequestFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScan = (scanType: string) => {
    // Reset all locks when starting a new scan
    setGlobalScanLock(false);
    setIsProcessingScan(false);
    setProcessedScans(new Set());
    setScanningFor(scanType);
    setShowScanner(true);
  };

  // Check if entity is already in the list
  const isEntityAlreadyAdded = (entityId: string, scanType: string): boolean => {
    switch (scanType) {
      case 'crew_member':
        return formData.crew_members.some(member => 
          member.id === entityId || member.customId === entityId
        );
      case 'equipment':
        return formData.equipment_list.some(equipment => 
          equipment.id === entityId || equipment.customId === entityId
        );
      case 'material':
        return formData.materials_list.some(material => 
          material.id === entityId || material.customId === entityId
        );
      case 'vehicle':
        return formData.vehicles_list.some(vehicle => 
          vehicle.id === entityId || vehicle.customId === entityId
        );
      default:
        return false;
    }
  };

  // Enhanced entity detection with database lookup
  const detectEntityFromQR = async (result: string) => {
    try {
      const parsedData = JSON.parse(result);
      
      // Extract equipment details
      if (parsedData.equipment_id || parsedData.custom_equipment_id || parsedData.qrCode) {
        return {
          id: parsedData.id || parsedData.equipment_id || parsedData.custom_equipment_id || parsedData.qrCode,
          name: parsedData.name || parsedData.equipment_name || 'Unknown Equipment',
          type: parsedData.type || parsedData.model || 'Unknown Type',
          customId: parsedData.custom_equipment_id || parsedData.equipment_id || parsedData.qrCode,
          model: parsedData.model || parsedData.type || 'Unknown Model',
          site: parsedData.site || 'Unknown Site',
          details: parsedData
        };
      }
      
      // Extract employee details
      if (parsedData.employee_id || parsedData.position || parsedData.department) {
        return {
          id: parsedData.id || parsedData.employee_id,
          name: parsedData.name || parsedData.employee_name || 'Unknown Employee',
          type: 'employee',
          position: parsedData.position || 'Unknown Position',
          department: parsedData.department || 'Unknown Department',
          customId: parsedData.employee_id || parsedData.id,
          details: parsedData
        };
      }
      
      // Extract material details
      if (parsedData.material_id || parsedData.category || parsedData.type === 'material') {
        return {
          id: parsedData.id || parsedData.material_id,
          name: parsedData.name || parsedData.material_name || 'Unknown Material',
          type: 'material',
          category: parsedData.category || parsedData.type || 'Unknown Category',
          customId: parsedData.material_id || parsedData.id,
          details: parsedData
        };
      }
      
      // Extract vehicle details
      if (parsedData.vehicle_id || parsedData.license_plate || parsedData.type === 'vehicle') {
        return {
          id: parsedData.id || parsedData.vehicle_id,
          name: parsedData.name || parsedData.vehicle_name || 'Unknown Vehicle',
          type: 'vehicle',
          model: parsedData.model || parsedData.type || 'Unknown Model',
          licensePlate: parsedData.license_plate || 'No Plate',
          customId: parsedData.vehicle_id || parsedData.id,
          details: parsedData
        };
      }
      
      // Generic fallback
      return {
        id: parsedData.id || result,
        name: parsedData.name || 'Unknown',
        type: parsedData.type || 'unknown',
        customId: parsedData.custom_id || parsedData.id || result,
        details: parsedData
      };
    } catch (e) {
      // If not JSON, treat as plain ID and try to lookup from database
      console.log('QR result is not JSON, attempting database lookup for:', result);
      
      // Try to find the entity in the database
      try {
        // Try equipment first
        const equipment = await fetchData('equipment');
        const foundEquipment = equipment.find((eq: any) => eq.id === result || eq.custom_equipment_id === result || eq.qrCode === result);
        if (foundEquipment) {
          return {
            id: foundEquipment.id,
            name: foundEquipment.name || 'Unknown Equipment',
            type: foundEquipment.type || foundEquipment.model || 'Unknown Type',
            customId: foundEquipment.custom_equipment_id || foundEquipment.qrCode || foundEquipment.id,
            model: foundEquipment.model || foundEquipment.type || 'Unknown Model',
            site: foundEquipment.site || 'Unknown Site',
            details: foundEquipment
          };
        }

        // Try employees
        const employees = await fetchData('employees');
        const foundEmployee = employees.find((emp: any) => emp.id === result || emp.employee_id === result || emp.qrCode === result);
        if (foundEmployee) {
          return {
            id: foundEmployee.id,
            name: foundEmployee.name || 'Unknown Employee',
            type: 'employee',
            position: foundEmployee.position || 'Unknown Position',
            department: foundEmployee.department || 'Unknown Department',
            customId: foundEmployee.employee_id || foundEmployee.qrCode || foundEmployee.id,
            details: foundEmployee
          };
        }

        // Try materials
        const materials = await fetchData('materials');
        const foundMaterial = materials.find((mat: any) => mat.id === result || mat.material_id === result || mat.qrCode === result);
        if (foundMaterial) {
          return {
            id: foundMaterial.id,
            name: foundMaterial.name || 'Unknown Material',
            type: 'material',
            category: foundMaterial.category || foundMaterial.type || 'Unknown Category',
            customId: foundMaterial.material_id || foundMaterial.qrCode || foundMaterial.id,
            details: foundMaterial
          };
        }

        // If not found in any table, return basic info
        return {
          id: result,
          name: `Entity (${result.slice(0, 8)}...)`,
          type: 'unknown',
          customId: result,
          details: { rawData: result }
        };
      } catch (lookupError) {
        console.error('Database lookup failed:', lookupError);
        return {
          id: result,
          name: `Entity (${result.slice(0, 8)}...)`,
          type: 'unknown',
          customId: result,
          details: { rawData: result }
        };
      }
    }
  };

  const handleQRScanResult = async (result: string) => {
    console.log('=== QR Scan Result Received ===');
    console.log('Raw result:', result);
    console.log('Scanning for:', scanningFor);
    console.log('Is processing scan:', isProcessingScan);
    console.log('Global scan lock:', globalScanLock);
    console.log('Recently scanned IDs:', Array.from(recentlyScannedIds));
    console.log('Processed scans:', Array.from(processedScans));

    // Global scan lock check
    if (globalScanLock) {
      console.log('❌ Global scan lock active, ignoring scan');
      return;
    }

    // Prevent multiple processing of the same scan
    if (isProcessingScan) {
      console.log('❌ Scan already being processed, ignoring duplicate');
      return;
    }

    // Check if this exact result was already processed
    if (processedScans.has(result)) {
      console.log('❌ Result already processed, ignoring:', result);
      return;
    }

    // Check if this ID was recently scanned (within last 5 seconds)
    if (recentlyScannedIds.has(result)) {
      console.log('❌ ID recently scanned, ignoring duplicate:', result);
      return;
    }

    // Set global lock immediately
    setGlobalScanLock(true);
    setIsProcessingScan(true);
    console.log('✅ Starting to process scan...');

    try {
      const entity = await detectEntityFromQR(result);
      console.log('Detected entity:', entity);
      
      // Check if entity is already in the current list - check both ID and customId
      const isAlreadyAdded = isEntityAlreadyAdded(entity.id, scanningFor) || 
                           isEntityAlreadyAdded(entity.customId, scanningFor);
      
      console.log('Is already added:', isAlreadyAdded);
      
      if (isAlreadyAdded) {
        const feedbackMessage = `"${entity.name}" is already in the list`;
        console.log('❌ Entity already in list:', feedbackMessage);
        setFeedbackMessage(feedbackMessage);
        setTimeout(() => setFeedbackMessage(''), 3000);
        setIsProcessingScan(false);
        setGlobalScanLock(false);
        return;
      }
      
      let feedbackMessage = '';
      
      switch (scanningFor) {
        case 'crew_member':
          const newCrewMember = {
            id: entity.id,
            name: entity.name,
            position: entity.position || 'Crew Member',
            customId: entity.customId,
            department: entity.department
          };
          setFormData(prev => ({
            ...prev,
            crew_members: [...prev.crew_members, newCrewMember]
          }));
          feedbackMessage = `Crew member "${entity.name}" (${entity.customId}) added`;
          break;
          
        case 'equipment':
          const newEquipment = {
            id: entity.id,
            name: entity.name,
            type: entity.model || entity.type,
            customId: entity.customId,
            site: entity.site
          };
          setFormData(prev => ({
            ...prev,
            equipment_list: [...prev.equipment_list, newEquipment]
          }));
          feedbackMessage = `Equipment "${entity.name}" (${entity.customId}) added`;
          break;
          
        case 'material':
          const newMaterial = {
            id: entity.id,
            name: entity.name,
            quantity: 1,
            customId: entity.customId,
            category: entity.category
          };
          setFormData(prev => ({
            ...prev,
            materials_list: [...prev.materials_list, newMaterial]
          }));
          feedbackMessage = `Material "${entity.name}" (${entity.customId}) added`;
          break;
          
        case 'vehicle':
          const newVehicle = {
            id: entity.id,
            name: entity.name,
            type: entity.model || entity.type,
            customId: entity.customId,
            licensePlate: entity.licensePlate
          };
          setFormData(prev => ({
            ...prev,
            vehicles_list: [...prev.vehicles_list, newVehicle]
          }));
          feedbackMessage = `Vehicle "${entity.name}" (${entity.customId}) added`;
          break;
          
        case 'from_location':
          setFormData(prev => ({ ...prev, from_location: entity.name }));
          feedbackMessage = `Source location set to "${entity.name}"`;
          break;
          
        case 'to_location':
          setFormData(prev => ({ ...prev, to_location: entity.name }));
          feedbackMessage = `Destination location set to "${entity.name}"`;
          break;
      }
      
      // Mark this result as processed
      setProcessedScans(prev => new Set([...prev, result]));
      
      // Add to recently scanned set to prevent duplicates - add both raw result and entity ID
      setRecentlyScannedIds(prev => new Set([...prev, result, entity.id, entity.customId]));
      
      console.log('✅ Successfully added entity:', feedbackMessage);
      
      // Remove from recently scanned after 5 seconds (increased from 3)
      setTimeout(() => {
        setRecentlyScannedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(result);
          newSet.delete(entity.id);
          newSet.delete(entity.customId);
          return newSet;
        });
      }, 5000);
      
      setFeedbackMessage(feedbackMessage);
      setTimeout(() => setFeedbackMessage(''), 3000);
      setShowScanner(false);
    } catch (error) {
      console.error('❌ Error processing QR scan:', error);
      setFeedbackMessage('Error processing scan. Please try again.');
      setTimeout(() => setFeedbackMessage(''), 3000);
    } finally {
      setIsProcessingScan(false);
      // Keep global lock for a bit longer to prevent rapid re-scanning
      setTimeout(() => {
        setGlobalScanLock(false);
      }, 2000);
    }
  };

  const removeEntity = (type: string, id: string) => {
    switch (type) {
      case 'crew_member':
        setFormData(prev => ({
          ...prev,
          crew_members: prev.crew_members.filter(member => member.id !== id)
        }));
        break;
      case 'equipment':
        setFormData(prev => ({
          ...prev,
          equipment_list: prev.equipment_list.filter(item => item.id !== id)
        }));
        break;
      case 'material':
        setFormData(prev => ({
          ...prev,
          materials_list: prev.materials_list.filter(item => item.id !== id)
        }));
        break;
      case 'vehicle':
        setFormData(prev => ({
          ...prev,
          vehicles_list: prev.vehicles_list.filter(item => item.id !== id)
        }));
        break;
    }
  };

  const updateMaterialQuantity = (id: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      materials_list: prev.materials_list.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on movement type
    let isValid = true;
    let errorMessage = '';
    
    switch (formData.movement_type) {
      case 'crew':
        if (formData.crew_members.length === 0) {
          isValid = false;
          errorMessage = 'Please add at least one crew member';
        }
        break;
      case 'equipment':
        if (formData.equipment_list.length === 0) {
          isValid = false;
          errorMessage = 'Please add at least one equipment';
        }
        break;
      case 'material':
        if (formData.materials_list.length === 0) {
          isValid = false;
          errorMessage = 'Please add at least one material';
        }
        break;
      case 'fleet':
        if (formData.vehicles_list.length === 0) {
          isValid = false;
          errorMessage = 'Please add at least one vehicle';
        }
        break;
    }
    
    if (!isValid) {
      alert(errorMessage);
      return;
    }
    
    if (!formData.from_location || !formData.to_location) {
      alert('Please specify both source and destination locations');
      return;
    }
    
    try {
            // Prepare the movement request data based on actual database schema
      const movementRequest = {
        id: `MOV-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
        request_type: (formData.movement_type === 'crew' ? 'employee' : formData.movement_type) as 'fleet' | 'equipment' | 'employee' | 'material',
        entity_id: formData.movement_type === 'crew' && formData.crew_members.length > 0 
          ? formData.crew_members[0].id 
          : formData.movement_type === 'equipment' && formData.equipment_list.length > 0
          ? formData.equipment_list[0].id
          : formData.movement_type === 'material' && formData.materials_list.length > 0
          ? formData.materials_list[0].id
          : formData.movement_type === 'fleet' && formData.vehicles_list.length > 0
          ? formData.vehicles_list[0].id
          : 'UNKNOWN',
        entity_name: formData.movement_type === 'crew' && formData.crew_members.length > 0 
          ? formData.crew_members[0].name 
          : formData.movement_type === 'equipment' && formData.equipment_list.length > 0
          ? formData.equipment_list[0].name
          : formData.movement_type === 'material' && formData.materials_list.length > 0
          ? formData.materials_list[0].name
          : formData.movement_type === 'fleet' && formData.vehicles_list.length > 0
          ? formData.vehicles_list[0].name
          : 'Unknown Entity',
        entity_type: formData.movement_type === 'crew' ? 'employee' : formData.movement_type,
        quantity: 1,
        unit: 'unit',
        location_from: formData.from_location,
        location_to: formData.to_location,
        requested_by: 'current_user_id', // TODO: Get from auth
        priority: formData.priority || 'medium',
        status: 'pending' as const,
        estimated_duration: formData.estimated_duration || undefined,
        estimated_cost: formData.estimated_cost || undefined,
        notes: formData.notes || undefined,
        reference_id: formData.reference_id || undefined
      };

      console.log('Submitting movement request:', movementRequest);
      
      // Make actual API call to create movement request
      const response = await createMovementRequest(movementRequest);
      
      if (response.success) {
        // Show success message with next steps
        const successMessage = `
Movement Request Created Successfully!

Reference ID: ${formData.reference_id}
Status: Pending Approval

Next Steps:
1. Logistics Manager will review and approve/reject
2. You'll receive notification of approval status
3. Site supervisors will execute the movement
4. Real-time tracking will be available
5. Request will be closed upon completion

The request has been logged in the system and notifications have been sent to relevant stakeholders.
        `;
        
        alert(successMessage);
        onSuccess();
        onClose();
      } else {
        throw new Error('Failed to create movement request');
      }
    } catch (error) {
      console.error('Error creating movement request:', error);
      alert('Error creating movement request. Please try again.');
    }
  };

  const renderMovementTypeFields = () => {
    switch (formData.movement_type) {
      case 'crew':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Crew Members</h4>
              <button
                type="button"
                onClick={() => handleScan('crew_member')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Employee</span>
              </button>
            </div>
            
            {formData.crew_members.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                No crew members added yet. Scan employee QR codes to add crew members.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.crew_members.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">{member.name}</p>
                      <p className="text-sm text-blue-700">{member.position}</p>
                      <p className="text-xs text-blue-600">ID: {member.customId}</p>
                      {member.department && (
                        <p className="text-xs text-blue-600">Dept: {member.department}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntity('crew_member', member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'equipment':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Equipment List</h4>
              <button
                type="button"
                onClick={() => handleScan('equipment')}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Equipment</span>
              </button>
            </div>
            
            {formData.equipment_list.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                No equipment added yet. Scan equipment QR codes to add items.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.equipment_list.map((equipment, index) => (
                  <div key={equipment.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">{equipment.name}</p>
                      <p className="text-sm text-orange-700">{equipment.type}</p>
                      <p className="text-xs text-orange-600">ID: {equipment.customId}</p>
                      {equipment.site && (
                        <p className="text-xs text-orange-600">Site: {equipment.site}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntity('equipment', equipment.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'material':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Materials List</h4>
              <button
                type="button"
                onClick={() => handleScan('material')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Material</span>
              </button>
            </div>
            
            {formData.materials_list.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                No materials added yet. Scan material QR codes to add items.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.materials_list.map((material, index) => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{material.name}</p>
                      <p className="text-xs text-green-600">ID: {material.customId}</p>
                      {material.category && (
                        <p className="text-xs text-green-600">Category: {material.category}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={material.quantity}
                        onChange={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeEntity('material', material.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'fleet':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Vehicles List</h4>
              <button
                type="button"
                onClick={() => handleScan('vehicle')}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Vehicle</span>
              </button>
            </div>
            
            {formData.vehicles_list.length === 0 ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                No vehicles added yet. Scan vehicle QR codes to add items.
              </div>
            ) : (
              <div className="space-y-2">
                {formData.vehicles_list.map((vehicle, index) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900">{vehicle.name}</p>
                      <p className="text-sm text-purple-700">{vehicle.type}</p>
                      <p className="text-xs text-purple-600">ID: {vehicle.customId}</p>
                      {vehicle.licensePlate && (
                        <p className="text-xs text-purple-600">Plate: {vehicle.licensePlate}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntity('vehicle', vehicle.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Movement Request</h2>
              <p className="text-sm text-gray-600">Create a new resource movement request</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Reference ID */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-blue-900">Reference ID:</span>
                <span className="text-blue-700 font-mono">{formData.reference_id}</span>
              </div>
            </div>

            {/* Movement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Movement Type*
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'equipment', label: 'Equipment Transfer', icon: Wrench, color: 'orange' },
                  { value: 'crew', label: 'Crew Transfer', icon: Users, color: 'blue' },
                  { value: 'material', label: 'Material Transport', icon: Package, color: 'green' },
                  { value: 'fleet', label: 'Fleet Deployment', icon: Truck, color: 'purple' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('movement_type', type.value)}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      formData.movement_type === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50 text-${type.color}-700`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <type.icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Scanning Guide */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">QR Scanning Guide</span>
              </div>
              <p className="text-sm text-blue-700">
                Use the QR scan buttons to quickly scan equipment IDs, employee IDs, material IDs, or location QR codes. 
                The system will automatically detect the entity type and add it to your movement request.
              </p>
            </div>

            {/* Dynamic Fields Based on Movement Type */}
            {renderMovementTypeFields()}

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Location*
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.from_location}
                    onChange={(e) => handleInputChange('from_location', e.target.value)}
                    placeholder="Enter source location or scan QR code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleScan('from_location')}
                    className="px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Scan QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Location*
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.to_location}
                    onChange={(e) => handleInputChange('to_location', e.target.value)}
                    placeholder="Enter destination location or scan QR code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleScan('to_location')}
                    className="px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Scan QR Code"
                  >
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority*
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Clock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (SAR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes or instructions..."
              />
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{feedbackMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Movement Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Simple QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Scan QR Code</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <SimpleQRScanner
                onResult={handleQRScanResult}
                onError={(error) => {
                  console.error('QR Scan error:', error);
                  alert('QR scan failed. Please try again.');
                }}
                onClose={() => setShowScanner(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewMovementModal; 