# SMN-117 — Rubriques facultatives et ordre du rapport

Jira : https://lmn24.atlassian.net/browse/SMN-117 — Story 6.5.

## Livraison

- Six rubriques standard configurables individuellement : visibilité et déplacements haut/bas, ordre conservé par Sprint.
- L'en-tête obligatoire (identité du Sprint, équipe, produit, dates, statut, provenance) demeure hors options : impossible de le masquer.
- Aperçu instantané des seules rubriques sélectionnées dans l'ordre choisi, sans modification des données source.
- Persistance des choix par Sprint avec révision optimiste, audit append-only et API GET/PATCH réservée à l'Administrateur.
- Avertissement avant abandon de choix non enregistrés via `useUnsavedChanges`, traductions FR/EN.
- Tests de contrat ajoutés : `tests/smn-117-report-section-options.test.ts`.

## Limitations et vérification

- Les options sont actuellement enregistrées par Sprint (un brouillon par Sprint), non par plusieurs rapports distincts d'un même Sprint ; la granularité « rapport particulier » devra être affinée avec l'identité des exports et archives futures.
- La future génération PDF doit explicitement consommer la sélection enregistrée ; aucun PDF n'est encore généré ici.
- Aucun test, typecheck, build ou recette PostgreSQL/navigateur exécuté depuis ChatGPT. Jira reste ouverte.

Vérification sous Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-117-report-section-options.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
