# SMN-296 — Lecture de capacité réelle en v29 — 27/10/2026

Deux couches mises à jour conjointement :
- `GET /api/admin/capacity-actual` autorise la branche v29 uniquement après contrôle du rôle administrateur et résolution serveur de l'équipe sélectionnée.
- `readActualCapacity` accepte cette équipe en v29 si elle existe dans l'installation et qu'elle est active ; les anciennes requêtes sans teamId restent réservées à <=27.

`POST` demeure interdit en v28/v29. Les autres indicateurs et historiques doivent être qualifiés séparément. Aucun test, compilation ou migration exécuté.
