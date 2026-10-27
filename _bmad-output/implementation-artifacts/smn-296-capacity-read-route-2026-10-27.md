# SMN-296 — Lecture capacité : autorisation serveur v29 — 27/10/2026

La route `GET /api/admin/development-capacity` autorise maintenant la consultation v29 pour l'administrateur après résolution obligatoire de l'équipe côté serveur via `resolveAdminTeam`. Le moteur de calcul, les valeurs manuelles et la photo initiale utilisent tous l'identifiant résultant ; ces lecteurs filtrent par équipe. Les équipes archivées sont rejetées par le résolveur. Les anciens comptes `user` demeurent exclus de ce parcours en v28/v29.

`POST` reste interdit pour les schémas >=28. Les autres consommateurs des calculs de capacité et l'ensemble des mutations multiéquipes restent à qualifier. Aucun test ni build exécuté, aucune migration appliquée.
