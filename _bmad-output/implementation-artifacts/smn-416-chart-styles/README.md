# SMN-416 — Catalogue global des styles graphiques : mise en œuvre

**Date :** 8 novembre 2026 · **Agent :** Amelia / BMAD  
**Statut :** code publié sur `main` ; tests, migration et recette PostgreSQL **non exécutés ici**.  
**Story :** [SMN-416](https://lmn24.atlassian.net/browse/SMN-416).

## Contrat livré

- **Catalogue prédéfini** : `cockpit-agile`, `corporate`, `minimal`, six types `bar/line/area/pie/donut/gauge`. Configuration complète versionnée `schemaVersion:1`, fond, couleurs, typographie, légende, étiquettes et options spécifiques à chaque type.
- **Stockage global PG** : `smn_chart_style` en JSONB et `smn_chart_style_default`, avec un défaut pour chacun des six types, révisions optimistes, identifiants stables, unicité des noms, contrôle des types SQL et FK vers l'installation. La version d'installation reste 33.
- **Installation neuve** : la transaction `installExpress` applique la migration additive à partir du répertoire du projet après le schéma natif v33 et avant le COMMIT. Les six défauts existent dès la première installation si celle-ci aboutit ; ce comportement reste à confirmer par test d'installation réel.
- **Migrations explicites** : `prisma/migrations/20261108_smn416_chart_styles/migration.sql` et `scripts/apply-smn-416-chart-styles.ts`. La migration est additive et idempotente ; aucune donnée de l'ancien moteur d'indicateurs n'est mise à jour.
- **Service** : `src/server/reports/chart-style-store.ts`, lecture et commandes create/update/delete/set-default, protection des modèles prédéfinis, verrou de transaction par installation et refus de suppression d'un style encore utilisé comme défaut.
- **API** : `GET /api/admin/reports/chart-styles`, `POST /api/admin/reports/chart-styles`, lecture pour comptes actifs autorisés (`collective/read`), écritures admin seulement (`settings/write`), contrôle de session/origine, corps JSON borné, codes métier 400/403/404/409/503.
- **Langues** : messages `chartStyles` en `src/i18n/fr.json` et `src/i18n/en.json` ; les routes renvoient des codes stables à traduire dans la future interface.
- **Tests** : `tests/smn-416-chart-style-contract.test.ts` et `tests/smn-416-chart-styles-pg.test.ts`.

## Commandes Windows 11 — PowerShell

Depuis la racine du dépôt après synchronisation `main`, avec Node 24 et pnpm :

```powershell
pnpm exec tsx --test tests/smn-416-chart-style-contract.test.ts
pnpm typecheck
pnpm lint
pnpm i18n:check
```

### Migration explicite

La procédure **ne modifie pas l'installation sans autorisation de sauvegarde** :

```powershell
pnpm exec tsx scripts/apply-smn-416-chart-styles.ts --check
```

Après avoir vérifié et conservé une sauvegarde PostgreSQL v33, et **uniquement si elle est vérifiée** :

```powershell
$env:SMN_V33_BACKUP_VERIFIED = "YES"
pnpm exec tsx scripts/apply-smn-416-chart-styles.ts --apply
pnpm exec tsx scripts/apply-smn-416-chart-styles.ts --check
Remove-Item Env:SMN_V33_BACKUP_VERIFIED
```

Le script exige une installation initialisée v33 et un accès à la base locale configurée pour SMN. **Il n'a pas été lancé durant cette intervention.**

### Intégration PostgreSQL isolée

`tests/smn-416-chart-styles-pg.test.ts` suit le modèle de recette isolé du projet : il s'exécute avec une base PostgreSQL locale disponible via `SMN_TEST_DATABASE_URL` **et** `CI=true` + `GITHUB_ACTIONS=true`, crée une base `smn_416_<uuid>`, installe v33, applique la migration deux fois, vérifie commandes/droits/révisions, puis détruit **uniquement cette base temporaire**. Il est ignoré sans ces prérequis. Ne jamais activer ces variables artificiellement contre une base personnelle sans examiner la configuration.

```powershell
pnpm exec tsx --test tests/smn-416-chart-styles-pg.test.ts
```

La présence de ce test ne constitue **pas** une preuve d'exécution. Conserver le journal et le statut passé/ignoré.

## Contrat API attendu

La lecture renvoie `{styles:[...],defaults:{bar:{styleId,revision},...}}`. Un preset a `source:"builtin"`, `revision:0` ; un style personnalisé a `source:"custom"` et une révision positive.

Les commandes s'envoient avec `POST` :
- `{action:"create",id,name,description,config}`
- `{action:"update",id,name,description,config,revision}`
- `{action:"delete",id,revision}`
- `{action:"set-default",type,styleId,revision}`

Les configurations sont déclaratives et sont contrôlées avec une **allowlist de champs et de plages numériques**. Les chaînes de texte rejettent balises HTML/XML et contrôles. Aucun SVG ou code arbitraire n'est interprété. Les requêtes non autorisées sont refusées avant l'accès à la base.

Les futurs modules SMN-417/418 utiliseront ce service de lecture ; **les exports existants ne sont pas encore raccordés** au catalogue. M1 et M2 relèvent de SMN-419/420, le sélecteur d'export de SMN-421.

## Limites et portes de validation

1. Pour les installations neuves, `installExpress` crée les tables et six défauts dans la transaction de mise en place v33. Pour les installations déjà existantes, la migration `--apply` reste explicite après sauvegarde vérifiée. Ces deux parcours doivent être exécutés et validés avant de déclarer AC-01/02 satisfaits.
2. Les tests unitaires et PG, l'analyse TypeScript, ESLint, i18n et la CI **ne sont pas attestés** par cette publication. Sans exécution, la Story ne doit pas être déclarée terminée.
3. PostgreSQL ne connaît pas les presets codés en TypeScript : le contrôle de présence d'un style est effectué transactionnellement dans le service.
4. Un audit d'état est fourni par `revision`, `updated_at`, `updated_by` ; il n'existe pas encore de journal immuable des changements de styles. Ce point n'est pas un critère d'acceptation explicite de SMN-416.
5. La lecture des styles est permise aux comptes actifs par une route contrôlée en lecture ; les mutations exigent un administrateur. Les futurs exports vérifieront indépendamment leurs droits et le contexte d'équipe.
6. Aucun `uv` exécuté sur GitHub ; pas de mesure de performance ou de données réelles produites.

## Traçabilité des AC

| Critère | État |
| --- | --- |
| AC-01 Prédéfinis au premier démarrage | Catalogue TS et initialisation native ajoutés ; test d'installation à exécuter |
| AC-02 PG JSONB v33 et défauts | SQL + migration explicite publiés ; tests PG à exécuter |
| AC-03 API/service, droits, unicité | Implémentation publiée ; validation runtime à réaliser |
| AC-04 Validation et conflits, FR/EN | Contrats + codes et clés i18n publiés ; tests à exécuter |
| AC-05 Tests, conservation v33 | Tests unitaires et isolés ajoutés ; non exécutés |

**Prochaine étape qualité :** exécuter d'abord typecheck et tests unitaires, puis test PG sur DB jetable et migration `--check` ; traiter les erreurs avant de clôturer la Story.
