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
