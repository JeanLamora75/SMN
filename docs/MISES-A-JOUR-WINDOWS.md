# SMN-426 — Construction des mises à jour Windows hors ligne signées

**Epic** [SMN-424](https://lmn24.atlassian.net/browse/SMN-424) — **Story** [SMN-426](https://lmn24.atlassian.net/browse/SMN-426).
**Cible** : Windows 11 x64, sans GitHub et sans accès réseau depuis le poste qui importe la mise à jour.

## Livrables / périmètre

`SMN-Update-33.0.<identifiant-run-GitHub>.zip` est un **paquet de données applicatives, pas un installateur autonome**. Il comprend exclusivement `manifest.json`, `manifest.sig` (signature Ed25519 détachée), et `payload/` avec les fichiers d'application. Aucune archive PostgreSQL, aucun exécutable Node.js et aucun répertoire `data/`, `runtime/`, `updates/` ou secret ne doivent entrer dans le paquet. L'activation d'un ZIP sur le PC relève de **SMN-427**, non de SMN-426.

Le manifeste explicite : produit, plateforme, version source, version cible, commit GitHub, versions Node/PostgreSQL/schéma requises, mode complet ou différentiel et inventaire SHA-256 des fichiers ajoutés/remplacés/supprimés. Chaque fichier remplacé par un delta indique l'empreinte attendue de sa version précédente. La vérification refuse les versions source incompatibles et les empreintes divergentes.

L'empreinte SHA-256 du ZIP et sa taille exacte sont publiées avec chaque version. **Moins de 25 Mo est une cible pour les petits correctifs**, jamais une garantie pour les versions complètes.

## Signature et chaîne de confiance

Une mise à jour de production est **obligatoirement signée avec une clé privée Ed25519 stable** tenue hors du dépôt et injectée dans GitHub Actions par le secret `SMN_UPDATE_SIGNING_KEY_PEM_B64`. Les paquets sans signature valide ne sont jamais publiés par le workflow de release.

La clé publique correspondante est embarquée uniquement dans le **paquet initial de confiance**, à `runtime/trust/update-signing-public.pem`, si la clé de signature a été configurée. L'importateur de mise à jour devra utiliser cette clé **depuis le répertoire installé**, jamais une clé fournie par le ZIP à vérifier. Une nouvelle installation sans cette clé est un prérequis bloquant à toute mise à jour signée ; ne jamais lui faire confiance en copiant aveuglément une clé depuis une archive non authentifiée.

Pour un delta, le workflow exige que la clé publique du paquet de base (ancienne installation) corresponde à celle du build courant. Une rotation de clé exige une transition explicite distincte et doublement vérifiée, pas un remplacement silencieux dans `runtime/trust/`.

## Provisionnement initial — une seule fois, côté développeur

Sur un PC de développement autorisé possédant Node.js :

1. Exécuter `node scripts/windows/create-update-signing-key.mjs`. Par défaut, les clés sont créées dans `%USERPROFILE%\\SMN-Update-Signing`, **hors du dépôt Git**. Le programme ne les imprime pas sur la console.
2. Ouvrir le fichier local `SMN_UPDATE_SIGNING_KEY_PEM_B64.txt`, puis copier sa valeur dans **GitHub → Settings → Secrets and variables → Actions → New repository secret**, nommé exactement `SMN_UPDATE_SIGNING_KEY_PEM_B64`.
3. Conserver `smn-update-private.pem` et le fichier base64 dans un stockage privé approuvé, jamais en pièce jointe mail, dans Git ni dans le ZIP. Restreindre les accès aux workflows et aux personnes autorisées.
4. Produire une **nouvelle distribution initiale Windows** via le workflow `portable-package.yml` : elle recevra l'ancre de confiance publique dans `runtime/trust/`. Une ancienne distribution sans cette clé ne peut pas appliquer des mises à jour signées.

**Attention** : si le secret manque, les tests utilisent une clé **éphémère exclusivement pour la CI**. Aucune mise à jour de production ne doit être générée ou diffusée en utilisant cette clé de test.

## Construction de production dans GitHub Actions

Ouvrir le workflow `SMN — Mises à jour Windows signées`, déclencher manuellement l'option :

- **full** : définir la version `from_version` de l'installation cible. Le ZIP contient tous les fichiers applicatifs nécessaires à leur remplacement, sans Node/PostgreSQL. Aucun delta de suppression n'est calculé ; SMN-427 devra réinstaller de façon atomique le répertoire `app/`.
- **delta** : renseigner `base_run_id` correspondant à une distribution Windows antérieure **avec marqueur de version et clé publique**. Le workflow récupère cette distribution sur GitHub, compare ses empreintes aux fichiers du build courant, et ne signe que les modifications et suppressions autorisées. Les fichiers inchangés ne sont pas recopiés.

Les deux modes exécutent la vérification de signature, d'intégrité et de périmètre **avant** compression puis **après** extraction de l'archive ZIP. La sortie est un artefact `SMN-Update-Windows-signed` contenant le ZIP et le fichier `.sha256`, téléchargeable par un opérateur ayant accès au dépôt, puis transférable hors ligne par le canal autorisé.

Les scripts n'utilisent ni `uv`, ni VS Code, ni installation système. Ils exploitent Node.js 24 et Windows PowerShell préinstallés sur le runner.

## Tests / preuves exigées

- `node --test tests/distribution-layout.test.mjs tests/update-package.test.mjs` : versions, signatures, empreintes, refus des données et secrets, rejets des fichiers altérés.
- `scripts/windows/smoke-update-build.mjs` : production d'un véritable petit correctif signé avec **une clé éphémère de test**, à partir de deux répertoires applicatifs isolés, comparaison et vérification hors ligne. La CI ne publie **pas** ce ZIP d'essai.
- `.github/workflows/update-package.yml` : tests et compilation Windows du générateur, plus construction explicite de release signée quand la clé de production est provisionnée.
- `.github/workflows/portable-package.yml` : version initiale autonome avec marqueur de version et clé publique si le secret est présent.

Ne jamais déclarer le système de mise à jour **opérationnel sur PC final** tant que SMN-427 (import/application), SMN-428 (récupération) et SMN-429 (migrations) ne sont pas qualifiées. La présence d'un ZIP signé ne réalise aucune opération sur le poste utilisateur.

## Limitations et politique de sécurité

Un ZIP est une entrée non fiable. Le futur importateur doit contrôler chaque chemin, interdire les liens symboliques, les chemins absolus et la traversée de répertoires, limiter taille et nombre d'entrées, tester l'espace disponible et vérifier l'authenticité avant toute écriture. Le manifeste ne contient ni instructions arbitraires ni scripts de migration exécutables au téléchargement. Le changement de version du schéma PostgreSQL ne peut se faire que par le moteur explicite validé dans SMN-429.

**Références :** `scripts/windows/update-contract.mjs`, `build-update.mjs`, `verify-update.mjs`, `create-update-signing-key.mjs`.

## Numérotation entre workflows

Les versions installées et les mises à jour utilisent `33.0.<GITHUB_RUN_ID>`, et **pas** `GITHUB_RUN_NUMBER` qui repart indépendamment pour chaque workflow. Cette règle évite un faux déclassement quand le ZIP de base vient du workflow d'installation complète et le correctif du workflow de mise à jour.
