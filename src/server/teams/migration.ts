/** Préparation de migration non activée.
 *
 * L'installation actuelle maintient un journal strict (schema_version=27 et
 * _prisma_migrations). Cette constante ne doit pas être exécutée sans adapter
 * simultanément le registre de migrations, le diagnostic et tous les lecteurs
 * qui supposent encore une seule équipe.
 */
export const MULTI_TEAM_SCHEMA_SQL=`
-- Conservation de toutes les lignes et identifiants existants.
ALTER TABLE public.smn_product
  DROP CONSTRAINT IF EXISTS smn_product_installation_id_key;
ALTER TABLE public.smn_team
  DROP CONSTRAINT IF EXISTS smn_team_installation_id_key;

-- Une équipe sans produit est représentée par un lien nul, jamais un faux produit.
ALTER TABLE public.smn_team ALTER COLUMN product_id DROP NOT NULL;

-- Un produit réel ne peut être partagé par deux équipes.
CREATE UNIQUE INDEX IF NOT EXISTS smn_team_product_single_owner_idx
  ON public.smn_team(product_id) WHERE product_id IS NOT NULL;

-- Interdit les liens entre équipes et produits d'installations différentes.
ALTER TABLE public.smn_product
  ADD CONSTRAINT smn_product_id_installation_pair_key UNIQUE(id,installation_id);
ALTER TABLE public.smn_team
  ADD CONSTRAINT smn_team_product_same_installation_fk
    FOREIGN KEY(product_id,installation_id)
    REFERENCES public.smn_product(id,installation_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS smn_team_installation_name_idx
  ON public.smn_team(installation_id,lower(name));
`;
