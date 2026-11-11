# SMN-40 — Procédure sécurisée de migration SQL et enrôlement du registre externe

**État : procédure publiée, exécution sur l'installation Windows non encore attestée.**
**Cible : installation native v33, Windows 11, PostgreSQL 18 local.**
**Périmètre : sept protections SQL additives SMN-39/40 et journal HMAC à compter de son enrôlement.**
**Interdits : réinitialiser la base, restaurer en production, conclure à un effacement historique complet.**

## 1. Principes et prérequis

1. Synchroniser `main` avec GitHub Desktop. Ne pas exécuter `uv`, Codex CLI ou un programme tiers.
2. Créer une **nouvelle sauvegarde v4** par le centre de sauvegarde SMN, vérifier son intégrité et conserver l'UUID. Effectuer une restauration indépendante sur une base **jetable** et conserver le procès-verbal. Les REC-04 précédents ne prouvent pas automatiquement l'état d'une nouvelle archive.
3. Fermer le serveur Next, le lanceur propriétaire, les jobs et toutes les sessions PostgreSQL actives ; ne pas couper PostgreSQL, qui doit rester accessible au migrateur. Fermer le navigateur n'arrête pas nécessairement le serveur.
4. Le port HTTP 3003 doit refuser la connexion. Aucune autre session ne doit occuper la base native. Un instantané « zéro connexion » ne prouve pas l'absence de futurs écrivains : maintien de la maintenance sous contrôle humain.
5. Conserver le dossier `data/` et toutes les sauvegardes. **Ne jamais** copier une sauvegarde, un secret, le journal ou une archive privée vers GitHub/Jira.

Les trois fichiers SQL existants sont appliqués en **une transaction PostgreSQL unique**, avec `lock_timeout=3s` et vérification post-migration des 7 protections. En cas d'erreur avant COMMIT, la transaction est annulée. Une migration **déjà validée** n'a pas de rollback automatique en production : la récupération éventuelle se prépare hors ligne et doit être évaluée indépendamment.

## 2. Contrôle sans écriture

Dans PowerShell, à la racine SMN, utiliser l'UUID **de la sauvegarde réellement vérifiée**, sans chevrons :

```powershell
$archiveId = "REMPLACER_PAR_UUID_DE_LA_SAUVEGARDE"
pnpm exec tsx scripts/smn-40-maintenance.ts --check
pnpm exec tsx scripts/smn-40-privacy-install-preflight.ts --archive $archiveId --check
```

Vérifier dans le rapport `verifiedArchive:true`, `schemaVersion:33`,
`concurrentDatabaseSessions:0` et
`decision.readyForExplicitGuardsInstallation:true`.
Si un champ échoue, **ARRÊTER**. Le précontrôle ne modifie pas la base et ne déclare jamais l'historique confidentiel complet.

Le précontrôle teste exclusivement l'intégrité cryptographique du paquet et l'état instantané de l'installation : il **ne certifie ni la fraîcheur métier de la sauvegarde ni le retour arrière réel sur ce poste**. Ces preuves sont des prérequis opérateur indépendants.

## 3. Application contrôlée des sept protections

**Seulement après validation des prérequis de la section 1 et du précontrôle :**

```powershell
$env:SMN40_PRIVACY_BACKUP_ARCHIVE_ID = $archiveId
try {
  pnpm exec tsx scripts/smn-40-maintenance.ts --apply --confirm=INSTALL_SENSITIVE_PRIVACY_GUARDS --backup-verified=YES
  if ($LASTEXITCODE -ne 0) { throw "Migration refusee ou interrompue" }
} finally {
  Remove-Item Env:SMN40_PRIVACY_BACKUP_ARCHIVE_ID -ErrorAction SilentlyContinue
}
pnpm exec tsx scripts/smn-40-maintenance.ts --check
```

Le script exige une archive v33 lisible et vérifiée, un port 3003 inactif,
l'absence d'autres connexions PostgreSQL et les confirmations exactes.
Le script teste encore les sessions à l'intérieur de la transaction.
Le succès attendu est `applied:true` et les sept champs
`receipt`, `receipt_immutable`, `archive_restriction`,
`archive_immutable`, `member_audit`, `member_audit_immutable`,
`delete_guard` à `true`.

Une migration refusée ne doit pas être contournée. Ne pas supprimer le trigger de protection membre pour rendre une suppression historique possible.

## 4. Enrôlement distinct du registre d'effacement

Cette étape est **interdite avant les 7 protections SQL**. Le registre
commence **au moment exact de l'enrôlement** et ne prouve aucune suppression
antérieure.

Les emplacements sont extérieurs à l'installation pour éviter leur copie
dans une archive SMN ou leur effacement par un patch :

- Journal HMAC : `%LOCALAPPDATA%\ScrumMasterNotebook\privacy-ledger`
- Ancre séparée : `%APPDATA%\ScrumMasterNotebook\privacy-anchor`
- Clé de signature : `%APPDATA%\ScrumMasterNotebook\privacy-anchor\key.dpapi`

La clé aléatoire de 256 bits est chiffrée avec Windows DPAPI, liée au compte
utilisateur Windows. Ni la clé claire ni les chemins privés ne sont affichés
par l'enrôlement. Le chargeur côté serveur la récupère à la demande. Aucun
secret n'est écrit dans `.env.local`.

```powershell
pnpm exec tsx scripts/smn-40-ledger-enrollment.ts --check
pnpm exec tsx scripts/smn-40-ledger-enrollment.ts --enroll --archive $archiveId --confirm=ENROLL_NEW_HISTORY_FROM_TODAY
pnpm exec tsx scripts/smn-40-ledger-enrollment.ts --check
```

L'enrôlement exige à nouveau le précontrôle d'archive et d'absence de service.
Il refuse les anciens répertoires, journaux, ancres ou clés : **aucune
réinitialisation** possible par un second passage. Si l'opération échoue
après une création partielle, **ne pas supprimer les fichiers et ne pas
relancer `--enroll`** : conserver les artefacts et qualifier l'incident.
Les fichiers et l'ancre doivent être protégés indépendamment et sauvegardés
hors du périmètre des sauvegardes SMN.

**Portabilité :** le secret DPAPI n'est pas directement déchiffrable après
copie de SMN vers une autre machine ou un autre compte Windows. La migration
d'une installation vers un autre PC exige un processus sécurisé de transfert
et de récupération du secret, **non encore qualifié**. Ne pas considérer
une copie du dossier `data/` comme une copie intégrale du registre HMAC.

## 5. Observations postérieures et NO-GO

Redémarrer normalement SMN, puis vérifier en lecture seule :

```powershell
pnpm exec tsx scripts/smn-40-predeploy-audit.ts --check
pnpm exec tsx scripts/smn-40-historical-privacy-audit.ts --check
```

Attendu : 7 protections détectées, registre `verified` si l'enrôlement
a réussi, date `coverageStart` récente et `preEnrollmentHistoryAttested:false`.
L'audit historique rend volontairement `deploymentAuthorized:false`
et un code de sortie 2. Les archives Office, PDF et privées exigent toujours
une revue humaine. Le garde PostgreSQL peut modifier le comportement de la
suppression ordinaire des membres ; réaliser une recette de non-régression
sans créer une suppression réelle de membre.

**Ne jamais** forcer `completeHistory:true`, restaurer un ancien backup
en production, modifier manuellement un reçu immuable ou effacer l'ancre.

## 6. Vérifications reproductibles

```powershell
pnpm exec tsx --test tests/smn-40-privacy-install-and-ledger.test.ts tests/smn-40-maintenance.test.ts tests/epic2-lot4-erasure-ledger.test.ts
pnpm typecheck
```

Ces tests contractuels et la CI ne remplacent pas l'exécution réelle
des étapes de maintenance et de recette Windows sur l'installation.

**Verdict permanent à ce jalon : NO-GO pour la restauration historique et la qualification de l'historique antérieur.**
