# SMN-32 — BMAD Story 2.4 : Conservation des sauvegardes gérées

**Story :** [SMN-32](https://lmn24.atlassian.net/browse/SMN-32) — Epic 2, FR-68/69/72, D-PRD-135/A11, AD-27/31, SEC-03/04.

## Contrat et périmètre

**AC1** — La migration additive de schéma **v8** crée `smn_backup_retention` et initialise pour `singleton` la durée à **30 jours**. Les anciennes installations migrent automatiquement via `ensureAccountsSchema`. Aucun fichier métier n'est modifié.

**AC2** — `PATCH /api/admin/backups/retention` (administrateur authentifié et origine contrôlée) reçoit uniquement `{days,revision}`. Durée entière **1 à 3650 jours**. La révision optimise les mises à jour concurrentes ; le verrou PostgreSQL de sauvegarde sérialise les modifications avec le nettoyage et la création. Une mise à jour réelle est horodatée et conservée dans `smn_backup_retention_audit` avec l'acteur, l'ancienne et la nouvelle durée.

**AC3** — `GET /api/admin/backups` inclut la politique et les identifiants des paquets **intègres**, sous `packages/<UUID>`, plus anciens que le seuil UTC. Le nettoyage n'est **pas automatique** : l'administrateur prévisualise le nombre, clique « Lancer le nettoyage », confirme dans la boîte native du navigateur ; `POST /api/admin/backups/retention` reçoit un accusé `confirm:true`, la révision et l'ensemble des UUID. Sous verrou PostgreSQL, le serveur revérifie l'inventaire réel et exige l'égalité exacte avec les UUID soumis. Les paquets sont déplacés hors de la liste visible, puis supprimés ; une ligne `package_deleted` avec acteur et UUID suit chaque suppression effective. Si la liste change, code 409, **aucune suppression**.

**AC4** — La rétention ne cible jamais `SMN_PRIVATE_DOCUMENTS_DIR`, les PDF, TXT, snapshots Vn et autres fichiers métier ; elle opère exclusivement sur les paquets chiffrés complets et intègres de `SMN_BACKUP_DIR/packages`. Les sauvegardes partielles, corrompues, non vérifiables ou inconnues ne sont pas éligibles.

**AC5** — La politique explique dans l'interface FR/EN que les copies exportées hors de ce dossier ne sont ni surveillées ni supprimées par SMN.

## Garde-fous techniques

- Les chemins viennent exclusivement du répertoire racine configuré côté serveur et d'identifiants UUID normalisés ; aucun chemin absolu fourni par le client.
- Verrou `pg_try_advisory_lock(20261021,30)` partagé avec SMN-30 ; signature et intégrité issues du contrôle complet SMN-31.
- Limite actuelle du listing SMN-31 : 200 paquets publiés par chargement. En cas de dépassement, refus explicite du cycle plutôt que nettoyage partiel silencieux.
- Un arrêt durant `rm` peut laisser un répertoire caché `.retention-removing-<UUID>` : il n'est pas présenté comme conservé ni restaurable. Son nettoyage manuel après diagnostic relève de l'exploitation, sans suppression aveugle.
- Une interruption entre suppression physique et insertion d'audit doit être examinée par l'opérateur : le service ne revendique pas alors une suppression attestée. Les anciennes traces de contrôle d'intégrité ne sont jamais une preuve de conservation physique.
- La politique ne certifie ni restauration testée ni effacement des copies externes.

## Preuves attendues et réserves

Tests rédigés : `tests/backup-retention.test.ts` (initialisation SQL, bornes de saisie, seuil temporel, exclusion de paquets invalides, révision/audit, suppression sous répertoire borné et conservation d'une archive PDF simulée). Compléter par des essais HTTP Administrateur/Utilisateur, tests de conflit réel, incident en milieu de nettoyage et PostgreSQL 18.6.

Exécuter sur le PC : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis recette de création et nettoyage **uniquement dans un dossier de sauvegardes de test**. Un test créé et une PR publiée ne prouvent pas une exécution de test.

La clôture Jira dépend de la qualification sur le poste pilote. 
