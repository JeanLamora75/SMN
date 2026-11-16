-- SMN-472. Additive migration: no archived TXT or template revision is modified.
-- Backfill is performed by scripts/apply-smn-472-prompt-text.ts, after verified backup.
DO $$
BEGIN
 IF to_regclass('public.smn_ai_brief_template') IS NULL THEN
  RAISE EXCEPTION 'SMN-472: base non initialisée (smn_ai_brief_template absente)';
 END IF;
END $$;
ALTER TABLE public.smn_ai_brief_template ADD COLUMN IF NOT EXISTS prompt_text TEXT;
-- Do not drop legacy sections/questions/instructions/data/depth until SMN-477
-- confirms the data and backup/restore compatibility.
