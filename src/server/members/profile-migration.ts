/** Champs uniquement sur l'identité métier ; aucune relation avec le compte applicatif. */
export const MEMBER_PROFILE_MIGRATION="20261021_smn43_member_profile";
export const MEMBER_PROFILE_MIGRATION_SQL=`ALTER TABLE public.smn_member
 ADD COLUMN email text,
 ADD COLUMN revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
 ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now(),
 ADD CONSTRAINT smn_member_email_length CHECK (
  email IS NULL OR (char_length(email) <= 254 AND position('@' in email) > 1)
 );
UPDATE public.smn_installation SET schema_version=10
 WHERE id='singleton' AND schema_version=9;
`;
