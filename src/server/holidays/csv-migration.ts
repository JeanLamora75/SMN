export const HOLIDAY_CSV_MIGRATION="20261021_smn50_national_holidays_csv";
export const HOLIDAY_CSV_MIGRATION_SQL=`ALTER TABLE public.smn_national_calendar_coverage
 DROP CONSTRAINT smn_national_calendar_coverage_status_check;
ALTER TABLE public.smn_national_calendar_coverage
 ADD CONSTRAINT smn_national_calendar_coverage_status_check
 CHECK (status IN ('configured','partial','not-configured','invalid'));
CREATE TABLE public.smn_national_holiday_audit (
 id text PRIMARY KEY,
 country_code text NOT NULL REFERENCES public.smn_country(code) ON DELETE RESTRICT,
 holiday_date date NOT NULL,
 previous_name text,
 new_name text NOT NULL CHECK (char_length(btrim(new_name)) BETWEEN 1 AND 120),
 action text NOT NULL CHECK(action IN ('create','replace')),
 origin text NOT NULL CHECK(origin='csv'),
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smn_national_holiday_audit_date_idx
 ON public.smn_national_holiday_audit(country_code,holiday_date,occurred_at);
UPDATE public.smn_installation SET schema_version=17
 WHERE id='singleton' AND schema_version=16;
`;
