# Architecture BMAD — SMN-426 — Paquets Windows de mise à jour hors ligne

**Agent :** Amelia (développement), décisions Winston reprises de l'Epic SMN-424.
**Date :** 2026-11-10. **Statut :** implémentation sur `main`, recette GitHub Actions vérifiée sur des correctifs synthétiques ; publication avec clé de production à configurer.

## Exigences et arbitrages

- Un ZIP de mise à jour ne doit **jamais** contenir `data/`, `runtime/`, `updates/`, un cluster PostgreSQL ni aucun secret.
- Les paquets **full** remplacent l'application entière, sans les runtimes ; les paquets **delta** contiennent uniquement les ajouts/remplacements/suppressions et attendent une version source précise.
- Un manifeste JSON canonique porte versions source/cible, commit, plateforme, capacités attendues et inventaire (taille, SHA-256, état précédent, suppression).
- Les deltas sont liés à une empreinte SHA-256 de l'inventaire **complet** de l'application précédente. Un écart sur un fichier, même inchangé par la mise à jour, provoque le refus.
- L'authenticité est assurée par une signature **Ed25519 détachée du manifeste**, vérifiée avec une clé publique installée **hors du ZIP d'update**. L'intégrité de chaque payload découle des empreintes du manifeste signé. La seule somme SHA-256 du ZIP ne suffit pas à authentifier l'auteur.
- La clé privée est créée localement, conservée hors Git et transmise uniquement au secret GitHub Actions `SMN_UPDATE_SIGNING_KEY_PEM_B64`. La distribution initiale publie seulement la clé publique dans `runtime/trust/update-signing-public.pem` si ce secret est présent.
- Une installation initiale sans cette ancre ne peut pas accepter une mise à jour signée de manière sûre : **échec fermé**, aucun provisionnement silencieux via un ZIP non authentifié.
- Moins de 25 Mo est un objectif mesuré pour les petits correctifs, pas une contrainte imposée aux changements majeurs.

## Implémentation

| Pièce | Responsabilité |
|---|---|
| `scripts/windows/update-contract.mjs` | Validation des chemins, manifeste, signature et inventaire complet, contrôle de version source |
| `scripts/windows/build-update.mjs` | Construction du staging, delta/full, SHA-256, signature Ed25519 |
| `scripts/windows/verify-update.mjs` | Contrôle hors ligne en lecture seule d'un staging extrait avec clé publique externe |
| `scripts/windows/create-update-signing-key.mjs` | Génération locale d'une paire de clés privée/publique sans outil supplémentaire |
| `scripts/windows/smoke-update-build.mjs` | Essai Windows sur build réel avec **clé éphémère de CI jamais publiée** |
| `scripts/windows/package-portable.mjs` | Version installée `distribution-version.json`, ancre de confiance (si configurée), omission de l'archive PG en mode update build |
| `.github/workflows/update-package.yml` | Tests Windows sur push, version Windows signée sur demande après vérification de secret |
| `tests/update-package.test.mjs` | Signature, altération, version source, empreintes et secrets |
| `docs/MISES-A-JOUR-WINDOWS.md` | Mode opératoire de distribution et provisions |

## Dépendances et séparation d'Epics

- **SMN-425 :** séparation `app/`, `runtime/`, `data/` et `updates/` ; pas d'effacement automatique.
- **SMN-427 :** l'importateur local devra valider l'archive ZIP **avant extraction**, sans chemins relatifs hostiles, lien symbolique ni fichier externe, puis valider le manifeste et appliquer la mise à jour. Les scripts SMN-426 vérifient des fichiers déjà extraits mais **ne les activent jamais** sur le poste final.
- **SMN-428 :** sauvegarde et restauration contrôlée.
- **SMN-429 :** migration explicite de schéma et matrice de compatibilité. Le contrat initial impose temporairement schéma 33.
- **SMN-430 :** recette sur PC Windows 11 d'entreprise, absence de droits administrateur et données historiques.

## Qualification

La CI `update-package.yml` exécute d'une part les tests de manifestes/signatures/attaques (Windows), et d'autre part la fabrication et la vérification d'un ZIP **de démonstration** à partir d'un véritable build standalone de SMN. Aucun secret n'est placé dans ce ZIP d'essai. La taille exacte de chaque ZIP réel doit être collectée dans les journaux du workflow.

La publication de **vrais** ZIP signés via `workflow_dispatch` exige le secret stable `SMN_UPDATE_SIGNING_KEY_PEM_B64`. En l'absence de ce secret ou d'un déclenchement manuel, aucune version de production ne peut être réputée publiée. L'agent ne doit pas déclarer « validée sur poste de recette » sur la seule base de tests GitHub Actions.

## Limites et garde-fous

- Le script `uv` officiel du skill `bmad-build` n'est pas exécutable ici ; aucun workflow BMAD de rendu n'est prétendu exécuté. Développement direct sous contrôle des critères Jira, contrôle GitHub Actions.
- Aucune installation de mise à jour, migration PostgreSQL ni suppression de fichiers utilisateur exécutée dans le cadre de SMN-426.
- Les clés privées ne doivent jamais être commitées, envoyées par messagerie, imprimées dans un log CI ni ajoutées à un artefact.
- Toute rotation de clé constitue une migration de confiance explicitement approuvée et testée.
