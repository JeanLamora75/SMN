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
