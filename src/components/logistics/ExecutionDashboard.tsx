// Execution Dashboard Component
// Manages the execution phase of movement requests

import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, Clock, User, MapPin, Truck, AlertTriangle, Filter, Search, QrCode, Brain, Database, X } from 'lucide-react';
import { 
  getMovementExecutions, 
  assignExecutor, 
  startExecution, 
  updateExecutionProgress, 
  completeExecution,
  getAvailableExecutors,
  getSmartExecutorSuggestions,
  assignExecutorByQR
} from '../../utils/resourceMovementDataService';
import ExecutorQRScanner from './ExecutorQRScanner';
import CompletionQRScanner from './CompletionQRScanner';
import { AuthManager } from '../../utils/authUtils';

interface MovementExecution {
  id?: string;
  request_id: string;
  execution_type: 'fleet' | 'equipment' | 'employee' | 'material';
  executed_by: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  assigned_executor_id?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  current_location?: string;
  completion_notes?: string;
  final_cost_breakdown?: any;
  movement_progress_percentage?: number;
  last_updated_location?: string;
  estimated_completion_time?: string;
  // Location fields from related request
  from_location?: string;
  to_location?: string;
}

interface Executor {
  id: string;
  name: string;
  role: string;
  department: string;
  availability: 'available' | 'busy' | 'offline';
  current_workload: number;
  skills: string[];
  location: string;
}

interface SmartSuggestion {
  id: string;
  name: string;
  role: string;
  department: string;
  match_score: number;
  reasons: string[];
  availability: 'available' | 'busy' | 'offline';
  current_workload: number;
  skills: string[];
  location: string;
}

// Predefined options for closed-ended selections
const LOCATION_OPTIONS = [
  'Site A',
  'Site B', 
  'Site C',
  'Warehouse',
  'Maintenance Yard',
  'Loading Dock',
  'Storage Area',
  'In Transit',
  'Destination Reached'
];

const PROGRESS_OPTIONS = [
  { value: 0, label: '0% - Not Started' },
  { value: 25, label: '25% - Loading' },
  { value: 50, label: '50% - In Transit' },
  { value: 75, label: '75% - Approaching Destination' },
  { value: 100, label: '100% - Completed' }
];

const COMPLETION_STATUS_OPTIONS = [
  'Successfully Completed',
  'Completed with Issues',
  'Completed - Delayed',
  'Completed - Early'
];

const COMPLETION_NOTES_OPTIONS = [
  'No issues encountered',
  'Minor delays due to traffic',
  'Equipment performed well',
  'Weather conditions affected progress',
  'Route deviation required',
  'Additional stops made',
  'All safety protocols followed'
];

const ExecutionDashboard: React.FC = () => {
  const [executions, setExecutions] = useState<MovementExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<MovementExecution | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [showCompletionQRScanner, setShowCompletionQRScanner] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form state for modals
  const [progressForm, setProgressForm] = useState({
    current_location: '',
    progress_percentage: 0,
    notes: ''
  });
  
  const [completionForm, setCompletionForm] = useState({
    final_location: '',
    completion_status: '',
    completion_notes: ''
  });

  const [assignForm, setAssignForm] = useState({
    selected_executor: '',
    assignment_method: 'manual' as 'manual' | 'smart' | 'qr'
  });

  // Data state
  const [availableExecutors, setAvailableExecutors] = useState<Executor[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [loadingExecutors, setLoadingExecutors] = useState(false);

  useEffect(() => {
    loadExecutions();
    loadAvailableExecutors();
    
    // Get current user for permission checks
    const getUser = async () => {
      const user = await AuthManager.getCurrentUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const loadExecutions = async () => {
    setLoading(true);
    try {
      const data = await getMovementExecutions();
      setExecutions(data);
    } catch (error) {
      console.error('Error loading executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableExecutors = async () => {
    setLoadingExecutors(true);
    try {
      const executors = await getAvailableExecutors();
      setAvailableExecutors(executors);
    } catch (error) {
      console.error('Error loading executors:', error);
    } finally {
      setLoadingExecutors(false);
    }
  };

  const loadSmartSuggestions = async (executionType: string) => {
    setLoadingExecutors(true);
    try {
      const suggestions = await getSmartExecutorSuggestions(executionType, '');
      // Add missing properties with default values
      const suggestionsWithDefaults = suggestions.map(suggestion => ({
        ...suggestion,
        skills: (suggestion as any).skills || [],
        location: (suggestion as any).location || 'Main Site'
      }));
      setSmartSuggestions(suggestionsWithDefaults);
    } catch (error) {
      console.error('Error loading smart suggestions:', error);
    } finally {
      setLoadingExecutors(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExecutionTypeIcon = (type: string) => {
    switch (type) {
      case 'equipment':
        return <Truck className="w-4 h-4" />;
      case 'employee':
        return <User className="w-4 h-4" />;
      case 'material':
        return <MapPin className="w-4 h-4" />;
      case 'fleet':
        return <Truck className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-orange-600 bg-orange-100';
      case 'offline':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredExecutions = executions.filter(execution => {
    const matchesFilter = filter === 'all' || execution.status === filter;
    const matchesSearch = searchTerm === '' || 
      execution.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.current_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.from_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.to_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      execution.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: executions.length,
    in_progress: executions.filter(e => e.status === 'in_progress').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    unassigned: executions.filter(e => !e.assigned_executor_id).length
  };

  const handleAssignExecutor = async (executionId: string) => {
    setSelectedExecution(executions.find(e => e.id === executionId) || null);
    setAssignForm({ selected_executor: '', assignment_method: 'manual' });
    await loadAvailableExecutors();
    setShowAssignModal(true);
  };

  const handleSmartSuggestions = async (executionId: string) => {
    const execution = executions.find(e => e.id === executionId);
    if (!execution) return;
    
    setSelectedExecution(execution);
    await loadSmartSuggestions(execution.execution_type);
    setShowSmartSuggestions(true);
  };

  const handleQRScanner = (executionId: string) => {
    const execution = executions.find(e => e.id === executionId);
    if (!execution) return;
    
    setSelectedExecution(execution);
    setShowQRScanner(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedExecution?.id || !assignForm.selected_executor) return;
    
    try {
      const result = await assignExecutor(selectedExecution.id, assignForm.selected_executor);
      if (result.success) {
        setShowAssignModal(false);
        await loadExecutions();
      } else {
        alert('Error assigning executor');
      }
    } catch (error) {
      console.error('Error assigning executor:', error);
      alert('Error assigning executor');
    }
  };

  const handleSmartSuggestionSelect = async (executorId: string) => {
    if (!selectedExecution?.id) return;
    
    try {
      const result = await assignExecutor(selectedExecution.id, executorId);
      if (result.success) {
        setShowSmartSuggestions(false);
        await loadExecutions();
      } else {
        alert('Error assigning executor');
      }
    } catch (error) {
      console.error('Error assigning executor:', error);
      alert('Error assigning executor');
    }
  };

  const handleQRScannerSuccess = async (executor: any) => {
    setShowQRScanner(false);
    await loadExecutions();
  };

  const handleCompletionQRScannerSuccess = async (executor: any) => {
    setShowCompletionQRScanner(false);
    // Now show the completion form
    setCompletionForm({
      final_location: '',
      completion_status: '',
      completion_notes: ''
    });
    setShowCompletionModal(true);
  };

  const handleStartExecution = async (executionId: string) => {
    try {
      const result = await startExecution(executionId, 'Starting Location');
      if (result.success) {
        await loadExecutions();
      } else {
        alert('Error starting execution');
      }
    } catch (error) {
      console.error('Error starting execution:', error);
      alert('Error starting execution');
    }
  };

  const handleUpdateProgress = async (executionId: string) => {
    setSelectedExecution(executions.find(e => e.id === executionId) || null);
    setProgressForm({
      current_location: '',
      progress_percentage: 0,
      notes: ''
    });
    setShowProgressModal(true);
  };

  const handleCompleteExecution = async (executionId: string) => {
    const execution = executions.find(e => e.id === executionId);
    if (!execution) return;
    
    // Check if executor is assigned
    if (!execution.assigned_executor_id) {
      alert('Cannot complete execution: No executor assigned');
      return;
    }
    
    // Check if current location matches destination
    if (execution.current_location && execution.to_location && 
        execution.current_location !== execution.to_location) {
      const shouldProceed = confirm(
        `Warning: Current location (${execution.current_location}) does not match destination (${execution.to_location}).\n\n` +
        `Are you sure you want to mark this movement as complete?`
      );
      
      if (!shouldProceed) {
        return;
      }
    }
    
    setSelectedExecution(execution);
    setShowCompletionQRScanner(true);
  };

  const handleProgressUpdate = async () => {
    if (!selectedExecution?.id) return;
    
    try {
      const result = await updateExecutionProgress(selectedExecution.id, {
        current_location: progressForm.current_location,
        progress_percentage: progressForm.progress_percentage,
        notes: progressForm.notes
      });
      
      if (result.success) {
        setShowProgressModal(false);
        await loadExecutions();
      } else {
        alert('Error updating progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  const handleExecutionCompletion = async () => {
    if (!selectedExecution?.id) return;
    
    try {
      const result = await completeExecution(selectedExecution.id, {
        final_location: completionForm.final_location,
        completion_notes: `${completionForm.completion_status}: ${completionForm.completion_notes}`
      });
      
      if (result.success) {
        setShowCompletionModal(false);
        await loadExecutions();
      } else {
        alert('Error completing execution');
      }
    } catch (error) {
      console.error('Error completing execution:', error);
      alert('Error completing execution');
    }
  };

  const handleSupervisorComplete = async (executionId: string) => {
    const execution = executions.find(e => e.id === executionId);
    if (!execution) return;
    
    // Check if user has supervisor permissions (manager or higher)
    if (!currentUser || !AuthManager.hasPermission('manager')) {
      alert('Access denied. Only logistics supervisors can complete requests directly.');
      return;
    }
    
    // Check if current location matches destination
    if (execution.current_location && execution.to_location && 
        execution.current_location !== execution.to_location) {
      const shouldProceed = confirm(
        `Warning: Current location (${execution.current_location}) does not match destination (${execution.to_location}).\n\n` +
        `Are you sure you want to mark this movement as complete?`
      );
      
      if (!shouldProceed) {
        return;
      }
    }
    
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to complete this execution as a supervisor?\n\n` +
      `Execution ID: ${execution.id}\n` +
      `Request ID: ${execution.request_id}\n` +
      `Assigned Executor: ${execution.assigned_executor_id || 'None'}\n\n` +
      `This will mark the task as completed without QR verification from the assigned executor.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const result = await completeExecution(executionId, {
        final_location: execution.to_location || execution.current_location || 'Unknown',
        completion_notes: `Completed by supervisor (${currentUser.name}) without QR verification. Original executor: ${execution.assigned_executor_id || 'None'}`
      });
      
      if (result.success) {
        alert('Execution completed successfully by supervisor!');
        await loadExecutions();
      } else {
        alert('Error completing execution: ' + result.error);
      }
    } catch (error) {
      console.error('Error completing execution:', error);
      alert('Error completing execution');
    }
  };

  // Helper function to check if user can perform supervisor actions
  const canPerformSupervisorActions = () => {
    return currentUser && AuthManager.hasPermission('manager');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading executions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movement Execution Management</h1>
          <p className="text-gray-600">Track and manage movement executions in real-time</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <Play className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
            </div>
            <User className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by execution ID, from/to locations, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Execution ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExecutions.map((execution) => (
                <tr key={execution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {execution.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      {getExecutionTypeIcon(execution.execution_type)}
                      <span className="capitalize">{execution.execution_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(execution.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status)}`}>
                        {execution.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${execution.movement_progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{execution.movement_progress_percentage || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span>{execution.from_location || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-green-500" />
                      <span>{execution.to_location || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {execution.current_location || 'Not started'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {execution.assigned_executor_id || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {/* Only show assignment buttons if execution is not finished */}
                      {!execution.assigned_executor_id && execution.status !== 'completed' && execution.status !== 'failed' && execution.status !== 'cancelled' ? (
                        <>
                          <button
                            onClick={() => handleAssignExecutor(execution.id!)}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            title="Manual Assignment"
                          >
                            <Database className="w-4 h-4" />
                            <span>Assign</span>
                          </button>
                          <button
                            onClick={() => handleSmartSuggestions(execution.id!)}
                            className="text-purple-600 hover:text-purple-900 flex items-center space-x-1"
                            title="Smart Suggestions"
                          >
                            <Brain className="w-4 h-4" />
                            <span>Smart</span>
                          </button>
                          <button
                            onClick={() => handleQRScanner(execution.id!)}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                            title="QR Scanner"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Scan</span>
                          </button>
                        </>
                      ) : !execution.actual_start_time && execution.status !== 'completed' && execution.status !== 'failed' && execution.status !== 'cancelled' ? (
                        <button
                          onClick={() => handleStartExecution(execution.id!)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Start
                        </button>
                      ) : null}
                      
                      {/* Only show Update and Complete buttons if execution is not finished */}
                      {execution.status !== 'completed' && execution.status !== 'failed' && execution.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => handleUpdateProgress(execution.id!)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Update
                          </button>
                          
                          <button
                            onClick={() => handleCompleteExecution(execution.id!)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        </>
                      )}
                      
                      {/* Show completion status for finished executions */}
                      {(execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') && (
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                          execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                        </span>
                      )}

                      {/* Supervisor Complete button - always visible for supervisors */}
                      {canPerformSupervisorActions() && !['completed', 'failed', 'cancelled'].includes(execution.status) && (
                        <button
                          onClick={() => handleSupervisorComplete(execution.id!)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs flex items-center"
                          title="Complete as supervisor (bypasses QR verification)"
                        >
                          <User className="h-3 w-3 mr-1" />
                          Supervisor Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Executor Modal */}
      {showAssignModal && selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Executor</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Executor</label>
                  {loadingExecutors ? (
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading executors...</p>
                    </div>
                  ) : (
                    <select
                      value={assignForm.selected_executor}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, selected_executor: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose an executor...</option>
                      {availableExecutors.map(executor => (
                        <option key={executor.id} value={executor.id}>
                          {executor.name} - {executor.role} ({executor.department}) - {executor.availability}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Execution:</strong> {selectedExecution.id}<br/>
                    <strong>Type:</strong> {selectedExecution.execution_type}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={!assignForm.selected_executor}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Suggestions Modal */}
      {showSmartSuggestions && selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-medium text-gray-900">Smart Executor Suggestions</h3>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md mb-4">
                <p className="text-sm text-purple-800">
                  <strong>Execution:</strong> {selectedExecution.id}<br/>
                  <strong>Type:</strong> {selectedExecution.execution_type}
                </p>
              </div>

              {loadingExecutors ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing best matches...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {smartSuggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{suggestion.name}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${getAvailabilityColor(suggestion.availability)}`}>
                            {suggestion.availability}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{suggestion.match_score}%</div>
                          <div className="text-xs text-gray-500">Match Score</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600"><strong>Role:</strong> {suggestion.role}</p>
                          <p className="text-sm text-gray-600"><strong>Department:</strong> {suggestion.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600"><strong>Workload:</strong> {suggestion.current_workload} tasks</p>
                          <p className="text-sm text-gray-600"><strong>Location:</strong> {suggestion.location}</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1"><strong>Skills:</strong></p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.skills.map((skill, skillIndex) => (
                            <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1"><strong>Why this match:</strong></p>
                        <ul className="text-sm text-gray-700">
                          {suggestion.reasons.map((reason, reasonIndex) => (
                            <li key={reasonIndex} className="flex items-center space-x-1">
                              <span className="text-green-500">✓</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <button
                        onClick={() => handleSmartSuggestionSelect(suggestion.id)}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Assign This Executor</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSmartSuggestions(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner */}
      {showQRScanner && selectedExecution && (
        <ExecutorQRScanner
          executionId={selectedExecution.id!}
          executionType={selectedExecution.execution_type}
          onSuccess={handleQRScannerSuccess}
          onCancel={() => setShowQRScanner(false)}
        />
      )}

      {/* Completion QR Scanner */}
      {showCompletionQRScanner && selectedExecution && (
        <CompletionQRScanner
          executionId={selectedExecution.id!}
          assignedExecutorId={selectedExecution.assigned_executor_id!}
          onSuccess={handleCompletionQRScannerSuccess}
          onCancel={() => setShowCompletionQRScanner(false)}
        />
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Progress</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Location</label>
                  <select
                    value={progressForm.current_location}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, current_location: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select location...</option>
                    {LOCATION_OPTIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Progress (%)</label>
                  <select
                    value={progressForm.progress_percentage}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, progress_percentage: parseInt(e.target.value) }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PROGRESS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status Notes</label>
                  <select
                    value={progressForm.notes}
                    onChange={(e) => setProgressForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status...</option>
                    <option value="Moving as scheduled">Moving as scheduled</option>
                    <option value="Minor delay encountered">Minor delay encountered</option>
                    <option value="Route change required">Route change required</option>
                    <option value="Weather conditions affecting progress">Weather conditions affecting progress</option>
                    <option value="All systems operational">All systems operational</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProgressUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedExecution && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Execution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Final Location</label>
                  <select
                    value={completionForm.final_location}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, final_location: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select final location...</option>
                    {LOCATION_OPTIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Status</label>
                  <select
                    value={completionForm.completion_status}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, completion_status: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select completion status...</option>
                    {COMPLETION_STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Notes</label>
                  <select
                    value={completionForm.completion_notes}
                    onChange={(e) => setCompletionForm(prev => ({ ...prev, completion_notes: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select completion notes...</option>
                    {COMPLETION_NOTES_OPTIONS.map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecutionCompletion}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutionDashboard; 