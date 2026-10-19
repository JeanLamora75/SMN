# SMN — État du projet et de BMAD

**Situation vérifiée le 19 octobre 2026.** Synthèse documentaire ; Jira demeure la référence de l'avancement des tickets.

## Jalons

| Étape | État et preuve |
| --- | --- |
| Brainstorming | [124 décisions F validées](DECISIONS-FONCTIONNELLES.md) |
| Product Brief — Mary | [Final, phase complete, approuvé le 18/10](../_bmad-output/planning-artifacts/briefs/brief-SMN-2026-10-18/brief.md) |
| PRD — John | [Final](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/prd.md), 81 FR et décisions jusqu'à D-PRD-136 |
| Architecture — Winston | [Contrat final AD-1 à AD-31](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md), réserves techniques maintenues |
| Create Epics and Stories | [Final](../_bmad-output/planning-artifacts/epics.md), quatre étapes achevées, confirmation utilisateur C — Complete Workflow |
| Jira | 10 Epics / 210 Stories, toutes À faire lors de la vérification du 19/10 |
| Sprint Planning | Aucun sprint-status.yaml présent dans les sources consolidées |
| Développement / recette / pilote | Aucune implémentation applicative, campagne de recette ou aptitude au pilote attestée |

Le découpage final déclare la couverture des 81 FR, 3 NFR et 18 UX-DR. Il s'agit de couverture documentaire, pas de résultats de tests.

## Décisions applicables et réserves

A7 (criticité), A8 (faits automatiques), A10 (archives PDF), A11 (données personnelles) sont **validés**. AD-31 est corrigé à **deux rôles Administrateur/Utilisateur** par [D-PRD-132 à 136](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les anciennes propositions à trois rôles et leurs blocages métier sont historiques.

Restent à traiter aux portes prévues : A5 (seuils et protocoles NFR), A12 (preuve de restitution multitemporelle), POC I0 Windows/PostgreSQL/PDF, choix et versions des bibliothèques, migrations, sessions, concurrence, sauvegarde/restauration, sécurité et cohérence temporelle. Le lint officiel et le Reviewer Gate indépendant d'architecture ne sont pas attestés. A9 (création rétrospective complète de périodes Kanban) demeure hors engagement MVP.

Les décisions UX sont documentées dans le PRD et les UX-DR ; aucun livrable autonome du workflow bmad-ux n'est présent. Ce workflow est facultatif dans le catalogue installé.

## Prochaine étape officielle

**[SP] Sprint Planning — `bmad-sprint-planning`**, dans une nouvelle conversation avec lecture du [skill installé](../.agents/skills/bmad-sprint-planning/SKILL.md).

Le catalogue BMAD 6.12.4 installé prévoit : contrôle de préparation **PASS/CONCERNS/FAIL**, puis génération du suivi `sprint-status.yaml` sur PASS. Aucun résultat de ce contrôle n'est acquis par cette consolidation. Après planification, **[BD] Build — `bmad-build`**, avec priorité au socle et aux preuves I0 conformément au séquencement validé.

## Sources réunies

| Source | Contenu retenu |
| --- | --- |
| main au début de la consolidation : 6186a4e2a55c32f36fdfc1c0d8300ccfc0ad872b | Skills/configuration BMAD et cadrage initial |
| docs/bmad-product-brief-smn-20261018 | Product Brief et journal |
| docs/bmad-arbitrages-metier-valides-20261019 | Versions actualisées du PRD, de l'architecture, des annexes et des Epics/Stories |
| docs/bmad-prd-smn-20261018 et docs/bmad-architecture-smn-20261019 | Comparées ; leurs fichiers sont repris ou amendés dans la branche des arbitrages |

Les branches d'origine et journaux sont conservés. La PR historique du Product Brief reste une trace de sa transmission initiale ; l'index présent donne accès à sa copie consolidée.
