# Lot 2 — Contexte du tableau de bord en schéma v29

`readAccountDashboard` reconnaît maintenant v29 et résout l'équipe via `resolveAdminTeam` pour l'acteur administrateur. `readSprintContext` emploie le mode par équipe (`smn_team.agile_mode='scrum'`) en v29, exclut les équipes archivées et garde la condition historique `installation.mode` pour les versions antérieures. Le fragment SQL dépend de la version de schéma pour éviter de référencer des colonnes absentes dans les anciennes installations.

Ce changement ne prouve pas encore l'isolation des sous-lecteurs d'indicateurs, de capacité, de registres et d'événements. Ils doivent être audités individuellement avant toute activation du sélecteur. Aucun test, build, migration ou déverrouillage exécuté.
