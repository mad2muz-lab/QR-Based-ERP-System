import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, Plus, RefreshCw } from 'lucide-react';
import { Equipment } from '../../types';
import { CorrectiveMaintenanceService } from '../../utils/correctiveMaintenanceService';
import CorrectiveMaintenanceForm from './CorrectiveMaintenanceForm';
import { supabase } from '../../utils/supabaseClient';

const MaintenancePage: React.FC = () => {
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<Equipment[]>([]);
  const [showCorrectiveForm, setShowCorrectiveForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMaintenanceEquipment();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel('maintenance-equipment-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const equipment = payload.new;
                          if (equipment.status === 'maintenance') {
                // Add to list if not already present
                setMaintenanceEquipment(prev => {
                  const exists = prev.find(eq => eq.id === equipment.id);
                  if (!exists) {
                    return [equipment as Equipment, ...prev];
                  }
                  return prev;
                });
              } else {
                // Remove from list if status changed from maintenance
                setMaintenanceEquipment(prev => prev.filter(eq => eq.id !== equipment.id));
              }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMaintenanceEquipment = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await CorrectiveMaintenanceService.getEquipmentRequiringMaintenance();
      
      if (result.success) {
        setMaintenanceEquipment(result.data || []);
      } else {
        setError(result.error || 'Failed to load maintenance equipment');
      }
    } catch (error) {
      console.error('Error loading maintenance equipment:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowCorrectiveForm(true);
  };

  const handleFormSubmitted = async (request: any) => {
    console.log('Maintenance request submitted:', request);
    setShowCorrectiveForm(false);
    setSelectedEquipment(null);
    
    // Optionally refresh the list
    await loadMaintenanceEquipment();
  };

  const handleFormClose = () => {
    setShowCorrectiveForm(false);
    setSelectedEquipment(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading maintenance equipment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wrench className="w-6 h-6 mr-2" />
            Equipment Requiring Maintenance
          </h1>
          <p className="text-gray-600 mt-1">
            Manage equipment that has been marked for maintenance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {maintenanceEquipment.length} equipment requiring maintenance
          </div>
          <button
            onClick={loadMaintenanceEquipment}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {maintenanceEquipment.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment in Maintenance</h3>
          <p className="text-gray-600 mb-4">All equipment is currently operational.</p>
          <p className="text-sm text-gray-500">
            Equipment will appear here when marked for maintenance via QR scanner.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {maintenanceEquipment.map(equipment => (
            <div 
              key={equipment.id} 
              className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleEquipmentClick(equipment)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {equipment.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Equipment ID:</span>
                      <br />
                      {equipment.custom_equipment_id}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <br />
                      {equipment.type}
                    </div>
                    <div>
                      <span className="font-medium">Site:</span>
                      <br />
                      {equipment.site}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>
                      <br />
                      {new Date(equipment.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Maintenance Required
                  </span>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Fill Maintenance Form
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCorrectiveForm && selectedEquipment && (
        <CorrectiveMaintenanceForm
          equipment={selectedEquipment}
          onClose={handleFormClose}
          onSubmitted={handleFormSubmitted}
        />
      )}
    </div>
  );
};

export default MaintenancePage; 