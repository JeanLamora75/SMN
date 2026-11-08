# SMN-411 — Extraction des dimensions des zones graphiques PowerPoint

**Date :** 08/11/2026  
**Agent :** Amelia — développement BMAD via connecteur GitHub  
**Story :** https://lmn24.atlassian.net/browse/SMN-411  
**Références :** SMN-402 ; [UX Option B](../planning-artifacts/ux-designs/ux-office-graphiques-adaptatifs-2026-11-08/CONTRAT-UX-OPTION-B.md) ; [ADR Winston](../planning-artifacts/architecture/rapports-office/ADR-GRAPHIQUES-ADAPTATIFS-PPTX-2026-11-08.md)

## Objet, isolation et limite de livraison

Une fonction **en lecture seule** extrait les dimensions des formes PowerPoint porteuses de tags graphiques. Les champs de géométrie sont exprimés en unités EMU (914 400 par pouce). Aucune insertion dans le PPTX, génération d'image ni migration de données n'est réalisée dans cette Story. Le générateur de production SMN-402 continue d'utiliser son pipeline historique : **l'option B ne sera visible qu'après SMN-412/413**.

Implémentation :
- `scripts/smn-411-chart-targets.mjs` : `discoverPowerPointChartTargets(pkg)`, `emuToPixels(widthEmu,heightEmu,dpi=300)`, `OfficeChartTargetError`.
- `tests/smn-411-chart-targets.test.mjs` : extraction, répartition par slide, immutabilité, trois ratios, validation EMU, formes groupées, rotations, miroirs, erreurs détaillées, tags fragmentés et contrôle de non-modification ZIP.
- `.github/workflows/smn-411-chart-targets.yml` : matrice Linux/Windows, tests du nouveau lecteur, non-régression SMN-402, typecheck et ESLint.

## Contrat technique

Chaque cible extraite expose un objet gelé :

| Champ | Interprétation |
|---|---|
| `partName` | `ppt/slides/slideN.xml`, préservé pour le diagnostic |
| `slide` | Numéro de slide extrait du chemin |
| `shapeId` | Identifiant non visuel de la forme `p:cNvPr@id` |
| `xEmu`, `yEmu` | Position selon `a:off` |
| `widthEmu`, `heightEmu` | Dimensions `a:ext@cx/cy`, strictement positives |
| `ratio` | Rapport géométrique exact largeur/hauteur |
| `tag` | Texte original complet du tag `CHART:TREND` |
| `options` | Options validées par le parseur existant SMN-402 ; objet gelé |

La lecture concerne **uniquement** les éléments `p:sp` d'une partie de diapositive Open XML, contenant exclusivement une balise `{{CHART:TREND...}}`. Les tags peuvent être coupés entre plusieurs `a:t`, comme dans les modèles Office existants. Le code réutilise `parseOfficeChartTag` pour ne pas inventer de deuxième grammaire.

`emuToPixels` permet de transformer les dimensions physiques en pixels avec une densité explicite. L'API refuse les dimensions non entières, nulles, négatives ou trop grandes ; elle vérifie une erreur relative de ratio d'au plus 1 % et applique provisoirement les garde-fous POC Winston : 4 096 pixels par axe / 16 Mpx par image. La valeur par défaut de 300 ppp pourra être ajustée selon les résultats finaux du POC SMN-410.

## Erreurs et limites

`OfficeChartTargetError` contient `code`, `part` et `shapeId` lorsque celui-ci existe. Codes :
- `office-chart-ambiguous-tag` : tag seul obligatoire dans la forme.
- `office-chart-unsupported-group` : forme groupée.
- `office-chart-unsupported-transform` : rotation, miroir.
- `office-chart-invalid-geometry` : transformation absente, incohérente, dimensions invalides.
- `office-chart-invalid-shape` : identifiant de forme absent ou invalide.
- `office-chart-invalid-xml` : imbrication des formes incohérente.
- Les erreurs du parseur SMN-402 restent distinguées (par ex. `office-chart-invalid-range`).

Le résultat n'est **pas** encore relié à la route d'export, afin de ne pas risquer de refuser des modèles existants avant la mise en place de l'insertion adaptative. Les messages FR/EN de ces nouveaux diagnostics sont destinés à l'intégration de SMN-413. Les groupes/rotations ne sont pas réinterprétés silencieusement.

## Matrice des critères

| AC | Implémentation et preuve |
|---|---|
| AC-TGT-01 | Extraction part, slide, ID, position et dimensions depuis `p:sp`, y compris plusieurs slides portant le même shapeId |
| AC-TGT-02 | `ChartTarget` immuable, trois ratios, conversion EMU/pouces/pixels et bornes |
| AC-TGT-03 | Rejet avec codes précis des groupes, transformations non supportées, tailles invalides et tags ambigus |
| AC-TGT-04 | ZIP/source lu sans mutation ; syntaxe historique conservée |
| AC-TGT-05 | Suite dédiée et tests existants SMN-402, CI Windows/Linux |

## Suites et recette

Les tests automatisés vérifient les invariants structuraux et la stabilité du ZIP. Cela **ne constitue pas une preuve visuelle PowerPoint** : l'intégration `ChartTarget → renderer` relève de SMN-412, `ChartTarget → p:pic` et les nouveaux messages UI de SMN-413, la recette Office réelle de SMN-414.

**Adaptation BMAD :** les scripts `uv` du workflow officiel ne sont pas exécutables ici. Travail réalisé via les connecteurs GitHub/Jira et la CI GitHub Actions, sans prétendre à une exécution locale du runtime BMAD.
