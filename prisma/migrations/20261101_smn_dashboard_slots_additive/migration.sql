-- SMN dashboard B01 additive table; does not touch schema_version or historic snapshots.
CREATE TABLE IF NOT EXISTS public.smn_indicator_dashboard_slot (
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE CASCADE,
 block_key text NOT NULL CHECK (block_key IN ('story_points','tickets','complementary')),
 slot_index integer NOT NULL,
 indicator_id text NOT NULL REFERENCES public.smn_indicator_definition(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(team_id,block_key,slot_index),
 UNIQUE(team_id,indicator_id),
 CONSTRAINT smn_dashboard_slot_range CHECK (
 (block_key='story_points' AND slot_index BETWEEN 1 AND 4)
 OR (block_key IN ('tickets','complementary') AND slot_index BETWEEN 1 AND 2))
);
