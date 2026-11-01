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

## Lot intégré v33 — 01/11/2026
- **Migration transactionnelle** : `scripts/apply-smn-338-v33.ts` applique DDL, vérifie 8 tables et 3 triggers, journalise SHA-256 sous `20261101_smn338_indicator_v33`, puis passe `smn_installation.schema_version` à 33 dans la même transaction. Un échec entraîne ROLLBACK. `--apply` exige `SMN_V33_BACKUP_VERIFIED=YES`; NE PAS utiliser sur la base principale tant que les dernières recettes n'ont pas été validées.
- **Orchestrateur** : `db:upgrade` reconnaît v33 comme déjà migrée et peut demander explicitement l'application de v33 pour les bases v32 après validation de sauvegarde. Sans `--apply`, aucun changement.
- **Diagnostics** : liste des objets v33 mise à jour et validation de la signature SHA-256 de la migration v33 pour les historiques 32→33 et natifs v32→33. Audit exhaustif v33 adapté.
- **Baseline installation neuve** : `pnpm db:baseline:v33:candidate` assemble la baseline native v32 et l'extension additive v33 dans `prisma/baseline/v33/schema-candidate.sql` **localement**. Ce fichier est un **candidat documentaire**, non une baseline installable activée. L'amorçage natif v33, son journal et sa recette d'installation neuve sont à finaliser avant d'autoriser une installation neuve directe en v33.
- **Tests** : `pnpm test:db:compat` (politique v32/v33) et `pnpm db:test:smn-338:v33` (restauration de la base v32, migration COMMIT sur une base jetable, diagnostic initialized, préservation des enregistrements, destruction de la base isolée).
- **Preuves non acquises** : aucune exécution de ces nouvelles commandes n'a encore été fournie ; ne pas affirmer que le lot a été validé. La migration n'a PAS été exécutée sur `smn`.

## Revue finale des invariants parents (01/11/2026)
- Le brouillon v33 contient désormais **4 fonctions PL/pgSQL et 6 triggers métier** : 3 sur les tables indicateurs, 2 sur les tables de cycles (Scrum/Kanban), 1 sur les définitions.
- Les triggers sur les parents refusent un changement d'équipe d'un cycle lorsque des valeurs manuelles, des résultats calculés ou des révisions lui sont liés ; le changement de type d'une définition est refusé si elle a des valeurs ou si `type_locked` est vrai.
- La suite `db:test:smn-338` contient les scénarios de rejet correspondants. Les comptes de fonctions/triggers dans les tests et dans le script de migration sont mis à jour.
- **Attention :** ces derniers correctifs modifient l'empreinte SHA-256 de la migration candidate. Aucun déploiement v33 ne doit être tenté avant de rejouer l'ensemble des suites.
- **Installation neuve native v33 : non activée.** Le générateur de baseline est encore un assemblage candidat ; il faut un test d'installation de bout en bout et une entrée d'historique native v33 canoniquement calculée avant de basculer le flux d'amorçage. Cette limite interdit de déclarer SMN-338 entièrement terminée.
- Privilégier un nouveau contrôle local complet : `pnpm test:db:smn-338:v33:contracts`, `pnpm exec tsx --test tests/smn-338-indicators-schema-contract.test.ts`, `pnpm db:test:smn-338`, `pnpm db:test:smn-338:upgrade`, `pnpm db:test:smn-338:v33`, `pnpm typecheck`, `pnpm lint`, `pnpm db:diagnose:full`.

## Installation native v33 — flux d'amorçage câblé
- Le flux `src/server/installation/install.ts` conserve la baseline canonique v32, applique la migration palette historique, puis le DDL indicateurs dans **la même transaction**. Il initialise `schema_version=33` et journalise deux migrations : baseline v32 (empreinte source d'origine) et extension v33 (empreinte SQL exacte).
- `src/server/installation/diagnostic.ts` accepte cet historique à deux entrées et le statut `initialized` v33. Le parcours v32→v33 historique conserve ses 33 entrées.
- Nouveau test d'intégration `pnpm db:test:smn-338:native` : installation `installExpress` sur base vide jetable, validation diagnostic v33, des 8 tables, des 2 entrées de journal, de l'administrateur et de la palette Red Purple.
- L'assemblage `prisma/baseline/v33/schema-candidate.sql` demeure une **pièce de conception non nécessaire au flux natif** ; il n'est pas utilisé par l'installateur.
- **Aucun de ces derniers changements n'est encore validé en exécution locale.** Passage en Terminé de la Story conditionné aux recettes et à la résolution des éventuels défauts.
- Recette complète conseillée après Pull origin (sur la base v32 source non modifiée) : `pnpm test:db:smn-338:v33:contracts` ; `pnpm exec tsx --test tests/smn-338-indicators-schema-contract.test.ts` ; `pnpm db:test:smn-338` ; `pnpm db:test:smn-338:upgrade` ; `pnpm db:test:smn-338:v33` ; `pnpm db:test:smn-338:native` ; `pnpm typecheck` ; `pnpm lint` ; `pnpm db:diagnose:full`.
- **Ne pas utiliser** `db:upgrade --apply` sur la base principale tant que les tests du dernier lot ne sont pas confirmés. L'utilisateur n'a pas encore validé le basculement de son instance.

## Livraison technique intégrée — candidat à validation finale
- Le flux natif v33, la migration transactionnelle v32→v33, le diagnostic v33 physique et les garde-fous sur les cycles/indicateurs sont désormais **codés** sur `main`.
- En v33, le diagnostic physique contrôle notamment **4 fonctions**, **6 triggers activés** et les **2 index uniques partiels** des dépendances ; un trigger critique désactivé rend l'installation incompatible.
- Les triggers de protection couvrent les changements de `team_id`, les changements d'identifiant et les suppressions de cycles référencés, ainsi que le changement de type des indicateurs porteurs de valeurs ou verrouillés.
- La commande consolidée `pnpm db:validate:smn-338` lance, sans migrer la base source, les tests contractuels, les suites PostgreSQL isolées, l'installation native v33 sur base vierge jetable, TypeScript, ESLint et le diagnostic v32.
- **Non-régression encore non prouvée pour ce dernier lot :** l'utilisateur doit exécuter cette commande sur PostgreSQL 18.6 portable. Seules les phases antérieures (14/14 et restauration v32) ont été exécutées et validées.
- La migration effective de `smn` est une opération de déploiement distincte, exclue de cette livraison sans sauvegarde vérifiée et accord explicite.
