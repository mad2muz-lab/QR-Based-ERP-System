-- Test Complete Movement Workflow
-- This script tests the end-to-end movement workflow

-- 1. Check if we have any existing movement requests
SELECT '=== EXISTING MOVEMENT REQUESTS ===' as info;
SELECT 
    id,
    reference_id,
    request_type,
    entity_name,
    status,
    created_at
FROM resource_movement_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if we have any existing executions
SELECT '=== EXISTING MOVEMENT EXECUTIONS ===' as info;
SELECT 
    id,
    request_id,
    execution_type,
    status,
    movement_progress_percentage,
    created_at
FROM resource_movement_executions 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if we have any notifications
SELECT '=== EXISTING NOTIFICATIONS ===' as info;
SELECT 
    id,
    movement_request_id,
    notification_type,
    message,
    is_read,
    created_at
FROM movement_notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Test creating a sample movement request (if table is empty)
SELECT '=== CREATING SAMPLE MOVEMENT REQUEST ===' as info;

-- Check if we have any requests first
SELECT COUNT(*) as existing_requests FROM resource_movement_requests;

-- If no requests exist, create a sample one
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM resource_movement_requests) = 0 THEN
        INSERT INTO resource_movement_requests (
            id,
            reference_id,
            request_type,
            entity_id,
            entity_name,
            entity_type,
            quantity,
            unit,
            location_from,
            location_to,
            requested_by,
            priority,
            status,
            notes,
            created_at
        ) VALUES (
            'REQ-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'REF-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'equipment',
            'test-equipment-id',
            'Test Equipment',
            'equipment',
            1,
            'unit',
            'Site A',
            'Site B',
            'test-user-id',
            'medium',
            'pending',
            'Test movement request for workflow verification',
            NOW()
        );
        
        RAISE NOTICE 'Sample movement request created successfully';
    ELSE
        RAISE NOTICE 'Movement requests already exist, skipping sample creation';
    END IF;
END $$;

-- 5. Verify the sample request was created
SELECT '=== VERIFYING SAMPLE REQUEST ===' as info;
SELECT 
    id,
    reference_id,
    request_type,
    entity_name,
    status,
    created_at
FROM resource_movement_requests 
WHERE reference_id LIKE 'REF-%'
ORDER BY created_at DESC 
LIMIT 1;

-- 6. Test creating a sample execution (if no executions exist)
SELECT '=== CREATING SAMPLE EXECUTION ===' as info;

-- Check if we have any executions first
SELECT COUNT(*) as existing_executions FROM resource_movement_executions;

-- If no executions exist, create a sample one
DO $$
DECLARE
    sample_request_id TEXT;
BEGIN
    -- Get a sample request ID
    SELECT id INTO sample_request_id 
    FROM resource_movement_requests 
    WHERE status = 'pending' 
    LIMIT 1;
    
    IF sample_request_id IS NOT NULL THEN
        INSERT INTO resource_movement_executions (
            id,
            request_id,
            execution_type,
            executed_by,
            status,
            notes,
            movement_progress_percentage,
            current_location,
            created_at
        ) VALUES (
            'EXEC-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            sample_request_id,
            'equipment',
            'test-executor-id',
            'in_progress',
            'Sample execution for workflow testing',
            0,
            'Starting Location',
            NOW()
        );
        
        RAISE NOTICE 'Sample execution created successfully for request: %', sample_request_id;
    ELSE
        RAISE NOTICE 'No pending requests found to create sample execution';
    END IF;
END $$;

-- 7. Verify the sample execution was created
SELECT '=== VERIFYING SAMPLE EXECUTION ===' as info;
SELECT 
    id,
    request_id,
    execution_type,
    status,
    movement_progress_percentage,
    current_location,
    created_at
FROM resource_movement_executions 
WHERE id LIKE 'EXEC-TEST-%'
ORDER BY created_at DESC 
LIMIT 1;

-- 8. Test workflow status summary
SELECT '=== WORKFLOW STATUS SUMMARY ===' as info;
SELECT 
    'Requests' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM resource_movement_requests
UNION ALL
SELECT 
    'Executions' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as approved,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM resource_movement_executions
UNION ALL
SELECT 
    'Notifications' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_read = false THEN 1 END) as pending,
    0 as approved,
    0 as in_progress,
    0 as completed,
    0 as cancelled
FROM movement_notifications;

-- 9. Test data relationships
SELECT '=== TESTING DATA RELATIONSHIPS ===' as info;
SELECT 
    rmr.id as request_id,
    rmr.reference_id,
    rmr.status as request_status,
    rme.id as execution_id,
    rme.status as execution_status,
    rme.movement_progress_percentage
FROM resource_movement_requests rmr
LEFT JOIN resource_movement_executions rme ON rmr.id = rme.request_id
ORDER BY rmr.created_at DESC
LIMIT 5;

-- 10. Final verification
SELECT '=== FINAL VERIFICATION ===' as info;
SELECT 
    'Database tables are ready for testing' as status,
    (SELECT COUNT(*) FROM resource_movement_requests) as total_requests,
    (SELECT COUNT(*) FROM resource_movement_executions) as total_executions,
    (SELECT COUNT(*) FROM movement_notifications) as total_notifications; 