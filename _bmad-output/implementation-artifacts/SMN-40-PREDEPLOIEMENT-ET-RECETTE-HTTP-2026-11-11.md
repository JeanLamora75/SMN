# SMN-40 — Préparation de déploiement et qualification HTTP
Date : 2026-11-11. État : **préparation technique réalisée ; autorisation de déploiement non acquise**.

## Preuves obtenues

- PostgreSQL 18 isolé, recette intégrée réalisée localement par l'opérateur :
  `EPIC2-SMN40-PG18: old snapshot denied, post-erase clone integrity verified` ;
  1 test réussi, 0 échec.
- Réexécution des migrations de protection SQL sur base `smn40_migration_test` :
  quatre déclencheurs actifs, transactions de recette annulées.
- Suppression directe de membre sans reçu : refusée. Avec reçu transactionnel :
  acceptée sur données fictives puis annulée.
- Restriction d'archives : refus de UPDATE et DELETE confirmé, données fictives annulées.
- Sept tests locaux existants et deux tests simulés de l'exécuteur réussis.
- Contrôle HTTP : contrat de route et jeton signé couverts par tests ; une
  vérification HTTP anonyme en boucle locale est fournie mais son exécution
  doit être observée sur une installation en marche.

## Contrôles disponibles

### Vérifier les contrats locaux

```powershell
pnpm exec tsx --test tests/smn-40-http-and-predeploy.test.ts tests/smn-40-maintenance.test.ts tests/epic2-smn40-executor-qualification.test.ts
```

### Vérifier réellement la barrière HTTP sans session administrateur

Le serveur SMN doit déjà être démarré localement. Cette opération ne transmet
ni cookie, ni jeton valide, ni identité de membre, et ne peut pas déclencher
d'effacement :

```powershell
pnpm exec tsx scripts/smn-40-http-smoke.ts --url=http://127.0.0.1:3003
```

Résultat attendu : 403 `forbidden` pour les deux requêtes.

**Limite** : ce test ne prouve pas le parcours HTTP authentifié et sa validation
de bout en bout ; ce point doit être testé avec une session et une base de
recette explicitement isolées.

### Audit pré-déploiement de la base active — lecture seule

```powershell
pnpm exec tsx scripts/smn-40-predeploy-audit.ts --check
```

Le script refuse les URL distantes, exige une base native locale
`smn` / `smn_*`, ouvre une transaction `REPEATABLE READ READ ONLY`,
puis produit l'inventaire des sept protections, des membres, des archives
PDF et du registre d'effacement externe.

Il **ne vérifie pas** par lui-même l'intégrité d'une sauvegarde, ne qualifie
pas les effacements antérieurs et n'autorise jamais l'application des
migrations. Ne pas interpréter `externalLedger=verified` comme une preuve
de complétude historique.

## Conditions bloquantes avant tout déploiement

1. CI I0 générale verte, ou écarts résolus avec preuves explicites.
2. Parcours HTTP admin sur environnement de recette : refus sans droit, sans
   accusé de copies externes, avec plan altéré/périmé, avec révision modifiée ;
   succès borné après vérification de l'intégrité SQL et du registre externe.
3. Contrôle des sauvegardes de **la base active** : sauvegarde v4 vérifiée,
   archives PDF/Office cohérentes et possibilité de retour arrière qualifiée.
4. Analyse d'impact sur les données réelles : absence de suppression légitime
   empêchée de façon imprévue, règles pour membres archivés et dépendances.
5. Vérification des répertoires externes d'intention, du registre et de l'ancre
   en dehors des sauvegardes, sans inventer d'historique pré-enrôlement.
6. Exécution explicite de la maintenance additive seulement après autorisation
   opérationnelle, jamais par démarrage automatique ou à travers ce document.

## Décision

**NO-GO déploiement et restauration historique** tant que ces conditions ne
sont pas démontrées. Les preuves techniques en sandbox ne remplacent pas une
qualification de confidentialité historique. Ne jamais initialiser un registre
vierge pour déclarer vérifiées des suppressions passées.


## Préparation du registre externe — sans enrôlement

L'audit de l'installation active du 11/11/2026 a constaté 15 membres,
0 archive PDF référencée, 0/7 protections installées et
`externalLedger=unconfigured`. **Ne pas initialiser de registre vierge**
avant qualification des suppressions antérieures.

Le registre utilisera trois variables `SMN_ERASURE_LEDGER_DIR`,
`SMN_ERASURE_ANCHOR_DIR` et `SMN_ERASURE_LEDGER_KEY_HEX`.
Les deux répertoires doivent être absolus, distincts, non imbriqués, hors
des dossiers de sauvegarde, des documents privés et des rapports/modèles Office.
La clé de 32 octets en hexadécimal doit rester confidentielle, sauvegardée et
récupérable selon une procédure sécurisée distincte ; ne jamais la commiter
ni la copier dans une sortie de diagnostic.

Le système vérifie les ancrages HMAC, les déchirures d'écriture et les
intentions en attente. Il ne fournit pas un stockage WORM matériel et
ne peut pas certifier les opérations antérieures à son enrôlement.

### Sauvegarde v4 existante — contrôle sans écriture

Sur l'installation d'origine, après synchronisation GitHub :

```powershell
pnpm exec tsx --test tests/smn-40-backup-readiness.test.ts
pnpm exec tsx scripts/smn-40-backup-readiness.ts --archive 1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5 --check
```

Le premier test valide le contrat de sécurité de la commande.
Le second inspecte l'archive v4 et compare l'inventaire des PDF,
rapports et modèles Office aux fichiers présents.
**Il n'effectue aucune restauration**, et un succès d'intégrité
n'est pas une preuve de retour arrière ni de conformité historique.

La recette REC-04 a précédemment reconstruit un instantané dans un
cluster isolé PG18, sans qualification définitive de restauration :
cette preuve ne remplace pas un contrôle à jour de la sauvegarde active.


## REC-04 — liaison de preuve non destructive avec la sauvegarde v4

Recette locale antérieure : la sauvegarde v4
`1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5` a été reconstruite dans
le cluster PostgreSQL 18 isolé (port 57186), base
`smn_restore_test_rec04_sandbox`, avec 192 tables.
L'inventaire vérifié contient un rapport Office, un modèle Office, zéro PDF.

Le nouveau `scripts/smn-40-rec04-evidence.ts --check` constate à nouveau
le schéma, le répertoire physique du cluster, les versions et les composants
de la sauvegarde, et refuse tout autre port, base ou cluster.
Il utilise uniquement une transaction en lecture seule.

### Exécution locale sécurisée

La recette exige deux variables temporaires :
`SMN40_REC04_DATABASE_URL` (connexion au seul cluster REC-04)
et `SMN40_REC04_CLUSTER_DIR` (chemin exact du répertoire PGDATA).
La première peut être définie avec un mot de passe saisi de manière masquée,
puis doit être supprimée de la session. Ne jamais enregistrer sa valeur dans
GitHub, les logs ou le dossier de preuves.

```powershell
pnpm exec tsx --test tests/smn-40-rec04-evidence.test.ts
pnpm exec tsx scripts/smn-40-rec04-evidence.ts --check
```

**Portée de la preuve** : observation de la base REC-04 et réinspection
cryptographique de l'archive locale ; pas de restauration supplémentaire,
pas de comparaison exhaustive des lignes, pas de simulation d'arrêt du
serveur Windows ni de basculement en production.

**Statut opérationnel** : REC-04 est un élément utile du dossier de preuves,
mais `snapshotRowEquivalenceProven=false`,
`rollbackCutoverQualified=false` et
`historicalErasureCoverageQualified=false`.
Le statut reste **NO-GO** pour tout retour arrière destructif ou pour une
mise en production non contrôlée.


## Qualification de l'équivalence des lignes et retour arrière Windows

### Calcul d'empreintes comparables

`src/server/backup/restore-row-fingerprint.ts` calcule pour chaque table
publique une empreinte SHA-256 des empreintes de toutes les lignes
normalisées, triées sans dépendre de l'ordre physique ni d'une clé primaire.
Les colonnes et les valeurs ne sont jamais sorties de PostgreSQL en clair :
le processus Node ne reçoit que les empreintes SHA-256 des lignes.
La comparaison échoue si une table manque, si le nombre de lignes varie,
ou si une empreinte diffère. L'analyse refuse les tables dépassant 200 000
lignes ; une telle limite bloque la qualification plutôt que d'ignorer les
données. Une comparaison identique de deux restaurations issues de la même
archive prouve leur cohérence entre elles, **pas** l'exactitude de l'archive
vis-à-vis du serveur originel au moment de la capture.

`scripts/smn-40-rec04-row-compare.ts --check` exige deux bases
distinctes sur le même cluster isolé PG18/57186 : REC-04 et une seconde base
`smn_restore_test_*` restaurée indépendamment à partir de l'archive v4.
Il exige `SMN40_REC04_DATABASE_URL`,
`SMN40_SECOND_RESTORE_URL` et `SMN40_REC04_CLUSTER_DIR`.
Il ne crée ni ne modifie de base. Une seconde restauration indépendante
**n'a pas encore été exécutée** pour cette étape. Ne pas fournir l'URL
de la base SMN active, même pour un test.

### Procédure Windows de retour arrière — documentation, pas d'exécution

La procédure doit s'appliquer uniquement après une nouvelle autorisation
opérationnelle et un inventaire des écritures en cours :

1. Effectuer une sauvegarde v4 de l'installation active et une vérification
   indépendante des fichiers PostgreSQL, PDF, rapports, modèles et documents.
2. Préserver le registre d'effacement externe, son ancre et les intentions
   en attente en **dehors** du périmètre de restauration. Ne jamais réinitialiser
   ou réduire son historique après un retour arrière.
3. Établir un arrêt effectif du serveur HTTP, des tâches programmées, des
   processus Node et des écrivains PostgreSQL externes. Le simple comptage
   des connexions n'est pas une garantie suffisante.
4. Rejouer le scénario de basculement dans des bases jetables uniquement,
   avec les fonctions existantes `restore-cutover-drill.ts`,
   `restore-file-cutover-drill.ts` et
   `restore-offline-operator-preflight.ts`.
5. Vérifier le journal d'intention persistant avant tout renommage de base,
   le maintien d'un exemplaire de rollback, les empreintes des dossiers et
   la réponse aux incidents entre les phases SQL et fichiers.
6. Contrôler les 14 scénarios Windows de la procédure de recette transversale
   et le mécanisme de blocage de démarrage de
   `scripts/windows/restore-launch-gate.mjs`. Documenter les résultats
   réellement observés sur l'hôte Windows.
7. En cas d'échec ou d'incertitude, conserver les données originales et
   les traces de sécurité. **Aucun retour arrière vers une sauvegarde
   contenant des données effacées ne doit être activé** tant que la
   preuve de confidentialité historique est incomplète.

Aucune de ces actions de basculement n'a été effectuée sur la base active.
Le dossier de preuve REC-04 reste limité à une restauration isolée vérifiée
structurellement et cryptographiquement, sans équivalence exhaustive
qualifiée avec la sauvegarde d'origine.

**Statut : NO-GO déploiement et restauration historique.**


## Deuxième restauration indépendante — recette REC-04

Un lanceur à deux modes, `scripts/smn-40-rec04-second-restore.ts`,
permet de réaliser sans commande SQL manuelle une deuxième restauration
indépendante du paquet v4 dans `smn_restore_test_rec04_second` sur
le cluster isolé port 57186. Il ne lance aucun traitement automatiquement.

- `--check` vérifie l'identité physique du cluster, la présence et
  l'accessibilité de REC-04, l'absence de la base cible, le schéma
  et l'intégrité de l'archive sans créer de base.
- `--restore --confirm=RESTORE_SECOND_DISPOSABLE_ONLY` est une
  opération **avec écriture exclusivement dans une nouvelle base
  jetable**. Elle exécute le moteur `rehearseBackupRestore` existant,
  compare des empreintes ligne par ligne puis conserve la base cible
  pour vérification. Elle n'efface et ne renomme aucune base.
- Le rôle PostgreSQL doit avoir `CREATEDB` sur le cluster REC-04.
  Le binaire `pg_restore` PostgreSQL 18 doit être accessible via
  SMN ou `SMN_PG_RESTORE_PATH`. Un échec après création laisse la
  base temporaire en place pour expertise, sans nettoyage destructif
  automatique. Toute répétition est alors refusée tant que la cible existe.

Avant d'exécuter `--restore`, il faut obtenir un succès de :

```powershell
pnpm exec tsx --test tests/smn-40-rec04-second-restore.test.ts
pnpm exec tsx scripts/smn-40-rec04-second-restore.ts --check
```

Les variables d'environnement temporaires sont :
`SMN40_REC04_DATABASE_URL` (base REC-04 sur 57186) et
`SMN40_REC04_CLUSTER_DIR` (PGDATA exact du cluster).
Il est interdit de publier l'URL avec son mot de passe. Le
fichier `.env.local` ne doit pas être envoyé.

À l'issue d'une deuxième restauration réussie, les deux bases
sont cohérentes entre elles. Cela ne prouve **ni** le caractère
licite d'une restauration historique, **ni** la possibilité d'un
basculement de l'installation Windows active. Le déploiement
demeure NO-GO.
