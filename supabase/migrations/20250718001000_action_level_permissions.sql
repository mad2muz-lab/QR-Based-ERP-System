-- Migration: Add action-level permissions to role_page_access

ALTER TABLE role_page_access
  ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false;

-- Backfill existing rows (if any) to set can_edit/can_delete to false
UPDATE role_page_access SET can_edit = false WHERE can_edit IS NULL;
UPDATE role_page_access SET can_delete = false WHERE can_delete IS NULL;

-- Now you can use can_access, can_edit, can_delete for each page/role 