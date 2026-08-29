-- Check Movement Workflow Data Flow
-- This script helps verify the complete workflow from request to execution

-- 1. Check all movement requests
SELECT 
  'REQUESTS' as table_name,
  COUNT(*) as record_count,
  status,
  movement_type
FROM resource_movement_requests 
GROUP BY status, movement_type
ORDER BY status, movement_type;

-- 2. Check all movement executions
SELECT 
  'EXECUTIONS' as table_name,
  COUNT(*) as record_count,
  status,
  execution_type
FROM resource_movement_executions 
GROUP BY status, execution_type
ORDER BY status, execution_type;

-- 3. Check linked requests and executions
SELECT 
  r.id as request_id,
  r.reference_id,
  r.movement_type,
  r.status as request_status,
  r.created_at as request_created,
  e.id as execution_id,
  e.status as execution_status,
  e.created_at as execution_created,
  CASE 
    WHEN e.id IS NULL THEN '❌ No Execution'
    WHEN r.status = 'approved' AND e.status = 'in_progress' THEN '✅ Properly Linked'
    WHEN r.status = 'pending_approval' AND e.id IS NULL THEN '⏳ Waiting for Approval'
    ELSE '⚠️ Status Mismatch'
  END as workflow_status
FROM resource_movement_requests r
LEFT JOIN resource_movement_executions e ON r.id = e.request_id
ORDER BY r.created_at DESC;

-- 4. Check notifications
SELECT 
  'NOTIFICATIONS' as table_name,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications,
  notification_type,
  recipient_role
FROM movement_notifications 
GROUP BY notification_type, recipient_role
ORDER BY notification_type, recipient_role;

-- 5. Summary of workflow status
SELECT 
  'WORKFLOW SUMMARY' as summary_type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_approval,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM resource_movement_requests;

-- 6. Check for orphaned executions (executions without requests)
SELECT 
  'ORPHANED EXECUTIONS' as issue_type,
  e.id as execution_id,
  e.request_id,
  e.status,
  e.created_at
FROM resource_movement_executions e
LEFT JOIN resource_movement_requests r ON e.request_id = r.id
WHERE r.id IS NULL; 