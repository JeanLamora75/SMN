# SMN-296 — Protection des transitions de cycles — 27/10/2026

**Implémentation publiée, non testée.**

Le service `src/server/teams/period-state.ts` appelle désormais `assertActiveTeamResource` avant les mutations d'état d'un Sprint ou d'une période Kanban. Une transaction verrouille également la ligne de l'équipe avec `FOR UPDATE` et vérifie son appartenance à l'installation du compte appelant et son état non archivé. Le verrou demeure jusqu'au COMMIT, pour empêcher une opération d'archivage concurrente de passer entre le contrôle et les transitions. La lecture dynamique de `is_archived` préserve la compatibilité des tables v28 sans cette colonne.

**Limites :** ce raccordement ne concerne que le service de rapprochement des états des cycles. Il ne protège pas automatiquement toutes les routes de création, d'édition, de suppression, les membres, la capacité ou le calendrier. La future procédure d'archivage doit elle aussi verrouiller l'équipe et l'installation dans un ordre cohérent. Aucun test SQL, test de concurrence ou compilation exécuté. Ne pas activer les écritures multiéquipes.
