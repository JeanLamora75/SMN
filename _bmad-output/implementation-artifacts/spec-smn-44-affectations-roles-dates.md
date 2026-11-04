# SMN-44 — Story 3.3 : Affectations datées et répartitions de rôles Agile

**Epic 3 / MVP Scrum-Kanban** · [Jira SMN-44](https://lmn24.atlassian.net/browse/SMN-44) · FR-4/5/7/61, F-26–34/58–63, D-PRD-009/010/011/137, AD-12/16/19/31.

## Pré-requis vérifiés

SMN-42 et SMN-43 fournissent le membre central `smn_member`, la participation unique `smn_member_assignment`, la matrice d'accès `members` réservée à l'Administrateur, et l'installation Express dotée d'une seule équipe. Le schéma en `main` était à la version 10. **Attention : la recette Windows/PostgreSQL des Stories précédentes est toujours en attente.**

## Contrats AC1–AC5

**AC1** — L'API `POST /api/admin/members/[id]/assignment` autorise la création transactionnelle d'une affectation initiale **seulement pour un membre existant dépourvu de toute affectation**. Elle réutilise son UUID et la seule équipe de l'installation ; elle ne crée ni membre ni équipe. La création rapide SMN-42 crée déjà les affectations des membres initiaux.

**AC2** — `teamId` est contrôlé par rapport à la vraie équipe singleton en PostgreSQL. Toute seconde équipe, autre affectation, retour d'une affectation close ou demande hors périmètre est refusée **sans écriture**. La part de temps affectée (0 à 100 %) ne peut jamais dépasser le temps contractuel prévu dans la version correspondante. Une contrainte SQL répète cette règle.

**AC3** — La répartition est composée de trois parts indépendantes `scrumMaster`, `productOwner`, `developer` entre 0 et 100 **avec somme égale à 100**. Le coefficient de contribution est un pourcentage indépendant, de 0 à 100 ; la somme des parts et la comparaison allocation/contrat sont vérifiées côté API **et** PostgreSQL. Deux rôles ou plus peuvent être présents. Il n'existe qu'une équipe MVP ; le multiéquipe relève de SAFe v1.0.

**AC4** — Les parts Scrum Master et Product Owner **ne produisent pas** de part Développeur. `developerShare = shares.developer / 100`, et vaut zéro pour une allocation exclusivement SM/PO. Ce pourcentage **n'est pas une capacité en JH** : aucun calendrier complet, aucune disponibilité historique, aucun KPI de période n'est créé par SMN-44.

**AC5** — Le modèle garde les versions `smn_member_assignment_version` **en insertion seulement**, avec `effective_from`, taux contractuel, taux d'affectation, coefficient, trois parts de rôles, révision, auteur et horodatage. Les demandes portant une date antérieure à **aujourd'hui** ou à la plus récente date enregistrée sont rejetées. Une correction le même jour est autorisée comme **nouvelle révision** conservant toutes les anciennes ; la plus récente du jour s'applique. Les versions futures n'affectent pas les dates antérieures. Un verrou de ligne du membre et `revision` optimiste évitent des collisions concurrentes ; conflits 409.

## Architecture et migration

**Schéma version 11**, migration additive `src/server/members/assignment-migration.ts`, SQL miroir `prisma/migrations/20261021_smn44_assignment_versions/migration.sql`. `CREATE TABLE smn_member_assignment_version` avec contraintes, index par (assignment, date, révision), et reprise SQL des affectations antérieures (une version initiale par affectation depuis `start_on`, rôle actuel à 100 %). Les nouvelles créations rapides SMN-42 insèrent la version initiale dans la même transaction que le membre et son affectation.

- `src/server/members/assignment.ts` : validation, lecture versionnée `readMemberAssignment`, création/édition `saveMemberAssignment`, transaction atomique avec verrouillage du membre, dates lues selon `CURRENT_DATE` PostgreSQL, insertion append-only.
- `src/app/api/admin/members/[id]/assignment/route.ts` : `GET` versions privées et `POST` changement/création, contrôle Administrateur côté serveur et validation de l'origine HTTP.
- `src/server/members/quick-create.ts` : projection du **dernier état applicable** à la date courante sans substituer les valeurs futures, initialisation des versions pour les nouvelles fiches, JH toujours `null`.
- `src/app/app/admin/members/assignment-editor.tsx` et `quick-members-admin.tsx` : écran d'édition des trois parts, historique affiché, messages de validation, retour après succès, avertissement de saisie non enregistrée, internationalisation JSON FR/EN.
- `prisma/schema.prisma`, sonde/diagnostics et `ensureAccountsSchema` alignés sur v11.

### Limites de cet incrément

- Seuls les trois rôles Agile du contrat MVP SMN-42 sont proposés ici ; un catalogue extensible n'est pas implémenté.
- La durée du calendrier et les capacités JH restent non calculables jusqu'aux Stories dédiées.
- Une correction portant une date civile déjà passée est interdite ici (non-rétroactivité par défaut). Les reprises historiques réglementées relèvent de futurs workflows.
- Si plusieurs révisions portent la même date, les entrées précédentes **ne sont pas supprimées** mais elles ne sont pas réappliquées dans une vue « à cette date » (la dernière révision prévaut). Le détail de toutes les révisions est conservé.

## Vérification et suivi

Tests **rédigés, non encore exécutés dans cette session** :
- `tests/member-assignment.test.ts` : validation, zéro part Développeur, version append-only, création d'affectation d'un membre non affecté, refus équipe externe/taux/date/révision, rollback, lecture.
- `tests/quick-team-members.test.ts` : cinq versions initiales, date cohérente PostgreSQL.
- `scripts/verify-http-ci.mjs` : HTTP/SQL réel sur base éphémère (rôles à 20/0/80, taux 80 et coefficient 75, refus 403/404/400/409, historique deux versions, droits Utilisateur refusés).

Qualifications requises : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, pipeline PostgreSQL 18.6/Linux/Windows puis recette manuelle. Ne pas passer Jira à « Terminé » avant preuves. Le workflow natif BMAD `bmad-build` requiert un dépôt complet et son lanceur `uv run --no-cache` ; cette implémentation passe par les connecteurs et constitue une adaptation manuelle, **sans invocation ni attestation du lanceur natif**.


## Avenant du 03/11/2026 — Reprise d'historique après fin d'affectation

**Décision :** la fermeture d'une affectation d'équipe ne rend pas les taux et rôles définitivement non modifiables. L'administrateur doit pouvoir corriger les versions datées d'une affectation clôturée, même si le membre a quitté l'équipe.

**AC-H1 :** afficher un éditeur « Corriger une version historique » pour toute affectation terminée. Choix d'une date d'effet comprise dans `start_on..end_on` (bornes incluses), préremplissage des taux contractuel, allocation, contribution et parts des rôles.
**AC-H2 :** enregistrer une nouvelle révision de correction sans effacer les révisions précédentes, avec référence à la date/version cible et attribution de l'auteur ; contrôler la cohérence des pourcentages, la révision courante, l'installation et l'équipe. Pas d'édition rétroactive silencieuse.
**AC-H3 :** si une correction risque de modifier une capacité/snapshot historique clôturé, conserver le snapshot figé et tracer le changement. Les calculs dynamiques éventuels ne doivent être recalculés que selon les règles d'intégration approuvées.
**AC-H4 :** rendre les erreurs explicites dans la modale ; tests UI, multiéquipe, versions concomitantes, dates limites et PG requis.

**Traçabilité :** https://lmn24.atlassian.net/browse/SMN-45. La publication documentaire n'atteste pas une recette exécutée.


## Avenant du 04/11/2026 — SMN-379 : correction ciblée et annulation contrôlée d'une révision

**Objectif** : éviter l'accumulation de corrections de saisie dans l'historique des affectations sans supprimer les vrais changements de rôle.

- Chaque révision dispose d'une commande **Modifier** (crayon) ciblant son identifiant exact. Le simple filtre par date d'effet ne suffit pas lorsque plusieurs révisions portent la même date.
- La commande **Annuler** (croix) n'est proposée que pour la **dernière révision en numéro** de l'affectation concernée, jamais la révision 1. La date de création, et non l'ordre de tri de l'écran, ne doit pas modifier cette règle.
- Annulation = retrait de l'état métier actif, **sans suppression physique des données historiques** et avec preuve d'audit (version, acteur, horodatage et motif). Les révisions restantes ne sont pas renumérotées ; une révision annulée ne doit plus déterminer la répartition applicable.
- Précondition stricte : aucun lien à un snapshot ou rapport figé. Si la vérification de ces dépendances est indisponible, **refuser l'annulation** plutôt que supposer leur absence.
- Contrôles de droits de l'équipe, concurrence et confirmation explicite ; actualisation de la fiche après succès.
- La correction d'une version existante doit conserver la traçabilité des valeurs précédentes et ne jamais réécrire un rapport clos.

**Critères d'acceptation** : voir [SMN-379](https://lmn24.atlassian.net/browse/SMN-379) ; tests client, serveur, PostgreSQL et rapports figés requis. Une évolution du schéma doit utiliser une migration additive/versionnée, jamais une DDL exécutée au chargement d'une page.

**État** : documentation et Jira validés, implémentation à qualifier ; aucun test local/PG déclaré réussi sans exécution.


## Correctif opérationnel du 04/11/2026 — annulation auditée des saisies erronées

Un clic sur **Modifier** corrige désormais les valeurs de la révision choisie *sans créer une nouvelle révision*. La transaction capture les anciennes et nouvelles valeurs dans le journal de cycle de vie (identifiant de la version, date et auteur). La date d'effet n'est pas changée par ce geste.

**Annuler la dernière révision** : cette opération ne s'applique qu'au numéro actif le plus élevé, jamais à R1. Elle réalise un DELETE transactionnel **dans la table des versions applicables**, après insertion de la ligne complète dans `smn_member_lifecycle_event` (details.kind=`assignment-version-cancellation`). L'annulation est donc réversible par une procédure de restauration auditée, mais cette procédure n'est pas encore disponible dans l'interface. Aucune renumérotation ; les nouveaux numéros des services multiéquipe sont calculés à partir de la table active **et** des numéros archivés dans l'audit.

**Garde-fous** : équipe/administrateur contrôlés, verrou des écritures concurrentes, rejet si R1 ou non dernière, rejet si sprint clos ou snapshot de clôture sur la période, snapshot initial de capacité, ou rapport PDF archivé de l'équipe. Les requêtes de garde sont exécutées avant suppression ; si elles échouent, rollback total. Les rapports et les capacités figées ne sont pas modifiés.

**Conséquence** : les lecteurs dynamiques de capacité basés sur `smn_member_assignment_version` utilisent les seules révisions actives après l'annulation. Vérifier les indicateurs de charge totale et par rôle sur sprint ouvert avant/après la correction. Les données déjà figées ne sont pas recalculées.

**État :** code publié sur main ; tests, compilation et recette PostgreSQL restent non exécutés dans cet environnement. Ne pas utiliser cette suppression avant sauvegarde vérifiée de la base.


## Avenant du 04/11/2026 — changements de rôles datés (distincts des corrections)

**Besoin validé :** permettre de tracer les changements réellement intervenus à une date d'effet libre dans la période d'affectation, indépendamment de la date du jour. Exemple : 06/01/2026 Développeur (100 %), 20/02/2026 Product Owner (100 %) pour remplacement, 04/05/2026 Développeur (100 %).

**Règles et critères d'acceptation**
1. L'action **Nouveau changement de rôle daté** crée une nouvelle version métier, avec date d'effet saisissable entre la date de début et la date de fin de l'affectation (si elle est terminée), y compris rétroactivement. La date du jour n'est pas une borne minimale.
2. La version s'applique dès sa date d'effet incluse, jusqu'à la veille de la version suivante ou la fin d'affectation ; la sélection dans les capacités est gouvernée par `effective_from`, puis `revision`, et **non** par la seule date de création.
3. La date du changement ne peut pas précéder l'entrée ni dépasser la sortie. Une autre révision à date identique est rejetée explicitement : utiliser **Corriger une révision existante** à la place.
4. **Corriger une révision existante** modifie une erreur de saisie sur la version choisie et n'ajoute pas de nouvelle version ; l'audit avant/après est conservé.
5. Un changement passé est interdit si son intervalle d'effet recouvre un sprint clôturé, un snapshot de clôture, une capacité initiale figée ou un rapport archivé. Un refus doit expliquer l'existence de données figées.
6. Contrôles serveur : droits administrateur dans l'équipe, révisions optimistes, absence de chevauchement d'affectations, intégrité des 100 % de rôles et des taux d'allocation/contribution. La modale affiche clairement les deux parcours.
7. Tableau historique : **Date d'effet** visible pour chaque version, et conservation des versions lors d'un changement réel de fonction.
8. Tests : transitions Développeur → Product Owner → Développeur, insertion d'un changement passé entre deux versions, date déjà existante, concurrence, snapshots figés et calcul des charges de sprint.

**Implémentation :** `src/server/members/team-assignment-dated-change.ts`, route `team-assignment/dated-change`, `assignment-editor.tsx`, `member-team-read-only.tsx`. Publication sur main ; exécution TypeScript/tests/PG non encore effectuée.


## Correctif du 04/11/2026 — portée réelle des révisions et nettoyage sans dérive

Les contrôles d'interdiction liés aux sprints/rapports figés s'appliquent désormais **à l'intervalle réellement influencé par la version** : depuis sa date d'effet jusqu'à la veille de la prochaine version (ou fin d'affectation). Ils ne bloquent plus automatiquement toute la durée du contrat.

Deux versions ayant la même date sont résolues par le plus grand numéro. Une correction de la version antérieure **masquée** ne peut pas modifier la capacité actuellement calculée : elle peut donc être auditée même en présence d'archives. L'annulation de la dernière version est autorisée en présence de gel uniquement si la version qui redeviendrait applicable possède exactement les six mêmes paramètres de capacité (contrat, allocation, contribution, SM, PO, DEV). La preuve d'identité des données est évaluée côté serveur. Sinon, les sprints figés demeurent prioritaires et l'annulation reste refusée.

En cas de réponse HTTP 409, l'interface affiche le code de refus reçu du service ; un conflit ou un gel réel doit rester identifiable. Le cas Harshal Sutariya, R1 Développeur / R2 PO à la même date du 05/01/2026, est un changement de charge métier, pas un simple doublon redondant : l'annulation de R2 ne saurait contourner un sprint clos. Une reprise historique consciente de l'impact sur les charges devra être arbitrée séparément.

Tests : `smn-379-revision-impact.test.ts` et `smn-member-historical-correction-save.test.ts`. Aucune exécution locale déclarée.
