/** Localisation centrale historisée ; les changements ne modifient ni la langue ni le calendrier. */
export const MEMBER_LOCATION_MIGRATION="20261021_smn47_member_location";
export const MEMBER_LOCATION_MIGRATION_SQL=`CREATE TABLE public.smn_member_location (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision > 0),
 effective_from date NOT NULL,
 country_iso2 text CHECK (country_iso2 IS NULL OR country_iso2 ~ '^[A-Z]{2}$'),
 region text CHECK (region IS NULL OR char_length(region) <= 120),
 city text CHECK (city IS NULL OR char_length(city) <= 120),
 time_zone text CHECK (time_zone IS NULL OR char_length(time_zone) <= 128),
 source text NOT NULL CHECK (source IN ('installation-default','manual')),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(member_id,revision)
);
CREATE INDEX smn_member_location_effective_idx
 ON public.smn_member_location(member_id,effective_from DESC,revision DESC);
UPDATE public.smn_installation SET schema_version=14
 WHERE id='singleton' AND schema_version=13;
`;
