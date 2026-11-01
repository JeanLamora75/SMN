# SMN-335 — Correctif de l'onglet Tendances (BMAD / Amelia)
Date : 2026-11-01. Story : https://lmn24.atlassian.net/browse/SMN-335

## Écart constaté
Le rendu v33 précédent affichait uniquement le sélecteur d'indicateur et l'export PNG. Le dessin était conditionné par `display_style` du catalogue, entraînant une zone SVG vide pour un indicateur « number » ou un style ne correspondant pas au graphe souhaité. Les bornes de Sprint et le bouton Filtrer n'existaient pas.

## Correction publiée sur main
- `indicator-trends.tsx` : composant client dédié au filtre Indicateur → Sprint de départ → Style → Sprint de fin → Filtrer ; plage par défaut cinq précédents + courant, six inclusifs maximum.
- Graphes SVG : barres par défaut, ligne, aire, secteurs, anneau, jauge 0–100 ; bornes et style réellement choisis indépendants des préférences catalogue. Refus explicite des répartitions non positives/incomplètes et des jauges hors plage.
- Le nom de l'indicateur et les noms réels des cycles filtrés sont dessinés dans le SVG. Les données manquantes ne deviennent pas zéro. Tableau accessible sous le graphe et export PNG depuis le SVG filtré.
- `reporting-view.tsx` délègue le seul écran `trends` au nouveau composant ; les autres projections restent inchangées. Données v33 filtrées par équipe dans l'API existante ; tous cycles non supprimés selon `readIndicatorReporting`. La restitution des sprints clôturés dans `trends` doit encore être revue pour les captures historiques : le service v33 `reporting.ts` fige actuellement seulement `screen="cycle_list"`.
- Test statique `tests/smn-335-v33-trends-cockpit.test.ts`.

## Limites et recette à compléter
Aucune exécution de Next.js, TypeScript ou PostgreSQL dans l'environnement Windows de l'utilisateur. Les styles avancés et l'export PNG doivent être validés visuellement, en clair/sombre et sur des cycles de plusieurs statuts. Les captures historiques Vn pour l'écran Tendances ne sont pas encore garanties par la projection v33 : **ne pas déclarer SMN-335 complètement recettée**.
Les agents BMAD sont utilisés ici comme rôles de travail : le skill officiel Amelia dans `.agents/skills/` n'a pas pu être identifié depuis les chemins explorés, et aucun script uv n'a été exécuté.
