# SMN-241 — Vue Cartes et préférence d'affichage

**Date :** 25 octobre 2026. **Statut : implémentation sur branche, non validée, non fusionnée.**
**Story :** https://lmn24.atlassian.net/browse/SMN-241.
**Branche :** `feat/smn-241-registres-cartes`.
**Base :** `feat/smn-240-registres-liste` ([PR #127](https://github.com/JeanLamora75/SMN/pull/127)) elle-même basée sur `feat/smn-239-registres-transverse` ([PR #126](https://github.com/JeanLamora75/SMN/pull/126)).
**Conception :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Fichiers et modifications

- `src/lib/registry-display-view.ts` : choix `list|cards` et clé `smn-registries-display-view-v1`, **distincte de la préférence Équipe** ; lecture invalidée => Liste par défaut.
- `src/app/app/admin/registries/registry-list.tsx` : bascule exclusive Liste/Cartes par boutons accessibles (`aria-pressed`, textes, pictogrammes) et sauvegarde dans le `localStorage` du navigateur après clic ; chargement de la préférence après hydratation pour ne pas provoquer de divergence SSR. Changer de présentation **ne modifie ni `type`, ni `query`, ni `page`, ni `result.items`**, ne relance pas l'API.
- `src/app/app/admin/registries/registry-card.tsx` : carte compacte basée sur `RegistryListItem` et `RegistrySignal` existants ; six icônes métier, type, titre ouvrable, description réelle (deux lignes visuellement), statut textuel, signaux SMN-104 vérifiés, date métier, échéance facultative, responsable admin seulement et action de consultation/édition selon le rôle.
- `src/app/app/bootstrap-icon.tsx` : ajout SVG officiels Bootstrap Icons `list-ul` et `grid-3x3-gap`, source : dépôts `twbs/icons`.
- `src/app/globals.css` : carte sans hauteur fixe, grille 4 colonnes large, 2 colonnes tablette, 1 colonne mobile, `align-items:start`, couleurs sémantiques de SMN et boutons à état pressé visibles.
- `src/i18n/fr.json` et `en.json` : trois nouvelles clés communes `viewGroup`, `listView`, `cardsView`.
- `tests/smn-241-registry-card-view.test.ts` : sept tests ciblés écrits, **non exécutés**.

## Règles et arbitrages préservés

- Un seul modèle central : pas de nouvelle requête serveur en vue Cartes, pas de duplication de fiche ou de reconstruction de métriques.
- Données réelles déjà isolées équipe/installation et paginées en SQL (socle SMN-239).
- La préférence est **locale à ce navigateur** et au module Registres ; aucune synchronisation entre appareils ou profils n'est introduite, ce qui n'est pas une exigence de SMN-241.
- Droits admin/user identiques, aucune nouvelle action de modification au rôle user ; absence de donnée ≠ donnée inventée, criticité non évaluée ≠ risque élevé.
- Les changements de mode de présentation n'affectent pas les cycles Scrum/Kanban, les audits ni les snapshots Vn figés.
- L'onglet Registres de la fiche Sprint SMN-234 n'est pas modifié.

## Critères d'acceptation

| Critère | Code | Validation à effectuer |
|---|---|---|
| AC1 — Même collection, un seul mode affiché | Une seule branche JSX selon `view` autour de **`result.items`** | Parcours liste↔cartes avec filtres et pages multiples |
| AC2 — Préférence isolée et restaurée | Clé `smn-registries-display-view-v1`, liste par défaut, lecture post-hydratation | Rechargement/nouvelle visite, stockage désactivé, écrans Équipe |
| AC3 — Cartes et commandes RBAC | Iconographie, statut/attention séparés, propriétaire admin uniquement, actions | Admin/user Scrum/Kanban et clavier |
| AC4 — Densité compacte | Pas de `height` fixe ; grille 4/2/1, description 2 lignes CSS | Largeurs 320/375/768/1024/1440 + zoom 200 % |
| AC5 — Contexte conservé et i18n | Aucun `setQuery/setPage/fetch` dans `chooseView`, FR/EN | Tests navigateurs, clavier, tactile |

## Preuves réelles et limites

- Sources du dépôt, contrat UX et Story Jira lus avec les connecteurs.
- **13/13 contrôles statiques ciblés positifs**, portant sur la structure des deux composants, les clés JSON et les interactions présentes dans le code. L'analyse statique ne remplace pas la compilation ni le navigateur.
- Tests `node:test` : **7 ajoutés, non exécutés**.
- `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` : **non exécutés**.
- Recette accessible au clavier/tactile et rendu clair/sombre : **non effectués**.
- Scripts `uv run` BMAD non exécutés : checkout de travail absent de l'environnement ChatGPT, Git externe non récupérable dans le conteneur ; ne pas prétendre à une activation complète du workflow.

### Commandes recommandées sur la copie locale Windows (sans nouvel outil)

```powershell
pnpm exec tsx --test tests/smn-239-registry-transverse.test.ts tests/smn-240-registry-enriched-list.test.ts tests/smn-241-registry-card-view.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Sur navigateur : mémorisation au rechargement, absence de préférence => Liste, clés séparées du roster, filtre et page conservés, même ID pour 25/26 fiches, actions admin/user, clavier, thème clair/sombre, responsive 320/375/768/1024/1440 et zoom 200 %.

**Definition of Done non atteinte tant que ces contrôles ne sont pas exécutés et corrigés.**
