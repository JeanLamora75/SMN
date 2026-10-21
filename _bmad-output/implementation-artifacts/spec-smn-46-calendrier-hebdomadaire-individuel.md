# SMN-46 — Story 3.5 : Calendrier hebdomadaire individuel

**Références :** [SMN-46 dans Jira](https://lmn24.atlassian.net/browse/SMN-46) · Epic 3 · FR-8 / FR-61 · D-PRD-013 · AD-12/14/16 · D-PRD-137 (équipe unique). Langues FR/EN centralisées.

## Contrat des critères d'acceptation

**AC1 — Semaine suggérée, non présumée :** chaque fiche membre centrale peut lire `DEFAULT_WEEK` (lundi–vendredi matin et après-midi travaillés ; samedi–dimanche non travaillés). La première consultation **ne crée pas** d'enregistrement de disponibilité. Avant enregistrement explicite, `configured=false`, `current=null`, disponibilité `status=missing` : la suggestion visuelle ne signifie pas « horaires confirmés ». Le **temps contractuel** de l'identité (`smn_member.contract_percent`) reste séparé de la trame.

**AC2 — Demi-journées et exceptions :** représentation fixe des 7 jours ISO `[{weekday:1..7,morning:boolean,afternoon:boolean}]`. Chaque combinaison est valide (journée complète, matin seul, après-midi seule, aucun créneau). Une exception datée portant ses propres booléens et une note facultative se substitue, pour **cette date uniquement**, aux créneaux hebdomadaires applicables. Les dates/valeurs sont strictement contrôlées en interface, en API et par les contraintes PostgreSQL. Les exceptions **ne créent aucune absence**.

**AC3 — Source centrale :** les deux collections `smn_member_calendar_week` et `smn_member_calendar_exception` pointent vers `smn_member.id`, et non vers `smn_member_assignment.id`. Validation en base de l'appartenance de cette fiche à l'équipe singleton via `smn_member_batch.team_id`. Les anciennes et futures affectations de SMN-44/45 réutiliseront cette source, sans duplication de personne ni création d'équipe. L'Administrateur seul peut lire/écrire le détail individuel ; archivage en lecture seule.

**AC4 — Date d'effet et conservation :** les trames sont versionnées avec `revision`, `effective_from`, auteur et horodatage. L'édition ajoute **une ligne nouvelle**, jamais d'UPDATE/DELETE des versions existantes. La date d'effet de la nouvelle version doit être >= date PostgreSQL courante **et** >= date d'effet de la dernière révision ; les corrections le même jour ajoutent une révision supplémentaire. Pour une date D, la résolution sélectionne la dernière trame dont `effective_from <= D`, puis l'exception de date D dans sa dernière révision si présente. Les futures versions ne modifient pas les jours passés. **Aucun cliché de capacité historique déjà figé n'est recalculé** : l'incrément ne touche pas les tables de capacité.

**AC5 — Donnée absente visible :** `status=missing`, `slots=null`, `absenceDays=null`, `developmentCapacityJh=null` pour une date sans trame réellement enregistrée applicable. Dès qu'une trame est applicable, ses créneaux sont connus mais les absences et capacités restent **null / non calculables** (il manque pays/jours fériés, absences, moteur de capacité). Aucune donnée zéro inventée. Les jours non travaillés valent `morning=false,afternoon=false` seulement si un calendrier enregistré les décrit.

## Architecture technique

- **Migration additive PostgreSQL v12 → v13** : `src/server/members/calendar-migration.ts` et son miroir exact `prisma/migrations/20261021_smn46_member_calendar/migration.sql`. Tables `smn_member_calendar_week`, `smn_member_calendar_exception` et index d'accès. Clés étrangères vers les membres en `ON DELETE RESTRICT` : suppression historique interdite (alignement SMN-45).
- **Moteur privé :** `src/server/members/calendar.ts`. Validation allowlist, semaines ISO à 7 éléments, date civile ISO, limites de révisions/exception, résolution datée indépendante des affectations, transactions `BEGIN/COMMIT/ROLLBACK` avec verrou sur la fiche centrale, comparaison de `revision` pour prévenir l'écrasement concurrent.
- **API Administrateur :** `GET /api/admin/members/[id]/calendar` (option `?onDate=YYYY-MM-DD`) retourne proposition, versions, date résolue et état explicite. `POST` accepte `{action:"weekly",revision,effectiveFrom,days}` ou `{action:"exception",revision,onDate,morning,afternoon,note}`. Auth/RBAC serveur, contrôle d'origine du POST et JSON privé non mis en cache. Modifications d'un membre archivé refusées.
- **UI :** `src/app/app/admin/members/member-calendar-editor.tsx`, accessible depuis `quick-members-admin.tsx`. Sept jours × deux cases, date d'effet, exception spécifique, avertissements, historique, chargement/erreurs, abandon des saisies, textes `src/i18n/fr.json` et `en.json`.
- **Cohérence inter-Stories :** `src/server/members/lifecycle.ts` compte les références aux calendriers avant de proposer une suppression. Schéma Prisma, `ensureAccountsSchema`, diagnostic/sonde et relations autorisées mis à jour pour v13.

## Décisions conservatrices

La conservation des jours passés est garantie par absence de mutation des lignes versionnées ; le support du recalcul d'une disponibilité passée pour une nouvelle date de cycle reste un besoin distinct (FR-14) et ne doit pas altérer les références historiques figées. L'enregistrement d'une exception n'est pas une absence/congé : la création d'absences catégorisées et nommées est traitée dans une Story dédiée. Les pays, régions, jours fériés et calculs en JH ne sont pas simulés.

Le modèle complet d'équipes multiples SAFe est exclu du MVP Scrum/Kanban (D-PRD-137). Les versions/temps contractuels restent indépendants ; pas de modification des taux membres, affectations ni rôles depuis ce calendrier.

## Qualité et recette

Tests unitaires **rédigés** dans `tests/member-calendar.test.ts` : defaults, demi-journées, dates, exceptions, versions futures, conflits, absence de capacité inventée, archive, rollback, contraintes migratoires. Scénario HTTP/PostgreSQL ajouté à `scripts/verify-http-ci.mjs` (403 Utilisateur, suggestion non enregistrée, séquence v1/v2, exception, projection de date et SQL).

Les commandes `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et la recette Windows 11 / PostgreSQL 18.6 **doivent être réellement exécutées**, sur base pilote. Statut Jira « En cours » tant que cette preuve est absente. Le lanceur natif BMAD `uv run --no-cache` n'est pas exécuté ici faute de checkout local ; développement manuel via connecteurs en respectant les contrats, sans prétendre à une validation native BMAD.
