# SMN-269 — Responsive, accessibilité et recette

## Incrément livré
- CSS de disposition responsive pour le Studio : plan et propriétés s'empilent sous 1200 px, le document devient prioritaire.
- Mobile : outils de composition complexes masqués, lecture et commentaires simples maintenus, rappel explicite des limites.
- Focus clavier renforcé sur boutons/liens/champs ; conservation des alternatives monter/descendre des rubriques existantes.
- Les libellés FR/EN du comportement mobile ont été ajoutés.
- Aucun changement aux anciennes routes PDF et archives.

## Grille de recette à exécuter (aucun résultat acquis)
- Desktop Chrome Windows 11 : panneaux gauche/droit rétractables, mode et enregistrement.
- Tablette portrait/paysage : panneaux temporaires réellement utilisables, composition/édition sans débordement.
- Smartphone 360–430 px : commentaires, lecture, aperçu A4 séparé et téléchargement PDF.
- Zoom navigateur 200 %, thèmes clair/sombre, navigation Tab/Shift+Tab, lecteur d'écran.
- Scénarios R-01 à R-... de `RECETTE-UX.md` : aucun exécuté.
- Tests droits API admin/user, concurrence SMN-263/264, PDF fidèle, archive immutable.
- `pnpm typecheck`, `pnpm test` et `pnpm build` : **non exécutés**.

## Limites
- Les panneaux sont empilés sous le seuil choisi, mais pas encore de vrais tiroirs tablette : AC1 partiel.
- L'aperçu A4 séparé sur mobile n'est pas raccordé : AC2 partiel.
- Les standards de contraste WCAG et le zoom 200 % ne sont pas vérifiés : AC3 et AC4 partiels.
- Aucun ticket SMN-254 à 269 ne doit être déclaré terminé sur la base de cette implémentation.
- Les PR empilées #146–#160 restent non fusionnées.
- Risque de collision autosave/refresh de SMN-264 et défaut de fidélité du moteur PDF SMN-268 restent ouverts.

## Recommandation
Avant intégration : revue transversale de toutes les PR, correctifs de compilation éventuels, recette visuelle, UX, droits et PDF, puis validation utilisateur explicite.
