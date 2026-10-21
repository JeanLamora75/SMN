# SMN-30 — Sauvegarde manuelle complète de l'installation

**Story** : [SMN-30](https://lmn24.atlassian.net/browse/SMN-30), Epic 2, Story 2.2. Références : AD-25/26/27, SEC-03/06 et [ADR-I0-003](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-003-RECUPERATION-CLES.md).

## Livraison

L'Administrateur déclenche une sauvegarde depuis **Administration → Sauvegardes**, page `/app/admin/backups`, ou par `POST /api/admin/backups`. Une session Administrateur et une origine HTTP autorisée sont obligatoires, et les utilisateurs ne peuvent pas consulter l'état du service.

La sauvegarde rassemble :
- la **base PostgreSQL complète** (dump custom natif PostgreSQL 18, schémas, comptes et leurs empreintes de mot de passe, paramètres, audits et données métier présentes) ;
- le contenu réellement présent du stockage `SMN_PRIVATE_DOCUMENTS_DIR`, à ce stade les paires manifeste + PDF/TXT privés de SMN-26. Les fichiers sont contrôlés et copiés **chiffrés** ; aucun instantané, PDF ou pièce fictive n'est fabriqué.
- un **manifeste chiffré** qui décrit la version du schéma PostgreSQL, les composants, les empreintes SHA-256, les tailles, les noms originaux (non visibles en clair), les paramètres de chiffrement et l'heure UTC.

Tous les composants du paquet sont chiffrés en AES-256-GCM. Le dump PostgreSQL traverse un pipe de chiffrement, sans dump en clair dans un fichier temporaire. Le mot de passe de la base est transmis au sous-processus via son environnement et jamais comme argument ou journal applicatif.

## Clé et récupération — ADR-I0-003

La première sauvegarde demande une phrase de récupération d'au moins 20 caractères, **différente du mot de passe Administrateur**. La clé maître locale de 32 octets est conservée uniquement dans le dossier privé de SMN (`.backup-key`) et n'est **jamais placée en clair dans un paquet transportable**.

La phrase dérive une clé scrypt (N=32768, r=8, p=1, sel aléatoire de 16 octets), qui chiffre avec AES-256-GCM la copie de récupération de la clé maître. L'enveloppe récupérable est stockée dans `index.json` **de chaque paquet**, sans phrase ni clé brute. Les sauvegardes suivantes utilisent la clé locale et ne redemandent pas la phrase.

**À conserver impérativement :** la phrase de récupération dans un gestionnaire de mots de passe ou autre lieu sûr. La clé locale et la phrase sont indépendantes de la récupération du compte Administrateur. Si les deux sont perdues, la restauration des sauvegardes chiffrées peut devenir impossible.

La restauration sur un autre PC et la récupération effective de la clé ne sont **pas encore validées** : elles font l'objet des prochaines stories. Une sauvegarde créée ne constitue **pas** une restauration démontrée. Les permissions Windows et l'accès physique au dossier privé doivent être qualifiés.

## Paramètres et prérequis

- Windows : dossier privé par défaut `%LOCALAPPDATA%\ScrumMasterNotebook\backups`. Optionnel : `SMN_BACKUP_DIR`, chemin absolu vers un dossier privé **hors du projet**.
- PostgreSQL : `pg_dump` **version majeure 18**, disponible via le PATH, automatiquement dans les binaires PostgreSQL portables gérés par SMN, ou via `SMN_PG_DUMP_PATH` vers l'exécutable connu. En absence de cet outil ou en cas de version incompatible, l'opération échoue et ne crée aucun paquet validé.
- Pièces : `SMN_PRIVATE_DOCUMENTS_DIR` s'il est configuré. Un dossier de documents manquant, invalide ou chevauchant le répertoire de sauvegardes fait échouer la capture. Les entrées supplémentaires inconnues et les pièces orphelines font échouer la capture plutôt que de disparaître silencieusement.
- Il ne faut jamais placer le répertoire de sauvegardes dans `public/` ni dans le dépôt, le synchroniser vers un emplacement partagé sans protection, ni distribuer le dossier de profil entier contenant la clé maîtresse.

Les paquets portables sont les **dossiers complets** `backups/packages/<identifiant>` : `index.json` (enveloppe de récupération), `manifest.enc`, `database.pgcustom.enc` et le cas échéant `documents/*.enc`. Le dossier **`.backup-key` ne doit jamais être exporté**. Il n'existe aucune route de téléchargement anonyme.

## Protocole de cohérence et d'échec

1. L'API vérifie session, rôle et protection d'origine ; une seule sauvegarde active acquiert le verrou PostgreSQL `pg_try_advisory_lock(20261021,30)`.
2. Un inventaire des fichiers privés et de leurs empreintes est établi.
3. `pg_dump --format=custom` capture une image cohérente de la base ; le flux est chiffré, et sa signature `PGDMP` est contrôlée.
4. Les fichiers sont chiffrés individuellement après revérification de leur empreinte. Un **nouveau scan** est comparé à l'inventaire initial ; toute différence (ajout, suppression, modification, lien symbolique, fichier invalide) entraîne un échec.
5. Le manifeste chiffré et son index sont écrits. Le répertoire temporaire `.<id>.partial` est **renommé atomiquement** en paquet définitif uniquement si toutes les étapes précédentes réussissent.
6. Les échecs répondent avec `status:failed`, sont notés dans `last-attempt.json` (sans secret), et suppriment le paquet partiel ; aucune restauration n'est déclarée possible.

**Contrat pour les prochains modules d'archivage** : tout producteur qui modifie conjointement la base et des fichiers référencés doit utiliser le même verrou de coopération PostgreSQL et déposer son manifeste atomiquement ; l'inventaire avant/après seul ne peut garantir la cohérence si un écrivain externe non coopératif modifie simultanément DB et fichiers. Aucun module métier producteur de telles pièces n'existe encore dans I0.

## Traçabilité des critères d'acceptation

| AC | Réalisation |
|---|---|
| AC1 | `pg_dump` natif de l'ensemble de la base, chiffré, sans filtrage arbitraire des tables |
| AC2 | Inventaire strict des fichiers privés réellement présents, y compris manifestes |
| AC3 | Verrou d'opération, snapshot PG, contrôle de changement des fichiers, publication atomique |
| AC4 | Sauvegarde chiffrée ; clé récupérable chiffrée par phrase, aucun secret dans la commande ou dans l'archive en clair |
| AC5 | Réponse et trace d'échec, suppression du répertoire partiel, aucun marqueur de réussite incomplet |

## Tests et recette

Tests unitaires écrits : `tests/manual-backup.test.ts` (AES-GCM, scrypt, intégrité, fichiers orphelins, inventaire, dossier privé). Contrôles HTTP : `scripts/verify-http-ci.mjs` vérifie les accès refusés et le statut d'échec ; un vrai test de création du paquet est conditionné par la présence d'un `pg_dump` 18 opérationnel sur le runner.

Sur le PC Windows, après récupération de `main` :

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier : refus Utilisateur/anonyme ; première phrase (distincte du mot de passe admin) ; sauvegarde effective sur PG18.6 avec documents réels ; deuxième sauvegarde sans phrase ; empreintes des composants ; refus de pg_dump incompatible ; document modifié pendant capture ; paquet incomplet supprimé ; clés absentes ou corrompues refusées. Exécuter ultérieurement une **restauration isolée sur une autre machine** avant d'affirmer la récupérabilité.

**Aucun test Node, Windows, PostgreSQL ni restauration réelle n'est réputé réussi par la seule publication du code.** Les limites doivent rester visibles dans Jira.

## Intégration GitHub et état de qualification

[PR #25](https://github.com/JeanLamora75/SMN/pull/25) fusionnée sur `main` le 21/10/2026, commit `b189ebe75ba60d40c291bd56876bc77026bd2a70`. [CI Windows portable](https://github.com/JeanLamora75/SMN/actions/runs/39558095579) et [CI Linux/Windows](https://github.com/JeanLamora75/SMN/actions/runs/39558095589) : **échec avant toute étape de test** (`steps=null`). Les six tests unitaires écrits, assertions HTTP, les contrôles TypeScript, le test réel du dump PostgreSQL 18.6 et toute restauration restent **non exécutés/non attestés**. Le code est intégré, mais **SMN-30 reste En cours** jusqu'à qualification.
