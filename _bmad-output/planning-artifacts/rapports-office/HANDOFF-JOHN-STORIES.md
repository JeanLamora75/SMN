---
title: "Transmission Winston → John — Exports Office"
status: "préparation-validation-prérequis"
created: 2026-11-06
updated: 2026-11-06
targetEpic: SMN-6
workflow: bmad-create-epics-and-stories
stepsCompleted: []
inputDocuments:
  - "_bmad-output/planning-artifacts/rapports-office/specification-fonctionnelle.md"
  - "_bmad-output/planning-artifacts/architecture/rapports-office/ARCHITECTURE-SPINE.md"
  - "docs/UX-REFERENTIEL-BMAD.md"
---

# Handoff BMAD — John, Product Manager

**Mandat utilisateur :** préparer les nouvelles Stories de génération de rapports DOCX/PPTX dans l'Epic existante **[SMN-6](https://lmn24.atlassian.net/browse/SMN-6)** ; ne pas créer un nouvel Epic et ne pas modifier Jira sans validation de la rédaction.

## Références consultées

- [Spécification fonctionnelle — projet John](./specification-fonctionnelle.md)
- [Architecture — revue Winston](../architecture/rapports-office/ARCHITECTURE-SPINE.md)
- [Référentiel UX SMN](../../../docs/UX-REFERENTIEL-BMAD.md)
- [Epic Jira SMN-6](https://lmn24.atlassian.net/browse/SMN-6)

## Step 01 — Inventaire préliminaire des exigences

- **FR : 36** (`FR-001` à `FR-036`) : modèles et détection (4), périmètre/données (4), tags scalaires (6), tableaux (5), graphiques (6), fidélité Office (5), sauvegarde (6).
- **NFR : 7** (`NFR-01` à `NFR-07`) : intégrité, fidélité, sécurité, utilisabilité, interopérabilité, maintenabilité, ressources.
- **AC : 15** (`AC-01` à `AC-15`) : marqueurs, tableaux, tendances, fidélité, fichier existant, droits.
- **Architecture : 10 décisions AD-01 à AD-10** avec POC P1–P6 ; décisions ouvertes Q1–Q7 à prendre en compte.
- **UX :** Cockpit Agile, composants Bootstrap existants, i18n JSON FR/EN, confirmation d'écrasement, états de chargement/erreur et accessibilité clavier.
- **Interdictions :** aucune révision de modèle Office, aucun historique d'exports Office, aucun changement des contrats PDF/archives, aucun accès aux données d'une autre équipe.

## Points de vigilance avant les Stories

1. Epic SMN-6 contient des exigences historiques d'archivage PDF ; les nouvelles Stories Word/PPTX sont explicitement **sans historisation**. Cette exception n'abroge pas les obligations PDF existantes.
2. Le rapport Word/PPTX n'est pas un dérivé du modèle PostgreSQL révisé existant : nouveau catalogue de fichiers.
3. Les graphiques actuels exportent leur PNG côté navigateur : le moteur de rendu partagé serveur et UI est une dépendance technique.
4. Les tableaux PowerPoint extensibles et les débordements sont des arbitrages ouverts, non des choix déjà validés.
5. L'Epic historique BMAD `_bmad-output/planning-artifacts/epics.md` est déjà finalisée pour les anciennes Stories. **Ne pas l'écraser ni définaliser le découpage historique.** Produire une extension autonome destinée à être rattachée à SMN-6 après validation.
6. Validation du périmètre documentaire préalable requise par l'étape 01 du workflow `bmad-create-epics-and-stories`.

**État de transmission :** références préparées pour John, premier inventaire disponible ; aucune User Story nouvelle ni ticket Jira encore créé. Le workflow officiel se poursuit après confirmation des intrants.

## Actualisation de transmission — 06/11/2026

John a reçu la validation des neuf Stories et des cinq points fonctionnels. Le contrat officiel pour les exports Office est : tags libres en zones compatibles ; nom obligatoire suggéré depuis le modèle + sprint et modifiable ; langue FR/EN choisie à chaque génération, langue utilisateur par défaut ; catalogue de huit familles de données dès la première livraison ; aucune limite métier supplémentaire sur les lignes de tableaux, garde-fous techniques obligatoires et six indicateurs compatibles maximum par graphique selon les tendances SMN. Les anciens arbitrages de débordement, placement, nom, langue et périmètre du catalogue sont donc **clos fonctionnellement**. Référence : [Stories validées](./EPIC-SMN-6-STORIES-OFFICE-DRAFT.md). Aucun ticket Jira créé.
