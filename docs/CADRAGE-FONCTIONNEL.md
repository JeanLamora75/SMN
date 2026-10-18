# Scrum Master Notebook — Cadrage fonctionnel consolidé

> **État : 18 octobre 2026** — Synthèse de brainstorming BMAD avec Mary (Analyst).  
> **Source de vérité des arbitrages :** [Registre F-01 à F-120](./DECISIONS-FONCTIONNELLES.md).  
> **Nature :** règles métier validées et pistes restant à spécifier. **Ce document n'est pas encore le PRD ni l'architecture technique.**  
> **Vocabulaire :** SM = Scrum Master ; RTE = Release Train Engineer ; ART = Agile Release Train ; PI = Planning Interval ; JH = jour/homme ; SP = Story Points ; MVP = première version fonctionnelle à arbitrer.

## 1. Vision et garde-fous

### 1.1 Finalité

Scrum Master Notebook (**SMN**) est le carnet de bord professionnel et la mémoire des activités d'un **SM** ou d'un **RTE**. Il aide à préparer les événements, enregistrer les informations essentielles, suivre leur évolution et restituer des reportings riches et contextualisés aux parties prenantes.

Principes incontournables :

- **Utilisation non collaborative** : le SM/RTE est le principal utilisateur et responsable des saisies ; les membres de l'équipe n'ont pas à utiliser SMN.
- **Saisie minimale** : calculs automatiques, valeurs par défaut, réutilisation des données, événements présumés tenus, saisie des exceptions.
- **Informations quantitatives ET qualitatives** : les chiffres ne suffisent pas à expliquer une période.
- **Historique et traçabilité** : distinguer données observées, calculs, source, appréciations humaines et analyses IA ; expliquer les changements sur plusieurs périodes.
- **Reporting à la demande**, pendant ou après les périodes, avec choix des sections, KPI et profondeur historique.
- **Pas de surveillance ni notation individuelle** à partir des indicateurs ; les détails de membres sont nécessaires aux calculs internes, pas aux briefs pour l'IA.
- **Pas de sur-ingénierie** : SMN n'est ni Jira bis, ni un outil partagé pour animer les cérémonies, ni un logiciel de gestion de tâches exhaustif.
- Les KPI et indicateurs **sont tous facultatifs** (F-72). Une donnée absente n'est ni zéro ni un motif de blocage.

### 1.2 Portée des décisions

Les **120 références F-01 à F-120** sont répertoriées dans le registre. Les anciennes décisions F-02 et F-03 (Scrum/SAFe uniquement) sont remplacées par F-49. Les propositions citées comme « à spécifier » ne doivent pas devenir tacitement des exigences.

## 2. Modes d'installation, équipes et ART

### 2.1 Les trois modes

L'assistant d'initialisation choisit une seule fois un mode :

1. **Scrum** : gestion d'équipes Scrum et de leurs Sprints.
2. **Kanban** : gestion d'équipes Kanban et de leurs périodes de reporting, **un mois par défaut**.
3. **SAFe** : gestion d'un ART constitué d'équipes Scrum **ou** Kanban, éventuellement mélangées.

Le mode d'installation est **fixe** (F-41), sauf réinitialisation complète de SMN (F-42). Une autre mission peut utiliser une autre installation. Les paramètres, les catalogues de rôles, les calendriers et événements par défaut appropriés au mode choisi sont chargés à l'initialisation.

**En SAFe, c'est l'ART qui définit la cadence** (F-50). Toutes ses équipes, Scrum ou Kanban, suivent les **mêmes dates de début et de fin d'itération** et la même durée, y compris si celle-ci est fixée à trois semaines. Un PI comporte **par défaut cinq itérations de durée égale**, la cinquième étant une **IP Iteration**. Les équipes Kanban continuent de travailler en flux continu ; ces itérations servent à la synchronisation et au reporting, sans engagement Scrum artificiel.

### 2.2 Référentiels de rôles

Chaque membre d'une équipe dispose de rôles **Agile attribués par équipe** (et possiblement plusieurs rôles) et, facultativement, d'un **intitulé de fonction professionnelle en texte libre**. Le rôle Développeur est proposé par défaut. Ex. : fonction « Chef de projet », rôle Agile « Product Owner » ; une même personne peut être Scrum Master et Développeur dans Alpha, Développeur dans Beta.

Les catalogues de rôles sont **administrables** et distincts selon les référentiels Scrum / SAFe ; en SAFe distinguer les niveaux équipe et ART. Le mode Kanban doit disposer des rôles nécessaires à son usage, leur catalogue exact étant à définir. Ne pas créer une liste pseudo-officielle arbitraire ; vérifier ultérieurement les rôles des référentiels Scrum/SAFe et conserver la possibilité d'ajouter « Proxy PO ». Les rôles déjà utilisés doivent pouvoir être **désactivés**, sans casser l'historique.

### 2.3 Membres, localisation et entreprises

- Un membre est **défini une seule fois**, puis affecté à une ou plusieurs équipes ; son calendrier et ses absences sont renseignés de façon centrale (F-28).
- Une équipe peut réunir des membres de pays/régions/villes différents ; localisation et fuseau horaire individuel sont pris en compte.
- Temps contractuel (ex. 80 %), affectation à chaque équipe (ex. 50 % du temps disponible) et répartition d'activité par rôle **sont trois dimensions distinctes**.
- Affectations et autres paramètres de capacité peuvent évoluer au cours du temps ; conserver les données nécessaires aux bilans historiques.
- Chaque membre peut être associé facultativement à un **employeur/société**, pour appliquer des fermetures d'entreprise. Le MVP conserve l'employeur **actuel**, sans historisation exhaustive des employeurs successifs (F-37).
- Aucune gestion contractuelle de prestataires n'est prévue par ces décisions.

## 3. Calendriers, disponibilités et capacités

### 3.1 Calendriers individuels et collectifs

Le calendrier individuel distingue jours entiers et demi-journées travaillés/non travaillés, temps partiel, exceptions et absences (congés, formation, maladie sans détail médical, etc.), avec marquage **prévu / imprévu** et possibilité de déclaration a posteriori.

Prendre en compte :

- Jours fériés nationaux/régionaux selon localisation du membre (source automatique à choisir ultérieurement).
- Import CSV au **format SMN prédéfini** et saisie manuelle des jours exceptionnels.
- Fermetures propres à la société / à l'équipe.
- Absences individuelles entrées une seule fois, propagées aux calculs de toutes les équipes concernées.
- Déductions sans double comptage des journées qui coïncident.

### 3.2 Capacité de développement (F-26 à F-34, F-58 à F-63)

SMN calcule **seulement la part de capacité consacrée à l'activité Développeur** ; les rôles de Scrum Master, Product Owner, etc. ne contribuent pas en tant que tels. Si une personne cumule plusieurs rôles, la part Développeur peut être de 20 %, 50 %, 70 %, etc. Elle est propre à l'équipe et à la période.

**Formule conceptuelle :**

```text
Capacité de développement en JH
 = disponibilité contractuelle sur la période (jours ouvrés, calendrier, absences)
 × pourcentage d'affectation à cette équipe
 × pourcentage d'activité Développeur dans cette équipe
 × coefficient de contribution à la réalisation
```

- Exemple de contrôle : un membre à **80 %** d'un temps plein, affecté **50 %** à Alpha, avec **50 %** de son temps Alpha comme Développeur et contribution **100 %**, représente **20 % d'un temps plein** de développement avant les autres déductions.
- L'unité affichée est **exclusivement le jour/homme (JH)** ; aucun besoin d'option d'affichage en heures ; les SP sont indépendants et **ne se convertissent pas en JH**.
- **Contrôle bloquant :** la somme des affectations simultanées d'un membre à ses équipes **ne dépasse pas 100 %** de son temps contractuel. Une somme inférieure à 100 % est valide (activités hors des équipes suivies).
- **Contrôle bloquant :** pour un membre dans une équipe et une période, les pourcentages de ses rôles **totalisent exactement 100 %**.
- La répartition des rôles et le coefficient de contribution sont **reconduits depuis la période précédente**, modifiables à chaque Sprint/itération/période, sans planification complexe de progression à l'avance.
- Le coefficient de contribution tient compte de situations telles qu'un nouvel arrivant en montée en compétence ou un mentor qui réduit sa contribution à la réalisation. **Ce n'est pas une notation de performance individuelle**.
- Les cérémonies **ne sont jamais déduites automatiquement** du calcul ; les pourcentages d'activité et une **marge de planification indépendante au niveau équipe** servent de variables d'ajustement.
- La marge sécurise des prévisions, mais **ne modifie pas la valeur de capacité calculée**.
- Au niveau du Sprint/période, conserver la **capacité initiale de référence** et la **capacité réelle constatée** pour expliquer les écarts. Pas de versionnage complet obligatoire des données et rapports.

## 4. Périodes, cadence, cérémonies et calendrier

### 4.1 Génération et administration des défauts

SMN génère automatiquement les calendriers à partir des paramètres d'administration (F-43 à F-50) :

- Scrum : durée de Sprint configurable, **deux semaines proposées par défaut**.
- Kanban autonome : **période de reporting mensuelle par défaut**, sans « Sprint Planning » ni « Sprint Review » obligatoires ; travail en flux continu.
- SAFe : PI de cinq itérations égales par défaut, dernière IP Iteration, **même cadence pour toutes les équipes** ; paramètres au niveau ART.
- Valeurs par défaut modifiables au niveau équipe/ART lorsque cela ne contredit pas la cadence ART ; chaque occurrence de cérémonie demeure éditable.
- Chaque événement comporte **date, heure, durée**, type, périmètre, **date/heure prévues et réelles**, état (prévue/tenue/reportée/annulée), contexte et éventuellement lien externe.
- Sprint Planning initial en début de Sprint, Sprint Review puis Rétrospective en fin de Sprint ; durées proposées en fonction de la durée du Sprint, réglables. Les formules/durées exactes restent à spécifier.
- SAFe : inclure **PI Planning**, **Inspect & Adapt** et les événements pertinents à cataloguer ; événements transverses ART.
- **Réunions personnalisées** ponctuelles/récurrentes : affinages, démonstrations Kanban à la demande, coordination, etc. ; non obligatoires.

### 4.2 Daily et exceptions

Pour Scrum et Kanban, les Daily sont générés selon une heure par défaut administrable ; **ils sont réputés tenus sauf exception renseignée**. Les cas d'annulation ou report ont un suivi (F-07, F-55).

- Si **toute l'équipe** est concernée par une journée fériée/non travaillée collective, **ne pas générer le Daily**.
- Si **seulement une partie** de l'équipe est concernée, **maintenir le Daily** et présenter une alerte non bloquante.
- Pour **toutes les autres cérémonies et réunions**, les maintenir avec alerte quelle que soit la portée de la journée collectivement non travaillée ; ne pas les déplacer/supprimer automatiquement.
- **Aucune alerte de conflit** issue d'une absence individuelle, d'une maladie ou d'un temps partiel individuel ; ces éléments restent pris en compte **pour la capacité**.
- Alertes collectives fondées sur jours fériés nationaux/régionaux, fermetures de société et jours d'équipe non travaillés.
- Les événements peuvent être préparés avant et résumés après ; SMN n'est pas destiné à être projeté comme outil d'animation de la réunion.

### 4.3 Récurrences, fuseaux et cockpit RTE

- Modification d'une **occurrence unique** ou de **cette occurrence et des suivantes**, sans toucher à l'historique.
- Fuseau horaire de référence propre à chaque **équipe** et à l'**ART**, plus fuseau des membres ; conversion d'affichage et changements heure d'été/hiver.
- **Calendrier ART consolidé** des événements de l'ART et de toutes ses équipes ; filtres équipe/type/période et accès aux fiches.
- Le RTE peut y **créer, modifier, reporter et annuler** les événements des équipes sans accéder à chaque calendrier séparément.
- Une modification d'une cérémonie **ne change jamais automatiquement les bornes de l'itération** de l'ART.
- Dates prévues et dates de tenue effective distinctes pour les reportings et l'historique.

### 4.4 Cérémonies et comptes rendus

Préparation automatique de supports à partir des données disponibles ; saisie des compléments seulement. Permettre une restitution **avant** réunion (support d'introduction) et **après** réunion (synthèse, décisions, actions). Les rétrospectives ne stockent **que leur synthèse**, les décisions et les actions, sans détail des échanges ou post-it. Les responsables d'actions peuvent être nommés en texte libre, y compris hors des membres de l'équipe.

## 5. Objectifs et cycles des périodes

### 5.1 Objectifs multiples

- Plusieurs objectifs **par Sprint Scrum**, **par période Kanban autonome ou SAFe**, et **par PI SAFe** ; évalués **individuellement**.
- Évaluation : **Non évalué** avant clôture ; puis **Atteint / Partiellement atteint / Non atteint** ; commentaires facultatifs. Ne pas inférer le résultat à partir des seuls SP.
- **SAFe : les objectifs du PI sont au niveau ART uniquement.** Les équipes déclinent des objectifs de Sprint/période.
- Lien **facultatif**, éventuellement plusieurs-à-plusieurs, des objectifs des équipes vers les objectifs PI ; objectifs purement locaux permis.
- Objectifs non ou partiellement atteints : **reprise manuelle** dans une période suivante, sous forme d'un nouvel objectif lié ; **jamais de report automatique**.
- Les objectifs peuvent être associés facultativement à risques, obstacles et dépendances.
- Signalement **informatif** des objectifs exposés à un risque élevé, obstacle ouvert ou dépendance ouverte/en retard ; **ne change ni le résultat ni le statut** de l'objectif.

### 5.2 Clôture et réouverture (F-91 à F-96)

- Date de fin calendaire **distincte** de la clôture fonctionnelle.
- Le SM clôture ses Sprints/périodes ; le RTE clôture son PI **manuellement** après un bilan prérempli.
- **Aucun KPI obligatoire** et aucun blocage en cas d'informations manquantes.
- Démarrer la période suivante **même si la précédente reste ouverte** ; plusieurs clôtures en retard possibles, visibles dans les points d'attention.
- Risques, dépendances, obstacles, actions encore ouverts perdurent **sans duplication**.
- Rouvrir une période clôturée pour correction/complément, conserver la trace, recalculer et reclôturer.
- PI clôturable **même si certaines itérations d'équipes sont ouvertes** ; avertissement non bloquant.
- **Recalcul manuel et sélectif des KPI** sur période ouverte ou clôturée (Sprint, Kanban, PI) ; présenter anciennes et nouvelles valeurs, enregistrer l'opération, ne pas altérer les données sources, résultats d'objectifs ou statuts.
- Les **exports déjà produits ne sont jamais changés automatiquement** ; les régénérer pour incorporer les corrections.
- Préserver sauf correction explicite les capacités initiales de référence.

## 6. KPI et saisie chiffrée

### 6.1 Règles transverses

Tous les indicateurs chiffrés sont **facultatifs**, même lors des clôtures. Les champs absents ne sont **ni zéro**, ni estimés artificiellement ; les calculs ne se font que si les valeurs requises existent. La source, la formule, la date de collecte/calcul et la valeur doivent être **consultables dans SMN**. Le rapport peut afficher le détail de traçabilité selon le souhait du SM/RTE.

Les imports initiaux éventuels sont des **CSV avec schéma fixe SMN**, validés, limités aux **données numériques consolidées** ; **pas d'import de tickets individuels** ni de mapping arbitraire. L'intégration API Jira peut être envisagée plus tard mais n'est **pas un prérequis**.

### 6.2 KPI Scrum

Quatre champs SP possibles par Sprint (F-64) : **SP initiaux, ajoutés, retirés, terminés**. Exemples de dérivations lorsque les valeurs sources existent :

```text
Périmètre final = SP initiaux + SP ajoutés - SP retirés
Non terminés   = Périmètre final - SP terminés
Réalisation du périmètre final = SP terminés / périmètre final
Variation du périmètre = (SP ajoutés - SP retirés) / SP initiaux
```

Traiter les dénominateurs nuls, les valeurs manquantes et les incohérences comme cas spécifiques à définir. **SP non terminés jamais injectés automatiquement** dans l'engagement du Sprint suivant.

Historique de vélocité, objectifs, capacité initiale/réelle en JH, changements de périmètre, écarts et contexte. Éviter les comparaisons de productivité individuelle.

### 6.3 KPI Kanban

Périodes de reporting (mensuelles par défaut en autonome ; alignées ART en SAFe). Métriques candidates **toutes facultatives** :

- **Throughput** / éléments terminés ;
- **WIP** en fin de période ;
- éléments bloqués en fin de période ;
- éléments commencés ;
- **Cycle Time** et **Lead Time** moyens (seulement si chiffres consolidés fournis).

Pas de Sprint Planning ni d'engagement de SP imposés ; Daily, affinage, rétrospective, démonstration à la demande et autres réunions configurables. Définir précisément les conventions de mesures de flux et leurs unités au PRD.

### 6.4 Consolidation ART

Le reporting du PI combine :

1. **Synthèse commune** (objectifs PI, risques, dépendances, décisions, actions, faits marquants).
2. **Analyse propre à chaque équipe** Scrum ou Kanban, avec ses indicateurs pertinents.
3. **Agrégation uniquement des métriques comparables** (ex. JH à périmètre précisé).

**Ne pas sommer les Story Points d'équipes distinctes**, ni mélanger SP et tickets Kanban. Les KPI absents restent absents. Les résultats d'objectifs d'équipe **ne déterminent pas automatiquement** l'atteinte des objectifs PI ; le RTE évalue ces derniers.

## 7. Registres transverses et traçabilité

### 7.1 Socle commun

Les éléments suivants doivent posséder **identifiants uniques, dates, contexte, historique, associations bidirectionnelles**, liens éventuels avec équipes/ART/périodes/objectifs, et rester actifs à travers plusieurs Sprints, périodes ou PI selon leur nature.

**Une fiche partagée** est consultable depuis tous les contextes auxquels elle se rattache : pas de copies indépendantes qui divergent. Les responsables et échéances sont facultatifs lorsqu'indiqués ci-dessous. Les liens doivent permettre un suivi du type **constat → risque / obstacle / dépendance → décision → action → résultat**.

### 7.2 Risques ROAM (F-75, F-76, F-77, F-78)

Registre unique, rattachable à une équipe, plusieurs équipes ou à l'ART ; classification **ROAM dans les trois modes** :

- **R — Resolved** : résolu ;
- **O — Owned** : pris en charge par un responsable ;
- **A — Accepted** : accepté ;
- **M — Mitigated** : mesures d'atténuation.

Le ROAM décrit le **traitement**, pas la criticité. **Probabilité** et **impact** sont chacun facultatifs avec niveaux Faible / Moyen / Élevé. Un score de criticité peut être dérivé lorsque les deux valeurs sont présentes. **La matrice exacte 3×3 est à confirmer** ; les couleurs et seuils montrés durant le brainstorming étaient illustratifs.

Lorsqu'un risque se matérialise, fonction **« Créer un obstacle depuis ce risque »** avec préremplissage, nouvel identifiant et lien bidirectionnel. Les deux **cycles de vie restent indépendants** : lever un obstacle suggère de réexaminer ROAM sans le modifier automatiquement.

### 7.3 Obstacles

Cycle de vie **Ouvert → En cours de résolution → Résolu**, ou **Abandonné**, avec possibilité de **réouverture** ; dates, historique, responsable éventuellement, relations risques/actions/décisions. La clôture d'une action liée **ne clôture pas automatiquement** l'obstacle.

### 7.4 Dépendances

Registre partagé : équipe(s) demandeuse(s), équipe(s) contributrice(s), possibilité de nommer une **équipe externe** sans l'enregistrer comme équipe SMN. Description, date cible, statut, historique.

Statuts : **Ouverte / En cours / Satisfaite / Annulée** ; signal indépendant **« À risque »**. Réouverture autorisée. Même mécanisme d'alerte d'échéance que les actions. Une dépendance n'est pas clôturée automatiquement à la fin du Sprint/PI.

### 7.5 Décisions

Registre central des décisions prises en cérémonie **ou hors réunion** ; date, justification, origine, périmètre, liens aux autres registres et objectifs.

Statuts : **Active / Remplacée / Annulée** ; ne jamais écraser une décision remplacée, lier à sa remplaçante et préserver l'historique. Bouton de **création assistée d'une ou plusieurs actions** avec préremplissage du contexte et liens bidirectionnels.

### 7.6 Actions

Statuts simples : **À faire / En cours / Terminée / Annulée**. Responsable en texte libre (interne ou externe), échéance et commentaire facultatifs ; date de réalisation enregistrée, éventuellement saisie a posteriori. Pas de pourcentage d'avancement, de sous-tâches ou de workflow sophistiqué.

### 7.7 Alertes et « Points d'attention » (F-80 à F-84)

- Actions et dépendances ouvertes **en retard**, dues aujourd'hui ou à **moins de 3 jours calendaires** de la date cible, seuil **commun administrable** (3 jours par défaut).
- Alertes informatives liées aux objectifs exposés à risques critiques, obstacles ouverts, dépendances ouvertes/en retard.
- Périodes passées non clôturées.
- Cockpit **« Points d'attention »** regroupant les éléments et donnant accès à leurs fiches ; filtres par équipe en SAFe.
- Aucune modification automatique de statut, aucun e-mail/notification externe initialement.
- Date d'échéance facultative et absence d'alerte d'échéance si l'élément est terminé/annulé ou n'a pas de date.

### 7.8 Journal des faits marquants (F-110/F-111)

Journal chronologique **distinct des historiques exhaustifs**. Deux sources :

1. Remontée automatique de **catégories d'événements significatifs** (paramétrables en administration, catalogue initial à arbitrer) : résolution d'obstacle, décision notable, risque élevé, objectif atteint, etc.
2. Ajouts rapides manuels : livraison, incident, succès collectif, changement organisationnel, etc.

Les faits générés gardent un **lien vers leur source**, plutôt qu'une copie indépendante. Un SM/RTE peut promouvoir ou **masquer dans le journal** un élément, sans détruire le registre de référence. Le journal alimente rapports et briefs IA.

## 8. Restitution, reportings et modèles

### 8.1 Vues opérationnelles

- Accueil **SM** : cockpit du Sprint/période courante, KPI disponibles, cérémonies, objectifs et points d'attention.
- Accueil **RTE** : cockpit du PI courant, événements ART, objectifs et éléments transverses, **drill-down vers les équipes**.
- Calendrier ART consolidé et filtrable.
- Vues historiques : dynamique des indicateurs disponibles, évolutions et interprétations qualitatives.

### 8.2 Reporting à tout moment

Rapport générable **à la demande**, y compris sur une période **en cours** (qualifié de provisoire / situation datée), achevée mais non clôturée, ou clôturée. Il doit afficher période, statut et **instant de génération**.

Le SM/RTE peut choisir :

- Périmètre : Sprint Scrum, période Kanban, équipe, PI/ART.
- Modèle prédéfini ou personnalisé, sections/KPI, affichage éventuel des traces calculatoires.
- Profondeur historique : valeur par défaut **administrable** et ajustable à l'export, enregistrable avec le modèle.
- Éléments qualitatifs, analyses, faits marquants, risques/dépendances/actions et contexte.
- Format **PDF, PowerPoint (.pptx), Word (.docx), Excel (.xlsx), HTML** (F-15).

Prévisualisation avant export. Branding / personnalisation visuelle (logo, couleurs, polices) évoqués comme orientation **à détailler et prioriser**, non comme charte déjà décidée. Les exports ne sont pas modifiés par correction/recalcul ultérieur ; un nouvel export peut être produit. **Pas de système complet de snapshots de rapports requis** pour le MVP.

### 8.3 Analyses humaines et IA

Les analyses d'un SM/RTE et les analyses reçues de l'IA sont **des données de SMN**, pas uniquement du texte temporaire de rapport. Elles ont une date, origine, périmètre, contenu et liens aux périodes/éléments. Elles sont consultables dans un journal historique et sélectionnables lors de la création de rapports.

Les analyses peuvent être **modifiées et supprimées**, avec au minimum date de création / dernière modification. Lorsqu'une analyse IA a été retouchée par un humain, le signaler explicitement. Ne pas prétendre conserver automatiquement toutes les anciennes versions du texte des analyses (pas validé).

## 9. Briefs IA textuels, réutilisables et traçables

### 9.1 Positionnement

Le **brief IA** est un **reporting moins visuel**, en **fichier texte `.txt`**, produit avec le moteur commun de sélection de données. Ce n'est pas un second système de reporting. Il est destiné à être fourni à une IA externe, puis à rapprocher la réponse des **données réellement transmises**.

**MVP exclusivement manuel** : SMN génère le TXT ; le SM/RTE le transmet à ChatGPT/Claude/Gemini/etc. ; copie-colle ensuite la réponse dans SMN. API IA et automatisation **reportées**.

### 9.2 Contenu et confidentialité

- Données **consolidées au niveau équipe/ART**, jamais le calendrier, nom, email, absence, capacité ou évaluation **individuelle** des membres.
- KPI, capacités JH, objectifs et résultats, tendances historiques, risques ROAM, obstacles, dépendances, décisions, actions et **faits marquants collectifs**.
- Texte libre vérifié avant transmission : des noms ou secrets peuvent figurer accidentellement dans des descriptions ; prévisualisation/édition nécessaire.
- Distinguer dans le TXT **faits mesurés**, **observations humaines**, **éventuelles anciennes analyses IA** et **instructions nouvelles**.
- Par défaut, **ne pas inclure les anciennes analyses IA** ; inclusion explicite possible. Les analyses humaines historiques sont également sélectionnables.
- Les modèles de briefs sont **préconfigurés et administrables** : ordre/sections des données, historique, questions et consignes ; ajustables lors de la génération.

### 9.3 Cycle de vie des briefs et des analyses

1. Générer un brief depuis un modèle, choisir les données et **prévisualiser**.
2. Ajouter du contexte collectif et des instructions ; vérifier le texte réellement communiqué.
3. **Archiver définitivement** le contenu exact comme fichier **TXT plat** géré par SMN, consultable/exportable/rejouable.
4. Le fichier archivé est **immuable via l'application** ; pour enrichir/corriger, **dupliquer** et archiver un nouveau TXT, en conservant la parenté.
5. L'analyse IA copiée-collée est **enregistrée dans SMN** et liée au brief d'origine ; éventuellement renseigner l'IA utilisée.
6. **Une seule analyse IA associée à un brief à la fois** : pas de mécanisme de versions/réponses multiples pour un même brief. Si l'analyse est supprimée, le TXT **reste** ; une nouvelle réponse peut ultérieurement être associée à ce brief.
7. Analyses modifiables/supprimables ; modifications humaines d'un texte IA identifiables ; ancien export éventuel inchangé.
8. Un **rejeu identique du contenu** ne garantit pas une **réponse IA identique** (versions de modèle différentes).

**Stockage envisagé :** contenu dans un répertoire privé géré par l'application (ex. `data/ai-briefs/`), **métadonnées et références en base** (identifiant, date, périmètre, chemin, analyse associée). Empreinte SHA-256, organisation exacte, sauvegardes et politique de rétention sont des **recommandations techniques à confirmer**, pas des choix d'architecture actés. Les fichiers gérés doivent entrer dans le périmètre de sauvegarde et de réinitialisation propre à SMN.

## 10. Internationalisation, apparence et assistant d'installation (F-112 à F-115)

### 10.1 Langues et paramètres régionaux

- **MVP disponible en français et en anglais**, y compris navigation, administration, formulaires, erreurs, validations et aides.
- Conception **internationalisable dès l'origine** ; les autres langues seront introduites dans des **User Stories ultérieures** à la demande.
- Possibilité pour l'utilisateur de changer la langue de l'interface après l'installation ; formats des dates, heures et nombres adaptés à la langue/région.
- Langue de l'interface, pays et fuseau horaire restent des notions distinctes.
- **Langue des textes métiers librement saisis et des rapports exportés : à spécifier**, sans présumer une traduction automatique. Les fichiers BMAD du projet restent rédigés en français.

### 10.2 Framework CSS et thèmes

- Le framework CSS **Bootstrap 5** est **arrêté** (F-115). Le choix d'un framework CSS ne fixe ni le frontend JavaScript, ni le backend, ni la base de données.
- L'apparence utilise des **variables CSS** et plusieurs **palettes de couleurs** proposées à l'utilisateur ; le choix peut être changé dans ses préférences.
- **Modes clair et sombre**, compatibles avec les palettes, également modifiables.
- Les palettes illustrées pendant le brainstorming étaient des **exemples**, pas des couleurs officielles. Contrastes, accessibilité, usages des couleurs sémantiques et mise en œuvre détaillée restent à concevoir.
- Préférer les composants responsives cohérents du framework pour les formulaires, calendriers, filtres, grilles et tableaux de bord.

### 10.3 Parcours de première installation

- Au **premier lancement**, proposer un **assistant d'initialisation** présentant les principaux réglages, leurs valeurs par défaut et un récapitulatif.
- Paramètres candidats proposés lors du brainstorming : langue, palette et mode clair/sombre, mode Scrum/Kanban/SAFe, pays, fuseau horaire, jours travaillés, cadence (Sprint/période/PI) et horaires des cérémonies.
- **Minimiser les saisies obligatoires**, proposer des valeurs cohérentes par défaut et permettre d'éditer ultérieurement les paramètres modifiables dans l'administration.
- Le **mode Scrum/Kanban/SAFe reste fixe** après initialisation (F-41/F-42/F-49), sauf réinitialisation complète volontaire.
- L'ordre des écrans, les champs obligatoires et l'éventuelle création d'un premier projet/produit dans ce parcours restent **ouverts**.

## 11. Contexte projet/produit et règles de travail (F-116 à F-120)

### 11.1 Projet/produit comme contexte métier

- SMN identifie et **historise le projet ou produit suivi** quel que soit le mode Scrum, Kanban ou SAFe ; cette notion est distincte de l'équipe, de la période et de l'ART.
- Le contexte sert à donner du sens aux indicateurs, aux objectifs et aux reportings, y compris rétrospectifs.
- L'identifiant, le nom, les éventuelles dates de rattachement et les versions de ses informations sont des éléments de modélisation à préciser.
- **Non arbitré** : une équipe ou un ART peuvent-ils suivre plusieurs projets/produits en parallèle ou un seul à la fois ? Ne pas créer implicitement une contrainte d'unicité.

### 11.2 Vision du produit et Product Goal

- **Vision du produit** et **Product Goal (objectif du produit)** sont deux contenus distincts, provenant généralement du **PO**, mais saisis et maintenus par le **SM/RTE** dans SMN ; le PO n'a pas besoin d'être utilisateur de l'application.
- Les changements de vision ou de Product Goal doivent être **historisés** : ne pas écraser les anciennes formulations ; conserver les informations nécessaires pour savoir laquelle s'appliquait lors d'une période donnée.
- Vision et Product Goal pourront être **sélectionnés** pour apparaître dans certains reportings et analyses historiques.
- Le Product Goal ne remplace **pas** les objectifs de Sprint, de période Kanban ou de PI (F-66 à F-70). Un éventuel lien explicite entre ces objectifs reste à définir.
- La politique de datation/versionnement (dates d'entrée en vigueur, coexistence ou succession d'objectifs) est à préciser au PRD.

### 11.3 DoD et DoR — stockage et portée

Deux informations distinctes :

- **Definition of Done (DoD)** ;
- **Definition of Ready (DoR)**.

Pour chacune, proposer le **texte complet conservé dans SMN** ou **un lien vers le document de référence externe**, notamment SharePoint. Elles doivent rester consultables et utilisables par les rapports.

**Règle structurante SAFe : les DoD et DoR sont communes à toutes les équipes du train**. Elles doivent être **définies une seule fois au niveau ART**, puis exposées aux équipes Scrum et Kanban de cet ART sans copies divergentes. **Hors SAFe**, la définition relève de l'équipe.

L'historisation des changements de DoD/DoR est pertinente pour contextualiser les rapports ; si le texte est enregistré dans SMN, conserver ses versions datées. **Un lien SharePoint seul ne garantit pas de retrouver le contenu historique :** référencer une version précise ou archiver une copie est une solution **à étudier**, non une décision technique déjà prise. L'accès au document externe reste soumis aux droits SharePoint.

### 11.4 Restitution dans les reportings

- Vision et Product Goal pourront figurer, **sur sélection**, dans les reportings correspondants.
- DoD et DoR pourront apparaître **facultativement en fin de reporting**, **pour information**, sans impact automatique sur l'évaluation des objectifs ou des KPI.
- Si le texte est interne : restitution du **contenu intégral** pertinent.
- Si le document est externe : restitution de son **titre et lien**, et, si connue, de la référence de version ; la présence d'une URL dans le rapport n'assure pas l'accès du destinataire.

## 12. Administration et paramètres par défaut

L'administration doit pouvoir ajuster sans toucher au code au minimum :

- Mode choisi et valeurs initiales chargées (mode non interchangeable hors reset).
- Catalogues de rôles par référentiel, rôles personnalisés, activation/désactivation.
- Durées Sprint/PI/itérations/périodes Kanban, horaires et durées de réunions, calendrier d'événements, heure Daily, fuseaux.
- Types de réunions/cérémonies récurrentes et ponctuelles, par équipe/ART.
- Calendriers de fermeture d'équipe et de société, exceptions, gestion/import des jours fériés.
- Marge de planification des équipes, profondeur historique par défaut des rapports.
- Seuil **3 jours calendaires** avant l'échéance des actions/dépendances.
- Modèles de reporting et de briefs IA ; catégories d'événements remontées automatiquement au journal.
- Langue d'interface (FR/EN au MVP), palette de couleurs et mode clair/sombre (F-112/F-113/F-115).
- Assistant de configuration initiale, ses valeurs proposées et leur reprise depuis l'administration (F-114).
- Projet/produit suivi, versions de vision et de Product Goal, DoD/DoR en texte ou lien communs à l'ART en SAFe (F-116 à F-120).
- Mécanisme de **réinitialisation complète** à confirmation stricte pour test/démonstration, avec sauvegarde optionnelle et suppression **uniquement des données et fichiers gérés par SMN** (y compris modèles, logos/imports/exports/briefs lorsqu'applicables), jamais de fichiers extérieurs.

Tous les paramètres individuels/structurels nécessaires aux calculs doivent rester cohérents ; l'optionalité des KPI ne signifie pas l'absence de validation des affectations et rôles.

## 13. Contraintes de réalisation et intégrations

- **Référentiels** : GitHub pour fichiers, code et BMAD ; Jira SMN pour Epic/Story/bug/tâche.
- BMAD Method **v6.12.4** ; Skills `.agents/skills/`, configuration `_bmad/`, livrables `_bmad-output/`.
- **Langue des documents BMAD du projet** : français. **Interface produit au MVP** : français et anglais (F-112).
- **Environnement local** : Windows 11 professionnel, sans droits admin, pas d'IDE ou de Codex CLI à installer. Node.js, npm, pnpm, PowerShell, GitHub Desktop disponibles.
- Workflows BMAD via ChatGPT et connecteurs ; ne jamais présenter un script/CI/test non exécuté comme vérifié.
- **Bootstrap 5 a été validé pour le CSS et les thèmes** (F-115). Aucun framework JavaScript, schéma de données, backend, hébergement ou architecture applicative globale n'est encore fixé ; ne pas importer les choix d'un autre projet.
- Automatisations externes (Jira API, IA API) **ultérieures** ; tâches d'import consolidé manuel à prioriser.

## 14. Points ouverts et besoins de précision pour Product Brief et PRD

Ces éléments ne sont **pas tranchés** par les 120 décisions :

1. **MVP et releases** : sélectionner la première livraison sans présumer que tous les formats et toutes les vues seront simultanément disponibles.
2. **Cérémonies** : catalogue officiel par Scrum/SAFe, détails du Kanban, formules de durées, dates et règles de récurrence par défaut ; vérifier les référentiels lorsque l'utilisateur autorise la recherche.
3. **Champs obligatoires de configuration** : membre, équipe, ART, période, objectif, risque et action ; règles de cohérence et ergonomie de saisie.
4. **KPI** : définitions et calculs détaillés, gestion des dénominateurs zéro, corrections a posteriori, terminologie et agrégations ART comparables ; métriques Kanban et unités.
5. **CSV** : formats fixes exacts pour les valeurs numériques et les jours fériés, validation et journaux d'import.
6. **Criticité des risques** : matrice 3×3 et seuils, historiques ROAM et statut d'éléments partagés.
7. **Confidentialité et sécurité** : contrôle d'accès SM/RTE, sauvegarde/restauration, stockage TXT, suppression, rétention, accès aux données qualitatives.
8. **Exports** : gabarits, branding, profondeur historique, contenu éditorial et logique de prévisualisation ; calendrier de réalisation des cinq formats.
9. **Faits marquants** : catégories activées initialement, seuil de signification, masque/promotions et affichage dans les rapports.
10. **SAFe** : granularité des événements ART, associations objectifs PI/Sprint, traitement de l'IP Iteration avec des équipes Kanban.
11. **Reset** : périmètre exact et procédure sécurisée.
12. **Qualité** : règles d'acceptation, tests et stratégie de migration des données à spécifier.
13. **Projet/produit** : cardinalités avec équipes et ART, historiques de rattachement, lien éventuel aux objectifs de Sprint/PI.
14. **DoD/DoR** : versions, suivi historique des documents externes SharePoint et comportement en cas de lien inaccessible.
15. **Internationalisation** : traitement des textes libres, langue des rapports, traductions futures.
16. **Installation** : étapes, valeurs par défaut, champs indispensables et prise en compte du premier projet/produit.
17. **Design** : palettes concrètes, accessibilité, couleurs de statut et modes clair/sombre.

## 15. Mode d'emploi pour les agents et conversations futures

1. Lire [PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md), puis [DECISIONS-FONCTIONNELLES.md](./DECISIONS-FONCTIONNELLES.md), puis ce document.
2. Pour chaque nouvelle Story/écran/processus, citer les **F-xx applicables** et distinguer validé / à arbitrer.
3. Ne jamais revenir implicitement aux modes « Scrum + SAFe seulement », ni rendre les KPI obligatoires, ni proposer des données individuelles aux IA.
4. Reprendre les décisions existantes avant de créer un PRD, une architecture ou un backlog.
5. Jira reste le référentiel des tickets ; cette synthèse n'y crée ni ne modifie aucune Story par elle-même.
6. Mettre à jour ces documents après tout nouvel arbitrage significatif.

**Synthèse enrichie des décisions validées F-01 à F-120.**
