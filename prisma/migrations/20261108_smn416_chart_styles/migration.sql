-- SMN-416: additive global chart-style registry, independent of indicator data.
-- Safe to run again. It intentionally does not change installation schema_version 33.
CREATE TABLE IF NOT EXISTS public.smn_chart_style (
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE CASCADE,
 id text NOT NULL,
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
 description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
 schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version=1),
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 config jsonb NOT NULL CHECK (jsonb_typeof(config)='object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text NULL,
 PRIMARY KEY (installation_id,id),
 UNIQUE (installation_id,name),
 CONSTRAINT smn_chart_style_id_format CHECK (id ~ '^[a-z][a-z0-9-]{2,63}
);
CREATE TABLE IF NOT EXISTS public.smn_chart_style_default (
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE CASCADE,
 chart_type text NOT NULL CHECK (chart_type IN ('bar','line','area','pie','donut','gauge')),
 style_id text NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (installation_id,chart_type),
 CONSTRAINT smn_chart_style_default_id_format CHECK (style_id ~ '^[a-z][a-z0-9-]{2,63}$')
);
INSERT INTO public.smn_chart_style_default (installation_id,chart_type,style_id)
SELECT i.id,t.type,'cockpit-agile'
FROM public.smn_installation i
CROSS JOIN (VALUES ('bar'),('line'),('area'),('pie'),('donut'),('gauge')) AS t(type)
WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version=33
ON CONFLICT (installation_id,chart_type) DO NOTHING;
)
);
CREATE TABLE IF NOT EXISTS public.smn_chart_style_default (
 installation_id text NOT NULL REFERENCES public.smn_installation(id) ON DELETE CASCADE,
 chart_type text NOT NULL CHECK (chart_type IN ('bar','line','area','pie','donut','gauge')),
 style_id text NOT NULL,
 revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (installation_id,chart_type),
 CONSTRAINT smn_chart_style_default_id_format CHECK (style_id ~ '^[a-z][a-z0-9-]{2,63}$')
);
INSERT INTO public.smn_chart_style_default (installation_id,chart_type,style_id)
SELECT i.id,t.type,'cockpit-agile'
FROM public.smn_installation i
CROSS JOIN (VALUES ('bar'),('line'),('area'),('pie'),('donut'),('gauge')) AS t(type)
WHERE i.id='singleton' AND i.state='initialized' AND i.schema_version=33
ON CONFLICT (installation_id,chart_type) DO NOTHING;
