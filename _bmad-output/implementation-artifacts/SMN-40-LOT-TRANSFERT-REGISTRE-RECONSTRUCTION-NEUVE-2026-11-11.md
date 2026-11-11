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
4. Préparer une **nouvelle base d'essai jetable vide** (jamais REC-04, jamais l'active), sur une instance/identité PostgreSQL dédiée. Utiliser le moteur `rehearseBackupRestore` existant avec cette cible, et un espace de staging jetable dédié pour les documents. Il impose un nom `smn_restore_test_*`, vérifie PostgreSQL 18, restaure transactionnellement, vérifie les références PDF et les fichiers.
5. Produire deux empreintes indépendantes en lecture seule de toutes les tables de la reconstruction via `fingerprintPublicTables` et les confronter à une reconstruction isolée indépendante de **la même archive** ; compléter par les contrôles de noms, équipes, affectations, versions et historiques sans exposer d'identifiants dans les logs. Les empreintes des archives Office, PDF et documents privés doivent coïncider avec le manifeste authentifié.
6. Réconcilier les événements du registre avec les reçus SQL, les intentions en attente, les éventuels traitements antérieurs à l'enrôlement et les copies externes. Si des effacements postérieurs à la sauvegarde subsistent sans expurgation vérifiable dans le candidat, déclarer **reconstruction non activable**.
7. Vérifier que les deux bases REC-04 de preuve sont strictement inchangées (inspection en lecture seule, jamais `DROP`). Ne déclencher **aucun** mécanisme de bascule. Tester séparément les réauthentifications des utilisateurs, sans publier de secrets.

**Critère d'acceptation :** état d'une reconstruction candidate vérifiable, inventaire complet des fichiers, chaînes d'effacement attestées ou obstacles explicités, rapports de différences anonymisés et `restorationAuthorized:false`. Aucune preuve d'exécution réelle Windows n'est acquise tant que les commandes n'ont pas été exécutées sur les postes concernés.

## Tests et limites

- Test unitaire `tests/smn-40-ledger-transfer.test.ts` : allers-retours chiffrés, registre vide ou avec effacement, mauvais mot de passe, corruption GCM, ancre incohérente, phrase trop courte.
- Commande de test : `pnpm exec tsx --test tests/smn-40-ledger-transfer.test.ts`.
- La recette de reconstruction sur PC vierge, les contrôles de disponibilité réelle de PostgreSQL, le transfert chiffré de documents et les tests DPAPI inter-PC **nécessitent un environnement Windows accessible**. Ne pas revendiquer ces essais à partir des seules vérifications de code ou de CI Linux.
- **Statut de la livraison :** premier raccordement transport export/import codé ; reconstruction réelle vierge et réconciliation exhaustive non attestées. **Aucune restauration active autorisée.**

Références : [ADR restauration fidèle](../planning-artifacts/architecture/ADR-SMN-EPIC2-RESTAURATION-FIDELE-VS-EFFACEMENT-2026-11-11.md), `src/server/backup/restore-sandbox.ts`, `src/server/backup/erasure-ledger.ts`, `src/server/backup/restore-row-fingerprint.ts`.
