-- Historique IA : migration explicite, sans suppression de tables ou lignes.
-- archive
CREATE TABLE IF NOT EXISTS public.smn_ai_brief_archive(
 id uuid PRIMARY KEY,mode text NOT NULL CHECK(mode IN ('scrum','kanban')),
 cycle_id text NOT NULL,team_id text NOT NULL,template_id text NOT NULL,
 template_revision integer NOT NULL,author_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),sha256 text NOT NULL,
 byte_length integer NOT NULL CHECK(byte_length>0),content bytea NOT NULL,
 reviewed boolean NOT NULL CHECK(reviewed=true),
 CHECK(octet_length(content)=byte_length)
 );

-- archive
ALTER TABLE public.smn_ai_brief_archive ADD COLUMN IF NOT EXISTS parent_archive_id uuid;

-- archive
CREATE OR REPLACE FUNCTION public.smn_ai_brief_archive_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 RAISE EXCEPTION 'finalized AI brief archives are immutable';
 END $$;

-- archive
DROP TRIGGER IF EXISTS smn_ai_brief_immutable ON public.smn_ai_brief_archive;

-- archive
CREATE TRIGGER smn_ai_brief_immutable BEFORE UPDATE OR DELETE
 ON public.smn_ai_brief_archive FOR EACH ROW EXECUTE FUNCTION public.smn_ai_brief_archive_immutable();

-- duplicates
CREATE TABLE IF NOT EXISTS public.smn_ai_brief_draft(
 id uuid PRIMARY KEY,parent_archive_id uuid NOT NULL,
 team_id text NOT NULL,mode text NOT NULL,cycle_id text NOT NULL,
 template_id text NOT NULL,template_revision integer NOT NULL,
 content text NOT NULL,revision integer NOT NULL DEFAULT 1,
 created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),finalized_archive_id uuid
 );

-- templates
CREATE TABLE IF NOT EXISTS public.smn_ai_brief_template(
 id uuid PRIMARY KEY,title text NOT NULL,description text NOT NULL DEFAULT '',
 sections jsonb NOT NULL,questions jsonb NOT NULL,instructions jsonb NOT NULL,data jsonb NOT NULL,
 depth integer NOT NULL CHECK(depth BETWEEN 1 AND 5),revision integer NOT NULL DEFAULT 1,
 active boolean NOT NULL DEFAULT true,created_by text,created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now());

-- responses
CREATE TABLE IF NOT EXISTS public.smn_ai_brief_response(
 id uuid PRIMARY KEY,archive_id uuid NOT NULL REFERENCES public.smn_ai_brief_archive(id) ON DELETE RESTRICT,
 team_id text NOT NULL,author_id text NOT NULL,response_text text NOT NULL,
 provider text,model text,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(length(btrim(response_text))>0));

-- responses
ALTER TABLE public.smn_ai_brief_response ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- responses
ALTER TABLE public.smn_ai_brief_response ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- responses
ALTER TABLE public.smn_ai_brief_response ADD COLUMN IF NOT EXISTS human_edited boolean NOT NULL DEFAULT false;

-- Alignement des réponses historiques avant l'unicité partielle.
-- Préserve toutes les lignes ; seules les réponses surnuméraires deviennent inactives.
WITH ranked AS (
 SELECT id,row_number() OVER(PARTITION BY archive_id ORDER BY created_at DESC,id DESC) AS rn
 FROM public.smn_ai_brief_response WHERE deleted_at IS NULL
)
UPDATE public.smn_ai_brief_response r SET deleted_at=now()
FROM ranked WHERE r.id=ranked.id AND ranked.rn>1;
CREATE UNIQUE INDEX IF NOT EXISTS smn_ai_brief_one_active_response
 ON public.smn_ai_brief_response(archive_id) WHERE deleted_at IS NULL;
