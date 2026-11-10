# SMN — Spécification normative du ZIP d'installation autonome Windows

**Auteur :** Winston (BMAD Architect) · **Date :** 10 novembre 2026 · **Périmètre :** Epic [SMN-424](https://lmn24.atlassian.net/browse/SMN-424), [SMN-431](https://lmn24.atlassian.net/browse/SMN-431) · **Statut :** référence d'architecture proposée, conformité du dernier paquet à qualifier en CI.

## 1. Objectif et source de vérité

Livrer **un seul ZIP initial** de SMN installable et utilisable sur Windows 11 x64, **hors ligne**, sans droits administrateur, sans Node.js, PostgreSQL, npm, pnpm, IDE ou service préinstallé. Le poste doit pouvoir démarrer SMN au moyen de `Demarrer SMN.bat`, puis initialiser PostgreSQL 18 dédié et le compte administrateur. Les restrictions de sécurité d'entreprise restent des risques à tester sur le poste cible, pas des prérequis à supprimer.

Cette spécification régit le **ZIP d'installation initiale** et non les ZIP de **mise à jour applicative**. Son contrôle exécutable est partagé entre `scripts/windows/package-portable.mjs`, `distribution-package-policy.mjs`, `verify-package.mjs` et le workflow `.github/workflows/portable-package.yml`. En cas de divergence entre code et présent contrat, l'écart doit être corrigé ou explicitement arbitré avant livraison.

## 2. Arborescence contractuelle

```text
SMN-Windows/
├─ Demarrer SMN.bat
├─ app/
│  ├─ server.js
│  ├─ distribution-version.json
│  ├─ .next/                    # ressources Next.js standalone et static
│  ├─ node_modules/            # modules d'exécution nécessaires au standalone
│  ├─ public/                  # ressources utilisateur nécessaires
│  ├─ prisma/
│  │  ├─ baseline/v32/schema.sql
│  │  ├─ baseline/v33/schema.sql
│  │  └─ migrations/           # uniquement les migrations SQL requises par le code livré
│  ├─ maintenance/             # scripts d'import, validation, application et rollback des mises à jour
│  └─ recover-admin.mjs
├─ runtime/
│  ├─ launcher.mjs
│  ├─ node/node.exe            # Node.js 24 x64 portable
│  ├─ postgres/postgres.zip    # PostgreSQL 18 Windows x64, archive officielle renommée
│  ├─ maintenance/             # dépendances du lanceur hors app/
│  └─ trust/
│     └─ update-signing-public.pem  # obligatoire pour annoncer les mises à jour signées
├─ data/
│  └─ office/
│     ├─ templates/
│     └─ reports/
└─ updates/
```

Seuls les cinq éléments de racine `Demarrer SMN.bat`, `app/`, `runtime/`, `data/` et `updates/` sont autorisés. Le répertoire `trust/` peut être absent si la clé publique de production n'a pas été configurée, **mais dans ce cas les mises à jour signées ne doivent pas être annoncées comme utilisables**. Les répertoires vides peuvent ne pas être représentés explicitement par tous les outils ZIP ; leur création doit être garantie au premier lancement.

### 2.1 Contrat du runtime PostgreSQL

- Nom **strictement court** de l'archive distribuée : `runtime/postgres/postgres.zip`. Ne jamais embarquer `postgresql-18.6-5-windows-x64-binaries.zip` sous ce nom dans un nouveau ZIP.
- Provenance vérifiée : archive EnterpriseDB PostgreSQL **18.6-5 Windows x64** (URL de téléchargement officielle conservée par le packaging). Le renommage ne modifie **aucun octet**. Empreinte SHA-256 de référence dans `scripts/windows/postgres-archive.mjs` et `src/server/bootstrap/archive.ts`.
- Le contrôle d'empreinte doit être effectué **en flux**, sans chargement intégral du ZIP d'environ 385 Mo en mémoire.
- Extraction automatisée dans un chemin de travail court ; privilégier `tar.exe` avec secours `powershell.exe`/`Expand-Archive`. Le nom de l'archive reste court dans tous les chemins utilisés. Les chemins de travail et d'installation doivent être vérifiés pour limiter les risques `MAX_PATH`; ne pas supposer que renommer le ZIP suffit à neutraliser la profondeur de ses entrées.
- Résultat obligatoire : `data/postgres/pgsql/bin/initdb.exe`, `pg_ctl.exe` et `postgres.exe` exploitables, ainsi que les bibliothèques nécessaires. Aucun `initdb` ne doit être invoqué tant que le runtime n'a pas été contrôlé.
- Création au premier démarrage, et uniquement après accord d'initialisation : cluster `data/postgres/data/`, base `smn`, schéma de référence v33 et compte administrateur. Aucun service Windows ni port système privilégié ; accès local loopback.
- Un extrait de ZIP insuffisant, un arrêt ou un échec d'initialisation ne doit pas écraser un cluster, un manifeste ou des secrets existants. Préserver les tentatives interrompues pour diagnostic et exiger l'accord de récupération quand des données de cluster sont déjà présentes.
- Compatibilité descendante : un package historique contenant le nom source long peut être **lu et validé**, puis copié sous le nom court avant extraction ; cette tolérance n'autorise pas l'ancien nom dans les nouvelles distributions.

## 3. Données, secrets et mises à jour

- `app/` est **remplaçable** par une mise à jour validée ; `runtime/`, `data/`, `updates/` et `Demarrer SMN.bat` sont **protégés** contre les mises à jour applicatives ordinaires.
- `data/postgres/` stocke les exécutables installés et le cluster des **nouvelles installations**. Les installations héritées utilisant `%LOCALAPPDATA%/ScrumMasterNotebook` doivent rester reconnues sans déplacement implicite.
- **Écart volontaire de portabilité totale :** les manifestes de connexion et la clé de chiffrement sont encore placés dans `%LOCALAPPDATA%/ScrumMasterNotebook`. Ne jamais prétendre que la distribution est entièrement relocalisable/copier-coller avec ses données et secrets. Toute migration future de ces éléments nécessite une décision et des tests de sécurité dédiés.
- Les ZIP de mise à jour ne contiennent pas les secrets, la base, le runtime, ni de migration DDL automatique : la compatibilité PostgreSQL 18/schéma v33 est contrôlée, conformément à SMN-429.
- La clé privée de signature **n'entre jamais** dans le ZIP. La clé publique stable doit être présente dans le paquet initial avant de promettre des mises à jour signées de production.

## 4. Contenu interdit

À la racine ou dans `app/` : `.git/`, `.github/`, `.agents/`, `_bmad/`, `_bmad-output/`, `src/`, `tests/`, `docs/`, scripts de développement, `pnpm-lock.yaml`, `node_modules` de build inutile et fichiers de configuration source non requis. Sous tout chemin : secrets `.env`, `.env.local`, `.settings-key`, `runtime.json`, `postgres-connection.json`, mots de passe, journal personnel `postgres.log`, cluster préinitialisé, sauvegarde ou archive utilisateur. Aucun lien symbolique, fichier spécial ni chemin dangereux.

## 5. Fabrication et traçabilité

1. Runner **Windows x64** GitHub Actions, version Node 24, récupération de l'archive PostgreSQL depuis la source contrôlée ; compilation Next standalone, copie explicite des schémas SQL et scripts indispensables.
2. Contrôle des cinq éléments racine, audit récursif de fichiers, absence de liens symboliques, vérification SHA-256 de `postgres.zip`, absence de données utilisateur et de sources de développement.
3. Exécuter les tests de contrat et l'installation Express complète en environnement Windows jetable **avec PostgreSQL réellement initialisé**, reprise partielle, port local indisponible, ouverture via `Demarrer SMN.bat` et vérification du compte administrateur.
4. Générer `SMN-Setup-Windows-x64-v33.zip`, son `.sha256`, son fichier `.evidence.json` et l'inventaire `smn-distribution-inventory.json`. L'archive enveloppe GitHub Actions n'est **pas** le ZIP d'installation.
5. Associer explicitement la preuve à un **SHA de commit**, un **run GitHub**, la version du paquet et l'empreinte du ZIP. Une preuve historique ne qualifie jamais un nouveau commit.
6. Après transfert sur le serveur de distribution ou le PC cible, revérifier l'empreinte SHA-256. L'absence de droits administrateur, de téléchargement réseau et d'IDE doit être testée sur le PC d'entreprise.

### 5.1 Barrière antivirus de distribution

Le workflow Windows exécute `scripts/windows/scan-distribution.ps1` en deux étapes : (1) analyse récursive du dossier `_package/SMN-Windows` une fois la recette isolée terminée et les données de test supprimées ; (2) décompression contrôlée du ZIP final `SMN-Setup-Windows-x64-v33.zip`, puis analyse des fichiers livrés **et** des binaires extraits de l'archive imbriquée `postgres.zip`, avant la publication. Ces scans utilisent Microsoft Defender (commande `MpCmdRun.exe`) et doivent échouer si le moteur, sa protection ou ses signatures ne sont pas opérationnels, si le scan échoue, s'il est **ignoré** (« was skipped »), si le moteur ne formule pas de verdict négatif explicite ou si une détection est signalée. Le rapport `smn-antivirus-report.json` consigne les deux étapes, l'horodatage UTC, le commit, le run et les versions de signatures ; il est inclus dans l'artefact en cas de réussite.

**Limites :** un antivirus opérationnel sur un runner GitHub hébergé n'est pas garanti avant preuve du run ; l'échec bloque volontairement le ZIP plutôt que de prétendre à un résultat sain. Une analyse sans détection n'établit pas l'absence absolue de malware et ne garantit pas que Google Chrome acceptera le téléchargement. Les rapports ne contiennent pas de secrets ni de chemins de poste utilisateur.

## 6. Critères d'acceptation testables

- **AC-01 — Racine minimale.** Étant donné un build Windows initial, quand le ZIP est ouvert, alors seuls `Demarrer SMN.bat`, `app`, `runtime`, `data`, `updates` apparaissent au premier niveau.
- **AC-02 — Archive courte.** Étant donné le package, quand `runtime/postgres` est inspecté, alors `postgres.zip` existe, son SHA-256 correspond à l'archive officielle, et le nom long est absent.
- **AC-03 — Sans réseau.** Étant donné un Windows 11 x64 sans droits admin ni accès GitHub, quand l'utilisateur lance l'assistant, alors PostgreSQL et Node embarqués suffisent à créer la base et le compte admin sans téléchargement.
- **AC-04 — Extraction et chemins.** Étant donné un chemin Windows réaliste, y compris un profil utilisateur long, quand les binaires sont extraits, alors le runtime est validé avant `initdb`, sans manipulation manuelle de ZIP ; sinon le diagnostic est explicite, non destructif.
- **AC-05 — Récupération sûre.** Étant donné un essai interrompu ou des données préexistantes, quand l'initialisation est relancée, alors les fichiers existants sont préservés et aucune suppression/reprise destructive n'est effectuée sans confirmation.
- **AC-06 — Pas de secrets.** Étant donné un ZIP produit en CI, quand son contenu est audité, alors aucun secret, donnée personnelle, cluster initialisé, fichier de développement interdit ou lien symbolique n'est distribué.
- **AC-07 — Mise à jour isolée.** Étant donné une installation peuplée, quand un ZIP de mise à jour applicative est préparé, alors aucun chemin `runtime/`, `data/`, `updates/` ou secret privé ne peut être remplacé.
- **AC-09 — Antivirus de distribution.** Étant donné un paquet initial assemblé, quand la CI analyse le dossier de distribution puis les fichiers issus du ZIP final (y compris PostgreSQL décompressé), alors les analyses Microsoft Defender réussissent sans omission, aucun résultat de menace n'est enregistré et le rapport lié au run est joint à la livraison ; si Defender n'est pas utilisable, aucune archive n'est publiée.
- **AC-08 — Preuves.** Étant donné une nouvelle livraison, quand elle est annoncée prête, alors le dernier run Windows est vert, le ZIP final et son empreinte sont disponibles, et le contrôle d'installation du paquet réel est passé.

## 7. Décisions ouvertes / non-conformités à suivre

- **DOC-01 :** le document historique SMN-431 mentionne encore le ZIP PostgreSQL sous son nom long ; il doit renvoyer à la présente spécification et être corrigé sans effacer ses anciennes preuves.
- **SEC-01 :** la disponibilité d'une clé publique stable pour la signature des mises à jour de production n'est pas démontrée dans les anciens runs.
- **REC-01 :** le comportement de `MAX_PATH` sur un PC d'entreprise et une profondeur de chemin réelle n'est pas validé par les anciens runs Windows CI.
- **PORT-01 :** les secrets et manifestes ne sont pas encore relocalisables avec le seul dossier SMN.
- **QUAL-01 :** nouvelle recette au dernier commit exigée, notamment après changement du nom du ZIP ; **aucune réussite n'est présumée**.

## Références

- [SMN-431 — Distribution Windows minimale](../../implementation-artifacts/SMN-431-DISTRIBUTION-MINIMALE.md)
- [ADR SMN-425 — Protection des données](./ADR-SMN-DISTRIBUTION-DONNEES-2026-11-10.md)
- [Guide Windows](../../../docs/DISTRIBUTION-WINDOWS.md)
- [Workflow de packaging](../../../.github/workflows/portable-package.yml)
- [Code du packaging](../../../scripts/windows/package-portable.mjs)
