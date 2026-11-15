# Bien démarrer avec SMN : votre première équipe pas à pas

Vous venez de vous connecter à SMN. Avant de suivre vos sprints ou vos périodes Kanban, il faut préparer quelques informations. Ce parcours vous explique **quoi faire**, **pourquoi le faire**, **ce que SMN en fera** et **comment vérifier le résultat**.

**Commencez par regarder les équipes et membres déjà présents.** Une installation existante ou restaurée peut contenir des données à personnaliser ; une installation native v33 sur base vierge ne crée pas d'équipe ni de membres automatiquement. Le parcours s'adapte à ces deux situations. Vous pouvez revenir sur chaque étape. Les actions réservées à l'administrateur doivent être réalisées par un compte autorisé ; si vous êtes simple utilisateur, consultez les étapes qui vous sont accessibles et demandez à l'administrateur de préparer les autres.

Le Centre d'aide présente aussi une **checklist de première configuration** : utilisez ses boutons **Lire le guide** pour approfondir chaque sujet et **Ouvrir l'écran** pour effectuer l'action. Le statut **Terminé** est déclaré par vous, jamais détecté automatiquement par SMN.

## Étape 1 — Vérifier les paramètres généraux

**Pourquoi ?** Commencer avec une langue, une présentation et un pays de référence cohérents évite de devoir réinterpréter les réglages par la suite.

**À faire (administrateur) :**

- Depuis **Paramètres > Général**, vérifiez le mode Agile et le produit affichés. Ils sont en lecture seule dans cet écran : ne cherchez pas à les modifier ici.
- Dans **Général**, choisissez si nécessaire le pays de référence proposé.
- Dans **Langue**, sélectionnez **Français** ou **Anglais**.
- Dans **Apparence**, choisissez le thème clair ou sombre et la palette qui vous convient.
- Cliquez sur **Enregistrer** si une valeur a changé. Contrôlez le message de confirmation et les valeurs affichées après l'opération.

**Ce que SMN en fait :** il conserve vos paramètres généraux, applique les préférences d'affichage et utilise les réglages de référence là où les écrans concernés le prévoient. Le mode Agile affiché ici ne se change pas par ce formulaire.

**À vérifier avant de continuer :** la langue, le thème et le pays choisis sont bien affichés après enregistrement.

## Étape 2 — Vérifier et personnaliser votre équipe

**Pourquoi ?** SMN rattache les cycles, les membres et les données métier à une équipe. Il faut d'abord **examiner ce qui existe**, puis adapter l'équipe à votre contexte réel : recréer une équipe déjà présente produirait un doublon.

**À faire (administrateur) :**

- Ouvrez **Paramètres > Équipes** et examinez la liste. Utilisez les filtres si nécessaire pour afficher les équipes actives ou archivées.
- **Si une équipe est déjà présente**, sélectionnez-la pour ouvrir son formulaire d'édition. Modifiez son **nom**, son **produit**, sa **vision** et son **objectif** pour qu'ils correspondent à votre activité.
- Vérifiez son mode **Scrum ou Kanban**, qui détermine les cycles utilisables. Pour une équipe existante, SMN peut interdire de changer ce mode ; respectez cette restriction.
- **Seulement si aucune équipe utilisable n'existe**, utilisez **Créer une équipe** dans l'en-tête, puis complétez ces mêmes informations et sélectionnez le mode Agile approprié.
- Enregistrez et vérifiez l'équipe dans la liste. Sélectionnez-la dans les autres écrans lorsqu'un choix d'équipe est demandé.

**Ce que SMN en fait :** il utilise l'équipe comme contexte de rattachement des membres, des cycles et des données. Le mode Agile conditionne les fonctionnalités Scrum ou Kanban ; les informations du produit sont utilisées dans les vues et rapports qui les prennent en charge.

**À vérifier :** vous disposez de la **bonne équipe**, personnalisée et sans doublon, avec le mode Agile et les informations produit attendus.

## Étape 3 — Vérifier les membres existants et compléter les affectations

**Pourquoi ?** Les membres, leurs rôles et leurs dates d'affectation déterminent la composition de l'équipe à une période donnée. Un profil déjà présent doit être vérifié et personnalisé plutôt que recréé.

**À faire (administrateur) :**

- Ouvrez **Équipe / Membres** dans le contexte de l'équipe choisie. Examinez **d'abord les membres déjà présents**, actifs et inactifs, dans les vues **Cartes** ou **Liste**.
- Si votre installation contient des personnes ou des profils d'exemple, ouvrez leurs fiches et adaptez les informations aux membres réels de l'équipe. **Ne supposez pas que le nombre de membres est toujours identique d'une installation à l'autre.**
- Vérifiez le nom, la **fonction**, la **localisation** (ville et pays), les **rôles** et les **affectations** de chaque membre.
- Contrôlez les dates de début et de fin d'affectation. Un membre inactif ou une ancienne affectation ne doit pas être confondu avec un profil supprimé.
- Utilisez **Ajouter un membre** **uniquement si une personne manque** ; renseignez son nom, puis complétez sa fiche et ses affectations.
- Revenez à la liste et vérifiez les sections actives/inactives ainsi que les filtres.

**Ce que SMN en fait :** les profils et périodes d'affectation alimentent les informations d'équipe, les calendriers et la lecture des capacités lorsque ces fonctionnalités sont disponibles.

**À vérifier :** les profils existants ont été contrôlés ou personnalisés, les éventuels membres manquants ajoutés sans doublon et les périodes d'affectation vérifiées.

## Étape 4 — Vérifier les jours travaillés, le calendrier et les absences

**Pourquoi ?** Les jours ouvrés, les périodes d'affectation et les absences conditionnent l'interprétation de la disponibilité d'une équipe. Une date ou un pays mal renseigné peut rendre les informations de capacité trompeuses.

**À faire :**

- Si votre installation contient une équipe Scrum et si vous êtes administrateur, examinez les **paramètres des jours travaillés** ; l'écran propose les plages de travail et les réglages associés lorsqu'ils sont applicables.
- Consultez le [Calendrier d'équipe](/app/team-calendar) avec l'équipe appropriée.
- Contrôlez les jours affichés, les absences déjà saisies et les informations du cycle lorsqu'il existe.
- Comparez les informations individuelles des membres (dates d'affectation et localisation) avec ce que montre le calendrier.
- S'il manque encore un cycle, vérifiez d'abord les réglages calendaires disponibles puis revenez ici après l'étape suivante : certains affichages dépendent de la période sélectionnée.

**Ce que SMN en fait :** il présente les informations calendaires et les indisponibilités dans les vues concernées ; les calculs de disponibilité ou de capacité doivent toujours être interprétés avec la composition et les règles de travail de l'équipe.

**À vérifier :** les jours de travail applicables et les informations déjà connues sont cohérents. La simple ouverture du calendrier ne valide pas automatiquement la capacité.

## Étape 5 — Préparer le premier cycle Scrum ou Kanban

**Pourquoi ?** Le cycle est le cadre temporel dans lequel vous pourrez consulter les informations de travail et rapprocher les indicateurs. La procédure dépend du mode de l'équipe.

**À faire :** suivez uniquement la branche correspondant au mode de votre équipe.

**Pour une équipe Scrum :**

- Ouvrez **Sprints**, puis sélectionnez l'équipe concernée.
- Examinez les sprints déjà présents. Si vous êtes administrateur, utilisez l'action de **génération** lorsqu'elle est proposée.
- Vérifiez la cadence, les dates et les statuts avant de confirmer.
- Retrouvez le sprint dans la liste et ouvrez sa fiche pour contrôler sa période.

**Pour une équipe Kanban :**

- Ouvrez **Périodes Kanban** dans le contexte de votre équipe.
- Examinez les périodes existantes. Si vous êtes administrateur, choisissez une **date de début** dans le formulaire de création.
- Contrôlez la période calculée (début, fin et fuseau horaire) et son nom, puis validez si elle correspond au résultat attendu.
- Vérifiez le message de création ; en cas de chevauchement, corrigez les dates au lieu de forcer l'opération.

**Ce que SMN en fait :** il associe les informations de suivi aux sprints en Scrum ou aux périodes en Kanban. Les écrans et certaines étapes de la checklist s'adaptent au mode choisi.

**À vérifier :** au moins un cycle adapté à votre équipe est consultable et ses dates sont correctes. Revenez ensuite au calendrier pour revoir les informations dépendant du cycle.

## Étape 6 — Préparer les premières données de tickets

**Pourquoi ?** Une équipe et un cycle ne suffisent pas à produire un suivi significatif : les tickets donnent une photographie de l'activité et peuvent être rapprochés de plusieurs dates.

**À faire :**

- Ouvrez [Tickets](/app/tickets) avec l'équipe et le cycle choisis.
- Si vous disposez déjà d'un fichier CSV et des droits nécessaires, préparez ses colonnes obligatoires : `id,type,resume,priority,status,sp`.
- Utilisez **Importer CSV**, choisissez le fichier et sa date de référence, puis lancez la validation.
- Corrigez les erreurs signalées avant d'importer. Si une photographie existe déjà pour la même date, vérifiez attentivement la proposition de remplacement.
- Consultez le résultat dans la liste. La comparaison devient utile lorsque plusieurs photographies compatibles existent.

**Ce que SMN en fait :** il conserve les photographies de tickets importées et permet leur consultation et, selon les données disponibles, leur comparaison. Les informations de tickets peuvent ensuite alimenter les vues et indicateurs qui les utilisent.

**À vérifier :** la photographie voulue apparaît à la bonne date, avec les tickets attendus. Si vous n'avez pas encore de CSV, cette étape peut rester **À faire** : n'inventez pas de données pour la terminer.

## Étape 7 — Découvrir les indicateurs et vos premiers rapports

**Pourquoi ?** Les tableaux de bord et les rapports prennent de la valeur quand l'équipe, ses cycles et ses premières données sont renseignés. Il faut d'abord vérifier leurs sources.

**À faire :**

- Consultez les indicateurs accessibles à votre équipe. Vérifiez le cycle sélectionné et distinguez une valeur absente d'un véritable zéro.
- Ouvrez [Rapports](/app/reports), puis parcourez les onglets **Rapports**, **Modèles**, **Tags** et **Archives**.
- Pour créer un rapport depuis SMN, utilisez **Nouveau rapport** si votre compte administrateur et les données disponibles le permettent : choisissez cycle, modèle, titre et langue.
- Pour produire un document Office, sélectionnez un modèle Word ou PowerPoint ; vérifiez les sources nécessaires, la langue, les éventuels styles et tags, puis choisissez **Générer** (téléchargement) ou **Enregistrer**.
- Ouvrez le résultat pour vérifier ce qui a réellement été renseigné ; une donnée manquante n'est pas automatiquement égale à zéro.

**Ce que SMN en fait :** il exploite les données disponibles selon les indicateurs et modèles configurés, puis produit ou conserve des documents suivant l'action choisie.

**À vérifier :** vous savez retrouver un indicateur ou un rapport et identifier les données qui manquent encore pour un premier reporting utile.

## Étape 8 — Protéger votre configuration avec une sauvegarde

**Pourquoi ?** Une fois les premières données renseignées, une sauvegarde contrôlée contribue à préserver votre travail, notamment si vous devez transférer SMN vers un autre PC.

**À faire (administrateur autorisé) :**

- Ouvrez **Paramètres > Maintenance**, puis l'onglet **Sauvegardes** s'il est proposé.
- Consultez l'inventaire et les contrôles des archives.
- Si la création depuis l'interface est autorisée, effectuez une sauvegarde puis vérifiez son résultat et son statut.
- Ne confondez pas **sauvegarde présente** et **restauration autorisée** : cette dernière reste soumise aux protections affichées dans SMN.

**Ce que SMN en fait :** les fonctions de maintenance gèrent les archives et leurs vérifications selon les conditions de sécurité de l'installation. Les coches de ce parcours, conservées dans le navigateur, ne font pas partie de la sauvegarde.

**À vérifier :** vous savez où contrôler une archive et avez confirmé son état sans déclencher de restauration inutile.

## Votre première configuration est prête lorsque…

Votre équipe existe, ses membres et affectations sont cohérents, vous avez un calendrier et un cycle vérifiés, et vous savez où renseigner des tickets, lire des indicateurs et préparer vos rapports. La sauvegarde vient protéger ce premier ensemble.

Dans le Centre d'aide, reprenez chaque étape de la **checklist**. Marquez-la **En cours** ou **Terminé (déclaré)** après votre propre contrôle. Les étapes qui ne s'appliquent pas à votre rôle sont filtrées ; aucune coche n'effectue une configuration métier. La progression reste uniquement dans le navigateur de cette installation.
