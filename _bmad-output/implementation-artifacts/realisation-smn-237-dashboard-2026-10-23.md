---
project: SMN
language: fr
date: 2026-10-23
story: SMN-237
epic: SMN-1
parent_ux: SMN-21
deployment_branch: main
status: implementation-published-awaiting-windows-recette
---

# SMN-237 — Raccordement des événements et cérémonies au tableau de bord

## Objectif

La colonne **Événements** du suivi opérationnel du Sprint sélectionné doit devenir une vue réelle des occurrences de réunions de ce même Sprint, sans ajout, modification, déplacement ni régénération. La consultation d'un cycle passé clôturé doit restituer la version figée Vn et non reconstruire le passé depuis les réunions courantes.

## Code implémenté sur `main`

| Source / composant | Adaptation |
| --- | --- |
| `src/server/dashboard/events-reader.ts` | Nouveau lecteur PostgreSQL **strictement SELECT** ; union conditionnelle des sources réellement présentes, compteur exact et cinq éléments max, tri privilégiant les futurs pour un Sprint en cours. |
| `src/server/dashboard/cycle-reader.ts` | Branchement des événements dans la projection collective déjà protégée par la transaction `REPEATABLE READ READ ONLY` de SMN-235. La lecture de calendrier dispose de sa propre savepoint, afin qu'un échec n'efface pas objectifs/JH/SP. |
| `src/server/sprints/closure.ts` | Les **futures clôtures** conservent `generation_source` des cérémonies historiques et des occurrences de modèles ; aucune clôture préexistante n'est réécrite. |
| `src/app/app/operational-overview.tsx` | La colonne Événements montre les noms, dates locales, statuts, éventuelle provenance reconstituée, compte réel et liens vers fiches. Les trois autres colonnes restent en attente de SMN-238. |
| `src/app/app/page.tsx` | Transmission des événements du **même Sprint sélectionné** et de son fuseau IANA. |
| `src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx` | Retour vers le Sprint d'origine, **uniquement si** `teamId/cycleId` demandés correspondent à la réunion autorisée et réellement liée à ce Sprint. |
| `src/lib/dashboard-data-contract.ts` | Ajout de `recorded-events` dans les provenances, sans présenter les événements générés comme saisies manuelles. |
| `src/app/dashboard.css`, `src/i18n/fr.json` et `en.json` | Style responsive et états/labels traduits. |
| `tests/smn-237-dashboard-events.test.ts` | Scénarios sans base réelle (lecteur simulé, instantanés, compteur, cinq événements, i18n et liens). |

## Règles métier

1. **Sources courantes :** `smn_scrum_template_occurrence` (réunions provenant des modèles actifs lors de la génération), `smn_sprint_exceptional_meeting` (exceptionnelles) et `smn_sprint_ceremony` (historique de test). Les tables absentes ne sont jamais créées à la consultation.
2. **Périmètre :** la couche `readCycleDashboard` vérifie l'identité du Sprint, l'appartenance à l'équipe et l'installation courante **avant** la lecture des événements. Aucune donnée individuelle n'est sélectionnée.
3. **Tri :** pour un Sprint encore en cours ou futur, horaires à partir du moment de consultation en priorité, puis événements antérieurs récents. Pour un Sprint déjà terminé, derniers événements en premier. **Maximum cinq** dans la carte, mais compteur exact de toutes les occurrences persistées reliées au Sprint.
4. **État :** `scheduled/planned` = « Prévue », `held/done/completed` = « Tenue », `cancelled/canceled` = « Annulée », tout autre état ou champ absent = « Statut non renseigné ». `reconstructed` est un indicateur distinct qui **ne vaut jamais preuve de tenue**.
5. **Clôture :** si le Sprint est `closed`, lire `ceremonies`, `customMeetings` et `exceptionalMeetings` de la **dernière version Vn** de `smn_sprint_closure_snapshot`, sans requêter les réunions courantes. Les instantanés antérieurs sans `generation_source` indiquent provenance inconnue (pas une provenance « standard » inventée).
6. **Vacuité :** au moins une source installée et un décompte confirmé de 0 → « Aucun élément à ce jour ». Aucune table productrice → « Indisponible ». Erreur de lecture → « Indisponible » même si le cycle et les autres KPI restent exploitables.
7. **Navigation :** le détail `/app/team-calendar/meeting/{kind}/{id}` et le calendrier reçoivent le contexte `teamId/cycleId` ; la fiche autorise un retour au Sprint uniquement sur correspondance avec la réunion chargée en base. Une consultation n'écrit rien.
8. **Déploiement :** aucun changement de schéma SQL, aucune migration ou création de cérémonie. Les nouvelles clôtures incluent un renseignement supplémentaire de provenance. Les anciennes occurrences et snapshots restent intacts.

## Traçabilité des critères de Jira SMN-237

| Critère | Réalisation | Vérification supplémentaire |
| --- | --- | --- |
| AC1 | Trois producteurs connus, lecture des réunions enregistrées uniquement | Recette via calendrier de l'équipe et réunion exceptionnelle |
| AC2 | Ordre adapté à la période, exact `total`, cinq items | Test de 6+ événements avec Sprint actif puis passé |
| AC3 | États distincts ; étiquette « Reconstituée (non attestée) » si source connue | Reprise historique et Vn créée après le correctif |
| AC4 | Liens réels et retour au même cycle vérifié par la fiche | Tester `teamId/cycleId` forgé |
| AC5 | État vide fiable distinct de panne ou schéma manquant, droits vérifiés en amont | Recette comptes admin / utilisateur lecture |
| AC6 | Tests unitaires statiques et simulations SQL ajoutés, code FR/EN | Typecheck, tests complets et recette PostgreSQL Windows à exécuter |

## Vérifications et limites

Le dépôt a été inspecté et les fichiers publiés directement sur `main` sur demande explicite de l'utilisateur. **Aucun test Node/Next.js/PostgreSQL réel n'a été exécuté depuis ChatGPT**, et le statut « Terminé » de Jira n'est pas revendiqué. GitHub Actions peut ne pas être disponible dans le contexte SMN.

Commandes PowerShell recommandées :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-237-dashboard-events.test.ts tests/smn-235-dashboard-projection.test.ts tests/dashboard-cycle-overview-source.test.ts tests/dashboard-shell-ux.test.ts
pnpm test
pnpm dev
```

Recette navigateur : sélectionner un Sprint avec Daily/Review/Rétro issues des modèles, vérifier cinq événements au maximum et « Voir tout » ; créer une réunion exceptionnelle puis actualiser ; vérifier qu'un Sprint à venir présente ses propres événements, qu'un Sprint clos montre Vn et que les anciens événements ne bougent pas. Tester les deux langues et les deux rôles.

**Limite documentée :** les instantanés Vn créés avant cet ajout ne comportent pas toujours `generation_source`. Ils conservent le nom, les horaires et le statut figés, mais la provenance « reconstituée » peut être inconnue : ne pas prétendre la connaître a posteriori. Le calendrier central lui-même peut continuer à proposer un filtre général non contextualisé ; les paramètres de contexte du lien sont conservés pour la navigation et la fiche de réunion.
