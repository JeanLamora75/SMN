# SMN-338 — Porte de validation de la migration (Winston)
**01/11/2026 — DDL validé en test local : 7/7 statiques et 1/1 intégration PostgreSQL. Aucune migration de la base SMN appliquée.**

## Correction de sécurité
Le brouillon DDL a été déplacé de `prisma/migrations/20261031_smn338_indicators_draft/migration.sql` vers `_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql`. Cela évite qu'un processus de découverte des migrations historiques interprète ce brouillon comme une migration à exécuter. Le test de contrat pointe désormais sur cette copie documentaire.

## Contrôles source effectués
Inspection textuelle du SQL publié : 8 déclarations `CREATE TABLE public.smn_indicator_*`, absence de DROP/TRUNCATE, absence de mise à jour de `smn_installation`, index uniques partiels pour les deux types de dépendance, colonne `value numeric`. Ce sont **5 observations de source**, pas des résultats `pnpm`/PostgreSQL.

## Étapes bloquantes avant une migration activée
1. Exécuter réellement `pnpm exec tsx --test tests/smn-338-indicators-schema-contract.test.ts` puis `pnpm typecheck` et `pnpm lint`.
2. Exécuter ce DDL **uniquement sur une base PostgreSQL jetable et isolée**, avec préconditions (tables smn_team/smn_account).
3. Tester CHECK, FK, UNIQUE, clés composites, valeurs nulles, verrous et récupération après erreur. Vérifier les deux branches exclusives `smn_indicator_dependency`.
4. Corriger le cas du `smn_indicator_computed_result` : statut et motif doivent rester cohérents sous les règles SQL à trois valeurs ; couvrir des inserts invalides.
5. Fixer le contrat des écrans `screen_key`, l'intégrité cycle polymorphe (serveur), les références d'installation et les limites de `NUMERIC` selon les décisions du moteur décimal.
6. Implémenter le mécanisme de mise à niveau v32→version cible **sans supposer que `db:upgrade` le fait déjà**, puis mettre à jour la baseline native et le diagnostic.
7. Comparer signatures d'une installation neuve et d'une base migrée, identifier réellement les objets DROP avec le protocole SMN-337 et sauvegarder/restaurer.
8. Faire valider la procédure et les preuves d'exécution avant la bascule.

## Invariants
- Les tables de capacité, les séries Kanban, les clôtures et snapshots historiques indépendants sont conservés.
- Aucune DDL implicite dans les API.
- L'ajout non destructif précède tout démantèlement.
- La Story SMN-338 ne doit pas être déclarée terminée sans preuves PostgreSQL et convergence.

## Préparation de la migration additive — phase de conception
- `db:upgrade` (`scripts/db-upgrade.ts`) refuse actuellement toute opération au-delà de la baseline v32 : ne pas le présenter comme capable de migrer vers v33.
- La v32 peut avoir un historique complet de **32 migrations** ou une baseline native de **1 migration** ; les deux scénarios doivent être pris en charge explicitement.
- Les préconditions minimales sont `smn_team`, `smn_account`, `smn_sprint`, `smn_kanban_period`, une installation initialisée en v32 et aucun objet `smn_indicator_*` déjà présent.
- Le nouveau script `pnpm db:check:smn-338` vérifie ces conditions **en transaction READ ONLY**. Ce n'est ni une sauvegarde ni une migration et il ne certifie pas la convergence.
- Le brouillon contient **8 tables, 2 fonctions PL/pgSQL et 3 triggers**. Les triggers référencent les deux tables métiers de cycles et nécessitent leur présence préalable.
- **Prochaine porte obligatoire :** préparer une copie isolée représentative de la base v32, tester une application transactionnelle du DDL, vérifier les signatures (tables, colonnes, contraintes, index, fonctions, triggers), puis comparer au résultat de l'installation neuve cible.
- **Ne pas ajouter maintenant** de SQL au répertoire `prisma/migrations`, incrémenter `schema_version` ou le journal `_prisma_migrations`, remplacer la baseline v32, ni appeler `--apply` sur la base utilisateur.
- Tests de concurrence et de mutations des données parentes : garantir l'intégrité lors du déplacement d'un cycle entre équipes et lors du changement de type d'indicateur ; arbitrer la règle d'immutabilité au niveau métier et DB avant activation.
- L'audit SMN-337 demeure une condition préalable à toute suppression des anciennes tables ; **aucun DROP** ici.
