-- SMN-480: metadata-only AI provider connections. Never store API keys here.
CREATE TABLE IF NOT EXISTS public.smn_ai_connection (
 id uuid PRIMARY KEY,
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE RESTRICT,
 label varchar(120) NOT NULL,
 provider_id varchar(40) NOT NULL,
 model_id varchar(160),
 enabled boolean NOT NULL DEFAULT false,
 credential_state varchar(24) NOT NULL DEFAULT 'missing',
 last_test_status varchar(24) NOT NULL DEFAULT 'never',
 last_test_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 created_by text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_ai_connection_provider CHECK (provider_id IN ('gemini','groq','openrouter')),
 CONSTRAINT smn_ai_connection_label CHECK (length(btrim(label)) > 0),
 CONSTRAINT smn_ai_connection_credential CHECK (credential_state IN ('missing','configured','invalid')),
 CONSTRAINT smn_ai_connection_test CHECK (last_test_status IN ('never','passed','failed','quota','unavailable')),
 CONSTRAINT smn_ai_connection_enable CHECK (enabled = false OR (credential_state = 'configured' AND last_test_status = 'passed'))
);
CREATE INDEX IF NOT EXISTS smn_ai_connection_installation_idx
 ON public.smn_ai_connection (installation_id,created_at,id);
COMMENT ON TABLE public.smn_ai_connection IS 'Non-secret connection metadata only; API keys belong to the separate local encrypted vault (SMN-481).';
