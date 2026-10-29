# Lot A — Contrat du schéma PostgreSQL v32 (audit du 29 octobre 2026)

## Référence et invariants

- Référence du socle : `prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql`.
- La base v32 utilise 32 migrations terminées, validées par `src/server/installation/diagnostic.ts`.
- `smn_team.agile_mode` est du type `text`, non nullable, contraint à `scrum` ou `kanban`.
- `smn_team.is_archived` est du type `boolean`, non nullable, valeur par défaut `false`.
- À partir de la v31, `smn_company_closure.company_id` remplace `team_id`. Les clés étrangères doivent être validées.
- Le contrôle est en lecture seule. Ne pas modifier rétroactivement le SQL des migrations v30, v31 ou v32.

## Corrections publiées

- A-01 : `src/server/db/probe.ts` inspecte les attributs et contraintes du mode Agile v32.
- A-02 : le même fichier inspecte les références et la nullabilité introduites avec le catalogue entreprise v31.
- Tests : `tests/schema-v32-structural-guards.test.ts` et `tests/schema-v32-audit-baseline.test.ts`.

## A-03 — Inventaire initial confirmé des DDL à l'exécution

| Fichier | DDL observés | Remarque |
| --- | --- | --- |
| `src/server/registries/automatic-highlights.ts` | `CREATE TABLE IF NOT EXISTS smn_automatic_highlight_settings` | Écriture de paramètres |
| `src/server/reports/templates.ts` | `CREATE TABLE IF NOT EXISTS smn_report_template`; `ALTER TABLE ADD COLUMN IF NOT EXISTS` | Gestion de modèles |
| `src/server/reports/draft-notes.ts` | `CREATE TABLE IF NOT EXISTS smn_report_draft` et `smn_report_draft_audit` | Notes de rapport |

Cet inventaire n'est pas exhaustif. Ne jamais supprimer ni déplacer un DDL à l'exécution tant que l'existant n'a pas été étudié et que la migration de remplacement n'a pas été définie, testée et exécutée sur une copie de base.

Une migration post-v32 devra :
1. Préserver les données et les contraintes existantes.
2. Vérifier la forme réelle et les variantes des tables éventuellement déjà créées.
3. Réaliser les adaptations de façon transactionnelle et journalisée.
4. Faire échouer explicitement les prérequis incompatibles.
5. Retirer le DDL à l'exécution seulement une fois la migration déployée et testée.

## A-04 — Compatibilité future

Le diagnostic autorise explicitement les versions de schéma de 1 à 32. Une migration v33 devra mettre à jour de façon coordonnée :
- la migration SQL et son script d'application ;
- le journal Prisma et les contrôles d'empreinte ;
- la liste des versions diagnostiquées et les prérequis du nouveau schéma ;
- les tests et le workflow CI.

Ne pas accepter indistinctement toute version supérieure à 32 : une version inconnue doit rester détectable.

## Vérifications restantes avant clôture du lot A

- Inventaire exhaustif des DDL dynamiques sur le dépôt, au-delà des trois fichiers ci-dessus.
- Exécution du typage, du lint et des tests en CI.
- Vérification sur une installation PostgreSQL réelle v32 (diagnostic, contraintes, scénarios sans données et avec données).
- Contrôle des règles de permissions et absence de modifications implicites au lancement.
- Revue des faux positifs et des contrôles de contraintes catalogues avant généralisation.

**État : travaux de sécurisation publiés, audit du lot A non clos.**


## Préparation de migration contrôlée A-03 (sans écriture sur la base)

Exécuter `pnpm exec tsx scripts/audit-runtime-ddl-v32.ts` dans une copie du dépôt : l'inventaire examine tous les fichiers suivis par Git avec extension .ts/.tsx/.js/.mjs/.cjs/.sql. Les résultats sont écrits sous `audit-output/`, pas dans PostgreSQL.

**Limite du scanner :** il repère des motifs DDL littéraux, y compris des faux positifs de commentaires et de tests ; les chaînes construites dynamiquement nécessitent une revue manuelle. Le résultat n'a pas encore été exécuté sur un checkout complet dans cet environnement.

**Stratégie de migration après v32 :**
1. Recenser et classer toutes les occurrences DDL réellement exécutables ; identifier leurs fonctions appelantes.
2. Exporter la définition canonique de chaque table depuis les SQL d'origine (y compris contraintes, index, références et audit).
3. Construire une migration **v33 explicitement déclenchée** et non un lancement implicite ; prévoir sauvegarde et contrôles des tables préexistantes avant toute transformation.
4. Comparer les structures actuelles par catalogues PostgreSQL et refuser les divergences non prévues ; ne jamais utiliser `DROP` ou `TRUNCATE` comme réparation automatique.
5. Exécuter une transaction contrôlée et journalisée ; valider l'empreinte SQL, l'état des contraintes et l'isolation avant COMMIT.
6. Modifier seulement ensuite les services métiers pour supprimer leurs DDL et retourner une erreur de schéma explicite lorsque les tables nécessaires sont absentes.
7. Tester sur deux installations : v32 sans table différée et v32 avec données historisées dans ces tables. Vérifier également le rollback et la non-modification au démarrage.

Cette préparation **ne constitue pas une migration exécutable**. Aucune v33 ne doit être appliquée avant le contrôle des données réelles.

## Analyse CI du 29 octobre 2026

Sur le run `40907675714`, les erreurs observées dans les journaux sont :
- TypeScript TS7006 sur quatre lecteurs de fichiers de tests v32 (paramètre `p` implicite).
- ESLint `react-hooks/set-state-in-effect` dans `country-calendar-modal.tsx`, ligne 318, à la suite du montage du portail React.
- Plusieurs échecs de tests dont les assertions attendent des schémas v28–v31 ou un contenu textuel du probe antérieur à son renforcement.
- Une assertion incorrecte dans le nouveau test A-02 recherchait `!snapshot.companySchemaValid` dans le probe plutôt que dans le diagnostic.

Les quatre annotations TypeScript, le montage du portail et les assertions A-01/A-02 ont été corrigés sur `main`. Les autres régressions de tests des modules Links, Registres, Rapports demandent un traitement indépendant : distinguer contrat historique volontaire et comportement attendu en v32.

**Attention :** aucune CI verte n'est attestée au titre du lot A à ce stade.


## Classification réelle de l'artefact GitHub Actions du 29 octobre 2026

L'exécution `40909396354` du workflow d'inventaire a réussi : 1 397 fichiers texte suivis inspectés, 611 occurrences de motifs DDL détectées. Classification des 611 occurrences d'après l'artefact JSON téléchargé :

| Groupe | Occurrences |
|---|---:|
| Migrations SQL versionnées (`prisma/migrations/`) | 193 |
| Tests et fixtures (`tests/`) | 136 |
| Scripts CLI/maintenance (`scripts/`) | 12 |
| Déclarations de migrations dans les services (`src/server/**/migration*.ts`) | 37 |
| DDL potentiels dans le code applicatif hors fichiers `migration*.ts` | 233 |
| **Total** | **611** |

Le dernier groupe comprend **103 chemins de fichiers distincts**, mais le nom `migration` dans les chemins est seulement un critère lexical : une validation des appels exécutables reste indispensable. L'inventaire n'est pas une preuve de 233 opérations exécutées.

### Règle de sécurisation avant extraction

- Priorité aux DDL déclenchés au cours d'un GET/PATCH/POST ou à la connexion, et aux `ALTER TABLE` du code métier.
- Ne pas modifier l'empreinte des migrations v30–v32.
- Ne pas retirer de DDL à l'exécution avant qu'une migration explicite et versionnée garantisse l'existence et la conformité des objets sur une base comportant déjà des données.
- Refuser les dérives de schéma sans perte de données ; aucune réparation automatique destructive.
- Une éventuelle v33 doit être un chantier de migration distinct, accompagné d'un jeu de tests PostgreSQL réels et d'un plan de reprise.

Cette classification résulte de l'artefact archivé du workflow et ne remplace pas un audit manuel des 103 fichiers potentiellement concernés.


## Migration explicite des quatre premières tables différées (v32)

**Ordre de déploiement obligatoire :** mettre à jour le dépôt puis, **avant le démarrage du nouveau code métier**, exécuter :
`pnpm exec tsx scripts/apply-deferred-schema-v32.ts --apply`
Ensuite : `pnpm db:diagnose`.

Le script crée transactionnellement et sans suppression :
- `smn_automatic_highlight_settings`
- `smn_report_template` (avec `history_depth` et `revision`)
- `smn_report_draft`
- `smn_report_draft_audit`

Les services `automatic-highlights.ts`, `templates.ts` et `draft-notes.ts` n'exécutent plus de création de table. La migration conserve `schema_version=32` : ces tables figuraient déjà parmi les objets différés autorisés du contrat v32. Il ne s'agit PAS d'une migration Prisma v33 ; une consolidation ultérieure du versionnement demeure nécessaire.

**Précaution :** la validation des schémas préexistants est encore partielle (colonnes et présence) ; comparer également types, contraintes et clés étrangères avant d'exécuter sur une base contenant des historiques. Sauvegarder la base. Les autres DDL dynamiques inventoriés restent à extraire.


## Sous-lot Cérémonies — extraction de neuf producteurs de DDL

Les créations de structure ont été déplacées depuis les services suivants :
`ceremonies.ts`, `ceremony-templates.ts`, `lunch.ts`, `ceremony-edits.ts`,
`exceptional-meetings.ts`, `template-occurrences.ts`, `attendance.ts`,
`actual-duration.ts` et `calendar-meeting-reschedule.ts`.

Le script explicite `scripts/apply-ceremony-schema-v32.ts` regroupe 32 instructions SQL
transactionnelles, créant ou complétant les tables des cérémonies, modèles, occurrences,
réunions exceptionnelles, historique des changements, présences, durées réelles,
déplacements et pauses déjeuner. Les fonctions `ensure*Schema` concernées ne
créent plus de tables ; elles vérifient leur présence.

**Préparation impérative avant le lancement de l'application modifiée :**
1. Sauvegarder PostgreSQL.
2. Vérifier `pnpm db:diagnose` sur une base initialisée v32.
3. Exécuter explicitement `pnpm exec tsx scripts/apply-ceremony-schema-v32.ts --apply`.
4. Exécuter `pnpm exec tsx scripts/apply-deferred-schema-v32.ts --apply` pour les quatre tables de rapports / registres déjà extraites.
5. Relancer le diagnostic et tester les cérémonies, modèles, plannings, absences, modifications et historique.

Ce script de matérialisation ne modifie pas `schema_version` : ces tables figuraient
déjà dans le périmètre des relations différées acceptées en v32.
**Validation restant à effectuer :** essais PostgreSQL réels avec données historiques,
contrôles de types/contraintes au-delà de la seule présence des tables,
et CI du dernier commit. Ne pas déployer ce nouveau code sur une base non migrée.


### Cérémonies — deuxième passage, état des extractions

La migration explicite `scripts/apply-ceremony-schema-v32.ts` contient désormais **40 instructions SQL**
extraites de **12 services**, notamment les modèles, réunions exceptionnelles, occurrences,
historisation des statuts, durées réelles, cadence, création en lot et impacts de capacité.
Le test `tests/ceremony-explicit-schema-v32.test.ts` vérifie leur absence de DDL métier.

**Reste à sécuriser dans le sous-lot :** `calendar-meeting-outcomes.ts` crée
`smn_calendar_meeting_outcome_link` et un index. Cette table référence
`smn_registry_item`, qui peut être elle-même créée à la demande. L'extraction
doit donc être coordonnée avec la migration des Registres pour éviter de référencer
une table inexistante. Ne pas supprimer ce dernier DDL avant de résoudre cette dépendance.

**Limite actuelle :** script transactionnel non encore exécuté sur PostgreSQL réel ;
les vérifications sur structures déjà présentes et la CI du dernier commit restent
à confirmer. `CREATE TABLE IF NOT EXISTS` n'est pas à lui seul un contrôle complet
d'intégrité des contraintes et des types.


### Dépendance Cérémonies / Registres : résultats de réunion

La création de `smn_calendar_meeting_outcome_link` et de son index a été retirée
de `src/server/sprints/calendar-meeting-outcomes.ts` et placée dans
`scripts/apply-meeting-outcome-schema-v32.ts`. Migration additive, transactionnelle,
verrouillée, réservée aux installations v32 initialisées, **avec précondition
`smn_registry_item` présente**. Ordre impératif : matérialiser les tables de Registres,
puis lancer `pnpm exec tsx scripts/apply-meeting-outcome-schema-v32.ts --apply`,
avant le démarrage du nouveau service de résultats de réunion.

**Limite à résoudre au lot Registres** : `createMeetingOutcome` appelle toujours
`ensureRegistrySchema`, qui peut créer d'autres structures dynamiquement. Le
dernier DDL directement détenu par ce service a été retiré, mais la chaîne d'appel
n'est pas entièrement débarrassée des DDL tant que le lot Registres ne l'est pas.
Le résultat de CI et l'application PostgreSQL réelle sont encore à confirmer.


### Cérémonies — suppression de la création indirecte du registre

La création d'un résultat de réunion ne déclenche plus `ensureRegistrySchema` (et donc ses
créations de schéma métier), mais vérifie explicitement la présence de
`smn_registry_item`, `smn_registry_item_audit` et
`smn_calendar_meeting_outcome_link`. Le script de migration des résultats
requiert aussi les deux tables de registre. La fonctionnalité échoue sans modifier
le schéma si l'une manque : matérialiser les registres **avant** cette migration.

Cette séparation ne garantit pas encore la complétude des migrations Registres ;
la CI et une restauration de données historiques sous PostgreSQL réel restent
indispensables avant déclaration de conformité complète.


## Module Calendrier — revue initiale des DDL

Revue des services : calendrier central, calendriers équipe et membre, absences,
plages de travail, jours fériés, déplacement et résultats des réunions.
Les onze services principaux couverts par
`tests/calendar-runtime-ddl-audit.test.ts` n'exécutent plus de DDL directs.
Le test empêche leur réintroduction.

**Exception isolée :** `src/server/sprints/reschedule.ts` possède encore un
`CREATE TABLE IF NOT EXISTS smn_sprint_reschedule_audit`, dans un parcours
historique limité à `schema_version<=27`. Il ne faut ni l'intégrer
aveuglément à une migration v32 ni supprimer la table d'audit :
une migration compatible avec ces anciennes installations doit être conçue
et testée séparément avant retrait.

Ce passage ne constitue pas une validation PostgreSQL réelle : les dépendances
transitives des services et l'ensemble des tests calendaires restent à vérifier.
