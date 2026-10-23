# SMN-112 — Historisation V1/V2 des clôtures qualitatives

Jira : https://lmn24.atlassian.net/browse/SMN-112

## Livraison publiée sur main

- Nouvelle projection de lecture seule `readQualitativeVersion` : pour un Sprint clôturé, lecture de la dernière version persistée dans `smn_sprint_closure_snapshot` ; pour un Sprint rouvert, consultation de l'état métier courant, sans fabriquer de nouvelle clôture.
- Consultation explicite d'une version V1 ou V2 même après réouverture/reclôture ; absence de cliché signalée distinctement (`history-missing`, `qualitative-missing`) plutôt que de reconstruire des données historiques.
- Contrôle d'appartenance à l'équipe Scrum installée ; API GET authentifiée et lecture sans mutation ; navigation dans l'écran de clôture entre l'état de référence et les versions historiques.
- `changeSprintClosure` (Epic 4/SMN-111) conserve les versions antérieures et incrémente Vn à chaque clôture ; aucune réécriture de PDF ajoutée par cette Story.
- Libellés FR/EN et tests unitaires de contrat préparés.

## Limitations et vérifications nécessaires

- La fidélité des six registres dépend du périmètre de capture de SMN-111 : les rattachements des six registres ne sont pas tous encore opérationnels, donc V2 ne corrige pas rétroactivement des omissions de V1.
- Les bilans métier hors écran de clôture et l'export PDF devront être vérifiés afin d'assurer la lecture effective des Vn plutôt que des fiches courantes ; AC1/AC3/AC4 pas encore recettés de bout en bout.
- Les périodes Kanban et les rétrosaisies avec provenance explicite ne sont pas encore couvertes intégralement. Les dates passées ne sont jamais reconstituées artificiellement ; AC5 partiel.
- Aucune exécution locale de `pnpm typecheck`, tests, `pnpm i18n:check`, `pnpm build` ou recette Postgres/navigateur n'a eu lieu ; GitHub Actions indisponibles, Jira reste ouverte.

## Vérifications Windows

```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-112-qualitative-versions.test.ts
pnpm i18n:check
pnpm build
```
