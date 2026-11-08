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

**Preuve finale Windows/Linux (tests et builds) :** https://github.com/JeanLamora75/SMN/actions/runs/42476755722.

## Résultats définitifs de validation (08/11/2026)

**CI de référence :** https://github.com/JeanLamora75/SMN/actions/runs/42476755722 — **succès Windows et Ubuntu** avec Node 24/pnpm 12.10.

- **Windows : 25 tests de géométrie/rendu/OPC + 12 tests de non-régression Word/PowerPoint = 37/37**, vérification TypeScript, ESLint et **build Next.js standalone réussis**.
- **Linux : 37/37 tests**, TypeScript, ESLint et build Next.js standalone réussis.
- **Linux, packaging :** une copie isolée du bundle standalone peut charger Resvg et générer un PNG valide 400 × 240, sans utiliser les dépendances du dépôt source.
- **Windows, packaging :** Next standalone ne reprend pas toujours le binaire optionnel `@resvg/resvg-js-win32-x64-msvc` à la racine de `node_modules`. Le fichier `scripts/windows/package-portable.mjs` a été corrigé pour localiser le module natif réellement installé par pnpm via `require.resolve`, puis copier explicitement les deux modules `resvg-js` et `resvg-js-win32-x64-msvc` dans le paquet. Un test CI copie les deux modules vers une arborescence isolée et produit réellement un PNG 400 × 240 (`resvg-windows-standalone-smoke-ok`).
- Le workflow temporaire de régénération du lockfile a été supprimé après commit des versions exactes ; `pnpm install --frozen-lockfile` réussit sur les deux OS.
- **Limite de preuve :** le test de packaging Windows ne copie pas l'intégralité du bundle Next.js. Les copies complètes du bundle ont rencontré des erreurs d'accès sur des jonctions pnpm existantes ; un build Next.js a également émis un avertissement de copie d'un fichier externe `node:fs_promises` sans empêcher le build. La construction d'une archive SMN portable complète, son démarrage et le chargement de modèles PowerPoint réels restent à démontrer lors du flux d'installation/recette SMN-414. **Ne pas assimiler le smoke test Resvg à un lancement complet du paquet Windows.**

Les tests apportent une preuve technique réelle de l'intégration et du rendu natif, mais **pas encore** une preuve de fidélité visuelle sur le véritable modèle PowerPoint fourni par l'utilisateur.

## Risques et limites résiduels

1. Le parseur dédié et les tests couvrent des formes textes PowerPoint non groupées et non pivotées ; les rotations, formes groupées et géométries invalides sont refusées explicitement.
2. Le rendu utilise encore des polices de substitution locales (Arial/sans-serif). Leur disponibilité et le résultat réel sur Windows 11 restent à contrôler lors de la recette SMN-414.
3. Aucun graphique PowerPoint natif éditable n'est créé : le contrat accepté est une **image PNG**.
4. L'absence de mutation est prouvée sur les packages de tests synthétiques ; l'ouverture et la fidélité d'un modèle PowerPoint utilisateur réel restent à vérifier par Sally pendant SMN-414.
5. La conformité licence MPL-2.0 et le conditionnement complet du runtime Windows portable doivent encore être confirmés par les preuves de packaging et l'arbitrage Winston sur SMN-410. Aucun succès de CI ne dispense de cette vérification.
6. Le workflow `uv` officiel BMAD n'a pas été exécuté. Le travail a été réalisé par intégrations GitHub/Jira et actions CI, selon le mode de fonctionnement autorisé du projet.

**Définition de terminé :** tests ciblés Windows/Linux verts et documentation/Jira publiés, avant recette visuelle globale SMN-414. Les points non vérifiés ne doivent pas être présentés comme validés.

## Correctif de régression constatée après SMN-413 (08/11/2026)

**Signal utilisateur :** le modèle « Rapport de Sprint FR — PPTX », pour « PI26 Q4.2 Sprint 103 », renvoie un message générique « L'insertion du graphique PowerPoint a échoué » alors que le même modèle fonctionnait avant l'activation du renderer adaptatif. Le PowerPoint source du modèle n'a pas été fourni en binaire dans cette conversation : **cause exacte non prouvée sur le fichier original**.

**Constats dans le code :**
1. La transformation `p:sp → p:pic` exigeait à tort `<p:cNvPr .../>` au format autofermant. Les formes Open XML valides peuvent contenir `<p:cNvPr ...><a:hlinkClick.../></p:cNvPr>`. Le nouveau moteur refusait la forme avec `office-chart-invalid-shape` ; le moteur historique n'imposait pas cette restriction.
2. L'insertion exigeait une fermeture `</Relationships>`. Un `<Relationships .../>` autofermant est légal et doit être développé pour accueillir une relation image.
3. L'interface masquait `reason` et `slide` fournis par l'API et affichait un message générique.

**Correctifs publiés sur `main` :** lecteur tolérant les deux formes de `p:cNvPr`, gestion des deux écritures de `Relationships` en préservant son préfixe de namespace éventuel, tests de non-régression pour ces écritures, messages FR/EN détaillant le motif et la diapositive concernée.

**Garantie et limite :** les nouveaux tests prouvent ces cas Open XML synthétiques ; ils ne remplacent pas l'ouverture du véritable PPTX utilisateur. Réessayer après récupération de `main`. Si un autre motif est remonté, poursuivre sur le code précis et le numéro de diapositive sans dégrader silencieusement vers une image basse définition.

**CI correctif vérifiée :** https://github.com/JeanLamora75/SMN/actions/runs/42478902966 — **Windows 39/39 et Linux 39/39 tests réussis** (27 tests de géométrie/rendu/insertion incluant deux nouveaux cas Open XML, 12 tests de non-régression), TypeScript, ESLint, builds Next.js standalone et smoke tests natifs Resvg validés sur les deux OS. **Il reste à vérifier la résolution sur le vrai modèle utilisateur.**
