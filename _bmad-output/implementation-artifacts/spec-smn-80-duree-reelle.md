# SMN-80 — Durée réellement constatée des événements

Jira : https://lmn24.atlassian.net/browse/SMN-80

## Livré en code
- Durée réelle facultativement persistée indépendamment de l'horaire prévu pour les cérémonies standards, modèles personnalisés et réunions exceptionnelles.
- Valeur initialement affichée égale à la durée prévue via COALESCE ; aucune qualification automatique Tenue depuis cette fonction.
- Saisie du seul nombre de minutes (0 à 1440) ; écarts positifs et négatifs affichés.
- Protection serveur des périodes au statut closed. Historique d'audit des modifications avec auteur, ancienne et nouvelle durée.
- API administrateur GET/PATCH `/api/admin/sprints/actual-duration`; interface FR/EN.
- Aucune commande SQL d'édition ne modifie `starts_at`, `ends_at` ou les autres réunions.

## Réserves et recette
- L'archivage individuel d'événement n'est pas encore modélisé ; la protection actuelle couvre les Sprints clôturés. AC5 partiel.
- La consultation ne matérialise pas en base la durée par défaut ; elle est calculée à la lecture.
- Vérifier les autorisations exactes, les statuts spéciaux et la traçabilité en recette.
- Compilation TypeScript, validation Prisma et migrations PostgreSQL non exécutées. GitHub Actions indisponible.
- PR en brouillon, aucune fusion vers main.
