# SMN-296 — Verrouillage des écritures d'affectation membre

Le service `saveTeamAssignmentRevision` de `src/server/members/team-assignment-write.ts` verrouille dorénavant `smn_team` avec `FOR UPDATE` avant de verrouiller le membre et son affectation. La requête confirme que l'administrateur appartient à l'installation, que celle-ci est initialisée en v28/v29, et que l'équipe n'est pas archivée. Compatibilité v28 assurée via `to_jsonb(t)` lorsque la colonne `is_archived` n'existe pas.

Test préparé : `tests/smn-296-assignment-team-lock.test.ts`. Aucun test ni compilation exécuté. Aucun endpoint supplémentaire ouvert. Il reste à sécuriser les autres écritures de membres et l'ensemble des lectures d'historiques interéquipes. Écritures multiéquipes toujours désactivées.
