# SMN-333 — Contrôles d'intégration PostgreSQL v31 → v32

29 octobre 2026 — **Démarrage, validation non acquise**.

## Exigence Jira
Sur une copie v31, migrer v32 et contrôler authentification, diagnostic, équipe vide modifiable, équipe avec cycle verrouillée, calendrier, rapports et isolation Koala/Panda, et refuser une v32 incomplète.

## Premier incrément publié
`tests/smn-333-v31-v32-postgres.test.ts` : sur GitHub Actions avec PostgreSQL 18 et uniquement la connexion temporaire `smn_ci`, création d'une **base distincte aléatoire** pour éviter les collisions avec les autres tests; création d'un **sous-ensemble de schéma v31** avec deux équipes et cycles historiques, application de la migration SQL v32 réelle, contrôle des cycles conservés, des modes Agile, de la version 32 et de la contrainte de mode. Suppression de la base isolée à la fin.

Deuxième test : un snapshot v32 sans contraintes et colonnes requises doit être rejeté par `assessSchemaIntegrity`.

## Limites impératives
Ce premier test utilise une **fixture partielle v31**, et non une copie complète d'une base utilisateur. Il ne garantit ni la migration réelle des 31 migrations, ni les API de login, équipe, calendrier et reporting, ni l'absence de défaut après migration sur des données complexes. Ces scénarios restent à implémenter et à exécuter avant clôture. Ne jamais exécuter ce test destructif sur la base personnelle.

## Dépendance SMN-332
Le job SMN-332 était encore en cours d'exécution sur le commit corrigé lors du démarrage. Le succès de SMN-332 n'est pas établi et doit être vérifié séparément.
