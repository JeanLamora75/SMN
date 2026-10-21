export const HOLIDAYS_MIGRATION = "20261021_smn49_national_calendars";
export const HOLIDAYS_MIGRATION_SQL = `CREATE TABLE public.smn_national_holiday (
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 holiday_date date NOT NULL,
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
 PRIMARY KEY(country_code,holiday_date)
);
CREATE TABLE public.smn_national_calendar_coverage (
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 calendar_year integer NOT NULL CHECK (calendar_year BETWEEN 1900 AND 2200),
 status text NOT NULL CHECK (status IN ('configured','not-configured','invalid')),
 entries_count integer NOT NULL DEFAULT 0 CHECK(entries_count >= 0),
 diagnostic text,
 source_file text,
 checked_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(country_code,calendar_year)
);
UPDATE public.smn_installation SET schema_version=16
 WHERE id='singleton' AND schema_version=15;
`;
