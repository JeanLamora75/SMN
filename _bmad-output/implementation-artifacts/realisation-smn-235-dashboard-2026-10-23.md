---
project: SMN
date: 2026-10-23
story: SMN-235
parent_epic: SMN-1
related: [SMN-21, SMN-83, SMN-84, SMN-85]
deployment_branch: main
status: implementation-published-awaiting-local-verification
---

# SMN-235 — Raccordement objectifs, capacités et Story Points au dashboard

## Périmètre implémenté sur `main`

Le Sprint effectif du header est résolu dans une transaction PostgreSQL **REPEATABLE READ READ ONLY** puis une projection collective récupère ses objectifs, points et capacités. Les informations affichées dans `cycle-overview.tsx` suivent toutes la même sélection `cycleId`.

### Composants

- `src/server/dashboard/read-only-db.ts` : connexion dédiée en transaction cohérente, sans DDL ni mutation.
- `src/server/dashboard/cycle-reader.ts` : contrôle de l'appartenance du Sprint à l'équipe active puis lecture des données ; disponibilité des tables vérifiée avec `to_regclass`. Aucun `ensure...Schema` appelé.
- `src/server/capacity/actual.ts` : prise en charge optionnelle d'une transaction externe afin de réutiliser le moteur de calcul réel sans `BEGIN/COMMIT` imbriqués ; les autres appels conservent le comportement initial.
- `src/app/app/page.tsx` : lecture Sprint/contenu dans **la même transaction** et transmission au cockpit.
- `src/app/app/cycle-overview.tsx` : objectifs multiples et états, capacité initiale/réelle (J/H), SP initialement engagés et réalisés, provenance lorsque disponible.
- `src/app/dashboard.css`, `src/i18n/fr.json`, `src/i18n/en.json` : lisibilité des KPI et traductions.
- `tests/smn-235-dashboard-projection.test.ts` : tests ajoutés pour les clôtures Vn, accès équipe, zéro/null, objectifs multiples, rendu FR et bornes `[start,end)`.

### Traçabilité des critères

| AC Jira | Réponse apportée | Vérification nécessaire |
| --- | --- | --- |
| AC1 | Une résolution serveur du Sprint et une transaction unique pour les valeurs du dashboard ; contrôle `s.id + s.team_id + installation`. | Test intégration avec deux Sprints réels et changement de `cycleId` |
| AC2 | Lecture des objectifs de `smn_sprint_goal` avec état et identité ; liste multiple ; accès vers la liste des Sprints. | Vérifier l'accès final à la fiche de chaque objectif, encore non publiée comme page dédiée |
| AC3 | Sources `initial_sp` et `done_sp` uniquement ; `added/removed/final` non substitués. | Comparaison avec le formulaire SP |
| AC4 | `smn_capacity_initial_snapshot` et `readActualCapacity` collectivement projetés, unité J/H et indication Saisie/Calcul. | Vérifier les périodes et les tables de capacité réelles du poste, et l'impact des réunions exceptionnelles |
| AC5 | Distinction `available(0)`, `not-recorded`, `unavailable` ; `smn_sprint_closure_snapshot` version Vn la plus récente pour `status=closed`, sans lecture de valeur courante. | Scénarios V1/V2 de clôture/réouverture avec données corrigées |
| AC6 | Périmètre équipe/installation côté SQL, droit de lecture collective côté page, aucun membre individuel sérialisé. | Recette des rôles admin/user et inspection des réponses serveur |
| AC7 | Tests ciblés écrits ; historique et absence de producteurs des comparaisons explicitement distincts. | `pnpm typecheck`, tests Node et vérification navigateur FR/EN sur Windows |

## Détails de lecture et cas particuliers

1. **Clôture:** si `s.status=closed`, sélectionner `smn_sprint_closure_snapshot` par `version DESC LIMIT 1`. Les champs `goals`, `storyPoints` et `capacity` du document JSONB original sont projetés ; en leur absence, afficher une indisponibilité historique, **pas** une valeur reconstruite.
2. **Sprint ouvert/rouvert:** lire `smn_sprint_goal` et `smn_sprint_story_points` si les tables existent. Une absence de ligne SP produit « Non renseigné » ; une ligne contenant `initial_sp=0` montre bien zéro.
3. **Capacité initiale:** afficher uniquement l'instantané de l'ouverture correspondant à la période. Ne pas recalculer une capacité initiale absente.
4. **Capacité réelle:** utiliser `readActualCapacity` avec `externalTransaction:true` pour respecter la transaction du dashboard. L'échec d'une lecture de capacité n'efface **pas** les SP/objectifs : savepoint PostgreSQL et état « Non disponibles ». Le moteur peut lire des données individuelles en interne, mais seule la métrique agrégée est transmise au composant.
5. **Bornes temporelles:** le cycle utilise `[start_at,end_at)` tandis que le moteur de capacité utilise `[start_on,end_on]` ; la fin inclusive du calcul correspond à l'instant `end_at-1ms` dans le fuseau du Sprint.
6. **Qualité:** la provenance `Saisie`/ `Calcul` et le fait d'être figé en Vn sont rendus visibles. Les sources actuelles ne portent pas toutes un indicateur `estimated` fiable ; aucune qualité « estimée » n'est inventée.
7. **Autres blocs:** Tickets, jours ouvrés restants, événements, obstacles, risques, notes/alertes et comparaisons sont volontairement laissés à SMN-236/237/238 et SMN-86.

## Recette Windows recommandée

Après synchronisation de `main` via GitHub Desktop :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-235-dashboard-projection.test.ts tests/dashboard-data-contract.test.ts tests/dashboard-cycle-overview.test.ts tests/dashboard-cycle-overview-source.test.ts tests/smn-header-sprint-context.test.ts
pnpm dev
```

Parcours manuel :
- Sprint en cours : enregistrer deux objectifs, engagement initial 8 SP, 5 SP réalisés et vérifier ces valeurs dans le dashboard.
- Passer à un Sprint futur sans données : les valeurs vides ne doivent **pas** être transformées en zéro.
- Écrire explicitement 0 SP sur un Sprint de test : le 0 doit être affiché.
- Renseigner et/ou calculer les capacités J/H sur une période puis comparer le résultat avec le panneau de capacité.
- Si possible, clôturer un Sprint de test avec V1, rouvrir, corriger puis reclôturer V2 et vérifier que le dashboard historique utilise V2 sans altérer V1.
- Changer de compte admin/user et vérifier le même agrégat collectif sans exposer d'absences nominatives.
- Refaire au moins une vérification en anglais.

**Les commandes de vérification et la recette PostgreSQL sur le poste Windows n'ont pas été exécutées dans cette session.** GitHub Actions étant indisponible dans l'environnement du projet, leur succès ne peut être supposé. Aucun Sprint ni donnée historique n'a été modifié dans le dépôt par ce changement de code.

## Réserves à suivre

- En l'absence de certaines tables du moteur de capacité, le KPI réel est indiqué indisponible sans casser les autres KPI. Un diagnostic détaillé sur PostgreSQL pourra être nécessaire si l'utilisateur observe ce cas.
- L'UX n'a pas encore de fiche individuelle dédiée de chaque objectif depuis le dashboard : le lien renvoie pour l'instant vers la liste des Sprints.
- Le cockpit n'effectue aucune comparaison avec le Sprint précédent ; SMN-86 et raccordement transversaux demeurent à réaliser.

**Livraison :** modifications publiées directement sur `main` selon la préférence utilisateur. **Statut Jira :** aucun passage à Terminé sans preuve de recette locale.
