# Indicateurs : pilotez votre équipe avec des mesures utiles

Les indicateurs ne sont pas là pour multiplier les chiffres. Ils servent à **comprendre la situation de l'équipe, repérer une évolution et éclairer une décision**. Vélocité, capacité, répartition des tickets ou taux de réalisation : chaque mesure devient utile lorsqu'on sait **ce qu'elle représente, d'où elle vient et comment l'interpréter**.

SMN sépare trois opérations complémentaires : **définir** les indicateurs dans les Paramètres, **sélectionner** ceux dont une équipe a besoin, puis **saisir, calculer et afficher** leurs valeurs pour chaque sprint ou période Kanban.

> **Le conseil de Camille :** choisissez d'abord quelques indicateurs que vous expliquerez facilement à l'équipe. Un chiffre sans définition, sans unité ou sans période précise risque de créer davantage de confusion que de visibilité.

## 1. À quoi servent les indicateurs dans SMN ?

Les indicateurs permettent notamment de :

- **Suivre un cycle** : comparer ce qui était prévu et ce qui a été réalisé pendant un sprint ou une période Kanban.
- **Anticiper** : examiner la capacité disponible et identifier les écarts à discuter.
- **Observer les tendances** : comparer plusieurs cycles sans devoir reconstituer les chiffres manuellement.
- **Partager une vision commune** : présenter les mesures utiles dans le tableau de bord, les listes, les tendances et les rapports.

**Exemple :** votre équipe suit les Story Points terminés et la capacité de développement. La valeur d'un sprint est intéressante, mais son évolution sur plusieurs sprints vous aide davantage à discuter de la prévisibilité et des changements de contexte.

> **Attention :** un indicateur n'est pas un objectif de performance individuel. Interprétez-le avec les événements du cycle, les absences, les changements de périmètre et la réalité du travail de l'équipe.

## 2. Comprenez la différence entre indicateurs manuels et calculés

### Indicateur manuel : vous fournissez la mesure

Un **indicateur manuel** possède un nom, un tag et éventuellement une unité, mais **sa valeur doit être renseignée pour le cycle**. SMN ne la déduit pas simplement parce que l'indicateur existe.

**Exemples de situations :** saisir une estimation retenue lors du Sprint Planning, reporter un comptage calculé dans le module Tickets / CSV ou renseigner une mesure métier suivie par l'équipe.

Si vous consultez un cycle avant d'avoir saisi une mesure manuelle, sa valeur peut être absente : **absence ne signifie pas zéro**.

### Indicateur calculé : SMN applique une formule

Un **indicateur calculé** possède une **expression de calcul** définie dans le catalogue. SMN évalue cette expression à partir des données disponibles pour l'équipe et le cycle : autres indicateurs, valeurs de cycles précédents ou informations de capacité.

**Exemple pédagogique :** si deux indicateurs du catalogue mesurent les Story Points terminés et prévus, une formule du type `(SP_TERMINES / SP_PREVUS) * 100` peut exprimer un pourcentage de réalisation. Les noms de tags doivent correspondre exactement à ceux de **votre catalogue**, et une division par zéro ne produit pas un résultat exploitable.

| Type | Qui fournit la valeur ? | Que faut-il vérifier ? |
|---|---|---|
| **Manuel** | Un utilisateur autorisé saisit la mesure du cycle. | Source, unité, date et cohérence de saisie. |
| **Calculé** | SMN évalue la formule définie dans les Paramètres. | Formule, indicateurs sources, historique et disponibilité des données. |

> **Bonne pratique :** utilisez un indicateur manuel pour une mesure dont l'origine est extérieure au moteur de formules, puis un indicateur calculé pour transformer ou rapprocher des mesures déjà disponibles.

## 3. Définissez les indicateurs dans Paramètres

Un administrateur ouvre **Paramètres → Indicateurs**. Le catalogue est **global** : on y définit les indicateurs réutilisables avant de décider quelles équipes les utiliseront.

Dans l'onglet **Catalogue**, cliquez sur **Créer** pour ajouter une définition.

### À quoi servent les champs ?

- **Nom** : intitulé compréhensible, par exemple « Story Points terminés ». Il sera visible dans les écrans de suivi.
- **Tag** : identifiant technique unique, par exemple `SP_TERMINES`. Il permet aux formules et aux modèles de rapports de retrouver l'indicateur. Utilisez des lettres majuscules, chiffres et underscores.
- **Type** : **Manuel** ou **Calculé**. C'est le choix qui détermine si une valeur sera saisie ou calculée.
- **Formule** : expression requise pour un indicateur calculé. Elle doit référencer des fonctions et des tags reconnus.
- **Description** : définition métier, méthode de mesure et limites d'interprétation. Ce champ évite les ambiguïtés.
- **Unité et unité courte** : par exemple « Story Points » et « SP », ou « Pourcentage » et « % ».
- **Couleur et icône** : repères visuels utilisés dans les présentations compatibles.

### Pour créer une définition

1. Ouvrez le **Catalogue** depuis les Paramètres.
2. Cliquez sur **Créer**.
3. Donnez un **nom métier clair** et un **tag stable**.
4. Choisissez **Manuel** ou **Calculé** ; pour ce dernier, renseignez la formule.
5. Complétez la **description** et les **unités**.
6. Enregistrez et vérifiez la définition dans la liste.

**Exemple de description utile :** « Nombre de Story Points des tickets terminés à la fin du sprint, selon la photographie de tickets retenue ». Cette précision permet aux utilisateurs d'employer la même convention d'un cycle à l'autre.

> **Conseil important :** évitez de renommer un tag utilisé dans des modèles Office. SMN prend en charge l'association des formules liées, mais **ne réécrit pas automatiquement les anciens tags dans vos fichiers Word et PowerPoint**.

## 4. Comment fonctionnent les formules ?

Une formule peut réunir **des tags d'indicateurs**, **des opérations mathématiques** et **des fonctions spécifiques à SMN**. Le moteur résout les dépendances entre indicateurs puis calcule les résultats à partir des sources disponibles.

Dans **Paramètres → Indicateurs → Guide des expressions**, vous trouverez les fonctions prises en charge, leur description et des exemples copiables.

### Trois familles à connaître

**Calculs mathématiques** — Addition `+`, soustraction `-`, multiplication `*`, division `/`, puissance `^`, pourcentage `%`, ainsi que les fonctions `MIN`, `MAX` et `ROUND`.

**Historique** — `SUM_LAST(TAG, X)` additionne les X derniers cycles ; `AVG_LAST(TAG, X)` calcule une moyenne ; `PREVIOUS(TAG, 1)` retrouve la valeur du cycle précédent ; `DELTA` et `DELTA_PCT` calculent un écart. `AVG_WEEK_LAST` rapporte des valeurs à une durée cumulée en semaines. Le cycle sélectionné est inclus dans plusieurs fonctions, notamment `SUM_LAST`.

**Capacité par rôle** — `ROLE_MAX_JH("DEVELOPER")` représente les jours-homme théoriques du rôle avant absences ; `ROLE_JH_PLANNED("DEVELOPER")` tient compte des absences planifiées ; `ROLE_JH("DEVELOPER")` tient compte de toutes les absences enregistrées.

**Exemple :** `AVG_LAST(SP_TERMINES, 3)` demande la moyenne de l'indicateur `SP_TERMINES` sur trois cycles, **si ce tag est défini et si les valeurs nécessaires sont disponibles**.

### Pourquoi le calcul peut-il être indisponible ?

Le moteur peut signaler une **source manquante**, une **division par zéro**, une **dépendance indisponible** ou un **domaine de calcul invalide**. Il ne faut pas convertir automatiquement ces situations en zéro.

> **Conseil de fiabilité :** documentez les dépendances de vos formules. Si vous calculez un ratio, expliquez les deux mesures qui entrent au numérateur et au dénominateur et ce que signifie une variation du résultat.

## 5. Publiez une modification de formule avec précaution

Modifier une formule existante peut changer les résultats de plusieurs cycles et d'autres indicateurs qui en dépendent.

1. Dans le **Catalogue**, ouvrez la définition de l'indicateur calculé.
2. Utilisez l'éditeur de **formule**.
3. Lancez la **Prévisualisation** avant de publier.
4. Examinez le nombre d'**indicateurs affectés**, de **cycles**, de **résultats** et de **valeurs indisponibles**.
5. Si l'impact vous convient, confirmez la **publication**.

SMN contrôle également les références et les fonctions reconnues ; un problème de syntaxe ou de référence doit être corrigé avant d'enregistrer.

> **À retenir :** un changement de formule est une décision de définition métier, pas seulement une correction cosmétique. Pensez à prévenir l'équipe si la série historique change de signification.

## 6. Choisissez les indicateurs de chaque équipe

**Définir un indicateur global ne suffit pas à l'afficher partout.** Chaque équipe doit sélectionner les indicateurs qui la concernent.

1. Ouvrez [Indicateurs](/app/admin/indicators) pour l'équipe souhaitée.
2. Accédez à l'onglet **Sélection des indicateurs**.
3. Repérez le **tag** et le **nom** dans le tableau.
4. Cochez la case **Sélectionné** pour activer un indicateur pour l'équipe ; décochez-la pour le retirer de sa sélection.
5. Vérifiez le résultat dans la liste des cycles et les préférences d'affichage.

Les indicateurs archivés ne peuvent pas être sélectionnés comme des indicateurs actifs. Les choix de chaque équipe évitent de présenter des mesures qui ne correspondent pas à son fonctionnement Scrum ou Kanban.

**Exemple :** une équipe Scrum peut suivre des Story Points et la capacité de développement, tandis qu'une équipe Kanban privilégie des mesures adaptées à son flux. Le catalogue reste partagé, mais les sélections diffèrent.

> **Conseil :** ne cochez pas tous les indicateurs « au cas où ». Sélectionnez ceux qui répondent à une question précise de l'équipe ou des parties prenantes.

## 7. Saisissez les valeurs pour un sprint ou une période

Dans [Indicateurs](/app/admin/indicators), l'onglet de suivi affiche une **liste de cycles** avec leur statut, leur période et les colonnes d'indicateurs configurées. Une action **Modifier** est proposée sur chaque ligne pour ouvrir la fenêtre de saisie, selon vos droits.

1. Repérez la **bonne équipe** et le **bon cycle**.
2. Cliquez sur **Modifier** sur la ligne concernée.
3. Dans la fenêtre, renseignez les **indicateurs manuels**. Leurs noms et tags permettent de vérifier ce que vous saisissez.
4. Consultez la section repliable des **indicateurs calculés**.
5. Lancez **Prévisualiser** pour vérifier les calculs et les éventuels messages d'indisponibilité.
6. Cliquez sur **Enregistrer** une fois les valeurs et résultats contrôlés.

**Important :** vous ne saisissez pas directement les indicateurs calculés dans ce formulaire. Ils sont évalués à partir des mesures et des données disponibles. Une modification de valeur manuelle peut donc modifier plusieurs résultats calculés.

> **Exemple pratique :** après avoir importé un CSV de tickets, consultez ses KPI dans le module Tickets, puis renseignez l'indicateur manuel correspondant. Prévisualisez ensuite le ratio ou la moyenne calculés avant d'enregistrer.

## 8. Choisissez les indicateurs visibles dans les listes et les autres écrans

SMN distingue la **sélection pour l'équipe** et les **préférences d'affichage par écran**. Un indicateur sélectionné n'a pas vocation à occuper toutes les vues.

Ouvrez l'onglet **Préférences d'affichage** dans le module Indicateurs. Les sections sont organisées par usage :

- **Tableau de bord** : choisir les indicateurs mis en avant dans les blocs disponibles.
- **Liste des cycles** : choisir les colonnes visibles dans les tableaux de sprints ou périodes.
- **Détail d'un cycle** : sélectionner les informations affichées dans la fiche.
- **Tendances** : organiser les mesures suivies dans le temps.
- **Rapports** : définir les préférences associées aux restitutions concernées.

Pour chaque écran, vous pouvez **afficher ou masquer** des indicateurs sélectionnés, **modifier leur ordre** et choisir un **style compatible** (nombre, carte, jauge, courbe ou barres selon le contexte).

### Comment sont définies les colonnes des listes ?

Dans la **Liste des cycles**, les colonnes d'indicateurs dépendent des sélections et des préférences enregistrées. Leur en-tête est généralement présenté sous forme d'**initiales du nom de l'indicateur**, avec le nom complet accessible dans l'infobulle ou le libellé accessible.

**Exemple :** « Taux de réalisation » peut apparaître sous **TDR**. Pour retrouver sa signification, consultez le nom complet puis la définition de l'indicateur dans le catalogue.

L'action **Gérer les colonnes** donne accès aux préférences correspondantes. L'ordre peut être modifié avec les commandes **Monter / Descendre** ou par glisser-déposer lorsque cette interaction est disponible.

### Et sur le tableau de bord ?

Le réglage des emplacements du tableau de bord propose notamment trois groupes de positions : **Story Points (4)**, **Tickets (2)** et **Indicateurs complémentaires (2)**. Vous choisissez parmi les indicateurs actifs de l'équipe, sans obligatoirement remplir chaque emplacement.

> **Conseil de Sally :** les listes doivent faciliter la comparaison, pas devenir des murs de chiffres. Pour la liste des sprints, gardez quelques colonnes stables ; réservez les indicateurs détaillés aux vues et rapports adaptés.

## 9. Utilisez les tendances et les rapports

Un indicateur peut être suivi sur plusieurs cycles, présenté sur le tableau de bord ou réutilisé dans un **modèle de rapport Word ou PowerPoint**.

Dans [Rapports](/app/reports), les tags d'indicateurs et de graphiques permettent d'insérer des valeurs et des tendances. Par exemple, un tag du type `{{INDICATOR_SP_TERMINES}}` demande la valeur associée au tag `SP_TERMINES`, **si ce tag existe réellement**.

Les graphiques peuvent exploiter des indicateurs sur plusieurs cycles ; le modèle, les tags et les unités doivent rester cohérents.

> **Bon réflexe :** avant de présenter une tendance, vérifiez si les définitions des mesures et le périmètre des cycles sont restés comparables.

## 10. Résolvez les problèmes fréquents

- **L'indicateur n'apparaît pas dans la liste :** vérifiez qu'il existe dans le catalogue, qu'il est actif, **sélectionné pour l'équipe** et visible dans les préférences de cet écran.
- **Une valeur manuelle manque :** ouvrez la saisie du bon cycle et vérifiez si elle a été enregistrée.
- **Un calcul affiche « indisponible » :** vérifiez les valeurs sources, le dénominateur, les dépendances et les données historiques nécessaires.
- **La colonne semble incompréhensible :** survolez ou sélectionnez l'en-tête abrégé pour retrouver le nom complet, puis lisez la définition dans le catalogue.
- **Une formule a changé :** prévisualisez l'impact et utilisez les fonctions de publication ou de recalcul autorisées plutôt que de corriger des résultats à la main.
- **Une donnée diffère d'un rapport :** comparez l'équipe, le cycle, la formule, le tag et la période exploités.

## Votre point de contrôle

Pour chaque indicateur important, demandez-vous : **que mesure-t-il ? qui fournit sa valeur ? comment est-il calculé ? pour quelle équipe et quel cycle ? où est-il affiché ?**

Si vous pouvez répondre à ces questions, vos indicateurs deviennent des outils de pilotage compréhensibles, comparables et utiles dans les discussions d'équipe.
