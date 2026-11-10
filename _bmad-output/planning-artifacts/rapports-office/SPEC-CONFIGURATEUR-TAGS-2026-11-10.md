---
title: "SMN — Configurateur de tags Word/PowerPoint"
status: "specification-fonctionnelle-validee-sur-perimetre; implementation-a-realiser"
created: "2026-11-10"
author: "John — BMAD Product Manager"
framework: "BMAD v6.12.4"
scope: "Option A — toutes les familles et options réellement prises en charge"
review_required: "Amelia — implémentation et validation; Winston — revue technique si architecture modifiée"
---

# Configurateur de tags — Spécification fonctionnelle pour Amelia

## 0. Décision et statut

**Décision utilisateur du 10/11/2026 :** créer un bouton **Configurateur** dans **Rapports > Tags**, ouvrant une modale de construction visuelle de tags pour les modèles Word et PowerPoint. Le périmètre initial est **Option A** : toutes les familles de tags et leurs options réellement supportées. Le résultat est une expression complète et personnalisée, copiable en un clic.

Ce document est une **spécification à implémenter**, non une preuve de développement ou de recette. Aucune création ni mise à jour de Jira n'est revendiquée. L'exécution du script `uv` BMAD n'est pas possible dans le contexte GitHub/ChatGPT ; le cadrage a été effectué par lecture directe des sources.

## 1. Problème, objectif et non-objectifs

La documentation actuelle liste les tags et les exemples. Pour composer notamment un `ROW` avec `SORT` ou un graphique paramétré, l'utilisateur doit connaître les noms techniques et la grammaire. Il doit pouvoir obtenir un tag valide sans écrire cette syntaxe.

**Objectif mesurable :** depuis le Centre Rapports, un utilisateur habilité configure et copie un tag reconnu avec 0 saisie de syntaxe technique, pour chacun des quatre groupes : valeurs simples, indicateurs, lignes de tableau et graphiques.

**Hors périmètre :** création de nouvelles familles ou de nouveaux paramètres que le moteur d'export ne comprend pas ; éditeur de modèles DOCX/PPTX ; rendu d'un rapport dans la modale ; création ou modification d'indicateurs ; modification des données métier ; enregistrement persistant des configurations de tags ; nouveaux filtres `ROW` ou inventaire de sources élargi artificiellement.

## 2. Références de code vérifiées le 10/11/2026

- `src/app/app/reports/page.tsx` : onglet `tags` et composant `OfficeTags`.
- `src/app/app/reports/office-tags.tsx` : définitions `officeScalarDefinitions`, `officeRowDefinitions`, `officeChartDefinitions`, FR/EN et bouton copier.
- `scripts/smn-399-office-scalars.mjs` : scalaires, `INDICATOR_<TAG>` et rejet des paramètres de scalaires.
- `scripts/smn-400-word-tables.mjs` et `scripts/smn-401-powerpoint-tables.mjs` : marqueurs `ROW`, tableaux Word, tableaux et paragraphes PowerPoint.
- `scripts/smn-office-row-sort.mjs` : `SORT=FIELD[:ASC|DESC][,...]`, tri stable et contrôle syntaxique ; publication récente à qualifier par les tests et la CI.
- `scripts/smn-402-office-chart-tags.mjs` : paramètres `TYPE`, `TAGS`, `LAST`, `STYLE`.
- `src/server/reports/chart-style-contract.ts` et `src/server/reports/office-chart-style-resolver.ts` : catalogue de styles et règles de priorité.
- `src/app/app/reports/office-template-catalog.tsx` : chargement du catalogue réel des styles et contexte d'export.

Les références précédentes sont **constatées dans le code** ; elles ne prouvent pas à elles seules une recette verte.

## 3. Localisation et expérience UX

### UX-01 — Point d'entrée
- Dans l'onglet **Rapports > Tags**, un bouton **Configurateur** avec icône adaptée est placé à droite du titre « Documentation des tags — Word et PowerPoint ».
- Le guide, ses cinq sections repliables et ses boutons de copie restent disponibles sans changement de comportement.
- Le bouton ouvre une **modale centrée**, de style Cockpit Agile, superposée à la page ; pas de navigation et pas de fermeture implicite du guide.

### UX-02 — Structure de la modale
- En-tête : « Configurateur de tags », description courte, bouton de fermeture accessible.
- Choix de famille (4 options) : **Informations simples**, **Indicateurs**, **Tableaux**, **Graphiques**.
- Barre de recherche accessible par clavier ; filtre au minimum le titre métier, la description et le nom technique.
- Sélecteur de tag/source parmi les éléments applicables et accessibles.
- Zone **Options** contextuelle : seulement les paramètres compatibles avec le tag sélectionné ; aide succincte au niveau de chaque paramètre.
- Zone fixe ou visuellement distincte **Tag généré** (police monospace, retour à la ligne autorisé), accompagnée de **Copier le tag** et **Réinitialiser**.
- Les champs sont libellés en langage métier ; la grammaire du tag n'est pas éditée manuellement dans le configurateur.
- Sur mobile, modale scrollable avec accès permanent aux actions, sans débordement horizontal.

### UX-03 — Comportements
- Le tag est recalculé immédiatement après tout changement.
- Changer de tag ou de famille réinitialise les paramètres incompatibles ; aucun reliquat de configuration ancienne ne doit être conservé.
- **Réinitialiser** revient aux valeurs par défaut du tag courant.
- Copier place exactement l'expression affichée dans le presse-papiers, sans guillemets ni espaces supplémentaires ; une confirmation discrète est annoncée.
- La modale **reste ouverte après une copie réussie** pour permettre plusieurs copies.
- Annuler/Fermer ne modifie aucune donnée et ne sauvegarde aucun état métier.
- En cas d'échec du presse-papiers, message explicite et texte toujours sélectionnable.
- Focus initial dans le titre/sélecteur, piège de focus, fermeture Escape, retour du focus au bouton d'ouverture ; libellés et erreurs accessibles.

## 4. Catalogue fonctionnel complet

### F01 — Informations simples

Éléments issus de `officeScalarDefinitions` et `SCALAR_NAMES` : `TEAM_NAME`, `SPRINT_NAME`, `SPRINT_START`, `SPRINT_END`, `SPRINT_STATUS`, `TODAY`, `SPRINT_GOAL`, `PRODUCT_NAME`, `PRODUCT_GOAL`, `PRODUCT_VISION`, `LINK_COUNT_TRANSVERSE`, `LINK_COUNT_TEAM`. Une information simple ne possède **aucune option** de formatage au niveau du tag dans le parseur actuel.

- Sélection d'une entrée, restitution exacte de `{{TEAM_NAME}}` par exemple.
- Absence de champs d'options artificiels et absence de proposition de syntaxe non prise en charge.
- Descriptions et notes contextualisées en FR/EN.
- Aucun accès aux valeurs réelles ou aux données personnelles nécessaire pour fabriquer un tag simple.

### F02 — Indicateurs dynamiques

Deux usages distincts sont conservés :
1. **Valeur simple d'un indicateur actif** : sélectionner un indicateur réel, former `{{INDICATOR_<TAG_REEL>}}` selon la normalisation du moteur. Ne jamais copier littéralement `<TAG>`.
2. **Tableau des indicateurs** : famille Tableaux, source `INDICATORS`, avec tags de colonnes et `SORT`.

Règles :
- Afficher les indicateurs de l'équipe courante autorisés et non archivés ; libellé métier + tag technique.
- Si aucun contexte d'équipe n'est déterminé, demander un choix d'équipe accessible ou afficher un état explicite ; ne pas inventer une équipe.
- Si aucun indicateur actif n'est disponible, état vide explicite ; **Copier** désactivé.
- Si catalogue inaccessible, erreur localisée ; pas de proposition d'un indicateur fictif.
- Ne pas proposer d'édition de formule ni de sélection de valeur de sprint ; le tag s'évalue lors de la génération.

### F03 — Tableaux de données métier

Sources documentées : `MEMBERS_ACTIVE`, `MEMBERS_INACTIVE`, `INDICATORS`, `RISKS`, `OBSTACLES`, `DEPENDENCIES`, `NOTES`, `CEREMONIES`, `GOALS`, `ACTIONS`, `DECISIONS`, `LINKS_TRANSVERSE`, `LINKS_TEAM`. Compatibilité legacy `MEMBERS` à conserver côté moteur ; sa présence dans le sélecteur doit être décidée selon le catalogue officiel exposé, sans l'introduire comme nouvelle fonctionnalité.

- La source détermine la liste **exacte des champs autorisés**. Ces champs sont affichés à titre d'aide et peuvent être copiés individuellement pour remplir les cellules du modèle.
- Exemple de ligne : marqueur `{{ROW:RISKS|SORT=RISK_PRIORITY:DESC,RISK_TITLE:ASC}}` et, dans les cellules, `{{RISK_TITLE}}`, `{{RISK_STATUS}}`, etc.
- Option facultative **Activer un tri personnalisé** ; désactivée par défaut : `{{ROW:RISKS}}`.
- Lorsque le tri est activé : au moins un critère, avec sélection de colonne parmi les champs de cette source, direction ASC ou DESC (ASC par défaut).
- **Ajouter / supprimer / réordonner** les critères ; priorité de haut en bas, sans doublon. Liste des colonnes excluant celles déjà utilisées.
- Les valeurs absentes sont toujours classées après les valeurs renseignées ; si égalité, tri stable. Respecter le comportement réel du moteur.
- Les labels français des priorités/statuts ne garantissent **pas** un classement de criticité métier. `DESC` signifie ordre du comparateur du moteur, et non nécessairement « Critique avant Haute ». L'aide doit expliquer cela ; ne pas promettre un tri métier absent.
- Pas de filtre `SCOPE` sur `ROW` tant que le parseur ne le gère pas. Pour les liens, utiliser `LINKS_TRANSVERSE` ou `LINKS_TEAM` ; aucun `ROW:LINKS|SCOPE=...` fictif.
- Montrer où positionner le marqueur : ligne d'exemple Word/PPTX ou paragraphe à répéter dans une zone de texte PPTX.
- Ne pas proposer de tri d'un tag scalaire ni de `SORT` sur un graphique.

### F04 — Graphiques

Source `CHART:TREND` ; paramètres actuellement reconnus :
- `TYPE` : `bar`, `line`, `area`, `pie`, `donut`, `gauge`. Valeur par défaut : `bar`.
- `TAGS` : liste d'indicateurs, **1 à 6 éléments**, distincts, avec tags réellement utilisables pour les graphiques, pas les libellés d'affichage ; le paramètre est facultatif et son absence conserve la logique de sélection par défaut du moteur.
- `LAST` : entier **1 à 24**, valeur par défaut **6**. Proposer le paramètre uniquement si pertinent pour le type graphique ; ne pas le présenter comme un filtre historique pour des graphiques de répartition instantanée (`pie`, `donut`, `gauge`).
- `STYLE` : ID réel de style compatible ou `legacy`, facultatif ; l'absence respecte la priorité existante : style dans le tag > sélection facultative à l'export > défaut global.
- Générer la syntaxe canonique `{{CHART:TREND|TYPE=line|TAGS=...|LAST=6|STYLE=corporate}}` uniquement avec les options activées ou celles dont l'explicitation est voulue ; ordre déterministe des clés `TYPE`, `TAGS`, `LAST`, `STYLE`.
- Compatibilité métier du type : `gauge` requiert exactement **une valeur numérique comprise entre 0 et 100** à l'exécution ; `pie` et `donut` requièrent des valeurs adaptées à une répartition (pas de valeurs négatives). Plusieurs séries pour `line`/`bar`/`area` doivent respecter les règles d'unités du moteur. Le configurateur valide la structure et avertit des contraintes de données qu'il ne peut pas garantir à la conception.
- Si aucun indicateur graphique disponible, expliciter la raison sans générer une sélection imaginaire.
- Rappeler que le tag graphique doit être seul dans un paragraphe Word ou une zone de texte PowerPoint compatible.
- Lorsque la liste des styles n'est pas disponible, ne pas proposer d'ID personnalisé non vérifié ; l'option **Style par défaut** reste disponible si le moteur sait la résoudre.

### F05 — Recherche

- Recherche insensible à la casse et aux accents sur noms métier, descriptions et codes.
- La liste de résultats se limite à la famille choisie, sauf si un mode « Toutes les familles » est explicitement prévu pour la recherche initiale.
- Aucun résultat : message avec possibilité d'effacer la recherche.
- Aucune duplication de code de tag non justifiée.

## 5. Validation des expressions et sécurité

- Construire chaque tag à partir d'un modèle structuré et de paramètres **validés selon la grammaire côté moteur**, non par interpolation libre d'un champ utilisateur.
- Pour les graphiques, exploiter/tester le parseur `parseOfficeChartTag` et les contraintes de style/catalogue.
- Pour les tableaux, exploiter/tester le parseur `parseOfficeRowMarker`, les colonnes autorisées et la limite de **32 critères** du parseur (la liste réelle de champs est généralement plus courte).
- Pour les scalaires, vérifier l'appartenance au catalogue et l'absence de paramètres non pris en charge.
- En cas d'option incompatible, message lisible et **Copier** désactivé ; ne jamais afficher une expression comme valide si elle ne peut pas être comprise par l'export.
- Les listes dynamiques (équipes, indicateurs, styles) doivent utiliser les API autorisées et les permissions serveur existantes. Aucun élargissement d'habilitation ; pas de fuite inter-équipe.
- Aucun secret, formule interne sensible, valeur individuelle ou donnée de membre ne doit être inséré dans le tag ; seules des références de champs sont produites.
- Aucun rendu Office ni génération de fichiers depuis la modale.
- Ne jamais prétendre que la validation syntaxique garantit la disponibilité des données au moment de l'export.

## 6. Internationalisation et accessibilité

- Interface et messages entièrement localisés **FR/EN** dans le système i18n SMN, sans chaînes visibles codées en dur dans les composants.
- Le nom du paramètre technique (`SORT`, `TAGS`, `LAST`, `STYLE`) et la valeur du tag restent indépendants de la langue.
- Compatibilité thèmes SMN/Cockpit Agile, affichage clair/sombre si pris en charge.
- Utilisation clavier complète, libellés explicites, annonce de copie/erreur, attributs de modale accessibles, navigation focus sûre, contraste suffisant et mise en page responsive.

## 7. Critères d'acceptation — pour Amelia

| ID | Critère vérifiable |
|---|---|
| AC-01 | Rapports > Tags affiche **Configurateur**, sans retirer le guide ni ses actions de copie. |
| AC-02 | Un clic ouvre une modale centrée au-dessus de la page, sans changer l'URL ni le contexte. |
| AC-03 | Quatre familles accessibles ; chaque entrée du catalogue Office documenté apparaît dans la bonne famille. |
| AC-04 | Recherche par libellé, description ou code ; aucun résultat géré explicitement. |
| AC-05 | Sélectionner `TEAM_NAME` affiche exactement `{{TEAM_NAME}}`, sans option fictive. |
| AC-06 | Sélectionner un indicateur réel actif de l'équipe affiche exactement son tag scalaire interprétable ; un exemple `<TAG>` ne peut jamais être copié. |
| AC-07 | En absence d'équipe, d'indicateur autorisé ou si le chargement échoue, le configurateur n'invente aucune valeur ; le bouton Copier est désactivé si nécessaire. |
| AC-08 | Toutes les sources de tableaux documentées sont disponibles, avec leurs champs autorisés uniquement. |
| AC-09 | Un tableau sans tri produit `{{ROW:RISKS}}` ; un tri double priorité DESC puis titre ASC produit exactement `{{ROW:RISKS|SORT=RISK_PRIORITY:DESC,RISK_TITLE:ASC}}`. |
| AC-10 | Ajout, suppression, ordre de priorité et sens ASC/DESC sont modifiables ; doublons et colonnes hors source impossibles. |
| AC-11 | Le configurateur n'émet pas de `SCOPE` ou autre paramètre non interprété pour les tableaux. |
| AC-12 | Les six types de graphiques du moteur sont disponibles et produisent `TYPE` valide. |
| AC-13 | Les graphiques proposent des séries réelles (1–6), `LAST` (1–24 quand pertinent) et `STYLE` valide, sans dupliquer les paramètres. |
| AC-14 | Changement de type graphique nettoie les options devenues incompatibles ; `gauge` ne permet pas plusieurs séries. |
| AC-15 | En présence d'un `STYLE` explicite, ce style est prioritaire sur le style choisi lors de l'export ; en l'absence de `STYLE`, le moteur garde son comportement initial. |
| AC-16 | La validation syntaxique d'un tag émis passe les contrôles du moteur cible ; une option invalide désactive Copier et présente une erreur localisée. |
| AC-17 | Toute modification d'option actualise immédiatement l'aperçu du tag complet, sans cliquer sur un bouton « Générer ». |
| AC-18 | Copier met dans le presse-papiers **exactement** le tag affiché, confirme le succès et conserve la modale ouverte. |
| AC-19 | Échec du presse-papiers, fermeture Escape, retour du focus et Réinitialiser sont traités correctement. |
| AC-20 | Les quatre familles, descriptions, champs, validations et retours sont disponibles en FR et EN ; aucun texte utilisateur en dur. |
| AC-21 | Les modifications n'altèrent pas la création de rapports existants ni les modèles Office ; anciens tags sans paramètres toujours reconnus. |
| AC-22 | Tests unitaires et intégration passent pour les quatre familles, erreurs, tri `SORT` et graphique ; vérifier les résultats réels de CI et les cas Windows/Office. |

## 8. Jeux de recette fonctionnelle

1. **Scalaire** : équipe sélectionnée -> Informations simples > Nom de l'équipe -> `{{TEAM_NAME}}` -> copier -> coller dans Word.
2. **Indicateur** : équipe avec indicateur actif -> Indicateurs > indicateur du catalogue -> tag `{{INDICATOR_<identifiant réel>}}` (sans placeholder) ; équipe sans indicateur -> état vide.
3. **Tableau membres** : source Membres actifs -> trier fonction ASC puis nom ASC -> `{{ROW:MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION:ASC,MEMBER_NAME:ASC}}` ; colonnes `MEMBER_FUNCTION` et `MEMBER_NAME` copiables séparément.
4. **Tableau risques** : source Risques -> priorité DESC puis titre ASC -> `{{ROW:RISKS|SORT=RISK_PRIORITY:DESC,RISK_TITLE:ASC}}` ; vérifier la nuance de classement lexicographique des libellés.
5. **Liens** : choix `LINKS_TEAM` et `LINKS_TRANSVERSE` séparés ; aucune option `SCOPE` non supportée.
6. **Graphique tendance** : type line + deux indicateurs réels compatibles + LAST=6 + style corporate existant -> tag syntaxiquement valide, collable dans une zone Word ou PPTX.
7. **Graphique jauge** : type gauge + 1 seul indicateur ; deuxième indicateur impossible ; avertissement plage 0..100.
8. **Erreurs** : API indisponible, style supprimé, sélection de colonne impossible, échec presse-papiers, absence de résultat de recherche.
9. **Non-régression** : ancien `{{ROW:RISKS}}`, ancien `{{CHART:TREND}}`, anciens tags scalaires et export DOCX/PPTX.
10. **Accessibilité/réactivité** : clavier seul, 320 px, thème, FR/EN, Escape et restitution du focus.

## 9. Contraintes et questions d'intégration pour Amelia

1. **Catalogue commun** : éviter que les capacités exposées par le configurateur divergent du parseur. Privilégier un contrat partagé (ou une validation dérivée du parseur), plutôt que maintenir séparément des listes de paramètres.
2. **Source du catalogue des indicateurs** : identifier l'API utilisable sur le Centre Rapports pour récupérer les tags d'indicateurs réellement actifs dans le périmètre autorisé ; ne pas créer une route non protégée.
3. **Source des styles graphiques** : examiner `/api/admin/reports/chart-styles`, déjà utilisée dans le catalogue des modèles Office ; même périmètre d'autorisation et mêmes IDs.
4. **Typage des tris** : ne pas présenter un tri de priorité comme un rang métier sans support explicite du moteur ; respecter la sémantique réelle de `smn-office-row-sort.mjs`.
5. **Compatibilité graphique** : le catalogue de tags et les règles d'exécution des graphiques doivent être cohérents (type, série, unité et valeurs). Un simple contrôle regex ne suffit pas à certifier le rendu.
6. **Contexte d'équipe** : conserver le contexte du Centre Rapports `teamId`, ses autorisations et ses cas de mode legacy ; aucune source transverse non autorisée.
7. **Pérennité** : prévoir les tests documentaires maintenant que le catalogue est utilisé en UI et pour la génération.

## 10. Découpage proposé, sans écriture Jira

- **US-CFG-01 — Accès et modale** : AC-01/02/04/17/18/19/20 ; ouverture, recherche, UX accessible, aperçu et copie.
- **US-CFG-02 — Scalars et indicateurs dynamiques** : AC-03/05/06/07/16 ; réutilisation du catalogue et contexte d'équipe.
- **US-CFG-03 — Tableaux et tri multicritère** : AC-08/09/10/11/16 ; choix des champs et sérialisation `SORT`.
- **US-CFG-04 — Graphiques paramétrés** : AC-12/13/14/15/16 ; types, séries, LAST, styles et contraintes métier.
- **US-CFG-05 — Recette intégrée, documentation et non-régression** : AC-20/21/22 ; FR/EN, tests, vérification des workflows et recette Office.

**Dépendances :** CFG-01 avant intégration finale des familles ; CFG-02/03/04 peuvent progresser indépendamment sur le contrat partagé ; CFG-05 termine la recette transverse. Jira reste la source de vérité pour les identifiants : vérifier l'Epic pertinente et obtenir l'accord de l'utilisateur avant toute création/modification.

## 11. Définition de terminé

- Chaque AC possède un test ou une preuve de recette traçable.
- Le configurateur n'émet aucun tag connu comme invalide.
- Guide actuel préservé, exemple et mode d'emploi du configurateur ajoutés en FR/EN.
- Tests ciblés (parser, sérialisation, composants, accessibilité) et CI existante réellement vérifiés.
- Une génération réelle DOCX et une génération PPTX à partir de tags copiés sont qualifiées ; en l'absence d'un environnement Office local, rester explicite sur la limite.
- Pas de changement de statut Jira ou de livraison déclarée sans preuve.

## 12. Vérification

Dépôt : https://github.com/JeanLamora75/SMN

Guide UI : https://github.com/JeanLamora75/SMN/blob/main/src/app/app/reports/office-tags.tsx

Parseur graphique : https://github.com/JeanLamora75/SMN/blob/main/scripts/smn-402-office-chart-tags.mjs

Parseur tri : https://github.com/JeanLamora75/SMN/blob/main/scripts/smn-office-row-sort.mjs

## 13. Traçabilité Jira et développement — 10 novembre 2026

Stories créées et rattachées à l'Epic [SMN-6](https://lmn24.atlassian.net/browse/SMN-6) :

| Story | Objet |
|---|---|
| [SMN-435](https://lmn24.atlassian.net/browse/SMN-435) | Accès, modale, recherche, aperçu et copie |
| [SMN-436](https://lmn24.atlassian.net/browse/SMN-436) | Valeurs simples et indicateurs actifs |
| [SMN-437](https://lmn24.atlassian.net/browse/SMN-437) | Sources ROW et tri SORT |
| [SMN-438](https://lmn24.atlassian.net/browse/SMN-438) | Graphiques et paramètres |
| [SMN-439](https://lmn24.atlassian.net/browse/SMN-439) | Guide, FR/EN, tests et recette |

**État d'implémentation — non encore qualifié :** Amelia a ajouté au dépôt `main` le composant `src/app/app/reports/office-tag-configurator.tsx`, la sérialisation pure `src/lib/office-tag-builder.ts`, les traductions FR/EN, le point d'entrée dans `src/app/app/reports/page.tsx`, les tests `tests/smn-435-439-office-tag-configurator.test.ts` et la CI dédiée `.github/workflows/smn-435-439-office-tag-configurator.yml`.

La preuve complète d'exécution CI, l'inspection de vrais modèles Office et la recette interactive Windows restent **à confirmer**, indépendamment de la présence du code.
