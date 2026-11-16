-- SMN-482: preventive request reservation, never a billing guarantee.
-- No model becomes approved solely because it appears in this table.
CREATE TABLE IF NOT EXISTS public.smn_ai_free_request_quota(
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 connection_id uuid NOT NULL REFERENCES public.smn_ai_connection(id) ON DELETE CASCADE,
 quota_day date NOT NULL,
 request_count integer NOT NULL DEFAULT 0 CHECK(request_count>=0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(installation_id,connection_id,quota_day)
);
COMMENT ON TABLE public.smn_ai_free_request_quota IS
 'Local prevention only: never a proof of external billing or free-tier entitlement.';
