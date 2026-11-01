# SMN-344 — Persistance et recalcul différentiel des indicateurs

Date : 1er novembre 2026. Livraison Amelia sur `main`.

## Contrat livré

Le service `src/server/indicators/recalculation.ts` calcule les indicateurs via le graphe SMN-342, les sources manuelles SMN-343 et les sources calendaires préparées par le futur adaptateur SMN-345.

- Une écriture par `(team_id,cycle_type,cycle_id,indicator_id)` dans `smn_indicator_computed_result`, à l'aide de `NUMERIC` et de chaînes décimales ; aucune conversion en `Number` pour les valeurs métiers.
- États discriminés : `available` (valeur non NULL) ; `unavailable` (valeur NULL, motif et, si pertinent, tag de dépendance directe). Les motifs sont `missing_source`, `division_by_zero`, `dependency_unavailable` et `invalid_domain`.
- Chaque calcul stocke `formula_revision` de la définition active au moment de l'opération, dans la même transaction.
- Le graphe est chargé par opération, sans cache global. Le moteur évalue les sources cachées, désactivées ou archivées si une formule en dépend.
- Recalcul sélectif : choisir les cycles effectivement impactés via `cycles`, et les indicateurs affectés par les tags via `changedIndicatorIds` / `changedCalendarTags`. Sans liste de cycles, le service considère conservativement tous les cycles non supprimés et non archivés de l'équipe, indépendamment de leur statut. Sans liste de tags changés, il recalcule toutes les formules. Les dépendants transitifs sont inclus.
- Budgets : jusqu'à 1 000 cycles par invocation et 100 000 couples cycle × indicateur, en plus des budgets mathématiques et graphe de SMN-341/342.
- Un seul `COMMIT` ou `ROLLBACK` couvre tous les cycles et toutes les valeurs de la requête. Les équipes et cycles sont contrôlés côté serveur. Verrou global avant verrou de cycle.
- `recalculateIndicatorResultsWithinTransaction` ne prend pas possession de la transaction. `recalculateIndicatorResults` ouvre et ferme sa propre transaction pour les opérations autonomes.

## Intégration SMN-343

`writeManualValues` appelle désormais `recalculateIndicatorResultsWithinTransaction` sur **le même pg.Client et la même transaction**, avec le cycle courant et les identifiants manuels modifiés. Une erreur du calcul annule aussi toutes les valeurs saisies, la révision de cycle et la révision globale. Il n'existe pas de nouvelle table d'historique.

## Périmètre différé

- La résolution des données du calendrier (absences, jours fériés, fermetures, capacités) et la coordination transactionnelle avec les opérations calendrier/entreprise relèvent de SMN-345. Les tags sont définis mais les valeurs n'en sont jamais inventées.
- La simulation avec contrôle de révision globale avant publication relève de SMN-346.
- L'API d'écriture manuelle demeure protégée par les habilitations administrateur existantes. Aucun endpoint public non autorisé de recalcul n'a été créé.
- Aucune migration de la base personnelle `smn` (v32) n'est faite.

## Preuves de recette attendues

`pnpm db:test:smn-344` sur PostgreSQL v33 temporaire : cycles Scrum clôturés, actifs et planifiés, période Kanban clôturée, précision des valeurs, version de formule, motifs d'indisponibilité, dépendance directe, recalcul calendaire ciblé, équipes isolées et rollback si la seconde écriture échoue.

`pnpm db:test:smn-343` : non-régression et recalcul en transaction commune après saisie manuelle.

`pnpm typecheck`, `pnpm lint`, workflow CI [Vérification I0](https://github.com/JeanLamora75/SMN/actions). Les étapes PostgreSQL isolées SMN-343 et SMN-344 ont réussi dans [GitHub Actions 41294641514](https://github.com/JeanLamora75/SMN/actions/runs/41294641514). Leur succès ne signifie pas que la totalité des jobs de la CI globale a réussi. Les tests locaux Windows ne sont pas présumés.

## Liens
- [SMN-344](https://lmn24.atlassian.net/browse/SMN-344)
- [SMN-343](https://lmn24.atlassian.net/browse/SMN-343)
- [Architecture indicateurs](SMN-IND-ARCHITECTURE-CONSOLIDEE.md)

## Recette de rollback commune
Le test d'intégration provoque une erreur de trigger durant le recalcul déclenché par une saisie manuelle ; le service annule également la valeur saisie et la révision de cycle. Il n'existe aucun COMMIT partiel.
