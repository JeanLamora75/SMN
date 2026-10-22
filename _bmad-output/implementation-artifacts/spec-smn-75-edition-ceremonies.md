# SMN-75 — Personnaliser une occurrence ou une série de cérémonies

Jira : https://lmn24.atlassian.net/browse/SMN-75

## Développement proposé
- API de consultation des cérémonies /api/admin/sprints/ceremonies.
- PATCH /api/admin/sprints/ceremonies/[id] avec révision optimiste, provenance `customized` et audit avant/après horodaté.
- Modification ponctuelle de la date/heure UTC et de la durée, ou modification des Daily **futurs** à partir de l'occurrence choisie ; les autres types restent individuels.
- Occurrences dont le statut n'est plus `scheduled` protégées de l'édition par ce parcours.
- L'historique conserve le créneau initial et le nouveau, sans changer les autres occurrences.
- Contrôle de recouvrement non bloquant lors de l'enregistrement ; seul l'événement sélectionné ou la série explicitement visée sont modifiés.
- UI et traductions FR/EN. Saisie d'heure explicitement en UTC dans ce premier écran.

## Réserves de validation
- Les modifications remplacent provisoirement les segments de la cérémonie par un segment unique. La compatibilité avec la pause déjeuner introduite dans SMN-73 nécessite encore une conception et une recette de resegmentation ; le critère de non-déplacement hors périmètre doit être vérifié.
- Le moteur de recalcul de calendrier devra explicitement exclure les occurrences personnalisées ou à statut Tenue / Non tenue / Annulée ; la création actuelle de cérémonies utilise un ON CONFLICT et n'exécute pas de recalcul.
- Les collisions avec les événements personnels non intégrés (SMN-74) restent hors couverture.
- Validation Prisma, compilation TypeScript, tests PostgreSQL, concurrence et recette non exécutés. GitHub Actions indisponible.
- Ne pas déclarer la Story terminée avant ces vérifications et les corrections éventuellement requises.
