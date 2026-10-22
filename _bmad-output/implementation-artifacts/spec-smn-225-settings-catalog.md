# SMN-225 — Catalogue des 14 rubriques Paramètres
Référence : https://lmn24.atlassian.net/browse/SMN-225

## Implémentation livrée dans le code
- Registre central typé : `src/lib/settings-catalog.ts`, 14 rubriques réparties dans les 4 familles approuvées, avec ordre, libellés et descriptions FR/EN, icônes, états et liens.
- Portail `src/app/app/admin/settings/page.tsx` rendu côté serveur, en grille 4/2/1 et en pleine largeur.
- Autorisation : vérification du droit settings avant affichage, puis filtrage des rubriques par droits (accounts / settings / audit / backups).
- Mode de l'installation lu depuis PostgreSQL ; Cadence Scrum et Cérémonies sont inapplicables à Kanban. Si le mode n'est pas lisible, leur lien n'est pas activé.
- Les rubriques incomplètes sans accès direct dédié (Langues, Apparence, Cérémonies, Règles de capacité) sont affichées « À compléter » sans lien artificiel ; Jours ouvrés : « À venir » sans lien.
- Rubriques effectivement disponibles : Informations générales, Cadence en Scrum, Pays/Jours fériés, Fermetures, Catégories d'absences, Utilisateurs, Sécurité et sessions (partielle), Sauvegardes, Audit ; conserver les autorisations propres des pages/API.
- Intégrations externes et Notifications restent absentes.

## Dépendances futures
- SMN-226 : bascule Cartes/Liste et persistance de préférence de présentation (non incluse ici).
- SMN-227 : accès direct aux sections Langues/Apparence, navigation/retours unifiés et rationalisation des liens dispersés ; ne pas modifier les moteurs de paramétrage.
- Les règles de capacité et les jours ouvrés ne deviennent pas éditables du seul fait de leur carte.

## Vérifications proposées
- `pnpm typecheck`
- `pnpm exec tsx --test tests/smn-225-settings-catalog.test.ts`
- `pnpm dev` : vérifier 14 éléments / 4 sections en Scrum, 2 rubriques non applicables en Kanban, absence d'interactions factices et confidentialité user/admin.
- Vérifier en FR/EN et sur bureau, tablette et mobile.

**Tests ajoutés, mais non exécutés ici ; compilation et recette navigateur non réalisées.** La Story n'est pas déclarée recettée.
