# SMN-234 — D0 : audit technique de la fiche Sprint

**Date :** 23 octobre 2026. **Statut :** audit documentaire effectué ; code et tests non exécutés. **Epic :** SMN-228. **Référence :** [SMN-234](https://lmn24.atlassian.net/browse/SMN-234).

## Périmètre et méthode

Lecture directe sur GitHub `main` des pages Next.js, services PostgreSQL, routes API, permissions, contrat d'affichage et tests existants. Confrontation au [contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md). **Aucun développement, migration, test pnpm, recette navigateur ou exécution du moteur local BMAD n'a été effectué.** Environnement : connecteurs GitHub/Jira sans checkout local exécutable ; procédure BMAD adaptée pour l'audit documentaire.

## 1. Résultats sur la route et le contexte

| Source | Fait vérifié et usage D1 |
|---|---|
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Fiche **réelle** déjà accessible ; lecture seule du nom, des dates, de l'état et des objectifs. Elle utilise `currentAccount`, `readCollectiveDashboard`, `readSprintContext`, `readCycleDashboard`. Ne pas créer de seconde route. |
| `src/app/app/admin/sprints/sprint-index-view.tsx` | Le nom de chaque Sprint est **déjà un lien réel** vers sa fiche par `sprintDetailPath(item.id)`. |
| `src/server/sprints/context.ts` | SELECT de tous les Sprints non supprimés de l'équipe de l'installation, sans limite ni écriture, contrôle par `teamId`. La fiche fait `find(item.id===sprintId)` et retourne 404 si absent. |
| `src/lib/sprint-context.ts` | `effectiveSprintStatus` calcule un état affiché sans réécrire l'état stocké ; les mutations restent régies par le statut serveur. |
| `src/server/dashboard/read-only-db.ts` | Transaction `REPEATABLE READ READ ONLY`, adaptée aux projections de la fiche qui ne font pas de DDL. |
| `src/server/dashboard/cycle-reader.ts` | Projections liées à un seul Sprint, snapshot de clôture Vn ou données courantes ; la borne `endAt` est exclusive et les dates d'affichage suivent le fuseau IANA. |
| `src/lib/dashboard-data-contract.ts` | Distingue `available`, `not-recorded`, `unavailable` ; ne pas convertir source absente en zéro ni inventer des éléments. |
| `src/app/app/bootstrap-icon.tsx` | Composant Bootstrap présent, **icône `pencil-square` absente** de l'union des noms ; D1 doit l'ajouter avec licence correspondante. |

**Contrat D1 recommandé :** préserver `/app/admin/sprints/[sprintId]`, le contrôle de session et d'équipe à chaque entrée ; bandeau compact réel, sept onglets Objectifs / Cérémonies / Capacité / Indicateurs / Registres / Tendances / Bilan ; sans Synthèse. Un seul ID contextuel, aucun sélecteur concurrent, aucun faux bouton d'édition.

## 2. Autorisations : point de sécurité important

`src/server/access-policy.ts` : rôle **admin** pouvant lire/écrire selon les gardes ; rôle **user** limité à `read collective` et incapable de `write`. La fiche actuelle utilise précisément `read collective`. Les GET des anciennes API `/api/admin/sprints/goals`, `story-points`, `tickets`, `trends`, `attendance`, `review-capacity` exigent **`read settings`**, réservé à l'admin. **Ne pas ouvrir ces GET à user par simple relâchement des autorisations.** Pour la consultation, créer des lectures collectives sécurisées sans données personnelles ; les mutations admin réutilisent les API déjà gardées.

La politique d'accès aux **noms et capacités individuels des membres** reste à spécifier pour D5 : ne pas transmettre une réponse nominative à un rôle insuffisamment autorisé en espérant la masquer côté navigateur.

## 3. Matrice fonctionnelle et écarts

| Lot | Réemploi existant | Écart concret |
|---|---|---|
| **D1 Bandeau / onglets** | Fiche existante, `context.ts`, `cycle-reader.ts`, `sprint-detail-path.ts`, `bootstrap-icon.tsx` | Ajouter le vrai `pencil-square` ; liens d'édition vers commandes réelles uniquement. Renommage : `PATCH /api/admin/sprints/[id]` ; replanification : `POST` aperçu puis `PATCH` confirmation `/api/admin/sprints/reschedule` avec jeton. |
| **D2 Objectifs** | `src/server/sprints/goals.ts` : `smn_sprint_goal`, titre, évaluation, commentaire, révision et audit ; GET/POST admin | La projection collective n'inclut que titre/évaluation. Nouvelle lecture sécurisée pour éventuel détail public ; pas de sélecteur Sprint répété. |
| **D3 Indicateurs** | `story-points.ts` (F01–F04, `deriveStoryPoints`, audit), `ticket-counts.ts` (F10/F11, audit), GET/PUT existants | I01/I02 non persistés à ce stade ; F12 à calculer ; afficher F05/F06/F07/F12 immédiatement en brouillon, sans écrire avant confirmation. |
| **D4 Cérémonies** | `events-reader.ts` ; `attendance.ts`, `actual-duration.ts`, `exceptional-meetings.ts`, route réelle `/app/team-calendar/meeting/[kind]/[id]` | Les lecteurs dashboard courant/historique renvoient au plus **5** événements. La fiche doit en lire **tous**, avec pagination. `attendance.ts` connaît scheduled/held/not_held/cancelled et `status_explicit` ; `classifyEventStatus` ne reconnaît pas not_held. La page Réunion standard affiche actuellement `unknown` à la place du statut : réparation D4. Ajournée/reportée à arbitrer. |
| **D5 Capacité** | `src/server/capacity/engine.ts` : `MemberCapacity.totalJh` et jours ventilés, affectations, absences, calendriers ; `review-capacity.ts` | `totalJh` signifie **J/H de développement, pas J/H de présence**. Définir et calculer la présence séparément, ainsi que son droit d'affichage nominatif. |
| **D6 Tendances** | `src/server/sprints/trends.ts` : trois séries G05, G06, G07, au plus cinq clôtures de la même équipe ; rendu tabulaire actuel | Trois graphiques + alternative accessible. Le lecteur appelle `ensureClosureSchema()` (DDL) : ne pas l'utiliser tel quel dans une transaction READ ONLY ; isoler une lecture SELECT-only. |
| **D7 Bilan** | `src/server/sprints/closure.ts` : versions et snapshots de clôture Vn | Les deux textes Analyse / Analyse IA indépendants, leurs versions et leur provenance ne sont pas encore produits ; génération IA Epic 9 différée. |
| **D8 Registres** | Projection dashboard `cycle-reader.ts` et six registres spécifiés par Epic 5 | Producteurs et snapshots qualitatifs encore à livrer ; afficher explicitement indisponible jusque-là, sans faux zéro ou fausses notes. |

**Compatibilité lecture seule :** plusieurs anciens GET métier appellent `ensure*Schema` (création/altération idempotente) — notamment les lectures d'objectifs, de SP et de tendances. Ils sont impropres à être invoqués directement dans `REPEATABLE READ READ ONLY` : créer des lecteurs SELECT-only ou réutiliser la projection déjà sûre. Ne pas effectuer de migrations lors de la simple consultation.

**Statuts et historique :** la routine `reconcileAttendance` peut inférer « tenue » d'une réunion passée non explicitement qualifiée. D4 devra distinguer la source implicite de `status_explicit=true` ; pour Sprint clôturé ou reconstitué, ne jamais remplacer le snapshot historique par les valeurs actuelles.

## 4. Tests existants et futurs

Régression utile déjà codée : `tests/smn-header-sprint-context.test.ts`, `smn-230-sprints-index.test.ts`, `smn-235-dashboard-projection.test.ts`, `smn-236-sprint-tickets-working-days.test.ts`, `smn-237-dashboard-events.test.ts`, `sprints-refonte-etape0.test.ts`, `access-guards.test.ts`, `authorization.test.ts`, `development-capacity.test.ts`.

**À ajouter par lot, tests définis mais NON exécutés :**
- D1 : ID réel/hors équipe, rôles admin/user, dates IANA/DST, 7 onglets et focus clavier, crayons et prévisualisation des mutations, zéro/nul/indisponible, FR/EN.
- D2 : 0/1/n objectifs, évaluation, révision, refus en clôture.
- D3 : 8 entrées, F05/F06/F07/F12, dénominateur nul, dépassement 100 %, valeur vide, note 1–5, enregistrement et annulation.
- D4 : toutes les réunions, pagination (>200), statut tenu explicite/implicite, non tenue, annulée, date de report, faux historique interdit.
- D5 : membres à temps partiel, affectations intermittentes, absences, demi-journées, fériés, confidentialité.
- D6 : 0–5 clôtures, même équipe, Vn, absence de points et tableau accessible.
- D7 : deux sauvegardes indépendantes, droits, historique, provenance humaine/IA.
- D8 : six familles, fenêtre d'activité, multi-Sprints, version historique, disponibilité partielle.

Vérifications de livraison à effectuer localement après chaque lot : `pnpm typecheck`, `pnpm exec tsx --test ...`, `pnpm build`, `pnpm i18n:check`, recette Chrome desktop/mobile FR/EN. GitHub Actions indisponible. **Aucune de ces commandes n'a été exécutée lors de D0.**

## 5. Décision de passage à D1

**D0 documentaire terminé, sans réalisation de code. D1 peut commencer** indépendamment des arbitrages des lots D3–D8. Réutiliser la route et le contexte existants ; préserver l'affichage actuel des objectifs en les transférant sous Objectifs ; rendre les sept onglets navigables, avec état indisponible honnête sur ceux non encore raccordés ; créer l'icône `pencil-square` Bootstrap et les actions d'édition **réellement opérantes** sous garde-fous serveur.

**À résoudre avant D3–D8 :** modalités I01/I02, statut ajournée/reportée, définition et droits J/H présence, conservation des versions des deux analyses, arrivée des producteurs Epic 5.

**Conclusion :** la source est connue, les dépendances et les tests sont identifiés ; aucune Story supplémentaire ni migration n'est nécessaire pour commencer la structure D1. La conformité effective reste conditionnée aux tests et à la recette visuelle. D0 n'est pas un « done » de la Story SMN-234.
