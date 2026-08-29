import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Calendar, Clock, User, QrCode, CheckCircle, AlertTriangle, ClipboardList, Camera, Monitor } from 'lucide-react';
import { useHardwareScanner } from '../../hooks/useHardwareScanner';
import QrScanner from 'qr-scanner';

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  site: string;
  is_pm: boolean;
  pm_class?: string;
  pm_frequency_hours?: number;
  usage_duration?: number;
  last_pm_date?: string;
  next_pm_date?: string;
  pm_status?: string;
}

interface PMTask {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  pm_class: string;
  due_date: string;
  days_overdue: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  assigned_date?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  qr_code: string;
  department?: string;
  position?: string;
  oldId?: string; // Legacy ID like EMP-001
}

const PMTaskAssignment: React.FC = () => {
  const [pmTasks, setPmTasks] = useState<PMTask[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<PMTask | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'assigned' | 'overdue'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [scannedQR, setScannedQR] = useState<string>('');
  
  // Scanner state
  const [scanMode, setScanMode] = useState<'camera' | 'hardware'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hardware scanner hook
  useHardwareScanner({
    onScan: async (data) => {
      if (data && scanMode === 'hardware') {
        await handleQRScanned(data);
      }
    },
    inputRef,
    enabled: showScanner && scanMode === 'hardware'
  });

  useEffect(() => {
    loadPMTasks();
    loadEmployees();
  }, []);

  // Cleanup camera when component unmounts or scanner modal closes
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        console.log('Cleaning up QR scanner...');
        stopCameraScanning();
      }
    };
  }, []);

  // Cleanup camera when scanner modal closes
  useEffect(() => {
    if (!showScanner && qrScannerRef.current) {
      console.log('Scanner modal closed, cleaning up camera...');
      stopCameraScanning();
    }
  }, [showScanner]);

  // Initialize video element when scanner modal opens
  useEffect(() => {
    if (showScanner && scanMode === 'camera') {
      console.log('Scanner modal opened, video ref available:', !!videoRef.current);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        console.log('Video ref after delay:', !!videoRef.current);
      }, 100);
    }
  }, [showScanner, scanMode]);

  const loadPMTasks = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Get all equipment enrolled in PM
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('is_pm', true)
        .not('pm_class', 'is', null);

      if (equipmentError) throw equipmentError;

      // Get existing PM assignments
      const { data: existingAssignments, error: assignmentsError } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .in('status', ['scheduled', 'assigned', 'in_progress']);

      if (assignmentsError) throw assignmentsError;

      // Generate PM tasks based on equipment schedules
      const tasks: PMTask[] = [];
      const today = new Date();
      
      equipmentData?.forEach((eq: Equipment) => {
        // Calculate due date based on PM class and frequency
        const dueDate = calculateDueDate(eq);
        const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if task already exists
        const existingTask = existingAssignments?.find(assignment => 
          assignment.equipment_id === eq.id && 
          assignment.maintenance_class === eq.pm_class
        );

        if (!existingTask || daysOverdue > 0) {
          const priority = calculatePriority(daysOverdue);
          
          tasks.push({
            id: existingTask?.id || `task-${eq.id}-${eq.pm_class}`,
            equipment_id: eq.id,
            equipment_name: eq.name,
            equipment_type: eq.type,
            pm_class: eq.pm_class || 'Class A',
            due_date: dueDate,
            days_overdue: Math.max(0, daysOverdue),
            priority,
            status: existingTask?.status || 'pending',
            assigned_technician_id: existingTask?.technician_id,
            assigned_technician_name: existingTask?.technician_name,
            assigned_date: existingTask?.assigned_date
          });
        }
      });

      // Sort by priority and due date
      tasks.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return a.days_overdue - b.days_overdue;
      });

      setPmTasks(tasks);
      setEquipment(equipmentData || []);
    } catch (err) {
      console.error('Error loading PM tasks:', err);
      setError('Failed to load PM tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, qr_code, department, position, old_id')
        .order('name');

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedEmployees = (data || []).map(emp => ({
        ...emp,
        oldId: emp.old_id // Map old_id to oldId
      }));
      
      setEmployees(transformedEmployees);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const calculateDueDate = (equipment: Equipment): string => {
    const lastPMDate = equipment.last_pm_date ? new Date(equipment.last_pm_date) : new Date();
    const frequencyHours = equipment.pm_frequency_hours || 250; // Default 250 hours
    
    // Calculate due date based on frequency (simplified calculation)
    const dueDate = new Date(lastPMDate);
    dueDate.setDate(dueDate.getDate() + Math.floor(frequencyHours / 8)); // Assuming 8 hours per day
    
    return dueDate.toISOString().split('T')[0];
  };

  const calculatePriority = (daysOverdue: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (daysOverdue > 30) return 'critical';
    if (daysOverdue > 14) return 'high';
    if (daysOverdue > 7) return 'medium';
    return 'low';
  };

  const startCameraScanning = async () => {
    console.log('Starting camera scanning...');
    
    // Add a small delay to ensure video element is rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!videoRef.current) {
      console.error('Video ref not available');
      setCameraError('Video element not available. Please refresh the page and try again.');
      return;
    }

    // Check if running on HTTPS (required for camera access)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.error('HTTPS required for camera access');
      setCameraError('Camera access requires HTTPS. Please use HTTPS or localhost for development.');
      return;
    }

    try {
      console.log('Clearing previous errors and setting scanning state...');
      setCameraError(null);
      setIsScanning(true);

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      console.log('Requesting camera permission...');
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'environment'
        } 
      });

      console.log('Camera permission granted, creating QR scanner...');
      
      // Create QR scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          console.log('QR code detected:', result.data);
          await handleQRScanned(result.data);
          stopCameraScanning();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          returnDetailedScanResult: true
        }
      );

      console.log('Starting QR scanner...');
      await qrScannerRef.current.start();
      console.log('QR scanner started successfully');
      
    } catch (error: any) {
      console.error('Camera error:', error);
      
      // Stop scanning state
      setIsScanning(false);
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is already in use. Please close other applications using the camera.');
      } else if (error.name === 'NotSupportedError') {
        setCameraError('Camera not supported in this browser. Please try a different browser.');
      } else if (error.name === 'AbortError') {
        setCameraError('Camera access was aborted. Please try again.');
      } else {
        setCameraError(`Failed to start camera: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const stopCameraScanning = () => {
    console.log('Stopping camera scanning...');
    
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        console.log('QR scanner stopped and destroyed');
      } catch (error) {
        console.error('Error stopping QR scanner:', error);
      }
      qrScannerRef.current = null;
    }
    
    setIsScanning(false);
    console.log('Camera scanning stopped');
  };

  const handleAssignTask = (task: PMTask) => {
    setSelectedTask(task);
    setShowScanner(true);
    setScannedQR('');
    setCameraError(null);
    setScanMode('camera'); // Default to camera mode
  };

  const handleQRScanned = async (qrData: string) => {
    if (!qrData.trim()) return;
    
    setScannedQR(qrData);
    await handleEmployeeScanned(qrData);
  };

  const handleEmployeeScanned = async (employeeQR: string) => {
    if (!selectedTask) return;

    try {
      // Find employee by QR code
      const employee = employees.find(e => e.qr_code === employeeQR);
      if (!employee) {
        setError('Employee not found. Please scan a valid employee QR code.');
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Prepare the data to be inserted - only include fields that exist in the schema
      const pmLogData = {
        equipment_id: selectedTask.equipment_id,
        maintenance_class: selectedTask.pm_class,
        maintenance_type: 'preventive',
        preventive_type_id: `${selectedTask.equipment_name}_${selectedTask.pm_class}`, // Required field - create a unique identifier
        scheduled_date: selectedTask.due_date,
        status: 'scheduled', // Changed from 'assigned' to 'scheduled' to match schema constraints
        technician_id: employee.id,
        checklist_completed: false,
        notes: `Task assigned to ${employee.name} (${employee.oldId || 'No Legacy ID'}) on ${new Date().toLocaleDateString()}`
        // Note: created_at and updated_at have defaults, so we don't need to specify them
      };
      
      console.log('Attempting to insert PM log data:', pmLogData);
      console.log('Equipment ID being used:', selectedTask.equipment_id);
      console.log('Employee ID being used:', employee.id);
      
      // Insert new PM log record (don't use upsert to avoid conflicts)
      const { error: insertError } = await supabase
        .from('preventive_maintenance_logs')
        .insert(pmLogData);

      if (insertError) {
        console.error('Database insert error:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        console.error('Data that was attempted to insert:', pmLogData);
        throw insertError;
      }

      // Update local state
      setPmTasks(prev => prev.map(task => 
        task.id === selectedTask.id 
          ? { 
              ...task, 
              status: 'assigned' as const,
              assigned_technician_id: employee.id,
              assigned_technician_name: employee.name,
              assigned_date: new Date().toISOString()
            }
          : task
      ));

             setSelectedTask(null);
       setShowScanner(false);
       setScannedQR('');
       setError(null);
       setSuccessMessage(`Task successfully assigned to ${employee.name} (${employee.oldId || 'No Legacy ID'}) - ${employee.position || 'No Position'}`);
       
       // Clear success message after 3 seconds
       setTimeout(() => setSuccessMessage(null), 3000);
     } catch (err) {
       console.error('Error assigning task:', err);
       setError('Failed to assign task');
     }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = pmTasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PM tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-blue-600" />
              PM Task Assignment
            </h1>
            <p className="text-gray-600 mt-2">
              Assign preventive maintenance tasks to technicians based on equipment schedules
            </p>
          </div>
          <a
            href="/pm"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to PM Dashboard</span>
          </a>
        </div>
      </div>

             {/* Error Message */}
       {error && (
         <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
           <AlertTriangle className="h-5 w-5 text-red-600" />
           <span className="text-red-800">{error}</span>
         </div>
       )}

       {/* Success Message */}
       {successMessage && (
         <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
           <CheckCircle className="h-5 w-5 text-green-600" />
           <span className="text-green-800">{successMessage}</span>
         </div>
       )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            PM Tasks ({filteredTasks.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No PM tasks found matching the current filters.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.equipment_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        {task.days_overdue > 0 && (
                          <span className="text-red-600 font-medium">
                            ({task.days_overdue} days overdue)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{task.equipment_type} - {task.pm_class}</span>
                      </div>
                      
                      {task.assigned_technician_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Assigned to: {task.assigned_technician_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {task.status === 'pending' ? (
                      <button
                        onClick={() => handleAssignTask(task)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <QrCode className="h-4 w-4" />
                        Assign
                      </button>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {task.assigned_date && (
                          <div>Assigned: {new Date(task.assigned_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Task to Employee
            </h3>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Equipment:</strong> {selectedTask.equipment_name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>PM Class:</strong> {selectedTask.pm_class}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Due Date:</strong> {new Date(selectedTask.due_date).toLocaleDateString()}
              </p>
              {selectedTask.days_overdue > 0 && (
                <p className="text-sm text-red-600">
                  <strong>Overdue:</strong> {selectedTask.days_overdue} days
                </p>
              )}
            </div>

            {/* Scanner Mode Selection */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setScanMode('camera');
                    setCameraError(null);
                    if (qrScannerRef.current) {
                      stopCameraScanning();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    scanMode === 'camera'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  Camera Scanner
                </button>
                <button
                  onClick={() => {
                    setScanMode('hardware');
                    setCameraError(null);
                    if (qrScannerRef.current) {
                      stopCameraScanning();
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    scanMode === 'hardware'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  Hardware Scanner (EDA52)
                </button>
              </div>
            </div>

            {/* Camera Scanner */}
            {scanMode === 'camera' && (
              <div className="mb-6">
                <div className="text-center mb-4">
                  <QrCode className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Scan Employee QR Code
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Point your camera at the employee's QR code to assign this task
                  </p>
                </div>

                {/* Camera Error Display */}
                {cameraError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{cameraError}</p>
                    <button
                      onClick={startCameraScanning}
                      className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}

                {/* Camera Video Element */}
                <div className="relative mb-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 min-h-[200px] flex items-center justify-center">
                    {/* Always present video element */}
                    <video
                      ref={videoRef}
                      className={`w-full h-auto rounded-lg ${!isScanning ? 'hidden' : ''}`}
                      style={{ maxHeight: '300px' }}
                      autoPlay
                      playsInline
                      muted
                    />
                    
                    {/* Overlay content when not scanning */}
                    {!isScanning && (
                      <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
                        <QrCode className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-blue-700 text-center mb-4 font-medium">Camera Ready</p>
                        <button
                          onClick={startCameraScanning}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}
                    
                    {/* Scanning overlay when active */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-blue-500 rounded-lg p-2">
                          <div className="w-32 h-32 border-2 border-blue-500 rounded-lg"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hardware Scanner */}
            {scanMode === 'hardware' && (
              <div className="mb-6">
                <div className="text-center mb-4">
                  <Monitor className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Hardware Scanner Ready
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Use your Honeywell EDA52 scanner to scan the employee QR code
                  </p>
                </div>

                <div className="border-2 border-dashed border-green-300 rounded-lg p-8 mb-4 bg-green-50">
                  <Monitor className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-green-700 text-center mb-4 font-medium">Hardware Scanner Active</p>
                  <p className="text-xs text-green-600 text-center mb-4">
                    Point your EDA52 scanner at the employee QR code
                  </p>
                  <div className="text-xs text-green-600 text-center">
                    <p>• Ensure scanner is connected and ready</p>
                    <p>• Position QR code within scanner range</p>
                    <p>• Scanner will automatically capture the code</p>
                  </div>
                </div>

                {/* Hidden input for hardware scanner */}
                <input
                  ref={inputRef}
                  type="text"
                  className="sr-only"
                  autoFocus
                  readOnly
                />
              </div>
            )}

            {/* Manual Input for Testing */}
            <div className="mb-6">
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">For testing purposes, you can manually enter an employee QR code:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter employee QR code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={scannedQR}
                    onChange={(e) => setScannedQR(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQRScanned(scannedQR)}
                  />
                  <button
                    onClick={() => handleQRScanned(scannedQR)}
                    disabled={!scannedQR.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
            
            {scannedQR && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Scanned QR:</strong> {scannedQR}
                </p>
                {(() => {
                  const employee = employees.find(e => e.qr_code === scannedQR);
                  if (employee) {
                    return (
                      <div className="mt-2">
                        <p className="text-sm text-green-700">
                          <strong>Employee:</strong> {employee.name}
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>Legacy ID:</strong> {employee.oldId || 'N/A'}
                        </p>
                        <p className="text-sm text-green-700">
                          <strong>Position:</strong> {employee.position || 'N/A'}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p className="text-sm text-red-600 mt-2">
                      <strong>Employee not found</strong> - Please scan a valid employee QR code
                    </p>
                  );
                })()}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowScanner(false);
                  setSelectedTask(null);
                  setScannedQR('');
                  setError(null);
                  setSuccessMessage(null);
                  setCameraError(null);
                  stopCameraScanning();
                }}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMTaskAssignment; 