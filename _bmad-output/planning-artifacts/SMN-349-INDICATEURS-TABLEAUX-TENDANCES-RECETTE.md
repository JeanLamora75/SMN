# SMN-349 — Intégration des indicateurs dynamiques aux tableaux et tendances

## Contrat implémenté
- Les définitions affichées proviennent uniquement du catalogue v33, des sélections actives de l'équipe et des préférences d'écran (visibilité, ordre, style). Aucun indicateur Fxx n'est créé automatiquement.
- Les listes de cycles, le tableau de bord et les tendances lisent les mêmes valeurs v33, en conservant les unités courtes, les tags et les noms affichés en infobulle.
- Les cycles Scrum et Kanban non supprimés sont pris en compte sans filtre de statut. Aucun cycle n'est exclu au seul motif d'être ouvert, terminé ou clôturé.
- Les données manuelles et calculées sont lues, sans modifier les snapshots historiques métiers. Les résultats calculés indisponibles et les valeurs absentes restent des NULL ; les courbes présentent une interruption et non un zéro.
- Les styles d'affichage tendances (nombre, carte, jauge, ligne, barres) respectent les préférences configurées. Export PNG côté navigateur, dans la palette courante.
- L'API contrôle la session et l'appartenance/habilitation à l'équipe, sans accepter un identifiant d'équipe comme autorisation.
- Les pages ne chargent le reporting configurable que lorsqu'une habilitation existe ; les opérations de lecture sont sans DDL ni écriture.
- Le tableau de bord peut se limiter au cycle demandé ; les tendances lisent tous les cycles non supprimés. Plus de 10 000 cycles donne une indisponibilité explicite plutôt qu'une troncature silencieuse.

## Sources techniques
- `src/server/indicators/reporting.ts` — agrégation SQL team-scoped et métadonnées de présentation
- `src/app/api/admin/indicators/reporting/route.ts` — API autorisée
- `src/app/app/admin/indicators/reporting-view.tsx` — tableaux, graphes et PNG
- Pages : `src/app/app/page.tsx`, `src/app/app/admin/sprints/sprint-index-view.tsx`, `src/app/app/admin/sprints/[sprintId]/page.tsx`, `src/app/app/admin/kanban-periods/page.tsx`
- `tests/smn-349-reporting-contract.test.ts` et `tests/smn-349-reporting-pg.test.ts`

## Vérification automatisée et recette locale
```powershell
pnpm test:smn-349
pnpm db:test:smn-349
pnpm i18n:check
pnpm typecheck
pnpm lint
pnpm db:diagnose
```
Le test PostgreSQL n'utilise qu'une base jetable locale et refuse une base métier. Le pipeline dédié est `.github/workflows/smn-349-reporting.yml`.

Recette visuelle : sélectionner un indicateur personnalisé sur une équipe A, configurer sa visibilité en `cycle_list`, `dashboard` et `trends`, vérifier son tag + son infobulle, une valeur nulle entre deux cycles, le rendu selon le style, la mise en page dark/light, l'export PNG ; vérifier que l'équipe B ne voit pas les données A et que les snapshots métier historiques restent inchangés.

## Notes de compatibilité
Les colonnes historiques Fxx déjà présentes dans les anciennes tables Sprint ne constituent pas des définitions du catalogue v33 et ne sont pas supprimées par cette Story ; le nouveau tableau configurable est distinct. Une suppression de ces colonnes historiques nécessiterait une décision de migration UX distincte.
Le runner `uv` BMAD n'est pas accessible depuis les connecteurs ChatGPT : la spécification officielle a été lue, le développement a été réalisé via GitHub et les tests réellement exécutés sont attestés uniquement par GitHub Actions.
