ALTER TABLE public.smn_national_holiday_audit
 DROP CONSTRAINT smn_national_holiday_audit_origin_check;
ALTER TABLE public.smn_national_holiday_audit
 ADD CONSTRAINT smn_national_holiday_audit_origin_check CHECK(origin IN ('csv','ics'));
UPDATE public.smn_installation SET schema_version=18
 WHERE id='singleton' AND schema_version=17;
