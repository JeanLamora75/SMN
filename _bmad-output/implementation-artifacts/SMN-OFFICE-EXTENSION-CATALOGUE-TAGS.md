# SMN — Extension du catalogue de tags Office

**Date :** 6 novembre 2026  
**Stories concernées :** [SMN-400](https://lmn24.atlassian.net/browse/SMN-400), [SMN-401](https://lmn24.atlassian.net/browse/SMN-401), [SMN-402](https://lmn24.atlassian.net/browse/SMN-402) et [SMN-405](https://lmn24.atlassian.net/browse/SMN-405).  
**Statut :** développement publié sur `main` ; qualification finale soumise à la recette CI Windows/Linux et aux réserves SMN-405.

## 1. Principe conservé

Un modèle DOCX ou PPTX contient des tags librement placés. Pour une liste, **placer un marqueur `{{ROW:SOURCE}}` sur la ligne modèle du tableau**, et les tags de champs dans les cellules. SMN répète cette ligne sans configurer de zone dans l'application. Les lignes sans valeur sont remplacées par une ligne `N/D` ; une valeur numérique zéro reste zéro. Tous les formats conservent les styles et géométries du modèle pour les cas Open XML pris en charge.

Le catalogue complet est consultable dans l'interface **Rapports > Modèles > Catalogue des tags Office** (section dépliable, FR/EN).

## 2. Les neuf sources de tableaux (dont sept nouvelles)

| Source | Marqueur | Champs utilisables |
|---|---|---|
| Membres | `{{ROW:MEMBERS}}` | `MEMBER_NAME`, `MEMBER_ROLE`, `MEMBER_START`, `MEMBER_END` |
| Indicateurs | `{{ROW:INDICATORS}}` | `INDICATOR_NAME`, `INDICATOR_TAG`, `INDICATOR_VALUE`, `INDICATOR_UNIT` |
| Risques | `{{ROW:RISKS}}` | `RISK_TITLE`, `RISK_STATUS`, `RISK_PRIORITY`, `RISK_DATE` |
| Obstacles | `{{ROW:OBSTACLES}}` | `OBSTACLE_TITLE`, `OBSTACLE_STATUS`, `OBSTACLE_PRIORITY`, `OBSTACLE_DATE` |
| Notes | `{{ROW:NOTES}}` | `NOTE_TEXT`, `NOTE_STATUS`, `NOTE_DATE` |
| Cérémonies | `{{ROW:CEREMONIES}}` | `CEREMONY_TITLE`, `CEREMONY_STATUS`, `CEREMONY_START`, `CEREMONY_END`, `CEREMONY_DURATION` |
| Objectifs | `{{ROW:GOALS}}` | `GOAL_TITLE`, `GOAL_EVALUATION`, `GOAL_DESCRIPTION`, `GOAL_COMMENT` |
| Actions | `{{ROW:ACTIONS}}` | `ACTION_TITLE`, `ACTION_STATUS`, `ACTION_PRIORITY`, `ACTION_DATE` |
| Décisions | `{{ROW:DECISIONS}}` | `DECISION_TITLE`, `DECISION_STATUS`, `DECISION_PRIORITY`, `DECISION_DATE` |

**Exemple pour Word ou PowerPoint :** une ligne dont la première cellule contient `{{ROW:RISKS}}{{RISK_TITLE}}` et la seconde `{{RISK_STATUS}}` est répétée pour chaque risque pertinent du sprint.

Les valeurs sont issues du contexte **équipe/sprint déjà autorisé** de la génération :
- **Risques, obstacles, actions et décisions :** registres canoniques Epic 5, y compris snapshots de clôture pour les sprints fermés. La sélection suit la règle de pertinence et les liens explicites au sprint.
- **Objectifs :** lecture officielle `readSprintDetailGoals` ; snapshots figés pour sprints clôturés.
- **Cérémonies :** lecture officielle `readSprintDetailCeremonies` (standard, personnalisées et exceptionnelles, avec pagination complète) ; snapshots pour sprints clôturés.
- **Notes :** notes du tableau de bord (`smn_dashboard_note`) strictement filtrées par sprint et équipe ; les notes libres des brouillons de rapports constituent une source distincte non intégrée à `NOTES` dans cet incrément.
- **Membres et indicateurs :** projections existantes conservées.

**Sécurité :** une collection indisponible (schéma absent ou snapshot invalide) provoque une erreur explicite. Elle n'est pas présentée comme une collection vide. Pas de nouvelle table ni migration PostgreSQL, pas de lecture interéquipes.

**Volumétrie :** aucun plafond métier de tableau ; une protection technique expérimentale à 10 000 lignes empêche une saturation et renvoie une erreur sans troncature silencieuse. Les tableaux imbriqués et fusions verticales restent hors contrat de ce moteur Open XML expérimental.

## 3. Les six types de graphiques Office

| Type | Paramètre | Règle |
|---|---|---|
| Barres | `TYPE=bar` | Série chronologique |
| Courbes | `TYPE=line` | Série chronologique |
| Aire remplie | `TYPE=area` | Série chronologique |
| Secteurs | `TYPE=pie` | Répartition des dernières valeurs disponibles dans le sprint sélectionné, valeurs négatives interdites |
| Anneau | `TYPE=donut` | Même répartition avec centre évidé |
| Jauge semi-circulaire | `TYPE=gauge` | Une seule série entre 0 et 100 pour le sprint sélectionné, affichage 0–100 % |

Exemples :

- `{{CHART:TREND|TAGS=SP_DONE,SP_INIT|TYPE=pie}}`
- `{{CHART:TREND|TAGS=SP_DONE,SP_INIT|TYPE=donut}}`
- `{{CHART:TREND|TAGS=CAPACITY_RATE|TYPE=gauge}}`
- `{{CHART:TREND|TAGS=SP_DONE,SP_INIT|LAST=6|TYPE=line}}`

**Règles communes :** jusqu'à six indicateurs disponibles pour l'équipe, même unité, série issue exclusivement de la projection de tendances v33 (snapshots de sprints clos préservés). Les types secteurs/anneaux prennent la valeur **du sprint sélectionné**, et non la somme de tous les sprints de la période. La jauge prend la valeur du sprint sélectionné : taux en pourcentage, 0 à 100 inclus. Les dernières valeurs absentes restent absentes ; aucun zéro artificiel. Des valeurs totalement absentes ou un secteur de somme nulle affichent `N/D` plutôt qu'un graphique trompeur.

Les graphiques sont produits en PNG puis insérés dans Word/PowerPoint depuis le tag texte libre ; aucun emplacement graphique préalable n'est nécessaire. Le tag doit rester seul dans un paragraphe Word ou une zone de texte PowerPoint compatible.

## 4. Traçabilité technique

- [Catalogue visible dans l'interface](../../src/app/app/reports/office-tags.tsx)
- [Projection des sept familles métier](../../src/server/reports/office-business-rows.ts)
- [Générateur Word](../../scripts/smn-400-word-tables.mjs)
- [Générateur PowerPoint](../../scripts/smn-401-powerpoint-tables.mjs)
- [Rendu PNG](../../scripts/smn-402-trend-png.mjs)
- [Contrats graphiques](../../scripts/smn-402-office-chart-tags.mjs)
- [API de génération sécurisée](../../src/app/api/admin/reports/office-templates/generate/route.ts)
- [Tests des extensions](../../tests/smn-406-office-catalog-extensions.test.ts)
- [CI Windows/Linux](../../.github/workflows/office-catalog-extensions.yml)

## 5. Qualification et limites

Les tests de l'extension exécutent : découverte et génération des sept familles Word/PPTX, lecture métier simulée via requêtes contrôlées, cas zéro/N/D, secteurs/anneaux/jauges et valeurs invalides, puis non-régressions des graphiques et tableaux.

La validation **PostgreSQL v33 réel**, les rendus visuels dans Microsoft Word et PowerPoint sur Windows 11, les cas Open XML très complexes et la recette de concurrence SMN-403 restent à effectuer. Cette extension ne clôture donc pas automatiquement SMN-400, SMN-401, SMN-402 ni SMN-405.

**Référence CI :** https://github.com/JeanLamora75/SMN/actions/workflows/office-catalog-extensions.yml

## 6. Tags de contexte — équipe, sprint et produit

**Nouvelle extension :** valeurs simples utilisables dans les paragraphes Word et les zones de texte PowerPoint, y compris lorsque le marqueur est fragmenté entre plusieurs runs. Aucun emplacement technique ne doit être configuré dans SMN.

| Tag | Source SMN et comportement |
|---|---|
| `{{TEAM_NAME}}` | Nom de l'équipe autorisée |
| `{{SPRINT_NAME}}` | Nom du sprint autorisé |
| `{{SPRINT_START}}` | Date de début, formatée selon FR/EN |
| `{{SPRINT_END}}` | Date de fin, formatée selon FR/EN |
| `{{TODAY}}` | Date réelle de **génération**, selon le fuseau horaire du sprint et la langue du rapport |
| `{{SPRINT_GOAL}}` | **Tous** les objectifs enregistrés du sprint, séparés par ` ; ` ; pour un sprint clôturé, lecture du snapshot de clôture |
| `{{PRODUCT_NAME}}` | Produit lié à l'équipe, obtenu avec la résolution serveur autorisée |
| `{{PRODUCT_GOAL}}` | Objectif de produit saisi dans le contexte propre à l'équipe |
| `{{PRODUCT_VISION}}` | Vision du produit saisie dans le contexte propre à l'équipe |

**Distinction métier :** `{{SPRINT_GOAL}}` restitue les intitulés des objectifs du sprint (pas un objectif arbitrairement choisi), tandis que `{{ROW:GOALS}}` permet de présenter les objectifs en plusieurs lignes avec leur évaluation. Les données `PRODUCT_GOAL` et `PRODUCT_VISION` proviennent du contexte de l'équipe `smn_team_context` et ne doivent pas être inventées depuis un autre produit. Une valeur manquante ou indisponible devient `N/D`. Le nombre `0` conserve sa valeur.

L'identité du produit vient de `resolveAdminTeam` : elle est liée à l'équipe autorisée. Les valeurs historiques du sprint clôturé sont obtenues par `readSprintDetailGoals`, lequel exploite les snapshots existants lorsque disponibles.

**Cas d'utilisation :** une page de couverture PowerPoint peut contenir `{{PRODUCT_NAME}}`, `{{SPRINT_NAME}}`, `{{SPRINT_START}}`, `{{SPRINT_END}}` et `{{TODAY}}` ; une page d'introduction peut afficher `{{PRODUCT_VISION}}`, `{{PRODUCT_GOAL}}` et `{{SPRINT_GOAL}}`.

**Tests :** `tests/smn-office-context-scalars.test.ts` et workflow Windows/Linux `office-context-scalars.yml`. Ces vérifications restent distinctes de la recette visuelle Microsoft Office et de la recette PostgreSQL réelle.

## 7. Centre Rapports : organisation des onglets et chemins Office (7 novembre 2026)

**Demande UX :** le menu du Centre Rapports est ordonné **Rapports / Modèles / Tags / Archives**. L'onglet **Modèles** est désormais réservé aux fichiers Office `.docx` et `.pptx` ; les anciens modèles internes (« Standard », modèles personnalisés de rapports historiques) ne sont plus affichés dans ce catalogue, **sans aucune suppression de leurs données ni modification du moteur de rapports historiques**. La documentation complète des tags a été déplacée dans le nouvel onglet **Tags**, en affichage développé par défaut ; elle a été retirée du catalogue des modèles Office.

**Répertoires serveur (Windows 11, valeurs par défaut) :**
- Modèles : `%LOCALAPPDATA%\ScrumMasterNotebook\office-templates` via `officeTemplatesDirectory()` ou configuration `SMN_OFFICE_TEMPLATES_DIR`.
- Rapports enregistrés : `%LOCALAPPDATA%\ScrumMasterNotebook\office-reports` via `officeReportsDirectory()` ou configuration `SMN_OFFICE_REPORTS_DIR`.

La page **Modèles** affiche les chemins serveur **résolus effectivement** (y compris quand des variables d'environnement redéfinissent les dossiers), sans en déduire un chemin du navigateur client. Les chemins sont visibles même si le catalogue des modèles est vide. **Actualiser** permet de redécouvrir les fichiers Office déposés dans le dossier ; le bouton **Enregistrer** utilise le dossier de destination. **Télécharger** enregistre selon le fonctionnement du navigateur, pas automatiquement dans `office-reports`.

**Limites :** la fonction ne crée pas automatiquement le dossier de modèles. Le dossier des rapports est créé lors de l'opération de sauvegarde. Le contexte et les protections d'accès aux données des équipes et sprints demeurent inchangés.

**Tests et contrôles :** `tests/smn-report-center-office-navigation.test.ts` et CI Windows/Linux `.github/workflows/office-context-scalars.yml` ; recette visuelle manuelle à confirmer sous Windows 11.

## 8. Extension dépendances — SMN-406 (07/11/2026)

Les dépendances, déjà présentes dans le registre canonique, sont exportables dans des tableaux Word/PowerPoint et dans les paragraphes de zones de texte PowerPoint. Aucun modèle existant n'est modifié ou migré.

| Tag | Sens |
|---|---|
| `{{ROW:DEPENDENCIES}}` | Répéter les dépendances pertinentes du sprint |
| `{{DEPENDENCY_TITLE}}` | Intitulé de la fiche |
| `{{DEPENDENCY_STATUS}}` | Statut traduit |
| `{{DEPENDENCY_DATE}}` | Date métier du registre |
| `{{DEPENDENCY_REQUESTER}}` | Demandeur (équipe courante ou libellé externe) |
| `{{DEPENDENCY_CONTRIBUTOR}}` | Contributeur (équipe courante ou libellé externe) |
| `{{DEPENDENCY_DUE_DATE}}` | Échéance de la dépendance |
| `{{DEPENDENCY_AT_RISK}}` | Vigilance « À risque », Oui/Non ou Yes/No |
| `{{DEPENDENCY_OWNER}}` | Responsable de la fiche |

Une fiche associée à plusieurs sprints n'est rendue qu'une fois par export de sprint. La sélection et l'appartenance sont déterminées par `readSprintRegisters` et `readEpic5SprintRegisterSource`, qui appliquent le périmètre équipe/sprint. Les autres champs métier sont lus dans les tables canoniques des dépendances, uniquement pour les sprints non clôturés et les fiches appartenant à l'équipe autorisée. Les tables de détails facultatives absentes produisent des champs `N/D`, non de fausses valeurs.

**Historique :** les sprints clôturés utilisent leur snapshot qualitatif : intitulé, statut et date sont figés. Le snapshot ne contient pas encore les parties prenantes, le responsable, l'échéance ni la vigilance : ces champs deviennent `N/D` au lieu de prendre les données courantes. Une évolution de la capture historique serait nécessaire pour les figer dès la clôture.

**Cas vide :** dans les tableaux Office, la ligne témoin `N/D` subsiste ; dans un paragraphe de zone de texte PowerPoint, « Aucune dépendance identifiée » / « No dependencies identified ». Le moteur garde les styles et les dimensions de la maquette et ne repositionne pas automatiquement les objets.

**Tests :** `tests/smn-406-office-catalog-extensions.test.ts` et `tests/smn-401-powerpoint-tables.test.mjs`. La recette PowerPoint/Word Windows et PostgreSQL réel reste à confirmer.

**Story :** https://lmn24.atlassian.net/browse/SMN-406

**Correction documentaire :** depuis le changement des valeurs par défaut, les répertoires Office sont désormais `SMN/data/office/templates` et `SMN/data/office/reports`, créés au démarrage/installation, sauf surcharge par variables d'environnement absolues. Les anciennes indications de la section 7 concernant `%LOCALAPPDATA%` et l'absence de création automatique sont historiques et remplacées par cette règle.
