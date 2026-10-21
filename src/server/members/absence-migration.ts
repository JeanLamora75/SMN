export const ABSENCE_MIGRATION="20261021_smn53_member_absences";
export const ABSENCE_MIGRATION_SQL=`CREATE TABLE public.smn_absence_category (
 id text PRIMARY KEY CHECK (id ~ '^[a-z][a-z0-9_-]{0,39}$'),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
 color text NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.smn_absence_category(id,name,color) VALUES
 ('leave','Congés','#4F83CC'),
 ('training','Formation','#7959B3'),
 ('sick','Maladie','#D17B38'),
 ('other','Autre','#6B7280');
CREATE TABLE public.smn_member_absence (
 id text PRIMARY KEY,
 member_id text NOT NULL REFERENCES public.smn_member(id) ON DELETE RESTRICT,
 category_id text NOT NULL REFERENCES public.smn_absence_category(id) ON DELETE RESTRICT,
 start_on date NOT NULL,
 end_on date NOT NULL,
 start_slot text NOT NULL CHECK (start_slot IN ('morning','afternoon')),
 end_slot text NOT NULL CHECK (end_slot IN ('morning','afternoon')),
 is_planned boolean NOT NULL,
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 200),
 revision integer NOT NULL DEFAULT 1 CHECK (revision>=1),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_absence_valid_interval CHECK (
  start_on<=end_on AND
  (start_on<>end_on OR start_slot='morning' OR end_slot='afternoon'))
);
CREATE INDEX smn_member_absence_dates_idx ON public.smn_member_absence(member_id,start_on,end_on);
CREATE TABLE public.smn_member_absence_history (
 id text PRIMARY KEY,
 absence_id text NOT NULL REFERENCES public.smn_member_absence(id) ON DELETE RESTRICT,
 revision integer NOT NULL CHECK (revision>=1),
 operation text NOT NULL CHECK (operation IN ('create','update')),
 before_values jsonb,
 after_values jsonb NOT NULL CHECK (jsonb_typeof(after_values)='object'),
 changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(absence_id,revision)
);
CREATE INDEX smn_member_absence_history_date_idx ON public.smn_member_absence_history(absence_id,changed_at);
UPDATE public.smn_installation SET schema_version=19
 WHERE id='singleton' AND schema_version=18;
`;
