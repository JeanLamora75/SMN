# SMN-61 — Story 3.20 — Qualifier la fiabilité des capacités historiques

**Jira :** https://lmn24.atlassian.net/browse/SMN-61 · **Epic 3** · **Dépendances :** SMN-57 à SMN-60, qualité des périodes historiques et futur Epic 8.

## Invariants de conception

Une qualification rétrospective porte sur **une équipe et une période exacte (start_on/end_on)**, sans créer ou rouvrir une période de Sprint. Elle **ne modifie jamais** le cliché de capacité initiale `smn_capacity_initial_snapshot` (SMN-59), le cliché de réalisé clôturé `smn_capacity_actual_snapshot` (SMN-60), les capacités manuelles SMN-58 ou les PDF et exports précédemment produits.

Deux notions distinctes sont visibles : le **niveau de fiabilité** (`known` = Connue, `estimated` = Estimée, `not-supplied` = Non renseignée) et le **mode de la capacité réelle** (`Saisie` ou `Calcul`). La connaissance d'un réalisé n'est pas une preuve de capacité prévue initiale.

## Critères d'acceptation

- **AC1 — Période rétrospective sans preuve :** un GET sur une période passée sans enregistrement retourne `quality="not-supplied"`, `qualifiedJh=null`, `revision=0`. Aucune insertion n'a lieu à la consultation, aucune référence actuelle SMN-57 ne sert à reconstruire un faux prévisionnel initial. L'éventuel cliché immuable SMN-59 conserve sa valeur originale, y compris « Non renseigné ».
- **AC2 — Connue :** une saisie historisée fournit **valeur numérique (0 inclus)**, qualité `known`, type de source `document`, `import` ou `other` et référence identifiable (3–500 caractères) + justification (5–1000 caractères). La catégorie `reconstruction` est **interdite** avec `known`. La source et la qualité sont indépendantes du mode Calcul/Saisie du réalisé SMN-60. La véracité des preuves déclarées par l'Administrateur reste à vérifier humainement ; l'application assure leur traçabilité, pas une certification automatique.
- **AC3 — Estimée :** les valeurs reconstituées à partir de données partielles sont stockées avec `quality="estimated"` et leur méthode `source_kind="reconstruction"` ou autre référence explicite ; elles restent **Estimées** même si `qualifiedJh` est parfaitement numérique. Aucune requalification automatique et aucun écart numérique présenté comme certain pour une estimation.
- **AC4 — Prévue inconnue, réelle connue :** le panneau peut montrer le réalisé SMN-60 (`retainedJh`) **indépendamment** lorsque la qualification historique est `not-supplied`. L'écart rétrospectif `réalisé − prévu sourcé` n'est affiché que si la capacité historique est **Connue** et le réalisé est connu sur une période **terminée/clôturée** ; il est explicitement distinct de l'écart avec l'engagement initial SMN-59. Dans tous les autres cas : `null`/« Non calculé », jamais 0 fictif.
- **AC5 — Correction d'estimation :** toute action de qualification (`known`, `estimated`, `not-supplied`) est versionnée et auditée avec ancien et nouvel état JSON, références de source, justification, acteur, horodatage et révision. Pas de suppression : une remise à « Non renseignée » est une **nouvelle révision**, sans effacer l'histoire. Les 100 dernières révisions sont consultables par l'UI, et la totalité demeure stockée. Un trigger SQL rejette UPDATE/DELETE sur les lignes d'audit. Les clichés historiques et les fichiers exportés ne sont ni modifiés ni régénérés.

## Implémentation

- **Migration additive v24 → v25** : tables `smn_capacity_historical_quality` et `smn_capacity_historical_quality_history`. Contraintes PostgreSQL sur qualité/source/valeur, unicité par équipe et dates inclusives, FK Restrict, historique append-only. Prisma, moteur de migration, sonde et diagnostic v25.
- **Service** `src/server/capacity/historical.ts` : `parseHistoricalInput`, `comparisonJh`, `readHistoricalQuality`, `saveHistoricalQuality`. Lectures en transaction REPEATABLE READ READ ONLY ; corrections verrouillées par `FOR UPDATE OF t` et révision optimiste. Seules les périodes dont la date de fin est **strictement antérieure à la date métier serveur Europe/Paris** sont modifiables.
- **API** `GET/POST /api/admin/capacity-history` authentifiée via `authorizeApi` members:read/write, pour l'Administrateur, avec contrôle d'origine des mutations, codes 400/409/503.
- **Interface** `src/app/app/admin/development-capacity/historical-capacity-panel.tsx`, depuis le calcul de capacité : fiabilité, valeur, source, justification, historique de correction, réalisé indépendant et comparaison conditionnelle. Traductions centralisées `fr.json`/`en.json`.
- **Tests** `tests/capacity-historical-quality.test.ts` : AC1–5, zéro explicite, contrôle des preuves, absence de faux écart, garde de période historique et conflit de révision.

## Frontières et qualification

L'application **n'édite pas** les snapshots figés SMN-59/60 : même une valeur historique connue ultérieurement est une **annotation qualifiée rétrospectivement**, pas la capacité originale à l'ouverture. Le statut « Connue » signifie ici *source déclarée identifiable* et ne prouve pas à lui seul l'exactitude documentaire. Il n'y a pas de recalcul ou de republication des PDF existants. La création des Sprints historiques est du périmètre de l'Epic 8.

**Vérifications à effectuer :** tests pnpm, compilation/typecheck, migration réelle PostgreSQL 18.6, contrôle SQL du trigger et recette navigateur. Les contrôles statiques GitHub et les tests écrits ne constituent pas une validation exécutée. GitHub Actions indisponible, pas utilisé. Jira **En cours**, BMAD `review` jusqu'à recette. Workflow BMAD Amelia adapté aux connecteurs ; scripts `uv` non exécutés depuis le poste utilisateur.
