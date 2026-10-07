# Applied Supabase Migrations

This document tracks all SQL migrations applied to the Supabase database.
Every change to schema, RLS policies, triggers, or RPC functions must be committed as a numbered file in `supabase/sql/` and recorded here once executed.

| File | Date Applied | Applied By | Environment / Project | Notes |
|---|---|---|---|---|
| `001_schema.sql` | 2026-10-07 | Saransh | Dev (`pgznqlqfywnqtohvpeti`) | Initial tables, constraints, enums, indexes, triggers |
| `002_rls.sql` | 2026-10-07 | Saransh | Dev (`pgznqlqfywnqtohvpeti`) | RLS policies, helper functions (`get_current_role`, `can_access_startup`), and RPCs (`update_assignment`, `approve_assessment`) |
| `003_storage_and_realtime.sql` | 2026-10-07 | Saransh | Dev (`pgznqlqfywnqtohvpeti`) | Phase 5: Storage RLS on `portfolio-files`, Realtime publication on notifications, audit columns |
