# SMN-327 — Inventaire initial des contrôles de versions et du mode Agile

Date : 29 octobre 2026. Source : branche `main`, lecture des fichiers du dépôt.
État : **inventaire ciblé documenté**, non exhaustif pour les 866 fichiers TS/TSX du dépôt. Aucune API modifiée par cette Story à ce stade.

## Objectif et méthode
Repérer les gardes `schema_version`, `version <= N`, tableaux de versions, et les usages de `smn_installation.mode` susceptibles de casser une API lors du passage v32 → v33. Priorité aux points d'entrée auth, équipes, calendrier, sprints, Kanban, tableaux de bord et paramètres.

## Inventaire confirmé — zones prioritaires

| Domaine | Fichier | Constat | Traitement préconisé |
|---|---|---|---|
| Authentification | `src/server/accounts/migration.ts` | borne `version<=32`, vérifications selon versions | contrat de schéma central + vérification d'intégrité distincte; préserver les étapes de migration |
| Diagnostic | `src/server/installation/diagnostic.ts` | liste explicite v1–v32 et nombreux `isVn` | catalogue des migrations et capacités; garder contrôles de checksum |
| Équipe autorisée | `src/server/teams/resolve.ts` | deux gardes v28–v32 et repli mode global `i.mode` | adopter capacité `multi-team` et `per-team-agile-mode`; le repli ne vaut que pour les anciennes versions |
| Écriture équipe | `src/server/teams/write.ts` | garde explicite v28–v32 et contrôle du mode global | contrôle de capacité + autorisation, séparation historique |
| Administration équipes | `src/app/api/admin/teams/route.ts` | liste v28–v32 dans `canWrite` | consommer l'état du contrat commun |
| Tableau de bord | `src/server/dashboard/read.ts` | chemin legacy <=27 et versions multiéquipes listées explicitement | adaptateurs legacy et mode équipe |
| Calendrier | `src/app/api/team-calendar/route.ts` | vérification version en route | remplacer par capacité calendrier |
| Réunions | `src/app/api/team-calendar/meetings/route.ts` | plage v28–v32, historique <=27 | sélectionner stratégie par capacité, isoler legacy |
| Périodes calendrier | `src/app/api/team-calendar/periods/route.ts` | plage v28–v32, fallbacks `i.mode` | centraliser schéma et mode par équipe |
| Kanban | `src/app/api/admin/kanban-periods/list/route.ts` | garde version en point d'entrée + requêtes par mode équipe | capacité + teamId autorisé |
| Kanban contextuel | `src/server/kanban/context.ts` | expression `COALESCE(agile_mode,i.mode)` | vérifier usage et supprimer le repli en v32 |
| Sprints | `src/server/sprints/index.ts` | branche historique utilisant `lower(i.mode)='scrum'` | conserver comme adaptateur <=27 uniquement, avec test |

## Classification à appliquer
- **A — Compatibilité de version en API ou service** : déplacer vers `src/server/schema/`; priorité haute.
- **B — Migration historique explicite et checksum** : conserver la logique versionnée mais centraliser son catalogue; priorité moyenne.
- **C — Résolution métier Scrum/Kanban** : utiliser le mode de l'équipe autorisée et non `smn_installation.mode`; priorité haute.
- **D — Legacy <=27** : confiner derrière adaptateur et documenter son horizon de support; ne pas effacer sans recette.

## Matrice de risques
- Critique : auth/diagnostic (accès application), équipes (modification/archivage), calendrier/périodes (503).
- Élevé : contexte multiéquipes et liste Kanban (isolation et erreurs de mode).
- Moyen : lectures historiques <=27 si explicitement confinées.

## Limites et suites
Le dépôt contient 866 fichiers TS/TSX sous `src`; cette première passe a inspecté 12 fichiers représentatifs. Le recensement exhaustif des gardes dans tous les fichiers, leur comptage et leurs exceptions restent nécessaires avant de déclarer SMN-327 achevée. Le contrôle TypeScript et les tests PostgreSQL ne sont pas exécutés ici.

## Références
ADR : `_bmad-output/planning-artifacts/architecture/ADR-SMN-SCHEMA-COMPATIBILITY-CENTRALISEE-2026-10-29.md`
Epic Jira : SMN-326; Story : SMN-327.
