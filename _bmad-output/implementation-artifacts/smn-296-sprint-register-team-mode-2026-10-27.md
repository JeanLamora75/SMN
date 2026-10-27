# SMN-296 — Lecture des registres du Sprint par équipe — 27 octobre 2026

Le lecteur `readSprintRegisters` vérifie désormais le mode Scrum propre à `smn_team.agile_mode` lorsque l'installation est en v29, tout en conservant l'ancien mode global sur les schémas précédents. Il vérifie déjà la correspondance `sprint_id` / `team_id` avant toute lecture du snapshot clôturé ou du fournisseur de registres.

Cette modification ne donne pas accès aux registres sans autorisation serveur préalable ; elle corrige seulement le filtrage du mode agile. Les autres lecteurs de registres, les exports et les API de modification restent à auditer. Aucun test ni migration exécuté. Les écritures multiéquipes restent désactivées.
