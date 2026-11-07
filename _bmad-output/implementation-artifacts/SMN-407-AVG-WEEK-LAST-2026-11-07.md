# SMN-407 — AVG_WEEK_LAST(TAG, X) : moyenne hebdomadaire proratisée

**Statut :** implémentation publiée sur `main`, tests et recette à vérifier.  
**Jira :** https://lmn24.atlassian.net/browse/SMN-407  
**Base métier :** SMN-376 — fonctions historiques v33.  
**Arbitrage :** option A validée par l'utilisateur le 07/11/2026.

## 1. Expression et formule

`AVG_WEEK_LAST(TAG, X)` retourne le ratio entre la **somme des valeurs** du tag pour les X derniers cycles et la **somme de leurs durées** en semaines calendaires exactes.

```
AVG_WEEK_LAST(TAG, X)
  = SUM(valeur(TAG, cycle) sur la fenêtre)
    / (SUM(nombre de jours calendaires du cycle) / 7)
```

Par exemple, 40 + 45 + 35 = 120 SP sur 14 + 21 + 14 = 49 jours, soit 7 semaines : **17,14 SP/semaine**. Une période de 10 jours vaut **10/7 semaine**, pas 2 semaines entamées.

## 2. Règles validées

- Fenêtre : les X derniers cycles **jusqu'au cycle sélectionné inclus**, y compris en cours, jamais les cycles ultérieurs. Si moins de X existent, tous ceux disponibles sont pris en compte.
- Le calcul temporel utilise les dates des cycles stockées dans PostgreSQL et exploite la différence de dates calendaires **début inclus, fin exclue**, conformément aux intervalles de cycles du moteur v33. Calcul de la durée en UTC sur les dates métier, indépendamment des décalages horaires et de l'heure d'été.
- Résultat de la somme divisée par **la somme des durées**, pas moyenne arithmétique des ratios individuels (ce serait un poids égal accordé à des cycles de durée différente).
- Valeurs du cycle en cours : valeur courante, y compris sa réévaluation dans le calcul ; cycles Scrum clos : les snapshots v33 font autorité, pas la base modifiée depuis la clôture.
- Valeur absente dans un cycle de la fenêtre : résultat indisponible (`missing_source`) ; zéro réel conservé ; durée absente, nulle, négative ou non entière : `invalid_domain`. Jamais de division par zéro silencieuse.
- Précision du calcul via `DecimalEngine` (24 décimales internes) ; précision de présentation limitée à deux décimales selon les règles d'affichage SMN.
- Identifiants d'indicateurs et dépendances : le TAG est résolu via le catalogue existant, ce qui permet les formules imbriquées. Isolation par équipe et modes Scrum/Kanban, sans nouvelle table ni modification PostgreSQL.
- Les budgets existants restent applicables : 1 à 1000 cycles pour X, 1000 cycles maximum dans la résolution historique, 512 nœuds AST.
- Aucun rapport historique déjà émis n'est réécrit.

## 3. Impacts d'architecture

- `src/server/indicators/formula/index.ts` : nouvelle fonction dans le parser / AST / registre historique.
- `src/server/indicators/formula/history.ts` : calcul `somme des valeurs × 7 ÷ somme des jours`, sans flottants.
- `src/server/indicators/formula/historical-context.ts` : dates métier, durées de cycle Scrum et Kanban, respect des snapshots.
- `src/server/indicators/recalculation.ts` : déclenchement de recalcul historique global quand cette fonction est présente.
- `src/app/app/admin/settings/indicators/expression-guide.tsx` : explication, recherche et copie dans l'onglet Expressions.
- `tests/smn-407-avg-week-last.test.ts` : tests de syntaxe, fenêtre, dates, historique et précision.

## 4. Validation

Exécuter `pnpm exec tsx --test tests/smn-407-avg-week-last.test.ts`, `pnpm typecheck`, les suites historiques existantes, puis vérifier les contrôles Linux et Windows dans la CI. Une recette sur PostgreSQL Windows avec des sprints de 10, 14 et 21 jours doit confirmer la valeur métier affichée et l'actualisation du Dashboard Builder.

L'existence de ce document et des tests ne signifie pas que la recette réelle PostgreSQL ou l'affichage utilisateur sont déjà validés.
