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

## Étape 5 — Préférence d'équipe et sélecteur global préparés (26/10/2026)

**Code créé dans la PR #189 (branche non fusionnée) :**

- `src/server/teams/migration.ts`, `prisma/migrations/20261026_smn282_multi_teams/migration.sql`, `prisma/schema.prisma` : nouvelle table `smn_account_team_preference` (une ligne par compte) avec double clé étrangère de **même installation** pour le compte et l'équipe. Les préférences historiques sont initialisées **pour les administrateurs uniquement** lors de la migration monoéquipe ; aucune attribution de droit aux comptes `user`. Le checksum v28 est recalculé à partir du même SQL que le fichier de migration.
- `src/server/teams/active.ts` : lecture et modification transactionnelle de la préférence de l'administrateur actif. Le `teamId` est revalidé contre les équipes appartenant à **son installation**. La préférence ne vaut jamais droit d'accès, et les comptes `user` ne sont pas servis par ce mécanisme.
- `src/app/api/admin/teams/active/route.ts` : GET et PUT de la préférence réservés à l'Admin, origine/JSON contrôlés. **PUT fermé par le verrou d'activation globale** tant que les consommateurs monoéquipe ne sont pas qualifiés.
- `src/lib/team-navigation.ts` : plan de repli vers la rubrique parent (Registres, membres, calendrier, rapports, Sprints Scrum, Paramètres) sans réutiliser l'ancien ID d'objet, de cycle, de rapport, ni ses filtres.
- `src/app/app/active-team-selector.tsx`, `src/app/app/private-shell.tsx`, `src/app/app/layout.tsx` : sélecteur d'équipe préparé dans l'en-tête, avec chargement des options autorisées et changement contextuel prévu. **Le composant est actuellement désactivé pour tous** : le verrou `MULTI_TEAM_CONTEXT_READY:boolean=false` dans `src/lib/team-context-readiness.ts` ne peut pas être activé par variable d'environnement. Il devra être retiré **après** adaptation et tests des requêtes dashboard/Scrum/Kanban/rapports.
- `src/server/accounts/migration.ts`, `src/server/db/probe.ts` et `src/server/installation/diagnostic.ts` : v28 vérifie également la table de préférence et les nouvelles contraintes d'installation.
- `src/i18n/fr.json` et `src/i18n/en.json` : messages du sélecteur. Les formulaires Équipes et l'éditeur historique exposent `data-smn-unsaved-changes` pour signaler un brouillon. Il faut généraliser cette protection aux **autres** formulaires avant activation globale.
- `tests/smn-282-team-active.test.ts`, `tests/smn-282-team-navigation.test.ts`, `tests/smn-282-team-context-stage.test.ts` : nouveaux tests source du service, du repli, de l'isolation et du verrou d'activation.

**Vérification réellement exécutée :** 14 contrôles **statiques** de concordance des fichiers sur la branche (SQL source/versionné identiques, contraintes composées, sécurité des comptes, verrou côté API/layout, i18n, diagnostic). Tous ont réussi. **Aucun** `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, test PostgreSQL, recette navigateur ou migration exécuté ici. Les tests sources ajoutés ne constituent pas une preuve de réussite.

**Non livré à cette étape :**
1. Adaptation de `src/server/dashboard/read.ts`, `src/app/app/page.tsx` et `src/app/api/sprints/context/route.ts` qui supposent toujours une seule équipe, ainsi que toutes les autres pages et API métier/exports.
2. Sélecteur de périodes Kanban et choix d'un cycle valide appartenant à l'équipe après bascule (les règles de sélection sont connues, non raccordées).
3. Priorité des URL directes historiques et contrôle de propriété des snapshots/rapports ; gestion des chargements concurrents entre onglets.
4. Protection des brouillons de **tous** les formulaires contextuels, pas uniquement des deux éditeurs signalés.
5. Validation PostgreSQL v28/Prisma/tests sur une copie de base. Le schéma Prisma doit être confronté aux clés étrangères composées du DDL lors de cette validation.
6. Sort des comptes `user` préexistants : **décision volontairement différée** par le Product Owner. Ne pas attribuer de nouveaux droits par déduction.

**Consigne absolue :** `MULTI_TEAM_CONTEXT_READY` reste à `false`, `SMN_MULTI_TEAM_WRITES_ENABLED` reste désactivé ; ne pas fusionner la PR ou lancer la migration tant que les protections et tests requis ne sont pas vérifiés.

## Étape 6 — Lectures contextuelles v28 préparées (partie 1, 26/10/2026)

**Code développé sur la branche, pas encore livré ni activé :**

1. `src/server/teams/resolve.ts` : résolution `teamId` sécurisée pour le compte **Admin** actif de la même installation en v28. Un `teamId` d'URL explicitement autorisé prime sur la préférence mémorisée. Identifiants invalides ou équipe étrangère refusés. Un `user` en v28 reste volontairement refusé tant que son modèle d'habilitations n'est pas arbitré.
2. `src/server/dashboard/read.ts` et `src/lib/collective-projection.ts` : contexte dashboard multiéquipes avec équipe sans produit, lecteur par compte et mode v27 préservé. **Le lecteur historique monoéquipe refuse tout schéma v28** pour empêcher l'exposition accidentelle d'un premier enregistrement.
3. `src/app/app/layout.tsx`, `src/app/app/page.tsx` : contexte calculé par compte et, sur le tableau de bord, selon l'URL explicite validée. Un `cycleId` demandé n'appartenant pas à l'équipe est rejeté plutôt que substitué.
4. `src/app/api/sprints/context/route.ts` : route des Sprints avec contexte Admin v28 et isolation par `teamId`, tout en conservant le comportement v27 et sans choix arbitraire de première équipe. `src/server/sprints/context.ts` était déjà filtré par `teamId`.
5. `src/lib/kanban-context.ts`, `src/server/kanban/context.ts`, `src/app/api/kanban/context/route.ts` : choix temporel de période Kanban propre à l'équipe, consultation **sans DDL ni mutation**, API v28 Admin uniquement ; période en cours > prochaine > dernière disponible, absence de périodes = état vide.
6. `src/app/app/private-shell.tsx` : options de cycle préparées pour Scrum et Kanban ; le sélecteur multiéquipes demeure **désactivé**. `src/app/app/admin/registries/page.tsx` : sélection du `teamId` via résolution autorisée, plus de première équipe implicite.
7. Tests sources ajoutés : `tests/smn-282-team-dashboard-context.test.ts`, `tests/smn-282-kanban-context.test.ts` et `tests/smn-282-stage6-isolation.test.ts`.

**Vérification effective :** 15 vérifications **statiques** de cohérence des fichiers via le connecteur GitHub ont réussi (rôle Admin, installation, équipe demandée, anciens lecteurs refusant v28, cycle hors équipe, Kanban sans DDL, contexte Registres, verrou toujours fermé, présence des tests). Ce ne sont **pas** des tests runtime. Aucun `pnpm test`, `pnpm typecheck`, `pnpm build`, Prisma, migration SQL ou recette navigateur n'a été exécuté dans cette étape.

**Étape 6 encore incomplète — blocages explicites avant activation :**
- Les écrans Calendrier et Membres ainsi que leurs API de capacités et d'absences continuent à résoudre implicitement la seule équipe de l'installation ; ils doivent recevoir un contexte `teamId` résolu côté serveur avant toute activation.
- Les pages et producteurs de **rapports et exports** ne sont pas tous filtrés par une équipe autorisée ; le centre de rapports est encore à auditer pour éviter la visibilité croisée.
- Le registre listé est contextualisé, mais **tous ses endpoints/détails** doivent encore être contrôlés avant de déclarer ce domaine conforme.
- Les services de création de Sprint/période Kanban et les autres endpoints d'écriture supposent encore une équipe unique : ne pas les mettre en production en v28 avant refonte de leur portée.
- Le contexte explicite des liens historiques doit être synchronisé avec le sélecteur global et les préférences **après** autorisation ; la protection des brouillons doit couvrir tous les formulaires, pas seulement ceux déjà signalés.
- Les droits des comptes `user` préexistants ne sont **pas** migrés ni devinés, comme l'a demandé le PO.

**Consignes maintenues :** `MULTI_TEAM_CONTEXT_READY:boolean=false`, `SMN_MULTI_TEAM_WRITES_ENABLED` inactif, pas de migration réelle, pas de fusion `main`. **Cette étape est une progression d'implémentation partielle, pas un achèvement de SMN-282.**

## Étape 6A — Membres, capacités, absences et calendrier : lectures principales (26/10/2026)

**Implémentation réalisée sur la branche, sans déploiement ni migration :**

- **Membres** : `src/server/members/quick-create.ts` ajoute le filtrage v28 des personnes et de leurs rôles via les affectations de **l'équipe sélectionnée**, y compris le sous-select latéral ; les anciens services monoéquipe restent fermés en v28. `GET /api/admin/members` vérifie l'Admin et `teamId` auprès de `resolveAdminTeam` en v28. Les pages `/app/admin/members` et `team-overview.tsx` propagent l'équipe de l'URL jusqu'au chargement de la liste.
- **Capacité prévisionnelle** : `readDevelopmentCapacity` accepte `options.teamId` explicitement en v28 et filtre toutes les affectations et calculs associés à cet identifiant ; l'ancien chemin sans `teamId` refuse v28. `GET /api/admin/development-capacity` résout d'abord le compte, le rôle Admin et l'équipe autorisée, puis transmet le contexte à la lecture. Les paramètres `start/end/teamId` sont contrôlés.
- **Protection des autres capacités** : `POST /api/admin/development-capacity` (révision/override) et les parcours anciens GET/POST de capacité réelle refusent v28 tant que leur isolation transactionnelle n'a pas été achevée. L'absence de réponse en v28 est intentionnelle : **pas de lecture globale ni d'écriture implicite**.
- **Calendrier collectif et absences** : `readTeamCalendar` reçoit une équipe autorisée en v28 ; affectations, absences des membres affectés, calendriers individuels, fermetures et agrégats restent construits **à partir des membres de cette seule équipe**. La route `GET /api/team-calendar` résout l'équipe auprès du serveur pour l'Admin, refuse un chemin v28 utilisateur non arbitré, et conserve le comportement historique v27.
- **Périodes et réunions** : les routes `/api/team-calendar/periods` et `/api/team-calendar/meetings` ajoutent un branchement v28 : périodes Sprint/Kanban et cérémonies Scrum filtrées par `teamId`. Une lecture `listScopedKanbanCalendarMeetings` **sans DDL** a été ajoutée. Les chemins v27 sont conservés.
- **Vue Calendrier** : `src/app/app/team-calendar/page.tsx` et `team-calendar-view.tsx` transmettent le `teamId` de l'URL à la lecture des périodes, réunions, agrégats et membres ; `key` spécifique à l'équipe provoque le remontage du composant à chaque bascule et évite le maintien de l'ancien état local. Un cycle explicitement indiqué mais absent de la liste de l'équipe cible est refusé.
- **Tests ajoutés** : `tests/smn-282-lot-6a-scoping.test.ts` contient des scénarios simulés et des contrats statiques pour les affectations, capacités, lecteurs historiques et calendrier. **Leur exécution réelle n'a pas été effectuée.**

**Vérifications effectivement exécutées** : 19 vérifications **statiques**, toutes concluantes, portant sur les gardes de schéma, l'équipe en SQL, l'autorisation serveur, les trois lectures du calendrier, la propagation du `teamId`, les blocages de capacité et le verrou `MULTI_TEAM_CONTEXT_READY:boolean=false`. Pas d'exécution de `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, ni de tests PostgreSQL/réels en navigateur ; aucun SQL appliqué.

**À poursuivre sans considérer le lot 6A totalement qualifié** :
1. **Absences et fiches individuelles** : contrôler la propriété équipe à l'entrée de **toutes** les routes de détail du membre, de ses absences, calendriers, historiques, identités, localisations et affectations ; à ce stade les lectures agrégées du calendrier sont contextualisées, pas chaque endpoint individuel.
2. **Mutations métier** : adapter les écritures et historiques des capacités réelles, absences, affectations et réunions, ou conserver leur refus explicite en v28.
3. **Autres services consommateurs** : auditer les lecteurs de capacité initiale/historique, calendriers des événements et dépendances de la page membres qui supposent une seule équipe.
4. **Contrôles d'exécution** : tests avec deux équipes dont les membres/dates diffèrent, accès interéquipes, rétrocompatibilité v27, intégrité SQL et validation React/TypeScript sur le projet complet.

**Aucune activation** : garde globale toujours à `false`, écritures d'équipes désactivées, migration v28 non appliquée, PR #189 en brouillon sur sa branche. Les droits des comptes `user` existants restent une décision explicitement reportée par le Product Owner. Ne pas créer d'habilitation implicite.

## Étape 6A — Fiches individuelles et mutations historiques protégées (26/10/2026)

**Objectif de cette tranche : sécuriser immédiatement les anciens endpoints non contextualisés avant toute activation v28**, tout en conservant leur fonctionnement en version 27.

### Services ajoutés
- `src/server/members/team-scope.ts` : `assertLegacyMemberApi` et `withLegacyMemberApi` — refus explicite d'un schéma absent/inconnu/v28+, AVANT toute lecture ou mutation des anciennes routes individuelles. `requireTeamMemberScope` prépare le nouveau contrôle de propriété par **Admin + installation + affectation active** ; un ID membre isolé n'est jamais une autorisation.
- `src/server/teams/legacy.ts` : `assertLegacyTeamApi` / `withLegacyTeamApi` ; même mécanisme « fail-closed » pour les anciens lecteurs/mutations d'équipe encore implicitement monoéquipe.

### Endpoints branchés
**9 endpoints fichiers individuels** (GET/POST/PUT/PATCH selon la route) : `/api/admin/members/[id]`, `/[id]/absences`, `/[id]/calendar`, `/[id]/assignment`, `/[id]/assignment/start-date`, `/[id]/history`, `/[id]/identity`, `/[id]/location`, `/[id]/lifecycle`.

**8 endpoints fichiers collectifs / capacités** : `/api/admin/capacity-openings`, `/api/admin/capacity-history`, `/api/admin/capacity-replanning`, `/api/admin/team-context`, `/api/admin/company-closures`, `/api/admin/kanban-meetings`, `/api/team-calendar/meetings/[kind]/[id]` et `/outcomes`.

Ces routes refusent désormais toute consultation/écriture en v28, tant que leurs données ne peuvent pas être correctement filtrées et historisées par équipe. Les anciennes routes GET membres, capacité prévue, calendrier collectif et réunions agrégées **déjà contextualisées** lors de la première tranche 6A conservent leurs traitements distincts.

### Vérifications réelles
- **24 contrôles statiques**, tous réussis (présence des wrappers dans les 17 fichiers, absence d'appel direct `withAuthDb` dans ces fichiers, guards v27/v28, vérification d'installation/affectation, sélecteur toujours bloqué).
- Nouveau fichier `tests/smn-282-lot-6a-individual-guards.test.ts` avec scénarios pour compatibilité v27, refus v28 et structures absentes, ID forgé, rôle `user`, affectation manquante et vérification des routes. **Tests écrits mais pas exécutés**.
- `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, essais PostgreSQL v28 et recette navigateur **non exécutés**.

### Limites à lever pour terminer le lot 6A
1. **Données personnelles par équipe** : une affectation actuelle ne suffit pas à filtrer correctement les absences et événements historiques d'un membre ; les endpoints individuels doivent être redéveloppés avec filtrage temporel et propriété équipe avant d'être ouverts en v28.
2. Capacités réelles, ouvertures, corrections, replanifications et mutations des absences/calendriers/affectations : services métiers à contextualiser transactionnellement et à vérifier avec deux équipes distinctes.
3. Réunions et fermetures d'entreprise : détail, actions et historiques à filtrer par équipe, avec liens directs sécurisés.
4. Les tests du dépôt, le build, la migration v28 sur **copie sauvegardée** et la recette doivent être réellement exécutés avant l'activation.
5. Les droits des comptes `user` préexistants restent **volontairement non arbitrés**, aucun accès aux nouvelles équipes n'est accordé implicitement.

**Verrous :** `MULTI_TEAM_CONTEXT_READY=false` et écritures d'équipes désactivées par défaut. La PR #189 reste en brouillon, aucune migration ni fusion ni mise en production à cette étape. Cette tranche relève de la **sécurisation**, pas de la livraison complète des fiches individuelles multiéquipes.

## Étape 6A — Consultations historiques bornées en v28 (26/10/2026)

**Nouvelles lectures v28 ajoutées sur la branche uniquement :**

- `src/server/members/team-availability-window.ts` et `GET /api/admin/members/[id]/team-availability` : plage explicite `teamId/startOn/endOn` d'au plus **31 jours** ; vérification du rôle Admin et de l'appartenance de l'équipe à la même installation via `resolveAdminTeam`. Les dates retournées appartiennent individuellement à une affectation du membre **dans l'équipe demandée**. Les demi-journées d'absence sont agrégées par jour ; les motifs, catégories personnelles, autres équipes, anciens objets globaux et journées hors affectation **ne sont jamais retournés**. Les absences marquées comme supprimées par l'historique restent exclues. Si la personne n'a aucune affectation dans l'intervalle, refus sans divulgation.
- `src/server/members/team-assignment-history.ts` et `GET /api/admin/members/[id]/team-assignment-history` : lecture **seulement des versions d'affectation** appartenant à l'équipe autorisée, jointes aux identifiants de l'affectation et à l'installation. Limite 500 versions ; aucun historique d'identité, d'absence brute ou de cycle de vie personnel. Même un membre désormais affecté ailleurs ne permet pas d'obtenir des versions étrangères par simple ID.
- `tests/smn-282-team-availability-window.test.ts` (5 scénarios) et `tests/smn-282-team-assignment-history.test.ts` (3 scénarios) : limites de dates, absence de motif, appartenance équipe et installation, priorité de l'URL explicite, rôle `user` refusé, IDs forgés, refus d'absence d'affectation.
- Les **anciennes API individuelles** `/[id]/absences` et `/[id]/history` restent protégées par `withLegacyMemberApi` : **fermées en v28**. Cette nouvelle lecture volontairement minimale ne les réactive pas et ne prétend pas reproduire les fiches personnelles complètes.

**Contrôles effectués :** 17 contrôles statiques sur les sources GitHub ont réussi, notamment limitation de la fenêtre, filtrage SQL par membre/équipe/période, absence de retour des motifs, endpoints GET uniquement, refus des comptes `user`, gardes historiques et sélecteur global fermé. Les 8 tests sont **écrits mais non exécutés** ; la compilation du dépôt, la validation Prisma, le build, les tests PostgreSQL et la recette n'ont **pas été exécutés**.

**Limites de cette tranche :**
1. Les données d'absence renvoyées correspondent à l'état actuel de l'enregistrement lorsqu'elles concernent un jour historiquement affecté à l'équipe, **pas à une reconstruction temporelle complète « état connu à telle date de consultation »**. Les audits d'identité, de motif ou de cycle de vie personnels restent fermés en v28.
2. Les modifications d'absence, de capacité réelle, d'affectation et de réunion restent **désactivées en v28** jusqu'à la conception des écritures transactionnelles isolées.
3. Les nouveaux endpoints ne sont pas encore câblés dans une fiche membre utilisable en v28 ; il faut concevoir une présentation qui n'affiche jamais d'informations hors équipe.
4. Tests réels avec deux équipes, recoupements temporels, révocation et changement de session, vérification de l'intégrité et migration v28 sur copie sauvegardée restent indispensables.

**Aucune activation / aucun déploiement :** `MULTI_TEAM_CONTEXT_READY=false`, écritures équipes désactivées, base non migrée, PR #189 en brouillon. Le sort des comptes `user` existants reste reporté conformément au Product Owner.

## Étape 6A — Fiche membre v28 en lecture seule branchée sur l'équipe (26/10/2026)

**Livrables codés sur la branche de la PR #189, sans activation générale ni migration :**

- `src/app/app/admin/members/[id]/page.tsx` choisit explicitement le chemin **v27 historique** ou le chemin **v28** après vérification de `schema_version`. En v28, seuls les administrateurs autorisés peuvent ouvrir une fiche ; le serveur résout l'équipe via l'URL ou la préférence, contrôle l'**appartenance historique** du membre à cette équipe via ses affectations, puis lit seulement son nom et les versions d'affectation correspondant à l'équipe. Un ID de membre étranger ou une équipe incohérente donne un état « introuvable » et **ne retombe jamais sur la fiche v27**.
- `src/app/app/admin/members/[id]/member-team-read-only.tsx` : vue Bootstrap dédiée, **sans commandes de modification**, affichant les révisions d'affectation et une sélection de mois pour les seules demi-journées d'absence pendant les jours d'affectation à l'équipe. Les requêtes client sont annulées à la désactivation et les réponses dont `memberId`, `teamId` ou les dates ne correspondent pas au contexte sont rejetées.
- `src/app/app/admin/members/team-overview.tsx` : liens des cartes et de la liste transportent désormais `teamId` vers le détail. Aucun `cycleId` ni ID historique de l'ancienne équipe n'est recopié lors d'une bascule.
- Sous-catalogues `src/i18n/member-team-scope.fr.json` et `member-team-scope.en.json` (21 clés identiques), référencés par `src/i18n/catalog.ts`, dans le mécanisme de traduction typé FR/EN existant.
- `tests/smn-282-member-team-read-only.test.ts` : 5 tests source écrits pour la séparation v27/v28, la propriété membre–équipe, la navigation contextuelle, l'absence d'éditeurs et les traductions.

**Vérification effectivement exécutée :** 18 **contrôles statiques** des fichiers publiés sur GitHub réussis, notamment clés FR/EN, appartenance SQL, URLs, absence de mutation dans la nouvelle vue, absence de repli vers un lecteur non sécurisé, garde de l'ancienne API et verrou du sélecteur. Ces contrôles ne remplacent **pas** l'exécution des 5 tests source ni une compilation TypeScript/React. Aucun `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, test PostgreSQL, migration ou recette navigateur exécuté lors de cette tranche.

**Limites impératives :** cette fiche v28 est une **projection réduite de consultation**, pas la fiche individuelle complète. Les motifs personnels, historique d'identité et de cycle de vie, modifications des affectations, absences, calendriers, réunions et capacités réelles sont encore indisponibles en v28. Il faudra établir des contrats de mutation transactionnels contextualisés, contrôler les recouvrements temporels entre équipes et exécuter les tests réels avant de lever les verrous. **Les comptes `user` existants restent hors arbitrage**, aucune habilitation implicite.

**État :** `MULTI_TEAM_CONTEXT_READY=false`; écritures multiéquipes désactivées ; base v28 non migrée ; PR #189 en brouillon et non fusionnée.

## Étape 6A — Mutation transactionnelle des révisions d'affectation en v28 (27/10/2026)

**Développement réellement effectué dans la PR #189, sans activation :**

- `src/server/members/team-assignment-write.ts` : `saveTeamAssignmentRevision`, transaction PostgreSQL dédiée à la **révision d'une affectation existante et ouverte** dans l'équipe Admin explicitement autorisée. Utilise le parseur validé `parseAssignmentInput` (8 champs, parts Agile totalisant 100 %, pourcentages de capacité contrôlés, date ISO, révision initiale ≥1).
- Validation dans la transaction de l'**acteur Admin actif** et de `teamId` via `resolveAdminTeam` sur la même installation v28. Verrouillage des lignes membre et affectation (`FOR UPDATE`), refus des membres archivés et des affectations absentes ou closes, refus d'une date passée, antérieure au début de l'affectation ou à la dernière version.
- Lecture de la dernière révision de `smn_member_assignment_version` et contrôle optimiste ; insertion **append-only** d'une nouvelle version avec `created_by`. `COMMIT` en réussite, `ROLLBACK` en cas de conflit ou d'erreur. **Aucune** création ou mutation destructive d'affectation, aucun changement d'équipe implicite.
- `src/app/api/admin/members/[id]/team-assignment/route.ts` : nouveau POST réservé à Admin, origine contrôlée par `authorizeApi`, JSON strict, erreurs traduites en statuts HTTP. L'endpoint vérifie le **verrou de livraison `MULTI_TEAM_CONTEXT_READY=false` avant tout accès DB**, donc ne permet pas encore de modification réelle, même si une base v28 existe.
- L'ancien `POST /api/admin/members/[id]/assignment` reste entouré de `withLegacyMemberApi` et **refusé en v28** pour éviter une mutation non contextualisée.
- `tests/smn-282-team-assignment-write.test.ts` : 7 scénarios simulés couvrant transaction, acteur Admin, appartenance, dates, conflit de révision, absence d'affectation, archivage et rollback. `tests/smn-282-team-assignment-route.test.ts` : 4 contrats statiques du verrou HTTP et de l'historique append-only.

**Vérifications réellement effectuées :** 17 contrôles **statiques** de cohérence sur les fichiers présents sur GitHub (validation des entrées, droits Admin, portée d'équipe, verrouillage SQL, révisions, dates, rollback, append-only, verrou de route et conservation de la garde historique). **Aucune exécution de tests du dépôt**, `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, ni tests PostgreSQL ou navigateur. Les 11 scénarios de tests ajoutés sont **écrits, non exécutés**.

**À faire avant activation de cette mutation :** tests PostgreSQL réels avec deux équipes et affectations simultanées, concurrence entre deux mises à jour, contrôle des sommes de capacités transversales si plusieurs équipes sont possibles pour une personne, revues des anciens consommateurs des versions et d'impact sur les calculs, protection des formulaires non enregistrés et validation des droits historiques. Les créations/fermetures/transferts d'affectation et les mutations d'absences, capacités réelles et réunions ne sont pas couverts dans cette tranche.

**Sécurité générale inchangée :** sélecteur toujours verrouillé, écriture des équipes désactivée par défaut, migration v28 non appliquée, PR draft non fusionnée. Sort des comptes `user` existants maintenu en décision reportée, sans attribution implicite.

## Étape 6A — Mutations d'absences à périmètre d'équipe exclusif (27/10/2026)

**Implémentation versionnée uniquement sur la PR #189, non activée :**

- `src/server/members/absence.ts` : ajout d'un paramètre facultatif `scope={actor,teamId}` à `saveMemberAbsence`. Le parcours legacy sans ce paramètre conserve ses validations et son audit v27, derrière `withLegacyMemberApi`. En mode v28, la même transaction commence par vérifier `resolveAdminTeam` pour le rôle Admin, l'installation et `teamId`, puis verrouille la fiche membre et les affectations concernées.
- **Arbitrage conservateur d'intégrité :** une absence est **personnelle**, elle n'appartient pas directement à une équipe. Pour créer, modifier ou supprimer logiquement une absence depuis l'équipe cible, **la période entière doit être couverte par une affectation de cette équipe et aucune affectation d'une autre équipe ne doit croiser le moindre jour de la période**. En modification, ce contrôle s'applique à la période d'origine **et** à la nouvelle période ; en suppression logique, à l'ancienne période. Les affectations sont verrouillées par `FOR SHARE OF a` sous verrou du membre. Si la couverture n'est pas exclusive, `team-unavailable` et rollback : **aucun effet de bord sur une autre équipe**, au prix de refuser temporairement des cas légitimes de chevauchement multiéquipes qui devront faire l'objet d'une conception dédiée.
- Règles existantes conservées : validation stricte des champs et motifs, distinction matin/après-midi, conflits de demi-journées, catégories actives, versions optimistes, membre non archivé et historique `smn_member_absence_history`. Une suppression marque `deleted:true` dans l'audit append-only ; aucune suppression SQL destructive.
- `src/app/api/admin/members/[id]/team-absence/route.ts` : POST distinct, rôle Admin, origine et JSON strict contrôlés. Corps `{teamId,change}` ; le membre vient exclusivement du chemin. **La route retourne 503 avant tout appel DB** quand `MULTI_TEAM_CONTEXT_READY=false`. L'ancien endpoint `/[id]/absences` demeure **fermé en v28**.
- `tests/smn-282-team-absence-create.test.ts` : **14 scénarios** source, dont création, périodes d'équipe non couvertes, chevauchements interéquipes, demi-journées, modification des dates anciennes/nouvelles, conflits de révision, archivage, tombstone, refus du rôle `user` et rollback après erreur d'audit. `tests/smn-282-team-absence-route.test.ts` : **3 scénarios** de contrat, verrou HTTP et compatibilité legacy.

**Contrôles réellement exécutés :** **22 contrôles statiques** de concordance des fichiers GitHub passés (verrous, résolution Admin dans la transaction, ancienne et nouvelle plage, exclusion des autres équipes, validation historique, absence de DELETE, API POST seule et verrou global). Les **17 tests sont ajoutés, mais n'ont pas été exécutés** : aucun `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, essai PostgreSQL réel, migration SQL ou recette navigateur.

**Limites explicites et prochaines actions :**
1. Le périmètre exclusif refuse volontairement toute modification d'une absence pendant des affectations simultanées dans deux équipes. Un workflow interéquipes spécifique nécessitera un arbitrage fonctionnel et des règles d'habilitation propres.
2. Une personne affectée à des périodes successives dans deux équipes ne peut faire modifier depuis l'une d'elles une absence qui traverse la date de transfert ; préserver cette garantie d'intégrité avant toute extension.
3. Le bouton d'édition de la fiche membre v28 reste absent : service et API d'absence **non activés** tant que les tests d'intégration, transactions concurrentes et calculs de capacités ne sont pas qualifiés.
4. Les mutations de capacité réelle, de réunions et les lots 6B (registres, rapports/exports), 6C (sécurité et tests globaux) sont encore en attente.

**État inchangé :** `MULTI_TEAM_CONTEXT_READY=false`, `SMN_MULTI_TEAM_WRITES_ENABLED` désactivé par défaut, migration v28 non exécutée, PR #189 non fusionnée. Les comptes `user` historiques restent un sujet reporté.

## Étape 6A — Capacité réelle par équipe : lecture contextualisée et correction verrouillée (27/10/2026)

**Implémentation publiée uniquement dans la PR #189 (non fusionnée) :**

- **Lecture calculée v28** : `src/server/capacity/actual.ts` accepte une option `teamId` explicite pour un schéma **v28** et la transmet au moteur `readDevelopmentCapacity` ; les lignes de période, valeurs manuelles et snapshots initiaux/clôturés restent lus **par identifiant d'équipe**. Le lecteur historique sans `teamId` ne peut plus lire un schéma v28 (`schema_version<=27`). Pour une période close, le lecteur conserve le **snapshot figé** sans recalcul depuis des absences nouvelles.
- `GET /api/admin/capacity-actual` : en v28, rôle **Admin**, autorisation et installation vérifiées via `resolveAdminTeam`, `teamId` explicite ou préférence contrôlée, puis lecture de capacité réelle de cette équipe. Les périodes v27 conservent l'API historique. Le `POST` historique reste bloqué en v28 pour éviter une écriture non contextualisée.
- **Correction transactionnelle v28** : `src/server/capacity/team-actual-write.ts` implémente `saveTeamActualCapacity`, saisie ou effacement d'une valeur manuelle en J/H, en réutilisant `parseActualChange` (validation précise des dates, J/H et révision). `BEGIN`, résolution de l'Admin et de l'équipe, verrou `FOR UPDATE` sur l'équipe pour sérialiser les premières créations, verrou sur la période et la valeur existantes, refus des périodes **futures**, **figées** ou **clôturées**, puis contrôle de révision optimiste. Les écritures n'altèrent ni les snapshots ni la capacité calculée : elles modifient seulement `smn_capacity_actual_override` et insèrent une ligne append-only `smn_capacity_actual_override_history` avec acteur, valeur précédente, nouvelle valeur et opération.
- `POST /api/admin/team-capacity-actual` : route dédiée à l'Admin, JSON strict `{teamId,change}` et origine/permissions contrôlées. **Le verrou `MULTI_TEAM_CONTEXT_READY=false` est testé avant tout accès à PostgreSQL : impossible de modifier la capacité réelle v28 sur une installation normale à cette étape**. L'ancienne route de modification ne change pas son comportement v27.
- **Tests sources ajoutés** : `tests/smn-282-team-capacity-actual-write.test.ts` (7 scénarios : création, modification, effacement, clôture/figement, conflit, futur, absence d'équipe, rollback, rôle `user`) ; `tests/smn-282-team-capacity-actual-read.test.ts` (3 scénarios : calcul limité à l'équipe, snapshot figé, refus d'un moteur renvoyant une autre équipe) ; `tests/smn-282-team-capacity-actual-route.test.ts` (4 contrats des routes et garde-fous).

**Contrôles réellement effectués :** **22 contrôles statiques** du contenu GitHub, tous réussis (portée v28, compatibilité v27, priorité manuelle, snapshots protégés, verrous, audit, révision et fermeture POST). **Les 14 tests ont été écrits mais non exécutés**. Aucune exécution de `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, migration ou requête PostgreSQL réelle ; pas de recette navigateur.

**Limites et prochaines étapes obligatoires :**
1. Les **clôtures** et **ouvertures** de périodes en v28 ne sont pas adaptées ici ; leurs parcours monoéquipe restent protégés et ne doivent pas être activés. Vérifier les connexions aux indicateurs Sprint et dashboards, notamment après changement d'équipe.
2. Tests transactionnels réels avec deux équipes, valeurs manuelles différentes, corrections concurrentes, snapshots déjà clôturés, révisions et historiques ; contrôler l'absence de fuite interéquipes.
3. Adapter les écritures et historiques des **réunions/événements** avant la fin du lot 6A ; poursuivre les lots 6B (registres/rapports/exports) et 6C (sécurité globale et recette).
4. Vérifier la prise en charge des scénarios d'affectations simultanées, en particulier lorsqu'une absence personnelle concerne plusieurs équipes.

**État inchangé :** `MULTI_TEAM_CONTEXT_READY=false`, écritures multiéquipes générales désactivées, PostgreSQL v28 **non migré**, PR draft **non fusionnée**. Les comptes `user` historiques restent hors arbitrage conformément au Product Owner.

## Étape 6A — Réunions Scrum/Kanban : création, replanification, annulation protégées (27/10/2026)

**Développement réalisé sur la branche de la PR #189, sans activation générale :**

- `src/server/teams/meeting-create.ts` : parseur strict `parseTeamMeeting` pour `{teamId,kind,cycleId,name,startAt,duration}` et création d'une réunion **exceptionnelle Scrum** ou d'une réunion **Kanban**. Seuls les comptes `admin` autorisés via `resolveAdminTeam` sur la même installation v28 peuvent cibler un cycle de leur équipe. Les cycles sont verrouillés (`FOR UPDATE`), périodes closes et créneaux hors du Sprint / hors des journées de la période Kanban (en fuseau de la période) refusés. Les requêtes sont sans DDL ; si une structure attendue n'existe pas, la création échoue fermée. Les insertions sont couplées à un audit **dans la même transaction** : `smn_sprint_exceptional_meeting_history` pour Scrum, `smn_kanban_period_audit` (action `meeting-created`) pour Kanban.
- `src/server/teams/meeting-change.ts` : pour ces **deux seuls types de réunion**, replanification et annulation logique protégées. Verrou réunion + cycle, statut `scheduled` et horaires initiaux attendus (CAS), refus des cycles clos, de la période hors bornes ou d'un état déjà modifié. `UPDATE` paramétré avec comparaison des anciens horaires et du statut. Les annulations sont une mise à `cancelled`, jamais un `DELETE`. Historisation append-only `rescheduled/cancelled` dans la même transaction, rollback en cas de conflit ou d'échec d'audit. Les noms de tables proviennent d'une allowlist interne fixe `scrum/kanban`, non des paramètres utilisateur.
- `POST /api/admin/team-meetings` et `PATCH /api/admin/team-meetings/change` : routes distinctes, authentification Admin + autorisation d'écriture, corps JSON strict, aucune sélection implicite d'équipe, **verrou `MULTI_TEAM_CONTEXT_READY=false` testé avant toute requête PostgreSQL**. Les anciennes routes Kanban et détails/calendrier de réunion restent gardées par `withLegacyTeamApi` et refusées en v28 tant que leurs lecteurs et historiques ne sont pas complètement sécurisés.
- `tests/smn-282-team-meeting-create.test.ts` (6 scénarios), `tests/smn-282-team-meeting-change.test.ts` (7 scénarios) et `tests/smn-282-team-meeting-routes.test.ts` (5 contrats) ajoutés : création Scrum/Kanban, équipe/cycle étrangers, dates, statut clos, CAS, annulation, audit, rollback et verrouillage HTTP. **Les 18 tests sont écrits mais non exécutés.**

**Vérification effectivement réalisée :** 26 **contrôles statiques** de la branche GitHub, tous concluants (autorisation, `teamId` des cycles, verrous, horaires et statut CAS, absence de DDL et DELETE, traces d'audit, verrou HTTP, anciennes routes gardées, présence des tests). Aucun `pnpm test`, `pnpm typecheck`, `pnpm build`, Prisma, migration PostgreSQL ni recette navigateur effectué dans cet environnement.

**Limites et prochaine séquence :**
1. Les **cérémonies Scrum générées et occurrences de modèles** ne sont pas ouvertes en v28 par ces nouveaux endpoints. Leur replanification et leur historisation existantes passent toujours par les anciennes API fermées en v28. Il reste à les convertir et à vérifier la compatibilité des historiques.
2. Le journal Kanban est temporairement celui de la **période** (`smn_kanban_period_audit`), avec l'identifiant de la réunion dans `details` ; une table d'historique des réunions dédiée serait préférable si une chronologie par réunion est attendue à terme.
3. Aucun tableau d'édition v28 n'est activé ; les collisions de réunions, récurrences, participants et incidences sur les capacités doivent être testés avec deux équipes. La création protège les bornes du cycle mais ne reprend pas encore tous les avertissements de chevauchement de l'ancien éditeur.
4. Les ouvertures et clôtures de périodes v28 sont encore à adapter ; les lots 6B (registres, rapports, exports) et 6C (tests/sécurité globaux) restent à effectuer.
5. Tester sous PostgreSQL portable et Node.js 24, sur une **copie sauvegardée**, avec changement d'équipe et écriture concurrente avant toute activation.

**Invariants maintenus :** `MULTI_TEAM_CONTEXT_READY=false`, aucune migration v28 appliquée, écriture des équipes désactivée, PR #189 non fusionnée. Les droits des comptes `user` historiques ne sont pas attribués par défaut (arbitrage différé du PO).

## Étape 6A — Transitions de périodes Scrum/Kanban et inventaire des cérémonies générées (27/10/2026)

**Développement effectué sur la branche de la PR #189 :**

1. `src/server/teams/period-state.ts` : moteur transactionnel de transitions automatiques `planned → active → finished` propre à **une équipe v28 autorisée**. Vérification du rôle Admin actif et de l'installation via `resolveAdminTeam`; lecture des périodes/Sprints filtrée par `team_id`, verrouillage de chaque ligne et advisory lock par équipe. Contrôle de présence des tables via `to_regclass` et **aucune DDL** en v28.
2. **Scrum** : réutilisation de `smn_sprint_transition` et `smn_sprint_capacity_trigger`. Les Sprints suspendus ou déjà clôturés ne sont pas modifiés. Un démarrage contemporain (fenêtre de 15 minutes) peut déclencher la capture de capacité initiale ; un Sprint découvert plus tard retrouve son état et ses transitions **sans provoquer de capture initiale fictive**.
3. **Kanban** : réutilisation de `smn_kanban_period_transition` et `smn_kanban_capacity_opening`. En ouverture le jour de début, capture initiale manuelle ou calculée par le moteur explicitement contextualisé à l'équipe ; si l'ouverture a été manquée, inscription `historical-unavailable` avec `initial_jh=NULL`. Une capture déjà présente reste **immuable** (aucun recalcul à la consultation ou à la reprise) ; la fin calendaire passe à `finished`, sans lancer la clôture métier.
4. `src/server/teams/closure-readiness.ts` : précontrôle de clôture **en lecture seule**, par équipe et cycle, avec détection de l'état terminé, des dates et des tables de snapshots manquantes. **`canClose=false` reste imposé** : les producteurs complets de snapshots clôturés ne sont pas encore qualifiés pour v28. Pas de clôture définitive ni de réouverture à cette étape.
5. `src/server/teams/ceremonies-read.ts` : inventaire v28 **en lecture seule** des cérémonies Scrum générées et occurrences de modèles du Sprint explicitement autorisé, sans génération de récurrence ni mutation des séries ; refus des Sprints appartenant à une autre équipe, des schémas absents et des listes dépassant 500 éléments.
6. Routes dédiées `POST /api/admin/team-periods/reconcile`, `GET /api/admin/team-periods/closure-readiness` et `GET /api/admin/team-ceremonies` : accès **Admin**, origine/session contrôlées, paramètres stricts, `MULTI_TEAM_CONTEXT_READY=false` vérifié **avant tout appel BD**. Les nouveaux endpoints restent donc inactifs.
7. Les anciennes fonctions `reconcileSprintStates` et `reconcileKanbanStates` sont protégées par `assertLegacyTeamApi` **avant leurs routines de création de tables**. Sept routes historiques (`sprints/closure`, `sprints/states`, `kanban-periods/[id]/closure`, `kanban-periods`, `sprints/ceremonies`, `sprints/templates`, `sprints/template-occurrences`) ont été entourées de `withLegacyTeamApi` et refusent désormais v28 sans contextualisation.
8. Sources de tests ajoutées : `tests/smn-282-team-period-states.test.ts` (8), `tests/smn-282-team-closure-readiness.test.ts` (4), `tests/smn-282-team-period-routes.test.ts` (6), `tests/smn-282-team-ceremonies-read.test.ts` (4). **22 scénarios écrits mais non exécutés**.

**Vérification réelle :** inspection des fichiers et contrôle de cohérence **statique** avec le connecteur GitHub. Ces vérifications n'ont pas exécuté `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, de transaction PostgreSQL ni de migration. Le framework BMAD a été lu depuis `.agents/skills/bmad-agent-dev/SKILL.md` ; ses scripts locaux `uv` n'ont pas été exécutés faute de clone complet exécutable.

**Reste indispensable avant activation / fusion :**

- **Clôtures et réouvertures définitives** : adapter les producteurs `changeSprintClosure` / `changeKanbanClosure` et tous les contributeurs des captures de bilan (capacités initiales/réelles, indicateurs, participants, registres, réunions et historiques) à l'équipe autorisée, et valider l'immuabilité des snapshots d'une équipe.
- **Cérémonies générées et récurrentes** : adapter les mutations, régénérations, replanifications des segments et historiques ; l'inventaire actuel est volontairement *read-only*.
- **Capacité réelle sur plusieurs équipes** : vérifier la non-invention de J/H et l'absence de correction des capacités d'une autre équipe au fil des ouvertures/rattrapages.
- Exécuter les tests et le build sur le poste Windows/Node24 avec PostgreSQL portable, préparer une migration **v28 sur copie sauvegardée** et contrôler deux équipes Scrum/Kanban, liens étrangers, double traitement concurrent, changements d'équipe et rapports/export.
- Poursuivre les lots **6B Registres/Rapports/Exports** et **6C Sécurité et validation globale**. Les comptes `user` existants restent hors arbitrage selon la décision explicite du Product Owner.

**Statut :** PR #189 ouverte en brouillon, non fusionnée ; `MULTI_TEAM_CONTEXT_READY=false`, écritures d'équipes désactivées et migration v28 non appliquée.

## Étape 6B — Registres : consultation contextualisée et verrou des API historiques (27/10/2026)

**Première tranche implémentée sur la branche de la PR #189, sans activation globale :**

- `src/server/registries/team-access.ts` : routage explicite du comportement par `schema_version`. En **v27**, maintien de la consultation monoéquipe. En **v28**, seul un compte **Admin actif** peut résoudre le contexte via `resolveAdminTeam`, en vérifiant son installation et le `teamId` de l'URL ou sa préférence autorisée. Un ID d'équipe n'est jamais considéré comme une permission.
- `src/server/registries/list.ts` : `readRegistryPage` et `readRegistryCycles` acceptent maintenant une équipe **déjà autorisée**. Les requêtes de comptage, pagination, tri, cycles et filtres conservent `r.team_id=$1` ou `p/s.team_id=$1`. Le chemin de recherche « équipe monoéquipe installée » est explicitement limité aux schémas `<=27`.
- `GET /api/admin/registries`, `GET /api/admin/registries/cycles` et `GET /api/admin/registries/attention` : branchement sécurisé v28 sur `resolveRegistryReadContext`, contrôle des paramètres `teamId` (et de l'appartenance des cycles). La lecture est exécutée par `withSprintIndexDb` dans une transaction **READ ONLY**, sans DDL, migration ou recomposition des snapshots.
- `src/server/registries/team-item-read.ts` et `GET /api/admin/registries/[id]` : fiche réduite v28 sélectionnée uniquement par **`r.id=$1 AND r.team_id=$2`** après contrôle de l'Admin et de l'installation. Aucune relation, historique ou commentaire d'une autre équipe n'est chargé par ce nouveau service. L'ancien `PATCH /api/admin/registries/[id]` et le `POST /api/admin/registries` sont bloqués en v28.
- Interface `/app/admin/registries` : le `teamId` est transmis aux trois lectures, conservé dans les filtres, URL, origine des liens profonds et retour à la liste. `RegistryList` est remonté à chaque changement d'équipe ; création et modification sont masquées sur schéma v28. La fiche `/app/admin/registries/[id]` affiche en v28 une **projection en lecture seule**, sans importer les éditeurs relationnels dans ce chemin d'exécution ; la fiche v27 complète reste conservée.
- `src/server/registries/legacy-read.ts` : wrapper de lecture `withLegacyRegistryReadDb` qui teste `assertLegacyTeamApi` **avant** d'invoquer les anciens lecteurs au niveau transactionnel. **20 fichiers de routes auxiliaires et de détail** (relations, évaluations ROAM, commentaires, historiques, journaux, liens, actions, faits automatiques, échéances) ont été convertis à ce wrapper pour les lectures et à `withLegacyTeamApi` pour les écritures. **V27 fonctionne comme avant ; v28 échoue fermée** tant que l'isolation de ces services n'est pas terminée.
- `src/lib/registry-navigation.ts` : nouvelle clé optionnelle `teamId` correctement validée dans les URLs internes, sans autoriser de destination externe. Les autres filtres et leurs valeurs v27 sont conservés.
- Tests de contrat ajoutés : `tests/smn-282-registry-team-read.test.ts` (**7 scénarios**) et `tests/smn-282-registry-team-routes.test.ts` (**5 scénarios**). Cas couverts : compte `user` non autorisé en v28, identifiant de fiche étrangère, contexte d'équipe issu de la requête, pagination et cycles, navigation, refus d'écriture et anciennes routes protégées.

**Vérifications effectivement réalisées :** **42 contrôles statiques**, tous réussis : 22 sur le service principal, les routes et l'UI ; 20 sur les anciennes routes. Il s'agit de vérifications des **sources GitHub**, pas d'une compilation ni d'une exécution des 12 tests. Aucun `pnpm test`, `pnpm typecheck`, `pnpm build`, `prisma validate`, test de PostgreSQL ou migration SQL exécuté ici. Le script local officiel BMAD n'a pas été exécuté faute de checkout exécutable.

**Limites importantes :**
1. Les autres endpoints des registres et leurs consommateurs transverses (tableaux de bord, cycles, alertes, rapports/exports, captures de clôture) doivent être audités individuellement pour la v28 ; ces gardes ne prouvent pas une isolation **globale** de l'application.
2. Les anciennes sous-routes de détail sont **inaccessibles en v28**, y compris évaluations, commentaires, relations, historiques, modifications et actions ; la nouvelle fiche v28 ne présente qu'une projection réduite. Les réécrire avec `teamId` vérifié, révision optimiste et gestion des relations interéquipes est à poursuivre.
3. Les comptes de rôle `user` existants restent **délibérément sans nouvelle habilitation** ; leur cas n'a pas été arbitré par le Product Owner.
4. Tests d'accès interéquipes avec deux équipes, URL forgées, changement de préférence, historique multiéquipe, concurrence, régression v27, migrations et vérification de build à exécuter avant activation. Les clôtures définitives et les cérémonies générées non encore mutables du lot 6A demeurent également en attente.

**Invariant de livraison :** PR #189 ouverte en brouillon, **aucune fusion**, `MULTI_TEAM_CONTEXT_READY=false`, écritures équipes désactivées, migration PostgreSQL v28 non appliquée.

## Étape 6B — Centre Rapports contextualisé et sécurisation des sorties PDF/IA (27/10/2026)

**Développement de la deuxième tranche du lot 6B sur la PR #189 (non activée) :**

- `src/server/reports/center.ts` : le lecteur historique `readCenter` est désormais explicitement limité aux schémas v1–v27 grâce à `assertLegacyTeamApi`. Nouveau `readTeamCenter`, appelé uniquement après `resolveAdminTeam` en v28, qui vérifie aussi l'installation et `schema_version=28`, puis filtre **à la source SQL** les Sprints et rapports par `teamId` et l'égalité `s.team_id=d.team_id`. Une équipe Kanban ne reçoit aucun document Scrum. **Les archives ne sont volontairement pas chargées**, car leurs consommateurs actuels ne filtrent pas tous par équipe.
- `src/app/app/reports/page.tsx` : sélection explicite du contexte v27/v28 et du compte Admin de la même installation, propagation du `teamId` dans les filtres et URL de navigation. En v28, liste des documents autorisés en lecture synthétique uniquement ; commandes de création, ouverture du Studio, gestion des modèles et téléchargement d'archives masquées, archives signalées comme indisponibles, plutôt que de fournir une fonction susceptible de lire des documents d'une autre équipe.
- `src/app/app/reports/[documentId]/page.tsx` : **liens profonds vers le Studio historique refusés en v28 avant tout appel à `getReportDocument`**, y compris si l'ID exact d'un document est connu.
- `src/server/reports/legacy-read.ts` : nouveau wrapper `withLegacyReportReadDb` qui exécute `assertLegacyTeamApi` dans la **même transaction READ ONLY** avant toute ancienne lecture. `withLegacyTeamApi` est réutilisé pour les mutations.
- **22 routes du Centre Rapports / Studio / archives** ont été raccordées à l'un de ces gardes, y compris documents, journaux, aperçus, rendus, téléchargements PDF, gestion d'archives, modèles et options. En complément, **6 routes annexes** (PDF et références Kanban, rapports Kanban, téléchargement et réponses aux archives IA) ont été fermées en v28 pour supprimer les chemins de contournement par URL. **Les anciens parcours v27 sont conservés** via les wrappers.
- Tests sources ajoutés : `tests/smn-282-report-center-isolation.test.ts` (**4 scénarios**) pour le lecteur par équipe et le refus du lecteur historique sur v28 ; `tests/smn-282-report-routes-isolation.test.ts` (**5 scénarios**) pour la présence des gardes dans les 28 routes, les liens profonds, l'UI et le verrou global.

**Vérifications réellement réalisées :** vérification statique de **22/22 routes principales** raccordées aux wrappers, par inspection des fichiers présents sur GitHub (2 lots de 11). Les 9 scénarios sources ont été **écrits mais non exécutés**. Aucune compilation TypeScript complète, `pnpm test`, `pnpm build`, validation Prisma, requête PostgreSQL réelle, génération PDF, migration ou recette navigateur. Ces vérifications statiques ne prouvent pas que toutes les dépendances transitives sont isolées.

**Périmètre restant :**
1. Reconcevoir **l'ouverture et l'édition du Studio**, les producteurs de sections, les documents et archives avec un `teamId` serveur autorisé, ainsi que les mécanismes de publication et de contrôle qualité.
2. Isoler **les exports PDF, les archives et leurs autorisations individuelles** avec des contrôles d'ID document/équipe jusque dans les flux de téléchargement et la recherche d'archives ; ne pas les réactiver par un simple flag.
3. Contrôler les autres producteurs de données transversaux (indicateurs, tableaux de bord, IA, historique, clôture) et la cohérence des clôtures/instantanés de Sprint/Kanban.
4. Exécuter tests PostgreSQL multiéquipes et v27, migration v28 sur copie sauvegardée, typecheck, build et recette avant fusion.

**Invariants maintenus :** `MULTI_TEAM_CONTEXT_READY=false`, `SMN_MULTI_TEAM_WRITES_ENABLED` désactivé, migration SQL v28 **non appliquée**, PR #189 **ouverte en brouillon et non fusionnée**. Les comptes `user` préexistants ne reçoivent aucun droit automatique (décision PO reportée).


## Étape 6B.3 — Première tranche Studio contextualisé (27/10/2026)

- Ajout de `src/server/reports/team-studio.ts` : lecture d'un document uniquement via équipe Admin résolue côté serveur, cohérence `document → Sprint → teamId`, installation singleton et Sprint non supprimé.
- Sauvegarde transactionnelle d'un brouillon via `saveTeamStudioDocument` : verrou du document, contrôle du numéro de séquence par session, restriction à l'équipe ciblée, préservation des métriques faisant autorité, incrément de révision et rollback en cas d'erreur.
- Adaptation des méthodes GET/PATCH de `src/app/api/admin/reports/sprints/[id]/documents/[documentId]/route.ts` lorsque le paramètre explicite `teamId` est fourni. L'acteur doit être réellement Admin ; `resolveAdminTeam` vérifie le compte actif et l'installation. Sans `teamId`, comportement historique v27 maintenu ; le garde-fou v28 historique reste actif.
- La page complète du Studio et ses autres routes demeurent fermées en v28 : la tranche n'autorise pas leur ouverture implicite. Pas de migration v28 ni de fusion.

**Adaptation du workflow :** skills Amelia et bmad-build consultés ; le script BMAD `uv ... render_skill.py` exige un checkout local et ne peut pas être exécuté ici. La publication de cette tranche par GitHub Connecteur est effectuée à la demande expresse du Product Owner, sans revendiquer l'exécution complète du workflow. **Aucun test, typecheck, lint, build, SQL ou recette exécuté.** Vérifications et ajustements restent nécessaires sur le PC Windows, notamment pour les routes du Studio et les suites de tests de sécurité interéquipes.


## Étape 6B.3 — Deuxième tranche, création et modèles (27/10/2026)

- `src/server/reports/team-studio.ts` : liste filtrée par `teamId` et Sprint autorisé ; création transactionnelle d'un document avec `teamId` explicite, validation stricte, préparation de projection du Sprint, modèle référencé, traitement des `requestId` existants et absence de duplication volontaire.
- `src/app/api/admin/reports/sprints/[id]/documents/route.ts` : GET/POST contextualisés quand `teamId` est présent, avec contrôle d'acteur administrateur et conservation de la voie legacy v27.
- `src/app/api/admin/reports/templates/route.ts` : consultation des modèles par un administrateur dont le contexte d'équipe v28 a été résolu ; écriture des modèles maintenue derrière le verrou v27. Les modèles personnalisés sont encore partagés à l'installation : leur gouvernance et l'éventuelle propriété d'équipe nécessitent une décision explicite.
- La page Studio détaillée, les autres APIs de manipulation (blocs, sections, contenu, notes, historique, etc.), exports PDF/archives et les modèles en écriture demeurent fermés en v28 ; ne pas présenter ces opérations comme opérationnelles.
- **Aucun test, commande Node/pnpm, Prisma, migration PostgreSQL ni recette exécutés.** Code poussé via le connecteur GitHub sur la PR brouillon #189 ; aucune fusion, aucun basculement du feature flag.


## Étape 6B.3 — Consultation contextuelle du document (27/10/2026)

- `src/app/app/reports/[documentId]/page.tsx` reconnaît le paramètre `teamId` : accès limité à l'Admin, résolution de l'équipe côté serveur, vérification que le document et son Sprint appartiennent à cette équipe. Les URLs sans `teamId` conservent le parcours v27 protégé par `assertLegacyTeamApi`.
- En v28, rendu de consultation restreinte du document (titre, statut, révision, langue et contenu enregistré) : **aucun** montage des composants historiques du Studio, PDF, rafraîchissement, journal IA ou versionnement global tant qu'ils ne sont pas contextualisés.
- `src/app/app/reports/page.tsx` relie la liste d'une équipe à cette fiche via `teamId` explicite.
- **Restant dans 6B.3 :** adaptation transactionnelle et qualification des services SQL des sections, blocs, notes, choix de contenu, versions et historiques, des endpoints dédiés et de l'UI d'édition. Ils demeurent inaccessibles en v28, même par URL directe. Ce lot n'est pas terminé.
- **Non réalisés :** commande BMAD locale, tests, typecheck, lint, build, migration, recette. PR #189 toujours en brouillon, sans merge ni activation.


## Étape 6B.3 — APIs sections, contenu, notes et historique (27/10/2026)

- Nouveau garde serveur `src/server/reports/team-cycle.ts` : contexte Admin v28 résolu depuis le compte authentifié, contrôle du Sprint et de sa propriété `teamId`, refus si cycle absent, supprimé ou mode non Scrum.
- Les routes `sections`, `content`, `notes`, `history` acceptent un `teamId` explicite pour leurs opérations GET/PATCH. Elles vérifient le rôle réel Admin, puis réutilisent les services de lecture/écriture historiques après le contrôle d'appartenance. En l'absence de `teamId`, la voie v27 protégée reste inchangée.
- Les services existants assurent respectivement validation des options, version optimiste, transactions, notes, audit et profondeur d'historique. Les tendances historiques s'appuient sur le `team_id` du Sprint après contrôle serveur du cycle.
- Les blocs d'un document restent encapsulés dans `smn_report_document.content` via `saveTeamStudioDocument`; ils ne sont pas exposés par une API dédiée dans cette tranche.
- **À poursuivre avant ouverture complète du Studio :** contrôle des autres routes de composition/versionnement, fermeture ou adaptation des anciens producteurs connexes, harmonisation UI des mutations, revue du schéma et des protections en concurrence, tests d'isolation interéquipes et non-régression v27.
- **Statut :** code publié sur la branche de PR #189 ; aucune commande de test, lint, typecheck, build, migration PostgreSQL ou recette exécutée. `MULTI_TEAM_CONTEXT_READY` inchangé, PR non fusionnée. Le workflow BMAD local n'a pas été exécuté faute de checkout/uv dans le contexte connecté ; adaptation documentée conformément à la demande de publication directe.


## Étape 6B.3 — Raccordement d'édition et versionnement ciblé (27/10/2026)

- `src/app/app/reports/report-studio.tsx` transmet désormais le `teamId` aux PATCH documentaires utilisés par la sauvegarde automatique ou manuelle. Sections et blocs sont maintenus dans `smn_report_document.content` ; la voie sans `teamId` conserve le mode v27.
- `src/app/app/reports/[documentId]/page.tsx` rend le Studio éditable pour un compte Admin avec équipe explicitement vérifiée et document appartenant à son Sprint. Les fonctions non qualifiées (PDF, archives, actualisation, journal IA, propositions globales de version) sont exclues de cette branche d'affichage ; les liens directs illégitimes restent refusés.
- Application de modèle sur Sprint (`apply-template`) et choix de langue (`language`) : les routes acceptent un contrôle explicite de `teamId` via `withTeamReportCycle`, sans contourner les anciens verrous.
- Lecture d'une proposition de nouvelle version (`documents/[documentId]/template-update`) : recherche du document d'équipe autorisé avant toute comparaison avec la bibliothèque ; aucune écriture de version ni migration effectuée.
- **Attention :** l'édition directe des modèles partagés, la mise à jour effective d'une version, les services transverses PDF/archives et les autres producteurs conservés sous garde v27 ne sont pas rendus accessibles en v28. Le lot 6B.3 ne doit pas être déclaré intégralement vérifié ou terminé avant revue des routes connexes et tests d'intégration.
- **Tests locaux et migration : non exécutés.** La PR #189 reste en brouillon ; aucune fusion sur main, `MULTI_TEAM_CONTEXT_READY` non modifié. L'adaptation au workflow BMAD sans scripts locaux reste expressément consignée.


## Lot 6B.4 — Première tranche : lecture et téléchargement des PDF archivés (27/10/2026)

- `src/server/reports/archive-library.ts` : ajout de `searchTeamPdfArchives`, filtre `a.team_id` obligatoire, exclusion des archives masquées, validation Sprint/teamId et conservation des filtres de recherche et pagination. La requête historique reste inchangée.
- `src/server/reports/center.ts` : archives contextualisées récupérées pour l'équipe Admin v28 déjà résolue ; suppression de l'état vide forcé.
- `src/app/api/admin/reports/archives/[id]/download/route.ts` : accès direct v28 avec `teamId` explicite, acteur Admin actif validé via `resolveAdminTeam`, correspondance stricte archive/teamId/Sprint et contrôle d'archive masquée. Les octets d'origine sont relus et vérifiés ; la voie v27 demeure protégée par `withLegacyReportReadDb`.
- `src/app/app/reports/page.tsx` : affichage de la liste des archives de l'équipe et liens de téléchargement portant le `teamId` contextualisé.
- **Non livré en 6B.4 :** création de nouveaux PDF, réécriture des producteurs PDF du Studio et du rapport Sprint, opérations de partage/visibilité/permissions sur les archives, recherche avancée et parcours users multiéquipes. Ils restent bloqués en v28 derrière les protections historiques.
- **6B.3 reste à vérifier :** autres producteurs transverses du Studio, modèles partagés et tests de sécurité des écritures. La présence de code ne constitue pas une recette.
- **Aucun test, typecheck, lint, build, exécution SQL, migration ni recette exécuté.** La branche et la PR #189 ne sont pas fusionnées ; `MULTI_TEAM_CONTEXT_READY` n'est pas activé.


## Lot 6B.4 — Deuxième tranche : génération Studio, masquage et limites de partage (27/10/2026)

- `src/server/reports/studio-export.ts` : extraction de `inspectStudioDocumentEligibility` pour appliquer exactement les mêmes contrôles de qualité aux documents préalablement résolus avec `teamId`.
- `src/app/api/admin/reports/sprints/[id]/documents/[documentId]/pdf/route.ts` : POST de rendu et PUT d'archivage contextualisés avec `teamId`. Vérification serveur de l'Admin et de l'appartenance document–Sprint–équipe via `readTeamStudioDocument` ; relecture de la même propriété et de la révision après rendu ; métadonnées d'archive basées sur le document réellement autorisé. Sans paramètre, la voie v27 reste protégée.
- `src/server/reports/team-archive.ts` : nouveau contrôle d'appartenance de l'archive à l'équipe et à son Sprint sous installation valide.
- `src/app/api/admin/reports/archives/[id]/visibility/route.ts` : masquage v28 permis uniquement après résolution Admin et vérification d'archive/teamId ; voie legacy v27 préservée.
- **Partage des archives aux comptes `user` : maintenu bloqué en v28.** La gestion des habilitations par compte a été expressément reportée à la V1 ; créer des grants v28 sans politique d'équipes serait dangereux. La route grants historique demeure verrouillée en v28.
- **PDF Sprint standard : toujours fermé en v28** : le rendu utilise une page de prévisualisation HTTP/cookie et une référence figée historique. Adapter seulement la route POST sans sécuriser le renderer, la référence, la session et les archives créerait un accès interéquipes non maîtrisé.
- **UI :** les actions PDF n'ont pas encore été réactivées dans le Studio v28 malgré le nouveau chemin API ; vérifications fonctionnelles et tests sur PC requis avant ouverture.
- Aucun test, build, lint, typecheck, migration PostgreSQL ou recette exécuté. PR #189 en brouillon, non fusionnée, feature flag inchangé. Cette étape est une publication de code non validée, pas une livraison production.


## Lot 6B.4 — Troisième tranche : UI export Studio et référence Sprint (27/10/2026)

- `src/app/app/reports/report-pdf-actions.tsx` accepte un `teamId` optionnel, inclus dans l'URL du rendu/archivage PDF Studio ainsi que dans le lien de téléchargement des octets archivés. La compatibilité des URLs v27 sans `teamId` est conservée.
- `src/app/app/reports/[documentId]/page.tsx` expose les commandes PDF de l'éditeur v28 pour le document de l'équipe autorisée, en conservant la vérification de révision, les avertissements et l'état brouillon.
- `src/app/api/admin/reports/sprints/[id]/render-references/route.ts` contextualise la création des références figées Sprint avec `withTeamReportCycle` pour un Admin v28 et conserve la voie legacy sécurisée v27.
- **Chaîne standard non ouverte en v28 :** `src/app/api/admin/reports/sprints/[id]/pdf/route.ts` reste sous garde legacy. Sa page interne de prévisualisation HTTP, la validation des références, des cookies et l'archivage du rendu doivent être audités dans un même périmètre sécurisé avant ouverture. Créer une référence figée n'autorise pas à générer un PDF standard.
- Les grants des comptes `user` demeurent désactivés en v28, conformément à l'arbitrage V1.
- Lot 6B non clos techniquement : contrôles de concurrence, production standard, intégrité des archives et recette locale à compléter. **Aucun test, compilation, migration ni fusion exécuté.**


## Lot 6B — Revue transversale et rendu PDF Sprint standard (27/10/2026)

- `src/app/api/admin/reports/sprints/[id]/pdf/route.ts` : préparation du chemin v28 avec `teamId`, Admin vérifié et Sprint rattaché à l'équipe ; référence figée contrôlée avant le rendu et relue avant archivage ; archives reprises par `operationId` rejetées si elles ne correspondent pas à l'équipe, la référence, le cycle ou l'auteur.
- L'URL du rendu interne transporte désormais le `teamId`. La route utilise les mécanismes de verrou et la validation d'intégrité existants et conserve l'ancien chemin v27.
- **Réserve bloquante :** la page effective `/app/admin/sprints/[id]/report/preview` n'a pas pu être localisée et examinée dans cette intervention. L'isolement côté rendu HTML/session cookie n'est donc PAS prouvé. Le code du POST PDF Sprint standard est une préparation, **pas une ouverture qualifiée**.
- Revue transversale : la chaîne actuelle comporte au moins la création de référence figée, le chargement de cette référence dans la prévisualisation, le navigateur PDF, l'opération idempotente, la conservation de l'archive et le téléchargement. Leur vérification intégrée doit couvrir la fuite interéquipes, les comptes `user`, la révocation de droits, les collisions d'`operationId`, la mutation pendant le rendu et le multi-session.
- **Lot 6B non clôturé** tant que le renderer interne, les appels UI Sprint et la recette d'isolation ne sont pas vérifiés sur le PC ; 6C reste distinct.
- Pas de test ni de build, pas de migration activée, pas de fusion de la PR #189.


## Lot 6B — Verrou de sûreté PDF Sprint v28 (27/10/2026)

La route POST `/api/admin/reports/sprints/[id]/pdf` transportait déjà un `teamId` vers un navigateur PDF qui charge `/app/admin/sprints/[id]/report/preview`. Cette page interne n'a pas été identifiée avec certitude dans les chemins accessibles via le connecteur GitHub et son contrôle autonome de l'acteur, de l'équipe, du Sprint et de la référence immuable n'a **pas** pu être vérifié. Tant que le rendu HTML ne fait pas lui-même respecter ces droits, transmettre simplement le `teamId` dans l'URL ne suffit pas.

**Décision de sûreté appliquée :** toute demande PDF Sprint standard avec `teamId` renvoie explicitement `503 team-pdf-preview-pending` avant le navigateur, y compris si une référence figée existe. Les demandes historiques sans `teamId` gardent leur garde v27 et ne peuvent pas s'exécuter contre le schéma v28. Cela évite de considérer prématurément l'export standard multiéquipes comme opérationnel.

**Conditions impératives de réouverture :** identifier la route effective de prévisualisation et tous ses appels, appliquer la même vérification serveur du compte Admin et du `teamId` que celle du Sprint, relier la référence figée à l'équipe autorisée et à la session authentifiée, garantir l'immutabilité du rendu, qualifier la reprise idempotente par `operationId` et la correspondance archive/teamId, puis effectuer la recette Windows avec au moins deux équipes, deux Sprints, des liens directs et des références croisées.

L'étape 6B ne peut être marquée « terminée » avant ces contrôles. **Aucun test, build, migration, activation ni fusion effectués.**


## Étape suivante — Référence figée et préparation recette 6C (27/10/2026)

- `src/server/reports/render-reference.ts` accepte un `expectedTeamId` facultatif dans la création et la lecture, et l'applique **dans les requêtes SQL** contrôlant le Sprint de la référence ; absence de paramètre compatible v27.
- Les routes de création de référence et de rendu PDF Sprint transmettent désormais le `teamId` résolu à ces lectures, sans substituer une équipe indiquée par le client à la vérification du serveur.
- Nouveau document `_bmad-output/implementation-artifacts/recette-smn-282-lot-6c.md` : 18 scénarios manuels interéquipes, permissions Admin/user, composition, concurrence, exports, archives, URLs directes et régression v27.
- Recherche de la véritable route `/app/admin/sprints/[id]/report/preview` par chemins probables et recherche GitHub non concluante. Aucun fichier de prévisualisation n'a été identifié et modifié. Le POST PDF Sprint standard v28 demeure explicitement bloqué (503) ; ne pas revendiquer la sécurisation du renderer interne.
- **Aucun test exécuté** ; aucune migration activée ni fusion. La clôture technique 6B reste en attente de l'identification et de la qualification de la page de prévisualisation.


## Revue statique préalable à la recette 6C — 27/10/2026

- Services du Centre Rapports : documentation interne harmonisée avec la lecture/téléchargement des archives par `teamId` déjà implémentés.
- `src/server/reports/team-studio.ts` : les lectures de documents et de listes en contexte d'équipe tolèrent l'absence de la table `smn_report_document` ; document individuel non trouvé / collection vide, sans transformer cette absence en erreur SQL 503. La vérification du compte, de l'équipe et du Sprint reste en place.
- **Périmètre de cette revue :** inspection statique ciblée des fichiers GitHub, pas une validation TypeScript, SQL ou sécurité exécutée. Les cas du document `recette-smn-282-lot-6c.md` restent tous *non exécutés*.
- **Point bloquant maintenu :** le rendu PDF Sprint standard v28 est fermé (`team-pdf-preview-pending`) jusqu'à identification et contrôle du point d'entrée de prévisualisation. Ne pas déclarer 6B terminé ni activer la migration.


## Revue suivante — Corrections ciblées avant 6C (27/10/2026)

- `src/server/reports/team-studio.ts` : création d'un document v28 après autorisation Admin et verrouillage du Sprint : appel au mécanisme existant `ensureReportDocumentsSchema(db)`, afin que la première création ne déclenche pas une erreur « relation inexistante » sur une base dépourvue de documents. C'est une correction de code : aucun DDL n'a été exécuté dans cet échange.
- `src/app/app/reports/[documentId]/page.tsx` : le texte d'information indique maintenant correctement la disponibilité des boutons d'export PDF du Studio, sous réserves des contrôles de qualité et de révision, sans prétendre que le rafraîchissement ni l'insertion d'analyses sont opérationnels en v28.
- **Rendu PDF Sprint standard toujours fermé** (503 `team-pdf-preview-pending`) : la route interne de prévisualisation ne peut pas être localisée/qualifiée par l'accès GitHub disponible ; interdiction de présenter 6B comme clos.
- Pas de tests, de build, de migration activée ni de merge. Les scénarios de recette 6C restent non exécutés.


## Revue des écritures concurrentes — 27/10/2026

- La sauvegarde `saveTeamStudioDocument` exige désormais `revision` dans la requête multiéquipes, en plus de `sessionId`, `sequence` et `content`. La révision présentée par le client est comparée à celle du document sous verrou `FOR UPDATE OF d` ; tout conflit retourne `stale` (HTTP 409), sans écraser les changements de l'autre session.
- `report-studio.tsx` transmet la révision active fournie par `ReportEditingProvider` à chaque sauvegarde. Les requêtes v27 continuent d'utiliser leur contrat historique sans cette propriété.
- Scénario 6C-04 : vérifier avec deux onglets indépendants qu'une écriture de révision périmée provoque un conflit explicite, puis que l'actualisation du document permet un nouvel enregistrement.
- **Non exécutés :** tests, typecheck, build, migration, recette. Blocage PDF Sprint standard v28 maintenu ; pas de fusion PR #189.


## Contrôle de compatibilité Studio v27/v28 — 27/10/2026

- Correction du payload autosave dans `report-studio.tsx` : la propriété `revision` n'est transmise que si un `teamId` est actif (contrat v28). Le service historique v27 refuse les propriétés inconnues et continue donc à recevoir strictement `content`, `sequence`, `sessionId`.
- `team-studio.ts` compare numériquement `last_sequence` avec la séquence soumise, comme le service documentaire historique, pour préserver le rejet déterministe des écritures obsolètes.
- Recette à exécuter : édition v27 sans 400, édition v28 avec révision courante acceptée, révision obsolète rejetée en 409 et absence d'écrasement intersessions.
- **Publication de code uniquement :** aucun test, lint, build ou migration effectués ; aucun merge. Blocage PDF Sprint standard v28 maintenu.
