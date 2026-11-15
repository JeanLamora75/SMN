# Registres : gardez la mémoire de la vie de l'équipe

Un obstacle résolu, un risque anticipé, une décision prise en rétrospective : ces événements racontent l'histoire de votre équipe. Avec les registres, SMN vous aide à **suivre les sujets importants, conserver leur évolution et retrouver leur contexte** au moment d'un bilan ou d'un rapport.

> **Le conseil de Camille :** ne transformez pas le registre en simple liste de problèmes. Pour chaque sujet important, consignez ce qui s'est passé, ce qui a été décidé, qui doit agir et ce qui a changé depuis.

## 1. À quoi servent réellement les registres ?

Les registres jouent trois rôles complémentaires :

- **Piloter au quotidien** : identifier les risques, lever les obstacles, suivre les dépendances et les actions.
- **Historiser la vie de l'équipe** : retrouver les dates, les changements de statut, les commentaires, les décisions et les événements liés.
- **Préparer les bilans et rapports** : disposer d'informations structurées sur les risques, obstacles, dépendances, décisions, actions et faits marquants.

**Exemple concret :** une dépendance externe retarde une Story. Vous créez la dépendance, signalez le risque associé, ajoutez une décision sur le plan de contournement, puis une action à suivre. Quelques semaines plus tard, vous pouvez expliquer non seulement le problème rencontré, mais aussi **comment l'équipe l'a traité**.

## 2. Retrouvez les bonnes informations

1. Ouvrez [Registres](/app/admin/registries) et vérifiez l'équipe affichée.
2. Choisissez **Tous**, **Risques**, **Obstacles** ou **Dépendances** selon votre besoin.
3. Utilisez la **recherche**, les **statuts**, le **cycle**, le **responsable** et le **tri**, lorsque ces options sont proposées.
4. Consultez la vue **Liste** ou **Cartes**, puis ouvrez l'élément qui vous intéresse.
5. Vérifiez sa date, son état et les éléments associés avant de prendre une décision.

La liste principale des risques, obstacles et dépendances affiche les sujets de suivi les plus fréquents. Les **décisions**, **actions** et **faits marquants** existent aussi dans SMN, notamment au sein des fiches et de leurs journaux. Il ne faut pas s'attendre à voir six onglets principaux.

> **Bon réflexe :** avant une rétrospective ou une revue, filtrez les éléments du cycle puis examinez également les sujets résolus. Un obstacle levé fait partie du bilan autant qu'un obstacle encore ouvert.

## 3. Choisissez le bon type d'élément

### Risque : ce qui pourrait se produire

Un **risque** décrit une menace ou une situation incertaine. Son état peut être **Ouvert** ou **Résolu**. Sa fiche permet d'évaluer la probabilité, l'impact et la stratégie de traitement ROAM.

**Exemple :** « L'environnement de recette pourrait ne pas être disponible à temps. »

### Obstacle : ce qui bloque déjà

Un **obstacle** est une difficulté réelle, rencontrée par l'équipe. Ses états sont **Ouvert**, **En cours**, **Résolu** ou **Abandonné**.

**Exemple :** « L'accès à l'environnement de recette est actuellement indisponible. »

### Dépendance : ce qui nécessite une coordination

Une **dépendance** décrit ce qu'une équipe attend d'un contributeur interne ou externe. Identifiez le **demandeur**, le **contributeur**, l'éventuel caractère **à risque** et le statut (**Ouverte**, **En cours**, **Satisfaite**, **Annulée**).

### Décision : ce qui a été arbitré

Une **décision** garde la trace d'un choix et de sa justification éventuelle. Elle peut remplacer une décision antérieure. Ses statuts sont **Active**, **Remplacée** ou **Annulée**.

### Action : ce qui doit être fait

Une **action** donne une suite concrète à un risque, un obstacle ou une décision. Ses statuts sont **À faire**, **En cours**, **Terminée** ou **Annulée**.

### Fait marquant : ce qui mérite d'être retenu

Un **fait marquant** conserve un événement important, même s'il ne demande pas d'action. Son statut est **Enregistré**. Il peut enrichir le bilan du sprint ou de la période.

## 4. Créez une fiche utile à toute l'équipe

1. Cliquez sur **Créer** si votre compte dispose des droits nécessaires.
2. Sélectionnez le **type** proposé par l'interface.
3. Renseignez un **titre précis**, une **date** et le **statut**.
4. Complétez la **description**, l'échéance ou le responsable lorsque ces champs sont disponibles.
5. Renseignez les champs spécifiques au type : évaluation d'un risque, parties d'une dépendance ou justification d'une décision.
6. Enregistrez puis ouvrez la fiche pour contrôler le résultat.

**Préférez un titre orienté situation.** « API de paiement indisponible depuis mardi » est plus utile que « Problème API ». Dans la description, distinguez le constat, les conséquences et la prochaine étape.

Les champs disponibles et les droits de création peuvent varier selon le contexte, notamment lorsqu'un élément est créé depuis le journal d'un autre.

## 5. Comment SMN calcule-t-il la criticité d'un risque ?

Dans une fiche **Risque**, ouvrez la section d'évaluation. SMN propose une matrice à deux dimensions :

- **Probabilité** : faible = 1, moyenne = 2, élevée = 3.
- **Impact** : faible = 1, moyen = 2, élevé = 3.

**Score de criticité = Probabilité × Impact.** Le résultat est calculé automatiquement à partir des deux niveaux choisis.

### Interpréter le score

- **1 à 2 — Criticité faible** : surveiller l'évolution du risque.
- **3 à 4 — Criticité moyenne** : suivre activement les mesures de prévention ou d'atténuation.
- **6 à 9 — Criticité élevée** : porter le risque à l'attention des personnes concernées et préciser une réponse adaptée.

**Exemple :** probabilité **élevée (3)** et impact **moyen (2)** donnent un **score de 6**, donc une **criticité élevée**. À l'inverse, probabilité faible (1) et impact moyen (2) donnent un score de 2, donc faible.

> **Attention :** ce score est une aide à la priorisation, pas une prédiction. Il ne remplace pas le jugement de l'équipe. Si la probabilité ou l'impact n'est pas évalué, SMN affiche une criticité **non évaluée** plutôt qu'un score inventé.

### Définir la réponse avec ROAM

La classification **ROAM** permet de préciser le traitement choisi :

- **Resolved — Résolu** : le risque n'est plus à traiter comme une menace ouverte.
- **Owned — Pris en charge** : une personne ou une équipe suit le risque.
- **Accepted — Accepté** : l'équipe connaît le risque et accepte de le supporter.
- **Mitigated — Atténué** : des mesures réduisent sa probabilité ou son impact.

**Criticité et ROAM sont complémentaires** : l'une aide à apprécier l'exposition, l'autre à exprimer la réponse retenue. Elles ne remplacent pas le statut de la fiche.

## 6. Reliez les éléments entre eux pour raconter une histoire cohérente

Un risque peut conduire à une décision, une décision à une action et une dépendance à un obstacle. Plutôt que de répéter le contexte dans plusieurs fiches, SMN permet de **créer des relations** entre les éléments.

1. Ouvrez une fiche, puis l'onglet **Relations**.
2. Cliquez sur **Associer un élément**, lorsque votre rôle permet la modification.
3. Recherchez la fiche à relier et sélectionnez-la.
4. Vérifiez son titre et son type, puis confirmez l'association.
5. Retrouvez la relation dans la fiche et ouvrez l'élément lié pour parcourir le contexte.

La fiche présente les **relations entrantes ou sortantes** selon les cas. Les associations ne signifient pas que les statuts ou les calculs d'une fiche changent automatiquement à chaque modification de l'autre.

**Exemple pédagogique :** un risque de retard de livraison est relié à une dépendance fournisseur ; une décision documente le contournement et une action suit sa réalisation. Vous pouvez ainsi retrouver le cheminement d'un sujet sans reconstruire son histoire de mémoire.

Selon le type d'élément, SMN permet aussi de rattacher des **cycles** ou, pour certaines actions, des **objectifs**. Utilisez ces liens lorsque cela aide réellement à comprendre l'impact sur le travail de l'équipe.

## 7. Historisez les discussions et les évolutions

Les fiches distinguent plusieurs espaces :

**Journal** — Consignez le contexte, les commentaires et les événements liés. Vous pouvez notamment retrouver ou créer des **actions** et **décisions** associées, selon les droits et les options disponibles.

**Historique** — Retrouvez la chronologie des modifications, avec les dates, les auteurs, les révisions et les champs modifiés. L'interface peut afficher les valeurs **avant** et **après** un changement. L'accès à cet historique détaillé est réservé aux comptes autorisés.

**Relations** — Explorez les liens entre le sujet et d'autres fiches ; ce n'est pas un journal de modifications.

> **Conseil d'animation :** après un Daily, une revue ou une rétrospective, prenez quelques instants pour mettre à jour les sujets concernés. Une courte note datée, une décision explicite et un changement de statut rendent le suivi beaucoup plus utile.

**Historiser ne veut pas dire figer définitivement.** Les fiches courantes peuvent encore évoluer ; les rapports déjà générés ne se réécrivent pas automatiquement à chaque changement.

## 8. Comment les registres alimentent-ils les rapports ?

Les registres sont une source métier pour les bilans et les documents destinés aux parties prenantes. Les modèles de rapports **Word ou PowerPoint** compatibles peuvent reprendre des données relatives aux **risques, obstacles, dépendances, décisions, actions ou faits marquants**.

1. Mettez à jour vos fiches et vérifiez leur rattachement au bon contexte d'équipe ou de cycle.
2. Ouvrez [Rapports](/app/reports), puis l'onglet **Modèles**.
3. Choisissez un modèle qui utilise des données de registre.
4. Vérifiez les tags et les options du modèle, notamment dans l'onglet **Tags**.
5. Sélectionnez le cycle adapté, générez le document, puis contrôlez les éléments réellement repris.

**Important :** tous les modèles n'incluent pas nécessairement des registres. Les informations disponibles dépendent des tags utilisés, du périmètre du rapport et de l'état des données.

> **Bonne pratique :** avant une Sprint Review, vérifiez les risques ouverts, les obstacles levés, les dépendances en attente et les décisions prises. Vous obtiendrez un bilan qui explique les événements et les réactions de l'équipe, plutôt qu'une simple liste de chiffres.

## 9. En cas de problème

- **Un élément est introuvable** : vérifiez l'équipe, le cycle, la catégorie, les filtres et l'affichage des sujets résolus.
- **Le score de risque paraît incorrect** : vérifiez les deux valeurs de la matrice. Le score correspond à leur produit ; une valeur manquante empêche l'évaluation.
- **Une relation manque** : ouvrez l'onglet Relations et vérifiez le titre de la fiche cible ainsi que les droits.
- **Une modification est impossible** : contrôlez les autorisations, le contexte et les éventuels conflits de révision.
- **Un élément n'apparaît pas dans un rapport** : contrôlez le modèle Office, ses tags et le cycle sélectionné.
- **Une suppression est refusée** : examinez les éléments liés et les protections avant toute action. La suppression définitive ne remplace pas une résolution métier.

## Votre point de contrôle

Pour chaque sujet important, vous devez pouvoir répondre à quatre questions : **que s'est-il passé ? quel était le niveau de risque ou de blocage ? qu'a décidé l'équipe ? quelles suites et quels éléments liés permettent de comprendre le résultat ?**

Si ces réponses se retrouvent dans SMN, les registres deviennent une véritable mémoire opérationnelle de l'équipe, réutilisable dans vos échanges et vos rapports.

**Suppression définitive :** seuls les comptes disposant des **droits de gestion** peuvent demander la suppression d'une fiche. SMN peut refuser l'opération si des données liées doivent être préservées ; une suppression n'est jamais une simple résolution du sujet.
