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
