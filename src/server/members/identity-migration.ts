/** Extension additive de l'identité métier SMN, sans compte applicatif. */
export const MEMBER_IDENTITY_MIGRATION="20261022_smn_member_professional_function";
export const MEMBER_IDENTITY_MIGRATION_SQL=`ALTER TABLE public.smn_member
 ADD COLUMN professional_function text,
 ADD CONSTRAINT smn_member_professional_function_valid
 CHECK (professional_function IS NULL OR char_length(professional_function) <= 120);
UPDATE public.smn_installation SET schema_version=27
 WHERE id='singleton' AND schema_version=26;
`;
