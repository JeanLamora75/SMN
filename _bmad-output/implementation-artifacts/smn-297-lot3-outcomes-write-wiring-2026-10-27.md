# SMN-297 — Création des comptes rendus Scrum contextualisée

La route `POST /api/admin/team-calendar/ceremonies/outcome-create` et son formulaire sont raccordés au service `createScopedCeremonyOutcome`. Les entrées sont limitées à décision, action et fait marquant. L'autorisation Admin, le contexte équipe, le sprint non clôturé et l'absence de DDL à l'exécution sont requis. La création transactionnelle cible le Registre, son audit et le lien vers la cérémonie. Verrou `MULTI_TEAM_CONTEXT_READY=false` maintenu.

Test source `tests/smn-297-scoped-ceremony-outcome-create.test.ts` ajouté et non exécuté. Restent : recette SQL sur la seule base de développement, validation des tables et du comportement d'historisation, cas interéquipes et concurrence. Aucune migration, activation ou fusion.
