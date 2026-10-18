---
title: "Product Brief — Scrum Master Notebook (SMN)"
status: draft
created: 2026-10-18
updated: 2026-10-18
workflow: bmad-product-brief
phase: discovery
language: fr
---

# Product Brief — Scrum Master Notebook (SMN)

> **Statut :** ébauche de découverte non finalisée. Ce document distingue les règles déjà validées des hypothèses et des arbitrages restant à mener. Il ne constitue ni un PRD ni une approbation du MVP.
>
> **Sources de référence :** [contexte du projet](../../../../docs/PROJECT-CONTEXT.md), [registre des 124 décisions F-01 à F-124](../../../../docs/DECISIONS-FONCTIONNELLES.md) et [cadrage fonctionnel](../../../../docs/CADRAGE-FONCTIONNEL.md).

## Synthèse exécutive — socle validé

**Scrum Master Notebook (SMN)** est un carnet de bord professionnel pour **Scrum Masters (SM)** et **Release Train Engineers (RTE)**. Il centralise les éléments nécessaires à l'animation et au pilotage des équipes Agile et des Agile Release Trains (ART), en conservant l'historique des périodes, objectifs, événements, capacités, indicateurs, risques, obstacles, dépendances, décisions, actions et faits marquants. **Le MVP couvre les équipes Scrum et Kanban ; la version 1.0 complète le produit avec SAFe et les ART.**

Sa finalité est de **produire à la demande des reportings complets, explicables et contextualisés pour les parties prenantes**, avec une saisie manuelle minimale. Le SM ou RTE reste le principal utilisateur : SMN n'est ni un second Jira, ni un espace de saisie collaborative des équipiers, ni un outil de notation individuelle. Les informations qualitatives doivent donner du sens aux chiffres, y compris lorsque les KPI facultatifs ne sont pas disponibles. (F-01, F-08 à F-16, F-72, F-73, F-97)

## Problème ciblé — constat confirmé

Le problème métier identifié par l'utilisateur combine **trois difficultés indissociables** dans le travail de Scrum Master :

1. **Temps consacré au reporting :** rassembler, consolider et organiser les données nécessaires aux bilans et reportings demande un effort manuel.
2. **Dispersion des informations :** les éléments utiles au suivi d'une équipe (chiffres, objectifs, décisions, risques, actions, faits marquants) sont à retrouver dans plusieurs supports.
3. **Vision insuffisamment globale pour les parties prenantes :** la restitution doit articuler les résultats chiffrés, les événements et leur contexte qualitatif afin d'expliquer les évolutions.

**Conséquence recherchée :** une mémoire centralisée et historisée, alimentée progressivement et avec peu de saisie, qui permette de produire un reporting complet, intelligible et contextualisé sans reconstruire manuellement l'histoire d'une période.

**Situation actuelle déclarée par l'utilisateur :** la préparation d'un reporting complet de fin de Sprint représente **entre une heure et une demi-journée**, selon que l'historique permettant de dégager une tendance est déjà compilé et retrouvable ou qu'il faut **le reconstruire**. Cette fourchette est une **estimation personnelle**, et non une mesure chronométrée. Les outils/supports concrets utilisés restent à documenter ; aucun gain chiffré n'a encore été établi.

## Utilisateurs et bénéficiaires — validé / à préciser

- **Utilisateurs opérationnels :** première phase d'utilisation personnelle par le porteur du projet, sur des équipes Scrum et Kanban ; lors de la version 1.0, prise en charge des RTE et des Scrum Masters dans des ART SAFe (F-01, F-17, F-18).
- **Destinataires des livrables :** parties prenantes recevant les reportings ; elles ne sont pas, du seul fait de ce rôle, des utilisateurs chargés de saisir dans SMN (F-10, F-97).
- **Stratégie de diffusion validée :** d'abord un usage personnel ; si le MVP est concluant, expérimentation auprès d'un échantillon d'utilisateurs ; si l'utilisation est au rendez-vous, diffusion plus large. Le calendrier, la composition de l'échantillon et les seuils de passage ne sont pas encore fixés.

## Proposition de solution — exigences validées

- **Produit cible :** fonctionnement dans **trois modes exclusifs par installation : Scrum, Kanban et SAFe**. Le MVP proposera les modes Scrum et Kanban ; le mode SAFe arrivera en **version 1.0**. À terme, un ART peut réunir des équipes Scrum et Kanban partageant la cadence de l'ART. Un produit unique et fixe est suivi par installation (F-41, F-49, F-50, F-121 à F-124).
- Génération des calendriers et cérémonies, gestion centralisée des membres et disponibilités, capacités de développement en JH, et saisie des exceptions plutôt que des opérations répétitives (F-26 à F-63).
- Objectifs par période et par PI, indicateurs Scrum/Kanban **tous facultatifs**, clôtures manuelles et reprises historiques traçables (F-64 à F-73, F-91 à F-96).
- **Dès le MVP Scrum/Kanban : les six catégories de suivi qualitatif** — risques ROAM, obstacles, dépendances, décisions, actions et faits marquants — avec une interface de saisie simple, leur historisation et leur exploitation dans les reportings (F-74 à F-90, F-110, F-111). Le séquencement des mécanismes avancés reste à définir.
- Reporting à tout moment, modèles configurables et prévisualisation ; **HTML et PDF dans le MVP** (consultation/prévisualisation dans l'application puis export partageable), **PPTX, DOCX et XLSX post-MVP**, selon un calendrier à préciser (F-15, F-24, F-25, F-97 à F-109).
- Brief IA textuel TXT prévisualisable, archivé et immuable ; transmission manuelle à une IA externe et réintégration de son analyse, sans données individuelles de membres (F-98 à F-109).
- Contexte produit, vision et Product Goal historisés, DoD/DoR restituables dans les rapports ; interface français/anglais dès le MVP, thèmes clair/sombre et CSS Bootstrap 5 (F-112 à F-124).

## Différenciation envisagée — formulation, non preuve commerciale

La combinaison d'une **mémoire qualitative historisée**, de **chiffres facultatifs et explicables**, d'une **préparation de reporting réutilisant les données existantes**, et d'une **saisie centrée sur le SM/RTE** constitue le positionnement recherché. **À valider :** alternatives réellement utilisées, avantage perçu et différenciation démontrable. Aucun avantage concurrentiel exclusif n'est affirmé.

## Critères de succès — objectifs quantitatifs validés et mesures à préciser

Les trois difficultés confirmées suggèrent **trois axes de mesure** pour apprécier le MVP lors de l'usage personnel :

- **Préparation du reporting — objectif MVP validé :** produire un **reporting complet de fin de Sprint en moins de 30 minutes**, avec tendances historiques disponibles dans SMN **sans reconstruction manuelle**. Référence déclarative actuelle : **une heure à une demi-journée** selon l'historique disponible. Cette durée concerne la préparation finale du rapport ; la durée cible propre aux périodes Kanban reste à préciser.
- **Charge de saisie courante — objectif MVP validé :** viser **15 à 30 minutes par semaine** pour renseigner et tenir à jour SMN pendant un Sprint, afin de limiter la charge administrative du Scrum Master. Ce temps est distinct des moins de 30 minutes consacrées à la préparation finale du reporting. Le périmètre pratique du chronométrage (configuration initiale, événements exceptionnels, etc.) sera explicité au moment des tests.
- **Centralisation et continuité historique :** retrouver directement les résultats et leur évolution sur plusieurs périodes, sans devoir rechercher une compilation extérieure ni reconstruire les tendances manuellement.
- **Qualité de restitution :** capacité du rapport HTML/PDF à expliquer la période aux parties prenantes en associant résultats et contexte qualitatif.

**Deux objectifs chiffrés désormais validés :** moins de 30 minutes pour la préparation finale d'un rapport de Sprint complet incluant des tendances historiques directement disponibles ; **15 à 30 minutes par semaine** pour la saisie et la tenue à jour courantes de SMN pendant le Sprint. Leur **faisabilité** reste à démontrer par des tests en situation réelle : aucun résultat du MVP n'est encore mesuré. Les axes « centralisation » et « qualité de restitution », la durée cible en Kanban, les modalités de chronométrage et les critères de passage vers le pilote restent à préciser.

## Trajectoire des livraisons — orientation validée

- **MVP :** version de validation personnelle limitée aux équipes **Scrum et Kanban**, sans mode SAFe, proposant un **cycle complet simplifié** : installation et équipe, période, suivi minimal, bilan/clôture puis rapport. Le détail des fonctionnalités livrées reste à prioriser.
- **Version 1.0 :** extension fonctionnelle à **SAFe**, avec les ART, leurs équipes Scrum/Kanban et les mécanismes associés déjà décidés.
- **Versions ultérieures :** améliorations du produit guidées notamment par l'usage et les retours collectés, sans liste prédéterminée.

Cette trajectoire détermine **quand** livrer la dimension SAFe, sans annuler les règles fonctionnelles F-49/F-50 déjà établies. La diffusion pilote dépend de la conclusion du MVP et ne préjuge pas de la disponibilité des fonctions RTE avant la version 1.0.

## MVP — cycle complet simplifié validé

**Principe validé par l'utilisateur :** le MVP doit permettre, en **Scrum comme en Kanban**, de parcourir un cycle de travail de bout en bout plutôt que de se limiter à une saisie ponctuelle pour produire un rapport.

Le **parcours cible** suit les étapes suivantes :

1. Initialiser le produit et créer une équipe Scrum ou Kanban.
2. Préparer une période de travail : Sprint en Scrum ou période de suivi en Kanban.
3. Suivre, avec une saisie réduite, les événements, objectifs, données chiffrées disponibles et informations qualitatives utiles.
4. Réaliser le bilan et la clôture manuelle de la période.
5. Générer un premier reporting contextualisé à partir des informations enregistrées.

Ce parcours exprime **l'objectif de bout en bout validé**, pas encore une décision sur le détail de chaque écran, registre, calcul, automatisation ou export livré dans le MVP. Les fonctionnalités précises seront priorisées ultérieurement. Toutes les dispositions déjà validées dans F-01 à F-124 restent applicables à leur version de livraison respective.

### Suivi qualitatif MVP — périmètre validé

Les **six catégories** — **risques, obstacles, dépendances, décisions, actions et faits marquants** — sont **toutes incluses dès le MVP** Scrum/Kanban. Leur saisie doit rester simple et compatible avec l'objectif de 15 à 30 minutes par semaine. Les enregistrements doivent conserver l'historique utile et fournir le contexte qualitatif des bilans et rapports HTML/PDF.

**À préciser au PRD :** champs minimaux et règles de manipulation nécessaires pour chaque catégorie, ainsi que les fonctions avancées à livrer au MVP ou à différer (relations complexes, automatisations et visualisations particulières). Le report éventuel de mécanismes avancés ne supprime aucune des six catégories ni les règles cardinales de traçabilité déjà validées.

### Reporting MVP — formats validés

- **HTML dès le MVP :** consulter et prévisualiser un rapport dans SMN.
- **PDF dès le MVP :** exporter un rapport partageable avec les parties prenantes.
- **PPTX, DOCX et XLSX :** fonctionnalités validées pour le produit cible (F-15), reportées **après le MVP**, sans préjuger de leur présence dans la version 1.0.
- **Modèles configurables :** principe conservé conformément aux décisions existantes ; leur richesse initiale et le contenu par défaut des rapports restent à préciser.

### Limites et arbitrages en suspens

**Principes non négociables issus du cadrage :** l'application n'est pas collaborative pour les équipiers, les KPI demeurent facultatifs, les données individuelles ne sont pas transmises aux IA et l'intégration automatique Jira/API IA n'est pas requise pour la première version. L'import CSV des valeurs numériques consolidées est prévu ; les formats de reporting du **MVP sont HTML et PDF**, et les autres formats (PPTX, DOCX, XLSX) sont différés sans version cible fixée (F-01, F-15, F-16, F-19, F-72, F-102, F-108).

**À décider :** quelles fonctions précises retenir pour réaliser chacune des cinq étapes, les détails de saisie et de liaison des six catégories qualitatives, les éléments à afficher par défaut dans les rapports HTML/PDF et les fonctions avancées à reporter hors MVP (SAFe étant déjà prévu en version 1.0).

## Vision et adoption progressive — orientation validée

Faire mûrir SMN par l'usage personnel d'abord, par un pilote ensuite seulement si le MVP satisfait les attentes, puis envisager une diffusion élargie si l'adoption est effective. **Les indicateurs et seuils de validation de chacune de ces étapes restent ouverts.** Aucune stratégie de commercialisation ou de plateforme collaborative n'a été décidée.

## Prochaines questions du Product Brief

1. **Contenu des rapports :** quelles informations quantitatives, qualitatives et tendances historiques doivent apparaître par défaut dans le premier rapport HTML/PDF ?
2. **Simplicité du MVP :** quels détails des formulaires et relations entre les six catégories exigent un arbitrage PRD, tout en restant sous la cible de saisie hebdomadaire ?
3. **Critères de passage :** quelles observations (temps mesuré, restitution, centralisation et usage) permettront d'ouvrir un pilote puis d'envisager une diffusion élargie ?

---

*Les 124 décisions F-01 à F-124 restent dans le registre de référence. Toute nouvelle décision issue du Product Brief devra être validée avant d'être présentée comme actée.*
