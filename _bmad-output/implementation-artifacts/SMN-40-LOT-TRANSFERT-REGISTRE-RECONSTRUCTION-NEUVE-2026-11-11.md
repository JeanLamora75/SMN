# SMN-40 — Lot technique : transfert du registre et reprise sur PC vierge

**Date :** 11 novembre 2026. **Périmètre :** transfert du registre externe d'effacement et préparation de reconstruction *isolée*, sans activation de restauration.

## Contraintes non négociables

- Ne jamais modifier, supprimer, écraser, réutiliser ou promouvoir les bases REC-04 `smn_restore_test_latest_backup_20261111` et `smn_restore_test_latest_compare_20261111`. Les autres bases REC-04 déjà conservées comme preuves restent également hors cible.
- Ne pas restaurer la base active, remplacer les documents actifs, ni autoriser un cutover Windows.
- Migration fidèle : membres, noms, équipes, relations, historiques, indicateurs et documents restent présents. Les identités de connexion et secrets doivent être réauthentifiés ou rotés indépendamment si nécessaire.
- Les effacements définitifs opposables postérieurs à une archive ne doivent pas être réintroduits. **Ne jamais expurger automatiquement les membres actifs légitimes.**
- Un journal cryptographiquement vérifié ne prouve pas, à lui seul, l'exhaustivité des effacements plus anciens ou réalisés hors registre.

## Transport externe du registre

`scripts/smn-40-ledger-transfer.ts` propose trois modes :

| Mode | Comportement |
| --- | --- |
| `--check` | Vérifie la présence d'un registre et la possibilité d'un profil vierge ; aucune écriture. |
| `--export CHEMIN_ABSOLU` | Lit le registre HMAC et son ancre externe, refuse les intentions/locks en cours, vérifie leurs signatures puis chiffre leur contenu et la clé via AES-256-GCM et scrypt avec phrase de transfert. Fichier exclusif `smn-privacy-transfer-*.enc`. |
| `--import CHEMIN_ABSOLU` | Déchiffre et vérifie la chaîne complète avant d'écrire sur un **profil Windows vierge seulement** ; la clé est reprotégée en DPAPI CurrentUser. Refuse tout registre/ancre existants et ne touche pas à PostgreSQL. |

La phrase de transfert est fournie **sur l'entrée standard**, jamais en argument CLI, et doit avoir 20 à 1024 caractères. Sur Windows, l'opérateur peut préparer une valeur `SecureString`, la convertir momentanément en mémoire pour l'écrire dans stdin, puis effacer ses variables. **Ne jamais placer la phrase en argument, dans un fichier projet, un commit, des logs ou une CI.** Le paquet exporté contient indirectement des preuves et une clé secrète ; l'archive chiffrée doit être transmise de façon confidentielle et supprimée de ses emplacements temporaires après import et attestation.

Exemple d'appel (sur le poste SOURCE, PowerShell ; chemin à adapter) :

```powershell
pnpm exec tsx scripts/smn-40-ledger-transfer.ts --check
$secure = Read-Host 'Phrase de transfert (20 caractères minimum)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $phrase = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $phrase | pnpm exec tsx scripts/smn-40-ledger-transfer.ts --export 'C:\\Transfert\\smn-privacy-transfer-source.enc'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Variable phrase, secure -ErrorAction SilentlyContinue
}
```

Sur le poste de destination, répéter l'entrée de phrase, mais utiliser `--import 'C:\\Transfert\\smn-privacy-transfer-source.enc'`. Ne lancer l'import que si le profil Windows n'a **jamais** été enrôlé : il est interdit de « fusionner » ou remplacer une histoire existante. La migration du registre ne restaure pas les données métier ; ne pas lancer un `smn-40-ledger-enrollment.ts --enroll` sur la destination en plus de l'import.

**Point de vigilance :** l'export et l'import doivent être effectués lors d'une fenêtre hors écritures d'effacement ; l'opérateur doit contrôler l'absence de demande concurrente ou non journalisée. Les garde-fous techniques ne prouvent pas seuls la quiescence de processus externes. L'import ne transfère pas automatiquement les éventuels dossiers de preuves ou de pièces auxiliaires extérieurs au registre : leur inventaire doit être réconcilié séparément.

## Reconstruction sur installation vierge — protocole de recette

1. Installer SMN sur le nouveau PC, sans créer d'équipe, de membre ni d'historique métier, et configurer PostgreSQL 18. Faire un inventaire de la base, des fichiers gérés et des registres locaux. Une installation qui a déjà des données ne satisfait pas « vierge ».
2. Exporter sur le PC source **une sauvegarde SMN complète v4 vérifiée**, contenant base PostgreSQL, documents privés, rapports PDF et Office, modèles Office. Conserver le mot de récupération et les métadonnées de façon sécurisée, en dehors de GitHub. Contrôler `scopeComplete` et chaque pièce manquante.
3. Transférer le registre d'effacement externe indépendamment de la sauvegarde, avec les commandes ci-dessus. Vérifier l'intégrité de la chaîne, le début de couverture et les opérations après la date de l'archive.
4. Préparer une **nouvelle base d'essai jetable vide** (jamais REC-04, jamais l'active), sur une instance/identité PostgreSQL dédiée. L'utilitaire `scripts/smn-40-newpc-reconstruct.ts` est raccordé au moteur existant `rehearseBackupRestore` et refuse les bases REC-04, l'installation active et les données effacées après l'archive. Renseigner `SMN40_NEWPC_SANDBOX_URL` vers la base vierge `smn_restore_test_newpc_<8-16 caractères hexadécimaux>` sur un port autre que 57186, avec un rôle différent du rôle actif, et `SMN40_NEWPC_STAGING_DIR` vers un répertoire **inexistant** sous le répertoire temporaire OS, nommé `smn_restore_test_files_<6-40 caractères alphanumériques>`. Tester `pnpm exec tsx scripts/smn-40-newpc-reconstruct.ts --archive <UUID> --check`, puis exécuter uniquement sur la base jetable avec `--reconstruct --confirm=RECONSTRUCT_EMPTY_NEWPC_SANDBOX_ONLY`. Le moteur vérifie PostgreSQL 18, restaure transactionnellement la base, conserve en staging temporaire les documents vérifiés et contrôle les références PDF. Il ne crée ni ne supprime aucune base ; l'opérateur crée préalablement la cible vide.
5. Produire deux empreintes indépendantes en lecture seule de toutes les tables de la reconstruction via `fingerprintPublicTables` et les confronter à une reconstruction isolée indépendante de **la même archive** ; compléter par les contrôles de noms, équipes, affectations, versions et historiques sans exposer d'identifiants dans les logs. Les empreintes des archives Office, PDF et documents privés doivent coïncider avec le manifeste authentifié.
6. Réconcilier les événements du registre avec les reçus SQL, les intentions en attente, les éventuels traitements antérieurs à l'enrôlement et les copies externes. Si des effacements postérieurs à la sauvegarde subsistent sans expurgation vérifiable dans le candidat, déclarer **reconstruction non activable**.
7. Vérifier que les deux bases REC-04 de preuve sont strictement inchangées (inspection en lecture seule, jamais `DROP`). Ne déclencher **aucun** mécanisme de bascule. Tester séparément les réauthentifications des utilisateurs, sans publier de secrets.

**Critère d'acceptation :** état d'une reconstruction candidate vérifiable, inventaire complet des fichiers, chaînes d'effacement attestées ou obstacles explicités, rapports de différences anonymisés et `restorationAuthorized:false`. Aucune preuve d'exécution réelle Windows n'est acquise tant que les commandes n'ont pas été exécutées sur les postes concernés.


## Bilan de réalisation — preuve opérateur du 11 novembre 2026

Le poste source Windows 11 a exécuté les commandes ci-dessous et transmis les résultats. Ces éléments constituent une **preuve d'exécution opérateur** ; ils ne sont pas une attestation indépendante de l'état de la base active, de la qualification des effacements ni de la disponibilité de l'application sur un autre PC.

| Preuve | Résultat observé |
| --- | --- |
| Tests ciblés du transfert et de l'isolation | 10 réussites, 0 échec |
| Contrôles du registre | 7 gardes SQL, intégrité HMAC `verified`, début de couverture `2026-11-11T13:36:18.984Z` |
| Export chiffré du registre | `mode=export`, 0 marqueur, code sortie 0, fichier 644 octets |
| Empreinte SHA256 du transfert | `0DA230C609FD08C3F64D9F877D9B3FFE73D9427336F5214643B1A26B420AD4B7` |
| Sauvegarde v4 choisie | `39b6262d-5f27-4bf8-a005-701dfd9cd9a2`, créée `2026-11-11T18:27:39.087Z`, manifeste et inventaire vérifiés, schéma v33 |
| Reconstruction PostgreSQL 18 isolée | **Réussie** sur l'instance de test dédiée (port 57189), 195 tables restaurées et 195 empreintes de tables calculées |
| Fichiers inclus | 1 rapport Office, 1 modèle Office, 0 PDF, 0 document privé ; cohérence vérifiée |
| Empreinte agrégée des lignes restaurées | `ab959477e614d3a73c2bc9234b21c5a0adbfb19bdf8ca384a6d0ee7d4f0d9fb1` |
| Empreinte du staging documentaire | `39eeb61050843384dcc567ca91e99837578c1601c5fd9ed9e6437dfb6f97a3ab` |
| Déclarations du moteur de reconstruction | `verifiedAgainstIndependentCandidate=false`, `historicalErasureCoverageCertified=false`, `restorationAuthorized=false`, `activeInstallationModified=false`, `rec04Modified=false` |

**Décision de clôture technique :** le lot « transfert sortant du registre + reconstruction candidate hors production » est **réalisé et démontré**. Ne plus redemander les contrôles unitaires, l'export du registre, la recréation d'une sauvegarde ou la reconstruction PostgreSQL déjà réussis pour ce même lot. Les bases REC-04 existantes doivent rester intactes.

**Deux réserves distinctes** subsistent pour toute **qualification d'une vraie migration inter-PC** :
1. La fidélité de cette candidate n'est pas comparée à une seconde reconstruction indépendante de la même archive ; la preuve exhaustive des données personnelles historiques n'est pas établie indépendamment.
2. Les suppressions/effacements **antérieurs à la couverture du registre** ne peuvent pas être déduits d'un registre contenant zéro marqueur. Aucun mécanisme technique ne doit transformer cette absence d'attestation en une autorisation active implicite.

Une restauration active, la fusion de journaux et la réinitialisation de comptes ne sont **pas** comprises dans cette clôture technique. L'import du registre dans un **autre profil Windows vierge** n'a pas encore fait l'objet d'un test réel. Conserver les empreintes sans publier de données personnelles ni de secret d'archive.

## Tests et limites

- Tests unitaires `tests/smn-40-ledger-transfer.test.ts` et `tests/smn-40-newpc-reconstruct.test.ts` : allers-retours chiffrés, registre vide ou avec effacement, mauvais mot de passe, corruption GCM, ancre incohérente, phrase trop courte.
- Commande de test : `pnpm exec tsx --test tests/smn-40-ledger-transfer.test.ts tests/smn-40-newpc-reconstruct.test.ts`.
- La recette de reconstruction sur PC vierge, les contrôles de disponibilité réelle de PostgreSQL, le transfert chiffré de documents et les tests DPAPI inter-PC **nécessitent un environnement Windows accessible**. Ne pas revendiquer ces essais à partir des seules vérifications de code ou de CI Linux.
- **Statut de la livraison :** export chiffré du registre et reconstruction isolée complète exécutés et attestés sur Windows 11 (preuve opérateur, voir bilan ci-dessous). Import DPAPI sur un autre profil Windows non exécuté, comparaison à une seconde candidate indépendante et qualification historique non attestées. **Aucune restauration active autorisée.**

Références : [ADR restauration fidèle](../planning-artifacts/architecture/ADR-SMN-EPIC2-RESTAURATION-FIDELE-VS-EFFACEMENT-2026-11-11.md), `src/server/backup/restore-sandbox.ts`, `src/server/backup/erasure-ledger.ts`, `src/server/backup/restore-row-fingerprint.ts`.

## Incrément de développement — parcours de restauration sécurisé

**Périmètre livré au code :** prévisualisation, vérification de l'archive, contrôle du registre externe, agrégation des blocages et présentation dans un parcours à **un seul clic** par archive dans `Paramètres → Sauvegardes`.

- API `POST /api/admin/backups/restore/plan` : requête limitée à l'identifiant UUID de l'archive, autorisation serveur `write/backups` obligatoire, évaluation de l'état réel via `previewBackup`, lecture de la preuve extérieure via `currentErasureEvidence` en transaction de lecture et politique `assessRestoreGate`. Code HTTP `409` et `canExecute:false` : il n'existe **aucun jeton d'activation**.
- Interface `backups-admin.tsx` : un seul bouton par sauvegarde lance le plan et affiche le détail des impacts et conditions de confidentialité en FR/EN ; aucun bouton ne restaure, ne supprime ni ne remplace des données.
- Tests `tests/smn-40-restore-plan.test.ts` : gardes d'autorisation, identité de l'archive, absence d'exécuteur dans la route et refus explicite d'une preuve cryptographique sans couverture historique intégrale.
- **Verrou d'autorisation conservé** : le moteur `currentErasureEvidence` retourne aujourd'hui `completeHistory:false` de façon volontaire et justifiée. Les effacements antérieurs au début de couverture ne peuvent pas être authentifiés rétroactivement. Il serait trompeur de modifier ce verdict à `true` ou de présenter une bascule de production comme disponible.
- **Non livré dans cet incrément** : import d'un paquet de sauvegarde externe dans un dossier privé, transaction de bascule sur installation active, compensation multi-fichiers, réauthentification après bascule, attestation historique indépendante. La restauration active reste interdite.

**Critère de sécurité :** jamais de promotion d'une sauvegarde sur la seule base d'une réussite de reconstruction isolée. Aucun test de l'interface ne doit être présenté comme la qualification d'une restauration active.

## Lot suivant — bascule compensable et qualification historique (11 novembre 2026)

### Implémenté : retour arrière après promotion sur environnement jetable

Le mécanisme existant `restore-cutover-drill.ts` conserve un **journal HMAC synchronisé**, écrit une intention avant le premier `ALTER DATABASE`, refuse les bases hors namespace `smn_restore_test_*` et conserve les originaux sous un nom de retour arrière.

Nouvelle compensation du scénario où la promotion PostgreSQL a réussi mais où l'étape suivante échoue :
1. Vérifier les trois noms de bases sur **la même instance PostgreSQL 18 isolée** : origine présente, candidate absente, sauvegarde de retour arrière présente ; refuser toute session concurrente.
2. Journaliser `rollback-started` avec signature avant de renommer.
3. Renvoyer la base promue vers son nom de candidate, vérifier l'état, puis remettre l'originale à son nom initial.
4. Vérifier l'état final des trois noms, journaliser `rolled-back`; le coordinateur de fichiers rétablit alors les documents originaux et conserve l'ancienne candidate comme preuve.
5. Si l'un de ces contrôles échoue, inscrire `incident` et **interdire la compensation automatisée des fichiers** : une divergence potentielle ne doit jamais être dissimulée.

Tests mis à jour : `tests/epic2-lot5-cutover-pg.test.ts` et `tests/epic2-lot5-coordinated-pg.test.ts` avec injection d'échec **après promotion**. Les tests PostgreSQL 18 de la CI doivent être réellement exécutés et confirmés avant de considérer ce nouveau cas qualifié.

**Limite fondamentale :** PostgreSQL `ALTER DATABASE RENAME` et plusieurs dossiers sur disque ne partagent pas une transaction atomique. C'est une **saga compensable et journalisée**, pas une transaction ACID globale. Le code est volontairement limité aux tests jetables : aucune bascule de l'installation active n'est activée par cette modification.

### Qualification des effacements antérieurs au registre

`scripts/smn-40-historical-privacy-audit.ts --check` recense désormais, en lecture seule et **sans identité ou contenu personnel**, les nombres de reçus d'effacement et de suppressions membres antérieurs à l'enrôlement, **uniquement si les deux tables d'audit sont disponibles**. L'état `preEnrollmentSourcesComplete:false` et `preEnrollmentHistoryAttested:false` reste obligatoire.

Ces comptes **ne prouvent pas** l'absence d'autres suppressions par chemins historiques, de données hors registre ni de copies externes. Il est impossible de déduire rétroactivement une couverture exhaustive de la seule existence de sept gardes SQL installés aujourd'hui ou d'un registre portant zéro marqueur.

**Décision d'architecture :** le contrôle `currentErasureEvidence` conserve `completeHistory:false`. Ni les commandes locales, ni un champ JSON fourni par l'utilisateur, ni la seule validation du registre depuis son démarrage ne peuvent le passer automatiquement à `true`. La qualification historique requiert des preuves indépendantes et exhaustives, ou un nouveau périmètre de migration conçu pour ne pas réintroduire des sujets effacés, attesté et testé séparément. Sans elles, `restorationAuthorized:false`.

**Livrables distincts et non réalisés :** exécuteur de bascule production sécurisé, interruption des accès et sessions réelles, test inter-PC de l'import DPAPI, preuve de couverture historique exhaustive. Le présent lot ajoute le scénario de compensation du *drill* et des signaux d'audit, **sans activer** la restauration active.

## Développement migration inter-PC — incrément source

L'interface `Paramètres → Sauvegardes` propose désormais, pour chaque archive, **« Contrôler la migration vers un nouveau PC »**, indépendamment du parcours de restauration sur l'instance courante. L'API `POST /api/admin/backups/migration/source` n'accepte qu'un UUID et effectue :

- Inventaire chiffré revérifié depuis le stockage géré (v4, cohérence, SMN v33, PostgreSQL 18, origine de l'installation).
- Validation du registre d'effacements ancré hors base, présence d'opérations non terminées et comparaison de la date de l'archive avec le début de couverture et les éventuels effacements ultérieurs.
- Verdict `exportCandidate` réservé au **paquet sortant** : transport techniquement admissible, **jamais** autorisation d'activation (`restorationAuthorized:false` invariant).
- Messages FR/EN et tests `tests/smn-40-migration-source.test.ts` ; aucune donnée privée ou clé n'est transmise au navigateur.

**Limites de livraison explicites :** le bouton ne télécharge pas encore un bundle portable ni n'installe les données sur le PC destination. Le contrôle de destination vierge, le transfert chiffré du registre, la récupération de la clé depuis la phrase de récupération, l'orchestration sécurisée de la bascule et la qualification de l'histoire antérieure au registre restent nécessaires. Ne pas décrire ce contrôle de sortie comme une migration de bout en bout.

La règle métier confirmée reste la **conservation des noms des membres, de leurs affectations et de l'historique** ; aucune anonymisation automatique ne doit intervenir lors du transfert.

### Export transportable du paquet chiffré

Une fois la candidature au transfert vérifiée, le parcours affiche **« Télécharger le paquet chiffré (.tar.gz) »**. Le serveur `GET /api/admin/backups/migration/export?id=<UUID>` renouvelle l'authentification administrative et les contrôles de registre et de sauvegarde avant d'émettre, en flux gzip, les seuls fichiers chiffrés `database.pgcustom.enc`, `manifest.enc`, `index.json` et les composants chiffrés listés dans le manifeste vérifié. Il **n'inclut jamais** `.backup-key`, les fichiers DPAPI ni le registre d'effacement externe. Les chemins sont limités aux composants connus ; dossiers symboliques et composants inattendus sont refusés. `Cache-Control: no-store` et `Content-Disposition: attachment`.

La destination doit transférer le registre par le mécanisme chiffré séparé, revalider le manifeste et récupérer la clé via la phrase de récupération. **Ne pas extraire ce paquet dans les fichiers actifs ou dans le répertoire de données PostgreSQL.** Aucun import automatique ou activation sur le nouveau PC n'est livré à ce stade. Tests : `tests/smn-40-portable-package.test.ts`.

### Réception d'un paquet portable sur PC vierge — livrée au code, recette CI attendue

Le module `src/server/backup/portable-import.ts` décompresse en flux la sauvegarde `.tar.gz` dans un dossier privé temporaire, refuse les chemins inattendus/traversées/entrées dupliquées/liens symboliques, limite chaque composant et contrôle les métadonnées USTAR. Il utilise la **phrase de récupération existante** pour retrouver la clé chiffrée dans `index.json`, vérifie intégralement le paquet v4 via `inspectBackup`, puis installe **uniquement le paquet chiffré**, sa clé locale et son enveloppe de récupération dans un magasin de sauvegardes **strictement inexistant**. Aucune modification de PostgreSQL, des fichiers métiers actifs, des sessions ou du registre indépendant.

L'outil `scripts/smn-40-portable-import.ts` reçoit la phrase **sur stdin** ; il refuse toute destination déjà initialisée. Exemple opérateur pour une installation vierge (la phrase ne doit jamais être saisie en argument ou journalisée) :

```powershell
$secure = Read-Host 'Phrase de récupération de la sauvegarde' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $phrase = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $phrase | pnpm exec tsx scripts/smn-40-portable-import.ts --archive <UUID> --file 'C:\Transfert\SMN-backup-<UUID>.tar.gz'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Variable phrase, secure -ErrorAction SilentlyContinue
}
```

Les commandes ci-dessus sont **documentaires** et n'ont pas été exécutées sur un second PC. Tests `tests/smn-40-portable-import.test.ts` : paquet authentique, mauvaise phrase, magasin de destination vierge, non-écrasement et maintien de `restorationAuthorized:false`.

**Limite fonctionnelle inchangée :** importer un paquet chiffré dans l'inventaire du nouveau PC n'est pas activer ses données dans PostgreSQL. Le transfert du registre d'effacement externe doit être exécuté séparément et la qualification de l'historique ancien reste bloquante. Le parcours de migration de bout en bout ne peut pas être déclaré terminé à cette étape.

### Raccordement à la reconstruction isolée après import portable

`scripts/windows/smn-40-newpc-one-shot.ps1` accepte désormais obligatoirement `-Archive <UUID>` et éventuellement `-Port <57190-57250>`. Il crée un cluster **neuf** dans `%LOCALAPPDATA%\SMN40-NewPC-Isolated-Port-<port>` sans effacer les clusters antérieurs, et déclenche les contrôles du candidat sous `smn-40-newpc-reconstruct.ts`. Les répertoires déjà occupés sont refusés. **Ne jamais diriger ce script vers la base active ni les bases REC-04.**

Après import préalable du paquet chiffré dans le stockage de sauvegardes du nouveau PC **et transfert/import séparé du registre HMAC sur un profil Windows vierge**, le candidat peut être reconstruit dans une base PostgreSQL 18 indépendante avec le script déjà éprouvé. À titre de référence documentaire uniquement, depuis un poste entièrement préparé :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\smn-40-newpc-one-shot.ps1 -Archive '<UUID>'
```

Une exécution de cette commande **n'est pas demandée ici**. Le script prépare et inspecte un candidat isolé, mais ne change ni la destination de l'application, ni les sessions, ni les effacements historiques. Les gardes `restorationAuthorized:false` subsistent.

**Recette encore ouverte :** import chiffré réel inter-PC, import du registre sur l'autre profil, reconstruction réelle sur ce second PC, et autorisation de reprise active selon preuves indépendantes. Les tests CI du paquet et du script ne remplacent pas ces preuves.

### Contrôle de réception avant reconstruction — lot de migration

L'outil `scripts/smn-40-migration-destination-check.ts` permet un contrôle **strictement en lecture seule** sur un PC de destination : il inspecte le paquet reçu avec sa clé locale de récupération, valide l'archive v4 et son schéma v33 via `inspectBackup`, lit le registre indépendant transféré, vérifie les intentions d'effacement non terminées et recherche des marqueurs postérieurs à l'archive.

Il retourne séparément `packageVerified`, `externalLedgerVerified`, `candidateReconstructionAllowed` et les raisons de blocage. Les champs `historicalCoverageCertified:false`, `restorationAuthorized:false` et `activeInstallationModified:false` sont invariants : **le feu vert de reconstruction isolée n'est jamais un droit d'activation**.

La recette dédiée `Epic 2 — Migration inter-PC et paquet chiffré` exécute export/import, mauvaise phrase, refus d'écrasement, protections des chemins, gardes de reconstruction et ce contrôle de réception sous Windows et Linux. L'exécution réelle de ces contrôles sur une nouvelle machine avec ses propres données n'est pas attestée par cette CI.

Référence d'utilisation future, après import du paquet chiffré **et** import séparé du registre signé sur un nouveau profil Windows :

```powershell
pnpm exec tsx scripts/smn-40-migration-destination-check.ts --archive '<UUID>' --check
```

**Ne pas lancer cette commande sur le PC source ni sur REC-04 dans le cadre des présentes vérifications.** Aucune activation, reprise de session ou compensation de production n'est disponible à ce stade.

### Correctif d'autonomie du nouveau PC

Le script `scripts/smn-40-newpc-reconstruct.ts` ne lit plus la configuration de la base de l'installation source pour créer une candidate sur une destination vierge. La valeur `sourceUri` ne sert qu'à la validation de séparation de clusters et est désormais un **comparateur constant jamais connecté**, différent du port/du rôle de la cible jetable. Aucune connexion au PC source ni base `smn` existante n'est requise sur le nouveau PC. Le seul client PostgreSQL effectivement connecté est celui de la base `smn_restore_test_newpc_*`, dans un cluster PG18 distinct ; les bases REC-04 restent interdites.

Ce correctif ne constitue **pas** une activation active : l'étape opérateur en nouvelle installation, l'attestation des effacements historiques et le test inter-PC réel restent non qualifiés. Tests de non-régression ajoutés à `tests/smn-40-newpc-reconstruct.test.ts`, CI migration Windows/Linux à vérifier sur le commit contenant ce correctif.

## Proposition de clôture sans fiction de preuve : migration d'état courant et restauration historique

L'Epic SMN-2 comprend deux opérations différentes :

1. **Migration d'état courant vers un PC vierge** : reprendre exactement le carnet tel qu'il existe *au moment de la migration*, avec les noms des membres, les affectations, calendriers, historiques et documents, sans réintroduire de données qui auraient disparu de ce même état source. La preuve nécessaire est une **équivalence intégrale et indépendante** entre source figée et candidate, avec tous les fichiers gérés, registre d'effacement signé synchronisé, absence d'opération postérieure, destination strictement vierge et compensation du basculement.
2. **Restauration d'une sauvegarde historique** sur une installation déjà utilisée : elle reste soumise à la couverture historique exhaustive des effacements, ou à une procédure d'expurgation vérifiable. **Ne jamais réemployer la règle de migration d'état courant pour autoriser une ancienne sauvegarde.**

Deux nouveaux modules accompagnent cette séparation :
- `src/server/backup/fresh-computer-transfer-policy.ts` : politique pure qui refuse toute candidature à l'examen hors ligne sans empreintes PG18 et fichiers strictement égales, source figée, registre synchronisé, aucune suppression postérieure, destination vierge, sessions réinitialisables et retour arrière vérifié ; **aucun droit d'activation dans le navigateur ni le code d'API**.
- `scripts/smn-40-current-state-comparison.ts` : empreintes de tables de la base source et de la candidate PG18 strictement isolée, requêtes SQL **READ ONLY**, retours anonymisés sous forme de hachages et différences de noms de tables ; ne vérifie ni le gel de la source ni les fichiers.

Le contrôleur de comparaison est un **outil de preuve partielle**, pas un exécuteur de migration. Même un résultat `equivalent:true` n'implique pas une migration autorisée. Le contrôle des fichiers actifs, le gel effectif des écritures, le parcours opérateur final, l'activation encadrée et la recette réelle de reprise sur un deuxième PC restent nécessaires.

### Critère final de livraison SMN-2

Ne marquer l'Epic **Terminée** que lorsque les 13 stories satisfont leurs critères d'acceptation, que les CI ciblées et transversales sont réussies et qu'une installation neuve non reliée à la base source a réellement retrouvé les données et documents autorisés avec un retour arrière éprouvé. Jusqu'alors, conserver les Stories non qualifiées en **En cours**. La preuve de non-réintroduction des effacements historiques n'est **pas** obtenue à partir du seul registre entré en service le 11 novembre 2026.

Le cas d'usage de migration intégrale de l'état actuel peut être développé sans anonymiser les membres ni falsifier la preuve historique ; le cas de restauration de versions anciennes reste bloqué séparément.

## Incrément de finalisation — attestation de migration vérifiable entre deux PC

### Implémentations sur `main`

- `src/server/backup/current-managed-file-fingerprint.ts` : inventaire canonique haché de **tous les fichiers gérés** (documents, PDF de rapports, rapports et modèles Office) à partir des scanners déjà sécurisés de SMN. La méthode donne le **même digest** que `inspectRestoreFileTree` sur la candidate reconstruite. Les tests comparent effectivement ces deux calculs sur des fichiers temporaires, sans données personnelles.
- `src/server/backup/current-state-transfer-receipt.ts` : attestation portable HMAC-SHA256 associant identité de la sauvegarde, horodatage, empreinte de toutes les tables, empreinte des fichiers, nombre de fichiers, couverture et tête du registre HMAC des effacements. Elle est signée avec la clé de sauvegarde chiffrée déjà protégée par la phrase de récupération. Aucune liste de noms de membres ou d'identités ne sort dans la preuve. La destination vérifie signature, archive, base, fichiers et registre ; toute divergence bloque.
- `scripts/smn-40-cross-pc-receipt.ts` : outil séparé de **capture** sur le PC source et de **vérification** sur une base candidate PG18 sur le PC destination, sans liaison réseau entre les ordinateurs. La capture exige un marqueur de maintenance externe `offline-restore`, l'absence d'autres sessions PostgreSQL et un WAL inchangé pendant le relevé ; le registre est relu avant/après. Le contrôle destination exige le registre importé et la candidate isolée.
- CI dédiée `epic2-migration-transfer.yml` enrichie avec les tests d'empreintes de fichiers, l'attestation portable, les chemins en lecture seule et les vérifications de refus.

### Ce qui est prouvé et ce qui ne l'est pas

Le rapport `currentStateMatched:true` signifie **seulement** que les empreintes et le registre correspondent à une capture source authentifiée. Il n'atteste pas que le PC source restera arrêté après la capture, qu'aucune autre copie externe ne sera activée, ni que les effacements antérieurs à l'enrôlement ont été exhaustivement documentés. Il ne constitue **jamais** une permission de restaurer une ancienne sauvegarde.

Le statut `restorationAuthorized:false` reste obligatoire. La production exige une procédure de bascule hors ligne qui installe et relance le cluster PostgreSQL et tous les répertoires gérés dans le profil destination, réinitialise les sessions et assure un retour arrière vérifié sur vraie installation. **Ce mécanisme n'est pas encore livré.**

### Clôture de l'Epic

Une CI réussie sur des espaces jetables, même sous Windows et PG18 réels, est une preuve de non-régression technique et **pas** une recette de migration de poste à poste sur machine physique. Ne pas déclarer SMN-2 « Terminé » avant une activation bout en bout et sa recette, avec preuve d'absence de réintroduction des données effacées. La migration de l'état courant et la restauration d'une sauvegarde historique restent deux parcours distincts.

## Développement de l'activation hors ligne dans une installation SMN vierge

### Chemin technique désormais implémenté au code

1. Depuis le PC source, une sauvegarde complète v4 **de l'état courant** et un registre externe vérifié sont préparés. Un opérateur fige le PC source (marqueur de maintenance, serveur arrêté) avant d'enregistrer l'attestation inter-PC HMAC `smn-40-cross-pc-receipt`. Les données des membres et leurs historiques **ne sont pas anonymisés ni supprimés**.
2. Sur le PC neuf, `smn-40-portable-import` vérifie la phrase de récupération et installe les données **chiffrées** dans un stockage vierge ; `smn-40-ledger-transfer` importe séparément le registre HMAC sous le nouveau profil Windows (DPAPI local).
3. `smn-40-managed-candidate-prepare` utilise le **PostgreSQL 18 portable déjà inclus dans la distribution** ; lorsque la base applicative `smn` est strictement vide, il restaure une candidate isolée **dans ce même cluster géré**, et vérifie les empreintes de tables, documents, PDF/Office et registre à l'aide de l'attestation source signée.
4. `smn-40-fresh-install-activate` est un exécuteur **hors serveur web**, Windows uniquement, avec confirmation explicite, marqueur de maintenance, runtime géré vérifié, destination strictement vierge et aucun raccord à une route HTTP. Il refuse les répertoires personnalisés, dépose les fichiers dans des dossiers de préparation frères de leurs destinations, contrôle les empreintes après copie puis après promotion, met l'ancienne base `smn` (vide) et les anciens répertoires à l'abri sous des noms de retour arrière, puis promeut la candidate. Les sessions applicatives sont en mémoire et ne sont pas reprises lors du nouveau processus. Le marqueur de maintenance **n'est jamais levé automatiquement**.
5. `src/server/backup/fresh-cutover-journal.ts` signe la chaîne de transitions de l'opération par HMAC-SHA256 ; une tentative de retour arrière vérifie l'état attendu avant compensation et refuse de poursuivre lorsque l'état est ambigu. **Aucune base ou archive originale n'est supprimée**.
6. `scripts/windows/package-portable.mjs` prépare des bundles JS autonomes des utilitaires de migration sous `app/maintenance/migration`. `scripts/windows/verify-package.mjs` teste leur syntaxe et leur refus d'arguments invalides avec le **node.exe embarqué**, sans `pnpm`/`tsx`/IDE sur la destination.

### Preuves attendues avant déclaration « Terminé »

- La CI `Epic 2 — Migration inter-PC et paquet chiffré` doit passer sur Windows/Linux avec les tests de signatures et garde-fous.
- La CI `Vérification I0` doit rester verte.
- **La CI de packaging Windows** doit réussir la compilation autonome, le smoke du Node embarqué, le contrôle antivirus et la production du ZIP signé/vérifié.
- Une recette de bout en bout sur un **nouveau profil Windows réellement vierge**, avec PostgreSQL 18, source figée, registre transféré, comparaison des empreintes, promotion, redémarrage et retour arrière forcé, est indispensable pour valider l'exécution **effective** de la bascule (les tests actuels ne démontrent pas encore cette recette). Ne pas utiliser l'installation active du développeur ni les bases REC-04 comme banc d'essai.
- Une **restauration d'ancienne sauvegarde** sur installation existante reste un cas différent, volontairement bloqué par l'absence d'attestation exhaustive des effacements antérieurs au registre (en service depuis le 11 novembre 2026). La migration d'état courant ne constitue pas une dérogation générale.

**Qualification actuelle : code développé, tests CI de l'incrément encore à confirmer, recette inter-PC physique non exécutée.** Il est interdit d'inscrire SMN-2 ou SMN-34/40 comme Terminée tant que ces preuves restent manquantes.


## Complément du 12 novembre 2026 — destination installée et vérification post-bascule

Le parcours inter-PC doit traiter explicitement le cas observé par l'utilisateur : la destination a déjà exécuté l'installation Express de SMN. **Une installation Express ayant créé les tables v33 n'est pas une destination PostgreSQL vierge**, même si aucune équipe métier n'y a été saisie. La bascule contrôlée `activateFreshManagedInstallation` refuse donc une base `smn` contenant des tables. Il ne faut pas supprimer cette base, ni le dossier PostgreSQL, ni les clés locales pour faire disparaître ce refus. Un transfert vers une destination déjà initialisée doit être qualifié comme scénario distinct, avec une sauvegarde vérifiée et un mécanisme d'archivage/compensation de son état antérieur.

Nouvelle politique explicite : `src/server/backup/fresh-destination-readiness.ts` retourne un état `pristine`, `initialized-or-populated` ou `unverifiable`, des codes de blocage et `restorationAuthorized:false` inconditionnel. L'absence d'informations, un serveur encore actif, des fichiers locaux, des données déjà installées, une preuve de source insuffisante ou un registre existant sont bloquants. Il s'agit d'un **contrat de décision**, pas encore d'un exécuteur de migration sur destination initialisée.

Pour les bascules hors ligne déjà qualifiées dans un environnement jetable, `scripts/smn-40-cutover-postcheck.ts --journal CHEMIN_ABSOLU` vérifie en lecture seule le journal HMAC signé, sa dernière étape `verified`, la persistance des deux bases `smn` et `smn_restore_test_back_*`, l'absence de la candidate sous son nom initial, l'absence de sessions connectées et la présence de la barrière de maintenance. Aucun appel HTTP, aucune suppression de marqueur et aucun remplacement de données. Le résultat indique `allSessionsMustBeReauthenticated:true`, `maintenanceReleased:false` et `sourceRetirementVerified:false`. Le script est inclus parmi les opérateurs autonomes packagés Windows avec Node embarqué.

**Séquence d'exploitation à qualifier avant toute utilisation réelle :** maintenir le gel de la source, vérifier la réception du paquet et du registre, recréer et contrôler la candidate isolée, comparer l'empreinte complète avec la source gelée, conserver le point de retour arrière, arrêter le serveur HTTP et les tâches d'écriture, activer uniquement si les protections existantes autorisent le scénario, vérifier le journal et les bases, réaliser une recette de connexion avec de nouvelles sessions après redémarrage, puis lever la maintenance **uniquement après accord indépendant**. En cas d'écart, conserver la barrière et appliquer un retour arrière contrôlé ; ne jamais effacer les bases de secours.

**État de preuve :** le nouveau contrôleur et la vérification post-bascule sont publiés en source avec des tests de politique, mais aucune restauration réelle entre les deux ordinateurs de l'utilisateur, aucun relâchement de maintenance, aucune récupération des comptes et aucune qualification de la destination Express déjà initialisée ne sont attestés. La migration complète demeure bloquée pour ce cas. La CI Windows et l'exécution réelle des tests sont à confirmer indépendamment.


### Mode de remplacement d'une destination SMN déjà initialisée — 12 novembre 2026

Le parcours hors ligne dispose désormais de deux modes indépendants :

- **Base réellement vierge :** comportement historique inchangé ; la préparation et l'activation refusent toute table préexistante.
- **Installation Express déjà initialisée :** option distincte et explicite. `smn-40-managed-candidate-prepare` exige `--replace-initialized-with-rollback` et `SMN40_MANAGED_PREPARE_CONFIRM=PREPARE_REPLACEMENT_WITH_ROLLBACK`. La préparation contrôle l'identité d'installation, l'état `initialized`, le schéma v33 et l'absence d'identité égale à l'archive source ; elle crée seulement une base candidate isolée sans modifier la base `smn`.
- **Bascule du mode précédent :** `smn-40-fresh-install-activate` exige `--confirm=REPLACE_INITIALIZED_DESTINATION_WITH_ROLLBACK` et `SMN40_FRESH_INSTALL_OFFLINE_CONFIRM=REPLACE_VERIFIED_INITIALIZED_DESTINATION_WITH_ROLLBACK`. En plus des contrôles communs (maintenance, preuve HMAC, candidat équivalent, fichiers gérés de destination vides, aucune connexion), la base d'installation précédente est renommée sous `smn_restore_test_back_*` et conservée. Il n'existe aucun `DROP DATABASE` ni nettoyage automatique. Une destination avec fichiers métier locaux est refusée, pas écrasée.

**Retour arrière post-bascule :** nouveau CLI `smn-40-cutover-rollback` exige `--journal CHEMIN --receipt CHEMIN --confirm=ROLLBACK_VERIFIED_NEWPC_CUTOVER` et `SMN40_ROLLBACK_OFFLINE_CONFIRM=ROLLBACK_VERIFIED_NEWPC_CUTOVER`. Il revalide d'abord le reçu signé contre l'état courant et exige l'absence de sessions. Il ajoute `rollback-started` au journal signé, renomme les deux bases dans l'ordre inverse, rétablit les dossiers conservés, puis écrit `rolled-back`. La base candidate et les dossiers migrés sont **préservés**. Un échec intermédiaire laisse `incident` et la barrière de maintenance en place pour reprise manuelle, jamais de redémarrage automatique.

**Après bascule :** `smn-40-cutover-postcheck --journal CHEMIN --receipt CHEMIN` exige un journal `verified`, la base active et sa base de secours, la chaîne d'effacement, aucune connexion et la comparaison des empreintes de toutes les tables et fichiers contre le reçu signé. La barrière ne doit pas être levée par le code. L'opérateur doit vérifier indépendamment l'arrêt des anciens processus, l'absence d'écriture sur la source, les résultats et le plan de secours avant de réouvrir le service ; le redémarrage crée un magasin de sessions en mémoire vide, ce qui impose une nouvelle authentification.

Ces fonctionnalités sont **des opérations hors ligne sensibles**, pas un bouton de restauration libre depuis l'application. La vérification de la source et la qualification historique demeurent des conditions impératives. Le code et les tests associés sont publiés, mais leur exécution Windows et une recette de migration réelle sur deux ordinateurs doivent être confirmées avant d'annoncer une disponibilité en production.
