# SMN — Registre des décisions fonctionnelles F-01 à F-123

> **Mise à jour : 18 octobre 2026** — BMAD / Mary (Analyst), consolidation du brainstorming.  
> **Source :** décisions exprimées et confirmées dans les échanges de cadrage SMN, et référentiel initial `docs/PROJECT-CONTEXT.md`.  
> **Statut :** ce registre synthétise les décisions utilisateur ; il ne vaut ni PRD finalisé ni choix d'architecture.  
> **Lecture détaillée :** [Cadrage fonctionnel consolidé](./CADRAGE-FONCTIONNEL.md).  
> **Gouvernance :** un élément « validé » signifie accepté fonctionnellement ; la conception, les règles de calcul exactes et le séquencement MVP restent à spécifier lorsque non tranchés.

## Registre chronologique

| ID | Décision consolidée | Statut / nuance |
| --- | --- | --- |
| F-01 | Application principalement utilisée et renseignée par le SM ou le RTE ; pas de saisie collaborative par les membres. | Validé |
| F-02 | Mode d'installation initialement Scrum/SAFe. | Remplacé par F-41 et F-49 : Scrum/Kanban/SAFe |
| F-03 | ART SAFe initialement composé d'équipes Scrum. | Étendu par F-49 et F-50 aux équipes Kanban |
| F-04 | Membres d'une équipe répartis entre plusieurs villes et pays. | Validé |
| F-05 | Gestion des équipes et de leurs membres. | Validé |
| F-06 | Calendrier et événements Agile pour les équipes. | Détaillé par F-43 à F-57 |
| F-07 | Daily automatiquement présumé tenu ; saisie des exceptions. | Détaillé par F-55/F-56 |
| F-08 | Métriques de Sprint à saisie minimale ; reprise manuelle possible des valeurs Jira. | Détaillé par F-14, F-16, F-19, F-64, F-72 |
| F-09 | Gestion des risques et des dépendances. | Détaillé par F-11 à F-13 et F-74 à F-90 |
| F-10 | Reporting exhaustif destiné aux parties prenantes. | Détaillé par F-15 et F-73, F-97 à F-109 |
| F-11 | Obstacles identifiés de façon unique, pouvant traverser plusieurs Sprints/PI et avec historique. | Validé |
| F-12 | Même pérennité et historique pour les risques, dépendances et actions. | Validé |
| F-13 | Liens explicites historisés entre obstacles, risques, dépendances, décisions et actions. | Validé |
| F-14 | Traçabilité des KPI : source, formule, instant de collecte, valeurs consultables ; versions complètes/snapshots non requis. | Validé |
| F-15 | Exports de reporting PDF, PPTX, DOCX, XLSX et HTML. | Validé ; calendrier de livraison non arbitré |
| F-16 | Intégration automatique Jira repoussée ; automatiser les calculs avec les données disponibles. | Validé |
| F-17 | Accueil SM : cockpit du Sprint courant ; accueil RTE : cockpit du PI courant. | Validé |
| F-18 | Navigation du cockpit PI ART vers les tableaux de bord des équipes. | Validé |
| F-19 | Import CSV à schéma fixe SMN, réservé aux valeurs numériques consolidées ; validation, traçabilité ; pas de tickets. | Validé ; schéma détaillé à spécifier |
| F-20 | Préparation des cérémonies préremplie avec les informations existantes. | Validé |
| F-21 | SMN sert à préparer et synthétiser les réunions ; pas à animer les réunions à l'écran ; lien externe possible (Miro, etc.). | Validé |
| F-22 | Rétrospective : synthèse, décisions et actions, non les discussions détaillées ; responsables d'actions en texte libre. | Validé |
| F-23 | Restitution avant réunion pour introduction et après réunion pour bilan/décisions/actions. | Validé |
| F-24 | Rapport distinguant période examinée et évolutions historiques. | Validé |
| F-25 | Profondeur historique par défaut configurable et modifiable lors du reporting ; enregistrable dans les modèles. | Validé |
| F-26 | Membre multiéquipes : distinguer temps contractuel et affectation en % de son temps ; évolution dans le temps. | Validé |
| F-27 | Calendrier individuel (jours/demi-journées), absences, exceptions et historique. | Validé |
| F-28 | Membre défini de manière centralisée ; absences/calendrier saisis une fois pour ses différentes équipes. | Validé |
| F-29 | Absences catégorisées (congés, formation, maladie sans détail médical, autre), prévues/imprévues, déclarables après coup. | Validé |
| F-30 | Conserver au niveau de la période la capacité initialement prévue et la capacité réellement constatée. | Validé |
| F-31 | Historiser les changements d'équipe et leurs conséquences ; arrivée d'un membre et mentorat susceptibles d'affecter la capacité. | Validé |
| F-32 | Marge de planification propre à l'équipe, indépendante de la capacité calculée et des Story Points. | Validé |
| F-33 | Coefficient de contribution par membre et période (montée en compétence, mentorat), distinct du rôle et de l'affectation. | Validé |
| F-34 | Coefficient de contribution repris de la période précédente et éditable ; pas de calendrier complexe de progression future. | Validé |
| F-35 | Jours fériés nationaux/régionaux selon localisation, import CSV fixe et exceptions manuelles ; ne pas compter deux fois. | Validé ; fournisseur de jours fériés à choisir |
| F-36 | Employeur/société optionnel pour chaque membre ; calendrier de fermetures d'entreprise distinct des jours fériés. | Validé |
| F-37 | Employeur actuel seulement pour le MVP, sans historique des employeurs ; préserver les capacités historiques. | Validé |
| F-38 | Rôle Agile obligatoire (Développeur par défaut) et intitulé de fonction facultatif ; plusieurs rôles possibles. | Validé |
| F-39 | Rôles attribués par équipe, catalogue administrable, désactivation sans supprimer l'historique ; rôle personnalisé Proxy PO. | Validé |
| F-40 | Catalogues distincts Scrum/SAFe, sélectionnés selon le mode ; rôles ART et équipes en SAFe. | Validé ; liste officielle à vérifier |
| F-41 | Mode d'installation fixé après initialisation, sauf réinitialisation ; nouveau produit/mission = nouvelle installation. | Validé, étendu aux trois modes par F-49 |
| F-42 | Réinitialisation complète exceptionnelle pour tests/démos, avec confirmation stricte et sauvegarde optionnelle ; ne toucher qu'aux données/fichiers gérés par SMN. | Validé |
| F-43 | Génération automatique des calendriers de Sprint, de PI et de périodes selon paramètres, dates modifiables. | Validé |
| F-44 | Événements avec date, heure et durée ; Planning au début, Review et Rétro en fin de Sprint ; durées selon Sprint. | Validé ; règles de calcul précises à définir |
| F-45 | Valeurs par défaut de calendrier et de cérémonies administrables, avec adaptation équipe/ART et événement. | Validé |
| F-46 | Conserver date/heure prévues et date/heure réelles des événements reportés. | Validé |
| F-47 | Événements Scrum et SAFe dédiés, dont PI Planning et Inspect & Adapt. | Validé ; catalogue exact à préciser |
| F-48 | Réunions personnalisées ponctuelles ou récurrentes, dont affinages, au niveau équipe ou ART. | Validé |
| F-49 | Initialisation Scrum, Kanban ou SAFe ; SAFe accueille Scrum et Kanban ; Kanban suit des périodes mensuelles par défaut et non des Sprints. | Validé ; remplace F-02/F-03 |
| F-50 | En SAFe, cadence et bornes des itérations décidées par l'ART et communes à toutes les équipes, Scrum ou Kanban ; 5 itérations égales par défaut, dernière IP. | Validé |
| F-51 | Calendrier ART consolidé des événements de l'ART et des équipes, filtrable, avec accès aux fiches. | Validé |
| F-52 | RTE peut créer, déplacer, reporter, annuler et modifier les événements d'équipes depuis le calendrier ART ; sans modifier la cadence du PI. | Validé |
| F-53 | Fuseau horaire de référence par équipe et ART, conversion d'affichage et gestion des changements d'heure ; localisation des membres. | Validé |
| F-54 | Alertes non bloquantes pour fériés/fermetures/jours non travaillés collectifs touchant tout ou partie de l'équipe ; aucune alerte sur absence/temps partiel individuel. | Validé |
| F-55 | Daily générés et considérés tenus par défaut sur les jours travaillés ; non générés si toute l'équipe chôme ; alerte si seulement une partie est concernée. | Validé |
| F-56 | Autres réunions/cérémonies maintenues avec alerte sur jours collectivement non travaillés, sans suppression/déplacement automatiques. | Validé |
| F-57 | Modifier une seule occurrence récurrente, ou cette occurrence et les suivantes ; conserver le passé. | Validé |
| F-58 | Répartir à chaque période le temps affecté à l'équipe entre plusieurs rôles ; seule la part Développeur alimente la capacité de développement. | Validé |
| F-59 | Capacité développement = disponibilité × affectation équipe × part Développeur × coefficient contribution ; pas de double déduction. | Validé |
| F-60 | Ne pas déduire le temps des cérémonies de la capacité ; utiliser pourcentages d'activité et marge de planification. | Validé |
| F-61 | Unité unique de capacité affichée : jour/homme (JH) ; SP indépendants, pas de conversion en JH. | Validé |
| F-62 | Somme des affectations simultanées d'un membre à ses équipes ≤ 100 % de son temps contractuel ; blocage au-delà ; moins de 100 % permis. | Validé |
| F-63 | Dans une équipe et une période, somme des parts des rôles d'un membre = 100 %, contrôle bloquant ; reprise période précédente. | Validé |
| F-64 | Quatre valeurs SP Scrum : initiaux, ajoutés, retirés, terminés ; calculs dérivés si valeurs disponibles. | Validé |
| F-65 | SP non terminés affichés dans le bilan mais jamais ajoutés automatiquement à l'engagement du Sprint suivant. | Validé |
| F-66 | Plusieurs objectifs par Sprint/PI, évalués individuellement : non évalué, atteint, partiellement atteint, non atteint ; commentaire facultatif. | Validé |
| F-67 | En SAFe, objectifs PI exclusivement au niveau ART, déclinés par équipes en objectifs de Sprint Scrum ou période Kanban. | Validé |
| F-68 | Association facultative de chaque objectif d'équipe à un ou plusieurs objectifs PI ; objectifs locaux possibles. | Validé |
| F-69 | Les équipes Kanban, autonomes ou SAFe, peuvent définir plusieurs objectifs de période avec résultats individuels. | Validé |
| F-70 | Reprise uniquement manuelle des objectifs non/partiellement atteints vers période suivante ; nouvelle fiche liée à l'ancienne. | Validé |
| F-71 | Tous les KPI Kanban facultatifs, absence ≠ zéro, aucun blocage de clôture ou de reporting. | Validé |
| F-72 | Tous les KPI quantitatifs de Scrum, Kanban et SAFe facultatifs ; calculs seulement avec données suffisantes. | Validé |
| F-73 | Reporting ART : synthèse commune qualitative, indicateurs par équipe, consolidations chiffrées seulement si comparables ; ne pas sommer les SP interéquipes. | Validé |
| F-74 | Dépendance enregistrée une fois dans un registre commun, partagée entre équipes/ART et éventuellement équipes externes nommées. | Validé |
| F-75 | Registre unique des risques à périmètres multiples ; classification ROAM pour Scrum, Kanban et SAFe : Resolved, Owned, Accepted, Mitigated. | Validé |
| F-76 | Probabilité et impact facultatifs sur trois niveaux ; criticité dérivée quand les deux sont disponibles ; matrice détaillée à confirmer. | Validé pour le principe |
| F-77 | Créer un obstacle depuis un risque matérialisé, prérempli, avec identifiant et lien bidirectionnel, sans supprimer le risque. | Validé |
| F-78 | Cycles de vie du risque et de l'obstacle indépendants ; résolution de l'obstacle suggère de réévaluer ROAM sans l'altérer automatiquement. | Validé |
| F-79 | Liens facultatifs, multiples et bidirectionnels entre objectifs et risques/obstacles/dépendances, historisés. | Validé |
| F-80 | Alertes informatives sur objectifs associés à risques élevés, obstacles/dépendances ouverts ou en retard ; aucun changement automatique des résultats. | Validé |
| F-81 | Actions proches de leur échéance, dues aujourd'hui ou en retard mises en avant ; date facultative, aucune notification externe. | Validé |
| F-82 | Seuil anticipatif des alertes d'action : 3 jours calendaires par défaut, paramétrable dans l'administration. | Validé |
| F-83 | Même dispositif et seuil d'échéance pour les dépendances ouvertes ; aucun changement automatique du statut. | Validé |
| F-84 | Vue cockpit « Points d'attention » regroupant alertes d'actions, dépendances et objectifs, accès aux fiches ; filtres ART/équipes. | Validé |
| F-85 | Registre centralisé des décisions avec identifiant, date, justification, périmètre, liens et origine cérémonielle ou indépendante. | Validé |
| F-86 | Décisions Active, Remplacée ou Annulée ; conserver historique et lier décision remplaçante. | Validé |
| F-87 | Créer une ou plusieurs actions depuis une décision, avec préremplissage et lien bidirectionnel. | Validé |
| F-88 | Actions : À faire, En cours, Terminée, Annulée ; date de réalisation et commentaire facultatif ; sans sous-tâches/avancement %. | Validé |
| F-89 | Obstacles : Ouvert, En cours de résolution, Résolu, Abandonné ; réouverture et historique, aucun effet automatique depuis les actions. | Validé |
| F-90 | Dépendances : Ouverte, En cours, Satisfaite, Annulée ; signal « À risque » indépendant ; réouverture possible. | Validé |
| F-91 | Clôture manuelle des Sprints, périodes Kanban et PI ; bilan préparé automatiquement, aucun KPI obligatoire ; ouverts persistent. | Validé |
| F-92 | Nouvelle période démarre même si la précédente n'est pas clôturée ; plusieurs bilans en attente autorisés et signalés. | Validé |
| F-93 | Période clôturée rouvrable puis reclôturable pour correction ; historique et recalcul ; exports passés inchangés. | Validé |
| F-94 | RTE peut clôturer le PI si des itérations d'équipes restent ouvertes, avec avertissement non bloquant. | Validé |
| F-95 | Recalcul sélectif manuel de KPI après clôture du PI, comparaison avant/après, trace ; ne modifie pas les données sources. | Validé |
| F-96 | Recalcul sélectif généralisé aux Sprints, périodes Kanban et PI, même clôturés. | Validé |
| F-97 | Reporting sur demande à tout instant, sur période ouverte ou clôturée, daté et contextualisé, formats et modèles choisis. | Validé |
| F-98 | Journal historisé des analyses humaines (SM/RTE) et IA, liées aux périodes et réutilisables en reporting. | Validé |
| F-99 | Brief IA = fichier TXT plat archivé, consultable, exportable et rejouable ; lien à l'analyse et métadonnées en base. | Validé ; détail du stockage à concevoir |
| F-100 | Analyse humaine ou IA modifiable et supprimable ; une seule analyse IA à la fois par brief ; signaler les retouches humaines. | Validé |
| F-101 | Supprimer une analyse ne supprime pas son brief TXT, qui demeure réutilisable. | Validé |
| F-102 | MVP : brief transmis manuellement à l'IA externe puis réponse copiée-collée dans SMN ; API/automatisation reportée. | Validé |
| F-103 | Brief IA = reporting textuel structuré (TXT), sans graphiques, fondé sur moteur et sélection de données communs aux rapports. | Validé |
| F-104 | Modèles de briefs préconfigurés, éditables et extensibles depuis l'administration. | Validé |
| F-105 | Analyses IA historiques exclues par défaut des nouveaux briefs ; inclusion volontaire possible, comme pour les analyses humaines. | Validé |
| F-106 | Prévisualiser, compléter contexte et instructions, vérifier confidentialité puis archiver le brief TXT définitif. | Validé |
| F-107 | Brief TXT archivé immuable côté application ; duplication pour le modifier ; garder parenté et analyses respectives. | Validé |
| F-108 | Aucune donnée individuelle de membre dans les briefs IA : uniquement données consolidées équipe/ART. | Validé |
| F-109 | Inclure aussi le contexte qualitatif collectif (risques, obstacles, dépendances, décisions, faits marquants), après vérification. | Validé |
| F-110 | Journal chronologique des faits marquants, alimenté automatiquement depuis SMN et manuellement pour événements non couverts. | Validé |
| F-111 | Journal distinct des historiques complets ; catégories de faits automatiques configurables, promotion/masquage sans altérer les sources. | Validé |
| F-112 | Interface internationalisée dès le MVP : français et anglais ; autres langues à prévoir via de futures User Stories. | Validé ; langue des contenus libres et exports à préciser |
| F-113 | Thèmes CSS personnalisables par palettes de couleurs, choisis par l'utilisateur et modifiables. | Validé ; palettes exactes à concevoir |
| F-114 | Assistant d'initialisation / première installation pour définir les principaux paramètres par défaut, avec des valeurs proposées. | Validé ; étapes précises à spécifier |
| F-115 | Bootstrap 5 est le framework CSS retenu ; thèmes avec variables CSS et modes clair/sombre. | Validé |
| F-116 | Contexte métier projet/produit suivi et historisé dans SMN, quel que soit le mode Scrum, Kanban ou SAFe. | Validé ; cardinalités avec équipes et ART à définir |
| F-117 | Vision du produit et Product Goal enregistrés dans le contexte projet/produit, historisés et sélectionnables dans des rapports, bien que provenant du PO. | Validé |
| F-118 | Definition of Done (DoD) et Definition of Ready (DoR) représentables sous forme de texte intégral dans SMN ou de lien vers un document externe, par exemple SharePoint. | Validé |
| F-119 | En SAFe, DoD et DoR uniques au niveau ART et communes à toutes les équipes du train ; hors SAFe, au niveau équipe. | Validé |
| F-120 | DoD et DoR incluables de façon facultative, à titre informatif, en fin de reporting ; texte intégral interne ou lien externe. | Validé ; historicité du contenu externe à préciser |
| F-121 | Chaque équipe Scrum/Kanban autonome suit un seul produit ; en SAFe, chaque ART suit un seul produit commun à toutes ses équipes, sans produits distincts par équipe. | Validé ; complété par F-122 |
| F-122 | Le produit de référence est fixé pour toute la durée de vie d'une installation SMN. Aucun changement ou remplacement de produit au sein de cette installation : un nouveau produit implique une nouvelle installation indépendante. L'ancienne installation et son historique ne sont pas automatiquement effacés. | Validé |
| F-123 | Dans l'assistant d'installation initiale, le nom du produit de référence est obligatoire pour finaliser l'initialisation. La vision du produit et le Product Goal sont facultatifs et renseignables ou complétables ultérieurement depuis SMN ; ces évolutions restent historisées. | Validé |

## Corrections de cadrage à retenir impérativement

1. **F-02/F-03 sont obsolètes** dans leur forme initiale : les modes d'installation sont désormais **Scrum, Kanban, SAFe**. En SAFe, un ART comprend des équipes Scrum **et/ou** Kanban (F-49).
2. **F-41 reste valable concernant le mode fixe** : choix à l'initialisation, réinitialisation complète volontaire pour en changer (F-42).
3. **Une équipe Kanban en SAFe suit la cadence de l'ART** (F-50) ; une équipe Kanban autonome suit une période de reporting mensuelle par défaut (F-49).
4. **Aucun KPI quantitatif n'est obligatoire** dans aucun mode (F-71/F-72). Les champs de configuration structurels valides demeurent nécessaires.
5. **Les données individuelles servent aux calculs internes**, pas aux exports de briefs IA (F-108).
6. **Les briefs IA sont des fichiers TXT figés une fois archivés** (F-99/F-107), mais **leurs analyses sont modifiables et supprimables** (F-100/F-101).
7. **Pas de connexion Jira automatique ni d'API IA exigée en première version** (F-16/F-102). L'import CSV ne porte que sur des valeurs consolidées (F-19).
8. **Pas de déduction automatique du temps des cérémonies de la capacité** (F-60), et **pas de conversion des Story Points en JH** (F-61).
9. **Reporting à tout moment**, y compris sur période en cours et sur période clôturée (F-97). Recalcul sélectif possible après clôture (F-95/F-96).
10. **MVP français/anglais, Bootstrap 5 et thèmes**, installation par assistant (F-112 à F-115).
11. **Projet/produit suivi indépendamment du mode**, avec vision et Product Goal historisés (F-116/F-117).
12. **DoD et DoR uniques pour toutes les équipes d'un ART** ; lien ou texte, intégration possible en fin de rapport (F-118 à F-120).
13. **Un seul produit par équipe autonome ; un seul produit commun par ART** pour toutes ses équipes Scrum/Kanban (F-121).
14. **Produit fixé pour toute l'installation** : aucun remplacement en cours de vie, nouvelle installation indépendante si changement de produit ; l'ancienne peut être conservée (F-122).
15. **Initialisation** : nom du produit obligatoire ; vision et Product Goal facultatifs et complétables plus tard (F-123).

## Ce qui reste ouvert (ne pas présenter comme décidé)

- Découpage du MVP, priorisation, estimation et calendrier de livraison des formats d'export.
- Technologie, modèle de données, stratégie de stockage/sauvegarde, sécurité et authentification.
- Schémas exacts des CSV consolidés et des calendriers de jours fériés, et provenance des jours fériés.
- Durées et horaires initiaux précis, règles détaillées de génération des événements, catalogues exacts Scrum et SAFe, paramètres de reporting et d'affichage.
- Définition chiffrée de la matrice de criticité 3×3 ; conditions de calcul détaillées des KPI, notamment métriques de flux Kanban.
- Politique de conservation, suppression et visibilité des fichiers TXT d'IA (hors règles explicitement actées), schéma des modèles de briefs.
- Catalogue initial des « faits marquants » automatiquement remontés (sélection administrable actée).
- Identification des éventuels KPI ART comparables et règles d'agrégation ; ne pas sommer les SP des équipes.
- Produit unique et fixe pendant toute l'installation **tranché** (F-121/F-122). Restent à définir les modalités techniques de création d'une nouvelle installation indépendante, et le lien entre Product Goal et objectifs de Sprint/PI.
- Traduction des contenus métier saisis et des exports, paramètres régionaux, langues futures.
- Palettes et accessibilité, étapes détaillées de l'assistant de première installation et autres paramètres exacts ; **le nom du produit y est obligatoire, vision et Product Goal facultatifs** (F-123).
- Références de versions DoD/DoR SharePoint : une URL ne préserve pas nécessairement le contenu historique.

## Règle d'utilisation

Pour un nouvel agent BMAD : lire **dans cet ordre** `docs/PROJECT-CONTEXT.md`, ce registre, puis `docs/CADRAGE-FONCTIONNEL.md`. Repartir de ces décisions, signaler les contradictions ou les questions ouvertes et ne pas inventer des spécifications manquantes. Toute modification substantielle doit mettre à jour les documents et, lorsqu'approprié, les tickets Jira après autorisation.
