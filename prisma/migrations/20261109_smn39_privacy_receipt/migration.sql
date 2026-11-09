-- SMN-39: opaque transaction receipt for exceptional personal-data operations.
-- Additive to the immutable native v33 baseline. Does not change schema_version.
-- Only an authenticated server-side erasure coordinator can write to this table.
CREATE TABLE IF NOT EXISTS public.smn_privacy_erasure_receipt (
 id uuid PRIMARY KEY,
 scope_revision text NOT NULL CHECK(scope_revision ~ '^[a-f0-9]{64}$'),
 operation text NOT NULL CHECK(operation IN ('erase','anonymize')),
 affected_rows bigint NOT NULL CHECK(affected_rows >= 0),
 committed_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.smn_privacy_receipt_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'privacy-receipt-immutable' USING ERRCODE='55000';
END; $$;

DROP TRIGGER IF EXISTS smn_privacy_erasure_receipt_immutable
 ON public.smn_privacy_erasure_receipt;
CREATE TRIGGER smn_privacy_erasure_receipt_immutable
 BEFORE UPDATE OR DELETE ON public.smn_privacy_erasure_receipt
 FOR EACH ROW EXECUTE FUNCTION public.smn_privacy_receipt_immutable();
