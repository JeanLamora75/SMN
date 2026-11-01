# SMN-351 — Qualification du retrait sécurisé (préparation, aucun DROP)

## Périmètre strict
Quatre tables candidates uniquement : `smn_sprint_story_points`, `smn_sprint_ticket_counts`, `smn_sprint_story_points_audit`, `smn_sprint_ticket_counts_audit`.

Les snapshots de clôture, exports et historiques métier, tables de capacité et référentiels d'indicateurs v33 sont **hors périmètre de suppression**. Les adaptateurs `src/server/compat-v32/` restent disponibles pour les installations v32. Leur présence n'est **pas** une preuve de compatibilité après retrait des tables sur une installation v33 : il faudra des tests sur une copie sans ces quatre tables.

## Qualification avant intervention

1. Exécuter `pnpm db:prove:smn-351`. Le script orchestre **trois** exercices isolés : signatures neuf-v33 vs v32-migré, conservation d'un historique v32 après migration et sauvegarde/restauration `pg_dump`/ `pg_restore` d'une base de test v33 avec lignes candidates. Chaque essai utilise des bases temporaires distinctes de `smn`.
2. Un manifeste local `.next/smn-351-proof.json` est écrit **uniquement si les trois preuves réussissent**. Il est rattaché au point de connexion local et expire après 24 h. Il est un témoin de test, pas une autorisation de suppression et ne doit pas être considéré comme une preuve cryptographique inviolable.
3. Exécuter `pnpm db:preflight:smn-351` : transaction `READ ONLY`, inventaire des objets, dépendances, ligne par table candidate et SHA-256 du contenu sérialisé. Aucun contenu métier détaillé n'est affiché.
4. Si une table candidate est non vide, le précontrôle reste bloqué par `candidate-data-present-requires-reviewed-backup`. Toute politique de conservation, d'archivage ou de migration doit être décidée explicitement avant retrait. Ne jamais conclure à une absence de données sur la seule absence de dépendances PostgreSQL.

## Retrait ultérieur — procédure à qualifier séparément

**Aucun script de DROP sur l'installation utilisateur n'est livré ici**. Une nouvelle opération future exigera, avant toute autorisation :

- sauvegarde complète `pg_dump --format=custom` de la base concernée, fichier local conservé hors du dépôt ;
- vérification `pg_restore --exit-on-error` dans une **nouvelle** base isolée et comparaison des quantités / empreintes de toutes les données conservées ;
- preuve que les tables candidates ne contiennent plus de données à préserver, avec décision de rétention documentée et validation humaine ;
- essai du retrait des quatre relations **seulement dans une copie** puis lancement des tests d'application et migration v32 → v33 sur cette copie ;
- validation explicite par l'utilisateur de la fenêtre d'intervention et du plan de retour arrière ;
- recontrôle du schéma/de l'inventaire juste avant intervention et arrêt immédiat si les empreintes diffèrent.

## Retour arrière

En cas d'échec pendant un essai, ne toucher à aucune base utilisateur. Pour une intervention réelle future, restaurer **dans une nouvelle base**, vérifier l'intégrité et seulement alors planifier le basculement de connexion. Ne jamais restaurer par-dessus la base en service ni supprimer l'archive avant validation complète.

État du lot : **préparation et qualification seulement**, suppression non autorisée (`cleanupAuthorized:false` et `authorized:false`).
