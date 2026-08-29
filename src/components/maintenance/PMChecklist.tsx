import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  CheckCircle, 
  Circle, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  Save, 
  ArrowLeft,
  FileText,
  Camera,
  Mic
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  site: string;
  status: string;
  operational_status: string;
  last_updated: string;
}

interface PMConfig {
  equipment_type: string;
  'Class A - Hours Interval': number;
  'Class B - Hours Interval': number;
  'Class C - Hours Interval': number;
  'Class A - Threshold Hours': number;
  'Class B - Threshold Hours': number;
  'Class C - Threshold Hours': number;
  'Days Interval': number;
  'Hours Interval': number;
  'KM Interval': number;
  description: string;
  is_active: boolean;
}

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  required: boolean;
  completed: boolean;
  notes?: string;
  photos?: string[];
  audio?: string;
}

interface PMChecklistProps {
  equipment: Equipment;
  pmClass: string;
  pmConfig: PMConfig;
  onComplete: () => void;
  onBack: () => void;
}

const PMChecklist: React.FC<PMChecklistProps> = ({ equipment, pmClass, pmConfig, onComplete, onBack }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadChecklist();
  }, [equipment.type, pmClass]);

  useEffect(() => {
    // Calculate progress
    const progressPercent = checklist.length > 0 ? (completedItems.size / checklist.length) * 100 : 0;
    setProgress(progressPercent);
  }, [completedItems, checklist]);

  const loadChecklist = async () => {
    setLoading(true);
    try {
      // Load checklist items from preventive_maintenance_configs
      const { data } = await supabase
        .from('preventive_maintenance_configs')
        .select('checklist_items, spare_parts')
        .eq('equipment_type', equipment.type)
        .single();
      
      if (data?.checklist_items) {
        setChecklist(data.checklist_items);
      } else {
        // Fallback to default checklist based on equipment type
        const defaultChecklist = getDefaultChecklist(equipment.type, pmClass);
        setChecklist(defaultChecklist);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      // Use default checklist as fallback
      const defaultChecklist = getDefaultChecklist(equipment.type, pmClass);
      setChecklist(defaultChecklist);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklist = (equipmentType: string, pmClass: string): ChecklistItem[] => {
    const baseChecklist = [
      {
        id: 'safety_check',
        task: 'Perform safety inspection',
        category: 'Safety',
        required: true,
        completed: false
      },
      {
        id: 'oil_check',
        task: 'Check oil level and condition',
        category: 'Fluids',
        required: true,
        completed: false
      },
      {
        id: 'hydraulic_check',
        task: 'Inspect hydraulic system',
        category: 'Systems',
        required: true,
        completed: false
      },
      {
        id: 'air_filter',
        task: 'Check air filter condition',
        category: 'Filters',
        required: true,
        completed: false
      },
      {
        id: 'tires_tracks',
        task: 'Inspect tires/tracks condition',
        category: 'Undercarriage',
        required: true,
        completed: false
      },
      {
        id: 'safety_equipment',
        task: 'Verify safety equipment functionality',
        category: 'Safety',
        required: true,
        completed: false
      }
    ];

    const classSpecificItems = {
      'A': [
        {
          id: 'daily_walkaround',
          task: 'Daily walk-around inspection',
          category: 'Inspection',
          required: true,
          completed: false
        },
        {
          id: 'fluid_levels',
          task: 'Check all fluid levels',
          category: 'Fluids',
          required: true,
          completed: false
        },
        {
          id: 'clean_equipment',
          task: 'Clean equipment exterior',
          category: 'Cleaning',
          required: false,
          completed: false
        }
      ],
      'B': [
        {
          id: 'oil_change',
          task: 'Change engine oil and filter',
          category: 'Fluids',
          required: true,
          completed: false
        },
        {
          id: 'brake_inspection',
          task: 'Inspect brake system',
          category: 'Safety',
          required: true,
          completed: false
        },
        {
          id: 'electrical_check',
          task: 'Check electrical system',
          category: 'Systems',
          required: true,
          completed: false
        },
        {
          id: 'lubrication',
          task: 'Lubricate moving parts',
          category: 'Maintenance',
          required: true,
          completed: false
        }
      ],
      'C': [
        {
          id: 'major_inspection',
          task: 'Major component inspection',
          category: 'Inspection',
          required: true,
          completed: false
        },
        {
          id: 'replace_parts',
          task: 'Replace worn parts',
          category: 'Parts',
          required: true,
          completed: false
        },
        {
          id: 'calibrate_systems',
          task: 'Calibrate systems',
          category: 'Systems',
          required: true,
          completed: false
        },
        {
          id: 'comprehensive_test',
          task: 'Comprehensive testing',
          category: 'Testing',
          required: true,
          completed: false
        }
      ]
    };

    const classItems = classSpecificItems[pmClass as keyof typeof classSpecificItems] || [];
    return [...baseChecklist, ...classItems];
  };

  const toggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
  };

  const updateNotes = (itemId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const addPhoto = (itemId: string) => {
    // This would integrate with camera functionality
    console.log('Add photo for item:', itemId);
  };

  const addAudio = (itemId: string) => {
    // This would integrate with audio recording functionality
    console.log('Add audio for item:', itemId);
  };

  const completePM = async () => {
    setSaving(true);
    try {
      // Create PM log entry
      const pmLogData = {
        equipment_id: equipment.id,
        maintenance_class: pmClass,
        maintenance_type: 'preventive',
        performed_date: new Date().toISOString(),
        status: 'completed',
        checklist_completed: Array.from(completedItems),
        notes: Object.entries(notes).map(([itemId, note]) => `${itemId}: ${note}`).join('; '),
        technician_notes: `PM Class ${pmClass} completed via QR workflow`
      };

      const { error: pmError } = await supabase
        .from('preventive_maintenance_logs')
        .insert([pmLogData]);

      if (pmError) throw pmError;

      // Update equipment status
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({ 
          status: 'available',
          last_updated: new Date().toISOString()
        })
        .eq('id', equipment.id);

      if (equipmentError) throw equipmentError;

      // Show success message
      alert('PM completed successfully!');
      onComplete();
    } catch (error) {
      console.error('Error completing PM:', error);
      alert('Error completing PM. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'safety': return AlertTriangle;
      case 'fluids': return Wrench;
      case 'systems': return Clock;
      case 'filters': return FileText;
      case 'undercarriage': return Wrench;
      case 'inspection': return FileText;
      case 'cleaning': return Wrench;
      case 'maintenance': return Wrench;
      case 'parts': return Wrench;
      case 'testing': return Clock;
      default: return Circle;
    }
  };

  if (loading) {
    return (
      <div className="pm-checklist-loading">
        <div className="loading-spinner"></div>
        <p>Loading checklist...</p>
      </div>
    );
  }

  return (
    <div className="pm-checklist">
      {/* Header */}
      <div className="checklist-header">
        <button 
          onClick={onBack}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to PM Selection
        </button>
        <div className="checklist-title">
          <h2>PM Checklist - Class {pmClass}</h2>
          <p>Equipment: {equipment.name} ({equipment.type})</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-info">
          <span>Progress: {completedItems.size} of {checklist.length} items</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="checklist-items">
        {checklist.map((item) => {
          const Icon = getCategoryIcon(item.category);
          const isCompleted = completedItems.has(item.id);
          const itemNotes = notes[item.id] || '';

          return (
            <div 
              key={item.id} 
              className={`checklist-item ${isCompleted ? 'completed' : ''} ${item.required ? 'required' : 'optional'}`}
            >
              <div className="item-header">
                <div className="item-checkbox" onClick={() => toggleItem(item.id)}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="item-info">
                  <div className="item-category">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.category}
                  </div>
                  <h4 className="item-task">{item.task}</h4>
                  {item.required && (
                    <span className="required-badge">Required</span>
                  )}
                </div>
              </div>

              {/* Item Actions */}
              <div className="item-actions">
                <button 
                  className="action-button"
                  onClick={() => addPhoto(item.id)}
                  title="Add Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button 
                  className="action-button"
                  onClick={() => addAudio(item.id)}
                  title="Add Audio Note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Notes Section */}
              <div className="item-notes">
                <textarea
                  placeholder="Add notes for this task..."
                  value={itemNotes}
                  onChange={(e) => updateNotes(item.id, e.target.value)}
                  className="notes-textarea"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Section */}
      <div className="checklist-completion">
        <div className="completion-summary">
          <p>Completed: {completedItems.size} of {checklist.length} items</p>
          {progress === 100 && (
            <div className="completion-alert">
              ✅ All tasks completed! Ready to finish PM.
            </div>
          )}
        </div>
        
        <button 
          className="complete-pm-button"
          onClick={completePM}
          disabled={completedItems.size !== checklist.length || saving}
        >
          {saving ? (
            <>
              <div className="spinner"></div>
              Completing PM...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete PM Class {pmClass}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PMChecklist;
