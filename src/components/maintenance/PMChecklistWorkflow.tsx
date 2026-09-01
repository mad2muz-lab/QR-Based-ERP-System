import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Shield, 
  Wrench, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Play,
  Square
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  description: string;
  is_required: boolean;
  category: 'safety' | 'inspection' | 'maintenance' | 'testing' | 'documentation';
  instructions?: string;
  photo_required: boolean;
  notes_required: boolean;
}

interface SparePart {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  available?: boolean;
  in_stock?: number;
  material_id?: string; // Added for inventory integration
  required_quantity?: number; // Added for inventory integration
}

interface PMChecklistWorkflowProps {
  equipmentId: string;
  equipmentName: string;
  equipmentType: string;
  pmClass: string;
  technicianId: string;
  onComplete: (checklistData: any) => void;
  onBack: () => void;
}

const PMChecklistWorkflow: React.FC<PMChecklistWorkflowProps> = ({
  equipmentId,
  equipmentName,
  equipmentType,
  pmClass,
  technicianId,
  onComplete,
  onBack
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [itemResponses, setItemResponses] = useState<Record<string, {
    status: 'pass' | 'fail' | 'na';
    notes: string;
    photos: string[];
    timestamp: string;
  }>>({});
  const [currentStep, setCurrentStep] = useState<'preparation' | 'checklist' | 'completion'>('preparation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiredSpareParts, setRequiredSpareParts] = useState<SparePart[]>([]);
  const [sparePartsVerified, setSparePartsVerified] = useState(false);

  useEffect(() => {
    loadChecklistItems();
    loadSpareParts();
  }, [equipmentType, pmClass]);

  const loadChecklistItems = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.warn('Supabase client not initialized');
        setChecklistItems(generateDefaultChecklist(pmClass));
        return;
      }
      
      // Get PM configuration for this equipment type and class
      const { data: config, error: configError } = await supabase
        .from('preventive_maintenance_configs')
        .select('*')
        .eq('equipment_type', equipmentType)
        .eq('is_active', true)
        .single();

      if (configError) {
        console.warn('No PM config found, using default checklist');
        setChecklistItems(generateDefaultChecklist(pmClass));
        return;
      }

      // Try to get checklist items from config
      if (config.checklist_items && Array.isArray(config.checklist_items)) {
        // Ensure all items have unique, non-empty string IDs
        const itemsWithIds = config.checklist_items.map((item: any, index: number) => {
          const uniqueId = item.id && typeof item.id === 'string' && item.id.trim() !== '' 
            ? item.id 
            : `config-item-${index}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            id: uniqueId,
            description: item.description || item.task || `Checklist item ${index + 1}`,
            is_required: item.is_required || item.required || false,
            category: item.category || 'general',
            instructions: item.instructions || '',
            photo_required: item.photo_required || false,
            notes_required: item.notes_required || false
          };
        });
        setChecklistItems(itemsWithIds);
      } else {
        // Generate default checklist based on PM class
        setChecklistItems(generateDefaultChecklist(pmClass));
      }
    } catch (error) {
      console.error('Error loading checklist items:', error);
      setChecklistItems(generateDefaultChecklist(pmClass));
    } finally {
      setLoading(false);
    }
  };

  const loadSpareParts = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        setRequiredSpareParts([]);
        return;
      }

      const { data: config, error } = await supabase
        .from('preventive_maintenance_configs')
        .select('spare_parts, estimated_quantities')
        .eq('equipment_type', equipmentType)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.warn('No PM config found for spare parts:', error);
        // Add default spare parts for common equipment types
        const defaultSpareParts = getDefaultSpareParts(equipmentType, pmClass);
        setRequiredSpareParts(defaultSpareParts);
        return;
      }

      if (config?.spare_parts && Array.isArray(config.spare_parts)) {
        // Check inventory for each spare part
        const spareParts: SparePart[] = await Promise.all(
          config.spare_parts.map(async (part, index) => {
            const requiredQuantity = parseInt(config.estimated_quantities?.[index] || '1', 10);
            
            // Check inventory for this part
            let available = false;
            let in_stock = 0;
            let material_id = null;
            let unit = 'pcs';
            
            if (supabase) {
              try {
                // First, let's check if the materials table is accessible
                const { data: testData, error: testError } = await supabase
                  .from('materials')
                  .select('id, name')
                  .limit(1);
                
                if (testError) {
                  console.warn(`❌ Materials table not accessible:`, testError);
                } else {
                  // Query materials table with a more robust approach
                  const { data: inventoryItems, error: inventoryError } = await supabase
                    .from('materials')
                    .select('id, name, quantity, unit, status')
                    .eq('name', part);
                  
                  if (!inventoryError && inventoryItems && inventoryItems.length > 0) {
                    const inventoryItem = inventoryItems[0]; // Take the first match
                    material_id = inventoryItem.id;
                    in_stock = inventoryItem.quantity || 0;
                    available = in_stock >= requiredQuantity;
                    unit = inventoryItem.unit || 'pcs';
                  } else if (inventoryError) {
                    console.warn(`❌ Error querying materials for part "${part}":`, inventoryError);
                    // Continue with default values if query fails
                  }
                }
              } catch (queryError) {
                console.warn(`❌ Exception querying materials for part "${part}":`, queryError);
                // Continue with default values if query fails
              }
            }
            
            return {
              id: `part-${index}`,
              name: part,
              quantity: requiredQuantity.toString(),
              unit,
              available,
              in_stock,
              material_id,
              required_quantity: requiredQuantity
            };
          })
        );
        
        setRequiredSpareParts(spareParts);
      } else {
        // Add default spare parts for common equipment types
        const defaultSpareParts = getDefaultSpareParts(equipmentType, pmClass);
        setRequiredSpareParts(defaultSpareParts);
      }
    } catch (err) {
      console.error('Error loading spare parts:', err);
      // Add default spare parts for common equipment types
      const defaultSpareParts = getDefaultSpareParts(equipmentType, pmClass);
      setRequiredSpareParts(defaultSpareParts);
    }
  };

  const getDefaultSpareParts = (equipmentType: string, pmClass: string): SparePart[] => {
    // Default spare parts based on equipment type and PM class
    const defaultSpareParts: Record<string, string[]> = {
      'Transportation Bus': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Excavator': ['Hydraulic Oil', 'Engine Oil Filter', 'Air Filter', 'Grease'],
      'Bulldozer': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Fluid', 'Grease'],
      'Asphalt Paver': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Oil', 'Conveyor Belt'],
      'Dump Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Concrete Mixer Truck': ['Engine Oil Filter', 'Air Filter', 'Hydraulic Oil', 'Mixer Paddles'],
      'Water Tanker': ['Engine Oil Filter', 'Air Filter', 'Water Pump', 'Hoses'],
      'Fuel Tanker': ['Engine Oil Filter', 'Air Filter', 'Fuel Pump', 'Safety Equipment'],
      'Flatbed Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Pickup Truck': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes'],
      'Service Van': ['Engine Oil Filter', 'Air Filter', 'Brake Pads', 'Tire Tubes']
    };

    const spareParts = defaultSpareParts[equipmentType] || ['Engine Oil Filter', 'Air Filter', 'Grease'];
    
    return spareParts.map((part, index) => ({
      id: `default-part-${index}`,
      name: part,
      quantity: '1',
      unit: 'pcs',
      available: false,
      in_stock: 0,
      material_id: undefined,
      required_quantity: 1
    }));
  };

  const generateDefaultChecklist = (pmClass: string): ChecklistItem[] => {
    const baseItems: ChecklistItem[] = [
      // Safety Items (Always Required)
      {
        id: `safety-1-${pmClass.toLowerCase().replace(' ', '-')}`,
        description: 'Equipment properly shut down and secured',
        is_required: true,
        category: 'safety',
        instructions: 'Ensure equipment is completely stopped and cannot be accidentally started',
        photo_required: true,
        notes_required: true
      },
      {
        id: `safety-2-${pmClass.toLowerCase().replace(' ', '-')}`,
        description: 'Personal protective equipment worn',
        is_required: true,
        category: 'safety',
        instructions: 'Safety glasses, gloves, and appropriate clothing',
        photo_required: false,
        notes_required: false
      },
      {
        id: `safety-3-${pmClass.toLowerCase().replace(' ', '-')}`,
        description: 'Work area properly marked and isolated',
        is_required: true,
        category: 'safety',
        instructions: 'Use safety barriers and warning signs',
        photo_required: true,
        notes_required: false
      },
      {
        id: `safety-4-${pmClass.toLowerCase().replace(' ', '-')}`,
        description: 'All tools and materials ready',
        is_required: true,
        category: 'safety',
        instructions: 'Check that all required tools and spare parts are available',
        photo_required: false,
        notes_required: false
      }
    ];

    // Add class-specific items
    const classSpecificItems: ChecklistItem[] = [];

    if (pmClass === 'Class A') {
      classSpecificItems.push(
        {
          id: `inspection-1-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Visual inspection of equipment condition',
          is_required: true,
          category: 'inspection',
          instructions: 'Check for visible damage, leaks, or wear',
          photo_required: true,
          notes_required: true
        },
        {
          id: `maintenance-1-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Check fluid levels (oil, coolant, fuel)',
          is_required: true,
          category: 'maintenance',
          instructions: 'Top up if necessary and record levels',
          photo_required: false,
          notes_required: true
        },
        {
          id: `maintenance-2-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Clean air filters',
          is_required: true,
          category: 'maintenance',
          instructions: 'Remove and clean or replace air filters',
          photo_required: true,
          notes_required: true
        },
        {
          id: `testing-1-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Test basic functions',
          is_required: true,
          category: 'testing',
          instructions: 'Start equipment and test basic operations',
          photo_required: false,
          notes_required: true
        }
      );
    } else if (pmClass === 'Class B') {
      classSpecificItems.push(
        {
          id: `inspection-2-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Detailed inspection of critical components',
          is_required: true,
          category: 'inspection',
          instructions: 'Inspect belts, hoses, electrical connections',
          photo_required: true,
          notes_required: true
        },
        {
          id: `maintenance-3-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Change oil and filters',
          is_required: true,
          category: 'maintenance',
          instructions: 'Replace oil, oil filter, and fuel filter',
          photo_required: true,
          notes_required: true
        },
        {
          id: `maintenance-4-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Lubricate moving parts',
          is_required: true,
          category: 'maintenance',
          instructions: 'Apply appropriate lubricants to all moving parts',
          photo_required: false,
          notes_required: true
        },
        {
          id: `testing-2-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Comprehensive function testing',
          is_required: true,
          category: 'testing',
          instructions: 'Test all major functions and systems',
          photo_required: false,
          notes_required: true
        }
      );
    } else if (pmClass === 'Class C') {
      classSpecificItems.push(
        {
          id: `inspection-3-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Complete equipment disassembly and inspection',
          is_required: true,
          category: 'inspection',
          instructions: 'Disassemble major components for detailed inspection',
          photo_required: true,
          notes_required: true
        },
        {
          id: `maintenance-5-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Replace worn or damaged components',
          is_required: true,
          category: 'maintenance',
          instructions: 'Replace any components showing wear or damage',
          photo_required: true,
          notes_required: true
        },
        {
          id: `maintenance-6-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Calibrate systems and sensors',
          is_required: true,
          category: 'maintenance',
          instructions: 'Calibrate all measurement and control systems',
          photo_required: false,
          notes_required: true
        },
        {
          id: `testing-3-${pmClass.toLowerCase().replace(' ', '-')}`,
          description: 'Full operational testing',
          is_required: true,
          category: 'testing',
          instructions: 'Complete operational testing under load',
          photo_required: false,
          notes_required: true
        }
      );
    }

    // Combine base items with class-specific items, ensuring no duplicate IDs
    const allItems = [...baseItems];
    
    // Add class-specific items with unique IDs if they might conflict
    classSpecificItems.forEach((item, index) => {
      // Check if ID already exists
      const existingItem = allItems.find(existing => existing.id === item.id);
      if (existingItem) {
        // Create a unique ID by adding a suffix
        item.id = `${item.id}-${index}`;
      }
      allItems.push(item);
    });

    return allItems;
  };

  const handleItemResponse = (itemId: string, status: 'pass' | 'fail' | 'na', notes: string = '') => {
    const newResponses = { ...itemResponses };
    newResponses[itemId] = {
      status,
      notes,
      photos: newResponses[itemId]?.photos || [],
      timestamp: new Date().toISOString()
    };
    setItemResponses(newResponses);

    // Update completed items
    const newCompleted = new Set(completedItems);
    if (status === 'pass' || status === 'fail') {
      newCompleted.add(itemId);
    } else {
      newCompleted.delete(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const handlePhotoUpload = (itemId: string, photoData: string) => {
    const newResponses = { ...itemResponses };
    if (!newResponses[itemId]) {
      newResponses[itemId] = {
        status: 'pass',
        notes: '',
        photos: [],
        timestamp: new Date().toISOString()
      };
    }
    newResponses[itemId].photos.push(photoData);
    setItemResponses(newResponses);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <Shield className="h-4 w-4" />;
      case 'inspection': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'testing': return <Play className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'inspection': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-green-100 text-green-800';
      case 'documentation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    const requiredItems = checklistItems.filter(item => item.is_required);
    const completedRequired = requiredItems.filter(item => completedItems.has(item.id));
    return {
      total: checklistItems.length,
      completed: completedItems.size,
      required: requiredItems.length,
      completedRequired: completedRequired.length,
      percentage: requiredItems.length > 0 ? (completedRequired.length / requiredItems.length) * 100 : 0
    };
  };

  const canComplete = () => {
    const progress = calculateProgress();
    return progress.completedRequired === progress.required;
  };

  const handleComplete = () => {
    const completionData = {
      equipmentId,
      equipmentName,
      equipmentType,
      pmClass,
      technicianId,
      completedItems: Array.from(completedItems),
      itemResponses,
      sparePartsUsed: requiredSpareParts.filter(part => part.available),
      completionDate: new Date().toISOString(),
      totalItems: checklistItems.length,
      completedCount: completedItems.size,
      progress: calculateProgress()
    };
    
    onComplete(completionData);
  };

  const renderPreparationStep = () => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PM Task Preparation</h2>
        <p className="text-gray-600">
          Equipment: {equipmentName} • Type: {equipmentType} • Class: {pmClass}
        </p>
      </div>

      {/* Safety Checklist */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Preparation Checklist</h3>
        <div className="space-y-3">
          {checklistItems.filter(item => item.category === 'safety').map((item) => (
            <div key={item.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id={item.id}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={item.id} className="ml-3 text-gray-700">
                {item.description}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Required Spare Parts */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Spare Parts</h3>
        {requiredSpareParts.length > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-yellow-900">Spare Parts Required</h4>
              <button
                onClick={() => setSparePartsVerified(!sparePartsVerified)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  sparePartsVerified
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-white'
                }`}
              >
                {sparePartsVerified ? '✓ Verified' : 'Mark as Verified'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requiredSpareParts.map((part) => (
                <div key={part.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{part.name}</span>
                    <p className="text-sm text-gray-600">
                      Required: {part.quantity} {part.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                      In Stock: {part.in_stock || 0} {part.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      part.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {part.available ? 'Available' : 'Not Available'}
                    </span>
                    {!part.available && part.in_stock && part.in_stock > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        Low Stock
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {requiredSpareParts.some(part => !part.available) && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ Some spare parts are not available in sufficient quantity. 
                  Please ensure parts are available before proceeding with the PM task.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600">
              No spare parts required for this PM task.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            setCurrentStep('checklist');
          }}
          className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
        >
          Start PM Checklist →
        </button>
      </div>
    </div>
  );

  const renderChecklistStep = () => {
    const progress = calculateProgress();

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setCurrentStep('preparation')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Preparation
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">PM Checklist</h2>
            <div className="flex items-center text-gray-600 mb-4">
              <Wrench className="h-5 w-5 mr-2" />
              <span>{equipmentName} - {pmClass} Maintenance</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress: {progress.completedRequired}/{progress.required} required items</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading checklist...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checklistItems.map((item, index) => {
                const response = itemResponses[item.id];
                const isCompleted = completedItems.has(item.id);
                // Use a more stable key generation approach
                const uniqueKey = item.id && typeof item.id === 'string' && item.id.trim() !== '' 
                  ? item.id 
                  : `checklist-item-${index}-${item.description.replace(/\s+/g, '-').toLowerCase()}`;

                return (
                  <div
                    key={uniqueKey}
                    className={`border rounded-lg p-4 transition-all ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                          <div className="flex items-center">
                            {getCategoryIcon(item.category)}
                            <span className="ml-1 capitalize">{item.category}</span>
                          </div>
                        </span>
                        {item.is_required && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">{item.description}</h3>
                    
                    {item.instructions && (
                      <p className="text-sm text-gray-600 mb-3">{item.instructions}</p>
                    )}

                    <div className="space-y-3">
                      {/* Response Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleItemResponse(item.id, 'pass')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            response?.status === 'pass'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Pass
                        </button>
                        <button
                          onClick={() => handleItemResponse(item.id, 'fail')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            response?.status === 'fail'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <XCircle className="h-4 w-4 inline mr-1" />
                          Fail
                        </button>
                        <button
                          onClick={() => handleItemResponse(item.id, 'na')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            response?.status === 'na'
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          N/A
                        </button>
                      </div>

                      {/* Notes Input */}
                      {(item.notes_required || response?.status === 'fail') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes {item.notes_required && <span className="text-red-500">*</span>}
                          </label>
                          <textarea
                            value={response?.notes || ''}
                            onChange={(e) => handleItemResponse(item.id, response?.status || 'pass', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Enter notes about this item..."
                          />
                        </div>
                      )}

                      {/* Photo Upload */}
                      {item.photo_required && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo Documentation <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                // Simulate photo upload
                                const photoData = `photo_${Date.now()}`;
                                handlePhotoUpload(item.id, photoData);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Add Photo
                            </button>
                            {response?.photos && response.photos.length > 0 && (
                              <span className="text-sm text-green-600">
                                {response.photos.length} photo(s) uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {canComplete() ? (
                  <span className="text-green-600">✓ All required items completed</span>
                ) : (
                  <span className="text-red-600">
                    {progress.required - progress.completedRequired} required items remaining
                  </span>
                )}
              </div>
              <button
                onClick={handleComplete}
                disabled={!canComplete()}
                className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                  canComplete()
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Complete PM Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  switch (currentStep) {
    case 'preparation':
      return renderPreparationStep();
    case 'checklist':
      return renderChecklistStep();
    default:
      return renderPreparationStep();
  }
};

export default PMChecklistWorkflow;
