# SMN-132 — Échecs d'export et reprises sans archives incomplètes

Jira : https://lmn24.atlassian.net/browse/SMN-132 (Story 6.23).

## Incrément sur main
- Codes d'erreur sûrs `publicExportFailure`, sans exposer les erreurs SQL ni les chemins de fichiers ; diagnostic réduit à un code stable et à une empreinte abrégée de référence.
- Validation des identifiants de reprise, verrou transactionnel PostgreSQL et recherche d'un succès antérieur, utilitaires préparatoires pour l'idempotence.
- Correction du service de stockage privé : un échec après commit ne doit plus supprimer le PDF déjà référencé dans la base.
- Tests de contrat `tests/smn-132-export-reliability.test.ts`.

## Dépendances / statut
- **Non terminé** : SMN-127 ne possède pas de vrai producteur PDF serveur. Le service d'archivage SMN-128 n'est pas déclenché par un export.
- L'identifiant idempotent et la recherche de succès ne sont pas encore raccordés à `storeFinalPdfArchive` ; aucune garantie de dédoublonnage transactionnel de bout en bout n'est fournie. AC3 partiel.
- Détection et récupération des orphelins après interruption brutale, vérification transactionnelle disque/DB et tests de faute injectée à implémenter. AC1, AC2, AC4 incomplets.
- Aucun code ne doit journaliser l'erreur brute ou le contenu PDF par défaut.
- Aucun test, typecheck, build, ni recette PostgreSQL/Windows exécuté dans cet environnement. Jira reste ouverte.

Commandes : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-132-export-reliability.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
