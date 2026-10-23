# SMN-90 — Registres consultables (23 octobre 2026)

Source Jira : https://lmn24.atlassian.net/browse/SMN-90

## Livré sur main
- Liste centrale `/app/admin/registries` : six onglets, recherche titre/description, filtre statut, filtre responsable pour administrateur, pagination serveur par 25, état vide distinct de producteur absent, liens stables par ID vers les fiches.
- `GET /api/admin/registries` : validation des paramètres, périmètre équipe de l'installation, lecture SELECT-only, projections collectives sans responsable nominatif pour user.
- `GET /api/admin/registries/[id]` : projection limitée pour user ; détail collectif sans édition, formulaire préexistant conservé pour admin.
- La création SMN-89 reste accessible depuis `/app/admin/registries/create` et depuis un bouton sur l'index uniquement pour admin.
- Traductions FR/EN intégrées à `src/i18n/fr.json` et `src/i18n/en.json`.
- Tests préparés : `tests/smn-90-registry-list.test.ts`.

## Dépendances restantes
- AC2/AC3, filtrage par cycle et unicité multi-cycles : aucune table d'association n'existe dans SMN-89. Le modèle multi-cycle et sa persistance relèvent notamment de SMN-97 / SMN-105 ; ne pas simuler ces relations. L'interface l'annonce explicitement.
- Les six listes partagent le même objet central stocké par ID, mais une même fiche n'est actuellement rattachée à aucun cycle. AC3 non recetté.
- Les catalogues de statut spécialisés pourront évoluer au fil de SMN-91 à SMN-112.
- Un utilisateur ne reçoit pas `owner_name` ni des métadonnées d'audit dans la projection individuelle de détail.

## Validation à mener
Aucun `pnpm typecheck`, `pnpm build`, `pnpm exec tsx --test`, `pnpm i18n:check`, essai PostgreSQL réel ou recette navigateur n'a été exécuté depuis ce connecteur. GitHub Actions n'est pas disponible. Ne pas clôturer la Story Jira avant contrôle et réalisation des associations multi-cycles.

```powershell
git pull
pnpm typecheck
pnpm exec tsx --test tests/smn-89-registry-creation.test.ts tests/smn-90-registry-list.test.ts
pnpm i18n:check
pnpm build
```
