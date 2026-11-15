# Calendrier d'équipe : organisez les événements et anticipez les disponibilités

Le calendrier est le point de rencontre entre **les cérémonies du sprint, les autres réunions et les disponibilités des membres**. Il vous aide à repérer les journées chargées, les absences et les décalages horaires avant qu'ils ne deviennent des difficultés d'organisation.

> **Le réflexe utile :** avant de fixer une réunion, consultez le calendrier du bon sprint, vérifiez les absences et choisissez le fuseau horaire dans lequel vous souhaitez lire les horaires.

## 1. Choisissez la bonne équipe et la bonne période

1. Ouvrez le [Calendrier d'équipe](/app/team-calendar).
2. Vérifiez le **nom de l'équipe** et la **période** affichés dans l'en-tête.
3. Sélectionnez un **sprint ou une période Kanban** dans la liste, lorsqu'elle est disponible.
4. Utilisez les **flèches** pour naviguer entre les périodes et le bouton **Aujourd'hui** pour revenir à la période courante.
5. Choisissez **Cartes** pour visualiser chaque journée ou **Agenda** pour lire les événements dans l'ordre.

Le calendrier peut aussi afficher un mois lorsque le contexte ne fournit pas de cycle à sélectionner. Vérifiez toujours la plage de dates avant de conclure qu'un événement est absent.

### Affichez uniquement ce qui vous intéresse

Les filtres **Réunions** et **Absences** servent à masquer ou réafficher ces informations sans les supprimer. Par exemple, masquez temporairement les réunions pour mieux voir les indisponibilités de l'équipe.

## 2. D'où viennent les cérémonies affichées ?

**Dans un sprint Scrum, les cérémonies peuvent être générées lors de la création du sprint**, en utilisant les paramètres et modèles de cérémonies définis dans SMN. Le calendrier récupère ensuite les occurrences enregistrées : il ne réinvente pas un planning à chaque ouverture.

Vous pouvez notamment y retrouver, selon la configuration du sprint, le **Sprint Planning**, les **Daily Scrums**, la **Sprint Review**, la **Rétrospective**, ainsi que d'autres réunions issues de modèles actifs.

**Pourquoi certaines cérémonies n'apparaissent-elles pas ?** Plusieurs raisons sont possibles : le modèle n'était pas actif lors de la génération, aucune occurrence n'a été créée pour la période, le filtre **Réunions** est désactivé, ou la cérémonie a été modifiée ou annulée.

> **Conseil :** si vous venez de modifier un modèle de cérémonie dans les Paramètres, ne supposez pas que toutes les réunions déjà générées seront automatiquement réécrites. Contrôlez les occurrences présentes dans le sprint et leurs horaires réels.

Les périodes Kanban utilisent leur propre contexte de réunions ; elles ne doivent pas être interprétées comme des sprints Scrum.

## 3. Ajoutez une réunion directement dans le calendrier

Un imprévu, un atelier supplémentaire ou un échange avec une autre équipe ? Vous n'avez pas besoin de modifier la définition de toutes les cérémonies habituelles pour le faire.

1. Dans une journée admissible, cliquez sur **Ajouter une réunion**.
2. Renseignez le **nom de la réunion** pour que son objectif soit identifiable par l'équipe.
3. Choisissez la **date et l'heure de début**.
4. Indiquez sa **durée en minutes** (de 1 à 480 dans le formulaire de création).
5. Vérifiez le sprint ou la période concernée, puis cliquez sur **Créer**.
6. Retrouvez la réunion sur le calendrier et contrôlez l'horaire affiché.

**Exemple :** un atelier de clarification de 45 minutes est nécessaire mercredi. Créez « Atelier de clarification », renseignez son début et une durée de **45 minutes** : il apparaîtra avec les autres événements du cycle.

> **Bon à savoir :** en mode Scrum, la réunion doit appartenir à un sprint admissible et non clôturé. Les actions de création sont soumises aux droits de l'utilisateur et peuvent être absentes certains jours, notamment le week-end.

## 4. Cliquez sur une réunion pour consulter ou modifier ses informations

Le nom d'une réunion est **cliquable**. Il ouvre une fenêtre contenant ses informations détaillées. Pour les cérémonies et réunions Scrum, cette fenêtre permet notamment de consulter :

- **Nom, type, sprint et fuseau horaire** de la réunion.
- **Début et fin prévus** ; la durée planifiée est calculée à partir de ces horaires.
- **Durée réelle**, lorsque l'événement a eu lieu.
- **Statut** : tenue, non tenue ou annulée, avec un motif lorsque nécessaire.
- **Éléments issus de la réunion** : décisions, actions et faits marquants, selon les autorisations.

### Pour corriger l'horaire d'une cérémonie ou réunion Scrum

1. Cliquez sur son titre dans le calendrier.
2. Modifiez la **date/heure de début** ou de **fin** si les champs sont éditables.
3. Contrôlez la durée recalculée automatiquement.
4. Utilisez l'**icône Enregistrer** associée à la section concernée.
5. Refermez la fenêtre et vérifiez la réunion dans le calendrier.

Pour certains **Daily Scrums**, un choix permet de modifier **cette occurrence** ou **cette occurrence et les suivantes**, lorsque la fonction est disponible.

**À retenir :** consulter une réunion ne signifie pas forcément pouvoir la modifier. Les modifications nécessitent des droits adaptés et sont limitées lorsque le sprint est clôturé. Les réunions Kanban peuvent présenter une fiche de consultation plus simple, sans toutes les commandes d'édition de Scrum.

> **Conseil :** après une réunion, consignez sa durée réelle et, si nécessaire, ses décisions ou actions. Le calendrier devient alors un outil de suivi, et pas simplement un planning prévisionnel.

## 5. Ajoutez une absence depuis le calendrier

Pour préparer correctement le sprint, il est important de faire apparaître les indisponibilités des personnes, y compris une absence d'une demi-journée.

1. Sur une journée où l'action est disponible, cliquez sur **Ajouter une absence**.
2. Sélectionnez le **membre de l'équipe** concerné. La liste est limitée aux membres pouvant être affectés à cette date.
3. Renseignez les **dates de début et de fin**.
4. Choisissez les **demi-journées** de début et de fin : matin ou après-midi.
5. Sélectionnez la **catégorie d'absence**, ajoutez un **motif** pertinent et indiquez si l'absence est **prévue** ou **imprévue**.
6. Enregistrez, puis vérifiez que le calendrier actualise le jour concerné.

**Exemple :** une personne est absente le jeudi après-midi. Déclarez une absence du jeudi au jeudi, en choisissant **après-midi** comme demi-journée de début et de fin. Vous évitez ainsi de la compter absente sur toute la journée.

Les absences sont des données métier liées au membre : elles sont également utiles à l'analyse de sa disponibilité et de la capacité d'équipe. Pour vérifier sa semaine de travail, ses affectations ou ses jours fériés, consultez aussi le [guide Membres](/app/admin/members).

## 6. Repérez rapidement qui est absent

Lorsqu'une ou plusieurs personnes sont absentes un jour donné, le calendrier affiche un repère **Absences** accompagné d'un **nombre de membres absents**.

**Comment retrouver les personnes concernées ?** Placez le pointeur sur le repère **Absences** lorsqu'une infobulle est proposée, ou **cliquez sur ce repère** pour ouvrir ou maintenir visible le détail, selon le mode d'interaction. Les noms des membres déclarés absents sont présentés lorsque votre compte est autorisé à consulter ces identités.

> **Attention :** le nombre d'absents peut être visible même si la liste nominative n'est pas accessible à votre rôle. Ne concluez donc pas qu'il n'y a aucune absence au seul motif qu'aucun nom ne s'affiche.

**Utilité au quotidien :** avant le Daily, une revue de sprint ou un atelier, contrôlez en un instant si plusieurs personnes clés sont indisponibles. Vous pouvez alors adapter les participants, le format ou l'horaire.

## 7. Travaillez avec plusieurs fuseaux horaires

Une équipe distribuée peut avoir des membres dans plusieurs pays. Le calendrier propose alors un **fuseau horaire d'affichage** lorsque plusieurs fuseaux sont disponibles dans la configuration de l'équipe.

1. Repérez la zone **Fuseau horaire** dans les filtres du calendrier.
2. Si une liste de sélection est affichée, choisissez le fuseau dans lequel vous souhaitez lire les réunions.
3. Consultez les heures de début et de fin recalculées pour ce fuseau.
4. Avant d'éditer une réunion, vérifiez le **fuseau indiqué dans sa fiche**, car l'édition des horaires s'appuie sur le fuseau propre à cette réunion.

**Exemple :** pour organiser un point entre Paris et Bangalore, affichez les réunions dans le fuseau correspondant au besoin du moment afin de vérifier la lisibilité de l'horaire pour l'équipe.

**Ce changement est un choix d'affichage :** sélectionner un autre fuseau ne décale pas automatiquement la réunion enregistrée. Selon le décalage horaire, une réunion peut aussi être affichée sur un autre jour civil.

> **Bonne pratique :** définissez correctement la localisation et le fuseau de chaque membre dans sa fiche. La liste des fuseaux du calendrier dépend des données disponibles pour l'équipe.

## 8. Comprenez les autres informations du calendrier

Selon le contexte, le calendrier peut également signaler les **jours non travaillés**, les **jours fériés** et les **fermetures d'entreprise**. Cliquez sur une fermeture lorsque cette action est proposée pour voir ses détails.

Les jours fériés et disponibilités individuelles ne sont pas identiques pour tous les membres. Un jour chômé dans un pays ne signifie pas nécessairement que toute l'équipe est absente.

## 9. Si une information semble manquante

- **Une cérémonie manque :** vérifiez le sprint sélectionné, le filtre Réunions, la génération initiale et les modèles de cérémonies.
- **Impossible d'ajouter une réunion :** vérifiez vos droits, le jour choisi, l'existence d'un sprint admissible et son statut.
- **La réunion est visible mais non modifiable :** contrôlez les permissions et l'état du sprint ; une réunion clôturée ou annulée peut avoir des restrictions.
- **Impossible d'ajouter une absence :** vérifiez les droits et que le membre appartient bien à l'équipe à la date sélectionnée.
- **Le compteur d'absences diffère de la liste des noms :** vérifiez les droits de consultation et le détail des absences du jour ; le compteur et les identités sont fournis séparément.
- **Les heures semblent incorrectes :** vérifiez le fuseau d'affichage et celui enregistré dans la fiche de la réunion.
- **Un jour férié semble manquer :** contrôlez le pays du membre et les données nationales disponibles dans SMN.

## Votre contrôle final

Avant votre prochain sprint ou votre prochaine cérémonie, vérifiez : **la bonne équipe, la bonne période, les cérémonies attendues, les réunions complémentaires, les membres absents et le fuseau horaire d'affichage**.

Vous obtenez ainsi un calendrier qui aide réellement à décider **quand se réunir, avec qui et dans quelles conditions**, au lieu d'être simplement une liste de dates.
