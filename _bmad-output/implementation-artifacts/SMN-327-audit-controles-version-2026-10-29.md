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

## Deuxième passe — contrôles complémentaires confirmés

Périmètre additionnel : 15 fichiers inspectés directement dans les services équipes, sprints, Kanban, calendrier, registres et sondes PostgreSQL; le recensement global sur les 866 fichiers reste à terminer.

| Priorité | Fichier : ligne | Constat vérifié | Action proposée |
|---|---|---|---|
| **P0** | `src/server/kanban/scoped-create.ts:38` | `i.schema_version IN (29,30,31)` refuse la v32 lors de la création Kanban scoped | Correction ciblée urgente, puis capability `kanban-periods` |
| P1 | `src/server/kanban/route-context.ts:17` | `context.version===28` active un comportement strictement versionné | Analyser la logique legacy v28 et extraire dans un adaptateur |
| P1 | `src/app/api/team-calendar/time-zones/route.ts:16` | `schema>=28&&schema<=32` : prochaine migration nécessite modification | Capability `multi-team`; garder un adaptateur <=27 |
| P1 | `src/server/kanban/cadence.ts:62` | `lower(i.mode)='kanban'` : dépendance au mode d'installation | Confirmer chemin historique; utiliser mode de l'équipe autorisée si multiéquipes |
| P1 | `src/server/sprints/batch-confirm.ts:29` | `lower(i.mode)='scrum'` : dépendance au mode global | Évaluer le chemin d'appel; retirer pour parcours multiéquipes |
| P1 | `src/server/registries/team-access.ts:16` | Versions 28–30 et `>=31` sans borne supérieure | Remplacer par capability et refus explicite d'une version future inconnue |
| P2 | `src/server/teams/legacy.ts:14` | `version<=27` | Conserver dans adaptateur historique identifié |
| P2 | `src/server/sprints/creation.ts:73` | `schema_version<=27` avec `i.mode` | Laisser au code legacy si appels cloisonnés |
| P2 | `src/server/sprints/work-slot-config.ts:7` | `version>=28` sans plafond | Contrôle central avec support connu |
| P2 | `src/server/db/probe.ts:87,122,130,135,137,196` | Vérifications de structure par seuils v28/v29/v30/v31/v32 | Registre de capacités et exigences de colonnes |
| P2 | `src/server/teams/cycle-schema.ts:16-18` | Vérifie les deux nouvelles colonnes | Préserver comme contrat d'intégrité, centraliser l'appel |

Le fait que `smn_installation.mode` soit utilisé n'est **pas** automatiquement une anomalie : les parcours monoéquipe historiques (<=27) doivent être identifiés avant correction. Pour le mode multiéquipes v32, vérifier systématiquement que l'équipe choisie reste autorisée et que son `agile_mode` prédomine.

### Contrat minimal suggéré pour SMN-328
- Version d'exécution maximale explicitement connue, sans fausse compatibilité avec les versions futures.
- Capacités `multi-team`, `per-team-agile-mode`, `kanban-cycles`, `scrum-cycles`, `team-calendar`, `company-catalog`.
- Une capacité dépend du marqueur de migration **et** des objets physiques nécessaires.
- Résolution d'équipe indépendante de l'autorisation de capacité.
- Tests statiques bloquants identifiant `schema_version IN (...)`, `version<=N`, `version===N` dans les endpoints; exceptions annotées pour les migrations et le legacy.

### Critère de fermeture SMN-327
Non atteint : recherche automatisée complète dans le dépôt et classification de toutes les occurrences restantes nécessaires. Ne pas déclarer la Story terminée sur cette seule passe.

## Troisième passe — audit automatisable (source publiée)

Le script existant `scripts/audit-schema-version-guards.mjs` a été étendu pour parcourir tous les fichiers `.ts`, `.tsx` et `.mjs` sous `src/`, sans modifier le code métier. Il classe les correspondances dans cinq familles : versions SQL, bornes numériques, listes de versions, référence au mode global, repli mode équipe→installation. Chaque résultat contient le chemin, la ligne, la catégorie, la portée et un extrait.

Commandes :
```powershell
node scripts/audit-schema-version-guards.mjs --summary
node scripts/audit-schema-version-guards.mjs > schema-guards-inventory.json
```

Le mode `--fail-on-api-guards` est destiné à une future règle de CI **après la réduction des gardes historiques**, car il détecterait également la dette existante. Il n'est pas activé dans la CI.

**Limites :** contrôle par expressions régulières, qui ne remplace pas l'analyse AST, peut ignorer les conditions sur plusieurs lignes et signaler des références historiques légitimes. La commande n'a pas été exécutée contre un clone local durant cette intervention. Aucun total exhaustif de correspondances n'est donc affirmé.

**Blocage prioritaire précédemment vérifié :** `src/server/kanban/scoped-create.ts` accepte uniquement `IN (29,30,31)` ; un correctif fonctionnel distinct est requis pour v32.

## Correction P0 appliquée — 29 octobre 2026

Le blocage `src/server/kanban/scoped-create.ts` a été corrigé sur `main` : la condition `IN (29,30,31)` est remplacée par `i.state='initialized' AND i.schema_version>=32`. Le module `resolveAdminTeam`, appelé avant l'écriture, continue d'imposer les versions d'installation connues jusqu'à v32 et d'autoriser l'équipe. La borne basse v32 correspond aux colonnes `agile_mode` et `is_archived` requises par cette écriture et introduites dans la migration v32. Tests de contrat statiques ajoutés dans `tests/team-agile-mode-v32.test.ts`.

**Validation restante :** exécuter `pnpm exec tsx --test tests/team-agile-mode-v32.test.ts`, `pnpm typecheck` et les tests PostgreSQL. Ce changement ciblé ne remplace pas encore le registre central SMN-328. Le blocage P0 est corrigé dans le code, mais la recette fonctionnelle reste ouverte.
