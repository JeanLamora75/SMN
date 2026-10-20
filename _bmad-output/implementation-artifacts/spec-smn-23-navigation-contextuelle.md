# SMN-23 — Story 1.13 : contexte lors des navigations vers les fiches liées

**Norme :** Jira SMN-23 ; FR-60/58/59, AD-6/19/22/26/31, D-PRD-127, UX-DR04. Dépendances SMN-21 et SMN-22 déjà intégrées dans `main`.

## Décisions d'implémentation

1. Travailler sur les seules fiches réellement disponibles au MVP I0 : la fiche collective `smn_team`. L'identifiant `team` de l'installation pilote est déjà stable, sans migration.
2. Étendre la projection de contexte avec `productId` et `teamId` provenant du serveur, sans enrichissement personnel ni donnée de cycle fictive.
3. Assurer le retour contextuel par chemin interne allowlisté : `/app` et les paramètres validés `teamId`, `cycleId`, `filter`, `version`, `asOf`. Les champs futurs restent inactifs tant que les producteurs métiers correspondants n'existent pas.
4. Délimiter clairement état courant et contexte historique demandé : ne jamais présenter la fiche du jour comme un instantané historique.
5. Refuser silencieusement les ressources absentes, invalides ou interdites avec le même message 404. Appliquer les autorisations serveur avant l'accès SQL, contrôler `singleton` et `initialized`.
6. Ne déclencher ni modification métier ni transmission externe. Tous les textes UI nouveaux sont dans `src/i18n/fr.json` et `en.json`.

## Traçabilité et résultat

Documentation d'implémentation : [docs/NAVIGATION-CONTEXTUELLE-SMN-23.md](../../docs/NAVIGATION-CONTEXTUELLE-SMN-23.md). Tests unitaires et HTTP décrits dans ce document.

**Statut : développement codé, recette Windows/CI et revue métier en attente.** La validation documentaire fonctionnelle du 19/10/2026 ne vaut pas preuve d'exécution des tests.
