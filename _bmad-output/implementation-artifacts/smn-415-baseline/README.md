# SMN-415 — Baseline graphique Office Word / PowerPoint

**État au 08/11/2026 :** outillage de référence publié sur `main`, **exécution des tests, mesures et recette manuelle non démontrées**.  
**Responsable :** Amelia (BMAD) · **Epic :** SMN-6 · [Story Jira SMN-415](https://lmn24.atlassian.net/browse/SMN-415).

## Objectif
Photographier l'état du rendu des six graphiques Office avant la convergence Word/PPTX sur le moteur SVG. La baseline doit permettre de comparer **la même machine**, **les mêmes versions** et **les mêmes données**, sans altérer le moteur de production, les modèles ou les rapports archivés.

## Fichiers
- [Runner de baseline](../../../scripts/poc/smn-415-office-baseline.mjs) — génère des PNG, hash SHA-256, métriques et packages Office synthétiques.
- [Tests contractuels](../../../tests/smn-415-office-baseline.test.mjs) — matrice, rendu déterministe, cas limites, packages et smoke runner.
- Sources de scénarios réutilisées : `scripts/poc/smn-414-qa-matrix.mjs`, `scripts/smn-402-trend-png.mjs`, `scripts/smn-412-adaptive-chart.mjs`.
- Régressions préexistantes : `tests/smn-402-office-trends.test.ts`, `tests/smn-410-rasterizer-poc.test.mjs`, `tests/smn-411-chart-targets.test.mjs`, `tests/smn-412-adaptive-chart.test.mjs`, `tests/smn-413-adaptive-pptx.test.mjs`, `tests/smn-414-qa.test.mjs`.

## Exécution locale recommandée — PowerShell Windows 11

Pré-requis : code `main` synchronisé, Node.js 24, pnpm et dépendances déjà présentes (`node_modules`). Aucune commande `uv`, élévation administrateur ou IDE requis.

Depuis la racine de SMN :

```powershell
pnpm exec tsx --test tests/smn-402-office-trends.test.ts
node --test tests/smn-411-chart-targets.test.mjs tests/smn-412-adaptive-chart.test.mjs tests/smn-413-adaptive-pptx.test.mjs tests/smn-414-qa.test.mjs tests/smn-415-office-baseline.test.mjs
pnpm typecheck
pnpm lint
```

Le test `smn-410-rasterizer-poc.test.mjs` possède une dépendance de POC spécifique à `.smn-410-poc/node_modules` ; le lancer séparément uniquement si cet environnement POC existe. Documenter explicitement son état d'exécution.

Pour un premier essai court :

```powershell
node scripts/poc/smn-415-office-baseline.mjs --out "$env:TEMP\smn-415-smoke" --repeats 1 --smoke
```

Pour la matrice complète **avant toute modification du rendu** :

```powershell
node scripts/poc/smn-415-office-baseline.mjs --out "$env:TEMP\smn-415-before" --repeats 3
```

Le runner exige `--out` : il n'écrit pas implicitement de fichiers volumineux dans le dépôt. Il produit les répertoires `images/` et `packages/`, le manifeste `baseline.json` et `RECETTE-MANUELLE.md`.

Pour rejouer **après** SMN-418, utiliser les mêmes commandes et la même machine, par exemple un répertoire distinct `$env:TEMP\smn-415-after`. Si le runner doit ensuite être adapté aux nouveaux moteurs, conserver un mode de référence avant/après pour éviter de mesurer deux chemins différents sans le signaler.

## Couverture automatique prévue

| Groupe | Combinaisons | Preuve créée localement si exécuté |
|---|---|---|
| Images Word | 6 types × 2 langues, 6 cycles, 2 séries sauf jauge | 12 PNG historiques à **960×560** |
| Images PowerPoint | 6 types × 2 langues × 3 ratios | 36 PNG adaptatifs |
| Stress | 6 types × 3 profils × 2 formats | 36 exécutions supplémentaires, sans PNG conservés |
| Intégrité de package | 1/3/6 graphiques × Word/PowerPoint | 6 paires source/généré ZIP synthétiques |
| Image/données | Tous les rendus | SHA-256, dimensions, octets, profil null/zéro/négatif, empreinte des données |
| Ressources | Temps répété et mémoire observable | Médiane en ms, mémoire RSS observée aux frontières des exécutions |

Les profils de contrainte s'appuient sur les scénarios existants `one` (1 cycle / 1 série), `standard` (6 cycles / 2 séries), `dense` (24 cycles / 6 séries, ou 1 série pour jauge). Les valeurs négatives sont réservées aux familles compatibles (barres, courbes, aires). Les valeurs nulles sont préservées comme valeurs absentes.

**Limite de mesure :** `rssObservedMaxBytes` est le maximum des échantillons `process.memoryUsage().rss` aux frontières des rendus ; **ce n'est pas le véritable pic RSS de la machine**. Une mesure instrumentée complémentaire sera nécessaire pour certifier le pic mémoire de la recette finale. Les temps comprennent la génération raster et la compression PNG, et ne sont pas des temps de réponse HTTP de bout en bout.

## Manifeste des différences attendues
Les rendus Word et PowerPoint d'avant refonte ne sont **pas pixel-identiques** :
- Word : moteur pixel historique, image fixe 960×560, polices bitmap, normalisation ASCII.
- PowerPoint : moteur SVG resvg, dimensions physiques du cadre avec conversion 300 ppp, accents préservés et polices système.
- Titres internes, position des axes, placement des légendes, marges et épaisseurs diffèrent volontairement.
- Le comparatif futur porte d'abord sur les **données et règles métier**, puis sur les dimensions, l'intégrité Office et la lisibilité.

Le manifeste `baseline.json` contient également `expectedRendererDifferences` pour empêcher une comparaison SHA-256 interformat erronée. Les empreintes de données aident à vérifier que les scénarios n'ont pas changé lors du comparatif.

## Ce qui n'est pas prouvé par les fixtures
Les ZIP DOCX/PPTX synthétiques contrôlent les insertions et la non-mutation des parties visées ; **ils ne sont pas certifiés ouvrables par Microsoft Office**. Ils ne contiennent ni le véritable modèle utilisateur, ni ses logos/photos/données réelles. Leur présence ne prouve pas l'absence de pixelisation ou de recouvrement dans Word/PowerPoint.

Pour satisfaire complètement SMN-415 : ouvrir de véritables rapports dans **Word et PowerPoint Windows 11**, comparer avant/après, conserver les captures avec date, versions et observations ; vérifier FR/EN, 1/3/6 graphiques, ratios applicables, logos/images et affichage à 100 %. Documenter les cas non réalisables et le motif (par exemple ratios Word non réglables par le moteur historique).

## Matrice d'acceptation / état au 08/11/2026
- **AC-01 :** générateur de fixtures et scénarios présent ; **exécution et fichiers binaires non attestés**.
- **AC-02 :** scénarios 1/6/24 cycles, 1/2/6 séries, FR/EN, null/zéro/négatif, libellés longs définis ; **résultats à vérifier localement**.
- **AC-03 :** instrumentation et manifeste présents ; **aucune mesure réelle enregistrée** et pic RSS strict non mesuré.
- **AC-04 :** PNG et manifeste de différences générables ; **aucune capture Office ni validation visuelle réalisée**.
- **AC-05 :** commandes de tests SMN-402, SMN-411 à SMN-415 identifiées ; **succès non revendiqué**.

**Règle de clôture :** tant que les tests locaux, les mesures et les contrôles Microsoft Office n'ont pas de preuves, conserver la Story en cours et ne pas annoncer une baseline validée.

## Historique
- 08/11/2026 — Outillage de baseline, tests et protocole documentaire ajoutés sur GitHub `main`. Le lanceur `uv` du skill BMAD `bmad-build` n'est pas disponible ; implémentation manuelle via les connecteurs GitHub. **Aucun script uv exécuté, aucun résultat de test inventé.**
