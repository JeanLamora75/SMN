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


## Complément du 28 octobre 2026 — inventaire Git exhaustif

**Vérification effectuée :** comparaison individuelle de chacune des 87 branches de PR ouvertes contre `main` via `compare_commits` du connecteur GitHub. Aucun commit fusionné par l'audit.

- **73 PR avec `ahead_by=0` et aucun fichier divergent contre `main`** : #57–88 (32), #127–138 (12), #147–171 (25), #208–211 (4). Leur historique de commits est déjà ancêtre de `main`. Attention : cela ne prouve pas la recette ni l'état Jira.
- **14 PR avec commits absents de `main` :** #102 (8 commits, 4 fichiers), #190 (17, 11), #191 (30, 19), #192 (42, 24), #193 (57, 31), #194 (73, 35), #195 (94, 43), #196 (103, 47), #197 (112, 51), #198 (121, 55), #199 (156, 73), #200 (164, 76), #201 (171, 81), #204 (280, 221).

**Interprétation :** les PR Pays sont empilées, donc leurs nombres de commits/fichiers ne doivent pas être additionnés. La branche terminale #201 inclut les ancêtres de la chaîne ; la qualification doit porter sur le diff consolidé et les conflits avec la dernière version de `main`.

**Règles d'action :** (1) ne pas remerger les 73 PR historiquement intégrées ; (2) ne les fermer qu'après rapprochement Jira/équivalence fonctionnelle ; (3) reconstruire sur `main` des branches de consolidation pour Pays, Multiéquipes et Cérémonies ; (4) exécuter les tests, lint, typage, build et recette avant toute fusion.

**Statut :** inventaire exhaustif des historiques Git achevé ; audit fonctionnel et exécution des tests non achevés. Aucune PR fermée ni fusionnée par cette étape.


## Audit approfondi Pays — branche terminale #201

Comparaison Git réalisée contre `main` : **171 commits d'avance**, **693 de retard**, **81 fichiers divergents**. Ancêtre commun `55d72dcabee1cb250af6874bde80cda33d0d7e8a`.

Sur les **300 fichiers modifiés dans main** depuis cet ancêtre, **7 chemins chevauchent les 81 fichiers de la branche Pays** :

1. `prisma/schema.prisma` — risque de divergence de schéma, migrations et génération de client.
2. `src/app/api/admin/members/[id]/lifecycle/route.ts` — risque sur gestion des membres et permissions.
3. `src/app/api/admin/members/route.ts` — risque sur création / lecture des membres.
4. `src/i18n/en.json` — traductions.
5. `src/i18n/fr.json` — traductions.
6. `src/server/installation/contract.ts` — risque sur versionnement et prérequis du schéma.
7. `src/server/members/quick-create.ts` — risque de régression création rapide.

Il reste **74 fichiers modifiés uniquement dans la branche Pays**, à intégrer ou écarter après revue de leur impact et de leurs dépendances. L'absence de chevauchement de chemin ne garantit pas l'absence de conflit sémantique (API, SQL, types, rapports).

### Préconisation d'intégration

- Ne pas fusionner directement #201 : la branche contient 171 commits historiques et les 7 recouvrements ci-dessus.
- Construire une branche propre depuis `main`, intégrer les fichiers Pays propres par lots (API/SQL, composants UX, tests), puis réconcilier manuellement les sept fichiers communs.
- **Ne pas écraser** `schema.prisma` ni le contrat d'installation de `main`. Ajouter uniquement les évolutions absentes, avec migration versionnée et compatibilité du schéma actuel.
- Vérifier les droits administrateur et les références de calendrier des membres, puis lancer i18n/lint/typecheck/tests/build et recette PostgreSQL.
- Aucun code de la branche Pays n'a été fusionné pendant cet audit.
