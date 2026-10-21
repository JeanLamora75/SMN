# SMN-31 — Story 2.3 : vérifier l'intégrité et inventorier une sauvegarde

**Références :** [Jira SMN-31](https://lmn24.atlassian.net/browse/SMN-31), Epic SMN-2, FR-68/73, AD-25/26/27, SEC-03 et [SMN-30](./spec-smn-30-sauvegarde-manuelle.md).

## Contrat réalisé

- **AC1** : les nouveaux manifests chiffrés passent de version 1 à version 2 et enregistrent identifiant UUID, horodatage UTC, installation source issue de l'identifiant et de sa date de création, version applicative de package.json, version du schéma et PostgreSQL 18.x. L'index de récupération reste en version 1 pour conserver la compatibilité avec SMN-30.
- **AC2** : \`src/server/backup/verification.ts\` ouvre les fichiers privés locaux, contrôle les chemins autorisés, l'absence de liens symboliques, l'inventaire exact du paquet, la taille/empreinte SHA-256 des fichiers chiffrés, leur tag d'authentification AES-GCM, les SHA-256 et tailles déchiffrées, le marqueur \`PGDMP\` et les correspondances entre documents et manifestes. Le dump est déchiffré en flux, **jamais écrit en clair**. Chaque contrôle produit \`backups/verification/<uuid>.json\` (statut, code d'erreur sans secret, date UTC), réécrit à chaque vérification. Aucun ancien statut enregistré n'est considéré comme une preuve.
- **AC3** : états \`verified\`, \`invalid\`, \`incomplete\`, \`unverifiable\` ; un fichier manquant rend l'ensemble incomplet, une empreinte incorrecte le rend invalide, une clé absente empêche la vérification. Aucun état non vérifié n'est présenté comme fiable.
- **AC4** : \`GET /api/admin/backups\` ajoute l'inventaire au résultat SMN-30 (accès Administrateur exclusivement). L'écran Administration → Sauvegardes présente date, origine, version SMN et PostgreSQL, schéma, nombre de documents, composants techniques et empreintes des chiffrés ; sans exposer noms de documents originaux, contenu, clés ou phrase de récupération.
- **AC5** : \`restoreTested: false\` explicite pour tous les paquets. Le libellé ne prétend jamais qu'une restauration isolée a eu lieu.

## Sécurité et limites

La clé locale est lue dans un dossier privé. Sans clé locale, le manifeste chiffré ne peut être authentifié sur cette installation ; une reprise au moyen de l'enveloppe et de la phrase est du périmètre restauration, pas d'une vérification silencieuse. Les paquets historiques version 1 restent vérifiables mais leur version applicative n'est pas inventée.

L'inventaire lit au plus 200 dossiers UUID publiés ; les répertoires temporaires \`.partial\` ne sont jamais déclarés réussis. Au-delà, l'API échoue explicitement au lieu d'omettre silencieusement des sauvegardes. Pour un paquet volumineux, la vérification intégrale est une opération de lecture potentiellement coûteuse au chargement ou au clic de revérification.

La vérification d'intégrité prouve la cohérence du paquet avec son manifeste et la clé locale, **pas** la capacité de restauration sur une autre installation. La cohérence entre writers PostgreSQL et système de fichiers reste conditionnée au protocole de verrouillage coopératif documenté dans SMN-30.

## Contrôles et recette

Tests ajoutés : \`tests/backup-verification.test.ts\` couvrant paquet v2, ancienne version v1, falsification, fichier absent, liens incohérents, absence de clé, persistance des résultats et absence de contenu privé dans l'API. Ils sont des **tests écrits**, pas une attestation d'exécution.

Recette sur poste Windows/PostgreSQL 18.6 : exécuter \`pnpm i18n:check\`, \`pnpm lint\`, \`pnpm typecheck\`, \`pnpm test\` et \`pnpm build\` ; créer une vraie sauvegarde, vérifier son inventaire, altérer une **copie** de paquet de test, constater Invalide/Incomplète, restaurer la copie initiale, vérifier la lecture des anciens paquets, examiner le dossier privé \`verification\`. Ne jamais altérer une sauvegarde de production.

Aucune restauration en environnement distinct n'est déclarée réussie par SMN-31.
