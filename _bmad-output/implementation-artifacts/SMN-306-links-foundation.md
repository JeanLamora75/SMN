# SMN-306 — Liens : fondation serveur (PR de travail)

Périmètre : migration PostgreSQL additive, API admin et service de catalogue.
Aucune modification de l'interface, du Studio Rapports ni des rapports publiés.

## Routes

- `GET /api/admin/links?teamId=<id>` : transverses + liens de l'équipe demandée.
- `GET /api/admin/links/<id>?teamId=<id>` : détail contrôlé par équipe.
- `POST /api/admin/links` : création ; corps JSON `title,url,description,categoryId,scope,teamId`.
- `PUT /api/admin/links/<id>` : mêmes champs + `revision` (verrou optimiste).
- `DELETE /api/admin/links/<id>` : corps JSON `{"revision":1}`.
- `GET /api/admin/links/categories` : lecture des catégories.

Toutes les écritures sont réservées aux administrateurs par les contrôles existants. Les comptes user ne sont pas autorisés : SMN-282 ne fournit pas encore leur modèle d'habilitations multiéquipes.
Pas de détection serveur/fetch des sites externes. URL HTTP(S) uniquement. Éviter d'utiliser cette API pour le Studio avant SMN-311/312.

## Migration et sécurité

`prisma/migrations/20261027_smn306_links/migration.sql` :
- crée les tables `smn_link_category`, `smn_link`, `smn_link_audit` ;
- catégories rattachées à l'installation (globales pour ses équipes) ;
- FK composites installation/équipe et installation/catégorie ;
- liens transverses sans équipe, liens spécifiques avec équipe obligatoire ;
- audit conservé après suppression du lien source.

**Attention** : migration non appliquée ici. Ne pas exécuter `prisma migrate deploy` automatiquement sans vérifier le moteur de migrations SMN et la synchronisation du schéma Prisma. Le `schema_version` applicatif reste à 28, selon le verrou existant de SMN-282. Les catégories sont encore vides ; leur gestion est prévue en SMN-310. Ne pas appliquer cette migration à une base non sauvegardée.

## Vérifications à faire sur Windows 11

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Tester deux équipes A/B, admin et user, URL dangereuse, révisions concurrentes et suppressions. Aucune de ces commandes n'a été exécutée pour cette PR.

## Limites connues
- Le modèle Prisma des trois tables doit être synchronisé avant toute génération Prisma qui exige un reflet intégral du SQL.
- Les contrôles de publication et snapshots appartiennent à SMN-311 et SMN-312.
- Avant un merge, vérifier le chemin officiel d'installation des migrations et la compatibilité avec les développements simultanés de main.

## Complément — sécurité et qualification (étape 3)

- `src/server/links/validation.ts` : refus des URL dont la chaîne contient espaces, contrôles ou antislashs, pour empêcher des normalisations ambiguës.
- `tests/smn-306-links-validation.test.ts` : nouveaux cas d'URL et identifiants invalides.
- `tests/smn-306-links-migration.test.ts` : assertions statiques sur les contraintes SQL, la conservation de l'audit et le maintien de la v28.

### Preuves et limites
Les fichiers sont publiés sur la branche de la PR #207 ; **aucune commande de tests ni migration PostgreSQL n'a été exécutée**. Les tests SQL sont statiques : ils ne démontrent pas le comportement transactionnel d'une vraie base.

La migration est volontairement additive et **n'est pas encore raccordée au parcours d'installation SMN**. Vérifier les règles `_prisma_migrations`, `schema_version` et le diagnostic existant avant application manuelle.

### Recette PostgreSQL restant à réaliser
1. Vérifier le diagnostic et faire une sauvegarde de la base Windows.
2. Vérifier la migration sur une base de développement jetable et la cohérence Prisma.
3. Tester A/B avec deux équipes réelles de la même installation et confirmer que la vue A n'expose jamais B.
4. Tester les comptes `admin` et `user` (ce dernier doit être refusé tant que les habilitations v1 sont absentes).
5. Tester une URL dangereuse, un transfert et une suppression avec audit persistant, la catégorie utilisée et une édition concurrente.
6. Confirmer qu'aucun rapport publié n'est modifié.

Le serveur existant limite actuellement les accès multiéquipes à `admin`. Il ne faut pas ouvrir des droits aux comptes `user` pour contourner ce verrou.

## Blocage bloquant identifié avant migration (étape 4)

Le diagnostic SMN en v28 interdit les objets non listés dans `INSTALLATION_RELATIONS`
(`src/server/installation/contract.ts`) et impose le même nombre de
migrations achevées que `schema_version`. Le probe PostgreSQL refuse toute
table nouvelle non reconnue. **Appliquer le SQL SMN-306 seul provoquerait
un diagnostic `schema-incompatible`**, empêchant le fonctionnement normal.

Le SQL présent en PR est un **projet de migration, non applicable en l'état**.
Il ne faut exécuter ni `prisma migrate deploy` ni directement ce SQL.

Un précontrôle de lecture seule a été créé dans
`scripts/check-links-migration.ts` :

```powershell
pnpm exec tsx scripts/check-links-migration.ts
```

Ce précontrôle ne réalise aucune mutation et affiche explicitement
`migrationAllowed: false`. Il exige une base v28 saine et 28 migrations
terminées, avec absence des trois tables Liens.

Avant toute application réelle, il faut réaliser une migration versionnée
v29 **cohérente de bout en bout** : liste blanche des tables, forme des colonnes,
probe, checksum et diagnostic, script de migration transactionnel, puis
adapter explicitement les composants dépendant aujourd'hui de v28
(`src/server/teams/resolve.ts`, etc.). Il faut éviter de modifier
les politiques SMN-282 sans évaluation transversale et tests.

La prochaine étape technique doit traiter cette évolution du contrat global
et les collisions éventuelles de version avec d'autres branches en cours.
Aucun test PostgreSQL ni exécution sur Windows n'a été effectué.

## Étape 5 — Contrat diagnostic v29 et migration manuelle
- `src/server/installation/contract.ts` : liste blanche des trois relations Liens.
- `src/server/db/probe.ts` : lecture de la 29e migration et validation structurelle des colonnes des trois nouvelles tables.
- `src/server/installation/diagnostic.ts` : reconnaissance de v29, vérification du checksum du SQL versionné et des tables obligatoires.
- `src/server/teams/resolve.ts` : résolution des administrateurs compatible avec v28 et v29.
- `prisma/migrations/20261027_smn306_links/migration.sql` : passage de 28 à 29 au sein de la transaction d'application.
- `scripts/apply-links-migration.ts` : procédure manuelle protégée par un chemin de sauvegarde explicite, version v28 saine, verrou transactionnel, journal Prisma et diagnostic final.

La présence d'un chemin `--backup-file` non vide **ne prouve pas que cette sauvegarde est restaurable** : contrôle manuel indispensable avant toute commande.

**Ne pas appliquer cette migration sur le PC Windows avant revue de compatibilité des autres branches SMN-282 et tests.** Une migration concurrente peut réclamer le numéro 29 ; ce point devra être résolu avant merge. Vérifier également les autres composants qui verrouillent explicitement la version 28.

Commandes prévues après revue et sauvegarde (non exécutées ici) :

```powershell
pnpm exec tsx scripts/check-links-migration.ts
pnpm exec tsx scripts/apply-links-migration.ts --apply --backup-file=C:\\chemin\\sauvegarde.sql
pnpm db:diagnose
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

**Statut :** code publié, aucun test ni SQL exécuté. PR à conserver en brouillon.
