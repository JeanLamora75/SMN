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

### Migration préparatoire non activée

- `src/server/teams/migration.ts` contient les instructions SQL de préparation de l'extension multiéquipes : liens Produit facultatifs, suppression des contraintes monoéquipe, intégrité interinstallations et unicité de rattachement d'un produit à une seule équipe.
- **Le SQL n'est ni intégré au moteur de migration ni exécuté.** La cohérence avec `schema_version=27`, `_prisma_migrations`, `prisma/schema.prisma` et les consommateurs existants doit être assurée avant toute activation. Cette préparation ne constitue pas une livraison de migration.

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

## Étape 2 — Services transactionnels préparés (26/10/2026)

- `src/server/teams/write.ts` contient **deux fonctions non exposées par HTTP** : `createInstallationTeam` et `updateInstallationTeam`.
- Chaque commande effectue `BEGIN`/`COMMIT` ou `ROLLBACK`, verrouille la ligne de l'installation pour sérialiser les modifications, revalide que l'acteur est `admin` actif et appartient à cette installation, et **refuse le schéma historique v27** (`schema-not-ready` tant que la future v28 complète n'est pas opérationnelle).
- Création : `teamId` neuf, produit seulement s'il est renseigné, contexte d'équipe et **audit revision 1**, homonymies normalisées contrôlées. Aucune création de membre, période, calendrier ou Sprint par défaut.
- Édition : équipe et contexte verrouillés, contrôle de révision optimiste, produit indépendant ; renommer un produit conserve son identifiant, retirer le produit détache sa référence courante **sans supprimer la ligne Produit historique**, Vision/Product Goal conservés dans l'équipe, audit append-only.
- **Correction de sécurité du contrat de formulaire** : lors d'une modification, tous les champs du formulaire sont transmis explicitement (`productName`, `vision`, `productGoal` peuvent valoir `null`), pour ne pas effacer silencieusement des valeurs omises ; la création accepte le seul nom.
- `tests/smn-282-team-write.test.ts` ajoute des scénarios simulés de transaction, rôle refusé, schéma incompatible, doublon, conflit concurrent, produit retiré, rollback ; `tests/smn-282-team-form.test.ts` a été aligné avec le contrat d'édition intégral.

**Limitations actuelles** : ces tests sont **écrits mais non exécutés** dans l'environnement du projet ; la base réelle n'a pas été migrée. Les contraintes SQL finales, l'intégration d'authentification v28 et l'ensemble des consommateurs de `teamId` sont encore à coordonner et à tester. **Aucune méthode POST/PATCH HTTP n'est activée**, aucun lien de Paramètres n'ouvre de faux formulaire. L'éventuelle migration des comptes `user` préexistants reste délibérément hors périmètre.

**Prochaine étape technique :** concevoir/valider une migration versionnée et compatible `schema_version`, `_prisma_migrations`, Prisma, diagnostic et lecteurs ; exécuter les contrôles réels sur une copie de base avant activation des commandes.

### Vérifications d'architecture de l'étape 2

- Le service refuse toute écriture tant que `smn_installation.schema_version` n'est pas **28**, et exige un compte `admin` actif dans **la même installation**.
- Les requêtes de création et de modification sont **transactionnelles** et verrouillent l'installation ; la création rejette les homonymes normalisés ; la modification verrouille l'équipe et contrôle le numéro de révision.
- Le nom d'équipe est seul requis à la création. L'édition demande explicitement les quatre valeurs (dont `null` pour les options vides), afin qu'un champ omis ne détruise pas silencieusement des données.
- Le produit facultatif est détaché lors de son effacement sans supprimer la ligne historique ; le changement de produit vérifie la propriété de la même installation et le nombre de lignes modifiées.
- La migration SQL **toujours non activée** prépare un index UNIQUE sur les noms normalisés et crée les tables de contexte et d'audit si absentes. **Il manque toujours** son branchement au pipeline versionné, la validation des anciennes colonnes, Prisma, les lecteurs monoéquipe, les routes d'écriture et le test sur une base réelle.
- Le fichier `tests/smn-282-team-write.test.ts` contient **8 scénarios supplémentaires** avec faux client PostgreSQL : création sans produit, garde v27, refus Admin, homonymie, conflit de révision, retrait de produit, rollback, liaison produit, protection interinstallation. Ils **n'ont pas été exécutés** ici. Le nombre exact de cas doit être vérifié lors de `pnpm test` : le comptage des cas n'est pas une preuve d'exécution.

