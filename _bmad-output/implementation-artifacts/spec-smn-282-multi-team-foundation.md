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

## Étape 3 — Migration versionnée v28 et diagnostic coordonné (26/10/2026)

**Éléments effectivement codés sur la branche (non déployés) :**

- `src/server/teams/migration.ts` et `prisma/migrations/20261026_smn282_multi_teams/migration.sql` : SQL strictement identique (vérification statique effectuée) ; suppression des anciennes unicités par installation, produit facultatif, produit à propriétaire unique, liaison équipe–produit dans la même installation, unicité des noms normalisés, tables contexte/audit, passage de `schema_version=27` à **28**.
- `prisma/schema.prisma` : installations possédant plusieurs équipes et produits ; lien produit facultatif, unique pour une équipe.
- `src/server/accounts/migration.ts` : la version 28 est reconnue **uniquement** si l'historique et les contraintes d'intégrité sont vérifiés ; la migration identitaire v27 demeure contrôlée en v28, et **aucune application automatique du SQL v28 à l'authentification**.
- `src/server/db/probe.ts` et `src/server/installation/diagnostic.ts` : lecture seule de **28** entrées du journal au maximum ; vérification du checksum v28, des deux tables de contexte, de la nullabilité du produit et des index/contraintes, sans autorisation de tables étrangères.
- `scripts/apply-multi-team-migration.ts` : commande **manuelle** exigeant `--apply` et un fichier de sauvegarde non vide, vérifiant l'état v27 et les 27 migrations, transaction + verrou, enregistrement du checksum SQL et diagnostic final. Elle **n'a pas été lancée**.
- `tests/auth-schema-v27.test.ts` et `tests/smn-282-schema-v28.test.ts` : contrôles de compatibilité v27/v28, refus de v28 sans intégrité, égalité SQL source/fichier, conformité Prisma, exécution manuelle uniquement.

**Vérifications réellement réalisées :** 11 contrôles **statiques de cohérence des fichiers GitHub** ont réussi (SQL identique, v28 dans auth/diagnostic/probe, Prisma et sauvegarde, pas de migration automatique). Ceci ne constitue **ni** un build Next.js **ni** un test PostgreSQL réel. L'environnement disponible possède Node.js 22 et pas de `pnpm`, de clone SMN ni de base PostgreSQL : les tests du projet, `prisma validate`, `tsc`, `pnpm build` et l'application SQL v28 **ne sont pas exécutés**.

**Activation interdite** jusqu'à la correction des consommateurs monoéquipe (dashboard, capacités, calendriers, registres, rapports, API/exports), l'isolation des requêtes par `teamId` et la validation de la migration sur une copie sauvegardée. Les comptes de rôle `user` déjà présents sont hors arbitrage et **ne sont pas modifiés**.

**Prochaine étape :** interface Paramètres > Équipes, routes d'écriture réservées à Admin et adaptation du contexte serveur/sélecteur, en gardant les écritures bloquées tant que la migration n'est pas qualifiée.

## Étape 4 — Page Paramètres > Équipes et API contrôlée (26/10/2026)

**Code ajouté/actualisé sur la branche, non fusionné :**
- `src/lib/settings-catalog.ts` : nouvelle entrée **Équipes** dans le groupe Organisation Agile (lien `/app/admin/settings/teams`), **statut partial** pendant le chantier.
- `src/app/app/admin/settings/teams/page.tsx` : nouvelle page serveur, accessible seulement après session `admin` autorisée, avec retour vers Paramètres.
- `src/app/app/admin/settings/teams/teams-settings.tsx` : liste d'équipes, création/édition des **quatre champs validés** (seul nom d'équipe requis), alertes, sélection locale, confirmation avant abandon d'un formulaire modifié, absence de produit, responsive Bootstrap et retour d'enregistrement sans changer l'équipe active globale.
- `src/app/api/admin/teams/route.ts` : GET filtré par installation ; POST/PATCH raccordés aux services transactionnels. Autorisation `admin` relue côté serveur, corps JSON plafonné, contrôle d'appartenance, conflits/erreurs adaptés.
- `src/i18n/fr.json` et `src/i18n/en.json` : messages de page, validation, erreurs et menu centralisés et de mêmes clés.
- `tests/smn-282-team-settings.test.ts` : tests de contrat du routage, des champs, des clés i18n et des garde-fous de l'API.

**Mesure de sécurité de l'étape :** les écritures sur `/api/admin/teams` sont **désactivées par défaut indépendamment de la migration**, derrière la condition serveur `SMN_MULTI_TEAM_WRITES_ENABLED==="true"`, et les services réexigent par ailleurs le schéma v28. Le GET retourne `canWrite=false` tant que ces deux conditions ne sont pas remplies, et la page affiche un état honnête en lecture seule. **Ne pas activer ce paramètre** avant d'avoir fini l'isolation et les tests des consommateurs métier multiéquipes. Aucune configuration d'environnement ni secret n'a été modifié ou publié.

**Contrôles réels effectués :** 11 vérifications statiques depuis les fichiers GitHub (correspondance FR/EN, menu, formulaire, sécurité et garde v28) ont réussi. Les tests `tests/smn-282-team-settings.test.ts` sont **ajoutés mais non exécutés** ; aucun build Next.js, contrôle TypeScript du projet, migration SQL ni essai navigateur n'a été exécuté ici.

**Limites :** éditeur historique `TeamContextEditor` exige toujours un produit obligatoire et devra être harmonisé ; choix d'équipe global, cycles Scrum/Kanban, propagation des contextes sur les autres services, garde des brouillons au changement global et droits `user` restent à traiter. La Story n'est ni terminée ni prête à fusionner.

**Prochaine étape :** sélecteur global réellement contextualisé par `teamId`, choix du cycle et bascule de rubrique, en conservant toutes les écritures d'équipes bloquées jusqu'à la validation complète.
