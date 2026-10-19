# SMN — Recette et finalisation du MVP : exigences détaillées

**Statut :** cadrage fonctionnel approuvé le 19 octobre 2026 ; **aucun essai du MVP ni passage au pilote n'est déclaré réalisé**.  
**Références :** [PRD principal](prd.md), section 7 et FR-74 à FR-81 ; **D-PRD-129** — validation groupée **REC-01 à REC-08**.  
**Portée :** MVP Scrum et Kanban, éventuellement dans **deux installations distinctes** puisque le mode Agile et le produit de référence sont fixes par installation (F-41/F-49/F-121/F-122). Les fonctions SAFe/ART relèvent de la version 1.0 et ne constituent pas un prérequis à la recette du MVP.

## 1. Conditions métier de succès déjà validées — inchangées

Le **passage au pilote** exige **cumulativement** les cinq conditions de la section 7 du PRD, qui ne sont ni remplacées ni abaissées par REC-01 à REC-08 :

1. **Trois Sprints complets au minimum et un cycle de reporting Kanban réalisés en conditions réelles**. Scrum et Kanban peuvent être exercés dans des installations séparées, sans changer le mode d'une installation existante.
2. **Rapport complet de fin de Sprint produit en moins de 30 minutes**, avec tendances consultables sans reconstruction manuelle.
3. **Saisie courante entre 15 et 30 minutes par semaine, plafonnée à 30 minutes**, mesurée **indépendamment** de la production du rapport final et **hors reprise historique exceptionnelle**. La méthode d'échantillonnage reste à préciser, pas les valeurs cibles.
4. **Tendances fiables**, y compris lorsque des Sprints ont été **rétrosaisis**, sans confondre valeur absente et zéro.
5. **Rapports HTML et PDF exploitables**, sans anomalie bloquante.

Ces conditions sont **des objectifs de recette**, pas la preuve d'un résultat atteint. Il faut recueillir des observations et en conserver les preuves avant toute décision de passage au pilote. La recette Kanban ne doit pas être remplacée par une simple démonstration Scrum.

## 2. Exigences et critères d'acceptation détaillés

### FR-74 / REC-01 — Associer exigences, scénarios et résultats de recette

**Besoin :** établir ce qui est réellement couvert et éviter une simple déclaration générale de conformité au PRD.

**Critères d'acceptation :**
1. Chaque exigence **applicable au MVP** dispose d'au moins un **scénario vérifiable** avec préconditions, données utilisées, action, résultat attendu et référence de l'exigence ; les FR et les décisions associées restent identifiables.
2. Une matrice de couverture distingue les exigences **Scrum**, **Kanban** et **communes** ; les fonctions **SAFe/ART version 1.0** sont marquées hors périmètre du MVP, sans être assimilées à des défauts de couverture.
3. Chaque scénario dispose d'un état de réalisation **Non exécuté / Réussi / Échoué / Bloqué / Non applicable**, d'une date et d'une référence de preuve si exécuté ; **Non exécuté** ne peut jamais compter comme **Réussi**.
4. Un échec ou un blocage est relié à une anomalie, une décision de correction et une nouvelle exécution vérifiable ; les tests automatisés, s'ils existent, ne dispensent pas du contrôle des parcours métier essentiels.
5. Les règles importantes (champs facultatifs, protection des cycles clôturés, écriture atomique, dates et historicité) font l'objet de **scénarios positifs et négatifs** lorsque leurs conséquences le justifient.
6. Le format de matrice, l'outil de gestion et la répartition tests manuels/automatisés seront précisés ultérieurement ; **aucun outil ou script d'exécution n'est présumé opérationnel** par cette exigence.

### FR-75 / REC-02 — Vérifier les parcours Scrum et Kanban de bout en bout

**Critères d'acceptation :**
1. Pour **Scrum**, disposer d'au moins un parcours complet traçable : initialisation et paramétrage, équipe/membres, calendrier et absences, Sprint généré à la demande, événements, objectif, métriques/capacité, registres, bilan, clôture puis rapport HTML/PDF.
2. Pour **Kanban**, disposer d'un parcours distinct : initialisation Kanban, cadence et périodes générées à la demande, contexte d'équipe/calendrier, indicateurs de flux, registres, bilan de période, clôture puis rapport HTML/PDF, **sans introduire de cérémonies Scrum obligatoires**.
3. Tester le fonctionnement des **créations par lot**, chevauchements, ajustements de dates, sauvegardes indépendantes des blocs, statuts des événements et protections historiques dans le ou les modes où ces règles s'appliquent.
4. Réaliser les vérifications sur **deux installations distinctes si nécessaire**, compte tenu du **mode Agile fixe** : le test ne doit pas exiger de passer l'installation Scrum en Kanban ou inversement.
5. Les limites de périmètre sont explicites : **pas de fonctionnalités ART/PI à prouver au MVP**, pas d'intégration automatique Jira ou IA à simuler comme existante.
6. Pour chaque parcours testé, conserver la référence des données d'essai, la version applicative, les étapes réalisées et les anomalies constatées.

### FR-76 / REC-03 — Mesurer objectivement les cinq conditions de succès

**Critères d'acceptation :**
1. Un **protocole daté** définit avant évaluation les observations attendues, le **chronométrage**, les preuves et les modalités de calcul/validation des **cinq conditions cumulatives** de la section 7, sans modifier leurs seuils.
2. Les résultats incluent **au moins trois Sprints complets et un cycle de reporting Kanban en conditions réelles** ; chaque cycle est identifié par son périmètre, ses dates, sa clôture et la preuve du reporting.
3. Le temps de **production d'un rapport complet de fin de Sprint** est enregistré séparément, depuis le début du parcours défini jusqu'au **livrable prêt à être partagé**, et comparé à l'exigence **strictement inférieure à 30 minutes** ; l'accès aux tendances ne doit pas nécessiter de consolidation manuelle hors outil.
4. Le temps de **saisie courante** est relevé **par semaine**, indépendamment du reporting final et de la reprise historique exceptionnelle, et rapproché de la cible **15 à 30 minutes par semaine, maximum 30 minutes** ; les semaines observées et les exceptions sont documentées plutôt que masquées.
5. La **fiabilité des tendances et reprises historiques** est évaluée sur des exemples contrôlés, et les rapports HTML/PDF sont examinés pour leur caractère exploitable et l'absence d'anomalies bloquantes.
6. Chaque condition dispose d'un état **Atteinte / Non atteinte / Non démontrée**, accompagné des mesures et preuves. **Non démontrée ne vaut pas Atteinte** ; le passage au pilote ne peut être déclaré validé si l'une des cinq conditions n'est pas démontrée.
7. La population d'observation, la variété des situations couvertes, le nombre de rapports chronométrés et l'outillage de mesure seront définis dans le protocole, **sans inventer maintenant un nombre de mesures supplémentaire déjà approuvé**.

### FR-77 / REC-04 — Recetter les données historiques et leurs limites

**Critères d'acceptation :**
1. Tester pour les champs concernés les cas **valeur connue, estimée, non renseignée, zéro explicitement saisi, donnée manuelle, donnée calculée et import CSV** ; vérifier leur **restitution distincte** dans les écrans, tendances, HTML/PDF et TXT autorisés.
2. Tester la création et consultation d'un **Sprint rétrosaisi**, l'import CSV **prévisualisé**, les lignes invalides et les conflits de valeurs, sans import de tickets Jira individuels ni valeur inventée.
3. Vérifier les corrections autorisées et interdites d'un cycle **ouvert, terminé, clôturé puis rouvert**, avec conservation de la capacité initiale figée, des contrôles de chevauchement et des valeurs manuelles prioritaires.
4. Vérifier que les graphiques respectent **la borne historique du cycle interrogé** et la limite de **cinq cycles clôturés au plus**, sans point à zéro en l'absence de valeur et sans addition de mesures non comparables.
5. Vérifier les **instantanés qualitatifs de clôture** pour les six registres selon les règles disponibles, et le comportement explicite en cas d'**instantané passé absent**, sans attribuer l'état actuel de la fiche à une ancienne clôture.
6. Après correction historique, contrôler que les **anciens PDF/TXT figés ne sont pas réécrits**, et que les modifications autorisées sont historisées. Les règles fines encore ouvertes (reclôture, CSV exact, données antérieures indisponibles) doivent être **arbitrées avant d'affirmer la couverture des scénarios correspondants**.

### FR-78 / REC-05 — Vérifier les livrables HTML/PDF et les briefs IA TXT

**Critères d'acceptation :**
1. Générer un rapport **HTML** avec le **modèle standard à six sections** et variantes configurées, le prévisualiser puis exporter un **PDF fidèle aux données et sélections** (FR-26 à FR-33). Contrôler la pagination et la lisibilité, sans exiger des rendus pixel pour pixel identiques.
2. Tester un rapport de **cycle non clôturé** identifié comme provisoire et un rapport de **cycle clôturé** utilisant les historiques autorisés ; vérifier langue des libellés **FR/EN** sans traduction automatique des textes libres.
3. Vérifier l'exclusion par défaut des **absences nominatives et données personnelles inutiles** dans les rapports partagés, et le respect des options de sélection de contenus.
4. Produire un **brief IA TXT plat** depuis le contexte du cycle, sélectionner un modèle, prévisualiser, relire et approuver sa confidentialité, puis **archiver le TXT exact immuable** ; aucune donnée individuelle de membre ni transmission API automatique.
5. Tester la **duplication d'un brief**, le **copier-coller manuel** d'une réponse IA, la règle **une seule analyse IA par brief**, la retouche humaine signalée, et la conservation du TXT après suppression de l'analyse.
6. Vérifier que les **analyses IA insérées volontairement dans un rapport** sont **identifiées comme interprétations**, jamais comme mesures source. Vérifier également les erreurs d'export et le fait qu'aucun résultat partiel n'est déclaré livrable réussi.

### FR-79 / REC-06 — Tester la résilience, les accès et les opérations sensibles

**Critères d'acceptation :**
1. Vérifier que les **pages, ressources et actions non publiques** résistent aux accès non autorisés, y compris l'utilisation d'une URL directe ou d'un identifiant de fichier privé (FR-66) ; les mécanismes d'identité précis relèvent de l'architecture.
2. Recetter la **sauvegarde complète et la restauration contrôlée** des données, historiques et documents réellement stockés, avec comparaison des éléments restaurés et gestion explicite d'une restauration échouée.
3. Tester des **erreurs de validation, interruptions et échecs d'import/export**, ainsi que les cas non conformes (doublons, cycles chevauchants et fichiers invalides), sans faux succès.
4. Vérifier le **tout-ou-rien** de la génération atomique d'un lot de cycles et d'une **replanification avec ses événements, capacités et audit**, y compris un échec simulé pendant l'opération lorsque l'environnement de recette le permet.
5. Vérifier que l'**archivage**, la **suppression** et la **réinitialisation complète** présentent leurs conséquences et confirmations ; la création d'une nouvelle installation n'efface pas l'ancienne.
6. Examiner la **non-divulgation de secrets** dans messages, journaux, exports et configurations publiées. Aucun mécanisme de sauvegarde, chiffrement, déploiement ou test de sécurité non effectivement réalisé ne doit être déclaré validé.
7. Les contraintes mesurables (disponibilité, RPO/RTO, performance) et méthodes d'essai techniques sont à définir **avant l'acceptation technique**, sans leur inventer des seuils à ce stade.

### FR-80 / REC-07 — Constituer une matrice de compatibilité et d'accessibilité

**Critères d'acceptation :**
1. La recette comprend des parcours sur **ordinateur, tablette et smartphone**, dans un **navigateur**, pour les fonctions essentielles : installation, tableau de bord, calendrier, bilans, registres, rapports, briefs et administration nécessaire.
2. Les composants doivent être vérifiés en **français et en anglais**, avec **thèmes clair/sombre** et palettes pertinentes, sans perdre ni cacher une action métier indispensable.
3. Tester la **navigation clavier**, les libellés et messages d'erreur, les interactions sans dépendance à une couleur unique, le parcours des formulaires et les états de focus, conformément aux exigences UX et au niveau d'accessibilité qui sera défini.
4. La matrice enregistre les **navigateurs/versions, tailles d'écran ou appareils de référence, langues, thèmes, scénarios, résultats et anomalies**. Les combinaisons effectivement exécutées sont distinguées de celles non exécutées.
5. Les **versions minimales de navigateur, tailles de référence, niveau WCAG cible et seuils de performance** restent à décider dans le plan de recette/architecture. **Aucune conformité WCAG mesurée ni couverture exhaustive de plateformes n'est déclarée par cette validation fonctionnelle**.
6. L'ergonomie des tableaux, graphiques et calendriers sur support étroit doit permettre la lecture des informations et les actions principales ; les éventuelles exceptions identifiées sont explicitées avant une décision de pilote.

### FR-81 / REC-08 — Statuer formellement sur la préparation et le passage au pilote

**Critères d'acceptation :**
1. Une **checklist de préparation au pilote** consolide la couverture FR du MVP, la matrice des scénarios, les anomalies ouvertes et leur criticité, les résultats de restauration/sécurité, les contrôles HTML/PDF/TXT, les compatibilités et les **cinq conditions cumulatives** de succès.
2. Chaque condition ou contrôle porte un état **Satisfait / Non satisfait / Non démontré / Non applicable si et seulement si hors périmètre** ; un **contrôle applicable non exécuté** ne doit pas être masqué comme « Non applicable ».
3. Les **anomalies bloquantes ouvertes** interdisent de présenter le MVP comme prêt ; les anomalies non bloquantes restantes font l'objet d'une **liste explicite, d'un traitement prévu et d'une appréciation du risque**.
4. La décision de passage au pilote nécessite une **validation humaine explicite de l'utilisateur ou responsable habilité**, datée, avec référence au périmètre/à la version et aux preuves examinées.
5. Si l'une des cinq conditions métier déjà actées n'est pas **démontrée atteinte**, ou si des anomalies bloquantes subsistent, le résultat est **« Non prêt pour pilote » ou « Décision suspendue »**, sans confondre objectif, validation documentaire et succès observé.
6. La diffusion plus large après le pilote **ne découle pas automatiquement** de la validation MVP. Elle exige une nouvelle décision fondée sur les retours et l'usage réel, conformément à la stratégie produit.
7. Le format de compte rendu, le classement précis des sévérités et les preuves exigées par type de scénario seront fixés dans le plan de recette et la gouvernance du projet ; aucun passage au pilote n'est effectué ou autorisé par la seule signature de D-PRD-129.

## 3. Livrables de recette attendus (formats à définir)

- **Matrice de traçabilité** : exigence FR, mode, scénario(s), résultat(s), anomalie(s), preuve(s), date et version.
- **Protocoles des cinq conditions cumulatives** : méthode de mesure, échantillon, chronométrages, résultats bruts et conclusion par condition.
- **Jeux de données de test** : Scrum et Kanban (éventuellement installations distinctes), historiques manquants, valeurs nulles, import invalides, cas de clôture/rouverture, données nominatives exclues.
- **Journal d'anomalies** et retests, notamment pour les protections métier et les opérations atomiques.
- **Matrice de compatibilité**, contrôles de sécurité/restauration et preuves d'export HTML/PDF/TXT.
- **Checklist et procès-verbal de décision de pilote**, conservant aussi les cas non démontrés.

## 4. Hors portée de la validation REC-01 à REC-08

- Ne sont **pas** déclarés terminés : développement, création du backlog Jira, exécution de scripts, tests manuels/automatisés, essais réels de trois Sprints, cycle Kanban, chronométrages, évaluation de sécurité, restauration, conformité WCAG, décision de pilote ou lancement du pilote.
- Aucun outil de tests, cadence d'essai, nombre de scénarios total, seuil de navigateur, cible WCAG ou mesure de disponibilité n'est validé sans arbitrage ultérieur.
- La conformité des fonctions **SAFe v1.0** sera traitée lors d'une recette **distincte**, sans la présenter comme résultat du MVP Scrum/Kanban.

**Traçabilité :** D-PRD-129 (REC-01 à REC-08), D-PRD-001, D-PRD-071/074, D-PRD-076 à D-PRD-086, D-PRD-101/118/119, D-PRD-122 à D-PRD-128 ; F-14/F-16/F-19/F-24/F-25/F-71/F-72/F-91 à F-109/F-112 à F-115/F-121/F-122 ; FR-1 à FR-73, NFR-1 à NFR-3. Les cinq conditions de succès de la **section 7 du PRD** demeurent prioritaires et inchangées.
