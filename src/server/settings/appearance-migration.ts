/** Migration additive I0 v6 : préserve toutes les données et préférences existantes. */
export const APPEARANCE_MIGRATION="20261021_smn24_appearance_palette";
export const APPEARANCE_MIGRATION_SQL=`ALTER TABLE public.smn_general_settings
  ADD COLUMN palette text NOT NULL DEFAULT 'ocean'
  CHECK (palette IN ('ocean','forest','violet'));
UPDATE public.smn_installation SET schema_version=6
WHERE id='singleton' AND schema_version=5;
`;
