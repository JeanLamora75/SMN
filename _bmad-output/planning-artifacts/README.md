# SMN — Index des livrables BMAD

**Consolidation du 19 octobre 2026.** Pour reprendre : [contexte](../../docs/PROJECT-CONTEXT.md) et [état BMAD](../../docs/ETAT-PROJET-BMAD.md).

| Livrable | Référence |
| --- | --- |
| Product Brief final | [brief.md](briefs/brief-SMN-2026-10-18/brief.md) |
| PRD final et annexes | [prd.md](prds/prd-SMN-2026-10-18/prd.md) |
| Arbitrages finaux applicables | [D-PRD-132 à 136](prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md) |
| Clarification équipe/contexte applicable | [D-PRD-137](prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md) — équipe unique MVP, multiéquipes SAFe, rattachements et Stories productrices |
| Incréments I0 à I6 | [séquencement](prds/prd-SMN-2026-10-18/sequencement-mvp-d-prd-131.md) |
| Architecture finale sous réserves techniques | [Architecture Spine](architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md) et [index](architecture/architecture-SMN-2026-10-19/README.md) |
| Découpage actuel : 10 Epics / 212 Stories | [epics.md](epics.md) |
| Contrôle du 19/10 — CONCERNS, poursuite autorisée | [Résultat et portes de preuve](implementation-readiness.md) ; [rapprochement des 212 Stories](implementation-readiness-evidence.json) |
| Stack validée sous réserve I0 | [ADR-I0-001](architecture/architecture-SMN-2026-10-19/ADR-I0-001-STACK.md) — versions exactes et fonctionnement à qualifier |
| Migrations et secrets — principes validés | [ADR-I0-002](architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md) ; protection des clés à préciser |
| **Préparation technique de SMN-27 — aucun code encore développé** | [Dossier BMAD SMN-27](../implementation-artifacts/spec-smn-27-socle-i18n-json.md) et [plan de migration](../../docs/I18N-IMPLEMENTATION-PLAN.md) ; dépendances/CI à vérifier |
| **Internationalisation obligatoire — décision approuvée le 20/10/2026** | **[ADR-I0-004 — un JSON par langue, toutes les Epics](architecture/architecture-SMN-2026-10-19/ADR-I0-004-I18N-JSON.md)** ; mise en œuvre à planifier dans SMN-27, aucune implémentation revendiquée |

| Récupération des clés — principe validé | [ADR-I0-003](architecture/architecture-SMN-2026-10-19/ADR-I0-003-RECUPERATION-CLES.md) ; cryptographie et essais à qualifier |
| Préparation technique I0 — en cours | [Choix candidats, inventaire et protocole](preparation-technique-i0.md) ; aucun essai attesté |
| Qualification documentaire de la stack I0 | [Sources officielles, versions observées et contraintes Windows](qualification-documentaire-stack-i0.md) — POC non réalisés |
| Contrat d'accès I0 — durées validées | [Sessions, amorçage et récupération locale](contrat-acces-i0-proposition.md) ; D-PRD-138, mécanismes à qualifier |
| Sprint Planning — suivi généré et validé | [Compte rendu et proposition du premier Sprint](sprint-planning-2026-10-19.md) ; [suivi BMAD](../implementation-artifacts/sprint-status.yaml) |
| Règles de publication Jira | [BMAD-JIRA-PUBLICATION-RULES.md](BMAD-JIRA-PUBLICATION-RULES.md) |
| Journal de consolidation | [CONSOLIDATION-2026-10-19.md](CONSOLIDATION-2026-10-19.md) |

Le PRD et ses décisions ultérieures prévalent sur les hypothèses des documents historiques. A7/A8/A10/A11 sont validés ; seuls les rôles Administrateur et Utilisateur sont applicables au MVP. Les rapports de revue antérieurs restent datés et ne prouvent pas l'exécution des contrôles techniques.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.


## Avenant validé du 23/10/2026 — Centre Paramètres

Nouvelle **Epic UX transversale [SMN-223](https://lmn24.atlassian.net/browse/SMN-223)** et **quatre Stories [SMN-224](https://lmn24.atlassian.net/browse/SMN-224), [SMN-225](https://lmn24.atlassian.net/browse/SMN-225), [SMN-226](https://lmn24.atlassian.net/browse/SMN-226), [SMN-227](https://lmn24.atlassian.net/browse/SMN-227)** : réunir les réglages généraux sous une page d'accueil Paramètres accessible via la sidebar, 14 cartes groupées en 4 familles, affichage Cartes/Liste mémorisé. Les écrans existants conservent leurs responsabilités et droits ; réglages nouveaux à traiter séparément.

**Contrats BMAD** : [DESIGN.md](ux-designs/ux-parametres-2026-10-23/DESIGN.md) ; [EXPERIENCE.md](ux-designs/ux-parametres-2026-10-23/EXPERIENCE.md) ; [contrat de développement](ux-designs/ux-parametres-2026-10-23/CONTRAT-DEVELOPPEMENT.md) ; [recette](ux-designs/ux-parametres-2026-10-23/RECETTE-UX.md) ; [mapping Jira](ux-designs/ux-parametres-2026-10-23/DECOUPAGE-JIRA.md).

**Cette nouvelle Epic ne change ni l'état de clôture documentaire des 10 Epics initiales ni les critères métier de SMN-18, 15, 32, 65. Aucune implémentation/recette n'est attestée par l'avenant.**


## Avenant du 23/10/2026 — Refonte de l'écran Sprints

**[SMN-228](https://lmn24.atlassian.net/browse/SMN-228)** et Stories **SMN-229–234** : séparation Paramètres (plages de travail, pause, modèles et cadence), **index de tous les sprints en liste** (actions, filtres, création contextualisée), Calendrier/événements et **fiche Sprint ultérieure**. Docs : [DESIGN.md](ux-designs/ux-sprints-pilotage-2026-10-23/DESIGN.md), [EXPERIENCE.md](ux-designs/ux-sprints-pilotage-2026-10-23/EXPERIENCE.md), [Matrice](ux-designs/ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md), [Contrat](ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [Recette](ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md), [Jira](ux-designs/ux-sprints-pilotage-2026-10-23/DECOUPAGE-JIRA.md). **SMN-234 est différée et ne bloque pas les autres Stories.** Aucun code ni test attesté.