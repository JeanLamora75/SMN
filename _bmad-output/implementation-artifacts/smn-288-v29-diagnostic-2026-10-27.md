# SMN-288 — Raccordement contrôlé du diagnostic v29

Date : 27/10/2026. Statut : **code publié, non exécuté, tests non effectués**.

## Fichiers de code

- `src/server/teams/agile-migration.ts` : texte immuable du SQL et nom de migration permettant le calcul de checksum.
- `src/server/db/probe.ts` : lecture de 29 migrations maximum, contrôle des colonnes, de la contrainte et des triggers v29 ; préservation du diagnostic v28.
- `src/server/installation/diagnostic.ts` : version 29 reconnue uniquement si checksum, état de migration et intégrité sont cohérents.
- `src/server/accounts/migration.ts` : v29 admise uniquement après contrôles v28 et v29 ; aucune auto-application de v29.
- `scripts/apply-team-agile-migration.ts` : script **manuel** avec `--apply`, sauvegarde existante non vide, source SQL identique, diagnostic préalable v28, verrou transactionnel, contrôle journal (28), écriture version 29 et checksum, diagnostic final.
- `prisma/migrations/20261027_smn288_team_agile_mode/migration.sql` : migration additive ; changement de version dans sa transaction.

## Verrous de livraison

- Ne PAS lancer ce script sur la base réelle sans autorisation explicite.
- La présence d'un fichier de sauvegarde ne garantit PAS que celle-ci soit restaurable : test de restauration sur **copie** indispensable.
- Les garde-fous serveur métier, tous les chemins de création et l'accès aux archives doivent encore être revus dans SMN-289/290/296.
- Le service de création d'équipes exige actuellement le schéma **28** : sur v29 les écritures restent inaccessibles tant que ce service n'est pas adapté. Ne pas activer l'interrupteur de création multiéquipes.
- Aucun build, migration, validation Prisma, test SQL, contrôle Windows ou test de concurrence exécuté dans cette étape.

## Tests à préparer sur Windows 11

`pnpm typecheck`, `pnpm test`, `pnpm build` et validation Prisma selon les scripts disponibles, puis scénario v27 → v28 → v29 sur une copie de base, contrôles de restauration, tentative de changement de mode et protections cross-team.
