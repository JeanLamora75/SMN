# SMN-337 — Protocole final de qualification KEEP / ADAPT / DROP

**Date** : 31/10/2026. **État** : procédure exécutable proposée ; l'audit PostgreSQL local **n'a pas été exécuté**.

## Preuves vérifiées
- Arborescence GitHub `main` : 3133 entrées, non tronquée au moment de la lecture ; 1526 blobs `.ts/.tsx/.sql/.mjs` dans `src/`, `tests/`, `scripts/`, `prisma/migrations/`.
- Le tableau d'impact détaillé et les classifications conservatrices sont dans [SMN-337-INVENTAIRE-IMPACT-KEEP-ADAPT-DROP.md](./SMN-337-INVENTAIRE-IMPACT-KEEP-ADAPT-DROP.md).
- Le contenu exhaustif des 1526 fichiers n'a **pas** été relu ; les résultats de recherche et les dépendances SQL dynamiques doivent être produits localement.

## Contrôle des références dans GitHub Desktop / PowerShell
Ouvrir PowerShell dans le répertoire SMN, sur la branche `main` synchronisée. Les commandes suivantes lisent les fichiers sans les modifier.

```powershell
$ErrorActionPreference = "Stop"
$patterns = @(
  "smn_sprint_story_points",
  "smn_sprint_ticket_counts",
  "smn_sprint_scores",
  "smn_sprint_capacity_kpi",
  "smn_sprint_closure_snapshot",
  "smn_kanban_flow_counts",
  "smn_kanban_timing",
  "smn_company_capacity_recalc",
  "readSprintDetailIndicators",
  "deriveSprintIndicators"
)
$paths = git ls-files -- 'src/**' 'tests/**' 'scripts/**' 'prisma/**'
foreach ($pattern in $patterns) {
  Write-Output "### $pattern"
  git grep -n -I -F -- $pattern -- $paths
  if ($LASTEXITCODE -eq 1) { Write-Output "(aucune correspondance)" }
  elseif ($LASTEXITCODE -ne 0) { throw "git grep error: $pattern" }
}
```

Compléter par une recherche dans **tous** les fichiers de requêtes SQL dynamiques, des `DROP`, `ALTER TABLE`, `REFERENCES` et des imports de modules concernés ; chaque objet classé DROP-CANDIDATE doit être relié à chaque consommateur détecté, y compris exports, tests, migrations, snapshots.

## Audit SQL PostgreSQL strictement en lecture seule
À exécuter dans la base **SMN locale** via le client `psql` portable déjà présent, après vérification explicite de la connexion et du nom de base :

```sql
BEGIN READ ONLY;
SELECT current_database(), current_user, current_setting('server_version');
SELECT n.nspname, c.relname, c.relkind
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname LIKE 'smn_%'
ORDER BY c.relname;
SELECT conrelid::regclass::text AS object_name, conname, contype,
       pg_get_constraintdef(oid) AS definition
FROM pg_catalog.pg_constraint
WHERE connamespace='public'::regnamespace
ORDER BY object_name,conname;
SELECT tgrelid::regclass::text AS object_name,tgname,pg_get_triggerdef(oid) AS definition
FROM pg_catalog.pg_trigger
WHERE NOT tgisinternal AND tgrelid IN
 (SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace)
ORDER BY object_name,tgname;
SELECT schemaname,viewname,definition FROM pg_catalog.pg_views WHERE schemaname='public';
SELECT n.nspname,p.proname,pg_get_functiondef(p.oid) AS definition
FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public';
SELECT c.relname AS dependent_relation,d.refobjid::regclass::text AS referenced_object,d.deptype
FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_class c ON c.oid=d.objid
WHERE d.refclassid='pg_catalog.pg_class'::regclass AND
 d.refobjid IN (
  SELECT oid FROM pg_catalog.pg_class WHERE relnamespace='public'::regnamespace
    AND relname IN ('smn_sprint_story_points','smn_sprint_ticket_counts','smn_sprint_scores',
                    'smn_sprint_capacity_kpi','smn_kanban_flow_counts'))
ORDER BY referenced_object,dependent_relation;
ROLLBACK;
```

Les résultats de `pg_depend` ne suffisent **pas** à découvrir tous les appels SQL construits par TypeScript ; croiser impérativement avec `git grep`.

## Critères pour clore SMN-337
- [ ] Les références des fichiers suivis ont été recherchées et enregistrées, y compris SQL dynamique.
- [ ] Les métadonnées de la base locale (objets, FK, vues, triggers, fonctions, dépendances) ont été réellement extraites.
- [ ] La matrice source/consommateur/KEEP-ADAPT-DROP a été rapprochée du **schéma installé**, y compris état/versions.
- [ ] Toutes les suppressions candidates sont justifiées, sans risque de perte de capacités, rapports historiques ou snapshots.
- [ ] Les sauvegardes et tests de non-régression associés sont planifiés et, lorsque requis par la DoD, exécutés.
- [ ] Une décision humaine explicite autorise la liste définitive de suppressions.

**Conclusion :** les points non cochés empêchent de déclarer SMN-337 terminée. Ne pas développer un script DROP ni exécuter une migration destructive à partir de la seule classification documentaire.
