# SMN — Tendances multi-indicateurs, UX et contrat Amelia (06/11/2026)

**État :** conception validée ; implémentation à vérifier. Référence : Epic SMN-228, Stories SMN-335 et SMN-349.

## Règles UX

1. Sélecteur multiple par cases à cocher, 1 à 6 indicateurs, noms métiers et unité, contrôle clavier, FR/EN. Premier indicateur présélectionné ; les changements prennent effet avec Filtrer.

2. Refuser les unités hétérogènes (SP, tickets, J/H, %, etc.) avec message localisé, conformément à SMN-335. Pas de conversion ni de normalisation fictive.

3. Styles comparatifs : ligne, barres groupées, aire. Une série colorée par indicateur, valeurs réelles v33, zéro comme zéro, NULL comme lacune et non un point zéro ni un segment de raccordement.

4. Secteurs, anneau, jauge restent mono-indicateur. En multi-sélection, basculer vers Ligne si le style précédent est incompatible.

5. Légende visible par nom métier et unité, sous le SVG, de la même couleur que la série. Infobulle sur chaque valeur. Rotation -45° et noms de sprint complets conservés.

6. Tableau associé : une colonne par indicateur sélectionné et une ligne par cycle, valeurs identiques au graphe. Export PNG inclut les légendes, et n'écrête pas les sprints.

7. Accessibilité : SVG annoncé, légende textuelle, couleurs non seules porteuses d'identité, labels accessibles, focus visible, thèmes Bootstrap/Cockpit Agile, responsive.

8. Source existante /api/admin/indicators/reporting inchangée ; respect du RBAC équipe, snapshot et statuts sans écritures supplémentaires.

9. Recette 1/2/6 séries, sprints longs (6/12), négatifs, zéro, NULL, refus d'unité mixte, comparaison ligne/barres/aire, export PNG, FR/EN, Windows/Linux.

## Impacts

src/app/app/admin/indicators/indicator-trends.tsx ; éventuellement helper pur de séries ; nouveaux tests de non-régression. Aucun changement aux visualisations unitaires du Dashboard Builder (VIS-01 à VIS-06).

## Validation

Exiger tests exécutés, typecheck, lint, CI et recette navigateur avant de déclarer terminé. Les statuts de vérification sont documentés dans Jira.