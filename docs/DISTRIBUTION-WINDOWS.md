# Distribution SMN Windows x64 — paquet autonome de recette

## Objet

La distribution `SMN-Setup-Windows-x64-v33.zip` permet d'installer Scrum Master Notebook depuis un support de transfert (courriel via lien OneDrive/SharePoint, clé USB ou partage autorisé) **sans accès GitHub sur le PC cible**, sans IDE, Node ou PostgreSQL préinstallés et sans élévation Windows, sous réserve de la politique de sécurité du poste.

**Source :** `.github/workflows/portable-package.yml`. La fabrication nécessite un runner Windows GitHub Actions disponible ; une modification du code seule n'est pas une preuve que l'archive a été générée.

Le paquet contient le build Next.js standalone, Node.js embarqué, PostgreSQL 18 portable (archive EnterpriseDB dont le SHA-256 est vérifié au packaging), les schémas/migrations requis et les ressources applicatives. Aucun cluster PostgreSQL personnel ou mot de passe ne doit être embarqué.\n\nDisposition des nouveaux paquets : `SMN-Windows/app/` (serveur et modules), `SMN-Windows/runtime/node/node.exe` (Node.js), `SMN-Windows/runtime/postgres/` (archive PostgreSQL), `SMN-Windows/data/` (données persistantes créées au premier lancement). Le dossier `data/` et les informations privées sous `%LOCALAPPDATA%\\ScrumMasterNotebook` **ne doivent jamais être remplacés lors d’une mise à jour**. Les anciennes distributions à plat demeurent compatibles tant qu’elles ne font pas l’objet d’un remplacement destructif.

## Fabrication, récupération et transfert

1. Après publication sur `main`, vérifier l'exécution réussie du workflow **SMN — Paquet Windows pilote** (ou le déclencher manuellement via `workflow_dispatch` si autorisé).
2. Dans l'exécution réussie, récupérer l'artifact `SMN-Distribution-Windows-x64-v33`. GitHub peut le fournir dans une archive de transport supplémentaire : extraire cette enveloppe pour obtenir les **deux fichiers** :
   - `SMN-Setup-Windows-x64-v33.zip`
   - `SMN-Setup-Windows-x64-v33.zip.sha256`
3. Vérifier la somme SHA-256 avant transfert, puis conserver les deux fichiers ensemble. Exemple PowerShell :
   `(Get-FileHash -Algorithm SHA256 -LiteralPath ".\SMN-Setup-Windows-x64-v33.zip").Hash.ToLowerInvariant()`
   Comparer à la valeur de la ligne `.sha256` ; ne pas transférer une archive dont l'empreinte diffère.
4. Transférer par **lien de fichier d'entreprise** (OneDrive, SharePoint ou espace autorisé) plutôt que joindre le ZIP à un courriel classique. Vérifier les règles de transfert des exécutables propres à l'entreprise.

## Installation sur un PC Windows 11 neuf

1. Télécharger et extraire entièrement `SMN-Setup-Windows-x64-v33.zip` dans un dossier personnel non synchronisé et accessible en écriture ; ouvrir `SMN-Windows`.
2. Vérifier que l'archive ne contient aucune donnée personnelle ni fichier `.settings-key`, `runtime.json`, `postgres-connection.json` ou cluster `data/postgres` préinitialisé.
3. Double-cliquer `Demarrer SMN.cmd`, puis suivre l'assistant dans le navigateur (port local 3003).
4. L'option **PostgreSQL dédié à SMN** est sélectionnée par défaut. Une nouvelle installation conserve ses données dans `SMN-Windows/data/postgres`. Le profil Windows garde les informations de connexion et la clé privées sous `%LOCALAPPDATA%\ScrumMasterNotebook`.
5. Vérifier installation, authentification, redémarrage de SMN, persistance après redémarrage, sauvegarde et restauration dans un environnement de test isolé. Ne pas supprimer `SMN-Windows/data/postgres` après installation.

## Contrôles et limites

- Le smoke test `scripts/windows/verify-package.mjs` valide le démarrage autonome, l'installation Express en base isolée si `SMN_FULL_INSTALL_TEST=true`, la récupération d'installation partielle et le changement de port, puis **retire le cluster de test du paquet avant son archivage**.
- La recette sur le PC cible doit rester **distincte** du résultat du workflow. Les antivirus, exécutables bloqués, ports réservés ou restrictions de répertoire peuvent empêcher l'installation.
- Toute mise à jour ou remplacement du dossier SMN doit **préserver le cluster PostgreSQL** et les secrets du profil Windows. Ne pas remplacer l'intégralité de `SMN-Windows` sans sauvegarde et procédure de mise à niveau testée.
- Un nouveau numéro de version distribué exige un nouveau fichier et son empreinte, non une réutilisation ambiguë d'une ancienne archive.

## Diagnostic d'un échec vers 25 % sur un poste Windows restreint

À 25 %, SMN prépare les composants PostgreSQL : il ne crée pas encore les tables ni le compte administrateur. Le ZIP `runtime/postgres/postgresql-18.6-5-windows-x64-binaries.zip` est vérifié par SHA-256 **en lecture progressive** pour limiter la mémoire du serveur Next.js. L'extraction est tentée avec `tar.exe`, puis avec `powershell.exe` et `Expand-Archive` si `tar` échoue. Aucun téléchargement réseau n'est requis tant que l'archive valide est embarquée.

Les binaires décompressés doivent apparaître sous `SMN-Windows/data/postgres/pgsql/bin/` ; le cluster sous `SMN-Windows/data/postgres/data/`. Les fichiers de connexion/chiffrement restent dans le profil Windows pour préserver le comportement existant. Lors d'une extraction précédente interrompue, un répertoire de binaires incomplet est préservé dans `data/postgres/recovery/pgsql-partial-*` avant une nouvelle tentative ; les données de base ne sont jamais effacées pour corriger l'extraction.

Si l'interface indique `postgres-extract-failed`, vérifier les restrictions d'exécution de `tar.exe` et de PowerShell ainsi que l'espace disque ; ce code est transmis sans divulguer les chemins privés. Une erreur restée à 25 % n'est **pas** une preuve d'une migration SQL défaillante.

Le test de contrats `node --test tests/postgres-offline-install.test.mjs` s'exécute dans la CI de packaging. Le test complet `scripts/windows/verify-package.mjs` sur runner Windows contrôle aussi une installation complète dans un cluster isolé, mais une recette sur le PC d'entreprise reste obligatoire.
