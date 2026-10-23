# SMN-100 — Relations traçables entre registres et objectifs

Jira : https://lmn24.atlassian.net/browse/SMN-100

## Livré sur main

- Nouveau service `src/server/registries/relations.ts` et tables `smn_registry_relation`, `smn_registry_relation_audit`, préservant les objets originaux et enregistrant ajout/retrait daté avec auteur.
- API sécurisée GET/PATCH `/api/admin/registries/[id]/relations` ; vérification des identifiants, équipe de l'installation et compatibilité (seule une action peut pointer vers un objectif Scrum). Refus des auto-relations et relations directement réciproques.
- Navigation et gestion des liens sur les six fiches qualitatives, dans les deux sens pour les deux fiches concernées ; interface FR/EN.
- La relation ne change ni l'état d'atteinte de l'objectif, ni les bornes du Sprint, ni les snapshots existants.
- Test ciblé : `tests/smn-100-registry-relations.test.ts`.

## Limites pour la recette

- La relation action → objectif s'affiche depuis l'action ; **l'affichage inverse depuis la fiche Objectif du Sprint n'est pas encore raccordé** : AC2 partiel.
- Les relations figées ne sont **pas encore injectées aux snapshots Vn** ; leur préservation fonctionnelle complète relève des travaux de clôture : AC4 non recetté.
- Interdiction des cycles directs A↔B, mais l'interdiction de chaînes cycliques plus longues doit être précisée/implémentée au besoin ; AC5 partiellement couvert.
- Aucune commande `pnpm typecheck`, tests, build, intégration PostgreSQL ou recette navigateur n'a été exécutée dans cet environnement. GitHub Actions indisponibles ; ticket Jira laissé ouvert.

Commandes Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-100-registry-relations.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
