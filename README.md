# SMN — Scrum Master Notebook

Application destinée aux Scrum Masters, développée selon BMAD 6.12.4. MVP Scrum et Kanban, usage local initial sur Windows 11, avec Next.js 16/React 19, TypeScript, Bootstrap 5.3, PostgreSQL et Prisma 7.

## État du pilote — 20 octobre 2026

**SMN-11 est livré sur `main`.** SMN démarre sur `127.0.0.1:3003` ; les ports 3000 à 3002 restent réservés à l'autre projet.

**SMN-12 est désormais aussi intégré à `main`** via la [PR nº 11](https://github.com/JeanLamora75/SMN/pull/11). L'assistant Express peut créer, après confirmation explicite, sa base PostgreSQL locale dédiée, appliquer la migration initiale et enregistrer le produit, l'équipe et le compte Administrateur. **La recette sur le PC utilisateur reste à effectuer.** Le tableau de bord et les connexions restent bloqués avant SMN-14.

**Mode de travail du pilote, selon demande utilisateur (20/10/2026) :** développer et publier directement sur `main` sans branche ni PR obligatoires, en gardant les commits Git, les contrôles CI et la documentation à jour. Aucune création de base ou opération destructive n'est implicite.

Voir [Installation et essais](docs/INSTALLATION.md) pour GitHub Desktop et PowerShell.

## Référentiels du projet

- [Contexte et décisions](docs/PROJECT-CONTEXT.md)
- [État du projet BMAD](docs/ETAT-PROJET-BMAD.md)
- [Index BMAD](_bmad-output/planning-artifacts/README.md)
- [User Stories Jira](https://lmn24.atlassian.net/jira/software/projects/SMN)
- [Travail I0 / SMN-11](https://lmn24.atlassian.net/browse/SMN-11)

La préparation documentaire demeure sous verdict **CONCERNS** jusqu'aux preuves complémentaires. Les tests GitHub Actions ne prouvent pas à eux seuls le bon fonctionnement sur un poste Windows 11.

