-- SMN-338: DDL ajout uniquement. NON ACTIVÉ, NE PAS APPLIQUER EN PRODUCTION.
-- Préparer intégration au registre versions seulement après validation de l'audit local.
CREATE TABLE public.smn_indicator_definition (
 id text PRIMARY KEY,
 tag text NOT NULL UNIQUE CHECK (tag ~ '^[A-Z][A-Z0-9_]*$'),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
 description text NOT NULL DEFAULT '',
 unit_name text NOT NULL DEFAULT '',
 unit_short text NOT NULL DEFAULT '',
 color text,
 icon text,
 indicator_type text NOT NULL CHECK (indicator_type IN ('manual','computed')),
 formula text,
 formula_revision bigint NOT NULL DEFAULT 0 CHECK (formula_revision>=0),
 type_locked boolean NOT NULL DEFAULT false,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((indicator_type='manual' AND formula IS NULL) OR
        (indicator_type='computed' AND formula IS NOT NULL AND length(btrim(formula))>0)),
 CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);
CREATE TABLE public.smn_indicator_team_selection (
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 indicator_id text NOT NULL REFERENCES public.smn_indicator_definition(id) ON DELETE RESTRICT,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (team_id,indicator_id)
);
CREATE INDEX smn_ind_selection_indicator_idx ON public.smn_indicator_team_selection(indicator_id);
CREATE TABLE public.smn_indicator_display_preference (
 team_id text NOT NULL,
 indicator_id text NOT NULL,
 screen_key text NOT NULL CHECK (screen_key IN ('dashboard','cycle_list','cycle_detail','trends','reports')),
 is_visible boolean NOT NULL DEFAULT true,
 display_order integer NOT NULL DEFAULT 0,
 display_style text NOT NULL DEFAULT 'number' CHECK (display_style IN ('number','card','gauge','line','bar')),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (team_id,indicator_id,screen_key),
 FOREIGN KEY (team_id,indicator_id) REFERENCES public.smn_indicator_team_selection(team_id,indicator_id) ON DELETE RESTRICT
);
CREATE INDEX smn_ind_display_screen_order_idx ON public.smn_indicator_display_preference(team_id,screen_key,display_order);
CREATE TABLE public.smn_indicator_manual_value (
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 cycle_type text NOT NULL CHECK (cycle_type IN ('scrum','kanban')),
 cycle_id text NOT NULL,
 indicator_id text NOT NULL REFERENCES public.smn_indicator_definition(id) ON DELETE RESTRICT,
 value numeric,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 PRIMARY KEY (team_id,cycle_type,cycle_id,indicator_id)
);
CREATE INDEX smn_ind_manual_indicator_idx ON public.smn_indicator_manual_value(indicator_id,team_id);
CREATE TABLE public.smn_indicator_computed_result (
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 cycle_type text NOT NULL CHECK (cycle_type IN ('scrum','kanban')),
 cycle_id text NOT NULL,
 indicator_id text NOT NULL REFERENCES public.smn_indicator_definition(id) ON DELETE RESTRICT,
 result_state text NOT NULL CHECK (result_state IN ('available','unavailable')),
 value numeric,
 unavailable_reason text CHECK (unavailable_reason IN ('missing_source','division_by_zero','dependency_unavailable','invalid_domain')),
 unavailable_detail text,
 unavailable_source_tag text,
 formula_revision bigint NOT NULL CHECK (formula_revision>=0),
 calculated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (team_id,cycle_type,cycle_id,indicator_id),
 CHECK ((result_state='available' AND value IS NOT NULL AND unavailable_reason IS NULL AND unavailable_detail IS NULL AND unavailable_source_tag IS NULL)
 OR (result_state='unavailable' AND value IS NULL AND unavailable_reason IS NOT NULL)),
 CHECK (unavailable_reason IS NOT NULL AND unavailable_reason='dependency_unavailable' OR unavailable_source_tag IS NULL)
);
CREATE INDEX smn_ind_computed_indicator_idx ON public.smn_indicator_computed_result(indicator_id,team_id);
CREATE TABLE public.smn_indicator_dependency (
 id text PRIMARY KEY,
 indicator_id text NOT NULL REFERENCES public.smn_indicator_definition(id) ON DELETE RESTRICT,
 source_type text NOT NULL CHECK (source_type IN ('indicator','calendar')),
 source_indicator_id text REFERENCES public.smn_indicator_definition(id) ON DELETE RESTRICT,
 source_calendar_tag text,
 CHECK ((source_type='indicator' AND source_indicator_id IS NOT NULL AND source_calendar_tag IS NULL)
 OR (source_type='calendar' AND source_indicator_id IS NULL AND source_calendar_tag IS NOT NULL AND source_calendar_tag ~ '^[A-Z][A-Z0-9_]*$')),
 CHECK (source_indicator_id IS NULL OR source_indicator_id <> indicator_id)
);
-- PostgreSQL UNIQUE NULL semantics: partial unique indexes are needed for each exclusive source kind.
CREATE UNIQUE INDEX smn_ind_dep_indicator_unique ON public.smn_indicator_dependency(indicator_id,source_indicator_id) WHERE source_type='indicator';
CREATE UNIQUE INDEX smn_ind_dep_calendar_unique ON public.smn_indicator_dependency(indicator_id,source_calendar_tag) WHERE source_type='calendar';
CREATE INDEX smn_ind_dep_reverse_idx ON public.smn_indicator_dependency(source_indicator_id) WHERE source_type='indicator';
CREATE INDEX smn_ind_dep_calendar_reverse_idx ON public.smn_indicator_dependency(source_calendar_tag) WHERE source_type='calendar';
CREATE TABLE public.smn_indicator_cycle_revision (
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 cycle_type text NOT NULL CHECK (cycle_type IN ('scrum','kanban')),
 cycle_id text NOT NULL,
 revision bigint NOT NULL DEFAULT 0 CHECK (revision>=0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (team_id,cycle_type,cycle_id)
);
CREATE TABLE public.smn_indicator_system_revision (
 singleton_key text PRIMARY KEY CHECK (singleton_key='singleton'),
 revision bigint NOT NULL DEFAULT 0 CHECK (revision>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.smn_indicator_system_revision(singleton_key) VALUES ('singleton');
-- A AJOUTER AU CONTRAT : validation applicative de cycle_id/team_id et de type manuel/computed,
-- cycle DAG, regexp tags réservés, lock global des producteurs et vérification physique DB.
