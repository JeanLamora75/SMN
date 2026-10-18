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
- **Membre :** personne référencée une seule fois dans l'installation et pouvant être affectée à plusieurs équipes, avec un historique de disponibilité et de participation (F-26 à F-31).
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

#### FR-4 — Supprimer, retirer d'une équipe ou archiver un membre (validé : D-PRD-006 ; F-26 à F-31, F-58 à F-63, F-93)

Le Scrum Master peut gérer les membres devenus inutiles selon leur historique : **supprimer définitivement une fiche ne possédant aucune donnée métier ou historique à préserver**, **terminer l'affectation d'un membre à une équipe** ou **archiver sa fiche centrale lorsqu'elle ne doit plus servir au suivi courant**, tout en préservant l'historique.

**Conditions d'acceptation de haut niveau :**
- Avant toute suppression définitive, SMN vérifie l'absence de données métier et d'historique à préserver liés à la fiche concernée ; sinon, la suppression définitive n'est pas permise.
- Pour un membre historisé, SMN permet de renseigner une **date de fin d'affectation** dans l'équipe concernée sans supprimer ses affectations dans d'autres équipes.
- L'archivage d'un membre historisé conserve les données passées pertinentes (affectations, calendriers, absences et capacités), qui demeurent utilisables dans les bilans, tendances et analyses historiques.
- L'archivage est **réversible** : un membre archivé peut être réactivé.
- La fin d'affectation ou l'archivage n'altère pas rétroactivement les périodes historiques ni les exports déjà produits (F-30, F-31 et F-93).
- Le système ne propose pas de suppression en cascade de l'historique métier pour contourner une restriction de suppression.

**Détails à spécifier :** critère exact d'une fiche « sans données métier à préserver », confirmation avant suppression, traitement des affectations futures, comportement des affectations simultanées lors d'un archivage, restauration/réactivation et visibilité des fiches archivées. Les modalités techniques de stockage et de suppression seront définies en architecture.

## 5. Non-objectifs actés

SMN n'est ni un outil de saisie collaborative destiné aux membres, ni un système de tickets remplaçant Jira, ni un outil de notation des personnes ou d'animation détaillée des cérémonies. Les intégrations automatiques Jira et IA sont différées. Les formats PPTX, DOCX et XLSX sont prévus pour le produit cible mais exclus du MVP.

## 6. Périmètre MVP — décisions validées

Le MVP couvre **Scrum et Kanban** avec un cycle complet simplifié, les **six catégories qualitatives**, la **reprise manuelle des Sprints terminés**, la consultation et prévisualisation des rapports en **HTML** et l'export partageable en **PDF**.

Le modèle standard prérempli du rapport propose six sections : 1. synthèse exécutive ; 2. objectifs ; 3. indicateurs et tendances ; 4. événements Agile ; 5. points d'attention ; 6. décisions et actions. Les sections peuvent être masquées, réorganisées et complétées ; vision, Product Goal, DoD et DoR sont sélectionnables.

Le MVP propose une **initialisation Express ou Guidée/Tutorée**, suivie du **tableau de bord** de l'équipe (D-PRD-002 et D-PRD-003), avec une liste facultative de **tâches de configuration distinctes des actions métier**, pouvant être terminées automatiquement lorsque leur réalisation est détectable, ou terminées/ignorées manuellement (D-PRD-004, D-PRD-005, FR-3). Le MVP est une **application web accessible depuis un navigateur** avec une **interface responsive ordinateur, tablette et smartphone** (D-PRD-001). Il est disponible en **français et anglais**. **Bootstrap 5** est le framework CSS acté, avec personnalisation par palettes et modes clair/sombre. Les KPI restent facultatifs dans tous les modes ; valeur absente et zéro ne sont pas équivalents. Le brief IA TXT est transmis manuellement à une IA externe ; aucune API IA n'est exigée.

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
- **P-PRD-002 — Création rapide des membres (proposition de l'utilisateur, non validée) :** renseigner le nombre de membres de l'équipe, générer des fiches provisoires avec seulement un prénom ou identifiant provisoire, puis compléter les informations ultérieurement. Spécifier le nommage, la validation d'une fiche incomplète et son exclusion éventuelle des calculs de capacité jusqu'à complétude.
- **FR-4 / D-PRD-006 :** principe de suppression des fiches vierges et de fin d'affectation/archivage réversible validé. Restent à spécifier les critères exacts d'une fiche sans historique, les confirmations, l'effet sur les affectations simultanées/futures et l'ergonomie de réactivation.
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
