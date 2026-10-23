# SMN-120 — Vision, Product Goal, DoD et DoR facultatifs

Jira : https://lmn24.atlassian.net/browse/SMN-120 — Story 6.9.

## Livraison `main`

- Contrat commun `src/lib/report-team-context.ts` et lecteur serveur en lecture seule, limité à l'équipe installée, sans repli sur les champs du produit.
- Lecture uniquement si une table productrice `smn_team_context` et les colonnes attendues existent ; sinon données absentes et non fictives. Texte de langue d'origine conservé sans traduction automatique, URL HTTP(S) externe présentée comme non vérifiée.
- Sélection des quatre contenus par l'administrateur, persistée par Sprint dans une table dédiée au brouillon, sans UPDATE sur les champs source.
- Panneau d'aperçu de contexte facultatif sur la page de préparation ; traductions FR/EN.
- Tests de contrat `tests/smn-120-team-context.test.ts`.

## Limites explicites

La présence effective du producteur `smn_team_context` n'est pas confirmée. Si l'architecture de SMN stocke déjà ces éléments sous un autre schéma, l'adaptateur devra être mis en correspondance : la Story ne doit pas être considérée terminée en l'absence de recette des sources réelles. Le futur PDF devra inclure DoD/DoR après les sections standards. Les options sont encore associées au Sprint plutôt qu'à chaque rapport archivé. Kanban et SAFe nécessitent des adaptations ultérieures.

Aucun typecheck, test, build, recette PostgreSQL/navigateur exécuté depuis ChatGPT. Jira reste ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-120-team-context.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
