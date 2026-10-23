# SMN-128 — Archivage du fichier PDF exact

Jira : https://lmn24.atlassian.net/browse/SMN-128 — Story 6.18.

## Incrément publié sur main
- Contrat d'archive PDF avec identifiant UUID, SHA-256 des octets exacts, taille, auteur, date, langue, modèle, équipe, cycle, statut et version Vn.
- Service serveur non exposé à une route HTTP : stockage privé hors de `public/`, création exclusive (`wx`) empêchant l'écrasement, synchronisation du fichier et relecture/contrôle d'intégrité avant validation des métadonnées PostgreSQL.
- Métadonnées avec manifeste JSON ; la lecture interne `readVerifiedPdfArchive` revérifie l'empreinte avant tout accès aux octets.
- En cas d'échec d'écriture ou de transaction, suppression du fichier non finalisé ; les archives finalisées précédentes ne sont pas écrasées.
- Tests unitaires préparés dans `tests/smn-128-pdf-archive.test.ts`.

## Blocage fonctionnel

SMN-127 ne dispose toujours pas de générateur PDF serveur : `window.print()` n'envoie pas le PDF imprimé au serveur. Le service d'archive n'est donc **pas branché à un export réel** et aucune création d'archive n'est déclenchée par l'aperçu HTML. SMN-128 n'est pas terminée.

Points restant à réaliser : raccordement uniquement à un export PDF effectivement produit, configuration d'un répertoire privé sauvegardé/restauré avec l'Epic 2, contrôle de concurrence et atomicité de publication en cas de panne entre fichier/DB, API de téléchargement avec contrôle d'accès, recette d'immutabilité et de restauration.

Attention : ce service interne ne doit pas être exposé par un endpoint de téléchargement ou d'upload public sans contrôle de permissions et de périmètre, ni utilisé pour archiver des fichiers non vérifiés.

## Vérifications

Aucun test, build ni recette sur PostgreSQL/Windows exécuté. Jira reste ouverte.
`git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-128-pdf-archive.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
