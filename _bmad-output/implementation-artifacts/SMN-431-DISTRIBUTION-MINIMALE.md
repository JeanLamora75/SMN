# SMN-431 — Distribution Windows minimale

**Agent : Amelia** · **Référence :** [SMN-431](https://lmn24.atlassian.net/browse/SMN-431) · **Epic :** SMN-424 · **Date :** 10 novembre 2026

## Pourquoi une nouvelle archive ?

Une archive Windows précédemment transmise comprenait à la racine des éléments de développement (`.git`, `.github`, `.agents`, `_bmad`, `_bmad-output`, `src`, `tests`, fichiers pnpm, etc.). Ce n'est pas une distribution destinée à un utilisateur final. **Ne pas réutiliser cette archive.**

Le nouveau `package-portable.mjs` construit une distribution différente : une application Next.js autonome compilée, les dépendances runtime sélectionnées par Next, Node.js et l'archive binaire vérifiée de PostgreSQL 18, plus les scripts de maintenance indispensables.

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
    postgres/postgresql-18.6-5-windows-x64-binaries.zip
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
