# SMN-34 — Restauration contrôlée : état d'implémentation et protocole

Date : 09/11/2026. Jira : https://lmn24.atlassian.net/browse/SMN-34. Epic 2.

## Statut réel
**Partiellement implémenté — garde-fous de préparation uniquement. La restauration n'est pas exécutable.**
Cette limitation est intentionnelle : SMN-33 constate un risque d'effacement non qualifié et le code ne fournit pas encore de bascule atomique vérifiée PostgreSQL + documents. Aucun succès de restauration ni recette n'est attesté.

## Code publié sur main
- `src/server/backup/restore-readiness.ts` : classification pure des incompatibilités et exigences manquantes. L'issue de préflight est **toujours bloquée**, indépendamment d'un paramètre envoyé par le client.
- `src/app/api/admin/backups/restore/preflight/route.ts` : route POST authentifiée administrateur et protégée contre les origines non autorisées ; ne fait que relire SMN-33 et évaluer les prérequis. Réponse HTTP 409 explicite ; aucune commande PostgreSQL de restauration, aucune mutation de fichiers métier.
- `src/app/app/admin/backups/backups-admin.tsx` : contrôle des prérequis depuis l'aperçu d'une archive, messages traduits FR/EN.
- `tests/backup-restore-readiness.test.ts` : tests rédigés, non exécutés dans l'environnement GitHub connecté.

## Conception requise pour terminer les AC1–AC5
1. **Qualification et confirmation séparée** : revalider le paquet au moment de l'action, son origine, les versions, l'inventaire et les effacements. Confirmer explicitement l'identifiant et les pertes potentielles ; refuser toute confirmation obsolète.
2. **Construction isolée** : obtenir une clé locale ou recouvrée par phrase secrète sans logs, déchiffrer en flux le dump PostgreSQL et les documents dans un espace privé isolé ; `pg_restore` dans une base de test dédiée, jamais dans la base active. Vérifier schémas, contraintes, références et documents par couples manifeste/contenu ; pas de fichiers fictifs.
3. **Point de reprise avant bascule** : produire une sauvegarde complète cohérente des données actuellement actives ; vérifier sa lecture et sa capacité réelle de retour arrière.
4. **Bascule** : suspendre les écritures et les sessions, acquérir les verrous appropriés, remplacer DB et documents de manière coordonnée. PostgreSQL et le système de fichiers ne forment **pas une transaction atomique commune** : prévoir journal d'intention durable, phases explicites et stratégie de reprise après crash/rupture de courant ; ne jamais servir un état mixte comme opérationnel.
5. **Post-contrôles** : réouvrir le service seulement après contrôles d'intégrité, diagnostic de restauration effective, journal d'audit pérenne, invalidation des sessions sensibles, contrôle des chemins et autorisations. Conserver le point de reprise tant que la restauration n'est pas validée.
6. **Confidentialité SMN-40** : exploiter des traces d'effacement **hors** de la base susceptible d'être restaurée. S'il est impossible de prouver l'absence d'effacements ou de filtrer l'archive, restauration suspendue.
7. **Tests** : paquet corrompu, clé perdue/mauvaise phrase, base différente, schema ancien/nouveau, PostgreSQL incompatible, archives sans documents, fichiers orphelins, absence de permissions, coupure au milieu de chaque phase, retour arrière, sessions actives, fuite de secrets et données effacées. Recette Windows 11 PostgreSQL 18.6 sur base jetable.

## Acceptation
- AC1–AC4 : **non terminés** (pas de moteur de restauration).
- AC5 : les contrôles d'inventaire des documents existants sont disponibles côté vérification mais doivent être démontrés sur une restauration réelle.
- Les commandes `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` et une recette PostgreSQL Windows restent **à exécuter**.
- Respect du mode ChatGPT + connecteurs GitHub/Jira ; script `uv` du skill BMAD non exécuté.

**Ne pas passer la Story à Terminée** ni présenter cette livraison comme permettant de charger une sauvegarde. L'API de préflight répond 409 et l'interface ne comporte pas de bouton exécutant une restauration.
