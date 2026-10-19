# SMN — Scrum Master Notebook

Scrum Master Notebook est un carnet de bord pour les Scrum Masters : équipes, calendriers, capacités, cycles, registres qualitatifs et rapports professionnels, avec une saisie minimale.

Le **MVP couvre Scrum et Kanban**, en usage local sur PC et depuis un navigateur responsive, en français et en anglais. **SAFe et les ART sont prévus pour la version 1.0.** Le socle décidé est un monolithe modulaire TypeScript, PostgreSQL et Bootstrap 5 ; les bibliothèques et le packaging restent à éprouver.

## Reprendre le projet

1. [Contexte et règles de reprise](docs/PROJECT-CONTEXT.md).
2. [État BMAD, réserves et prochaine étape](docs/ETAT-PROJET-BMAD.md).
3. [Index des livrables BMAD](_bmad-output/planning-artifacts/README.md) : Product Brief, PRD et annexes, architecture et découpage final.
4. [Epics et Stories](_bmad-output/planning-artifacts/epics.md) et [Jira SMN](https://lmn24.atlassian.net/jira/software/projects/SMN), référence des tickets.

**État au 19 octobre 2026 :** Product Brief et PRD finalisés ; architecture documentaire finale sous réserves techniques ; workflow Create Epics and Stories clôturé. **10 Epics et 210 Stories validées fonctionnellement**, toutes À faire lors de la vérification Jira. Aucun développement applicatif ni recette attestés. Prochaine étape : **[SP] Sprint Planning**, avec contrôle de préparation avant génération du suivi.

## Référentiels

- GitHub : code, architecture, documentation et fichiers BMAD.
- Jira : Epics, Stories, bugs et tâches.
- BMAD Method **6.12.4** : skills dans `.agents/skills/`, configuration dans `_bmad/`, livrables dans `_bmad-output/`.
- [Décisions initiales F-01 à F-124](docs/DECISIONS-FONCTIONNELLES.md) et [cadrage initial](docs/CADRAGE-FONCTIONNEL.md) : historique complété par le PRD et les décisions D-PRD.
- Langue de collaboration et des livrables : français.
