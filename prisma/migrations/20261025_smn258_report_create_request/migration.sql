ALTER TABLE public.smn_report_document ADD COLUMN IF NOT EXISTS creation_request_id text;
CREATE UNIQUE INDEX IF NOT EXISTS smn_report_document_create_request_idx ON public.smn_report_document(creation_request_id) WHERE creation_request_id IS NOT NULL;
