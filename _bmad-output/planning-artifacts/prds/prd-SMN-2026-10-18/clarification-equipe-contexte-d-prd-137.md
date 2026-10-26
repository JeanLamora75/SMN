# SMN — Clarification du périmètre équipe et du contexte Agile

## D-PRD-137 — Équipe unique MVP et rattachement du contexte Agile

**19 octobre 2026 — décision explicitement validée par l'utilisateur, puis mise à jour de Jira et de la documentation autorisée.**

| Règle | Scrum / Kanban — MVP | SAFe — v1.0 |
| --- | --- | --- |
| Équipes par installation | Exactement une équipe | Plusieurs équipes dans le train |
| Vision et Product Goal | Rattachés à l'équipe | Rattachés au train (ART) |
| DoD et DoR | Rattachées à l'équipe | Rattachées au train (ART), communes aux équipes |

Le produit reste unique et fixe pour la durée de l'installation. Le MVP n'expose aucun ajout de seconde équipe interne, aucune affectation multiéquipes interne et aucun écran ART. Le serveur doit refuser ces opérations même par API. Les dépendances vers des équipes externes restent permises par nom libre, sans créer d'équipe interne ni de compte. Les règles multiéquipes antérieures sont réservées à SAFe v1.0 ; elles ne constituent plus des critères MVP.

Vision et Product Goal restent distincts et facultatifs, saisissables/modifiables par l'Administrateur, avec versions datées conservées. DoD et DoR restent facultatives, sous forme de texte interne ou de lien externe ; les révisions enregistrées restent identifiables. Un historique d'URL ne garantit ni l'archivage ni l'historicité du contenu distant. Ces contenus ne changent pas le produit fixe, les KPI ou les objectifs de cycle et ne réécrivent pas les anciens PDF. L'Utilisateur n'a aucun droit de modification ; sa consultation collective autorisée conserve les protections de D-PRD-136.

**Découpage explicite :** Story 3.24 / [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) (vision/Product Goal) et Story 3.25 / [SMN-222](https://lmn24.atlassian.net/browse/SMN-222) (DoD/DoR), sous Epic 3, I1–I2 ; Story 6.9 / SMN-120 consomme ces données et leurs versions. Les contrats peuvent prévoir le propriétaire ART futur, sans implémentation SAFe au MVP.

Cet amendement complète les FR existantes (notamment FR-1/5/7/27/28/61/66/70/71) et les décisions F-26–34/F-58–63/F-116–124, sans renumérotation ni annulation de l'historique. Il prévaut sur les passages antérieurs incompatibles et clôt les ambiguïtés métier C1/C2 du contrôle de préparation, une fois la correspondance Jira vérifiée. Les réserves techniques C3/C4 et le séquencement I0–I6 demeurent. Aucun développement ni test applicatif effectué.

## Évolution demandée le 26/10/2026 — non arbitrée

La [Story 3.26 / SMN-282](https://lmn24.atlassian.net/browse/SMN-282), demandée le 26 octobre 2026, vise la **création d'une nouvelle équipe et l'édition d'équipes depuis « Paramètres > Équipes »** avec quatre champs dont seul le nom de l'équipe est obligatoire. Voir l'[avenant de cadrage](../../ux-designs/ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md).

Cette nouvelle demande **entre en conflit** avec D-PRD-137 et avec les contraintes actuelles d'unicité sur équipe/produit par installation. **Jusqu'à décision produit explicite de changement de périmètre et mise à jour des contrats d'architecture, D-PRD-137 continue de s'appliquer.** La création de la Story et la documentation associée n'autorisent ni un contournement API ni une migration implicite. À arbitrer : mono/multiéquipes Scrum/Kanban, produit partagé ou par équipe et facultatif, sélection d'équipe active, autorisations et non-régression.


## Avenant D-PRD-137 — Validation multiéquipes le 26 octobre 2026

**Décision produit explicitement validée : plusieurs équipes internes sont autorisées dans une installation Scrum ou Kanban dès le MVP.** La restriction monoéquipe de D-PRD-137 du 19/10/2026 est remplacée **uniquement sur le nombre d'équipes**. Les descriptions de monoéquipe ci-dessus sont conservées à titre d'historique et ne sont plus le comportement produit cible.

**Non encore arbitré** : produit partagé ou produit propre à chaque équipe, possibilité d'absence de produit (seul le nom d'équipe est obligatoire dans SMN-282), sélection de l'équipe active, portée des membres, cycles, capacités, calendriers, registres, rapports, droits et historiques. La cible SAFe et les autres décisions du 19/10 ne sont pas implicitement modifiées. La gestion multi-affectations d'un même membre entre plusieurs équipes n'est pas autorisée par ce seul avenant.

**Écart technique vérifié** : `SmnTeam.installationId @unique`, `SmnProduct.installationId @unique`, `SmnTeam.productId` obligatoire et `SmnProduct.name` obligatoire (Prisma). Ce modèle doit évoluer de manière contrôlée après les arbitrages restants, avec migration sans perte de données et isolation serveur. L'approbation produit n'est pas une autorisation de supprimer immédiatement les protections applicatives sans solution cohérente.

Voir [Story 3.26 / SMN-282](https://lmn24.atlassian.net/browse/SMN-282) et [avenant d'architecture UX Équipes](../../ux-designs/ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md).

## Avenant D-PRD-137 — Produit indépendant et facultatif par équipe (Option A, 26/10/2026)

**Décision explicitement validée par le Product Owner :** en complément du multiéquipes Scrum/Kanban MVP, **chaque équipe dispose de son propre produit indépendant, facultatif (cardinalité équipe → zéro ou un produit)**. Le produit d'une équipe n'est jamais une référence partagée avec une autre équipe au MVP. L'équipe se crée et se modifie avec **son seul nom obligatoire**. **Nom du produit, Vision du produit et Product Goal sont chacun facultatifs**.

La Vision et le Product Goal sont du **contexte rattaché à l'équipe**, y compris lorsqu'aucun produit n'est renseigné. Une équipe sans produit n'entraîne **aucune création de produit fictif ni de nom par défaut**. Deux produits portant le même nom restent indépendants (identifiants distincts). Renommer un produit ne modifie pas le produit d'une autre équipe ni son identifiant courant. Lorsque le nom du produit est retiré, l'absence de produit courant ne doit **pas supprimer des preuves ou références historiques** : conception de détachement/audit à prévoir avant migration.

**Cet avenant remplace, pour le MVP Scrum/Kanban, l'ancienne règle « produit unique et fixe par installation » datée du 19 octobre 2026.** Les décisions historiques ci-dessus sont conservées pour traçabilité, pas pour définir le comportement cible.

**Écarts techniques identifiés (non implémentés) :** `SmnTeam.installationId @unique`, `SmnProduct.installationId @unique`, `SmnTeam.productId` obligatoire, `SmnProduct.name` non nul, API et éditeur [SMN-221](https://lmn24.atlassian.net/browse/SMN-221) exigeant `productName`. La future migration doit préserver l'équipe existante, son produit/ID, les audits et les rapports ; supprimer l'unicité par installation au profit d'un lien optionnel et non partagé vérifié côté serveur. Le schéma exact sera fixé durant la conception technique.

**Encore à arbitrer avant toute implémentation :** choix et mémorisation de l'équipe active, propagation contrôlée aux pages et API, isolation des données, règles de conflits contextuels et homonymies. La propriété Produit en SAFe v1.0 et l'affectation simultanée d'un membre à plusieurs équipes ne sont pas modifiées par déduction. Aucune migration, aucun test ni code exécutés pour cette décision.

Références : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282), [avenant UX Équipes](../../ux-designs/ux-equipe-membres-2026-10-22/AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md).

## Arbitrage d'interface — Équipe active globale par utilisateur (Option A, 26/10/2026)

**Validé explicitement :** pour le MVP Scrum/Kanban multiéquipes, le sélecteur d'équipe active est placé dans **l'en-tête global**, à côté du sélecteur de cycle (Sprint / période Kanban). La dernière équipe sélectionnée est mémorisée **par utilisateur**, entre navigations et sessions. Les équipes accessibles sont limitées par les permissions serveur effectives ; une préférence personnelle ne constitue jamais une autorisation. Le mécanisme de persistance (préférence de compte côté serveur ou autre dispositif fiable) reste un choix d'implémentation à instruire après cadrage.

**Invariants :** équipe sélectionnée identifiée par `teamId` stable, pas par libellé ; changement du choix d'un utilisateur sans altérer le choix d'un autre ; création d'une équipe sans basculer automatiquement l'équipe active ; un ancien `teamId` devenu inaccessible ne doit ni exposer ses données ni produire de mutation. Affichage accessible (clavier, libellé, responsive, FR/EN).

**Reste à arbitrer avant développement :** conserver la page courante ou aller vers le tableau de bord lors d'un changement ; cycle appartenant à la nouvelle équipe ; brouillons non enregistrés ; URLs et consultations historiques explicites ; gestion d'erreurs et des conflits, propagation/isolation de tous les producteurs métier. Aucun code, test ou migration réalisé pour cette décision.

**Source vérifiée :** `src/app/app/private-shell.tsx` contient déjà `smn-current-team`, actuellement désactivé, et le sélecteur de cycle voisin. `src/app/app/layout.tsx` fournit le contexte serveur actuel ; pas de supposition de prise en charge multiéquipes existante. Traçabilité : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).

## Arbitrage de navigation — Maintenir la rubrique au changement d'équipe (Option B, 26/10/2026)

**Décision explicitement validée :** avec le sélecteur global d'équipe (Option A), choisir une autre équipe **conserve la rubrique courante si une rubrique équivalente, accessible et applicable existe dans le contexte de la nouvelle équipe**. Les données proviennent exclusivement de l'équipe cible. Si l'utilisateur se trouvait dans le détail d'un objet de l'équipe précédente, il revient vers la liste/section parent de la nouvelle équipe si possible, sinon vers son tableau de bord. Une rubrique indisponible ou non applicable replie vers le tableau de bord autorisé ; aucun contenu appartenant à l'ancienne équipe ne doit être présenté sous le nouveau contexte.

**Sécurité minimale non négociable :** aucune mutation métier lors d'un simple changement d'équipe ; ne jamais reporter les identifiants d'objets de la première équipe dans la seconde ; recontrôler côté serveur les droits et l'appartenance des données, des cycles, des URL explicites, des ressources historiques et des rapports. Une préférence d'équipe n'étend pas les permissions.

**Restent à arbitrer** : cycle cible (choix automatique ou vide), brouillons non enregistrés, URLs historiques et priorité entre URL et choix utilisateur, filtres et échecs de transition, protocole d'isolation détaillé. Aucun développement ou test effectué dans cet arbitrage. Référence : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282).

## Arbitrage de cycle — Autosélection dans l'équipe cible (Option A, 26/10/2026)

**Décision produit validée :** après sélection d'une autre équipe depuis l'en-tête, le Sprint Scrum ou la période Kanban pertinente de **cette nouvelle équipe** est sélectionné(e) automatiquement : cycle en cours, sinon prochain, sinon dernier disponible. Si cette équipe ne possède **aucun cycle**, le sélecteur reste vide et la page affiche un état honnête sans inventer de métriques. Les rubriques indépendantes d'un cycle restent disponibles.

**Invariants :** la décision de sélection porte sur les données autorisées de l'équipe cible, identifiées par `teamId`. Le cycle de l'équipe précédente, les ID provenant d'URL étrangères et les données historiques non pertinentes ne sont jamais transférés au nouveau contexte. Aucune création, mutation de statut ou révision d'archive n'est induite par la sélection. Un échec de chargement n'est pas confondu avec une équipe sans cycle.

**Impact technique à traiter après autres arbitrages :** réutiliser la règle de `defaultSprintId` de `src/lib/sprint-context.ts` (en cours > prochain > passé, fallback pour cycles seulement clôturés/suspendus), après limitation aux cycles de l'équipe cible ; concevoir la règle temporelle équivalente et sa recette pour les périodes Kanban. Respecter statuts, autorisations, cycles historiques et non-rétroactivité. Encore ouverts : brouillons non sauvegardés, URL explicites, filtres, gestion des échecs et isolation détaillée. Référence [SMN-282](https://lmn24.atlassian.net/browse/SMN-282). **Documentation uniquement.**

## Arbitrage UX — Confirmation avant perte des brouillons (Option A, 26/10/2026)

**Décision utilisateur validée :** une demande de changement d'équipe depuis le sélecteur global, lorsqu'un formulaire de l'équipe courante contient des modifications non enregistrées, déclenche une **confirmation explicite d'abandon**. Les choix sont « Rester sur [équipe actuelle] » et « Abandonner et changer d'équipe ». Annulation ou fermeture : maintien intégral de l'équipe, du cycle, de l'URL et du brouillon ; aucune modification de préférence d'équipe. Confirmation : abandon du seul brouillon local, puis transition autorisée selon la navigation Option B et la sélection du cycle Option A.

Une écriture serveur en cours doit être sécurisée contre une bascule concurrente ; aucun succès ne doit être annoncé sans confirmation serveur. Le dialogue est accessible et traduit FR/EN. Ce contrat ne demande ni sauvegarde implicite ni persistance des brouillons entre équipes.

**Restent à arbitrer** : URL explicite / équipe mémorisée, historiques, portée des filtres, échecs de bascule et architecture d'isolation serveur ; règles de changement hors sélecteur global non modifiées tacitement. Aucun code ni migration, test ou recette exécutés. [SMN-282](https://lmn24.atlassian.net/browse/SMN-282), AC16–AC18.
