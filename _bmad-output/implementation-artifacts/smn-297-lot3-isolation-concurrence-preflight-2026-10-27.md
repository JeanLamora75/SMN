# SMN-297 — Préparation de la recette d'isolation, concurrence et PostgreSQL

Le service de création de compte rendu verrouille désormais dans sa transaction la cérémonie et son sprint (`FOR UPDATE OF s,c`) avant de relire le détail et de créer les liens au Registre. Il vérifie la correspondance de sprint et d'équipe. Le test de contrat `tests/smn-297-lot3-isolation-and-locks.test.ts` contrôle la présence des gardes et des verrous ; il ne remplace pas une intégration PostgreSQL.

## Recette locale avant V1 — une seule base de développement

1. Vérifier sans DDL que les tables `smn_registry_item`, `smn_registry_item_audit`, `smn_calendar_meeting_outcome_link`, `smn_sprint_ceremony_status_history` et `smn_meeting_actual_duration_audit` existent.
2. Contrôler que les index/contraintes applicables, y compris les clés étrangères, sont présents ; exécuter les tests statiques, compilation TypeScript et tests d'intégration sur le PC Windows.
3. Cas équipe A/B : lecture d'une cérémonie de B sous contexte A = 404 ; mutation de B sous contexte A = refus sans création de ligne ni audit.
4. Tester un Sprint clôturé, un compte non admin, un teamId invalide, deux demandes concurrentes de replanification et un numéro de révision périmé. Vérifier que les erreurs ne produisent aucune écriture partielle.
5. Ne pas activer `MULTI_TEAM_CONTEXT_READY` tant que tous les parcours critiques ne sont pas validés.

Aucun test ni modification de schéma n'a été exécuté ici ; ce document décrit les vérifications à effectuer.
