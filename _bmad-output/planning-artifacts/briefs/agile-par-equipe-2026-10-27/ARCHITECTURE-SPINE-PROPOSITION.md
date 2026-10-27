# ARCHITECTURE SPINE — Modes Scrum/Kanban par équipe

**Agent :** Winston (BMAD v6.12.4) · **Epic :** [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)
**Statut :** proposition de solution issue d'une **inspection statique ciblée** de `main`, non validée par tests, non finalisée par le Reviewer Gate / scripts BMAD.

## Paradigme
Conserver le **monolithe modulaire Next.js / PostgreSQL** et les services actuels. Un contexte d'équipe **validé par le serveur** fait autorité ; le mode n'est pas une information fiable fournie par l'UI.

## Constat technique vérifié au 27/10/2026
- PR [#189](https://github.com/JeanLamora75/SMN/pull/189) issue de SMN-282 fusionnée sur `main` le 27/10/2026 ; fusion ≠ recette ni activation complète.
- `prisma/schema.prisma` : `SmnInstallation.mode` subsiste ; `SmnTeam` n'a pas de `agileMode` ni statut archivé.
- `src/lib/team-context-readiness.ts` : `MULTI_TEAM_CONTEXT_READY=false` ; `src/app/api/admin/teams/route.ts` : écriture soumise à `SMN_MULTI_TEAM_WRITES_ENABLED`.
- `src/server/teams/resolve.ts` : contexte v28 Admin, récupère encore `i.mode` ; `src/server/teams/active.ts` stocke la préférence d'équipe par compte.
- `src/server/sprints/context.ts` et `src/server/kanban/context.ts` : requêtes filtrées `team_id`, mais prédicat du mode **sur l'installation**.
- `src/server/kanban/periods.ts` et `cadence.ts` : recherche de l'unique équipe Kanban de l'installation ; tables Kanban créées au besoin.
- `src/server/capacity/settings.ts` : heures/JH stockées au niveau installation ; `capacity/engine.ts` supporte un `teamId` mais garde `i.mode`.
- `src/lib/private-navigation.ts` : libellé Kanban existe, mais destination de ses périodes n'est pas branchée ; `src/app/app/page.tsx` projette les cycles Scrum.
- `src/server/registries/list.ts` filtre par équipe et distingue les types de cycles ; `src/server/reports/team-studio.ts` et `team-cycle.ts` sont principalement orientés Sprint.
- Migration v28 versionnée et script manuel (`scripts/apply-multi-team-migration.ts`) : sauvegarde demandée et diagnostic requis. Son exécution sur le PC de l'utilisateur n'a pas été vérifiée.

## Invariants proposés (à valider par l'architecture de détail)

### AD-01 — Le mode appartient à l'équipe
**Lie :** `SmnTeam`, création de cycle, dashboard, rapports, navigation.
**Empêche :** une installation mono-mode.
**Règle :** propriété d'équipe non nulle `scrum | kanban`, renseignée à la migration ; l'ancienne valeur installation sert uniquement à l'amorçage/reprise historique.

### AD-02 — Résolution serveur unique du contexte
**Lie :** UI, API, lecture et mutation.
**Empêche :** falsification `teamId`/mode, accès interéquipes.
**Règle :** chaque point d'entrée résout acteur, installation, équipe autorisée, mode et statut ; chaque `cycleId`/ressource est vérifié par rapport à `teamId`. Les préférences client ne sont pas des droits.

### AD-03 — Verrouillage historique permanent
**Lie :** commande de création cycle, édition équipe, migration.
**Empêche :** passage Scrum↔Kanban après suppression logique de cycles.
**Règle :** persister une preuve de premier cycle (`mode_locked_at` ou équivalent). Verrouiller la ligne équipe, mettre la preuve et créer le cycle dans la même transaction ou protocole offrant la même atomicité.

### AD-04 — Archivage logique
**Lie :** listes, sélecteur, équipes, préférences, audit, métiers.
**Empêche :** effacement de données et références cassées.
**Règle :** état équipe `active|archived`, horodatage et auteur, réactivation sans remplacement d'identité. Les règles d'accès en lecture et d'écriture restent à faire valider.

### AD-05 — Séparation des producteurs Scrum et Kanban
**Lie :** moteurs de cycles, navigation, KPI, événements, modèles.
**Empêche :** faux KPI ou réemploi d'un cycle du mauvais mode.
**Règle :** services métier reçoivent un contexte d'équipe autorisé ; adaptateurs de cycle conformes à leur mode. Pas de valeur fictive.

### AD-06 — Historique immuable
**Lie :** clôtures, snapshots, audits, PDF, archives, imports.
**Empêche :** réécriture rétroactive des capacités et références de reporting.
**Règle :** références persistées identifiées par équipe et cycle ; migration additive et traçabilité des modifications.

### AD-07 — Activation séparée des migrations
**Lie :** schéma, diagnostic, flags, UI, recette.
**Empêche :** lecture multiéquipes sur services encore monoéquipe.
**Règle :** ne jamais lever les gardes avant qualification des API, migrations, droits, exports, historique et tests de régression.

## Stratégie de migration recommandée
1. **G0** — inspecter la base réelle : version v27/v28, état des migrations, copie de sauvegarde et restauration vérifiée.
2. Qualifier la migration v28 de SMN-282 si nécessaire ; **ne pas modifier son SQL après publication**.
3. Ajouter une nouvelle migration (probablement v29, **à confirmer avec la version réellement présente**) introduisant mode, verrou et état archivé de l'équipe, index/checks, audits.
4. Backfill : reprendre le mode historique fiable, sinon Scrum, et verrouiller les équipes ayant eu des cycles y compris supprimés logiquement ; interrompre sur données Scrum/Kanban contradictoires.
5. Mettre à jour **ensemble** diagnostics, registre `_prisma_migrations`, Prisma et toutes comparaisons `schema_version===28` dans les parcours qui doivent accepter la nouvelle version.
6. Évoluer les services métier vers le mode d'équipe ; déplacer les paramètres métier globaux visés par D-AGILE-19 vers une configuration par équipe sans altérer les snapshots.
7. Valider les refus interéquipes, performances, non-régression v27/v28 et scénarios Windows ; lever les gardes uniquement à la fin.

**Attention :** `readSprintContext`, `readKanbanPeriodContext`, `readDevelopmentCapacity`, `readTeamCenter` et producteurs de contexte sont prioritaires dans la chasse aux prédicats `i.mode` ; ceci est une **liste de départ, pas un inventaire exhaustif du dépôt**.

## Portes qualité
- **G1 :** migration et verrouillage des cycles, rollback/restauration.
- **G2 :** isolation côté serveur des URL, ID, lectures, écritures, caches et exports.
- **G3 :** Scrum/Kanban métier + calendriers/capacités + anciennes données.
- **G4 :** scripts `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et recette locale Windows ; résultats documentés, jamais présumés.

## Reports / hypothèses non adoptées
- Habilitations des comptes `user` reportées à V1 par SMN-282 ; refuser toute attribution automatique.
- Les champs SQL exacts et les contraintes de concurrence seront revus au design d'implémentation.
- Les règles de lecture des archives d'équipes, des écritures et de la dernière équipe active ne sont pas encore validées.
- SAFe et consolidations multiéquipes hors MVP.

**Traçabilité :** `src/server/teams/`, `src/server/kanban/`, `src/server/sprints/`, `src/server/capacity/`, `src/server/reports/`, `prisma/schema.prisma`, SMN-282, SMN-287.
