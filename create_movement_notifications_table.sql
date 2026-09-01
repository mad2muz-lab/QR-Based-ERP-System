-- Create Movement Notifications Table
-- This table stores notifications for movement requests

CREATE TABLE IF NOT EXISTS movement_notifications (
    id TEXT PRIMARY KEY DEFAULT 'NOTIF-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 5),
    movement_request_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_role TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('request_created', 'approval_required', 'approved', 'rejected', 'execution_started', 'execution_completed')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movement_notifications_recipient_id ON movement_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_movement_notifications_request_id ON movement_notifications(movement_request_id);
CREATE INDEX IF NOT EXISTS idx_movement_notifications_is_read ON movement_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_movement_notifications_created_at ON movement_notifications(created_at);

-- Add foreign key constraint
ALTER TABLE movement_notifications 
ADD CONSTRAINT fk_movement_notifications_request_id 
FOREIGN KEY (movement_request_id) REFERENCES resource_movement_requests(id) ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE movement_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own notifications
CREATE POLICY "Users can view their own notifications" ON movement_notifications
    FOR SELECT USING (recipient_id = auth.uid()::TEXT);

-- Policy for inserting notifications (system/admin only)
CREATE POLICY "System can insert notifications" ON movement_notifications
    FOR INSERT WITH CHECK (true);

-- Policy for updating notifications (users can mark their own as read)
CREATE POLICY "Users can update their own notifications" ON movement_notifications
    FOR UPDATE USING (recipient_id = auth.uid()::TEXT);

-- Insert some sample notifications for testing
INSERT INTO movement_notifications (
    movement_request_id,
    recipient_id,
    recipient_name,
    recipient_role,
    notification_type,
    message,
    is_read
) VALUES 
(
    (SELECT id FROM resource_movement_requests LIMIT 1),
    'current_user_id',
    'Test User',
    'requester',
    'request_created',
    'Your movement request has been submitted successfully',
    false
),
(
    (SELECT id FROM resource_movement_requests LIMIT 1),
    'logistics_manager_id',
    'Logistics Manager',
    'logistics_manager',
    'approval_required',
    'New movement request requires your approval',
    false
)
ON CONFLICT (id) DO NOTHING;

-- Verify the table was created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'movement_notifications'
ORDER BY ordinal_position; 