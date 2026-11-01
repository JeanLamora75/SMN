# SMN — Avenant BMAD : blocs d'indicateurs dynamiques du tableau de bord

**Date :** 2026-11-01. **Statut :** revue architecturale (rôle Winston) : compatible sous réserves techniques explicites, implementation non attestée. **Périmètre :** Scrum/Kanban multiéquipes ; SMN-349 et SMN-351.

## Décisions fonctionnelles validées
- Préserver les cartes Capacité et Jours ouvrés restants.
- Remplacer les anciennes restitutions Story Points, Tickets et I01/I02 par trois blocs dynamiques fixes : Story Points (4 positions), Tickets (2 positions), **Indicateurs complémentaires** (2 positions).
- Afficher chaque bloc même si tous ses emplacements sont inoccupés. Distinguer « emplacement non configuré », valeur métier NULL, résultat indisponible et zéro réel.
- Configuration par équipe, écran `dashboard`, indicateur, bloc et position. Affectation explicite, jamais déduite du tag ou de l'unité. Un indicateur affecté une seule fois par équipe/écran ; ordre par position. Une valeur masquée ou archivée ne doit pas apparaître.
- Préserver styles, accessibilité, FR/EN, thème clair/sombre et isolation des équipes.

## Revue Winston : contradictions et résolution requise
1. **Préférences v33 existantes** : `smn_indicator_display_preference` ne contient que `is_visible`, `display_order`, `display_style`. L'affectation en bloc est une nouvelle notion : ajout nullable `dashboard_block` + `dashboard_position`, *uniquement* pour `screen_key='dashboard'`, avec CHECK sur le domaine `story_points|tickets|complementary`, borne 4/2/2 et unicité partielle `(team_id,screen_key,dashboard_block,dashboard_position)` pour les positions affectées. Adapter la contrainte aux lignes masquées afin qu'une désactivation ne bloque pas une nouvelle affectation ; éviter que la réactivation écrase la nouvelle occupation. L'opération d'affectation/réordonnancement doit être **transactionnelle**, avec révision et contrôle serveur. Aucune requalification des tags Fxx/Ixx.
2. **Migration** : ne pas modifier directement une base v33 en production sans migration versionnée, `--check`, sauvegarde, rollback de sécurité, adaptation de la baseline native et comparaison installation neuve/migrée. Revoir l'orchestrateur `db:upgrade` et le contrat `schema_version=33` avant de décider d'une version supérieure : éviter une rupture de toutes les gardes d'accès v33.
3. **Cycles clôturés** : `readIndicatorReporting` lit actuellement les valeurs live v33 ; il faut spécifier et tester la lecture des instantanés de clôture quand ils existent, sans recalculer ni réécrire de snapshot. Une migration de la seule présentation ne modifie jamais un historique. Si les instantanés v33 n'incluent pas une valeur demandée, afficher un état historique indisponible, sans réinterpréter silencieusement la valeur courante.
4. **Démantèlement** : les appels `KpiMetricPair` historiques SP/Tickets et `KpiSprintScores` sont encore actifs dans `cycle-overview.tsx`, alors que `IndicatorReporting screen="dashboard"` est rendu séparément dans `page.tsx`. Remplacer les anciens blocs au sein de `CycleOverview`, supprimer l'affichage parallèle et conserver Capacité/Jours ouvrés. Supprimer les anciens lecteurs uniquement après audit KEEP/ADAPT/DROP SMN-351 et tests de régression hors tableaux de bord.
5. **Absence de configuration** : lors de l'activation, aucun auto-classement arbitraire. Les blocs sont vides tant que l'utilisateur n'a pas affecté ses indicateurs. Une sélection active ne suffit pas à occuper un bloc.

## Contrat de projection
Service de lecture autorisé sur (teamId, cycleType, cycleId, screen='dashboard') renvoyant exactement 3 blocs et 8 positions, dans un ordre stable. Chaque position expose `indicatorId/tag/name/unit/displayStyle/value/state` ou `null`. Le front ne fait aucun calcul métier et n'invente pas de valeur. Réutiliser les lectures v33 et la politique de clôture, contrôler RBAC côté serveur, éviter la fuite de données interéquipe.

## Découpage et acceptation
**B01** migration additive + API d'affectation avec conflit, positions uniques et limite 4/2/2 ; **B02** projection v33 et snapshots ; **B03** widgets Cockpit Agile, édition des préférences, i18n, responsive ; **B04** retrait de l'ancienne restitution et audit SMN-351.

Critères : (1) trois blocs et 8 positions toujours affichés ; (2) un seul indicateur par position et au plus une position par indicateur ; (3) ordre et équipe respectés ; (4) zéro ≠ NULL ≠ indisponible ≠ vide ; (5) aucune valeur héritée injectée implicitement ; (6) accès refusé hors équipe ; (7) clôture et reclôture sans perte des versions ; (8) installation neuve et migration convergentes ; (9) aucun KPI historique supplémentaire ; (10) tests TypeScript, ESLint, i18n, unitaires, PostgreSQL et recette Windows conservés comme **preuves à produire**.

## Verdict
**CONCERNS — architecture compatible sur le principe, mais conditions de migration/snapshot non résolues dans le code.** La présente revue ne prétend pas provenir de l'exécution autonome d'un agent Winston ou du skill BMAD introuvable. **Gate avant implémentation :** vérifier concrètement les contraintes DDL v33, le format des snapshots et l'orchestrateur de migration ; ne pas faire de DROP d'anciennes tables pendant ce lot.

## Implémentation B01–B04 publiée le 01/11/2026 — état non recetté
- **B01** : table `smn_indicator_dashboard_slot` avec clés par équipe, bloc et position ; contrainte 4/2/2, unicité d'un indicateur par équipe, API d'affectation et éditeur dans les préférences « Tableau de bord ». Migration additive `scripts/apply-dashboard-slots.ts --check|--apply`, intégrée à l'installation native v33 et reconnue par le diagnostic sans changer `schema_version=33`.
- **B02** : `readDashboardCockpit` renvoie toujours huit positions ; lecture de `indicatorsV33` depuis la dernière version du snapshot des Sprints Scrum clôturés. Valeur `null`, zéro et indisponibilité distincts ; récupération de la période Kanban sélectionnée.
- **B03** : `DashboardIndicatorBlocks` affiche les trois blocs du cockpit et leur contenu ; Capacité et Jours ouvrés restent conservés.
- **B04** : appels des anciennes tuiles SP/Tickets/I01/I02 et affichage tabulaire dynamique parallèle retirés du cockpit. Les lecteurs historiques partagés et les anciennes tables ne sont **pas supprimés**, conformément à SMN-351.
- **Tests ajoutés** : `tests/smn-dashboard-bmad-contract.test.ts`, `tests/smn-dashboard-bmad-pg.test.ts`; readiness BMAD ajustée.
- **À vérifier localement** : `pnpm typecheck`, `pnpm lint`, tests statiques, test PostgreSQL utilisant une base temporaire ; `pnpm exec tsx scripts/apply-dashboard-slots.ts --check`.
- **Attention** : installation existante requiert la migration additive explicite après sauvegarde vérifiée. Aucun script de migration n'a été exécuté via GitHub. Recette PostgreSQL, validation CLI et preuve d'installation neuve/migrée restent à obtenir avant qualification terminée.
