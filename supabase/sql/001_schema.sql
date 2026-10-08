-- ==============================================================================
-- 001_schema.sql: Folio OS Core Database Schema
-- Status: Draft / Initial migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. PROFILES (1:1 with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'INVESTMENT_MANAGER', 'INVESTMENT_ASSOCIATE')),
  label text NOT NULL,
  manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT associate_requires_manager CHECK (
    role != 'INVESTMENT_ASSOCIATE' OR manager_id IS NOT NULL
  )
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 2. STARTUPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  one_liner text NOT NULL DEFAULT '',
  sector text NOT NULL,
  stage text NOT NULL,
  cohort text NOT NULL,
  founded_on text NOT NULL,
  website text,
  city text NOT NULL DEFAULT '',
  manager_id uuid NOT NULL REFERENCES profiles(id),
  associate_id uuid REFERENCES profiles(id),
  trl integer NOT NULL DEFAULT 1 CHECK (trl >= 1 AND trl <= 9),
  trl_updated_on text NOT NULL DEFAULT '',
  ip_status text NOT NULL DEFAULT 'NONE',
  ip_ownership_clear boolean NOT NULL DEFAULT true,
  commercial_signal text NOT NULL DEFAULT 'NONE',
  grant_sanctioned numeric(14, 2) NOT NULL DEFAULT 0,
  grant_disbursed numeric(14, 2) NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  reg_tags text[] NOT NULL DEFAULT '{}',
  investibility jsonb,
  ai_analysis jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_startups_manager_id ON startups(manager_id);
CREATE INDEX IF NOT EXISTS idx_startups_associate_id ON startups(associate_id);
CREATE INDEX IF NOT EXISTS idx_startups_archived ON startups(archived);

CREATE TRIGGER trg_startups_updated_at
  BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. STARTUP_FITT_TRACKERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_fitt_trackers (
  startup_id uuid PRIMARY KEY REFERENCES startups(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  checked_on date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER trg_startup_fitt_trackers_updated_at
  BEFORE UPDATE ON startup_fitt_trackers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. FOUNDER_LINKS (Hashed magic tokens)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS founder_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_founder_links_startup ON founder_links(startup_id);
CREATE INDEX IF NOT EXISTS idx_founder_links_token_hash ON founder_links(token_hash);

-- ------------------------------------------------------------------------------
-- 5. TEAM_MEMBERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  is_founder boolean NOT NULL DEFAULT false,
  full_time boolean NOT NULL DEFAULT true,
  equity_pct numeric(5, 2),
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_team_members_startup ON team_members(startup_id);

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. MILESTONES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  target_date text NOT NULL,
  revised_date text,
  delay_reason text,
  status text NOT NULL DEFAULT 'NOT_STARTED' CHECK (
    status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'AT_RISK')
  ),
  percent_complete integer NOT NULL DEFAULT 0 CHECK (
    percent_complete >= 0 AND percent_complete <= 100
  ),
  evidence_note text,
  evidence_link text,
  completed_on text,
  last_updated_by text NOT NULL DEFAULT 'STAFF' CHECK (last_updated_by IN ('STAFF', 'FOUNDER')),
  last_updated_on text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_milestones_startup ON milestones(startup_id);

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. MONTHLY_METRICS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  month text NOT NULL, -- 'YYYY-MM'
  cash_balance numeric(14, 2) NOT NULL DEFAULT 0,
  monthly_burn numeric(14, 2) NOT NULL DEFAULT 0,
  monthly_revenue numeric(14, 2) NOT NULL DEFAULT 0,
  customer_conversations integer NOT NULL DEFAULT 0,
  pilots integer NOT NULL DEFAULT 0,
  lois integer NOT NULL DEFAULT 0,
  paying_customers integer NOT NULL DEFAULT 0,
  team_full_time integer NOT NULL DEFAULT 0,
  team_part_time integer NOT NULL DEFAULT 0,
  key_learnings text,
  source text NOT NULL DEFAULT 'STAFF_EDIT' CHECK (
    source IN ('SEED', 'FOUNDER_SUBMISSION', 'STAFF_EDIT')
  ),
  recorded_on text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_monthly_metrics_startup_month UNIQUE (startup_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_metrics_startup ON monthly_metrics(startup_id);

CREATE TRIGGER trg_monthly_metrics_updated_at
  BEFORE UPDATE ON monthly_metrics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. HEALTH_ASSESSMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS health_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  month text NOT NULL,
  profile text NOT NULL CHECK (profile IN ('PRE_REVENUE', 'ACCELERATION')),
  dimensions jsonb NOT NULL,
  total integer NOT NULL DEFAULT 0,
  band text NOT NULL CHECK (band IN ('HEALTHY', 'WATCH', 'AT_RISK', 'CRITICAL')),
  delta_3m integer,
  strengths text NOT NULL DEFAULT '',
  concerns text NOT NULL DEFAULT '',
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (
    status IN ('DRAFT', 'AWAITING_APPROVAL', 'APPROVED', 'RETURNED')
  ),
  prepared_by uuid NOT NULL REFERENCES profiles(id),
  submitted_on timestamptz,
  approved_by uuid REFERENCES profiles(id),
  approved_on timestamptz,
  return_comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_health_assessments_startup ON health_assessments(startup_id);

CREATE TRIGGER trg_health_assessments_updated_at
  BEFORE UPDATE ON health_assessments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 9. DATA_REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN ('MONTHLY_FINANCIALS', 'MILESTONE_STATUS', 'TRACTION', 'CUSTOM')
  ),
  title text NOT NULL,
  message text,
  custom_questions jsonb,
  milestone_ids uuid[],
  month text,
  due_date text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_on text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (
    status IN ('OPEN', 'SUBMITTED', 'ACCEPTED', 'RETURNED')
  ),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_requests_startup ON data_requests(startup_id);

CREATE TRIGGER trg_data_requests_updated_at
  BEFORE UPDATE ON data_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 10. FOUNDER_SUBMISSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS founder_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES data_requests(id) ON DELETE SET NULL,
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  submitted_on text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (
    status IN ('PENDING_REVIEW', 'ACCEPTED', 'RETURNED')
  ),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_on text,
  review_comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_founder_submissions_startup ON founder_submissions(startup_id);

CREATE TRIGGER trg_founder_submissions_updated_at
  BEFORE UPDATE ON founder_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 11. MENTORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  phone text,
  linkedin text,
  sectors text[] NOT NULL DEFAULT '{}',
  expertise text[] NOT NULL DEFAULT '{}',
  stages text[] NOT NULL DEFAULT '{}',
  geography text NOT NULL DEFAULT 'PAN_INDIA',
  availability text NOT NULL DEFAULT 'MEDIUM',
  max_active_matches integer NOT NULL DEFAULT 3,
  bio text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER trg_mentors_updated_at
  BEFORE UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 12. MENTOR_REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  challenge text NOT NULL,
  expertise_needed text[] NOT NULL DEFAULT '{}',
  raised_by text NOT NULL DEFAULT 'STAFF' CHECK (raised_by IN ('STAFF', 'FOUNDER')),
  created_on text NOT NULL,
  ranked jsonb,
  recommended_mentor_id uuid REFERENCES mentors(id),
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'MATCHED', 'DECLINED')
  ),
  mentor_id uuid REFERENCES mentors(id),
  note text,
  fitt_task_n integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_requests_startup ON mentor_requests(startup_id);

CREATE TRIGGER trg_mentor_requests_updated_at
  BEFORE UPDATE ON mentor_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 13. MENTOR_MATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES mentor_requests(id) ON DELETE SET NULL,
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  confirmed_by uuid NOT NULL REFERENCES profiles(id),
  confirmed_on text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_matches_startup ON mentor_matches(startup_id);

CREATE TRIGGER trg_mentor_matches_updated_at
  BEFORE UPDATE ON mentor_matches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 14. MENTOR_SESSIONS (Normalized out of matches)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES mentor_matches(id) ON DELETE CASCADE,
  date text NOT NULL,
  topic text NOT NULL,
  next_step text NOT NULL DEFAULT '',
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mentor_sessions_match ON mentor_sessions(match_id);

CREATE TRIGGER trg_mentor_sessions_updated_at
  BEFORE UPDATE ON mentor_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 15. FOUNDER_ACTION_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS founder_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  title text NOT NULL,
  cause text NOT NULL,
  effect text NOT NULL,
  fix text NOT NULL,
  note text,
  shared_by uuid NOT NULL REFERENCES profiles(id),
  shared_on text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_founder_action_items_startup ON founder_action_items(startup_id);

CREATE TRIGGER trg_founder_action_items_updated_at
  BEFORE UPDATE ON founder_action_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------------------------
-- 16. ACTIVITY_LOGS (Append-only)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  at timestamptz DEFAULT now() NOT NULL,
  actor text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_startup ON activity_logs(startup_id);

-- ------------------------------------------------------------------------------
-- 17. NOTIFICATIONS & NOTIFICATION_RECIPIENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (
    type IN ('MENTOR_REQUEST', 'MENTOR_MATCH', 'MENTOR_RESPONSE', 'STARTUP_UPDATE', 'RED_FLAG', 'DATA_REQUEST')
  ),
  startup_id uuid REFERENCES startups(id) ON DELETE CASCADE,
  startup_name text,
  target_role text CHECK (target_role IN ('ADMIN', 'INVESTMENT_MANAGER', 'INVESTMENT_ASSOCIATE')),
  target_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_notification_recipient UNIQUE (notification_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_recipient ON notification_recipients(recipient_id);

-- ------------------------------------------------------------------------------
-- 18. REGULATORY_ITEMS (Reference data)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regulatory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authority text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('RISK', 'OPPORTUNITY')),
  status text NOT NULL CHECK (status IN ('CONSULTATION', 'NOTIFIED', 'EFFECTIVE')),
  published_on text NOT NULL,
  consultation_closes_on text,
  effective_on text,
  summary text NOT NULL,
  sectors text[] NOT NULL DEFAULT '{}',
  direct_tags text[] NOT NULL DEFAULT '{}',
  indirect_tags text[] NOT NULL DEFAULT '{}',
  what_to_check text[] NOT NULL DEFAULT '{}',
  is_sample boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER trg_regulatory_items_updated_at
  BEFORE UPDATE ON regulatory_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
