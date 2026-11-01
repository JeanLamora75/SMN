# SMN-350 — Projections d'indicateurs dynamiques des rapports Scrum / Kanban

## Contrat de projection

- Un rapport de cycle sélectionne uniquement des indicateurs actifs appartenant au catalogue et à la sélection de l'équipe du cycle. Aucune définition Fxx n'est imposée par ce développement.
- Les préférences de l'écran `reports` (visible / ordre) fournissent la sélection par défaut. La sélection et l'ordre **ponctuels** de 0 à 50 indicateurs sont transmis dans la requête de composition du rapport. Ils ne mettent à jour ni le catalogue, ni les préférences de l'équipe.
- Les valeurs sont restituées comme textes décimaux PostgreSQL (sans conversion numérique approximative), avec unité courte, identifiant, tag, libellé, source (`manual` / `computed`) et raison d'indisponibilité. Les valeurs manquantes restent `NULL`, jamais zéro.
- Le périmètre est validé en SQL : équipe non archivée, mode Agile cohérent, cycle non supprimé, indicateurs sélectionnés actifs. Si une sélection contient un indicateur désactivé / étranger à l'équipe, la composition est refusée.
- Scrum et Kanban utilisent la **même** fonction `readReportIndicatorProjection`, paramétrée par type de cycle. Aucune donnée métier Scrum (Story Points) n'est inventée pour Kanban.
- Les rapports métier préexistants et leurs snapshots restent distincts : l'extension des indicateurs ne remplace pas les observations d'origine.

## Aperçus et exports

- Scrum : sélecteur dans la préparation, aperçu HTML ponctuel, création d'une référence figée avec les valeurs et l'ordre ponctuellement choisis. Le PDF historique utilise cette référence, sans réinterroger les préférences après figement.
- Kanban : sélecteur et aperçu dans la préparation, projection ajoutée au contenu figé et au rendu HTML / PDF sur référence.
- Les anciennes références sans champ `dynamicIndicators` restent valides et lisibles ; leur empreinte de contrôle ne change pas.
- L'API de figement contrôle l'identité et les autorisations existantes ; les projections Kanban visibles dans la préparation sont limitées aux équipes explicitement habilitées pour les indicateurs.

## Fichiers

- `src/server/reports/dynamic-indicators.ts` — lecture SQL commune et validation de la sélection.
- `src/server/reports/html-preview.ts`, `render-reference.ts` — aperçu Scrum et payload immuable.
- `src/server/kanban/render-reference.ts` — payload Kanban immuable.
- `src/app/api/admin/reports/sprints/[id]/render-references/route.ts`, `src/app/api/admin/kanban-periods/[id]/report-reference/route.ts` — API de création avec sélection ponctuelle.
- `src/app/app/admin/sprints/[sprintId]/report/freeze-report-button.tsx`, `report/preview/page.tsx` — UI Scrum et HTML imprimable.
- `src/app/app/admin/kanban-periods/[id]/report/prepare/report-preview.tsx`, `report/frozen/page.tsx` — UI et export Kanban.
- `tests/smn-350-report-contract.test.ts`, `tests/smn-350-report-projection-pg.test.ts` — tests.
- `.github/workflows/smn-350-report-projection.yml` — CI dédiée.

## Recette automatisée et locale

```powershell
pnpm test:smn-350
pnpm db:test:smn-350
pnpm typecheck
pnpm lint
pnpm i18n:check
pnpm db:diagnose
```

**Attention :** `pnpm db:test:smn-350` nécessite une instance PostgreSQL locale de test avec le droit de créer une base ; il crée et détruit une base jetable et refuse d'employer une URL de base métier.

Recette visuelle Windows : choisir une équipe et un sprint, configurer deux indicateurs pour l'écran Rapports, changer ponctuellement leur ordre, visualiser le rendu HTML, figer le rapport, exporter le PDF, modifier les préférences de l'équipe puis vérifier que le rapport figé reste identique. Répéter sur Kanban (absence de Story Points inventés), tester une valeur manquante et l'interdiction d'un indicateur d'une autre équipe. Vérifier aussi une ancienne référence figée antérieure à SMN-350 et les champs sensibles.

La recette navigateur Windows ne peut pas être exécutée par le connecteur GitHub. Le script `uv` de BMAD n'est pas disponible dans cet environnement ; aucun lancement de ce script n'est revendiqué.
