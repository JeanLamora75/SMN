# SMN-115 — Textes libres du brouillon de rapport

Story 6.4 — https://lmn24.atlassian.net/browse/SMN-115

## Publié sur main

- Brouillon par Sprint, distinct des objectifs, KPI et registres, avec introduction, conclusion et commentaire pour chacune des six sections du modèle standard.
- Chaque rédaction possède une langue d'origine FR/EN et un indicateur d'inclusion ; les huit textes sont vides par défaut, sans affirmation inventée.
- API GET/PATCH réservée à l'Administrateur, vérification d'appartenance au Sprint, révision optimiste, historique append-only des modifications.
- Éditeur Bootstrap dans la préparation du rapport, avec aperçu des seuls commentaires inclus et protection via `useUnsavedChanges`.
- Tests de contrat : `tests/smn-115-report-notes.test.ts`.

## Limitations

- Inclusion des commentaires dans le futur export PDF encore à raccorder : l'aperçu de rédaction sur la page les affiche, mais le moteur d'export n'existe pas encore.
- Les versions historiques des rapports PDF ne sont pas modifiées.
- Aucun typecheck, tests, build ou recette PostgreSQL/navigateur exécuté ; Jira reste ouverte.
- Pour Windows : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-115-report-notes.test.ts`, `pnpm i18n:check`, `pnpm build`.
