---
name: "SMN — Extension Équipes dans Paramètres (SMN-282)"
status: "user-requested-specification; architecture-arbitration-required"
updated: 2026-10-26
jira: https://lmn24.atlassian.net/browse/SMN-282
epic: https://lmn24.atlassian.net/browse/SMN-3
---

# Avenant de conception et contrat de préparation — Gestion des équipes

**Commande fonctionnelle du 26 octobre 2026 :** créer la Story 3.26 / [SMN-282](https://lmn24.atlassian.net/browse/SMN-282) et en documenter le besoin. **Cette demande n'autorise pas implicitement de renverser D-PRD-137**, d'effectuer une migration, de publier du code applicatif ou de déclarer une recette.

## 1. Objectif métier

Permettre à un administrateur Scrum Master de créer une nouvelle équipe et de modifier une équipe existante depuis **Paramètres > Équipes**, sans repasser par l'assistant d'installation.

La nouvelle destination proposée est `/app/admin/settings/teams`, sous la famille « Organisation Agile » du **portail Paramètres** (Cartes/Liste). Il s'agit d'une **route cible non implémentée** : la rubrique ne devient cliquable qu'une fois l'écran sécurisé et fonctionnel.

## 2. Formulaire minimum demandé

| Champ | Obligatoire ? | Validation de conception |
| --- | --- | --- |
| Nom de l'équipe | **Oui** | 1–120 caractères après trim/normalisation ; refus du blanc |
| Nom du produit | **Non** | 0–120 caractères ; absence non remplacée par un faux nom |
| Vision du produit | **Non** | 0–5 000 caractères ; texte libre conservé |
| But du produit (Product Goal) | **Non** | 0–5 000 caractères ; texte libre conservé |

Le mode **Créer** part de valeurs vides et le mode **Modifier** préremplit les valeurs réellement persistées pour une équipe identifiée, avec un mécanisme de sauvegarde contrôlée. Aucun champ supplémentaire n'est rendu obligatoire sans validation métier explicite. Annuler ne sauvegarde rien ; erreurs et brouillons préservés ; confirmation après transaction et audit réels.

## 3. Parcours UX visé

1. Depuis le menu principal « Paramètres », ouvrir le portail et sélectionner l'entrée « Équipes », dans « Organisation Agile ».
2. Une page dédiée propose la création et la sélection d'une équipe autorisée à modifier. Pas de route de création fictive, pas de suppression/archivage induits.
3. L'Administrateur renseigne le formulaire, seul nom d'équipe obligatoire. Boutons « Enregistrer » / « Annuler », erreurs sous les champs et message après succès confirmé.
4. Une équipe créée reste indépendante des membres et cycles existants ; la sélection de l'équipe active n'est pas changée silencieusement.
5. Utilisateur `user` : aucune commande ou API d'écriture. Vérifier les protections serveur sans inférer une autorisation à partir d'un bouton visible.

Responsive et accessibilité : Bootstrap, thèmes actuels, FR/EN dans `src/i18n/fr.json` et `en.json`, clavier, focus, erreurs accessibles, 320/375/768/1440px et zoom 200 %. Suivre [DESIGN](DESIGN.md), [EXPERIENCE](EXPERIENCE.md) et le [centre Paramètres](../ux-parametres-2026-10-23/DESIGN.md).

## 4. ⚠ Contradictions documentées et arbitrages bloquants

**Règle existante D-PRD-137 :** une seule équipe et un seul produit par installation Scrum/Kanban (MVP), seconde équipe refusée même par API ; multiéquipes réservé à SAFe v1.0. Voir [clarification D-PRD-137](../../prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md) et [Epic 3](https://lmn24.atlassian.net/browse/SMN-3).

**Modèle réel `prisma/schema.prisma` :** `SmnTeam.installationId @unique`, `SmnProduct.installationId @unique`, `SmnTeam.productId` obligatoire, `SmnProduct.name` non nullable. Il ne permet pas de créer honnêtement une équipe supplémentaire avec un nom produit laissé vide sans décision et migration appropriées.

**Autre conflit :** [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) et `src/server/members/team-context.ts` rendent aujourd'hui `productName` obligatoire pour une modification. Le nouveau contrat exige que seul le nom de l'équipe soit obligatoire ; harmonisation indispensable.

**Décisions métier à obtenir avant développement mutatif :**
- Étendre ou non le multiéquipe aux installations Scrum/Kanban dès maintenant ; si oui, acter un nouvel amendement explicite à D-PRD-137, préciser migration et compatibilité existante.
- Définir produit partagé entre équipes ou produit propre à chaque équipe, politique de nom produit absent, règles de renommage.
- Définir la sélection d'équipe active, l'isolation des permissions/données, membres/affectations, sprints/périodes, capacités, rapports et journaux ; ne pas réutiliser le premier `teamId` par défaut.
- Choisir gestion des équipes homonymes, création d'une équipe vide, états et accès après enregistrement ; ne pas inventer d'archivage/suppression.

**En attendant, D-PRD-137 demeure la règle normative.** Cet avenant et la Story décrivent un besoin **à arbitrer**, pas une fonctionnalité « Ready for Development » ni une permission de contournement du serveur.

## 5. Impacts techniques préparatoires

- Portail : `src/lib/settings-catalog.ts`, `src/app/app/admin/settings/page.tsx`, `src/app/app/admin/settings/settings-catalog-view.tsx`.
- Création et édition : nouveau route/page à concevoir ; réutiliser la logique `src/app/app/admin/members/team-context-editor.tsx` et `src/server/members/team-context.ts` **sans détourner l'API PATCH existante en créateur**.
- Sécurité et persistance : `src/app/api/admin/team-context/route.ts`, `src/server/access-policy.ts`, `prisma/schema.prisma`, migrations transactionnelles, mécanisme de version et audit.
- Contexte collectif : `src/app/app/private-shell.tsx`, recherche des requêtes à hypothèse monoéquipe, tous producteurs métiers liés à `teamId` ; garder les historiques immuables.
- Tests : refus rôle user, création avec seul nom, sauvegarde des textes optionnels, édition préremplie, absence de produit, rollback, conflit 409, double soumission, isolation interéquipes, non-régression des anciennes données, i18n, a11y, responsive. Commandes `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` **à exécuter réellement**.

## 6. Suivi

- [Jira SMN-282](https://lmn24.atlassian.net/browse/SMN-282) : story unique de cette évolution, AC1–AC8 et dépendances.
- [Jira SMN-221](https://lmn24.atlassian.net/browse/SMN-221) : éditeur du contexte de l'équipe actuelle et audit à réutiliser.
- [Jira SMN-223](https://lmn24.atlassian.net/browse/SMN-223) : centre Paramètres déjà existant.
- **Statut** : spécification publiée, développement et recette non engagés. Rouvrir la phase BMAD de cadrage avant de lever les arbitrages ci-dessus.


## 7. Arbitrage validé — Plusieurs équipes Scrum/Kanban au MVP (26/10/2026)

**Règle prioritaire et nouvelle :** le Product Owner a explicitement validé **la création de plusieurs équipes dans une installation SMN Scrum/Kanban dès le MVP**. Cela remplace la contrainte monoéquipe inscrite dans la version initiale de D-PRD-137, mais uniquement sur le nombre d'équipes. Les paragraphes historiques « multiéquipes réservé à SAFe » et « en attendant D-PRD-137 demeure la règle normative » rédigés avant cette validation ne doivent plus être appliqués comme cible produit sur ce point.

**En attente d'arbitrage, donc développement toujours bloqué :** politique de rattachement produit et de champ produit vide ; sélection et persistance de l'équipe active ; isolation de toutes les lectures/mutations et historiques ; gestion d'homonymies. Les éléments hors monoéquipe de D-PRD-137 restent applicables jusqu'à décision contraire. Aucun code ou test produit par cet amendement.

## 8. Arbitrage validé — Option A : produit propre et facultatif (26/10/2026)

**Décision finale sur ce point :** dans le MVP Scrum/Kanban, chaque équipe possède **son produit indépendant facultatif** (0..1). Il n'existe pas d'identité de produit partagée entre équipes dans ce périmètre. Un nom identique sur deux équipes ne fusionne pas leurs produits.

| Champ | Obligatoire ? | Portée |
| --- | --- | --- |
| Nom de l'équipe | **Oui** | Identité stable de l'équipe |
| Nom du produit | **Non** | Produit propre à l'équipe, absent si non renseigné |
| Vision du produit | **Non** | Contexte de l'équipe, même sans produit |
| But du produit / Product Goal | **Non** | Contexte de l'équipe, même sans produit |

**Règles métier complémentaires :**
- En création, avec le seul nom d'équipe, enregistrer l'équipe sans créer de produit vide, factice ou partagé.
- En édition, préremplir uniquement les données de l'équipe sélectionnée ; ne pas exiger `productName`. Les deux textes restent modifiables en l'absence de produit.
- Si un produit courant existe, son identité reste stable lors du renommage. Un éventuel retrait du nom produit doit préserver les snapshots et références historiques ; la politique d'audit et de détachement est à concevoir.
- Interdire toute mutation qui renomme, rattache ou supprime implicitement le produit d'une autre équipe ; garantir atomicité et contrôle de révision.

**Écarts techniques avant développement :** `SmnTeam.productId` doit devenir facultatif ou son équivalent relationnel ; retirer les contraintes d'unicité d'installation pertinentes ; conserver le caractère non vide d'un **produit effectivement créé** ; adapter les validations `parseTeamContextChange`, `readTeamContext` et les projections pour gérer un produit absent ; préserver les anciennes données, IDs, audits et rapports. Aucune migration n'a été effectuée.

**Supersession :** les mentions antérieures de « politique produit en attente » dans cet avenant sont **résolues par l'Option A**. Restent ouverts l'équipe active, l'isolation des données et les homonymies, sans réintroduire le partage de produit. Voir [D-PRD-137 amendée](../../prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md).

**Statut :** contrats mis à jour, développement non commencé.

## 9. Arbitrage validé — Sélecteur global d'équipe (Option A, 26/10/2026)

**Option A validée :** l'équipe active se choisit dans **l'en-tête global de SMN**, juste à côté du sélecteur Sprint / période. Le contrôle existant `smn-current-team` dans `src/app/app/private-shell.tsx` est aujourd'hui **désactivé** ; l'implémentation ultérieure le rendra interactif et alimenté exclusivement par les équipes réellement accessibles à l'utilisateur.

- Le choix de l'équipe est **mémorisé indépendamment pour chaque utilisateur** et conservé entre navigations et sessions. L'implémentation exacte de cette préférence devra être déterminée en respectant les protections serveur.
- La sélection utilise `teamId` et non le nom affiché ; la liste exclut les équipes hors du périmètre autorisé. Les administrateurs peuvent gérer les équipes selon les droits déjà prévus ; les utilisateurs standard ne gagnent aucun droit d'écriture en utilisant le sélecteur.
- L'emplacement, le libellé et l'état actif sont lisibles et accessibles au clavier, au zoom et sur mobile ; traductions centralisées FR/EN. L'absence d'équipes accessibles et l'indisponibilité doivent avoir des états honnêtes.
- Une équipe nouvellement créée dans « Paramètres > Équipes » ne remplace **pas implicitement** l'équipe active : la sélection reste un acte utilisateur.
- Le sélecteur de Sprint/période doit **rester cohérent** avec l'équipe affichée : jamais un identifiant de cycle d'une équipe différente. Le détail des transitions de sélection n'est **pas encore validé**.

**Arbitrages suivants ouverts :** lors du changement d'équipe, faut-il conserver la page (avec rafraîchissement contextuel) ou revenir au tableau de bord ? Comment traiter une édition non sauvegardée, une fiche détaillée, une URL avec `teamId` explicite, un Sprint/période non disponible, l'historique et l'isolation multiéquipes ? Aucune de ces alternatives n'est présumée acceptée. Les mentions précédentes de « sélection d'équipe à arbitrer » sont dépassées **pour le placement et la mémorisation seulement**, mais pas pour le comportement de transition.

**Aucun développement ni migration** au titre de cette validation. Liens : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282), [PRD D-PRD-137](../../prds/prd-SMN-2026-10-18/clarification-equipe-contexte-d-prd-137.md).

## 10. Arbitrage validé — Changement d'équipe et maintien de rubrique (Option B, 26/10/2026)

**Décision explicitement validée :** lorsque l'utilisateur change d'équipe depuis le sélecteur global, **conserver la même rubrique si elle existe et est accessible dans le contexte de la nouvelle équipe**, en rechargeant ses seules données. Exemples de rubriques collectives : Tableau de bord, Registres, Calendrier, Sprints/périodes et Rapports (si destination correspondante).

**Parcours cible :**
1. Depuis une **rubrique liste / synthèse**, ouvrir la rubrique équivalente **dans l'équipe cible**, uniquement si applicable et autorisée ; aucune donnée précédente ne doit être présentée au titre de la nouvelle équipe.
2. Depuis un **détail lié à l'équipe précédente** (fiche membre, cycle, risque, rapport, événement), ne jamais conserver ou réinterpréter l'ancien identifiant dans la nouvelle équipe ; replier vers la **liste parent / section équivalente** de l'équipe cible si disponible, sinon vers **son tableau de bord**.
3. Si la rubrique ne peut pas être ouverte dans la nouvelle équipe (absence de correspondance, non-applicabilité, droits), choisir le **tableau de bord de l'équipe cible**, à condition d'y être autorisé ; sinon afficher un état d'accès refusé/indisponible sans afficher de données étrangères.
4. Le changement d'équipe ne déplace, ne copie et ne modifie **aucun membre, cycle, capacité, registre, rapport, historique ou document métier**. Seul le choix personnel d'équipe active et la navigation peuvent changer, selon le protocole de transition à spécifier.
5. Chaque lecture et mutation devra revérifier **côté serveur** l'identité et les autorisations sur le `teamId`, ainsi que la propriété de tout cycle, fiche ou identifiant de rapport lié. Une URL `teamId` ne confère jamais les droits. Les URL de retour doivent rester allowlistées (référence `src/lib/context-navigation.ts`).

**Arbitrages conservés ouverts** : sélection de cycle de l'équipe cible (par défaut ou vide), confirmation/protection des brouillons, priorité des URL historiques et explicites, compatibilité des filtres, absence de données, échecs serveur pendant le changement, protocole détaillé d'isolation interéquipes. Ne pas présumer ces choix à partir de l'option B.

**Impact technique préparatoire :** `src/app/app/private-shell.tsx` (sélecteur global), `src/app/app/layout.tsx` (contexte serveur), `src/lib/context-navigation.ts` (URLs de retour), pages et API métier contextuelles. Toute redirection/fallback nécessite validation du `teamId` réel et des permissions du compte ; ne pas fabriquer d'identifiants.

**Statut :** décision UX contractuelle validée ; aucun code, migration, test ou recette exécutés. [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).

## 11. Arbitrage validé — Cycle pertinent automatique de l'équipe cible (Option A, 26/10/2026)

**Décision validée :** lorsque l'utilisateur change l'équipe active (sélecteur d'en-tête), **SMN sélectionne automatiquement un cycle de l'équipe cible** (Sprint Scrum ou période Kanban), d'après la règle de pertinence existante à adapter au mode : **en cours, sinon prochain, sinon dernier disponible**. La sélection est calculée **après détermination et autorisation de l'équipe cible** ; le cycle de l'équipe précédente ne peut jamais être conservé ou réemployé, même si son nom ou ses dates coïncident.

**Cas de recette fonctionnelle :**
- **C01** : depuis Équipe Koala / Sprint 12, sélectionner Panda possédant Sprint 6 en cours → afficher Panda / Sprint 6 et données de Panda exclusivement, dans la rubrique conservée selon l'option B de navigation.
- **C02** : aucun cycle en cours → proposer le prochain cycle pertinent de Panda ; sinon le dernier disponible, sans fabriquer un nouveau cycle.
- **C03** : Panda possède **zéro cycle** → sélecteur vide et état d'absence explicite ; pas de fausses métriques ni retour implicite au cycle de Koala. Les rubriques indépendantes d'un cycle restent navigables.
- **C04** : cycle explicitement mentionné dans l'URL mais appartenant à Koala → ne pas l'interpréter comme appartenant à Panda. La gestion fine des URL historiques reste à arbitrer.
- **C05** : panne de lecture → état d'erreur distinct de « aucun cycle » ; aucune ancienne donnée ne doit être réattribuée à Panda.
- **C06** : cycle clôturé/suspendu → respecter les statuts et l'accessibilité historique, sans l'activer métier par effet de bord et sans déplacer des données.

**Technique constatée, non développée :** `src/lib/sprint-context.ts` contient `defaultSprintId` et `selectedSprint` pour Scrum (activité temporelle puis futur et passé, avec fallback de liste si seulement clôturé/suspendu) ; `src/app/app/private-shell.tsx` présente le sélecteur de cycles. **Le filtrage strict par `teamId` et la sélection équivalente en mode Kanban restent à développer et tester.** L'algorithme actuel ne constitue pas une preuve d'une sélection multiéquipes Kanban. Toute sélection doit être validée côté serveur ; le simple changement de contexte ne crée ni ne modifie un cycle.

**Non arbitrés par cette décision :** sortie ou conservation des brouillons non sauvegardés ; priorité des URL directes/historiques vs préférences ; conservation des filtres ; comportement des échecs de bascule ; isolation multiéquipes détaillée. Aucun code applicatif, migration ou test n'a été réalisé. Traçabilité [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).

## 12. Arbitrage validé — Protection des brouillons non enregistrés (Option A, 26/10/2026)

**Décision validée par le Product Owner :** si un formulaire contextuel de l'équipe active contient des modifications non sauvegardées, **le changement d'équipe doit être précédé d'un avertissement et d'une confirmation explicite**. L'utilisateur ne perd jamais un brouillon sur simple sélection d'une équipe différente dans l'en-tête.

**Parcours :**
1. L'utilisateur modifie une fiche de l'équipe Koala (sans sauvegarde) et choisit Panda dans le sélecteur global. Tant que la décision n'est pas confirmée, **Koala reste l'équipe active**, son cycle et son URL ne changent pas, le formulaire conserve son contenu.
2. Un dialogue accessible présente le risque de perte avec deux actions explicites : **« Rester sur Koala »** (annuler) et **« Abandonner et changer d'équipe »**.
3. « Rester », Échap ou fermeture du dialogue conservent intégralement le brouillon et restaurent le focus ; aucune préférence personnelle d'équipe n'est modifiée.
4. « Abandonner et changer » écarte seulement les modifications locales non enregistrées, puis applique la transition vers Panda **après validation de l'accès**, conformément aux options déjà validées (même rubrique si disponible, cycle pertinent de Panda).
5. Aucun transfert ou autosauvegarde de brouillons vers Panda ; les anciennes valeurs validées en base restent intactes. Si une **écriture est en cours**, empêcher une bascule concurrente tant que son résultat n'est pas connu.
6. Ne pas afficher d'avertissement si aucun formulaire modifié n'existe. Cibler les écrans à contenu modifiable, y compris fiche et modale. Contrôler clavier, focus, responsive et textes FR/EN centralisés.

**Critères Jira :** AC16 à AC18 de [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).

**À arbitrer ensuite :** effet d'une URL directe vers une équipe différente sur la sélection mémorisée ; accès à un historique non lié à l'équipe active ; protocole d'isolation multiéquipes des lectures, mutations, filtres et rapports ; comportement détaillé en cas d'échec réseau. L'option A ne constitue **pas** un système de brouillons persistants.

**Statut :** cadrage/documentation seulement. Aucun changement applicatif, migration, test ni recette engagé.

## 13. Arbitrage validé — Liens contextuels explicites prioritaires (Option A, 26/10/2026)

**Décision validée par le Product Owner :** un lien interne ou direct qui désigne explicitement une équipe et éventuellement une ressource métier, un cycle ou un historique **prime sur la dernière équipe active mémorisée**, sous réserve de validations serveur préalables. Cette priorité est une règle de navigation, **jamais une autorisation implicite**.

**Parcours et critères de recette (Jira SMN-282, AC19–AC22) :**
- **U01 — Lien autorisé :** l'utilisateur a Koala comme équipe mémorisée et ouvre un rapport de Panda. Vérifier que le compte peut consulter Panda **et** le rapport, puis afficher précisément le rapport demandé ; synchroniser le sélecteur global et la préférence personnelle sur Panda **après navigation autorisée réussie**, sans modifier les préférences des autres comptes.
- **U02 — Lien historique explicite :** si une URL désigne un Sprint, une période, une version ou un snapshot consultable appartenant à Panda, respecter ce contexte demandé, même si un autre cycle est en cours. Les données archivées restent immuables. **La sélection automatique du cycle pertinent validée en section 11 s'applique aux changements initiés par le sélecteur global et aux liens sans cycle explicite**, pas aux liens historiques explicites autorisés.
- **U03 — URL incohérente/invalide :** identifiants `teamId` et `cycleId` ne correspondant pas à la même équipe, objet inexistant, refus serveur, lien falsifié ou trop ancien → état d'erreur/refus neutre, sans fuite d'existence ni de contenu et sans modification de la préférence d'équipe mémorisée. Ne jamais interpréter un objet d'une autre équipe dans le contexte courant.
- **U04 — Brouillon non sauvegardé :** en navigation interne, une tentative d'ouvrir l'URL d'une autre équipe doit respecter d'abord la confirmation d'abandon définie en section 12 ; « Rester » conserve équipe, brouillon, cycle et URL ; « Abandonner et changer » autorise la nouvelle navigation seulement après revalidation. Un lien ouvert dans un nouvel onglet reçoit sa propre autorisation serveur et ne transporte pas le brouillon local d'une autre page.
- **U05 — Périmètre sûr des URL :** accepter uniquement les chemins internes attendus, valider les paramètres, refuser les URL externes et les destinations non allowlistées comme retour contextuel ; vérifier `teamId`, `cycleId`, propriétaire de la fiche et droits sur l'historique pour toute lecture ou mutation.

**Conception technique à venir :** conserver les protections déjà identifiées dans `src/lib/context-navigation.ts` (`dashboardReturnPath`, `safeDashboardReturn`, `teamDetailPath`) tout en élargissant proprement le traitement des contextes directs. Éviter la confiance dans le seul sélecteur et prévoir une opération de bascule cohérente qui ne conserve jamais des caches ou résultats de l'équipe précédente sous le nom de Panda.

**Points encore non arbitrés :** modèle exact des droits par équipe, niveaux de visibilité des données collectives, portée des filtres, réponse aux échecs de bascule (dont préférence mémorisée), politique d'homonymie et migration technique. **Aucun développement, migration ni test exécuté.**

## 14. Arbitrage validé — Autorisations explicites par équipe (Option B, 26/10/2026)

**Décision validée :** dans chaque installation SMN du MVP Scrum/Kanban, l'Administrateur peut gérer toutes les équipes de **son installation** ; le rôle `user` ne peut **consulter en lecture seule que les informations collectives des équipes pour lesquelles son compte possède une autorisation explicite**. Une affectation comme membre d'une équipe ne vaut **pas** habilitation de compte applicatif. Les autorisations de données individuelles, administratives et de documents continuent de s'appliquer indépendamment.

### Critères contractuels ajoutés à SMN-282 : AC23–AC27

- **AC23 — Administrateur :** accès aux équipes de sa propre installation uniquement ; lecture, création et modification, conformément aux permissions existantes et vérifications serveur.
- **AC24 — Utilisateur :** une personne autorisée sur Koala/Tigre ne voit dans le sélecteur que Koala/Tigre et leurs données collectives lisibles ; Panda n'apparaît pas et n'est pas consultable directement.
- **AC25 — Refus sans fuite :** aucune URL, préférence mémorisée, `teamId`, `cycleId`, API ou export ne permet de lire, modifier ou découvrir un objet d'une équipe hors autorisation. L'utilisateur n'obtient aucun droit d'écriture.
- **AC26 — Révocation :** un droit retiré devient inopérant pour les nouvelles requêtes, y compris en cours de session ; ne pas réutiliser la sélection préférée ou des données en cache comme preuve d'autorisation.
- **AC27 — Périmètre :** autorisation serveur basée sur le compte authentifié, l'installation, les habilitations explicites par équipe et la propriété des cycles, membres, registres, documents et rapports. Audit des attributions/révocations ; pas de mutation interéquipes implicite.

### Impacts techniques identifiés, non réalisés

- `src/server/access-policy.ts` contrôle aujourd'hui essentiellement rôle et `resource.inScope`, sans relation d'habilitations individuelles à une liste d'équipes ; tout `inScope` devra provenir d'une résolution serveur réelle et vérifiable.
- `prisma/schema.prisma` expose `SmnAccount`, `SmnTeam` et `SmnInstallation`, mais aucune relation explicite compte–équipe autorisée. Prévoir une association par identifiants stables, une contrainte anti-doublons, des attributions/révocations auditables et une migration préservant l'installation existante.
- `src/app/app/private-shell.tsx` ne devra proposer que les équipes autorisées ; les APIs, lectures, recherches, filtres, exports, historiques et mutations doivent réévaluer l'accès côté serveur. Les protections des documents et données individuelles existantes ne sont jamais assouplies.
- Ne jamais inférer une habilitation de la simple présence d'un `teamId` dans l'URL ou d'une affectation d'un membre physique. Un compte `user` sans équipe doit avoir un état neutre sans divulgation.

### Décisions encore ouvertes

**À valider avant développement :** interface et parcours par lesquels l'Administrateur accorde et retire les équipes à un compte (page des utilisateurs existante ou écran dédié) ; migration des comptes `user` préexistants avec historique d'accès, politique pour un nouveau compte sans attribution, règle de conservation/réinitialisation des filtres à la bascule ; homonymies d'équipes ; erreurs de navigation/chargement et stratégie de rollback. **L'option B n'autorise aucune affectation automatique présumée.** Aucun code applicatif, migration ou test réalisé. Référence : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).
