-- Dashboard: migration additive non destructive, à exécuter avant le déploiement du code métier.
CREATE TABLE IF NOT EXISTS public.smn_dashboard_note(
    id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id),
    team_id text NOT NULL REFERENCES public.smn_team(id),
    body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 2000),
    status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','done')),
    created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.smn_dashboard_note_audit(
    id text PRIMARY KEY,note_id text NOT NULL REFERENCES public.smn_dashboard_note(id),
    action text NOT NULL CHECK(action IN ('created','done')),
    actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL);

CREATE TABLE IF NOT EXISTS public.smn_dashboard_note_edit_audit(
    id text PRIMARY KEY,note_id text NOT NULL REFERENCES public.smn_dashboard_note(id),
    before_values jsonb NOT NULL,after_values jsonb NOT NULL,
    actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.smn_dashboard_event_edit_audit(
    id text PRIMARY KEY,event_kind text NOT NULL,event_id text NOT NULL,
    before_values jsonb NOT NULL,after_values jsonb NOT NULL,
    actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
    changed_at timestamptz NOT NULL DEFAULT now());
