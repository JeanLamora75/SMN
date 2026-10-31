-- Add the approved Red & Purple palette without changing existing settings.
-- Apply with the project's controlled migration procedure after reviewing v32 baseline state.
BEGIN;
ALTER TABLE public.smn_general_settings
  DROP CONSTRAINT IF EXISTS smn_general_settings_palette_check;
ALTER TABLE public.smn_general_settings
  ADD CONSTRAINT smn_general_settings_palette_check
  CHECK (palette IN ('ocean','forest','violet','red-purple'));
COMMIT;
