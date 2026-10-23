# SMN-94 — Cycle de vie des obstacles (23/10/2026)

Story : https://lmn24.atlassian.net/browse/SMN-94

## Réalisé sur main
- Les quatre états `open / in_progress / resolved / abandoned` existent déjà dans le catalogue commun de SMN-89.
- `src/lib/obstacle-lifecycle.ts` : validation et caractérisation des transitions, détection de réouverture de `resolved` ou `abandoned`, éligibilité aux points d'attention seulement pour `open` ou `in_progress`.
- `src/server/registries/items.ts` : contrôle supplémentaire des transitions d'obstacle dans la transaction d'édition. La mise à jour versionnée + audit avant/après de SMN-91 préserve la résolution antérieure et son horodatage / acteur.
- `registry-create.tsx` : explication contextualisée des états, notamment réouverture, résolution et abandon ; traductions FR/EN.
- Tests unitaires de contrat préparés dans `tests/smn-94-obstacle-lifecycle.test.ts`.

## Limites et dépendances
- AC1–AC3 : code fourni, tests intégrés PostgreSQL et navigateur non exécutés.
- AC4 : aucun effet latéral vers une fiche risque ou action n'est effectué par `updateRegistryItem`. Les liens bidirectionnels eux-mêmes relèvent des Stories de liaison futures.
- AC5 : l'éligibilité est implémentée, mais le cockpit Points d'attention n'est pas encore raccordé ; ne pas afficher une fausse alerte. Intégration future Epic 5.
- Aucune commande locale (`pnpm typecheck`, `pnpm build`, tests) n'a été réellement exécutée. GitHub Actions désactivées. Jira inchangé.

## Vérifications Windows
```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-94-obstacle-lifecycle.test.ts
pnpm i18n:check
pnpm build
```
Puis tester en admin puis user : création, ouverture/en cours/résolution/réouverture, audit avant/après, visibilité du statut, absence de mutation d'une autre fiche.
