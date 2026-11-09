-- SMN-39: immutable access restriction for archived PDFs.
-- The original PDF bytes and original manifest are never overwritten.
-- A new redacted edition, when produced, must use a distinct archive ID.
-- Additive to native v33; requires the SMN-39 immutable SQL receipt table.
CREATE TABLE IF NOT EXISTS public.smn_privacy_archive_restriction (
 archive_id text PRIMARY KEY
  REFERENCES public.smn_report_pdf_archive(id) ON DELETE RESTRICT,
 receipt_id uuid NOT NULL
  REFERENCES public.smn_privacy_erasure_receipt(id)
  DEFERRABLE INITIALLY DEFERRED,
 action text NOT NULL DEFAULT 'restrict-access'
  CHECK(action='restrict-access'),
 restricted_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.smn_privacy_archive_restriction_immutable()
RETURNS trigger LANGUAGE plpgsql AS $privacy_restriction_guard$
BEGIN
 RAISE EXCEPTION 'privacy-archive-restriction-immutable' USING ERRCODE='55000';
END;
$privacy_restriction_guard$;

DROP TRIGGER IF EXISTS smn_privacy_archive_restriction_immutable
 ON public.smn_privacy_archive_restriction;
CREATE TRIGGER smn_privacy_archive_restriction_immutable
 BEFORE UPDATE OR DELETE ON public.smn_privacy_archive_restriction
 FOR EACH ROW EXECUTE FUNCTION public.smn_privacy_archive_restriction_immutable();
