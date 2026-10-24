# Epic 7 — C2 : rattachement qualitatif Kanban explicite (24 octobre 2026)

## Vérification de l'existant
Le registre partagé `smn_registry_item` est rattaché à une équipe. Les liens de cycle disponibles jusqu'à présent (`smn_registry_cycle_link`) ciblent exclusivement `smn_sprint` : les réutiliser pour Kanban serait erroné.

## Implémentation ciblée
- `src/server/kanban/qualitative.ts` définit `smn_kanban_registry_link` (period_id/item_id), sans inférence par dates, type ou équipe seule.
- Lors de la clôture Kanban, `captureKanbanQualitative` sélectionne uniquement les liens Kanban explicitement présents et les enregistre dans le nouvel instantané JSON Vn.
- Si le registre ou le rattachement Kanban n'existe pas, l'instantané inscrit `no-explicit-kanban-links` et une liste vide, sans créer une valeur fictive.
- Les anciennes versions Vn et leurs fichiers PDF ne sont ni modifiés ni reconstruits.

## Limitations importantes / suite
- Une interface/API d'association et de dissociation des risques, obstacles, dépendances et faits marquants aux périodes Kanban reste nécessaire, avec audit et interdiction de modifier un cycle clôturé.
- Aucune migration PostgreSQL n'a été exécutée. La fonction `ensureKanbanQualitativeLinks` définit le schéma mais ne crée pas de liens ou d'éléments de registre.
- Revoir les permissions de visibilité individuelles avant toute exposition dans un document partagé. La capture se limite actuellement aux éléments explicitement liés et à l'équipe.
- Tests d'intégration PostgreSQL, compilation TypeScript, contrôle de concurrence et recette manuelle encore non exécutés.

**Statut :** consolidation partielle. Ne pas marquer C2 ni l'Epic 7 comme terminés.
