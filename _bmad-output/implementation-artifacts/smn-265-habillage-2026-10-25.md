# SMN-265 — Habillage de rapport : incrément partiel

## Livré
- Habillage conservé uniquement dans le JSON du rapport : orientation A4 portrait/paysage, couverture facultative, titre/sous-titre, sommaire facultatif, texte de pied.
- UI du Studio, prévisualisation HTML indicative, FR/EN ; le modèle source n'est pas modifié.
- Distinction du papier blanc et du chrome Bootstrap du thème.

## Non livré / limites
- La charte A4 n'est pas encore héritée d'un modèle enrichi (modèle actuel sans métadonnées d'habillage).
- Sommaire sans numéros de page : pagination exacte non calculée, explicitement indiquée.
- En-tête/pied PDF, logo, équipe, produit, version et production PDF non connectés à ce nouvel habillage.
- La feuille HTML ne prouve pas la fidélité du PDF.
- Aucune validation d'exécution, typecheck, build ni test PDF.
- SMN-264 contient toujours un risque de collision autosave/refresh, bloquant la fusion.

## Statut
PR brouillon, Jira non clôturé, aucune fusion sur main.
