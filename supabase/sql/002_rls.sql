-- ==============================================================================
-- 002_rls.sql: Row-Level Security Policies & Helper Functions
-- Status: Draft / Initial migration
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS (Security Definer & Stable)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION can_access_startup(p_startup_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM startups s
    WHERE s.id = p_startup_id
    AND (
      (SELECT current_role()) = 'ADMIN'
      OR ((SELECT current_role()) = 'INVESTMENT_MANAGER' AND s.manager_id = auth.uid())
      OR ((SELECT current_role()) = 'INVESTMENT_ASSOCIATE' AND s.associate_id = auth.uid())
    )
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. STORED RPCS FOR SENSITIVE MUTATIONS
-- ------------------------------------------------------------------------------

-- Atomically reassign manager or associate with business hierarchy checks
CREATE OR REPLACE FUNCTION update_assignment(
  p_startup_id uuid,
  p_manager_id uuid,
  p_associate_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_curr_manager_id uuid;
  v_assoc_manager_id uuid;
BEGIN
  v_role := current_role();
  SELECT manager_id INTO v_curr_manager_id FROM startups WHERE id = p_startup_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Startup not found';
  END IF;

  -- Verify caller permissions
  IF v_role = 'ADMIN' THEN
    -- Admin can reassign anyone
    NULL;
  ELSIF v_role = 'INVESTMENT_MANAGER' AND v_curr_manager_id = auth.uid() THEN
    -- Portfolio Head can only assign associates, cannot change managing Portfolio Head
    IF p_manager_id IS NOT NULL AND p_manager_id != auth.uid() THEN
      RAISE EXCEPTION 'Portfolio Heads cannot reassign managing Portfolio Head';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unauthorized to reassign startup';
  END IF;

  -- Validate that the associate reports to the designated manager
  IF p_associate_id IS NOT NULL THEN
    SELECT manager_id INTO v_assoc_manager_id FROM profiles WHERE id = p_associate_id;
    IF v_assoc_manager_id IS NULL OR v_assoc_manager_id != COALESCE(p_manager_id, v_curr_manager_id) THEN
      RAISE EXCEPTION 'Assigned Portfolio Manager must report to supervising Portfolio Head';
    END IF;
  END IF;

  UPDATE startups
  SET
    manager_id = COALESCE(p_manager_id, manager_id),
    associate_id = p_associate_id,
    updated_at = now()
  WHERE id = p_startup_id;
END;
$$;

-- Enforce that only owning Portfolio Head or Admin can approve assessment
CREATE OR REPLACE FUNCTION approve_assessment(
  p_assessment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_startup_id uuid;
  v_manager_id uuid;
  v_role text;
BEGIN
  v_role := current_role();
  SELECT startup_id INTO v_startup_id FROM health_assessments WHERE id = p_assessment_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assessment not found';
  END IF;

  SELECT manager_id INTO v_manager_id FROM startups WHERE id = v_startup_id;

  IF v_role != 'ADMIN' AND (v_role != 'INVESTMENT_MANAGER' OR v_manager_id != auth.uid()) THEN
    RAISE EXCEPTION 'Only supervising Portfolio Head or Admin may approve this assessment';
  END IF;

  UPDATE health_assessments
  SET
    status = 'APPROVED',
    approved_by = auth.uid(),
    approved_on = now(),
    updated_at = now()
  WHERE id = p_assessment_id;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ------------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_fitt_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_items ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. POLICIES: PROFILES
-- ------------------------------------------------------------------------------

-- All authenticated users can view all staff profiles (needed to render names and roles)
CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can update their own label
CREATE POLICY profiles_update_own_policy ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Regular users cannot escalate their own role or switch managers
    AND (
      current_role() = 'ADMIN'
      OR (
        role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
        AND manager_id IS NOT DISTINCT FROM (SELECT p.manager_id FROM profiles p WHERE p.id = auth.uid())
      )
    )
  );

-- Admins can insert/update any profile
CREATE POLICY profiles_admin_insert ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (current_role() = 'ADMIN');

CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE TO authenticated
  USING (current_role() = 'ADMIN');

-- ------------------------------------------------------------------------------
-- 5. POLICIES: STARTUPS
-- ------------------------------------------------------------------------------

CREATE POLICY startups_select_policy ON startups
  FOR SELECT TO authenticated
  USING (can_access_startup(id));

CREATE POLICY startups_insert_policy ON startups
  FOR INSERT TO authenticated
  WITH CHECK (
    current_role() = 'ADMIN'
    OR (current_role() = 'INVESTMENT_MANAGER' AND manager_id = auth.uid())
  );

CREATE POLICY startups_update_policy ON startups
  FOR UPDATE TO authenticated
  USING (can_access_startup(id))
  WITH CHECK (can_access_startup(id));

CREATE POLICY startups_delete_policy ON startups
  FOR DELETE TO authenticated
  USING (
    current_role() = 'ADMIN'
    OR (current_role() = 'INVESTMENT_MANAGER' AND manager_id = auth.uid())
  );

-- Revoke direct column updates to manager_id and associate_id; force use of update_assignment()
REVOKE UPDATE (manager_id, associate_id) ON startups FROM authenticated;

-- ------------------------------------------------------------------------------
-- 6. POLICIES: STARTUP-SCOPED TABLES
-- ------------------------------------------------------------------------------

-- startup_fitt_trackers
CREATE POLICY fitt_trackers_all_policy ON startup_fitt_trackers
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- founder_links
CREATE POLICY founder_links_all_policy ON founder_links
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- team_members
CREATE POLICY team_members_all_policy ON team_members
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- milestones
CREATE POLICY milestones_all_policy ON milestones
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- monthly_metrics
CREATE POLICY monthly_metrics_all_policy ON monthly_metrics
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- health_assessments
CREATE POLICY health_assessments_select ON health_assessments
  FOR SELECT TO authenticated
  USING (can_access_startup(startup_id));

CREATE POLICY health_assessments_insert ON health_assessments
  FOR INSERT TO authenticated
  WITH CHECK (can_access_startup(startup_id));

CREATE POLICY health_assessments_update ON health_assessments
  FOR UPDATE TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- data_requests
CREATE POLICY data_requests_all_policy ON data_requests
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- founder_submissions
CREATE POLICY founder_submissions_all_policy ON founder_submissions
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- founder_action_items
CREATE POLICY founder_action_items_all_policy ON founder_action_items
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- mentor_requests
CREATE POLICY mentor_requests_all_policy ON mentor_requests
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- mentor_matches
CREATE POLICY mentor_matches_all_policy ON mentor_matches
  FOR ALL TO authenticated
  USING (can_access_startup(startup_id))
  WITH CHECK (can_access_startup(startup_id));

-- mentor_sessions
CREATE POLICY mentor_sessions_select ON mentor_sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentor_matches m
      WHERE m.id = match_id AND can_access_startup(m.startup_id)
    )
  );

CREATE POLICY mentor_sessions_insert ON mentor_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mentor_matches m
      WHERE m.id = match_id AND can_access_startup(m.startup_id)
    )
  );

CREATE POLICY mentor_sessions_update ON mentor_sessions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mentor_matches m
      WHERE m.id = match_id AND can_access_startup(m.startup_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 7. POLICIES: MENTORS
-- ------------------------------------------------------------------------------

CREATE POLICY mentors_select_policy ON mentors
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY mentors_modify_policy ON mentors
  FOR ALL TO authenticated
  USING (current_role() IN ('ADMIN', 'INVESTMENT_MANAGER'))
  WITH CHECK (current_role() IN ('ADMIN', 'INVESTMENT_MANAGER'));

-- ------------------------------------------------------------------------------
-- 8. POLICIES: ACTIVITY LOGS (Insert & Select Only)
-- ------------------------------------------------------------------------------

CREATE POLICY activity_logs_select ON activity_logs
  FOR SELECT TO authenticated
  USING (can_access_startup(startup_id));

CREATE POLICY activity_logs_insert ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (can_access_startup(startup_id));

-- Revoke update and delete completely for activity_logs
REVOKE UPDATE, DELETE ON activity_logs FROM authenticated;

-- ------------------------------------------------------------------------------
-- 9. POLICIES: NOTIFICATIONS & RECIPIENTS
-- ------------------------------------------------------------------------------

CREATE POLICY notifications_select ON notifications
  FOR SELECT TO authenticated
  USING (
    target_user_id IS NULL
    OR target_user_id = auth.uid()
    OR target_role = current_role()
    OR current_role() = 'ADMIN'
  );

CREATE POLICY notifications_insert ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY notification_recipients_select ON notification_recipients
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY notification_recipients_update ON notification_recipients
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY notification_recipients_insert ON notification_recipients
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. POLICIES: REGULATORY_ITEMS
-- ------------------------------------------------------------------------------

CREATE POLICY regulatory_items_select ON regulatory_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY regulatory_items_admin_modify ON regulatory_items
  FOR ALL TO authenticated
  USING (current_role() = 'ADMIN')
  WITH CHECK (current_role() = 'ADMIN');
