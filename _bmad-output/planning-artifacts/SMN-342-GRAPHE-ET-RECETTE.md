# SMN-342 — Dépendances des indicateurs et tags calendaires

## Périmètre livré (01/11/2026)

- Module pur `src/server/indicators/dependencies/index.ts` : chargement des deux tables v33 `smn_indicator_definition` et `smn_indicator_dependency`, analyse AST des tags, vérification de concordance formule ↔ arêtes SQL, validation des tags calendaires, construction des dépendances directes et inverses, tri topologique **Kahn itératif avec tas**, détection des cycles et sélection des impacts transitifs.
- Les définitions archivées restent chargées afin que leurs valeurs puissent être utilisées dans les calculs historiques ; l'activation/visibilité UI ne filtre pas les sources du graphe.
- Moteur `evaluateDependencies` : évalue dans l'ordre topologique les indicateurs calculés concernés ; sources manuelles préchargées, sources calendaires fournies par l'appelant ; aucune SQL/IO pendant les formules et aucun cache global.
- `missing_source` distinct de zéro ; une indisponibilité de source calculée devient `dependency_unavailable` avec le **tag direct**.
- Le registre technique initial des tags est `CAL_WORKING_DAYS`, `CAL_WORKING_HOURS`, `CAL_PUBLIC_HOLIDAYS`, `CAL_ABSENCE_DAYS`, `CAL_CLOSURE_DAYS`, `CAL_CAPACITY_JH`. **Attention : nomenclature technique à confirmer contre l'adaptateur calendrier lors de son implémentation ; les valeurs ne sont ni inventées ni calculées dans SMN-342.** Les tags calendaires ne sont pas ajoutés au catalogue SQL.
- Sécurité : entrées bornées à 10 000 définitions et 100 000 arêtes, expressions bornées par SMN-341 ; toute incohérence échoue avec `DependencyGraphError`. L'orchestrateur de transactions et la persistance des résultats ne font pas partie de SMN-342.

## Tests

`pnpm test:smn-342` : topologie stable, cascade incluant sources non visibles, impact des changements calendrier, propagation NULL et `dependency_unavailable`, cycle et sources invalides, contradiction formule/SQL, grands DAG itératifs, lecture SQL, absence de cache partagé.

`pnpm test:smn-341-342` : moteur de formules, graphe, TypeScript et ESLint.

**Aucune exécution locale des nouveaux tests n'est attestée à cette date** : passage en Terminé réservé aux résultats réels de la recette Windows. La base `smn` reste en version 32, aucune migration effectuée.

## Liens
- [SMN-342](https://lmn24.atlassian.net/browse/SMN-342)
- [SMN-338 DDL](SMN-338-DDL-ADDITIF-DRAFT.sql)
- [Architecture consolidée](SMN-IND-ARCHITECTURE-CONSOLIDEE.md)
