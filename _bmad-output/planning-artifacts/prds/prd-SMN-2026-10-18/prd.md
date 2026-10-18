---
title: "PRD — Scrum Master Notebook (SMN)"
status: draft
created: 2026-10-18
updated: 2026-10-18
workflow: bmad-prd
intent: Create
working_mode: Coaching
language: fr
---

# PRD — Scrum Master Notebook (SMN)

> **Statut : brouillon initial — non approuvé.** Document de travail construit progressivement avec John (Product Manager). Les décisions F-01 à F-124 et le Product Brief approuvé sont des références actées ; les arbitrages supplémentaires devront être validés par l'utilisateur. Aucun détail technique non décidé n'est présenté comme une exigence.

## 0. Objet et références du document

Ce PRD précisera les capacités, exigences fonctionnelles (FR), exigences non fonctionnelles (NFR), parcours utilisateurs (UJ), limites de livraison et critères de succès (SM) permettant de préparer les travaux BMAD d'architecture, d'UX et de découpage en Epics et User Stories. Les FR auront des identifiants stables et des références explicites aux décisions F-xx. Les décisions complémentaires intervenues pendant le PRD reçoivent un identifiant D-PRD-xxx, consigné dans le journal BMAD. Le détail d'implémentation relève d'un addendum ou des travaux d'architecture.

Références fonctionnelles sur `main` :
- [Contexte du projet](../../../../docs/PROJECT-CONTEXT.md)
- [Registre F-01 à F-124](../../../../docs/DECISIONS-FONCTIONNELLES.md)
- [Cadrage fonctionnel](../../../../docs/CADRAGE-FONCTIONNEL.md)

Product Brief approuvé le 18/10/2026 et journal BMAD : `_bmad-output/planning-artifacts/briefs/brief-SMN-2026-10-18/`, actuellement dans la branche `docs/bmad-product-brief-smn-20261018` ([PR #7](https://github.com/JeanLamora75/SMN/pull/7), ouverte lors de l'initialisation du PRD).

## 1. Vision — socle validé

Scrum Master Notebook (SMN) est un carnet de bord professionnel destiné au Scrum Master puis au Release Train Engineer. Il réunit la mémoire quantitative et qualitative du fonctionnement des équipes Agile afin de préparer et produire des reportings contextualisés, explicables et partageables à la demande, avec un effort de saisie réduit.

Le problème métier réunit trois difficultés : le temps nécessaire à la préparation du reporting, la dispersion des informations et la difficulté de restituer aux parties prenantes une vision cohérente des résultats, événements et décisions. SMN réutilise l'historique plutôt que de demander de reconstruire les tendances manuellement.

**Trajectoire validée :** MVP Scrum + Kanban en usage personnel ; version 1.0 avec SAFe et ART ; expérimentation pilote uniquement après satisfaction des cinq conditions cumulatives du Product Brief ; diffusion plus large conditionnée à l'usage observé.

**Plateforme validée (D-PRD-001, 18/10/2026) :** application web accessible depuis un navigateur ; interface responsive sur ordinateur, tablette et smartphone **dès le MVP**. Cette décision ne fixe ni les technologies frontend/backend, ni un fonctionnement hors connexion, ni une application native.

## 2. Utilisateurs et besoins — socle validé

**Utilisateur opérateur :** Scrum Master pour le MVP ; RTE pour les usages SAFe de la version 1.0. Les membres de l'équipe et les destinataires des rapports ne sont pas chargés d'alimenter SMN.

**Besoins :** disposer d'une mémoire cohérente de la vie des équipes ; gérer les périodes, objectifs, événements et chiffres disponibles ; enregistrer les six registres qualitatifs ; conserver et reprendre les périodes passées ; expliquer les tendances ; obtenir rapidement un rapport partageable.

**Parcours de référence MVP validé :** initialiser le produit et l'équipe → préparer une période Scrum ou Kanban → suivre données, événements et informations qualitatives → dresser le bilan et clôturer manuellement → produire un rapport. L'écriture détaillée des UJ et de leurs cas limites sera travaillée en mode Coaching, sans inventer de parcours utilisateur déjà observé.

**Initialisation — décisions D-PRD-002 et D-PRD-003 :** l'utilisateur peut choisir une initialisation Express (minimum indispensable) ou une initialisation Guidée/Tutorée. Les deux aboutissent au tableau de bord à la fin du parcours. Les éventuelles configurations complémentaires proposées dans le parcours guidé ne modifient pas les champs minimaux et les règles de configuration F-114, F-123 et F-124. L'illustration d'un UJ détaillé reste à co-construire.

## 3. Glossaire initial

- **Installation SMN :** instance dédiée à un seul produit de référence, dont l'identité reste fixe ; le mode Scrum, Kanban ou SAFe y est également fixe.
- **Produit de référence :** produit suivi par l'installation, pouvant porter une vision et un Product Goal historisés.
- **Équipe :** collectif Scrum ou Kanban associé au produit de référence.
- **Membre :** personne référencée une seule fois dans l'installation et pouvant être affectée à plusieurs équipes, avec un historique de disponibilité et de participation (F-26 à F-31). Sa fiche centrale peut inclure une adresse e-mail (D-PRD-008).
- **Fiche provisoire :** membre créé lors de l'ajout rapide, doté d'un nom provisoire modifiable, d'une date d'arrivée d'affectation initialisée et d'un rôle Agile proposé, puis enrichissable ultérieurement (D-PRD-007, D-PRD-009).
- **Date d'arrivée dans une équipe :** date de début effective de l'affectation d'un membre à cette équipe, indépendante de la date de création de sa fiche centrale et des dates de ses autres affectations (D-PRD-009).
- **Affectation :** rattachement daté d'un membre à une équipe ; y mettre fin ne supprime ni sa fiche centrale ni ses affectations dans d'autres équipes.
- **Archivage de membre :** retrait réversible d'une fiche de membre de l'utilisation courante, tout en conservant les données métier et historiques liées.
- **Période :** Sprint en Scrum ou période de reporting en Kanban autonome (mensuelle par défaut).
- **JH :** jour/homme, unité de capacité de développement ; distincte des Story Points.
- **Registres qualitatifs :** risques, obstacles, dépendances, décisions, actions et faits marquants.
- **Rapport :** restitution datée, contextualisée, sur période ouverte ou clôturée.
- **Initialisation Express :** parcours d'installation limité aux informations nécessaires pour créer l'installation, le produit et la première équipe, avec les valeurs par défaut pertinentes.
- **Initialisation Guidée/Tutorée :** parcours d'installation avec accompagnement et explications, permettant d'enrichir le paramétrage au-delà du minimum d'installation.
- **Tableau de bord :** écran d'accueil de l'équipe après initialisation et point d'accès à la configuration restante.
- **Tâche de configuration :** élément facultatif de la liste de paramétrage du tableau de bord, distinct des actions métier ; états À faire, Terminée et Ignorée (D-PRD-004).

## 4. Fonctionnalités et exigences fonctionnelles

Les groupes ci-dessous constituent le **plan de travail** du PRD. Les exigences fonctionnelles sont désormais numérotées globalement (FR-1 et suivantes) au fil de leur validation ; les groupes non détaillés sont à approfondir.

| Groupe à spécifier | Principales références |
| --- | --- |
| Initialisation, produit unique, équipe, paramètres | F-01, F-05, F-41, F-49, F-112 à F-124 |
| Interface web responsive, adaptée aux trois familles d'écrans | D-PRD-001, F-112 à F-115 |
| Membres, calendriers, disponibilités, capacité | F-26 à F-39, F-53, F-58 à F-63 |
| Périodes, événements, Daily et préparation des cérémonies | F-06, F-07, F-20 à F-23, F-43 à F-57, F-91 à F-96 |
| Objectifs, KPI et imports de valeurs consolidées | F-08, F-14, F-16, F-19, F-64 à F-72 |
| Six catégories qualitatives, historique et points d'attention | F-11 à F-13, F-74 à F-90, F-110, F-111 |
| Reprise rétrospective des Sprints et tendances | Product Brief, F-14, F-24, F-25, F-64, F-72, F-91 à F-96 |
| Reportings HTML/PDF, modèles et contextualisation | Product Brief, F-10, F-15, F-24, F-25, F-97, F-117 à F-120 |
| Briefs TXT IA et analyses historiques | F-98 à F-109 |
| Extensions SAFe / ART de la version 1.0 | F-17, F-18, F-40, F-47, F-49 à F-52, F-67, F-68, F-73, F-94, F-95, F-119 |

### 4.1 Initialisation du produit et de l'équipe — MVP

**Description :** au premier lancement, le SM renseigne les informations minimales requises (choix du mode Scrum ou Kanban avec explication, nom de la première équipe, nom du produit de référence), avec des valeurs par défaut pour les autres paramètres. Le mode SAFe demeure prévu pour la version 1.0. Le SM peut choisir un parcours Express ou un parcours Guidé/Tutoré ; l'initialisation aboutit au tableau de bord, sans rendre la configuration détaillée obligatoire à ce stade.

#### FR-1 — Choix du parcours d'initialisation (validé : D-PRD-002 ; F-114, F-123, F-124)

Le Scrum Master peut choisir entre **Express** et **Guidé/Tutoré** pour créer son installation.

**Conditions d'acceptation de haut niveau :**
- Le choix des deux parcours est disponible lors de la première initialisation.
- Le parcours Express ne requiert que les données métier minimales déjà actées : mode Scrum ou Kanban, nom de la première équipe et nom du produit de référence. Le détail des réglages supplémentaires est différé.
- Le parcours Guidé/Tutoré accompagne progressivement l'utilisateur dans le paramétrage ; les éléments facultatifs peuvent être laissés pour plus tard.
- Dans les deux parcours, les règles F-41/F-49/F-114/F-123/F-124 demeurent applicables : mode fixe, produit unique et fixe, description du mode choisi, informations obligatoires limitées, valeurs par défaut cohérentes. La composition détaillée de l'assistant reste à concevoir.

#### FR-2 — Accès au tableau de bord après l'initialisation (validé : D-PRD-003)

Au terme de l'initialisation Express ou Guidée/Tutorée, le Scrum Master est dirigé vers le **tableau de bord** de l'équipe créée.

**Conditions d'acceptation de haut niveau :**
- Après validation du parcours Express, l'utilisateur accède au tableau de bord.
- Après validation du parcours Guidé/Tutoré, l'utilisateur accède au même tableau de bord de référence.
- Aucune configuration détaillée facultative n'est imposée pour accéder au tableau de bord.

#### FR-3 — Suivi facultatif de la configuration depuis le tableau de bord (validé : D-PRD-004, D-PRD-005)

Après une initialisation Express ou Guidée/Tutorée, le Scrum Master peut identifier sur le tableau de bord les tâches de paramétrage restant à traiter et décider librement de les réaliser ou non.

**Conditions d'acceptation de haut niveau :**
- Le tableau de bord présente une zone « Paramétrage à compléter » mettant en évidence les tâches de configuration restant à traiter.
- Les tâches de configuration sont distinctes des **actions métier** du registre F-85 à F-88 : elles ne deviennent pas des actions de Sprint ou de période et ne sont pas incorporées à ce titre dans les reportings métier.
- Une tâche de configuration dispose de trois états : **À faire**, **Terminée**, **Ignorée**. Le Scrum Master peut explicitement marquer une tâche comme Terminée ou Ignorée.
- Une tâche Ignorée n'est pas assimilée à une tâche Terminée ; ni l'une ni l'autre ne bloque la navigation ou l'utilisation des fonctionnalités disponibles.
- **Fonctionnement hybride validé :** lorsqu'une configuration correspondant à une tâche À faire est effectivement réalisée et que SMN peut le détecter, la tâche passe automatiquement à l'état Terminée sans saisie supplémentaire (D-PRD-005).
- Le Scrum Master conserve la possibilité de marquer manuellement une tâche Terminée ou Ignorée, y compris si sa réalisation ne peut pas être détectée automatiquement (D-PRD-005).
- La détection ne doit pas déclarer comme accomplie une configuration qui n'est pas effectivement réalisée ; lorsqu'aucun constat fiable n'est possible, la clôture reste manuelle.
- Le suivi facultatif du paramétrage est accessible depuis le tableau de bord après chacun des deux parcours d'installation.

**Détails restant à arbitrer :** catalogue initial et conditions d'affichage des tâches, comportement d'une tâche **Ignorée** si le paramétrage est ensuite effectivement réalisé, réactivation des tâches et calcul de la progression, comportement de la zone une fois la configuration considérée complète. Aucun mécanisme de réouverture automatique ou de relance des tâches n'est encore acté.

### 4.2 Cycle de vie des membres — MVP

**Description :** les membres sont définis de manière centralisée et peuvent participer à plusieurs équipes (F-26 à F-31). Le Scrum Master doit pouvoir corriger une création faite par erreur sans compromettre l'historique des équipes, des capacités et des rapports. La suppression définitive, la fin d'affectation et l'archivage ne sont pas interchangeables.

#### FR-4 — Supprimer, retirer d'une équipe ou archiver un membre (validé : D-PRD-006, D-PRD-012 ; F-26 à F-31, F-58 à F-63, F-93)

Le Scrum Master peut gérer les membres devenus inutiles selon leur historique : **supprimer définitivement une fiche ne possédant aucune donnée métier ou historique à préserver**, **terminer l'affectation d'un membre à une équipe** ou **archiver sa fiche centrale lorsqu'elle ne doit plus servir au suivi courant**, tout en préservant l'historique.

**Conditions d'acceptation de haut niveau :**
- Avant toute suppression définitive, SMN vérifie l'absence de données métier et d'historique à préserver liés à la fiche concernée ; sinon, la suppression définitive n'est pas permise.
- Pour un membre historisé, SMN permet de renseigner une **date de fin d'affectation** dans l'équipe concernée sans supprimer ses affectations dans d'autres équipes.
- L'archivage d'un membre historisé conserve les données passées pertinentes (affectations, calendriers, absences et capacités), qui demeurent utilisables dans les bilans, tendances et analyses historiques.
- L'archivage est **réversible** : un membre archivé peut être réactivé.
- La fin d'affectation ou l'archivage n'altère pas rétroactivement les périodes historiques ni les exports déjà produits (F-30, F-31 et F-93).
- Le système ne propose pas de suppression en cascade de l'historique métier pour contourner une restriction de suppression.
- Si une fin d'affectation fait passer l'effectif actif d'une équipe sous 3 personnes, SMN **enregistre le départ à sa date effective et affiche une alerte non bloquante** ; l'opération ne doit pas être refusée pour ce seul motif (D-PRD-012).

**Détails à spécifier :** critère exact d'une fiche « sans données métier à préserver », confirmation avant suppression, traitement des affectations futures, comportement des affectations simultanées lors d'un archivage, restauration/réactivation et visibilité des fiches archivées. Les modalités techniques de stockage et de suppression seront définies en architecture.

#### FR-5 — Création rapide et enrichissement des membres (validé : D-PRD-007, D-PRD-009, D-PRD-010 ; F-05, F-26, F-28, F-31, F-38, F-39, F-58 à F-63)

Lors de la configuration d'une équipe, le Scrum Master peut indiquer un **nombre de membres** pour créer rapidement autant de fiches provisoires, puis les enrichir individuellement.

**Conditions d'acceptation de haut niveau :**
- Le Scrum Master indique le nombre de membres à créer ; SMN propose **3 membres** par défaut, sans permettre de saisir un effectif inférieur à 3 dans ce parcours (D-PRD-010). SMN initialise autant de fiches identifiables avec un nom provisoire du type « Membre 1 », « Membre 2 », etc., remplaçable par un nom réel.
- Les **trois premiers membres** reçoivent, respectivement, les rôles Agile **Scrum Master**, **Product Owner**, **Développeur** ; tous les membres supplémentaires reçoivent le rôle **Développeur** par défaut, aussi bien en mode Scrum qu'en mode Kanban (D-PRD-010). L'attribution reste modifiable ensuite selon les règles de rôles F-38/F-39.
- Pour chaque fiche initiale, les trois informations minimales sont : **nom**, **date d'arrivée**, **rôle Agile**. Le nom est requis mais peut initialement être provisoire ; cette nature provisoire doit rester identifiable.
- La **date d'arrivée est propre à l'affectation d'un membre dans chaque équipe** (D-PRD-009, F-26/F-28/F-31) ; lors de sa création rapide, elle est proposée à la **date de création de la fiche membre**, puis reste modifiable. Un même membre peut avoir des dates d'arrivée différentes dans deux équipes ; la date de création de la fiche centrale reste distincte.
- Le **rôle Agile est obligatoire** et prérempli selon la position du membre dans la création rapide (Scrum Master / Product Owner / Développeur, puis Développeur pour les suivants). Il reste modifiable selon le catalogue de rôles de l'équipe (F-38, F-39, D-PRD-010).
- Les **paramètres de pourcentage du membre** sont proposés à **100 %** lorsqu'applicables (D-PRD-011) : temps contractuel, taux d'affectation à l'équipe, part du rôle Agile initial, coefficient de contribution. Le rôle initial représente 100 % de la répartition des rôles de ce membre dans cette équipe tant qu'aucun autre rôle n'est ajouté ; cela maintient la somme à 100 % (F-63).
- La somme des affectations simultanées d'un même membre à plusieurs équipes **ne dépasse jamais 100 %** de son temps contractuel (F-62). Une nouvelle affectation préremplie à 100 % qui ferait dépasser cette limite doit être corrigée avant validation ; le préremplissage n'écarte pas le contrôle bloquant.
- Un membre ayant 100 % d'activité Scrum Master ou Product Owner, sans part Développeur, n'ajoute pas de capacité de développement via ces rôles (F-58/F-59). Les **KPI de Sprint/Kanban restent facultatifs** et ne doivent pas être préremplis artificiellement à 100 % (F-72). La **marge de planification d'équipe** est un paramètre distinct (F-32) : son éventuelle valeur par défaut exacte reste à spécifier.
- Le Scrum Master peut revenir compléter la fiche et ses données de capacité (calendrier, disponibilités, pourcentages d'affectation, parts d'activité par rôle, coefficient de contribution) ; toutes les règles bloquantes applicables sont respectées dès lors que les affectations sont finalisées (F-62/F-63).
- Tant que les données requises pour calculer une contribution ne sont pas suffisantes et valides, la capacité correspondante est affichée **non calculable**, jamais présumée égale à zéro. Aucune fiche provisoire ne doit créer artificiellement une capacité dans les bilans.
- La création rapide n'empêche ni la modification ultérieure, ni la suppression/fin d'affectation/archivage sous les conditions de FR-4.

**Limites restantes :** préciser la différence entre « fiche provisoire » et « membre configuré », les exigences de validation des calendriers nécessaires aux calculs, et les effets d'une équipe passant temporairement sous 3 membres actifs. La date d'arrivée **par affectation** est désormais validée (D-PRD-009).

#### FR-6 — Adresse e-mail du membre (validé : D-PRD-008 ; F-28)

Le Scrum Master peut **renseigner et modifier une adresse e-mail sur la fiche centrale d'un membre**, indépendamment des affectations de celui-ci aux différentes équipes.

**Conditions d'acceptation de haut niveau :**
- Une fiche membre offre un champ adresse e-mail éditable lors de la création ou ultérieurement.
- Le champ est **facultatif pour le MVP** : les trois informations minimales de FR-5 restent suffisantes ; aucune adresse e-mail n'est requise pour créer ou suivre un membre.
- Une adresse renseignée fait l'objet d'une vérification de format et reste associée à la fiche centrale, sans duplications divergentes par équipe.
- Aucune fonctionnalité d'envoi d'e-mails, d'ouverture automatique d'Outlook ou d'intégration Outlook n'est exigée au MVP au seul motif de l'existence de ce champ.

**Piste ultérieure P-PRD-004 (non décidée pour une version) :** possibilité d'initier des messages ou d'ouvrir Outlook depuis SMN. Authentification, consentements, usages précis, mécanismes techniques et conditions de sécurité seraient à étudier avant de spécifier une version.

#### FR-7 — Préconfiguration d'une équipe d'au moins trois personnes (validé : D-PRD-010, D-PRD-011, D-PRD-012 ; F-38/F-39, F-62/F-63, F-114/F-124)

Le parcours rapide de configuration des membres d'une équipe Scrum ou Kanban propose un **effectif de 3 personnes minimum**, les rôles initiaux Scrum Master, Product Owner et Développeur, et des valeurs de pourcentage membre à 100 % dans le respect des règles de cohérence des affectations et de capacité.

**Conditions d'acceptation de haut niveau :**
- Au démarrage de la configuration des membres de l'équipe, la quantité proposée est 3 et aucune valeur inférieure à 3 n'est acceptée par cette fonctionnalité.
- Pour 3 membres : les rôles proposés sont Scrum Master / Product Owner / Développeur, chacun pour une fiche distincte. Pour 5 membres : les rôles proposés sont Scrum Master / Product Owner / Développeur / Développeur / Développeur.
- Les pourcentages initiaux de temps contractuel, d'affectation, de rôle et de contribution sont **100 % chacun lorsqu'ils s'appliquent** ; ces propositions restent éditables et ne contournent pas les contrôles F-62 et F-63.
- Un premier lancement en mode **Express** reste réalisable sans création ni configuration des membres, conformément à F-124 et FR-1 : l'effectif minimum concerne le parcours de **configuration des membres**, non les informations métier obligatoires dans l'assistant initial.
- **Une équipe déjà active peut temporairement passer sous 3 membres après un départ** : SMN affiche alors une **alerte non bloquante**, tout en conservant la date réelle de fin d'affectation et l'intégralité de l'historique (D-PRD-012, FR-4). Le départ n'entraîne ni création automatique d'un remplaçant ni modification des affectations passées.

**Note de cohérence :** « minimum 3 » est une règle de produit exprimée par l'utilisateur pour SMN, non une affirmation de norme générale applicable à tous les usages Scrum ou Kanban.

### 4.3 Calendrier hebdomadaire individuel — MVP

#### FR-8 — Initialiser et personnaliser le calendrier de travail d'un membre (validé : D-PRD-013 ; F-26 à F-30, F-35, F-59)

À la création rapide d'un membre, SMN lui propose un **calendrier de travail individuel à temps plein du lundi au vendredi**, avec samedi et dimanche non travaillés. Le Scrum Master peut ensuite le personnaliser pour chaque membre sans modifier rétroactivement les périodes historiques déjà enregistrées.

**Conditions d'acceptation de haut niveau :**
- À la création de chaque membre, le modèle hebdomadaire initial comporte cinq journées travaillées du lundi au vendredi ; samedi et dimanche sont non travaillés.
- Le Scrum Master peut modifier, **individuellement**, les jours travaillés et non travaillés, y compris les demi-journées, ainsi que les exceptions et absences conformément aux règles F-27 à F-29.
- Le calendrier individuel est centralisé sur la fiche du membre : une modification de ses disponibilités est prise en compte pour ses différentes équipes selon leurs affectations et dates effectives (F-28).
- Le temps contractuel est proposé à 100 % conformément à D-PRD-011 ; la trame hebdomadaire et le taux contractuel restent des paramètres distincts, modifiables.
- Les **jours fériés des calendriers préchargés/importés sont traités à l'échelle nationale** pour le MVP (FR-10). Les particularités régionales sont **saisies comme des absences individuelles catégorisées et nommées** (D-PRD-021, FR-11), ce qui précise la portée de F-35 pour le MVP. Les fermetures de société restent distinctes (F-36), et aucune journée indisponible ne doit être comptée deux fois.
- La capacité planifiée et constatée en JH repose sur les disponibilités applicables à la période concernée, sans reconstituer l'historique à partir du calendrier courant (F-30/F-31). La trame initiale n'est pas une preuve d'absences ou de jours fériés passés.

**Détails restant à préciser :** date d'effet des changements de calendrier individuel, choix des pays initialement livrés, correspondance pays/régions, années couvertes par les calendriers préchargés et suivi des mises à jour. Le préremplissage de la localisation et la gestion de pays/jours fériés sont précisés dans FR-9 et FR-10 ci-dessous.


### 4.4 Localisation des membres, pays et jours fériés — MVP

#### FR-9 — Localisation proposée depuis les paramètres de l'installation (validé : D-PRD-014 ; F-04, F-28, F-35, F-53, F-112)

SMN peut proposer à chaque nouveau membre la **localisation configurée pour l'installation** comme valeur initiale ; le Scrum Master peut la corriger individuellement pour prendre en compte des membres répartis dans plusieurs pays, régions, villes et fuseaux horaires.

**Conditions d'acceptation de haut niveau :**
- Un pays de référence peut être configuré dans les paramètres généraux de l'installation, sans ajouter de saisie obligatoire au parcours Express (F-114 et F-124).
- Lorsqu'un membre est créé, son pays initial est proposé à partir du pays configuré pour l'installation ; sa localisation peut être modifiée indépendamment de celle des autres membres et de celle de l'équipe.
- Les régions/villes peuvent être conservées à titre d'information sur la localisation, et le fuseau horaire individuel sert aux affichages (F-53). Au MVP, les jours fériés du catalogue sont **nationaux** et les particularités régionales se gèrent par **absences individuelles catégorisées et nommées** (D-PRD-021, FR-11). Leur représentation précise sera définie en conception.
- Le **pays du membre**, le **fuseau horaire** et la **langue d'interface** restent des paramètres distincts ; changer l'un ne modifie pas automatiquement les autres (F-112).
- Les données de localisation qui influent sur la capacité historique restent identifiables à la période applicable ; un changement de pays ne doit pas effacer ou invalider silencieusement les bilans passés.

**À préciser :** pays par défaut de la toute première installation, champs de région/ville initiaux, date d'effet des changements et éventuels cas de membres mobiles.

#### FR-10 — Gérer les pays et leurs calendriers de jours fériés (validé : D-PRD-015 à D-PRD-023 ; F-35/F-36, avec précision de périmètre régional pour le MVP)

Le MVP fournit un **catalogue initial de sept pays : France, Allemagne, Royaume-Uni, Espagne, Portugal, Italie et Canada**, dont **la France, l'Allemagne et le Royaume-Uni disposent de calendriers nationaux préchargés** à titre d'exemple et de préparamétrage (D-PRD-023). Le Scrum Master peut **ajouter un pays** au catalogue et **importer un calendrier de jours fériés** pour celui-ci.

**Conditions d'acceptation de haut niveau :**
- L'installation propose ces sept pays initiaux (D-PRD-018), et le catalogue peut être enrichi par l'utilisateur. **Les calendriers nationaux fournis concernent la France, l'Allemagne et le Royaume-Uni** (D-PRD-019, D-PRD-023) ; aucun calendrier n'est présumé présent pour chaque pays ou chaque année.
- SMN embarque un **répertoire de fichiers de calendriers de jours fériés préconfigurés**, dans un format accepté par le module d'import (CSV au schéma SMN fixe ou ICS). Lors de l'initialisation, une fois connu le pays de référence, SMN **cherche les fichiers correspondants dans ce répertoire et charge les fichiers valides disponibles** pour ce pays (D-PRD-019). L'opération ne nécessite pas de téléversement manuel par l'utilisateur et n'implique pas d'accès à un service extérieur.
- Pour chaque calendrier national effectivement **fourni au démarrage**, le jeu de fichiers couvre **quatre années glissantes N-2, N-1, N et N+1**, où **N est l'année de l'installation** (D-PRD-022). Exemple : pour une installation en 2026, les années 2024, 2025, 2026 et 2027. Cette exigence ne signifie pas que les sept pays disposent tous de calendriers préchargés ni qu'une actualisation automatique annuelle a été décidée.
- La couverture de quatre ans **ne limite pas les imports manuels CSV/ICS** : le Scrum Master peut importer des jours fériés d'années antérieures ou futures, notamment pour reprendre des Sprints plus anciens. Une année non couverte par un fichier disponible est signalée comme non configurée, sans données de remplacement inventées.
- L'import initial des fichiers fournis est **idempotent** : relancer l'installation ou la configuration ne crée pas de doublons. Si aucun fichier n'est disponible, l'initialisation reste possible et SMN signale que les jours fériés ne sont pas encore configurés.
- **Chaque jour férié contient obligatoirement une date et un nom non vide** (D-PRD-020), conservés et consultables dans l'administration. Ces deux champs doivent être vérifiés tant pour le préchargement que pour les imports utilisateur CSV/ICS. Les autres informations éventuelles relèvent du schéma détaillé à spécifier.
- Le Scrum Master peut créer un pays dans l'administration, sans avoir à modifier le code de SMN, puis lui associer un ou plusieurs jeux de jours fériés.
- Le MVP accepte **deux formats d'import de fichiers de jours fériés** (D-PRD-017) : **CSV au schéma SMN fixe**, déjà acté par F-35, et **iCalendar (.ics)**. Le détail du schéma CSV, des données iCalendar compatibles (notamment dates, récurrences et fuseaux), des régions, années et contrôles de données reste à spécifier.
- Pour les deux formats, SMN permet d'associer l'import à un **pays** ; les journées importées sont traitées de manière cohérente dans le calendrier interne, quel que soit le format source. Dans le MVP, les **particularités régionales ne nécessitent pas un calendrier régional d'import distinct** : elles sont consignées dans les absences individuelles selon FR-11 (D-PRD-021).
- Un fichier ICS peut contenir des événements qui ne sont pas des jours fériés. SMN doit fournir un contrôle des événements retenus avant leur inscription dans le calendrier de jours fériés ; il ne classe pas aveuglément tous les événements du fichier comme jours non travaillés.
- Lors de l'import **CSV ou ICS**, SMN identifie le pays concerné, valide les dates, contrôle les enregistrements doublons et les données invalides, et présente un aperçu et un bilan des éléments acceptés ou refusés. Il ne mélange pas automatiquement les jours fériés de deux pays.
- Les jours fériés **nationaux** disponibles pour le pays du membre sont réutilisés pour ses disponibilités, ses capacités et les alertes sur événements. Les particularités régionales sont prises en compte au travers des **absences individuelles** et non d'un calendrier régional automatique (D-PRD-021) ; les fermetures d'entreprise restent un calendrier distinct (F-36). Les règles de gestion des événements F-55 restent applicables, en particulier l'absence d'alerte collective déclenchée par une absence individuelle.
- Les chevauchements de jours non travaillés/absences/fermetures ne provoquent **aucune double déduction** de la capacité (F-35/F-59).
- En l'absence de calendrier de jours fériés applicable à un pays/une année, SMN ne suppose pas que ce pays n'a aucun jour férié ; il signale que ces données sont **manquantes/non configurées** plutôt que de générer des dates fictives.
- Les corrections et réimports de jours fériés sont traçables et ne réécrivent pas silencieusement les capacités historiques de référence (F-30/F-31/F-93).

**À préciser :** pays proposé par défaut à la première installation (France proposée, pas encore explicitement confirmée), **fichiers préchargés pour France/Allemagne/Royaume-Uni** et modalités de maintenance des jeux de fichiers glissants N-2 à N+1 (D-PRD-022), convention de nommage/organisation du répertoire, schéma détaillé CSV, couverture iCalendar (événements sur plusieurs jours, récurrences, fuseaux et événements non fériés), choix fusion/remplacement, et parcours de correction après import. Le MVP ne prévoit pas de gestion automatique des calendriers régionaux (D-PRD-021). **L'import d'un fichier ICS est acquis au MVP ; aucune synchronisation par abonnement à une URL ICS n'est impliquée.** Aucun fournisseur ou API automatique de jours fériés n'est imposé à ce stade.


#### FR-11 — Enregistrer une particularité régionale comme absence individuelle (validé : D-PRD-021 ; F-27 à F-29, F-35, F-55)

Lorsqu'un membre bénéficie d'un jour non travaillé propre à sa région et non couvert par les jours fériés nationaux, le Scrum Master le renseigne comme une **absence individuelle**, avec **une catégorie** et **un nom/motif descriptif**.

**Conditions d'acceptation de haut niveau :**
- Le Scrum Master peut enregistrer dans le calendrier centralisé d'un membre une absence spécifique liée à une particularité régionale, avec date/période applicable, catégorie du catalogue d'absences (F-29) et libellé descriptif libre obligatoire pour identifier le motif de cette particularité.
- Cette absence est prise en compte dans la disponibilité et la capacité du membre pour toutes les équipes où il est affecté, sans double déduction en cas de recouvrement avec un jour férié national ou une autre indisponibilité (F-28/F-35/F-59).
- Une absence régionale ainsi saisie suit les règles d'**absence individuelle**, non celles d'un jour férié national : elle n'entraîne pas à elle seule les alertes collectives ni la suppression automatique des Daily (F-55).
- Le registre conserve cette information pour les périodes historiques ; une modification ultérieure ne doit pas réécrire silencieusement les capacités passées.

**Précision de décision :** F-35 mentionnait initialement des jours fériés « nationaux/régionaux selon localisation ». **Pour le MVP, D-PRD-021 affine explicitement cette règle : calendriers de jours fériés nationaux préchargés/importables, exceptions régionales saisies manuellement comme absences individuelles catégorisées et nommées.** Une gestion automatisée des jours fériés régionaux pourra être réévaluée plus tard, sans être requise au MVP.


## 5. Non-objectifs actés

SMN n'est ni un outil de saisie collaborative destiné aux membres, ni un système de tickets remplaçant Jira, ni un outil de notation des personnes ou d'animation détaillée des cérémonies. Les intégrations automatiques Jira et IA sont différées. Les formats PPTX, DOCX et XLSX sont prévus pour le produit cible mais exclus du MVP.

## 6. Périmètre MVP — décisions validées

Le MVP couvre **Scrum et Kanban** avec un cycle complet simplifié, les **six catégories qualitatives**, la **reprise manuelle des Sprints terminés**, la consultation et prévisualisation des rapports en **HTML** et l'export partageable en **PDF**.

Le modèle standard prérempli du rapport propose six sections : 1. synthèse exécutive ; 2. objectifs ; 3. indicateurs et tendances ; 4. événements Agile ; 5. points d'attention ; 6. décisions et actions. Les sections peuvent être masquées, réorganisées et complétées ; vision, Product Goal, DoD et DoR sont sélectionnables.

Le MVP propose une **initialisation Express ou Guidée/Tutorée**, suivie du **tableau de bord** de l'équipe (D-PRD-002 et D-PRD-003), avec une liste facultative de **tâches de configuration distinctes des actions métier**, pouvant être terminées automatiquement lorsque leur réalisation est détectable, ou terminées/ignorées manuellement (D-PRD-004, D-PRD-005, FR-3). Il permet la **création rapide d'au moins trois membres dans le parcours de configuration**, avec noms provisoires, dates d'arrivée par équipe, rôles Scrum Master/Product Owner/Développeur par défaut puis Développeur pour les suivants, champs de pourcentage membre préremplis à 100 % sous réserve des validations existantes (FR-5, FR-7), et **calendrier individuel initial lundi-vendredi à temps plein, personnalisable** (FR-8), avec **localisation proposée à partir de l'installation mais personnalisable par membre**, **chargement des fichiers nationaux disponibles dans le répertoire livré avec SMN selon le pays**, **gestion des pays et import de jours fériés en CSV au format fixe SMN ou en ICS**, et **particularités régionales gérées comme des absences individuelles nommées et catégorisées** dès le MVP (FR-9/FR-10/FR-11). Le **champ e-mail facultatif** figure sur la fiche centrale, sans envoi automatique de messages (FR-6). Le MVP est une **application web accessible depuis un navigateur** avec une **interface responsive ordinateur, tablette et smartphone** (D-PRD-001). Il est disponible en **français et anglais**. **Bootstrap 5** est le framework CSS acté, avec personnalisation par palettes et modes clair/sombre. Les KPI restent facultatifs dans tous les modes ; valeur absente et zéro ne sont pas équivalents. Le brief IA TXT est transmis manuellement à une IA externe ; aucune API IA n'est exigée.

**Hors MVP :** SAFe et les ART (version 1.0) ; les formats de rapport PPTX/DOCX/XLSX (post-MVP, version non attribuée). L'arbitrage détaillé des mécanismes avancés demeure ouvert.

## 7. Critères de succès validés — modalités de mesure à définir

Cinq conditions **cumulatives** conditionnent le passage au pilote :
1. Au moins trois Sprints complets et un cycle de reporting Kanban en conditions réelles.
2. Rapport complet de fin de Sprint produit en moins de 30 minutes, avec tendances accessibles sans reconstruction manuelle.
3. Saisie courante de 15 à 30 minutes par semaine, plafonnée à 30 minutes, mesurée séparément du reporting final et hors reprise historique exceptionnelle.
4. Tendances fiables, y compris avec Sprints rétrosaisis, sans confondre absence de donnée et zéro.
5. Rapports HTML et PDF exploitables sans anomalie bloquante.

Les protocoles de recette, contre-indicateurs, FR associées et critères mesurables particuliers à Kanban restent à établir. Ces seuils sont des **objectifs validés**, pas des résultats observés.

## 8. Exigences non fonctionnelles — sujets à spécifier

**NFR-1 — Compatibilité des supports et adaptation responsive (validé, D-PRD-001).** L'interface web du MVP doit être accessible via un navigateur et s'adapter aux formats d'écran d'un ordinateur, d'une tablette et d'un smartphone. **Critère vérifiable de haut niveau :** vérifier, sur chacun des trois types de supports, l'utilisation des parcours majeurs du MVP sans dépendance à une application native. Les navigateurs et versions cibles ainsi que les critères ergonomiques quantifiés restent à préciser.

Sécurité et accès ; confidentialité des informations individuelles et des contenus destinés à l'IA ; traçabilité et provenance ; sauvegarde/restauration ; intégrité des historiques et des exports ; performance ; accessibilité ; ergonomie ; internationalisation ; résilience des imports et exports. Aucun seuil ou choix de solution non validé n'est figé ici.

## 9. Questions ouvertes à traiter progressivement

- Degré de détail des parcours et formulaires, règles de validation nécessaires, notamment pour les six registres qualitatifs.
- **FR-3 / D-PRD-004 et D-PRD-005 :** catalogue des tâches de configuration, règles d'affichage et de réactivation, comptage de la progression, ainsi que la priorité entre état Ignorée choisi manuellement et achèvement détecté ultérieurement. Le principe du fonctionnement hybride est acté.
- **FR-5 / D-PRD-007, D-PRD-009 à D-PRD-011 :** création rapide validée avec noms provisoires, date d'arrivée **propre à chaque affectation d'équipe**, modifiable, initialisée par la date de création de fiche ; 3 membres par défaut et minimum dans le formulaire, rôles initiaux Scrum Master/Product Owner/Développeur, puis Développeur pour les suivants. Pourcentages membres initiaux à 100 % sans contournement des validations F-62/F-63. À préciser : distinction fiche provisoire / complète et validations des données historiques.
- **FR-7 / D-PRD-010, D-PRD-012 :** effectif de 3 minimum dans le formulaire de création rapide, mais si l'effectif réel passe ensuite sous 3 à la suite d'un départ, **alerte non bloquante validée**. Reste à préciser où et combien de temps elle sera affichée. L'initialisation Express ne doit pas être bloquée par l'absence de membres (F-124).
- **D-PRD-011 :** la valeur de la **marge de planification d'équipe**, distincte des pourcentages membre (F-32), n'est pas fixée ; ne pas en déduire un taux de 100 % de marge.
- **FR-4 / D-PRD-006 :** principe de suppression des fiches vierges et de fin d'affectation/archivage réversible validé. Restent à spécifier les critères exacts d'une fiche sans historique, les confirmations, l'effet sur les affectations simultanées/futures et l'ergonomie de réactivation.
- **FR-6 / D-PRD-008 :** adresse e-mail centralisée éditable dès le MVP ; son caractère facultatif est une interprétation cohérente avec le minimum FR-5, à rectifier si souhaité. **P-PRD-004 :** envoi d'e-mails ou ouverture d'Outlook, possibilité future sans engagement de version.
- **FR-8 / D-PRD-013 :** calendrier individuel initial lundi-vendredi à temps plein, entièrement personnalisable. FR-9 précise le préremplissage de la localisation ; restent ouvertes les règles de date d'effet des changements.
- **FR-9 / D-PRD-014 :** pays par défaut de la première installation, prise en compte de régions/villes, fuseaux et changements de localisation au fil du temps, avec impacts sur l'historique.
- **FR-10 / D-PRD-015 à D-PRD-023 :** import **CSV fixe + ICS** validé au MVP ; les sept pays initiaux sont validés ; **les calendriers fournis pour France, Allemagne et Royaume-Uni sont automatiquement recherchés dans un répertoire interne selon le pays à l'initialisation**, avec une couverture **N-2 à N+1 pour chaque calendrier livré**. Les **jours fériés ont obligatoirement une date et un nom**. Restent à préciser la maintenance des fichiers annuels, le schéma CSV, la convention du répertoire, la couverture ICS et les stratégies de fusion/remplacement.
- **FR-11 / D-PRD-021 (précision de F-35) :** cas régionaux saisis en absences individuelles avec catégorie et nom. Ne pas implémenter au MVP de sélection automatique des calendriers régionaux ; conserver les règles de capacité et d'événements d'absence individuelle.
- Frontière des fonctionnalités avancées entre MVP, version 1.0 et versions ultérieures.
- Méthodes de calcul et unités exactes des KPI ; correction, traçabilité et imports CSV.
- Gabarits HTML/PDF et amplitude des personnalisations du rapport.
- Confidentialité, mécanismes de protection des données, sauvegardes, accessibilité, langue des contenus libres et exports.
- Navigateurs/versions cibles et modalités de recette de l'interface responsive ; aucun fonctionnement hors connexion ou emballage PWA n'est actuellement décidé.
- Méthode de mesure des cinq conditions de succès et contre-indicateurs.

## 10. Hypothèses

Aucune hypothèse fonctionnelle additionnelle n'est présentée comme une décision. Toute hypothèse nouvelle sera balisée `[ASSUMPTION]` puis validée ou classée comme point ouvert.

---

*Initialisé le 18 octobre 2026 sur une branche GitHub dédiée. Le travail de formulation détaillée des exigences, la revue et la finalisation BMAD restent à mener.*
