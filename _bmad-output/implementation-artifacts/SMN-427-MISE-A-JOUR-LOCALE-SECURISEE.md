# SMN-427 — Installer une mise à jour depuis un fichier local

**Epic :** SMN-424. **Responsable :** Amelia. **Date :** 10 novembre 2026.
**État :** code publié sur `main`; statut de la qualification Windows attesté séparément dans Jira et dans les workflows.

## Besoin et parcours

Un administrateur SMN sur un poste Windows 11 sans GitHub, Internet ni droit administrateur importe depuis **Paramètres → Maintenance → Mises à jour** un ZIP précédemment généré par SMN-426. L'interface affiche la version installée, les versions source/cible signées, le mode différentiel ou complet, le nombre d'ajouts, de suppressions et de modifications et un aperçu borné des chemins modifiés. Le bouton de confirmation est distinct de la vérification : sélectionner un ZIP ne modifie jamais les fichiers applicatifs.

Les profils `user` sont exclus. Les requêtes nécessitent une session SMN `admin` active, une origine HTTP locale conforme aux contrôles du projet et un lanceur propriétaire actif. Le serveur refuse une mise à jour si le poste ne possède pas la clé publique de confiance indépendante du ZIP (`runtime/trust/update-signing-public.pem`).

## Architecture implémentée

| Fichier | Responsabilité |
|---|---|
| `src/app/app/admin/settings/maintenance/updates-admin.tsx` | Interface FR/EN, sélection du fichier, aperçu, confirmation, messages d'état |
| `src/app/app/admin/settings/maintenance/page.tsx` | Onglet administrateur |
| `src/app/api/admin/updates/route.ts` | Consultation de version/launcher ; import multipart ZIP limité à 120 Mio |
| `src/app/api/admin/updates/confirm/route.ts` | Confirmation et nouveau précontrôle, écriture exclusive d'une requête de mise à jour |
| `src/server/updates/local.ts` | Staging isolé, nonce de confirmation, exécution de vérification sans shell |
| `scripts/windows/unpack-update.mjs` | Analyse ZIP bornée (compte, tailles, modes, chemins, CRC, compression, liens) avant extraction |
| `scripts/windows/import-update.mjs` | Extraction contrôlée dans `updates/staging/<id>`, signature et compatibilité |
| `scripts/windows/verify-staged-update.mjs` | Revalidation intégrité/signature/base avant confirmation et avant remplacement |
| `scripts/windows/launch-portable.mjs` | Propriétaire du serveur, heartbeat, arrêt du serveur web et exécution externe de l'updater |
| `scripts/windows/update-apply.mjs` | Reconstruction d'un candidat dans `updates/prepared/`, permutation contrôlée, copie des anciens composants dans `updates/rollback/`, redémarrage par le lanceur |
| `scripts/windows/package-portable.mjs` | Inclusion de tous les modules d'installation, sans outil ni réseau supplémentaire |
| `tests/update-import.test.mjs` | Scénarios ZIP hostiles, signature, dérive locale, conservation PostgreSQL et coupure/retour arrière de test |
| `.github/workflows/update-package.yml` | Tests de validation sur runner Windows |
| `.github/workflows/portable-package.yml` | Build standalone et vérification du paquet |

## Protections

1. Aucune archive ne décide d'un chemin absolu, d'un script à exécuter ni d'une destination personnalisée. Entrées ZIP chiffrées, ZIP64, liens symboliques, noms spéciaux NTFS, collisions de casse, traversée `../`, chemins privés et runtimes sont refusés.
2. Le ZIP décompressé est contrôlé par une signature Ed25519 vérifiée avec une **clé publique déjà présente hors du ZIP**. Les SHA-256 des fichiers et le manifeste canonique sont recomputés. Les deltas vérifient l'empreinte de **tout l'inventaire applicatif** précédent.
3. Le contrat limite la taille de l'archive, la quantité de fichiers et les volumes décompressés pour empêcher la saturation par une archive compressée malveillante. Le staging de fichiers en mémoire doit rester dans les limites prévues pour les paquets SMN.
4. L'application en service ne s'auto-remplace pas : le processus lanceur qui possède le serveur SMN attend un ordre confirmé et arrête uniquement le serveur HTTP, **pas PostgreSQL**. Il exécute ensuite `update-apply.mjs` sous le même utilisateur Windows, sans elevation ni réseau.
5. L'updater construit d'abord une arborescence candidate et vérifie toutes les empreintes. Ensuite seulement, il échange les composants applicatifs autorisés et conserve l'ancienne version dans `updates/rollback/`. En cas d'échec contrôlé, les fichiers applicatifs déplacés sont restaurés, et le serveur est relancé.
6. Les dossiers `data/`, `runtime/` et `updates/` ne sont jamais des cibles de remplacement. Les documents Office et PostgreSQL sont hors périmètre.

## Conditions non contournables

- Il faut démarrer SMN avec **Demarrer SMN.cmd** et un paquet initial déjà pourvu de la clé publique approuvée. Un paquet distribué avant le provisionnement de `SMN_UPDATE_SIGNING_KEY_PEM_B64` ne peut pas accepter un correctif avec une ancre de confiance absente ; il faut redistribuer le setup signé de référence.
- La mise à jour ne lance **aucune migration PostgreSQL automatique**. Les mises à jour impliquant une évolution du schéma seront soumises à SMN-429.
- Le traitement renforcé des interruptions brusques, sauvegardes vérifiées, reprises et restaurations après panne de courant sera complété dans SMN-428 ; le système de l'updater ne constitue pas encore une garantie de restauration générale des données.
- La recette sur un PC Windows 11 d'entreprise est à réaliser en SMN-430. Les tests GitHub Actions ne prouvent ni les restrictions antivirus ni les droits Windows de ce PC.
- Les paquets avec mise à jour des binaires Node ou PostgreSQL ne sont pas traités par ce workflow applicatif ; ils relèvent d'une procédure de maintenance distincte.
- L'administrateur doit conserver l'installation initiale et une sauvegarde de données éprouvée jusqu'à l'achèvement de l'Epic.

## Qualification minimale

Le test de l'import comporte des tentatives ZIP-slip, noms spéciaux, liens et entrées dupliquées, faux CRC, limite d'expansion, refus de mauvais état de base, vérification d'un paquet signé et intégrité des données. Un second scénario Windows effectue la coupure applicative sur une installation **jetable avec fichier témoin dans data/postgres**, contrôle la version cible et la présence de l'ancien fichier dans rollback.

Seules les exécutions GitHub Actions effectivement terminées en succès, avec traces, peuvent être considérées comme preuves. Aucun scénario de validation sur les données personnelles du poste de l'utilisateur n'est exécuté par ce développement.
