# Correctif SMN-231 — Prévisualisation de Sprint : colonne inexistante (42703)

**Date :** 24/10/2026
**Origine :** capture utilisateur lors de « Générer des sprints », étape Configuration → Prévisualiser.
**Symptôme :** « Le schéma de la base de données requis pour générer les sprints est incomplet. Étape en échec : calcul des périodes — code diagnostic : 42703. »

## Cause démontrée par le code et le schéma
Le chemin `previewWizard()` de `src/server/sprints/wizard.ts` déclenche `previewSprintBatch()` de `src/server/sprints/batch-preview.ts`. Celui-ci exécutait sur `public.smn_scrum_cadence` une requête contenant `AND deleted_at IS NULL`.

Or ni `prisma/migrations/20261021_smn65_scrum_cadence/migration.sql`, ni `ensureCadenceTable()` de `src/server/sprints/cadence.ts`, n'ajoutent cette colonne. Le code PostgreSQL `42703` signifie `undefined_column`. La cause est donc un filtre de suppression logique appliqué par erreur aux paramètres de cadence de l'équipe ; la colonne `deleted_at` est en revanche légitime sur `public.smn_sprint`.

## Correctif minimal et non destructif
- Supprimer `AND deleted_at IS NULL` uniquement de la requête `smn_scrum_cadence` dans `src/server/sprints/batch-preview.ts`.
- Conserver `AND deleted_at IS NULL` sur les Sprints existants afin d'exclure les Sprints supprimés du contrôle de chevauchement.
- Ajouter `tests/smn-231-sprint-preview-cadence-42703.test.ts` : faux client PostgreSQL qui reproduit `42703` si `deleted_at` est interrogé sur la cadence, assertion de génération des deux périodes consécutives et filtrage des Sprints supprimés.
- Pas de modification de migration, ni de données, ni d'altération de table, ni de réinstallation.

## Risque et vérifications
- **Statique :** table de cadence et colonne absente vérifiées dans migration + modèle serveur ; requête corrigée sur branche de travail.
- **Non exécutés par ce connecteur :** `pnpm typecheck`, tests TSX, tests sur la base PostgreSQL Windows et `pnpm build`. L'accès direct à un checkout testable n'était pas disponible ; aucun résultat n'est présenté comme réussi.
- **Tests à exécuter localement :**
```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-231-sprint-preview-cadence-42703.test.ts tests/smn-231-sprint-wizard.test.ts tests/sprints-refonte-etape0.test.ts
pnpm build
pnpm dev
```
Vérifier ensuite la prévisualisation de deux Sprints à partir du 26/10/2026, contrôler les périodes proposées, puis confirmer uniquement après vérification des chevauchements.

**Suivi :** anomalie SMN-231 identifiée et patch préparé. La validation fonctionnelle reste à la charge de la recette locale et ne doit pas être déclarée acquise avant exécution. GitHub Actions désactivé.
