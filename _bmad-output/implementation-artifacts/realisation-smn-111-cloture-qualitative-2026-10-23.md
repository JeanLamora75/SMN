# SMN-111 — Cliché qualitatif à la clôture du Sprint

Jira : https://lmn24.atlassian.net/browse/SMN-111

## Publication sur main

- Collecteur de clôture `src/server/registries/closure-snapshot.ts` : captures de fiches centrales explicitement rattachées au Sprint, avec statut, titre, date métier, description, responsable, échéance, commentaire, révision et création ; relations des fiches concernées et faits marquants manuels/automatiques rattachés avec les préférences de sélection connues, y compris invalidation des faits automatiques.
- `src/server/sprints/closure.ts` insère `qualitative` dans le JSON versionné de `smn_sprint_closure_snapshot`. La lecture se produit dans la même transaction que la clôture, avant la mutation d'état ; une erreur SQL provoque le rollback de l'ensemble. Les versions antérieures ne sont pas modifiées.
- Aucune capture déclenchée lors de l'ouverture ou de l'aperçu du cycle. Le champ `state` différencie le schéma absent des associations absentes ; aucun état qualitatif fictif n'est fabriqué.
- Tests de contrat préparés dans `tests/smn-111-qualitative-closure.test.ts`.

## Points ouverts

- **Couverture incomplète de l'AC2 :** la table de rattachement explicite `smn_registry_cycle_link` de SMN-97 ne lie actuellement que les risques et dépendances aux Sprints. Les quatre autres registres et les faits manuels ne sont capturés que s'ils disposent déjà de tels liens, ce qui n'est pas encore possible via l'interface actuelle ; leur rattachement doit être étendu avant recette complète.
- Les consultations de bilans clôturés doivent encore exposer explicitement la section `qualitative` versionnée au lieu du registre courant (AC3). Les périodes Kanban sont également à intégrer lorsqu'elles auront leur service de clôture.
- Aucun test, typecheck, build, recette PostgreSQL ou navigateur exécuté. GitHub Actions indisponibles. Jira reste ouverte.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-111-qualitative-closure.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
