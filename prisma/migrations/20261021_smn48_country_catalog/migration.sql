CREATE TABLE public.smn_country (
 code text PRIMARY KEY CHECK (code ~ '^[A-Z]{2}$'),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
 origin text NOT NULL CHECK (origin IN ('initial','manual')),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.smn_country(code,name,origin) VALUES
 ('FR','France','initial'),
 ('DE','Allemagne','initial'),
 ('GB','Royaume-Uni','initial'),
 ('ES','Espagne','initial'),
 ('PT','Portugal','initial'),
 ('IT','Italie','initial'),
 ('CA','Canada','initial')
ON CONFLICT (code) DO NOTHING;
UPDATE public.smn_installation SET schema_version=15
 WHERE id='singleton' AND schema_version=14;
