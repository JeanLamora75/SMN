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
