# SMN-296 — Premier incrément d'isolation v29 — 27/10/2026

**Périmètre publié** : `src/server/teams/resolve.ts` accepte la v28 et la v29, conserve le cloisonnement administrateur/installation et refuse les équipes archivées pour la sélection explicite et la préférence sauvegardée lorsque v29 est appliquée. Le mode métier en v29 provient de `smn_team.agile_mode` et non du mode global d'installation. Quatre tests isolés ont été ajoutés dans `tests/smn-296-resolve-team.test.ts`.

**Important** : les tests n'ont pas été exécutés ; aucune migration n'a été appliquée. Les archives demeurent accessibles seulement via les futurs parcours dédiés en lecture seule, non via le sélecteur opérationnel.

**Sécurité non terminée** : toutes les API de sprints/périodes, membres, capacité, calendrier, registre, imports et reporting doivent encore imposer le contexte d'équipe à chaque accès et interdire les écritures sur archive. `withLegacyTeamApi` échoue toujours en v28/v29, conformément à la stratégie restrictive. Le déblocage de cette couche avant l'audit complet n'est pas autorisé.
