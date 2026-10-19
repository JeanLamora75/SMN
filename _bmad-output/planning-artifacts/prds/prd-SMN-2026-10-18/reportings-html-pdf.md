# SMN — Exigences détaillées du reporting HTML/PDF

**Statut :** décisions fonctionnelles validées le 19/10/2026, détail de conception encore ouvert.  
**Référence :** [PRD principal](prd.md), FR-26 à FR-33.  
**Validation groupée :** D-PRD-123 — RPT-01 à RPT-08, acceptées globalement par l'utilisateur.

## 1. Périmètre et règles déjà validés (inchangés)

- **MVP Scrum et Kanban :** rapport consultable/prévisualisable en **HTML dans SMN** et exportable en **PDF partageable**. Les formats PPTX, DOCX et XLSX sont **post-MVP**, sans version cible fixée (F-15 ; Product Brief).
- **Génération à la demande**, sur une période ouverte, terminée non clôturée ou clôturée ; le rapport identifie le **cycle examiné, son état et la date/heure de génération**. Sur une période ouverte, préciser qu'il s'agit d'une situation provisoire datée (F-97).
- **Modèle standard à six sections**, proposées par défaut : (1) Synthèse exécutive ; (2) Objectifs ; (3) Indicateurs et tendances ; (4) Événements Agile ; (5) Points d'attention ; (6) Décisions et actions. Sections masquables, réorganisables, complétables (Product Brief).
- **Vision du produit et Product Goal** intégrables facultativement ; **DoD/DoR** facultatives **à titre informatif en fin de rapport**, en texte connu ou comme lien externe, sans garantir la conservation du contenu distant (F-117 à F-120).
- **Historique :** profondeur par défaut configurable, ajustable au rapport et mémorisable dans le modèle (F-24/F-25). Les graphiques de tendances Scrum/Kanban déjà définis restent limités à **cinq cycles clôturés au plus** selon leurs règles de comparaison (D-PRD-076 à 078, D-PRD-081 à 086) ; **ce plafond ne limite pas la profondeur des autres contenus historiques sélectionnables**.
- **Qualité des données :** KPI facultatifs ; vide ≠ zéro, SP ≠ JH, pas d'agrégation artificielle de données non comparables ; provenance/instant de référence accessibles quand connus (F-14/F-71 à F-73).
- **Historique de clôture :** pour les risques et dépendances d'un cycle clôturé, utiliser l'instantané applicable (D-PRD-122). Les PDF et exports antérieurement générés ne sont jamais modifiés implicitement (F-93/D-PRD-111 à D-PRD-122).
- **SAFe/ART v1.0 :** préparer la réutilisation des fonctions du moteur de rapport avec une synthèse qualitative ART et des indicateurs propres aux équipes, sans sommer les Story Points interéquipes (F-73) ; aucun écran SAFe n'est à livrer dans le MVP.

## 2. Exigences et critères d'acceptation détaillés

### FR-26 / RPT-01 — Démarrer un reporting depuis le cycle

**Besoin :** réduire les clics et éviter de ressaisir le contexte déjà disponible.

**Critères d'acceptation :**
1. Depuis la **fiche d'un Sprint Scrum** ou d'une **période Kanban**, une action identifiable « Générer un rapport » donne accès à la préparation du rapport sur le **cycle exact** consulté.
2. Le formulaire est **prérempli** avec identité/nom du cycle, équipe/produit, dates, statut courant, modèle standard ou modèle précédemment retenu si explicitement applicable, et données existantes exploitables ; chaque donnée préremplie est issue de SMN, jamais inférée sans source.
3. Le responsable peut **changer de modèle**, ajuster les options, revenir à la fiche sans générer de PDF ; les changements de paramètres de rapport ne modifient pas les **sources métier**.
4. Le parcours fonctionne en Scrum et Kanban au MVP. Les différences d'indicateurs propres aux modes sont conservées ; aucune cérémonie Scrum artificielle en Kanban.

### FR-27 / RPT-02 — Préremplir le rapport, ajouter une rédaction volontaire

**Critères d'acceptation :**
1. Le rapport propose, dans les six rubriques standards, des données **effectivement enregistrées** pour le cycle, des tendances autorisées et des éléments qualitatifs associés (risques, obstacles, dépendances, décisions, actions, faits marquants), selon disponibilité et options.
2. Le SM peut **ajouter ou modifier pour ce rapport** une introduction, une conclusion et des commentaires/contextes explicatifs ; le texte ajouté apparaît à la prévisualisation et au PDF lorsqu'il est inclus.
3. **Aucune rédaction métier fictive** : un résumé ou une conclusion n'est pas affirmé comme constat réel si le SM ne l'a pas fourni ; les champs facultatifs vides sont traités sans contenu inventé.
4. Les compléments rédigés **pour le rapport** ne changent pas automatiquement les fiches sources, objectifs, KPI ou historiques ; les corrections de ces derniers empruntent leurs parcours dédiés.
5. Les informations qualitatives historiques reflètent la date/période sélectionnée lorsque des instantanés sont définis ; ne pas présenter systématiquement l'état courant comme état passé.

### FR-28 / RPT-03 — Sélectionner les contenus et restaurer les options d'un modèle

**Critères d'acceptation :**
1. Le SM peut sélectionner les **sections**, leur ordre, les KPI calculables disponibles, les **graphiques**, les faits et registres qualitatifs, les analyses humaines/IA existantes autorisées, ainsi que la **profondeur historique** (F-24/F-25/F-98).
2. La **sélection d'un modèle** préremplit les options enregistrées, qui demeurent **modifiables pour le rapport courant** sans mettre implicitement à jour le modèle.
3. Une option faisant référence à une donnée absente ou non calculable est présentée comme **non renseignée/non disponible**, ou masquée selon la configuration explicite, sans créer de zéro ou de blocage.
4. La vision et le Product Goal peuvent être intégrés sur sélection ; DoD/DoR en fin de rapport sur sélection, en texte ou lien disponibles. Un lien externe absent ou inaccessible ne doit pas être présenté comme un contenu vérifié.
5. Un élément masqué par l'utilisateur n'est **pas inséré secrètement dans le PDF** ; les informations indispensables à la contextualisation du rapport (cycle, statut, date) restent visibles.

### FR-29 / RPT-04 — Gérer des modèles de rapport réutilisables

**Critères d'acceptation :**
1. SMN fournit un **modèle standard utilisable par défaut et non supprimable**. Il peut être **dupliqué** pour créer un modèle personnalisable.
2. Le responsable peut **créer et modifier** un modèle personnalisé à partir de sa sélection : sections, ordre, options d'affichage, types d'indicateurs/graphes, contenus optionnels et **profondeur historique par défaut**.
3. Les réglages de modèle sont réutilisés à la génération suivante, mais **un ajustement ponctuel du rapport ne modifie pas le modèle**, sauf action volontaire d'enregistrement explicite.
4. L'utilisation d'un modèle n'oblige pas à renseigner des KPI facultatifs. Le mode de calcul et le statut des sources de données restent déterminés par les règles de SMN, pas par la présentation.
5. Les politiques de suppression/archivage des modèles personnalisés utilisés auparavant restent un détail à traiter en conception, sans possibilité de supprimer le modèle standard.

### FR-30 / RPT-05 — Fiabilité de l'historique et des tendances

**Critères d'acceptation :**
1. Un rapport identifie clairement **la période examinée** et les **comparaisons historiques**, sans mélanger les données des cycles futurs avec celles d'un cycle ancien (F-24/D-PRD-078).
2. Les graphiques de tendances existants utilisent **au maximum cinq cycles clôturés** éligibles, antérieurs ou égaux au cycle consulté selon les décisions de chaque mode ; un cycle ouvert n'ajoute pas de données non consolidées aux tendances historiques. **La profondeur d'autres informations du rapport reste personnalisable indépendamment.**
3. L'état des risques et dépendances d'un **cycle clôturé** provient de son **instantané de clôture** D-PRD-122 ; un rapport d'un cycle non clôturé repose sur les données courantes connues et est qualifié de **provisoire**.
4. Les données **absentes, estimées, manuelles et calculées** sont présentées sans confusion lorsque leur provenance/qualité est connue ; aucun KPI absent n'est remplacé par un zéro fictif, et aucun Story Point n'est converti en JH.
5. Les données historiques réintroduites suivent les règles de **qualité/provenance et disponibilité** existantes. Quand un instantané ancien n'existe pas, ne pas reconstituer arbitrairement l'état passé d'un risque ou d'une dépendance.
6. Après une correction métier, un **nouvel export** peut refléter les données autorisées, mais **les rapports/PDF déjà générés ne sont pas réécrits**.

### FR-31 / RPT-06 — Prévisualiser le HTML et exporter un PDF fidèle

**Critères d'acceptation :**
1. Avant de produire le PDF, une **prévisualisation HTML complète** montre les sections, leur ordre, les contenus ajoutés, les chiffres et les graphiques applicables selon les choix courants.
2. Le SM peut revenir aux options pour corriger une sélection puis **rafraîchir la prévisualisation** avant de décider d'exporter.
3. Le **PDF contient les mêmes informations et sélections** que l'aperçu validé. Les différences de pagination/impression sont admissibles, pas l'ajout ou la disparition silencieuse de données métier.
4. Le PDF est exploitable pour le partage, avec titre, contexte, période, statut, date de génération et une disposition lisible ; les graphiques importants restent identifiables.
5. La **simple prévisualisation** ne crée pas une archive permanente obligatoire, et n'altère ni données métier ni rapports plus anciens.
6. Un échec d'export indique clairement l'échec sans présenter un PDF partiel comme export réussi ; la stratégie technique d'export appartient à l'architecture.

### FR-32 / RPT-07 — Langue des libellés, sans traduction automatique des textes libres

**Critères d'acceptation :**
1. Lors de la génération, le SM peut sélectionner **français** ou **anglais** pour les titres, les libellés standard, les intitulés de sections et les éléments d'interface du rapport (conformément à F-112).
2. Les textes métier **librement saisis** (commentaires, synthèses, objectifs, notes, analyses et descriptions) sont restitués **dans leur langue d'origine** ; aucun mécanisme de traduction automatique n'est requis au MVP.
3. Le PDF et l'aperçu HTML utilisent la **même langue sélectionnée pour les éléments standardisés**, sans changement des valeurs chiffrées ni falsification du texte libre.
4. La langue de l'interface SMN n'impose pas silencieusement une traduction des contenus métier. Des langues additionnelles ou un contenu traduit manuellement seront traités séparément.

### FR-33 / RPT-08 — Présentation professionnelle et confidentialité par défaut

**Critères d'acceptation :**
1. Le rapport affiche clairement **produit, équipe (ou ART en v1.0), cycle et ses dates, statut, date/heure de génération et contexte du périmètre**. Lorsqu'une période est ouverte, le caractère provisoire est explicite.
2. La présentation HTML et PDF est **sobre, structurée et lisible** ; un **logo facultatif** peut être intégré lorsqu'il est fourni/configuré, sans être nécessaire à la génération. La charte visuelle exacte relève de l'UX.
3. Les **absences nominatives, adresses e-mail, coordonnées et données individuelles sensibles ou non nécessaires** sont **exclues par défaut** du rapport. Les **indicateurs d'équipe consolidés** sont privilégiés ; l'affichage légitime d'un responsable métier dans une action ou décision ne doit pas être confondu avec une divulgation d'informations personnelles sans pertinence.
4. Les éléments facultatifs tels que risques, dépendances et analyses sont inclus selon la **sélection explicite** et les droits applicables ; les champs de texte libre ne sont jamais automatiquement envoyés à un service externe pour construire le PDF.
5. Les règles de confidentialité renforcées des **briefs TXT destinés à l'IA** (F-106/F-108/F-109) restent indépendantes et plus strictes : elles n'autorisent aucune donnée individuelle de membre.
6. Les dates, KPI et sources ne sont pas masqués d'une façon qui fasse passer une donnée absente ou estimée pour une mesure certaine.

## 3. Hors MVP et questions à traiter en conception

- Hors MVP : éditeur de mise en page avancé, **traduction automatique**, exports programmés, dispositif complet de snapshots/archivage documentaire de chaque prévisualisation, intégration automatique Jira ou API IA, formats PPTX/DOCX/XLSX (sans version attribuée).
- À préciser en architecture/UX : gabarits HTML/PDF exacts, logo et thème, pagination, accessibilité WCAG, options de personnalisation visuelle, stratégie de stockage de fichiers PDF si retenue, gestion d'erreurs d'export et performances.
- À préciser dans les autres blocs PRD : confidentialité et droits d'accès détaillés, durée de rétention et restauration, gestion de l'historique à réouverture/reclôture, statut des données rétrosaisies et définition exacte des points qualitatifs qui alimentent les rapports.

**Traçabilité :** F-10/F-14/F-15/F-24/F-25/F-71 à F-73/F-91 à F-98/F-112/F-117 à F-120 ; D-PRD-076 à D-PRD-086, D-PRD-111 à D-PRD-122 ; D-PRD-123 (validation de RPT-01 à RPT-08). Le PRD principal reste la source structurante, le présent document portant ses critères d'acceptation détaillés.
