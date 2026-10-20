---
status: final
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
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
Découpage BMAD Method v6.12.4. Structure de **10 Epics approuvée le 19/10/2026**. Les Stories des 10 Epics ont été validées fonctionnellement par l'utilisateur le 19/10/2026.
**Périmètre** : MVP Scrum et Kanban ; deux rôles seulement (Administrateur / Utilisateur), SAFe différé. Les incréments I0–I6 ne déterminent pas les limites des Epics.
**Publication** : Jira est la référence des tickets ; ce document conserve leur contenu et traçabilité. L'utilisateur a explicitement autorisé les publications groupées des Epics 2 à 10. Les 210 Stories initiales sont validées fonctionnellement, y compris l'Epic 10 ; cette approbation documentaire n'atteste aucun développement, test ou passage au pilote. L'édition documentaire GitHub est autorisée sur la branche dédiée ; aucun développement, essai technique, fusion `main` ou lancement de pilote n'en découle.
**Avancement** : Steps 1, 2 et 3 achevés ; 10 Epics / 212 Stories approuvées. Step 4 — revue finale du 19/10/2026 : couverture explicite des **81 FR**, **3 NFR** et **18 UX-DR** ; numérotation des Stories et dépendances revues, architecture modulaire cohérente avec le MVP. Quatre références UX ont été ajoutées aux Stories existantes sans modifier les critères métier. La revue du Step 4 a abouti sans contrôle ouvert bloquant ; l'utilisateur a confirmé `C — Complete Workflow` le 19/10/2026 : **workflow BMAD Create Epics and Stories clôturé, document `status: final`**. La finalisation documentaire n'atteste aucun développement, test, mesure ou lancement de pilote.

## Amendement D-PRD-137 — 19/10/2026

Le MVP Scrum/Kanban contient une seule équipe par installation ; le multiéquipes appartient au train SAFe en v1.0. Vision, Product Goal, DoD et DoR sont rattachés à l'équipe au MVP et au train en SAFe. Ajout de Stories 3.24/SMN-221 et 3.25/SMN-222 pour les producteurs des données de 6.9. Le backlog actuel compte 212 Stories ; la clôture historique Create Epics and Stories portait sur 210. Les amendements métier sont validés et leur publication autorisée ; les nouveaux scénarios sont dérivés de ces décisions, sans assimilation à une recette ou à une validation globale antérieure.

## Requirements Inventory

## Décision transversale obligatoire — Catalogues JSON d'internationalisation (20/10/2026)

**Décision utilisateur approuvée ; applicable à toutes les Epics SMN-1 à SMN-10 et à toute Story existante ou future.** Les textes UI standardisés (titres, menus, formulaires, validations, erreurs, aides, états vides) et les libellés standards des rapports HTML/PDF et briefs TXT doivent utiliser **un catalogue JSON par langue**, cible `src/i18n/fr.json` / `src/i18n/en.json`. Les pages ne codent pas en dur les libellés ni les traductions FR/EN. Français et anglais au MVP, repli français explicite, clés sémantiques stables et parité de structure vérifiée ; langue préférée déjà persistée par SMN-18 et rendue effective dans [Story 1.14 — SMN-27](https://lmn24.atlassian.net/browse/SMN-27). Les textes métiers saisis et l'historique restent **dans leur langue d'origine** : aucune traduction ni mutation automatique. Les exports ont leur langue de sortie standard propre.

**À toute implémentation :** alimenter les deux JSON, couvrir le rendu FR/EN, les erreurs, le repli et l'accessibilité ; intégrer ces contrôles à la Definition of Done et à la recette. **Ne pas déclarer le socle déjà développé.** L'existant (chaînes TSX et `src/lib/messages.ts`) requiert une migration ultérieure. [ADR-I0-004](architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md) est la source normative technique ; ce complément ne change ni le nombre de Stories ni leurs critères métier préalablement approuvés.



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

### Epic 3: Constituer son équipe et fiabiliser ses calendriers, capacités et définitions
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


#### Amendement ADR-I0-002 — Validé le 19/10/2026

Base dédiée SMN indépendante des autres applications ; migrations versionnées générées sur une base de développement séparée, application ordonnée après présentation des impacts et confirmation. Sauvegarde préalable pour modification de données existantes. Schéma incompatible ou échec : accès métier bloqué, diagnostic et reprise explicites. Runtime à droits limités, privilèges de migration séparés et à vérifier. Secrets dans un dossier privé hors Git et fichiers publics, sans journalisation. Copie de récupération protégée des clés à prévoir ; son mécanisme reste à préciser.

Ces principes complètent les capacités concernées au cours d'I0, sans prétendre qu'une restauration complète est un prérequis au tout premier diagnostic. Critères transverses et limites : https://github.com/JeanLamora75/SMN/blob/docs/bmad-sprint-readiness-20261019/_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md

Aucun développement, migration ou essai exécuté.

### Story 1.2: Initialiser une installation Express et son Administrateur de manière sûre
**Jira :** https://lmn24.atlassian.net/browse/SMN-12
**En tant que** Scrum Master lors du premier lancement,
**je veux** initialiser mon installation par le parcours Express en renseignant son mode, son produit et son équipe unique,
**afin de** accéder à un espace cohérent et privé avec le minimum de saisie métier.

**Critères d'acceptation :**

#### AC1 — Base PostgreSQL vierge accessible et contexte local d'amorçage autorisé

**Given** Base PostgreSQL vierge accessible et contexte local d'amorçage autorisé,
**When** le Scrum Master ouvre l'assistant Express,
**Then** un choix expliqué Scrum/Kanban, un nom de produit et un nom d'équipe unique sont les seules données métier obligatoires ; SAFe n'est pas proposé comme mode actif.

#### AC2 — Les trois données métier sont valides et l'administrateur initial peut être créé de manière sûre

**Given** Les trois données métier sont valides et l'administrateur initial peut être créé de manière sûre,
**When** le Scrum Master confirme l'initialisation,
**Then** l'installation unique, son produit de référence, son équipe unique et le compte Administrateur sont enregistrés dans une opération cohérente ; la navigation conduit au tableau de bord, sans création de cycles.

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


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

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

#### AC6 — Durée maximale absolue

**Given** une session a été créée après authentification,
**When** 8 heures se sont écoulées depuis cette connexion,
**Then** la session est expirée côté serveur et une nouvelle authentification est requise ; l'activité ou le renouvellement technique ne repoussent pas cette limite absolue.

#### AC7 — Expiration sur inactivité

**Given** une session n'a pas encore atteint sa limite absolue,
**When** aucune activité utilisateur n'a eu lieu pendant 30 minutes,
**Then** elle est expirée côté serveur ; des requêtes de fond seules ne maintiennent pas indéfiniment l'accès.

#### AC8 — Absence de connexion persistante

**Given** le parcours de connexion du MVP est ouvert,
**When** la personne se connecte,
**Then** aucune option « Se souvenir de moi » ne permet de prolonger la session au-delà de la politique validée.

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


**D-PRD-138 — Validé le 19/10/2026 :** 8 heures absolues, 30 minutes d'inactivité et aucune option « Se souvenir de moi » ; aucun test exécuté.

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

#### AC5 — Récupération locale contrôlée

**Given** le mot de passe administrateur est oublié et l'installation locale est identifiée,
**When** son propriétaire utilise la commande de récupération fournie avec SMN et satisfait les contrôles locaux prévus,
**Then** le mot de passe du compte administrateur existant peut être renouvelé ; aucune réinitialisation anonyme par navigateur ni porte dérobée n'est ouverte.

#### AC6 — Saisie et outillage

**Given** la procédure locale autorise le renouvellement,
**When** le nouveau mot de passe est saisi,
**Then** la saisie est masquée ; aucun mot de passe n'est passé en argument visible ou journalisé et aucun outil supplémentaire n'est à installer.

#### AC7 — Révocation et traçabilité

**Given** le renouvellement administrateur réussit,
**When** la procédure confirme son résultat,
**Then** toutes les sessions de ce compte sont révoquées et une trace de récupération est conservée sans mot de passe ni jeton secret.

#### AC8 — Conservation du compte et autonomie locale

**Given** la récupération est exécutée,
**When** le compte existant est traité,
**Then** aucun second administrateur n'est créé, aucune modification SQL manuelle n'est demandée à l'utilisateur et aucun envoi d'e-mail n'est requis.

#### AC9 — Refus ou échec de récupération

**Given** le contrôle local échoue ou une étape de renouvellement/révocation ne peut aboutir,
**When** la procédure présente son résultat,
**Then** elle n'annonce pas de succès complet et n'autorise pas une connexion par défaut ; la situation et la reprise restent explicites, sans exposer de secret.

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


**D-PRD-139 — Principe de récupération locale validé le 19/10/2026 ; contrôles techniques et tests à réaliser.**

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


#### Amendement ADR-I0-002 — Validé le 19/10/2026

Base dédiée SMN indépendante des autres applications ; migrations versionnées générées sur une base de développement séparée, application ordonnée après présentation des impacts et confirmation. Sauvegarde préalable pour modification de données existantes. Schéma incompatible ou échec : accès métier bloqué, diagnostic et reprise explicites. Runtime à droits limités, privilèges de migration séparés et à vérifier. Secrets dans un dossier privé hors Git et fichiers publics, sans journalisation. Copie de récupération protégée des clés à prévoir ; son mécanisme reste à préciser.

Ces principes complètent les capacités concernées au cours d'I0, sans prétendre qu'une restauration complète est un prérequis au tout premier diagnostic. Critères transverses et limites : https://github.com/JeanLamora75/SMN/blob/docs/bmad-sprint-readiness-20261019/_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md

Aucun développement, migration ou essai exécuté.


#### Amendement ADR-I0-003 — Validé le 19/10/2026

Clé locale dans le dossier privé, sans phrase supplémentaire à chaque connexion. La sauvegarde complète inclut une copie de récupération de la clé protégée par une phrase distincte du mot de passe administrateur, choisie lors de la première sauvegarde complète. La restauration sur un autre PC demande cette phrase et doit être testée réellement. Ni la phrase ni une copie non protégée de la clé ne doivent être exposées dans l'archive exportable ou les journaux. En cas de perte simultanée de la clé locale et de la phrase, la récupérabilité des données chiffrées n'est pas garantie ; la récupération du compte administrateur ne recrée pas la clé.

Format et mécanismes cryptographiques restent à qualifier. Voir ADR-I0-003 dans la documentation d'architecture de la PR 9. Aucun développement ni essai exécuté.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.


#### Amendement ADR-I0-003 — Validé le 19/10/2026

Clé locale dans le dossier privé, sans phrase supplémentaire à chaque connexion. La sauvegarde complète inclut une copie de récupération de la clé protégée par une phrase distincte du mot de passe administrateur, choisie lors de la première sauvegarde complète. La restauration sur un autre PC demande cette phrase et doit être testée réellement. Ni la phrase ni une copie non protégée de la clé ne doivent être exposées dans l'archive exportable ou les journaux. En cas de perte simultanée de la clé locale et de la phrase, la récupérabilité des données chiffrées n'est pas garantie ; la récupération du compte administrateur ne recrée pas la clé.

Format et mécanismes cryptographiques restent à qualifier. Voir ADR-I0-003 dans la documentation d'architecture de la PR 9. Aucun développement ni essai exécuté.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.


#### Amendement ADR-I0-003 — Validé le 19/10/2026

Clé locale dans le dossier privé, sans phrase supplémentaire à chaque connexion. La sauvegarde complète inclut une copie de récupération de la clé protégée par une phrase distincte du mot de passe administrateur, choisie lors de la première sauvegarde complète. La restauration sur un autre PC demande cette phrase et doit être testée réellement. Ni la phrase ni une copie non protégée de la clé ne doivent être exposées dans l'archive exportable ou les journaux. En cas de perte simultanée de la clé locale et de la phrase, la récupérabilité des données chiffrées n'est pas garantie ; la récupération du compte administrateur ne recrée pas la clé.

Format et mécanismes cryptographiques restent à qualifier. Voir ADR-I0-003 dans la documentation d'architecture de la PR 9. Aucun développement ni essai exécuté.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : **validée globalement sans réserve le 19/10/2026** ; création Jira autorisée explicitement sans validation préalable le 19/10/2026 ; aucune implémentation ni vérification de conformité juridique réalisées.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : validée globalement sans réserve le 19/10/2026, sans tag « À relire » ; aucun développement n'est attesté.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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
* Revue : validée globalement sans réserve le 19/10/2026, sans tag « À relire » ; aucun développement n'est attesté.

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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

#### Validation fonctionnelle globale

Les Stories 2.1 à 2.13 de l'Epic 2 ont été approuvées globalement sans remarque par l'utilisateur le 19/10/2026. Développement et tests non réalisés.
**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.

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


**Validation :** approuvée globalement par l'utilisateur le 19/10/2026, sans réserve.


## Epic 3: Constituer son équipe et fiabiliser ses calendriers, capacités et définitions
Configurer les membres, affectations, calendriers, absences et capacités sans saisie redondante.
**FRs couvertes :** FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-14, FR-61, FR-62.

### Story 3.1: Créer rapidement les fiches des membres de l'équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-42
**En tant que** Scrum Master Administrateur,
**je veux** définir rapidement l'effectif et créer les fiches provisoires d'une équipe Scrum ou Kanban,
**afin de** obtenir une équipe de départ configurable en limitant la saisie.

**Critères d'acceptation :**

#### AC1

**Given** une équipe Scrum ou Kanban vient d'être créée,
**When** j'ouvre le parcours rapide de membres,
**Then** l'effectif proposé est 3 et une saisie inférieure à 3 est refusée dans ce parcours, sans bloquer l'installation Express.

#### AC2

**Given** je demande la création de 5 membres,
**When** je valide le formulaire,
**Then** SMN crée 5 identités centrales distinctes avec noms provisoires identifiables et affectations initiales à cette équipe.

#### AC3

**Given** des membres sont créés par ordre,
**When** les rôles initiaux sont proposés,
**Then** les trois premiers sont Scrum Master, Product Owner, Développeur, puis tous les suivants Développeur.

#### AC4

**Given** les paramètres de pourcentage initiaux sont applicables,
**When** les fiches provisoires sont initialisées,
**Then** la proposition est 100 % par paramètre, sans supposer ni KPI de cycle ni capacité de développement pour un rôle sans part Développeur.

#### AC5

**Given** une erreur de création se produit,
**When** le lot est confirmé,
**Then** aucune fiche incohérente ni fausse capacité n'est déclarée créée ; la personne peut retenter.

#### Traçabilité et dépendances

* FR : FR-5, FR-7, FR-61.
* Décisions et architecture : D-PRD-007/010/011/012 ; AD-12, AD-31.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Epic 1 : équipe et administrateur initialisés.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.1 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.2: Compléter la fiche centrale du membre et son e-mail facultatif
**Jira :** https://lmn24.atlassian.net/browse/SMN-43
**En tant que** Scrum Master Administrateur,
**je veux** compléter et corriger une fiche membre sans dupliquer les informations de la personne,
**afin de** maintenir un référentiel unique pour les membres de l'équipe unique du MVP ; la mutualisation multiéquipes est réservée à SAFe v1.0.

**Critères d'acceptation :**

#### AC1

**Given** une fiche provisoire « Membre 2 » existe,
**When** j'enregistre un nom réel,
**Then** la fiche centrale est enrichie sans changer son identifiant ni ses affectations.

#### AC2

**Given** une fiche membre est créée ou modifiée,
**When** je laisse l'adresse e-mail vide,
**Then** l'enregistrement est autorisé sans compte de connexion applicatif ni messagerie automatique.

#### AC3

**Given** une adresse e-mail est saisie,
**When** je confirme,
**Then** le format est validé et l'information est rattachée à la fiche centrale, pas dupliquée par équipe.

#### AC4

**Given** un Utilisateur ouvre la même équipe,
**When** il demande un champ e-mail ou une donnée personnelle,
**Then** le serveur refuse l'accès aux données individuelles ; seule une synthèse collective autorisée est visible.

#### AC5

**Given** une fiche membre est enrichie,
**When** je reviens sur un autre écran,
**Then** les champs provisoires et confirmés demeurent distincts et aucune valeur fictive de capacité n'est produite.

#### Traçabilité et dépendances

* FR : FR-5, FR-6, FR-61.
* Décisions et architecture : D-PRD-007/008/009 ; AD-12/19/31.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Story 3.1.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.2 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 3.3: Gérer l'affectation datée et les rôles Agile dans l'équipe unique
**Jira :** https://lmn24.atlassian.net/browse/SMN-44
**En tant que** Scrum Master Administrateur,
**je veux** gérer l'affectation datée et les parts de rôles dans l'équipe unique,
**afin de** suivre les contributions réelles sans dépasser le temps contractuel disponible.

**Critères d'acceptation :**

#### AC1

**Given** un membre existe dans l'installation Scrum ou Kanban,
**When** je l'affecte à l'équipe unique,
**Then** une affectation datée est créée sans dupliquer sa fiche centrale ; aucune seconde équipe interne n'est créée.

#### AC2

**Given** une installation Scrum ou Kanban possède déjà son équipe,
**When** une requête d'interface ou d'API tente de créer une seconde équipe interne ou une affectation vers une autre équipe interne,
**Then** le serveur refuse sans écriture ; le taux d'affectation à l'équipe unique reste borné au temps contractuel disponible.

#### AC3

**Given** un membre occupe deux rôles Agile dans une équipe,
**When** je répartis leurs parts,
**Then** le total des rôles dans cette affectation vaut 100 %, les parts restent éditables et le coefficient de contribution reste indépendant.

#### AC4

**Given** un membre exerce uniquement Scrum Master ou Product Owner,
**When** une capacité Développeur est préparée,
**Then** ces parts sans rôle Développeur n'ajoutent aucune capacité de développement.

#### AC5

**Given** une correction de rôle ou de taux entre en vigueur à une date,
**When** je confirme,
**Then** l'historique daté est conservé et les périodes précédentes ne sont pas silencieusement réécrites.

#### Traçabilité et dépendances

* FR : FR-4, FR-5, FR-7, FR-61.
* Décisions et architecture : F-26–34, F-58–63 ; D-PRD-009/010/011 ; AD-12/16/19.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Stories 3.1 et 3.2.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.3 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 3.4: Clore une affectation et conserver les membres archivés
**Jira :** https://lmn24.atlassian.net/browse/SMN-45
**En tant que** Scrum Master Administrateur,
**je veux** terminer la participation d'un membre ou archiver sa fiche en préservant son historique,
**afin de** garder une composition d'équipe fiable au fil des départs.

**Critères d'acceptation :**

#### AC1

**Given** un membre a plusieurs affectations,
**When** je fixe la fin de son affectation à l'équipe A,
**Then** l'affectation A se termine à date réelle, sans modifier l'équipe B ni les données historiques.

#### AC2

**Given** un départ fait passer une équipe à deux personnes,
**When** je confirme le départ,
**Then** l'affectation est enregistrée et une alerte non bloquante apparaît ; aucun membre de remplacement n'est créé.

#### AC3

**Given** un membre historisé n'est plus actif,
**When** je demande son archivage puis sa réactivation,
**Then** les identifiants, historiques, dates, absences et capacités restent disponibles et sa fiche redevient active sans duplication.

#### AC4

**Given** une fiche ne comporte aucune donnée métier ni historique à préserver,
**When** je demande sa suppression après analyse d'impact,
**Then** une confirmation est demandée et la suppression autorisée n'entraîne pas de cascade historique.

#### AC5

**Given** une fiche possède des références historiques,
**When** je demande la suppression définitive,
**Then** la suppression est refusée avec explication et propositions de fin d'affectation ou archivage.

#### Traçabilité et dépendances

* FR : FR-4, FR-7.
* Décisions et architecture : D-PRD-006/012/135 ; AD-12/19/31 ; SEC-04.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Stories 3.1 à 3.3 ; règles communes d'archivage Epic 2.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.4 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.5: Personnaliser le calendrier hebdomadaire individuel
**Jira :** https://lmn24.atlassian.net/browse/SMN-46
**En tant que** Scrum Master Administrateur,
**je veux** configurer jours travaillés, demi-journées et exceptions de chaque membre,
**afin de** disposer d'une base de disponibilité réaliste pour l'équipe unique du MVP.

**Critères d'acceptation :**

#### AC1

**Given** une fiche membre vient d'être créée,
**When** j'ouvre le calendrier individuel,
**Then** le lundi au vendredi sont proposés travaillés, samedi et dimanche non travaillés ; le taux contractuel reste une donnée distincte.

#### AC2

**Given** un membre ne travaille qu'une demi-journée certains jours,
**When** je personnalise son modèle,
**Then** les demi-journées et jours chômés sont sauvegardés selon les dates d'effet et réutilisables pour les calculs.

#### AC3

**Given** un membre appartient à l'équipe unique du MVP,
**When** je modifie sa disponibilité centrale,
**Then** son affectation utilise cette source de calendrier selon ses dates d'effet sans duplication de fiche ; aucune équipe supplémentaire n'est requise.

#### AC4

**Given** un changement de modèle entre en vigueur plus tard,
**When** je le confirme,
**Then** l'ancien calendrier daté est préservé ; les capacités historiques figées ne sont pas recalculées rétroactivement.

#### AC5

**Given** une donnée est manquante,
**When** j'affiche la disponibilité,
**Then** le manque est explicite ; aucun jour d'absence ou capacité nul n'est inventé.

#### Traçabilité et dépendances

* FR : FR-8, FR-61.
* Décisions et architecture : D-PRD-013 ; AD-12/14/16.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Story 3.1, éventuellement 3.3 pour l'effet des équipes.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.5 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 3.6: Localiser un membre par pays et fuseau horaire
**Jira :** https://lmn24.atlassian.net/browse/SMN-47
**En tant que** Scrum Master Administrateur,
**je veux** indiquer pays, région, ville et fuseau de chaque membre,
**afin de** adapter les calendriers et les horaires sans confondre langue et pays.

**Critères d'acceptation :**

#### AC1

**Given** un pays de référence est configuré pour l'installation,
**When** un nouveau membre est créé,
**Then** le pays proposé reprend la référence installée sans rendre ce champ obligatoire en parcours Express.

#### AC2

**Given** un membre habite dans un autre pays,
**When** je modifie pays, ville/région ou zone IANA,
**Then** sa localisation change individuellement et n'altère ni la langue d'interface ni celle des autres personnes.

#### AC3

**Given** des événements sont affichés pour un membre,
**When** son fuseau IANA est appliqué,
**Then** les heures sont converties correctement, y compris lors des changements d'heure, sans changer l'instant réel.

#### AC4

**Given** la localisation a changé à une date d'effet,
**When** j'ouvre une période passée,
**Then** les règles applicables historiquement demeurent reconstructibles sans utiliser silencieusement la localisation actuelle.

#### AC5

**Given** un membre est localisé dans une région particulière,
**When** je consulte les jours non travaillés,
**Then** seul le calendrier national du pays est automatique ; les particularités régionales sont des absences individuelles, sans calendrier régional automatique MVP.

#### Traçabilité et dépendances

* FR : FR-9, FR-8, FR-61.
* Décisions et architecture : D-PRD-014/021 ; AD-12/14/31.
* Incréments : I1–I2 ; MVP Scrum/Kanban ; deux rôles Administrateur/Utilisateur.
* Dépendances : Stories 3.1 et 3.2 ; le pays et la zone IANA sont enregistrables individuellement avec validation de code même avant la livraison du catalogue administrable de Story 3.7. Celle-ci réutilisera ensuite le champ pays existant.
* Source : PRD/architecture SMN sur branche `docs/bmad-arbitrages-metier-valides-20261019`.
**Statut de la Story 3.6 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.7: Administrer le catalogue des sept pays initiaux
**Jira :** https://lmn24.atlassian.net/browse/SMN-48
**En tant que** Administrateur,
**je veux** consulter et enrichir la liste des pays proposés dans SMN,
**afin de** configurer des équipes internationales sans modifier le code.

**Critères d'acceptation :**

#### AC1

**Given** une installation vient d'être créée,
**When** j'ouvre le catalogue des pays,
**Then** France, Allemagne, Royaume-Uni, Espagne, Portugal, Italie et Canada sont présents et distinguables.

#### AC2

**Given** un pays non proposé doit être suivi,
**When** je crée son entrée avec un code et un nom valides,
**Then** le pays devient sélectionnable sans fichier jour férié obligatoire.

#### AC3

**Given** une entrée existe déjà avec le même code,
**When** j'essaie de l'ajouter à nouveau,
**Then** la création est rejetée sans doublon.

#### AC4

**Given** un Utilisateur sollicite l'administration des pays,
**When** il tente une écriture directe,
**Then** la mutation est refusée côté serveur.

#### AC5

**Given** un pays ne dispose pas de calendrier national,
**When** je consulte ses disponibilités calendaires,
**Then** l'absence de données fériées est indiquée « non configuré », jamais équivalente à aucun jour férié.

#### Traçabilité

* FR : FR-9, FR-10.
* Architecture : D-PRD-015/018 ; AD-12/31.
* Dépendances : Epic 1 (paramètres). Le catalogue est indépendant des calendriers et utilisable sans eux.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.8: Précharger les calendriers nationaux disponibles à l'installation
**Jira :** https://lmn24.atlassian.net/browse/SMN-49
**En tant que** Administrateur,
**je veux** importer automatiquement les fichiers de jours fériés nationaux fournis avec SMN,
**afin de** démarrer le suivi des disponibilités sans importer manuellement les dates connues.

**Critères d'acceptation :**

#### AC1

**Given** une installation connaît son pays de référence,
**When** l'initialisation du catalogue férié démarre,
**Then** SMN recherche localement les fichiers fournis pour ce pays, sans accès à un service externe.

#### AC2

**Given** un des calendriers préchargés pour France, Allemagne ou Royaume-Uni est disponible,
**When** son jeu est chargé,
**Then** la couverture livrée porte sur N-2, N-1, N et N+1 par rapport à l'année d'installation et chaque date porte un nom non vide.

#### AC3

**Given** le même préchargement est relancé,
**When** les données sont déjà présentes,
**Then** l'import est idempotent, sans création de doublons.

#### AC4

**Given** le pays ou l'année n'a aucun fichier fourni,
**When** l'initialisation se termine,
**Then** elle reste possible et un état de couverture non configurée est visible.

#### AC5

**Given** une date nationale fournie est incohérente,
**When** le fichier est validé,
**Then** les entrées invalides ne sont pas inscrites silencieusement et le résultat peut être diagnostiqué.

#### Traçabilité

* FR : FR-10, FR-61.
* Architecture : D-PRD-019/020/022/023 ; AD-12/16.
* Dépendances : Story 3.7 ; mécanisme de validation des jours intégré à la Story.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.9: Importer des jours fériés nationaux à partir d'un CSV
**Jira :** https://lmn24.atlassian.net/browse/SMN-50
**En tant que** Administrateur,
**je veux** importer et contrôler un fichier CSV de jours fériés pour un pays et des années libres,
**afin de** compléter les calendriers manquants y compris historiques.

**Critères d'acceptation :**

#### AC1

**Given** un pays est choisi et un fichier CSV au schéma SMN est fourni,
**When** je lance une prévisualisation,
**Then** SMN indique les dates, noms, doublons et lignes invalides en distinguant les entrées proposées et rejetées.

#### AC2

**Given** un CSV fournit des années antérieures à N-2 ou futures au-delà de N+1,
**When** les dates sont valides,
**Then** l'import n'est pas artificiellement limité à quatre ans.

#### AC3

**Given** une ligne a une date ou un nom vide, ou le pays est incohérent,
**When** la validation s'exécute,
**Then** la ligne est signalée et aucune valeur inventée n'est inscrite.

#### AC4

**Given** l'Administrateur confirme après l'aperçu,
**When** les enregistrements admissibles sont persistés selon une politique de conflits explicite,
**Then** le résultat détaille acceptés/refusés sans mélanger les jours de deux pays.

#### AC5

**Given** un import corrige des jours historiques,
**When** la correction est enregistrée,
**Then** la trace conserve la modification sans recalcul silencieux des capacités initiales figées ou PDF anciens.

#### Traçabilité

* FR : FR-10.
* Architecture : D-PRD-017/020/022 ; AD-12/16/19.
* Dépendances : Stories 3.7 et 3.8 ; réutilise l'entité calendrier national déjà créée.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.10: Importer et sélectionner des jours fériés nationaux depuis un fichier ICS
**Jira :** https://lmn24.atlassian.net/browse/SMN-51
**En tant que** Administrateur,
**je veux** extraire des jours fériés depuis un fichier iCalendar après avoir choisi les événements pertinents,
**afin de** réutiliser des calendriers extérieurs sans considérer chaque événement comme un jour non travaillé.

**Critères d'acceptation :**

#### AC1

**Given** un fichier ICS est téléversé pour un pays choisi,
**When** je demande sa lecture,
**Then** SMN affiche les événements et leurs dates/noms normalisés sans insérer automatiquement de jour férié.

#### AC2

**Given** le fichier contient des réunions ou vacances qui ne sont pas des jours fériés,
**When** je prévisualise,
**Then** je peux retenir uniquement les événements voulus et rejeter les autres.

#### AC3

**Given** un événement sur plusieurs jours, avec récurrence ou fuseau, n'est pas interprétable sans ambiguïté,
**When** l'import l'analyse,
**Then** il est signalé comme nécessitant traitement ou refusé explicitement, sans inventer une date nationale.

#### AC4

**Given** je confirme la sélection d'événements valides,
**When** l'import est exécuté,
**Then** les dates sont associées au seul pays demandé, vérifiées contre les doublons et un bilan d'acceptation est rendu.

#### AC5

**Given** je renseigne une URL d'abonnement ICS,
**When** je cherche une synchronisation permanente,
**Then** le MVP ne crée aucun abonnement ni synchronisation automatique : seul le fichier local importé est accepté.

#### Traçabilité

* FR : FR-10.
* Architecture : D-PRD-017/020/021 ; AD-12/14/16/19.
* Dépendances : Stories 3.7 et 3.9 ; partage stockage et règles de validation avec CSV.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.11: Administrer les catégories et couleurs des absences
**Jira :** https://lmn24.atlassian.net/browse/SMN-52
**En tant que** Administrateur,
**je veux** personnaliser les catégories d'absence sans perdre les références passées,
**afin de** identifier visuellement les indisponibilités dans les calendriers.

**Critères d'acceptation :**

#### AC1

**Given** l'installation est active,
**When** j'ouvre le catalogue de catégories,
**Then** Congés, Formation, Maladie et Autre sont présents avec une couleur chacun.

#### AC2

**Given** je crée ou modifie une catégorie,
**When** j'enregistre nom et couleur valides,
**Then** les deux valeurs sont requises et la catégorie devient sélectionnable pour les absences nouvelles.

#### AC3

**Given** une catégorie utilisée est renommée ou recolorée,
**When** les calendriers dynamiques sont consultés,
**Then** le nouveau nom/couleur apparaît aussi pour les périodes anciennes, sans modifier le motif de chaque absence ni les PDF déjà archivés.

#### AC4

**Given** une catégorie utilisée est désactivée,
**When** une nouvelle absence est créée,
**Then** la catégorie n'est plus sélectionnable mais reste lisible sur les enregistrements anciens.

#### AC5

**Given** une catégorie utilisée est supprimée définitivement ou un libellé médical détaillé est sollicité,
**When** l'action est soumise,
**Then** la référence historique ne peut être détruite et le formulaire Maladie ne demande pas de diagnostic médical.

#### Traçabilité

* FR : FR-13.
* Architecture : D-PRD-027/028/029/030 ; AD-12/19/31.
* Dépendances : Epic 1 paramètres et conformité d'administration. Utilisable avant toute absence.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.12: Enregistrer et modifier une absence individuelle centralisée
**Jira :** https://lmn24.atlassian.net/browse/SMN-53
**En tant que** Administrateur,
**je veux** créer et corriger les absences d'une personne avec dates, demi-journées, catégorie et motif,
**afin de** déduire une fois la disponibilité sans dupliquer l'information entre équipes.

**Critères d'acceptation :**

#### AC1

**Given** une fiche membre est disponible,
**When** j'enregistre une absence depuis son calendrier,
**Then** une seule fiche centrale avec dates ou demi-journées, catégorie, caractère prévu/imprévu et nom/motif non vide est persistée.

#### AC2

**Given** le nom/motif ou la catégorie manque,
**When** j'essaie de sauvegarder,
**Then** l'enregistrement est refusé avec erreur compréhensible, même pour une absence passée.

#### AC3

**Given** un membre possède deux affectations,
**When** une absence est enregistrée puis consultée,
**Then** l'indisponibilité est unique et réutilisable selon chaque équipe et période concernées, sans copies par équipe.

#### AC4

**Given** une absence est modifiée depuis la fiche membre,
**When** je rouvre son calendrier,
**Then** la catégorie et le nom/motif actualisés sont visibles avec une indication textuelle en plus de la couleur.

#### AC5

**Given** une absence est saisie ou corrigée a posteriori,
**When** elle a une incidence sur une période clôturée,
**Then** le changement est tracé sans modifier la capacité initiale figée ni les rapports archivés ; aucune alerte collective ni suppression de Daily n'est déclenchée par cette seule absence.

#### Traçabilité

* FR : FR-11, FR-12, FR-13.
* Architecture : D-PRD-024/026/027 ; AD-12/14/16/19/31.
* Dépendances : Stories 3.2, 3.5 et 3.11 ; l'accès par calendrier d'équipe sera livré en 3.14.
* MVP Scrum/Kanban ; incréments I1–I2 ; seule l'administration peut modifier les données individuelles.
* **Revue : VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026** ; aucun développement ni test exécuté.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.13: Traiter les particularités régionales comme absences individuelles
**Jira :** https://lmn24.atlassian.net/browse/SMN-54
**En tant que** Administrateur,
**je veux** représenter un jour régional non travaillé comme une absence d'un membre,
**afin de** prendre en compte des règles locales sans administrer un catalogue férié régional.

**Critères d'acceptation :**

#### AC1

**Given** une région a une journée non travaillée absente des jours fériés nationaux,
**When** je crée une absence du membre,
**Then** elle comporte sa période, une catégorie et un nom/motif non vide, comme toute absence individuelle.

#### AC2

**Given** cette date coïncide avec un jour férié national ou une absence déjà enregistrée,
**When** les disponibilités sont calculées,
**Then** la journée n'est déduite qu'une fois de la capacité.

#### AC3

**Given** un membre est affecté à l'équipe unique du MVP,
**When** le jour régional est enregistré,
**Then** sa fiche d'absence centrale est prise en compte pour son affectation applicable, sans duplication ni seconde équipe interne.

#### AC4

**Given** l'absence régionale est affichée,
**When** un calendrier d'équipe est ouvert,
**Then** son nom/motif et sa catégorie restent identifiables sans la seule couleur, selon les droits.

#### AC5

**Given** cette absence régionale est saisie,
**When** des cérémonies collectives sont planifiées,
**Then** aucune alerte collective ni suppression de Daily n'est générée du seul fait de cette absence.

#### Traçabilité

* FR : FR-11, FR-12.
* Architecture/décisions : D-PRD-021/026/027 ; AD-12/16.
* Dépendances : 3.6, 3.11 et 3.12.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.13 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 3.14: Consulter le calendrier d'équipe et les absences selon les droits
**Jira :** https://lmn24.atlassian.net/browse/SMN-55
**En tant que** Administrateur et Utilisateur autorisé,
**je veux** consulter les disponibilités et créer une absence depuis le calendrier d'équipe lorsque je suis Administrateur,
**afin de** partager la visibilité sans multiplier les fiches d'absence.

**Critères d'acceptation :**

#### AC1

**Given** des membres sont affectés à une équipe,
**When** un Administrateur consulte leur calendrier,
**Then** il voit les absences autorisées avec nom/motif, catégorie et repère coloré doublé d'un texte.

#### AC2

**Given** l'Administrateur sélectionne un membre puis ajoute une absence,
**When** il valide,
**Then** la fiche créée est celle du membre central et se retrouve immédiatement depuis sa fiche personnelle et toute autre équipe concernée.

#### AC3

**Given** un même enregistrement d'absence est modifié depuis le calendrier d'équipe,
**When** le calendrier personnel est rechargé,
**Then** les mêmes valeurs actualisées apparaissent sans doublon.

#### AC4

**Given** un Utilisateur ouvre le calendrier collectif,
**When** des données individuelles sensibles existent,
**Then** il reçoit seulement la vue collective autorisée, sans motif ou détail nominatif sensible ni droit de modifier.

#### AC5

**Given** des filtres équipe, période, type ou membre autorisé existent,
**When** une sélection est appliquée,
**Then** le résultat est filtré sans altération de dates et sans produire de nouvel événement métier.

#### Traçabilité

* FR : FR-12, FR-62, FR-13.
* Architecture/décisions : D-PRD-024/027 ; AD-14/16/31.
* Dépendances : 3.3, 3.11, 3.12. Calendrier d'équipe utilisable avant les cycles de l'Epic 4.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.14 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.15: Administrer les jours de fermeture de l'entreprise
**Jira :** https://lmn24.atlassian.net/browse/SMN-56
**En tant que** Administrateur,
**je veux** renseigner les fermetures collectives indépendamment des jours fériés et absences individuelles,
**afin de** calculer une disponibilité d'équipe fiable sans multiplier les absences.

**Critères d'acceptation :**

#### AC1

**Given** un jour férié national, une absence individuelle et une fermeture d'entreprise peuvent coïncider,
**When** je crée une fermeture datée,
**Then** la fermeture constitue une entité distincte du catalogue national et des absences.

#### AC2

**Given** une fermeture applicable est enregistrée,
**When** les disponibilités d'un membre concerné sont calculées,
**Then** l'indisponibilité est déduite une seule fois même si plusieurs sources se superposent.

#### AC3

**Given** des équipes sont concernées par la fermeture,
**When** le calendrier autorisé est consulté,
**Then** l'événement collectif est identifiable, sans créer une absence nominative pour chaque membre.

#### AC4

**Given** une fermeture est corrigée à effet daté,
**When** je consulte une période passée clôturée,
**Then** le cliché historique de capacité et les PDF anciens ne sont pas recalculés silencieusement.

#### AC5

**Given** une fermeture concerne une date invalide,
**When** je tente d'enregistrer,
**Then** la requête échoue explicitement sans altérer le calendrier.

#### Traçabilité

* FR : FR-8, FR-10, FR-14, FR-62.
* Architecture/décisions : F-36 ; AD-12/14/16 ; D-PRD-013.
* Dépendances : 3.5 et 3.8 ; entité fermeture autonome.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.15 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.16: Calculer une capacité de développement fiable en jours-homme
**Jira :** https://lmn24.atlassian.net/browse/SMN-57
**En tant que** Scrum Master Administrateur,
**je veux** obtenir la référence de capacité d'une période à partir des disponibilités et affectations,
**afin de** éviter les additions manuelles et les doubles déductions.

**Critères d'acceptation :**

#### AC1

**Given** une fenêtre de dates est sélectionnée avec données suffisantes,
**When** je demande la référence calculée,
**Then** SMN agrège en JH disponibilité × affectation × part Développeur × coefficient de contribution, avec paramètre heures/JH configurable (8 par défaut).

#### AC2

**Given** un membre a 100 % de part Product Owner sans activité Développeur,
**When** le calcul est exécuté,
**Then** sa contribution de développement est nulle sans fabriquer d'indicateur de Sprint/Kanban.

#### AC3

**Given** un jour est à la fois férié, fermé et couvert par une absence,
**When** la capacité est calculée,
**Then** cette période d'indisponibilité n'est déduite qu'une fois.

#### AC4

**Given** des calendriers ou affectations historiques sont absents,
**When** le calcul est sollicité,
**Then** la valeur est « Non calculable/Non renseigné » avec origine des données manquantes, jamais zéro fictif.

#### AC5

**Given** une demi-journée et un changement d'affectation daté existent,
**When** le calcul est exécuté,
**Then** les durées et taux applicables à chaque sous-période sont respectés, sans conversion de Story Points en JH.

#### Traçabilité

* FR : FR-14, FR-8, FR-9, FR-10, FR-61.
* Architecture/décisions : D-PRD-031/033 ; AD-11/12/14/16/19.
* Dépendances : 3.3, 3.5, 3.7–3.15. Moteur autonome par fenêtre temporelle, sans dépendre d'une future création de Sprint.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.16 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.17: Arbitrer une capacité manuelle prioritaire face à la référence calculée
**Jira :** https://lmn24.atlassian.net/browse/SMN-58
**En tant que** Scrum Master Administrateur,
**je veux** saisir ou effacer une valeur de capacité en JH en gardant la référence calculée visible,
**afin de** conserver la maîtrise des données métier sans perdre la traçabilité.

**Critères d'acceptation :**

#### AC1

**Given** une référence calculée de 30 JH est disponible,
**When** je saisis manuellement 32 JH,
**Then** la valeur retenue reste 32 JH, la référence calculée 30 JH reste affichée et la provenance « Saisie » est mémorisée.

#### AC2

**Given** une absence tardive fait recalculer la référence à 28 JH,
**When** la période est consultée,
**Then** la saisie manuelle de 32 JH n'est pas remplacée.

#### AC3

**Given** la valeur manuelle 0 JH est saisie explicitement,
**When** j'enregistre,
**Then** le zéro est considéré comme une valeur valide et distinct d'un champ vide.

#### AC4

**Given** une valeur saisie existe,
**When** je l'efface volontairement et un calcul fiable est disponible,
**Then** SMN rétablit le mode Calcul comme valeur retenue, avec historique du changement.

#### AC5

**Given** une période est clôturée ou la capacité initiale figée,
**When** je tente de remplacer la valeur manuelle,
**Then** la correction nécessite la procédure de réouverture ou d'ajustement historique autorisée, sans réécriture directe.

#### Traçabilité

* FR : FR-14, FR-61.
* Architecture/décisions : D-PRD-033/034 ; AD-16/19.
* Dépendances : 3.16 et Epic 1 protection des écritures.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.17 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.18: Figer la capacité initiale à l'ouverture effective d'une période
**Jira :** https://lmn24.atlassian.net/browse/SMN-59
**En tant que** Scrum Master Administrateur,
**je veux** conserver la capacité initialement retenue à l'ouverture réelle de la période,
**afin de** comparer ensuite le prévisionnel à la réalité sans reconstitution trompeuse.

**Critères d'acceptation :**

#### AC1

**Given** une période de référence n'a pas encore été ouverte,
**When** je consulte sa date théorique,
**Then** aucun cliché n'est créé par la simple lecture de sa date.

#### AC2

**Given** un événement métier d'ouverture effective est déclenché une première fois,
**When** le service de capacité le traite,
**Then** la valeur manuelle retenue ou à défaut calculée fiable est figée automatiquement avec date réelle d'ouverture et provenance.

#### AC3

**Given** une absence est saisie après l'ouverture, même qualifiée ensuite Prévue,
**When** la capacité recalculée évolue,
**Then** le cliché initial reste identique et consultable.

#### AC4

**Given** un traitement d'ouverture est rejoué au redémarrage,
**When** le service l'exécute,
**Then** l'opération est idempotente, sans second cliché ni donnée postérieure reconstituée comme connue initialement.

#### AC5

**Given** une période entièrement passée est créée rétrospectivement,
**When** la source initiale manque,
**Then** aucune capacité initiale prétendument connue n'est reconstruite automatiquement ; l'état non renseigné ou estimé est respecté.

#### Traçabilité

* FR : FR-14.
* Architecture/décisions : D-PRD-031–035 ; D-PRD-130/A2 ; AD-11/16/19/20.
* Dépendances : 3.16 et 3.17 ; événement d'ouverture métier générique testable sans dépendre des Epics 4 ou 7, qui le déclencheront.
* MVP Scrum/Kanban, incréments I1–I2 ; données personnelles réservées à l'Administrateur.
**Statut de la Story 3.18 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.19: Calculer la capacité réellement constatée selon le statut de période
**Jira :** https://lmn24.atlassian.net/browse/SMN-60
**En tant que** Scrum Master Administrateur,
**je veux** voir la capacité réellement constatée séparément de l'engagement initial,
**afin de** identifier les écarts sans attribuer une performance à une personne.

**Critères d'acceptation :**

#### AC1

**Given** la période est À venir,
**When** une capacité réelle est demandée,
**Then** SMN ne présente aucun réalisé fictif et n'extrapole pas un temps futur.

#### AC2

**Given** la période est En cours et des données de disponibilité réelles sont connues,
**When** le suivi est consulté,
**Then** la référence constatée reflète les données effectives disponibles à cet instant sans présumer de journées futures.

#### AC3

**Given** la période est Terminée non Clôturée,
**When** le calcul de réalisé est demandé,
**Then** la référence peut être réévaluée sur la période achevée et l'écart est affiché seulement si les deux termes sont connus.

#### AC4

**Given** une valeur réelle a été saisie manuellement,
**When** la référence calculée change,
**Then** la valeur manuelle reste retenue, y compris le zéro explicitement saisi.

#### AC5

**Given** la période est Clôturée,
**When** un recalcul est déclenché,
**Then** la capacité conservée n'est pas modifiée sans réouverture autorisée ni nouvel instantané ; les PDF historiques restent figés.

#### Traçabilité et dépendances

* FR : FR-14.
* Décisions : D-PRD-114/115 ; AD-11/16/19/20.
* Dépendances : 3.16, 3.17 et 3.18 ; testé sur un statut métier de période, repris ensuite par les cycles Scrum/Kanban.
* MVP Scrum/Kanban, incréments I1–I2 ; sauvegardes et protections communes selon les Epics 1 et 2.
* Statut : **validation fonctionnelle globale le 19/10/2026 ; développement et recette non réalisés**.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.20: Qualifier la fiabilité des capacités historiques sans créer de faux zéros
**Jira :** https://lmn24.atlassian.net/browse/SMN-61
**En tant que** Scrum Master Administrateur,
**je veux** renseigner la qualité connue, estimée ou non renseignée d'une capacité passée,
**afin de** comparer des périodes avec des données honnêtement qualifiées.

**Critères d'acceptation :**

#### AC1

**Given** une période historique est créée après sa fin,
**When** une capacité initiale n'a pas été retrouvée,
**Then** SMN conserve « Non renseignée » et ne reconstruit pas fictivement l'état à l'ouverture.

#### AC2

**Given** une valeur historique réellement sourcée est saisie,
**When** je choisis Connue,
**Then** sa provenance et son niveau de qualité sont mémorisés distinctement du mode Calcul/Saisie.

#### AC3

**Given** une capacité est reconstituée à partir de données partielles,
**When** je choisis Estimée,
**Then** elle reste signalée comme estimation même si la valeur en JH est calculable.

#### AC4

**Given** une capacité prévue est inconnue mais la capacité réelle est mesurée,
**When** je consulte la période,
**Then** la capacité réelle peut exister indépendamment, aucun écart numérique trompeur n'est inventé.

#### AC5

**Given** une correction d'estimation est enregistrée,
**When** une vue historique est rechargée,
**Then** l'évolution et sa source sont traçables ; les clichés et exports déjà produits ne sont pas réécrits.

#### Traçabilité et dépendances

* FR : FR-14, FR-61.
* Décisions : D-PRD-130/A2 ; D-PRD-032/033 ; AD-11/16/19.
* Dépendances : 3.16 et 3.17 ; la création de Sprint historique relève de l'Epic 8.
* MVP Scrum/Kanban, incréments I1–I2 ; sauvegardes et protections communes selon les Epics 1 et 2.
* Statut : **validation fonctionnelle globale le 19/10/2026 ; développement et recette non réalisés**.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.21: Prévisualiser les effets d'une replanification sur les références de capacité
**Jira :** https://lmn24.atlassian.net/browse/SMN-62
**En tant que** Scrum Master Administrateur,
**je veux** connaître les changements de capacité avant de modifier les bornes d'un cycle,
**afin de** replanifier sans effacer des valeurs manuelles ou des références historiques.

**Critères d'acceptation :**

#### AC1

**Given** une période existante possède des dates et des données de capacité,
**When** je propose de nouvelles bornes,
**Then** SMN calcule et présente les références Avant/Après et écarts JH s'ils sont fiables.

#### AC2

**Given** la capacité initiale a été figée,
**When** je change les dates proposées,
**Then** la valeur initiale figée reste inchangée ; les références recalculées sont seulement des propositions.

#### AC3

**Given** des valeurs prévues ou réelles ont été saisies manuellement,
**When** une replanification est confirmée,
**Then** leurs valeurs retenues ne sont pas remplacées par des références calculées.

#### AC4

**Given** une période est clôturée,
**When** une replanification est soumise,
**Then** l'opération est bloquée jusqu'à une réouverture autorisée et conserve les archives PDF existantes.

#### AC5

**Given** les données nécessaires au calcul manquent ou une erreur se produit,
**When** une replanification est prévisualisée,
**Then** les références sont « Non calculable » sans faux zéro, et le résultat n'est pas déclaré sauvegardé avant confirmation atomique.

#### Traçabilité et dépendances

* FR : FR-14.
* Décisions : D-PRD-114/115 ; AD-17/18/19/20.
* Dépendances : 3.16 à 3.20 ; cas de test autonome de période datée ; branchement aux cycles dans Epic 4/7.
* MVP Scrum/Kanban, incréments I1–I2 ; sauvegardes et protections communes selon les Epics 1 et 2.
* Statut : **validation fonctionnelle globale le 19/10/2026 ; développement et recette non réalisés**.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.22: Préremplir les formulaires membres et calendriers sans écraser les choix
**Jira :** https://lmn24.atlassian.net/browse/SMN-63
**En tant que** Scrum Master Administrateur,
**je veux** réutiliser les valeurs déjà connues dans les formulaires de l'équipe,
**afin de** réduire les saisies en préservant la distinction entre valeurs sources et suggestions.

**Critères d'acceptation :**

#### AC1

**Given** le pays de l'installation, le nom d'équipe et les réglages sont connus,
**When** je crée une fiche,
**Then** les champs modifiables reprennent les bonnes valeurs de contexte sans devenir obligatoires artificiellement.

#### AC2

**Given** un champ KPI, une absence, une capacité ou une date est inconnue,
**When** j'ouvre un formulaire,
**Then** aucun zéro, absence ou événement n'est inventé pour remplir le vide.

#### AC3

**Given** une saisie manuelle enregistrée existe avec un calcul distinct,
**When** les paramètres évoluent,
**Then** la référence calculée peut se mettre à jour sans écraser la saisie prioritaire.

#### AC4

**Given** une fiche provisoire attend des données facultatives,
**When** je navigue vers un autre écran,
**Then** la configuration incomplète ne bloque pas l'usage courant et reste explicite.

#### AC5

**Given** une opération nécessite confirmation formelle (import, lot ou correction historique),
**When** j'affiche la prévisualisation,
**Then** aucune écriture n'est déclenchée par le seul préremplissage.

#### Traçabilité et dépendances

* FR : FR-61, FR-5, FR-8, FR-9, FR-14.
* Décisions : UX-04 ; AD-12/16/19.
* Dépendances : Stories 3.1 à 3.21 ; composants réutilisables par les fonctionnalités existantes.
* MVP Scrum/Kanban, incréments I1–I2 ; sauvegardes et protections communes selon les Epics 1 et 2.
* Statut : **validation fonctionnelle globale le 19/10/2026 ; développement et recette non réalisés**.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 3.23: Afficher cycles, événements et absences dans un calendrier central partagé
**Jira :** https://lmn24.atlassian.net/browse/SMN-64
**En tant que** Administrateur ou Utilisateur autorisé,
**je veux** consulter dans une vue commune les cycles, réunions et indisponibilités disponibles,
**afin de** préparer les activités sans perdre le contexte ni modifier les données par inadvertance.

**Critères d'acceptation :**

#### AC1

**Given** un calendrier d'équipe comporte des membres et absences,
**When** j'ouvre le calendrier central,
**Then** les indisponibilités autorisées sont regroupées avec légendes et liens source ; les cycles/événements ne sont montrés que s'ils existent réellement.

#### AC2

**Given** une réunion Agile est disponible,
**When** je consulte sa date et statut,
**Then** sa valeur réelle est utilisée, sans affirmer qu'un événement ancien a été tenu si son statut est inconnu.

#### AC3

**Given** je filtre par équipe, période, type et membre selon mon profil,
**When** les filtres sont activés,
**Then** la vue change sans écriture métier ni duplication des fiches sources.

#### AC4

**Given** un membre travaille dans un fuseau différent ou sur un changement d'heure,
**When** je consulte la vue,
**Then** les instants UTC et zones IANA sont respectés, sans décalage artificiel des dates métier.

#### AC5

**Given** un Utilisateur consulte le calendrier ou quelqu'un tente un glisser-déposer,
**When** l'action est exécutée,
**Then** les motifs individuels confidentiels restent masqués et aucune date de cycle, absence ou événement historique n'est déplacée implicitement.


**Traçabilité UX ajoutée lors de la revue finale :** UX-DR06 — Calendrier unifié, filtres et fuseaux fiables.

#### Traçabilité et dépendances

* FR : FR-62, FR-60.
* Décisions : UX-05 ; AD-14/15/18/31.
* Dépendances : 3.14 pour calendrier d'équipe ; intégration avec les cycles/événements au moment de leur livraison dans Epic 4/7 sans dépendance préalable.
* MVP Scrum/Kanban, incréments I1–I2 ; sauvegardes et protections communes selon les Epics 1 et 2.
* Statut : **validation fonctionnelle globale le 19/10/2026 ; développement et recette non réalisés**.

#### Validation fonctionnelle globale

L'utilisateur a validé toutes les 23 Stories de l'Epic 3 sans réserve le 19/10/2026. Cette approbation porte sur les exigences, non sur une implémentation ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.



### Story 3.24: Renseigner et historiser la vision et le Product Goal de l'équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-221

#### User Story

**En tant que** Scrum Master Administrateur,
**je veux** renseigner et modifier la vision et le Product Goal depuis la fiche de mon équipe,
**afin de** conserver son contexte et le réutiliser dans les rapports sans ressaisie.

#### Critères d'acceptation — Given / When / Then

##### AC1

**Given** l'équipe unique d'une installation Scrum ou Kanban existe,
**When** l'Administrateur ouvre sa fiche de contexte,
**Then** Vision et Product Goal sont deux champs distincts et facultatifs rattachés à cette équipe ; leur absence ne bloque ni l'installation ni le reporting.

##### AC2

**Given** un contenu a été saisi ou modifié,
**When** l'Administrateur confirme l'enregistrement,
**Then** le contenu et sa révision sont enregistrés avec équipe, auteur et horodatage ; les versions précédentes restent consultables sans écrasement.

##### AC3

**Given** une version antérieure ou un rapport déjà archivé existe,
**When** la formulation courante est modifiée,
**Then** ses versions datées et les anciens PDF restent inchangés ; le nouveau contenu ne change ni le produit fixe ni les objectifs de cycle.

##### AC4

**Given** un rapport demande le contexte de l'équipe,
**When** sa projection est construite,
**Then** elle expose les contenus disponibles et leurs références de version selon le contrat historique AD-22, sans inventer un contenu absent ni le traduire automatiquement.

##### AC5

**Given** un Utilisateur ou une personne non authentifiée tente une modification par interface ou API,
**When** le serveur contrôle la demande,
**Then** l'écriture est refusée ; les lectures collectives autorisées restent soumises à l'authentification.

##### AC6

**Given** une validation ou une sauvegarde échoue,
**When** le résultat est présenté,
**Then** aucun succès fictif, nouvelle version partielle ou remplacement de l'ancien contenu n'est annoncé.


#### Traçabilité, dépendances et impacts

* Décision D-PRD-137, clarification et publication autorisées explicitement le 19/10/2026 ; F-116 à F-120 et F-123 ; FR-27, FR-28, FR-61, FR-66, FR-70, FR-71 ; AD-2/12/19/22/31.
* Epic SMN-3 ; I1–I2 avant acceptation complète de Story 6.9. Dépendances : Story 1.2 (équipe unique), Stories 1.4/1.6 (accès serveur), socle d'audit 2.1.
* Impacts techniques : stockage des contenus et révisions avec identifiant d'équipe ; transaction de sauvegarde/audit, lecture historique pour le reporting, absence de dépendance aux écrans SAFe. Les contrats doivent permettre le futur rattachement au train sans le développer au MVP.
* MVP Scrum/Kanban uniquement. Utilisateur en lecture collective autorisée ; aucune mutation. Pas de transfert IA, traduction automatique ou création d'équipe supplémentaire.
* Statut : décision métier validée par l'utilisateur ; scénarios détaillés dérivés pour sa réalisation. Aucun développement, test ou conformité attestés.



### Story 3.25: Renseigner et historiser la DoD et la DoR de l'équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-222

#### User Story

**En tant que** Scrum Master Administrateur,
**je veux** maintenir la DoD et la DoR dans la fiche de mon équipe sous forme de texte ou de lien,
**afin de** disposer de définitions identifiables et sélectionnables dans les rapports.

#### Critères d'acceptation — Given / When / Then

##### AC1

**Given** l'équipe unique d'une installation Scrum ou Kanban existe,
**When** l'Administrateur renseigne sa DoD ou sa DoR,
**Then** chaque définition est distincte, facultative, rattachée à cette équipe et représentable sous forme de texte intégral interne ou de lien externe.

##### AC2

**Given** une définition ou son lien est modifié,
**When** l'Administrateur confirme,
**Then** une révision datée et attribuée est conservée avec l'ancienne représentation ; aucune version précédente ni aucun PDF archivé n'est réécrit.

##### AC3

**Given** une définition est fournie par un lien externe,
**When** elle est consultée ou sélectionnée dans un rapport,
**Then** SMN présente le lien enregistré sans affirmer avoir vérifié, téléchargé ou archivé le contenu distant ; l'historique de l'URL ne prouve pas celui du document distant.

##### AC4

**Given** la DoD ou la DoR n'est pas renseignée,
**When** un rapport est préparé,
**Then** aucune définition fictive n'est créée et la génération reste possible ; leur inclusion facultative en fin de rapport demeure informative.

##### AC5

**Given** un Utilisateur ou une personne non authentifiée tente une modification par interface ou API,
**When** le serveur contrôle la demande,
**Then** l'écriture est refusée ; un contenu individuel sensible ne peut être ajouté à une projection collective autorisée.

##### AC6

**Given** une sauvegarde échoue ou un brouillon est abandonné,
**When** la fiche est relue,
**Then** seule la dernière représentation réellement enregistrée est présentée comme persistée, sans nouvelle révision fictive.


#### Traçabilité, dépendances et impacts

* Décision D-PRD-137, clarification et publication autorisées explicitement le 19/10/2026 ; F-116 à F-120 et F-123 ; FR-27, FR-28, FR-61, FR-66, FR-70, FR-71 ; AD-2/12/19/22/31.
* Epic SMN-3 ; I1–I2 avant acceptation complète de Story 6.9. Dépendances : Story 1.2 (équipe unique), Stories 1.4/1.6 (accès serveur), socle d'audit 2.1.
* Impacts techniques : stockage des contenus et révisions avec identifiant d'équipe ; transaction de sauvegarde/audit, lecture historique pour le reporting, absence de dépendance aux écrans SAFe. Les contrats doivent permettre le futur rattachement au train sans le développer au MVP.
* MVP Scrum/Kanban uniquement. Utilisateur en lecture collective autorisée ; aucune mutation. Pas de transfert IA, traduction automatique ou création d'équipe supplémentaire.
* Statut : décision métier validée par l'utilisateur ; scénarios détaillés dérivés pour sa réalisation. Aucun développement, test ou conformité attestés.


## Epic 4: Préparer, suivre et clôturer ses Sprints Scrum
Générer et suivre les Sprints Scrum, leurs cérémonies, leurs objectifs, leur bilan et les clôtures versionnées.
**FRs couvertes :** FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-24.

### Story 4.1: Configurer la cadence et les horaires d'une équipe Scrum
**Jira :** https://lmn24.atlassian.net/browse/SMN-65

**En tant que** Scrum Master Administrateur,
**je veux** modifier les paramètres qui serviront aux futurs Sprints,
**afin de** adapter Scrum à l'organisation de mon équipe.

**Critères d'acceptation :**

#### AC1

**Given** L'installation est en mode Scrum,
**When** j'ouvre les paramètres d'équipe,
**Then** la durée initiale est deux semaines ; seules 1, 2, 3 ou 4 semaines sont acceptées.

#### AC2

**Given** Une équipe est initialisée,
**When** je consulte les bornes par défaut,
**Then** le démarrage est lundi 09 h et la fin vendredi de la dernière semaine à 18 h dans le fuseau IANA de l'équipe.

#### AC3

**Given** Les paramètres sont modifiables,
**When** je change le jour et l'heure de début ou de fin,
**Then** la nouvelle cadence est validée, horodatée et sera utilisée pour les prochains Sprints seulement.

#### AC4

**Given** Des Sprints ou événements existent déjà,
**When** je modifie les paramètres par défaut,
**Then** leurs bornes et occurrences restent inchangées, y compris si les Sprints sont futurs.

#### AC5

**Given** Un Utilisateur sans droit de modification tente la même opération,
**When** la requête parvient au serveur,
**Then** l'écriture est refusée ; le paramétrage reste sous contrôle Administrateur.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-17, FR-24 ; D-PRD-036/042/044/049 ; AD-14/17.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.2: Générer un Sprint unitaire à la demande
**Jira :** https://lmn24.atlassian.net/browse/SMN-66

**En tant que** Scrum Master Administrateur,
**je veux** créer un Sprint selon la cadence active,
**afin de** disposer d'un cycle planifié sans opération complexe.

**Critères d'acceptation :**

#### AC1

**Given** Aucun Sprint n'existe,
**When** j'ouvre la génération unitaire,
**Then** SMN me demande une date de départ choisie explicitement et propose X = 1.

#### AC2

**Given** Un Sprint existe déjà, quel que soit son statut,
**When** j'ouvre la création,
**Then** SMN propose le début du cycle qui suivrait le dernier Sprint chronologique, librement corrigeable.

#### AC3

**Given** Une date de départ est saisie,
**When** je la modifie,
**Then** le nom initial basé sur les dates et les bornes calculées sont mis à jour tant que le nom n'a pas été personnalisé.

#### AC4

**Given** La proposition unitaire est valide,
**When** je clique Générer,
**Then** un Sprint est enregistré sans écran de prévisualisation distinct ni confirmation supplémentaire, avec audit de réussite.

#### AC5

**Given** Les dates se chevauchent dans la même équipe ou sont invalides,
**When** je clique Générer,
**Then** la création est refusée sans Sprint partiel ; une équipe distincte n'est pas bloquée pour ces mêmes dates.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-24 ; D-PRD-037/099/104/105/106 ; AD-15/17.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.3: Prévisualiser et corriger un lot de Sprints
**Jira :** https://lmn24.atlassian.net/browse/SMN-67

**En tant que** Scrum Master Administrateur,
**je veux** voir plusieurs Sprints calculés avant leur génération,
**afin de** éviter les chevauchements et créations accidentelles.

**Critères d'acceptation :**

#### AC1

**Given** Un nombre de cycles est demandé,
**When** je saisis une valeur différente d'un entier entre 1 et 6,
**Then** une erreur bloque l'opération sans créer de Sprint.

#### AC2

**Given** Je demande entre 2 et 6 Sprints,
**When** j'ouvre la prévisualisation,
**Then** SMN liste noms, dates locales de début et de fin et éventuels conflits de chacun des Sprints proposés.

#### AC3

**Given** Un Sprint proposé chevauche un Sprint de la même équipe ou un autre du lot,
**When** je consulte l'aperçu,
**Then** la confirmation est bloquée, les cycles et bornes en conflit sont indiqués.

#### AC4

**Given** Un conflit bloque un lot,
**When** je modifie la date de départ du lot,
**Then** tous les cycles proposés sont recalculés ; les cycles existants ne sont pas déplacés et les dates individuelles du lot ne sont pas éditables.

#### AC5

**Given** Je ferme l'aperçu ou change un paramètre,
**When** je reviens à la génération,
**Then** aucune création n'a lieu ; un nouvel aperçu actuel est requis avant confirmation.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-24 ; D-PRD-094/095/096/097/098/099/100/101 ; AD-15/17.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.4: Confirmer un lot valide avec écriture atomique et audit
**Jira :** https://lmn24.atlassian.net/browse/SMN-68

**En tant que** Scrum Master Administrateur,
**je veux** générer un lot de Sprints après prévisualisation complète,
**afin de** préparer plusieurs cycles sans risque d'un résultat partiel.

**Critères d'acceptation :**

#### AC1

**Given** Un aperçu de 2 à 6 Sprints est valide,
**When** je confirme explicitement,
**Then** tous les Sprints proposés sont créés dans une transaction cohérente avec identifiants et bornes conservés.

#### AC2

**Given** Une anomalie de cadence, borne ou chevauchement apparaît sur un seul Sprint,
**When** je confirme le lot,
**Then** l'intégralité du lot est rejetée, même si les autres Sprints sont valides.

#### AC3

**Given** Une panne survient pendant la persistance,
**When** le service reprend,
**Then** aucun Sprint ni audit de succès partiel n'est conservé ; le résultat est Échec.

#### AC4

**Given** Le lot est créé,
**When** j'ouvre son historique,
**Then** SMN retrace auteur, instant UTC, équipe, cadence, identifiants, noms et bornes des cycles créés.

#### AC5

**Given** Deux Sprints se touchent sans durée commune, ou sont dans des équipes différentes,
**When** la validation des chevauchements s'exécute,
**Then** ils ne sont pas considérés comme un conflit ; le fuseau IANA et le changement d'heure ne décalent pas les horaires locaux.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-24 ; D-PRD-095/096/101/102/103 ; AD-15/17/19.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.5: Renommer un Sprint sans toucher à ses données historiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-69

**En tant que** Scrum Master Administrateur,
**je veux** adapter le nom d'un Sprint avant ou après création,
**afin de** reconnaître mes périodes sans perdre leurs dates et traces.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint est généré,
**When** je consulte son nom proposé,
**Then** le libellé « Sprint du JJ/MM/AAAA au JJ/MM/AAAA » correspond à ses dates et reste modifiable.

#### AC2

**Given** Un nom est personnalisé,
**When** les bornes proposées sont recalculées avant création,
**Then** le nom personnalisé est conservé au lieu d'être remplacé automatiquement.

#### AC3

**Given** Je saisis un nom vide ou composé seulement d'espaces,
**When** je tente d'enregistrer,
**Then** le nom est refusé ; seuls les espaces de début et fin d'un nom non vide sont retirés.

#### AC4

**Given** Deux Sprints de la même équipe portent le même nom,
**When** je sauvegarde le second,
**Then** une alerte non bloquante apparaît et les deux noms sont autorisés ; dates et identifiants permettent de les distinguer.

#### AC5

**Given** Un Sprint est Clôturé,
**When** je le renomme,
**Then** il reste Clôturé sans réouverture ; identifiant, objectifs, valeurs, dates et anciens PDF demeurent inchangés, et l'action est auditée.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-24 ; D-PRD-105/106/107/108/109/110 ; AD-19/20.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.6: Supprimer après confirmation des Sprints jamais démarrés
**Jira :** https://lmn24.atlassian.net/browse/SMN-70

**En tant que** Scrum Master Administrateur,
**je veux** retirer un ou plusieurs Sprints À venir,
**afin de** nettoyer une planification erronée sans effacer d'historique.

**Critères d'acceptation :**

#### AC1

**Given** Un ou plusieurs Sprints n'ont jamais démarré,
**When** je les sélectionne pour suppression,
**Then** SMN récapitule les cycles et les conséquences pour les événements déjà planifiés et demande une confirmation.

#### AC2

**Given** La confirmation n'a pas été donnée,
**When** je ferme le dialogue,
**Then** aucun Sprint ni événement n'est supprimé.

#### AC3

**Given** Un Sprint a démarré, même s'il est Terminé ou Clôturé,
**When** je tente de le supprimer par ce parcours,
**Then** l'opération est refusée sans effacer métriques, événements ou capacité figée.

#### AC4

**Given** Tous les cycles sélectionnés sont supprimables,
**When** je confirme,
**Then** seules les références autorisées sont retirées de façon cohérente avec audit de l'opération.

#### AC5

**Given** Un Utilisateur essaie la suppression,
**When** il appelle l'API directement,
**Then** l'action est refusée côté serveur.

#### Traçabilité

* Epic : SMN-4 ; FR-15, FR-24 ; D-PRD-037 ; AD-18/19 ; SEC-04.
* Incréments : I1–I2. MVP Scrum uniquement ; capacité de base déjà disponible via Epics 1–3 ; aucune Story future exigée pour fonctionner.
* **État : validation fonctionnelle globale de l'Epic 4 ; aucun développement/test réalisé.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.7: Suivre les transitions automatiques d'état du Sprint
**Jira :** https://lmn24.atlassian.net/browse/SMN-71

**En tant que** Scrum Master Administrateur,
**je veux** distinguer les états calendaires d'un Sprint et sa clôture volontaire,
**afin de** voir les périodes pertinentes sans action manuelle quotidienne.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint planifié commence dans le futur,
**When** je consulte son statut,
**Then** il est À venir sans ouverture de capacité initiale avant un démarrage réel.

#### AC2

**Given** La borne de début d'un Sprint est atteinte,
**When** SMN applique la transition temporelle,
**Then** le statut devient En cours et le déclencheur d'ouverture de capacité est traité une seule fois.

#### AC3

**Given** La fin locale du Sprint est atteinte,
**When** SMN réconcilie le statut,
**Then** le Sprint passe automatiquement à Terminé, jamais à Clôturé.

#### AC4

**Given** Le Scrum Master a exceptionnellement remis un Sprint En cours à À venir pour correction,
**When** un traitement automatique se produit,
**Then** cette suspension volontaire est respectée jusqu'à replanification ou reprise explicite.

#### AC5

**Given** L'application était arrêtée pendant une transition,
**When** elle redémarre,
**Then** les transitions dues sont réconciliées idempotemment avec distinction date métier et instant de traitement, sans inventer une connaissance historique absente.

#### Traçabilité

* Epic : SMN-4. FR-15, FR-16, FR-24. D-PRD-038/039/040/049 ; AD-11/18.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : validation fonctionnelle globale de l'Epic 4, ni développée ni testée.

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.8: Générer les cérémonies Scrum standards avec chaque Sprint
**Jira :** https://lmn24.atlassian.net/browse/SMN-72

**En tant que** Scrum Master Administrateur,
**je veux** obtenir automatiquement les Planning, Daily, Review et Rétrospective,
**afin de** disposer de cérémonies prêtes à être ajustées sans ressaisie.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint ordinaire est nouvellement créé,
**When** le calendrier associé est généré,
**Then** un Planning au début, des Daily sur jours collectifs travaillés et une Review puis Rétrospective en fin de Sprint sont associés au bon identifiant.

#### AC2

**Given** Un Planning est prévu le premier jour du Sprint,
**When** la séquence Daily est produite,
**Then** aucun Daily n'est généré ce premier jour ; une absence individuelle seule n'efface pas les autres Daily.

#### AC3

**Given** La durée du Sprint est de 1, 2, 3 ou 4 semaines,
**When** je consulte les timeboxes proposées,
**Then** Planning=2/4/6/8 h, Review=1/2/3/4 h, Rétro=45/90/135/180 min et Daily=15 min, valeurs modifiables.

#### AC4

**Given** Un Sprint standard de deux semaines se termine vendredi à 18 h,
**When** les cérémonies finales sont calculées,
**Then** Review puis Rétro sont consécutives sans chevauchement, avec marge finale de 30 minutes par défaut.

#### AC5

**Given** Un Sprint est créé après sa date réelle de fin comme reprise historique,
**When** sa création est confirmée,
**Then** aucune cérémonie n'est fabriquée automatiquement ; seules les occurrences historiques connues pourront être saisies manuellement.

#### Traçabilité

* Epic : SMN-4. FR-17, FR-15. D-PRD-041/043/044/045/050/051/052 ; AD-17.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : validation fonctionnelle globale de l'Epic 4, ni développée ni testée.

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 4 ont été approuvées globalement et sans remarque par l'utilisateur le 19/10/2026. La validation ne vaut pas développement ou recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.9: Respecter la pause déjeuner et les cérémonies à segments
**Jira :** https://lmn24.atlassian.net/browse/SMN-73

**En tant que** Scrum Master Administrateur,
**je veux** planifier les cérémonies Scrum sans occuper la pause déjeuner de l'équipe,
**afin de** disposer de créneaux réalistes même pour de longues réunions.

**Critères d'acceptation :**

#### AC1

**Given** Une équipe n'a pas personnalisé sa pause,
**When** j'ouvre ses paramètres de planification,
**Then** la plage 12 h–13 h est exclue de la planification automatique, sans réduire la capacité Développeur.

#### AC2

**Given** Une cérémonie calculée chevauche la pause,
**When** le planificateur crée les créneaux,
**Then** aucune minute de réunion effective n'est placée dans la pause.

#### AC3

**Given** Une cérémonie ne peut pas être placée d'un seul tenant,
**When** le planificateur répartit l'événement,
**Then** une seule cérémonie logique contient deux segments ; sa durée est la somme des segments hors pause.

#### AC4

**Given** Review et Rétro occupent la fin du Sprint,
**When** l'ordonnancement tient compte des durées et de la marge,
**Then** les deux cérémonies demeurent successives sans chevauchement, et la marge configurée avant fin Sprint est respectée.

#### AC5

**Given** La pause configurée est modifiée,
**When** un Sprint déjà créé est consulté,
**Then** ses occurrences ne sont pas réécrites ; seuls les futurs Sprints utilisent le nouveau paramètre.

#### Traçabilité

* Epic : SMN-4. FR-17. D-PRD-050/051/052/053/054 ; AD-14/17.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.10: Signaler sans bloquer les conflits de réunions
**Jira :** https://lmn24.atlassian.net/browse/SMN-74

**En tant que** Scrum Master Administrateur,
**je veux** être averti des chevauchements entre événements d'équipe,
**afin de** corriger si nécessaire les créneaux sans perdre de planification.

**Critères d'acceptation :**

#### AC1

**Given** Une génération propose deux réunions en conflit,
**When** j'ouvre la proposition ou le calendrier,
**Then** les événements et plages qui se chevauchent sont signalés clairement.

#### AC2

**Given** Une réunion personnelle ou exceptionnelle est déjà planifiée,
**When** j'ajoute une cérémonie automatique au même créneau,
**Then** un avertissement non bloquant apparaît sans suppression ni déplacement de la réunion existante.

#### AC3

**Given** Je crée ou modifie manuellement un événement,
**When** le créneau chevauche une autre réunion,
**Then** l'alerte est affichée mais l'enregistrement reste possible après choix explicite.

#### AC4

**Given** Une série de réunions ne présente aucun conflit,
**When** je valide les créneaux,
**Then** aucune fausse alerte n'est générée.

#### AC5

**Given** Une cérémonie tombe sur un jour collectif non travaillé,
**When** le calendrier est proposé,
**Then** une alerte pertinente est affichée sans déplacer automatiquement les cérémonies autres que les Daily collectivement non planifiées.

#### Traçabilité

* Epic : SMN-4. FR-17, FR-18. D-PRD-055/056 ; AD-14/18.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.11: Personnaliser une occurrence ou une série de cérémonies
**Jira :** https://lmn24.atlassian.net/browse/SMN-75

**En tant que** Scrum Master Administrateur,
**je veux** modifier un événement individuel ou les occurrences récurrentes permises,
**afin de** adapter l'agenda sans altérer le passé des réunions.

**Critères d'acceptation :**

#### AC1

**Given** Une cérémonie générée possède un créneau planifié,
**When** je modifie sa date, heure ou durée prévue,
**Then** seule l'occurrence visée change, la provenance personnalisée et la révision sont conservées.

#### AC2

**Given** Une série de Daily futures est disponible,
**When** je choisis une modification de série,
**Then** SMN distingue l'occurrence seule de l'occurrence et des suivantes, selon un périmètre explicite.

#### AC3

**Given** Une occurrence est marquée Tenue, Non tenue ou Annulée,
**When** un recalcul de calendrier est demandé,
**Then** son horaire et historique ne sont pas modifiés automatiquement, même si la date se situe dans le futur.

#### AC4

**Given** Une réunion a été reportée,
**When** je consulte son historique,
**Then** le créneau initial et le nouveau créneau planifié sont traçables sans effacer l'ancienne décision.

#### AC5

**Given** Un événement est modifié,
**When** il entre en conflit avec un autre,
**Then** l'alerte est non bloquante, et le changement ne réécrit aucun autre événement.

#### Traçabilité

* Epic : SMN-4. FR-17, FR-18. F-46/57 ; D-PRD-044/056/112/113 ; AD-18/19.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.12: Administrer les modèles de cérémonies personnalisées
**Jira :** https://lmn24.atlassian.net/browse/SMN-76

**En tant que** Scrum Master Administrateur,
**je veux** créer et désactiver des modèles récurrents propres à mon équipe,
**afin de** réutiliser la structure de mes réunions au prochain Sprint.

**Critères d'acceptation :**

#### AC1

**Given** Je crée un modèle d'équipe,
**When** je renseigne nom, fréquence, heure et durée,
**Then** le modèle est persisté seulement si les champs et la règle de positionnement sont valides.

#### AC2

**Given** Une fréquence est choisie,
**When** j'ouvre son paramétrage,
**Then** les valeurs permises sont quotidienne, hebdomadaire avec jour, ou une fois par Sprint avec position.

#### AC3

**Given** Un modèle actif est modifié,
**When** je l'enregistre,
**Then** la nouvelle version s'applique aux futurs Sprints sans altérer les occurrences existantes même futures.

#### AC4

**Given** Un modèle est désactivé,
**When** je consulte un Sprint ancien,
**Then** les occurrences qui ont été produites restent liées et visibles.

#### AC5

**Given** Un modèle correspond à une cérémonie récurrente,
**When** je consulte ses effets sur la capacité,
**Then** aucune option de déduction de capacité n'est proposée, conformément à la non-déduction des cérémonies.

#### Traçabilité

* Epic : SMN-4. FR-18. D-PRD-046/044/048 ; AD-17/19.
* Incréments : I1–I2 ; protection des accès (Epic 1), calendriers/capacités (Epic 3) et Sprints déjà disponibles dans les Stories antérieures de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.13: Générer les occurrences des modèles de cérémonie actifs
**Jira :** https://lmn24.atlassian.net/browse/SMN-77

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les réunions personnalisées dans chaque nouveau Sprint,
**afin de** éviter de programmer manuellement les réunions récurrentes.

**Critères d'acceptation :**

#### AC1

**Given** Une équipe dispose d'un modèle actif quotidien,
**When** un Sprint ordinaire est créé,
**Then** les occurrences sont produites seulement sur les jours/positions applicables, sans doublon.

#### AC2

**Given** Un modèle hebdomadaire ou une fois par Sprint est actif,
**When** une génération de Sprint est confirmée,
**Then** les occurrences respectent le jour ou la position et leurs horaires et durées en fuseau équipe.

#### AC3

**Given** Un modèle a été désactivé,
**When** un nouveau Sprint est généré,
**Then** aucune nouvelle occurrence n'est ajoutée pour ce modèle, sans suppression des anciennes.

#### AC4

**Given** Un modèle est modifié après génération d'un Sprint,
**When** je consulte les occurrences existantes,
**Then** leurs dates, statuts et personnalisations restent inchangés ; la nouvelle définition est utilisée pour les prochains Sprints.

#### AC5

**Given** Un Sprint est rétrosaisi après sa date de fin,
**When** sa création est confirmée,
**Then** aucune occurrence personnalisée historique n'est inventée par ce mécanisme.

#### Traçabilité

* Epic : SMN-4. FR-18, FR-17. D-PRD-046/048/044 ; AD-17/18.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.14: Créer des réunions exceptionnelles ponctuelles
**Jira :** https://lmn24.atlassian.net/browse/SMN-78

**En tant que** Scrum Master Administrateur,
**je veux** ajouter une réunion non récurrente propre à un Sprint,
**afin de** tracer les réunions utiles sans les reproduire automatiquement.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint existant est ouvert,
**When** je crée une réunion exceptionnelle,
**Then** son nom, date/heure de début et durée prévue sont exigés et validés.

#### AC2

**Given** Une réunion exceptionnelle est enregistrée,
**When** je crée un Sprint suivant,
**Then** l'événement ne se reproduit pas automatiquement, contrairement aux modèles récurrents actifs.

#### AC3

**Given** Une réunion exceptionnelle traverse un créneau existant,
**When** je l'enregistre,
**Then** une alerte de chevauchement non bloquante apparaît et ne modifie aucun événement tiers.

#### AC4

**Given** Une réunion est inscrite au calendrier,
**When** je la consulte depuis sa fiche ou le Sprint,
**Then** identité, statut, horaire initial et corrections possibles sont visibles avec les droits adaptés.

#### AC5

**Given** Une réunion est créée sur une période Clôturée,
**When** je tente de changer son historique,
**Then** la procédure de réouverture ou de protection de période s'applique avant l'écriture.

#### Traçabilité

* Epic : SMN-4. FR-18, FR-19. D-PRD-046/056/058 ; AD-14/17/19.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.15: Constater, annuler et corriger la tenue des événements
**Jira :** https://lmn24.atlassian.net/browse/SMN-79

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer le statut réel des cérémonies et réunions,
**afin de** conserver un historique des événements sans validation quotidienne excessive.

**Critères d'acceptation :**

#### AC1

**Given** Une cérémonie standard, récurrente personnalisée ou exceptionnelle possède un créneau futur,
**When** je consulte sa tenue,
**Then** elle n'est pas signalée Tenue avant que son horaire soit passé.

#### AC2

**Given** Le créneau prévu d'un événement éligible est passé,
**When** une réconciliation s'exécute,
**Then** il est présumé Tenue sans validation manuelle systématique, sauf état explicite déjà conservé.

#### AC3

**Given** Un événement doit être annulé avant son horaire prévu,
**When** je le marque Annulée,
**Then** la décision est conservée avec l'événement, et le passage du temps ne le requalifie pas automatiquement en Tenue.

#### AC4

**Given** Un créneau est passé sans réunion,
**When** je marque l'événement Non tenue avec motif facultatif,
**Then** l'événement reste visible au calendrier, à l'historique et aux rapports.

#### AC5

**Given** Une qualification Annulée ou Non tenue était erronée,
**When** je la corrige en Tenue,
**Then** ancien et nouveau statuts, auteur et date sont historisés ; les PDF déjà générés ne sont pas réécrits.

#### Traçabilité

* Epic : SMN-4. FR-17, FR-18. D-PRD-057/058/060/061 ; AD-18/19.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.16: Saisir la durée réellement constatée sans déplacer les créneaux
**Jira :** https://lmn24.atlassian.net/browse/SMN-80

**En tant que** Scrum Master Administrateur,
**je veux** ajuster la durée réelle d'une réunion tout en conservant sa planification initiale,
**afin de** mesurer les écarts de durée sans complexifier la saisie.

**Critères d'acceptation :**

#### AC1

**Given** Un événement est créé,
**When** je consulte son suivi,
**Then** la durée réelle est préremplie avec la durée prévue, sans le qualifier comme déjà Tenue.

#### AC2

**Given** Une cérémonie dure moins ou plus que prévu,
**When** j'édite la durée réelle,
**Then** elle est enregistrée séparément de la durée prévue, y compris en cas de dépassement.

#### AC3

**Given** La durée réelle est modifiée,
**When** je retourne au calendrier,
**Then** le créneau prévu et ceux des autres événements demeurent inchangés ; la fiche expose l'écart.

#### AC4

**Given** Un formulaire de durée réelle est ouvert,
**When** je renseigne seulement la durée,
**Then** aucune heure réelle de début ou fin n'est demandée dans le MVP.

#### AC5

**Given** Un événement archivé ou sur Sprint Clôturé doit être corrigé,
**When** une modification non autorisée est demandée,
**Then** les contrôles de réouverture et de traçabilité protègent le passé.

#### Traçabilité

* Epic : SMN-4. FR-17, FR-18, FR-19. D-PRD-064/065/066 ; AD-19.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.17: Déduire facultativement les réunions exceptionnelles de la capacité
**Jira :** https://lmn24.atlassian.net/browse/SMN-81

**En tant que** Scrum Master Administrateur,
**je veux** choisir si une réunion exceptionnelle doit réduire la capacité de développement,
**afin de** refléter la perte réelle de disponibilité sans double déduction.

**Critères d'acceptation :**

#### AC1

**Given** Une réunion exceptionnelle ponctuelle est créée,
**When** je consulte son incidence,
**Then** le toggle « Impacte la capacité » est désactivé par défaut et n'existe pas sur les cérémonies standard ou récurrentes.

#### AC2

**Given** Une réunion exceptionnelle est déclarée impactante,
**When** la capacité est calculée,
**Then** seules les parts Développeur de l'équipe sont considérées, sans saisie individuelle obligatoire des participants.

#### AC3

**Given** Un Développeur a des plages connues,
**When** la réunion chevauche son temps disponible,
**Then** seul le chevauchement réellement disponible est déduit ; sans plages, la durée est proratisée par sa quotité d'équipe.

#### AC4

**Given** Une réunion de 2 h touche un Développeur à 50 % sans plages renseignées,
**When** la référence de capacité utilise 8 heures par JH,
**Then** la déduction théorique est 1 h soit 0,125 JH, plafonnée et jamais comptée deux fois.

#### AC5

**Given** Une réunion impactante est finalement Annulée ou Non tenue, puis corrigée en Tenue,
**When** la capacité réelle calculée est réévaluée,
**Then** la déduction est retirée puis réappliquée avec la durée réelle quand tenue ; capacité initiale figée et saisie manuelle réelle restent intactes.

#### Traçabilité

* Epic : SMN-4. FR-19, FR-14. D-PRD-047–048/059–064 ; AD-16/19.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.18: Replanifier les dates d'un Sprint sans déplacer les événements protégés
**Jira :** https://lmn24.atlassian.net/browse/SMN-82

**En tant que** Scrum Master Administrateur,
**je veux** corriger les bornes d'un Sprint existant après aperçu des conséquences,
**afin de** ajuster le calendrier sans altérer les événements historiques et les autres Sprints.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint existe,
**When** je propose de nouvelles dates,
**Then** le système refuse les chevauchements avec les Sprints de la même équipe, sans déplacer un Sprint tiers.

#### AC2

**Given** Je prépare le changement de bornes,
**When** SMN présente les options,
**Then** « Conserver les dates des événements » est présélectionné, ou je peux demander un recalcul explicite.

#### AC3

**Given** Je sélectionne le recalcul,
**When** j'affiche l'aperçu,
**Then** seuls les événements futurs, générés automatiquement, non personnalisés et sans état historique peuvent être proposés au déplacement.

#### AC4

**Given** Des événements sont Tenue, Non tenue, Annulée, personnalisés ou exceptionnels,
**When** une replanification est confirmée,
**Then** leurs créneaux, statuts et historiques sont préservés, même s'ils sont hors nouvelles bornes ; les avertissements sont visibles.

#### AC5

**Given** Je confirme la nouvelle période après aperçu,
**When** l'opération aboutit,
**Then** changement de dates, ajustements explicitement autorisés et audit sont enregistrés de façon atomique ; valeurs manuelles et capacité initiale figée restent inchangées, anciens PDF intacts.

#### Traçabilité

* Epic : SMN-4. FR-15, FR-17, FR-24. D-PRD-111–119 ; AD-15/17/18/19.
* Incréments : I1–I2 ; s'appuie sur les opérations Sprint/calendrier et capacité antérieures, sans attente d'une future Story au sein de l'Epic 4.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.19: Gérer et évaluer plusieurs objectifs de Sprint dans le bilan
**Jira :** https://lmn24.atlassian.net/browse/SMN-83

**En tant que** Scrum Master Administrateur,
**je veux** créer des objectifs et qualifier individuellement leur atteinte,
**afin de** rendre visible le résultat du Sprint sans confondre absence d'évaluation et échec.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint existe,
**When** j'ouvre son bilan,
**Then** le bloc « Objectifs du Sprint » est affiché en premier avec nom et dates du Sprint.

#### AC2

**Given** Je crée un objectif,
**When** je confirme son enregistrement,
**Then** un identifiant durable et un statut initial Non évalué sont conservés.

#### AC3

**Given** Un objectif est prêt à être évalué,
**When** je choisis son état,
**Then** seuls Non évalué, Atteint, Partiellement atteint ou Non atteint sont proposés avec commentaire facultatif.

#### AC4

**Given** Deux objectifs existent,
**When** je modifie l'un d'eux et j'enregistre le bloc,
**Then** les valeurs de l'autre et des autres blocs du bilan restent inchangées.

#### AC5

**Given** Un Sprint est Clôturé,
**When** je tente de corriger un objectif ou son résultat,
**Then** l'édition nécessite une réouverture volontaire, reste traçable et ne modifie pas d'ancien PDF.

#### Traçabilité

* Epic : SMN-4. FR-20, FR-16. D-PRD-067/069/070/071/117 ; AD-19/20.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.20: Saisir les quatre valeurs de Story Points et calculer les dérivés
**Jira :** https://lmn24.atlassian.net/browse/SMN-84

**En tant que** Scrum Master Administrateur,
**je veux** renseigner les Story Points sources et visualiser les résultats calculables,
**afin de** suivre les engagements et réalisations sans faux zéros ni plafonnement.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint Scrum possède son bilan,
**When** je consulte le bloc Story Points,
**Then** engagement initial, SP ajoutés, SP retirés et SP terminés sont proposés comme quatre saisies facultatives distinctes.

#### AC2

**Given** Les trois entrées d'engagement sont disponibles,
**When** je les renseigne,
**Then** engagement final = engagement initial + ajoutés − retirés ; SP non terminés = engagement final − SP terminés si disponibles.

#### AC3

**Given** L'engagement final est strictement positif et les SP terminés connus,
**When** le taux est calculé,
**Then** taux de réalisation = SP terminés / engagement final × 100, sans arrondir ni plafonner artificiellement.

#### AC4

**Given** Les SP terminés dépassent l'engagement final positif,
**When** j'enregistre le bloc,
**Then** la valeur et un taux supérieur à 100 % sont acceptés avec un signalement non bloquant, sans correction forcée.

#### AC5

**Given** Une source est absente ou l'engagement final n'est pas strictement positif,
**When** je consulte les dérivés,
**Then** les données insuffisantes rendent les dérivés concernés Non calculable ; une prévisualisation avant sauvegarde est provisoire, sans alimenter les tendances ni reporter automatiquement les SP restants.

#### Traçabilité

* Epic : SMN-4. FR-20, FR-16. D-PRD-067/071–075/116 ; AD-13/19.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.21: Présenter les capacités et sauvegarder séparément les trois blocs du bilan
**Jira :** https://lmn24.atlassian.net/browse/SMN-85

**En tant que** Scrum Master Administrateur,
**je veux** consulter et enregistrer objectifs, Story Points et capacité dans un même écran,
**afin de** limiter les ressaisies tout en conservant des sauvegardes indépendantes.

**Critères d'acceptation :**

#### AC1

**Given** Un bilan Scrum est ouvert,
**When** je parcours ses sections,
**Then** l'ordre est Objectifs, Story Points, Capacité du Sprint ; chaque bloc de saisie possède son propre bouton Enregistrer.

#### AC2

**Given** Une capacité initiale et une réelle sont disponibles,
**When** j'ouvre Capacité du Sprint,
**Then** valeurs retenues, références calculées, provenance et écart fiable sont visibles en JH, distincts des SP.

#### AC3

**Given** Une source de capacité est manquante ou non fiable,
**When** j'affiche l'écart,
**Then** aucun écart numérique ni zéro fictif n'est produit.

#### AC4

**Given** J'enregistre seulement Story Points,
**When** la persistance réussit,
**Then** Objectifs et Capacité restent inchangés ; seuls les brouillons réellement enregistrés perdent leur état Modifications non enregistrées.

#### AC5

**Given** Un autre bloc contient des modifications non enregistrées,
**When** je quitte l'écran,
**Then** une confirmation Rester ou Quitter sans enregistrer évite toute perte silencieuse, sans sauvegarde automatique des autres blocs.


**Traçabilité UX ajoutée lors de la revue finale :** UX-DR07 — Trois blocs de bilan éditables indépendants, tendances en lecture seule.

#### Traçabilité

* Epic : SMN-4. FR-20, FR-14, FR-16. D-PRD-067/068/071/072/073/074 ; AD-16/19.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.22: Visualiser les tendances de cinq Sprints clôturés contextualisés
**Jira :** https://lmn24.atlassian.net/browse/SMN-86

**En tant que** Scrum Master Administrateur,
**je veux** voir l'évolution de l'équipe depuis les valeurs réellement enregistrées,
**afin de** préparer la rétrospective et les reportings sans comparer des données provisoires.

**Critères d'acceptation :**

#### AC1

**Given** Un bilan Scrum est ouvert,
**When** je consulte le quatrième bloc Tendances,
**Then** aucun bouton Enregistrer n'existe et les séries SP terminés, taux de réalisation et capacité réelle JH restent distinctes.

#### AC2

**Given** Cinq Sprints ou davantage ont été clôturés dans la même équipe,
**When** les graphiques sont chargés,
**Then** seuls les cinq plus récents clôturés éligibles sont affichés chronologiquement ; les Sprints ouverts ou rouverts sont exclus.

#### AC3

**Given** Je consulte un Sprint ancien,
**When** les tendances sont composées,
**Then** aucun Sprint postérieur au Sprint consulté n'est inclus ; le Sprint consulté n'entre que s'il est clôturé.

#### AC4

**Given** Aucun Sprint clôturé n'existe, ou une métrique manque,
**When** le bloc est consulté,
**Then** un état vide ou une lacune de série apparaît explicitement, sans interpolation ni zéro inventé.

#### AC5

**Given** Je modifie un chiffre encore non sauvegardé dans Story Points,
**When** le bloc Tendances reste visible,
**Then** la courbe demeure fondée sur les valeurs persistées et ne réagit pas à un simple brouillon.

#### Traçabilité

* Epic : SMN-4. FR-20, FR-14. D-PRD-076/077/078 ; AD-20/22.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.23: Clôturer, rouvrir et reclôturer un Sprint avec instantanés versionnés
**Jira :** https://lmn24.atlassian.net/browse/SMN-87

**En tant que** Scrum Master Administrateur,
**je veux** formaliser la clôture d'un Sprint et corriger si nécessaire son bilan,
**afin de** garder une photographie fiable de chaque décision de clôture.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint a atteint sa fin calendaire,
**When** je consulte son état,
**Then** il est Terminé mais jamais Clôturé automatiquement ; son bilan et ses enseignements de rétrospective restent modifiables.

#### AC2

**Given** Des métriques ou objectifs facultatifs sont manquants,
**When** je demande la clôture,
**Then** les données absentes n'interdisent pas la clôture par elles-mêmes et ne deviennent pas des zéros fictifs.

#### AC3

**Given** Un Administrateur confirme Clôturer,
**When** la transaction aboutit,
**Then** le Sprint passe Clôturé, un instantané immuable V1 des valeurs/associations disponibles est créé avec audit, sans modifier les anciens PDF.

#### AC4

**Given** Je rouvre volontairement un Sprint Clôturé,
**When** la réouverture aboutit,
**Then** son statut devient Terminé, jamais En cours ; capacité initiale figée et versions V1 restent intactes, les corrections autorisées deviennent traçables.

#### AC5

**Given** Après corrections je confirme une nouvelle clôture,
**When** la transaction aboutit,
**Then** un instantané V2/V3 distinct est créé sans effacer V1 ; la consultation Clôturé cible la dernière version, les anciennes restent accessibles.

#### Traçabilité

* Epic : SMN-4. FR-16, FR-20. D-PRD-039/040/110/115/116/117/130-A3 ; AD-18/19/20.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 4.24: Signaler les métriques et objectifs à réexaminer après replanification
**Jira :** https://lmn24.atlassian.net/browse/SMN-88

**En tant que** Scrum Master Administrateur,
**je veux** être prévenu des données du bilan potentiellement impactées par un changement de dates,
**afin de** vérifier volontairement mes mesures sans corrections automatiques.

**Critères d'acceptation :**

#### AC1

**Given** Un Sprint avec objectifs, SP et capacités existe,
**When** je prévisualise une replanification,
**Then** SMN distingue les nouvelles références calculées des valeurs sources retenues et alerte sur la pertinence des objectifs et SP pour la nouvelle période.

#### AC2

**Given** Les dates sont confirmées,
**When** la transaction aboutit,
**Then** aucun objectif ni évaluation, commentaire, SP source ou valeur manuelle n'est transféré ou remplacé automatiquement.

#### AC3

**Given** Le cycle est En cours ou Terminé non clôturé,
**When** je confirme de nouvelles bornes,
**Then** seules les références calculables de capacité réelle sont réévaluées selon les disponibilités connues et les bornes ; la capacité initiale figée demeure intacte.

#### AC4

**Given** Le cycle est Clôturé,
**When** je demande une correction de métrique, objectif ou capacité,
**Then** l'opération exige d'abord une réouverture volontaire ; une simple correction de nom reste permise sans réouverture.

#### AC5

**Given** Une modification est acceptée ou refusée,
**When** l'audit est consulté,
**Then** les sources, la date et le résultat sont tracés sans produire de nouvel indicateur à partir du seul déplacement de dates, et aucun PDF ancien ne change.

#### Traçabilité

* Epic : SMN-4. FR-15, FR-16, FR-20, FR-24. D-PRD-114/115/116/117/118/119 ; AD-18/19/20.
* Incréments : I1–I2 ; s'appuie sur les Stories précédentes, sur les capacités JH de l'Epic 3 et sur les protections de l'Epic 2 ; aucune Story future requise pour fonctionner.
* Statut : **VALIDÉE FONCTIONNELLEMENT GLOBALEMENT LE 19/10/2026**, sans développement ni recette attestés.


**Validation :** approuvée globalement sans réserve le 19/10/2026 ; développement et recette non attestés.


## Epic 5: Suivre les risques, obstacles, dépendances et décisions de l'équipe
Gérer les six registres qualitatifs, les alertes collectives et les faits marquants, en préservant les liens entre cycles et les instantanés de clôture.
**FRs couvertes :** FR-25, FR-34, FR-35, FR-36, FR-37, FR-38, FR-39, FR-40, FR-41.

### Story 5.1: Créer rapidement une fiche dans l'un des six registres
**Jira :** https://lmn24.atlassian.net/browse/SMN-89

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer rapidement un risque, obstacle, dépendance, décision, action ou fait marquant,
**afin de** capturer les informations utiles sans formulaire excessivement lourd.

**Critères d'acceptation :**

#### AC1

**Given** un des six registres est choisi,
**When** j'ouvre Créer,
**Then** le formulaire commun préremplit la date modifiable, propose un statut initial valide selon le type et exige seulement un titre non vide et les contraintes métier propres au type.

#### AC2

**Given** une description, un responsable, une échéance ou un commentaire est inconnu,
**When** je confirme la fiche,
**Then** ces champs facultatifs ne sont pas inventés et l'enregistrement reste possible.

#### AC3

**Given** un risque ou une dépendance est créé sans Sprint ni période Kanban,
**When** je confirme,
**Then** sa fiche centrale obtient un identifiant stable, sans rattachement obligatoire à un cycle.

#### AC4

**Given** une fiche enregistrée doit être complétée ultérieurement,
**When** je l'ouvre pour enrichissement,
**Then** son identifiant, la date de création et son historique sont préservés.

#### AC5

**Given** la création échoue ou le profil est Utilisateur,
**When** l'écriture est demandée,
**Then** aucun succès ni fiche partielle n'est déclaré ; le contrôle serveur refuse les mutations non autorisées.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-34, FR-35.
* Références : D-PRD-124/QLT-01 ; AD-19/31.
* Dépendances : Epics 1 et 2 : authentification et journal d'audit.
* Incréments I1–I3 ; MVP Scrum/Kanban ; aucune collaboration des équipiers, notification externe ou intégration Jira automatique.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.2: Consulter les six registres avec recherche et filtres
**Jira :** https://lmn24.atlassian.net/browse/SMN-90

**En tant que** Scrum Master ou Utilisateur autorisé,
**je veux** retrouver les fiches qualitatives dans des vues centralisées,
**afin de** connaître rapidement les situations et décisions de l'équipe.

**Critères d'acceptation :**

#### AC1

**Given** des fiches des six registres existent,
**When** j'ouvre le module Registres,
**Then** chaque type possède une liste reconnaissable et chaque fiche une identité stable et un lien vers sa consultation.

#### AC2

**Given** des données possèdent équipe, cycle, statut ou responsable,
**When** j'applique les filtres disponibles,
**Then** seules les fiches pertinentes apparaissent sans valeurs fictives pour les filtres non applicables.

#### AC3

**Given** une fiche risque ou dépendance est liée à plusieurs cycles,
**When** je consulte deux listes de cycles,
**Then** les deux vues renvoient au même enregistrement, pas à des copies divergentes.

#### AC4

**Given** aucune fiche ne correspond au filtre,
**When** la liste est rendue,
**Then** un état vide compréhensible apparaît, sans créer de donnée.

#### AC5

**Given** un Utilisateur consulte un registre,
**When** le serveur compose les champs de sortie,
**Then** les données collectives autorisées sont visibles en lecture seule, sans métadonnées individuelles interdites ni opérations d'édition.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-35, FR-34.
* Références : D-PRD-124/QLT-02 ; AD-31.
* Dépendances : Story 5.1.
* Incréments I1–I3 ; MVP Scrum/Kanban ; aucune collaboration des équipiers, notification externe ou intégration Jira automatique.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.3: Modifier les fiches qualitatives en conservant leurs révisions
**Jira :** https://lmn24.atlassian.net/browse/SMN-91

**En tant que** Scrum Master Administrateur,
**je veux** actualiser les informations d'une fiche avec un historique fiable,
**afin de** suivre les changements sans réécrire rétroactivement les décisions et bilans.

**Critères d'acceptation :**

#### AC1

**Given** une fiche identifiée existe,
**When** je modifie titre, description, responsable ou échéance selon son type,
**Then** la nouvelle version est enregistrée avec acteur, instant et ancienne/nouvelle information utile.

#### AC2

**Given** une modification n'a pas encore été enregistrée,
**When** je quitte la fiche,
**Then** l'avertissement de brouillon de l'Epic 1 évite de faire passer la saisie pour persistée.

#### AC3

**Given** une validation ou transaction échoue,
**When** je tente de sauvegarder,
**Then** l'ancienne fiche reste cohérente et aucun audit de succès n'est ajouté.

#### AC4

**Given** une fiche a été citée par un bilan clôturé,
**When** je modifie son état courant,
**Then** le bilan historisé et le PDF antérieur restent intacts.

#### AC5

**Given** un Utilisateur tente d'appeler directement l'API de modification,
**When** le serveur contrôle son rôle,
**Then** l'opération est refusée sans mutation.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-34, FR-35, FR-41.
* Références : D-PRD-124/QLT-01/02 ; AD-19/20/31.
* Dépendances : Stories 5.1–5.2 ; le socle d'audit Epic 2 existe.
* Incréments I1–I3 ; MVP Scrum/Kanban ; aucune collaboration des équipiers, notification externe ou intégration Jira automatique.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.4: Gérer la classification ROAM et les états des risques
**Jira :** https://lmn24.atlassian.net/browse/SMN-92

**En tant que** Scrum Master Administrateur,
**je veux** qualifier chaque risque et sa prise en charge selon ROAM,
**afin de** séparer sa stratégie de traitement de sa gravité indicative.

**Critères d'acceptation :**

#### AC1

**Given** un risque est créé,
**When** je consulte sa fiche,
**Then** la classification ROAM peut être définie parmi Resolved, Owned, Accepted, Mitigated, sans calcul forcé de criticité.

#### AC2

**Given** une classification ROAM change,
**When** je sauvegarde,
**Then** la transition, le responsable éventuel et la date de révision sont tracés.

#### AC3

**Given** un risque est passé à Resolved,
**When** je consulte les alertes de criticité,
**Then** aucune alerte active de criticité élevée n'est produite pour ce risque.

#### AC4

**Given** ROAM est modifié,
**When** les valeurs probabilité et impact existent,
**Then** celles-ci et la criticité calculée ne sont pas modifiées par ce changement.

#### AC5

**Given** la probabilité ou l'impact est modifié indépendamment,
**When** je réouvre ROAM,
**Then** le classement ROAM existant est conservé.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-34, FR-36.
* Références : F-75/76 ; D-PRD-124/QLT-03 ; D-PRD-132.
* Dépendances : Stories 5.1 et 5.3.
* Incréments I1–I3 ; MVP Scrum/Kanban ; aucune collaboration des équipiers, notification externe ou intégration Jira automatique.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.5: Évaluer la criticité des risques avec la matrice fixe 3×3
**Jira :** https://lmn24.atlassian.net/browse/SMN-93

**En tant que** Scrum Master Administrateur,
**je veux** saisir probabilité et impact pour obtenir une criticité indicative fiable,
**afin de** repérer les risques élevés sans masquer les risques non évalués.

**Critères d'acceptation :**

#### AC1

**Given** un risque est créé ou ouvert,
**When** je renseigne probabilité et impact,
**Then** les deux champs indépendants sont facultatifs, avec valeurs Faible=1, Moyen=2, Élevé=3.

#### AC2

**Given** les deux valeurs sont disponibles,
**When** SMN calcule P×I,
**Then** scores 1–2 = Faible, 3–4 = Moyenne, 6–9 = Élevée sur les neuf combinaisons, sans seuil configurable au MVP.

#### AC3

**Given** une valeur est absente,
**When** je consulte la criticité,
**Then** l'état est Non évaluée, jamais un zéro ou Faible implicite.

#### AC4

**Given** je change une valeur sans enregistrer,
**When** l'aperçu se met à jour,
**Then** le résultat est indiqué provisoire et n'alimente pas cockpit ou instantanés tant que la fiche n'est pas sauvegardée.

#### AC5

**Given** une criticité est affichée avec couleur,
**When** le risque est consulté au clavier ou sans couleurs,
**Then** un texte et une icône explicitent le résultat ; ROAM reste indépendant et toute modification enregistrée demeure auditée.


**Traçabilité UX ajoutée lors de la revue finale :** UX-DR16 — Matrice 3×3 et criticité compréhensible sans seule couleur.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-36, FR-39, FR-41.
* Références : D-PRD-132/A7 ; A7-AC01 à A7-AC10.
* Dépendances : Stories 5.1, 5.3 et 5.4.
* Incréments I1–I3 ; MVP Scrum/Kanban ; aucune collaboration des équipiers, notification externe ou intégration Jira automatique.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.6: Suivre le cycle de vie des obstacles sans effacer les résolutions
**Jira :** https://lmn24.atlassian.net/browse/SMN-94

**En tant que** Scrum Master Administrateur,
**je veux** piloter les obstacles et leur résolution avec des statuts explicites,
**afin de** distinguer une difficulté encore ouverte d'un obstacle réellement traité.

**Critères d'acceptation :**

#### AC1

**Given** un obstacle est créé,
**When** je consulte ses statuts,
**Then** Ouvert, En cours de résolution, Résolu et Abandonné sont disponibles.

#### AC2

**Given** un obstacle progresse,
**When** je l'actualise en En cours de résolution puis Résolu,
**Then** les changements sont datés, attribués et visibles dans l'historique.

#### AC3

**Given** un obstacle auparavant Résolu redevient problématique,
**When** je le rouvre,
**Then** il retrouve un statut ouvert sans effacer sa résolution précédente.

#### AC4

**Given** un obstacle est lié à un risque ou une action,
**When** je le résous,
**Then** le statut de ces autres objets n'est pas modifié automatiquement.

#### AC5

**Given** un obstacle est ouvert,
**When** je consulte les points d'attention,
**Then** il peut être signalé sans être automatiquement clos ni promu en risque.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-34, FR-35, FR-37, FR-39.
* Références : F-77/78/89 ; D-PRD-124/QLT-01/02/04.
* Dépendances : Stories 5.1–5.3.
* MVP Scrum/Kanban ; I1–I3 ; SAFe, notification externe et synchronisation Jira hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.7: Décrire une dépendance interne ou vers une équipe externe
**Jira :** https://lmn24.atlassian.net/browse/SMN-95

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer les équipes demandeuse et contributrice d'une dépendance,
**afin de** suivre les engagements entre équipes même hors de l'installation SMN.

**Critères d'acceptation :**

#### AC1

**Given** une dépendance est créée,
**When** je renseigne l'équipe demandeuse et la contributrice,
**Then** je peux sélectionner l'équipe unique de l'installation ou saisir un nom libre d'équipe externe.

#### AC2

**Given** une équipe externe est indiquée,
**When** je confirme la dépendance,
**Then** aucune équipe SMN, aucun compte et aucune installation fictifs ne sont créés.

#### AC3

**Given** une dépendance possède responsable ou échéance facultatifs,
**When** je modifie sa fiche,
**Then** les informations communes et leurs dates d'effet sont tracées sans créer de date par défaut.

#### AC4

**Given** un même élément concerne l'équipe locale, des équipes externes ou plusieurs cycles,
**When** je consulte ses informations,
**Then** la référence est celle d'une fiche centrale unique, pas une copie par équipe.

#### AC5

**Given** une dépendance est lue par un Utilisateur,
**When** la projection collective est générée,
**Then** la lecture seule est autorisée dans le périmètre connu, sans divulguer de donnée individuelle non autorisée.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-38, FR-25.
* Références : F-74/83/90 ; D-PRD-121 ; QLT-05.
* Dépendances : Stories 5.1 et 5.3, équipe unique initialisée en 1.2 ; les autres équipes sont externes et décrites par nom libre.
* MVP Scrum/Kanban ; I1–I3 ; SAFe, notification externe et synchronisation Jira hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 5.8: Piloter les états et le signal À risque d'une dépendance
**Jira :** https://lmn24.atlassian.net/browse/SMN-96

**En tant que** Scrum Master Administrateur,
**je veux** mettre à jour le statut et le signal de vigilance d'une dépendance,
**afin de** différencier l'avancement d'un engagement de sa situation de risque.

**Critères d'acceptation :**

#### AC1

**Given** une dépendance existe,
**When** j'ouvre son statut,
**Then** Ouverte, En cours, Satisfaite et Annulée sont les états autorisés.

#### AC2

**Given** une dépendance est Ouverte ou En cours,
**When** je la marque À risque,
**Then** l'indicateur indépendant est persisté sans imposer un autre statut.

#### AC3

**Given** une dépendance est Satisfaite puis doit être réouverte,
**When** je corrige son statut,
**Then** la fiche centrale conserve la trace de ses transitions et de l'échéance initiale.

#### AC4

**Given** une dépendance passe à Satisfaite ou Annulée,
**When** le cockpit analyse ses échéances,
**Then** aucun retard actif n'est signalé du seul fait d'une échéance passée sur cette dépendance inactive.

#### AC5

**Given** une dépendance est liée à un Sprint,
**When** son statut change,
**Then** les bornes du Sprint et ses instantanés clôturés restent inchangés.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-38, FR-39, FR-40.
* Références : F-74/83/90 ; D-PRD-133 ; QLT-05/06.
* Dépendances : Stories 5.1, 5.3 et 5.7.
* MVP Scrum/Kanban ; I1–I3 ; SAFe, notification externe et synchronisation Jira hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.9: Associer un risque ou une dépendance à plusieurs cycles
**Jira :** https://lmn24.atlassian.net/browse/SMN-97

**En tant que** Scrum Master Administrateur,
**je veux** rattacher une même fiche de risque ou dépendance à différents Sprints ou périodes,
**afin de** conserver le même suivi d'un cycle à l'autre sans duplication.

**Critères d'acceptation :**

#### AC1

**Given** une fiche centrale sans cycle existe,
**When** je l'associe à un Sprint existant,
**Then** la relation est ajoutée en gardant l'identifiant et l'état métier central.

#### AC2

**Given** une fiche est déjà reliée à un premier Sprint,
**When** je la lie à un second Sprint,
**Then** les deux cycles affichent la même fiche et le responsable/statut actuel partagés.

#### AC3

**Given** une association est retirée,
**When** j'enregistre le changement,
**Then** seul le lien concerné est modifié ; aucune fiche ni autre lien n'est supprimé.

#### AC4

**Given** un cycle lié est Clôturé,
**When** je consulte son bilan historique,
**Then** l'association figée reste consultable selon Vn même si le lien courant a ensuite changé.

#### AC5

**Given** une demande de lien vise une ressource interdite ou inexistante,
**When** le serveur traite l'opération,
**Then** le lien est refusé sans création de référence orpheline et l'action reste auditée.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-25, FR-35, FR-38.
* Références : D-PRD-120/121/122 ; QLT-02/05 ; AD-19/20.
* Dépendances : Stories 5.1–5.3 et 5.7 ; cycles Scrum existants Epic 4, périodes Kanban ajoutées par Epic 7.
* MVP Scrum/Kanban ; I1–I3 ; SAFe, notification externe et synchronisation Jira hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.10: Gérer les décisions, justifications et remplacements
**Jira :** https://lmn24.atlassian.net/browse/SMN-98

**En tant que** Scrum Master Administrateur,
**je veux** conserver les décisions prises et leurs justifications même après remplacement,
**afin de** retrouver le raisonnement collectif sans réécrire l'histoire.

**Critères d'acceptation :**

#### AC1

**Given** une décision est créée,
**When** je renseigne son contenu et sa justification si connue,
**Then** la fiche reçoit un identifiant et peut devenir Active avec historique.

#### AC2

**Given** une décision Active n'est plus applicable,
**When** je la marque Remplacée,
**Then** je peux la relier à une décision remplaçante sans supprimer la première.

#### AC3

**Given** une décision est abandonnée sans remplacement,
**When** je choisis Annulée,
**Then** son motif ou commentaire facultatif peut être conservé et les décisions antérieures restent accessibles.

#### AC4

**Given** une décision remplaçante est liée,
**When** je parcours les fiches,
**Then** le lien d'origine et le lien inverse sont visibles sans réécrire les états d'un cycle clôturé.

#### AC5

**Given** une décision est mise à jour,
**When** j'ouvre un ancien PDF ou instantané,
**Then** le document/instantané conserve l'ancienne décision telle qu'elle avait été figée.

#### Traçabilité et dépendances

* Epic : SMN-5 ; FR-34, FR-35, FR-37.
* Références : F-85/86 ; D-PRD-124 ; AD-19.
* Dépendances : Stories 5.1–5.3.
* MVP Scrum/Kanban ; I1–I3 ; SAFe, notification externe et synchronisation Jira hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.11: Suivre les actions et leurs responsables en texte libre
**Jira :** https://lmn24.atlassian.net/browse/SMN-99

**En tant que** Scrum Master Administrateur,
**je veux** créer et suivre les actions de l'équipe avec responsable et échéance facultatifs,
**afin de** faciliter le suivi des engagements sans construire un outil de gestion des tâches.

**Critères d'acceptation :**

#### AC1

**Given** je crée une action,
**When** j'ouvre son formulaire,
**Then** le titre est requis, responsable libre et échéance facultatifs ; aucun compte applicatif n'est créé à partir du nom.

#### AC2

**Given** une action est suivie,
**When** je change son statut,
**Then** les états À faire, En cours, Terminée et Annulée sont disponibles et les transitions historisées.

#### AC3

**Given** une action est liée à une décision ou un obstacle existant,
**When** j'ouvre les fiches,
**Then** les liens sont identifiables sans dupliquer ni refermer automatiquement les fiches voisines.

#### AC4

**Given** une action ne comporte aucune date cible,
**When** je consulte les échéances,
**Then** aucune date inventée ni alerte de retard n'apparaît.

#### AC5

**Given** une action est ouverte,
**When** je consulte les options d'avancement,
**Then** le MVP ne demande ni sous-tâches ni pourcentage de progression.

#### Traçabilité et dépendances

* Epic SMN-5 ; FR-34, FR-35, FR-37, FR-39.
* Références métier : F-87/88 ; QLT-01/02/06 ; AD-19.
* Dépendances : Stories 5.1–5.3.
* I1–I3, MVP Scrum et Kanban ; SAFe reporté à v1.0. Aucun accès éditeur pour le profil Utilisateur.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.12: Relier les fiches qualitatives et les objectifs de façon traçable
**Jira :** https://lmn24.atlassian.net/browse/SMN-100

**En tant que** Scrum Master Administrateur,
**je veux** associer les éléments des registres entre eux et aux objectifs existants,
**afin de** naviguer entre leurs causes et conséquences sans créer de doublons.

**Critères d'acceptation :**

#### AC1

**Given** deux fiches qualitatives compatibles existent,
**When** j'ajoute une relation,
**Then** un lien bidirectionnel apparaît sur les deux fiches, sans nouvelle copie de l'un des objets.

#### AC2

**Given** une action et un objectif de Sprint existant sont concernés,
**When** je les relie si le modèle le permet,
**Then** les deux côtés sont consultables et l'objectif conserve son état d'atteinte.

#### AC3

**Given** une relation est retirée volontairement,
**When** je confirme,
**Then** seul le lien courant disparaît et la suppression est tracée ; les fiches et leurs historiques restent.

#### AC4

**Given** une relation appartient à un cycle Clôturé,
**When** la fiche actuelle évolue,
**Then** l'instantané historique conserve ses relations figées.

#### AC5

**Given** un lien est incompatible ou créerait un cycle de relation interdit par le modèle,
**When** le serveur valide,
**Then** l'écriture est refusée sans lien partiel ni suppression d'information.

#### Traçabilité et dépendances

* Epic SMN-5 ; FR-35, FR-37.
* Références métier : F-13/79 ; QLT-02/04 ; AD-19/20.
* Dépendances : Stories 5.1, 5.6, 5.10, 5.11 ; objectifs Scrum Epic 4.
* I1–I3, MVP Scrum et Kanban ; SAFe reporté à v1.0. Aucun accès éditeur pour le profil Utilisateur.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.13: Créer un obstacle assisté à partir d'un risque matérialisé
**Jira :** https://lmn24.atlassian.net/browse/SMN-101

**En tant que** Scrum Master Administrateur,
**je veux** transformer le constat d'un risque matérialisé en obstacle distinct relié,
**afin de** suivre sa résolution sans perdre le risque initial.

**Critères d'acceptation :**

#### AC1

**Given** un risque a été identifié et matérialisé,
**When** je clique Créer un obstacle,
**Then** un brouillon d'obstacle reçoit son contexte et un titre préremplis, modifiables avant validation.

#### AC2

**Given** je confirme le nouvel obstacle,
**When** la transaction est réalisée,
**Then** un identifiant distinct est créé et un lien réciproque risque-obstacle est enregistré.

#### AC3

**Given** je ferme le brouillon sans confirmer,
**When** l'action se termine,
**Then** aucun obstacle ni lien fictif n'est créé.

#### AC4

**Given** l'obstacle est enregistré,
**When** je relis le risque source,
**Then** ROAM, probabilité, impact et statut du risque n'ont pas changé automatiquement.

#### AC5

**Given** je résous l'obstacle,
**When** j'ouvre son risque source,
**Then** la mise à jour de ROAM peut être suggérée mais n'est pas réalisée sans décision humaine.

#### Traçabilité et dépendances

* Epic SMN-5 ; FR-37, FR-34.
* Références métier : F-77/89 ; QLT-04 ; AD-19.
* Dépendances : Stories 5.4, 5.6 et 5.12.
* I1–I3, MVP Scrum et Kanban ; SAFe reporté à v1.0. Aucun accès éditeur pour le profil Utilisateur.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.14: Créer plusieurs actions assistées depuis une décision
**Jira :** https://lmn24.atlassian.net/browse/SMN-102

**En tant que** Scrum Master Administrateur,
**je veux** décliner une décision en une ou plusieurs actions préremplies et reliées,
**afin de** traduire les décisions en engagements concrets sans ressaisir le contexte.

**Critères d'acceptation :**

#### AC1

**Given** une décision existe,
**When** je demande Créer une action,
**Then** le titre ou contexte de la décision est proposé dans un brouillon éditable.

#### AC2

**Given** je confirme une première action,
**When** le serveur enregistre,
**Then** un nouvel identifiant action et la relation bidirectionnelle vers la décision sont créés.

#### AC3

**Given** je répète l'opération,
**When** une deuxième action est confirmée,
**Then** la même décision peut être reliée à plusieurs actions autonomes.

#### AC4

**Given** une action est Terminée ou Annulée,
**When** je consulte la décision,
**Then** le statut de décision n'a pas changé automatiquement.

#### AC5

**Given** la création échoue ou est annulée,
**When** la transaction est contrôlée,
**Then** aucune relation orpheline ni action à moitié créée n'est persistée.

#### Traçabilité et dépendances

* Epic SMN-5 ; FR-37.
* Références métier : F-85–88 ; QLT-04.
* Dépendances : Stories 5.10, 5.11 et 5.12.
* I1–I3, MVP Scrum et Kanban ; SAFe reporté à v1.0. Aucun accès éditeur pour le profil Utilisateur.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.15: Surveiller les échéances des actions et dépendances ouvertes
**Jira :** https://lmn24.atlassian.net/browse/SMN-103

**En tant que** Scrum Master Administrateur,
**je veux** être alerté avant et après une échéance d'action ou de dépendance,
**afin de** identifier les engagements à anticiper sans intervention manuelle répétitive.

**Critères d'acceptation :**

#### AC1

**Given** aucun seuil n'a été personnalisé,
**When** je consulte les paramètres administrateur,
**Then** l'anticipation est fixée par défaut à trois jours calendaires, modifiable par Administrateur.

#### AC2

**Given** une action À faire ou une dépendance Ouverte possède une échéance dans les trois jours calendaires,
**When** j'ouvre les points d'attention,
**Then** un signal informatif identifie la fiche, la date et son type de vigilance.

#### AC3

**Given** une action ou dépendance active dépasse sa date limite,
**When** je consulte la vue,
**Then** elle est distinguée comme en retard, sans changement de statut automatique.

#### AC4

**Given** une action est Terminée/Annulée ou une dépendance Satisfaite/Annulée, ou la date est absente,
**When** le filtre d'échéance est calculé,
**Then** aucune alerte d'échéance active fictive n'est produite.

#### AC5

**Given** l'Administrateur modifie le seuil,
**When** je consulte les alertes,
**Then** seuls les calculs actuels sont adaptés ; historiques, dates et anciens PDF restent intacts.

#### Traçabilité et dépendances

* Epic SMN-5 ; FR-39, FR-38.
* Références métier : F-80–84 ; QLT-06 ; AD-31.
* Dépendances : Stories 5.7, 5.8 et 5.11.
* I1–I3, MVP Scrum et Kanban ; SAFe reporté à v1.0. Aucun accès éditeur pour le profil Utilisateur.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.16: Afficher un cockpit des points d'attention collectifs
**Jira :** https://lmn24.atlassian.net/browse/SMN-104

**En tant que** Scrum Master Administrateur,
**je veux** voir dans un seul écran les risques, obstacles, dépendances et objectifs exposés,
**afin de** concentrer mon attention sur les situations qui méritent un suivi.

**Critères d'acceptation :**

#### AC1

**Given** une équipe possède des risques classés Élevée avec ROAM différent de Resolved,
**When** j'ouvre Points d'attention,
**Then** ces risques apparaissent avec texte et lien vers leur fiche ; un risque Resolved n'émet pas d'alerte élevée active.

#### AC2

**Given** un obstacle est Ouvert ou une dépendance explicitement À risque,
**When** le cockpit est chargé,
**Then** ces éléments apparaissent avec leur statut et le contexte de l'équipe sans inventer une échéance.

#### AC3

**Given** une action ou dépendance a une échéance à surveiller ou en retard,
**When** je parcours la vue,
**Then** son avertissement utilise le seuil configuré et renvoie à la fiche source.

#### AC4

**Given** un objectif de Sprint est associé à un élément signalé ou un cycle est Terminé non Clôturé,
**When** les sections contextuelles sont consultées,
**Then** les liens disponibles sont affichés sans changer automatiquement l'objectif ou clôturer le cycle.

#### AC5

**Given** un Utilisateur filtre par équipe et cycle,
**When** il consulte les alertes collectives,
**Then** seules les données autorisées sont visibles ; aucun envoi d'e-mail ni mutation métier n'est déclenché par l'affichage.

#### Traçabilité

* Epic SMN-5 ; FR-39, FR-25, FR-36 ; QLT-06 ; D-PRD-132 ; F-80–84.
* Dépendances antérieures : Stories 5.5, 5.6, 5.8, 5.12 et 5.15 ; objectifs de Sprint Epic 4.
* I1–I3 ; deux rôles MVP, aucune intégration Jira, notification externe ni fonctionnalité SAFe obligatoire.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.17: Préserver risques et dépendances lors de la replanification d'un cycle
**Jira :** https://lmn24.atlassian.net/browse/SMN-105

**En tant que** Scrum Master Administrateur,
**je veux** conserver les fiches liées et repérer les échéances à vérifier après un changement de dates,
**afin de** replanifier sans transférer ou recalculer des engagements sans mon accord.

**Critères d'acceptation :**

#### AC1

**Given** un risque ou une dépendance est rattaché à un cycle,
**When** une modification de dates du cycle est prévisualisée,
**Then** liens, statut, responsable, échéances et histoire de la fiche sont présentés comme conservés.

#### AC2

**Given** une date d'échéance semble incompatible avec les nouvelles bornes,
**When** l'aperçu est consulté,
**Then** un avertissement indique la fiche concernée, sans bloquer à lui seul ni inventer d'échéance.

#### AC3

**Given** je confirme les nouvelles dates du cycle,
**When** l'opération est enregistrée,
**Then** aucun lien ni statut ni responsable ni échéance d'une fiche centrale n'est modifié automatiquement.

#### AC4

**Given** je corrige ensuite volontairement une échéance,
**When** la sauvegarde est confirmée,
**Then** la correction est historisée et la nouvelle échéance devient courante pour les cycles liés.

#### AC5

**Given** un cycle Clôturé est concerné,
**When** une opération cherche à réécrire ses éléments figés,
**Then** la protection de la clôture/version Vn est respectée et aucun ancien PDF ne change.

#### Traçabilité

* Epic SMN-5 ; FR-25, FR-38, FR-41 ; D-PRD-120/121/122 ; AD-18/19/20.
* Dépendances antérieures : Stories 5.7–5.9 et service de replanification Sprint Epic 4.
* I1–I3 ; deux rôles MVP, aucune intégration Jira, notification externe ni fonctionnalité SAFe obligatoire.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.18: Saisir des faits marquants manuels dans un journal chronologique
**Jira :** https://lmn24.atlassian.net/browse/SMN-106

**En tant que** Scrum Master Administrateur,
**je veux** renseigner un fait marquant significatif avec date et contexte,
**afin de** constituer une mémoire lisible de l'équipe distincte du journal technique.

**Critères d'acceptation :**

#### AC1

**Given** une situation collective importante survient,
**When** je crée un fait manuel,
**Then** son titre, sa date d'effet modifiable et son contexte facultatif sont enregistrés dans le journal.

#### AC2

**Given** un fait manuel est créé après l'événement,
**When** je renseigne sa date réelle,
**Then** la date métier reste distincte de l'instant d'enregistrement et n'est pas présentée comme un ancien événement capturé à l'époque.

#### AC3

**Given** plusieurs faits manuels existent,
**When** je consulte le journal,
**Then** l'ordre chronologique, les filtres disponibles et le type Manuel sont explicites.

#### AC4

**Given** un fait manuel est corrigé,
**When** je valide la modification,
**Then** l'historique est conservé sans confusion avec un audit technique.

#### AC5

**Given** un fait manuel est rattaché au bon cycle ou objet quand possible,
**When** je navigue depuis sa fiche,
**Then** son lien source reste accessible selon les droits sans imposer un rattachement fictif.

#### Traçabilité

* Epic SMN-5 ; FR-40, FR-34, FR-35 ; QLT-07 ; F-110/111 ; AD-19.
* Dépendances antérieures : Stories 5.1–5.3 ; le journal distingue les faits manuels des fiches d'audit Epic 2.
* I1–I3 ; deux rôles MVP, aucune intégration Jira, notification externe ni fonctionnalité SAFe obligatoire.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.19: Paramétrer les six catégories de faits marquants automatiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-107

**En tant que** Scrum Master Administrateur,
**je veux** activer ou désactiver les catégories d'événements significatifs suivis,
**afin de** maîtriser les faits mis en avant sans générer du bruit.

**Critères d'acceptation :**

#### AC1

**Given** le journal est initialisé,
**When** j'ouvre les catégories automatiques,
**Then** six catégories existent : Risque critique, Dépendance à risque, Obstacle résolu, Objectif atteint, Décision enregistrée, Dépendance satisfaite.

#### AC2

**Given** la configuration par défaut est consultée,
**When** les catégories sont chargées,
**Then** les cinq premières sont activées et Dépendance satisfaite est désactivée.

#### AC3

**Given** j'active ou désactive une catégorie,
**When** j'enregistre,
**Then** le changement s'applique seulement aux événements métier confirmés postérieurs, sans génération/réécriture rétroactive.

#### AC4

**Given** un Utilisateur tente de modifier les paramètres,
**When** le serveur contrôle son droit,
**Then** la mutation est refusée.

#### AC5

**Given** une source non inscrite au catalogue se produit, telle une cérémonie tenue ou une métrique corrigée,
**When** les paramètres sont consultés,
**Then** aucune catégorie automatique non prévue n'est créée ni proposée par défaut.

#### Traçabilité

* Epic SMN-5 ; FR-40, FR-41 ; D-PRD-133/A8 ; A8-AC01 ; QLT-07.
* Dépendances antérieures : Story 5.18, paramètres Administrateur Epic 1.
* I1–I3 ; deux rôles MVP, aucune intégration Jira, notification externe ni fonctionnalité SAFe obligatoire.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.20: Produire les faits marquants automatiques sur événements métier confirmés
**Jira :** https://lmn24.atlassian.net/browse/SMN-108

**En tant que** Scrum Master Administrateur,
**je veux** voir apparaître les faits réellement significatifs sans ressaisie,
**afin de** alimenter le journal au fil du pilotage avec des sources vérifiables.

**Critères d'acceptation :**

#### AC1

**Given** une catégorie active est configurée,
**When** un risque passe à criticité Élevée hors ROAM Resolved,
**Then** un fait automatique de risque critique est créé après la confirmation métier, associé à la transition source.

#### AC2

**Given** une dépendance est marquée À risque, un obstacle devient Résolu ou une décision Active est nouvellement créée,
**When** l'écriture source réussit,
**Then** un fait de la catégorie active correspondante est ajouté avec date et référence source.

#### AC3

**Given** un objectif de Sprint passe explicitement à Atteint,
**When** sa modification est enregistrée,
**Then** le fait Objectif atteint peut être produit sans considérer Non évalué ou Partiellement atteint comme Atteint.

#### AC4

**Given** une dépendance devient Satisfaite avec la catégorie désactivée par défaut,
**When** le statut est confirmé,
**Then** aucun fait automatique n'est produit tant que la catégorie reste désactivée.

#### AC5

**Given** une saisie n'est qu'un aperçu, échoue ou est annulée,
**When** le processus événementiel s'exécute,
**Then** aucun fait marquant automatique n'est persisté ; une simple métrique ou cérémonie courante n'en déclenche pas.

#### Traçabilité

* Epic SMN-5 ; FR-40, FR-36, FR-39 ; D-PRD-133/A8 ; A8-AC02/03 ; QLT-07.
* Dépendances antérieures : Stories 5.4–5.8, 5.10, 5.16, 5.18–5.19 ; objectif de Sprint Epic 4.
* I1–I3 ; deux rôles MVP, aucune intégration Jira, notification externe ni fonctionnalité SAFe obligatoire.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.21: Dédupliquer et corriger les faits automatiques sans falsifier le journal
**Jira :** https://lmn24.atlassian.net/browse/SMN-109

**En tant que** Scrum Master Administrateur,
**je veux** éviter les doublons et signaler les faits générés sur une erreur corrigée,
**afin de** conserver un historique crédible des événements significatifs.

**Critères d'acceptation :**

#### AC1

**Given** une même transition source est traitée plusieurs fois à cause d'un retry,
**When** la génération de fait est relancée,
**Then** un seul fait automatique identifié par cet événement source est créé, même si plusieurs cycles y sont reliés.

#### AC2

**Given** un risque quitte la criticité Élevée puis y revient réellement,
**When** la nouvelle transition est confirmée,
**Then** le fait antérieur demeure et un nouveau fait distinct peut être émis pour ce nouvel événement réel.

#### AC3

**Given** une création factuelle provenait d'une erreur de saisie explicitement corrigée,
**When** l'Administrateur invalide le fait,
**Then** il n'apparaît plus comme fait actif ou sélectionnable, mais l'audit minimal et sa provenance restent consultables.

#### AC4

**Given** un état a réellement évolué après un fait historiquement exact,
**When** le registre source est modifié,
**Then** le fait passé reste valable historiquement, plutôt que d'être effacé comme une erreur.

#### AC5

**Given** un fait automatique est consulté,
**When** j'ouvre sa provenance,
**Then** l'identité stable de la source, date d'effet, date d'enregistrement et distinction Automatique sont visibles.

#### Traçabilité et dépendances

* Epic : SMN-5. FR-40, FR-41 ; D-PRD-133/A8 ; A8-AC04/05/06 ; AD-19/20.
* Dépendances : Stories 5.18–5.20 et audit commun Epic 2.
* Incrément I1–I3 ; MVP Scrum/Kanban ; SAFe v1.0 ultérieur ; RBAC Admin/Utilisateur de l'Epic 1.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.22: Masquer, promouvoir et sélectionner les faits pour les reportings
**Jira :** https://lmn24.atlassian.net/browse/SMN-110

**En tant que** Scrum Master Administrateur,
**je veux** choisir les faits marquants pertinents à présenter aux parties prenantes,
**afin de** constituer un reporting lisible sans modifier les données source.

**Critères d'acceptation :**

#### AC1

**Given** un journal contient des faits automatiques et manuels,
**When** j'ouvre la sélection pour restitution,
**Then** seuls les faits non masqués et non invalidés sont proposés, avec leur origine et leur date.

#### AC2

**Given** un fait ne doit pas figurer dans les synthèses,
**When** je le masque,
**Then** l'objet métier et l'audit restent intacts et le fait cesse d'être présélectionné.

#### AC3

**Given** un fait mérite une place privilégiée,
**When** je le promeus,
**Then** une information de sélection/priorité est enregistrée sans modifier le risque, décision ou autre objet source.

#### AC4

**Given** des faits éligibles sont proposés pour une section de rapport active,
**When** je passe à l'aperçu de la sélection,
**Then** les faits concernés peuvent être présélectionnés mais nécessitent seulement la validation globale du rendu, pas une validation individuelle obligatoire.

#### AC5

**Given** un fait est masqué ou invalidé ou un report ancien est archivé,
**When** les sélections sont réévaluées,
**Then** le fait masqué/invalidé n'est pas sélectionné par défaut et l'ancien PDF reste immuable.

#### Traçabilité et dépendances

* Epic : SMN-5. FR-40, FR-35 ; D-PRD-133/A8 ; QLT-07 ; FR-26–33.
* Dépendances : Stories 5.18–5.21 ; l'Epic 6 pourra réutiliser la sélection sans être nécessaire à cette Story.
* Incrément I1–I3 ; MVP Scrum/Kanban ; SAFe v1.0 ultérieur ; RBAC Admin/Utilisateur de l'Epic 1.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.23: Figer les six registres associés lors de la clôture d'un cycle
**Jira :** https://lmn24.atlassian.net/browse/SMN-111

**En tant que** Scrum Master Administrateur,
**je veux** retrouver à la clôture les états qualitatifs réellement connus des fiches associées,
**afin de** obtenir des bilans historiquement fidèles indépendamment des changements ultérieurs.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint ou cycle pris en charge est ouvert,
**When** son bilan est consulté,
**Then** il utilise les données qualitatives courantes réellement connues sans fabriquer un instantané de clôture.

#### AC2

**Given** le Scrum Master confirme une clôture effective,
**When** la transaction réussit,
**Then** un cliché daté des fiches et liens qualitatifs associés est créé pour les six registres avec statuts et informations pertinentes.

#### AC3

**Given** un risque lié à deux cycles change après la clôture du premier,
**When** je consulte son bilan clôturé,
**Then** il lit le cliché associé à ce premier cycle et non le dernier statut central.

#### AC4

**Given** un fait marquant figure au cycle clôturé,
**When** l'instantané est créé,
**Then** sa date, existence, sélection/masquage applicable, source et contenu connus sont conservés sans statut inventé.

#### AC5

**Given** la capture des associations ou du cliché échoue pendant la clôture,
**When** la transaction est contrôlée,
**Then** aucune clôture réussie sans son cliché qualitatif requis n'est annoncée ; l'ancien PDF n'est ni modifié ni reconstruit.

#### Traçabilité et dépendances

* Epic : SMN-5. FR-25, FR-41 ; D-PRD-122/124/130-A3 ; QLT-08 ; AD-20.
* Dépendances : Stories 5.1–5.22 ; événement de clôture explicite existant dans Epic 4.
* Incrément I1–I3 ; MVP Scrum/Kanban ; SAFe v1.0 ultérieur ; RBAC Admin/Utilisateur de l'Epic 1.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 5.24: Conserver V1, V2 et les états historiques lors des reclôtures
**Jira :** https://lmn24.atlassian.net/browse/SMN-112

**En tant que** Scrum Master Administrateur,
**je veux** consulter les versions successives des instantanés qualitatifs après réouverture d'un cycle,
**afin de** corriger une période tout en préservant ce qui avait été déclaré à chaque clôture.

**Critères d'acceptation :**

#### AC1

**Given** une première clôture a produit le cliché V1,
**When** je consulte le Sprint Clôturé,
**Then** la dernière version V1 alimente les vues historiques et reste immuable.

#### AC2

**Given** le Sprint est rouvert volontairement,
**When** je consulte le bilan courant,
**Then** les éléments du registre actuel sont utilisés, tandis que V1 reste accessible en consultation.

#### AC3

**Given** un risque ou une action est corrigé puis le Sprint est reclôturé,
**When** la nouvelle clôture aboutit,
**Then** un cliché V2 distinct est créé, le bilan clôturé cible V2 et V1 demeure disponible.

#### AC4

**Given** un PDF a été exporté sur V1 avant la reclôture,
**When** je consulte ce PDF,
**Then** ses données et sa présentation ne sont jamais réécrites du fait de V2.

#### AC5

**Given** un Sprint rétrosaisi ne comporte aucune preuve fiable des états historiques passés,
**When** je consulte sa reconstitution,
**Then** aucun état ancien fictif n'est créé ; toute information reconstituée porte une provenance et une date de saisie distinctes de l'époque évoquée.

#### Traçabilité et dépendances

* Epic : SMN-5. FR-25, FR-41 ; D-PRD-130/A3 ; D-PRD-122 ; AD-19/20.
* Dépendances : Story 5.23 ; réouverture/reclôture existante Epic 4.
* Incrément I1–I3 ; MVP Scrum/Kanban ; SAFe v1.0 ultérieur ; RBAC Admin/Utilisateur de l'Epic 1.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 24 Stories de l'Epic 5 ont été approuvées globalement sans réserve le 19/10/2026. Cela ne vaut ni développement ni recette.
**Validation :** approuvée globalement sans réserve le 19/10/2026, sans développement ni recette attestés.


## Epic 6: Composer, exporter et retrouver des rapports professionnels
Prévisualiser les rapports HTML, produire des PDF fidèles et conserver les archives documentaires autorisées.
**FRs couvertes :** FR-26, FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33.

### Story 6.1: Lancer un rapport depuis la fiche d'un Sprint
**Jira :** https://lmn24.atlassian.net/browse/SMN-113

**En tant que** Scrum Master Administrateur,
**je veux** préparer un rapport à partir du Sprint Scrum que je consulte,
**afin de** éviter de ressaisir le contexte et obtenir un reporting à la demande.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint À venir, En cours, Terminé ou Clôturé existe,
**When** je clique sur Générer un rapport depuis sa fiche,
**Then** le formulaire reprend exactement le Sprint, son équipe, son produit, ses dates et son statut enregistrés.

#### AC2

**Given** la préparation s'ouvre,
**When** le cycle possède des valeurs sources fiables,
**Then** les données disponibles et le modèle standard sont proposés sans saisie manuelle obligatoire.

#### AC3

**Given** le Sprint est ouvert ou non clôturé,
**When** j'ouvre sa préparation,
**Then** le caractère provisoire du rapport est explicitement indiqué.

#### AC4

**Given** je quitte la préparation sans exporter,
**When** je reviens à la fiche,
**Then** aucun KPI ni objectif source n'est modifié et aucun PDF n'est produit.

#### AC5

**Given** un Utilisateur en lecture seule tente l'action ou forge une URL d'export,
**When** le serveur vérifie les droits,
**Then** la création d'un nouveau rapport est refusée sans fuite de données.

#### Traçabilité

* Epic : SMN-6 ; exigences : FR-26, FR-33 ; décisions : RPT-01 ; D-PRD-123 ; AD-22/31.
* Dépendances existantes : Epic 4 : Sprint identifié ; Epics 1/2 : accès sécurisé et audit.
* Incrément : I1–I2 ; MVP Scrum et Kanban ; SAFe v1.0 ; deux profils Administrateur/Utilisateur.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.2: Préparer un contrat de données commun aux rapports Scrum et Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-116

En tant que Scrum Master, je veux que les rapports exploitent une structure de données adaptée aux modes Scrum et Kanban, afin de réutiliser le même moteur de rendu sans mélanger les métriques.

**Critères d'acceptation :**

#### AC1

**Given** un jeu de données Scrum existant
**When** le moteur prépare la projection
**Then** les SP, les JH et les objectifs sont conservés avec leurs unités.

#### AC2

**Given** un jeu de données de test Kanban conforme au contrat
**When** le moteur prépare la projection
**Then** les indicateurs de flux sont reconnus sans créer de cérémonies Scrum fictives.

#### AC3

**Given** une valeur absente
**When** le rapport est composé
**Then** aucune valeur zéro ou estimation n'est inventée.

#### AC4

**Given** une source historisée
**When** le moteur compose la projection
**Then** le cycle, la provenance, les dates et versions connues sont conservés.

#### AC5

**Given** un mode non disponible au MVP
**When** le contrat est utilisé
**Then** il ne produit pas une consolidation factice.

#### Traçabilité

FR-26, FR-27, FR-30 ; RPT-01/02/05 ; D-PRD-123 ; AD-22. Dépendance : Story 6.1. Le moteur est testable avec données Scrum existantes et données de test Kanban, avant les écrans de l'Epic 7.

**Statut de la Story 6.2 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.3: Composer automatiquement les six sections standard du rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-114

**En tant que** Scrum Master Administrateur,
**je veux** obtenir un rapport structuré à partir des données enregistrées,
**afin de** produire une synthèse professionnelle sans compilation manuelle.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint enregistré dispose de données métier,
**When** je demande le contenu standard,
**Then** les sections Synthèse exécutive, Objectifs, Indicateurs et tendances, Événements Agile, Points d'attention, Décisions et actions apparaissent dans cet ordre.

#### AC2

**Given** une section possède des objets sources associés,
**When** la composition est effectuée,
**Then** les seuls objectifs, chiffres et faits réellement enregistrés sont présents avec liens ou contexte vérifiables.

#### AC3

**Given** une section ne dispose d'aucune donnée exploitable,
**When** je consulte le contenu,
**Then** un état vide ou une omission conforme aux options apparaît, sans chiffre ou conclusion inventés.

#### AC4

**Given** des états qualitatifs sont associés au cycle,
**When** le rapport les compose,
**Then** ils suivent les relations et contraintes d'accès de l'Epic 5, sans inventer une fiche.

#### AC5

**Given** les informations sources sont modifiées après simple consultation,
**When** je vérifie le rapport préparé,
**Then** aucune modification métier n'a été produite par la seule composition.

#### Traçabilité

* Epic : SMN-6 ; exigences : FR-27, FR-33 ; décisions : RPT-02/08 ; D-PRD-123 ; AD-22.
* Dépendances existantes : Stories 6.1–6.2 et six registres de l'Epic 5.
* Incrément : I1–I2 ; MVP Scrum et Kanban ; SAFe v1.0 ; deux profils Administrateur/Utilisateur.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.4: Ajouter introduction, commentaires et conclusion propres au rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-115

**En tant que** Scrum Master Administrateur,
**je veux** compléter volontairement les données par ma rédaction,
**afin de** apporter contexte et interprétation sans altérer les sources.

**Critères d'acceptation :**

#### AC1

**Given** un rapport standard est en préparation,
**When** je saisis introduction, conclusion ou commentaire de section,
**Then** les textes libres sont attachés au brouillon du rapport, indépendamment des données source.

#### AC2

**Given** aucun texte libre n'est saisi,
**When** je consulte la synthèse,
**Then** SMN n'invente aucune conclusion ni affirmation de réalisation.

#### AC3

**Given** une donnée source a besoin d'être corrigée,
**When** je modifie un commentaire seulement,
**Then** ni objectif, ni KPI, ni fiche du registre ne sont modifiés par la rédaction.

#### AC4

**Given** une saisie de commentaire est encore non enregistrée dans le brouillon,
**When** je quitte l'écran,
**Then** la protection des modifications non enregistrées avertit avant abandon.

#### AC5

**Given** un commentaire est inclus ou exclu volontairement,
**When** je consulte le contenu composé,
**Then** sa présence suit la sélection et conserve sa langue d'origine.

#### Traçabilité

* Epic : SMN-6 ; exigences : FR-27 ; décisions : RPT-02 ; D-PRD-123 ; UX-DR17.
* Dépendances existantes : Story 6.3.
* Incrément : I1–I2 ; MVP Scrum et Kanban ; SAFe v1.0 ; deux profils Administrateur/Utilisateur.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.5: Sélectionner et réordonner les sections du rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-117

**En tant que** Scrum Master Administrateur,
**je veux** choisir les rubriques et leur ordre pour un rapport particulier,
**afin de** adapter le document au lecteur sans modifier les données métier.

**Critères d'acceptation :**

#### AC1

**Given** un rapport possède ses six sections standard,
**When** j'ouvre les options,
**Then** je peux afficher/masquer et réordonner chaque rubrique facultative sans modifier les données sources.

#### AC2

**Given** une section a été masquée,
**When** je prévisualise le contenu,
**Then** elle ne figure pas dans le rendu, ni dans le futur PDF basé sur cette sélection.

#### AC3

**Given** je réorganise les sections,
**When** je confirme mes options,
**Then** le nouvel ordre est appliqué à ce rapport uniquement.

#### AC4

**Given** je masque une rubrique,
**When** le document est composé,
**Then** produit, équipe, cycle, dates, statut et génération demeurent identifiables.

#### AC5

**Given** je reviens sur mes choix,
**When** je relance la composition,
**Then** le choix de sections est réutilisé sans écriture sur les cycles, KPI ni registres.

#### Traçabilité

* Epic : SMN-6. FR-28, FR-27, RPT-02/03/05, D-PRD-123, D-PRD-134.
* Dépendances : Stories 6.3–6.4.
* MVP Scrum/Kanban, I1–I2, un seul produit/équipe par installation ; aucune API IA ni export programmé.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.6: Choisir les KPI, graphiques et informations qualitatives
**Jira :** https://lmn24.atlassian.net/browse/SMN-118

**En tant que** Scrum Master Administrateur,
**je veux** sélectionner les métriques et faits qui sont pertinents pour mes destinataires,
**afin de** éviter des rapports chargés ou trompeurs.

**Critères d'acceptation :**

#### AC1

**Given** les données métriques d'un Sprint sont disponibles,
**When** je choisis les KPI et graphiques autorisés,
**Then** les unités SP, JH et % restent séparées et les valeurs sont issues des mesures enregistrées.

#### AC2

**Given** des faits marquants, risques, dépendances, décisions et actions existent,
**When** je sélectionne les éléments à restituer,
**Then** les filtres et états masqué/invalide de l'Epic 5 sont respectés.

#### AC3

**Given** un KPI ou un graphique sélectionné n'a pas les données requises,
**When** la prévisualisation est calculée,
**Then** il apparaît comme indisponible ou est omis explicitement, jamais rempli de zéros fictifs.

#### AC4

**Given** une analyse humaine existante est disponible et autorisée,
**When** je l'intègre à ma sélection,
**Then** son contenu et sa provenance sont distingués des chiffres source ; aucune nouvelle analyse IA n'est créée.

#### AC5

**Given** un élément est retiré des choix du rapport,
**When** je consulte la composition,
**Then** cet élément n'est pas réinséré implicitement au moment du PDF.

#### Traçabilité

* Epic : SMN-6. FR-28, FR-27, FR-33, RPT-02/03/05, D-PRD-123, D-PRD-134.
* Dépendances : Stories 6.3 et 6.5 ; registres Epic 5.
* MVP Scrum/Kanban, I1–I2, un seul produit/équipe par installation ; aucune API IA ni export programmé.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.7: Régler la profondeur historique et limiter les tendances à cinq cycles
**Jira :** https://lmn24.atlassian.net/browse/SMN-121

En tant que Scrum Master, je veux définir la profondeur historique d'un rapport, afin de présenter des tendances fiables.

**Critères d'acceptation :**

#### AC1

**Given** un rapport en préparation
**When** j'ouvre ses options
**Then** je peux changer sa profondeur historique sans modifier le modèle.

#### AC2

**Given** plus de cinq Sprints clôturés
**When** une série de tendances est composée
**Then** seuls cinq cycles clôturés éligibles au plus sont présents.

#### AC3

**Given** un Sprint ancien consulté
**When** les tendances sont sélectionnées
**Then** aucun Sprint chronologiquement postérieur n'est inclus.

#### AC4

**Given** un Sprint ouvert ou rouvert
**When** une série historique est composée
**Then** il n'est pas compté comme cycle clôturé.

#### AC5

**Given** une métrique passée non renseignée
**When** le graphique s'affiche
**Then** il montre une donnée absente sans valeur inventée ; la profondeur des autres éléments historiques n'est pas limitée à cinq.

#### Traçabilité

FR-28, FR-30 ; RPT-03/05, D-PRD-123 et D-PRD-076–078. Dépendances : Stories 6.2, 6.6. I1–I2.  
**Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.8: Respecter les clichés historiques et indiquer la qualité des données
**Jira :** https://lmn24.atlassian.net/browse/SMN-119

**En tant que** Scrum Master Administrateur,
**je veux** produire un rapport fidèle au statut historique et à la provenance des valeurs,
**afin de** éviter d'attribuer à une ancienne période la situation actuelle de l'équipe.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint Clôturé possède un cliché V1 ou V2,
**When** un rapport est composé,
**Then** les risques, dépendances et autres informations qualitatives utilisent le dernier cliché applicable à cette clôture.

#### AC2

**Given** un Sprint est ouvert ou rouvert,
**When** un rapport est composé,
**Then** les données courantes connues sont utilisées et le résultat est qualifié de provisoire.

#### AC3

**Given** la source d'une capacité est connue, estimée, calculée ou saisie manuellement,
**When** elle est affichée,
**Then** sa provenance et qualité connues restent distinguables.

#### AC4

**Given** une valeur historique n'a jamais été enregistrée,
**When** le rapport présente les résultats,
**Then** aucun état passé, KPI ou statut de fiche n'est reconstruit à partir de l'état actuel.

#### AC5

**Given** un ancien PDF lié à V1 existe et le cycle est reclôturé V2,
**When** un nouveau rapport est préparé,
**Then** le nouveau rapport peut s'appuyer sur V2, tandis que le PDF ancien reste strictement inchangé.

#### Traçabilité

* Epic : SMN-6. FR-30, FR-27, FR-33, RPT-02/03/05, D-PRD-123, D-PRD-134.
* Dépendances : Stories 6.2–6.7 et instantanés Vn Epics 4/5.
* MVP Scrum/Kanban, I1–I2, un seul produit/équipe par installation ; aucune API IA ni export programmé.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.9: Intégrer la vision, le Product Goal et les définitions d'équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-120

**En tant que** Scrum Master Administrateur,
**je veux** ajouter sur choix la vision, le Product Goal et la DoD/DoR rattachés à l'équipe,
**afin de** éclairer les rapports sans répéter les informations du produit.

**Critères d'acceptation :**

#### AC1

**Given** une vision et un Product Goal sont enregistrés sur l'équipe du cycle,
**When** je sélectionne leur présence,
**Then** leurs textes disponibles sont présentés dans les sections choisies sans traduction automatique.

#### AC2

**Given** la DoD et la DoR de l'équipe sont disponibles sous forme de texte,
**When** je les inclue,
**Then** elles apparaissent facultativement en fin de rapport à titre informatif.

#### AC3

**Given** une DoD ou DoR est fournie comme lien,
**When** je l'inclus,
**Then** l'URL connue peut être présentée sans prétendre que la cible distante a été vérifiée ou archivée.

#### AC4

**Given** un de ces éléments n'est pas renseigné,
**When** la composition est effectuée,
**Then** un texte fictif n'est pas inventé, et la génération reste possible.

#### AC5

**Given** le rapport est modifié,
**When** je sauvegarde les options du rapport,
**Then** aucune modification n'est transmise automatiquement aux champs source de la vision, du Product Goal, de la DoD ou DoR.

#### Traçabilité

* Epic : SMN-6. FR-28, FR-27, RPT-02/03/05, D-PRD-123, D-PRD-134.
* Dépendances : Stories 6.3, 6.5, 3.24 et 3.25 ; les données de contexte sont produites et historisées au niveau de l'équipe.
* MVP Scrum/Kanban, I1–I2, un produit fixe et une seule équipe par installation ; aucune API IA ni export programmé.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.


**Amendement D-PRD-137 (19/10/2026) :** une seule équipe Scrum/Kanban par installation au MVP ; multiéquipes réservé au train SAFe v1.0 ; vision, Product Goal, DoD et DoR rattachés à l'équipe au MVP et au train en SAFe. Mise à jour autorisée, aucun développement ni test.

### Story 6.10: Fournir un modèle standard de rapport protégé
**Jira :** https://lmn24.atlassian.net/browse/SMN-122

**En tant que** Scrum Master Administrateur,
**je veux** partir d'un modèle standard utilisable immédiatement,
**afin de** créer mon premier rapport sans paramétrer une mise en page.

**Critères d'acceptation :**

#### AC1

**Given** l'installation est initialisée,
**When** j'ouvre les modèles de rapport,
**Then** un modèle standard à six rubriques est disponible.

#### AC2

**Given** le modèle standard est sélectionné,
**When** je prépare un rapport,
**Then** les sections et choix de contenu par défaut sont utilisables immédiatement.

#### AC3

**Given** je demande la suppression du modèle standard,
**When** le serveur valide l'action,
**Then** la suppression est refusée, même via API.

#### AC4

**Given** je demande une copie personnalisable du modèle standard,
**When** l'opération réussit,
**Then** une nouvelle identité de modèle est créée sans modifier l'original.

#### AC5

**Given** des données facultatives sont absentes,
**When** j'utilise le modèle standard,
**Then** le rapport demeure préparé sans transformer les absences en zéros fictifs.

#### Traçabilité

* Epic SMN-6 ; FR-29, FR-27 ; D-PRD-123, RPT-03/04/06/07 et D-PRD-134 selon le périmètre.
* Dépendances : 6.3–6.9.
* I1–I2 ; MVP Scrum/Kanban ; l'Administrateur génère les documents, l'Utilisateur les lit selon ses droits.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.11: Créer, dupliquer et modifier les modèles de rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-123

**En tant que** Scrum Master Administrateur,
**je veux** mémoriser des configurations de rapport personnalisées,
**afin de** retrouver mes préférences de sections et d'indicateurs à chaque génération.

**Critères d'acceptation :**

#### AC1

**Given** un modèle standard ou personnalisé existe,
**When** je le duplique,
**Then** un modèle personnel distinct et renommable est créé.

#### AC2

**Given** je configure un modèle personnalisé,
**When** j'enregistre sections, ordre, indicateurs, graphiques et profondeur historique,
**Then** les valeurs sont conservées et pourront être rechargées.

#### AC3

**Given** je modifie un modèle personnalisé,
**When** une sauvegarde échoue,
**Then** la configuration précédente reste cohérente et aucun succès fictif n'apparaît.

#### AC4

**Given** je souhaite supprimer un modèle personnalisé déjà référencé,
**When** j'ouvre la confirmation,
**Then** les impacts sur les anciennes archives et les sélections sont présentés et le standard reste intouchable.

#### AC5

**Given** un Utilisateur tente de créer, modifier ou supprimer un modèle,
**When** le serveur reçoit la demande,
**Then** l'écriture est refusée et les modèles restent inchangés.

#### Traçabilité

* Epic SMN-6 ; FR-29, FR-28 ; D-PRD-123, RPT-03/04/06/07 et D-PRD-134 selon le périmètre.
* Dépendances : 6.10 ; sélecteurs 6.5–6.9.
* I1–I2 ; MVP Scrum/Kanban ; l'Administrateur génère les documents, l'Utilisateur les lit selon ses droits.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.12: Charger un modèle et adapter ponctuellement les options
**Jira :** https://lmn24.atlassian.net/browse/SMN-133
## Besoin utilisateur

En tant que Scrum Master, je souhaite charger un modèle puis adapter les options de la génération courante sans altérer le modèle sauvegardé.

**Critères d'acceptation :**

#### AC1

**Given** un modèle enregistré
**When** je le sélectionne
**Then** ses options sont reprises.

#### AC2

**Given** un modèle chargé
**When** je change une section
**Then** le changement concerne le document en préparation.

#### AC3

**Given** j'abandonne les changements
**When** je recharge le modèle
**Then** son état d'origine est conservé.

#### AC4

**Given** je confirme Enregistrer le modèle
**When** l'écriture réussit
**Then** les nouvelles options sont mémorisées.

#### AC5

**Given** le modèle devient indisponible
**When** je tente de le charger
**Then** un message permet de choisir un autre modèle sans mélange des options.

#### Références

FR-28, FR-29 ; RPT-03/04 ; Stories 6.10 et 6.11. Publication pour revue globale de l'Epic 6, sans validation préalable.

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.13: Prévisualiser la totalité du rapport en HTML
**Jira :** https://lmn24.atlassian.net/browse/SMN-124

**En tant que** Scrum Master Administrateur,
**je veux** lire intégralement le rapport avant d'exporter,
**afin de** vérifier rubriques, chiffres, textes et graphiques sans produire de PDF.

**Critères d'acceptation :**

#### AC1

**Given** un rapport a été préparé,
**When** je clique sur Prévisualiser,
**Then** tout le contenu sélectionné apparaît en HTML, dans l'ordre choisi et avec les graphiques concernés.

#### AC2

**Given** la prévisualisation est affichée,
**When** je reviens modifier les options puis je l'actualise,
**Then** la nouvelle version d'aperçu reflète mes changements sans modifier les sources métier.

#### AC3

**Given** une section a été masquée ou un KPI est absent,
**When** l'aperçu est rendu,
**Then** aucune donnée n'est réinsérée, inventée ou remplacée par zéro.

#### AC4

**Given** une période non clôturée est choisie,
**When** j'ouvre l'aperçu,
**Then** le caractère provisoire et la date de situation sont explicitement visibles.

#### AC5

**Given** seule la prévisualisation HTML est demandée,
**When** je quitte la préparation,
**Then** aucun export PDF réussi ni archive définitive n'est créé automatiquement.

#### Traçabilité

* Epic SMN-6 ; FR-31, FR-27 ; D-PRD-123, RPT-03/04/06/07 et D-PRD-134 selon le périmètre.
* Dépendances : 6.3–6.12.
* I1–I2 ; MVP Scrum/Kanban ; l'Administrateur génère les documents, l'Utilisateur les lit selon ses droits.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.14: Choisir FR/EN pour les rubriques sans traduire les textes libres
**Jira :** https://lmn24.atlassian.net/browse/SMN-125

**En tant que** Scrum Master Administrateur,
**je veux** obtenir un rapport aux libellés français ou anglais,
**afin de** partager le document avec différents interlocuteurs sans dénaturer la rédaction.

**Critères d'acceptation :**

#### AC1

**Given** le rapport est en préparation,
**When** je sélectionne Français ou Anglais,
**Then** titres, rubriques et libellés standards utilisent la langue choisie.

#### AC2

**Given** le rapport contient des commentaires ou objectifs libres,
**When** je change la langue standard,
**Then** ces textes métier restent dans leur langue source, sans traduction automatique.

#### AC3

**Given** un aperçu HTML puis un PDF sont produits pour la même sélection,
**When** je compare les deux,
**Then** les mêmes libellés standard sont dans la même langue.

#### AC4

**Given** la langue choisie diffère de celle de l'interface SMN,
**When** je compose le rapport,
**Then** la langue de la page ne force pas la traduction des textes libres.

#### AC5

**Given** un libellé standard est indisponible en langue cible,
**When** le moteur traduit la structure,
**Then** une langue de repli connue est utilisée sans champ technique brut ni texte libre modifié.

#### Traçabilité

* Epic SMN-6 ; FR-32, FR-31 ; D-PRD-123, RPT-03/04/06/07 et D-PRD-134 selon le périmètre.
* Dépendances : 6.13 ; infrastructure de langue Epic 1.
* I1–I2 ; MVP Scrum/Kanban ; l'Administrateur génère les documents, l'Utilisateur les lit selon ses droits.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.15: Présenter un en-tête professionnel et un logo facultatif
**Jira :** https://lmn24.atlassian.net/browse/SMN-134

En tant que Scrum Master, je veux une présentation claire, contextualisée et un logo facultatif, afin de remettre un document professionnel.

**Critères d'acceptation :**

#### AC1

**Given** un rapport en préparation
**When** le document est rendu
**Then** produit, équipe, cycle, dates, statut et date de génération sont identifiables.

#### AC2

**Given** un cycle n'est pas clôturé
**When** le rapport s'affiche
**Then** le caractère provisoire est explicite.

#### AC3

**Given** aucun logo n'est fourni
**When** le rapport est rendu
**Then** le document demeure complet et lisible.

#### AC4

**Given** un logo autorisé est configuré
**When** je le sélectionne
**Then** sa présence n'altère ni chiffres ni rubriques.

#### AC5

**Given** des graphiques ou des tableaux sont inclus
**When** le rendu HTML ou PDF est consulté
**Then** titres, légendes, contrastes et textes de contexte demeurent accessibles.

#### Traçabilité

FR-33 et FR-31 ; RPT-06/08 ; D-PRD-123 ; Stories 6.13 et 6.14. Proposition pour revue globale Epic 6 ; aucun développement effectué.

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.16: Exclure les données individuelles sensibles des rapports par défaut
**Jira :** https://lmn24.atlassian.net/browse/SMN-126

**En tant que** Scrum Master Administrateur,
**je veux** générer des rapports collectifs respectueux des droits et de la confidentialité,
**afin de** partager des informations utiles sans dévoiler les absences et coordonnées personnelles.

**Critères d'acceptation :**

#### AC1

**Given** un rapport contient des indicateurs d'équipe et des fiches membres,
**When** la projection serveur est produite,
**Then** les absences nominatives, e-mails, coordonnées et capacités individuelles sensibles sont exclus par défaut.

#### AC2

**Given** une action comporte un responsable métier légitime,
**When** elle figure dans un registre sélectionné,
**Then** le nom utile à l'action peut être affiché sans exposer les autres données personnelles du membre.

#### AC3

**Given** un champ non autorisé est demandé par une requête directe,
**When** le serveur filtre la sortie,
**Then** aucune donnée privée interdite n'est livrée en HTML ou PDF.

#### AC4

**Given** une sélection de rapport inclut des faits textuels,
**When** le rendu est préparé,
**Then** les droits sont respectés et aucun texte n'est transmis à une API IA ou autre service externe non prévu.

#### AC5

**Given** un brief TXT IA est demandé,
**When** le moteur de rapport évalue la demande,
**Then** la politique de confidentialité renforcée de l'Epic 9 ne peut pas être contournée au moyen du rapport.

#### Traçabilité

* Epic SMN-6. FR-33, FR-27, FR-28 ; D-PRD-123/134, RPT-06/07/08, A10-AC01 à A10-AC16.
* Dépendances : 6.3, 6.6, 6.13 ; filtrage serveur Epic 1
* Incrément I1–I2, MVP Scrum/Kanban, SAFe différé. Aucune génération ou test technique réalisé.
* **Validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.17: Exporter un PDF fidèle à la prévisualisation HTML
**Jira :** https://lmn24.atlassian.net/browse/SMN-127

**En tant que** Scrum Master Administrateur,
**je veux** produire un PDF partageable correspondant au rapport validé,
**afin de** diffuser un document stable sans changements silencieux du contenu.

**Critères d'acceptation :**

#### AC1

**Given** un aperçu HTML complet a été validé,
**When** je lance l'export PDF,
**Then** les mêmes sections, leur ordre, textes, chiffres, langue et graphiques sont utilisés.

#### AC2

**Given** la pagination diffère du rendu écran,
**When** je consulte le PDF final,
**Then** seules des différences raisonnables de pagination et présentation sont admises, sans disparition ou ajout de données métier.

#### AC3

**Given** des données source ont changé depuis l'aperçu,
**When** l'export commence,
**Then** la préparation s'appuie sur un rendu de référence stable ou demande un nouvel aperçu, sans mélange de versions.

#### AC4

**Given** une page est longue ou contient un graphique,
**When** le PDF est généré,
**Then** les tableaux et légendes restent lisibles et les informations contextuelles sont identifiables.

#### AC5

**Given** un Utilisateur en lecture seule tente de produire un nouveau PDF,
**When** le serveur contrôle l'opération,
**Then** la génération est interdite même s'il pourra télécharger une archive explicitement autorisée.

#### Traçabilité

* Epic SMN-6. FR-31, FR-32, FR-33 ; D-PRD-123/134, RPT-06/07/08, A10-AC01 à A10-AC16.
* Dépendances : 6.13–6.16
* Incrément I1–I2, MVP Scrum/Kanban, SAFe différé. Aucune génération ou test technique réalisé.
* **Validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.18: Archiver automatiquement le fichier PDF final exact après export réussi
**Jira :** https://lmn24.atlassian.net/browse/SMN-128

**En tant que** Scrum Master Administrateur,
**je veux** conserver le PDF réellement exporté dans l'espace privé SMN,
**afin de** retrouver le même document sans le reconstruire à partir de données ultérieures.

**Critères d'acceptation :**

#### AC1

**Given** un export PDF aboutit réellement,
**When** la finalisation est confirmée,
**Then** le fichier PDF final exact est archivé automatiquement avec un identifiant unique et une empreinte d'intégrité.

#### AC2

**Given** un aperçu HTML est consulté sans export,
**When** je quitte la page,
**Then** aucune archive PDF finale n'est créée.

#### AC3

**Given** une archive est produite,
**When** ses métadonnées sont consultées,
**Then** auteur, date, langue, modèle, équipe, cycle, statut, version Vn et manifeste sont conservés quand pertinents.

#### AC4

**Given** le même Sprint est exporté plusieurs fois,
**When** les fichiers sont finalisés,
**Then** chaque PDF dispose d'une archive distincte et immuable sans écraser les versions précédentes.

#### AC5

**Given** le stockage ou la validation du PDF échoue,
**When** le traitement se termine,
**Then** aucune archive finale incomplète n'est déclarée réussie ; le téléchargement privé n'est ouvert qu'après cohérence fichier/métadonnées.

#### Traçabilité

* Epic SMN-6. FR-31, FR-33, FR-68, FR-71 ; D-PRD-123/134, RPT-06/07/08, A10-AC01 à A10-AC16.
* Dépendances : 6.17 ; stockage privé et restauration Epic 2
* Incrément I1–I2, MVP Scrum/Kanban, SAFe différé. Aucune génération ou test technique réalisé.
* **Validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.19: Distinguer les rapports archivés par cycle, version et provenance
**Jira :** https://lmn24.atlassian.net/browse/SMN-129

**En tant que** Scrum Master Administrateur,
**je veux** retrouver plusieurs éditions du même rapport sans perdre leur historique,
**afin de** comparer les versions produites tout en préservant les preuves documentaires.

**Critères d'acceptation :**

#### AC1

**Given** deux PDF ont été produits pour un cycle identique,
**When** je consulte ses archives,
**Then** les deux identifiants, dates et fichiers sont conservés.

#### AC2

**Given** un Sprint est réouvert puis reclôturé en V2,
**When** un nouveau PDF est produit,
**Then** l'archive de V1 et sa référence historique restent immuables, celle de V2 est séparée.

#### AC3

**Given** un modèle est renommé ou supprimé après un export autorisé,
**When** je consulte une ancienne archive,
**Then** le modèle et les options utilisés à l'export restent traçables via les métadonnées figées.

#### AC4

**Given** les données centrales ont évolué,
**When** une archive ancienne est téléchargée,
**Then** ses octets restent ceux initialement exportés, indépendants du nouveau bilan.

#### AC5

**Given** un PDF présente une empreinte incohérente ou manque dans le stockage privé,
**When** son contrôle est effectué,
**Then** l'archive est signalée dégradée ou indisponible, sans reconstitution silencieuse et sans faux succès.

#### Traçabilité

* Epic SMN-6. FR-29, FR-30, FR-31 ; D-PRD-123/134, RPT-06/07/08, A10-AC01 à A10-AC16.
* Dépendances : 6.17–6.18
* Incrément I1–I2, MVP Scrum/Kanban, SAFe différé. Aucune génération ou test technique réalisé.
* **Validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.20: Rechercher et filtrer les rapports PDF archivés
**Jira :** https://lmn24.atlassian.net/browse/SMN-130

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les PDF conservés dans une bibliothèque dédiée,
**afin de** accéder à un rapport ancien sans devoir le régénérer.

**Critères d'acceptation :**

#### AC1

**Given** plusieurs PDF sont archivés,
**When** j'ouvre Rapports archivés,
**Then** je vois une bibliothèque distincte des aperçus temporaires, avec identifiants et métadonnées utiles.

#### AC2

**Given** des rapports concernent plusieurs cycles et versions,
**When** je filtre par cycle, date, modèle ou statut,
**Then** les archives correspondantes sont retrouvables sans modification de leurs fichiers.

#### AC3

**Given** un rapport est archivé pour un Sprint,
**When** j'ouvre la fiche Sprint,
**Then** un accès vers ses archives autorisées permet de retrouver ses éditions.

#### AC4

**Given** un filtre ne trouve aucun PDF,
**When** la bibliothèque est rendue,
**Then** un état vide explicite apparaît sans création de fichier.

#### AC5

**Given** un rapport masqué ou non autorisé existe,
**When** une personne consulte la bibliothèque,
**Then** le serveur ne révèle pas le document aux comptes auxquels l'accès est interdit.

#### Traçabilité

* Epic SMN-6. FR-31, FR-33, FR-30 ; D-PRD-123, D-PRD-134/A10 et AD-27/31.
* Dépendances : 6.18–6.19
* MVP Scrum/Kanban, I1–I2. Ni code ni tests techniques exécutés.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.21: Consulter et télécharger les PDF autorisés
**Jira :** https://lmn24.atlassian.net/browse/SMN-135

En tant que personne authentifiée autorisée, je veux consulter et télécharger un rapport PDF déjà archivé, afin de disposer d'une copie sans demander une nouvelle génération.

**Critères d'acceptation :**

#### AC1

**Given** un compte Administrateur authentifié et une archive autorisée
**When** le document est demandé
**Then** le PDF archivé exact est récupéré depuis le stockage privé.

#### AC2

**Given** un compte Utilisateur authentifié et un PDF autorisé
**When** il demande le téléchargement
**Then** la lecture et le téléchargement sont permis.

#### AC3

**Given** un Utilisateur demande un nouvel export
**When** le serveur contrôle ses droits
**Then** la génération est refusée.

#### AC4

**Given** une personne anonyme connaît l'identifiant d'un rapport
**When** elle appelle son adresse directe
**Then** aucun fichier privé n'est divulgué.

#### AC5

**Given** le fichier est absent ou corrompu
**When** son téléchargement est demandé
**Then** une erreur de disponibilité ou d'intégrité apparaît, sans recréer silencieusement le rapport.

#### Traçabilité

FR-31, FR-33 ; AD-31 ; D-PRD-134 ; Stories 6.18 à 6.20. Proposition de revue globale Epic 6 ; non encore validée.

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.22: Masquer ou supprimer exceptionnellement une archive avec confirmation
**Jira :** https://lmn24.atlassian.net/browse/SMN-131

**En tant que** Scrum Master Administrateur,
**je veux** gérer une archive devenue inappropriée sans détruire les historiques métier,
**afin de** maîtriser la confidentialité en conservant une traçabilité des exceptions.

**Critères d'acceptation :**

#### AC1

**Given** une archive est présente dans la bibliothèque,
**When** l'Administrateur choisit de la masquer,
**Then** son accès ordinaire est retiré selon sa politique, sans supprimer le cycle ni d'autres PDF.

#### AC2

**Given** une suppression exceptionnelle est demandée,
**When** l'interface présente les impacts et demande confirmation,
**Then** aucun fichier n'est supprimé par une simple prévisualisation ou une annulation.

#### AC3

**Given** l'Administrateur confirme l'effacement autorisé d'un PDF,
**When** l'opération aboutit,
**Then** seuls le fichier et ses liens documentaires concernés sont traités avec trace d'audit appropriée.

#### AC4

**Given** un ancien PDF doit être expurgé pour une raison justifiée,
**When** l'Administrateur prépare une nouvelle édition,
**Then** le fichier original n'est jamais réécrit silencieusement ; une nouvelle archive distincte est nécessaire.

#### AC5

**Given** un Utilisateur tente de masquer ou supprimer une archive,
**When** le serveur contrôle son rôle,
**Then** l'opération est refusée ; métriques, clôtures et autres archives demeurent intactes.

#### Traçabilité

* Epic SMN-6. FR-31, FR-33, FR-69, FR-70 ; D-PRD-123, D-PRD-134/A10 et AD-27/31.
* Dépendances : 6.18–6.21 ; règles d'effacement Epic 2
* MVP Scrum/Kanban, I1–I2. Ni code ni tests techniques exécutés.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.

### Story 6.23: Traiter les erreurs d'export et les reprises sans archives incomplètes
**Jira :** https://lmn24.atlassian.net/browse/SMN-132

**En tant que** Scrum Master Administrateur,
**je veux** obtenir un résultat fiable lorsque la génération ou l'archivage PDF échoue,
**afin de** éviter tout PDF corrompu ou faux message de succès.

**Critères d'acceptation :**

#### AC1

**Given** le moteur PDF échoue pendant le rendu,
**When** j'attends le résultat de l'export,
**Then** SMN indique Échec et ne présente aucun fichier partiel comme un PDF réussi.

#### AC2

**Given** le rendu est correct mais l'écriture de l'archive échoue,
**When** le processus finalise le résultat,
**Then** le succès global d'un export avec archivage obligatoire n'est pas annoncé et le système sait nettoyer les fichiers incomplets.

#### AC3

**Given** une requête identique est réessayée après incident,
**When** le service gère les essais,
**Then** une opération n'entraîne pas de doublon accidentel pour le même succès ; des exports volontaires distincts créent des archives distinctes.

#### AC4

**Given** les métadonnées et le PDF doivent être cohérents,
**When** l'écriture s'exécute,
**Then** une vérification d'intégrité permet de retrouver le fichier exact sans référence orpheline.

#### AC5

**Given** une erreur technique est journalisée,
**When** l'Administrateur consulte son diagnostic,
**Then** les informations utiles apparaissent sans secret, lien privé public ou contenu confidentiel brut.

#### Traçabilité

* Epic SMN-6. FR-31, FR-33, FR-68, FR-71 ; D-PRD-123, D-PRD-134/A10 et AD-27/31.
* Dépendances : 6.17–6.22
* MVP Scrum/Kanban, I1–I2. Ni code ni tests techniques exécutés.
  **Statut fonctionnel : VALIDÉE GLOBALEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

L'utilisateur a validé sans remarque les 23 Stories de l'Epic 6 le 19/10/2026. Cette validation ne vaut ni développement ni exécution des tests.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun développement ni recette attestés.


## Epic 7: Piloter les périodes Kanban et leurs indicateurs de flux
Générer des périodes Kanban et suivre leurs KPI et bilans avec les principes partagés Scrum/Kanban, sans convertir les métriques de flux en Story Points.
**FRs couvertes :** FR-21, FR-22, FR-23.

### Story 7.1: Configurer les cadences Kanban et le fuseau de l'équipe
**Jira :** https://lmn24.atlassian.net/browse/SMN-136

**En tant que** Scrum Master Administrateur,
**je veux** choisir la cadence de suivi Kanban et ses bornes de référence,
**afin de** travailler selon un rythme adapté sans créer de périodes automatiquement.

**Critères d'acceptation :**

#### AC1

**Given** une installation Kanban a été initialisée par Express,
**When** les paramètres sont consultés,
**Then** la cadence est mensuelle par défaut et correspond à chaque mois civil complet, du premier au dernier jour inclus.

#### AC2

**Given** l'Administrateur choisit un mode hebdomadaire ou bihebdomadaire,
**When** les paramètres sont sauvegardés,
**Then** les durées sont 7 ou 14 jours calendaires consécutifs et le jour de départ est lundi par défaut, modifiable.

#### AC3

**Given** un mois commence un mercredi ou février a 28 ou 29 jours,
**When** les dates mensuelles sont calculées,
**Then** le mois couvre bien du 1er au dernier jour inclus, sans forcer un lundi ni une durée fixe en semaines.

#### AC4

**Given** une période de 7 ou 14 jours traverse un passage heure d'été/hiver,
**When** les bornes sont déterminées,
**Then** les dates et heures locales de l'équipe restent cohérentes grâce au fuseau IANA, sans décalage de jour artificiel.

#### AC5

**Given** un Administrateur demande une cadence libre de dix jours récurrente,
**When** le contrôle de configuration s'exécute,
**Then** cette quatrième cadence est indisponible au MVP et aucun cycle n'est créé par la seule modification de réglage.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23, FR-21 ; D-PRD-087/088/089/090/091/093/103.
* Dépendances déjà livrées : Epic 1 : configuration de l'équipe ; Epic 3 : fuseau IANA.
* Incrément I3 ; mode Kanban autonome au MVP ; aucune fonctionnalité SAFe, pas de Sprint Scrum généré dans Kanban.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.2: Créer une période Kanban unitaire sur demande
**Jira :** https://lmn24.atlassian.net/browse/SMN-137

**En tant que** Scrum Master Administrateur,
**je veux** générer une seule période Kanban à partir des paramètres enregistrés,
**afin de** démarrer son suivi sans ressaisir les deux bornes.

**Critères d'acceptation :**

#### AC1

**Given** aucune période Kanban n'existe,
**When** j'ouvre la création unitaire,
**Then** le nombre proposé vaut 1 et une date de départ doit être choisie explicitement.

#### AC2

**Given** des périodes existent déjà, quels que soient leurs statuts,
**When** je prépare une nouvelle période,
**Then** la date proposée suit la dernière période dans l'ordre chronologique et reste modifiable.

#### AC3

**Given** la date de départ change,
**When** j'observe les bornes et le nom par défaut,
**Then** ils sont recalculés selon 7 jours, 14 jours ou mois civil, sans modifier les périodes enregistrées.

#### AC4

**Given** les bornes sont valides et sans chevauchement avec une période de la même équipe,
**When** je clique Générer,
**Then** une période est créée immédiatement sans aperçu distinct ni confirmation additionnelle et la création est auditée.

#### AC5

**Given** les bornes sont invalides ou chevauchent une période existante,
**When** je clique Générer,
**Then** la création est refusée avec explication, sans période partielle ni génération automatique de la suivante.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23 ; D-PRD-093/094/098/099/103/104/105.
* Dépendances déjà livrées : Story 7.1 et administration Epic 1.
* Incrément I3 ; mode Kanban autonome au MVP ; aucune fonctionnalité SAFe, pas de Sprint Scrum généré dans Kanban.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.3: Prévisualiser un lot de deux à six périodes Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-138

**En tant que** Scrum Master Administrateur,
**je veux** examiner les périodes calculées avant leur création en lot,
**afin de** éviter les séries incohérentes et les chevauchements.

**Critères d'acceptation :**

#### AC1

**Given** l'Administrateur ouvre la génération par lot,
**When** il saisit une quantité,
**Then** seuls les entiers de 1 à 6 sont acceptés ; pour 2 à 6 un écran de prévisualisation est obligatoire.

#### AC2

**Given** deux à six périodes sont demandées,
**When** je consulte l'aperçu,
**Then** les noms, dates de début et fin et éventuels conflits sont listés pour chacune sans écriture prématurée.

#### AC3

**Given** une des dates chevauche un cycle existant ou une autre proposition de la même équipe,
**When** je regarde la prévisualisation,
**Then** la confirmation est bloquée et les périodes en conflit sont identifiées.

#### AC4

**Given** un chevauchement est détecté,
**When** je modifie la date de départ du lot,
**Then** l'ensemble des périodes est recalculé à cadence constante ; aucune borne individuelle ni période existante n'est déplacée.

#### AC5

**Given** je ferme ou annule l'aperçu,
**When** le formulaire est quitté,
**Then** aucune période n'est créée et un nouvel aperçu actualisé sera requis pour un lot modifié.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23 ; D-PRD-094/095/096/097/098/100.
* Dépendances déjà livrées : Stories 7.1–7.2.
* Incrément I3 ; mode Kanban autonome au MVP ; aucune fonctionnalité SAFe, pas de Sprint Scrum généré dans Kanban.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.4: Créer atomiquement un lot Kanban et tracer sa provenance
**Jira :** https://lmn24.atlassian.net/browse/SMN-139

**En tant que** Scrum Master Administrateur,
**je veux** confirmer en une fois les périodes Kanban valides prévisualisées,
**afin de** constituer une planification cohérente sans créations partielles.

**Critères d'acceptation :**

#### AC1

**Given** un lot de deux à six périodes a une prévisualisation valide,
**When** je confirme explicitement,
**Then** toutes les périodes proposées sont créées de façon atomique avec leurs identifiants et bornes.

#### AC2

**Given** une période du lot devient invalide avant la confirmation,
**When** le serveur revérifie tous les conflits,
**Then** l'intégralité du lot est rejetée et aucune période partielle n'est conservée.

#### AC3

**Given** une panne survient pendant le lot,
**When** le traitement échoue,
**Then** ni cycles partiels ni journal de succès fictif ne restent enregistrés.

#### AC4

**Given** un lot est créé avec succès,
**When** je consulte le journal,
**Then** auteur, horodatage, équipe, cadence, quantité, noms et identifiants des périodes créées sont tracés.

#### AC5

**Given** deux périodes sont successives sans chevauchement réel ou concernent deux équipes distinctes,
**When** les conflits sont évalués,
**Then** les dates contiguës et équipes différentes ne sont pas bloquées à tort.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23 ; D-PRD-095/096/101/102/103.
* Dépendances déjà livrées : Story 7.3 et transaction/audit Epic 2.
* Incrément I3 ; mode Kanban autonome au MVP ; aucune fonctionnalité SAFe, pas de Sprint Scrum généré dans Kanban.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.5: Nommer, personnaliser et renommer une période Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-140

**En tant que** Scrum Master Administrateur,
**je veux** identifier librement une période Kanban sans changer ses dates ni historiques,
**afin de** retrouver facilement un cycle malgré des noms identiques ou des corrections.

**Critères d'acceptation :**

#### AC1

**Given** une période mensuelle est proposée,
**When** je regarde son nom,
**Then** le libellé initial est du type « Période Kanban — novembre 2026 » et dépend du mois calculé.

#### AC2

**Given** une période de 7 ou 14 jours est proposée,
**When** je regarde son nom,
**Then** le nom initial inclut les dates de début et fin ; il suit les dates recalculées uniquement tant qu'il n'a pas été personnalisé.

#### AC3

**Given** je renseigne un libellé composé uniquement d'espaces,
**When** je tente de confirmer,
**Then** le nom est refusé après suppression des espaces de début et fin ; accents, chiffres et espaces internes restent autorisés.

#### AC4

**Given** deux périodes portent le même nom dans la même équipe,
**When** j'enregistre une création ou un renommage,
**Then** une alerte non bloquante apparaît et l'opération reste permise, les dates et identifiants distinguant les périodes.

#### AC5

**Given** une période est Clôturée,
**When** je modifie uniquement son nom,
**Then** la modification est autorisée sans réouverture, auditée et visible dans les rapports futurs, sans changer dates, indicateurs, statut ni anciens PDF.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23, FR-21 ; D-PRD-105/106/107/108/109/110.
* Dépendances déjà livrées : Stories 7.2 et 7.4.
* Incrément I3 ; mode Kanban autonome au MVP ; aucune fonctionnalité SAFe, pas de Sprint Scrum généré dans Kanban.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.6: Supprimer les périodes Kanban futures jamais démarrées
**Jira :** https://lmn24.atlassian.net/browse/SMN-141

**En tant que** Scrum Master Administrateur,
**je veux** retirer une période Kanban planifiée mais non commencée,
**afin de** corriger une planification erronée en préservant les cycles historiques.

**Critères d'acceptation :**

#### AC1

**Given** une période À venir n'a jamais été effectivement démarrée,
**When** l'Administrateur demande sa suppression,
**Then** les dates, références et événements associés concernés sont récapitulés avant confirmation.

#### AC2

**Given** la confirmation est annulée,
**When** je reviens au calendrier,
**Then** aucune période ni événement n'est supprimé.

#### AC3

**Given** une période a déjà été démarrée ou est Terminé ou Clôturé,
**When** je demande sa suppression ordinaire,
**Then** le serveur bloque la suppression et propose de conserver l'historique ou de suivre une procédure exceptionnelle.

#### AC4

**Given** une période future est supprimable,
**When** la confirmation réussit,
**Then** seule la période et les relations effaçables annoncées sont traitées, avec audit et absence de suppression partielle.

#### AC5

**Given** un Utilisateur appelle la même opération via une requête directe,
**When** le contrôle de rôle a lieu,
**Then** la suppression est refusée sans effet.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23 ; D-PRD-093/096/101 ; FR-69.
* Dépendances : Stories 7.2 à 7.5 ; protections de suppression Epic 2.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.7: Suivre les états calendaires sans générer la période suivante
**Jira :** https://lmn24.atlassian.net/browse/SMN-142

**En tant que** Scrum Master Administrateur,
**je veux** voir les périodes À venir, En cours, Terminées ou Clôturées,
**afin de** disposer d'un état fiable sans maintenance quotidienne ni création automatique.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban commence dans le futur,
**When** sa fiche est consultée,
**Then** elle apparaît À venir sans inventer de réalisé.

#### AC2

**Given** la borne de début effective est atteinte,
**When** le service réconcilie la période,
**Then** elle passe En cours et le cliché de capacité initiale est figé une seule fois selon les règles partagées.

#### AC3

**Given** la fin calendaire est dépassée,
**When** le service met à jour l'état,
**Then** la période devient Terminé, jamais Clôturé automatiquement.

#### AC4

**Given** l'application était arrêtée au passage d'une borne,
**When** elle redémarre,
**Then** les transitions sont reconstituées idempotemment avec provenance, sans reconstruire une capacité prétendument connue à une ouverture historique.

#### AC5

**Given** une période est créée, commence, se termine ou est clôturée,
**When** le moteur traite cet événement,
**Then** aucune nouvelle période suivante n'est automatiquement créée.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-23 ; D-PRD-093 ; F-91–96 ; D-PRD-079.
* Dépendances : Story 7.2 ; mécanismes de capacité et statuts Epics 3/4.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.8: Changer de cadence Kanban en préservant les cycles existants
**Jira :** https://lmn24.atlassian.net/browse/SMN-143

**En tant que** Scrum Master Administrateur,
**je veux** modifier la cadence de suivi pour les prochaines périodes,
**afin de** adapter le fonctionnement sans effacer les mesures collectées.

**Critères d'acceptation :**

#### AC1

**Given** une équipe Kanban utilise la cadence mensuelle,
**When** je choisis sept ou quatorze jours,
**Then** les futures générations explicites utilisent le nouveau rythme après sauvegarde.

#### AC2

**Given** plusieurs périodes À venir ont déjà été créées,
**When** je change la cadence,
**Then** une proposition de recalcul des seules périodes futures non démarrées est présentée sans modification automatique.

#### AC3

**Given** je refuse la proposition de recalcul,
**When** la nouvelle cadence est sauvegardée,
**Then** les périodes existantes conservent leurs bornes et les prochaines créations utilisent la nouvelle cadence.

#### AC4

**Given** une période est En cours, Terminée ou Clôturée,
**When** la cadence est modifiée,
**Then** ses dates, bilans et instantanés restent intacts.

#### AC5

**Given** une adaptation des périodes futures est demandée,
**When** la proposition est présentée,
**Then** l'action exige une confirmation distincte et un contrôle de conflits avant tout déplacement, jamais une propagation implicite.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23, FR-21 ; D-PRD-092/093/111 ; F-91–96.
* Dépendances : Stories 7.1–7.7 ; période et paramètres d'équipe enregistrés.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.9: Replanifier une période Kanban après un aperçu d'impact
**Jira :** https://lmn24.atlassian.net/browse/SMN-144

**En tant que** Scrum Master Administrateur,
**je veux** corriger les bornes d'une période existante avec une seule confirmation,
**afin de** préserver mes informations et éviter les décalages implicites.

**Critères d'acceptation :**

#### AC1

**Given** une période existe et son nom et ses dates sont connus,
**When** j'ouvre Corriger les dates,
**Then** un récapitulatif unique montre bornes avant/après, références de capacité, valeurs manuelles préservées et avertissements pertinents.

#### AC2

**Given** les nouvelles bornes chevauchent une autre période de l'équipe,
**When** je prévisualise,
**Then** l'option de confirmation est bloquée, sans déplacer les périodes voisines.

#### AC3

**Given** la correction est possible,
**When** j'examine les événements associés,
**Then** Conserver les dates des événements est l'option par défaut ; le recalcul des événements n'est proposé qu'aux occurrences éligibles.

#### AC4

**Given** la prévisualisation est rejetée ou abandonnée,
**When** je ferme l'écran,
**Then** aucune date ni métrique source n'est modifiée.

#### AC5

**Given** une correction valide est confirmée,
**When** la transaction est appliquée,
**Then** les seules dates et références autorisées sont modifiées atomiquement ; capacité initiale figée, valeurs manuelles, PDF et autres cycles demeurent inchangés.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23, FR-21 ; D-PRD-111/112/114/115/118.
* Dépendances : Stories 7.2–7.8 ; moteur de capacité Epic 3 et audit Epic 2.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.10: Protéger les événements lors d'une replanification Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-145

**En tant que** Scrum Master Administrateur,
**je veux** choisir le déplacement des seules occurrences futures autorisées,
**afin de** préserver les réunions réellement tenues et mes exceptions.

**Critères d'acceptation :**

#### AC1

**Given** une replanification Kanban propose de conserver les événements,
**When** l'Administrateur confirme ce choix,
**Then** les créneaux existants restent inchangés, avec avertissement pour ceux hors nouvelles bornes.

#### AC2

**Given** une occurrence future a été automatiquement générée et n'est ni personnalisée ni historique,
**When** un recalcul est explicitement choisi,
**Then** seule cette occurrence peut être proposée au déplacement, après prévisualisation.

#### AC3

**Given** une réunion est Tenue, Non tenue ou Annulée,
**When** je replanifie le cycle,
**Then** son créneau et son statut sont conservés, même si elle se retrouve en dehors de la période.

#### AC4

**Given** un événement a été personnalisé ou est exceptionnel,
**When** j'active un recalcul global,
**Then** ses dates demeurent intactes et aucun glisser-déposer implicite n'est appliqué.

#### AC5

**Given** une proposition de déplacement est invalidée par les contrôles d'intégrité,
**When** je confirme les changements,
**Then** l'opération atomique est refusée sans déplacement partiel ni suppression d'événement.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23 ; D-PRD-112/113/118.
* Dépendances : Story 7.9 et socle des événements/calendrier des Epics 3 et 4.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.11: Tracer les replanifications et conserver les relations qualitatives
**Jira :** https://lmn24.atlassian.net/browse/SMN-146

**En tant que** Scrum Master Administrateur,
**je veux** retrouver chaque correction de dates et les risques associés,
**afin de** expliquer les décisions calendaires sans perdre la continuité métier.

**Critères d'acceptation :**

#### AC1

**Given** une replanification a été confirmée avec succès,
**When** j'ouvre l'historique de la période,
**Then** une entrée consultable indique auteur, horodatage, dates avant/après et motif facultatif.

#### AC2

**Given** des événements ont été conservés ou recalculés,
**When** j'ouvre la trace,
**Then** le choix et les références avant/après utiles sont conservés avec écarts de capacité et alertes signalées.

#### AC3

**Given** un risque ou une dépendance est associé à cette période,
**When** les dates du cycle sont modifiées,
**Then** sa fiche centrale conserve statut, responsable, échéance, relations et historique sans transfert.

#### AC4

**Given** une échéance qualitative devient incohérente avec les nouvelles bornes,
**When** l'aperçu est consulté,
**Then** un avertissement non bloquant invite à la vérifier ; aucune échéance n'est modifiée automatiquement.

#### AC5

**Given** une tentative est annulée ou échoue,
**When** le journal des replanifications réussies est consulté,
**Then** aucune entrée de succès fictif n'est créée ; l'audit des échecs reste séparé.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-23, FR-21 ; D-PRD-114–120 ; FR-25.
* Dépendances : Stories 7.9–7.10 ; registre risques/dépendances Epic 5.
* Incrément I3 ; règles Kanban et protections communes, sans automatisation des créations ni SAFe MVP.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.12: Afficher les quatre blocs du bilan de période Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-147

**En tant que** Scrum Master Administrateur,
**je veux** consulter une structure de bilan commune à Scrum et adaptée au Kanban,
**afin de** retrouver les objectifs, mesures, capacités et tendances sans concepts Scrum inventés.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban existe,
**When** l'Administrateur ouvre son bilan,
**Then** les quatre blocs Objectifs, Métriques de la période, Capacité de la période et Tendances apparaissent dans cet ordre.

#### AC2

**Given** le bilan est affiché,
**When** je consulte son en-tête,
**Then** le nom de la période, ses dates, son équipe et son statut sont identifiables.

#### AC3

**Given** la période est en cours ou terminée non clôturée,
**When** je consulte le bilan,
**Then** les informations sont qualifiées comme provisoires et restent éditables selon les droits.

#### AC4

**Given** un Utilisateur est connecté,
**When** il demande les données du bilan,
**Then** seules les valeurs collectives accessibles sont retournées en lecture seule, sans données nominatives sensibles.

#### AC5

**Given** le mode d'installation est Kanban,
**When** je parcours les quatre blocs,
**Then** aucun champ Story Points Scrum ni cérémonie Scrum obligatoire n'est introduit.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-23 ; D-PRD-079/108 ; F-66–73.
* Dépendances : Stories 7.2 et 7.7 ; composants de bilan de l'Epic 4.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.13: Créer et évaluer plusieurs objectifs de période Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-148

**En tant que** Scrum Master Administrateur,
**je veux** suivre plusieurs objectifs Kanban indépendamment,
**afin de** qualifier leur atteinte à l'issue de la période sans interpréter une absence de mesure comme un échec.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban est créée,
**When** j'ouvre Objectifs de la période,
**Then** je peux ajouter un ou plusieurs objectifs avec identité et description distinctes.

#### AC2

**Given** un objectif est créé sans évaluation,
**When** je consulte son état initial,
**Then** il est Non évalué et non assimilé à Non atteint.

#### AC3

**Given** un objectif est évalué,
**When** je sélectionne son résultat,
**Then** les statuts Atteint, Partiellement atteint ou Non atteint sont acceptés avec commentaire facultatif.

#### AC4

**Given** un objectif de période est modifié,
**When** je sauvegarde le bloc,
**Then** la correction est datée et n'enregistre ni Métriques ni Capacité en brouillon.

#### AC5

**Given** une période est Clôturée,
**When** je tente de corriger l'évaluation,
**Then** l'opération est refusée sans réouverture volontaire ni écriture sur le cliché de clôture.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21 ; D-PRD-079 ; F-66/69/70 ; D-PRD-117.
* Dépendances : Story 7.12 et gestion d'objectifs de Sprint Epic 4.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.14: Saisir séparément commencés, terminés et WIP final
**Jira :** https://lmn24.atlassian.net/browse/SMN-149

**En tant que** Scrum Master Administrateur,
**je veux** renseigner les trois comptages de flux Kanban consolidés,
**afin de** suivre le flux sans créer de tickets individuels dans SMN.

**Critères d'acceptation :**

#### AC1

**Given** le bloc Métriques est ouvert,
**When** je renseigne le nombre d'éléments commencés dans la période,
**Then** un compte entier non négatif est mémorisé indépendamment des deux autres champs.

#### AC2

**Given** des éléments ont été achevés pendant la période mais ont commencé avant,
**When** je renseigne Throughput,
**Then** le nombre terminé est accepté sans obligation d'être inférieur au nombre commencé pendant cette même période.

#### AC3

**Given** des éléments restent en cours à la fin de la période,
**When** je renseigne WIP final,
**Then** il représente l'encours à cette date et non un total cumulé d'entrées ou de passages.

#### AC4

**Given** un champ est laissé vide ou reçoit explicitement zéro,
**When** le bilan est affiché,
**Then** vide reste Non renseigné ; zéro est une valeur connue valide et n'est pas inventé.

#### AC5

**Given** des comptages sont saisis,
**When** SMN présente ses calculs,
**Then** aucun WIP, Throughput ou commencé n'est déduit arithmétiquement des deux autres ; SP et capacité JH restent distincts.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-22, FR-21 ; D-PRD-080/116 ; F-08/14/16/71/72.
* Dépendances : Story 7.12.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.15: Saisir Cycle Time et Lead Time moyens comparables
**Jira :** https://lmn24.atlassian.net/browse/SMN-150

**En tant que** Scrum Master Administrateur,
**je veux** renseigner les deux moyennes consolidées du flux en jours calendaires,
**afin de** mesurer les délais sans suivi individuel des éléments dans SMN.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban est consultée,
**When** je renseigne Cycle Time moyen et Lead Time moyen,
**Then** les deux champs sont facultatifs et indépendants, sans blocage de la clôture s'ils restent vides.

#### AC2

**Given** un élément est achevé pendant la période,
**When** j'explicite la population Cycle Time,
**Then** seuls les éléments achevés pendant cette période comptent, même si leur travail a commencé avant.

#### AC3

**Given** un élément est livré pendant la période,
**When** j'explicite la population Lead Time,
**Then** seuls les éléments livrés pendant cette période comptent, même si leur demande date d'avant ; les populations peuvent différer.

#### AC4

**Given** une valeur provient d'une source externe avec convention inconnue ou en jours ouvrés,
**When** je prépare la comparaison,
**Then** elle n'est pas déclarée directement comparable sans vérification ou conversion fiable et sa provenance est conservée.

#### AC5

**Given** une moyenne est affichée en français ou anglais,
**When** je consulte la valeur,
**Then** elle est présentée avec une décimale en jours calendaires, week-ends inclus ; l'arrondi d'affichage ne dégrade pas la valeur source enregistrée.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-22, FR-21 ; D-PRD-082/083/085/086.
* Dépendances : Story 7.14 et bloc Métriques 7.12.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.16: Enregistrer séparément les trois blocs de saisie du bilan Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-151

**En tant que** Scrum Master Administrateur,
**je veux** sauvegarder les objectifs, cinq métriques et capacités sans les mêler,
**afin de** conserver le contrôle des corrections et brouillons.

**Critères d'acceptation :**

#### AC1

**Given** le bilan contient des modifications dans Objectifs et Métriques,
**When** je clique Enregistrer dans Métriques,
**Then** seules les cinq valeurs de ce bloc sont sauvegardées, sans enregistrer les objectifs modifiés.

#### AC2

**Given** une saisie du bloc Métriques n'est pas encore sauvegardée,
**When** j'observe les graphiques de tendances,
**Then** ils restent fondés exclusivement sur les données enregistrées.

#### AC3

**Given** un calcul ou affichage dérivé change pendant la saisie,
**When** je consulte la valeur,
**Then** elle est marquée provisoire jusqu'à confirmation du bouton du bloc concerné.

#### AC4

**Given** je quitte un bilan avec une ou plusieurs modifications non enregistrées,
**When** une navigation est tentée,
**Then** un avertissement permet de rester ou quitter sans perte silencieuse ; aucune sauvegarde automatique ne s'exécute.

#### AC5

**Given** un bloc Tendances est affiché,
**When** je cherche les commandes d'édition,
**Then** aucun bouton Enregistrer ni saisie propre aux tendances n'existe.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-22 ; D-PRD-071/072/073/074/079.
* Dépendances : Stories 7.13–7.15 et mécanisme partagé d'enregistrement Epic 4.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026. Cette approbation ne vaut pas développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.17: Afficher les capacités initiale et réelle de la période en JH
**Jira :** https://lmn24.atlassian.net/browse/SMN-152

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les capacités Kanban issues du moteur commun,
**afin de** comprendre l'écart de disponibilité sans conversion artificielle des métriques de flux.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban atteint son ouverture effective,
**When** le service de capacité reçoit l'événement,
**Then** la capacité initialement retenue est figée une seule fois, avec provenance et date réelle d'ouverture.

#### AC2

**Given** la période est À venir,
**When** la capacité réelle est consultée,
**Then** aucun réalisé fictif n'est calculé à partir de jours encore futurs.

#### AC3

**Given** une période En cours ou Terminée dispose de disponibilités connues,
**When** le bloc Capacité est consulté,
**Then** référence réelle en JH, valeur manuelle prioritaire et écart fiable sont présentés selon le statut.

#### AC4

**Given** une valeur réelle JH est absente ou la référence non calculable,
**When** l'écart est demandé,
**Then** Non renseigné ou Non calculable s'affiche sans zéro fictif ni conversion des comptes Kanban ou du Cycle Time.

#### AC5

**Given** une période a été Clôturée,
**When** les disponibilités sont corrigées,
**Then** ni la capacité initiale figée ni le réalisé clôturé ne sont réécrits sans réouverture et nouvelle version.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21 ; D-PRD-079/114/115 ; FR-14.
* Dépendances : Stories 7.7 et 7.12 ; moteur de capacités Epic 3.
* Incrément I3 ; données de flux facultatives, distinctes de la capacité JH et des Story Points Scrum ; pas de connexion automatique Jira.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.18: Visualiser trois tendances distinctes des comptes de flux
**Jira :** https://lmn24.atlassian.net/browse/SMN-153

**En tant que** Scrum Master Administrateur,
**je veux** consulter l'évolution des commencés, terminés et WIP final,
**afin de** identifier les tendances à partir des seules valeurs Kanban enregistrées.

**Critères d'acceptation :**

#### AC1

**Given** plusieurs périodes Kanban sont Clôturées,
**When** j'ouvre Tendances,
**Then** trois graphiques distincts présentent commencés, terminés (Throughput) et WIP final avec des noms et unités lisibles.

#### AC2

**Given** l'équipe possède plus de cinq périodes Clôturées,
**When** une tendance est calculée,
**Then** au plus cinq périodes clôturées éligibles de cette équipe sont affichées dans l'ordre chronologique.

#### AC3

**Given** je consulte le bilan d'une ancienne période,
**When** les périodes comparables sont sélectionnées,
**Then** aucune période postérieure à la période consultée n'apparaît.

#### AC4

**Given** un comptage passé est absent ou provient d'une saisie non sauvegardée,
**When** le graphique est rendu,
**Then** aucun point zéro, interpolation ni valeur provisoire n'est produit à sa place.

#### AC5

**Given** aucune période clôturée éligible n'existe,
**When** je consulte le bloc,
**Then** un état vide explicite apparaît, sans bouton Enregistrer et sans modifier les anciens PDF.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-22, FR-21 ; D-PRD-081/079 ; D-PRD-077/078.
* Dépendances : Story 7.14 et bloc en lecture seule 7.16 ; statuts de cycle partagés Epic 4.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.19: Comparer Cycle Time et Lead Time dans un quatrième graphique
**Jira :** https://lmn24.atlassian.net/browse/SMN-154

**En tant que** Scrum Master Administrateur,
**je veux** visualiser deux courbes de durées moyennes sur un même graphique,
**afin de** comparer les délais de flux sans inventer de mesures ou normes de performance.

**Critères d'acceptation :**

#### AC1

**Given** des périodes clôturées comportent Cycle Time et Lead Time comparables,
**When** je consulte le quatrième graphique,
**Then** deux courbes identifiables portent chacune sa légende distincte, en jours calendaires.

#### AC2

**Given** plus de cinq périodes clôturées sont disponibles,
**When** les valeurs sont sélectionnées,
**Then** les cinq dernières périodes éligibles au maximum sont utilisées, sans période postérieure à un bilan historique.

#### AC3

**Given** une moyenne manque ou sa convention est inconnue,
**When** la courbe est composée,
**Then** la valeur est absente et non interpolée ; l'autre courbe exploitable peut rester visible.

#### AC4

**Given** une moyenne vaut zéro explicitement et une autre est non renseignée,
**When** je consulte les points,
**Then** le zéro s'affiche 0,0 jour, tandis que l'absence reste Non renseignée.

#### AC5

**Given** la langue d'affichage est le français ou l'anglais,
**When** je lis les légendes/valeurs,
**Then** les durées affichent une décimale et des libellés accessibles, sans seuil automatique de bonne ou mauvaise performance.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-22, FR-21 ; D-PRD-083/084/085/086.
* Dépendances : Stories 7.15 et 7.18.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.20: Clôturer et rouvrir une période Kanban avec versions Vn
**Jira :** https://lmn24.atlassian.net/browse/SMN-155

**En tant que** Scrum Master Administrateur,
**je veux** clôturer manuellement une période et corriger ensuite ses données,
**afin de** conserver les mesures et événements connus à chaque clôture sans altérer le passé.

**Critères d'acceptation :**

#### AC1

**Given** une période a atteint sa fin calendaire,
**When** le statut est réconcilié,
**Then** elle devient Terminé mais ne passe jamais automatiquement à Clôturé.

#### AC2

**Given** une ou plusieurs des cinq métriques sont absentes,
**When** je demande Clôturer,
**Then** les données manquantes ne bloquent pas la clôture et ne deviennent pas des zéros.

#### AC3

**Given** un Administrateur confirme la clôture,
**When** le service valide,
**Then** un instantané V1 immuable du bilan, des capacités et des liens qualitatifs applicables est créé avec audit.

#### AC4

**Given** un Administrateur rouvre volontairement une période Clôturée,
**When** la réouverture aboutit,
**Then** la période redevient Terminé ; V1 et les PDF antérieurs restent consultables et intacts.

#### AC5

**Given** après corrections autorisées l'Administrateur reclôture,
**When** la transaction réussit,
**Then** un instantané V2/V3 distinct est conservé sans écraser les versions précédentes, et le bilan clôturé cible la dernière version.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-22, FR-23 ; F-91–96 ; D-PRD-079/130-A3.
* Dépendances : Stories 7.12–7.19 ; mécanismes versionnés Epics 2/4/5.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.21: Préserver les cinq mesures et objectifs lors de la replanification Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-156

**En tant que** Scrum Master Administrateur,
**je veux** identifier les valeurs de bilan à vérifier après un changement de bornes,
**afin de** ne pas recalculer artificiellement des indicateurs consolidés.

**Critères d'acceptation :**

#### AC1

**Given** une période contient trois comptes et deux moyennes de flux,
**When** je modifie ses dates,
**Then** les cinq valeurs sources enregistrées sont conservées sans recomposition à partir des bornes ou entre elles.

#### AC2

**Given** une modification de dates touche potentiellement les populations de mesure,
**When** je consulte l'aperçu,
**Then** les cinq métriques, conventions de Cycle Time/Lead Time et objectifs pertinents à vérifier sont signalés sans blocage automatique.

#### AC3

**Given** la période contient plusieurs objectifs avec évaluations/commentaires,
**When** je confirme la replanification,
**Then** les objectifs et leur historique restent attachés à la même période sans transfert vers une autre.

#### AC4

**Given** une période est En cours ou Terminée non Clôturée,
**When** les dates changent avec confirmation,
**Then** seules les références calculables de capacité réelle sont réévaluées ; valeurs manuelles, capacité initiale figée et PDF restent intacts.

#### AC5

**Given** une période est Clôturée,
**When** je demande de corriger ses mesures, objectifs ou capacité,
**Then** la réouverture volontaire est exigée et toute nouvelle clôture produit une version distincte, sans modifier les documents antérieurs.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-22, FR-23 ; D-PRD-114/115/116/117/118/119.
* Dépendances : Stories 7.9–7.11, 7.13–7.17 et 7.20.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.22: Consulter les périodes Kanban et événements sur le calendrier commun
**Jira :** https://lmn24.atlassian.net/browse/SMN-157

**En tant que** Scrum Master Administrateur,
**je veux** retrouver mes périodes Kanban et réunions réellement enregistrées au calendrier,
**afin de** préparer le suivi sans voir apparaître de fausses cérémonies Scrum.

**Critères d'acceptation :**

#### AC1

**Given** une ou plusieurs périodes Kanban existent,
**When** j'ouvre le calendrier commun,
**Then** leurs noms, dates et statuts sont affichés sans confondre période Kanban et Sprint Scrum.

#### AC2

**Given** une réunion ponctuelle ou un modèle réellement configuré existe,
**When** je consulte ses occurrences,
**Then** seules les occurrences enregistrées et autorisées apparaissent, avec leurs statuts réels.

#### AC3

**Given** aucune cérémonie Scrum n'a été explicitement créée pour cette équipe Kanban,
**When** j'ouvre son calendrier,
**Then** aucun Planning, Daily, Review ou Rétrospective Scrum n'est produit artificiellement.

#### AC4

**Given** une période a été replanifiée et une occurrence tenue a été préservée,
**When** j'ouvre l'événement,
**Then** sa date initiale, son statut et sa provenance restent intacts, même hors des nouvelles bornes.

#### AC5

**Given** un Utilisateur ouvre cette vue,
**When** le serveur renvoie les événements,
**Then** la lecture respecte les droits collectifs sans permettre de replanifier ou dévoiler des absences nominatives privées.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-23 ; D-PRD-079/093/108/112/113.
* Dépendances : Stories 7.2 et 7.7 ; calendrier central Epic 3 et événements existants Epic 4.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.

### Story 7.23: Produire un rapport Kanban avec le moteur HTML/PDF partagé
**Jira :** https://lmn24.atlassian.net/browse/SMN-158

**En tant que** Scrum Master Administrateur,
**je veux** générer un rapport sur une période Kanban selon les mêmes options que Scrum,
**afin de** présenter les flux Kanban de façon fiable et retrouver un PDF archivé.

**Critères d'acceptation :**

#### AC1

**Given** une période Kanban est consultée,
**When** j'ouvre Générer un rapport,
**Then** le formulaire est prérempli avec son nom, ses dates, son statut, son équipe et les données Kanban disponibles.

#### AC2

**Given** les cinq métriques Kanban et capacités existent partiellement,
**When** je choisis des rubriques,
**Then** les comptes, durées moyennes en jours calendaires, capacité JH et tendances sont distingués ; aucune conversion en Story Points n'a lieu.

#### AC3

**Given** une période Kanban est ouverte ou clôturée,
**When** je compose le rapport,
**Then** l'état provisoire ou le cliché de clôture applicable est correctement utilisé et la sélection de tendances se limite aux périodes clôturées éligibles.

#### AC4

**Given** un aperçu HTML est consulté sans export,
**When** je quitte la préparation,
**Then** aucune archive PDF n'est créée.

#### AC5

**Given** un export PDF est réellement réussi,
**When** le service archive le fichier,
**Then** le PDF final exact est conservé et consultable par les profils autorisés selon Epic 6 ; les anciens PDF restent inchangés.

#### Traçabilité et dépendances

* Epic : SMN-7 ; FR-21, FR-22, FR-23 ; D-PRD-079/080/081/084/108 ; RPT-01–08 ; D-PRD-134.
* Dépendances : Stories 7.12–7.20 et moteur de rapports Epic 6.
* Incrément I3 ; Kanban MVP ; mécanismes communs d'objectif, capacité, bilan et reporting, sans équivalence artificielle avec Scrum ni SAFe opérationnel.
  **Statut : validation fonctionnelle globale acquise le 19/10/2026 ; développement et tests non réalisés.**

#### Validation fonctionnelle globale

Les 23 Stories de l'Epic 7 ont été approuvées globalement sans réserve le 19/10/2026 ; pas de développement ni recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.


## Epic 8: Reconstituer les Sprints passés et fiabiliser les tendances
Créer des Sprints rétrospectifs documentés et importer des métriques consolidées Scrum/Kanban sans fabriquer d'historique ni écraser les données.
**FRs couvertes :** FR-42, FR-43, FR-44, FR-45, FR-46, FR-47, FR-48, FR-49.

### Story 8.1: Créer un Sprint passé en reprise historique explicite
**Jira :** https://lmn24.atlassian.net/browse/SMN-159

**En tant que** Scrum Master Administrateur,
**je veux** créer un Sprint réellement terminé avant son enregistrement dans SMN,
**afin de** reconstruire un historique fiable à partir des seules informations retrouvées.

**Critères d'acceptation :**

#### AC1

**Given** une équipe Scrum existe et la fin d'un Sprint est réellement passée,
**When** j'ouvre le parcours « Reprise historique » et renseigne les bornes réelles,
**Then** SMN distingue la date historique du Sprint de la date effective de création de sa fiche.

#### AC2

**Given** les bornes de reprise sont cohérentes et ne chevauchent aucun autre Sprint de la même équipe,
**When** je confirme,
**Then** un Sprint identifié comme historique est créé directement au statut Terminé, jamais Clôturé automatiquement.

#### AC3

**Given** une période de reprise chevauche un Sprint déjà enregistré,
**When** j'essaie de confirmer,
**Then** la création est refusée avec l'identification du conflit, sans déplacer les autres cycles.

#### AC4

**Given** une date de fin est future ou le Sprint est encore en cours,
**When** je demande la reprise terminée,
**Then** cette exception historique est refusée ou renvoyée au parcours approprié, sans simuler sa fin.

#### AC5

**Given** je suis un Utilisateur non administrateur,
**When** j'appelle directement la création historique,
**Then** le serveur bloque l'écriture et ne crée aucun Sprint.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-42, FR-47 ; D-PRD-130/A1 ; HIS-01 ; FR-15/16.
* Dépendances : Epic 4 : génération et statut des Sprints ; Epic 3 : équipe et calendrier.
* Incrément I4 ; Scrum historique au MVP. Aucune reprise rétrospective Kanban complète ajoutée par cette Story. SAFe hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.2: Ne générer aucune cérémonie lors d'une reprise historique
**Jira :** https://lmn24.atlassian.net/browse/SMN-160

**En tant que** Scrum Master Administrateur,
**je veux** éviter de créer des cérémonies fictives pour les Sprints anciens,
**afin de** ne pas faire croire que des réunions passées ont réellement eu lieu.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint est créé après sa date et heure réelles de fin par le parcours historique,
**When** la création aboutit,
**Then** aucun Planning, Daily, Review ni Rétrospective n'est généré, quel que soit le modèle normal de cérémonies.

#### AC2

**Given** des modèles de cérémonies personnalisées sont actifs,
**When** le Sprint historique est créé,
**Then** aucune occurrence personnalisée récurrente n'est générée rétrospectivement.

#### AC3

**Given** une cérémonie manque dans l'historique,
**When** j'ouvre le calendrier du Sprint,
**Then** elle n'est pas marquée automatiquement Tenue, Non tenue ou Annulée.

#### AC4

**Given** une création de Sprint ordinaire et future est demandée,
**When** le moteur normal fonctionne,
**Then** les règles de génération de cérémonies de l'Epic 4 restent applicables et inchangées.

#### AC5

**Given** la création historique échoue puis est retentée,
**When** le résultat est contrôlé,
**Then** aucune occurrence fictive ni duplication du Sprint ne reste associée à un échec.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-42, FR-47 ; D-PRD-130/A1 ; HIS-01 ; FR-17.
* Dépendances : Story 8.1 ; gestion des cérémonies Epic 4.
* Incrément I4 ; Scrum historique au MVP. Aucune reprise rétrospective Kanban complète ajoutée par cette Story. SAFe hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.3: Ajouter manuellement un événement historique réellement documenté
**Jira :** https://lmn24.atlassian.net/browse/SMN-161

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer une réunion passée dont les informations sont effectivement connues,
**afin de** compléter le calendrier historique sans inventer les autres cérémonies.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint rétrosaisi Terminé existe et une Review passée est documentée,
**When** je crée manuellement un événement historique,
**Then** sa nature et sa date réelles sont enregistrées avec provenance et date de saisie SMN distinctes.

#### AC2

**Given** le statut réel de l'événement est connu,
**When** je le renseigne explicitement,
**Then** seul ce statut connu est sauvegardé et non déduit de la date passée.

#### AC3

**Given** un événement passé est documenté mais son statut est inconnu,
**When** je prépare sa fiche,
**Then** SMN n'affirme pas qu'il a été tenu ou annulé et demande de qualifier l'incertitude selon le modèle existant.

#### AC4

**Given** un événement historique est corrigé,
**When** je sauvegarde,
**Then** la correction est traçable et ne modifie aucune autre occurrence absente du Sprint.

#### AC5

**Given** un événement historique est ajouté après qu'un PDF a été exporté,
**When** je consulte le document précédent,
**Then** l'ancien PDF et les instantanés déjà clôturés restent intacts.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-42, FR-47 ; D-PRD-130/A1 ; HIS-01 ; FR-17/18.
* Dépendances : Stories 8.1–8.2 ; saisie d'événement Epic 4.
* Incrément I4 ; Scrum historique au MVP. Aucune reprise rétrospective Kanban complète ajoutée par cette Story. SAFe hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.4: Renseigner un bilan historique partiel à partir des objectifs retrouvés
**Jira :** https://lmn24.atlassian.net/browse/SMN-162

**En tant que** Scrum Master Administrateur,
**je veux** saisir seulement les objectifs et commentaires réellement disponibles pour un ancien Sprint,
**afin de** disposer d'un bilan rétrospectif sans inventer ses informations manquantes.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint historique Terminé existe,
**When** je saisis un objectif effectivement retrouvé,
**Then** l'objectif et sa description sont enregistrés sans créer d'autres objectifs.

#### AC2

**Given** l'atteinte d'un objectif passé est inconnue,
**When** je laisse son évaluation vide,
**Then** son statut reste Non évalué, pas Non atteint.

#### AC3

**Given** des commentaires de rétrospective sont retrouvés,
**When** je les saisis volontairement,
**Then** la source et la date d'enregistrement peuvent être conservées sans fabriquer de cérémonie rétrospective.

#### AC4

**Given** des objectifs ou commentaires ne sont pas disponibles,
**When** j'enregistre le bilan partiel,
**Then** les champs inconnus restent facultatifs et la sauvegarde du bloc réussit.

#### AC5

**Given** le Sprint est Clôturé,
**When** je demande une correction des objectifs,
**Then** la réouverture volontaire et la traçabilité prévues par Epic 4 restent exigées.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-42, FR-47 ; HIS-01/06 ; D-PRD-130/A1/A3 ; FR-20.
* Dépendances : Story 8.1 ; blocs de bilan Epic 4.
* Incrément I4 ; Scrum historique au MVP. Aucune reprise rétrospective Kanban complète ajoutée par cette Story. SAFe hors MVP.
**Statut : validée fonctionnellement le 19/10/2026 ; pas de développement ni recette.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.5: Qualifier la capacité initiale historique comme connue, estimée ou absente
**Jira :** https://lmn24.atlassian.net/browse/SMN-163

**En tant que** Scrum Master Administrateur,
**je veux** indiquer la capacité prévue à l'époque avec son niveau de fiabilité,
**afin de** éviter tout recalcul fictif à partir de l'équipe actuelle.

**Critères d'acceptation :**

#### AC1

**Given** je retrouve une capacité prévue historique de 24 JH,
**When** je la saisis en qualité Connue,
**Then** la valeur 24 JH, sa source éventuelle et la date de saisie SMN sont enregistrées sans prétendre à un gel effectué à l'époque.

#### AC2

**Given** je reconstitue volontairement une capacité à 22,5 JH,
**When** je la saisis en qualité Estimée,
**Then** la valeur est conservée comme estimation historique et n'est pas présentée comme une mesure certaine.

#### AC3

**Given** aucune capacité initiale fiable n'est retrouvée,
**When** je laisse le champ non renseigné,
**Then** aucune capacité numérique, pas même zéro, n'est créée ni inférée.

#### AC4

**Given** le calendrier et les affectations actuels sont complets,
**When** j'ouvre un Sprint vieux de six mois,
**Then** SMN ne les réutilise pas implicitement pour calculer la capacité initiale passée.

#### AC5

**Given** une capacité initiale historique connue ou estimée a été saisie,
**When** je modifie plus tard les absences actuelles,
**Then** la valeur historique reste intacte ; toute correction volontaire suit l'audit et la réouverture éventuelle.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-42, FR-46, FR-47 ; D-PRD-130/A2 ; HIS-01/05 ; FR-14.
* Dépendances : Story 8.1 ; moteur et provenance des capacités Epic 3.
* Incrément I4 ; Scrum historique au MVP. Aucune reprise rétrospective Kanban complète ajoutée par cette Story. SAFe hors MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.6: Saisir une capacité réellement constatée sans la déduire du passé
**Jira :** https://lmn24.atlassian.net/browse/SMN-164

**En tant que** Scrum Master Administrateur,
**je veux** documenter la capacité réelle d'un ancien Sprint uniquement lorsqu'elle est connue,
**afin de** séparer la disponibilité effectivement retrouvée de la capacité initiale estimée.

**Critères d'acceptation :**

#### AC1

**Given** une valeur de capacité réelle ancienne est retrouvée,
**When** je l'enregistre avec qualité Connue ou Estimée et provenance si disponible,
**Then** elle est distincte de la capacité initiale de ce Sprint.

#### AC2

**Given** la seule capacité initiale est renseignée,
**When** je consulte la capacité réelle,
**Then** aucun réalisé n'est déduit automatiquement de la capacité prévue.

#### AC3

**Given** la capacité réelle n'est pas connue,
**When** j'affiche son écart à la capacité prévue,
**Then** l'écart reste Non calculable, sans zéro fictif.

#### AC4

**Given** un zéro réel est explicitement attesté,
**When** je saisis zéro,
**Then** il est distingué de l'absence de donnée et sa qualité/provenance sont conservées.

#### AC5

**Given** la période a été clôturée,
**When** je demande une correction de capacité,
**Then** la réouverture et l'audit sont exigés ; les PDF anciens restent inchangés.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-46, FR-47, FR-42 ; D-PRD-130/A2 ; HIS-05/06 ; FR-14.
* Dépendances : Stories 8.1 et 8.5 ; capacités réelle/manuelle Epic 3.
* I4, MVP Scrum/Kanban pour le CSV ; reprise manuelle des Sprints Scrum uniquement. SAFe et intégration Jira hors MVP.
**Statut de la Story 8.6 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.7: Distinguer la date historique, l'origine et le niveau de qualité
**Jira :** https://lmn24.atlassian.net/browse/SMN-165

**En tant que** Scrum Master Administrateur,
**je veux** retrouver pour chaque donnée historique importante son origine et sa fiabilité,
**afin de** ne pas confondre une estimation rétrospective avec une observation passée.

**Critères d'acceptation :**

#### AC1

**Given** une donnée historique est saisie manuellement,
**When** sa fiche est consultée,
**Then** sa date de saisie actuelle, le cycle visé et la provenance Manuelle sont identifiables.

#### AC2

**Given** une valeur importée possède quality known ou estimated,
**When** elle est persistée,
**Then** elle apparaît comme Connue ou Estimée, sans traduire estimated en fait mesuré.

#### AC3

**Given** un champ n'a jamais été renseigné,
**When** j'ouvre un bilan ancien,
**Then** l'état Non renseigné est présenté, non zéro ni Non atteint.

#### AC4

**Given** une donnée connue est corrigée ou sa qualité change,
**When** je sauvegarde volontairement,
**Then** les informations avant/après et l'auteur de la correction sont historisés.

#### AC5

**Given** une valeur dérivée est affichée,
**When** je consulte sa provenance,
**Then** elle reste qualifiée comme calcul fondé sur des données sources disponibles et non comme observation historique indépendante.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-46, FR-47 ; HIS-05/06 ; D-PRD-130/A2/A4 ; F-14.
* Dépendances : Stories 8.1, 8.4 à 8.6.
* I4, MVP Scrum/Kanban pour le CSV ; reprise manuelle des Sprints Scrum uniquement. SAFe et intégration Jira hors MVP.
**Statut de la Story 8.7 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.8: Proposer un modèle CSV historique au contrat strict de quatre colonnes
**Jira :** https://lmn24.atlassian.net/browse/SMN-166

**En tant que** Scrum Master Administrateur,
**je veux** télécharger un modèle de CSV prêt à remplir pour une installation existante,
**afin de** préparer un import compatible sans saisir des identifiants ou colonnes au hasard.

**Critères d'acceptation :**

#### AC1

**Given** je demande un modèle CSV depuis une installation Scrum,
**When** le fichier modèle est produit,
**Then** l'en-tête comporte exactement cycle_id,metric_code,value,quality, dans cet ordre.

#### AC2

**Given** le mode est Scrum,
**When** j'ouvre le catalogue des codes sources autorisés,
**Then** quatre sources SP sont couvertes : engagement initial, ajoutés, retirés, terminés, sans métriques dérivées importables.

#### AC3

**Given** le mode est Kanban,
**When** je consulte le même contrat,
**Then** cinq sources de flux sont proposées : commencés, Throughput, WIP final, Cycle Time moyen et Lead Time moyen.

#### AC4

**Given** des cycles existent dans mon installation,
**When** je consulte les aides ou exemples du modèle,
**Then** leurs identifiants réels peuvent être utilisés ; aucun cycle ou ticket Jira n'est créé.

#### AC5

**Given** une capacité JH ou une métrique dérivée est demandée dans le modèle,
**When** le catalogue des codes éligibles est vérifié,
**Then** aucun code non explicitement autorisé n'est proposé ni une cinquième colonne ajoutée.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-43, FR-46 ; D-PRD-130/A4 ; HIS-02 ; F-16/19.
* Dépendances : Cy­cles déjà enregistrés via Epics 4/7 ; définition des métriques SP Epic 4 et flux Epic 7.
* I4, MVP Scrum/Kanban pour le CSV ; reprise manuelle des Sprints Scrum uniquement. SAFe et intégration Jira hors MVP.
**Statut de la Story 8.8 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.9: Contrôler le schéma et la syntaxe de tout CSV avant import
**Jira :** https://lmn24.atlassian.net/browse/SMN-167

**En tant que** Scrum Master Administrateur,
**je veux** détecter les erreurs de format d'un fichier de valeurs consolidées,
**afin de** refuser les fichiers ambigus avant tout changement métier.

**Critères d'acceptation :**

#### AC1

**Given** un CSV comporte exactement les quatre noms de colonne attendus,
**When** je déclenche la vérification,
**Then** l'en-tête et toutes les lignes sont interprétés selon le contrat documenté.

#### AC2

**Given** un fichier manque une colonne ou en comporte une supplémentaire,
**When** la validation est exécutée,
**Then** l'ensemble du fichier est refusé avec l'erreur de structure, sans écriture métier.

#### AC3

**Given** une ligne contient une valeur numérique vide ou non valide,
**When** la validation est exécutée,
**Then** la ligne et sa colonne sont signalées et l'intégralité de l'import est déclarée invalide.

#### AC4

**Given** une ligne a quality différent de known ou estimated, ou vide,
**When** l'analyse s'exécute,
**Then** elle est rejetée et aucun champ n'est considéré automatiquement Non renseigné via CSV.

#### AC5

**Given** un fichier comporte plusieurs lignes,
**When** une anomalie de syntaxe survient au milieu,
**Then** aucune des lignes pourtant valides ne modifie la base.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-43, FR-44 ; D-PRD-130/A4 ; HIS-02/03.
* Dépendances : Story 8.8 ; mécanismes de lecture de fichiers et protections Epic 2.
* I4, MVP Scrum/Kanban pour le CSV ; reprise manuelle des Sprints Scrum uniquement. SAFe et intégration Jira hors MVP.
**Statut de la Story 8.9 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.10: Valider les cycles, les métriques et les doublons d'un lot CSV
**Jira :** https://lmn24.atlassian.net/browse/SMN-168

**En tant que** Scrum Master Administrateur,
**je veux** m'assurer que chaque ligne cible un cycle et une métrique existants et compatibles,
**afin de** ne pas importer de chiffres sur une mauvaise période.

**Critères d'acceptation :**

#### AC1

**Given** un cycle_id correspond à un Sprint ou une période Kanban existante,
**When** le fichier est validé,
**Then** la ligne est reliée à l'identifiant stable sans créer de cycle.

#### AC2

**Given** un cycle_id est inexistant ou pointe hors installation,
**When** la validation s'exécute,
**Then** le fichier entier est rejeté sans créer ni chercher une période fictive.

#### AC3

**Given** un metric_code Kanban apparaît dans une installation Scrum ou inversement,
**When** le fichier est contrôlé,
**Then** le code incompatible invalide le lot complet.

#### AC4

**Given** deux lignes possèdent le même couple cycle_id et metric_code, même avec la même valeur,
**When** les doublons sont détectés,
**Then** le fichier entier est rejeté, avec les deux numéros de ligne.

#### AC5

**Given** une valeur ne respecte pas signe, granularité ou unité de sa métrique source,
**When** la validation métier s'exécute,
**Then** la ligne invalide bloque l'ensemble du lot, sans conversion SP↔JH ni calcul de moyenne fictif.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-43, FR-44 ; D-PRD-130/A4 ; HIS-02/03 ; FR-20/22.
* Dépendances : Stories 8.8–8.9 et cycles des Epics 4/7.
* I4, MVP Scrum/Kanban pour le CSV ; reprise manuelle des Sprints Scrum uniquement. SAFe et intégration Jira hors MVP.
**Statut de la Story 8.10 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.11: Prévisualiser chaque ligne et son impact avant tout import CSV
**Jira :** https://lmn24.atlassian.net/browse/SMN-169

**En tant que** Scrum Master Administrateur,
**je veux** voir à l'avance les cycles, valeurs, qualités et erreurs d'un import,
**afin de** contrôler le résultat avant de modifier les données du carnet.

**Critères d'acceptation :**

#### AC1

**Given** un fichier CSV est analysable,
**When** j'ouvre la prévisualisation,
**Then** chaque ligne affiche cycle existant, métrique reconnue, valeur proposée, qualité et résultat de validation.

#### AC2

**Given** un champ cible est déjà renseigné,
**When** je consulte l'aperçu,
**Then** la valeur existante et la valeur proposée apparaissent côte à côte avec la conservation par défaut.

#### AC3

**Given** une ligne est invalide ou dupliquée,
**When** j'ouvre le récapitulatif,
**Then** le fichier entier est indiqué comme non confirmable et les erreurs sont visibles par ligne.

#### AC4

**Given** je ferme ou annule la prévisualisation,
**When** je retourne à la page d'import,
**Then** aucun champ de cycle n'est modifié et aucun succès d'import n'est annoncé.

#### AC5

**Given** je change le fichier après prévisualisation,
**When** je relance le contrôle,
**Then** l'aperçu est recalculé à partir du nouveau fichier et l'ancienne confirmation n'est pas réutilisée.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-44, FR-45 ; D-PRD-130/A4 ; HIS-03/04 ; UX-DR15.
* Dépendances : Stories 8.8–8.10.
* Incrément I4 ; CSV manuel Scrum/Kanban, sans création de tickets Jira ni de cycles implicites. Aucune validation individuelle préalable demandée.
**Statut de la Story 8.11 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.12: Conserver par défaut toutes les valeurs historiques préexistantes
**Jira :** https://lmn24.atlassian.net/browse/SMN-170

**En tant que** Scrum Master Administrateur,
**je veux** préserver les chiffres déjà enregistrés lorsqu'un CSV cible les mêmes champs,
**afin de** éviter l'écrasement silencieux de mesures manuelles ou importées.

**Critères d'acceptation :**

#### AC1

**Given** une métrique importée vise un champ déjà renseigné,
**When** j'ouvre sa proposition,
**Then** Conserver la valeur existante est sélectionné par défaut.

#### AC2

**Given** une valeur importée vaut zéro et l'existant est non vide,
**When** je confirme sans sélectionner Remplacer,
**Then** l'ancien nombre reste enregistré ; zéro n'est pas substitué silencieusement.

#### AC3

**Given** un champ n'est pas mentionné dans le fichier,
**When** l'import est préparé,
**Then** ce champ demeure intact, jamais assimilé à un effacement.

#### AC4

**Given** une ligne valide concerne un champ encore vide,
**When** je consulte la décision de lot,
**Then** elle est proposée comme nouvelle valeur, sous réserve de confirmation globale.

#### AC5

**Given** une valeur calculée de référence ou une capacité initiale figée est protégée,
**When** un CSV tente de l'écraser,
**Then** la politique de protection correspondante prime sur l'import et bloque toute écriture non autorisée.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-45, FR-44 ; D-PRD-130/A4 ; HIS-04 ; FR-14.
* Dépendances : Stories 8.9–8.11.
* Incrément I4 ; CSV manuel Scrum/Kanban, sans création de tickets Jira ni de cycles implicites. Aucune validation individuelle préalable demandée.
**Statut de la Story 8.12 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.13: Confirmer explicitement le remplacement d'une métrique existante
**Jira :** https://lmn24.atlassian.net/browse/SMN-171

**En tant que** Scrum Master Administrateur,
**je veux** choisir au cas par cas quelles valeurs importées remplacent les chiffres présents,
**afin de** corriger mon historique de manière volontaire et traçable.

**Critères d'acceptation :**

#### AC1

**Given** un champ possède déjà une valeur source,
**When** je sélectionne Remplacer pour cette métrique,
**Then** la comparaison cycle, métrique, avant/après et qualité est affichée avant confirmation.

#### AC2

**Given** une autre métrique du même fichier n'est pas sélectionnée pour remplacement,
**When** je confirme les corrections choisies,
**Then** sa valeur préexistante reste strictement inchangée.

#### AC3

**Given** une métrique source du cycle est Clôturée,
**When** un remplacement est demandé,
**Then** la correction est refusée tant que le cycle n'a pas été rouvert volontairement.

#### AC4

**Given** une correction explicite est autorisée,
**When** elle est appliquée,
**Then** ancienne valeur, nouvelle valeur, qualité, auteur et lot d'import sont historisés.

#### AC5

**Given** un import propose une modification d'un instantané de clôture ou d'un PDF ancien,
**When** je valide le lot,
**Then** les clichés et documents antérieurs ne sont pas réécrits ; seule une nouvelle clôture pourra créer Vn distinct.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-45, FR-46, FR-44 ; D-PRD-130/A4 ; HIS-04/05.
* Dépendances : Story 8.12 et protections de réouverture Epics 4/7.
* Incrément I4 ; CSV manuel Scrum/Kanban, sans création de tickets Jira ni de cycles implicites. Aucune validation individuelle préalable demandée.
**Statut de la Story 8.13 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.14: Appliquer un CSV validé en une seule transaction atomique
**Jira :** https://lmn24.atlassian.net/browse/SMN-172

**En tant que** Scrum Master Administrateur,
**je veux** importer uniquement des valeurs et remplacements validés par confirmation globale,
**afin de** ne jamais me retrouver avec un fichier traité à moitié.

**Critères d'acceptation :**

#### AC1

**Given** l'aperçu complet est valide et les choix Conserver/Remplacer sont connus,
**When** je confirme explicitement l'import,
**Then** toutes les écritures autorisées sont appliquées dans une seule transaction tout ou rien.

#### AC2

**Given** une ligne ou un droit devient invalide après prévisualisation,
**When** la confirmation est exécutée,
**Then** le serveur revérifie le lot et refuse intégralement l'import sans appliquer les autres lignes.

#### AC3

**Given** une panne de base de données survient au milieu de l'écriture,
**When** la transaction échoue,
**Then** aucune valeur du lot n'est persistée et le succès global n'est pas annoncé.

#### AC4

**Given** certaines lignes visent des valeurs déjà présentes à conserver,
**When** un lot globalement valide est confirmé,
**Then** ces lignes restent inchangées et sont comptées comme Conservées, non comme erreurs ni succès d'écrasement.

#### AC5

**Given** une confirmation ne s'effectue jamais,
**When** le traitement se termine,
**Then** aucune écriture métier ni recalcul de KPI définitif n'est déclenché par la prévisualisation seule.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-44, FR-45, FR-49 ; D-PRD-130/A4 ; HIS-03/04/08.
* Dépendances : Stories 8.9–8.13 ; transaction et journal d'audit Epic 2.
* Incrément I4 ; CSV manuel Scrum/Kanban, sans création de tickets Jira ni de cycles implicites. Aucune validation individuelle préalable demandée.
**Statut de la Story 8.14 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.15: Tracer les imports CSV et distinguer aperçu, réussite et échec
**Jira :** https://lmn24.atlassian.net/browse/SMN-173

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les résultats réels de chaque tentative d'import historique,
**afin de** expliquer comment les métriques ont été alimentées sans cacher les refus.

**Critères d'acceptation :**

#### AC1

**Given** un fichier CSV est soumis à validation,
**When** le contrôle s'achève,
**Then** un compte rendu de tentative conserve date/heure, auteur, nom ou identifiant de lot et périmètre connu.

#### AC2

**Given** un fichier est refusé pour doublon ou ligne erronée,
**When** je consulte son journal,
**Then** le statut Échec/Refus et les erreurs de lignes apparaissent sans fausse réussite partielle.

#### AC3

**Given** un aperçu valide est annulé,
**When** l'opération se termine,
**Then** le journal distingue Aperçu annulé et Import confirmé.

#### AC4

**Given** un import réussit,
**When** j'ouvre ses résultats,
**Then** lignes lues, reconnues, appliquées, conservées et rejetées sont comptabilisées avec cohérence et identifiants de cycles affectés.

#### AC5

**Given** un rapport d'import est consulté,
**When** j'examine son historique,
**Then** l'audit d'opération reste distinct des révisions de valeurs métier ; aucun secret ni archivage obligatoire du CSV brut n'est supposé.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-49, FR-46 ; HIS-08 ; D-PRD-130/A4 ; SEC-04.
* Dépendances : Stories 8.9–8.14 ; journal d'audit Epic 2.
* Incrément I4 ; CSV manuel Scrum/Kanban, sans création de tickets Jira ni de cycles implicites. Aucune validation individuelle préalable demandée.
**Statut de la Story 8.15 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.16: Consulter les valeurs reprises et leurs révisions historiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-174

**En tant que** Scrum Master Administrateur,
**je veux** consulter l'origine, les qualités et les corrections de métriques historiques,
**afin de** savoir ce qui était connu, estimé, importé ou corrigé sans altérer les chiffres.

**Critères d'acceptation :**

#### AC1

**Given** une valeur a été saisie à la main,
**When** j'affiche ses détails,
**Then** sa source manuelle, sa qualité et son instant de saisie sont distingués de la date historique du cycle.

#### AC2

**Given** une valeur a été importée d'un CSV confirmé,
**When** je consulte son historique,
**Then** le lot et la ligne d'origine sont retrouvables sans confondre l'import avec une mesure faite à l'époque.

#### AC3

**Given** une métrique existante a été remplacée avec accord,
**When** je consulte ses révisions,
**Then** les anciennes et nouvelles valeurs, qualités et auteurs restent consultables.

#### AC4

**Given** une estimation a été corrigée en valeur connue,
**When** je consulte les deux versions,
**Then** l'ancienne estimation n'est pas transformée rétroactivement en mesure historiquement certaine.

#### AC5

**Given** une consultation de ces historiques est demandée par un Utilisateur non autorisé,
**When** le serveur filtre la réponse,
**Then** seules les synthèses collectives permises sont exposées ; aucune donnée personnelle ni opération de modification.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-45, FR-46, FR-49 ; HIS-04/05/08 ; D-PRD-130/A2/A4.
* Dépendances : Stories 8.5–8.7 et 8.12–8.15.
* Incrément I4 ; reprise manuelle historique Scrum, CSV consolidé Scrum/Kanban. Respect des protections Vn et confidentialité du MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.17: Clôturer volontairement un bilan historique partiel sans fabriquer de preuves
**Jira :** https://lmn24.atlassian.net/browse/SMN-175

**En tant que** Scrum Master Administrateur,
**je veux** clôturer un ancien Sprint même lorsque certaines mesures sont indisponibles,
**afin de** le rendre exploitable tout en conservant le niveau réel de connaissance historique.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint historique est Terminé et comporte seulement quelques valeurs retrouvées,
**When** je demande sa clôture volontaire,
**Then** l'absence de KPI, d'objectif ou d'événement historique ne bloque pas à elle seule la clôture.

#### AC2

**Given** aucun état ancien fiable des six registres qualitatifs n'est documenté,
**When** la clôture est préparée,
**Then** un état « historique indisponible » est distingué des fiches centrales actuelles, jamais converties en photographie passée.

#### AC3

**Given** une information qualitative passée est réellement retrouvée,
**When** je la rattache avec date/provenance connue,
**Then** elle peut figurer dans la restitution historique avec ses limites explicites.

#### AC4

**Given** la clôture est confirmée aujourd'hui,
**When** un premier cliché V1 est produit,
**Then** son horodatage correspond à la clôture SMN actuelle, et non à une clôture fictivement survenue à la date du Sprint.

#### AC5

**Given** une clôture échoue pendant la création du cliché,
**When** le résultat est affiché,
**Then** aucun Sprint Clôturé ou instantané fictivement réussi n'est déclaré ; les anciens PDF restent intacts.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-47, FR-42, FR-46 ; D-PRD-130/A1/A3 ; HIS-06 ; FR-16/41.
* Dépendances : Stories 8.1–8.7 ; clôture versionnée Epic 4 et registres Epic 5.
* Incrément I4 ; reprise manuelle historique Scrum, CSV consolidé Scrum/Kanban. Respect des protections Vn et confidentialité du MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.18: Préserver les versions V1/V2 lors des corrections et reclôtures historiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-176

**En tant que** Scrum Master Administrateur,
**je veux** corriger un ancien bilan après réouverture sans effacer ses versions précédentes,
**afin de** comparer les informations disponibles à chaque clôture SMN.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint historique possède déjà un instantané V1,
**When** je le rouvre volontairement,
**Then** son état revient à Terminé, et V1 reste daté, immuable et consultable.

#### AC2

**Given** je corrige une valeur source pendant la réouverture,
**When** j'enregistre la correction,
**Then** le changement est historisé et aucun PDF émis sur V1 n'est réécrit.

#### AC3

**Given** je reclôture après les corrections,
**When** la transaction réussit,
**Then** un instantané V2 distinct est créé et le bilan Clôturé utilise la dernière version.

#### AC4

**Given** la clôture est effectuée plusieurs fois après réouverture,
**When** les versions sont listées,
**Then** V1, V2, V3 conservent leurs identifiants, dates d'enregistrement et données connues à chacune.

#### AC5

**Given** un état historique est inconnu sur V1 ou V2,
**When** la version est restituée,
**Then** l'inconnu reste explicite et n'est pas remplacé par l'état récent de la fiche qualitative.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-47, FR-45, FR-46 ; D-PRD-130/A3 ; HIS-06 ; FR-41.
* Dépendances : Story 8.17 ; moteur de réouverture/reclôture Epics 4/5.
* Incrément I4 ; reprise manuelle historique Scrum, CSV consolidé Scrum/Kanban. Respect des protections Vn et confidentialité du MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.19: Intégrer les Sprints repris aux tendances uniquement lorsqu'ils sont fiables
**Jira :** https://lmn24.atlassian.net/browse/SMN-177

**En tant que** Scrum Master Administrateur,
**je veux** retrouver des Sprints historiques dans les séries de tendance éligibles,
**afin de** observer des évolutions réelles sans fausses continuités statistiques.

**Critères d'acceptation :**

#### AC1

**Given** plusieurs Sprints historiques ont été créés mais ne sont pas clôturés,
**When** une tendance est consultée,
**Then** ces cycles n'apparaissent pas comme points de tendance clôturés.

#### AC2

**Given** un Sprint repris est Clôturé avec SP terminés disponibles,
**When** une tendance Scrum est calculée,
**Then** il peut figurer selon sa date de cycle et sa métrique source exploitable, sans être exclu seulement parce qu'il a été rétrosaisi.

#### AC3

**Given** plus de cinq Sprints clôturés sont éligibles dans l'équipe,
**When** j'ouvre le graphique,
**Then** au plus cinq cycles sont sélectionnés dans l'ordre chronologique.

#### AC4

**Given** je consulte un ancien Sprint rétrosaisi,
**When** la fenêtre est sélectionnée,
**Then** aucun Sprint postérieur à sa date n'est inclus dans ses tendances historiques.

#### AC5

**Given** une métrique manque ou la qualité est Estimée,
**When** le graphique est composé,
**Then** aucun zéro n'est inventé et la qualité Estimée est identifiable, jamais présentée comme mesure certaine.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-48, FR-46, FR-47 ; HIS-07 ; D-PRD-076/077/078 ; D-PRD-130/A2.
* Dépendances : Stories 8.1, 8.4–8.7 et 8.17 ; tendances Scrum Epic 4.
* Incrément I4 ; reprise manuelle historique Scrum, CSV consolidé Scrum/Kanban. Respect des protections Vn et confidentialité du MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.

### Story 8.20: Rendre les rapports historiques transparents et protéger les PDF existants
**Jira :** https://lmn24.atlassian.net/browse/SMN-178

**En tant que** Scrum Master Administrateur,
**je veux** exporter un bilan de reprise historique avec ses lacunes et sa provenance,
**afin de** partager une synthèse utile sans présenter une reconstruction comme une archive d'époque.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint rétrosaisi est sélectionné pour rapport,
**When** je lance la préparation HTML,
**Then** l'en-tête signale le Sprint historique, ses dates réelles et le caractère rétrospectif de la saisie.

#### AC2

**Given** des chiffres sont Connus, Estimés ou Non renseignés,
**When** les rubriques sont produites,
**Then** les qualités et absences sont visibles sans faux zéros, réunions supposées ni déductions de capacité fictives.

#### AC3

**Given** le Sprint dispose d'une version de clôture V1 ou V2,
**When** je compose le rapport,
**Then** la dernière version connue du cycle clôturé est utilisée ; les états historiques non prouvés restent indisponibles.

#### AC4

**Given** un rapport est seulement prévisualisé en HTML,
**When** je ferme la préparation,
**Then** aucun PDF définitif ni archive ne sont générés.

#### AC5

**Given** un PDF exporté existait avant une correction ou reclôture du Sprint,
**When** j'exporte une nouvelle version,
**Then** l'ancien PDF archivé conserve ses octets et métadonnées ; chaque nouvel export réussi produit une archive distincte et immuable.

#### Traçabilité et dépendances

* Epic SMN-8 ; FR-47, FR-48, FR-46 ; HIS-06/07 ; D-PRD-130/A1/A2/A3 ; D-PRD-134.
* Dépendances : Stories 8.1–8.19 ; bibliothèque HTML/PDF Epic 6.
* Incrément I4 ; reprise manuelle historique Scrum, CSV consolidé Scrum/Kanban. Respect des protections Vn et confidentialité du MVP.
  **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026, sans développement ni recette.**

#### Validation fonctionnelle globale

Les 20 Stories 8.1 à 8.20 de l'Epic 8 ont été approuvées globalement sans réserve par l'utilisateur le 19/10/2026. Cela ne constitue ni une livraison ni une recette.
**Validation :** validée fonctionnellement sans réserve le 19/10/2026, sans développement ni recette attestés.


## Epic 9: Préparer des briefs IA confidentiels et conserver les analyses
Préparer des TXT plats à transmettre manuellement, archiver leurs versions exactes et gérer des analyses distinctes des faits mesurés.
**FRs couvertes :** FR-50, FR-51, FR-52, FR-53, FR-54, FR-55, FR-56, FR-57.

### Story 9.1: Démarrer un brief IA depuis un cycle, son bilan ou un rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-179

**En tant que** Scrum Master Administrateur,
**je veux** ouvrir la préparation d'un brief depuis mon activité courante,
**afin de** retrouver immédiatement le contexte sans saisie redondante.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint ou une période Kanban est consulté,
**When** je choisis « Générer un brief IA »,
**Then** la préparation reprend son identifiant, équipe, produit, mode, dates et statut sans nouveau cycle.

#### AC2

**Given** je suis dans le bilan du cycle ou dans la préparation d'un rapport,
**When** j'ouvre l'action de brief,
**Then** les trois points d'entrée aboutissent au même parcours de préparation.

#### AC3

**Given** la période est non Clôturée,
**When** j'ouvre le formulaire,
**Then** son caractère provisoire et l'instant de préparation sont indiqués sans qualifier le bilan comme définitif.

#### AC4

**Given** je ferme la préparation avant finalisation,
**When** je reviens à mon écran,
**Then** aucune valeur métier, archive TXT ou analyse n'est créée ou modifiée.

#### AC5

**Given** un Utilisateur en lecture seule tente de déclencher une génération,
**When** le serveur vérifie les droits,
**Then** la création de brouillon de brief lui est refusée sans exposition de champs individuels.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-50 ; D-PRD-126/IA-01 ; F-98/103.
* Dépendances antérieures : Cycles Scrum/Kanban Epics 4/7 ; préparation de rapport Epic 6.
* Incrément I5, MVP Scrum/Kanban, profils Administrateur et Utilisateur ; transmission à l'IA exclusivement manuelle, sans API ou connecteur au MVP.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.2: Disposer de modèles initiaux de briefs réutilisables
**Jira :** https://lmn24.atlassian.net/browse/SMN-188

En tant que Scrum Master Administrateur, je veux disposer de plusieurs modèles initiaux de briefs, afin de préparer rapidement des demandes adaptées à un bilan, à une tendance ou aux risques de mon équipe.

**Critères d'acceptation :**

#### AC1

**Given** une installation SMN opérationnelle,
**When** j'ouvre le catalogue des modèles de briefs,
**Then** plusieurs modèles existent pour le bilan d'un cycle, les tendances et les risques ou dépendances.

#### AC2

**Given** un modèle initial est sélectionné,
**When** je consulte ses paramètres,
**Then** ses rubriques, questions, consignes et sélections de données sont visibles.

#### AC3

**Given** un modèle est utilisé pour Scrum ou Kanban,
**When** le brief est préparé,
**Then** seules les métriques correspondant au mode actif sont proposées.

#### AC4

**Given** des données sélectionnées manquent,
**When** le modèle compose le brouillon,
**Then** aucune valeur ni conclusion fictive n'est créée.

#### AC5

**Given** un modèle demande un champ individuel interdit,
**When** la projection du brief est construite,
**Then** la règle obligatoire de confidentialité l'exclut sans exception.

#### Traçabilité et dépendances

Epic SMN-9, FR-51 et FR-52, D-PRD-126/IA-02/03. Dépendance : Story 9.1. Incrément I5. Validation fonctionnelle globale acquise le 19/10/2026 ; aucun développement ni recette.

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.3: Créer, modifier et gérer ses modèles de briefs en administration
**Jira :** https://lmn24.atlassian.net/browse/SMN-180

**En tant que** Scrum Master Administrateur,
**je veux** maintenir des modèles adaptés à mon équipe et à mes usages,
**afin de** réutiliser mes réglages de briefs plutôt que répéter la même préparation.

**Critères d'acceptation :**

#### AC1

**Given** un Administrateur ouvre un modèle,
**When** il change l'ordre des rubriques, la profondeur, les données ou les consignes,
**Then** les réglages explicitement choisis sont sauvegardés pour les futures utilisations.

#### AC2

**Given** un besoin n'est couvert par aucun modèle,
**When** je crée un modèle nommé,
**Then** un modèle distinct est conservé et réutilisable.

#### AC3

**Given** je demande de supprimer ou désactiver un modèle déjà référencé,
**When** les conséquences sont présentées,
**Then** les briefs TXT déjà archivés restent intacts et leur origine demeure identifiable.

#### AC4

**Given** un Utilisateur appelle une API de modification de modèle,
**When** le serveur valide son profil,
**Then** l'opération est refusée.

#### AC5

**Given** je modifie un modèle après la finalisation d'un brief,
**When** je consulte l'archive ancienne,
**Then** son texte final et ses métadonnées ne changent pas.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-51 ; D-PRD-126/IA-02 ; F-103/104.
* Dépendances antérieures : Story 9.2 ; accès Administrateur Epic 1.
* Incrément I5, MVP Scrum/Kanban, profils Administrateur et Utilisateur ; transmission à l'IA exclusivement manuelle, sans API ou connecteur au MVP.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.4: Adapter ponctuellement un modèle sans modifier sa définition
**Jira :** https://lmn24.atlassian.net/browse/SMN-181

**En tant que** Scrum Master Administrateur,
**je veux** ajuster les paramètres d'un seul brief,
**afin de** produire une demande ciblée sans changer mes modèles de référence.

**Critères d'acceptation :**

#### AC1

**Given** un modèle est sélectionné,
**When** j'ouvre la préparation,
**Then** ses sections, choix de données, profondeur historique et consignes sont préremplis.

#### AC2

**Given** je modifie seulement la préparation courante,
**When** j'actualise son contenu,
**Then** les réglages du modèle enregistré demeurent inchangés.

#### AC3

**Given** je veux changer durablement le modèle,
**When** je choisis explicitement Enregistrer le modèle,
**Then** une nouvelle révision de modèle est créée selon les droits.

#### AC4

**Given** une modification du modèle survient après ouverture du brouillon,
**When** je poursuis ma préparation,
**Then** le contenu ne mélange pas silencieusement les deux configurations et un rafraîchissement est proposé si nécessaire.

#### AC5

**Given** j'abandonne mes ajustements ponctuels,
**When** je recharge le modèle,
**Then** les valeurs persistées initiales sont retrouvées sans écriture métier.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-51, FR-52 ; D-PRD-126/IA-02/03 ; RPT-03/04.
* Dépendances antérieures : Stories 9.1–9.3.
* Incrément I5, MVP Scrum/Kanban, profils Administrateur et Utilisateur ; transmission à l'IA exclusivement manuelle, sans API ou connecteur au MVP.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.5: Sélectionner les faits et métriques collectives avec provenance
**Jira :** https://lmn24.atlassian.net/browse/SMN-182

**En tant que** Scrum Master Administrateur,
**je veux** choisir les informations collectives utiles au brief,
**afin de** disposer de données exactes et explicables sans exposer les membres.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint contient SP, objectifs et capacité collective,
**When** je sélectionne les indicateurs disponibles,
**Then** les unités SP, JH et pourcentage restent distinctes et les valeurs source ne sont pas inventées.

#### AC2

**Given** une période Kanban comporte des flux,
**When** je prépare sa projection,
**Then** commencés, Throughput, WIP et délais moyens sont fournis selon leurs conventions sans métrique Scrum fictive.

#### AC3

**Given** des risques, obstacles, dépendances, décisions, actions et faits marquants existent,
**When** je sélectionne le contexte collectif autorisé,
**Then** seuls les éléments éligibles et les états historiques applicables sont retenus.

#### AC4

**Given** une valeur source est vide, estimée, calculée ou provisoire,
**When** elle figure dans la projection,
**Then** sa qualité/provenance reste visible et vide n'est jamais converti en zéro.

#### AC5

**Given** la sélection porte sur un cycle ancien clôturé,
**When** les données sont lues,
**Then** la dernière version de clôture applicable est respectée sans substituer des états qualitatifs récents aux états passés.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-52, FR-53 ; D-PRD-126/IA-03/04 ; FR-14/20/22/41.
* Dépendances antérieures : Story 9.1 ; projections de reporting Epic 6 et registres Epic 5.
* Incrément I5, MVP Scrum/Kanban, profils Administrateur et Utilisateur ; transmission à l'IA exclusivement manuelle, sans API ou connecteur au MVP.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.6: Construire un TXT plat aux rubriques et sources explicites
**Jira :** https://lmn24.atlassian.net/browse/SMN-183

**En tant que** Scrum Master Administrateur,
**je veux** obtenir un texte structuré utilisable hors de SMN,
**afin de** transmettre le contexte sans graphiques ni interprétation masquée.

**Critères d'acceptation :**

#### AC1

**Given** la projection collective est disponible,
**When** je génère l'aperçu TXT,
**Then** un texte brut identifie équipe, produit, mode, cycle, dates, statut, date de préparation et modèle.

#### AC2

**Given** des faits et analyses humaines sont choisis,
**When** les sections du TXT sont composées,
**Then** faits chiffrés, contexte qualitatif, observations humaines et consignes à l'IA apparaissent dans des rubriques distinctes.

#### AC3

**Given** une donnée est Non renseignée, Estimée ou provisoire,
**When** le texte est généré,
**Then** elle conserve sa qualification et n'est pas présentée comme un constat certain.

#### AC4

**Given** un graphique du reporting HTML est sélectionné,
**When** la version TXT est préparée,
**Then** aucune image, graphique ou encodage propriétaire ne figure dans le document.

#### AC5

**Given** le modèle précise ordre ou profondeur historique,
**When** je compose le TXT,
**Then** ces paramètres sont respectés pour les sources disponibles et la limite de cinq cycles clôturés des tendances reste applicable.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-52 ; D-PRD-126/IA-03 ; F-103/108 ; RPT-07.
* Dépendances : Stories 9.4–9.5.
* Incrément I5 ; TXT plat et communication manuelle uniquement, sans API IA ; sécurité Admin/Utilisateur appliquée côté serveur.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.7: Ajouter et réviser ses observations et questions à l'IA
**Jira :** https://lmn24.atlassian.net/browse/SMN-184

**En tant que** Scrum Master Administrateur,
**je veux** enrichir le brief avec mon contexte collectif et mes questions,
**afin de** orienter l'analyse sans modifier les métriques source.

**Critères d'acceptation :**

#### AC1

**Given** un brouillon TXT est prêt,
**When** je saisis une observation humaine collective,
**Then** le contenu est présenté dans une rubrique différente des faits et KPI.

#### AC2

**Given** je rédige une question ou une consigne,
**When** je prévisualise,
**Then** la consigne est rendue comme demande à l'IA, non comme résultat IA déjà obtenu.

#### AC3

**Given** je modifie les paragraphes du brouillon,
**When** je reviens à la projection,
**Then** ni les Story Points, ni les KPI Kanban, ni les fiches qualitatives ne sont changés.

#### AC4

**Given** un texte libre contient potentiellement une identité ou une information confidentielle,
**When** j'enregistre le brouillon,
**Then** il reste à vérifier explicitement avant toute finalisation.

#### AC5

**Given** un texte libre n'est pas renseigné,
**When** je compose le TXT,
**Then** aucune conclusion ou hypothèse artificielle n'est insérée pour remplir l'espace.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-52, FR-53 ; D-PRD-126/IA-03/04 ; F-104/109.
* Dépendances : Story 9.6.
* Incrément I5 ; TXT plat et communication manuelle uniquement, sans API IA ; sécurité Admin/Utilisateur appliquée côté serveur.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.8: Exclure les informations individuelles dès la projection du brief
**Jira :** https://lmn24.atlassian.net/browse/SMN-185

**En tant que** Scrum Master Administrateur,
**je veux** garantir l'absence de champs personnels structurés dans mes briefs,
**afin de** minimiser la divulgation involontaire de données sensibles.

**Critères d'acceptation :**

#### AC1

**Given** un cycle comporte des fiches de membres,
**When** le service construit la projection TXT,
**Then** les noms, e-mails, calendriers, absences, capacités individuelles et appréciations personnelles structurés sont exclus.

#### AC2

**Given** un modèle demande l'inclusion de données individuelles,
**When** le service prépare le brouillon,
**Then** l'exclusion obligatoire reste appliquée côté serveur malgré le modèle.

#### AC3

**Given** un Utilisateur non administrateur essaie d'obtenir les données source exclues par un appel direct,
**When** l'API reçoit la requête,
**Then** les droits et les filtres serveur bloquent la divulgation.

#### AC4

**Given** un rapport HTML contient une attribution nominative permise pour une action collective,
**When** le brief TXT est créé,
**Then** la règle plus stricte du TXT empêche une copie automatique de données individuelles via le moteur commun.

#### AC5

**Given** un texte libre contenant un nom est présent,
**When** la projection structurée est contrôlée,
**Then** le filtrage des champs structurés n'est pas présenté comme une garantie d'anonymisation du texte libre ; sa revue explicite reste requise.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-53, FR-52 ; D-PRD-126/IA-04 ; F-106/108 ; AD-31.
* Dépendances : Stories 9.5–9.7 ; sécurité serveur Epic 1.
* Incrément I5 ; TXT plat et communication manuelle uniquement, sans API IA ; sécurité Admin/Utilisateur appliquée côté serveur.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.9: Prévisualiser intégralement le TXT et valider la confidentialité
**Jira :** https://lmn24.atlassian.net/browse/SMN-186

**En tant que** Scrum Master Administrateur,
**je veux** relire le contenu exact avant de décider de le partager,
**afin de** retirer les éléments personnels ou secrets sans croire à une vérification automatique parfaite.

**Critères d'acceptation :**

#### AC1

**Given** un brouillon TXT est préparé,
**When** je demande sa vérification,
**Then** la totalité du texte à finaliser est affichée, y compris les commentaires et consignes libres.

#### AC2

**Given** un avertissement de confidentialité apparaît,
**When** je lis son contenu,
**Then** il signale explicitement les noms, informations privées et secrets possibles dans les textes libres.

#### AC3

**Given** je détecte un passage sensible,
**When** je le retire ou le modifie,
**Then** la prévisualisation entière est réactualisée avant nouvelle confirmation.

#### AC4

**Given** je n'ai pas validé la vérification du texte courant,
**When** je cherche à finaliser ou présenter le TXT comme prêt au partage,
**Then** l'action est bloquée jusqu'à une validation explicite de la version affichée.

#### AC5

**Given** je modifie le contenu après validation,
**When** je reviens à la finalisation,
**Then** la validation précédente n'est plus valable et une nouvelle revue est nécessaire.


**Traçabilité UX ajoutée lors de la revue finale :** UX-DR18 — Prévisualisation TXT complète et validation explicite de la confidentialité.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-53 ; D-PRD-126/IA-04 ; F-109 ; AD-31.
* Dépendances : Stories 9.6–9.8.
* Incrément I5 ; TXT plat et communication manuelle uniquement, sans API IA ; sécurité Admin/Utilisateur appliquée côté serveur.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.10: Imposer une transmission manuelle sans appel automatique à une IA
**Jira :** https://lmn24.atlassian.net/browse/SMN-187

**En tant que** Scrum Master Administrateur,
**je veux** garder la maîtrise du service IA auquel je transmets mon TXT,
**afin de** décider personnellement si et quand une donnée sort de SMN.

**Critères d'acceptation :**

#### AC1

**Given** je prépare ou prévisualise un TXT,
**When** j'observe les échanges de l'application,
**Then** aucun texte n'est transmis à un prestataire IA externe automatiquement.

#### AC2

**Given** je valide la confidentialité du texte,
**When** je demande sa finalisation,
**Then** aucun appel automatique à une IA ni création automatique d'analyse n'a lieu.

#### AC3

**Given** je souhaite utiliser une IA externe,
**When** je consulte le parcours,
**Then** SMN indique que l'envoi/copier-coller vers ce service est une démarche volontaire à réaliser hors de l'application.

#### AC4

**Given** je consulte les informations de confidentialité,
**When** je lis les avertissements,
**Then** SMN ne prétend pas contrôler la conservation ou les politiques du prestataire externe choisi.

#### AC5

**Given** un modèle comporte une instruction de type « envoyer » ou une URL,
**When** la préparation fonctionne,
**Then** ces textes ne sont jamais interprétés comme des commandes réseau ou des appels IA automatiques.

#### Traçabilité et dépendances

* Epic : SMN-9 ; FR-53, FR-55 ; D-PRD-126/IA-04/06 ; F-102/106/108.
* Dépendances : Story 9.9 et permissions Epic 1.
* Incrément I5 ; TXT plat et communication manuelle uniquement, sans API IA ; sécurité Admin/Utilisateur appliquée côté serveur.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.11: Finaliser et archiver le texte TXT exact de manière immuable
**Jira :** https://lmn24.atlassian.net/browse/SMN-189

**En tant que** Scrum Master Administrateur,
**je veux** conserver le contenu du brief définitivement approuvé,
**afin de** retrouver la même version malgré les évolutions des cycles et des modèles.

**Critères d'acceptation :**

#### AC1

**Given** un brouillon complet a été vérifié et approuvé pour confidentialité,
**When** je clique explicitement Finaliser,
**Then** le texte final exact est archivé avec identifiant stable, date, cycle et référence de modèle.

#### AC2

**Given** une simple prévisualisation est annulée,
**When** je quitte la préparation,
**Then** aucune archive TXT finale n'est créée.

#### AC3

**Given** les métriques sources ou le modèle évoluent après finalisation,
**When** j'ouvre l'ancien brief,
**Then** le contenu archivé reste exactement celui finalisé, sans recomposition depuis les sources actuelles.

#### AC4

**Given** une modification en place du TXT final est tentée,
**When** le serveur reçoit l'écriture,
**Then** l'opération est refusée : la duplication est le seul parcours normal de nouvelle version de brief.

#### AC5

**Given** l'écriture ou la cohérence entre fichier et métadonnées échoue,
**When** la finalisation se termine,
**Then** aucune archive réussie mais incomplète n'est annoncée et l'erreur est explicitée.

#### Traçabilité et dépendances

* Epic SMN-9 : FR-54, FR-53 ; D-PRD-126/IA-05 ; F-99/107 ; AD-27.
* Dépendances : Stories 9.6–9.10 ; stockage privé et audit Epics 1/2.
* Incrément I5, MVP Scrum/Kanban. Aucune API IA, envoi automatique ni surveillance du prestataire externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.12: Retrouver, consulter et télécharger les briefs TXT privés
**Jira :** https://lmn24.atlassian.net/browse/SMN-190

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les TXT archivé et les récupérer sans nouveau calcul,
**afin de** réutiliser le document d'origine depuis la bibliothèque privée.

**Critères d'acceptation :**

#### AC1

**Given** un brief est archivé,
**When** j'ouvre la liste privée des briefs,
**Then** les références, dates, cycles, modèle et statut connus permettent de retrouver le TXT.

#### AC2

**Given** un Administrateur demande l'ouverture d'une archive autorisée,
**When** le serveur la lit,
**Then** le texte exact sauvegardé est retourné sans modification.

#### AC3

**Given** un Utilisateur authentifié dispose du droit de lire un brief autorisé,
**When** il télécharge l'archive,
**Then** le fichier existant peut être récupéré en lecture seule sans nouvelle génération.

#### AC4

**Given** une personne anonyme ou non autorisée connaît l'identifiant d'un brief,
**When** elle appelle son URL directement,
**Then** aucun texte privé n'est délivré.

#### AC5

**Given** un fichier est absent ou altéré,
**When** le téléchargement est demandé,
**Then** une erreur d'intégrité ou de disponibilité apparaît, sans reconstruction silencieuse.

#### Traçabilité et dépendances

* Epic SMN-9 : FR-54, FR-53 ; D-PRD-126/IA-05 ; AD-31 ; F-107.
* Dépendances : Story 9.11 ; matrice de droits Epic 1.
* Incrément I5, MVP Scrum/Kanban. Aucune API IA, envoi automatique ni surveillance du prestataire externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.13: Dupliquer un brief en préservant son parent et ses analyses
**Jira :** https://lmn24.atlassian.net/browse/SMN-191

**En tant que** Scrum Master Administrateur,
**je veux** créer une variante révisable d'un ancien brief,
**afin de** essayer d'autres consignes sans modifier le document d'origine.

**Critères d'acceptation :**

#### AC1

**Given** un TXT est archivé,
**When** je choisis Dupliquer,
**Then** un nouveau brouillon possède son propre identifiant et un lien explicite vers le parent.

#### AC2

**Given** la copie s'ouvre,
**When** je change ses consignes ou des passages collectifs,
**Then** seul le nouveau brouillon est modifié, sans écriture sur l'archive parent.

#### AC3

**Given** le parent a une réponse IA enregistrée,
**When** je consulte le nouveau brouillon,
**Then** sa réponse IA n'est pas copiée comme analyse active du nouveau brief.

#### AC4

**Given** je finalise la copie après validation de confidentialité,
**When** l'opération réussit,
**Then** une nouvelle archive TXT distincte est créée et le lien de parenté reste consultable.

#### AC5

**Given** la duplication est annulée ou échoue,
**When** je consulte le parent,
**Then** son contenu, ses métadonnées et son analyse demeurent intacts.

#### Traçabilité et dépendances

* Epic SMN-9 : FR-54 ; D-PRD-126/IA-05 ; F-99/107.
* Dépendances : Stories 9.11–9.12 ; brouillon et confidentialité 9.7–9.9.
* Incrément I5, MVP Scrum/Kanban. Aucune API IA, envoi automatique ni surveillance du prestataire externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.14: Coller manuellement une réponse IA dans le brief d'origine
**Jira :** https://lmn24.atlassian.net/browse/SMN-192

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer une réponse reçue hors de SMN,
**afin de** conserver l'interprétation et la relier au texte réellement transmis.

**Critères d'acceptation :**

#### AC1

**Given** un TXT archivé existe et une réponse IA a été reçue manuellement,
**When** j'ouvre sa fiche et colle la réponse,
**Then** le texte est associé à l'identifiant exact du brief, sans altérer celui-ci.

#### AC2

**Given** le fournisseur ou modèle IA est connu,
**When** je le renseigne facultativement,
**Then** l'origine déclarée est conservée sans inventer de fournisseur si elle manque.

#### AC3

**Given** la réponse est sauvegardée,
**When** je consulte les métadonnées,
**Then** date d'enregistrement, périmètre et origine IA sont identifiables.

#### AC4

**Given** le texte de réponse est collé,
**When** je navigue entre les deux documents,
**Then** le brief original et la réponse restent consultables ensemble pour comparaison.

#### AC5

**Given** une personne tente de déclencher une IA en appuyant sur Enregistrer la réponse,
**When** le serveur traite l'action,
**Then** seul le contenu collé est persisté, sans requête externe ni affirmation de validation factuelle de l'IA.

#### Traçabilité et dépendances

* Epic SMN-9 : FR-55 ; D-PRD-126/IA-06 ; F-98/100/102.
* Dépendances : Stories 9.11–9.12 ; pas de transmission automatique.
* Incrément I5, MVP Scrum/Kanban. Aucune API IA, envoi automatique ni surveillance du prestataire externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.15: Garantir une seule réponse IA active par brief
**Jira :** https://lmn24.atlassian.net/browse/SMN-193

**En tant que** Scrum Master Administrateur,
**je veux** éviter les réponses IA multiples ou leur écrasement accidentel,
**afin de** savoir quelle analyse est effectivement liée à un TXT donné.

**Critères d'acceptation :**

#### AC1

**Given** un brief possède déjà une analyse IA active,
**When** j'essaie d'en créer une autre,
**Then** le serveur bloque la seconde création et propose de modifier ou supprimer l'existante.

#### AC2

**Given** une analyse IA existe,
**When** j'enregistre une nouvelle version du contenu via l'action Modifier,
**Then** l'objet existant est actualisé avec sa date de modification et non remplacé silencieusement.

#### AC3

**Given** une analyse a été supprimée volontairement,
**When** je colle une nouvelle réponse pour le même brief,
**Then** l'enregistrement devient possible tout en conservant l'archive TXT initiale.

#### AC4

**Given** deux demandes de création sont reçues en même temps pour le même brief,
**When** le serveur les arbitre,
**Then** au plus une analyse IA active est persistée, sans doublon concurrent.

#### AC5

**Given** je duplique un brief avec analyse IA,
**When** j'ouvre la copie,
**Then** la réponse du parent ne devient pas une réponse active de l'enfant sans saisie volontaire.

#### Traçabilité et dépendances

* Epic SMN-9 : FR-55, FR-54 ; D-PRD-126/IA-06 ; F-101.
* Dépendances : Story 9.14 et contrôles de transaction Epic 2.
* Incrément I5, MVP Scrum/Kanban. Aucune API IA, envoi automatique ni surveillance du prestataire externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.16: Créer une analyse humaine distincte de toute réponse IA
**Jira :** https://lmn24.atlassian.net/browse/SMN-194

**En tant que** Scrum Master Administrateur,
**je veux** enregistrer mes interprétations humaines sur un cycle ou un sujet,
**afin de** garder un historique de réflexion sans le présenter comme un résultat de machine.

**Critères d'acceptation :**

#### AC1

**Given** un cycle Scrum/Kanban ou un contexte collectif existe,
**When** je crée une analyse humaine,
**Then** son contenu est enregistré avec origine Humaine, périmètre et date.

#### AC2

**Given** un auteur est connu via la session,
**When** je confirme l'analyse,
**Then** l'auteur et l'horodatage sont mémorisés sans faire croire à une mesure observée.

#### AC3

**Given** je ne dispose pas d'un brief TXT pour cette réflexion,
**When** j'enregistre l'analyse humaine,
**Then** l'analyse peut exister sans brief IA parent obligatoire.

#### AC4

**Given** le texte d'une analyse humaine est modifié,
**When** je le sauvegarde,
**Then** la date de dernière modification est conservée.

#### AC5

**Given** un Utilisateur en lecture seule tente de créer une analyse,
**When** le serveur reçoit sa requête,
**Then** la mutation est refusée et le journal ne reçoit pas de fausse entrée.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-56, FR-52 ; D-PRD-126/IA-07 ; F-98/100/105.
* Dépendances : Cycles déjà définis Epics 4/7 ; journal qualitatif Epic 5 ; aucune autre Story Epic 9 requise.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.17: Consulter le journal commun des analyses humaines et IA
**Jira :** https://lmn24.atlassian.net/browse/SMN-195

**En tant que** Scrum Master Administrateur,
**je veux** retrouver les analyses enregistrées avec leur contexte et origine,
**afin de** réutiliser les réflexions pertinentes sans les mélanger aux faits.

**Critères d'acceptation :**

#### AC1

**Given** des analyses humaines et IA existent,
**When** j'ouvre leur journal,
**Then** toutes les analyses autorisées sont répertoriées avec type, date et périmètre.

#### AC2

**Given** une réponse IA est liée à un brief,
**When** j'ouvre sa fiche depuis le journal,
**Then** un lien mène au TXT original immuable sans régénération.

#### AC3

**Given** plusieurs cycles ou origines sont disponibles,
**When** j'applique les filtres date, cycle et type,
**Then** les analyses recherchées sont retrouvées sans modifier les données.

#### AC4

**Given** le journal est vide,
**When** j'ouvre la page,
**Then** un état vide explicite apparaît sans analyse ou commentaire inventé.

#### AC5

**Given** un Utilisateur consulte le journal,
**When** le serveur produit les résultats,
**Then** seuls les contenus qu'il peut lire sont retournés et aucune opération d'édition ne lui est accordée.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-56, FR-55 ; D-PRD-126/IA-07 ; F-98/100/101.
* Dépendances : Stories 9.14 à 9.16.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.18: Modifier les analyses et identifier les retouches humaines d'un texte IA
**Jira :** https://lmn24.atlassian.net/browse/SMN-196

**En tant que** Scrum Master Administrateur,
**je veux** corriger une interprétation tout en conservant sa provenance,
**afin de** distinguer une réponse brute d'une analyse qui a été éditée.

**Critères d'acceptation :**

#### AC1

**Given** une analyse humaine existe,
**When** l'Administrateur modifie son texte,
**Then** le contenu et la date de dernière modification sont enregistrés avec origine Humaine.

#### AC2

**Given** une réponse IA existe,
**When** je modifie manuellement son contenu,
**Then** une indication « origine IA, retouchée par un humain » est persistée et visible.

#### AC3

**Given** je change une analyse IA,
**When** je consulte sa provenance,
**Then** l'IA éventuellement déclarée, son brief source et sa date d'origine restent identifiables.

#### AC4

**Given** une analyse est retouchée,
**When** je prépare son affichage,
**Then** elle n'est jamais requalifiée comme réponse IA brute, fait observé ou KPI.

#### AC5

**Given** une révision est enregistrée,
**When** je consulte la fiche,
**Then** la date initiale et la dernière modification sont distinctes, sans promettre l'historisation intégrale de toutes les versions du texte.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-56, FR-57 ; D-PRD-126/IA-07/08 ; F-100/105.
* Dépendances : Stories 9.14–9.17.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.19: Supprimer volontairement une analyse sans supprimer le brief TXT
**Jira :** https://lmn24.atlassian.net/browse/SMN-197

**En tant que** Scrum Master Administrateur,
**je veux** retirer une analyse devenue inutile ou inappropriée,
**afin de** garder mes archives de briefs indépendantes de leurs interprétations.

**Critères d'acceptation :**

#### AC1

**Given** une analyse IA est attachée à un brief,
**When** je demande sa suppression,
**Then** une confirmation identifie l'analyse et les conséquences, avant toute écriture.

#### AC2

**Given** j'annule la confirmation,
**When** je retourne au journal,
**Then** aucune analyse ni lien n'est supprimé.

#### AC3

**Given** je confirme la suppression de l'analyse IA,
**When** l'opération réussit,
**Then** le lien actif disparaît mais le fichier TXT final et ses métadonnées restent strictement intacts.

#### AC4

**Given** une réponse IA a été supprimée du brief,
**When** je souhaite en coller une nouvelle,
**Then** l'opération devient à nouveau possible sous la règle une analyse active par brief.

#### AC5

**Given** un PDF ancien contient l'analyse désormais supprimée,
**When** je consulte cette archive,
**Then** son contenu et ses octets ne sont pas reconstruits ni modifiés.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-56, FR-55, FR-54 ; D-PRD-126/IA-06/07 ; F-101.
* Dépendances : Stories 9.11, 9.15, 9.17.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.20: Inclure volontairement des analyses passées dans un nouveau brief TXT
**Jira :** https://lmn24.atlassian.net/browse/SMN-198

**En tant que** Scrum Master Administrateur,
**je veux** sélectionner des observations humaines ou analyses IA antérieures pertinentes,
**afin de** apporter un contexte utile sans alimenter l'IA avec ses réponses passées par défaut.

**Critères d'acceptation :**

#### AC1

**Given** un nouveau brief est préparé avec un modèle quelconque,
**When** j'ouvre la liste des analyses antérieures,
**Then** les analyses IA historiques ne sont jamais présélectionnées par défaut.

#### AC2

**Given** une analyse IA passée est pertinente,
**When** je l'inclus explicitement,
**Then** sa rubrique la marque comme interprétation IA historique avec date et origine connues.

#### AC3

**Given** une analyse humaine passée est disponible,
**When** je la sélectionne,
**Then** elle est présentée comme observation/avis humain et non comme valeur mesurée.

#### AC4

**Given** un modèle comporte une rubrique d'analyses,
**When** je l'applique à un nouveau brief,
**Then** la rubrique n'active pas silencieusement l'inclusion d'analyses IA historiques.

#### AC5

**Given** une analyse sélectionnée possède des textes libres sensibles,
**When** j'examine le TXT complet,
**Then** le contrôle de confidentialité obligatoire est renouvelé avant finalisation et aucun envoi externe automatique n'a lieu.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-56, FR-52, FR-53, FR-57 ; D-PRD-126/IA-03/07/08 ; F-105/108.
* Dépendances : Stories 9.6–9.9 et 9.16–9.18.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.

### Story 9.21: Insérer des analyses choisies dans les rapports HTML/PDF avec attribution
**Jira :** https://lmn24.atlassian.net/browse/SMN-199

**En tant que** Scrum Master Administrateur,
**je veux** présenter les analyses utiles dans les reportings sans les confondre avec les indicateurs,
**afin de** partager des interprétations clairement séparées des faits et données sources.

**Critères d'acceptation :**

#### AC1

**Given** un rapport HTML/PDF est en préparation,
**When** je sélectionne une ou plusieurs analyses autorisées,
**Then** seules celles choisies sont insérées, sans inclusion implicite.

#### AC2

**Given** une analyse humaine est sélectionnée,
**When** elle apparaît dans le rapport,
**Then** son origine Humaine, son contexte et sa date connus sont identifiables.

#### AC3

**Given** une analyse IA retouchée est sélectionnée,
**When** elle apparaît dans le rapport,
**Then** son origine IA, référence de brief et retouche humaine sont explicitement indiquées.

#### AC4

**Given** une analyse est affichée près des KPI,
**When** le rendu HTML ou PDF est consulté,
**Then** les interprétations sont distinguées textuellement des chiffres, sources enregistrées et observations.

#### AC5

**Given** une analyse incluse est ensuite modifiée ou supprimée,
**When** un ancien PDF est consulté,
**Then** ce document reste immuable ; les rapports ultérieurs reflètent les analyses encore disponibles et volontairement sélectionnées.

#### Traçabilité et dépendances

* Epic SMN-9 ; FR-57, FR-56 ; D-PRD-126/IA-08 ; D-PRD-123 ; RPT-02/07.
* Dépendances : Stories 9.16–9.20 ; sélection et export HTML/PDF Epic 6.
* Incrément I5, profils MVP Administrateur/Utilisateur, analyses humaines et IA en texte libre ; aucun envoi automatique à un modèle externe.
* **Statut : VALIDÉE FONCTIONNELLEMENT LE 19/10/2026 ; aucun développement ni test exécuté.**

#### Validation fonctionnelle globale

Approuvée sans réserve avec les 21 Stories de l'Epic 9 le 19/10/2026. Validation de la spécification seulement ; aucun développement, aucune recette exécutée.
**Validation :** approuvée fonctionnellement sans réserve le 19/10/2026 ; ni développement ni tests exécutés.


## Epic 10: Prouver la qualité du MVP et décider de son passage au pilote
Conserver des scénarios, mesures et preuves de recette Scrum/Kanban, contrôler les cinq conditions cumulatives, puis documenter une décision humaine de pilote.
**FRs couvertes :** FR-74, FR-75, FR-76, FR-77, FR-78, FR-79, FR-80, FR-81.

### Story 10.1: Établir la matrice de traçabilité des exigences MVP
**Jira :** https://lmn24.atlassian.net/browse/SMN-200

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** rattacher chaque exigence applicable à des scénarios de recette identifiables,
**afin de** savoir ce qui doit être contrôlé avant de déclarer le MVP prêt.

**Critères d'acceptation :**

#### AC1

**Given** les 81 FR du PRD sont disponibles,
**When** je construis la matrice de recette,
**Then** chaque FR applicable au MVP est reliée à au moins un scénario avec référence, préconditions, données, action et résultat attendu.

#### AC2

**Given** une exigence relève de Scrum, Kanban ou d'une règle commune,
**When** je la classe,
**Then** son périmètre explicite est conservé et les différences entre les modes ne sont pas masquées.

#### AC3

**Given** une exigence relève exclusivement de SAFe/ART v1.0,
**When** je contrôle la couverture du MVP,
**Then** elle est identifiée hors périmètre sans être comptée comme anomalie ni comme scénario MVP réussi.

#### AC4

**Given** une FR ou décision importante est absente des liens,
**When** je consulte la matrice,
**Then** une lacune de couverture est signalée et ne peut pas être présentée comme testée.

#### AC5

**Given** une règle de sécurité, dates, valeur facultative, clôture ou transaction atomique existe,
**When** les scénarios sont identifiés,
**Then** les chemins positifs et négatifs pertinents sont traçables plutôt qu'une simple mention de conformité.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-74 ; D-PRD-129/REC-01 ; NFR-1 à NFR-3.
* Dépendances : PRD validé FR-1 à FR-81 et arbitrages ; aucune Story future Epic 10.
* Incrément I6 ; MVP Scrum/Kanban, SAFe/ART v1.0 hors de la recette MVP ; aucun test réel n'est réputé exécuté par la rédaction de cette Story.
**Statut de la Story 10.1 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.1 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.2: Consigner l'exécution, les preuves et les résultats de chaque scénario
**Jira :** https://lmn24.atlassian.net/browse/SMN-201

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** enregistrer le résultat réel et ses preuves pour chaque scénario,
**afin de** séparer les essais effectivement réalisés des intentions de recette.

**Critères d'acceptation :**

#### AC1

**Given** un scénario de recette est créé,
**When** j'ouvre sa fiche de suivi,
**Then** il est Non exécuté et ne possède aucune preuve de réussite fabriquée.

#### AC2

**Given** une exécution a eu lieu,
**When** je consigne date, version, périmètre, données utilisées et résultat,
**Then** seuls Non exécuté, Réussi, Échoué, Bloqué et Non applicable sont permis avec justification adaptée.

#### AC3

**Given** un scénario a échoué ou est bloqué,
**When** je renseigne le résultat,
**Then** l'anomalie ou le motif de blocage est associé, sans transformer le résultat en succès.

#### AC4

**Given** une exécution réellement réalisée possède captures, traces ou fichiers témoins,
**When** je les référence,
**Then** les preuves sont consultables selon les droits sans déclarer un script exécuté s'il ne l'a pas été.

#### AC5

**Given** une exigence possède plusieurs scénarios dont un Non exécuté,
**When** je calcule le bilan de couverture,
**Then** le scénario non exécuté demeure distinct des réussites et la couverture n'est pas présentée comme intégralement démontrée.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-74 ; D-PRD-129/REC-01 ; SEC-04.
* Dépendances : Story 10.1.
* Incrément I6 ; MVP Scrum/Kanban, SAFe/ART v1.0 hors de la recette MVP ; aucun test réel n'est réputé exécuté par la rédaction de cette Story.
**Statut de la Story 10.2 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.2 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.3: Suivre les anomalies, décisions correctives et contre-tests
**Jira :** https://lmn24.atlassian.net/browse/SMN-202

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** lier chaque échec à un suivi de correction et à une nouvelle exécution,
**afin de** ne pas masquer les défauts pouvant empêcher le pilote.

**Critères d'acceptation :**

#### AC1

**Given** un scénario de recette est Échoué,
**When** j'enregistre une anomalie,
**Then** elle est liée au scénario, à la version et à la preuve de l'échec.

#### AC2

**Given** une anomalie est détectée,
**When** je documente sa criticité et la décision de traitement,
**Then** son statut et son caractère bloquant restent explicites ; aucun seuil de sévérité non arbitré n'est considéré validé.

#### AC3

**Given** une correction est déclarée disponible,
**When** je lance un contre-test,
**Then** son résultat, sa date, sa version et ses preuves sont enregistrés comme nouvelle exécution.

#### AC4

**Given** une anomalie reste ouverte après contre-test,
**When** je consulte la checklist,
**Then** elle demeure listée selon sa sévérité sans disparition automatique.

#### AC5

**Given** un défaut a été corrigé puis retesté avec succès,
**When** je consulte les exécutions,
**Then** l'échec initial et la preuve de réussite ultérieure demeurent traçables.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-74, FR-81 ; D-PRD-129/REC-01/08.
* Dépendances : Stories 10.1–10.2 ; tickets d'anomalies Jira autorisés.
* Incrément I6 ; MVP Scrum/Kanban, SAFe/ART v1.0 hors de la recette MVP ; aucun test réel n'est réputé exécuté par la rédaction de cette Story.
**Statut de la Story 10.3 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.3 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.4: Recetter le parcours Scrum complet de l'installation au rapport
**Jira :** https://lmn24.atlassian.net/browse/SMN-203

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** vérifier de bout en bout les fonctions Scrum du MVP,
**afin de** établir que la chaîne de valeur Scrum fonctionne réellement.

**Critères d'acceptation :**

#### AC1

**Given** une installation de recette Scrum isolée est préparée,
**When** le scénario commence,
**Then** configuration, authentification, produit, équipe, membres, calendriers et absences sont couverts avec version et données identifiées.

#### AC2

**Given** la configuration Scrum est opérationnelle,
**When** le parcours crée un Sprint à la demande,
**Then** objectifs, événements, métriques et capacité sont exercés sans données fictives.

#### AC3

**Given** des éléments qualitatifs sont disponibles,
**When** le scénario suit le Sprint,
**Then** risques, décisions et autres registres liés apparaissent dans le bilan au périmètre prévu.

#### AC4

**Given** le Sprint arrive à son terme,
**When** l'Administrateur le clôture volontairement,
**Then** un instantané est créé et le parcours HTML puis PDF est contrôlé.

#### AC5

**Given** une étape n'a pas été exécutée ou échoue,
**When** je consigne le scénario,
**Then** le résultat global reste Bloqué/Échoué/Non exécuté selon les preuves, jamais Réussi par présomption.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-75 ; D-PRD-129/REC-02 ; Epics 1/3/4/5/6.
* Dépendances : Stories 10.1–10.2 et fonctions Scrum déjà spécifiées.
* Incrément I6 ; MVP Scrum/Kanban, SAFe/ART v1.0 hors de la recette MVP ; aucun test réel n'est réputé exécuté par la rédaction de cette Story.
**Statut de la Story 10.4 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.4 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.5: Recetter le parcours Kanban complet sans cérémonies Scrum artificielles
**Jira :** https://lmn24.atlassian.net/browse/SMN-204

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** vérifier de bout en bout le suivi Kanban dans son mode propre,
**afin de** prouver que la mutualisation n'impose pas de règles Scrum erronées.

**Critères d'acceptation :**

#### AC1

**Given** une installation Kanban de recette est initialisée,
**When** je prépare l'équipe et sa cadence,
**Then** le mois calendaire par défaut ou les rythmes de 7/14 jours sont vérifiés sans changer le mode d'une installation Scrum.

#### AC2

**Given** une période Kanban est créée sur demande,
**When** le scénario déroule la période,
**Then** les trois comptes de flux, les deux délais moyens, les objectifs et la capacité sont testés comme champs facultatifs distincts.

#### AC3

**Given** la période est suivie puis achevée,
**When** l'Administrateur la clôture volontairement,
**Then** les liens qualitatifs, l'instantané et le bilan sont vérifiés sans cérémonie Scrum obligatoire.

#### AC4

**Given** un rapport Kanban est préparé,
**When** la prévisualisation HTML et l'export PDF sont effectués,
**Then** les KPI Kanban restent dans leurs unités et aucun Story Point Scrum n'est fabriqué.

#### AC5

**Given** une installation n'autorise qu'un mode fixe,
**When** les parcours Scrum et Kanban sont évalués,
**Then** deux installations distinctes peuvent servir de preuves, sans conversion de l'une vers l'autre.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-75 ; D-PRD-129/REC-02 ; Epic 7 ; RPT-01.
* Dépendances : Stories 10.1–10.2 et fonctions Kanban existantes Epics 3/5/6/7.
* Incrément I6 ; MVP Scrum/Kanban, SAFe/ART v1.0 hors de la recette MVP ; aucun test réel n'est réputé exécuté par la rédaction de cette Story.
**Statut de la Story 10.5 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.5 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.6: Vérifier les cas limites de génération, statuts et saisies des cycles
**Jira :** https://lmn24.atlassian.net/browse/SMN-205

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** tester les protections métier communes aux deux modes,
**afin de** éviter que des cas particuliers faussent les cycles et leur bilan.

**Critères d'acceptation :**

#### AC1

**Given** un lot demande plus de six cycles ou chevauche une période existante,
**When** je teste les créations unitaires et par lot,
**Then** les refus, prévisualisations et garanties tout-ou-rien sont consignés pour les modes applicables.

#### AC2

**Given** une période passe de À venir à En cours puis Terminé,
**When** je vérifie les transitions,
**Then** la clôture reste manuelle et les transitions sont idempotentes après arrêt/reprise.

#### AC3

**Given** un bilan contient des objectifs, données de flux, SP et capacité,
**When** je teste séparément chaque bloc applicable,
**Then** les sauvegardes n'enregistrent pas les autres brouillons et l'absence de donnée n'est pas assimilée à zéro.

#### AC4

**Given** un événement Tenue/Non tenue/Annulée ou personnalisé est lié au cycle,
**When** je replanifie ses dates,
**Then** les dates historiques protégées restent intouchées et les alertes non bloquantes sont vérifiées.

#### AC5

**Given** un scénario échoue,
**When** j'enregistre l'exécution,
**Then** l'échec et les preuves sont reliés à une anomalie, sans déclarer un parcours complet réussi.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-75, FR-77 ; D-PRD-129/REC-02/04 ; D-PRD-130.
* Dépendances : Stories 10.4–10.5 ; opérations des Epics 3/4/7.
* Incrément I6 ; objectifs non considérés atteints sans mesures réelles ; périmètre Scrum/Kanban, pas SAFe MVP.
**Statut de la Story 10.6 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.6 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.7: Définir avant mesures le protocole des cinq conditions de succès
**Jira :** https://lmn24.atlassian.net/browse/SMN-206

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** fixer un protocole traçable pour évaluer les critères de succès déjà validés,
**afin de** prendre une décision fondée sur des observations et non des impressions.

**Critères d'acceptation :**

#### AC1

**Given** je prépare la recette métier,
**When** je consulte le protocole,
**Then** les cinq conditions sont présentes ensemble avec méthode, données, mesure, preuve attendue et version de référence.

#### AC2

**Given** la condition portant sur les cycles est paramétrée,
**When** je lis sa définition,
**Then** au moins trois Sprints complets et un cycle Kanban en conditions réelles sont exigés, sans remplacement par des simulations.

#### AC3

**Given** les deux critères de temps sont configurés,
**When** je consulte les seuils,
**Then** le rapport de Sprint doit être produit en strictement moins de 30 minutes et la saisie courante être mesurée séparément, au maximum 30 minutes hebdomadaires.

#### AC4

**Given** les conditions tendances et rapports sont définies,
**When** je consulte les contrôles,
**Then** les reprises historiques doivent rester fiables et les rapports HTML/PDF exploitables sans anomalie bloquante.

#### AC5

**Given** l'échantillon et l'outillage sont précisés avant l'observation,
**When** je valide le protocole,
**Then** ces choix sont documentés sans inventer un nombre de mesures supplémentaire prétendument approuvé.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-76 ; D-PRD-129/REC-03 ; PRD section 7.
* Dépendances : Stories 10.1–10.2 ; cinq conditions inchangées du PRD.
* Incrément I6 ; objectifs non considérés atteints sans mesures réelles ; périmètre Scrum/Kanban, pas SAFe MVP.
**Statut de la Story 10.7 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.7 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.8: Conserver les preuves des trois Sprints réels et d'un cycle Kanban
**Jira :** https://lmn24.atlassian.net/browse/SMN-207

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** mesurer la réalisation de cycles de travail authentiques avant le pilote,
**afin de** éviter de valider le produit sur de simples démonstrations.

**Critères d'acceptation :**

#### AC1

**Given** aucune observation réelle n'est encore disponible,
**When** j'ouvre la condition 1,
**Then** son état demeure Non démontrée, sans résultat inventé.

#### AC2

**Given** un Sprint Scrum a été effectivement réalisé,
**When** je consigne le cycle,
**Then** identité, dates, statut, contexte réel, clôture et preuve de reporting sont associés.

#### AC3

**Given** un cycle de reporting Kanban réel a eu lieu,
**When** je le documente,
**Then** l'installation Kanban, sa période, sa clôture et son rapport sont identifiés séparément.

#### AC4

**Given** moins de trois Sprints complets ou aucun cycle Kanban réel sont prouvés,
**When** le bilan est calculé,
**Then** la condition n'est pas marquée Atteinte.

#### AC5

**Given** au moins trois Sprints complets et un cycle Kanban réel sont effectivement documentés,
**When** je demande l'évaluation,
**Then** le résultat peut être Atteinte uniquement après vérification des preuves, sans prétendre que ces observations ont déjà eu lieu.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-76, FR-75 ; D-PRD-129/REC-03 ; critère de succès 1.
* Dépendances : Story 10.7 et capacités de cycles Epics 4/7.
* Incrément I6 ; objectifs non considérés atteints sans mesures réelles ; périmètre Scrum/Kanban, pas SAFe MVP.
**Statut de la Story 10.8 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.8 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.9: Chronométrer le rapport complet de Sprint sans reconstruction manuelle
**Jira :** https://lmn24.atlassian.net/browse/SMN-208

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** mesurer le temps de production d'un rapport complet de fin de Sprint,
**afin de** vérifier l'objectif de moins de 30 minutes pour la restitution.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint a les informations nécessaires à son reporting,
**When** je commence un essai chronométré,
**Then** le début et le périmètre du parcours sont enregistrés selon le protocole.

#### AC2

**Given** le PDF/rapport est prêt à être partagé,
**When** je termine le chronométrage,
**Then** le temps mesuré, la preuve du livrable et les opérations accomplies sont conservés.

#### AC3

**Given** l'accès aux tendances requiert une consolidation manuelle hors SMN,
**When** je clos l'essai,
**Then** la condition n'est pas considérée atteinte sur ce constat.

#### AC4

**Given** le temps mesuré est égal à 30 minutes ou supérieur,
**When** je compare le résultat,
**Then** le seuil strictement inférieur à 30 minutes n'est pas satisfait.

#### AC5

**Given** aucune mesure valable n'a été réalisée,
**When** je consulte la conclusion,
**Then** la condition reste Non démontrée, sans importer arbitrairement un temps estimé.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-76, FR-78 ; D-PRD-129/REC-03/05 ; critère de succès 2.
* Dépendances : Story 10.7 ; génération de rapports Epic 6.
* Incrément I6 ; objectifs non considérés atteints sans mesures réelles ; périmètre Scrum/Kanban, pas SAFe MVP.
**Statut de la Story 10.9 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.9 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.10: Mesurer la saisie courante hebdomadaire séparément des exceptions
**Jira :** https://lmn24.atlassian.net/browse/SMN-209

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** chronométrer mon temps ordinaire de saisie dans SMN,
**afin de** vérifier que l'administration de l'outil demeure légère au quotidien.

**Critères d'acceptation :**

#### AC1

**Given** une semaine de suivi réel est observée,
**When** j'enregistre les temps de saisie courante,
**Then** les durées et les dates de la semaine sont conservées selon le protocole approuvé.

#### AC2

**Given** un rapport final est produit ou une reprise historique exceptionnelle est réalisée,
**When** je mesure les durées,
**Then** ces travaux sont enregistrés séparément et exclus du temps de saisie ordinaire.

#### AC3

**Given** une semaine a une durée courante supérieure à 30 minutes,
**When** j'évalue la condition,
**Then** la semaine et l'écart sont explicités et la limite n'est pas réputée respectée.

#### AC4

**Given** les semaines observées ont une durée dans la cible 15 à 30 minutes,
**When** je consulte la synthèse,
**Then** les données brutes et leur provenance restent visibles sans effacer les autres semaines.

#### AC5

**Given** aucune observation hebdomadaire réelle n'existe,
**When** je consulte le résultat,
**Then** il demeure Non démontrée, sans inventer un temps de saisie ou une conformité.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-76 ; D-PRD-129/REC-03 ; critère de succès 3.
* Dépendances : Story 10.7 ; parcours de saisie déjà définis Epics 1–9.
* Incrément I6 ; objectifs non considérés atteints sans mesures réelles ; périmètre Scrum/Kanban, pas SAFe MVP.
**Statut de la Story 10.10 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.10 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.11: Prouver la fiabilité des tendances et des reprises historiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-210

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** comparer les tendances aux données sources connues et à leurs lacunes,
**afin de** vérifier qu'une reconstitution ne produit pas de fausses évolutions.

**Critères d'acceptation :**

#### AC1

**Given** des Sprints ordinaires et rétrosaisis sont disponibles,
**When** je vérifie des séries de tendance,
**Then** les cycles sont placés dans leur chronologie, avec cinq clôtures éligibles maximum sans cycle ultérieur au cycle consulté.

#### AC2

**Given** une valeur historique est Non renseignée, Estimée, Connue ou explicitement zéro,
**When** je contrôle graphique et bilan,
**Then** chaque état garde sa signification et aucune absence n'est transformée en zéro.

#### AC3

**Given** une moyenne Kanban n'a pas la même population ou convention,
**When** je compare les délais,
**Then** les données non comparables ne sont pas agrégées sans qualification ou transformation vérifiable.

#### AC4

**Given** un ancien Sprint est rouvert et reclôturé après correction,
**When** j'examine les versions,
**Then** les instantanés V1/V2 et anciens PDF restent intacts et la tendance courante tient compte seulement des états éligibles.

#### AC5

**Given** une situation de tendance n'a pas été réellement contrôlée,
**When** j'évalue le critère de succès 4,
**Then** la condition est Non démontrée, avec scénario et preuve manquante, sans déclaration de fiabilité.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-76, FR-77 ; D-PRD-129/REC-03/04 ; critère de succès 4 ; D-PRD-130.
* Dépendances : Stories 10.2, 10.7 ; tendances Epics 4/7/8.
* Incrément I6, recette du MVP Scrum/Kanban ; cette rédaction ne prouve aucune conformité ou résultat observé.
**Statut de la Story 10.11 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.11 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.12: Vérifier l'exploitabilité des rapports HTML et PDF
**Jira :** https://lmn24.atlassian.net/browse/SMN-214

**En tant que** Scrum Master responsable de la recette,
**je veux** vérifier l'exploitabilité des rapports HTML et PDF,
**afin de** ne pas considérer un livrable défectueux comme utilisable au pilote.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint avec rapport complet,
**When** je compare la prévisualisation HTML et le PDF,
**Then** les rubriques, données et graphiques coïncident, sous réserve de la pagination.

#### AC2

**Given** un rapport Kanban,
**When** je compare HTML et PDF,
**Then** les indicateurs et leurs unités de flux restent fidèles.

#### AC3

**Given** un cycle provisoire, historique ou clôturé,
**When** je lis les versions française et anglaise,
**Then** statut, date, clichés et libellés sont corrects sans traduction automatique des commentaires.

#### AC4

**Given** un défaut empêchant la lecture ou l'utilisation du PDF,
**When** j'enregistre le résultat de recette,
**Then** une anomalie bloquante est tracée et la condition n'est pas considérée satisfaite.

#### AC5

**Given** les contrôles n'ont pas eu lieu,
**When** la condition de succès est examinée,
**Then** elle reste Non démontrée sans résultat d'exécution inventé.

#### Traçabilité

Epic SMN-10 ; FR-76, FR-78 ; D-PRD-129/REC-03/05 ; condition de succès 5 du PRD. Dépendances : Stories 10.4, 10.5, 10.7 et génération de rapports Epic 6. Incrément I6 ; spécification en attente de revue globale, aucun test exécuté.
**Statut de la Story 10.12 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.13: Tester les imports CSV historiques et les valeurs atypiques
**Jira :** https://lmn24.atlassian.net/browse/SMN-211

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** recetter les cas d'import et d'historisation les plus sensibles,
**afin de** prouver qu'aucune donnée passée n'est inventée ou écrasée involontairement.

**Critères d'acceptation :**

#### AC1

**Given** un Sprint historique terminé est repris,
**When** je contrôle sa création,
**Then** aucune cérémonie passée n'est fabriquée et la capacité initiale Connue/Estimée/Non renseignée reste distincte.

#### AC2

**Given** un CSV à quatre colonnes contient des valeurs valides Scrum ou Kanban,
**When** je vérifie l'aperçu,
**Then** les cycles, métriques, qualités et éventuels remplacements apparaissent avant confirmation.

#### AC3

**Given** une ligne CSV est invalide, dupliquée ou cible un cycle inconnu,
**When** je tente de confirmer,
**Then** l'import complet est refusé sans écriture partielle.

#### AC4

**Given** une métrique existante est ciblée,
**When** je vérifie Conserver puis Remplacer volontairement,
**Then** la conservation par défaut, la protection des clôtures et la traçabilité avant/après sont respectées.

#### AC5

**Given** un cycle historique est corrigé puis reclôturé,
**When** je consulte ses rapports anciens,
**Then** les PDF/TXT déjà archivés restent immuables, sans prétendre disposer d'états qualitatifs passés inconnus.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-77 ; D-PRD-129/REC-04 ; D-PRD-130/A1–A4.
* Dépendances : Stories 10.1–10.2 ; import et historique Epic 8.
* Incrément I6, recette du MVP Scrum/Kanban ; cette rédaction ne prouve aucune conformité ou résultat observé.
**Statut de la Story 10.13 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.13 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.14: Recetter les briefs TXT et les analyses IA sans transmission automatique
**Jira :** https://lmn24.atlassian.net/browse/SMN-212

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** prouver la confidentialité et l'historique des briefs IA du MVP,
**afin de** éviter une fuite ou une confusion entre interprétation et fait mesuré.

**Critères d'acceptation :**

#### AC1

**Given** un cycle Scrum ou Kanban est choisi,
**When** je prépare un brief TXT,
**Then** les rubriques collectives, modèle, statut, sources et consignes sont disponibles sans champ personnel structuré ni graphique.

#### AC2

**Given** un texte libre contient potentiellement une information confidentielle,
**When** je prépare la finalisation,
**Then** la prévisualisation complète et l'approbation explicite de confidentialité sont exigées.

#### AC3

**Given** un brief est finalisé puis dupliqué,
**When** je contrôle les deux archives,
**Then** le texte exact du parent demeure immuable, l'enfant reçoit un autre identifiant et aucune réponse IA n'est copiée implicitement.

#### AC4

**Given** une réponse externe est collée puis corrigée ou supprimée,
**When** je vérifie les analyses,
**Then** une seule analyse IA active par brief, retouche humaine identifiable et brief d'origine conservé sont démontrables.

#### AC5

**Given** un brief est prévisualisé ou archivé,
**When** je contrôle les échanges réseau prévus par le scénario,
**Then** aucune transmission automatique à un prestataire IA n'est exécutée ; une analyse antérieure sélectionnée reste présentée comme interprétation.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-78 ; D-PRD-129/REC-05 ; D-PRD-126/IA-01 à IA-08.
* Dépendances : Stories 10.1–10.2 ; parcours IA Epic 9.
* Incrément I6, recette du MVP Scrum/Kanban ; cette rédaction ne prouve aucune conformité ou résultat observé.
**Statut de la Story 10.14 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.14 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.15: Contrôler les accès privés, les deux profils et les secrets
**Jira :** https://lmn24.atlassian.net/browse/SMN-213

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** vérifier que données et actions de l'installation restent protégées,
**afin de** ne pas diffuser le MVP avec des accès ou secrets exposés.

**Critères d'acceptation :**

#### AC1

**Given** une personne n'est pas authentifiée,
**When** elle essaie d'ouvrir une page, une API ou une archive PDF/TXT privée,
**Then** l'accès est refusé même avec une URL ou un identifiant de fichier connu.

#### AC2

**Given** un Utilisateur authentifié tente de créer un compte, de modifier une fiche ou de générer un rapport,
**When** le serveur traite l'opération,
**Then** l'écriture est refusée ; les lectures et téléchargements explicitement autorisés restent possibles.

#### AC3

**Given** l'Administrateur utilise le parcours normal,
**When** les opérations de gestion des comptes et des données lui sont proposées,
**Then** les droits sont exercés sans matrice de rôles complexe ni contournement côté API.

#### AC4

**Given** des erreurs d'authentification ou d'export surviennent,
**When** je consulte messages et journaux,
**Then** les secrets, identifiants sensibles et textes privés ne sont pas exposés.

#### AC5

**Given** une fonction n'a pas été soumise à un essai de contrôle d'accès,
**When** la matrice de recette est consultée,
**Then** la sécurité de cette fonction reste Non exécuté/Non démontrée et non déclarée conforme.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-79 ; D-PRD-129/REC-06 ; AD-31 ; FR-66–73.
* Dépendances : Stories 10.1–10.2 ; sécurité et droits Epic 1.
* Incrément I6, recette du MVP Scrum/Kanban ; cette rédaction ne prouve aucune conformité ou résultat observé.
**Statut de la Story 10.15 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.15 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.16: Vérifier la sauvegarde complète et la restauration contrôlée
**Jira :** https://lmn24.atlassian.net/browse/SMN-215

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** prouver que les données et documents SMN peuvent être restaurés sans perte silencieuse,
**afin de** réduire le risque de perdre un carnet Agile avant son pilote.

**Critères d'acceptation :**

#### AC1

**Given** une sauvegarde gérée conforme au périmètre existe,
**When** je prépare un essai de restauration isolé,
**Then** les données métier, registres, historiques, PDF, TXT et métadonnées attendues sont listés pour comparaison.

#### AC2

**Given** une restauration réussit dans l'environnement de recette,
**When** je compare l'avant et l'après,
**Then** les comptes, cycles, clichés Vn et archives privées sont cohérents et les écarts éventuels sont consignés.

#### AC3

**Given** une archive de sauvegarde est invalide ou incomplète,
**When** je tente une restauration contrôlée,
**Then** un échec explicite est signalé sans présenter l'installation comme restaurée.

#### AC4

**Given** une restauration implique le remplacement de données,
**When** je lance le parcours sensible,
**Then** les conséquences et l'accord Administrateur sont vérifiés, sans effacer implicitement une autre installation.

#### AC5

**Given** un essai de sauvegarde ou restauration n'a pas été effectué,
**When** je consulte sa ligne de recette,
**Then** le contrôle reste Non exécuté ou Non démontré, même si les paramètres de sauvegarde sont documentés.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-79 ; D-PRD-129/REC-06 ; AD-27 ; FR-68–71.
* Dépendances : Stories 10.1–10.2 ; sauvegardes et restauration Epic 2.
* Incrément I6 ; recette Scrum/Kanban, pas SAFe v1.0 ; tests, mesures et conformité non attestés à ce stade.
**Statut de la Story 10.16 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.16 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.17: Tester les transactions atomiques et les échecs d'opérations sensibles
**Jira :** https://lmn24.atlassian.net/browse/SMN-216

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** vérifier que les interruptions ne laissent pas de données métier incohérentes,
**afin de** préserver l'intégrité du carnet et ne jamais annoncer de faux succès.

**Critères d'acceptation :**

#### AC1

**Given** un lot de cycles contient un conflit,
**When** je demande sa confirmation,
**Then** aucun cycle du lot n'est créé et les raisons sont affichées.

#### AC2

**Given** une replanification avec événements échoue pendant sa transaction,
**When** je simule un échec lorsque l'environnement de recette le permet,
**Then** les dates, événements, références de capacité et audit de réussite ne restent pas partiellement modifiés.

#### AC3

**Given** un CSV contient une ligne invalide après plusieurs lignes valides,
**When** je tente l'import,
**Then** aucune ligne n'est persistée et l'erreur est reliée à son origine.

#### AC4

**Given** un export PDF/TXT ou archivage est interrompu,
**When** j'examine son résultat,
**Then** aucun fichier partiel n'est déclaré final et un ancien document reste intact.

#### AC5

**Given** une suppression, purge ou réinitialisation est demandée,
**When** j'examine confirmation et droits,
**Then** les impacts sont annoncés et aucune action destructrice ne survient sans validation autorisée.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-79, FR-77 ; D-PRD-129/REC-06 ; D-PRD-130/A4 ; FR-23/44.
* Dépendances : Stories 10.1–10.2, 10.6, 10.13 ; opérations Epics 2/4/7/8.
* Incrément I6 ; recette Scrum/Kanban, pas SAFe v1.0 ; tests, mesures et conformité non attestés à ce stade.
**Statut de la Story 10.17 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.17 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.18: Constituer la matrice de compatibilité appareils, navigateurs et langues
**Jira :** https://lmn24.atlassian.net/browse/SMN-217

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** recenser les combinaisons d'interface à tester et leurs résultats,
**afin de** identifier les régressions sur ordinateur, tablette et téléphone.

**Critères d'acceptation :**

#### AC1

**Given** la matrice de compatibilité est initialisée,
**When** je définis les environnements cibles,
**Then** ordinateur, tablette et smartphone en navigateur sont représentés pour les parcours essentiels.

#### AC2

**Given** un scénario est joué en français ou en anglais,
**When** je consigne l'essai,
**Then** langue, navigateur/version, appareil/taille d'écran, thème, date et résultat sont associés.

#### AC3

**Given** je teste thèmes clair/sombre et palettes utilisables,
**When** je parcours tableau de bord, calendriers, bilans, registres, rapports, briefs et administration,
**Then** les actions métier essentielles et leurs libellés restent accessibles sans perdre de donnée.

#### AC4

**Given** une combinaison n'a pas été réellement vérifiée,
**When** je consulte la matrice,
**Then** elle demeure Non exécutée, distincte de la compatibilité démontrée.

#### AC5

**Given** les versions minimales ou tailles de référence ne sont pas encore arbitrées,
**When** je prépare la campagne,
**Then** elles sont signalées À définir avant acceptation technique, sans seuil ou compatibilité inventés.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-80 ; D-PRD-129/REC-07 ; NFR-1 ; D-PRD-127.
* Dépendances : Stories 10.1–10.2 ; parcours UX Epics 1–9.
* Incrément I6 ; recette Scrum/Kanban, pas SAFe v1.0 ; tests, mesures et conformité non attestés à ce stade.
**Statut de la Story 10.18 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.18 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.19: Recetter l'accessibilité clavier et la lisibilité des composants
**Jira :** https://lmn24.atlassian.net/browse/SMN-218

**En tant que** Scrum Master responsable de la recette du MVP,
**je veux** vérifier les interactions essentielles sans souris ni seule dépendance à la couleur,
**afin de** rendre le MVP utilisable par des profils et supports variés.

**Critères d'acceptation :**

#### AC1

**Given** un formulaire important est ouvert,
**When** je le parcours au clavier,
**Then** navigation, ordre de focus, champs obligatoires, boutons et messages d'erreur restent opérables.

#### AC2

**Given** un indicateur ou une alerte emploie une couleur,
**When** je consulte la vue sans distinguer cette couleur,
**Then** son texte, icône ou autre repère explicite l'information.

#### AC3

**Given** un tableau, graphique ou calendrier apparaît sur écran étroit,
**When** je vérifie ses actions principales,
**Then** les informations essentielles restent lisibles ou leur mode de consultation alternatif est vérifié.

#### AC4

**Given** un élément réagit aux interactions,
**When** je déplace le focus et provoque un échec contrôlé,
**Then** focus visible, libellés compréhensibles et erreurs interprétables sont contrôlés.

#### AC5

**Given** un niveau WCAG ou un seuil précis n'a pas été arbitré ou mesuré,
**When** je rédige le résultat de la campagne,
**Then** aucune conformité normative totale n'est déclarée sans périmètre, mesures et preuves explicites.

#### Traçabilité et dépendances

* Epic SMN-10 ; FR-80 ; D-PRD-129/REC-07 ; UX-01–08 ; NFR-1.
* Dépendances : Story 10.18 ; composants et formulaires Epics 1–9.
* Incrément I6 ; recette Scrum/Kanban, pas SAFe v1.0 ; tests, mesures et conformité non attestés à ce stade.
**Statut de la Story 10.19 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.19 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.20: Consolider la checklist de préparation du MVP au pilote
**Jira :** https://lmn24.atlassian.net/browse/SMN-219

**En tant que** Scrum Master responsable de la décision de pilote,
**je veux** voir une synthèse traçable des exigences, essais, preuves et anomalies,
**afin de** identifier clairement les points encore bloquants avant toute décision de pilote.

**Critères d'acceptation :**

#### AC1

**Given** des résultats de scénarios ont été consignés,
**When** j'ouvre la checklist du MVP,
**Then** couverture FR, preuves, anomalies, restaurations, sécurité, HTML/PDF/TXT et compatibilité sont consolidées avec leur état.

#### AC2

**Given** les cinq conditions métier sont évaluées séparément,
**When** la checklist est produite,
**Then** elles figurent toutes avec Atteinte/Non atteinte/Non démontrée et leurs preuves, sans conclusion artificielle.

#### AC3

**Given** un contrôle applicable est Non exécuté,
**When** la checklist en déduit le statut,
**Then** il reste Non démontré et ne peut être masqué comme Non applicable.

#### AC4

**Given** une anomalie bloquante demeure ouverte,
**When** j'examine le bilan,
**Then** la préparation est signalée comme non satisfaisante et l'anomalie est liée à son suivi.

#### AC5

**Given** des anomalies non bloquantes subsistent,
**When** la checklist est renseignée,
**Then** elles restent visibles avec traitement envisagé et risque résiduel, sans affirmation de conformité complète.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-81, FR-74, FR-76 ; D-PRD-129/REC-08 ; section 7 du PRD ; I6.
* Dépendances : Stories 10.1–10.19.
* Incrément I6. **La validation des spécifications et la création de tickets ne constituent aucune preuve de recette ni autorisation de pilote.**
**Statut de la Story 10.20 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Statut de la Story 10.20 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**


**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
### Story 10.21: Enregistrer une décision humaine explicite de passage au pilote
**Jira :** https://lmn24.atlassian.net/browse/SMN-220

**En tant que** Scrum Master responsable de la décision de pilote,
**je veux** statuer formellement sur la préparation réelle du MVP,
**afin de** ne pas lancer un pilote sur la seule base d'un backlog rédigé ou de tests non exécutés.

**Critères d'acceptation :**

#### AC1

**Given** la checklist présente au moins une condition métier Non démontrée ou Non atteinte,
**When** je demande la conclusion,
**Then** SMN affiche Non prêt pour pilote ou Décision suspendue ; aucune validation automatique n'est accordée.

#### AC2

**Given** une anomalie bloquante est toujours ouverte,
**When** la décision est examinée,
**Then** le statut Prêt pour pilote est impossible, même si certains scénarios sont réussis.

#### AC3

**Given** toutes les conditions cumulatives sont effectivement démontrées, aucun blocage ne subsiste et les contrôles requis sont satisfaits,
**When** le responsable habilité examine le dossier,
**Then** il peut explicitement signer une décision de passage au pilote ; cette possibilité ne vaut pas décision déjà prise.

#### AC4

**Given** une décision humaine est prise,
**When** je la conserve,
**Then** date, auteur habilité, version MVP, périmètre Scrum/Kanban et références des preuves examinées sont historisés.

#### AC5

**Given** une décision favorable au pilote a été enregistrée,
**When** la question d'une diffusion plus large est soulevée,
**Then** aucune généralisation automatique ni lancement technique du pilote n'est déclenché : une décision distincte après retours d'usage sera nécessaire.

#### Traçabilité et dépendances

* Epic : SMN-10 ; FR-81, FR-76 ; D-PRD-129/REC-08 ; section 7 du PRD ; D-PRD-131.
* Dépendances : Story 10.20 et protocoles/observations 10.7–10.19.
* Incrément I6. **La validation des spécifications et la création de tickets ne constituent aucune preuve de recette ni autorisation de pilote.**
**Statut de la Story 10.21 : validée fonctionnellement sans réserve le 19/10/2026 ; développement et recette non attestés.**





**Validation :** validée fonctionnellement sans réserve le 19/10/2026 ; aucun essai exécuté.
