# SMN-297 — Sauvegarde et restauration sur Windows 11 (répétition du lot 3)

**Statut : procédure préparée, non exécutée.** Ne pas migrer la base de travail. Aucun droit administrateur nécessaire.

## 1. Principes

SMN utilise son PostgreSQL 18 portable dans `%LOCALAPPDATA%\ScrumMasterNotebook`. Son port est dynamique : **ne pas supposer 5432 ou 57085**. Les sauvegardes intégrées SMN (`backups`) sont **chiffrées** et ne sont pas des fichiers directement restaurables par `pg_restore`. Pour une répétition de migration, réaliser un dump PostgreSQL custom indépendant et une restauration sur une **autre instance PostgreSQL / un autre cluster isolé**, après vérification des connexions.

Ne jamais envoyer une URL de connexion, un mot de passe ou un fichier de sauvegarde dans Jira/GitHub/ChatGPT. Ne pas utiliser `pg_restore --clean` sur la base de travail.

## 2. Vérification non destructive

Dans PowerShell, depuis la racine de SMN :

```powershell
pnpm db:diagnose
$pgBin = Join-Path $env:LOCALAPPDATA "ScrumMasterNotebook\pgsql\bin"
Test-Path (Join-Path $pgBin "pg_dump.exe")
Test-Path (Join-Path $pgBin "pg_restore.exe")
& (Join-Path $pgBin "pg_dump.exe") --version
```

Un résultat faux impose d'identifier le dossier réel des binaires avant de poursuivre. Relever le port, le nom de la base et l'utilisateur depuis les paramètres locaux SMN **sans copier de secret dans les tickets**.

## 3. Sauvegarde sur un répertoire personnel

Après avoir identifié et vérifié la connexion de la base source, utiliser des valeurs **locales uniquement** pour `$sourceHost`, `$sourcePort`, `$sourceDb` et `$sourceUser`. Laisser `pg_dump` demander le mot de passe si nécessaire.

```powershell
$backupDir = Join-Path $env:USERPROFILE "Documents\SMN-Recette-Lot3"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$backup = Join-Path $backupDir "smn-avant-lot3.dump"
& (Join-Path $pgBin "pg_dump.exe") --host $sourceHost --port $sourcePort --username $sourceUser --dbname $sourceDb --format custom --no-owner --no-acl --file $backup
if ($LASTEXITCODE -ne 0) { throw "Échec pg_dump" }
& (Join-Path $pgBin "pg_restore.exe") --list $backup | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Sauvegarde illisible" }
Get-FileHash -Algorithm SHA256 $backup
```

**Important :** `pg_restore --list` vérifie la lisibilité du catalogue, **pas** la restaurabilité ni l'intégrité de toutes les données. Conserver ce fichier hors dépôt, sur un stockage privé et protégé ; le supprimer selon la politique de conservation après la recette.

## 4. Restauration sur un environnement réellement isolé

Ne procéder qu'après accord pour la répétition. Créer **une nouvelle instance/cluster PostgreSQL 18 SMN isolé**, avec **un port, un dossier de données, une base et des identifiants distincts** ; ne pas utiliser le cluster source pour faire un essai. Vérifier que `$targetPort` diffère de `$sourcePort` et que `$targetDb` correspond uniquement à la base de recette. Le provisioning de ce cluster est une étape séparée : la présence d'une seconde base dans le cluster de production n'est **pas** une isolation suffisante.

Sur l'instance isolée, créer une base vide puis :

```powershell
if ("$targetPort" -eq "$sourcePort") { throw "Port cible identique à la source" }
& (Join-Path $pgBin "pg_restore.exe") --host $targetHost --port $targetPort --username $targetUser --dbname $targetDb --no-owner --no-acl --exit-on-error $backup
if ($LASTEXITCODE -ne 0) { throw "Restauration échouée" }
```

Vérifier ensuite les comptes, les équipes, les Sprints, les schémas, les migrations et la restauration complète, **sans pointer l'application principale sur cette base**.

## 5. Passage à v28 puis v29, uniquement sur la copie

Les scripts existants `scripts/apply-multi-team-migration.ts` et `scripts/apply-team-agile-migration.ts` utilisent `installedDatabaseUri()` : **ils pourraient donc cibler la base de travail** si lancés sans isolation vérifiée. Ne les exécuter qu'après une vérification explicite du mécanisme de sélection de la base de recette et accord utilisateur. Leur paramètre `--backup-file` vérifie uniquement l'existence du fichier ; il ne prouve pas sa restauration.

Pour la recette, relever : diagnostic avant/après chaque migration, checksum du dump, version de schéma, `_prisma_migrations`, scénario de rollback par restauration sur instance jetable, puis tests A Scrum / B Scrum / C Kanban. **Aucune commande de migration n'est fournie comme action immédiate dans ce guide.**

## 6. Conditions d'arrêt

Arrêter immédiatement si le port, le dossier de données ou l'identité de l'instance cible n'est pas certain ; si la sauvegarde échoue ; si la restauration est incomplète ; ou si le diagnostic ne correspond pas à la version attendue. Conserver `MULTI_TEAM_CONTEXT_READY=false` et `SMN_MULTI_TEAM_WRITES_ENABLED` désactivé. Aucune fusion `main` avant recette et validation explicites.
