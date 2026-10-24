# Diagnostic de lint — 24 octobre 2026

## Situation initiale
Commande utilisateur : `pnpm lint` (ESLint 9 / Next.js 16).
Résultat communiqué : **312 erreurs, 99 avertissements**.
Les erreurs proviennent de deux familles :
- les artefacts non sources `_bmad-UI/web/.next/**` pris dans le contrôle ;
- des violations `react-hooks/set-state-in-effect`, `react-hooks/refs` et `react-hooks/purity` dans les sources applicatives.

Le message concernant `baseline-browser-mapping` est un avertissement de fraîcheur des données, pas la cause de l'échec.

## Changements sur `main`
- `eslint.config.mjs` : ignore les compilations imbriquées, `node_modules`, `build`, `dist`, ainsi que les snapshots `_bmad/render`.
- `src/app/app/team-calendar/team-calendar-view.tsx` : sorties de chargement synchrone des effets ; initialisation de création différée et réinitialisation d'état déclenchée par les actions.
- Les composants de chargement d'administration déclenchent leurs appels asynchrones après l'effet, et non via des appels directs entraînant des mutations synchrones au montage.
- `src/app/app/admin/registries/registry-create.tsx` : baseline et état original passés en state React, sans lecture de refs pendant le rendu.
- `src/app/app/admin/sprints/[sprintId]/sprint-detail-tabs.tsx` : suivi de l'élément à refocaliser dans une ref, sans nouvelle mutation d'état dans l'effet.
- `src/app/app/admin/sprints/use-current-time.ts` : état d'horloge mis à jour par intervalle / changement de visibilité, sans `Date.now()` pendant le rendu. Utilisé par `attendance-form.tsx` et `delete-form.tsx`.
- `src/app/app/private-shell.tsx` et les panneaux de capacités : réinitialisations d'état différées et nettoyages conservés.

## Validation
Modifications et présence des fichiers vérifiées via GitHub ; les deux changements principaux (`eslint.config.mjs` et calendrier) ont été relus à distance. **Aucune exécution réussie de `pnpm lint`, `pnpm typecheck` ou `pnpm build` n'est attestée.**

Dans ce conteneur, la version Node disponible est 22, `pnpm` n'est pas installé et le nom d'hôte `github.com` ne résout pas. La validation des scripts doit donc être réalisée sur l'environnement Windows 11 (Node 24 / pnpm 12).

Commandes à réaliser après synchronisation de `main` :
```powershell
pnpm lint
pnpm typecheck
pnpm build
```

**Statut : corrections de lint publiées sur main ; succès de la commande à confirmer.** En cas de nouvel échec, traiter les diagnostics résiduels sans désactiver globalement les règles React et sans masquer les fichiers source.


## Résultat de contrôle du 24 octobre — 0 erreur, 12 avertissements

Nouvelle sortie utilisateur de `pnpm lint` : **0 erreur, 12 avertissements**. Le lint a donc réussi ; les avertissements non bloquants concernent 11 effets React (`react-hooks/exhaustive-deps`) et l'utilisation d'une balise `img` dans le rapport (`@next/next/no-img-element`).

**Correctif publié sur `main` :** les dépendances manquantes de `t` ont été ajoutées dans la fiche membre et les registres ; les fonctions de chargement des écrans d'administration ont été mémorisées avec `useCallback` et utilisées dans les tableaux de dépendances `useEffect`. Pour le logo base64 du rapport PDF/HTML, `next/image` est utilisé avec `unoptimized` afin de préserver l'impression sans recharger une image déjà encodée. Aucune règle ESLint n'a été désactivée.

**Vérification réalisée :** lecture statique des 12 fichiers modifiés sur GitHub. **À confirmer sur Windows après synchronisation** : `pnpm lint`, `pnpm typecheck`, `pnpm build`, ainsi que l'affichage du logo sur l'aperçu imprimable. L'avertissement séparé `baseline-browser-mapping` concerne la fraîcheur d'une dépendance ; il reste informatif.

Statut : avertissements traités dans les sources, **nouveau résultat de lint non encore attesté**.
