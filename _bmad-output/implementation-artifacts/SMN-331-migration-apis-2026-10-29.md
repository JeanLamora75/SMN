# SMN-331 — Migration des API vers le contrat central

Date : 29 octobre 2026 — **Travaux partiels publiés sur main, story non validée**.

## Périmètre Jira
Auth, équipes, calendriers, sprints, Kanban et paramètres : éliminer les contrôles locaux redondants, conserver droits d'accès, réponses publiques et adaptations historiques, sans migration implicite.

## Changements publiés dans cet incrément
- `src/server/accounts/migration.ts` : maximum des versions d'authentification issu de `CURRENT_SCHEMA_VERSION`.
- `src/server/sprints/cadence.ts` : la capacité `multi-team` remplace le test local de versions 28–31 ; la v32 emprunte désormais correctement la voie de sélection d'équipe autorisée.
- `src/app/api/admin/kanban-periods/list/route.ts` : utilisation de `evaluateSchemaCapability(schema,"multi-team")`.
- `src/app/api/team-calendar/route.ts` : même remplacement centralisé.
- `tests/smn-331-critical-api-adoption.test.ts` : tests statiques associés aux chemins Auth, Scrum et Kanban.

## Adaptations historiques conservées
Les versions <=27 conservent leurs chemins monoéquipe dans les services qui les supportent. Les versions >32 ne doivent pas être activées par des gardes locaux. Les chemins `resolveAdminTeam` restent nécessaires pour l'autorisation, le `teamId` de la requête ne constitue pas un droit.

## Risques et travaux restants
- La migration transversale de toutes les autres API et la revue exhaustive des gardes locaux n'ont pas été achevées.
- Les services de calendrier/Kanban comportent encore des fonctions `ensure*` pouvant effectuer des DDL ; la suppression des mutations implicites requiert une revue du contrat historique et du schéma physique.
- La dernière CI terminée au début de l'intervention était rouge ; les nouveaux commits doivent encore être compilés et testés.
- La recette d'isolation Koala/Panda et la vérification des réponses HTTP sont indispensables avant clôture.
