# Incident de connexion — refus du schéma v27 (23/10/2026)

## Retour utilisateur
Après correction du build Windows, l'écran de connexion affiche :
> La base SMN n’est pas disponible. Réessayez après avoir vérifié son démarrage.

Le formulaire `POST /api/auth/login` convertit **toute exception** d'authentification en `503 service-unavailable` : ce message ne prouve pas à lui seul une coupure PostgreSQL.

## Analyse du code sur main
1. `src/app/login/page.tsx` affiche le formulaire seulement si `currentInstallationDiagnostic()` renvoie `initialized`.
2. Le formulaire appelle `POST /api/auth/login` qui utilise `withAuthDb`.
3. `withAuthDb` passe toujours par `ensureAccountsSchema`.
4. `src/server/installation/diagnostic.ts` connaît la version 27 et sa migration `MEMBER_IDENTITY_MIGRATION`.
5. **Défaut confirmé** : `ensureAccountsSchema` n'autorisait que les versions 1 à **26** ; dès qu'une base avait été volontairement migrée vers 27, l'authentification échouait avec `smn-schema-incompatible`, remonté comme `service-unavailable`.

L'état/version PostgreSQL réellement installé sur le PC utilisateur **n'a pas été contrôlé**. Le défaut de code est certain, son rôle dans l'incident reste à confirmer par recette.

## Correction GitHub main
- `src/server/accounts/migration.ts` : compatibilité explicite des versions entières 1 à **27** ; refus des versions inconnues. Sur version 27, contrôle obligatoire de l'enregistrement officiel de migration (checksum et succès) et de la présence des **sept colonnes** du schéma d'identité. Ne migre jamais implicitement une base v26 vers 27.
- `tests/auth-schema-v27.test.ts` : tests ciblés version reconnue/inconnue, migration v27 complète/incomplète et rétrocompatibilité v26.
- `docs/INSTALLATION.md` : diagnostic et procédure Windows sans mutation.

## Vérifications proposées, non exécutées dans cet environnement
1. Pull origin `main`, arrêter l'ancien serveur Next.
2. `pnpm exec tsx --test tests/auth-schema-v27.test.ts`
3. `pnpm typecheck`, `pnpm build`, `pnpm start`.
4. Se connecter sur `127.0.0.1:3003`; vérifier réponse HTTP et accès au tableau de bord.
5. En cas d'échec : `Invoke-RestMethod http://127.0.0.1:3003/api/diagnostic | ConvertTo-Json` ; éventuellement `pnpm exec tsx scripts/migrate-member-identity-v27.ts` **sans `--apply`** afin d'identifier la version.

Aucune exécution de test TypeScript, de build sur Windows, de requête PostgreSQL, de migration, de suppression de données ou de modification Jira réalisée par l'assistant. Le code est publié, **la résolution opérationnelle n'est pas encore certifiée**.

## Prévention
La version de schéma acceptée par `ensureAccountsSchema` doit être mise à jour et testée lors de chaque évolution additive explicite. Une future amélioration pourra différencier les erreurs de connexion SQL des schémas non reconnus, **sans révéler les secrets**.
