# Liens : créez la bibliothèque de ressources de votre équipe

Le module **Liens** n'est pas un simple gestionnaire de favoris. Il permet de regrouper les outils, documents et espaces de travail utiles à une équipe, de **les retrouver rapidement**, de **les afficher sur le tableau de bord** et, lorsque le modèle le prévoit, de **les intégrer dans un rapport**.

> **Le conseil de Camille :** imaginez qu'un nouveau membre rejoigne votre équipe demain. Pourrait-il retrouver en quelques clics le backlog, le tableau Jira, les règles de fonctionnement et les documents de référence ? Si oui, votre bibliothèque de liens remplit son rôle.

## 1. Pourquoi centraliser les liens dans SMN ?

Une équipe utilise souvent de nombreux outils : un backlog Jira, un tableau de suivi, un espace documentaire, des comptes rendus ou encore des pages de référence. Sans point d'entrée commun, ces adresses finissent dans les favoris personnels ou dans d'anciens messages.

Avec SMN, une même bibliothèque peut servir à trois usages complémentaires :

- **Au quotidien :** consulter une liste de ressources en lien avec l'activité de l'équipe, les rechercher et les ouvrir sans quitter son contexte de travail.
- **Dans le tableau de bord :** afficher une sélection ou une liste de liens à proximité des autres informations utiles du sprint ou de la période, grâce aux blocs configurables prenant en charge les liens.
- **Dans les rapports :** réutiliser les liens accessibles dans un document Word ou PowerPoint lorsqu'un modèle contient les tags de liens adaptés.

**Exemple :** votre équipe retrouve le backlog, le Wiki produit et la documentation de livraison dans SMN. Le tableau de bord peut présenter les ressources clés du moment ; un rapport de sprint peut reprendre les liens pertinents pour les parties prenantes.

## 2. Comprenez les deux portées : Équipe et Transverse

Au moment de créer un lien, SMN vous demande de choisir sa **portée** :

- **Équipe** : une ressource propre au contexte d'une équipe, comme son backlog, son tableau de suivi ou sa documentation de sprint.
- **Transverse** : une ressource commune à plusieurs équipes, comme un référentiel de pratiques ou une page de documentation partagée.

Le module affiche les liens d'équipe et les liens transverses accessibles dans le contexte courant. Vous pouvez filtrer la liste par portée.

> **Bon réflexe :** demandez-vous « qui aura besoin de cette adresse ? ». Si elle concerne uniquement une équipe, préférez **Équipe** ; si elle est destinée à un usage commun, choisissez **Transverse**. Un classement cohérent rendra les listes du tableau de bord et des rapports plus pertinentes.

**Important :** le choix d'une portée n'accorde pas à lui seul des droits sur la ressource externe. Une adresse vers un document protégé reste soumise aux autorisations du site cible.

## 3. Retrouvez les ressources dont vous avez besoin

1. Ouvrez [Liens](/app/admin/links) depuis le menu lorsque votre compte est autorisé.
2. Vérifiez le **nom de l'équipe** dans l'en-tête : il détermine le contexte des liens spécifiques à l'équipe.
3. Choisissez **Cartes** pour une présentation détaillée ou **Liste** pour parcourir plus rapidement les ressources.
4. Utilisez la **recherche** : elle peut retrouver un lien grâce à son titre, sa description, son adresse ou sa catégorie.
5. Affinez par **portée** et **catégorie**. Choisissez ensuite un tri par **titre**, **catégorie** ou **date de modification récente**.
6. Cliquez sur **Ouvrir** pour accéder à la ressource dans un nouvel onglet.

**Exemple :** recherchez « Sprint Review » pour retrouver votre modèle de compte rendu, puis filtrez sur la catégorie documentaire si plusieurs ressources correspondent.

> **Conseil d'organisation :** choisissez des intitulés qu'un collègue comprendra immédiatement, tels que « Backlog Jira — Équipe Alpha », plutôt que « Lien Jira 2 ».

## 4. Ajoutez un lien : les champs expliqués

Si vous disposez des droits de gestion, cliquez sur **Ajouter** dans l'en-tête. Une fenêtre de création s'ouvre.

### Que faut-il renseigner ?

**Titre — obligatoire** : le nom visible dans SMN. Il doit indiquer clairement la destination ou son usage, par exemple « Documentation d'architecture ».

**URL — obligatoire** : l'adresse complète de la ressource à ouvrir. Copiez l'adresse réelle depuis votre navigateur, puis vérifiez qu'elle pointe sur la bonne page.

**Description — facultative** : explique à quoi sert le lien et quand le consulter. C'est particulièrement utile pour les nouveaux membres de l'équipe.

**Catégorie — obligatoire** : classe la ressource dans un groupe cohérent, par exemple documentation, outil de suivi ou référence métier. La catégorie doit préalablement exister dans les paramètres des liens.

**Portée — obligatoire** : indique si le lien est **Équipe** ou **Transverse**. Le formulaire propose la portée Équipe lors de la création.

### Procédure pas à pas

1. Cliquez sur **Ajouter**.
2. Saisissez le **titre** et collez l'**URL**.
3. Ajoutez une **description** courte et utile.
4. Choisissez la **catégorie**, puis la **portée** adaptée.
5. Cliquez sur **Enregistrer**.
6. Retrouvez l'entrée avec la recherche et cliquez sur **Ouvrir** pour vérifier sa destination.

> **Exemple de bonne fiche :** titre « Backlog Jira — Équipe Alpha » ; description « Liste des tickets à affiner avant le Sprint Planning » ; catégorie « Outils de suivi » ; portée « Équipe ». L'adresse doit être celle du vrai backlog de l'équipe.

## 5. Préparez les catégories dans les Paramètres

Si la catégorie souhaitée n'existe pas, ouvrez **Paramètres → Liens** pour gérer les catégories disponibles, puis revenez au module Liens.

Une catégorisation simple est généralement plus utile qu'une liste très longue : **Pilotage**, **Documentation**, **Outils** et **Références** peuvent constituer un bon point de départ, à adapter aux catégories réellement créées dans SMN.

Les catégories sont utilisées pour **filtrer** les liens et peuvent faciliter leur sélection dans les différents contextes de consultation.

## 6. Affichez vos liens sur le tableau de bord

**C'est l'un des intérêts majeurs du module :** les liens enregistrés peuvent être réutilisés dans les **blocs de liste de liens du tableau de bord**, lorsqu'ils sont disponibles dans le modèle ou la configuration de votre dashboard.

1. Commencez par créer les ressources dans [Liens](/app/admin/links) et vérifiez leur portée.
2. Ouvrez le [Tableau de bord](/app) de l'équipe concernée.
3. Si vous avez les droits nécessaires, accédez à la **personnalisation du tableau de bord** et choisissez un emplacement ou un bloc prenant en charge une liste de liens.
4. Configurez le bloc selon les options proposées par votre modèle, puis enregistrez.
5. Revenez au tableau de bord et contrôlez que les bonnes ressources s'affichent et que leurs liens fonctionnent.

**Pourquoi l'afficher ici ?** Le tableau de bord devient un point d'entrée pour l'équipe : on peut suivre les indicateurs du sprint et accéder, au même endroit, aux documents ou outils nécessaires pour agir.

> **Conseil UX :** ne surchargez pas le tableau de bord. Mettez-y les ressources consultées fréquemment ; laissez les liens moins courants dans la liste complète du module Liens.

**À savoir :** la présence et les réglages exacts d'un bloc Liens dépendent du modèle de tableau de bord et des droits de personnalisation. Le module Liens reste la source de gestion des adresses.

## 7. Réutilisez la liste des liens dans un rapport

Les liens peuvent aussi enrichir les documents remis à vos interlocuteurs : un rapport de sprint peut, par exemple, contenir les liens vers le backlog, les comptes rendus et les documents de référence.

Le moteur de rapports Office de SMN dispose de **tags de liens** permettant, selon le modèle, de reprendre des listes. La portée **Équipe** ou **Transverse** permet de distinguer les ressources à inclure lorsque le tag propose cette option.

1. Vérifiez que les liens et leurs catégories sont à jour.
2. Ouvrez [Rapports](/app/reports), puis l'onglet **Tags**.
3. Repérez la famille des **Liens** et utilisez le **configurateur de tags** pour sélectionner les paramètres compatibles, notamment la portée si proposée.
4. Copiez le tag généré dans votre modèle Word ou PowerPoint.
5. Dans **Modèles**, sélectionnez le modèle et le cycle adapté, puis générez le document.
6. Ouvrez le rapport produit et vérifiez les liens réellement présents.

**Important :** enregistrer un lien dans SMN ne l'ajoute pas automatiquement à tous les rapports. **Le modèle doit contenir le tag approprié**, et le résultat dépend du périmètre accessible et des options du tag.

> **Conseil de reporting :** ajoutez dans vos rapports des liens vers des ressources stables et accessibles aux destinataires. Une URL interne inaccessible à votre interlocuteur apporte peu de valeur.

## 8. Modifiez, reclassez ou supprimez un lien

Pour mettre à jour une ressource, utilisez l'**icône d'édition** de sa carte ou de sa ligne. Vous pouvez corriger son titre, son adresse, sa description, sa catégorie ou sa portée.

**Si vous changez la portée**, SMN demande une confirmation spécifique. Ce changement peut modifier les contextes dans lesquels le lien apparaît : vérifiez ensuite les listes concernées, notamment sur le tableau de bord et dans les rapports générés ultérieurement.

Pour supprimer un lien devenu inutile, utilisez **Supprimer** et lisez la confirmation. Une suppression ne signifie pas que les fichiers ou les pages du site externe sont supprimés. Elle retire l'entrée de la bibliothèque SMN.

> **Bon réflexe :** avant de supprimer une ressource, demandez-vous si elle est encore utilisée dans un modèle de rapport, un tableau de bord ou une procédure de l'équipe.

## 9. Si un lien manque ou ne s'ouvre pas

- **Lien introuvable :** vérifiez l'équipe affichée, les filtres de portée et de catégorie, puis effacez la recherche.
- **Impossible de créer un lien :** vérifiez vos droits et l'existence d'au moins une catégorie disponible.
- **Adresse refusée :** vérifiez qu'il s'agit d'une URL valide et complète.
- **Destination inaccessible :** contrôlez les droits sur le site externe ; SMN ne contourne pas les restrictions d'accès.
- **Lien absent du tableau de bord :** contrôlez le bloc utilisé, sa configuration et la portée de la ressource.
- **Lien absent du rapport :** vérifiez les tags de liens du modèle, leurs options et les ressources accessibles au contexte sélectionné.
- **Changement de portée non enregistré :** confirmez explicitement le changement dans le formulaire.

## Votre point de contrôle

Vous devez pouvoir répondre à trois questions : **où retrouver les ressources de l'équipe ? lesquelles doivent être visibles directement dans son tableau de bord ? lesquelles sont utiles aux destinataires de ses rapports ?**

Si ces choix sont clairs, votre module Liens devient une bibliothèque partagée, facile à parcourir et réellement intégrée au pilotage de l'équipe.
