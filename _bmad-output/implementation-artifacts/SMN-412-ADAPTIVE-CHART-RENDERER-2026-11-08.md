# SMN-412 — Composition et rendu adaptatif des graphiques Office

**Agent :** Amelia — BMAD via GitHub/Jira, 08/11/2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-412  
**Epic :** SMN-6  
**Références :** SMN-410 (POC Resvg), SMN-411 (ChartTarget), SMN-402 (moteur historique) ; UX Sally et ADR Winston (Option B).  
**Statut :** module isolé créé, tests ciblés Windows/Linux et relecture visuelle des 36 images à documenter ; **pas d'activation dans l'API Office de production avant SMN-413**.

## Objet

Créer un renderer autonome capable de transformer des séries de tendances v33 déjà autorisées, un `ChartTarget` PowerPoint (dimensions EMU), un style et une locale en un graphique PNG aux bonnes proportions.

- `scripts/smn-412-adaptive-chart.mjs` expose `composeAdaptiveChart({target,cycles,series,type,locale})` et `renderAdaptiveChartPng(...)`.
- `composeAdaptiveChart` produit une scène SVG sans titre interne « Tendances des indicateurs ». La géométrie est calculée pour la zone : dimensions depuis `emuToPixels` (SMN-411), marges, axes, légendes, tailles typographiques, couleurs.
- `renderAdaptiveChartPng` rasterise le SVG avec le candidat Resvg du POC SMN-410, qui reste installé **uniquement pour le test** dans `.smn-410-poc` ; il vérifie la signature, les dimensions finales et le plafond PNG 8 Mio.
- Le contrat est **read-only** côté données métier : aucun recalcul de KPI, modification de sprints ou mise à jour de la base. Les séries reçues doivent provenir de la projection déjà autorisée de SMN-402 lors de l'intégration future.

## Qualité et règles fonctionnelles

1. **Six styles :** `bar`, `line`, `area`, `pie`, `donut`, `gauge`, associés au même jeu de données, dans les trois formats 16:9, 1:1 et portrait.
2. **Multi-indicateurs :** 1–6 séries, 1–24 cycles, unités compatibles, palette stable `#1b508d`, `#b45638`, `#159895`, `#7955a7`, `#bc8c21`, `#426da4`. Les noms de mesure et de sprint sont échappés XML.
3. **Absences vs zéro :** un `null` brise la courbe et ne produit ni barre ni point ; un zéro reste un résultat présent et une jauge 0 % est représentable. Si toutes les valeurs sont absentes, le renderer renvoie `null`. Les graphiques de répartition dont le total est nul restent sans image.
4. **Lisibilité :** fonte SVG anti-crénelée à la rasterisation ; cible de 38 pixels minimum pour le texte principal à 300 ppp (≈9 pt). Graduations au nombre de cinq, format numérique localisé FR/EN avec au plus deux décimales ; abréviation systématique des noms de sprint longs (S101 etc.) et inclinaison à -45° dans les cas denses.
5. **Occupation :** dessin construit à partir du ratio réel, avec marges ≈5,5 % et zones distinctes pour les axes et légendes. Pas d'étirement d'un PNG 960×560.
6. **Limites :** `ChartTarget` invalide, dimensions sous 500×370 px, zone utile insuffisante, image >4096 px/axe ou 16 Mpx, mauvaise locale, unités incompatibles, valeurs non finies, `gauge` multiseries ou >100 %, et parts négatives → erreurs `OfficeChartLayoutError` avec `code` et détails bornés. Aucun ajustement silencieux des valeurs.

Les tailles 9 pt, 5,5 %, 90 % de couverture utile et 220–300 ppp sont des objectifs **UX à valider sur la vraie maquette**, pas des métriques visuelles déjà démontrées. Les polices Arial / substitutions systèmes sont utilisées sans redistribution de fichiers propriétaires ; la stabilité finale des glyphes doit faire partie de la recette du paquet Windows SMN.

## Couverture des critères Jira

| Critère | Preuve technique / réserve |
|---|---|
| AC-RND-01 | Cible EMU de SMN-411, ratio SVG et PNG adapté, limites pixels ; aucun format fixe dans le nouveau renderer |
| AC-RND-02 | Six styles, 1/2/6 séries, 1/6/24 cycles, null et zéro, compatibilité des unités, jeux négatifs pour graphiques cartésiens |
| AC-RND-03 | Pas de titre redondant ; ticks et légendes adaptatifs, espace calculé selon la cible. Occupation 90 % : validation visuelle requise |
| AC-RND-04 | Accents conservés, chiffres localisés FR/EN, abréviations et inclinaison -45°. Police et lisibilité à 100 % : validation visuelle requise |
| AC-RND-05 | Refus structurés avec `code` et `details` ; les ressources UI FR/EN de ces codes seront branchées dans SMN-413 |
| AC-RND-06 | Tests fonctionnels et CI Windows/Linux ; **36 échantillons PNG** (6 types × 3 formats × 2 locales) en artefacts Actions ; validation golden perceptuelle encore à faire |

## Fichiers publiés

- `scripts/smn-412-adaptive-chart.mjs` — moteur de composition isolé, scènes SVG, rasterisation PNG.
- `scripts/poc/smn-412-render-samples.mjs` — 36 échantillons de validation visuelle PNG + manifeste SHA256, données synthétiques.
- `tests/smn-412-adaptive-chart.test.mjs` — six types, trois ratios, FR/EN, immutabilité, séries et valeurs limites, signes, erreurs, non-régression vers moteur SMN-402.
- `.github/workflows/smn-412-adaptive-renderer.yml` — tests géométrie SMN-411 + rendu SMN-412 Windows/Linux, typecheck, ESLint et publication des images comme artefacts CI.

## Suite et limites

- **SMN-413** est propriétaire du remplacement ciblé `p:sp → p:pic`, de la résolution des options de tags et du raccordement à la projection v33 autorisée, des diagnostics UI traduits et des relations OPC. Ce code ne modifie aucune route d'export actuelle.
- **SMN-414** recettera le rendu à 100 % dans Microsoft PowerPoint, en diaporama et PDF, et vérifiera la conservation des trois autres cadres du modèle.
- **SMN-410** doit confirmer avant dépendance de production les obligations de licence et le packaging du binaire Resvg et de sa police. Le runtime de test isolé ne doit pas être considéré comme déjà distribué avec SMN.
- Le workflow BMAD avec script `uv` n'a pas été exécuté ; le développement, les tests et les preuves sont réalisés directement depuis GitHub Actions conformément au mode ChatGPT + BMAD + GitHub + Jira.

**Recette à compléter :** revue visuelle des 36 PNG par Sally et de leurs textes/axes, puis vérification des critères UX-CH-01 à UX-CH-09, et validation d'intégration PowerPoint dans SMN-414. Toute correction sera tracée en Jira.
