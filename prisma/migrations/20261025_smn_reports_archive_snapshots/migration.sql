-- Studio PDF archive schema. Legacy archives remain unchanged.
CREATE TABLE IF NOT EXISTS public.smn_report_pdf_archive (
 id text PRIMARY KEY,
 sha256 text NOT NULL,
 byte_length integer NOT NULL,
 stored_name text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL,
 author_id text NOT NULL,
 language text NOT NULL CHECK(language IN ('fr','en')),
 template_id text NOT NULL,
 team_id text NOT NULL,
 cycle_id text NOT NULL,
 cycle_status text NOT NULL,
 snapshot_version integer,
 manifest jsonb NOT NULL
);
ALTER TABLE public.smn_report_pdf_archive ADD COLUMN IF NOT EXISTS operation_id text;
CREATE UNIQUE INDEX IF NOT EXISTS smn_pdf_archive_operation_uq
 ON public.smn_report_pdf_archive(operation_id) WHERE operation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.smn_report_studio_archive_snapshot (
 archive_id text PRIMARY KEY REFERENCES public.smn_report_pdf_archive(id) ON DELETE RESTRICT,
 document_id text NOT NULL,
 version integer NOT NULL CHECK(version>=1),
 document_revision integer NOT NULL CHECK(document_revision>=1),
 source_sha256 text NOT NULL CHECK(source_sha256 ~ '^[0-9a-f]{64}$'),
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(document_id,version)
);

CREATE OR REPLACE FUNCTION public.smn_reject_studio_archive_snapshot_mutation()
RETURNS trigger LANGUAGE plpgsql AS $smn$
BEGIN
 RAISE EXCEPTION 'studio archive snapshots are immutable';
END;
$smn$;

DO $smn$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_trigger
  WHERE tgrelid='public.smn_report_studio_archive_snapshot'::regclass
  AND tgname='smn_studio_archive_immutable'
 ) THEN
  CREATE TRIGGER smn_studio_archive_immutable BEFORE UPDATE OR DELETE
  ON public.smn_report_studio_archive_snapshot FOR EACH ROW
  EXECUTE FUNCTION public.smn_reject_studio_archive_snapshot_mutation();
 END IF;
END;
$smn$;
