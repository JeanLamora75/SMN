-- Controlled, data-preserving extension of the v32 palette allowlist.
-- Precondition: smn_general_settings_palette_check is the v32 allowlist or already upgraded.
-- Apply through an approved, tracked maintenance migration; never run from request handlers.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE
  existing_def text;
  actual_attnum smallint;
BEGIN
  SELECT attnum INTO actual_attnum
  FROM pg_attribute WHERE attrelid='public.smn_general_settings'::regclass
    AND attname='palette' AND NOT attisdropped;
  IF actual_attnum IS NULL THEN
    RAISE EXCEPTION 'palette column absent; migration aborted';
  END IF;

  SELECT pg_get_constraintdef(c.oid) INTO existing_def
  FROM pg_constraint c
  WHERE c.conrelid='public.smn_general_settings'::regclass
    AND c.conname='smn_general_settings_palette_check'
    AND c.contype='c'
    AND c.conkey=ARRAY[actual_attnum];

  IF existing_def IS NULL THEN
    RAISE EXCEPTION 'expected palette constraint absent or incompatible; migration aborted';
  END IF;
  IF existing_def NOT LIKE '%red-purple%' THEN
    IF existing_def NOT LIKE '%ocean%'
       OR existing_def NOT LIKE '%forest%'
       OR existing_def NOT LIKE '%violet%' THEN
      RAISE EXCEPTION 'unexpected palette constraint: %',existing_def;
    END IF;
    ALTER TABLE public.smn_general_settings
      DROP CONSTRAINT smn_general_settings_palette_check;
    ALTER TABLE public.smn_general_settings
      ADD CONSTRAINT smn_general_settings_palette_check
      CHECK (palette IN ('ocean','forest','violet','red-purple'));
  END IF;
END $$;
COMMIT;
