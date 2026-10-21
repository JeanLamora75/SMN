# SMN-29 — Journal des opérations métier sensibles

**Story** : [SMN-29](https://lmn24.atlassian.net/browse/SMN-29), Epic 2, Story 2.1.

## Réalisation I0

Le journal est accessible uniquement à l'Administrateur depuis **Administration → Journal des opérations**, à l'adresse `/app/admin/audit`. Une API `GET /api/admin/audit` fournit le même contenu sous une projection **fermée et strictement bornée à 100 événements**.

Sources unifiées, sans dupliquer leurs traces :
- `smn_general_settings_audit` : modifications effectivement persistées des paramètres généraux et préférences de langue/apparence.
- `smn_auth_audit` : changements de mot de passe, préparation/récupération du mécanisme de secours.
- **Nouvelle table** `smn_account_audit` : créations et changements de rôle/état actif des comptes, avec journalisation transactionnelle.

Chaque entrée contient une **référence unique d'opération**, une date UTC, l'identifiant de l'auteur (ou inconnu si l'historique ne le permet plus), l'action, l'ID d'objet, le périmètre de l'installation, le résultat **Réussie** et les différences pertinentes parmi les champs autorisés. Seules les traces de succès ayant été effectivement validées sont persistées ; une erreur ou un refus ne donne jamais lieu à un faux événement de succès. Le journal n'est pas un enregistreur de tous les clics et consultations.

## Règles de sécurité

- L'API vérifie la session active et le rôle Administrateur côté serveur, par `authorizeApi`. La page répète ce contrôle et refuse l'accès à un Utilisateur ou à un visiteur.
- Les anciens JSONB des paramètres et les nouveaux JSONB des comptes ne sont **jamais envoyés bruts**. Les différences sont projetées par liste blanche : rôle, état d'accès, langue, thème, palette, pays de référence. Rien concernant adresse e-mail, mot de passe, empreinte de mot de passe, phrase de secours, jeton ou URL privée.
- La base n'a pas de colonne secrète dans `smn_account_audit` ; les références concernent un ID de compte, jamais un nom d'utilisateur ou une adresse de contact.
- Les créations et mises à jour de comptes utilisent `BEGIN` / `COMMIT` pour **l'opération et son audit** ; en cas d'échec de l'audit, `ROLLBACK` annule les deux.
- Les requêtes refusées ou invalides ne créent aucun audit de réussite ; un changement réellement nul n'ajoute pas d'événement.
- Les erreurs de lecture renvoient un état générique et ne journalisent aucun secret.

## Base de données

Migration additive PostgreSQL **v7** :
`src/server/audit/account-migration.ts`, correspondant exactement à
`prisma/migrations/20261021_smn29_account_audit/migration.sql`.

`ensureAccountsSchema` applique cette migration à une installation v6 dans la transaction de migration existante, en vérifiant checksum et colonnes ; `probePostgres` et `classifySnapshot` connaissent désormais la version 7. Aucune réinstallation n'est demandée.

## Critères d'acceptation

| Critère | Réponse |
|---|---|
| AC1 | Horodatage UTC, auteur, action, objet, périmètre, résultat et différences restreintes |
| AC2 | Un audit par mutation de compte effective, dans **la même transaction** ; anciennes traces réutilisées avec leur ID d'origine |
| AC3 | Seuls les succès commis apparaissent ; tout échec est refusé/annulé sans succès fictif |
| AC4 | Consultation API et écran réservés aux Administrateurs ; refus testé pour utilisateurs et anonymes |
| AC5 | Les clics de navigation, affichages de page et prévisualisations ordinaires ne sont pas journalisés |

## Validation et recette Windows

Fichiers de tests : `tests/audit-journal.test.ts`, `tests/setup-integration.test.ts`, `tests/authorization.test.ts`, `tests/private-navigation.test.ts` et assertions HTTP dans `scripts/verify-http-ci.mjs`.

À exécuter sur l'installation de développement ou dans la CI sur une base de test éphémère :

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Scénarios : ouvrir le journal en Administrateur, vérifier les créations et changements de rôle, les préférences et traces de sécurité ; tenter la même URL/API sans session et sous Utilisateur ; provoquer un doublon de compte et vérifier l'absence d'audit réussi ; effectuer un changement idempotent ; vérifier l'absence de secrets et la date UTC. Contrôler la migration v6→v7 sur une **copie de test**, jamais en forçant une base utilisateur.

**Limites explicites** : les tests sont écrits mais non déclarés exécutés à cette étape ; les traces plus anciennes que l'introduction de `smn_account_audit` ne peuvent pas être reconstruites. La journalisation des futures opérations métier devra être intégrée dans leurs propres stories, avec le même principe transactionnel et une politique de rétention documentée. Aucune conformité juridique ou réglementaire n'est revendiquée.
