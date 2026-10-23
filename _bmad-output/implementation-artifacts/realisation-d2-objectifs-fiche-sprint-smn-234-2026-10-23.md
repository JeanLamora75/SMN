# SMN-234 — D2 : onglet Objectifs de la fiche Sprint

**Date :** 23 octobre 2026. **Epic :** SMN-228. **Branche :** `main`. **État :** implémentation publiée et revue statiquement ; **recette et compilation locales encore nécessaires**.

## Résultat métier

1. **Fiche Sprint → Objectifs :** conserver le `sprintId` de la route et afficher l'ensemble des objectifs réellement enregistrés, intitulé, état d'évaluation et commentaire facultatif, sans sélection d'un autre Sprint.
2. **Ajout d'objectif :** bouton « Ajouter un objectif » pour admin lorsque le Sprint n'est pas clôturé. Dialogue prérempli pour ce Sprint, titre obligatoire (240 caractères max.), commentaire (2 000 max.). La création impose `not_evaluated` — pas d'évaluation anticipée.
3. **Édition individuelle :** crayon Bootstrap `pencil-square` sur chaque objectif, accessible à l'admin seulement. Dialogue permettant d'éditer le titre, le commentaire et l'évaluation : `not_evaluated`, `achieved`, `partially_achieved`, `not_achieved`.
4. **Persistance :** réutiliser uniquement `POST /api/admin/sprints/goals` et `writeSprintGoal` ; transaction, garde de session/origine/rôle, vérification du Sprint, protection de clôture, `revision` optimiste et audit `smn_sprint_goal_audit` déjà présents. Pas de nouveau SQL de mutation dans le composant.
5. **Conflits :** conserver le brouillon et afficher une erreur claire en cas de `conflict` ou `closed-period`. Après écriture effective, fermer la boîte d'édition, puis rafraîchir la projection SSR du Sprint.
6. **Lecture user :** ajouter `readSprintDetailGoals` : lecture **SELECT-only** autorisée via la fiche collective existante, avec contrôle du Sprint et de l'équipe dans la requête ; aucune ouverture des GET d'administration réservés à `settings`.
7. **Sprints clôturés :** lecture exclusive du dernier snapshot `smn_sprint_closure_snapshot` Vn et de sa liste d'objectifs ; ne jamais substituer le tableau des objectifs courants. Aucune commande d'édition, mais les informations enregistrées et la version sont visibles.
8. **Absence et qualité :** liste vide lorsqu'une table consultée est réellement vide ; source/table manquante ou snapshot absent affiché comme indisponible, jamais converti en zéro ni en une liste faussement vide.
9. **UX et i18n :** modale HTML native et styles Bootstrap déjà livrés dans D1 ; boîtes accessibles, Annuler/Enregistrer, texte FR/EN centralisé, focus de retour, notification sauvegarde, avertissement de brouillon avant rechargement complet.

## Fichiers touchés

| Fichier | Changement |
|---|---|
| `src/server/sprints/goals-detail-read.ts` | **Création** du lecteur collectif sans DDL, avec validation de champs et lecture des snapshots |
| `src/app/app/admin/sprints/[sprintId]/sprint-goals-panel.tsx` | **Création** de la liste, bouton Ajouter, crayons, modales et gestion des erreurs |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Intégration du nouveau lecteur et de l'onglet Objectifs ; les six autres onglets inchangés |
| `src/i18n/fr.json`, `src/i18n/en.json` | Nouvelles traductions Objectifs |
| `tests/smn-234-sprint-objectives-d2.test.ts` | **Création** : lecture autorisée, liste 0/n, snapshot Vn, source manquante, droits et contrôle de version |
| `tests/smn-234-sprint-detail-d1.test.ts` | Mise à jour du test de non-régression pour le lecteur D2 |

L'ancien formulaire global `src/app/app/admin/sprints/goals-form.tsx` n'a pas été supprimé : les parcours historiques restent disponibles jusqu'à la recette transverse D9.

## Vérification réellement effectuée

**Oui — relecture de GitHub** : existence des 6 fichiers nouveaux/modifiés, revue des services de mutation déjà présents, absence de DDL dans le lecteur, vérification du filtrage SQL `team_id`, validation de la forme des snapshots, du contexte (sprintId), de la condition d'édition admin et des catalogues JSON. Douze assertions **statiques** de cohérence de code ont été évaluées et ont donné **12/12**. Les fichiers de test TypeScript ont été publiés.

**Non — tests d'exécution et recette** : `pnpm typecheck`, `pnpm exec tsx --test`, `pnpm i18n:check`, `pnpm build`, tests sur PostgreSQL local, interactions dans Chrome, contrôles du DOM et vérification des transactions sur une base réelle. Le dépôt complet avec Node 24 et ses dépendances n'est pas disponible dans le conteneur courant ; GitHub Actions est indisponible. Les tests statiques ne prouvent pas l'exécution du code.

## Recette à exécuter sous Windows 11 après synchronisation de main

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts tests/smn-235-dashboard-projection.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

**Vérifications navigateur :** ouvrir Sprints > nom d'un Sprint en admin ; tester 0, 1 et plusieurs objectifs ; ajouter un objectif et constater « Non évalué » ; modifier son titre, son évaluation et son commentaire ; vérifier le reflet après rafraîchissement. Tester le rôle `user` sans aucun bouton Ajouter/crayon ; un Sprint clôturé sans écriture, avec ses valeurs d'instantané. Vérifier FR/EN, 320–1440 px, clavier, Escape/Annuler, erreurs de conflit et refus serveur. Sur une base non initialisée, l'admin peut créer le premier objectif à l'aide de l'API historique qui initialise son schéma dans une **mutation** autorisée.

**Ne pas modifier un Sprint de production pour réaliser ces essais** : utiliser une installation/équipe de test avec données adaptées.

## Passage vers D3

D2 est **développé sur main mais non recetté localement**. Avant d'affirmer le lot terminé, recueillir les résultats des commandes ci-dessus et traiter les anomalies éventuelles. La Story globale SMN-234 reste ouverte.

**Prochaine étape D3 — Indicateurs :** 8 saisies (F01–F04/F10/F11/I01/I02), 4 calculs instantanés (F05/F06/F07/F12), persistance historique des scores 1–5, garde-fous sur `null`, zéro, concurrence et clôture. Conserver tous les onglets et actions D1–D2.

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-234
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Livraison D1](realisation-d1-fiche-sprint-smn-234-2026-10-23.md)
- [Plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
