import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Equipment } from '../../../types';
import { DataStorage } from '../../../utils/dataStorage';
import { supabase } from '../../../utils/supabaseClient';

interface EquipmentFormData {
  custom_equipment_id: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  site: string;
  status: string;
  operational_status: string;
  hourly_rate?: number;
}

export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentFormData, setEquipmentFormData] = useState<EquipmentFormData>({
    custom_equipment_id: '',
    name: '',
    type: '',
    model: '',
    serialNumber: '',
    site: '',
    status: 'available',
    operational_status: 'working',
    hourly_rate: undefined
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customIdError, setCustomIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);

  const resetEquipmentForm = () => {
    setEquipmentFormData({
      custom_equipment_id: '',
      name: '',
      type: '',
      model: '',
      serialNumber: '',
      site: '',
      status: 'available',
      operational_status: 'working',
      hourly_rate: undefined
    });
    setCustomIdError('');
  };

  const loadEquipment = async () => {
    try {
      const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
      
      if (isSupabaseEnabled) {
        const { data, error } = await supabase!
          .from('equipment')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setEquipment(data || []);
      } else {
        const localEquipment = DataStorage.loadEquipment();
        setEquipment(localEquipment);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert(`Failed to load equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkCustomIdAvailability = async (customId: string, excludeId?: string) => {
    if (!customId.trim()) {
      setCustomIdError('');
      return true;
    }

    setIsCheckingId(true);
    setCustomIdError('');

    try {
      const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
      let existingEquipment: Equipment[] = [];

      if (isSupabaseEnabled) {
        const { data, error } = await supabase!
          .from('equipment')
          .select('*')
          .eq('custom_equipment_id', customId);
        
        if (error) throw error;
        existingEquipment = data || [];
      } else {
        const allEquipment = DataStorage.loadEquipment();
        existingEquipment = allEquipment.filter(eq => eq.custom_equipment_id === customId);
      }

      const isDuplicate = existingEquipment.some(eq => 
        eq.custom_equipment_id === customId && eq.id !== excludeId
      );

      if (isDuplicate) {
        setCustomIdError('This Custom Equipment ID is already in use');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking custom ID:', error);
      setCustomIdError('Error checking ID availability');
      return false;
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate custom ID
      const isIdValid = await checkCustomIdAvailability(
        equipmentFormData.custom_equipment_id,
        editingEquipment?.id
      );
      
      if (!isIdValid) {
        setIsLoading(false);
        return;
      }

      const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
      
      if (editingEquipment) {
        // Update existing equipment
        if (isSupabaseEnabled) {
          const { error } = await supabase!
            .from('equipment')
            .update({
              custom_equipment_id: equipmentFormData.custom_equipment_id,
              name: equipmentFormData.name,
              type: equipmentFormData.type,
              model: equipmentFormData.model || null,
              serialNumber: equipmentFormData.serialNumber || null,
              site: equipmentFormData.site,
              status: equipmentFormData.status,
              operational_status: equipmentFormData.operational_status,
              hourly_rate: equipmentFormData.hourly_rate ?? null,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingEquipment.id);
          
          if (error) throw error;
        } else {
          const updatedEquipment: Equipment = {
              ...editingEquipment,
              custom_equipment_id: equipmentFormData.custom_equipment_id,
              name: equipmentFormData.name,
              type: equipmentFormData.type,
              model: equipmentFormData.model || undefined,
              serialNumber: equipmentFormData.serialNumber || undefined,
              site: equipmentFormData.site,
              status: equipmentFormData.status,
              operational_status: equipmentFormData.operational_status,
              hourly_rate: equipmentFormData.hourly_rate
            };
            
            // Save as array
            const allEquipment = DataStorage.loadEquipment();
            const idx = allEquipment.findIndex(eq => eq.id === updatedEquipment.id);
            if (idx !== -1) {
              allEquipment[idx] = updatedEquipment;
              DataStorage.saveEquipment(allEquipment);
            }
        }
        
        alert('Equipment updated successfully!');
      } else {
        // Create new equipment
        if (isSupabaseEnabled) {
          // For Supabase, generate UUID since the table doesn't have a default
          const { error } = await supabase!
            .from('equipment')
            .insert([{
              id: crypto.randomUUID(), // Generate UUID since the table doesn't have a default
              custom_equipment_id: equipmentFormData.custom_equipment_id,
              name: equipmentFormData.name,
              type: equipmentFormData.type,
              model: equipmentFormData.model || undefined,
              serial_number: equipmentFormData.serialNumber || undefined,
              site: equipmentFormData.site || '',
              status: equipmentFormData.status as Equipment['status'],
              operational_status: equipmentFormData.operational_status as Equipment['operational_status'],
              qr_code: equipmentFormData.custom_equipment_id,
              hourly_rate: equipmentFormData.hourly_rate ?? null
            }]);
          
          if (error) throw error;
        } else {
          // For offline mode, generate UUID locally
          const newEquipment: Equipment = {
            id: uuidv4(),
            custom_equipment_id: equipmentFormData.custom_equipment_id,
            name: equipmentFormData.name,
            type: equipmentFormData.type,
            model: equipmentFormData.model || undefined,
            serialNumber: equipmentFormData.serialNumber || undefined,
            site: equipmentFormData.site || '',
            status: equipmentFormData.status as Equipment['status'],
            operational_status: equipmentFormData.operational_status as Equipment['operational_status'],
            qrCode: `QR-${equipmentFormData.custom_equipment_id}`,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            hourly_rate: equipmentFormData.hourly_rate
          };
          
          // Save as array
          const allEquipment = DataStorage.loadEquipment();
          allEquipment.push(newEquipment);
          DataStorage.saveEquipment(allEquipment);
        }
        
        alert('Equipment created successfully!');
      }
      
      await loadEquipment();
      setShowCreateForm(false);
      setEditingEquipment(null);
      resetEquipmentForm();
    } catch (error) {
      console.error('Error creating/updating equipment:', error);
      alert(`Failed to ${editingEquipment ? 'update' : 'create'} equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    
    setIsLoading(true);
    try {
      const isSupabaseEnabled = localStorage.getItem('useSupabase') === 'true';
      
      if (isSupabaseEnabled) {
          const { error } = await supabase!
            .from('equipment')
            .delete()
            .eq('id', equipmentId);
          
          if (error) throw error;
        } else {
          const allEquipment = DataStorage.loadEquipment();
          const updatedEquipment = allEquipment.filter(eq => eq.id !== equipmentId);
          DataStorage.saveEquipment(updatedEquipment);
        }
      
      await loadEquipment();
      alert('Equipment deleted successfully!');
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert(`Failed to delete equipment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setEquipmentFormData({
      custom_equipment_id: equipment.custom_equipment_id || '',
      name: equipment.name || '',
      type: equipment.type || '',
      model: equipment.model || '',
      serialNumber: equipment.serialNumber || '',
      site: equipment.site || '',
      status: equipment.status || '',
      operational_status: equipment.operational_status || '',
      hourly_rate: equipment.hourly_rate
    });
    setShowCreateForm(true);
  };

  const cancelEditEquipment = () => {
    setEditingEquipment(null);
    setShowCreateForm(false);
    resetEquipmentForm();
  };

  const exportEquipment = () => {
    DataStorage.downloadEquipmentCSV(equipment);
  };

  // Effect to check custom ID when it changes
  useEffect(() => {
    if (equipmentFormData.custom_equipment_id) {
      const timeoutId = setTimeout(() => {
        checkCustomIdAvailability(
          equipmentFormData.custom_equipment_id,
          editingEquipment?.id
        );
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [equipmentFormData.custom_equipment_id, editingEquipment?.id]);

  useEffect(() => {
    loadEquipment();
  }, []);

  return {
    equipment,
    editingEquipment,
    equipmentFormData,
    setEquipmentFormData,
    showCreateForm,
    setShowCreateForm,
    isLoading,
    customIdError,
    isCheckingId,
    resetEquipmentForm,
    loadEquipment,
    handleCreateEquipment,
    handleDeleteEquipment,
    startEditEquipment,
    cancelEditEquipment,
    exportEquipment
  };
};