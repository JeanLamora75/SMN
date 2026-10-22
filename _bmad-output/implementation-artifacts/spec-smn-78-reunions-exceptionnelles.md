# SMN-78 — Réunions exceptionnelles ponctuelles

Jira : https://lmn24.atlassian.net/browse/SMN-78

## Implémentation
- API Administrateur : GET/POST /api/admin/sprints/exceptional-meetings ; GET /api/admin/sprints/exceptional-meetings/[id] pour l'audit.
- Nom obligatoire, horaire de début UTC exact, durée 1–480 min, rattachement à un Sprint existant, plages limitées aux bornes Sprint.
- Réunion ponctuelle conservée dans une table distincte sans aucune fréquence ni mécanisme de reproduction automatique.
- Alerte non bloquante après enregistrement en cas de chevauchement avec les cérémonies standards ou réunions exceptionnelles de la même équipe ; aucune modification des événements tiers.
- Liste côté Administrateur avec identité, statut, horaires et historique de création ; UI FR/EN.
- Création dans un Sprint clôturé interdite côté serveur : il faut réouvrir le Sprint via le parcours approprié.

## Limites à corriger/recetter
- La modification de l'événement après création, les rectifications et leur historique ne sont pas encore proposés ; seul l'audit de création est disponible. AC4 partiel.
- Les modèles récurrents personnalisés, réunions personnelles et fermetures collectives ne sont pas encore inclus dans le contrôle des conflits. AC3 partiel.
- L'accès par la vue calendrier centrale n'est pas encore raccordé. AC4 partiel.
- Vérifier statut exact de clôture dans toutes les transitions, protection côté API, collisions, fuseaux, droits et absence de reproduction.
- Compiler TypeScript, Prisma et exécuter la migration/recette PostgreSQL. GitHub Actions indisponible.

État : code publié sur branche dédiée, tests non exécutés, PR brouillon, non fusionnée.
