// Resource Movement Data Service
// Handles all API calls and data operations for the unified Resource Movement Management system

import { supabase } from './supabaseClient';

export interface MovementRequest {
  id?: string;
  reference_id?: string;
  request_type: 'fleet' | 'equipment' | 'employee' | 'material';
  entity_id: string;
  entity_name: string;
  entity_type: string;
  quantity: number;
  unit: string;
  location_from: string;
  location_to: string;
  requested_by: string;
  requested_at?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  estimated_duration?: number;
  estimated_cost?: number;
  actual_duration?: number;
  actual_cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MovementExecution {
  id?: string;
  request_id: string; // Changed to match database schema
  execution_type: 'fleet' | 'equipment' | 'employee' | 'material';
  vehicle_id?: string;
  driver_id?: string;
  route_plan?: string;
  start_time?: string;
  end_time?: string;
  executed_by: string;
  executed_at?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  actual_route?: string;
  fuel_consumed?: number;
  distance_traveled?: number;
  cost_center?: string;
  profit_center?: string;
  cross_charge_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // New execution tracking fields
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

export interface MovementNotification {
  id?: string;
  movement_request_id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  notification_type: 'request_created' | 'approval_required' | 'approved' | 'rejected' | 'execution_started' | 'execution_completed';
  message: string;
  is_read: boolean;
  created_at: string;
}

// Create a new movement request
export const createMovementRequest = async (request: MovementRequest): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await supabase
      .from('resource_movement_requests')
      .insert([request])
      .select()
      .single();

    if (error) throw error;

    // Create notifications for relevant stakeholders
    await createMovementNotifications(data.id, request);

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error creating movement request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get movement requests with filtering
export const getMovementRequests = async (filters?: {
  status?: string;
  request_type?: string;
  requested_by?: string;
  department?: string;
}): Promise<MovementRequest[]> => {
  try {
    let query = supabase
      .from('resource_movement_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.request_type) {
      query = query.eq('request_type', filters.request_type);
    }
    if (filters?.requested_by) {
      query = query.eq('requested_by', filters.requested_by);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching movement requests:', error);
    return [];
  }
};

// Update movement request status
export const updateMovementRequestStatus = async (
  requestId: string,
  status: MovementRequest['status'],
  additionalData?: {
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (additionalData?.notes) {
      updateData.notes = additionalData.notes;
    }

    const { error } = await supabase
      .from('resource_movement_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) throw error;

    // Create notifications for status change
    await createStatusChangeNotification(requestId, status, additionalData);

    return { success: true };
  } catch (error) {
    console.error('Error updating movement request status:', error);
    return { success: false, error: error.message };
  }
};

// Create movement execution record
export const createMovementExecution = async (execution: MovementExecution): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('resource_movement_executions')
      .insert([execution])
      .select()
      .single();

    if (error) throw error;

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error creating movement execution:', error);
    return { success: false, error: error.message };
  }
};

// Update movement execution
export const updateMovementExecution = async (
  executionId: string,
  updates: Partial<MovementExecution>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('resource_movement_executions')
      .update(updates)
      .eq('id', executionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating movement execution:', error);
    return { success: false, error: error.message };
  }
};

// Get notifications for a user
export const getMovementNotifications = async (userId?: string): Promise<MovementNotification[]> => {
  try {
    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No authenticated user found, returning empty notifications');
      return [];
    }

    const { data, error } = await supabase
      .from('movement_notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('movement_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to create notifications
const createMovementNotifications = async (requestId: string, request: MovementRequest): Promise<void> => {
  try {
    // Get current user for requester notification
    const { data: { user } } = await supabase.auth.getUser();
    
    const notifications = [];

    // Notify requester (current user)
    if (user) {
      notifications.push({
        movement_request_id: requestId,
        recipient_id: user.id,
        recipient_name: user.email || 'Current User',
        recipient_role: 'requester',
        notification_type: 'request_created',
        message: `Your movement request ${request.reference_id} has been submitted successfully`,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    // For now, skip manager notifications until we have proper role management
    // TODO: Implement proper role-based notifications

    // Insert notifications if any
    if (notifications.length > 0) {
      const { error } = await supabase.from('movement_notifications').insert(notifications);
      if (error) {
        console.error('Error inserting notifications:', error);
      }
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

// Helper function to create status change notifications
const createStatusChangeNotification = async (
  requestId: string,
  status: string,
  additionalData?: any
): Promise<void> => {
  // This would create notifications based on status changes
  // Implementation depends on your notification system
  console.log(`Status change notification for request ${requestId}: ${status}`);
};

// Get movement analytics
export const getMovementAnalytics = async (filters?: {
  date_from?: string;
  date_to?: string;
  movement_type?: string;
  department?: string;
}): Promise<any> => {
  try {
    let query = supabase
      .from('movement_analytics')
      .select('*');

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters?.movement_type) {
      query = query.eq('movement_type', filters.movement_type);
    }
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching movement analytics:', error);
    return [];
  }
};

// ===== EXECUTION MANAGEMENT FUNCTIONS =====

// Get all execution records
export const getMovementExecutions = async (filters?: {
  status?: string;
  assigned_executor_id?: string;
}): Promise<MovementExecution[]> => {
  try {
    let query = supabase
      .from('resource_movement_executions')
      .select(`
        *,
        resource_movement_requests!inner(
          location_from,
          location_to
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assigned_executor_id) {
      query = query.eq('assigned_executor_id', filters.assigned_executor_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map the data to include from/to locations
    const executionsWithLocations = (data || []).map(execution => ({
      ...execution,
      from_location: execution.resource_movement_requests?.location_from || 'Unknown',
      to_location: execution.resource_movement_requests?.location_to || 'Unknown'
    }));

    return executionsWithLocations;
  } catch (error) {
    console.error('Error fetching movement executions:', error);
    return [];
  }
};

// Assign executor to an execution
export const assignExecutor = async (
  executionId: string,
  executorId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('resource_movement_executions')
      .update({
        assigned_executor_id: executorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error assigning executor:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Start execution
export const startExecution = async (
  executionId: string,
  startLocation: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('resource_movement_executions')
      .update({
        actual_start_time: new Date().toISOString(),
        current_location: startLocation,
        last_updated_location: startLocation,
        movement_progress_percentage: 0,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error starting execution:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Update execution progress
export const updateExecutionProgress = async (
  executionId: string,
  updates: {
    current_location?: string;
    progress_percentage?: number;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.current_location) {
      updateData.current_location = updates.current_location;
      updateData.last_updated_location = updates.current_location;
    }
    if (updates.progress_percentage !== undefined) {
      updateData.movement_progress_percentage = updates.progress_percentage;
    }
    if (updates.notes) {
      updateData.notes = updates.notes;
    }

    const { error } = await supabase
      .from('resource_movement_executions')
      .update(updateData)
      .eq('id', executionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating execution progress:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Complete execution
export const completeExecution = async (
  executionId: string,
  completionData: {
    final_location: string;
    completion_notes?: string;
    final_cost_breakdown?: any;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('resource_movement_executions')
      .update({
        actual_end_time: new Date().toISOString(),
        current_location: completionData.final_location,
        last_updated_location: completionData.final_location,
        movement_progress_percentage: 100,
        status: 'completed',
        completion_notes: completionData.completion_notes,
        final_cost_breakdown: completionData.final_cost_breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error completing execution:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 

// ===== EXECUTOR MANAGEMENT FUNCTIONS =====

// Get available executors from employees table
export const getAvailableExecutors = async (filters?: {
  department?: string;
  role?: string;
  execution_type?: string;
}): Promise<{
  id: string;
  name: string;
  role: string;
  department: string;
  availability: 'available' | 'busy' | 'offline';
  current_workload: number;
  skills: string[];
  location: string;
}[]> => {
  try {
    let query = supabase
      .from('employees')
      .select(`
        id,
        name,
        position,
        department,
        site
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters?.department) {
      query = query.eq('department', filters.department);
    }
    if (filters?.role) {
      query = query.eq('position', filters.role);
    }

    const { data: employees, error } = await query;
    if (error) throw error;

    // Get current workload for each employee
    const executorsWithWorkload = await Promise.all(
      (employees || []).map(async (employee) => {
        // Get current active executions for this employee
        const { data: activeExecutions } = await supabase
          .from('resource_movement_executions')
          .select('id, status')
          .eq('assigned_executor_id', employee.id)
          .in('status', ['in_progress', 'pending']);

        const currentWorkload = activeExecutions?.length || 0;
        
        // Determine availability based on workload
        let availability: 'available' | 'busy' | 'offline' = 'available';
        if (currentWorkload >= 3) {
          availability = 'busy';
        } else if (currentWorkload >= 1) {
          availability = 'busy';
        }

        // Map skills based on role and department
        const skills = getSkillsForRole(employee.role, employee.department);

                 return {
           id: employee.id,
           name: employee.name,
           role: employee.position,
           department: employee.department,
           availability,
           current_workload: currentWorkload,
           skills,
           location: employee.site
         };
      })
    );

    return executorsWithWorkload;
  } catch (error) {
    console.error('Error fetching available executors:', error);
    return [];
  }
};

// Get skills for a specific role and department
const getSkillsForRole = (role: string, department: string): string[] => {
  const skillMap: { [key: string]: string[] } = {
    'Driver': ['Vehicle Operation', 'Route Planning', 'Safety Protocols'],
    'Equipment Operator': ['Heavy Equipment', 'Safety Training', 'Maintenance Basics'],
    'Fleet Manager': ['Fleet Management', 'Logistics Planning', 'Team Leadership'],
    'Transport Coordinator': ['Route Optimization', 'Scheduling', 'Communication'],
    'Equipment Specialist': ['Equipment Maintenance', 'Technical Skills', 'Problem Solving'],
    'Site Engineer': ['Project Management', 'Technical Planning', 'Safety Compliance'],
    'Logistics Coordinator': ['Supply Chain', 'Inventory Management', 'Process Optimization']
  };

  return skillMap[role] || ['General Operations'];
};

// Get smart executor suggestions based on execution type
export const getSmartExecutorSuggestions = async (
  executionType: string,
  location: string
): Promise<{
  id: string;
  name: string;
  role: string;
  department: string;
  match_score: number;
  reasons: string[];
  availability: 'available' | 'busy' | 'offline';
  current_workload: number;
}[]> => {
  try {
    // Get all available executors
    const allExecutors = await getAvailableExecutors();
    
    // Score each executor based on multiple factors
    const scoredExecutors = allExecutors.map(executor => {
      let matchScore = 0;
      const reasons: string[] = [];

      // 1. Role-based matching (40% weight)
      const roleMatch = getRoleMatchScore(executor.role, executionType);
      matchScore += roleMatch.score * 0.4;
      if (roleMatch.score > 0.7) {
        reasons.push(`Perfect role match: ${executor.role}`);
      }

      // 2. Department relevance (20% weight)
      const deptMatch = getDepartmentMatchScore(executor.department, executionType);
      matchScore += deptMatch.score * 0.2;
      if (deptMatch.score > 0.8) {
        reasons.push(`Department expertise: ${executor.department}`);
      }

      // 3. Availability (25% weight)
      const availabilityScore = executor.availability === 'available' ? 1 : 
                               executor.availability === 'busy' ? 0.5 : 0;
      matchScore += availabilityScore * 0.25;
      if (availabilityScore === 1) {
        reasons.push('Currently available');
      }

      // 4. Workload (15% weight)
      const workloadScore = Math.max(0, 1 - (executor.current_workload / 5));
      matchScore += workloadScore * 0.15;
      if (workloadScore > 0.8) {
        reasons.push('Low current workload');
      }

      return {
        ...executor,
        match_score: Math.round(matchScore * 100),
        reasons
      };
    });

    // Sort by match score and return top suggestions
    return scoredExecutors
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5); // Return top 5 suggestions
  } catch (error) {
    console.error('Error getting smart suggestions:', error);
    return [];
  }
};

// Calculate role match score
const getRoleMatchScore = (role: string, executionType: string): { score: number } => {
  const roleMatches: { [key: string]: { [key: string]: number } } = {
    'equipment': {
      'Equipment Operator': 1.0,
      'Equipment Specialist': 0.9,
      'Fleet Manager': 0.7,
      'Site Engineer': 0.6,
      'Driver': 0.5
    },
    'fleet': {
      'Driver': 1.0,
      'Fleet Manager': 0.9,
      'Transport Coordinator': 0.8,
      'Equipment Operator': 0.6
    },
    'material': {
      'Transport Coordinator': 0.9,
      'Logistics Coordinator': 0.8,
      'Fleet Manager': 0.7,
      'Driver': 0.6
    },
    'employee': {
      'Transport Coordinator': 0.9,
      'Logistics Coordinator': 0.8,
      'Fleet Manager': 0.7,
      'Driver': 0.6
    }
  };

  const matches = roleMatches[executionType] || {};
  return { score: matches[role] || 0.3 };
};

// Calculate department match score
const getDepartmentMatchScore = (department: string, executionType: string): { score: number } => {
  const deptMatches: { [key: string]: { [key: string]: number } } = {
    'equipment': {
      'Maintenance': 1.0,
      'Operations': 0.9,
      'Logistics': 0.7,
      'Construction': 0.8
    },
    'fleet': {
      'Logistics': 1.0,
      'Transport': 0.9,
      'Operations': 0.7
    },
    'material': {
      'Logistics': 1.0,
      'Procurement': 0.8,
      'Warehouse': 0.9
    },
    'employee': {
      'HR': 0.9,
      'Logistics': 0.8,
      'Operations': 0.7
    }
  };

  const matches = deptMatches[executionType] || {};
  return { score: matches[department] || 0.5 };
};

// Assign executor with QR code (for mobile scanning)
export const assignExecutorByQR = async (
  executionId: string,
  qrCodeData: string
): Promise<{ success: boolean; error?: string; executor?: any }> => {
  try {
    console.log('QR Code data received:', qrCodeData);
    
    // Parse QR code data (assuming it contains employee ID)
    let employeeId = qrCodeData;
    
    // If QR contains JSON, extract employee ID
    if (qrCodeData.startsWith('{')) {
      try {
        const qrData = JSON.parse(qrCodeData);
        employeeId = qrData.employee_id || qrData.id || qrCodeData;
        console.log('Extracted employee ID from JSON:', employeeId);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        // If JSON parsing fails, use the raw data
        employeeId = qrCodeData;
      }
    }

    console.log('Looking up employee with ID:', employeeId);

    // First try exact match
    let { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, position, department, status')
      .eq('id', employeeId)
      .eq('status', 'active')
      .single();

    // If not found, try looking up by custom_id or qr_code
    if (employeeError || !employee) {
      console.log('Exact match failed, trying alternative fields...');
      
      // Try custom_id first (if it exists)
      let { data: altEmployee, error: altError } = await supabase
        .from('employees')
        .select('id, name, position, department, status')
        .eq('custom_id', employeeId)
        .eq('status', 'active')
        .single();

      // If still not found, try qr_code (if it exists)
      if (altError || !altEmployee) {
        const { data: qrEmployee, error: qrError } = await supabase
          .from('employees')
          .select('id, name, position, department, status')
          .eq('qr_code', employeeId)
          .eq('status', 'active')
          .single();

        if (qrEmployee && !qrError) {
          altEmployee = qrEmployee;
          altError = null;
        }
      }

      // If still not found, try partial name match
      if (altError || !altEmployee) {
        const { data: nameEmployee, error: nameError } = await supabase
          .from('employees')
          .select('id, name, position, department, status')
          .ilike('name', `%${employeeId}%`)
          .eq('status', 'active')
          .single();

        if (nameEmployee && !nameError) {
          altEmployee = nameEmployee;
          altError = null;
        }
      }

      if (altEmployee && !altError) {
        employee = altEmployee;
        employeeError = null;
        console.log('Found employee via alternative lookup:', employee);
      }
    }

    if (employeeError || !employee) {
      console.error('Employee lookup failed:', employeeError);
      return { 
        success: false, 
        error: `Employee not found or inactive. Looked for ID: ${employeeId}` 
      };
    }

    // Check if employee is available
    const { data: activeExecutions } = await supabase
      .from('resource_movement_executions')
      .select('id')
      .eq('assigned_executor_id', employeeId)
      .in('status', ['in_progress', 'pending']);

    if (activeExecutions && activeExecutions.length >= 3) {
      return { 
        success: false, 
        error: 'Employee is currently busy with other tasks' 
      };
    }

    // Assign the executor
    const result = await assignExecutor(executionId, employeeId);
    
    if (result.success) {
      return {
        success: true,
        executor: {
          id: employee.id,
          name: employee.name,
          role: employee.position,
          department: employee.department
        }
      };
    } else {
      return result;
    }
  } catch (error) {
    console.error('Error assigning executor by QR:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 