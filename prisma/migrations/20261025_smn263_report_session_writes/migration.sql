CREATE TABLE IF NOT EXISTS public.smn_report_document_session_write (
 document_id text NOT NULL REFERENCES public.smn_report_document(id) ON DELETE CASCADE,
 session_id text NOT NULL,
 last_sequence integer NOT NULL CHECK(last_sequence>=1),
 PRIMARY KEY(document_id,session_id)
);
