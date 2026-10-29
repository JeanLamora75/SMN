-- Création additive des KPI de capacité Sprint; pas de DDL lors des écritures métier.
CREATE TABLE IF NOT EXISTS public.smn_sprint_capacity_kpi (
 sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 planned_jh numeric(13,4) CHECK(planned_jh BETWEEN 0 AND 99999999.9999),
 actual_jh numeric(13,4) CHECK(actual_jh BETWEEN 0 AND 99999999.9999),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.smn_sprint_capacity_kpi_audit (
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 before_values jsonb,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
