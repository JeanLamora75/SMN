# Lot 2 — Formulaire de création contextualisé

Le formulaire de création Scrum/Kanban charge désormais `GET /api/admin/team-cycles?teamId=...` au montage. Il compare l'équipe et le mode reçus au contexte de la page, vérifie la révision de cadence et n'autorise la saisie que lorsque `canCreate` est renvoyé par le serveur et que les verrous de la page l'autorisent. En cas d'erreur de lecture ou d'incohérence, il échoue fermé avec un message explicite.

Aucun verrou global ni drapeau d'écriture modifié. La validation de la création doit toujours être refaite par le serveur POST ; ce contrôle client améliore la cohérence UX sans être une frontière de sécurité. Aucun test/build/migration exécuté. Prochaine étape : index Scrum/Kanban par équipe et recette.
