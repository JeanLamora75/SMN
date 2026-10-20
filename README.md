# SMN — Scrum Master Notebook

Application destinée aux Scrum Masters, développée selon BMAD 6.12.4. MVP Scrum et Kanban, usage local initial sur Windows 11, avec Next.js 16/React 19, TypeScript, Bootstrap 5.3, PostgreSQL et Prisma 7.

## État technique

**Travail I0 / SMN-11 en construction :** diagnostic local des prérequis, sans installation complète ni authentification disponible. Les routes privées restent fermées ; aucun démarrage ne crée de base, compte, équipe ou Sprint. La base SMN dédiée doit être créée **par le futur installateur SMN-12**, avec vérification des droits et confirmation préalable, et non manuellement dans le parcours normal.

**Port web de SMN : 3003 par défaut**, afin de préserver les applications existantes sur 3000, 3001 et 3002. `SMN_PORT` permet de choisir un autre port libre (hors de ces trois ports réservés).

Voir [Installation et essais](docs/INSTALLATION.md) pour les commandes, le port et les limites vérifiables.

## Référentiels du projet

- [Contexte et décisions](docs/PROJECT-CONTEXT.md)
- [État du projet BMAD](docs/ETAT-PROJET-BMAD.md)
- [Index BMAD](_bmad-output/planning-artifacts/README.md)
- [User Stories Jira](https://lmn24.atlassian.net/jira/software/projects/SMN)
- [Travail I0 / SMN-11](https://lmn24.atlassian.net/browse/SMN-11)

La préparation documentaire demeure sous verdict **CONCERNS** jusqu'aux preuves complémentaires. Les tests GitHub Actions ne prouvent pas à eux seuls le bon fonctionnement sur un poste Windows 11.
