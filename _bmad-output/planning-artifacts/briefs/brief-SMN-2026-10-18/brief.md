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

## Problème ciblé — à approfondir lors de la découverte

Le produit cherche à simplifier la **constitution et la restitution d'une mémoire fiable et intelligible du fonctionnement des équipes et de l'ART**, sans demander au SM/RTE de ressaisir plusieurs fois les mêmes données. Il vise à relier ce qui s'est passé (chiffres, faits marquants, événements), ce qui a été décidé et ce qui reste à suivre.

**À confirmer par l'utilisateur :** situations de travail les plus pénibles aujourd'hui, solutions de contournement existantes et coût réel du reporting manuel. Aucun gain quantifié ni résultat d'étude utilisateur n'est revendiqué à ce stade.

## Utilisateurs et bénéficiaires — validé / à préciser

- **Utilisateurs opérationnels :** première phase d'utilisation personnelle par le porteur du projet, sur des équipes Scrum et Kanban ; lors de la version 1.0, prise en charge des RTE et des Scrum Masters dans des ART SAFe (F-01, F-17, F-18).
- **Destinataires des livrables :** parties prenantes recevant les reportings ; elles ne sont pas, du seul fait de ce rôle, des utilisateurs chargés de saisir dans SMN (F-10, F-97).
- **Stratégie de diffusion validée :** d'abord un usage personnel ; si le MVP est concluant, expérimentation auprès d'un échantillon d'utilisateurs ; si l'utilisation est au rendez-vous, diffusion plus large. Le calendrier, la composition de l'échantillon et les seuils de passage ne sont pas encore fixés.

## Proposition de solution — exigences validées

- **Produit cible :** fonctionnement dans **trois modes exclusifs par installation : Scrum, Kanban et SAFe**. Le MVP proposera les modes Scrum et Kanban ; le mode SAFe arrivera en **version 1.0**. À terme, un ART peut réunir des équipes Scrum et Kanban partageant la cadence de l'ART. Un produit unique et fixe est suivi par installation (F-41, F-49, F-50, F-121 à F-124).
- Génération des calendriers et cérémonies, gestion centralisée des membres et disponibilités, capacités de développement en JH, et saisie des exceptions plutôt que des opérations répétitives (F-26 à F-63).
- Objectifs par période et par PI, indicateurs Scrum/Kanban **tous facultatifs**, clôtures manuelles et reprises historiques traçables (F-64 à F-73, F-91 à F-96).
- Registres partagés et historisés des risques ROAM, obstacles, dépendances, décisions, actions et faits marquants (F-74 à F-90, F-110, F-111).
- Reporting à tout moment, modèles configurables, prévisualisation et formats cibles PDF, PPTX, DOCX, XLSX et HTML (F-15, F-24, F-25, F-97 à F-109). **Le calendrier de livraison de ces formats n'est pas fixé.**
- Brief IA textuel TXT prévisualisable, archivé et immuable ; transmission manuelle à une IA externe et réintégration de son analyse, sans données individuelles de membres (F-98 à F-109).
- Contexte produit, vision et Product Goal historisés, DoD/DoR restituables dans les rapports ; interface français/anglais dès le MVP, thèmes clair/sombre et CSS Bootstrap 5 (F-112 à F-124).

## Différenciation envisagée — formulation, non preuve commerciale

La combinaison d'une **mémoire qualitative historisée**, de **chiffres facultatifs et explicables**, d'une **préparation de reporting réutilisant les données existantes**, et d'une **saisie centrée sur le SM/RTE** constitue le positionnement recherché. **À valider :** alternatives réellement utilisées, avantage perçu et différenciation démontrable. Aucun avantage concurrentiel exclusif n'est affirmé.

## Critères de succès — ouverts

Les résultats observables (temps économisé pour produire un rapport, régularité du suivi, utilité des rapports pour les destinataires, qualité de la contextualisation, effort de saisie) sont **des candidats de mesure**, pas encore des objectifs chiffrés ni des critères d'acceptation validés.

## Trajectoire des livraisons — orientation validée

- **MVP :** version de validation personnelle limitée aux équipes **Scrum et Kanban**, sans mode SAFe. Les fonctionnalités détaillées réellement livrées dans ce MVP restent à prioriser.
- **Version 1.0 :** extension fonctionnelle à **SAFe**, avec les ART, leurs équipes Scrum/Kanban et les mécanismes associés déjà décidés.
- **Versions ultérieures :** améliorations du produit guidées notamment par l'usage et les retours collectés, sans liste prédéterminée.

Cette trajectoire détermine **quand** livrer la dimension SAFe, sans annuler les règles fonctionnelles F-49/F-50 déjà établies. La diffusion pilote dépend de la conclusion du MVP et ne préjuge pas de la disponibilité des fonctions RTE avant la version 1.0.

## Périmètre détaillé du MVP — encore à arbitrer

**Principes non négociables issus du cadrage :** l'application n'est pas collaborative pour les équipiers, les KPI demeurent facultatifs, les données individuelles ne sont pas transmises aux IA et l'intégration automatique Jira/API IA n'est pas requise pour la première version. L'import CSV des valeurs numériques consolidées est prévu ; les cinq formats d'export restent des capacités cibles dont la séquence de livraison est ouverte (F-01, F-15, F-16, F-19, F-72, F-102, F-108).

**À décider :** parmi les fonctions Scrum/Kanban, le parcours opérationnel indispensable au MVP, les fonctions différées (autres que SAFe, déjà reporté) et les formats de reporting livrés en priorité. Aucun périmètre fonctionnel détaillé n'est encore validé.

## Vision et adoption progressive — orientation validée

Faire mûrir SMN par l'usage personnel d'abord, par un pilote ensuite seulement si le MVP satisfait les attentes, puis envisager une diffusion élargie si l'adoption est effective. **Les indicateurs et seuils de validation de chacune de ces étapes restent ouverts.** Aucune stratégie de commercialisation ou de plateforme collaborative n'a été décidée.

## Prochaines questions du Product Brief

1. **Problème prioritaire :** dans le travail réel de Scrum Master, quelle difficulté doit être résolue en premier et comment la constate-t-on ?
2. **MVP concret :** quel premier parcours complet Scrum/Kanban apporte suffisamment de valeur pour un usage personnel quotidien ou périodique ?
3. **Critères de passage :** comment juger que le MVP est concluant pour ouvrir un pilote, puis que les retours justifient une diffusion élargie ?

---

*Les 124 décisions F-01 à F-124 restent dans le registre de référence. Toute nouvelle décision issue du Product Brief devra être validée avant d'être présentée comme actée.*
