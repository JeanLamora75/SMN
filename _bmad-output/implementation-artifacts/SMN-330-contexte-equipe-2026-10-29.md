# SMN-330 — Contexte actif et mode Agile : premier incrément

Date : 29 octobre 2026. État : partiel, tests réels non exécutés.

## Objectif
Rendre le contexte d'équipe fiable et indépendant des bornes de version dans les services, sans confondre sélection d'équipe et autorisation.

## Réalisation
- `src/server/teams/active.ts` : les deux gardes v28–v32 de consultation/enregistrement de la préférence d'équipe ont été remplacées par `evaluateSchemaCapability(installation.schemaVersion,"multi-team")`.
- Les protections SQL actuelles (`role='admin'`, compte actif, association compte-installation, équipe non archivée) sont conservées.
- `tests/team-active-schema-adoption.test.ts` : non-régression statique et refus des versions futures.

## À poursuivre avant clôture
- Audit du mode `smn_installation.mode` dans les autres chemins d'équipe, Scrum/Kanban, calendrier et rapports.
- Contrat unique de résolution d'une équipe autorisée, y compris comportement lorsque l'équipe sélectionnée est archivée.
- Scénarios réels : Koala Scrum avec trois sprints, Panda sans cycle puis Kanban, absence de fuite interéquipes.
- Contrôles de type, tests unitaires, tests de base PostgreSQL et CI à exécuter.

Aucun test exécutable n'a été effectué dans cet incrément.
