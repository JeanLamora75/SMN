# SMN-34 — Recette de restauration sur Windows 11 isolé (mode non destructif)

**Date :** 10 novembre 2026 · **Responsable :** Amelia / BMAD Dev · **Cible :** SMN-34, SMN-38, SMN-39, SMN-40, SMN-41.  
**État :** protocole à exécuter sur une installation de validation **distincte**. Aucune réussite de cette recette réelle n'est revendiquée par sa rédaction.

## 1. Prérequis bloquants

- Utiliser une **seconde installation SMN** Windows 11 avec des données de test ou une copie légalement autorisée et expurgée, qui n'est ni l'installation de travail ni sa base active.
- Node.js 24, pnpm 12, PostgreSQL 18 portable, droits normaux Windows (sans élévation d'administration). Ne pas installer d'IDE, de Codex CLI ou d'outil `uv`.
- Définir localement dans l'environnement de **validation uniquement** `SMN_DATABASE_URL`, `SMN_PRIVATE_DOCUMENTS_DIR`, `SMN_BACKUP_DIR`, `SMN_PRIVATE_REPORT_ARCHIVE_DIR`, `SMN_OFFICE_TEMPLATES_DIR`, `SMN_OFFICE_REPORTS_DIR`, et les trois variables du registre SMN-40 (`SMN_ERASURE_LEDGER_DIR`, `SMN_ERASURE_ANCHOR_DIR`, `SMN_ERASURE_LEDGER_KEY_HEX`).
- Ne **jamais** mettre les valeurs de ces variables, les secrets, une sauvegarde, le nom d'un membre ou les documents dans Jira, GitHub, captures d'écran publiques ou logs CI.
- Vérifier indépendamment que les répertoires de données, la base et le registre n'ont aucun chevauchement avec l'installation de travail, ni entre source, candidat, rollback et sauvegardes.

## 2. Audit accessible sans droit administrateur

Depuis **PowerShell**, dans le répertoire du SMN de validation :

```powershell
pnpm install --frozen-lockfile
pnpm exec tsx scripts/smn-34-audit-readonly.ts --archive <UUID_DE_SAUVEGARDE> --audit-only
```

Remplacer `<UUID_DE_SAUVEGARDE>` par l'identifiant réel figurant dans l'inventaire de l'application de validation. La commande ne déclenche **aucune restauration**, n'écrit aucun fichier et effectue les requêtes PostgreSQL dans une transaction **READ ONLY**. Le code de sortie **2 est attendu** tant que les preuves nécessaires sont insuffisantes. Ne pas considérer un dossier d'archives vide comme une attestation d'absence de suppression personnelle passée.

Le rapport contient uniquement les familles d'obstacles, le nombre d'archives par type et des statuts ; aucune URL PostgreSQL, chemin privé, donnée utilisateur ni secret n'est imprimé. Conserver même ce résumé dans le dossier privé de recette, jamais dans une issue publique.

Les principaux champs sont : `preflightBlockers`, `privacy.integrityReason`, `archives.status`, `execution.status`, `execution.databaseConnections`, `windowsRecette.status` et `canActivate:false`. Cette dernière valeur reste **toujours false** : il s'agit d'un diagnostic, pas d'une permission d'exécuter.

## 3. Reconstruction isolée sans bascule

Si un paquet v4 est valide, il est possible de tester la reconstruction **uniquement après avoir préparé une base `smn_restore_test_*` réellement vide et distincte**, et une variable `SMN_RESTORE_TEST_URL` qui la désigne. La source doit être sur le serveur PostgreSQL local autorisé, mais sa base doit être **différente** de la cible. Ne pas utiliser de base PostgreSQL réelle comme cible.

```powershell
pnpm exec tsx scripts/smn-34-restore-rehearsal.ts --archive <UUID_DE_SAUVEGARDE> --sandbox-only
```

- Vérifier le retour `sandboxOnly:true`, `activeInstallationModified:false`, `databaseAndDocumentsConsistent:true`.
- Ce résultat ne prouve **pas** la bascule active, le contrôle des sessions persistantes ni l'exhaustivité des effacements historiques.
- Si la cible ne correspond pas au motif strict, si elle n'est pas vide, si les empreintes divergent ou si un PDF/Office manque, **arrêter** : jamais de flag pour forcer une restauration.

## 3 bis. Précontrôle de l'orchestrateur **exclusivement sur cibles jetables**

Un opérateur peut désormais inspecter le banc PostgreSQL 18 et les arbres de fichiers **sans jamais déclencher la bascule**, uniquement avec des noms de bases `smn_restore_test_*` et trois répertoires frères `smn_restore_test_*` situés sous le dossier temporaire du système. Le compte PostgreSQL est lu depuis `SMN_TEST_DATABASE_URL` (serveur local, base `postgres`). Cette variable n'est jamais affichée.

```powershell
pnpm exec tsx scripts/smn-34-offline-preflight.ts --check-test-only smn_restore_test_original01 smn_restore_test_candidate01 smn_restore_test_rollback01 "C:\\Users\\<utilisateur>\\AppData\\Local\\Temp\\smn34-test\\smn_restore_test_original" "C:\\Users\\<utilisateur>\\AppData\\Local\\Temp\\smn34-test\\smn_restore_test_candidate" "C:\\Users\\<utilisateur>\\AppData\\Local\\Temp\\smn34-test\\smn_restore_test_rollback"
```

Ce sont des **exemples de noms** : les deux bases initiales doivent réellement être créées et la base `rollback` ne doit pas exister ; les répertoires `original` et `candidate` doivent être des répertoires **jetables**, avec fichiers de test dans les sous-dossiers autorisés. Le précontrôle vérifie la version majeure PG18, la présence/absence des trois bases, les connexions concurrentes, l'intégrité des arbres de fichiers et leurs empreintes SHA-256. Aucun mot de passe, nom de fichier privé ni connexion PostgreSQL n'est imprimé.

Le résultat peut comporter `database.status: "ready"` et `files.status: "ready"` ; il continue **toujours** à renvoyer `canActivate: false` et le code de sortie 2. Zéro connexion observée est un instantané, **pas** la preuve d'arrêt du service. Aucun usage contre l'installation de travail n'est accepté ; cet outil ne sait pas basculer une base réelle.

## 3 ter. Répétition coordonnée avec lanceur indépendant (test seulement)

Le nouveau `scripts/smn-34-offline-cutover-sandbox.ts` s'exécute depuis **PowerShell**, dans un processus Node distinct du serveur Next.js. Il appelle la bascule existante avec journal HMAC, contrôles de récupération et rollback, mais seulement sur des bases `smn_restore_test_*` et dossiers jetables `smn_restore_test_*` sous le dossier temporaire de Windows. **Ce script n'est pas un outil de restauration de production et ne s'interface pas avec le bouton de restauration de SMN.**

Sur le **banc indépendant uniquement**, après création contrôlée des bases de test, des arbres de fichiers candidats et du dossier temporaire contenant les quatre chemins, définir la connexion PostgreSQL de test `SMN_TEST_DATABASE_URL` vers la base locale `postgres`. Fournir une clé HMAC **éphémère de test**, conservée exclusivement dans le processus local :

```powershell
$env:SMN_CUTOVER_TEST_AUDIT_KEY_HEX = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
pnpm exec tsx scripts/smn-34-offline-cutover-sandbox.ts --sandbox-cutover smn_restore_test_original01 smn_restore_test_candidate01 smn_restore_test_rollback01 "<dossier-temp>\\smn_restore_test_original" "<dossier-temp>\\smn_restore_test_candidate" "<dossier-temp>\\smn_restore_test_rollback" "<dossier-temp>\\smn_restore_test_recovered" "<dossier-temp>"
```

Les valeurs `<dossier-temp>` représentent le **même répertoire temporaire déjà créé**, sous `$env:TEMP`. Les bases original et candidate doivent exister ; la base rollback ne doit pas exister ; les fichiers original et candidate doivent contenir uniquement des données synthétiques et les quatre noms doivent être distincts. Les rôles, les secrets et les URL de connexion ne doivent pas être copiés dans GitHub/Jira.

Le résultat `state:verified` avec `productionRestoreEnabled:false` signifie **uniquement** que le banc jetable a été basculé et que les sources originales y sont conservées. Il ne démontre ni une restauration d'un paquet réel, ni la révocation des sessions persistantes, ni l'arrêt des écrivains de l'installation de travail. Les tests CI utilisent le même lanceur contre PostgreSQL 18 et des fichiers jetables.

## 3 quater. Marqueur de maintenance persistant — banc Windows jetable uniquement

Le superviseur `scripts/smn-34-sandbox-maintenance.ts` exerce la **mise en maintenance persistante entre processus**, sans arrêter ni relancer le service réel. Son marqueur doit être sous un répertoire temporaire `smn_restore_test_*` créé préalablement, situé sous `$env:TEMP` et **hors du projet et des sauvegardes**.

```powershell
$testRoot = Join-Path $env:TEMP "smn_restore_test_maintenance_demo"
New-Item -ItemType Directory -Force -Path $testRoot | Out-Null
$marker = Join-Path $testRoot "maintenance.lock"
pnpm exec tsx scripts/smn-34-sandbox-maintenance.ts --begin $marker
pnpm exec tsx scripts/smn-34-sandbox-maintenance.ts --inspect $marker
```

Le deuxième appel se déroule dans un **nouveau processus Node**, qui relit le marqueur sur disque. Une seconde commande `--begin` doit être refusée. Un marqueur altéré bloque l'inspection au lieu d'être considéré comme absent. **Aucune commande automatique de retrait du marqueur n'est fournie** : ne pas utiliser cette procédure contre une installation SMN réelle, et ne jamais détruire un marqueur de maintenance réel en supposant que la reprise est terminée.

Ce test ne prouve **ni l'arrêt du serveur HTTP, ni l'arrêt des tâches de fond ou des écrivains PostgreSQL, ni l'invalidation de sessions distribuées**. Dans le code actuel, les sessions SMN sont en mémoire du processus et ne survivent normalement pas au redémarrage, mais le maintien de plusieurs processus actifs resterait un risque. Tous ces points exigent des essais indépendants REC-10/REC-11.

## 3 quinquies. Répétition HTTP du verrou et des sessions (données synthétiques)

La CI exécute `tests/smn-34-session-restart-http.test.ts` sous Windows et Linux. Ce scénario crée **trois serveurs HTTP de test distincts** sur la boucle locale, utilisant seulement le magasin de sessions en mémoire et le contrôle de maintenance existants dans SMN. Il vérifie : accès autorisé avant maintenance, refus HTTP 503 après installation du verrou, refus persistant après redémarrage tant que le verrou est présent, puis refus HTTP 401 de l'ancien jeton après levée du **seul verrou temporaire du banc**. Ce test ne nécessite aucune base de données personnelle.

Pour le reproduire sur un environnement Windows **de développement/validation uniquement**, depuis la copie du dépôt :

```powershell
pnpm exec tsx --test tests/smn-34-session-restart-http.test.ts
```

Le banc supprime uniquement ses propres fichiers jetables de test. **Ne pas supprimer le marqueur de maintenance de l'installation réelle**. Le test simule un serveur HTTP : il ne prouve pas l'arrêt effectif des processus du lanceur Windows, des travaux de fond, des connexions PostgreSQL ni la révocation de sessions dans une installation multiprocessus. La recette REC-11 doit toujours démontrer ces exigences sur une machine indépendante.

## 4. Dossier de recette REC-01 à REC-14

| REC | Vérification en installation dédiée | Preuve attendue |
|---|---|---|
| 01 | Recenser base, répertoires PDF/Office/TXT et sauvegardes | Comptages + empreintes privées |
| 02 | Créer une sauvegarde chiffrée v4 sur données de test | Paquet complet, provenance et récupération validées |
| 03 | Corrompre une **copie jetable** du paquet et demander son contrôle | Refus explicite |
| 04 | Reconstituer v4 dans PG18 `smn_restore_test_*` | Cohérence schéma, clés étrangères, documents |
| 05 | Consulter visuellement sprints, Dashboard Builder, indicateurs v33, liens et rapports | Captures privées non nominatives et comparaison |
| 06 | Contrôler identités historiques, affectations et révisions | Aucune référence inconnue assimilée à zéro |
| 07 | Examiner humainement PDF, DOCX, PPTX et objets intégrés | Décision par version + accès aux originaux réellement révoqué |
| 08 | Appliquer Option A sur les agrégats et rapports collectifs | Preuve d'absence de réidentification ou expurgation |
| 09 | Refaire v4 **après** effacement effectivement qualifié ; essayer un paquet antérieur | Aucune identité effacée ne revient |
| 10 | Tester interruptions avant/après promotion et pendant fichiers **sur banc jetable** | Retour arrière, état conservé, journal fiable |
| 11 | Vérifier arrêt réel des écrivains, révocation des sessions persistantes, puis redémarrage | Connexions initiales refusées, nouvelles sessions sûres |
| 12 | Reconstituer une installation vierge native v33 puis rollback | Source inchangée, copie de retour arrière vérifiée |
| 13 | Mesurer de bout en bout RPO/RTO (temps de panne → service rendu) | Horodatages mesurés et témoins |
| 14 | Vérifier audit, confidentialité, rétention, archives et accès sur le **même SHA** | PV avec état de chaque contrôle |

**Format de preuve à conserver en privé :** identifiant non nominatif du banc, SHA Git, version SMN/PG, date/heure UTC, scénario REC, résultat PASS/FAIL/BLOCKED, responsable du constat, hash d'un contenu de test, description d'anomalie sans données personnelles. Un script CI n'est jamais un témoin d'un redémarrage réel Windows.

## 4 bis. Grille de preuves locale REC-01 à REC-14

Dans PowerShell sur une installation **de validation indépendante**, générer le modèle des quatorze essais :

```powershell
node scripts/windows/smn-34-recette-check.mjs --template
```

La sortie JSON peut être conservée dans un fichier privé de recette (hors dépôt et hors sauvegardes). Chaque scénario doit conserver son identifiant `REC-01` à `REC-14`, son statut `PASS`, `FAIL` ou `BLOCKED` et, **uniquement pour PASS**, une empreinte SHA-256 d'une preuve existante et sa date d'observation UTC `observedAt`. Ne pas inscrire de noms, chemins confidentiels ni de secrets dans ce fichier.

La vérification syntaxique ne lit pas les preuves elles-mêmes et n'accorde aucune approbation :

```powershell
node scripts/windows/smn-34-recette-check.mjs --check "C:\\RecetteSMN\\rec-01-14.json"
```

Utiliser un chemin absolu local pour le fichier privé. La commande n'écrit rien, ne transmet aucun contenu et renvoie **toujours le code 2** en mode `--check`, y compris si les 14 statuts sont déclarés `PASS`. Le rapport affiche seulement les statuts et décomptes. Une déclaration `PASS` n'est pas une preuve de réalisation : **la revue indépendante est obligatoire** et une CI GitHub ne peut la remplacer.

## 5. Conditions de décision

**NO-GO** si une archive est non inspectable, si une suppression historique est inconnue, si les agrégats ne sont pas justifiés, si les chemins DB/fichiers se chevauchent avec une installation de travail, si un écrivain est actif, si les sessions ne sont pas révoquées, si un journal de bascule est ambigu, ou si un REC applicable est non vérifié.

**GO uniquement après** avis indépendant sur l'exhaustivité SMN-40, revue des archives SMN-38/39, exécuteur externe réellement testé, recette Windows 14/14 documentée et approbation explicite. La commande d'audit et le serveur SMN ne permettent actuellement pas cette activation.

## Références

- [PV recette Epic 2](../_bmad-output/implementation-artifacts/epic2-etape4-proces-verbal-recette.md)
- [Contrat des trois blocages](../_bmad-output/implementation-artifacts/epic2-three-restore-blockers-2026-11-10.md)
- [Diagnostic implémenté](../src/server/backup/restore-audit.ts)
- [Script Node Windows](../scripts/smn-34-audit-readonly.ts)
- [Jira SMN-34](https://lmn24.atlassian.net/browse/SMN-34)


## 3 sexies. Lanceur Windows propriétaire et maintenance externe (qualification partielle)

Le lanceur `scripts/windows/launch-portable.mjs` consulte désormais `SMN_RESTORE_MAINTENANCE_MARKER` **avant les opérations de récupération de mise à jour, avant le démarrage du serveur et régulièrement pendant l'exécution du serveur qu'il possède**. Si un marqueur externe valide existe, est illisible ou mal formé (fichier, lien symbolique ou répertoire), le lanceur refuse le démarrage ou demande au processus web **qu'il a créé** de s'arrêter. Le processus propriétaire sort ensuite au lieu de redémarrer le web. Ce contrôle est livré dans les **nouveaux paquets Windows** grâce à `scripts/windows/package-portable.mjs` (le lanceur situé dans `runtime/` est protégé par le système de mise à jour).

**Préconditions impératives :** le marqueur doit être configuré avec un chemin absolu extérieur à l'installation et au répertoire de sauvegardes, et être accessible par le processus web et son lanceur. Sans `SMN_RESTORE_MAINTENANCE_MARKER`, le lanceur conserve son comportement historique : **aucune mise en maintenance n'est implicite**. Ne pas utiliser cette faculté pour arrêter le serveur d'une autre installation sur le port 3003.

**Limites non qualifiées :** le signal `SIGTERM` doit être suivi par une constatation de l'arrêt effectif du PID propriétaire, de la disponibilité du port, de l'absence de jobs en cours, des connexions PostgreSQL et des autres écrivains. Le lanceur ne force pas l'arrêt d'un processus tiers, n'arrête pas PostgreSQL, ne révoque pas à lui seul des sessions d'autres processus et n'opère **aucune restauration active**. Un contrôle périodique comporte une fenêtre de latence : seul l'opérateur externe, après preuves indépendantes d'arrêt, peut décider de poursuivre la phase suivante.

**Test de contrat sans données personnelles :** `pnpm exec tsx --test tests/smn-34-windows-launch-maintenance.test.ts`. Ce test vérifie les états du marqueur et que le paquetage embarque le nouveau contrôle ; il ne remplace pas la recette réelle du lanceur natif, attendue dans REC-10 / REC-11.
