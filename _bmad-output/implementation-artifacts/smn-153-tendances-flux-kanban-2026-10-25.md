# SMN-153 — Trois tendances de flux Kanban, vérification avant intégration

**Story :** https://lmn24.atlassian.net/browse/SMN-153  
**Branche :** `feat/smn-153-kanban-trends-finalisation`, issue de `fix/smn-152-kanban-capacity-validation` (SMN-152).  
**Périmètre :** lecture des métriques de flux enregistrées, pas de nouvelle règle métier ni d'écriture.

## Critères et changements

- AC1 : les trois représentations distinctes existantes — commencés, terminés/Throughput, WIP final — sont conservées ; noms/états vides FR/EN centralisés, contrôle des types de données avant rendu.
- AC2 et AC3 : la requête existante `readKanbanTrends` garde exclusivement les périodes `closed` de l'équipe, jusqu'à cinq, sans période postérieure à la période consultée. Les cinq sélectionnées sont inversées pour apparaître dans l'ordre chronologique.
- AC4 : le parseur ajouté `src/lib/kanban-trend-payload.ts` rejette une série incomplète/incohérente, préserve `null` et les valeurs zéro réellement enregistrées et vérifie le classement chronologique et les bornes. Les graphiques ne créent aucun point lorsque la mesure manque.
- AC5 : état vide explicite conservé ; aucun bouton d'enregistrement ; graphiques Cycle/Lead Time (story suivante) et anciens PDF non modifiés.

## Fichiers

`src/lib/kanban-trend-payload.ts` (nouveau), `src/app/app/admin/kanban-periods/[id]/report/trends-panel.tsx`, `src/i18n/fr.json`, `src/i18n/en.json`, `tests/smn-153-kanban-trends.test.ts`.

## Exécutions contrôlées

- Copie exacte du nouveau parseur : empreinte Git `2344667d149ffdcc41eb0646461abee1cb0bdb7a` identique à GitHub.
- `tsc --noEmit --strict --target ES2022 --module commonjs` sur ce parseur isolé : **succès** (TypeScript 5.8.3, Node 22.16.0).
- Compilation puis `node --test /tmp/smn153/smn153-isolated.test.cjs` : **4/4 cas réussis** (ordre, limite, préservation null/zéro, rejets des valeurs incorrectes).
- Vérifications statiques GitHub : **6/6 OK** (3 séries distinctes, parseur branché, null non affiché, état vide, parité des clés FR/EN, couverture des AC dans le fichier de tests). Parité complète des clés des catalogues FR/EN : **0 manque**.

**Non exécutés** sur l'application complète : tests `tests/smn-153-kanban-trends.test.ts` avec `pnpm test`, `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, SQL PostgreSQL, tests navigateur aux différentes tailles/avec rôle user. Aucune CI activée ; cette preuve limitée ne doit pas être décrite comme un build du dépôt réussi.

Aucun arbitrage UX/REG n'est modifié par cette Story Kanban. Les branches de registres SMN-239 à SMN-252 et la Story SMN-253 sont distinctes.
