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
