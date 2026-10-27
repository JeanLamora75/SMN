# Lot 2 — Liste des cycles rattachée à la page multiéquipes

Le composant TeamCycleList est désormais importé et affiché dans `/app/admin/team-cycles` avec le teamId et le mode Agile résolus côté serveur. La liste utilise `GET /api/admin/team-cycles/list`, qui filtre les cycles par équipe. La création reste bloquée par les verrous existants.

Raccordement vérifié par relecture du fichier publié sur la branche de la PR #204. Aucun build ou test fonctionnel exécuté. À compléter : gestion de la pagination Scrum, sélection du contexte actif dans le Cockpit Agile et recette interéquipes.
