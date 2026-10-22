/** Extension additive de l'identité métier SMN, sans compte applicatif. */
export const MEMBER_IDENTITY_MIGRATION="20261022_smn_member_professional_function";
export const MEMBER_IDENTITY_MIGRATION_SQL=`ALTER TABLE public.smn_member
 ADD COLUMN professional_function text,
 ADD CONSTRAINT smn_member_professional_function_valid
 CHECK (professional_function IS NULL OR char_length(professional_function) <= 120);
CREATE TABLE public.smn_member_identity_history (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 previous_values jsonb NOT NULL,
 next_values jsonb NOT NULL,
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smn_member_identity_history_member_idx
 ON public.smn_member_identity_history(member_id,changed_at DESC);
UPDATE public.smn_installation SET schema_version=27
 WHERE id='singleton' AND schema_version=26;
`;
