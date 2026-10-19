---
status: in-progress
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/prd.md"
  - "_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/securite-exploitation.md"
  - "_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md"
  - "_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md"
  - "_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/sequencement-mvp-d-prd-131.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/SECURITE-EXPLOITATION.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/DESIGN-TECHNIQUE.md"
---

# Scrum Master Notebook (SMN) - Epic Breakdown

## Overview
Découpage BMAD Method v6.12.4. Structure de **10 Epics approuvée le 19/10/2026**. Les Stories de l'Epic 1 ont été validées globalement par l'utilisateur le même jour ; les Stories de l'Epic 2 ont été publiées sur Jira pour lecture et validation groupée.
**Périmètre** : MVP Scrum et Kanban ; deux rôles seulement (Administrateur / Utilisateur), SAFe différé. Les incréments I0–I6 ne déterminent pas les limites des Epics.
**Publication** : Jira est la référence des tickets ; ce document conserve leur contenu et traçabilité. L'utilisateur autorise l'édition documentaire GitHub sur branche dédiée ainsi que la publication directe de toutes les Stories de l'Epic 2 pour revue groupée. Aucun développement, test technique, fusion `main` ou validation des Stories de l'Epic 2 n'est impliqué.
**Avancement** : Steps 1 et 2 clos. Step 3 en cours (Epics 1 et 2 renseignées sur 10). Ne pas passer au Step 4 avant achèvement du Step 3 et nouvelle confirmation BMAD.

## Requirements Inventory

### Functional Requirements
- **FR-1** — Choix du parcours d'initialisation (validé : D-PRD-002, D-PRD-042, D-PRD-044, D-PRD-087 à D-PRD-091 ; F-114, F-123, F-124)
- **FR-2** — Accès au tableau de bord après l'initialisation (validé : D-PRD-003)
- **FR-3** — Suivi facultatif de la configuration depuis le tableau de bord (validé : D-PRD-004, D-PRD-005)
- **FR-4** — Supprimer, retirer d'une équipe ou archiver un membre (validé : D-PRD-006, D-PRD-012 ; F-26 à F-31, F-58 à F-63, F-93)
- **FR-5** — Création rapide et enrichissement des membres (validé : D-PRD-007, D-PRD-009, D-PRD-010 ; F-05, F-26, F-28, F-31, F-38, F-39, F-58 à F-63)
- **FR-6** — Adresse e-mail du membre (validé : D-PRD-008 ; F-28)
- **FR-7** — Préconfiguration d'une équipe d'au moins trois personnes (validé : D-PRD-010, D-PRD-011, D-PRD-012 ; F-38/F-39, F-62/F-63, F-114/F-124)
- **FR-8** — Initialiser et personnaliser le calendrier de travail d'un membre (validé : D-PRD-013 ; F-26 à F-30, F-35, F-59)
- **FR-9** — Localisation proposée depuis les paramètres de l'installation (validé : D-PRD-014 ; F-04, F-28, F-35, F-53, F-112)
- **FR-10** — Gérer les pays et leurs calendriers de jours fériés (validé : D-PRD-015 à D-PRD-023 ; F-35/F-36, avec précision de périmètre régional pour le MVP)
- **FR-11** — Enregistrer une particularité régionale comme absence individuelle (validé : D-PRD-021, D-PRD-026, D-PRD-027 ; F-27 à F-29, F-35, F-55)
- **FR-12** — Gérer une absence depuis deux points d'accès (validé : D-PRD-024, D-PRD-026, D-PRD-027 ; F-27 à F-29, F-35, F-55)
- **FR-13** — Administrer les catégories et couleurs des absences (validé : D-PRD-027 à D-PRD-030 ; F-29)
- **FR-14** — Figer la capacité initialement prévue et suivre la capacité réelle d'une période (validé : D-PRD-031 à D-PRD-035, D-PRD-114 à D-PRD-115 ; F-27 à F-34, F-58 à F-63, F-93/F-96)
- **FR-15** — Configurer la durée, créer et gérer les Sprints (validé : D-PRD-036 à D-PRD-038, D-PRD-044, D-PRD-049, D-PRD-094 à D-PRD-120 ; F-43, F-44, F-45, F-93/F-96)
- **FR-16** — Terminer automatiquement, clôturer et rouvrir un Sprint (validé : D-PRD-039, D-PRD-040, D-PRD-049, D-PRD-110, D-PRD-115 à D-PRD-117 ; F-64 à F-72, F-93/F-96)
- **FR-17** — Générer les événements Scrum dès la création du Sprint (validé : D-PRD-041 à D-PRD-045, D-PRD-049 à D-PRD-057, D-PRD-060, D-PRD-061, D-PRD-064 à D-PRD-066, D-PRD-112 à D-PRD-113 ; F-44 à F-48, F-53 à F-57)
- **FR-18** — Créer une réunion exceptionnelle ou un modèle récurrent propre à l'équipe (validé : D-PRD-046, D-PRD-048, D-PRD-056 à D-PRD-058, D-PRD-060, D-PRD-061, D-PRD-064 à D-PRD-066, D-PRD-112 à D-PRD-113 ; F-45, F-48, F-53, F-56/F-57, F-60)
- **FR-19** — Déduire facultativement les réunions exceptionnelles de la capacité des développeurs (validé : D-PRD-047, précisé et restreint par D-PRD-048, complété par D-PRD-059 à D-PRD-064 ; F-60 préservée pour les cérémonies, cohérence F-30/F-31/F-58/F-59/F-61 et FR-14)
- **FR-20** — Saisir et consulter les métriques liées au bilan du Sprint sur un même écran (validé : D-PRD-067 à D-PRD-078, D-PRD-108, D-PRD-116 et D-PRD-117 ; F-08, F-14, F-16, F-19, F-64 à F-66, F-72, F-91 à F-93, F-96)
- **FR-21** — Réutiliser la structure et les principes du bilan selon le mode Agile (validé : D-PRD-079, D-PRD-081 à D-PRD-086, D-PRD-108, D-PRD-110 et D-PRD-114 à D-PRD-121 ; F-01, F-14, F-49/F-50, F-61, F-66 à F-73, F-91 à F-96)
- **FR-22** — Saisir les cinq métriques facultatives de flux Kanban et visualiser les tendances définies (validé : D-PRD-080 à D-PRD-086, D-PRD-116 ; F-08, F-14, F-16, F-19, F-49, F-69, F-71/F-72, F-91/F-93/F-96)
- **FR-23** — Configurer et générer les périodes Kanban à la demande (validé : D-PRD-087 à D-PRD-120 ; F-43, F-49, F-91 à F-93, F-114/F-124)
- **FR-24** — Générer plusieurs cycles en une seule opération quel que soit le mode (validé : D-PRD-094 à D-PRD-120 ; D-PRD-037, D-PRD-093 ; F-43/F-49/F-50, F-91 à F-93)
- **FR-25** — Registre commun des risques et dépendances, liens multi-cycles et protection lors d'une replanification (validé : D-PRD-120 à D-PRD-122 ; F-74 à F-90, F-91/F-93/F-96)
- **FR-26** — Lancer un rapport depuis la fiche d'un cycle (RPT-01)
- **FR-27** — Préremplir les six sections et permettre des commentaires volontaires (RPT-02)
- **FR-28** — Sélectionner les contenus du rapport (RPT-03)
- **FR-29** — Réutiliser des modèles de rapport (RPT-04)
- **FR-30** — Garantir la fidélité des tendances et données historiques (RPT-05)
- **FR-31** — Prévisualiser le rapport HTML et exporter un PDF fidèle (RPT-06)
- **FR-32** — Produire les libellés en français ou anglais sans traduire les textes libres (RPT-07)
- **FR-33** — Présenter un rapport professionnel respectueux de la confidentialité (RPT-08)
- **FR-34** — Créer rapidement une fiche qualitative (QLT-01)
- **FR-35** — Consulter des registres centralisés et des relations historisées (QLT-02)
- **FR-36** — Évaluer la criticité indicative des risques (QLT-03)
- **FR-37** — Créer des objets liés avec assistance (QLT-04)
- **FR-38** — Gérer les dépendances internes et externes (QLT-05)
- **FR-39** — Signaler les points d'attention (QLT-06)
- **FR-40** — Alimenter et administrer les faits marquants (QLT-07)
- **FR-41** — Figer les six registres à la clôture pour les bilans (QLT-08)
- **FR-42** — Reprendre manuellement des Sprints historiques (HIS-01)
- **FR-43** — Importer des CSV de chiffres consolidés (HIS-02)
- **FR-44** — Prévisualiser l'import (HIS-03)
- **FR-45** — Protéger les valeurs préexistantes (HIS-04)
- **FR-46** — Qualifier les données historiques (HIS-05)
- **FR-47** — Accepter des bilans historiques partiels (HIS-06)
- **FR-48** — Intégrer les périodes reprises aux tendances (HIS-07)
- **FR-49** — Historiser les imports CSV (HIS-08)
- **FR-50** — Générer un brief depuis un cycle, son bilan ou un rapport (IA-01)
- **FR-51** — Configurer des modèles réutilisables de briefs (IA-02)
- **FR-52** — Structurer les faits et observations du TXT (IA-03)
- **FR-53** — Contrôler la confidentialité du contenu transmis (IA-04)
- **FR-54** — Archiver un TXT immuable et le dupliquer (IA-05)
- **FR-55** — Coller la réponse IA et la relier au brief (IA-06)
- **FR-56** — Historiser et gérer les analyses (IA-07)
- **FR-57** — Restituer les analyses sans les faire passer pour des mesures (IA-08)
- **FR-58** — Tableau de bord de pilotage courant (UX-01)
- **FR-59** — Navigation fonctionnelle regroupée (UX-02)
- **FR-60** — Liens de navigation contextuels (UX-03)
- **FR-61** — Préremplissage fiable et saisie minimale (UX-04)
- **FR-62** — Calendrier central et filtres (UX-05)
- **FR-63** — Responsive et accessibilité des parcours essentiels (UX-06)
- **FR-64** — Protection des modifications non enregistrées (UX-07)
- **FR-65** — Assistance initiale progressive (UX-08)
- **FR-66** — Protéger les accès et préparer les futurs droits (SEC-01)
- **FR-67** — Garantir la confidentialité des données et exports (SEC-02)
- **FR-68** — Permettre la sauvegarde et la restauration complètes (SEC-03)
- **FR-69** — Sécuriser les suppressions, archivages et réinitialisations (SEC-04)
- **FR-70** — Tracer les opérations métier importantes (SEC-05)
- **FR-71** — Maintenir l'intégrité et l'atomicité validées (SEC-06)
- **FR-72** — Configurer l'application sans exposer de secrets (SEC-07)
- **FR-73** — Rendre les erreurs et interruptions explicites (SEC-08)
- **FR-74** — Tracer les exigences et les scénarios de recette (REC-01)
- **FR-75** — Vérifier les parcours Scrum et Kanban de bout en bout (REC-02)
- **FR-76** — Mesurer les cinq conditions de succès cumulatives (REC-03)
- **FR-77** — Vérifier la qualité des données historiques (REC-04)
- **FR-78** — Contrôler les rapports et briefs IA TXT (REC-05)
- **FR-79** — Recetter sécurité et résilience (REC-06)
- **FR-80** — Mesurer compatibilité et accessibilité (REC-07)
- **FR-81** — Décider formellement du passage au pilote (REC-08)

### NonFunctional Requirements
- **NFR-1** — Interface navigateur responsive ordinateur/tablette/mobile et parcours essentiels accessibles.
- **NFR-2** — Saisie minimale, préremplissage fiable, absence distincte de zéro ; retour d'écriture explicite.
- **NFR-3** — Mutualiser les fonctions communes Scrum/Kanban sans transposer leurs métriques différentes.
Les budgets A5 (p95 et accessibilité) sont indicatifs et devront être éprouvés, non déclarés conformes par la seule rédaction.

### Additional Requirements
- **AD-1** — Monolithe modulaire
- **AD-2** — Propriétaire unique par donnée
- **AD-3** — Orchestration des mutations transverses
- **AD-4** — Domaine indépendant des adaptateurs
- **AD-5** — Mutualiser sans assimiler les modes
- **AD-6** — Sélection métier commune aux restitutions
- **AD-7** — Authentification hors installation initiale
- **AD-8** — Comptes et permissions distincts des membres
- **AD-9** — Comptes créés dans l'administration
- **AD-10** — Confidentialité et secrets
- **AD-11** — Réconciliation temporelle sans faux passé
- **AD-12** — Paramètres des membres à effet daté
- **AD-13** — Dépassement Scrum autorisé
- **AD-14** — Sémantique temporelle commune
- **AD-15** — Intervalles et chevauchements
- **AD-16** — Calendrier et capacité sans double déduction
- **AD-17** — Génération explicite et événements matérialisés
- **AD-18** — Cycle de vie et événements historiques protégés
- **AD-19** — Révisions métier et temporalité
- **AD-20** — Clôtures versionnées immuables
- **AD-21** — Import CSV strict et atomique
- **AD-22** — Restitution multitemporelle fidèle
- **AD-23** — Politique IA plus restrictive
- **AD-24** — Archives TXT et analyses associées
- **AD-25** — PostgreSQL unique dès le MVP
- **AD-26** — Identité et documents contrôlés côté serveur
- **AD-27** — Base et stockage privé cohérents
- **AD-28** — Déploiement utilisateur et évolutivité
- **AD-29** — Exploitation et conservation vérifiables
- **AD-30** — Vérification progressive et portes de sortie
- **AD-31** — Évolution contrôlée des profils d'accès [ADOPTED — CORRIGÉ D-PRD-136]
- **D-PRD-134 / A10** — Archiver automatiquement chaque export PDF réussi, jamais un simple aperçu HTML ; archive privée et immuable sans purge d'âge automatique.
- **D-PRD-135 / A11** — Effacement/anonymisation exceptionnel avec analyse d'impacts, traitement des PDF/TXT et prévention de réintroduction ; sauvegardes gérées 30 jours par défaut configurables.
- **D-PRD-136 / AD-31** — Deux rôles MVP uniquement, Administrateur et Utilisateur ; consultation/téléchargement collectif autorisé sans édition.

### UX Design Requirements
Source : annexe PRD `parcours-utilisateur-ergonomie.md` (pas de document UX autonome produit sur la branche).
- UX-DR01 — Navigation groupée par fonctions, selon le mode et les droits (FR-59).
- UX-DR02 — Tableau de bord contextualisé produit/équipe/cycle (FR-58).
- UX-DR03 — États vides et absences de métriques fidèles, sans fausses valeurs zéro (FR-58).
- UX-DR04 — Liens contextuels, préservation du contexte historique et autorisations (FR-60).
- UX-DR05 — Préremplissage uniquement depuis des sources connues (FR-61).
- UX-DR06 — Calendrier unifié avec filtres et fuseaux fiables (FR-62).
- UX-DR07 — Bilans : trois blocs éditables indépendants, tendances en lecture seule (FR-20/21/64).
- UX-DR08 — Détection de brouillons et avertissement avant perte (FR-64).
- UX-DR09 — Messages de succès/échec conformes à la persistance réelle (FR-64/73).
- UX-DR10 — Parcours Express/Guidé, tâches facultatives À faire/Terminée/Ignorée (FR-1/2/3/65).
- UX-DR11 — Responsive desktop/tablette/mobile (FR-63).
- UX-DR12 — Interface FR/EN, textes libres non traduits (FR-63).
- UX-DR13 — Thèmes clair/sombre et signalétique non fondée sur la couleur seule (FR-63).
- UX-DR14 — Focus, clavier, noms accessibles et alternatives textuelles (FR-63).
- UX-DR15 — Confirmation et aperçu avant lot, import, replanification et effacement (FR-24/44/64/69).
- UX-DR16 — Risques : matrice 3×3 et criticité compréhensible sans seule couleur (FR-36, D-PRD-132).
- UX-DR17 — Rapport : aperçu, options et consultation des PDF conservés (FR-28–33, D-PRD-134).
- UX-DR18 — TXT IA : aperçu intégral et revue explicite de confidentialité avant archivage (FR-50–57).

### FR Coverage Map
**Responsabilité primaire : 81/81 FR, chaque FR affectée à une Epic.** Les exigences transversales sont reprises par les autres Stories métier concernées.
FR-1: Epic 1 — Choix du parcours d'initialisation (validé : D-PRD-002, D-PRD-042, D-PRD-044, D-PRD-087 à D-PRD-091 ; F-114, F-123, F-124)
FR-2: Epic 1 — Accès au tableau de bord après l'initialisation (validé : D-PRD-003)
FR-3: Epic 1 — Suivi facultatif de la configuration depuis le tableau de bord (validé : D-PRD-004, D-PRD-005)
FR-4: Epic 3 — Supprimer, retirer d'une équipe ou archiver un membre (validé : D-PRD-006, D-PRD-012 ; F-26 à F-31, F-58 à F-63, F-93)
FR-5: Epic 3 — Création rapide et enrichissement des membres (validé : D-PRD-007, D-PRD-009, D-PRD-010 ; F-05, F-26, F-28, F-31, F-38, F-39, F-58 à F-63)
FR-6: Epic 3 — Adresse e-mail du membre (validé : D-PRD-008 ; F-28)
FR-7: Epic 3 — Préconfiguration d'une équipe d'au moins trois personnes (validé : D-PRD-010, D-PRD-011, D-PRD-012 ; F-38/F-39, F-62/F-63, F-114/F-124)
FR-8: Epic 3 — Initialiser et personnaliser le calendrier de travail d'un membre (validé : D-PRD-013 ; F-26 à F-30, F-35, F-59)
FR-9: Epic 3 — Localisation proposée depuis les paramètres de l'installation (validé : D-PRD-014 ; F-04, F-28, F-35, F-53, F-112)
FR-10: Epic 3 — Gérer les pays et leurs calendriers de jours fériés (validé : D-PRD-015 à D-PRD-023 ; F-35/F-36, avec précision de périmètre régional pour le MVP)
FR-11: Epic 3 — Enregistrer une particularité régionale comme absence individuelle (validé : D-PRD-021, D-PRD-026, D-PRD-027 ; F-27 à F-29, F-35, F-55)
FR-12: Epic 3 — Gérer une absence depuis deux points d'accès (validé : D-PRD-024, D-PRD-026, D-PRD-027 ; F-27 à F-29, F-35, F-55)
FR-13: Epic 3 — Administrer les catégories et couleurs des absences (validé : D-PRD-027 à D-PRD-030 ; F-29)
FR-14: Epic 3 — Figer la capacité initialement prévue et suivre la capacité réelle d'une période (validé : D-PRD-031 à D-PRD-035, D-PRD-114 à D-PRD-115 ; F-27 à F-34, F-58 à F-63, F-93/F-96)
FR-15: Epic 4 — Configurer la durée, créer et gérer les Sprints (validé : D-PRD-036 à D-PRD-038, D-PRD-044, D-PRD-049, D-PRD-094 à D-PRD-120 ; F-43, F-44, F-45, F-93/F-96)
FR-16: Epic 4 — Terminer automatiquement, clôturer et rouvrir un Sprint (validé : D-PRD-039, D-PRD-040, D-PRD-049, D-PRD-110, D-PRD-115 à D-PRD-117 ; F-64 à F-72, F-93/F-96)
FR-17: Epic 4 — Générer les événements Scrum dès la création du Sprint (validé : D-PRD-041 à D-PRD-045, D-PRD-049 à D-PRD-057, D-PRD-060, D-PRD-061, D-PRD-064 à D-PRD-066, D-PRD-112 à D-PRD-113 ; F-44 à F-48, F-53 à F-57)
FR-18: Epic 4 — Créer une réunion exceptionnelle ou un modèle récurrent propre à l'équipe (validé : D-PRD-046, D-PRD-048, D-PRD-056 à D-PRD-058, D-PRD-060, D-PRD-061, D-PRD-064 à D-PRD-066, D-PRD-112 à D-PRD-113 ; F-45, F-48, F-53, F-56/F-57, F-60)
FR-19: Epic 4 — Déduire facultativement les réunions exceptionnelles de la capacité des développeurs (validé : D-PRD-047, précisé et restreint par D-PRD-048, complété par D-PRD-059 à D-PRD-064 ; F-60 préservée pour les cérémonies, cohérence F-30/F-31/F-58/F-59/F-61 et FR-14)
FR-20: Epic 4 — Saisir et consulter les métriques liées au bilan du Sprint sur un même écran (validé : D-PRD-067 à D-PRD-078, D-PRD-108, D-PRD-116 et D-PRD-117 ; F-08, F-14, F-16, F-19, F-64 à F-66, F-72, F-91 à F-93, F-96)
FR-21: Epic 7 — Réutiliser la structure et les principes du bilan selon le mode Agile (validé : D-PRD-079, D-PRD-081 à D-PRD-086, D-PRD-108, D-PRD-110 et D-PRD-114 à D-PRD-121 ; F-01, F-14, F-49/F-50, F-61, F-66 à F-73, F-91 à F-96)
FR-22: Epic 7 — Saisir les cinq métriques facultatives de flux Kanban et visualiser les tendances définies (validé : D-PRD-080 à D-PRD-086, D-PRD-116 ; F-08, F-14, F-16, F-19, F-49, F-69, F-71/F-72, F-91/F-93/F-96)
FR-23: Epic 7 — Configurer et générer les périodes Kanban à la demande (validé : D-PRD-087 à D-PRD-120 ; F-43, F-49, F-91 à F-93, F-114/F-124)
FR-24: Epic 4 — Générer plusieurs cycles en une seule opération quel que soit le mode (validé : D-PRD-094 à D-PRD-120 ; D-PRD-037, D-PRD-093 ; F-43/F-49/F-50, F-91 à F-93)
FR-25: Epic 5 — Registre commun des risques et dépendances, liens multi-cycles et protection lors d'une replanification (validé : D-PRD-120 à D-PRD-122 ; F-74 à F-90, F-91/F-93/F-96)
FR-26: Epic 6 — Lancer un rapport depuis la fiche d'un cycle (RPT-01)
FR-27: Epic 6 — Préremplir les six sections et permettre des commentaires volontaires (RPT-02)
FR-28: Epic 6 — Sélectionner les contenus du rapport (RPT-03)
FR-29: Epic 6 — Réutiliser des modèles de rapport (RPT-04)
FR-30: Epic 6 — Garantir la fidélité des tendances et données historiques (RPT-05)
FR-31: Epic 6 — Prévisualiser le rapport HTML et exporter un PDF fidèle (RPT-06)
FR-32: Epic 6 — Produire les libellés en français ou anglais sans traduire les textes libres (RPT-07)
FR-33: Epic 6 — Présenter un rapport professionnel respectueux de la confidentialité (RPT-08)
FR-34: Epic 5 — Créer rapidement une fiche qualitative (QLT-01)
FR-35: Epic 5 — Consulter des registres centralisés et des relations historisées (QLT-02)
FR-36: Epic 5 — Évaluer la criticité indicative des risques (QLT-03)
FR-37: Epic 5 — Créer des objets liés avec assistance (QLT-04)
FR-38: Epic 5 — Gérer les dépendances internes et externes (QLT-05)
FR-39: Epic 5 — Signaler les points d'attention (QLT-06)
FR-40: Epic 5 — Alimenter et administrer les faits marquants (QLT-07)
FR-41: Epic 5 — Figer les six registres à la clôture pour les bilans (QLT-08)
FR-42: Epic 8 — Reprendre manuellement des Sprints historiques (HIS-01)
FR-43: Epic 8 — Importer des CSV de chiffres consolidés (HIS-02)
FR-44: Epic 8 — Prévisualiser l'import (HIS-03)
FR-45: Epic 8 — Protéger les valeurs préexistantes (HIS-04)
FR-46: Epic 8 — Qualifier les données historiques (HIS-05)
FR-47: Epic 8 — Accepter des bilans historiques partiels (HIS-06)
FR-48: Epic 8 — Intégrer les périodes reprises aux tendances (HIS-07)
FR-49: Epic 8 — Historiser les imports CSV (HIS-08)
FR-50: Epic 9 — Générer un brief depuis un cycle, son bilan ou un rapport (IA-01)
FR-51: Epic 9 — Configurer des modèles réutilisables de briefs (IA-02)
FR-52: Epic 9 — Structurer les faits et observations du TXT (IA-03)
FR-53: Epic 9 — Contrôler la confidentialité du contenu transmis (IA-04)
FR-54: Epic 9 — Archiver un TXT immuable et le dupliquer (IA-05)
FR-55: Epic 9 — Coller la réponse IA et la relier au brief (IA-06)
FR-56: Epic 9 — Historiser et gérer les analyses (IA-07)
FR-57: Epic 9 — Restituer les analyses sans les faire passer pour des mesures (IA-08)
FR-58: Epic 1 — Tableau de bord de pilotage courant (UX-01)
FR-59: Epic 1 — Navigation fonctionnelle regroupée (UX-02)
FR-60: Epic 1 — Liens de navigation contextuels (UX-03)
FR-61: Epic 3 — Préremplissage fiable et saisie minimale (UX-04)
FR-62: Epic 3 — Calendrier central et filtres (UX-05)
FR-63: Epic 1 — Responsive et accessibilité des parcours essentiels (UX-06)
FR-64: Epic 1 — Protection des modifications non enregistrées (UX-07)
FR-65: Epic 1 — Assistance initiale progressive (UX-08)
FR-66: Epic 1 — Protéger les accès et préparer les futurs droits (SEC-01)
FR-67: Epic 1 — Garantir la confidentialité des données et exports (SEC-02)
FR-68: Epic 2 — Permettre la sauvegarde et la restauration complètes (SEC-03)
FR-69: Epic 2 — Sécuriser les suppressions, archivages et réinitialisations (SEC-04)
FR-70: Epic 2 — Tracer les opérations métier importantes (SEC-05)
FR-71: Epic 2 — Maintenir l'intégrité et l'atomicité validées (SEC-06)
FR-72: Epic 1 — Configurer l'application sans exposer de secrets (SEC-07)
FR-73: Epic 2 — Rendre les erreurs et interruptions explicites (SEC-08)
FR-74: Epic 10 — Tracer les exigences et les scénarios de recette (REC-01)
FR-75: Epic 10 — Vérifier les parcours Scrum et Kanban de bout en bout (REC-02)
FR-76: Epic 10 — Mesurer les cinq conditions de succès cumulatives (REC-03)
FR-77: Epic 10 — Vérifier la qualité des données historiques (REC-04)
FR-78: Epic 10 — Contrôler les rapports et briefs IA TXT (REC-05)
FR-79: Epic 10 — Recetter sécurité et résilience (REC-06)
FR-80: Epic 10 — Mesurer compatibilité et accessibilité (REC-07)
FR-81: Epic 10 — Décider formellement du passage au pilote (REC-08)

## Epic List

### Epic 1: Initialiser et utiliser un espace SMN privé
Créer une installation privée, administrer deux profils et accéder à une interface fiable.
**FRs couvertes :** FR-1, FR-2, FR-3, FR-58, FR-59, FR-60, FR-63, FR-64, FR-65, FR-66, FR-67, FR-72.
**Incrément(s) :** I0, compléments UX I1–I5.
**Jira :** https://lmn24.atlassian.net/browse/SMN-1

### Epic 2: Préserver, restaurer et maîtriser les données de son carnet
Sauvegarder et restaurer l'installation, tracer les opérations sensibles et maîtriser suppression, anonymisation et confidentialité.
**FRs couvertes :** FR-68, FR-69, FR-70, FR-71, FR-73.
**Incrément(s) :** I0–I6.
**Jira :** https://lmn24.atlassian.net/browse/SMN-2

### Epic 3: Constituer ses équipes et fiabiliser leurs calendriers et capacités
Configurer les membres, affectations, calendriers, absences et capacités sans saisie redondante.
**FRs couvertes :** FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-61, FR-62.
**Incrément(s) :** I1–I2.
**Jira :** https://lmn24.atlassian.net/browse/SMN-3

### Epic 4: Préparer, suivre et clôturer ses Sprints Scrum
Générer les Sprints et leurs cérémonies, suivre les métriques et clôturer des bilans versionnés.
**FRs couvertes :** FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-24.
**Incrément(s) :** I1–I2.
**Jira :** https://lmn24.atlassian.net/browse/SMN-4

### Epic 5: Suivre les risques, obstacles, dépendances et décisions de l'équipe
Gérer les six registres, suivre les risques/dépendances et conserver les traces historiques et faits saillants.
**FRs couvertes :** FR-25, FR-34, FR-35, FR-36, FR-37, FR-38, FR-39, FR-40, FR-41.
**Incrément(s) :** I1–I3.
**Jira :** https://lmn24.atlassian.net/browse/SMN-5

### Epic 6: Composer, exporter et retrouver des rapports professionnels
Prévisualiser les rapports HTML, produire des PDF fidèles et conserver les archives documentaires autorisées.
**FRs couvertes :** FR-26, FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33.
**Incrément(s) :** I1–I2.
**Jira :** https://lmn24.atlassian.net/browse/SMN-6

### Epic 7: Piloter les périodes Kanban et leurs indicateurs de flux
Générer des périodes Kanban et suivre leurs KPI/bilans grâce aux capacités métier partagées.
**FRs couvertes :** FR-21, FR-22, FR-23.
**Incrément(s) :** I3.
**Jira :** https://lmn24.atlassian.net/browse/SMN-7

### Epic 8: Reconstituer les Sprints passés et fiabiliser les tendances
Reprendre des cycles historiques et importer les métriques consolidées sans créer de faux historiques.
**FRs couvertes :** FR-42, FR-43, FR-44, FR-45, FR-46, FR-47, FR-48, FR-49.
**Incrément(s) :** I4.
**Jira :** https://lmn24.atlassian.net/browse/SMN-8

### Epic 9: Préparer des briefs IA confidentiels et conserver les analyses
Préparer les TXT, les partager manuellement et conserver les analyses séparées des faits mesurés.
**FRs couvertes :** FR-50, FR-51, FR-52, FR-53, FR-54, FR-55, FR-56, FR-57.
**Incrément(s) :** I5.
**Jira :** https://lmn24.atlassian.net/browse/SMN-9

### Epic 10: Prouver la qualité du MVP et décider de son passage au pilote
Contrôler la recette, les mesures et les cinq conditions de réussite avant décision de pilote.
**FRs couvertes :** FR-74, FR-75, FR-76, FR-77, FR-78, FR-79, FR-80, FR-81.
**Incrément(s) :** I6.
**Jira :** https://lmn24.atlassian.net/browse/SMN-10

## Epic 1: Initialiser et utiliser un espace SMN privé
Créer une installation privée, administrer deux profils et accéder à une interface fiable.
**FRs couvertes :** FR-1, FR-2, FR-3, FR-58, FR-59, FR-60, FR-63, FR-64, FR-65, FR-66, FR-67, FR-72.

### Story 1.1: Démarrer SMN localement et vérifier les prérequis
**Jira :** https://lmn24.atlassian.net/browse/SMN-11
**En tant que** Scrum Master souhaitant installer SMN sur mon ordinateur personnel,
**je veux** démarrer l'application et vérifier automatiquement que son environnement technique est opérationnel,
**afin de** commencer son initialisation sans IDE supplémentaire, droits administrateur Windows ou résolution manuelle d'erreurs incompréhensibles.

**Critères d'acceptation :**

#### AC1 — Démarrage local sans privilèges élevés

**Given** un PC Windows 11 disposant de Node.js, pnpm et des prérequis applicables,
**When** l'Administrateur lance SMN depuis sa session Windows,
**Then** le serveur démarre localement et fournit une adresse ouvrable dans le navigateur,
**And** aucune installation de Docker, IDE supplémentaire ou élévation de privilèges n'est exigée.

#### AC2 — Vérification de PostgreSQL

**Given** un serveur PostgreSQL local configuré,
**When** SMN effectue les contrôles au démarrage,
**Then** la connectivité et les droits minimaux d'accès nécessaires sont vérifiés,
**And** aucun privilège de création de base ou d'administration PostgreSQL n'est présumé.

#### AC3 — Première initialisation disponible

**Given** une base accessible sans installation SMN déjà initialisée,
**When** l'utilisateur ouvre SMN,
**Then** un écran d'accueil permet de commencer l'initialisation,
**And** ni équipe, ni Sprint, ni période Kanban ne sont créés par le seul démarrage.

#### AC4 — Blocage du parcours vierge après initialisation

**Given** une installation SMN existante,
**When** un visiteur non authentifié essaie d'ouvrir l'assistant initial ou une page privée par URL directe,
**Then** l'accès est refusé côté serveur,
**And** une seconde installation n'est pas créée par ce parcours.

#### AC5 — Erreur PostgreSQL traitée sans faux succès

**Given** PostgreSQL arrêté ou un paramétrage de connexion erroné,
**When** le contrôle des prérequis échoue,
**Then** un diagnostic compréhensible empêche de présenter l'initialisation comme réussie,
**And** le contrôle peut être relancé après correction,
**And** aucune installation partielle n'est annoncée comme opérationnelle.

#### AC6 — Secrets protégés

**Given** une configuration comportant des informations de connexion sensibles,
**When** les contrôles s'exécutent ou échouent,
**Then** mots de passe et secrets ne figurent ni dans l'interface ni dans les journaux,
**And** ils ne sont pas publiés dans des fichiers destinés à GitHub.

#### Traçabilité

* Epic parente : SMN-1 — Initialiser et utiliser un espace SMN privé.
* Incrément : I0 — Socle de l'application.
* FR : FR-1, FR-66, FR-72 (couverture préparatoire, non exhaustive de ces exigences).
* NFR : NFR-1.
* AD : AD-7, AD-10, AD-25, AD-28, AD-29.
* UX : UX-DR09, UX-DR10.
* Environnement : Windows 11, TypeScript, Node.js, PostgreSQL, Bootstrap 5 ; sans droits administrateur Windows ni IDE.
* Risques/prérequis : compatibilité réelle PostgreSQL local, outillage de démarrage, packaging Windows et accès au navigateur à éprouver par POC I0.
* Hors Story : parcours Express/Guidé détaillé, administration des comptes et création des cycles.
* Dépendances : aucune Story future ; créer uniquement les schémas nécessaires à cette capacité.
* Décision métier : Story 1.1 validée par l'utilisateur le 19/10/2026.
* État : spécification validée, développement et tests non exécutés.
* Référence BMAD : `bmad-create-epics-and-stories` v6.12.4, `docs/bmad-arbitrages-metier-valides-20261019`.


**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.2: Initialiser une installation Express et son Administrateur de manière sûre
**Jira :** https://lmn24.atlassian.net/browse/SMN-12
**En tant que** Scrum Master lors du premier lancement,
**je veux** initialiser mon installation par le parcours Express en renseignant son mode, son produit et sa première équipe,
**afin de** accéder à un espace cohérent et privé avec le minimum de saisie métier.

**Critères d'acceptation :**

#### AC1 — Base PostgreSQL vierge accessible et contexte local d'amorçage autorisé

**Given** Base PostgreSQL vierge accessible et contexte local d'amorçage autorisé,
**When** le Scrum Master ouvre l'assistant Express,
**Then** un choix expliqué Scrum/Kanban, un nom de produit et un nom de première équipe sont les seules données métier obligatoires ; SAFe n'est pas proposé comme mode actif.

#### AC2 — Les trois données métier sont valides et l'administrateur initial peut être créé de manière sûre

**Given** Les trois données métier sont valides et l'administrateur initial peut être créé de manière sûre,
**When** le Scrum Master confirme l'initialisation,
**Then** l'installation unique, son produit de référence, sa première équipe et le compte Administrateur sont enregistrés dans une opération cohérente ; la navigation conduit au tableau de bord, sans création de cycles.

#### AC3 — Une installation a été créée

**Given** Une installation a été créée,
**When** une demande cherche à modifier le mode ou le produit de référence ou à relancer l'amorçage anonyme,
**Then** le serveur refuse l'opération ; le mode et le produit restent fixes pour cette installation.

#### AC4 — Deux tentatives d'amorçage concurrentes ou une panne PostgreSQL surviennent

**Given** Deux tentatives d'amorçage concurrentes ou une panne PostgreSQL surviennent,
**When** la confirmation est exécutée,
**Then** une seule initialisation peut réussir ; aucune installation partielle n'est présentée comme achevée et aucune donnée métier privée n'est ouverte anonymement.

#### AC5 — Un compte initial doit être amorcé

**Given** Un compte initial doit être amorcé,
**When** SMN prépare son premier accès,
**Then** le mécanisme ne publie aucun secret en clair ; le changement de secret initial est obligatoire avant l'utilisation métier ; l'identifiant documenté est `admin@locahost.com` (orthographe de l'architecture conservée jusqu'à éventuelle correction décidée).

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-1, FR-2, FR-65, FR-66, FR-72.
* Architecture/décisions : AD-7/9/25/26/28/31 ; D-PRD-001/002 ; D-PRD-136.
* UX : UX-DR10/15.
* Dépendances préalables : Story 1.1. Aucun composant des Epics ultérieures requis.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.3: Accompagner l'initialisation avec un parcours Guidé facultatif
**Jira :** https://lmn24.atlassian.net/browse/SMN-13
**En tant que** Scrum Master configurant SMN,
**je veux** choisir une initialisation Guidée et personnaliser seulement les réglages qui me sont utiles,
**afin de** être accompagné sans devoir tout configurer avant de travailler.

**Critères d'acceptation :**

#### AC1 — L'installation n'est pas encore finalisée

**Given** L'installation n'est pas encore finalisée,
**When** je choisis Guidé/Tutoré,
**Then** SMN explique les deux parcours et présente les étapes sans ajouter d'information métier obligatoire au-delà du mode, produit et première équipe.

#### AC2 — Le mode Scrum est retenu

**Given** Le mode Scrum est retenu,
**When** je parcours les réglages facultatifs,
**Then** le Daily est proposé à 09:00, le début des Sprints le lundi à 09:00 et leurs valeurs sont modifiables pour les Sprints futurs uniquement.

#### AC3 — Le mode Kanban est retenu

**Given** Le mode Kanban est retenu,
**When** je parcours les réglages facultatifs,
**Then** le mois calendaire est proposé par défaut ; cadence, jour de départ hebdomadaire et bornes sont configurables sans générer de périodes.

#### AC4 — Des options facultatives ne sont pas renseignées

**Given** Des options facultatives ne sont pas renseignées,
**When** je finalise le parcours,
**Then** les valeurs par défaut documentées sont appliquées et je retrouve le même tableau de bord que via Express.

#### AC5 — Une étape est invalide ou le navigateur revient en arrière

**Given** Une étape est invalide ou le navigateur revient en arrière,
**When** je tente de terminer,
**Then** les champs fautifs sont expliqués et aucune deuxième installation ni aucun cycle implicite ne sont créés.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-1, FR-2, FR-65.
* Architecture/décisions : D-PRD-002/042/044/087–093 ; AD-5/7/14/17.
* UX : UX-DR10/11.
* Dépendances préalables : Stories 1.1 et 1.2 : même mécanisme de création et même tableau de bord.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.4: Se connecter, se déconnecter et protéger les sessions
**Jira :** https://lmn24.atlassian.net/browse/SMN-14
**En tant que** personne disposant d'un compte SMN,
**je veux** ouvrir et fermer une session authentifiée sécurisée,
**afin de** accéder aux seules pages privées pour lesquelles je suis autorisé.

**Critères d'acceptation :**

#### AC1 — L'installation est finalisée et une identité active existe

**Given** L'installation est finalisée et une identité active existe,
**When** la personne transmet des identifiants valides,
**Then** une session serveur est créée et les pages métier deviennent accessibles selon les droits du compte.

#### AC2 — Aucune session valide n'est présente

**Given** Aucune session valide n'est présente,
**When** une URL de page privée ou d'API est demandée directement,
**Then** le serveur refuse l'accès et ne renvoie aucune donnée métier ; l'assistant vierge ne réapparaît pas.

#### AC3 — Une session valide existe

**Given** Une session valide existe,
**When** la personne se déconnecte ou sa session expire,
**Then** le jeton/session devient inutilisable, y compris sur une requête directe antérieurement autorisée.

#### AC4 — Une tentative de connexion échoue

**Given** Une tentative de connexion échoue,
**When** un mot de passe est incorrect ou les essais deviennent répétitifs,
**Then** le système ne révèle pas si un compte existe, limite les tentatives et ne journalise aucun secret.

#### AC5 — Une session web est ouverte

**Given** Une session web est ouverte,
**When** une opération modifiante est sollicitée,
**Then** les protections de cookie HttpOnly/SameSite et contre requêtes intersites sont appliquées ; Secure est obligatoire en contexte HTTPS, sans exiger HTTPS pour le loopback local.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-66, FR-67.
* Architecture/décisions : AD-7/10/26/31 ; SEC-01/02.
* UX : UX-DR09/14.
* Dépendances préalables : Story 1.2 pour un compte initial ; aucune Story ultérieure.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.5: Créer et administrer les comptes des utilisateurs
**Jira :** https://lmn24.atlassian.net/browse/SMN-15
**En tant que** Administrateur Scrum Master,
**je veux** créer des comptes et attribuer l'un des deux profils MVP depuis l'administration,
**afin de** donner accès à SMN sans manipulation directe de PostgreSQL.

**Critères d'acceptation :**

#### AC1 — L'Administrateur est authentifié

**Given** L'Administrateur est authentifié,
**When** il ouvre le formulaire de création de compte,
**Then** seuls les profils Administrateur et Utilisateur sont proposés ; les champs et exigences du compte sont explicités.

#### AC2 — Des informations de création valides sont fournies

**Given** Des informations de création valides sont fournies,
**When** l'Administrateur confirme,
**Then** le compte est enregistré une seule fois, avec rôle choisi et procédure de secret initial contrôlée ; la création d'une fiche membre Agile n'entraîne aucun compte.

#### AC3 — Un compte actif existe

**Given** Un compte actif existe,
**When** l'Administrateur modifie son rôle ou désactive son accès,
**Then** les droits changent côté serveur et les anciennes sessions ne conservent pas les privilèges précédents.

#### AC4 — Un autre utilisateur tente de créer ou modifier un compte via interface ou requête directe

**Given** Un autre utilisateur tente de créer ou modifier un compte via interface ou requête directe,
**When** la requête parvient au serveur,
**Then** l'opération est refusée et aucune écriture n'est effectuée.

#### AC5 — Un identifiant est déjà utilisé ou la transaction échoue

**Given** Un identifiant est déjà utilisé ou la transaction échoue,
**When** une création est tentée,
**Then** une erreur explicite est rendue sans divulgation de mot de passe ni doublon partiellement sauvegardé.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-66, FR-72.
* Architecture/décisions : AD-8/9/26/31 ; D-PRD-136.
* UX : UX-DR09/14.
* Dépendances préalables : Stories 1.2 et 1.4.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.6: Faire respecter la matrice Administrateur / Utilisateur côté serveur
**Jira :** https://lmn24.atlassian.net/browse/SMN-16
**En tant que** Administrateur protégeant mon installation et Utilisateur consultant ses données collectives,
**je veux** que les autorisations soient contrôlées par rôle sur toutes les opérations,
**afin de** éviter les modifications ou accès individuels non autorisés sans système de permissions complexe.

**Critères d'acceptation :**

#### AC1 — Un compte Administrateur actif est connecté

**Given** Un compte Administrateur actif est connecté,
**When** il lit ou modifie une ressource métier autorisée,
**Then** la lecture, les mutations et la gestion des comptes/paramètres sont permises conformément aux protections propres à la ressource.

#### AC2 — Un compte Utilisateur actif est connecté

**Given** Un compte Utilisateur actif est connecté,
**When** il consulte tableaux de bord, métriques ou registres collectifs autorisés,
**Then** la lecture seule est permise sans informations individuelles sensibles.

#### AC3 — Un Utilisateur tente de modifier une ressource, générer un nouveau document ou administrer SMN

**Given** Un Utilisateur tente de modifier une ressource, générer un nouveau document ou administrer SMN,
**When** il passe par l'interface ou une requête API directe,
**Then** le serveur refuse l'opération, sans persistance et sans seule dépendance à un bouton masqué.

#### AC4 — Un Utilisateur tente de lire absences nominatives, capacités individuelles, coordonnées ou fiches de membre sensibles

**Given** Un Utilisateur tente de lire absences nominatives, capacités individuelles, coordonnées ou fiches de membre sensibles,
**When** la ressource est demandée directement,
**Then** l'accès est refusé et aucun champ confidentiel n'est renvoyé.

#### AC5 — Un Utilisateur demande un PDF/TXT déjà existant et explicitement autorisé

**Given** Un Utilisateur demande un PDF/TXT déjà existant et explicitement autorisé,
**When** il demande sa consultation ou son téléchargement,
**Then** la lecture et le téléchargement sont permis après contrôle serveur ; générer ou modifier le document reste interdit.

#### AC6 — Une règle de rôle est évaluée

**Given** Une règle de rôle est évaluée,
**When** la ressource n'existe pas ou se situe hors périmètre,
**Then** le système ne révèle pas son contenu et ne crée aucun rôle Opérateur, Lecteur distinct ou habilitation par équipe.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-66, FR-67, FR-72.
* Architecture/décisions : D-PRD-136/AD-31 ; AD-8/9/26.
* UX : UX-DR01/04/06/09.
* Dépendances préalables : Stories 1.4 et 1.5 ; les futures fonctions métier reprendront cette politique sans élargir les rôles.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.7: Révoquer les accès compromis et renouveler son mot de passe
**Jira :** https://lmn24.atlassian.net/browse/SMN-17
**En tant que** titulaire d'un compte SMN ou Administrateur,
**je veux** changer mon mot de passe et faire invalider mes sessions devenues non fiables,
**afin de** conserver la maîtrise de l'accès à mon installation.

**Critères d'acceptation :**

#### AC1 — Un Administrateur initial est créé avec un secret temporaire

**Given** Un Administrateur initial est créé avec un secret temporaire,
**When** il ouvre sa première session,
**Then** le renouvellement du secret est imposé avant toute opération métier ; l'initialisation du secret n'est jamais exposée en clair dans des documents.

#### AC2 — Un compte authentifié veut changer son secret

**Given** Un compte authentifié veut changer son secret,
**When** il confirme le secret courant et un nouveau secret conforme,
**Then** le secret est remplacé par une valeur dérivée salée, jamais stockée en clair ; l'opération est tracée sans révéler le secret.

#### AC3 — Un secret ancien ou compromis est encore utilisé

**Given** Un secret ancien ou compromis est encore utilisé,
**When** le changement est confirmé,
**Then** les sessions antérieures concernées sont révoquées selon une politique sécurisée, sans conserver silencieusement un accès obsolète.

#### AC4 — L'Administrateur désactive un compte

**Given** L'Administrateur désactive un compte,
**When** une session de ce compte tente une nouvelle requête,
**Then** l'accès est immédiatement rejeté côté serveur.

#### AC5 — Le secret courant est incorrect ou une récupération administrateur serait demandée

**Given** Le secret courant est incorrect ou une récupération administrateur serait demandée,
**When** une action non autorisée ou non spécifiée est tentée,
**Then** aucune réinitialisation anonyme, porte dérobée ou second administrateur fictif n'est possible ; la procédure de récupération contrôlée reste un point technique à préciser avant sa mise en service.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-66, FR-67, FR-72.
* Architecture/décisions : AD-7/10/26/31 ; SEC-01/07.
* UX : UX-DR09/14.
* Dépendances préalables : Stories 1.4 à 1.6 ; aucune intégration mail externe requise.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.8: Modifier les paramètres généraux sans réécrire l'historique
**Jira :** https://lmn24.atlassian.net/browse/SMN-18
**En tant que** Administrateur de SMN,
**je veux** ajuster les réglages généraux administrables depuis l'application,
**afin de** faire évoluer les préférences sans modifier le code ni altérer les périodes passées.

**Critères d'acceptation :**

#### AC1 — L'Administrateur consulte les paramètres généraux

**Given** L'Administrateur consulte les paramètres généraux,
**When** il modifie une valeur explicitement configurable, par exemple langue, thème ou pays de référence,
**Then** la nouvelle valeur valide est enregistrée côté serveur et réutilisable sans changement de code.

#### AC2 — Une installation existe

**Given** Une installation existe,
**When** l'Administrateur tente de remplacer le mode Scrum/Kanban ou le produit de référence,
**Then** le système refuse l'opération même par API ; une nouvelle installation distincte serait nécessaire pour ces choix.

#### AC3 — Un réglage a des conséquences sur les cycles futurs

**Given** Un réglage a des conséquences sur les cycles futurs,
**When** il est enregistré,
**Then** la date/portée d'application est expliquée et aucune donnée de cycle, capacité, registre ou archive antérieure n'est réécrite implicitement.

#### AC4 — Un Utilisateur essaie de modifier la configuration

**Given** Un Utilisateur essaie de modifier la configuration,
**When** il appelle le formulaire ou le serveur,
**Then** l'accès en mutation est refusé.

#### AC5 — Une erreur de validation ou de persistance survient

**Given** Une erreur de validation ou de persistance survient,
**When** l'enregistrement est tenté,
**Then** les anciennes valeurs restent cohérentes ; aucune notification de succès n'est émise et l'événement significatif est traçable.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-72, FR-63, FR-65.
* Architecture/décisions : AD-12/14/19/25/31 ; SEC-07.
* UX : UX-DR05/10/13/15.
* Dépendances préalables : Stories 1.2, 1.4 et 1.6 ; les paramètres spécialisés seront possédés par leurs modules métier.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.9: Protéger la configuration privée et les secrets de l'application
**Jira :** https://lmn24.atlassian.net/browse/SMN-19
**En tant que** Administrateur déployant SMN,
**je veux** séparer les paramètres métier des secrets sensibles,
**afin de** configurer et diagnostiquer mon installation sans divulgation d'identifiants.

**Critères d'acceptation :**

#### AC1 — Une connexion PostgreSQL ou un secret de session est configuré

**Given** Une connexion PostgreSQL ou un secret de session est configuré,
**When** SMN lit et utilise ses paramètres,
**Then** le secret est pris depuis un stockage/configuration privés et non du code versionné, d'un exemple publié ou d'un champ affiché en clair.

#### AC2 — Une erreur d'authentification ou de base survient

**Given** Une erreur d'authentification ou de base survient,
**When** les diagnostics sont affichés ou journalisés,
**Then** les chaînes de connexion sensibles, mots de passe, jetons, données individuelles et fichiers bruts ne sont pas divulgués.

#### AC3 — L'Administrateur consulte ou exporte des paramètres non secrets

**Given** L'Administrateur consulte ou exporte des paramètres non secrets,
**When** une sortie est produite,
**Then** seules les valeurs explicitement autorisées sont présentes ; les clés secrètes sont exclues ou protégées.

#### AC4 — Un fichier d'exemple ou de configuration du projet est produit

**Given** Un fichier d'exemple ou de configuration du projet est produit,
**When** il est partagé dans le dépôt ou avec une équipe,
**Then** aucun identifiant ou secret réel n'y figure ; les exemples sont fictifs et identifiables comme tels.

#### AC5 — Un paramètre sensible nécessaire manque

**Given** Un paramètre sensible nécessaire manque,
**When** SMN tente un démarrage ou une action,
**Then** l'échec est explicite et n'est pas contourné avec un secret codé en dur.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 (améliorations transverses ultérieures intégrées au périmètre des Epics propriétaires).
* FR : FR-67, FR-72.
* Architecture/décisions : AD-10/25/26/29 ; SEC-02/07.
* UX : UX-DR09.
* Dépendances préalables : Stories 1.1 et 1.8 ; ne nécessite aucune fonctionnalité future.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.10: Suivre les tâches facultatives de configuration depuis le tableau de bord
**Jira :** https://lmn24.atlassian.net/browse/SMN-20
**En tant que** Scrum Master ayant initialisé SMN,
**je veux** retrouver les réglages qui restent à compléter et gérer leurs états sans blocage,
**afin de** finaliser mon paramétrage à mon rythme sans polluer le suivi métier.

**Critères d'acceptation :**

#### AC1 — L'installation est prête après Express ou Guidé

**Given** L'installation est prête après Express ou Guidé,
**When** l'Administrateur consulte la zone « Paramétrage à compléter »,
**Then** les tâches réellement pertinentes sont présentées avec état À faire, Terminée ou Ignorée et accès au réglage concerné.

#### AC2 — Une tâche est À faire

**Given** Une tâche est À faire,
**When** l'Administrateur la marque Terminée ou Ignorée,
**Then** le choix est persisté ; Ignorée n'est jamais comptée comme Terminée, et aucun état ne bloque le travail courant.

#### AC3 — Une tâche À faire correspond à un réglage dont l'accomplissement est détectable de façon fiable

**Given** Une tâche À faire correspond à un réglage dont l'accomplissement est détectable de façon fiable,
**When** le réglage est effectivement enregistré,
**Then** la tâche devient automatiquement Terminée sans seconde saisie.

#### AC4 — Une tâche ne possède aucun signal vérifiable ou est Ignorée

**Given** Une tâche ne possède aucun signal vérifiable ou est Ignorée,
**When** un contrôle automatique survient,
**Then** aucune réussite ni réactivation n'est inventée ; une modification d'état reste explicite.

#### AC5 — Une tâche de configuration est gérée

**Given** Une tâche de configuration est gérée,
**When** le Scrum Master ouvre les actions métier ou prépare un rapport,
**Then** la tâche n'est pas convertie en action de Sprint, risque ou événement et n'est pas ajoutée au reporting métier.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-3, FR-65, FR-58.
* Architecture/décisions : D-PRD-004/005/127 ; AD-4/31.
* UX : UX-DR03/10.
* Dépendances préalables : Stories 1.2/1.3 et 1.8 ; seulement des réglages déjà livrés sont proposés.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.11: Afficher un tableau de bord fiable et contextualisé par équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-21
**En tant que** Scrum Master ou Utilisateur autorisé,
**je veux** voir le contexte produit/équipe, le cycle pertinent et les informations collectives disponibles,
**afin de** comprendre immédiatement la situation sans reconstituer le suivi manuellement.

**Critères d'acceptation :**

#### AC1 — Une installation est finalisée mais aucun cycle n'a été créé

**Given** Une installation est finalisée mais aucun cycle n'a été créé,
**When** un compte autorisé ouvre le tableau de bord,
**Then** le produit et l'équipe sont indiqués, avec état vide explicite et accès à la création à la demande ; aucun faux cycle ou KPI zéro n'est affiché.

#### AC2 — Des cycles enregistrés sont disponibles pour l'équipe

**Given** Des cycles enregistrés sont disponibles pour l'équipe,
**When** le tableau de bord est consulté,
**Then** le cycle en cours, les cycles terminés non clôturés et leurs statuts sont distingués sans masquer les bilans en attente.

#### AC3 — Des objectifs, KPI, réunions ou points d'attention sont effectivement disponibles par les interfaces de lecture métier

**Given** Des objectifs, KPI, réunions ou points d'attention sont effectivement disponibles par les interfaces de lecture métier,
**When** le tableau de bord est consulté,
**Then** seuls les éléments enregistrés/calculables et autorisés sont affichés, avec lien source ; les champs indisponibles restent « non renseigné ».

#### AC4 — Une alerte est affichée

**Given** Une alerte est affichée,
**When** la personne la consulte,
**Then** l'alerte n'altère aucune donnée, statut, risque ou action ; son caractère informatif est explicite.

#### AC5 — Le compte Utilisateur consulte les mêmes synthèses que l'Administrateur

**Given** Le compte Utilisateur consulte les mêmes synthèses que l'Administrateur,
**When** les données sont préparées côté serveur,
**Then** les données individuelles sensibles sont absentes des réponses et non simplement cachées par le navigateur.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-2, FR-58, FR-66, FR-67.
* Architecture/décisions : D-PRD-003/093/127/136 ; AD-6/7/22/31.
* UX : UX-DR02/03/04.
* Dépendances préalables : Stories 1.2, 1.4 et 1.6 ; composants producteurs futurs branchés via contrats de lecture, sans dépendance bloquante.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.12: Naviguer entre les grandes fonctions selon son mode et son rôle
**Jira :** https://lmn24.atlassian.net/browse/SMN-22
**En tant que** personne authentifiée dans SMN,
**je veux** retrouver les fonctions regroupées et les écrans adaptés à mon mode Agile,
**afin de** passer rapidement du pilotage aux opérations utiles sans menu confus.

**Critères d'acceptation :**

#### AC1 — Une session autorisée est ouverte

**Given** Une session autorisée est ouverte,
**When** le menu principal s'affiche,
**Then** les groupes Pilotage, Calendrier, Cycles/bilans, Registres, Rapports/IA et Administration sont reconnaissables et contextualisés.

#### AC2 — L'installation est en mode Scrum ou Kanban

**Given** L'installation est en mode Scrum ou Kanban,
**When** une rubrique est consultée,
**Then** les libellés et fonctionnalités sont adaptés au mode ; SAFe/ART n'est pas affiché comme fonction MVP opérationnelle.

#### AC3 — Une rubrique ou page est active

**Given** Une rubrique ou page est active,
**When** la personne navigue dans le menu,
**Then** le contexte produit/équipe et l'entrée active restent visibles ou faciles à retrouver, y compris en écran étroit.

#### AC4 — Le compte a le profil Utilisateur

**Given** Le compte a le profil Utilisateur,
**When** une fonction de modification ou d'administration est affichée ou appelée directement,
**Then** aucune action interdite n'est exécutable ; le contrôle serveur prime sur le masquage visuel.

#### AC5 — Une fonction n'est pas encore disponible dans l'incrément courant

**Given** Une fonction n'est pas encore disponible dans l'incrément courant,
**When** une personne tente d'y accéder,
**Then** l'interface ne promet pas une opération active et présente, si nécessaire, un état indisponible explicite.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-59, FR-63, FR-66.
* Architecture/décisions : D-PRD-001/127/136 ; AD-5/7/31.
* UX : UX-DR01/11/12.
* Dépendances préalables : Stories 1.2, 1.4 et 1.6 ; aucune fonction non livrée ne doit être présentée comme active.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.13: Conserver le contexte lors des navigations vers les fiches liées
**Jira :** https://lmn24.atlassian.net/browse/SMN-23
**En tant que** personne autorisée parcourant SMN,
**je veux** ouvrir une fiche depuis une synthèse et revenir au contexte de départ,
**afin de** examiner les sources d'une donnée sans perdre mon équipe, cycle ou sélection.

**Critères d'acceptation :**

#### AC1 — Un lien contextuel vers un objet disponible et autorisé existe

**Given** Un lien contextuel vers un objet disponible et autorisé existe,
**When** l'utilisateur l'ouvre depuis une vue synthétique,
**Then** la fiche correspondante est ouverte avec identifiant stable et possibilité de revenir au contexte de départ.

#### AC2 — Une consultation porte sur un cycle ou une version de clôture historique

**Given** Une consultation porte sur un cycle ou une version de clôture historique,
**When** l'utilisateur accède à une fiche courante liée,
**Then** le contexte et la date ou version sont identifiés, sans présenter l'état courant comme l'état historique.

#### AC3 — La ressource visée est supprimée, archivée, inexistante ou interdite

**Given** La ressource visée est supprimée, archivée, inexistante ou interdite,
**When** le lien est suivi,
**Then** un message compréhensible est montré sans inventer une fiche ni révéler des données privées.

#### AC4 — Une navigation est effectuée

**Given** Une navigation est effectuée,
**When** un filtre ou un paramètre de contexte était applicable,
**Then** le retour restaure raisonnablement l'équipe, le cycle et les filtres disponibles, sans modification métier.

#### AC5 — Un utilisateur ouvre un lien de détail

**Given** Un utilisateur ouvre un lien de détail,
**When** le serveur traite la demande,
**Then** le lien n'entraîne aucune écriture, aucun transfert externe et respecte les autorisations de la ressource cible.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-60, FR-58, FR-59.
* Architecture/décisions : AD-6/19/22/26/31 ; D-PRD-127.
* UX : UX-DR04.
* Dépendances préalables : Stories 1.11 et 1.12 ; lien exécutable sur ressources existantes (équipe, paramètres), extensible par les autres Epics.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.14: Choisir le français ou l'anglais pour l'interface
**Jira :** https://lmn24.atlassian.net/browse/SMN-27
**En tant que** personne utilisant SMN,
**je veux** choisir le français ou l'anglais pour l'interface,
**afin de** comprendre les libellés et les messages sans modifier mes textes métier.

**Critères d'acceptation :**

#### AC1 — Choix du français ou de l'anglais

**Given** une interface en français,
**When** je sélectionne l'anglais dans les paramètres ou le contrôle de langue,
**Then** les menus, libellés, boutons, erreurs et aides standardisés disponibles sont affichés en anglais.

#### AC2 — Conservation des textes libres

**Given** une description, un commentaire ou un objectif métier enregistré,
**When** je modifie la langue de l'interface,
**Then** le contenu saisi reste strictement inchangé, sans traduction automatique.

#### AC3 — Langue indisponible

**Given** une langue ou une traduction d'interface absente,
**When** un composant doit être rendu,
**Then** un repli vers une langue prise en charge est appliqué, sans chaîne technique brute ni fonction bloquée.

#### AC4 — Accessibilité

**Given** une navigation au clavier ou via une technologie d'assistance,
**When** je choisis une langue,
**Then** les contrôles restent utilisables, le focus est cohérent et la langue de page est indiquée aux technologies d'assistance.

#### AC5 — Persistance et droits

**Given** une installation déjà paramétrée,
**When** un Administrateur enregistre une préférence générale de langue,
**Then** le choix est persisté sans modifier les données métier ni accorder un droit d'administration à l'Utilisateur.

#### Traçabilité

* FR : FR-59, FR-63, FR-72.
* NFR : NFR-1.
* UX : UX-DR12, UX-DR14.
* Décisions : F-112 à F-115, D-PRD-127, AD-28/31.
* Incrément : I0 (reprise du mécanisme par les écrans métier ultérieurs).
* Dépendances : Stories 1.2, 1.8 et 1.12 ; aucune future Story de l'Epic requise.
* Statut : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, validée globalement avec l'Epic 1 le 19/10/2026.
* Source normative : branche `docs/bmad-arbitrages-metier-valides-20261019`.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.15: Personnaliser l'apparence avec thèmes clair et sombre
**Jira :** https://lmn24.atlassian.net/browse/SMN-24
**En tant que** Administrateur personnalisant SMN,
**je veux** choisir un thème clair ou sombre et des palettes autorisées,
**afin de** bénéficier d'une interface cohérente et lisible sans modifier les règles métier.

**Critères d'acceptation :**

#### AC1 — Une session est ouverte

**Given** Une session est ouverte,
**When** le thème clair ou sombre est utilisé,
**Then** menus, formulaires, messages et écrans du socle utilisent des variables Bootstrap 5 cohérentes, y compris après navigation.

#### AC2 — L'Administrateur modifie la palette ou le thème global dans un paramètre autorisé

**Given** L'Administrateur modifie la palette ou le thème global dans un paramètre autorisé,
**When** il confirme l'opération,
**Then** l'apparence se met à jour sans modifier les cycles, métriques, textes libres ou droits.

#### AC3 — Un niveau de risque, une erreur ou une opération sensible est affiché

**Given** Un niveau de risque, une erreur ou une opération sensible est affiché,
**When** le thème ou la palette change,
**Then** un texte, une icône ou un état explicite accompagne la couleur ; aucune signification cruciale n'est portée uniquement par une teinte.

#### AC4 — Une palette n'est pas valide ou réduit l'utilisabilité des contrôles

**Given** Une palette n'est pas valide ou réduit l'utilisabilité des contrôles,
**When** l'Administrateur l'enregistre,
**Then** une validation ou une valeur de repli lisible empêche un rendu inutilisable sans effacer la configuration antérieure.

#### AC5 — Un Utilisateur tente de modifier les réglages globaux réservés à l'administration

**Given** Un Utilisateur tente de modifier les réglages globaux réservés à l'administration,
**When** une demande est envoyée,
**Then** le serveur refuse la modification sans bloquer la lecture autorisée.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-63, FR-72.
* Architecture/décisions : D-PRD-001/127 ; F-112–115 ; AD-4/28/31.
* UX : UX-DR13/14.
* Dépendances préalables : Stories 1.8, 1.12 et 1.14.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.16: Utiliser le socle de SMN sur ordinateur, tablette et smartphone
**Jira :** https://lmn24.atlassian.net/browse/SMN-25
**En tant que** personne utilisant SMN dans un navigateur,
**je veux** accéder au parcours initial, aux comptes, au tableau de bord et à la navigation sur différentes tailles d'écran,
**afin de** ne pas perdre de fonctionnalité essentielle en mobilité ni lors d'un usage au clavier.

**Critères d'acceptation :**

#### AC1 — Un navigateur d'ordinateur, de tablette ou de smartphone affiche le socle

**Given** Un navigateur d'ordinateur, de tablette ou de smartphone affiche le socle,
**When** l'utilisateur ouvre les parcours livrés dans cette Epic,
**Then** les commandes essentielles restent visibles/atteignables sans défilement horizontal obligatoire pour une action fondamentale.

#### AC2 — L'utilisateur navigue uniquement au clavier

**Given** L'utilisateur navigue uniquement au clavier,
**When** il parcourt menus, formulaires et dialogues,
**Then** l'ordre de focus reste cohérent, chaque champ a un libellé et aucune action essentielle n'impose une souris.

#### AC3 — Un contrôle produit une erreur ou un avertissement

**Given** Un contrôle produit une erreur ou un avertissement,
**When** il est consulté sur écran étroit et avec aide technique,
**Then** le message reste lisible, lié au champ pertinent et non fondé seulement sur la couleur.

#### AC4 — Une fonctionnalité contient une icône ou une action sans texte visible

**Given** Une fonctionnalité contient une icône ou une action sans texte visible,
**When** un lecteur d'écran ou le clavier est utilisé,
**Then** un nom accessible, un indicateur de focus et des alternatives textuelles utilisables sont fournis.

#### AC5 — Les supports cibles ou niveaux d'accessibilité chiffrés sont discutés

**Given** Les supports cibles ou niveaux d'accessibilité chiffrés sont discutés,
**When** un compte-rendu de validation est produit,
**Then** aucune conformité WCAG, seuil de performance ou support d'une version de navigateur non testé n'est proclamé acquis.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-63, FR-59, FR-65.
* Architecture/décisions : D-PRD-001/127 ; NFR-1/2 ; AD-28.
* UX : UX-DR11/14.
* Dépendances préalables : Stories 1.2 à 1.15 ; les écrans métier ajoutés plus tard appliquent ce contrat dans leurs Stories.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.17: Avertir avant perte de saisie et afficher le résultat réel des sauvegardes
**Jira :** https://lmn24.atlassian.net/browse/SMN-28
En tant qu'Administrateur, je veux être informé des modifications en cours et connaître le résultat de chaque enregistrement, afin de préserver mon travail et éviter toute confusion entre brouillon et données enregistrées.

**Critères d'acceptation :**

#### AC1 — Modifications en attente

**Given** un formulaire ayant des modifications non enregistrées,
**When** je tente de quitter la page ou de changer de contexte,
**Then** un avertissement permet de rester pour terminer ou de quitter en comprenant les conséquences.

#### AC2 — Confirmation de sauvegarde

**Given** une action explicite Enregistrer,
**When** le serveur confirme la persistance des données,
**Then** un message de réussite apparaît et seul le contenu effectivement sauvegardé est considéré comme enregistré.

#### AC3 — Échec ou annulation

**Given** un enregistrement refusé, interrompu ou annulé,
**When** le résultat est reçu,
**Then** un message clair explique le résultat et aucun succès fictif n'est affiché.

#### AC4 — Aperçu provisoire

**Given** des valeurs calculées en prévisualisation,
**When** aucune sauvegarde n'est confirmée,
**Then** l'interface identifie les résultats comme provisoires et ne les utilise pas comme données persistées.

#### AC5 — Règles des opérations métier

**Given** un bilan avec des blocs de saisie indépendants ou une opération de lot nécessitant confirmation globale,
**When** l'enregistrement est demandé,
**Then** seules les unités de sauvegarde autorisées sont modifiées ; aucune validation implicite des autres blocs ni écriture partielle du lot n'est introduite.

#### Traçabilité

FR-64, FR-72, FR-65 ; UX-DR08, UX-DR09, UX-DR15 ; NFR-2 ; AD-3/4/26/31 ; D-PRD-071–074/118/127.    
Incrément : I0 avec réutilisation dans les autres Epics. Dépendances : Stories 1.2, 1.8, 1.16.    
Statut : validée globalement le 19/10/2026, non développée.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.

### Story 1.18: Ne transmettre que les informations collectives autorisées aux vues et documents
**Jira :** https://lmn24.atlassian.net/browse/SMN-26
**En tant que** Administrateur protégeant les informations de son équipe,
**je veux** que les réponses de consultation et les accès aux documents filtrent les informations selon la confidentialité validée,
**afin de** permettre la lecture collective sans fuite de données individuelles ou de fichiers privés.

**Critères d'acceptation :**

#### AC1 — Un utilisateur autorisé interroge une vue collective

**Given** Un utilisateur autorisé interroge une vue collective,
**When** des enregistrements contiennent aussi des données individuelles sensibles,
**Then** la réponse serveur exclut les champs de fiches nominatives, motifs d'absence, capacités individuelles, e-mails et coordonnées non autorisés ; le navigateur ne reçoit pas ces champs cachés.

#### AC2 — Une personne tente de demander une ressource identifiée par un ID d'un autre périmètre ou non autorisée

**Given** Une personne tente de demander une ressource identifiée par un ID d'un autre périmètre ou non autorisée,
**When** une URL directe ou API est utilisée,
**Then** la réponse est refusée sans révéler les détails, y compris en téléchargement de fichier.

#### AC3 — Un Utilisateur demande un PDF/TXT déjà stocké et explicitement autorisé

**Given** Un Utilisateur demande un PDF/TXT déjà stocké et explicitement autorisé,
**When** la ressource documentaire est résolue,
**Then** le téléchargement est permis après vérification de la session, de l'autorisation du document et du stockage privé ; aucun document n'est exposé par URL anonyme.

#### AC4 — Une vue de reporting ou un brief TXT est rendu par un module propriétaire

**Given** Une vue de reporting ou un brief TXT est rendu par un module propriétaire,
**When** le contrat commun de sélection est appliqué,
**Then** les données individuelles non nécessaires sont absentes par défaut des rapports et structurellement exclues des TXT IA ; la revue de textes libres reste obligatoire dans l'Epic IA.

#### AC5 — Une erreur d'export ou une trace d'accès est produite

**Given** Une erreur d'export ou une trace d'accès est produite,
**When** le système journalise l'opération,
**Then** aucun mot de passe, secret, motif sensible, URL privée signée ou contenu brut confidentiel n'est divulgué ; l'échec n'est pas signalé comme un export réussi.

#### Traçabilité et périmètre

* Epic parente : SMN-1.
* Incrément : I0 ; éventuellement consolidation UX jusqu'à I5, selon le séquencement D-PRD-131.
* FR : FR-66, FR-67, FR-58.
* Architecture/décisions : D-PRD-136 ; AD-6/10/23/26/31 ; SEC-02.
* UX : UX-DR02/04/09.
* Dépendances préalables : Stories 1.4 à 1.6 et 1.11 ; le socle de projection est testable avec fixtures, chaque Epic métier livrera ses filtres spécialisés.
* Source normative : PRD et annexes, branche `docs/bmad-arbitrages-metier-valides-20261019` de `JeanLamora75/SMN`.
* Statut fonctionnel : **VALIDÉE FONCTIONNELLEMENT LE 19/10/2026**, approbation globale de l'Epic 1 le 19/10/2026 ; ni développement ni tests exécutés.
* Deux seuls rôles MVP : Administrateur et Utilisateur. SAFe/ART exclu du MVP.

#### Validation fonctionnelle globale

L'utilisateur a approuvé toutes les Stories de l'Epic 1 sans réserve le 19/10/2026. Cette validation documentaire ne vaut ni développement ni recette exécutés.
**Validation :** validée fonctionnellement par l'utilisateur le 19/10/2026.


## Epic 2: Préserver, restaurer et maîtriser les données de son carnet
Sauvegarder et restaurer l'installation, tracer les opérations sensibles et maîtriser suppression, anonymisation et confidentialité.
**FRs couvertes :** FR-68, FR-69, FR-70, FR-71, FR-73.

### Story 2.1: Consulter un journal fiable des opérations métier sensibles
**Jira :** https://lmn24.atlassian.net/browse/SMN-29
**En tant que** Administrateur SMN,
**je veux** retrouver les modifications et décisions techniques importantes de mon installation,
**afin de** pouvoir comprendre qui a fait quoi, quand et avec quel résultat.

**Critères d'acceptation :**

#### AC1

**Given** une session Administrateur,
**When** une opération sensible sur un paramètre ou un compte est confirmée,
**Then** SMN consigne date UTC, auteur identifié, action, objet, périmètre, résultat et différences utiles sans enregistrer de secret.

#### AC2

**Given** une création ou correction de donnée métier nécessite un audit,
**When** l'opération et l'audit sont enregistrés,
**Then** le même résultat est corrélé à une seule référence d'opération sans succès fictif ni doublons incohérents.

#### AC3

**Given** une action échoue, est annulée ou rejetée,
**When** le journal la reçoit éventuellement,
**Then** son statut est distinct de Réussie ; aucun audit de succès n'est créé.

#### AC4

**Given** un Utilisateur ou une personne anonyme tente de consulter le journal,
**When** elle appelle l'écran ou l'API,
**Then** l'accès est refusé côté serveur et les entrées restent privées.

#### AC5

**Given** un clic de navigation ordinaire ou une prévisualisation a lieu,
**When** l'utilisateur interagit,
**Then** aucune journalisation métier exhaustive de ces simples vues n'est exigée.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-70, FR-73.
* Architecture/décisions : AD-19, AD-26, AD-31 ; SEC-05.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : Epic 1 : comptes et sessions. Aucune Story ultérieure.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.2: Créer une sauvegarde manuelle complète de l'installation
**Jira :** https://lmn24.atlassian.net/browse/SMN-30
**En tant que** Administrateur,
**je veux** déclencher une sauvegarde du carnet et de ses archives réellement stockées,
**afin de** pouvoir retrouver l'état métier de SMN en cas d'incident.

**Critères d'acceptation :**

#### AC1

**Given** une installation SMN opérationnelle en PostgreSQL,
**When** l'Administrateur demande une sauvegarde manuelle,
**Then** la base, les comptes, paramètres non secrets, données métier et historiques existants sont capturés dans un ensemble cohérent.

#### AC2

**Given** des instantanés Vn, TXT, PDF archivés ou pièces sont réellement stockés par SMN,
**When** une sauvegarde est créée,
**Then** ces fichiers et leurs métadonnées/références sont inclus sans fabriquer les pièces absentes.

#### AC3

**Given** la base est sauvegardée pendant que des pièces sont gérées séparément,
**When** la sauvegarde est finalisée,
**Then** un protocole de cohérence empêche de déclarer réussi un lot DB/fichiers discordant.

#### AC4

**Given** une sauvegarde est préparée,
**When** un secret applicatif ou une donnée privée est manipulé,
**Then** aucun mot de passe en clair ni archive téléchargeable anonymement n'est exposé.

#### AC5

**Given** la capture d'une composante échoue,
**When** l'exécution se termine,
**Then** l'opération est marquée Échec et aucun paquet incomplet n'est signalé comme restaurable.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-68, FR-71, FR-73.
* Architecture/décisions : AD-25 à 27, AD-31 ; SEC-03/06 ; architecture §4.1.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.1 pour audit ; uniquement données et fichiers déjà présents dans l'installation.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.3: Vérifier l'intégrité et l'inventaire d'une sauvegarde
**Jira :** https://lmn24.atlassian.net/browse/SMN-31
**En tant que** Administrateur,
**je veux** consulter les sauvegardes disponibles et leur manifeste de cohérence,
**afin de** identifier un jeu fiable avant toute restauration.

**Critères d'acceptation :**

#### AC1

**Given** une sauvegarde manuelle est créée,
**When** la capture se termine,
**Then** un identifiant unique, horodatage UTC, installation source, version applicative et versions de schéma/PostgreSQL sont liés à un manifeste.

#### AC2

**Given** les fichiers et métadonnées sont collectés,
**When** le contrôle d'intégrité s'exécute,
**Then** la liste des composants, leurs tailles/empreintes et liens nécessaires sont vérifiés, et le résultat est enregistré.

#### AC3

**Given** une empreinte ne correspond pas ou un fichier référencé manque,
**When** un Administrateur consulte cette sauvegarde,
**Then** elle est signalée Invalide ou Incomplète, non présentée comme restaurable.

#### AC4

**Given** une sauvegarde validée existe,
**When** l'Administrateur ouvre l'inventaire,
**Then** il peut identifier sa date, son origine, son statut de vérification et le périmètre sans ouvrir des secrets.

#### AC5

**Given** un paquet n'a jamais été réellement restauré dans un environnement de test,
**When** un indicateur d'assurance est affiché,
**Then** l'intégrité vérifiée n'est pas décrite abusivement comme une restauration testée.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-68, FR-73.
* Architecture/décisions : AD-25/26/27 ; SEC-03 ; architecture §4.2.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.2.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.4: Configurer les 30 jours de conservation des sauvegardes gérées
**Jira :** https://lmn24.atlassian.net/browse/SMN-32
**En tant que** Administrateur,
**je veux** régler et consulter la durée de conservation des sauvegardes gérées par SMN,
**afin de** maîtriser le stockage et la confidentialité sans supprimer des archives métier.

**Critères d'acceptation :**

#### AC1

**Given** une installation nouvellement créée,
**When** la règle de conservation est consultée,
**Then** la valeur initiale des sauvegardes gérées par SMN est 30 jours.

#### AC2

**Given** une durée positive autorisée est saisie par l'Administrateur,
**When** le paramètre est sauvegardé,
**Then** sa nouvelle valeur et son effet sont explicites, audités et réutilisés lors des futurs traitements de rétention.

#### AC3

**Given** un ensemble de sauvegardes dépasse la durée configurée,
**When** un cycle de nettoyage contrôlé est lancé,
**Then** seules les sauvegardes effectivement gérées par SMN sont éligibles ; la suppression est vérifiable et sans paquet partiel présenté comme conservé.

#### AC4

**Given** une archive PDF, un TXT ou un snapshot Vn métier existe,
**When** la rétention des sauvegardes agit,
**Then** ces archives ne sont pas effacées au seul motif qu'elles dépassent les 30 jours.

#### AC5

**Given** une sauvegarde a été exportée hors de l'espace géré,
**When** la politique est présentée,
**Then** SMN ne prétend pas pouvoir effacer ni surveiller cette copie externe.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-68, FR-69, FR-72.
* Architecture/décisions : D-PRD-135/A11 ; AD-27/31 ; SEC-03/04.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.3 et configuration Administrateur de l'Epic 1.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.5: Prévisualiser les effets et risques d'une restauration
**Jira :** https://lmn24.atlassian.net/browse/SMN-33
**En tant que** Administrateur,
**je veux** examiner les données et fichiers que restaurer un jeu de sauvegarde affecterait,
**afin de** décider en connaissance de cause avant une opération potentiellement destructive.

**Critères d'acceptation :**

#### AC1

**Given** une sauvegarde connue et vérifiée est sélectionnée,
**When** l'Administrateur lance la prévisualisation,
**Then** SMN affiche le jeu, la date, la version, les composants inclus, les incompatibilités éventuelles et les données courantes susceptibles d'être remplacées.

#### AC2

**Given** une archive est invalide, d'une mauvaise installation ou d'une version incompatible,
**When** la prévisualisation l'examine,
**Then** le blocage ou la procédure explicite nécessaire est indiqué sans lancer d'écriture.

#### AC3

**Given** le jeu paraît compatible mais contient des données plus anciennes,
**When** l'Administrateur lit l'avertissement,
**Then** une confirmation explicite distincte est requise avant tout remplacement de l'état courant.

#### AC4

**Given** l'Administrateur annule ou ferme l'écran,
**When** la prévisualisation se termine,
**Then** aucune donnée n'est restaurée ni supprimée.

#### AC5

**Given** le jeu concerne des données personnelles antérieurement effacées,
**When** l'aperçu de restauration examine sa date et les contraintes de confidentialité connues,
**Then** la restauration ne doit pas permettre un rétablissement silencieux de ces informations ; le contrôle final sera détaillé dans la Story 2.12.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-68, FR-69, FR-73.
* Architecture/décisions : AD-27/31 ; SEC-03/04/08.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.3, 2.4 et les contrôles de session Epic 1.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.6: Restaurer une sauvegarde de façon contrôlée et vérifiable
**Jira :** https://lmn24.atlassian.net/browse/SMN-34
**En tant que** Administrateur,
**je veux** restaurer l'état complet d'une sauvegarde sélectionnée,
**afin de** rétablir SMN sans casser les relations entre données et fichiers.

**Critères d'acceptation :**

#### AC1

**Given** un jeu vérifié compatible et une prévisualisation valide,
**When** l'Administrateur confirme la restauration,
**Then** un processus contrôlé rétablit base, paramètres non secrets, historiques, snapshots, métadonnées et fichiers effectivement sauvegardés.

#### AC2

**Given** des références lient fiches, cycles, documents et versions,
**When** la restauration s'achève,
**Then** les références sont vérifiées, la version de schéma est compatible et les identifiants privés ne sont pas révélés.

#### AC3

**Given** une erreur survient pendant la reconstruction,
**When** le traitement est interrompu,
**Then** aucun état partiellement reconstruit n'est présenté comme opérationnel ; un point de reprise ou état conservé est explicitement accessible.

#### AC4

**Given** la restauration réussit,
**When** l'Administrateur revient dans SMN,
**Then** un diagnostic de succès vérifié et un événement d'audit sont disponibles ; les sessions sensibles sont réévaluées et les secrets restaurés ne sont pas exposés en clair.

#### AC5

**Given** le jeu n'a pas de documents qui n'étaient pas stockés,
**When** l'état restauré est consulté,
**Then** SMN ne crée pas de faux PDF/TXT et signale les références manquantes plutôt que de déclarer un succès erroné.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-68, FR-70, FR-71, FR-73.
* Architecture/décisions : AD-25/26/27/31 ; SEC-03/05/06/08.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.1, 2.2, 2.3 et 2.5 ; la protection vie privée de 2.12 renforcera ce flux sans en être un prérequis pour restaurer une installation jamais effacée.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.7: Préserver l'atomicité des opérations et l'immuabilité des archives
**Jira :** https://lmn24.atlassian.net/browse/SMN-35
**En tant que** Administrateur,
**je veux** que les opérations critiques et leurs preuves restent cohérentes après une panne,
**afin de** ne pas corrompre les données ou les archives du carnet.

**Critères d'acceptation :**

#### AC1

**Given** une modification et son audit forment une unité métier atomique,
**When** une transaction PostgreSQL est validée,
**Then** données et audit de réussite sont tous deux enregistrés, ou aucun des deux ne l'est.

#### AC2

**Given** une panne artificielle intervient entre deux écritures d'un lot simulé,
**When** l'opération échoue,
**Then** la base ne conserve ni succès ni résultat métier partiel, et la reprise indique l'échec.

#### AC3

**Given** un snapshot de clôture Vn ou une archive TXT/PDF existante est référencée,
**When** une écriture de modification directe du contenu archivé est demandée,
**Then** le contrat de persistance refuse la réécriture ; une nouvelle version/trace distincte est nécessaire.

#### AC4

**Given** un bilan contient trois blocs à sauvegarde volontairement indépendante,
**When** un bloc est enregistré,
**Then** les deux autres ne sont pas modifiés par une fausse transaction globale.

#### AC5

**Given** une opération future n'est pas encore implémentée,
**When** la fonction commune est éprouvée,
**Then** elle s'applique à un cas de test réel du périmètre livré sans promettre que les futures opérations ont déjà été validées.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-71, FR-70, FR-73.
* Architecture/décisions : AD-17 à AD-24, AD-25/26 ; SEC-06.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.1 et 2.2 ; mécanismes réutilisables, appliqués par chaque Epic métier au moment de livrer ses opérations.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.8: Distinguer archivage réversible et suppression ordinaire
**Jira :** https://lmn24.atlassian.net/browse/SMN-36
**En tant que** Administrateur,
**je veux** archiver les objets éligibles ou refuser leur suppression lorsqu'un historique doit être conservé,
**afin de** préserver la traçabilité sans confondre départ, archivage et effacement.

**Critères d'acceptation :**

#### AC1

**Given** un objet géré par SMN est éligible à l'archivage,
**When** l'Administrateur demande son archivage,
**Then** l'objet cesse d'être actif mais conserve son identité, ses relations et son accès historique autorisé.

#### AC2

**Given** un objet archivé est réactivable,
**When** l'Administrateur le réactive,
**Then** il retrouve son identifiant d'origine sans duplication ni restauration fictive du passé.

#### AC3

**Given** un objet est encore référencé par des cycles ou documents figés,
**When** une suppression ordinaire est demandée,
**Then** l'impact est présenté et l'opération est refusée ou encadrée pour protéger les liens et historiques.

#### AC4

**Given** un objet sans référence historique bloquante est supprimable,
**When** l'Administrateur prévisualise puis confirme,
**Then** seul le périmètre annoncé est supprimé avec audit ; annulation ou erreur n'entraîne pas de suppression partielle.

#### AC5

**Given** un membre Agile n'existe pas encore dans les données,
**When** les règles communes sont testées,
**Then** la fonctionnalité s'applique à des entités déjà disponibles, sans dépendre de la future création de fiches membres.

#### Traçabilité, périmètre et dépendances

* Epic parente : SMN-2 — Préserver, restaurer et maîtriser les données de son carnet.
* FR : FR-69, FR-70, FR-71.
* Architecture/décisions : D-PRD-135/A11 ; AD-19/26/31 ; SEC-04.
* Incréments : I0 à I6 selon le besoin, principalement mécanismes de protection dès I0, renforcement avec fonctionnalités métier.
* Dépendances sur capacités antérieures : 2.1 et le modèle d'installation/compte existant ; les membres Agile seront traités dans l'Epic 3 avec les mêmes garde-fous.
* UX : écrans clairs et confirmations accessibles, états d'attente, refus autorisés et erreurs explicites ; deux profils MVP Administrateur et Utilisateur.
* Référence officielle : PRD, annexe `securite-exploitation.md`, arbitrages `D-PRD-135`, architecture `SECURITE-EXPLOITATION.md` de la branche documentaire `docs/bmad-arbitrages-metier-valides-20261019`.
* Revue : **proposition soumise à validation groupée de l'Epic 2** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.9: Réinitialiser une installation avec confirmation renforcée
**Jira :** https://lmn24.atlassian.net/browse/SMN-37
**En tant que** Administrateur,
**je veux** réinitialiser explicitement l'installation après avoir mesuré les impacts,
**afin de** repartir d'un état vierge sans supprimer involontairement des données.

**Critères d'acceptation :**

#### AC1

**Given** une installation contient des données,
**When** je sélectionne Réinitialiser,
**Then** SMN présente données, liens, fichiers impactés et recommande une sauvegarde.

#### AC2

**Given** l'écran d'impact est affiché,
**When** j'annule ou quitte la procédure,
**Then** aucune donnée n'est réinitialisée.

#### AC3

**Given** j'ai les droits Administrateur et je confirme explicitement,
**When** le traitement démarre,
**Then** le périmètre annoncé est remis à zéro de manière cohérente et le succès est vérifié et audité.

#### AC4

**Given** un Utilisateur ou une personne anonyme demande une réinitialisation,
**When** le serveur reçoit la requête,
**Then** l'action est refusée.

#### AC5

**Given** la création d'une nouvelle installation indépendante est initiée,
**When** SMN démarre ce parcours,
**Then** l'installation existante n'est jamais effacée implicitement.

#### Traçabilité et dépendances

* FR-69, FR-70, FR-73 ; AD-19/25/26/27/31 ; D-PRD-135 et annexe Sécurité du PRD.
* Dépendances : Stories 2.1, 2.2 et 2.5 ; pas de Story future obligatoire.
* Périmètre : MVP Scrum/Kanban ; seul l'Administrateur peut déclencher les actions destructives.
* Revue : proposition soumise à validation groupée de l'Epic 2, sans tag « À relire » ; aucun développement n'est attesté.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.10: Prévisualiser une demande exceptionnelle d'effacement ou anonymisation
**Jira :** https://lmn24.atlassian.net/browse/SMN-38
**En tant que** Administrateur,
**je veux** voir les conséquences d'une demande exceptionnelle d'effacement de données personnelles,
**afin de** définir un traitement contrôlé avant toute destruction irréversible.

**Critères d'acceptation :**

#### AC1

**Given** un dossier ou une personne identifiable est ciblé,
**When** j'ouvre l'analyse d'impact,
**Then** SMN recense les fiches, associations, calendriers, historiques, textes libres et PDF/TXT stockés concernés lorsqu'ils existent.

#### AC2

**Given** des données collectives sont liées à des données personnelles,
**When** l'analyse est effectuée,
**Then** le maintien collectif n'est proposé que sans risque de réidentification indue et lorsque justifiable.

#### AC3

**Given** une archive PDF/TXT immuable contient une donnée concernée,
**When** l'aperçu est présenté,
**Then** son retrait éventuel et le recours à une édition expurgée distincte sont indiqués sans réécriture du document original.

#### AC4

**Given** des sauvegardes gérées ou des copies exportées existent,
**When** j'examine les impacts,
**Then** la non-réintroduction et les limites de contrôle des copies externes sont mentionnées.

#### AC5

**Given** aucune confirmation destructive n'est fournie,
**When** je ferme la prévisualisation,
**Then** aucune donnée personnelle n'est modifiée ou supprimée.

#### Traçabilité et dépendances

* FR-69, FR-70, FR-71 ; AD-19/25/26/27/31 ; D-PRD-135 et annexe Sécurité du PRD.
* Dépendances : Stories 2.1 et 2.8 ; pas de Story future obligatoire.
* Périmètre : MVP Scrum/Kanban ; seul l'Administrateur peut déclencher les actions destructives.
* Revue : proposition soumise à validation groupée de l'Epic 2, sans tag « À relire » ; aucun développement n'est attesté.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.11: Appliquer un effacement ou une anonymisation exceptionnelle traçable
**Jira :** https://lmn24.atlassian.net/browse/SMN-39
**En tant que** Administrateur,
**je veux** appliquer après confirmation un traitement exceptionnel d'effacement ou anonymisation,
**afin de** réduire l'exposition des données personnelles sans altérer silencieusement l'historique.

**Critères d'acceptation :**

#### AC1

**Given** une analyse d'impact complète est disponible et encore valide,
**When** je donne une confirmation distincte,
**Then** le traitement porte sur le périmètre annoncé et produit un résultat vérifiable.

#### AC2

**Given** des identifiants indirects permettent encore de retrouver une personne,
**When** une anonymisation est demandée,
**Then** SMN n'affirme pas que la donnée est anonyme si la réidentification demeure possible.

#### AC3

**Given** un PDF/TXT archivé est concerné,
**When** l'effacement est exécuté,
**Then** son accès peut être retiré et une éventuelle nouvelle version expurgée reçoit une identité distincte ; l'original n'est jamais réécrit silencieusement.

#### AC4

**Given** des statistiques collectives sont liées aux fiches effacées,
**When** le traitement les évalue,
**Then** elles ne sont maintenues que si leur conservation sans identification indue est justifiée.

#### AC5

**Given** une erreur survient pendant l'effacement,
**When** l'opération se termine,
**Then** les résultats partiels éventuels sont explicités sans succès global fictif et l'audit minimal ne copie pas les informations supprimées.

#### Traçabilité et dépendances

* Exigences : FR-69, FR-70, FR-71, FR-73 ; SEC-03–08 ; D-PRD-135/A11 et AD-19/25–27/31.
* Dépendances : 2.1, 2.7, 2.10. Pas de fonctionnalités des Epics futures requises pour l'usage existant ; les autres modules étendront le périmètre.
* Incréments : I0–I6, contrôle des sauvegardes et des reprises au pilote.
* Revue : proposition soumise à validation groupée Epic 2. Aucun développement ni test attestés.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.12: Empêcher la réintroduction silencieuse après restauration de données effacées
**Jira :** https://lmn24.atlassian.net/browse/SMN-40
**En tant que** Administrateur,
**je veux** bloquer le retour de données déjà effacées lors d'une restauration plus ancienne,
**afin de** préserver les décisions de confidentialité après incident.

**Critères d'acceptation :**

#### AC1

**Given** un effacement exceptionnel a été achevé,
**When** les protections de restauration sont établies,
**Then** une trace minimale opposable conserve les marqueurs nécessaires sans recopier les données sensibles effacées.

#### AC2

**Given** une sauvegarde antérieure est sélectionnée,
**When** le contrôle préalable s'exécute,
**Then** la réintroduction possible est identifiée ; si le contrôle n'est pas concluant la restauration est suspendue, jamais silencieusement acceptée.

#### AC3

**Given** un plan de reprise conforme est validé,
**When** l'Administrateur confirme,
**Then** les données précédemment effacées ne sont pas restaurées, et les relations encore présentes restent cohérentes.

#### AC4

**Given** une sauvegarde gérée dépasse la conservation paramétrable de 30 jours par défaut,
**When** la procédure évalue cette copie,
**Then** la règle de rétention concerne les sauvegardes et non la destruction automatique d'anciens PDF.

#### AC5

**Given** des copies externes existent,
**When** les risques sont présentés,
**Then** SMN indique ne pas contrôler la suppression des copies sorties de son périmètre.

#### Traçabilité et dépendances

* Exigences : FR-68, FR-69, FR-70, FR-73 ; SEC-03–08 ; D-PRD-135/A11 et AD-19/25–27/31.
* Dépendances : 2.3, 2.5, 2.6, 2.11. Pas de fonctionnalités des Epics futures requises pour l'usage existant ; les autres modules étendront le périmètre.
* Incréments : I0–I6, contrôle des sauvegardes et des reprises au pilote.
* Revue : proposition soumise à validation groupée Epic 2. Aucun développement ni test attestés.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

### Story 2.13: Expliquer les interruptions et les résultats de récupération
**Jira :** https://lmn24.atlassian.net/browse/SMN-41
**En tant que** Administrateur,
**je veux** comprendre les erreurs et le résultat réel des opérations de protection,
**afin de** éviter les faux succès lors des incidents et relancer les traitements appropriés.

**Critères d'acceptation :**

#### AC1

**Given** une sauvegarde, restauration, purge ou réinitialisation est demandée,
**When** je consulte son état,
**Then** SMN distingue En cours, Réussie, Échec ou Annulée d'après la persistance réelle.

#### AC2

**Given** une interruption survient pendant une opération sensible,
**When** SMN redémarre ou réévalue l'état,
**Then** les reprises possibles sont explicitées et aucune opération partielle n'est déclarée restaurée.

#### AC3

**Given** une opération autorise explicitement une exécution partielle,
**When** un résultat mixte apparaît,
**Then** les éléments traités, non traités et échoués sont distingués ; l'atomicité reste garantie pour les opérations qui l'exigent.

#### AC4

**Given** un diagnostic est produit,
**When** un utilisateur le consulte,
**Then** aucun mot de passe, secret, document privé brut ou information nominative effacée n'est exposé.

#### AC5

**Given** un responsable consulte les objectifs d'exploitation,
**When** il examine RPO/RTO,
**Then** les cibles indicatives 24 heures / 60 minutes ne sont jamais présentées comme validées ou garanties sans mesures.

#### Traçabilité et dépendances

* Exigences : FR-68, FR-70, FR-71, FR-73 ; SEC-03–08 ; D-PRD-135/A11 et AD-19/25–27/31.
* Dépendances : 2.1 à 2.12. Pas de fonctionnalités des Epics futures requises pour l'usage existant ; les autres modules étendront le périmètre.
* Incréments : I0–I6, contrôle des sauvegardes et des reprises au pilote.
* Revue : proposition soumise à validation groupée Epic 2. Aucun développement ni test attestés.


**Validation :** proposition publiée pour revue globale. Ne pas considérer comme fonctionnellement approuvée.

