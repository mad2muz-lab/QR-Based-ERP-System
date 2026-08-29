import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface ChecklistItem {
  id: string;
  task: string;
  description: string;
  is_required: boolean;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  photos?: string[];
}

interface PMChecklist {
  id: string;
  equipment_id: string;
  equipment_name: string;
  pm_class: string;
  checklist_items: ChecklistItem[];
  status: 'not_started' | 'in_progress' | 'completed' | 'verified';
  started_at?: string;
  completed_at?: string;
  technician_id?: string;
  technician_name?: string;
  quality_score?: number;
  safety_checks_passed: boolean;
}

const PMChecklistExecution: React.FC = () => {
  const [checklists, setChecklists] = useState<PMChecklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<PMChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPMChecklists();
  }, []);

  const loadPMChecklists = async () => {
    setLoading(true);
    try {
      // Get current user/technician information
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
        throw userError;
      }

      // For now, use a simple approach without employee lookup
      // This avoids the foreign key constraint issue
      const technicianId = 'unknown-technician';
      const technicianName = user?.email || 'Unknown Technician';

      // Get equipment that has assigned PM tasks
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, custom_equipment_id, equipment_name, equipment_type, pm_class, pm_checklist_items')
        .eq('is_pm', true)
        .not('pm_class', 'is', null);

      if (equipmentError) {
        console.error('Error loading equipment:', equipmentError);
        console.error('Error details:', equipmentError.message, equipmentError.details, equipmentError.hint);
        throw equipmentError;
      }

      if (!equipmentData || equipmentData.length === 0) {
        console.log('No equipment found for PM checklists');
        setChecklists([]);
        return;
      }

      // Generate checklists for equipment
      const pmChecklists: PMChecklist[] = equipmentData?.map(eq => {
        const checklistItems: ChecklistItem[] = [
          {
            id: '1',
            task: 'Check oil level',
            description: 'Verify engine oil level is within acceptable range',
            is_required: true,
            is_completed: false
          },
          {
            id: '2',
            task: 'Inspect filters',
            description: 'Check air, fuel, and hydraulic filters for damage or clogging',
            is_required: true,
            is_completed: false
          },
          {
            id: '3',
            task: 'Test brakes',
            description: 'Verify brake system is functioning properly',
            is_required: true,
            is_completed: false
          },
          {
            id: '4',
            task: 'Check hydraulic system',
            description: 'Inspect hydraulic hoses and connections for leaks',
            is_required: eq.pm_class === 'Class A',
            is_completed: false
          },
          {
            id: '5',
            task: 'Lubricate moving parts',
            description: 'Apply appropriate lubricants to moving components',
            is_required: eq.pm_class === 'Class A',
            is_completed: false
          }
        ];

        return {
          id: `checklist-${eq.id}`,
          equipment_id: eq.id,
          equipment_name: eq.name,
          pm_class: eq.pm_class,
          checklist_items: checklistItems,
          status: 'not_started',
          technician_id: technicianId,
          technician_name: technicianName,
          safety_checks_passed: false
        };
      }) || [];

      setChecklists(pmChecklists);
    } catch (error) {
      console.error('Error loading PM checklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChecklist = (checklistId: string) => {
    const updatedChecklists = checklists.map(checklist =>
      checklist.id === checklistId
        ? { ...checklist, status: 'in_progress', started_at: new Date().toISOString() }
        : checklist
    );
    setChecklists(updatedChecklists);
    setSelectedChecklist(updatedChecklists.find(c => c.id === checklistId) || null);
  };

  const completeChecklistItem = (checklistId: string, itemId: string, isCompleted: boolean, notes?: string) => {
    const updatedChecklists = checklists.map(checklist => {
      if (checklist.id === checklistId) {
        const updatedItems = checklist.checklist_items.map(item =>
          item.id === itemId
            ? {
                ...item,
                is_completed: isCompleted,
                completed_by: 'Current Technician',
                completed_at: isCompleted ? new Date().toISOString() : undefined,
                notes: notes || item.notes
              }
            : item
        );

        const allRequiredCompleted = updatedItems
          .filter(item => item.is_required)
          .every(item => item.is_completed);

        return {
          ...checklist,
          checklist_items: updatedItems,
          status: allRequiredCompleted ? 'completed' : 'in_progress'
        };
      }
      return checklist;
    });

    setChecklists(updatedChecklists);
    if (selectedChecklist?.id === checklistId) {
      setSelectedChecklist(updatedChecklists.find(c => c.id === checklistId) || null);
    }
  };

  const capturePhoto = async (checklistId: string, itemId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      setCapturingPhoto(true);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedChecklist) {
      try {
        // Mock photo upload - replace with actual Supabase storage
        const photoUrl = URL.createObjectURL(file);
        
        const updatedChecklists = checklists.map(checklist => {
          if (checklist.id === selectedChecklist.id) {
            const updatedItems = checklist.checklist_items.map(item =>
              item.id === 'current-item' // This would be the actual item ID
                ? { ...item, photos: [...(item.photos || []), photoUrl] }
                : item
            );
            return { ...checklist, checklist_items: updatedItems };
          }
          return checklist;
        });

        setChecklists(updatedChecklists);
        if (selectedChecklist) {
          setSelectedChecklist(updatedChecklists.find(c => c.id === selectedChecklist.id) || null);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      } finally {
        setCapturingPhoto(false);
      }
    }
  };

  const calculateQualityScore = (checklist: PMChecklist): number => {
    const totalItems = checklist.checklist_items.length;
    const completedItems = checklist.checklist_items.filter(item => item.is_completed).length;
    const requiredItems = checklist.checklist_items.filter(item => item.is_required).length;
    const completedRequiredItems = checklist.checklist_items.filter(item => item.is_required && item.is_completed).length;
    
    // Base score from completion percentage
    const completionScore = (completedItems / totalItems) * 40;
    
    // Required items bonus (critical for safety)
    const requiredItemsScore = (completedRequiredItems / requiredItems) * 40;
    
    // Photo documentation bonus
    const itemsWithPhotos = checklist.checklist_items.filter(item => item.photos && item.photos.length > 0).length;
    const photoScore = (itemsWithPhotos / totalItems) * 10;
    
    // Notes documentation bonus
    const itemsWithNotes = checklist.checklist_items.filter(item => item.notes && item.notes.trim().length > 0).length;
    const notesScore = (itemsWithNotes / totalItems) * 10;
    
    const totalScore = Math.round(completionScore + requiredItemsScore + photoScore + notesScore);
    
    return Math.min(100, Math.max(0, totalScore));
  };

  const verifyChecklist = async (checklistId: string) => {
    try {
      // Get the most current checklist state
      const currentChecklist = checklists.find(c => c.id === checklistId);
      if (!currentChecklist) return;

      console.log('Verifying checklist:', currentChecklist);
      console.log('Safety checks passed before verification:', currentChecklist.safety_checks_passed);
      console.log('Selected checklist safety checks:', selectedChecklist?.safety_checks_passed);

      // Use the most up-to-date safety checks value
      const finalSafetyChecksValue = selectedChecklist?.safety_checks_passed ?? currentChecklist.safety_checks_passed;
      console.log('Final safety checks value to use:', finalSafetyChecksValue);

      // Calculate quality score
      const qualityScore = calculateQualityScore(currentChecklist);
      
      // Check if all required items are completed
      const allRequiredCompleted = currentChecklist.checklist_items
        .filter(item => item.is_required)
        .every(item => item.is_completed);

      if (!allRequiredCompleted) {
        alert('Cannot verify checklist: All required items must be completed first.');
        return;
      }

      const updatedChecklists = checklists.map(c =>
        c.id === checklistId
          ? { 
              ...c, 
              status: 'verified',
              quality_score: qualityScore,
              safety_checks_passed: finalSafetyChecksValue,
              completed_at: new Date().toISOString()
            }
          : c
      );

      setChecklists(updatedChecklists);
      if (selectedChecklist?.id === checklistId) {
        setSelectedChecklist(updatedChecklists.find(c => c.id === checklistId) || null);
      }

      // Update database with completion data using the final safety checks value
      await updateDatabaseAfterCompletion(checklistId, qualityScore, finalSafetyChecksValue);

      console.log(`Checklist verified with quality score: ${qualityScore}%`);
      console.log('Final safety_checks_passed value:', finalSafetyChecksValue);
    } catch (error) {
      console.error('Error verifying checklist:', error);
    }
  };

  const updateDatabaseAfterCompletion = async (checklistId: string, qualityScore: number, safetyChecksPassed: boolean) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const checklist = checklists.find(c => c.id === checklistId);
      if (!checklist) return;

      // Update equipment table
      const { error: equipmentError } = await supabase
        .from('equipment')
        .update({
          usage_duration: 0, // Reset usage counter
          last_pm_date: new Date().toISOString(),
          next_pm_date: calculateNextPMDate(checklist.pm_class),
          pm_status: 'completed'
        })
        .eq('id', checklist.equipment_id);

      if (equipmentError) {
        console.error('Error updating equipment:', equipmentError);
      }

      // Create maintenance log entry
      const logData = {
        equipment_id: checklist.equipment_id,
        preventive_type_id: `${checklist.equipment_name}_${checklist.pm_class}`,
        maintenance_class: checklist.pm_class,
        technician_id: checklist.technician_id === 'unknown-technician' ? null : checklist.technician_id,
        scheduled_date: new Date().toISOString(), // Add scheduled date (same as completion date for now)
        completed_date: new Date().toISOString(), // Fixed: was completion_date, should be completed_date
        quality_score: qualityScore,
        checklist_completed: true,
        safety_checks_passed: safetyChecksPassed,
        total_items: checklist.checklist_items.length,
        completed_items: checklist.checklist_items.filter(item => item.is_completed).length,
        required_items_completed: checklist.checklist_items.filter(item => item.is_required && item.is_completed).length
      };

      console.log('Saving PM log with safety_checks_passed:', safetyChecksPassed);
      console.log('Full log data:', logData);
      console.log('Checklist safety_checks_passed value:', safetyChecksPassed);
      console.log('Checklist object:', checklist);

      const { error: logError } = await supabase
        .from('preventive_maintenance_logs')
        .insert(logData);

      if (logError) {
        console.error('Error creating maintenance log:', logError);
      }

      console.log('Database updated successfully after checklist completion');
    } catch (error) {
      console.error('Error updating database:', error);
    }
  };

  const calculateNextPMDate = (pmClass: string): string => {
    const today = new Date();
    let daysToAdd = 30; // Default 30 days

    switch (pmClass) {
      case 'Class A':
        daysToAdd = 90; // 3 months
        break;
      case 'Class B':
        daysToAdd = 365; // 1 year
        break;
      case 'Class C':
        daysToAdd = 730; // 2 years
        break;
      default:
        daysToAdd = 30;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate.toISOString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">PM Checklist Execution</h2>

      {loading ? (
        <div className="text-center py-8">Loading checklists...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checklist List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Checklists</h3>
            <div className="space-y-3">
              {checklists.map(checklist => (
                <div
                  key={checklist.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedChecklist?.id === checklist.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedChecklist(checklist)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{checklist.equipment_name}</h4>
                      <p className="text-sm text-gray-600">{checklist.pm_class} Maintenance</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(checklist.status)}`}>
                      {checklist.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>
                      {checklist.checklist_items.filter(item => item.is_completed).length}/
                      {checklist.checklist_items.filter(item => item.is_required).length} completed
                    </span>
                    {checklist.status === 'not_started' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startChecklist(checklist.id);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist Detail */}
          {selectedChecklist && (
            <div className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedChecklist.equipment_name}</h3>
                  <p className="text-gray-600">{selectedChecklist.pm_class} Maintenance Checklist</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedChecklist.status)}`}>
                    {selectedChecklist.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {selectedChecklist.quality_score && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-blue-600">Quality Score: {selectedChecklist.quality_score}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and Quality Score Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Progress:</span>
                    <div className="font-medium">
                      {selectedChecklist.checklist_items.filter(item => item.is_completed).length}/
                      {selectedChecklist.checklist_items.length} items
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Required:</span>
                    <div className="font-medium">
                      {selectedChecklist.checklist_items.filter(item => item.is_required && item.is_completed).length}/
                      {selectedChecklist.checklist_items.filter(item => item.is_required).length} completed
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Photos:</span>
                    <div className="font-medium">
                      {selectedChecklist.checklist_items.filter(item => item.photos && item.photos.length > 0).length} items
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Live Score:</span>
                    <div className="font-medium text-blue-600">
                      {calculateQualityScore(selectedChecklist)}%
                    </div>
                  </div>
                </div>
                
                {/* Quality Score Breakdown */}
                <div className="mt-3 text-xs text-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>Completion: {Math.round((selectedChecklist.checklist_items.filter(item => item.is_completed).length / selectedChecklist.checklist_items.length) * 40)}/40</div>
                    <div>Required: {Math.round((selectedChecklist.checklist_items.filter(item => item.is_required && item.is_completed).length / selectedChecklist.checklist_items.filter(item => item.is_required).length) * 40)}/40</div>
                    <div>Photos: {Math.round((selectedChecklist.checklist_items.filter(item => item.photos && item.photos.length > 0).length / selectedChecklist.checklist_items.length) * 10)}/10</div>
                    <div>Notes: {Math.round((selectedChecklist.checklist_items.filter(item => item.notes && item.notes.trim().length > 0).length / selectedChecklist.checklist_items.length) * 10)}/10</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedChecklist.checklist_items.map(item => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={(e) => completeChecklistItem(
                              selectedChecklist.id,
                              item.id,
                              e.target.checked
                            )}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className={`font-medium ${item.is_completed ? 'line-through text-gray-500' : ''}`}>
                            {item.task}
                          </span>
                          {item.is_required && (
                            <span className="text-red-500 text-xs">Required</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <button
                        onClick={() => capturePhoto(selectedChecklist.id, item.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        📷 Photo
                      </button>
                    </div>

                    {item.is_completed && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-800">
                          <strong>Completed:</strong> {new Date(item.completed_at!).toLocaleString()}
                        </div>
                        {item.notes && (
                          <div className="text-sm text-green-700 mt-1">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                        {item.photos && item.photos.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-sm text-green-800">Photos:</strong>
                            <div className="flex gap-2 mt-1">
                              {item.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Checklist photo ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {!item.is_completed && (
                      <div className="mt-2">
                        <textarea
                          placeholder="Add notes (optional)"
                          className="w-full p-2 border rounded text-sm"
                          rows={2}
                          onChange={(e) => {
                            const updatedItems = selectedChecklist.checklist_items.map(i =>
                              i.id === item.id ? { ...i, notes: e.target.value } : i
                            );
                            setSelectedChecklist({
                              ...selectedChecklist,
                              checklist_items: updatedItems
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quality Assurance */}
              {selectedChecklist.status === 'completed' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Quality Assurance</h4>
                  <div className="space-y-2">
                                         <label className="flex items-center">
                       <input
                         type="checkbox"
                         checked={selectedChecklist.safety_checks_passed}
                         onChange={(e) => {
                           const newValue = e.target.checked;
                           console.log('Safety checks checkbox changed to:', newValue);
                           console.log('Previous state:', selectedChecklist.safety_checks_passed);
                           
                           // Update both the selected checklist and the main checklists array
                           const updatedChecklist = {
                             ...selectedChecklist,
                             safety_checks_passed: newValue
                           };
                           
                           setSelectedChecklist(updatedChecklist);
                           
                           // Also update the main checklists array to ensure consistency
                           setChecklists(prevChecklists => 
                             prevChecklists.map(c => 
                               c.id === selectedChecklist.id 
                                 ? { ...c, safety_checks_passed: newValue }
                                 : c
                             )
                           );
                           
                           console.log('Updated checklist state:', updatedChecklist);
                         }}
                         className="mr-2"
                       />
                       Safety checks passed
                     </label>
                    <div className="text-sm text-gray-600 mt-1">
                      Current state: {selectedChecklist.safety_checks_passed ? 'Checked' : 'Unchecked'}
                    </div>
                    <button
                      onClick={() => {
                        console.log('Verify button clicked');
                        console.log('Safety checks state at button click:', selectedChecklist.safety_checks_passed);
                        verifyChecklist(selectedChecklist.id);
                      }}
                      disabled={!selectedChecklist.safety_checks_passed}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Verify & Complete
                    </button>
                  </div>
                </div>
              )}

              {selectedChecklist.status === 'verified' && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-green-800">
                    <strong>✅ Checklist Verified</strong>
                    {selectedChecklist.quality_score && (
                      <div className="mt-1">Quality Score: {selectedChecklist.quality_score}%</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for photo capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
};

export default PMChecklistExecution; 