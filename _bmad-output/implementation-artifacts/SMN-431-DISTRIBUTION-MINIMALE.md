# SMN-431 — Distribution Windows minimale

**Agent : Amelia** · **Référence :** [SMN-431](https://lmn24.atlassian.net/browse/SMN-431) · **Epic :** SMN-424 · **Date :** 10 novembre 2026

## Pourquoi une nouvelle archive ?

Une archive Windows précédemment transmise comprenait à la racine des éléments de développement (`.git`, `.github`, `.agents`, `_bmad`, `_bmad-output`, `src`, `tests`, fichiers pnpm, etc.). Ce n'est pas une distribution destinée à un utilisateur final. **Ne pas réutiliser cette archive.**

Le nouveau `package-portable.mjs` construit une distribution différente : une application Next.js autonome compilée, les dépendances runtime sélectionnées par Next, Node.js et l'archive binaire vérifiée de PostgreSQL 18, plus les scripts de maintenance indispensables.

## Référence normative

Le contrat complet et évolutif de composition, d'exclusions, de protection des données et de recette du ZIP se trouve dans [SPEC-DISTRIBUTION-WINDOWS-SMN.md](../planning-artifacts/architecture/SPEC-DISTRIBUTION-WINDOWS-SMN.md). L'archive PostgreSQL de toute **nouvelle** distribution est `postgres.zip` (nom officiel source conservé uniquement pour le téléchargement). Les preuves historiques ci-dessous concernent des builds antérieurs à ce changement et ne qualifient pas le dernier code.

## Structure cible

```text
SMN-Windows/
  Demarrer SMN.bat
  app/
    server.js
    distribution-version.json
    .next/
    node_modules/
    public/
    prisma/baseline/...
    prisma/migrations/...
    maintenance/
    recover-admin.mjs
  runtime/
    launcher.mjs
    node/node.exe
    postgres/postgres.zip
    trust/update-signing-public.pem [si signature configurée]
  data/
    office/templates/
    office/reports/
  updates/
```

Les dossiers `data` et `updates` sont persistants. Les scripts SQL nécessaires à l'exécution sont sous `app/prisma` ; le fichier `SMN-338-DDL-ADDITIF-DRAFT.sql` a été copié dans `prisma/migrations/20261101_smn338_indicator_v33/migration.sql` avec chemin d'exécution canonique : pas de documents BMAD dans le ZIP.

## Lancement

Double-cliquer sur `Demarrer SMN.bat`. Ce point d'entrée lance le Node.js embarqué puis `runtime/launcher.mjs`. Le lanceur récupère un échange applicatif interrompu, prépare les répertoires Office, démarre le serveur Next.js, attend sa disponibilité puis ouvre `http://127.0.0.1:3003`. SMN gère son PostgreSQL privé par son propre mécanisme `existingManagedUri` : si la base existe, le backend démarre `pg_ctl` sans service Windows lors du diagnostic ; au premier lancement, l'assistant d'installation demande la confirmation avant de créer le cluster.

Une seconde invocation ouvre le navigateur sans lancer un second serveur. Garder la fenêtre principale ouverte pendant l'utilisation. Pour récupérer le compte admin depuis un terminal interactif :

```bat
"Demarrer SMN.bat" --recover-admin
```

Aucun `npm`, `pnpm`, `uv`, IDE, installation Node ou accès GitHub n'est requis sur le PC cible.

## Compatibilité et limites

- Le moteur de mise à jour signée peut remplacer le seul sous-arbre `app/` en mode delta ou full, sans toucher `runtime/`, `data/`, `updates/` ni `Demarrer SMN.bat`.
- Le journal de retour arrière enregistre désormais une liste de composants adaptée à la version du layout ; les anciens tests du layout précédent restent pris en charge par le code de développement.
- **Transition depuis l'ancien ZIP** : la conversion en place de l'ancienne arborescence de distribution vers celle-ci n'est pas présumée compatible. Elle exige une procédure de migration dédiée et des tests spécifiques. Ne pas supprimer les anciens fichiers ou données sans sauvegarde.
- Comme auparavant, le paquet de mise à jour ne migre pas le schéma PostgreSQL (SMN-429).
- La signature Ed25519 des mises à jour nécessite une clé de confiance préinstallée, publiée lors de la création de la distribution. Un artefact CI de démonstration avec clé éphémère n'est pas une mise à jour de production.

## Validation et preuves

Le workflow `portable-package.yml` exécute les tests de racine minimale et `verify-package.mjs`, qui vérifie le paquet autonome et son installation Express sous Windows, puis émet ZIP + SHA-256 + taille exacte + `smn-distribution-inventory.json`. Le workflow `update-package.yml` exécute les contrats du nouveau layout, la signature et la récupération.

**La Story ne doit pas être déclarée terminée sans succès du dernier run Windows et vérification de l'inventaire et des tests de mise à jour correspondants.** L'essai sur un vrai poste Windows 11 soumis aux stratégies de l'entreprise constitue une recette distincte.

## Preuves obtenues sur GitHub Actions

- **Installation et archive** : [run 42797242944](https://github.com/JeanLamora75/SMN/actions/runs/42797242944), `portable-windows` **success**. La distribution respecte la racine minimale, contrôle 5 218 fichiers, exécute l'installation Express sur Windows isolé, la reprise d'une installation partielle et le contournement d'un port PostgreSQL bloqué. ZIP final `SMN-Setup-Windows-x64-v33.zip` : **439 027 651 octets**, SHA-256 **`8aeae286e9f633ad823c860edc8d54371158580719324e98bdc447787209766b`**. Artefact GitHub Actions `SMN-Distribution-Windows-x64-v33` (ID 13755480617), rétention 14 jours. Le ZIP d'artefacts GitHub (contenant le ZIP de distribution et ses preuves) a une taille différente et ne doit pas être confondu avec l'archive elle-même.
- **Mises à jour** : [run 42797242877](https://github.com/JeanLamora75/SMN/actions/runs/42797242877), `update-contract-tests` **success**, **39/39 tests** ; `update-build-smoke` **success** : ZIP signé différentiel de démonstration **3 997 octets** et ZIP signé application complète sans runtime **23 195 140 octets**, vérifiés après compression. La signature utilise une clé Ed25519 éphémère réservée au CI.
- **Limite de confiance des mises à jour réelles** : le run d'installation a montré `SMN_UPDATE_SIGNING_KEY_PEM_B64` absent. Il a pu livrer un paquet initial, mais **ne produit donc pas de clé publique de confiance dans `runtime/trust`**. Les mises à jour signées de production demeurent impossibles sur un tel paquet tant qu'une clé de publication stable n'est pas provisionnée en secret GitHub Actions, et qu'une nouvelle archive initiale incorporant la clé publique n'est pas produite. Aucune clé privée ne doit être publiée dans le dépôt.
- **Extension de recette après ces preuves** : `verify-package.mjs` lance désormais le vrai `Demarrer SMN.bat` et vérifie le heartbeat du lanceur ; cette extension exige un nouveau run `portable-windows` vert pour être considérée validée.

**Interprétation :** les tests antérieurs ne valent pas preuve du dernier commit lorsque de nouveaux contrôles ont été ajoutés. La recette du poste d'entreprise cible reste distincte de la CI.

## Qualification du lanceur unique — dernier run

La preuve d'acceptation la plus récente est [42798122759](https://github.com/JeanLamora75/SMN/actions/runs/42798122759), job `portable-windows` **SUCCESS**, commit testé `eba464d3f25d5240a4b2a69918ea7c8cd87710f1`.

- Démarrage via `Demarrer SMN.bat` par `cmd.exe`, avec Node embarqué ; navigateur volontairement simulé en CI ; heartbeat `updates/launcher.json` vérifié.
- Initialisation PostgreSQL 18 dans un dossier isolé, récupération d'un essai interrompu, fallback de port et installation Express complète : **PASS**.
- Racine minimale contrôlée, **5 218 fichiers** inventoried.
- Nouvelle archive `SMN-Setup-Windows-x64-v33.zip` : **439 028 010 octets**, SHA-256 **`d87a70164a5314742e36ab461158809efe91026f19f1ae72e5c2f70fa2dc1775`**.
- Artefact Actions `SMN-Distribution-Windows-x64-v33`, ID `13755207551` ; le ZIP enveloppe GitHub contient aussi fichiers de preuves et inventaire, et pèse **439 387 993 octets**.
- Le smoke de mises à jour [42797242877](https://github.com/JeanLamora75/SMN/actions/runs/42797242877) est vert (39/39 contrats, delta 3 997 octets, application full 23 195 140 octets). Il ne constitue pas un artefact de production signé avec clé durable.

**Décision** : livraison structurelle et launcher **validés sur Windows CI**. Recette entreprise et configuration de clé Ed25519 stable **non attestées**. L'ancienne archive non minimale ne doit pas être réutilisée pour un nouvel équipement.
