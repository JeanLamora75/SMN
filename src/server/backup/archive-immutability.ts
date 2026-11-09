/**
 * SMN-35 — additive guards for archive tables not protected by v33 baseline.
 * The canonical v33 baseline must not be edited after its SHA256 is recorded.
 * Deploy this SQL explicitly on a qualified installation.
 */
export const SMN35_ARCHIVE_IMMUTABILITY_SQL=`
CREATE OR REPLACE FUNCTION public.smn35_reject_archive_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'smn35-immutable-archive-%', TG_TABLE_NAME
   USING ERRCODE='P0001';
END;
$$;

DO $smn35$
DECLARE tbl text;
BEGIN
 FOREACH tbl IN ARRAY ARRAY[
   'smn_sprint_closure_snapshot',
   'smn_report_pdf_archive'
 ] LOOP
  IF to_regclass('public.' || tbl) IS NULL THEN
   RAISE EXCEPTION 'smn35-archive-table-missing-%',tbl;
  END IF;
  IF NOT EXISTS(
   SELECT 1 FROM pg_catalog.pg_trigger tr
   JOIN pg_catalog.pg_class rel ON rel.oid=tr.tgrelid
   JOIN pg_catalog.pg_namespace ns ON ns.oid=rel.relnamespace
   WHERE ns.nspname='public' AND rel.relname=tbl
    AND tr.tgname='smn35_archive_write_guard'
    AND tr.tgenabled<>'D'
  ) THEN
   EXECUTE format('CREATE TRIGGER smn35_archive_write_guard
    BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW
    EXECUTE FUNCTION public.smn35_reject_archive_mutation()',tbl);
  END IF;
 END LOOP;
END
$smn35$;
`;

/** Read-only qualification of the two required triggers. */
export const SMN35_ARCHIVE_GUARD_CHECK_SQL=`
SELECT rel.relname AS table_name,
 EXISTS(
  SELECT 1 FROM pg_catalog.pg_trigger tr
  WHERE tr.tgrelid=rel.oid AND tr.tgname='smn35_archive_write_guard'
   AND tr.tgenabled IN ('O','A') AND NOT tr.tgisinternal
   AND tr.tgfoid='public.smn35_reject_archive_mutation()'::regprocedure
   AND (tr.tgtype & 2)=2 AND (tr.tgtype & 1)=1
   AND (tr.tgtype & 8)=8 AND (tr.tgtype & 16)=16
 ) AS protected
FROM pg_catalog.pg_class rel
JOIN pg_catalog.pg_namespace ns ON ns.oid=rel.relnamespace
WHERE ns.nspname='public'
 AND rel.relname IN ('smn_sprint_closure_snapshot','smn_report_pdf_archive')
ORDER BY rel.relname
`;
