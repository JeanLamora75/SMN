---
title: "SMN — Génération de rapports Office à partir de modèles"
status: draft
created: 2026-11-06
updated: 2026-11-06
author: "John — BMAD Product Manager"
review_required: "Winston — BMAD Architect"
---

# SMN — Spécification fonctionnelle : rapports Word et PowerPoint

> **Statut : projet pour validation fonctionnelle et revue architecturale.**
> **Méthode : BMAD v6.12.4, skill `bmad-prd`.** Cette proposition s'appuie sur les décisions explicitement validées lors du cadrage. Les choix non validés sont signalés comme *à arbitrer*.

## 1. Objectif et valeur utilisateur

Permettre au Scrum Master ou au RTE de générer des rapports `.docx` et `.pptx` à partir de modèles Office préparés en dehors de SMN. L'utilisateur conserve la maîtrise de la présentation dans Word ou PowerPoint ; SMN remplace uniquement les marqueurs reconnus par des valeurs, des tableaux ou des graphiques dérivés de données disponibles dans SMN. Le rapport généré est enregistré dans un répertoire configuré.

**Critère de succès principal :** un modèle Office valide peut être déposé, sélectionné, renseigné et exporté sans édition de mise en page dans SMN, sans altération non demandée des éléments fixes.

**Hors périmètre explicite :** éditeur de modèles intégré, versions de modèles, historisation applicative des exécutions, stockage des modèles en base de données, conversion PDF imposée, graphiques Office natifs modifiables.

## 2. Parcours fonctionnel nominal

1. L'utilisateur prépare un document Word ou PowerPoint avec ses styles, dispositions, textes, tableaux et zones graphiques.
2. Il dépose le modèle dans le répertoire de modèles accessible au serveur local SMN.
3. Lors de l'ouverture ou de l'actualisation de l'écran Rapports, SMN détecte les `.docx` et `.pptx` disponibles, puis les présente à l'utilisateur.
4. L'utilisateur choisit un modèle et un contexte de données approprié (équipe, sprint ou période si nécessaire).
5. SMN lit le modèle, identifie les marqueurs reconnus et recherche les données correspondantes dans ses sources existantes.
6. SMN génère une **copie** du document ; les éléments sans marqueur reconnu restent inchangés ; les valeurs absentes prennent la forme `N/D`.
7. SMN propose le nom du fichier de sortie et l'enregistre dans le répertoire prévu. Si ce nom existe déjà, il sollicite une confirmation explicite avant remplacement.
8. L'utilisateur obtient le résultat ou un message d'échec explicite. Le modèle source ne doit jamais être modifié.

## 3. Exigences fonctionnelles

### F01 — Découverte et sélection des modèles

- **FR-001.** SMN liste les fichiers `.docx` et `.pptx` présents dans un répertoire de modèles configuré.
- **FR-002.** L'ajout ou le retrait d'un fichier se reflète dans la liste lors de sa prochaine actualisation, sans enregistrement manuel en base.
- **FR-003.** Chaque modèle est présenté par un nom lisible et son format ; les autres formats sont ignorés ou signalés comme non pris en charge.
- **FR-004.** Le fichier modèle original reste intact quelle que soit l'issue de la génération.

### F02 — Contexte et sources de données

- **FR-005.** La génération utilise des données déjà disponibles dans SMN, selon un périmètre explicite (notamment équipe, sprint ou période quand le tag l'exige).
- **FR-006.** Les indicateurs proviennent du catalogue et du moteur d'indicateurs dynamiques existants, sans nouveau moteur de calcul métier propre aux rapports.
- **FR-007.** Les données doivent respecter les règles de visibilité et d'habilitation applicables à l'utilisateur dans SMN. Un rapport ne doit pas permettre de contourner ces restrictions.
- **FR-008.** Les valeurs exportées doivent représenter l'état métier défini pour le périmètre demandé, notamment les règles déjà validées pour les sprints clos et les données historiques ; aucun chiffre fictif n'est introduit.

### F03 — Valeurs simples et tags

- **FR-009.** SMN remplace uniquement les tags dont la syntaxe et la signification figurent dans un catalogue de tags reconnus.
- **FR-010.** Un tag inconnu est conservé strictement à l'identique.
- **FR-011.** Un tag reconnu dont la donnée est absente, non disponible ou non calculable est remplacé par la chaîne `N/D`, sans empêcher la création du rapport.
- **FR-012.** Une valeur métier égale à zéro reste `0` et n'est jamais assimilée à une absence de donnée.
- **FR-013.** La génération ne doit modifier aucun texte ou contenu ne correspondant pas à un tag reconnu.
- **FR-014.** Les formats affichés (dates, nombres, unités) doivent être cohérents avec les conventions de présentation de SMN. **À arbitrer :** langue et formatage imposés par l'utilisateur, le modèle ou un paramètre facultatif de tag.

### F04 — Tableaux dynamiques

- **FR-015.** SMN sait alimenter un tableau défini dans le modèle à partir d'un jeu de données connu (exemples envisagés : membres, sprints, indicateurs).
- **FR-016.** Le nombre de lignes produites s'adapte aux données disponibles ; le style du tableau et de la ligne modèle doit être reproduit autant que le permet le format Office.
- **FR-017.** Si aucune donnée n'est disponible pour un tableau reconnu, une mention `N/D` apparaît dans la zone dédiée sans détruire la structure environnante.
- **FR-018.** Le contenu non dynamique du tableau et les autres éléments du document doivent rester inchangés.
- **FR-019.** **Décision validée le 06/11/2026 :** lorsque des lignes ou du texte dépassent la zone disponible du modèle, ce débordement est accepté. SMN ne doit pas agrandir artificiellement les dimensions, déplacer les tableaux, modifier les dimensions de la diapositive, réduire ou déformer le contenu pour tenter de le faire tenir. Le modèle détermine l'espace disponible ; aucune pagination ou création de diapositive automatique n'est exigée. Les débordements dus aux données restent sous la responsabilité de la mise en page du modèle ; les limites techniques du moteur doivent être documentées.

### F05 — Graphiques rendus en images

- **FR-020.** SMN peut rendre en image les graphiques de tendances alimentés par les données déjà exploitées dans l'application, puis les placer dans des emplacements prévus dans les modèles.
- **FR-021.** Par défaut, les graphiques réutilisent les paramètres de représentation existants de SMN ; des paramètres facultatifs dans les tags peuvent modifier, au minimum sous réserve de faisabilité, le nombre de sprints, le type de graphique et les séries d'indicateurs.
- **FR-022.** Les séries multiples disposent d'une légende intelligible lorsque celle-ci est pertinente.
- **FR-023.** Les graphiques sont insérés sous forme d'images, non de graphiques Office natifs. Leurs proportions doivent être conservées à l'insertion.
- **FR-024.** Si les données nécessaires au graphique sont absentes, la zone correspondante affiche `N/D` ; le rapport demeure générable.
- **FR-025.** Les graphiques ne doivent pas imposer de transformation globale de la diapositive, de la page ni du thème du modèle.

**Exemples de syntaxe à valider, non encore contractualisés :**

- `{{SPRINT_NAME}}` : texte simple.
- `{{TABLE:SPRINT_INDICATORS}}` : tableau.
- `{{CHART:TREND:VELOCITY}}` : graphique de tendance par défaut.
- `{{CHART:TREND:VELOCITY,SPJH|LAST=8|TYPE=BAR}}` : séries et options facultatives.

Les noms exacts de tags, les limites de paramètres et leur grammaire relèvent d'un contrat technique/produit ultérieur. Ces exemples ne prouvent pas leur disponibilité actuelle.

### F06 — Préservation de la présentation

- **FR-026.** Les pages/diapositives, sections, thèmes, masques, styles, tableaux, formes, positions, images fixes et contenus non ciblés restent préservés pendant la génération.
- **FR-027.** Le remplacement d'une valeur simple doit préserver le style défini autour du marqueur et, dans la mesure techniquement démontrée, le style de la zone remplacée.
- **FR-028.** Le moteur doit traiter sans corruption les tags présents dans des structures Office courantes, y compris lorsqu'un marqueur est fractionné entre plusieurs segments de texte internes.
- **FR-029.** Aucun réagencement automatique général n'est attendu. Les dimensions et positions des objets du modèle ne doivent pas être augmentées ou modifiées par SMN pour compenser un contenu plus long. Les lignes de tableau ajoutées peuvent déborder de l'espace prévu ; ce résultat est accepté et ne doit pas entraîner de nouvelle diapositive imposée ni de redimensionnement automatique artificiel. Les limites doivent être documentées.
- **FR-030.** Un document généré doit rester ouvrable dans l'application Office correspondant à son format.

### F07 — Génération et sauvegarde

- **FR-031.** SMN enregistre les rapports dans un répertoire de sortie configuré, distinct des modèles.
- **FR-032.** Si le nom de sortie n'existe pas, le fichier est créé sans confirmation d'écrasement.
- **FR-033.** Si le nom existe, SMN demande une confirmation explicite avant tout remplacement. L'annulation laisse le fichier existant intact.
- **FR-034.** Si la génération ou l'écriture échoue, un fichier existant ne doit pas être tronqué ou détruit ; la génération doit employer une stratégie de fichier temporaire et de remplacement sûr, à valider techniquement.
- **FR-035.** SMN n'impose aucune gestion de versions ni aucun historique applicatif des rapports produits. L'existence éventuelle de plusieurs fichiers dans le répertoire ne constitue pas une fonction d'historisation SMN.
- **FR-036.** Les erreurs de lecture du modèle, de syntaxe, de permissions ou de sauvegarde donnent un message explicite sans exposer de chemins ou données sensibles inutilement.

## 4. Critères d'acceptation transverses

| ID | Situation | Résultat attendu |
|---|---|---|
| AC-01 | Déposer un `.docx` ou `.pptx`, puis actualiser la liste | Le modèle apparaît sans action d'administration en base. |
| AC-02 | Supprimer un modèle du répertoire, puis actualiser | Le modèle n'est plus proposé. |
| AC-03 | Générer avec un tag reconnu et une donnée disponible | La valeur exacte attendue est insérée ; les éléments non ciblés restent inchangés. |
| AC-04 | Générer avec un tag inconnu | Le tag reste identique dans la sortie. |
| AC-05 | Générer avec une donnée absente et une valeur zéro | La donnée absente affiche `N/D` ; zéro reste `0`. |
| AC-06 | Alimenter un tableau à partir de plusieurs lignes | Les lignes sont créées à partir du jeu de données et reprennent le style modèle, sous réserve des limites formalisées. |
| AC-07 | Alimenter un tableau vide | `N/D` est visible à l'emplacement prévu. |
| AC-08 | Générer une tendance multi-indicateurs | Une image est insérée, avec légende appropriée, sans déformer l'image. |
| AC-09 | Générer un graphique sans données | `N/D` apparaît, sans bloquer le document. |
| AC-10 | Générer un document avec styles et éléments fixes | Aucun élément non ciblé n'est supprimé ni réécrit ; fichier ouvrable dans Office. |
| AC-11 | Utiliser un marqueur fragmenté en plusieurs segments Office | Le remplacement est correct sans perte de mise en forme des autres segments. |
| AC-12 | Sauvegarder sous un nom déjà utilisé, puis annuler | Fichier existant inchangé (contenu et intégrité). |
| AC-13 | Confirmer un écrasement puis provoquer un échec de génération | Fichier préexistant inchangé. |
| AC-14 | Générer avec succès en confirmant l'écrasement | Le fichier de sortie contient le nouveau rapport et reste ouvrable. |
| AC-15 | Tenter l'accès à des données hors habilitation | Aucune donnée non autorisée n'est produite. |

## 5. Exigences non fonctionnelles et qualité

- **NFR-01 — Intégrité :** modèle source jamais modifié ; écriture de destination protégée contre les échecs.
- **NFR-02 — Fidélité :** éléments Office non ciblés préservés ; démonstration sur une matrice de modèles représentatifs Word/PowerPoint.
- **NFR-03 — Sécurité :** répertoires autorisés, contrôle des extensions et formats, absence d'exécution de code embarqué, vérification d'accès et prévention des traversées de chemins.
- **NFR-04 — Utilisabilité :** sélection et génération sans manipulation technique, erreurs compréhensibles, détection automatique des modèles.
- **NFR-05 — Interopérabilité :** sortie DOCX/PPTX valide et ouvrable par les applications Office cibles.
- **NFR-06 — Maintenabilité :** catalogue centralisé des tags et réutilisation des sources métiers/indicateurs existants, sans nouveau calcul métier parallèle.
- **NFR-07 — Ressources :** limites explicites sur la taille des modèles, tableaux et images à déterminer lors de l'architecture ; éviter les traitements non bornés.

## 6. Points de revue pour Winston (non décidés)

1. **Bibliothèques et manipulation Open XML** : compatibles avec l'architecture Node.js/Next.js actuelle, sans installation locale privilégiée et sans requérir Microsoft Office sur le serveur.
2. **Fidélité des styles** : marqueurs fractionnés, textes enrichis, espaces réservés PowerPoint, formes groupées, tableaux complexes et masques.
3. **Tableaux expansibles PowerPoint** : le dépassement est accepté, sans redimensionnement artificiel par SMN ; vérifier la conformité technique par POC.
4. **Insertion d'images** : convention de placement, dimensions, ancrage, transparence, rendu du texte `N/D` dans les emplacements prévus.
5. **Graphiques** : extraction/réutilisation du pipeline graphique existant, rendu côté serveur, polices, échelles, légendes et choix des paramètres autorisés.
6. **Conventions de tags** : catalogue métier, documentation, grammaire, formats et gestion des erreurs de paramètres ; ne pas confondre tag inconnu et tag connu mal paramétré.
7. **Fichiers de sortie** : atomisation et comportement réel du remplacement sur Windows, verrouillages de fichier, concurrents et réseau éventuel.
8. **Sécurité et performances** : protection contre fichiers Office malformés ou archives compressées disproportionnées ; plafonds de complexité.
9. **Compatibilité** : échantillon représentatif de fichiers créés dans les versions Office réellement utilisées et comparaison visuelle avant/après.

## 7. Questions de cadrage restantes (non bloquantes pour la revue d'architecture)

- **Q-01.** Comment les utilisateurs désignent-ils exactement une zone graphique ou une ligne modèle de tableau dans Office ? Le placement d'un simple tag suffit-il ? À confirmer après faisabilité.
- **Q-02 — Tranchée le 06/11/2026.** Le dépassement est accepté. SMN conserve les dimensions et positions du modèle et n'effectue aucun agrandissement ou recalage automatique pour faire tenir les données.
- **Q-03.** Comment choisir le nom de sortie par défaut, et l'utilisateur peut-il l'éditer ? Proposition à valider.
- **Q-04.** Quelle convention de langue et de format numérique/date les rapports utilisent-ils ? À arbitrer.
- **Q-05.** Quelle liste initiale de tags, tableaux et graphiques est indispensable pour le premier incrément ? À établir avant les Stories.

## 8. Livraison BMAD et séquence de décision

1. **John** : faire valider le présent projet de spécification et les critères d'acceptation.
2. **Winston** : examiner la faisabilité de chaque exigence de fidélité Word/PowerPoint ; signaler explicitement les limites et proposer une preuve de concept.
3. **John** : intégrer les conclusions architecturales et résoudre avec l'utilisateur les arbitrages impactant le comportement métier.
4. **Après validation seulement** : finaliser les documents BMAD dans `_bmad-output/planning-artifacts/`, puis utiliser le workflow `bmad-create-epics-and-stories` et soumettre les Stories à validation avant Jira.

**Aucun résultat d'implémentation, test de fidélité ou validation Office n'est revendiqué dans ce document.**

## Avenant fonctionnel validé — 06/11/2026 : cinq arbitrages

Cet avenant prévaut sur les mentions antérieures « à arbitrer » des points correspondants.

1. **Tags libres :** l'utilisateur place les tags directement dans les zones compatibles de Word et PowerPoint, y compris celles destinées aux tableaux et graphiques, sans paramétrer leurs emplacements dans SMN. Compatibilité exacte à démontrer en POC.
2. **Nom de fichier :** à chaque génération, champ obligatoire prérempli avec `nom du modèle - nom du sprint`, librement modifiable. L'extension d'origine `.docx` / `.pptx` est ajoutée automatiquement. En cas de collision, confirmation explicite avant écrasement.
3. **Langue :** sélecteur Français / Anglais lors de chaque génération, avec la langue de l'utilisateur présélectionnée. Les formats de dates, de nombres et les libellés injectés suivent ce choix ; les textes fixes du modèle et les contenus libres ne sont pas traduits.
4. **Catalogue complet :** huit familles dès la première livraison : équipe, sprint/période, capacités, indicateurs, membres, cérémonies, registres et tendances. Catalogue consultable dans SMN avec tag, type, explication et exemple ; aucune donnée métier inventée, source et habilitations respectées.
5. **Limites :** aucune limite métier supplémentaire sur le nombre de lignes d'un tableau. Toutes les lignes disponibles/autorisées sont générées par défaut ; un dépassement visuel est accepté, sans agrandissement ou déplacement artificiels. Les graphiques suivent les règles des tendances SMN (dont six indicateurs compatibles de même unité maximum). Garde-fous techniques de taille, durée, mémoire et complexité obligatoires : erreur explicite plutôt que troncature silencieuse.

**Critères d'acceptation complémentaires :** (AC-16) tag libre remplacé dans une zone Office compatible ; (AC-17) nom obligatoire suggéré, éditable et extension conservée ; (AC-18) langue de sortie FR/EN choisie et contenus fixes inchangés ; (AC-19) huit familles documentées et consultables ; (AC-20) toutes les lignes autorisées générées sans plafond métier, sauf erreur technique explicite, sans corruption ni troncature silencieuse.
