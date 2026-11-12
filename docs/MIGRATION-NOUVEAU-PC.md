# SMN v33 — Migration contrôlée vers un nouveau PC Windows

## Parcours utilisateur depuis l'interface (SMN-442 — novembre 2026)

**Aucune commande PowerShell ni terminal n'est demandée à l'utilisateur.**
Le flux attendu est : sur le PC source, `Paramètres > Sauvegardes > Exporter vers un autre PC`, télécharger **un fichier ZIP unique** chiffré avec manifeste et preuves ; sur le PC cible, `Paramètres > Sauvegardes > Importer depuis un autre PC`, sélectionner le ZIP, renseigner la phrase de récupération, attendre la vérification cryptographique, lire l'impact du remplacement, confirmer explicitement, puis laisser le lanceur SMN arrêter le serveur, restaurer dans une base isolée, conserver l'ancienne base et les fichiers comme retour arrière, valider les empreintes et redémarrer avec réauthentification.

La destination peut avoir déjà été installée et contenir des données : **upload et vérification restent non destructifs** ; le remplacement ne peut commencer qu'après consentement et contrôle des preuves. L'installation source doit rester cohérente durant l'export ; les installations après transfert sont indépendantes, et les mises à jour ultérieures de l'une ne sont pas automatiquement synchronisées avec l'autre.

Les opérateurs hors ligne figurant plus bas sont **des détails de diagnostic et de recette QA**, pas des instructions à donner aux utilisateurs finaux.

**État de validation :** présence du code et contrôles statiques + compilation Windows, mais validation du workflow de restauration de bout en bout (dont crash et rollback réels) sur deux installations Windows isolées **obligatoire avant clôture de SMN-442**. Ne pas prétendre qu'une CI de packaging équivaut à cette recette.

---

## Portée et état

La migration vise la **reprise fidèle** des équipes, membres nommés, affectations, calendriers, sprints, registres, indicateurs v33, rapports et fichiers Office. Elle ne se limite pas aux préférences d'interface. Le PC source et le PC destination sont indépendants ; la source doit être gelée et attestée au moment du transfert pour empêcher la réintroduction d'effacements après l'instantané.

Les outils ci-dessous sont **des opérateurs hors ligne sensibles** ; ils ne constituent pas encore un assistant de migration en un clic. Ils ne doivent être employés sur les données actives qu'après réussite de la CI Windows, tests de bascule et retour arrière sur une installation jetable, et vérification indépendante des preuves.

## Prérequis incontournables

- Une sauvegarde v4 complète de l'installation source, **vérifiée**, et sa phrase de récupération (ne jamais transmettre la phrase en ligne de commande).
- Le paquet chiffré `SMN-backup-<UUID>.tar.gz` exporté depuis **Administration → Sauvegardes → Contrôler la migration vers un nouveau PC**.
- Le registre externe d'effacement transféré et vérifié séparément, avec son ancre d'intégrité ; l'absence de marqueurs ne prouve pas à elle seule l'absence d'anciens effacements.
- Un **reçu de l'état courant de la source gelée** (`smn-40-cross-pc-receipt --capture`) signé avec la clé récupérable de la sauvegarde ; ce reçu ne prouve pas à lui seul qu'un autre processus ne peut plus écrire sur le PC source.
- Le paquet Windows v33 contenant les utilitaires de migration sous `app/maintenance/migration/`. Sur le PC cible, `runtime/node/node.exe` exécute les opérateurs `.mjs` sans installation de Node, pnpm, IDE ni scripts uv.
- Une confirmation explicite de l'opérateur, le serveur HTTP arrêté, l'absence de connexions PostgreSQL actives, un journal de bascule et des sauvegardes de retour arrière.

## Parcours opératoire en étapes vérifiables

1. **Source :** créer et vérifier la sauvegarde depuis SMN. Confirmer que les noms de membres et les historiques sont inclus. Conserver le paquet chiffré et la phrase dans des canaux distincts.
2. **Source :** exporter le registre des effacements avec `smn-40-ledger-transfer`, puis geler l'installation, installer et contrôler la barrière de maintenance. Vérifier l'absence d'écritures et produire le reçu signé avec `smn-40-cross-pc-receipt --capture`. Ne pas utiliser le PC source pour modifier l'équipe après cette capture tant que la migration n'est pas terminée.
3. **Destination :** transférer les trois artefacts par canal sûr : paquet chiffré, registre chiffré, reçu HMAC. Récupérer la clé via la phrase en entrée standard et importer l'archive par `smn-40-portable-import`. Importer le registre séparément dans un profil admissible, jamais dans un registre déjà peuplé.
4. **Destination :** créer la barrière via `smn-40-offline-maintenance --begin --confirm=FENCE_NEWPC_MIGRATION` avec `SMN_RESTORE_MAINTENANCE_MARKER` pointant vers un chemin sûr et absolu **hors du répertoire SMN et du répertoire de sauvegardes**. Un verrou supplémentaire est conservé sous `SMN/updates/restore-maintenance.lock` ; le lanceur refuse désormais de démarrer même lorsque la variable d'environnement est absente. Fermer et arrêter le serveur web puis vérifier qu'aucun accès n'est encore ouvert.
5. **Destination :** vérifier le paquet, le registre, la version PostgreSQL 18, les fichiers et les signatures ; préparer une candidate via `smn-40-managed-candidate-prepare`. Si l'installation Express a déjà créé des tables, le mode de remplacement avec point de retour arrière exige `--replace-initialized-with-rollback` et `SMN40_MANAGED_PREPARE_CONFIRM=PREPARE_REPLACEMENT_WITH_ROLLBACK`. Il refuse une destination d'identité identique à la source.
6. **Destination :** comparer intégralement les empreintes de la candidate à celles du reçu signé. Après accord explicite et preuve du gel, activer hors ligne avec `smn-40-fresh-install-activate`. Pour une destination déjà initialisée, les doubles confirmations sont `--confirm=REPLACE_INITIALIZED_DESTINATION_WITH_ROLLBACK` et `SMN40_FRESH_INSTALL_OFFLINE_CONFIRM=REPLACE_VERIFIED_INITIALIZED_DESTINATION_WITH_ROLLBACK`. La base précédente est **renommée et conservée**, et les anciens fichiers sont conservés dans des répertoires de rollback.
7. **Destination :** avant toute ouverture, lancer `smn-40-cutover-postcheck --journal <chemin> --receipt <chemin>` : contrôle du journal signé, des deux générations de base, du registre, des sessions et comparaison des tables et fichiers avec le reçu source.
8. **Validation indépendante :** une fois la source réellement gelée et mise hors service, et les vérifications terminées, l'opérateur peut déclencher `smn-40-cutover-release --journal <chemin> --receipt <chemin> --confirm=INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED` avec `SMN40_RELEASE_OFFLINE_CONFIRM=INDEPENDENT_SOURCE_RETIRED_AND_REAUTH_APPROVED`. Les deux verrous sont archivés, **pas supprimés**. Le port 3003 doit être libre. Redémarrer SMN et **se reconnecter** ; aucune session de l'ancien serveur n'est réutilisée.
9. **Réception métier :** contrôler les équipes, noms, historiques, sprints, indicateurs, registres, modèles et rapports. Ne pas détruire le point de retour arrière avant une recette indépendante.

## Retour arrière

- **Avant la fin de l'activation :** le coordinateur tente automatiquement des renommages compensatoires ; une ambiguïté conserve la maintenance et exige une reprise manuelle.
- **Après une activation vérifiée mais avant la reprise des écritures :** `smn-40-cutover-rollback --journal <chemin> --receipt <chemin> --confirm=ROLLBACK_VERIFIED_NEWPC_CUTOVER` et `SMN40_ROLLBACK_OFFLINE_CONFIRM=ROLLBACK_VERIFIED_NEWPC_CUTOVER`. La base précédente reprend son nom `smn`, et la base migrée ainsi que ses fichiers sont conservés à part. L'opérateur doit maintenir la barrière et revérifier l'état avant toute réouverture.
- **Si un contrôle échoue :** conserver tous les fichiers, la base d'origine et le journal ; ne pas supprimer les dossiers de rollback, ne pas réinitialiser PostgreSQL et ne jamais faire disparaître le verrou à la main.

## Contraintes et preuve

Les scripts n'ont jamais pour fonction de supprimer une base active ni de faire une migration silencieuse au lancement. La réauthentification n'implique pas une suppression des noms des membres. Les comptes historiques sont restaurés avec l'archive, mais les sessions actives sont invalidées au redémarrage ; appliquer la politique de rotation des secrets prévue.

**Ne pas considérer la migration réelle comme validée** sans exécution réussie des tests Windows, du packaging autonome, d'une recette inter-PC et d'un test de rollback sous Windows. La politique générale de restauration vers la même installation reste distincte du mode de transfert de l'état courant. La preuve HMAC du reçu est une attestation d'intégrité, pas une garantie technique de gel du PC distant.

Références : `_bmad-output/implementation-artifacts/SMN-34-MIGRATION-NOUVEAU-PC-RESTAURATION-FIDELE-2026-11-11.md`, `_bmad-output/implementation-artifacts/SMN-40-LOT-TRANSFERT-REGISTRE-RECONSTRUCTION-NEUVE-2026-11-11.md`, `src/server/backup/fresh-install-cutover.ts`, `src/server/backup/fresh-cutover-rollback.ts`, `src/server/backup/fresh-cutover-release.ts`.
