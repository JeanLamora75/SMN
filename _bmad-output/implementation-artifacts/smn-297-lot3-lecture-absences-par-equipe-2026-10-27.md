# SMN-297 — Lecture contextualisée des absences

Ajout de `GET /api/admin/members/[id]/team-absences` et du service `readScopedTeamAbsences`. Autorisation Admin et garde de disponibilité obligatoires. Le filtre retourne uniquement les absences couvertes intégralement par l'affectation à l'équipe demandée, sans chevauchement avec une autre équipe. Le formulaire utilise cette lecture lorsqu'un `teamId` est fourni et conserve l'API historique sinon.

Point de vigilance : les lignes personnelles sont consultées côté serveur puis filtrées avant la réponse ; la lecture SQL directement filtrée et les tests d'intégration restent à consolider. La modification des réunions reste à terminer. Aucun test ni migration exécuté.
