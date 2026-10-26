# SMN-282 — Journal de développement (BMAD v6.12.4)

**Date :** 26/10/2026
**Story :** [SMN-282](https://lmn24.atlassian.net/browse/SMN-282) — Epic [SMN-3](https://lmn24.atlassian.net/browse/SMN-3)
**PR :** [#189](https://github.com/JeanLamora75/SMN/pull/189), branche `feat/smn-282-multi-teams-foundation-20261026`
**État :** démarré, premier lot incomplet ; aucun déploiement ni fusion sur `main`.

## Décisions à respecter
- Installation Scrum/Kanban : plusieurs équipes dès MVP.
- Produit optionnel et indépendant par équipe ; seuls le nom d'équipe est requis à la création.
- Sélecteur d'équipe global ; choix personnel mémorisé ; maintien de rubrique ; cycle propre à la nouvelle équipe ; confirmation pour abandon d'un brouillon.
- Lien contextuel autorisé explicitement prioritaire, sans contournement des permissions.
- **Utilisateur (role `user`) :** ses habilitations aux équipes seront administrées dans la fiche de compte **en V1** ; le sort des comptes préexistants est **reporté par décision utilisateur**, aucune migration implicite des permissions n'est autorisée.

## Livré dans cette branche (Lot 1 partiel)
- `src/lib/team-form.ts` : parsing strict création/édition, longueurs 120/5 000, nettoyage, produit et textes facultatifs, ID/révision en édition, normalisation des noms.
- `src/server/teams/list.ts` : liste par installation, produit facultatif, contexte optionnel, aucune sélection de première équipe implicite.
- `src/app/api/admin/teams/route.ts` : lecture de liste GET réservée à l'Admin, identifiant d'installation issu de son compte authentifié ; entrée HTTP inconnue refusée.
- `tests/smn-282-team-form.test.ts` : premiers tests de contrat.

## Encore à développer avant activation
1. Migration PostgreSQL complète, réversible, compatible avec les tables historiques, l'authentification (contrôles v27) et les anciens consommateurs de l'équipe singleton ; mettre à jour Prisma.
2. Services transactionnels création/édition et audit, API POST/PATCH, prévention des doublons et concurrence.
3. Nouvelle page Paramètres > Équipes et navigation i18n FR/EN.
4. Contexte serveur fiable, sélecteur global, cycles Scrum et Kanban, navigation, URL et brouillons.
5. Adaptation et vérification de **toutes** les requêtes dashboard, membres, capacités, calendriers, registres, rapports, exports et historiques à la propriété équipe.
6. Sécurité admin/user y compris liens directs ; cas des comptes historiques **non tranché**.
7. Tests PostgreSQL et recette sur l'environnement Windows de l'utilisateur.

## Vérifications réelles
- Un exemplaire isolé du contrat `team-form.ts` a passé `tsc --noEmit --strict --target ES2022` avec TypeScript global et **4 contrôles de fumée** sur le parsing (Node v22.16.0). Cela ne remplace pas l'exécution des tests du dépôt.
- **Non exécutés** : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, migration SQL et tests avec PostgreSQL. L'environnement actuel n'a pas de checkout SMN complet, Node 24 ni pnpm.
- Le skill `bmad-agent-dev` et `bmad-build` ont été lus via le dépôt. La commande locale `uv run ... render_skill.py` du skill `bmad-build` n'a pas pu être exécutée, faute de projet cloné/monté. Travail adapté aux connecteurs, **sans prétendre exécuter le workflow BMAD complet**.

**Règle de livraison :** PR en brouillon ; ne pas déclarer la Story terminée ni fusionner avant que le schéma, les lecteurs, les autorisations et les tests réels soient prêts.
