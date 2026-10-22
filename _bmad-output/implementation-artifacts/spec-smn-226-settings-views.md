# SMN-226 — Bascule Cartes/Liste du Centre Paramètres

Référence Jira : https://lmn24.atlassian.net/browse/SMN-226

## Implémentation
- Portail serveur `src/app/app/admin/settings/page.tsx` conserve l'autorisation et fournit le même registre ordonné issu de SMN-225.
- Composant client `settings-catalog-view.tsx` affiche deux boutons icônes exclusifs à droite de l'entête du catalogue, avec `aria-label` et `aria-pressed` traduits en FR/EN.
- Le mode **Cartes** est initialisé par défaut puis la dernière préférence est restaurée depuis `localStorage`. Le mode **Liste** remplace entièrement la grille.
- Clé indépendante : `smn-settings-catalog-view`, distincte de `smn-team-roster-view` utilisée sur Équipe.
- Rendu Cartes responsive : 1 colonne mobile, 2 tablette, 4 grand écran. Liste : une rubrique par ligne sans table ou défilement horizontal imposé.
- États et destinations inchangés, pages non accessibles restent non interactives. Aucun endpoint, migration ni opération d'écriture métier ajouté.
- Focalisation visible sur les liens avec survol compatible tokens SMN.

## AC et vérifications
- AC1 : groupe de deux boutons en haut à droite, labels accessibles.
- AC2 : une seule branche de rendu (grille ou liste) par état React.
- AC3 : même `groups` et même `group.entries` pour les deux modes.
- AC4 : persistance via stockage local dédié, gestion des cas de stockage indisponible, Cartes par défaut.
- AC5 : classes Bootstrap `row-cols-1 row-cols-md-2 row-cols-xl-4` et liste fluide.
- AC6 : traduction JSON FR/EN, `aria-pressed` et `:focus-visible`.

Test ajouté : `tests/smn-226-settings-view.test.ts`. Aucune exécution de test ni compilation effectuée dans cette session.

## Recette Windows
1. Récupérer main, lancer `pnpm typecheck`.
2. Lancer `pnpm exec tsx --test tests/smn-226-settings-view.test.ts`.
3. Ouvrir `/app/admin/settings`, passer en Liste, recharger puis revenir après navigation.
4. Vérifier l'indépendance avec la vue Équipe, les 14 rubriques, leurs statuts, et les mêmes destinations.
5. Tester FR/EN, thème clair/sombre, clavier, lecteur d'écran si disponible, zoom 200 %, desktop/tablette/mobile.

Statut : **développé et publié ; non recetté**.
