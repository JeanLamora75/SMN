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

Ce PRD précisera les capacités, exigences fonctionnelles (FR), exigences non fonctionnelles (NFR), parcours utilisateurs (UJ), limites de livraison et critères de succès (SM) permettant de préparer les travaux BMAD d'architecture, d'UX et de découpage en Epics et User Stories. Les FR auront des identifiants stables et des références explicites aux décisions F-xx. Le détail d'implémentation relève d'un addendum ou des travaux d'architecture.

Références fonctionnelles sur `main` :
- [Contexte du projet](../../../../docs/PROJECT-CONTEXT.md)
- [Registre F-01 à F-124](../../../../docs/DECISIONS-FONCTIONNELLES.md)
- [Cadrage fonctionnel](../../../../docs/CADRAGE-FONCTIONNEL.md)

Product Brief approuvé le 18/10/2026 et journal BMAD : `_bmad-output/planning-artifacts/briefs/brief-SMN-2026-10-18/`, actuellement dans la branche `docs/bmad-product-brief-smn-20261018` ([PR #7](https://github.com/JeanLamora75/SMN/pull/7), ouverte lors de l'initialisation du PRD).

## 1. Vision — socle validé

Scrum Master Notebook (SMN) est un carnet de bord professionnel destiné au Scrum Master puis au Release Train Engineer. Il réunit la mémoire quantitative et qualitative du fonctionnement des équipes Agile afin de préparer et produire des reportings contextualisés, explicables et partageables à la demande, avec un effort de saisie réduit.

Le problème métier réunit trois difficultés : le temps nécessaire à la préparation du reporting, la dispersion des informations et la difficulté de restituer aux parties prenantes une vision cohérente des résultats, événements et décisions. SMN réutilise l'historique plutôt que de demander de reconstruire les tendances manuellement.

**Trajectoire validée :** MVP Scrum + Kanban en usage personnel ; version 1.0 avec SAFe et ART ; expérimentation pilote uniquement après satisfaction des cinq conditions cumulatives du Product Brief ; diffusion plus large conditionnée à l'usage observé.

## 2. Utilisateurs et besoins — socle validé

**Utilisateur opérateur :** Scrum Master pour le MVP ; RTE pour les usages SAFe de la version 1.0. Les membres de l'équipe et les destinataires des rapports ne sont pas chargés d'alimenter SMN.

**Besoins :** disposer d'une mémoire cohérente de la vie des équipes ; gérer les périodes, objectifs, événements et chiffres disponibles ; enregistrer les six registres qualitatifs ; conserver et reprendre les périodes passées ; expliquer les tendances ; obtenir rapidement un rapport partageable.

**Parcours de référence MVP validé :** initialiser le produit et l'équipe → préparer une période Scrum ou Kanban → suivre données, événements et informations qualitatives → dresser le bilan et clôturer manuellement → produire un rapport. L'écriture détaillée des UJ et de leurs cas limites sera travaillée en mode Coaching, sans inventer de parcours utilisateur déjà observé.

## 3. Glossaire initial

- **Installation SMN :** instance dédiée à un seul produit de référence, dont l'identité reste fixe ; le mode Scrum, Kanban ou SAFe y est également fixe.
- **Produit de référence :** produit suivi par l'installation, pouvant porter une vision et un Product Goal historisés.
- **Équipe :** collectif Scrum ou Kanban associé au produit de référence.
- **Période :** Sprint en Scrum ou période de reporting en Kanban autonome (mensuelle par défaut).
- **JH :** jour/homme, unité de capacité de développement ; distincte des Story Points.
- **Registres qualitatifs :** risques, obstacles, dépendances, décisions, actions et faits marquants.
- **Rapport :** restitution datée, contextualisée, sur période ouverte ou clôturée.

## 4. Fonctionnalités et exigences fonctionnelles

Les groupes ci-dessous constituent un **plan de travail**, pas encore le catalogue détaillé de FR. Les FR seront élaborées et numérotées globalement après examen des comportements attendus et des critères vérifiables.

| Groupe à spécifier | Principales références |
| --- | --- |
| Initialisation, produit unique, équipe, paramètres | F-01, F-05, F-41, F-49, F-112 à F-124 |
| Membres, calendriers, disponibilités, capacité | F-26 à F-39, F-53, F-58 à F-63 |
| Périodes, événements, Daily et préparation des cérémonies | F-06, F-07, F-20 à F-23, F-43 à F-57, F-91 à F-96 |
| Objectifs, KPI et imports de valeurs consolidées | F-08, F-14, F-16, F-19, F-64 à F-72 |
| Six catégories qualitatives, historique et points d'attention | F-11 à F-13, F-74 à F-90, F-110, F-111 |
| Reprise rétrospective des Sprints et tendances | Product Brief, F-14, F-24, F-25, F-64, F-72, F-91 à F-96 |
| Reportings HTML/PDF, modèles et contextualisation | Product Brief, F-10, F-15, F-24, F-25, F-97, F-117 à F-120 |
| Briefs TXT IA et analyses historiques | F-98 à F-109 |
| Extensions SAFe / ART de la version 1.0 | F-17, F-18, F-40, F-47, F-49 à F-52, F-67, F-68, F-73, F-94, F-95, F-119 |

## 5. Non-objectifs actés

SMN n'est ni un outil de saisie collaborative destiné aux membres, ni un système de tickets remplaçant Jira, ni un outil de notation des personnes ou d'animation détaillée des cérémonies. Les intégrations automatiques Jira et IA sont différées. Les formats PPTX, DOCX et XLSX sont prévus pour le produit cible mais exclus du MVP.

## 6. Périmètre MVP — décisions validées

Le MVP couvre **Scrum et Kanban** avec un cycle complet simplifié, les **six catégories qualitatives**, la **reprise manuelle des Sprints terminés**, la consultation et prévisualisation des rapports en **HTML** et l'export partageable en **PDF**.

Le modèle standard prérempli du rapport propose six sections : 1. synthèse exécutive ; 2. objectifs ; 3. indicateurs et tendances ; 4. événements Agile ; 5. points d'attention ; 6. décisions et actions. Les sections peuvent être masquées, réorganisées et complétées ; vision, Product Goal, DoD et DoR sont sélectionnables.

Le MVP est disponible en **français et anglais**. **Bootstrap 5** est le framework CSS acté, avec personnalisation par palettes et modes clair/sombre. Les KPI restent facultatifs dans tous les modes ; valeur absente et zéro ne sont pas équivalents. Le brief IA TXT est transmis manuellement à une IA externe ; aucune API IA n'est exigée.

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

Sécurité et accès ; confidentialité des informations individuelles et des contenus destinés à l'IA ; traçabilité et provenance ; sauvegarde/restauration ; intégrité des historiques et des exports ; performance ; accessibilité ; ergonomie ; internationalisation ; résilience des imports et exports. Aucun seuil ou choix de solution non validé n'est figé ici.

## 9. Questions ouvertes à traiter progressivement

- Degré de détail des parcours et formulaires, règles de validation nécessaires, notamment pour les six registres qualitatifs.
- Frontière des fonctionnalités avancées entre MVP, version 1.0 et versions ultérieures.
- Méthodes de calcul et unités exactes des KPI ; correction, traçabilité et imports CSV.
- Gabarits HTML/PDF et amplitude des personnalisations du rapport.
- Confidentialité, mécanismes de protection des données, sauvegardes, accessibilité, langue des contenus libres et exports.
- Méthode de mesure des cinq conditions de succès et contre-indicateurs.

## 10. Hypothèses

Aucune hypothèse fonctionnelle additionnelle n'est présentée comme une décision. Toute hypothèse nouvelle sera balisée `[ASSUMPTION]` puis validée ou classée comme point ouvert.

---

*Initialisé le 18 octobre 2026 sur une branche GitHub dédiée. Le travail de formulation détaillée des exigences, la revue et la finalisation BMAD restent à mener.*
