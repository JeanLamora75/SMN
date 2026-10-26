/** Migration versionnée préparée : exécution manuelle et contrôlée uniquement.
 *
 * L'installation actuelle maintient un journal strict (schema_version=27 et
 * _prisma_migrations). Cette constante ne doit pas être exécutée sans adapter
 * simultanément le registre de migrations, le diagnostic et tous les lecteurs
 * qui supposent encore une seule équipe.
 */
export const MULTI_TEAM_MIGRATION="20261026_smn282_multi_teams";
export const MULTI_TEAM_SCHEMA_SQL=`
-- Conservation de toutes les lignes et identifiants existants.
ALTER TABLE public.smn_product
  DROP CONSTRAINT IF EXISTS smn_product_installation_id_key;
ALTER TABLE public.smn_team
  DROP CONSTRAINT IF EXISTS smn_team_installation_id_key;

-- Une équipe sans produit est représentée par un lien nul, jamais un faux produit.
ALTER TABLE public.smn_team ALTER COLUMN product_id DROP NOT NULL;

-- Un produit réel ne peut être partagé par deux équipes.
CREATE UNIQUE INDEX IF NOT EXISTS smn_team_product_id_key
  ON public.smn_team(product_id);

-- Interdit les liens entre équipes et produits d'installations différentes.
ALTER TABLE public.smn_product
  ADD CONSTRAINT smn_product_id_installation_pair_key UNIQUE(id,installation_id);
ALTER TABLE public.smn_team
  ADD CONSTRAINT smn_team_product_same_installation_fk
    FOREIGN KEY(product_id,installation_id)
    REFERENCES public.smn_product(id,installation_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

-- Index d'intégrité : les doubles clics et les appels concurrents ne peuvent créer
-- deux noms identiques dans une installation (même casse/espaces normalisés).
CREATE UNIQUE INDEX IF NOT EXISTS smn_team_installation_name_ci_key
  ON public.smn_team(installation_id,
    lower(btrim(regexp_replace(name,'[[:space:]]+',' ','g'))));

-- Le contexte d'une équipe ne doit jamais provenir d'une autre équipe.
-- La table de contexte peut avoir été créée auparavant à la première édition
-- ou ne pas encore exister dans une installation non éditée.
CREATE TABLE IF NOT EXISTS public.smn_team_context (
 team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 vision text,product_goal text,dod text,dor text,language text,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL
);
ALTER TABLE public.smn_team_context
 ADD COLUMN IF NOT EXISTS vision text,
 ADD COLUMN IF NOT EXISTS product_goal text,
 ADD COLUMN IF NOT EXISTS dod text,
 ADD COLUMN IF NOT EXISTS dor text,
 ADD COLUMN IF NOT EXISTS language text,
 ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS public.smn_team_context_audit (
 id text PRIMARY KEY,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 before_values jsonb NOT NULL,after_values jsonb NOT NULL,
 actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 changed_at timestamptz NOT NULL DEFAULT now(), UNIQUE(team_id,revision)
);
-- Préférence d'équipe active indépendante pour chaque compte administrateur.
-- La présence d'une préférence n'attribue aucun droit aux comptes user.
ALTER TABLE public.smn_account
  ADD CONSTRAINT smn_account_installation_pair_key UNIQUE(id,installation_id);
ALTER TABLE public.smn_team
  ADD CONSTRAINT smn_team_installation_pair_key UNIQUE(id,installation_id);
CREATE TABLE public.smn_account_team_preference (
 account_id text PRIMARY KEY,
 installation_id text NOT NULL,
 team_id text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT smn_team_pref_account_same_installation_fk
  FOREIGN KEY(account_id,installation_id) REFERENCES public.smn_account(id,installation_id)
  ON DELETE CASCADE,
 CONSTRAINT smn_team_pref_team_same_installation_fk
  FOREIGN KEY(team_id,installation_id) REFERENCES public.smn_team(id,installation_id)
  ON DELETE RESTRICT
);
-- Migration monoéquipe : seuls les admins conservent une préférence explicite.
INSERT INTO public.smn_account_team_preference(account_id,installation_id,team_id)
 SELECT a.id,a.installation_id,t.id
 FROM public.smn_account a
 JOIN public.smn_team t ON t.installation_id=a.installation_id
 WHERE a.role='admin' AND a.is_active=true;
UPDATE public.smn_installation SET schema_version=28
 WHERE id='singleton' AND schema_version=27;
`;
