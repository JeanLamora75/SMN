# Tableau de bord : votre cockpit de pilotage Agile

Le **tableau de bord** n'est pas qu'une page de chiffres. C'est l'endroit où le Scrum Master ou le RTE peut **comprendre la situation d'une équipe, repérer ce qui mérite une action et accéder rapidement aux informations utiles**. Il rassemble le contexte du sprint ou de la période Kanban, des indicateurs et, selon la présentation utilisée, des listes d'événements ou d'éléments métier.

> **Le conseil de Camille :** avant un Daily, consacrez deux minutes au tableau de bord. Posez-vous trois questions : où en sommes-nous, qu'est-ce qui nécessite une discussion et vers quel écran faut-il aller pour agir ?

## 1. À quoi sert-il concrètement ?

Le tableau de bord permet de **mettre en avant quelques informations importantes** plutôt que de parcourir systématiquement tous les modules :

- **Suivre le cycle** : équipe, produit, sprint ou période, dates et état d'avancement.
- **Lire les indicateurs** : capacité, Story Points, tickets et autres mesures choisies par l'équipe.
- **Repérer des situations à traiter** : risques, obstacles, dépendances, notes ou cérémonies lorsque les données et les blocs correspondants sont disponibles.
- **Consulter des listes métier** : afficher des tableaux ou listes directement dans un bloc compatible, sans ouvrir chaque module séparément.
- **Accéder plus vite aux fonctions utiles** : ouvrir le détail du sprint, les registres, le calendrier ou la configuration depuis les actions proposées à l'écran.

**Exemple :** avant une Sprint Review, affichez le sprint concerné, consultez les indicateurs réalisés, vérifiez les risques encore ouverts et retrouvez les cérémonies ou notes importantes. Le tableau de bord sert de point de départ ; les fiches détaillées restent disponibles dans leurs modules.

## 2. Commencez par vérifier le contexte

1. Ouvrez le [Tableau de bord](/app).
2. Vérifiez **l'équipe** et, lorsque l'information est disponible, le **produit** affichés.
3. Contrôlez le **sprint ou la période Kanban**, ses dates et son statut.
4. Si vous utilisez plusieurs équipes ou plusieurs cycles, naviguez vers le contexte souhaité avant de commenter les chiffres.
5. Repérez les blocs disponibles et les actions utiles au travail du jour.

**Pourquoi est-ce important ?** Une même mesure peut être exacte pour un sprint et trompeuse si vous pensez regarder le suivant. Les données du tableau de bord sont liées au contexte sélectionné.

> **Bon réflexe :** lorsque vous consultez un sprint clôturé, vérifiez les informations historiques plutôt que de supposer que les valeurs sont celles du sprint en cours.

## 3. Mettez les bons indicateurs en avant

Le tableau de bord peut présenter **des mesures choisies pour l'équipe**. Leur définition ne se fait pas dans le tableau de bord lui-même : le catalogue et les préférences d'indicateurs sont gérés dans **Paramètres → Indicateurs** et dans [Indicateurs](/app/admin/indicators).

### Le parcours à comprendre

1. **Définition** : un administrateur crée un indicateur manuel ou calculé dans le catalogue global, avec son nom, son tag, son unité et, si nécessaire, sa formule.
2. **Sélection pour l'équipe** : dans **Indicateurs → Sélection**, activez les mesures réellement utiles à cette équipe.
3. **Préférences d'affichage** : dans **Indicateurs → Préférences**, choisissez leur visibilité, leur ordre et leur style pour le tableau de bord.
4. **Mise en avant** : les emplacements de KPI peuvent être affectés à des indicateurs choisis, selon la présentation utilisée.
5. **Contrôle** : revenez au tableau de bord et vérifiez les valeurs du cycle concerné.

### Les emplacements KPI du tableau de bord classique

L'éditeur des emplacements prévoit **4 positions Story Points**, **2 positions Tickets** et **2 positions Indicateurs complémentaires**. Elles peuvent rester vides lorsque vous ne souhaitez pas surcharger l'écran.

**Exemple :** mettez en évidence les Story Points terminés, le nombre de tickets terminés et la capacité de développement. Ces trois mesures répondent à des questions différentes et évitent de confondre volume de travail, livraison et disponibilité.

> **Conseil de Sally :** ne choisissez pas un indicateur parce qu'il « fait joli ». Privilégiez une mesure que vous pourrez expliquer en une phrase, avec une unité et une source identifiées.

**Valeur absente ?** Vérifiez la sélection pour l'équipe, les préférences d'affichage et la présence des données sources. Un indicateur manuel attend une saisie ; un indicateur calculé dépend de sa formule. Une valeur manquante n'est pas automatiquement un zéro.

## 4. Utilisez les tableaux, listes et raccourcis utiles

Selon la version de présentation, vous pouvez trouver des **listes d'obstacles, de risques, de cérémonies, de notes** ou des liens de navigation vers leurs modules.

### Dans le tableau de bord classique

Les sections opérationnelles peuvent faire apparaître des **risques**, **obstacles**, **événements** et **notes ou alertes**. Certaines proposent des actions contextuelles comme **Ajouter**, **Voir tout** ou l'ouverture d'une fiche. Le bouton **Détail du sprint** permet de rejoindre le cycle concerné.

**Exemple :** un obstacle est remonté pendant le Daily. Depuis le bloc opérationnel, utilisez l'action disponible pour l'enregistrer, puis retrouvez-le dans [Registres](/app/admin/registries).

### Dans le tableau de bord personnalisé

Un emplacement peut présenter **une mesure** ou, si la source le permet, **une liste métier**. Des sources de listes sont actuellement disponibles dans le catalogue du Builder pour les **registres**, les **cérémonies** et les **notes du sprint**. Certaines listes proposent aussi un ajout rapide ou l'ouverture d'un élément pour le modifier, selon les droits et l'état du cycle.

Le catalogue peut également afficher d'autres familles, comme **Liens**, **Équipe** ou **Objectifs**, avec la mention **source indisponible** tant que leur connexion technique n'est pas active. **Une option visible dans le catalogue n'est donc pas nécessairement utilisable.**

### Les raccourcis à connaître

- **Détail du sprint** : ouvrir la fiche du cycle depuis le tableau classique lorsqu'elle est proposée.
- **Flèches précédent / suivant** : naviguer entre les cycles dans le Builder en consultation.
- **Actualiser** : relire les informations affichées dans le Builder.
- **Voir tout**, **Ajouter** ou **ouvrir un élément** : rejoindre ou agir sur la source métier, seulement quand l'action est affichée et autorisée.
- **Personnaliser** : ouvrir la configuration du Builder si vous disposez des droits nécessaires.

> **Conseil pratique :** servez-vous du tableau de bord pour détecter un besoin d'action, puis ouvrez la fiche source pour la traiter correctement. Un raccourci n'est pas un substitut à l'historique métier.

## 5. Qu'est-ce que le Dashboard Builder ?

Le **Dashboard Builder** est l'outil de **composition visuelle du tableau de bord**. Il permet d'organiser les informations en blocs, d'adapter leurs présentations et de créer un espace de pilotage pertinent pour une équipe.

Vous pouvez l'ouvrir depuis **Ouvrir mon Dashboard Builder** sur le tableau de bord classique ou, lorsque le mode personnalisé est actif, depuis l'action **Personnaliser**.

**Attention à la différence entre les deux vues :** SMN peut conserver le tableau de bord classique comme accueil et proposer le Builder sur un écran distinct. Le basculement automatique vers le Builder dépend de la configuration de l'installation. Ne supposez pas que personnaliser le Builder modifie immédiatement tous les blocs du tableau classique.

### Ce que vous pouvez personnaliser

- **Les blocs d'en-tête** : titres, icônes, couleurs et emplacements dynamiques.
- **Les lignes du tableau** : en ajouter, les supprimer et les réordonner.
- **Les blocs d'une ligne** : ajouter, déplacer, dupliquer, supprimer, ajuster les dimensions.
- **Les modèles de disposition** : choisir parmi six géométries, **M01 Simple**, **M02 Duo**, **M03 Trio**, **M04 Quatuor**, **M05 Asymétrique** et **M06 Composé**.
- **Les emplacements** : choisir une **source métier**, une **visualisation** compatible et ses options de filtrage.
- **La présentation** : personnaliser titres, icônes et couleurs, lorsque les contrôles sont proposés.
- **La réutilisation** : copier la disposition enregistrée vers une autre équipe avec l'action prévue.

> **À retenir :** le Builder organise la présentation des données ; il ne crée pas automatiquement des indicateurs, des réunions ou des éléments de registre. Ces contenus restent gérés par leurs modules.

## 6. Personnalisez votre tableau de bord pas à pas

### Étape A — Choisissez d'abord ce que vous voulez montrer

Avant de toucher à la mise en page, définissez trois ou quatre questions prioritaires : **quel est l'objectif ? quelle est la capacité ? quels résultats suivons-nous ? qu'est-ce qui nous bloque ?**

Commencez avec une disposition simple. Une ligne avec un bloc KPI et un bloc de liste est souvent plus efficace qu'un écran très dense.

### Étape B — Entrez en personnalisation

1. Ouvrez le Dashboard Builder (si votre rôle vous autorise cette configuration) dans le bon contexte d'équipe.
2. Dans le menu **Actions**, choisissez **Personnaliser**, si votre rôle vous le permet.
3. Repérez la configuration d'en-tête et les lignes existantes.
4. Modifiez votre **brouillon** sans risque pour la disposition enregistrée : les changements ne sont appliqués qu'après **Enregistrer**.

### Étape C — Ajoutez une ligne ou un bloc

1. Cliquez sur **Ajouter une ligne** si vous souhaitez un nouvel espace.
2. Dans la ligne concernée, choisissez **Ajouter un bloc**.
3. Sélectionnez un modèle de disposition dans la **galerie**, de **Simple** à **Composé**.
4. Donnez au bloc un titre compréhensible : « Indicateurs de livraison », « Risques à suivre » ou « Cérémonies à venir ».
5. Ajustez sa dimension ou sa position si nécessaire.

**Quel modèle choisir ?** Utilisez **Simple** pour mettre en avant une mesure ou une liste ; **Duo** pour comparer deux informations ; **Quatuor** pour une vue synthétique ; **Asymétrique** ou **Composé** lorsqu'une information mérite davantage d'espace.

### Étape D — Configurez les emplacements

1. Cliquez sur le bouton **+** d'un emplacement vide ou sur sa source actuelle.
2. Dans l'assistant, choisissez la **famille** et la **source** souhaitées.
3. Vérifiez si la source est marquée **disponible** : une source indisponible ne pourra pas être utilisée comme une source opérationnelle.
4. Choisissez la **visualisation** compatible : nombre, carte KPI, jauge, tachymètre, pile, tendance, courbe, histogramme ou liste, selon la source.
5. Ajustez les options proposées et validez.
6. Personnalisez si besoin le **titre de l'emplacement**, son **icône** et sa **couleur**.

**Exemple :** configurez un indicateur actif de votre équipe en **carte KPI** dans un petit emplacement et une **liste de risques** dans un bloc plus large. Une liste métier permet de parcourir des éléments ; une carte KPI sert à lire rapidement une valeur.

> **Bon réflexe :** si un indicateur n'est pas proposé, retournez dans le module Indicateurs et vérifiez sa sélection pour l'équipe ainsi que sa visibilité sur le tableau de bord.

### Étape E — Organisez, puis enregistrez

1. Utilisez le **glisser-déposer** ou les commandes **Monter / Descendre** pour réordonner lignes et blocs.
2. Utilisez **Dupliquer** pour reprendre une structure de bloc plutôt que recommencer.
3. Vérifiez les confirmations avant de supprimer une ligne, un bloc ou de changer un modèle qui contient déjà des données configurées.
4. Cliquez sur **Enregistrer** dans la barre fixe.
5. Quittez la personnalisation et vérifiez le résultat en mode consultation.

**Annuler** permet de quitter sans enregistrer les changements ; une alerte protège les modifications non sauvegardées. L'option **Réinitialiser** restaure le brouillon de disposition initiale, mais ne supprime pas les données métier.

## 7. Copier le tableau de bord et préserver la cohérence

L'action **Copier vers une autre équipe** permet de réutiliser une disposition enregistrée. C'est utile si plusieurs équipes souhaitent une structure visuelle commune.

Avant de copier, vérifiez que les **indicateurs sélectionnés**, les données et les sources disponibles pour l'équipe cible correspondent aux emplacements prévus. Une belle disposition ne garantit pas que toutes les valeurs soient disponibles partout.

> **Conseil de standardisation :** adoptez un noyau commun de blocs — objectif, capacité, résultat et points d'attention — puis laissez chaque équipe personnaliser les informations qui ont du sens pour elle.

## 8. Interprétez les indicateurs et les listes avec prudence

**Une valeur seule ne raconte pas toute l'histoire.** Confrontez-la aux changements de périmètre, aux absences, aux jours fériés, aux cérémonies et aux décisions de l'équipe.

- **Capacité inhabituelle** : vérifiez les fiches membres, horaires, affectations et absences.
- **Story Points ou tickets inattendus** : vérifiez la définition des indicateurs, les saisies ou les données CSV disponibles.
- **Risque absent de la liste** : vérifiez le contexte d'équipe, le cycle, les filtres de la liste et les enregistrements dans le module Registres.
- **Source indisponible dans le Builder** : ne la confondez pas avec une liste vide ; son adaptateur peut ne pas être encore connecté.
- **Affichage différent du tableau classique** : vérifiez le mode de tableau de bord utilisé ; les deux présentations peuvent coexister.

## 9. Votre point de contrôle

Un bon tableau de bord doit permettre de répondre sans effort à ces questions : **sur quel cycle travaillons-nous ? que mesure-t-on ? quels sujets demandent une action ? quels raccourcis nous permettent d'approfondir ou de corriger ?**

Si vous pouvez l'utiliser pour préparer un Daily, une revue ou un échange avec les parties prenantes, votre tableau de bord est devenu un véritable outil de pilotage — et pas simplement une collection de graphiques.
