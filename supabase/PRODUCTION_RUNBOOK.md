# Folio OS: Supabase Production Deployment Runbook (Phase 6)

**Audience:** Incubator Engineering Leads & Database Administrators  
**Last Updated:** 2026-10-08  
**Target Environment:** Production (`folio-os-prod` at IIT Delhi FITT)

---

## 1. Project Creation & Region Specification

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** in your organization.
3. Configure the project settings:
   - **Name:** `folio-os-prod` (or `fitt-folio-production`)
   - **Database Password:** Generate a strong 32+ character random secret and store it in your team's password manager (e.g. 1Password / Bitwarden).
   - **Region:** **`ap-south-1` (Mumbai, India)** — *Mandatory for IIT Delhi FITT data residency and lowest latency (Decision D1).*
   - **Pricing Plan:** Pro tier or Enterprise (ensures automated daily backups, PITR, and production SLA).
4. Save the Project URL (`https://<project-ref>.supabase.co`), `anon` public key, and `service_role` secret key.

---

## 2. Apply Database Migrations (In Order)

All SQL migrations live in `supabase/sql/`. Do not perform ad-hoc changes in the dashboard table editor.

Open the **SQL Editor** in the Supabase Dashboard and run each file in strict sequential order:

1. **`supabase/sql/001_schema.sql`**
   - Creates extensions (`uuid-ossp`, `pgcrypto`).
   - Provisions all 19 core tables (`profiles`, `startups`, `startup_fitt_trackers`, `founder_links`, `milestones`, `monthly_metrics`, `health_assessments`, etc.).
   - Sets constraints, checks (e.g., TRL 1–9, associate must have manager), indexes, and `updated_at` triggers.

2. **`supabase/sql/002_rls.sql`**
   - Provisions `get_current_role()` and `can_access_startup()` security definer functions.
   - Provisions atomic stored procedures: `update_assignment()` and `approve_assessment()`.
   - Enables Row-Level Security (RLS) on all 19 tables.
   - Enforces strict startup-scoped access policies for Admins, Portfolio Heads, and Portfolio Managers.

3. **`supabase/sql/003_storage_and_realtime.sql`**
   - Enables `REPLICA IDENTITY FULL` and adds `notifications` + `notification_recipients` to `supabase_realtime` publication.
   - Configures storage RLS policies for private bucket `portfolio-files`.
   - Adds Excel audit tracking columns.

4. **Record the execution in `supabase/sql/APPLIED.md`**:
   - Add entries with date, author, project ID, and notes.

---

## 3. Storage Bucket Configuration

1. In the Supabase Dashboard, navigate to **Storage**.
2. Click **New Bucket**:
   - **Bucket name:** `portfolio-files`
   - **Public bucket:** **OFF** (Keep private — all files are protected by RLS policies in `003_storage_and_realtime.sql`).
   - **File size limit:** `50 MB`
   - **Allowed MIME types:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, application/pdf, image/png, image/jpeg`
3. Click **Save**.

---

## 4. Authentication & Security Hardening

1. **Disable Public Sign-ups (Invite-Only Policy):**
   - Navigate to **Authentication > Configuration > Sign In / Up**.
   - Under **General**, toggle **"Allow new users to sign up"** to **OFF / DISABLED**.
   - *Result:* Only users invited by an Administrator or created through backend server actions can join.

2. **Configure Site URL & Redirect URLs:**
   - Navigate to **Authentication > URL Configuration**.
   - **Site URL:** Set to canonical production URL (e.g. `https://folio.fitt-iitd.in`).
   - **Redirect URLs:**
     - `https://folio.fitt-iitd.in/**`
     - `https://folio.fitt-iitd.in/login`

3. **Email Templates & Custom SMTP:**
   - Navigate to **Authentication > Email Templates**.
   - Customize the **Invite User** and **Magic Link** templates with IIT Delhi FITT branding.
   - In production, configure **Custom SMTP** (e.g. Amazon SES, SendGrid, or IIT Delhi Postfix gateway) instead of Supabase built-in mailer to prevent deliverability rate limits.

---

## 5. Staff Provisioning (Day-0 Cold Start)

> ⚠️ **CRITICAL WARNING:** **DO NOT RUN `scripts/seed-supabase.ts`!**  
> Running the seed script will pollute production with mock startups, fake metrics, and demo passwords.

### Step 5a: Provision Primary Administrator

From your deployment machine with production credentials configured in `.env.local`:

```bash
npx tsx scripts/provision-staff.ts \
  --admin-email admin@fitt-iitd.in \
  --admin-name "Director, FITT IIT Delhi" \
  --admin-password "<SecureInitialPassword2026!>"
```

*Or to dispatch an email invitation link:*
```bash
npx tsx scripts/provision-staff.ts \
  --admin-email admin@fitt-iitd.in \
  --admin-name "Director, FITT IIT Delhi" \
  --invite-only
```

### Step 5b: Onboard Portfolio Heads & Managers

Once the primary Administrator logs in at `https://folio.fitt-iitd.in/login`:
1. Navigate to **Governance & Users** (`/admin/users`).
2. Click **"Invite Team Member"**.
3. Select the role (**Portfolio Head** or **Portfolio Manager**) and specify their reporting supervisor.
4. An official Supabase Auth invitation email is immediately dispatched to the staff member.

---

## 6. Automated Schema & Health Verification

Run the automated verification suite to confirm that 100% of tables, RPCs, storage buckets, and RLS policies are operational:

```bash
npx tsx scripts/verify-supabase.ts
```

Expected output:
```
===========================================================================
VERIFICATION SUMMARY: 25/25 checks passed
===========================================================================
🎉 EXCELLENT: All schema, tables, RPCs, and storage resources are fully verified!
The Supabase project is 100% ready for Phase 6 production workloads.
===========================================================================
```

---

## 7. Point Production Deployment to New Project

Update your hosting provider (e.g. Vercel, AWS ECS, or Docker):

| Variable | Production Value | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<prod-ref>.supabase.co` | Production project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | Public anon key (browser safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | **Secret** admin key (server-only) |
| `NEXT_PUBLIC_DEMO_MODE` | **`false`** | **Disables demo credentials & persona switchers** |
| `NEXT_PUBLIC_SITE_URL` | `https://folio.fitt-iitd.in` | Canonical domain |

*The previous project (`pgznqlqfywnqtohvpeti`) remains active as the dedicated Staging / Dev / Demo environment with `NEXT_PUBLIC_DEMO_MODE=true`.*

---

## 8. Backup Strategy & Disaster Recovery

1. **Automated Daily Backups:**
   - Included automatically with Supabase Pro tier (stored encrypted across multiple Availability Zones).
2. **Point-In-Time Recovery (PITR):**
   - Enable PITR in **Database > Backups > Point in time**.
   - Provides continuous Write-Ahead Log (WAL) archiving allowing rollback to any single second in the past 7–30 days.
3. **Manual Snapshot Export (Recommended before major institutional releases):**
   ```bash
   pg_dump -h db.<prod-ref>.supabase.co -U postgres -d postgres -F c -b -v -f fitt_folio_backup_$(date +%Y%m%d).dump
   ```
4. **Disaster Recovery RTO & RPO:**
   - **RPO (Recovery Point Objective):** < 1 minute via PITR.
   - **RTO (Recovery Time Objective):** < 30 minutes to spin up a replacement project and replay `001_schema.sql` through `003_storage_and_realtime.sql` + restore database dump.
