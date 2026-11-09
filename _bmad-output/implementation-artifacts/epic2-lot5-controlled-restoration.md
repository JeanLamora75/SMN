# Epic 2 — Lot 5 — SMN-34 : restauration contrôlée

Date : 9 novembre 2026. Branche : main. Statut : mécanismes de qualification développés, restauration active non activée.

## AC1, AC2 et AC5 — reconstruction de paquet v4

Le moteur src/server/backup/restore-sandbox.ts vérifie et déchiffre en flux AES-256-GCM le paquet chiffré v4. Le dump rejoint pg_restore en transaction unique sur une base PostgreSQL 18 préexistante, vide, isolée et nommée smn_restore_test_*. Le test tests/smn-34-v3-postgres.test.ts compare les empreintes des tables v33, les dépendances, les sprints, les indicateurs dynamiques, Dashboard Builder, liens et registres. Les PDF, DOCX, modèles Office et documents privés figurent dans le paquet.

L'option stagingFilesOutput permet désormais de conserver les fichiers reconstruits dans une zone jetable smn_restore_test_files_* située sous le dossier temporaire. Le moteur vérifie chaque composant et produit une empreinte globale ; le test compare les octets des PDF, rapports Office, modèles et TXT reconstruits aux sources. Aucun chemin actif n'est remplacé et aucun dump en clair n'est persisté.

## AC3 — sauvegarde de retour arrière et bascule hors ligne

Modules :
- src/server/backup/restore-cutover-drill.ts : bascule PostgreSQL 18 via renommages de trois bases strictement jetables sur serveur local, avec journal signé HMAC, verrou advisory, refus des connexions ouvertes, copie de rollback préservée.
- src/server/backup/restore-file-cutover-drill.ts : bascule des répertoires jetables sur un même volume, avec vérification SHA-256, refus des liens symboliques, limites de volume, copie de rollback préservée.
- src/server/backup/restore-coordinated-drill.ts : coordination des deux opérations, retour arrière des fichiers si la bascule SQL est refusée ou annulée de façon certaine et refus de récupération automatique en cas d'état ambigu.

Tests : tests/epic2-lot5-cutover-pg.test.ts, tests/epic2-lot5-coordinated-pg.test.ts, tests/epic2-lot5-file-cutover.test.ts. Une panne après le premier renommage est injectée ; la base et les fichiers initiaux sont vérifiés après récupération.

Limite : aucun système de fichiers et PostgreSQL ne partagent une transaction atomique. Les exercices jetables prouvent le mécanisme de retour arrière, pas la sûreté d'une bascule sur l'installation Windows réelle.

## AC4 — invalidation des sessions et maintenance

SessionStore.revokeAll() invalide toutes les sessions en mémoire. La fonction invalidateAllSessionsAfterRestore() est disponible dans le module d'authentification. Un redémarrage de tous les processus reste nécessaire.

Le module src/server/backup/restore-maintenance.ts utilise la variable SMN_RESTORE_MAINTENANCE_MARKER pour activer un marqueur externe persistant hors de l'application et des sauvegardes. Les lectures de session refusent tout accès si le marqueur existe, même s'il est endommagé. Il n'est jamais retiré automatiquement après une panne. Tests : tests/epic2-lot5-session-reset.test.ts et tests/epic2-lot5-maintenance.test.ts.

Le marqueur applicatif ne remplace pas l'arrêt de tous les producteurs, jobs et connexions avant la bascule.

## Conditions d'autorisation

src/server/backup/restore-activation-policy.ts exige des preuves indépendantes d'intégrité du paquet v4, de compatibilité, de reconstruction isolée, de checkpoint de retour arrière, de staging complet des fichiers, de trafic arrêté, de sessions invalidées, de journal de bascule vérifié et de préservation des copies originales.

Le contrôle SMN-40 est bloquant : le registre prouve certains effacements de membres, mais completeHistory global reste faux tant que toutes les suppressions personnelles, y compris les documents et les archives non inspectables, ne sont pas prises en charge. Une copie ancienne qui pourrait réintroduire des données supprimées ne doit jamais être activée.

La route de préflight existante conserve donc une réponse bloquante ; aucune API de restauration active ni option de contournement n'est publiée.

## Reprise opérateur nécessaire avant livraison active

1. Stopper réellement SMN, les jobs et toutes les connexions, créer le marqueur externe de maintenance.
2. Vérifier le paquet chiffré v4, la source, les preuves exhaustives d'effacement et la revue des archives.
3. Capturer et qualifier un checkpoint PostgreSQL + fichiers courants distinct de la sauvegarde sélectionnée.
4. Reconstruire base et fichiers candidats ; comparer tous les schémas, les relations et fichiers.
5. Bascule avec journal de coordination durable et copies de rollback préservées.
6. Vérifier l'état activé ; si la preuve est incomplète, laisser la maintenance et reprendre selon le journal.
7. Redémarrer toutes les instances, révoquer les sessions, vérifier les métriques, publier un audit sans secrets et ne lever le marqueur qu'après validation.

Cette procédure n'est pas encore un exécuteur de restauration sur installation réelle. Aucune donnée utilisateur n'a été restaurée ou écrasée.

## État des critères d'acceptation

| Critère | Statut |
|---|---|
| AC1 | Reconstruction v4 isolée et staging qualifiés ; activation réelle manquante |
| AC2 | Relations v33 / PG18 contrôlées sur base jetable |
| AC3 | Rollback SQL et fichiers jetables qualifié ; runbook de production et incidents à valider |
| AC4 | Sessions et marqueur de maintenance testés ; audit post-bascule réelle absent |
| AC5 | Vérification et refus des documents manquants en reconstruction isolée |

La Story SMN-34 doit rester En cours. Aucun script BMAD uv n'a été lancé ; les contrôles ont été transposés dans GitHub Actions.

Références :
- https://lmn24.atlassian.net/browse/SMN-34
- https://github.com/JeanLamora75/SMN/actions/workflows/epic2-lot5-cutover.yml
- https://github.com/JeanLamora75/SMN/actions/workflows/smn-34-restore-sandbox.yml

## Preuves CI vérifiées au 9 novembre 2026

**Bascule et reprise :** https://github.com/JeanLamora75/SMN/actions/runs/42651152399 — commit 276700c1049f63ad42f47e0e2eadb614d3c6deed — trois jobs réussis : Windows (politique, sessions, maintenance, TypeScript et i18n), Linux (mêmes contrôles), PostgreSQL 18 (bascule réelle sur bases jetables, copie conservée, injection de panne et retour arrière coordonné avec les fichiers).

**Sauvegarde v4 complète et fichiers :** https://github.com/JeanLamora75/SMN/actions/runs/42651636833 — commit b80323983b0b5f70026b425c7a99f84e18e5f82b — trois jobs réussis : contrats Windows/Linux et reconstruction PostgreSQL 18 d'un vrai paquet v4 avec fichiers PDF, Office et privés, contrôles d'empreintes et de références. La recette v4 a été relancée après les modifications du lot 5.

**Traçabilité Jira :** SMN-34 reçoit un commentaire de réalisation vérifiée. Son statut reste En cours. Les critères AC1/AC4 nécessitent encore une activation réellement sûre et une recette sur installation Windows après levée des obligations SMN-40.
