# SMN-402 — Graphiques de tendances dans les rapports Office

**État :** En cours — implémentation de l'incrément publiée sur `main`, CI de validation et recette Microsoft Office à confirmer.

## Convention des tags graphiques

Insérer un tag à la place du contenu d'un **paragraphe Word** ou d'une **zone de texte PowerPoint** compatible. Aucun objet graphique préexistant n'est nécessaire et aucun emplacement n'est configuré dans SMN.

| Exemple | Comportement |
|---|---|
| `{{CHART:TREND}}` | Graphique en barres du premier indicateur visible, six derniers sprints jusqu'au sprint choisi |
| `{{CHART:TREND|TYPE=line}}` | Courbe pour les mêmes données |
| `{{CHART:TREND|LAST=10|TYPE=area}}` | Dix derniers sprints, présentation de type aire remplie |
| `{{CHART:TREND|TAGS=SP_DONE,SP_INITIAL|LAST=6|TYPE=line}}` | Deux indicateurs désignés par leurs tags, de même unité, sur six sprints |

Les paramètres sont facultatifs. `LAST` accepte 1 à 24 sprints, `TYPE` accepte `bar`, `line` ou `area` ; l'aire n'est pas encore remplie. `TAGS` accepte 1 à 6 indicateurs actifs et visibles sur l'écran Tendances. Les tags doivent être uniques, disponibles dans le contexte et associés à **la même unité**. Un paramètre invalide ou une incompatibilité renvoie une erreur explicite. Les valeurs manquantes restent des points absents : aucun zéro n'est inventé.

**Données et sécurité :** `readIndicatorReporting(db,teamId,"trends","scrum")` fournit les colonnes et séries v33, y compris les valeurs figées des sprints clôturés. L'autorisation du compte, de l'équipe et du sprint est vérifiée par la route Office avant toute restitution. La génération ne modifie pas les indicateurs, les sprints ni les modèles.

## Production et insertion des images

- `scripts/smn-402-trend-png.mjs` produit une image PNG 960 × 560, avec axes, série(s), légende et noms de sprints. Le rendu utilise Node/zlib sans navigateur ni dépendance npm supplémentaire.
- `scripts/smn-402-office-chart-tags.mjs` analyse les tags (y compris fragmentés en runs Office), valide les options, puis remplace un tag graphiquement exploitable par une nouvelle image via la preuve de faisabilité SMN-397.
- Word : création du dessin inline `w:drawing` ; PowerPoint : création d'une forme `p:pic` à partir de la zone texte, dont la géométrie est réutilisée.
- Si **aucune valeur numérique exploitable** n'existe, la zone contient `N/D` plutôt qu'un graphique fictif.
- Les autres parties ZIP ne sont pas volontairement modifiées. Le modèle d'origine reste intact.

## Fichiers livrés

- [Projection et contrôle métier](../../src/server/reports/office-indicator-charts.ts)
- [Rendu PNG](../../scripts/smn-402-trend-png.mjs)
- [Parsing des tags et insertion Office](../../scripts/smn-402-office-chart-tags.mjs)
- [API de génération](../../src/app/api/admin/reports/office-templates/generate/route.ts)
- [Tests Node](../../tests/smn-402-office-trends.test.ts)
- [CI dédiée](../../.github/workflows/smn-402-office-trends.yml)

## Réserves techniques et preuve restante

Le moteur XML et ZIP des prototypes Office SMN-397 reste expérimental, **pas** un parseur OpenXML de production. Les tags graphiques doivent occuper seuls le paragraphe/zone de texte. Les formes groupées, tags mélangés à du texte, tableaux imbriqués, tailles et relations Office complexes nécessitent des validations supplémentaires. Les types actuellement pris en charge sont barres, lignes et aire remplie ; secteurs, anneau et jauge sont encore hors périmètre technique.

Le POC Word utilise une taille fixe du dessin ; l'incrément SMN-402 attribue désormais des identifiants graphiques `wp:docPr` distincts dans chaque partie XML et les teste pour plusieurs graphiques. Il reste à adapter les dimensions aux contraintes du modèle et à vérifier les constructions complexes.

**Recettes complémentaires nécessaires :** tests de la route avec une base PostgreSQL v33 réelle, validations Microsoft Word et PowerPoint sous Windows 11 / Node 24, contrôle visuel des dimensions et du rendu, traitement de formats et archives complexes. Les captures/export LibreOffice ne constituent pas une preuve de fidélité universelle Microsoft Office.

**Jira :** https://lmn24.atlassian.net/browse/SMN-402  
**CI :** https://github.com/JeanLamora75/SMN/actions/workflows/smn-402-office-trends.yml

## Recette ciblée CI (06/11/2026)

- [Exécution 42301404314](https://github.com/JeanLamora75/SMN/actions/runs/42301404314) : **success** sur Node.js 24 Linux, **10/10 tests**, typecheck et ESLint ciblé réussis après correction du typage du test.
- Renforcement ultérieur : identifiants `wp:docPr` uniques pour plusieurs graphiques Word ; test supplémentaire ajouté. Consulter le [workflow SMN-402](https://github.com/JeanLamora75/SMN/actions/workflows/smn-402-office-trends.yml) pour l'état de la dernière révision.
- Les résultats attestent la validité des packages synthétiques, pas une recette Microsoft Office sur l'installation Windows 11 de l'utilisateur.

## Renforcement de la recette finale

- [Exécution 42301569751](https://github.com/JeanLamora75/SMN/actions/runs/42301569751) : **11/11 tests réussis**, TypeScript et ESLint réussis sur Node 24 Linux, y compris deux graphiques Word dans un même document.
- Correctif ultérieur : l'option `TYPE=area` génère désormais une aire effectivement remplie, avec test discriminant contre le style `line`. La validation de ce dernier changement doit être vérifiée dans les runs postérieurs.
