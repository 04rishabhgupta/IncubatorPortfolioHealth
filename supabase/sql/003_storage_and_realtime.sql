-- ==============================================================================
-- 003_storage_and_realtime.sql
-- Migration for Phase 5: Storage bucket RLS policies, Realtime publications,
-- and audit tracking columns.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REALTIME REPLICATION CONFIGURATION
-- ------------------------------------------------------------------------------

-- Ensure full row image is available for realtime updates and deletes
ALTER TABLE IF EXISTS notifications REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS notification_recipients REPLICA IDENTITY FULL;

-- Add notifications & recipients to supabase_realtime publication if not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE notification_recipients;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. AUDIT TRAIL COLUMNS FOR EXCEL UPLOADS
-- ------------------------------------------------------------------------------

-- Track private storage path of uploaded raw Excel files for auditing
ALTER TABLE IF EXISTS startups
  ADD COLUMN IF NOT EXISTS excel_audit_path text;

ALTER TABLE IF EXISTS startup_fitt_trackers
  ADD COLUMN IF NOT EXISTS excel_file_path text;

-- ------------------------------------------------------------------------------
-- 3. STORAGE POLICIES: portfolio-files BUCKET
-- ------------------------------------------------------------------------------
-- Bucket: 'portfolio-files' (private bucket)
-- Folder structures:
--   excel-audits/{startup_id}/{timestamp}-{filename}.xlsx
--   milestone-evidence/{startup_id}/{milestone_id}/{timestamp}-{filename}

-- Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Staff Read Policy: Staff can read files belonging to startups they can access
DROP POLICY IF EXISTS "staff_read_portfolio_files" ON storage.objects;
CREATE POLICY "staff_read_portfolio_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'portfolio-files'
    AND (
      get_current_role() = 'ADMIN'
      OR (
        split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND can_access_startup(split_part(name, '/', 2)::uuid)
      )
    )
  );

-- Staff Upload Policy: Staff can upload files into their scoped startups
DROP POLICY IF EXISTS "staff_upload_portfolio_files" ON storage.objects;
CREATE POLICY "staff_upload_portfolio_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio-files'
    AND (
      get_current_role() = 'ADMIN'
      OR (
        split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND can_access_startup(split_part(name, '/', 2)::uuid)
      )
    )
  );

-- Staff Update Policy: Staff can update existing files for their startups
DROP POLICY IF EXISTS "staff_update_portfolio_files" ON storage.objects;
CREATE POLICY "staff_update_portfolio_files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'portfolio-files'
    AND (
      get_current_role() = 'ADMIN'
      OR (
        split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND can_access_startup(split_part(name, '/', 2)::uuid)
      )
    )
  )
  WITH CHECK (
    bucket_id = 'portfolio-files'
    AND (
      get_current_role() = 'ADMIN'
      OR (
        split_part(name, '/', 2) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND can_access_startup(split_part(name, '/', 2)::uuid)
      )
    )
  );

-- Admin Delete Policy: Only admins can delete archived audit files or evidence
DROP POLICY IF EXISTS "admin_delete_portfolio_files" ON storage.objects;
CREATE POLICY "admin_delete_portfolio_files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portfolio-files'
    AND get_current_role() = 'ADMIN'
  );
