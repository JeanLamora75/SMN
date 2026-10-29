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

## Incrément suivant — lecture du contexte Sprint
`src/server/sprints/context.ts` refuse désormais le repli sur `smn_installation.mode` pour les équipes de schéma v32 : la résolution du mode Scrum utilise la colonne propre à l'équipe. Les équipes archivées sont exclues en v32. Les versions pré-v32 conservent leurs adaptateurs historiques via `to_jsonb(t)` (les colonnes v32 n'existent pas nécessairement physiquement).
`tests/smn-330-sprint-context.test.ts` contient deux tests de non-régression statiques sur ces règles.
La fonction reçoit toujours un `teamId` ; l'autorisation de cet identifiant par l'appelant est à vérifier au niveau des routes et des services. Les autres services historiques, notamment cadence Kanban et batch Sprint, restent à auditer avant une transformation sûre.
Aucune compilation ni test PostgreSQL réel n'a été exécuté dans cette intervention.

## Lot Sprint — vérification supplémentaire

Tests statiques publiés dans `tests/smn-330-batch-scope.test.ts` : confirmation liée à l'acteur et à l'équipe; prévisualisation filtrée par `team_id`. Les signatures des services et leurs appels dans les routes `admin/sprints/preview` et `admin/sprints/batch` ont été relus sur `main` : correspondance constatée.

**Limites** : tests non exécutés; état CI non confirmé (aucun statut reporté sur le commit interrogé). Les tests de sécurité PostgreSQL multiéquipes, et les appels de prévisualisation hors de ces routes, restent à vérifier avant clôture.

## Sécurisation des parcours complémentaires

- Wizard Sprint : résolution `resolveAdminTeam` avant prévisualisation, recalcul limité à l'équipe du jeton et revalidation avant confirmation. Routes `admin/sprints/wizard/preview` et `wizard/confirm` adaptées.
- Propositions de cadence Kanban : `kanbanCadenceProposal` et `confirmKanbanCadenceProposal` utilisent désormais l'équipe autorisée; la requête des périodes est filtrée par `team_id`. Route `admin/kanban-cadence/proposal` adaptée.
- Tests statiques : `tests/smn-330-wizard-cadence-scope.test.ts` créé.

### État de recette
Une exécution GitHub Actions « Vérification I0 » est en attente pour le dernier commit consulté. Les tests PostgreSQL à deux équipes, la compilation TypeScript et la CI verte ne sont **pas encore attestés**. Par conséquent SMN-330 doit rester **à valider**, et son statut Jira ne doit pas être déclaré « Terminé » à ce stade.

## Bilan transversal du 29 octobre — contrôle de clôture

SMN-330 : résolution d'équipe active, cadence Scrum/Kanban, contexte Sprint, génération par lot et Wizard, confirmations et historique ont reçu des protections par équipe. Le contrat central est utilisé sur le service de cadence Scrum et la liste Kanban (SMN-331). La validation complète reste BLOQUÉE : la dernière CI I0 consultée s'est terminée en échec, et aucune recette PostgreSQL à deux équipes n'a été constatée. Ne pas déclarer la story Done sur Jira.
