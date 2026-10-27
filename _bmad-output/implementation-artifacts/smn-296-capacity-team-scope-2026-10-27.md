# SMN-296 — Isolation moteur capacité par équipe — 27/10/2026

Le moteur `src/server/capacity/engine.ts` sélectionne maintenant, lorsqu'un `teamId` explicite lui est fourni, une équipe dans le schéma v28 ou v29, vérifie l'identifiant et refuse les équipes archivées en v29. Le mode Scrum/Kanban est déterminé par `smn_team.agile_mode` en v29 et par l'installation en v28. La branche historique sans `teamId` reste réservée à la version <=27 et échoue fermée en v28/v29.

Les affectations étaient déjà filtrées via `a.team_id=$1` ; les versions sont chargées par IDs d'affectations, les absences/calendriers par IDs de membres ayant des affectations dans l'équipe. Les absences restent des données personnelles pouvant traverser les équipes par conception ; leur droit de lecture via l'API doit donc être révisé séparément. La lecture du moteur seule ne constitue **pas une autorisation** : ses consommateurs doivent établir le contexte d'équipe autorisé avant tout appel.

Deux tests ont été rédigés, sans exécution. Aucune migration ni activation des API multiéquipes. SMN-296 reste en cours.
