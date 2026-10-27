# SMN-296 — Téléchargement d'archives PDF : contrôle du mode par équipe

La route de téléchargement PDF vérifie désormais le mode Scrum à partir de `smn_team.agile_mode` en v29 et du mode de l'installation pour les anciennes versions. Elle conserve les contrôles d'appartenance archive/Sprint/équipe et la résolution administrative de l'équipe sélectionnée.

Limite : l'accès aux archives d'une équipe archivée reste à concevoir en lecture seule pour l'administrateur. Le résolveur des équipes actives ne répond pas encore à ce besoin. Aucun test ni compilation exécuté. Pas de migration ni d'activation des écritures multiéquipes.
