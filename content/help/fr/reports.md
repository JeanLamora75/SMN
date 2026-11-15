# Rapports : transformez les données SMN en documents Word et PowerPoint

Vous préparez une Sprint Review, un comité de pilotage ou un bilan de période ? Le module **Rapports** permet de produire des documents à votre image à partir des informations suivies dans SMN, **sans recopier à la main les chiffres, les listes ou les événements**.

Le principe est simple : **vous concevez la présentation dans Word ou PowerPoint, vous y placez des tags, puis SMN récupère les données du bon contexte et remplace ces tags lors de la génération**.

> **Le conseil de Camille :** commencez par un modèle très simple : titre du sprint, dates et quelques indicateurs. Vérifiez le document obtenu, puis ajoutez progressivement tableaux et graphiques. Vous comprendrez ainsi beaucoup mieux la provenance des données.

## 1. Modèle, tag, donnée et rapport : comprenez les quatre notions

**Le modèle Office** est un véritable fichier **Word (.docx)** ou **PowerPoint (.pptx)**. Vous choisissez sa charte graphique, les titres, les paragraphes, les tableaux, les zones de texte et les emplacements des graphiques. Il sert de structure réutilisable.

**Le tag** est un marqueur inséré dans le modèle. Il indique à SMN **quelle information remplacer ou répéter** au moment de la génération. Exemple : `{{TEAM_NAME}}` représente le nom de l'équipe du rapport.

**La donnée source** est l'information disponible dans SMN : équipe, sprint, indicateurs, membres, objectifs, cérémonies, registres, liens ou photographies CSV de tickets.

**Le rapport généré** est la nouvelle version du document, dans laquelle les marqueurs reconnus sont remplacés par leurs valeurs ou contenus. Le modèle d'origine reste votre référence à réutiliser pour d'autres cycles.

### Un exemple facile à visualiser

Dans votre modèle Word, écrivez un titre « Bilan de `{{SPRINT_NAME}}` » et une phrase « Équipe : `{{TEAM_NAME}}` ». Choisissez ensuite un sprint dans SMN. À la génération, ces marqueurs sont remplacés par le **nom du sprint sélectionné** et le **nom de son équipe**.

> **Pourquoi utiliser un modèle plutôt qu'un rapport rédigé à la main ?** Vous conservez la même présentation d'un sprint à l'autre, tout en mettant à jour les données à partir du contexte choisi.

## 2. D'où viennent les informations insérées par SMN ?

SMN ne lit pas des valeurs « au hasard » dans Word ou PowerPoint. Le modèle lui indique les données attendues ; **l'équipe et le cycle sélectionnés** déterminent les informations à rechercher.

1. Vous choisissez un **modèle Office** et un **sprint ou une période** disponible.
2. SMN reconnaît les **tags** présents dans les structures Office prises en charge.
3. Pour chaque tag, le moteur identifie sa **famille** et lit les **sources métier correspondantes** dans le contexte autorisé.
4. Il remplace un texte, répète une ligne ou insère un graphique selon le type de tag.
5. Il produit un nouveau fichier **DOCX ou PPTX**, à télécharger ou à enregistrer.

**Les données ne viennent pas toutes du même endroit :**

- **Équipe et produit :** nom de l'équipe, nom, objectif et vision du produit.
- **Sprint ou période :** nom, dates, statut et objectifs.
- **Membres :** personnes actives ou inactives, rôles, fonctions et localisation.
- **Indicateurs dynamiques :** valeurs disponibles dans le catalogue SMN pour le contexte du rapport.
- **Registres :** risques, obstacles, dépendances, décisions, actions et faits marquants accessibles à la projection.
- **Cérémonies et réunions :** événements, horaires, durées et états.
- **Notes et liens :** informations du tableau de bord et ressources accessibles, avec distinction entre liens d'équipe et liens transverses.
- **Tickets CSV :** données des photographies sélectionnées, statistiques et comparaisons éventuelles.

> **Point important sur l'historique :** une photographie CSV de tickets est choisie explicitement dans le formulaire lorsqu'un modèle en a besoin. Pour un sprint clôturé, certaines informations peuvent provenir des données figées à la clôture, selon la famille utilisée. Ne supposez pas que tous les tags lisent une valeur « en direct ».

SMN ne modifie pas les indicateurs simplement parce que vous générez un rapport. **La génération est une lecture et une mise en forme des informations disponibles**, pas une nouvelle saisie métier.

## 3. Quels types de contenu peut-on injecter ?

### Informations simples : un texte ou une valeur

Insérez un tag dans une phrase, un titre Word ou une zone de texte PowerPoint.

- `{{TEAM_NAME}}` : nom de l'équipe.
- `{{SPRINT_NAME}}` : nom du sprint.
- `{{SPRINT_START}}` et `{{SPRINT_END}}` : dates du sprint.
- `{{TODAY}}` : date de génération du document.
- `{{PRODUCT_NAME}}`, `{{PRODUCT_GOAL}}`, `{{PRODUCT_VISION}}` : contexte produit.

**À utiliser pour :** page de garde, en-tête, synthèse ou pied de page.

### Indicateurs : donner des chiffres au bilan

Un tag d'indicateur tel que `{{INDICATOR_VELOCITY}}` demande la valeur de l'indicateur correspondant, **si ce tag existe réellement dans le catalogue de votre équipe**. Le nom de cet exemple est illustratif : vérifiez le tag exact avant de l'utiliser.

**À utiliser pour :** capacité, métriques de sprint, suivi d'objectif ou indicateurs personnalisés. Une valeur manquante ne doit pas être considérée automatiquement comme zéro.

### Tableaux : répéter une ligne pour chaque élément

Une ligne de votre tableau Word ou PowerPoint contient un marqueur `ROW` et des champs de la même collection.

**Exemple pour les risques :** placez `{{ROW:RISKS}}` dans la ligne servant de modèle, puis `{{RISK_TITLE}}` et `{{RISK_STATUS}}` dans les cellules de cette ligne. SMN reproduit la ligne pour chaque risque disponible.

Les collections prises en charge comprennent notamment les **membres**, **indicateurs**, **risques**, **obstacles**, **dépendances**, **notes**, **cérémonies**, **objectifs**, **actions**, **décisions**, **tickets** et **liens**.

**Exemple pour les liens :** `{{ROW:LINKS_TEAM}}` traite les liens de l'équipe du rapport ; `{{ROW:LINKS_TRANSVERSE}}` traite les liens transverses accessibles.

Pour organiser la liste, certains tags de lignes acceptent un tri, par exemple `{{ROW:MEMBERS_ACTIVE|SORT=MEMBER_FUNCTION:ASC,MEMBER_NAME:ASC}}`. Ce tag trie les membres actifs par fonction puis par nom.

> **Conseil de mise en page :** prévoyez un tableau capable de recevoir plusieurs lignes. Dans PowerPoint, les blocs longs peuvent dépasser de la diapositive : SMN ne redimensionne pas automatiquement toutes les présentations.

### Graphiques : rendre une tendance lisible

Un tag tel que `{{CHART:TREND|TYPE=line|TAGS=SP_DONE|LAST=6}}` demande un graphique de tendance en courbe sur les six derniers sprints pour l'indicateur indiqué, **à condition qu'il soit disponible dans le catalogue**.

Les styles documentés comprennent **barres, courbes, aires, secteurs, anneaux et jauges**. Certaines formes imposent des règles : une jauge utilise une seule valeur comprise entre 0 et 100, et les séries comparées doivent être compatibles.

**Règle de placement :** placez le tag graphique **seul dans son paragraphe Word ou sa zone de texte PowerPoint**. Le moteur remplace alors ce marqueur par une image de graphique.

## 4. Préparez votre premier modèle Word ou PowerPoint

1. Créez un fichier **.docx** ou **.pptx** avec les outils Office habituels.
2. Définissez sa structure : titre, identité visuelle, rubriques, tableaux et éventuels emplacements graphiques.
3. Rédigez les textes fixes que vous souhaitez conserver d'une génération à l'autre.
4. Placez les **tags** aux endroits où les informations SMN doivent apparaître.
5. Enregistrez le fichier dans le **dossier des modèles Office** affiché dans **Rapports → Modèles**.
6. Revenez dans SMN et utilisez **Actualiser** pour retrouver le modèle dans le catalogue.
7. Réalisez une première génération sur un cycle disposant de données et vérifiez le résultat.

SMN détecte les **fichiers Word et PowerPoint valides** présents dans le répertoire prévu ; il ne suffit pas de renommer n'importe quel fichier avec une extension DOCX ou PPTX.

### Word ou PowerPoint : que choisir ?

**Word** convient aux comptes rendus détaillés, bilans rédigés, longues listes et tableaux. **PowerPoint** convient aux revues, comités et présentations synthétiques. Le principe des tags est partagé, mais les contraintes d'espace et de disposition sont différentes.

> **Conseil de Sally :** faites d'abord fonctionner le modèle avec deux tags simples, puis ajoutez une liste ou un graphique. Vous isolerez facilement une erreur de données d'un problème de mise en page.

## 5. Le configurateur de tags : votre assistant pour construire les expressions

Dans [Rapports](/app/reports), ouvrez l'onglet **Tags**, puis lancez le **Configurateur de tags**. Son rôle est d'éviter de mémoriser la syntaxe technique et de vous permettre de préparer une expression compatible avec les options disponibles.

### Choisissez la famille adaptée

1. **Information simple** : sélectionnez le champ à insérer, par exemple le nom du sprint ou de l'équipe.
2. **Indicateur** : recherchez un indicateur actif et choisissez son tag réel dans le catalogue de l'équipe.
3. **Tableau** : choisissez une collection (membres, risques, tickets, liens…), puis, si nécessaire, ajoutez des **critères de tri** : champ, ordre croissant ou décroissant, et priorité des critères.
4. **Graphique** : choisissez le type, les indicateurs à représenter et, selon le cas, le nombre de sprints ou le style graphique.

### Récupérez le tag sans erreur

1. Choisissez une **famille** en haut du configurateur.
2. Utilisez la **recherche** ou la liste pour sélectionner l'information attendue.
3. Renseignez les **options** proposées. Elles varient selon la famille.
4. Lisez l'**expression générée** affichée dans la fenêtre.
5. Cliquez sur **Copier**, puis collez-la telle quelle dans votre modèle Office.
6. Pour un tableau, copiez également les **tags de colonnes** proposés et placez-les dans la même ligne de modèle.
7. Utilisez **Réinitialiser** pour repartir d'une configuration propre si vous changez de besoin.

**Pour les graphiques**, le configurateur récupère les indicateurs disponibles et, selon le contexte, les styles de graphiques. Le bouton de copie peut rester désactivé lorsqu'une sélection n'est pas valide ou lorsque le catalogue requis n'est pas accessible.

**Pour les tableaux**, les critères de tri peuvent être réordonnés. Le tri par fonction puis par nom ne produit pas le même résultat que le tri par nom puis par fonction.

> **À retenir :** le configurateur **prépare et copie du texte**. Il n'insère pas tout seul le tag dans votre fichier Word ou PowerPoint et ne modifie pas vos données.

## 6. Générez votre rapport : les champs à contrôler

Dans l'onglet **Modèles**, sélectionnez le modèle détecté. Le formulaire de génération propose notamment :

- **Sprint ou cycle** : détermine la période et le contexte des données.
- **Nom du fichier** : identifie le document produit.
- **Langue** : choisit le français ou l'anglais pour les contenus pris en charge.
- **Style des graphiques** : applique un style sélectionné lorsqu'il est disponible.
- **Photographie Tickets principale** : fournit les tickets et statistiques d'une date de référence.
- **Photographie Tickets antérieure** : permet une comparaison lorsque le modèle utilise des tags de différences entre deux photographies.

### Télécharger ou enregistrer : deux actions distinctes

**Générer** prépare le document et le télécharge. **Enregistrer** produit le document et le conserve dans le **dossier des rapports Office** indiqué par SMN. En cas de nom de fichier déjà utilisé, lisez la demande de confirmation avant tout remplacement.

> **Exemple de parcours :** pour votre Sprint Review, choisissez un PowerPoint, sélectionnez le sprint, retenez les photographies Tickets du début et de la fin si votre modèle les utilise, puis générez le fichier. Vérifiez les graphiques, les tableaux et les libellés avant la réunion.

## 7. Comprenez les quatre onglets du Centre Rapports

- **Rapports** : retrouver les rapports enregistrés dans le contexte autorisé, rechercher et filtrer par cycle ou statut selon les options disponibles.
- **Modèles** : voir les fichiers DOCX/PPTX détectés, choisir les données et produire un document Office.
- **Tags** : consulter le catalogue de tags, comprendre les familles et utiliser le configurateur.
- **Archives** : consulter et télécharger les archives disponibles dans le contexte sélectionné.

Selon votre mode d'installation et vos droits, les actions proposées peuvent varier. La commande **Nouveau rapport**, lorsqu'elle apparaît dans l'en-tête, n'est pas le même parcours que la génération directe depuis **Modèles**.

## 8. Vérifiez le document avant de le diffuser

1. Contrôlez le **nom de l'équipe** et du **cycle** ainsi que leurs dates.
2. Vérifiez les **chiffres** : unité, période, indicateurs actifs et disponibilité des sources.
3. Parcourez les **tableaux** : lignes manquantes, tris, colonnes et éventuels dépassements de page ou de diapositive.
4. Vérifiez les **graphiques** : indicateurs choisis, cohérence des unités, légendes et rendu.
5. Si le document exploite des **tickets**, contrôlez les dates de référence des photographies sélectionnées.
6. Testez les **liens** et assurez-vous que les destinataires auront accès aux ressources citées.

**En cas de tag non remplacé**, vérifiez sa syntaxe exacte, les accolades, la famille choisie et son emplacement dans le modèle. Si une source n'existe pas, consultez le message d'erreur ou les données du cycle : une absence d'information n'est pas un zéro.

**Si un tableau ou un graphique déborde**, ajustez le modèle Office : réduisez le texte attendu, réservez davantage d'espace ou répartissez les éléments sur plusieurs pages ou diapositives.

## Votre point de contrôle

Vous devez pouvoir expliquer **quel modèle est utilisé, quels tags demandent quelles informations, de quel sprint ou quelle équipe viennent les données et comment contrôler leur qualité**.

Lorsque ces éléments sont clairs, la génération de rapports devient une manière fiable de raconter l'activité de votre équipe, tout en conservant une présentation professionnelle et réutilisable.
