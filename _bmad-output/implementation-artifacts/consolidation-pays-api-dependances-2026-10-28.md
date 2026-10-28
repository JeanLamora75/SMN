# SMN — Pays : audit de raccordement des API (lot 2)

Date : 28 octobre 2026. Source : branche terminale `feat/smn-281-country-regression-recipe` comparée à `main`. Pas de migration exécutée ; pas de fusion.

## Routes et dépendances

| API | Ancienne route dans main | Extension de #201 | Dépendances sensibles |
|---|---|---|---|
| `GET/POST /api/admin/countries` | Existe et autorisation lecture/écriture `settings` | Même façade, mais `catalog.ts` étend les résultats et les opérations | Champs `revision`, `archived_at` et tables d'audit v30 ; vérification de version |
| `PATCH /api/admin/countries/[code]` | Absente | Renommer un pays avec révision et audit | `renameCountry`, `name-migration.ts`, vérification administrateur |
| `GET /api/admin/countries/calendar` | Absent | Détail annuel | `manual.ts`, `manual-migration.ts` |
| `POST /api/admin/countries/calendar` | Absent | Rechargement explicite du calendrier national | `preloadNationalCalendar`, référence Pays |
| `POST /api/admin/countries/[code]/holidays` | Absent | CRUD manuel des jours fériés | `manual.ts`, audit et invalidation annuelle, schéma v30 |
| `GET/POST /api/admin/countries/[code]/calendar/validate` | Absent | Diagnostic et validation annuelle | `annual-validation.ts`, `validation-migration.ts`, empreinte et contrôle de concurrence |
| `POST /api/admin/countries/[code]/lifecycle` | Absent | Archiver/réactiver | `lifecycle.ts`, `archive-migration.ts`, contraintes sur membres actifs |

## Risque transversal bloquant

La branche #201 appelle `ensureCountryNameSchema`, `ensureCountryArchiveSchema`, `ensureManualHolidaySchema` et `ensureAnnualValidationSchema` dans les chemins métier et parfois en lecture. Ces fonctions exécutent du **DDL dans des transactions applicatives**. La branche de consolidation dispose maintenant d'une migration Prisma versionnée v30 : recopier les fonctions à l'identique réintroduirait des modifications implicites du schéma et ne respecterait pas la séparation installation/exécution.

**Décision :** remplacer ces fonctions de migration opportuniste par des préconditions de schéma v30 (lecture seule/erreur explicite), une fois la compatibilité de l'initialisation vérifiée. Intégrer ensuite les API et le service Pays par lots de taille maîtrisée, puis les formulaires. Ne jamais modifier `main` par copie intégrale du catalogue historique.

## Contrôles avant ouverture des routes

- Schéma v30 appliqué **explicitement** sur une base de développement ; aucune migration implicite par GET.
- Autorisation `settings` read/write et refus utilisateurs non autorisés, codes d'erreur cohérents.
- Préservation des Pays de référence, membres actifs, événements archivés et données historiques.
- Révisions optimistes et refus des chevauchements/modifications concurrentes.
- Tests `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` et recette PostgreSQL.

**État :** audit API réalisé, publication des routes différée jusqu'à sécurisation des dépendances ; aucun test exécuté.

## Garde v30 sans migration implicite

Ajout de `src/server/countries/schema-guard.ts` : `requireCountrySchemaV30` effectue une lecture SQL unique vérifiant le marqueur v30, les quatre tables d'audit et les colonnes attendues. En cas de prérequis absent, elle lève `CountrySchemaUnavailableError` ; elle n'exécute ni DDL ni DML. Test associé dans `tests/country-schema-guard.test.ts` (réponse prête/incomplète et une lecture SQL).

**Attention :** la garde est disponible mais **n'est pas encore raccordée aux services ni routes**. Elle ne remplace pas la validation complète des migrations/checksums fournie par le diagnostic d'installation. Les tests ne sont pas exécutés ; aucun déploiement n'a été réalisé.


## Lot 2 — remplacement effectif des quatre helpers DDL (28 octobre)

Sur la branche de consolidation, les chemins suivants sont désormais présents avec les mêmes noms exportés que dans la branche historique, mais ne font qu'appeler `requireCountrySchemaV30` :

- `src/server/countries/name-migration.ts` : `ensureCountryNameSchema`
- `src/server/countries/archive-migration.ts` : `ensureCountryArchiveSchema` (constante de verrou métier conservée)
- `src/server/holidays/manual-migration.ts` : `ensureManualHolidaySchema`
- `src/server/holidays/validation-migration.ts` : `ensureAnnualValidationSchema`

Le fichier `tests/country-no-implicit-ddl.test.ts` vérifie par doubles de base les appels uniquement en lecture et le refus en version 29. Ces tests **n'ont pas été exécutés**.

**Limites importantes :** les helpers sont publiés mais les services métier/les routes qui les invoquent n'ont pas encore été importés depuis #201 ; aucune compatibilité de bout en bout n'est acquise. Les opérations de migration restent exclusivement explicites. Ne pas fusionner avant vérification et recette.

## Lot 2 — catalogue Pays et renommage (28 octobre)

`src/server/countries/catalog.ts` a été intégré depuis #201, avec garantie du prérequis v30 **avant toute transaction de création de pays** et lors du renommage/lecture des pays. La route `PATCH /api/admin/countries/[code]` a été ajoutée, protégée par `authorizeApi(...,'write',settings)`. La transaction de renommage maintient la comparaison de révision, le verrou `FOR UPDATE`, l'audit du changement de nom et le refus des pays archivés. Test statique ciblé `tests/country-consolidation-rename.test.ts` créé (validation des entrées et blocage v29 avant transaction).

**À vérifier avant fusion :** tests existants du catalogue dont les attentes de résultats peuvent être anciennes, compatibilité de la page Pays avec les nouveaux champs, exécution réelle de TypeScript/lint/tests/build ; migrations non exécutées. Les autres API Pays (jours fériés, validation, archivage) restent à intégrer.

## Lot 2 — API jours fériés et attestation annuelle

Le service `src/server/holidays/manual.ts`, le service `src/server/holidays/annual-validation.ts`, le journal `validation-audit.ts` ainsi que les routes `POST /api/admin/countries/[code]/holidays` et `GET/POST /api/admin/countries/[code]/calendar/validate` ont été transférés depuis la branche #201.

Les services appellent `ensureAnnualValidationSchema`, désormais remplacé dans cette branche par la garde SQL v30 strictement en lecture seule ; les mutations métier et audits restent transactionnels. Les tests métier `tests/national-holiday-manual.test.ts` et `tests/national-calendar-validation.test.ts` ont également été transférés.

**À vérifier :** tous les scénarios d'autorisation et de concurrence, les routes de consultation annuelle, les contraintes SQL et la compilation globale. Les tests sont présents mais non exécutés. Les services ne doivent être utilisés qu'après migration explicite v30 ; rien n'a été appliqué à une base PostgreSQL ou fusionné dans `main`.

## Archivage/réactivation et consultation annuelle intégrés

Fichiers ajoutés : `src/server/countries/lifecycle.ts`, route `GET/POST /api/admin/countries/[code]/lifecycle`, tests `country-lifecycle.test.ts`, `country-calendar-read.test.ts`. Route existante `GET/POST /api/admin/countries/calendar` harmonisée avec les fonctionnalités de la branche #201 ; garde de schéma v30 ajoutée à la voie POST avant rechargement, et voie GET via `ensureManualHolidaySchema`.

Le service de cycle de vie vérifie la révision, les membres actifs rattachés au pays, les déplacements futurs et la référence de pays avant archivage ; il historise l'action et conserve le verrou de sérialisation métier.

**Réserve :** les tests sont copiés mais non exécutés, le service de préchargement peut avoir d'autres dépendances non encore migrées, les nouveaux contrats API ne sont pas validés en environnement réel. Il reste à réaliser un audit de compilation, compatibilité interservices et permissions avant fusion.

## Revue transversale — correction du rafraîchissement national

Contrôle statique : les services intégrés utilisent la garde v30 avant les transactions ; les routes Pays sont protégées par `authorizeApi` selon lecture/écriture. Un risque a été identifié dans `preloadNationalCalendar` : le rafraîchissement actualisait le statut et le nombre d'entrées sans réviser ni invalider l'attestation annuelle.

Correction sur cette branche : verrou partagé avec l'archivage (`pg_advisory_xact_lock(20261026,279)`), lecture verrouillée du pays, refus des pays archivés, incrément de la révision de couverture et effacement de l'attestation administrative **si le statut, le nombre ou le diagnostic change**. Les rafraîchissements sans changement de ces champs conservent la validation. Test structurel ajouté : `tests/country-preload-invalidation.test.ts`.

**Réserves :** les tests ne sont pas exécutés ; les collisions entre imports CSV/ICS, modifications manuelles et rafraîchissement nécessitent une recette transactionnelle PostgreSQL. La détection de changement ne tient pas compte du nom d'un jour férié lorsque les indicateurs de couverture ne changent pas ; à qualifier avec les règles d'importation et l'empreinte de validation. `main` reste inchangée.

## Lot interface Pays — transfert initial (28 octobre)

Composants UX repris depuis #201 : catalogue `country-admin.tsx`, page Pays, formulaire, calendrier, éditeur et import de jours fériés, validation annuelle, cycle de vie, drapeaux. Six utilitaires `src/lib/countries/` ont été transférés. Les traductions `countries` ont été fusionnées **clé par clé** dans FR/EN en conservant les autres sections de `main` (notamment `links`, `linksAdmin`, `teamSettings`, `teamSwitch`, `reportLinks`).

**Aucune commande i18n/typecheck/lint/test/build exécutée** : contrats API et interactions UX à valider. Les ajustements CSS transversaux et les imports CSV/ICS restent à examiner. Pas de fusion vers `main`.

## Consolidation des imports CSV/ICS

Les fichiers `src/server/holidays/csv-import.ts` et `src/server/holidays/ics-import.ts` ont été réconciliés depuis la branche terminale #201. Les versions intégrées vérifient désormais l'archivage lors des prévisualisations, imposent le prérequis v30 en lecture seule et mettent à jour les révisions de couverture et l'invalidation des validations annuelles lors des modifications CSV. L'ICS réutilise le flux CSV pour l'enregistrement. Les tests `holiday-csv-import.test.ts` et `holiday-ics-import.test.ts` ont été synchronisés.

**Attention :** code publié sans exécution des tests. Il reste à qualifier le conflit entre préchargement automatique et modifications CSV/ICS, les changements de libellés à nombre égal, la conformité des modales et de `globals.css`, ainsi que le diagnostic de migration v30 en base. Aucune PR fusionnée.

## Revue UX / CSS — styles calendrier

Vérification du fichier `src/app/globals.css` : sur la branche historique #201, les styles Pays constituent un ajout strict à la fin du fichier de `main` (aucune modification du préfixe). Ce complément CSS a été intégré sur la branche de consolidation, couvrant la modale native, la grille mensuelle, les états interactifs, les médias mobiles et l'accessibilité clavier. Test de contrat statique `tests/country-css-contract.test.ts` ajouté. Les endpoints présents dans le catalogue, le calendrier et l'import ont été relevés et correspondent aux chemins API présents sur la branche.

**Limites :** contrôle statique uniquement ; aucun rendu de navigateur, aucune compilation et aucune recette UX. Les styles de modalité devront être comparés avec le contrat transversal SMN-298 et contrôlés sur mobile avant fusion.

## Vérification avant fusion — 28 octobre 2026

PR #213 : deux workflows GitHub Actions en échec sur le commit précédent : « Vérification I0 » (jobs Windows et PostgreSQL/Linux) et « SMN — Paquet Windows pilote ». Les archives des journaux des trois jobs sont indisponibles via GitHub (BlobNotFound) : impossible d'attribuer les erreurs avec certitude. Les tests, le build et la migration PostgreSQL n'ont pas été exécutés localement.

Correction publiée : `preloadNationalCalendar` prend maintenant les verrous `20261021,49` (préchargement), `20261021,50` (édition/import) puis `20261026,279` (cycle de vie), dans le même ordre que le flux CSV. Cela empêche les modifications simultanées avec les imports CSV/ICS ou les éditions manuelles. Test statique correspondant complété. **Ce correctif ne remplace pas une recette transactionnelle PostgreSQL.**

Décision : PR maintenue en brouillon, pas de fusion dans main tant que la compilation et les actions ne sont pas concluantes. Contrôles attendus : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis migration v30 sur base de développement et `pnpm db:diagnose`.

## Réparation des fixtures de test après garde v30

Les deux workflows CI du dernier commit avant cette correction sont encore en échec (`Vérification I0`, `SMN — Paquet Windows pilote`) ; les trois jobs Windows/PostgreSQL/paquet échouent et les journaux détaillés retournent toujours `BlobNotFound`. Cause précise indéterminée.

Une incompatibilité vérifiable du code a été corrigée dans cinq fixtures de tests (`holiday-ics-import`, `holiday-csv-import`, `national-calendar-validation`, `national-holiday-manual`, `country-lifecycle`) : les doubles SQL simulent maintenant le résultat `schema_version=30,ready=true` **uniquement** pour la requête de garde contenant `to_regclass('public.smn_country_name_audit')`. La garde applicative n'est pas contournée ni modifiée. Tests non exécutés ; résultats CI à contrôler au nouveau commit.
