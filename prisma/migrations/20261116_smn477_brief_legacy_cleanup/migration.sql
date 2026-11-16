-- Cleanup is transactional and must run only after a verified, restorable backup.
-- Never use CASCADE: an unknown dependency must stop the migration.
DO $smn$
DECLARE pending bigint;
BEGIN
 IF to_regclass('public.smn_ai_brief_template') IS NULL THEN
  RAISE EXCEPTION 'smn-477: model table missing';
 END IF;
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='smn_ai_brief_template' AND column_name='prompt_text'
 ) THEN
  RAISE EXCEPTION 'smn-477: prompt_text absent; backfill migration required';
 END IF;
 SELECT count(*) INTO pending FROM public.smn_ai_brief_template
 WHERE prompt_text IS NULL OR btrim(prompt_text)='' OR length(prompt_text)>100000;
 IF pending>0 THEN
  RAISE EXCEPTION 'smn-477: % template(s) not converted or invalid',pending;
 END IF;
END $smn$;
ALTER TABLE public.smn_ai_brief_template
 ALTER COLUMN prompt_text SET NOT NULL;
DO $smn$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conrelid='public.smn_ai_brief_template'::regclass
  AND conname='smn_ai_brief_template_prompt_text_valid'
 ) THEN
  ALTER TABLE public.smn_ai_brief_template
   ADD CONSTRAINT smn_ai_brief_template_prompt_text_valid
   CHECK (length(btrim(prompt_text))>0 AND length(prompt_text)<=100000);
 END IF;
END $smn$;
ALTER TABLE public.smn_ai_brief_template
 DROP COLUMN IF EXISTS sections,
 DROP COLUMN IF EXISTS questions,
 DROP COLUMN IF EXISTS instructions,
 DROP COLUMN IF EXISTS data,
 DROP COLUMN IF EXISTS depth;
-- PostgreSQL removes indexes and constraints depending exclusively on dropped
-- columns. Any other dependency errors out (no CASCADE), rolling back the transaction.
