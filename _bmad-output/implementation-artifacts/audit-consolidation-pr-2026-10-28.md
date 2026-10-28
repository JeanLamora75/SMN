# Audit de consolidation des Pull Requests — SMN

**Date :** 28 octobre 2026  
**Référence :** GitHub `JeanLamora75/SMN`, branche `main`  
**Statut :** audit exploratoire documenté ; **aucune fusion autorisée**.

## Inventaire

L'API GitHub retourne **87 PR ouvertes, toutes en brouillon**. Trois ciblent directement `main` (#102, #190, #204) ; les autres forment majoritairement des chaînes empilées sur des branches intermédiaires.

| Périmètre | PR | Nombre | Diagnostic |
|---|---|---:|---|
| Sprints / cérémonies | #57–88 et #102 | 33 | Branches échantillonnées #57, #59, #70, #80, #88 : `ahead_by=0`, `files=0` contre main. #102 : 8 commits d'avance, 4 fichiers dans la comparaison |
| Registres | #127–138 | 12 | #127, #128, #135, #138 : `ahead_by=0`, `files=0` |
| Studio Rapports / PDF | #147–171 | 25 | #147, #150, #160, #171 : `ahead_by=0`, `files=0` |
| Pays / calendriers nationaux | #190–201 | 12 | #190 : 17 commits d'avance, 11 fichiers ; #195 : 94 commits d'avance ; #198 : 121 commits d'avance ; #201 : 171 commits d'avance, 81 fichiers. Toutes comparaisons divergent de main |
| Multiéquipes | #204 | 1 | 280 commits d'avance et 291 de retard, 221 fichiers ; risque de conflit élevé |
| Liens / ressources | #208–211 | 4 | #208, #209, #211 : `ahead_by=0`, `files=0` |

**Important :** chiffres relevés à l'instant de l'audit. Les comparaisons `ahead_by=0` indiquent une histoire de branche déjà ancêtre de `main`, mais n'attestent ni la validation fonctionnelle ni le bon état des stories Jira. Tous les numéros de ces groupes n'ont pas été comparés individuellement ; les conclusions sont limitées aux PR explicitement échantillonnées.

## Décisions provisoires

1. **Ne rien fusionner immédiatement.** Les PR sont toutes en brouillon, et les vérifications de compilation, de schéma et de recette ne sont pas établies globalement.
2. **PR historiquement intégrées (candidates à clôture après rapprochement Jira) :** contrôler chacune des chaînes Sprints, Registre, Studio et Liens. Ne pas fusionner à nouveau des branches avec `ahead_by=0`.
3. **Pays #190–201 :** chaîne non intégrée, à isoler et rebaser progressivement sur `main` ; préserver le code Paramètres (PR #206 déjà fusionnée). Priorité : schéma SQL, calendriers nationaux, archive/validation annuelle, anciens liens, migration et droits.
4. **Multiéquipes #204 :** ne pas fusionner telle quelle. Inventorier les 221 fichiers, séparer les changements réellement absents des 291 commits divergents de `main`, et reconstruire une branche consolidée sur `main`.
5. **Cérémonies #102 :** comparer les quatre fichiers avec les règles de jours ouvrés déjà en production ; ne garder que la différence fonctionnelle vérifiée.
6. **Liens #208–211 :** vérifier la présence réelle des modules, APIs et migrations dans `main`, puis fermer les PR devenues sans effet après confirmation.

## Critères impératifs avant fusion

- Relecture de la diff contre la branche `main` actuelle ; absence d'écrasement de modifications récentes.
- Contrôles `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` exécutés, avec résultats conservés.
- Vérifications PostgreSQL et migrations versionnées, sans modification de données métier ni secrets pendant l'audit.
- Contrôles serveur des droits, Scrum/Kanban, multiéquipes et compatibilité des routes.
- Recette Windows des parcours touchés, conformité UX SMN-298, justification explicite des anomalies.
- Accord utilisateur avant fusion de chaque lot qualifié ; ne pas marquer une story `Done` par simple présence de commits.

## Ordre de traitement recommandé

1. Finaliser l'inventaire individuel (87 PR) et rapprochement avec `main`/Jira.
2. Clôturer uniquement les PR formellement démontrées redondantes.
3. Qualifier séparément #102, puis #190–201 par incréments.
4. Auditer et reconstituer #204 sans écraser `main`.
5. Lancer la recette technique et fonctionnelle finale.

**Aucune PR n'a été fusionnée ni fermée par cette campagne d'audit.**
