# SMN-414 — Recette des graphiques adaptatifs PowerPoint (Option B)

**Date :** 08/11/2026  
**Agent :** Amelia (développement/tests), préparation pour Sally (UX) et Winston (architecture)  
**Jira :** https://lmn24.atlassian.net/browse/SMN-414  
**Périmètre :** extension PowerPoint des tags `{{CHART:TREND...}}` ; pas d'adaptation automatique de la géométrie Word.

## 1. État de la recette et principe de preuve

La recette **automatisable** est réalisée dans la CI Windows/Linux SMN-414. **Dernier run vérifié : https://github.com/JeanLamora75/SMN/actions/runs/42477866661 — succès sur Ubuntu et Windows, 30 tests de recette/intégration et 12 tests de non-régression par OS (42/42), TypeScript et ESLint réussis.** Le fichier PowerPoint **original de l'utilisateur** (en-tête rouge, logo, photo à droite, quatre cadres et un seul tag) n'est **pas accessible comme fichier binaire dans la session**. Le générateur de preuves utilise donc un fixture **Open XML synthétique** pour vérifier la géométrie, les relations et l'intégrité des objets hors cible, ainsi que 36 images indépendantes.

**NE PAS qualifier cette preuve de conformité Microsoft PowerPoint** : l'ouverture réelle du PPTX original, l'affichage à 100 %, le diaporama, l'export PDF, les captures avant/après et la validation finale Sally/Winston/utilisateur doivent être consignés séparément. Le fixture n'est pas présenté comme un fichier Office prêt à l'emploi.

## 2. Livrables exécutables

- `scripts/poc/smn-414-qa-matrix.mjs` — génère 36 PNG (3 ratios × 6 styles × 2 locales), évalue 18 combinaisons de charge (3 densités × 6 styles) et compare les parties ZIP avant/après l'insertion dans le fixture à quatre cadres.
- `tests/smn-414-qa.test.mjs` — vérifie les 36 compositions, les 18 combinaisons, la conservation des valeurs null/0/négatives et des parties Open XML non ciblées, le refus d'une rotation non prise en charge, la cohérence des artefacts.
- `.github/workflows/smn-414-visual-acceptance.yml` — exécute les tests SMN-411/412/413/414 + non-régression SMN-402, typecheck, ESLint, et publie deux ensembles d'artefacts.
- Artefacts CI : `smn-414-qa-ubuntu-latest` et `smn-414-qa-windows-latest` : 36 PNG chacun, `matrix.json` avec dimensions, tailles et SHA256 ; `RECETTE-MANUELLE.md` avec les contrôles PowerPoint non automatisables.
- Tous les scénarios utilisent des données **synthétiques non confidentielles** ; aucune donnée de l'utilisateur n'est reproduite.

## 3. Matrice de recette et verdicts

| Jira / UX | Objet | État justifié | Preuves à compléter |
|---|---|---|---|
| AC-VAL-01 / UX-CH-01,02,03,10,11 | Quatre cadres, un tag, préservation des autres cadres et médias ; ratio | **Structure automatisée** | **Modèle réel introuvable :** captures avant/après, photo/logo et absence de pixellisation à 100 % non évalués |
| AC-VAL-02 / UX-CH-05 à 09 | 3 formats, 6 styles, FR/EN, 1/2/6 séries et 1/6/24 cycles, null/0/négatif | **36 PNG + 18 cas structurels automatisés** | Lecture perceptuelle : collisions de labels, palette, lisibilité et 9 pt effectifs à mesurer |
| AC-VAL-03 / UX-CH-02,05,12,14 | Ouvrir PowerPoint Windows 11, diaporama, PDF, erreurs localisées | **Messages FR/EN couverts dans les tests SMN-413** | **Non réalisé** : Microsoft Office et le modèle utilisateur ne sont pas accessibles |
| AC-VAL-04 / UX-CH-01 à 15 | Revue UX et ADR Winston, captures, anomalies | **Matrice rédigée** | Avis explicite Sally/Winston et captures comparatives du modèle réel |
| AC-VAL-05 / UX-CH-13,14 | CI, intégrité package, paquet Windows portable | **Tests Windows/Linux et preuve native Resvg SMN-413** | Exécution du **paquet Windows complet**, licence redistribution et démarrage SMN restent à confirmer |
| AC-VAL-06 / UX-CH-15 | Documentation FR/EN de l'onglet Tags ; Word hors périmètre | **Déjà ajoutée par SMN-413** | Contrôle visuel dans les deux langues sur poste utilisateur |

### Critères UX détaillés : lecture de l'état

- **Structure automatisée :** UX-CH-01, 02, 04, 08, 09, 10, 11 et éléments de UX-CH-12, 13, 14 et 15.
- **À juger visuellement :** UX-CH-03 (90 % de surface utile), UX-CH-05 (netteté FR/EN et typographie ≥9 pt), UX-CH-06 (absence de collision des libellés longs), UX-CH-07 (lisibilité légende six séries).
- **À tester dans Office :** ouverture sans réparation, respect du titre rouge/photo/logo, export PDF et diaporama.
- **Audit Winston restant :** conformité des parties OPC avec un vrai modèle et arbitrages polices/redistribution du moteur Resvg.

## 4. Protocole manuel obligatoire sur le modèle de référence

1. **Préparer les preuves :** copier le modèle **original**, contrôler qu'il contient la photo à droite, un en-tête rouge, le logo, quatre cadres et un seul `{{CHART:TREND...}}`. Faire une capture « avant » et noter les dimensions du cadre graphique.
2. **Générer depuis SMN :** sélectionner équipe et sprint avec un indicateur actif dans l'onglet Tendances ; générer le PPTX avec le même modèle. Conserver la version générée et le journal d'erreur si la génération échoue.
3. **Ouvrir PowerPoint Windows 11 :** vérifier l'absence d'alerte de réparation, conserver une capture à **100 %**, comparer ratio/position, logo/photo/titre et absence de changement des trois autres cadres (qui doivent rester vides).
4. **Affichage et export :** lancer le diaporama, générer un PDF via PowerPoint et contrôler la netteté, les marges, les axes et la typographie à taille normale.
5. **Parcours étendus :** répéter pour horizontal/carré/vertical, six types de graphique, 1/2/6 séries et 1/6/24 cycles, FR/EN, null/0/négatif, titres longs ; relever les collisions avec captures et tag reproduisant le cas.
6. **Refus contrôlés :** tag dans un cadre trop petit, forme groupée ou pivotée, indicateur indisponible. Attendu : message FR/EN explicite, aucun PPTX partiel et aucune écriture sur un rapport existant.
7. **Visa :** Sally compare aux UX-CH-01…15, Winston contrôle la stabilité OPC et le packaging, puis l'utilisateur valide explicitement la recette métier.

En cas de différence, consigner **modèle, variante, dimensions, tag, langue, capture avant/après, attendu, observé, sévérité**, puis ouvrir un bug Jira ; ne pas masquer la divergence.

## 5. Préconisations de décision

- **Ne pas clôturer SMN-414** tant que le modèle réel n'est pas passé dans Microsoft PowerPoint Windows 11 et que les captures avant/après ainsi que la revue Sally/Winston ne sont pas produites.
- Les PNG resteront des images et **non des graphiques Office éditables**, conformément au contrat Option B.
- Les modèles Word conservent le moteur historique SMN-402. L'adaptation géométrique des images DOCX n'est pas ajoutée par cette recette.
- La bibliothèque native `@resvg/resvg-js` est déjà testée sous Windows et Linux dans SMN-413 ; **la licence MPL-2.0 et l'emballage du paquet complet** méritent une revue de diffusion avant livraison.
- **BMAD :** le script `uv` n'a pas été exécuté dans cet environnement. Les tests sont exécutés réellement dans GitHub Actions ; les validations humaines sont décrites et non simulées.

## 6. Liens de vérification

- CI SMN-414 — exécution verte : https://github.com/JeanLamora75/SMN/actions/runs/42477866661 ; artefacts `smn-414-qa-ubuntu-latest` et `smn-414-qa-windows-latest` (36 PNG, 18 cas de densité, SHA256, checklist)
- Workflow SMN-414 : https://github.com/JeanLamora75/SMN/actions/workflows/smn-414-visual-acceptance.yml
- CI SMN-413 avec Resvg natif : https://github.com/JeanLamora75/SMN/actions/runs/42476755722
- UX Sally : https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-office-graphiques-adaptatifs-2026-11-08/CONTRAT-UX-OPTION-B.md
- Architecture Winston : https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/architecture/rapports-office/ADR-GRAPHIQUES-ADAPTATIFS-PPTX-2026-11-08.md
