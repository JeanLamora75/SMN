// Schéma SQL versionné I0 ; destiné uniquement à une base vide explicitement confirmée.
export const INITIAL_SCHEMA_SQL = `
CREATE TABLE public.smn_installation (
 id text PRIMARY KEY, state text NOT NULL, schema_version integer NOT NULL,
 mode text NOT NULL CHECK (mode IN ('scrum','kanban')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.smn_product (
 id text PRIMARY KEY, installation_id text NOT NULL UNIQUE REFERENCES public.smn_installation(id),
 name text NOT NULL
);
CREATE TABLE public.smn_team (
 id text PRIMARY KEY, installation_id text NOT NULL UNIQUE REFERENCES public.smn_installation(id),
 product_id text NOT NULL REFERENCES public.smn_product(id), name text NOT NULL
);
CREATE TABLE public.smn_account (
 id text PRIMARY KEY, installation_id text NOT NULL REFERENCES public.smn_installation(id),
 email text NOT NULL UNIQUE, role text NOT NULL CHECK (role IN ('admin','user')),
 password_hash text NOT NULL, must_change_password boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public._prisma_migrations (
 id varchar(36) PRIMARY KEY, checksum varchar(64) NOT NULL,
 finished_at timestamptz, migration_name varchar(255) NOT NULL,
 logs text, rolled_back_at timestamptz, started_at timestamptz NOT NULL DEFAULT now(),
 applied_steps_count integer NOT NULL DEFAULT 0
);
`;
