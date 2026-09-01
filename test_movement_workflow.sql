-- Test Movement Workflow
-- Run this script to verify movement requests are being created

-- 1. Check if movement requests table exists and has data
SELECT 
  'MOVEMENT REQUESTS' as table_name,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) as pending_approval,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM resource_movement_requests;

-- 2. Show latest movement requests
SELECT 
  id,
  reference_id,
  movement_type,
  from_location,
  to_location,
  priority,
  status,
  requester_name,
  created_at
FROM resource_movement_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if notifications were created
SELECT 
  'NOTIFICATIONS' as table_name,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = false THEN 1 END) as unread_notifications
FROM movement_notifications;

-- 4. Show recent notifications
SELECT 
  movement_request_id,
  recipient_role,
  notification_type,
  message,
  is_read,
  created_at
FROM movement_notifications 
ORDER BY created_at DESC 
LIMIT 5; 