# SMN-296 — Création Scrum multiéquipes : service non exposé

Date : 27 octobre 2026. **Code publié, non testé.**

## Modifications
- `src/server/sprints/scoped-create.ts` : entrée v29 réservée à l'admin, `teamId` et révision de cadence obligatoires, contrôle d'installation et de mode Scrum, refus d'équipe archivée, verrou de ligne équipe, cadence de l'équipe, calcul horaire avec `calculateSprint`, contrôle chevauchements, numérotation préservant les Sprints supprimés logiquement, audit dans la même transaction.
- `tests/smn-296-scoped-sprint-create.test.ts` : préparation de cas de validation, refus archive, transaction positive.

## Manques avant activation
Le nouveau service **ne génère pas encore les cérémonies** et ne doit pas être raccordé aux routes. Les schémas Sprint et cadence doivent déjà exister ; aucune DDL automatique n'est exécutée par ce service. Les contrôles de sécurité des membres, capacités, registres, imports et rapports restent à traiter. La migration v29 n'a pas été exécutée. Aucun test, build ou compilation exécuté. Écritures multiéquipes toujours désactivées.
