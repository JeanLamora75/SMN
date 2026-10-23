# SMN-116 — Contrat commun des rapports Scrum et Kanban

Jira : https://lmn24.atlassian.net/browse/SMN-116 — Story 6.2 (identifiée après le développement de SMN-114 / Story 6.3).

## Publication sur main

- `src/lib/report-data-contract.ts` : union discriminante `ReportProjection`, mode `scrum` (SP, JH, objectifs) ou `kanban` (throughput, cycleTime, leadTime, wip), unités explicites, provenance avec cycle, dates, `capturedAt`, version Vn.
- Les valeurs manquantes restent `null` ; zéro est réservé aux sources qui enregistrent réellement 0. Unités Kanban normalisées sans cérémonies Scrum inventées.
- `src/server/reports/report-projection.ts` : adaptation Scrum depuis les données actives ou le snapshot clôturé ; SP et capacité issus du snapshot Vn, SP courants si présents. Capacité courante sans adaptateur vérifié : `null`, jamais estimation.
- `prepareSprintReport` expose désormais `projection` pour les prochaines étapes du moteur commun ; modèle Kanban testable à partir de fixtures sans prétendre disposer déjà des écrans de l'Epic 7.
- Tests `tests/smn-116-report-contract.test.ts`.

## Limites

- Aucun lecteur Kanban réel n'est installé ; seule sa projection contractuelle est prête, l'Epic 7 devra raccorder les sources.
- Les six sections du rapport SMN-114 utilisent encore leurs adaptateurs de contenu historiques ; la migration vers une projection totalement partagée est progressive.
- Aucun test, typecheck, build ou recette PostgreSQL/navigateur exécuté par les connecteurs. GitHub Actions désactivées ; Jira non clôturée.

Commandes de vérification Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-116-report-contract.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
