# SMN-413 — Insertion Open XML des graphiques adaptatifs PowerPoint

**Agent :** Amelia — 08/11/2026  
**Jira :** https://lmn24.atlassian.net/browse/SMN-413  
**Epic :** SMN-6 ; prérequis : SMN-410, SMN-411 et SMN-412.  
**Objet :** activer les graphiques PNG adaptatifs dans les rapports PowerPoint, sans changer la génération Word.

## Comportement fonctionnel

Le tag `{{CHART:TREND|TYPE=bar|TAGS=...|LAST=6}}` continue d'utiliser le catalogue d'indicateurs et la projection historique v33 de SMN. Dans les modèles **PPTX uniquement**, les dimensions réelles en EMU de chaque `p:sp` porteuse de tag sont lues avant génération, puis le moteur Resvg compose un graphique PNG au même ratio.

Le fichier généré remplace uniquement la forme texte porteuse du tag par `p:pic`. Le nouveau média PNG et une relation image propre à la diapositive sont ajoutés au package Open XML. L'identifiant de forme, sa transformation `a:xfrm` (position et dimensions), son ordre dans `p:spTree` et les autres parties non ciblées sont conservés. Chaque cadre a une image et un `rId` distincts.

Les trois autres cadres du modèle de test restent inchangés s'ils ne contiennent pas de tag. Les logos, photos, thèmes et autres relations ne sont pas modifiés. En l'absence de valeurs, la forme affiche `N/D` plutôt qu'un graphique fictif.

Les erreurs (zone groupée/pivotée, tag invalide, géométrie impossible, zone trop petite, PNG hors budget, structure OPC incorrecte) produisent un résultat HTTP 422 explicite et traduit en français/anglais dans l'interface. Les diagnostics renvoyés ne contiennent pas de chemin serveur ; aucune sauvegarde n'est lancée tant que le package n'est pas intégralement généré et validé.

La génération des modèles **DOCX reste sur le renderer historique** (SMN-402) et conserve ses dimensions/limitations précédentes.

## Choix techniques

- `scripts/smn-413-adaptive-pptx.mjs` : `insertAdaptivePowerPointCharts(pkg,render)`, validateur PNG et proportions, modifications OPC ciblées.
- `scripts/smn-411-chart-targets.mjs` : découverte immuable des formes PPTX.
- `scripts/smn-412-adaptive-chart.mjs` : composition SVG et PNG à 300 ppp, `@resvg/resvg-js` directement importé depuis les dépendances de production.
- `src/server/reports/office-indicator-charts.ts` : projection unique `selectOfficeIndicatorSeries` réutilisée par l'ancien renderer Word et le renderer adaptatif PPTX.
- `src/app/api/admin/reports/office-templates/generate/route.ts` : sélection PPTX→nouvel adaptateur, DOCX→chemin existant.
- `src/app/app/reports/office-template-catalog.tsx`, `src/i18n/fr.json`, `src/i18n/en.json` : messages et codes d'erreur localisés.
- `package.json` et `pnpm-lock.yaml` : `@resvg/resvg-js` version fixe 2.6.2 comme dépendance d'exécution, hors POC isolé. Le lock a été généré et publié automatiquement via GitHub Actions.
- `next.config.ts` : `serverExternalPackages: ["@resvg/resvg-js"]`, pour préserver le chargement du binaire natif dans le serveur Next.js.
- `src/app/app/reports/office-tags.tsx` : documentation des tags et restrictions de zones adaptatives.

## Critères d'acceptation

| Critère | Justificatif technique |
|---|---|
| AC-OPC-01 | `p:sp` remplacé par `p:pic` au même index ; `a:xfrm` recopié à l'identique ; rapport PNG/EMU vérifié avec tolérance < 1 %. |
| AC-OPC-02 | Média `ppt/media/smn413-chart-N.png` unique ; relation image `rId` libre et content type PNG ; tests multislides. |
| AC-OPC-03 | Parties ZIP non ciblées comparées sur leurs octets décompressés ; photos, logo, thème et trois autres cartes préservés. |
| AC-OPC-04 | Résolution synchrone et atomique avant `saveOfficeReport` ; aucune sortie en cas d'erreur ; codes localisés FR/EN. |
| AC-OPC-05 | Plusieurs tags et plusieurs diapositives indépendants ; une seule carte porteuse n'altère pas les trois autres. |
| AC-OPC-06 | Tests OPC, PNG, géométrie, anciens tags, chemin Word historique ; typecheck et ESLint sur Windows/Linux. |

**Tests :**
- `tests/smn-413-adaptive-pptx.test.mjs` : forme et ordre, relations uniques, médias, N/D, refus des PNG invalides, absence de mutation en échec et maintien des autres objets.
- `tests/smn-413-office-route.test.mjs` : routage PPTX/Word, diagnostics traduits et ordre des opérations de validation/sauvegarde.
- `tests/smn-411-chart-targets.test.mjs`, `tests/smn-412-adaptive-chart.test.mjs` et `tests/smn-402-office-trends.test.ts` : non-régressions.
- `.github/workflows/smn-413-adaptive-pptx.yml` : Node 24, pnpm 12.10.0, installation figée, Windows/Linux, types, lint et contrôle supplémentaire du build standalone Linux.

**Preuve de tests techniques Windows et Linux (avant ajout du contrôle standalone) :** https://github.com/JeanLamora75/SMN/actions/runs/42475072306. Les validations du build Next.js standalone et de la présence des modules natifs doivent être examinées dans la CI complémentaire : https://github.com/JeanLamora75/SMN/actions/runs/42475219005.

## Risques et limites résiduels

1. Le parseur dédié et les tests couvrent des formes textes PowerPoint non groupées et non pivotées ; les rotations, formes groupées et géométries invalides sont refusées explicitement.
2. Le rendu utilise encore des polices de substitution locales (Arial/sans-serif). Leur disponibilité et le résultat réel sur Windows 11 restent à contrôler lors de la recette SMN-414.
3. Aucun graphique PowerPoint natif éditable n'est créé : le contrat accepté est une **image PNG**.
4. L'absence de mutation est prouvée sur les packages de tests synthétiques ; l'ouverture et la fidélité d'un modèle PowerPoint utilisateur réel restent à vérifier par Sally pendant SMN-414.
5. La conformité licence MPL-2.0 et le conditionnement complet du runtime Windows portable doivent encore être confirmés par les preuves de packaging et l'arbitrage Winston sur SMN-410. Aucun succès de CI ne dispense de cette vérification.
6. Le workflow `uv` officiel BMAD n'a pas été exécuté. Le travail a été réalisé par intégrations GitHub/Jira et actions CI, selon le mode de fonctionnement autorisé du projet.

**Définition de terminé :** tests ciblés Windows/Linux verts et documentation/Jira publiés, avant recette visuelle globale SMN-414. Les points non vérifiés ne doivent pas être présentés comme validés.
