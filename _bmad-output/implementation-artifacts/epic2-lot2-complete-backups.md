# Epic 2 — Lot 2 : sauvegardes gérées cohérentes et exhaustives

**Date :** 9 novembre 2026  
**Stories :** [SMN-30](https://lmn24.atlassian.net/browse/SMN-30), [SMN-31](https://lmn24.atlassian.net/browse/SMN-31), [SMN-32](https://lmn24.atlassian.net/browse/SMN-32), dépendance technique [SMN-34](https://lmn24.atlassian.net/browse/SMN-34).  
**Branche :** `main`, référence native v33 **non modifiée**.  
**Périmètre :** fichiers **gérés par SMN** + tables de l'installation. Les copies externes hors des répertoires et les secrets locaux ne peuvent pas être récupérés par une sauvegarde SMN.

## 1. Inventaire de capture

| Source | Emplacement logique | Protection et contrôle |
|---|---|---|
| PostgreSQL 18 | Installation native v33, toutes tables SMN | `pg_dump --format=custom`, flux AES-256-GCM, taille et SHA-256, aucun dump clair sur disque |
| Documents TXT/PDF privés | `SMN_PRIVATE_DOCUMENTS_DIR` | Couples document + métadonnées, empreintes et contrôles anti-orphelin ; dossier non configuré = fonctionnalité de document privé désactivée |
| PDF des rapports finaux | `SMN_PRIVATE_REPORT_ARCHIVE_DIR` (ou valeur par défaut du magasin officiel) | Correspondance exhaustive des fichiers avec `smn_report_pdf_archive` ; taille, empreinte SHA-256, refus des fichiers orphelins/manquants |
| Rapports Office générés | `SMN_OFFICE_REPORTS_DIR` (ou dossier par défaut) | DOCX/PPTX gérés, chaque fichier inventorié et chiffré, refus des entrées inconnues et symlinks |
| **Modèles Office personnalisés** | `SMN_OFFICE_TEMPLATES_DIR` (ou dossier par défaut) | **Ajout du lot 2** : tous les DOCX/PPTX présents, vérification ZIP/OOXML par le catalogue SMN, SHA-256 et chiffrement |
| Logos, indicateurs, dashboards, configurations et relations | PostgreSQL | Inclus si réellement persistés en base ; les fichiers livrés par GitHub (p. ex. drapeaux et icônes `public/`) relèvent du déploiement du code et non d'une archive utilisateur |

Le scanner interdit les chemins et entrées atypiques, les fichiers manquants et les fichiers inattendus dans les collections gérées. Les sauvegardes **ne fabriquent pas de pièce manquante**.

## 2. Format et rétrocompatibilité

- Les nouveaux paquets utilisent **`manifest.version=4`** et incluent `reportPdfs`, `officeReports`, **`officeTemplates`**, ainsi que `consistency:{method:"wal-fence-v1",walLsn}`.
- L'inventaire du paquet valide la liste des composants, noms, tailles, SHA-256 du chiffré et du clair après authentification AES-GCM ; les dossiers supplémentaires, objets mal nommés et composants absents sont refusés.
- Les paquets v1–v3 conservent un contrôle d'intégrité compatible, mais `scopeComplete=false`. Ils ne deviennent pas des sauvegardes « complètes » simplement parce que leurs propres composants sont intacts.
- La page Administration → Sauvegardes affiche l'état d'intégrité **distinctement** du périmètre complet, le nombre de modèles Office et les avertissements relatifs aux archives anciennes.
- La reconstruction PostgreSQL 18 en base jetable déchiffre les modèles Office dans sa quarantaine, vérifie leur intégrité et les archive PDF référencées ; les paquets antérieurs à v4 restent catégorisés comme périmètre incomplet. `fullRestoreQualified:false` demeure : aucune bascule active n'est autorisée par ce lot.

## 3. Protocole de cohérence conservateur

La base et les systèmes de fichiers ne forment pas naturellement une transaction distribuée. Le protocole implémenté est **fail-closed** et refuse tout décalage connu :

1. Sous verrou advisory de sauvegarde (partagé avec la rétention), inventorier documents privés, références PDF et fichiers Office/modèles.
2. Relever la position WAL PostgreSQL avant le dump, et produire le dump custom PostgreSQL 18 sous snapshot SQL.
3. Chiffrer les composants du système de fichiers, comparer leurs empreintes aux inventaires initiaux, reconsulter les références PDF PostgreSQL et le WAL.
4. Après écriture du manifeste/index chiffrés, **avant publication atomique**, relire une dernière fois tous les inventaires et le WAL. Si l'un diffère ou n'est pas vérifiable : échec ; le répertoire `.partial` est supprimé et aucun paquet complet n'est annoncé.
5. Publier le répertoire sous UUID uniquement par renommage, sans exposer une archive partielle comme restaurable.

`src/server/backup/capture-fence.ts` formalise le contrôle WAL + métadonnées de fichiers et ses tests de divergence.

**Limite résiduelle importante :** cette double vérification conservatrice ne garantit pas une isolation transactionnelle stricte vis-à-vis d'un éditeur extérieur qui modifierait un fichier puis le remettrait à l'identique entre deux scans, ni des modifications entre l'ultime contrôle et le renommage. Pour éliminer totalement cette fenêtre, tous les producteurs de fichiers devraient respecter un verrou partagé ou le système devrait disposer d'un snapshot cohérent du volume. Le mécanisme refuse les incohérences détectées, sans prétendre offrir une transaction DB/FS absolue.

## 4. Rétention et protection des données métier

- `src/server/backup/retention-interruptions.ts` détecte les dossiers de purge interrompue `.retention-removing-<UUID>` ou atypiques, **sans les supprimer**.
- `executeBackupRetention` refuse désormais toute nouvelle purge lorsqu'une telle situation subsiste. Cela évite de confondre un paquet disparu, un audit incomplet et un résultat entièrement traité.
- Les journaux SMN-41 préservent les UUID des paquets traités, prévus et incertains ; la réussite n'est acquise que si l'audit SQL concorde avec l'absence du paquet.
- La politique 30 jours (configurable et auditée) s'applique uniquement aux paquets de sauvegarde gérés sous `packages/`, **jamais** aux PDF, TXT, modèles Office, images, dashboards, snapshots ou exports métier.
- Les copies exportées hors de la zone gérée ne sont ni inventoriées ni détruites par SMN. Aucun secret ou contenu déchiffré n'est exposé dans le diagnostic Administrateur.

## 5. Tests et preuves attendues

**Tests codés** :
- `tests/epic2-lot2-capture-fence.test.ts` : modifications du WAL, documents privés, PDF, rapports Office et modèles ajoutés/modifiés ;
- `tests/epic2-lot2-retention-safety.test.ts` : tombstones de purge et refus de nettoyage silencieux ;
- `tests/smn-34-extra-archives.test.ts` : vérification des fichiers et chiffrement réels ;
- `tests/smn-34-v3-postgres.test.ts` : conserve son nom historique, mais exerce maintenant **le paquet v4** sur deux bases PostgreSQL 18 jetables. Il crée une installation v33, un sprint, une archive PDF, un rapport Office, un **modèle Office personnalisé** et un document privé ; il sauvegarde, vérifie, restaure en quarantaine et contrôle les liens SQL et l'intégrité de l'installation source ;
- Suites `tests/backup-retention.test.ts`, `tests/backup-restore-readiness.test.ts`, `tests/backup-erasure-protection.test.ts`.

**Workflow de qualification Windows/Linux/PostgreSQL 18** :
https://github.com/JeanLamora75/SMN/actions/workflows/smn-34-restore-sandbox.yml

Une exécution doit être considérée comme qualifiée uniquement après vérification des trois jobs : `sandbox-policy (windows-latest)`, `sandbox-policy (ubuntu-latest)` et `postgres-18-v4-reconstruction`, ainsi que des résultats `pnpm typecheck` et `pnpm i18n:check`.

## 6. Actions de recette locale et limites

- Récupérer le code avec GitHub Desktop et sauvegarder les données existantes ; ne pas effacer ni recréer le dossier de sauvegarde avant vérification des clés de récupération.
- Vérifier les quatre variables concernées : `SMN_PRIVATE_DOCUMENTS_DIR`, `SMN_PRIVATE_REPORT_ARCHIVE_DIR`, `SMN_OFFICE_REPORTS_DIR`, `SMN_OFFICE_TEMPLATES_DIR`, ainsi que `SMN_BACKUP_DIR`.
- Exécuter une nouvelle sauvegarde v4 sur une **installation de test représentative** (multiéquipes, indicateurs dynamiques, Dashboard Builder, modèles Office et rapports). Vérifier la présence des composants et la réconciliation des PDF.
- Tester des modifications concurrentes en base et de fichiers ; elles doivent entraîner un échec contrôlé, sans exposition d'un paquet partiel.
- Vérifier les copies de récupération sur une autre machine et la phrase de récupération sur une base isolée.
- Ne pas déclarer SMN-34 achevée : la bascule active, la révocation de sessions, le retour arrière crash-safe et le registre d'effacement SMN-40 ne sont pas fournis par le lot 2.

**Adaptation BMAD :** la commande `uv run` officielle ne peut pas être exécutée à travers le connecteur GitHub ; documentation et développements sont réalisés via GitHub et Jira. Le résultat d'une CI réelle est consulté séparément, sans inventer d'exécution sur le poste Windows de l'utilisateur.


## 7. Qualification finale exécutée — 9 novembre 2026

**SUCCÈS attesté** : [GitHub Actions #42618124959](https://github.com/JeanLamora75/SMN/actions/runs/42618124959) — commit testé `7998cb1ad33b79c0ae0772471947c95246d1bee3`.

| Job | Résultat réellement constaté |
|---|---|
| `sandbox-policy (windows-latest)` | **Success** : contrats de restauration, archives, cohérence, rétention et autres protections ; `pnpm typecheck` ; `pnpm i18n:check` |
| `sandbox-policy (ubuntu-latest)` | **Success** : mêmes contrôles sous Linux |
| `postgres-18-v4-reconstruction` | **Success** : PostgreSQL 18 réel, installation v33 source et base de reconstruction jetable |

**Preuve textuelle de la reconstruction tirée des logs :**

```json
{"evidence":"EPIC2-LOT2-v4-PG18-sandbox","sandbox":true,"pdfCount":1,"officeCount":1,"templateCount":1,"privateCount":1,"databaseAndDocumentsConsistent":true,"activeInstallationModified":false}
```

Le test PostgreSQL s'est terminé avec **1 réussite, 0 échec**. Il s'agit d'un contrôle de **reconstruction isolée**, non d'une bascule de restauration active, ni d'une preuve de récupérabilité complète sur le poste de l'utilisateur.

**Point d'architecture non résolu pour une garantie absolue de cohérence :** le WAL et les doubles inventaires évitent la publication en cas de dérive détectée, mais ne sont pas une transaction atomique PostgreSQL + système de fichiers. Une fenêtre résiduelle subsiste pour les écrivains externes et entre l'ultime contrôle et le renommage. Ce risque doit être arbitré avant de rendre SMN-34 exécutable. Les éditions hors SMN et les copies externes restent hors des garanties du mécanisme.

Aucune migration, sauvegarde, restauration ou purge n'a été exécutée sur l'installation Windows personnelle de l'utilisateur. Les modifications ont été publiées sur GitHub `main` et qualifiées sur des runners GitHub et des bases jetables uniquement.

**Statut de livraison recommandé :** lot 2 développé et qualifié en CI pour le périmètre des fichiers gérés ; SMN-30/31/32 conservent une recette d'installation locale et une acceptation fonctionnelle à réaliser avant clôture Jira.
