# SMN-410 — Prototype de rendu PNG haute définition portable

**Date :** 08/11/2026  
**Agent :** Amelia (BMAD)  
**Epic :** SMN-6 — Rapports Office  
**Story :** https://lmn24.atlassian.net/browse/SMN-410  
**CI exécutée et vérifiée :** https://github.com/JeanLamora75/SMN/actions/runs/42472550591  
**Statut :** POC initial testé sur Linux et Windows en CI, **choix final et intégration dans le paquet Windows à confirmer**. Moteur de production SMN-402 inchangé.

## Objectif et approche

Vérifier la faisabilité d'un rasteriseur SVG→PNG **sans navigateur externe ni installation avec droits administrateur**, pour alimenter ultérieurement la génération de graphiques Office adaptatifs (SMN-412). Le POC compare le moteur de production SMN-402 (bitmap fixe 960×560, alphabet matriciel sans accents) avec un moteur candidat SVG→PNG.

- Candidat testé : **`@resvg/resvg-js` 2.6.2**, licence **MPL-2.0** telle que déclarée dans son `package.json` installé par la CI.
- Version Node du runner : **24.22.2**, Windows et Linux.
- Dépendance installée **uniquement dans `.smn-410-poc/` pendant la CI**, sans toucher `package.json`, `pnpm-lock.yaml`, le serveur SMN ni le pipeline Office.
- SVG construit par le POC, textes FR/EN avec accents et typographie système (par ex. Arial / remplacement local) ; aucune police redistribuée.
- La comparaison avec le navigateur est **documentée mais non exécutée** : `puppeteer-core` présent dans SMN ne fournit pas Chromium. Le POC ne revendique donc pas une supériorité mesurée face à Chromium.

## Livrables

- `scripts/poc/smn-410-rasterizer-poc.mjs` : génération SVG sur trois géométries, injection dans Resvg, PNG, contrôles de limites, mesure monotone du temps et variation RSS, comparaison baseline.
- `tests/smn-410-rasterizer-poc.test.mjs` : six tests automatiques (limites, accents et ratios, moteur actuel, PNG, quatre images, erreurs).
- `.github/workflows/smn-410-renderer-poc.yml` : matrice Ubuntu/Windows, installation isolée du candidat, tests et upload de l'artefact contenant PNG et JSON de mesures.
- Artefacts **`smn-410-poc-ubuntu-latest`** et **`smn-410-poc-windows-latest`** de l'exécution GitHub Actions.

## Résultats de la CI

**Résultat Windows : 6/6 tests, succès. Résultat Linux : 6/6 tests, succès.**

| Test | Linux, Node 24.22.2 | Windows, Node 24.22.2 |
|---|---:|---:|
| Baseline historique 960×560 | 9,26 ms ; 8 163 octets | 11,25 ms ; 8 163 octets |
| Resvg horizontal FR, 1600×900 | 32,80 ms ; 40 658 octets | 93,49 ms ; 44 961 octets |
| Resvg horizontal EN, 1600×900 | 28,69 ms ; 41 487 octets | 81,15 ms ; 45 445 octets |
| Resvg carré FR, 1200×1200 | 31,83 ms ; 45 835 octets | 77,33 ms ; 48 843 octets |
| Resvg carré EN, 1200×1200 | 36,05 ms ; 45 950 octets | 78,74 ms ; 49 050 octets |
| Resvg vertical FR, 900×1600 | 27,53 ms ; 44 125 octets | 81,08 ms ; 46 856 octets |
| Resvg vertical EN, 900×1600 | 29,50 ms ; 44 027 octets | 81,22 ms ; 47 117 octets |
| Quatre graphiques 1200×675 | 88,54 ms au total ; 4 × 28 931 octets | 344,50 ms au total ; 4 × 31 733 octets |

**Observations :** PNG structurés correctement, dimensions exactes, compression très inférieure au budget de 8 Mio sur ces exemples. Le POC utilise deux séries, six cycles, dont un point `null` et un zéro réel. Les données sont volontairement synthétiques. Le résultat bitmap historique est plus rapide mais ne teste pas le même style graphique ni la même surface ; les temps **ne constituent pas un benchmark d'égalité fonctionnelle ou visuelle**.

**Mémoire :** les variations de RSS relevées incluent l'état du processus, le chargement initial de la bibliothèque native, l'allocation et la récupération mémoire. Elles ne représentent ni le pic RSS ni un calcul de budget garanti. Dans le premier rendu FR horizontal : +19 038 208 octets (Linux) et +58 949 632 octets (Windows). Un lot séquentiel de quatre images a produit +17 825 792 octets Linux et -1 789 952 octets Windows (effet normal d'évolution du RSS/GC). **Un test séparé du pic mémoire et de la concurrence est requis avant la production.**

## Couverture des critères

| AC | Conclusion | Preuve/manque |
|---|---|---|
| AC-POC-01 — comparaison et qualité FR/EN | **Partielle** | Ancien renderer vs Resvg testé, accents conservés dans SVG. Pas de comparaison Chromium ni mesure objective d'anti-crénelage dans PowerPoint. |
| AC-POC-02 — trois ratios | **Automatisé**, qualité humaine en attente | PNG 16:9, 1:1 et vertical, FR/EN ; fichiers CI téléchargeables. Pas de recette à 100 % ni projection sur PowerPoint réel. |
| AC-POC-03 — licence et paquet portable | **Partielle** | Licence MPL-2.0 et Node 24 Windows/Linux vérifiés ; installation sous CI sans privilèges spécifiques. Intégration dans le ZIP Windows autonome et disponibilité stable des polices **non éprouvées**. |
| AC-POC-04 — limites mémoire/PNG | **Partielle** | Tests des bornes 8 Mio, 4096 px par axe, 16 Mpx et quatre graphiques. Mesures initiales de RSS et temps ; pic RSS, stratégie d'erreur et concurrence à approfondir. |
| AC-POC-05 — POC reproductible et décision | **POC réalisé**, arbitrage Winston restant | Script, matrice CI, images et présent rapport. Aucune modification du générateur de production. |

## Risques et condition du choix définitif

1. **Police :** les chaînes et accents dans le SVG sont préservés. Les fontes disponibles diffèrent entre Linux et Windows ; la différence des tailles PNG le confirme sans prouver à elle seule une différence de lisibilité. Définir une police redistribuable sous licence ou un rendu portable prouvé avant intégration.
2. **Packaging :** la bibliothèque utilise un binaire natif N-API selon la plateforme ; installer une dépendance isolée dans un runner CI n'est **pas encore une preuve** qu'elle est distribuée dans le paquet Next.js standalone portable (voir `scripts/windows/package-portable.mjs`). Nécessite un POC de packaging explicite.
3. **Licence :** MPL-2.0 doit faire l'objet d'une revue de conformité de la redistribution et des notices avant livraison d'un runtime embarqué.
4. **Sécurité SVG :** le SVG du POC est généré localement à partir de données synthétiques échappées. Pour la production, interdire les SVG arbitraires ou sources réseau dans le renderer et borner temps, dimensions et ressources.
5. **Test des bornes :** le POC teste la validation géométrique et les rejets PNG trop grands, mais ne tente pas réellement de rasteriser une image de 16 mégapixels ni de forcer un PNG de 8 Mio. Il faut un test de charge contrôlé avant un engagement de limite de production.
6. **Comparaison visuelle :** le POC n'est pas le renderer final de SMN-412. Le résultat ne couvre pas tous les styles existants, les 24 cycles ou le rendu à l'intérieur des cadres Open XML.

## Recommandation technique pour Winston

**Candidat favori pour la phase suivante : `@resvg/resvg-js`**, compte tenu de la réussite des tests Windows et Linux sans navigateur, de la licence identifiée et des tailles/temps prometteurs sur les échantillons. **Pas encore de décision technique finale** : la police, la conformité MPL-2.0, le packaging Windows autonome, la charge maximale et la comparaison visuelle sur les vrais modèles doivent être démontrés avant la fusion dans le moteur de production.

**Aucun nouveau paquet ajouté aux dépendances de production.** Ne pas faire passer SMN-410 en Terminé avant arbitrage Winston et validation des points ouverts.

## Traçabilité

- UX : `_bmad-output/planning-artifacts/ux-designs/ux-office-graphiques-adaptatifs-2026-11-08/CONTRAT-UX-OPTION-B.md`
- Architecture : `_bmad-output/planning-artifacts/architecture/rapports-office/ADR-GRAPHIQUES-ADAPTATIFS-PPTX-2026-11-08.md`
- Jira : [SMN-410](https://lmn24.atlassian.net/browse/SMN-410)
- CI : [run 42472550591](https://github.com/JeanLamora75/SMN/actions/runs/42472550591)
- Adaptation BMAD : le workflow `bmad-build` complet dépendant de `uv` n'a pas pu s'exécuter dans le présent environnement. Le POC et sa CI ont été exécutés via GitHub Actions. **Ces tests constituent des preuves propres, et non une exécution revendiquée du script BMAD.**
