-- Additive schema step only. Data conversion is performed by the guarded
-- migration runner after a verified backup, without deleting legacy content.
-- Fresh installations may have zero custom brief templates.
DO $$
BEGIN
  IF to_regclass('public.smn_ai_brief_template') IS NOT NULL THEN
    ALTER TABLE public.smn_ai_brief_template
      ADD COLUMN IF NOT EXISTS prompt_text text;
  END IF;
END
$$;
