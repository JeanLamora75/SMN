# Page de sprint : suivez toute la vie de votre sprint

La **fiche du sprint** est votre dossier de pilotage : elle rassemble le contexte, les objectifs, les cérémonies, les disponibilités, les indicateurs et les événements qui racontent ce qui s'est passé. Contrairement à la liste des sprints, qui sert à **retrouver et préparer des cycles**, cette page permet de **travailler sur un sprint précis**, de comprendre ses résultats et de préparer son bilan.

> **Le conseil de Camille :** revenez régulièrement dans cette fiche, et pas uniquement lors de la clôture. Un objectif explicite, des réunions à jour et des registres renseignés vous évitent de devoir reconstituer les événements en fin de sprint.

## 1. Commencez par l'en-tête : êtes-vous sur le bon sprint ?

L'en-tête bleu présente le **nom du sprint**, son **équipe et son produit**, ses **dates** et son **fuseau horaire**. Vérifiez ces informations avant toute modification : elles déterminent le contexte de toutes les rubriques.

Selon vos droits et l'état du sprint, des actions permettent de **renommer le sprint** ou de **corriger ses dates**. Une modification des dates peut avoir des conséquences sur les cérémonies, la planification et les données historiques : prenez le temps de contrôler les autres onglets.

### À quoi servent les actions en haut à droite ?

- **Générer un brief IA** : ouvre le parcours de préparation d'un brief lié à ce sprint. Vérifiez toujours les informations préparées avant de les réutiliser.
- **Générer un rapport** : ouvre le parcours de rapport pour le sprint ; le contenu dépend des données disponibles et du modèle utilisé.
- **Statut du sprint** : le bouton d'état, par exemple **Terminé**, donne accès aux actions disponibles selon l'avancement et vos permissions.

> **Point de vigilance :** **Terminé** et **Clôturé** ne doivent pas être confondus. Certaines données restent corrigeables sur un sprint terminé, tandis que la clôture déclenche des restrictions et peut figer des éléments utilisés pour les restitutions historiques.

## 2. Onglet Objectifs : donnez un sens au travail réalisé

Cet onglet sert à documenter **ce que l'équipe cherche à atteindre**, plutôt qu'à énumérer uniquement les tâches.

1. Ouvrez **Objectifs**.
2. Vérifiez les objectifs déjà enregistrés.
3. Si vous avez les droits nécessaires, utilisez **Ajouter un objectif** pour compléter le sprint.
4. Formulez un objectif compréhensible et vérifiable, lié à une valeur ou un résultat attendu.
5. Revenez-y à la fin du sprint pour confronter l'intention aux résultats.

**Exemple :** « Permettre aux utilisateurs de consulter leurs incidents sans assistance » est plus utile qu'un titre technique comme « Développer l'écran incidents ».

Si le sprint est **Terminé**, vous pouvez voir l'action **Renseigner un bilan historique partiel**, lorsque votre compte y est autorisé. Elle sert à compléter un bilan incomplet ; ce n'est pas un substitut à la saisie régulière des objectifs.

> **Conseil :** définissez l'objectif tôt. Un objectif créé après la fin du sprint ne remplace pas la discussion collective du Sprint Planning.

## 3. Onglet Cérémonies : retrouvez les réunions du sprint

Cet onglet permet de consulter les cérémonies rattachées au sprint, telles que **Sprint Planning**, **Daily Scrum**, **Sprint Review** et **Rétrospective**, selon les modèles et occurrences réellement créés.

**D'où viennent-elles ?** Elles peuvent être **générées au moment de la création du sprint** à partir des modèles définis dans les Paramètres. La fiche montre les occurrences enregistrées : changer ensuite un modèle ne réécrit pas nécessairement les réunions passées.

Vous pouvez, selon vos permissions et l'état du sprint :

1. Consulter la liste et les horaires des cérémonies.
2. Ouvrir une cérémonie pour examiner ses détails.
3. Corriger les données modifiables : horaires prévus ou réels, statut et éléments issus de la réunion.
4. Ajouter une cérémonie ou une réunion historique lorsque l'action correspondante est proposée.
5. Vérifier le résultat dans le [Calendrier](/app/team-calendar).

> **Conseil :** après une réunion, renseignez son résultat et les décisions utiles. Un calendrier rempli ne suffit pas à garder la mémoire des échanges.

## 4. Onglet Capacité : comprenez la disponibilité réelle de l'équipe

La capacité n'est pas simplement **le nombre de personnes multiplié par les jours du sprint**. SMN tient compte des données applicables aux dates du cycle : **affectations, rôles Agile, horaires, absences et calendriers**.

L'onglet affiche, lorsque les données et les permissions le permettent :

- La **présence totale** en jours-homme (J/H).
- La **capacité de développement** et les capacités associées aux rôles **Product Owner** et **Scrum Master**.
- Le **nombre de membres** concernés.
- Un tableau détaillé par membre : fonction, rôles, contribution, présence, **absences** et capacité de développement.
- Des alertes lorsque les données nécessaires au calcul sont **manquantes ou ambiguës**.

**Exemple :** si une personne rejoint l'équipe au milieu du sprint et qu'une autre est absente deux demi-journées, le total doit tenir compte de ces situations.

Pour diagnostiquer un chiffre inattendu, utilisez **Gérer les membres** et vérifiez les dates d'affectation, les horaires, la localisation et les absences dans les fiches Membres.

> **Important :** une valeur indisponible **n'est pas zéro**. Pour un sprint clôturé, certaines valeurs peuvent provenir d'une photographie historique, tandis qu'un cycle encore ouvert peut présenter une projection.

## 5. Onglet Indicateurs : reliez les chiffres au sprint

Les indicateurs vous aident à suivre les résultats et à préparer vos échanges avec l'équipe.

- **Indicateurs manuels** : des mesures renseignées pour le sprint par un utilisateur autorisé, éventuellement à partir des KPI du module Tickets / CSV.
- **Indicateurs calculés** : des résultats issus de formules définies dans **Paramètres → Indicateurs**, pouvant dépendre d'autres valeurs ou de l'historique.
- **Présentation** : les indicateurs visibles dans le détail du cycle dépendent des **sélections de l'équipe** et des **préférences d'affichage**.

Pour les utilisateurs autorisés, l'onglet propose une **saisie des indicateurs** et leur **restitution** dans le contexte du sprint.

> **Exemple :** vous renseignez les Story Points terminés à partir d'une photographie CSV ; une formule peut ensuite calculer un ratio en fonction des valeurs disponibles. Vérifiez toujours les sources et les unités avant de présenter le résultat.

Si une valeur n'apparaît pas, contrôlez d'abord la définition, la sélection pour l'équipe, la présence des données et les droits de consultation.

## 6. Onglet Registres : gardez la mémoire des événements

Les registres donnent du contexte aux chiffres. Vous y retrouvez les **risques, obstacles, dépendances** et, selon le contenu disponible, les **décisions, actions et faits marquants** rattachés au sprint.

1. Sélectionnez **Registres** et vérifiez le périmètre affiché.
2. Utilisez les filtres de type disponibles pour retrouver un sujet.
3. Ouvrez un élément et examinez son statut et ses informations.
4. Si votre rôle le permet et que le sprint n'est pas clôturé, mettez à jour ou ajoutez les éléments utiles.
5. Reliez les sujets concernés dans le module [Registres](/app/admin/registries) pour expliquer les conséquences et décisions.

**Exemple :** une dépendance fournisseur retarde la livraison ; l'équipe enregistre un risque, choisit un contournement et suit l'action associée. Ces informations deviennent utiles lors du bilan et dans les rapports compatibles.

> **Conseil :** conservez aussi les obstacles **résolus**. Ils racontent ce que l'équipe a surmonté pendant le sprint.

## 7. Onglet Tendances : replacez le sprint dans une série

Une mesure isolée est rarement suffisante. Cet onglet permet de consulter des **représentations d'indicateurs sur plusieurs sprints**, selon les indicateurs disponibles et les préférences définies pour les tendances.

- Vérifiez le **nom de l'indicateur** et son **unité**.
- Examinez la succession des cycles : un changement peut s'expliquer par la capacité, les absences ou le périmètre.
- Comparez uniquement des mesures dont les **définitions** sont restées cohérentes.
- Si aucune courbe n'apparaît, vérifiez les sélections d'indicateurs, les données historiques et les droits.

> **Conseil de Scrum Master :** une baisse sur un sprint n'est pas un diagnostic. Utilisez la tendance pour poser des questions, puis confrontez-la aux événements enregistrés dans les autres onglets.

## 8. Onglet Bilan : racontez ce qui s'est passé

L'onglet **Bilan** rassemble deux espaces distincts :

**Bilan manuel** — Votre synthèse rédigée : résultats, écarts, difficultés, apprentissages et suites à donner.

**Bilan IA** — Un espace pour conserver ou retravailler une synthèse issue d'un parcours IA. La fiche peut proposer une **édition manuelle** de ce contenu : sa présence ne signifie pas que l'IA a automatiquement généré le texte.

Lorsque votre rôle et le statut le permettent, cliquez sur l'icône de modification pour compléter chaque espace. SMN peut conserver des informations de **version, auteur et date**. Sur un sprint clôturé, la modification du bilan est restreinte et les données peuvent provenir de l'historique de clôture.

> **Structure de bilan conseillée :** « Objectif poursuivi → Résultats observés → Écarts → Décisions et actions pour la suite ». C'est plus exploitable qu'un simple « Sprint terminé ».

## 9. Préparez la clôture et les rapports

Avant d'utiliser **Générer un rapport** ou de clôturer le sprint, faites un contrôle transversal :

1. **Objectifs** : les intentions et les résultats sont-ils clairement formulés ?
2. **Cérémonies** : les réunions importantes et leurs résultats sont-ils à jour ?
3. **Capacité** : les affectations et absences ont-elles été prises en compte ?
4. **Indicateurs** : les valeurs et formules sont-elles vérifiées ?
5. **Registres** : les risques, obstacles, décisions et actions significatifs sont-ils documentés ?
6. **Tendances** : les comparaisons sont-elles cohérentes ?
7. **Bilan** : la synthèse distingue-t-elle les faits observés et les interprétations ?

Le module [Rapports](/app/reports) permet ensuite de réutiliser les données compatibles avec les tags du modèle Word ou PowerPoint choisi.

## 10. Si un onglet semble vide ou non modifiable

- **Aucun objectif** : il peut ne pas avoir encore été renseigné.
- **Aucune cérémonie** : vérifiez les modèles actifs lors de la génération et les occurrences enregistrées.
- **Capacité inconnue** : contrôlez les affectations, semaines de travail, rôles et absences.
- **Indicateur absent** : vérifiez sa sélection pour l'équipe et les préférences de l'écran.
- **Registre manquant** : examinez les filtres, le contexte et le rattachement au cycle.
- **Tendance indisponible** : cherchez les valeurs historiques et les indicateurs configurés.
- **Modification refusée** : vérifiez les permissions et si le sprint est déjà **Clôturé**.

## Votre point de contrôle

La fiche doit vous permettre de répondre à ces questions : **qu'espérions-nous atteindre ? qu'avons-nous réellement accompli ? avec quelle capacité ? quels événements et décisions expliquent les résultats ? que retenons-nous pour le prochain sprint ?**

Si vous trouvez les réponses dans les sept onglets, la fiche du sprint devient une mémoire de l'équipe et un support de pilotage, pas seulement un écran de consultation.
