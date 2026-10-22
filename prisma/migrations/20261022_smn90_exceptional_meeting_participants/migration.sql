CREATE TABLE IF NOT EXISTS public.smn_exceptional_meeting_participant (
 meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(meeting_id,member_id)
);
CREATE TABLE IF NOT EXISTS public.smn_exceptional_meeting_participant_audit (
 id text PRIMARY KEY,
 meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,
 before_member_ids jsonb NOT NULL,
 after_member_ids jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
