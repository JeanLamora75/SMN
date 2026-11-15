# Préparer et générer vos sprints Scrum

Vous préparez votre prochain sprint ou plusieurs sprints à venir ? SMN vous aide à construire un calendrier cohérent, sans ressaisir toutes les dates une par une. L'essentiel est de **choisir le bon point de départ, vérifier la proposition et confirmer seulement lorsque tout est correct**.

> **Le conseil de Camille :** avant toute création, consultez les sprints déjà présents. Si votre installation contient une équipe et des sprints d'exemple, vous n'avez peut-être rien à générer pour commencer à découvrir SMN.

## 1. Retrouvez les sprints de votre équipe

1. Ouvrez [Sprints](/app/admin/sprints) depuis la navigation.
2. Vérifiez l'équipe affichée en haut de l'écran : c'est elle qui détermine les sprints consultés.
3. Parcourez la liste. Utilisez les onglets **Tous**, **Actifs**, **Planifiés**, **Terminés** ou **Clôturés** pour retrouver une période selon son état.
4. Si la liste est longue, utilisez la **recherche** et le **tri**. Cliquez sur le nom d'un sprint pour ouvrir sa fiche.

**Pourquoi commencer ici ?** Générer une nouvelle série sans examiner l'existant peut conduire à des périodes qui se chevauchent ou à des sprints inutiles. Si vous retrouvez le sprint recherché, ouvrez-le plutôt que d'en créer un autre.

## Avant de générer : vérifiez la cadence de votre équipe

**D'où viennent les dates ?** L'assistant utilise la configuration **Paramètres → Cadence de l'équipe → Sprint**. Il ne vous demande donc pas de ressaisir la durée, les jours et les horaires de chaque sprint. La génération reprend les paramètres de l'équipe Scrum sélectionnée : **durée en semaines, jour et heure de début, jour et heure de fin et fuseau horaire**.

### Et si vous n'avez jamais configuré la cadence ?

SMN peut créer automatiquement la configuration manquante avec les **valeurs par défaut** suivantes :

- **Durée :** 2 semaines.
- **Début :** lundi à 09 h 00.
- **Fin :** vendredi à 18 h 00, lors de la deuxième semaine.
- **Fuseau horaire :** Europe/Paris.

> **Bon réflexe avant une génération en série :** ouvrez les Paramètres de cadence de l'équipe et vérifiez ces valeurs. Les valeurs par défaut permettent de commencer, mais elles ne sont pas nécessairement celles de votre organisation.

**Exemple concret :** avec cette cadence par défaut, une date de départ choisie un mercredi sera alignée sur le **lundi suivant**. Le premier sprint se terminera le vendredi de la deuxième semaine, à 18 h. Si vous demandez trois sprints, SMN calcule les périodes suivantes à partir de cette même cadence.

Si la cadence a déjà été personnalisée, **ce sont vos valeurs enregistrées qui sont utilisées**, pas ces valeurs par défaut. L'aperçu vous permet de contrôler les résultats avant toute création. En cas de problème technique empêchant de lire ou de préparer les paramètres, l'aperçu signale une erreur et vous ne devez pas confirmer la génération.

## 2. Ouvrez l'assistant de génération

Si vous disposez des droits d'administration, cliquez sur **Générer** dans l'en-tête de la liste. L'assistant vous accompagne en trois étapes : **Configurer**, **Prévisualiser**, puis **Confirmer**.

### Les champs à renseigner

**Nombre de sprints** — Choisissez combien de sprints créer en une seule opération, entre **1 et 6**. Pour découvrir le fonctionnement ou préparer seulement la prochaine itération, commencez par **1**. Pour organiser plusieurs itérations à l'avance, choisissez le nombre qui correspond à votre horizon de planification.

**Date de début** — Indiquez le premier jour du premier sprint à générer. SMN peut proposer une date : prenez le temps de la vérifier avant de continuer. Cette date sert de point de départ ; les autres bornes sont calculées à partir de la cadence de sprint configurée.

**Cadence** — La durée, les jours de début et de fin, les horaires et le fuseau horaire sont utilisés par SMN pour calculer les périodes. Ces informations sont issues de la configuration : elles ne sont pas toutes à saisir dans cet assistant. Si les dates calculées ne correspondent pas à votre organisation, vérifiez d'abord les paramètres de cadence au lieu de confirmer une mauvaise série.

> **Exemple :** vous préparez trois sprints successifs. Indiquez **3** dans « Nombre de sprints » et la date de départ souhaitée. SMN propose ensuite trois périodes à contrôler. Ne considérez pas les dates de cet exemple comme un calendrier imposé : elles dépendent de votre cadence réelle.

Cliquez sur **Afficher l'aperçu** pour passer à l'étape suivante. Cette action prépare une proposition ; elle ne confirme pas encore la création.

## 3. Comprenez l'aperçu avant de valider

L'aperçu est votre filet de sécurité. Il présente chaque sprint envisagé et vous permet de vérifier les informations importantes.

**Nom du sprint** — SMN propose un nom que vous pouvez modifier, dans la limite de **160 caractères**. Préférez une convention simple et constante, par exemple un numéro de sprint et une indication de produit ou de période. Un nom clair facilitera les recherches et les rapports.

**Dates de début et de fin** — Les périodes calculées tiennent compte de la cadence et du **fuseau horaire** affiché. Contrôlez particulièrement la première date, la dernière date et l'enchaînement entre les sprints.

**Conflits** — La colonne correspondante signale les chevauchements détectés avec des périodes existantes ou d'autres périodes proposées. Si une alerte apparaît, revenez à la configuration et modifiez votre proposition plutôt que de forcer la création.

**Modèles de cérémonies** — Si des modèles actifs sont disponibles, l'assistant les mentionne. Leur présence est utile pour comprendre les cérémonies susceptibles d'accompagner les sprints générés.

**Cérémonies historiques** — Pour une génération concernant des dates passées, une option spécifique peut apparaître. Lisez l'avertissement affiché avant de choisir : cette option concerne le traitement des cérémonies historiques, et non la durée des sprints.

### Vous modifiez un nom ou une option ?

Après un changement, cliquez sur **Actualiser l'aperçu**. L'assistant exige une proposition à jour : il ne suffit pas de modifier le texte puis de passer immédiatement à la confirmation.

## 4. Confirmez la création

1. Vérifiez une dernière fois le **nombre de sprints**, leurs **noms**, leurs **dates** et l'absence de conflits bloquants.
2. Cliquez sur **Continuer** pour accéder à la confirmation.
3. Relisez la liste des sprints à créer et les éventuels avertissements.
4. Cliquez sur **Créer** uniquement lorsque la proposition vous convient.

SMN revient ensuite à la liste des sprints. Retrouvez les nouveaux éléments et ouvrez-en un pour vérifier les informations enregistrées.

## 5. Si le résultat n'est pas celui attendu

- **Je ne vois pas « Générer » :** la génération est réservée aux comptes disposant des droits d'administration.
- **Les dates ne me conviennent pas :** vérifiez la date initiale et la cadence configurée ; ne modifiez pas un nom pour corriger une période.
- **Un conflit est signalé :** recherchez les sprints existants sur les mêmes dates et ajustez la proposition.
- **J'ai renommé un sprint dans l'aperçu :** utilisez **Actualiser l'aperçu** avant de continuer.
- **L'écran Sprints est inaccessible :** assurez-vous d'être dans une installation en mode Scrum et d'avoir accès au module. Ce guide ne concerne pas les périodes Kanban.

## Votre contrôle final

Vous devez pouvoir répondre à trois questions : **quels sprints existent désormais ? quelles dates couvrent-ils ? et sont-ils rattachés au bon contexte d'équipe ?** Si ces réponses sont claires, votre calendrier de sprints est prêt pour la suite du pilotage.

> **À retenir :** l'aide vous guide, mais ne crée aucun sprint à votre place. La création se fait uniquement dans l'assistant de SMN, après votre confirmation.
