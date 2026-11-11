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
