# SMN-456 — Contrat de sauvegarde/restauration des photographies Tickets

Date : 13 novembre 2026 — livraison de code sur `main`, qualification à effectuer.

## Objectif

Une sauvegarde créée depuis SMN doit conserver, dans le transfert chiffré existant, les photographies Jira CSV et leurs métadonnées JSON ainsi que `jira-config.json`. Leur restauration suit le parcours utilisateur de SMN-442 (upload ZIP et restauration hors ligne par le lanceur SMN), jamais un outil de commande demandé à l'utilisateur. Aucune importation des tickets en PostgreSQL ni conversion d'indicateurs v33.

## Format de sauvegarde et confidentialité

- Nouveau **manifeste chiffré version 5** ; les archives version 4 restent acceptées (elles ne comportaient pas Tickets).
- Composant `tickets/00000.enc` chiffré/authentifié AES-GCM avec la clé existante. Son fichier clair logique `tickets-transfer-v1.json` regroupe les fichiers avec chemins relatifs, tailles, SHA-256 et contenu base64.
- Inventaire `ticketInventory` dans le manifeste : nombre de fichiers, nombre de photographies, octets et empreinte globale déterministe ; vérification avant restauration. Les données CSV/JSON ne sont jamais incluses en clair dans le ZIP.
- Seuls les fichiers `jira-config.json` et `<team>/<mode>/<cycle>/<YYYY-MM-DD>/current.json`, `versions/<UUID>/metadata.json` et `snapshot.csv` du répertoire privé `data/tickets` sont acceptés. Les chemins sont bornés et contrôlés ; traversal, liens symboliques, doublons, versions orphelines, empreintes incohérentes et CSV invalides sont bloqués.
- Cohérence de capture : contrôle avant chiffrement et avant publication ; si les Tickets changent pendant la sauvegarde, la publication est refusée.
- Un backup d'une installation avec zéro photographie contient un bundle Tickets valide mais vide.

## Restauration et bascule

- Le transfert portable `.zip` et son `.tar.gz` chiffré acceptent le nouveau composant, soumis aux mêmes contrôles d'archive et d'authenticité.
- Le contrôle de l'archive déchiffre et valide le bundle Tickets et compare son inventaire à celui du manifeste **sans modifier l'installation active**.
- La restauration isolée PG18 reconstruit d'abord les fichiers dans un répertoire temporaire et vérifie, après restauration de la base, que **chaque équipe/cycle référencé existe** dans la base candidate.
- L'empreinte signée du transfert source inclut les fichiers Tickets ; celle de la cible restaurée les inclut aussi.
- La bascule coordonnée traite le cinquième répertoire `data/tickets` avec les documents et archives Office/PDF : préparation, promotion et conservation des dossiers précédents pour retour arrière. Le marqueur de maintenance et les règles de SMN-442 restent obligatoires.
- Aucune restauration partielle ou mélange automatique n'est autorisé. Un remplacement complet contrôlé conserve l'ancienne cible en rollback, et ne fusionne pas les CSV par clé.

## Distribution et mises à jour

- `data/tickets` est **persistant et exclu de la liste des chemins modifiables par mise à jour** (contrat `distribution-layout.mjs`).
- Le paquet d'installation contient uniquement un dossier `data/tickets` **vide** ; l'audit de distribution refuse tout fichier privé à cet emplacement.
- La source de vérité des données demeure sur le PC, et non dans le ZIP applicatif GitHub.
- Les installations avec un répertoire Tickets personnalisé externe ne sont pas éligibles à la bascule hors ligne avant procédure d'architecture adaptée (rejet explicite).

## Qualification restante

- Test unitaire de capture/restauration : `pnpm exec tsx --test tests/smn-456-tickets-backup-transfer.test.ts`.
- `pnpm typecheck` et `pnpm lint`.
- CI Windows : workflow `.github/workflows/portable-package.yml`, étape SMN-456.
- Recette réelle avec une installation source et une destination : upload ZIP via l'interface, preuve complète, restauration PostgreSQL et fichiers, login, vérification des vues Fichiers, Consultation, Comparaison et des liens Jira.
- Corruption d'un octet, suppression de métadonnées, interruption pendant staging et cutover, retour arrière complet ; test du fonctionnement d'une mise à jour signée conservant les fichiers Tickets.
- **Ne pas clore SMN-456 tant que la CI et la recette réelle ne sont pas réussies**.

## Fichiers d'implémentation

`src/server/backup/tickets-transfer.ts`, `runner.ts`, `verification.ts`, `portable-package.ts`, `portable-import.ts`, `restore-sandbox.ts`, `restore-file-cutover-drill.ts`, `fresh-install-cutover.ts`, `current-managed-file-fingerprint.ts`, `scripts/windows/package-portable.mjs`, `scripts/windows/distribution-package-policy.mjs`.
