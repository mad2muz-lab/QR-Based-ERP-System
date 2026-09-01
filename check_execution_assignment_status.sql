-- Check the assignment status of execution EXEC-1754506512027-SMN
-- This will show if it's pre-assigned and whether it can be overridden

-- Check the specific execution record
SELECT 
  id,
  request_id,
  execution_type,
  status,
  assigned_executor_id,
  executed_by,
  created_at,
  updated_at,
  CASE 
    WHEN assigned_executor_id IS NULL THEN 'Unassigned'
    WHEN assigned_executor_id IS NOT NULL THEN 'Assigned'
  END as assignment_status
FROM resource_movement_executions 
WHERE id = 'EXEC-1754506512027-SMN';

-- Check if there are any constraints that prevent reassignment
-- Look at the table structure to understand assignment rules
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'resource_movement_executions' 
AND column_name IN ('assigned_executor_id', 'executed_by', 'status');

-- Check the related request to understand the context
SELECT 
  r.id as request_id,
  r.request_type,
  r.entity_name,
  r.status as request_status,
  e.id as execution_id,
  e.status as execution_status,
  e.assigned_executor_id,
  e.executed_by
FROM resource_movement_requests r
LEFT JOIN resource_movement_executions e ON r.id = e.request_id
WHERE e.id = 'EXEC-1754506512027-SMN';

-- Check if the execution can be reassigned based on current status
SELECT 
  id,
  status,
  assigned_executor_id,
  CASE 
    WHEN status = 'in_progress' AND assigned_executor_id IS NOT NULL THEN 'Can be reassigned (in progress)'
    WHEN status = 'completed' THEN 'Cannot be reassigned (completed)'
    WHEN status = 'failed' THEN 'Can be reassigned (failed)'
    WHEN status = 'cancelled' THEN 'Cannot be reassigned (cancelled)'
    WHEN assigned_executor_id IS NULL THEN 'Can be assigned (unassigned)'
    ELSE 'Check status for reassignment rules'
  END as reassignment_status
FROM resource_movement_executions 
WHERE id = 'EXEC-1754506512027-SMN'; 