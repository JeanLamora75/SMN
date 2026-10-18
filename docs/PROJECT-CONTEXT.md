# Scrum Master Notebook — Contexte de référence du projet

> **Version initiale : 18 octobre 2026 — dernière consolidation : 18 octobre 2026**  
> **Statut :** décisions fonctionnelles du brainstorming Mary (BMAD Analyst) consolidées et validées par l'utilisateur. Le MVP et la plupart des choix techniques restent à définir ; **Bootstrap 5 a déjà été retenu comme framework CSS**.  
> **Objectif :** point d'entrée durable pour les nouvelles conversations ChatGPT et les agents BMAD ; **ne remplace pas** le Product Brief, le PRD, l'architecture ou Jira.

## 1. Documents à lire en priorité

| Ordre | Document | Objet |
| --- | --- | --- |
| 1 | **Ce fichier** — `docs/PROJECT-CONTEXT.md` | Vision, contraintes, état du projet et liens |
| 2 | **[DECISIONS-FONCTIONNELLES.md](./DECISIONS-FONCTIONNELLES.md)** | Registre chronologique et exhaustif des **122 décisions F-01 à F-122**, états et décisions remplacées |
| 3 | **[CADRAGE-FONCTIONNEL.md](./CADRAGE-FONCTIONNEL.md)** | Règles fonctionnelles détaillées et points restant à arbitrer |

**Important :** le présent contexte initial portait sur F-01 à F-10. La suite F-11 à F-111 a été actée pendant les échanges de brainstorming. Les trois documents ci-dessus sont désormais le référentiel de reprise avant la rédaction du Product Brief / PRD.

## 2. Vision du produit

**Scrum Master Notebook (SMN)** est un **carnet de bord professionnel** dédié aux **Scrum Masters (SM)** et **Release Train Engineers (RTE)**. Il centralise le suivi d'équipes Agile et d'Agile Release Trains (ART), les événements et calendriers, les chiffres et objectifs des périodes, les risques, obstacles, dépendances, décisions, actions, faits marquants, analyses humaines et IA.

La finalité est de **préparer, expliquer et produire à la demande des reportings complets et contextualisés pour les parties prenantes**, avec **le moins de saisie manuelle possible**. Le SM/RTE est le principal utilisateur et responsable des données ; **SMN n'est pas un outil collaboratif partagé avec les membres des équipes**, ni un nouvel outil de suivi des tickets.

## 3. Principes fondamentaux validés

### 3.1 Organisation Scrum / Kanban / SAFe

- L'initialisation choisit **Scrum, Kanban ou SAFe**. Ce choix est fixe pour l'installation, sauf réinitialisation complète volontaire (F-41/F-42/F-49).
- **Scrum** : Sprints, objectifs, cérémonies et KPI adaptés.
- **Kanban autonome** : périodes de reporting **mensuelles par défaut**, objectifs de période, indicateurs de flux, Daily, affinages, rétrospectives, démonstrations à la demande ; pas d'engagement ni de Sprint Planning artificiels.
- **SAFe** : un ART réunissant des équipes **Scrum et/ou Kanban**. **La cadence de l'ART s'impose à toutes les équipes**. Par défaut, un PI comporte **cinq itérations de durée égale, dont la dernière est une IP Iteration** (F-50).
- Un RTE dispose d'un cockpit PI, d'un **calendrier consolidé ART** qu'il peut modifier, et d'un accès détaillé aux équipes.

**Ne plus reprendre l'ancienne formulation « Scrum ou SAFe seulement »** : les décisions initiales F-02/F-03 sont remplacées/étendues par F-49.

### 3.2 Équipes et capacité

- Membres **définis centralement**, pouvant intervenir dans plusieurs équipes, pays et fuseaux horaires ; calendriers, absences, temps partiels, jours fériés et fermetures d'entreprise.
- Rôles Agile **propres à chaque équipe**, cumulables, pourcentages d'activité modifiables d'une période à l'autre ; référentiels de rôles administrables.
- Capacité de **développement**, en **jours/homme (JH)** uniquement : disponibilité contractuelle × affectation à l'équipe × part du rôle Développeur × coefficient de contribution.
- La somme des affectations simultanées aux équipes ne peut dépasser **100 %** du temps contractuel ; les parts des rôles d'une même affectation/période doivent totaliser **100 %**.
- **Aucune déduction automatique du temps des cérémonies** ; marge de planification indépendante.
- Capacité initiale prévue et réelle conservées pour chaque période ; **pas de conversion SP ⇄ JH**.

### 3.3 Calendrier et cérémonies

- Génération automatique des périodes et événements à partir de valeurs **administrables** : dates, heures, durées, récurrences, fuseaux de référence équipe/ART.
- Distinction **date prévue / date réelle**, possibilité de reporter/annuler, d'éditer une occurrence ou toutes les suivantes.
- **Daily générés et présumés tenus**, sauf exception ; pas de Daily quand toute l'équipe est collectivement non travaillante ; alerte non bloquante si une partie l'est.
- Pour les autres cérémonies, **conserver et alerter** en cas de jour collectivement non travaillé ; **ne pas vérifier les absences individuelles pour les conflits de cérémonie**.
- Cérémonies adaptées à Scrum, Kanban et SAFe (notamment PI Planning et Inspect & Adapt) ; réunions personnalisées dont affinages.
- Préparer supports avant réunion, synthèses/décisions/actions après réunion ; ne pas saisir intégralement le contenu d'une rétrospective.

### 3.4 KPI, objectifs et clôture

- **Tous les indicateurs chiffrés sont facultatifs** dans les trois modes (F-72), sans blocage des périodes ou des rapports. Absence de valeur ≠ zéro.
- Scrum : SP **initiaux / ajoutés / retirés / terminés**, bilan du périmètre et vélocité ; SP non terminés **jamais ajoutés automatiquement** au Sprint suivant.
- Kanban : métriques de flux consolidées (débit, WIP, blocages, Cycle Time, Lead Time, etc.), également facultatives.
- Plusieurs objectifs par Sprint, période Kanban ou PI, évalués **individuellement**. En **SAFe**, les objectifs PI sont **uniquement au niveau ART** ; les équipes les déclinent en objectifs de Sprint/période, avec rattachement **facultatif**.
- Les objectifs non/partiellement atteints ne sont reconduits **que manuellement**.
- **Clôture manuelle**, aucune métrique obligatoire, nouvelle période possible malgré la précédente non clôturée ; PI clôturable malgré les bilans d'équipes en retard. **Réouverture et recalcul sélectif des KPI** possibles après clôture.
- Source, calcul et instant des KPI consultables ; imports **CSV de données numériques consolidées à format fixe**, sans import de tickets individuels. Intégration automatique Jira reportée.

### 3.5 Suivi qualitatif et points d'attention

- Registres historisés de **risques ROAM**, **obstacles**, **dépendances**, **décisions** et **actions**, fiches uniques partagées, liens croisés et avec objectifs, pérennité au-delà d'une période.
- ROAM pour **tous les modes**, avec probabilité/impact facultatifs et criticité calculable quand renseignés.
- Risque matérialisé → création assistée d'obstacle, cycles indépendants ; décision → création assistée d'actions.
- États simples avec annulation, résolution et réouverture lorsque approprié ; traçabilité des arbitrages et décisions remplacées.
- Cockpit **« Points d'attention »** avec objectifs exposés, actions/dépendances à échéance proche ou en retard, périodes à clôturer ; **seuil commun de 3 jours calendaires par défaut**, administrable, alertes non bloquantes et sans notification externe.
- **Journal des faits marquants**, alimentation automatique **configurable** et compléments manuels, distinct de l'historique exhaustif.

### 3.6 Reporting et IA

- **Reporting à tout moment**, sur période ouverte ou clôturée, sélection de contenus et profondeur historique, modèles réutilisables, prévisualisation.
- Formats **PDF, PPTX, DOCX, XLSX, HTML**, à séquencer dans le MVP.
- Reporting ART : synthèse globale qualitative et métriques propres aux équipes ; **ne pas additionner les SP entre équipes**, ni mélanger des indicateurs non comparables.
- Analyses humaines (SM/RTE) et IA **historisées comme données dans SMN**, consultables, éditables et supprimables ; l'origine IA et les modifications humaines sont identifiées.
- **Brief IA = reporting textuel TXT** généré depuis le même moteur, contenant **données consolidées et contexte qualitatif d'équipe/ART**, **aucune donnée individuelle de membre**.
- Modèles de briefs administrables. **Prévisualisation et enrichissement** avant archivage, texte exact conservé en fichier plat **immuable**, rejouable ou duplicable.
- Analyses IA historiques **exclues par défaut** des nouveaux briefs ; inclusion optionnelle. Une analyse IA à la fois par brief, supprimable **sans supprimer le TXT**.
- **Échange avec IA manuel pour la première version** : transmettre le TXT à l'IA choisie puis copier-coller la réponse dans SMN ; **pas d'intégration API IA exigée** au MVP.

### 3.7 Langues, thèmes et première installation (F-112 à F-115)

- **Français et anglais dès le MVP**, i18n prise en compte dans la conception ; futures langues via nouvelles User Stories.
- **Bootstrap 5 choisi pour le CSS**, personnalisation via variables CSS, palettes sélectionnables, modes clair/sombre.
- **Assistant au premier lancement** pour configurer les principaux paramètres par défaut ; saisie réduite et réglages modifiables ensuite, hors mode Scrum/Kanban/SAFe (règle de réinitialisation).
- Le contenu éditorial métier multilingue et la langue des exports restent à spécifier.

### 3.8 Projet/produit, vision, Product Goal, DoD et DoR (F-116 à F-122)

- **Un produit unique et fixe par installation SMN**, quel que soit le mode (F-121/F-122). Les équipes autonomes d'une même installation partagent ce produit ; en SAFe, le produit commun est celui de l'ART. **Pour changer de produit, créer une nouvelle installation**, sans réaffectation du produit dans l'installation existante.
- **Vision du produit** et **Product Goal** provenant généralement du PO, saisissables/historisables par SM/RTE et sélectionnables dans les rapports.
- **DoD** et **DoR** conservables dans SMN sous forme de texte complet ou de lien documentaire externe (ex. SharePoint).
- **En SAFe : une seule DoD et une seule DoR définies au niveau ART, communes à toutes les équipes du train** ; hors SAFe, niveau équipe.
- Présentation **optionnelle en fin de rapport** à titre informatif : texte ou lien. Une URL SharePoint ne garantit pas la version historique d'un document.

## 4. Ce qui reste à concevoir (ne pas traiter comme validé)

- Périmètre **MVP**, découpage des releases, niveaux de priorité.
- Architecture, hébergement, technologies backend/frontend JS et schéma de base de données ; **seul Bootstrap 5 est arrêté pour le CSS**.
- Liste officielle des rôles, cérémonies et paramètres de durée selon les référentiels ; vérifier avant validation définitive.
- Définition précise des KPI, seuils de criticité, données obligatoires structurelles et conventions Kanban.
- Schémas CSV SMN, source des jours fériés, sauvegardes et droits d'accès.
- Charte graphique des rapports, modèles d'export, détails des fichiers TXT et politiques de sécurité/rétention.
- Produit unique et fixe par installation **déjà validé** (F-121/F-122) ; modalités techniques d'une nouvelle installation indépendante, versions des documents SharePoint et langue des contenus libres et rapports à préciser.
- Palettes finales, accessibilité et étapes détaillées de l'assistant d'installation.
- Prochains arbitrages listés dans **[CADRAGE-FONCTIONNEL.md §14](./CADRAGE-FONCTIONNEL.md#14-points-ouverts-et-besoins-de-précision-pour-product-brief-et-prd)**.

## 5. Référentiels et méthode de travail

| Domaine | Référence |
| --- | --- |
| Code, architecture, BMAD et documentation | [GitHub — JeanLamora75/SMN](https://github.com/JeanLamora75/SMN) |
| Epics, User Stories, bugs et tâches | [Jira — SMN](https://lmn24.atlassian.net/jira/software/projects/SMN) |
| Méthode | **BMAD Method v6.12.4** |
| Skills | `.agents/skills/` |
| Configuration | `_bmad/` |
| Livrables planification | `_bmad-output/planning-artifacts/` |
| Livrables implémentation | `_bmad-output/implementation-artifacts/` |
| Documents de référence | `docs/` |
| Langue des échanges et livrables | **Français** |

Le projet utilise BMAD via **ChatGPT et ses connecteurs**, en lisant les `SKILL.md` depuis GitHub. Le fait d'avoir installé des skills orientés Codex **ne signifie pas que Codex CLI est installé**.

## 6. Contraintes de développement

- Poste **Windows 11** d'entreprise, sans droits administrateur.
- Pas de VS Code, d'IDE supplémentaire ni de Codex CLI à installer.
- Outils disponibles : **Node.js, npm, pnpm, PowerShell, GitHub Desktop**.
- Adaptations des workflows BMAD possibles via connecteurs ; ne **jamais prétendre** avoir exécuté une commande, un test, une validation ou un script BMAD non exécuté.
- Interdiction de publier secrets et configurations personnelles telles que `config.user.toml`.

## 7. Conventions de collaboration

1. Au démarrage d'une nouvelle mission, lire **les trois documents de la section 1** ainsi que le `SKILL.md` de l'agent BMAD sollicité.
2. Séparer **faits vérifiés**, **règles acceptées**, **hypothèses**, **propositions** et **questions ouvertes**.
3. Réutiliser les décisions existantes ; citer leurs **F-xx** lorsqu'on spécifie une fonction, une Story ou une architecture.
4. Jira est la référence des tickets ; avant toute création/modification de Story : besoin + critères d'acceptation + dépendances/impacts + autorisation de l'utilisateur, sauf mandat explicite contraire.
5. Consulter le code existant avant modification ; privilégier branche dédiée et Pull Request ; ne pas déclarer une fonctionnalité « terminée » sans vérification.
6. Les agents ne doivent **pas introduire implicitement** de nouvelles exigences en extrapolant une recommandation.
7. Lors des reprises de conversation, **les documents versionnés sont la référence**, non la mémoire implicite.
8. Ne pas lancer de recherche web avancée sans accord préalable de l'utilisateur.

## 8. État du projet au 18 octobre 2026

- Dépôt GitHub SMN et projet Jira SMN créés.
- BMAD Method v6.12.4 installé avec les skills dans `.agents/skills/`, exploitation prévue depuis ChatGPT.
- **Brainstorming fonctionnel consolidé en 122 décisions F-01 à F-122** et document thématique détaillé dans `docs/`.
- **Product Brief, PRD, architecture applicative et backlog détaillé restent à produire** à partir des arbitrages, selon les workflows BMAD.
- Cette consolidation documentaire **ne constitue ni un développement, ni une création de tickets Jira, ni une validation technique de l'application**.

## 9. Maintenance

À chaque nouvelle décision structurante : mettre à jour **[le registre](./DECISIONS-FONCTIONNELLES.md)** et **[le cadrage détaillé](./CADRAGE-FONCTIONNEL.md)**, puis ajuster le présent document uniquement si la vision, les règles cardinales, les liens ou l'état du projet changent. Conserver ce fichier comme **index synthétique et durable**.
