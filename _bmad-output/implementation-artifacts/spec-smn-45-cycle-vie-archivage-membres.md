# SMN-45 — Story 3.4 : Clôturer, archiver et réactiver sans effacer l'histoire

**Jira :** https://lmn24.atlassian.net/browse/SMN-45 · Epic 3 · FR-4/7 · D-PRD-006/012/135/137 · AD-12/19/31 · SEC-04.

## Décision de périmètre

Le MVP Scrum/Kanban comprend **une équipe par installation**, confirmé par D-PRD-137. Le critère AC1 de gestion de « l'équipe A sans toucher l'équipe B » sera pleinement applicable aux trains SAFe v1.0 ; le MVP cible uniquement l'équipe singleton et refuse toute référence à une autre équipe. Cette adaptation ne doit pas être présentée comme un support multiéquipes.

SMN-42 à 44 fournissent les identités métiers, affectations datées, versions de rôles et données individuelles confidentielles. Les mécanismes avancés de rétention et restauration de l'Epic 2 restent à qualifier avant utilisation avec des données importantes. Le comportement conservateur de cette Story **n'est pas** une implémentation globale de toutes les politiques de rétention de l'Epic 2.

## Contrat et critères d'acceptation

**AC1 — Clôturer uniquement l'affectation choisie :** le serveur contrôle l'UUID du membre, l'affectation, l'appartenance à l'unique équipe et la révision. `end_on` est la dernière date civile de participation, entre `start_on` et le jour serveur PostgreSQL inclus. Aucune autre affectation n'est modifiée et aucune ligne historique de rôles n'est supprimée. Refus si une version de rôles a une date d'effet postérieure à la date demandée. L'action enregistre un événement d'audit.

**AC2 — Effectif inférieur à trois :** après clôture, compter les personnes possédant une affectation non clôturée ayant commencé à la date courante et non archivées. Pour moins de 3, retourner `warning=team-below-three` **sans revenir en arrière**, sans créer automatiquement de remplaçant ni contraindre l'effectif minimum de l'installation Express.

**AC3 — Archiver puis réactiver sans duplication :** archivage possible seulement en l'absence d'affectation ouverte. Modifier `smn_member.archived_at` et `archived_by`, incrémenter la révision, conserver l'UUID, l'e-mail, les anciennes affectations, versions, dates et autres futures références (absences, capacités). Réactivation : retirer le drapeau d'archivage ; **ne pas rouvrir** l'ancienne affectation. Une nouvelle affectation datée peut être créée avec SMN-44 à une date postérieure à la fin précédente.

**AC4 — Effacement exceptionnel de fiche vide :** un formulaire privé présente une analyse d'impact et exige le texte `SUPPRIMER` et une confirmation supplémentaire. Le serveur vérifie **dans une transaction et après verrouillage** : pas d'affectation, pas d'événement d'audit antérieur, fiche encore provisoire (nom générique, e-mail vide, paramètres initiaux, révision 0), non archivée. Il rejette tout risque de cascade ou action mutante par FK. Une contrainte FK inconnue `RESTRICT/NO ACTION` interdit physiquement l'effacement (`23503`). Un événement d'audit `delete` est créé avec un `member_id` texte conservé (sans FK) pour garder une trace du geste. Une personne normalement créée par SMN-42 ayant une affectation historique n'est **pas supprimable**, même si elle est archivée.

**AC5 — Refus de suppression avec historique :** réponse `409 historical-references`, explication UX et propositions de clôture ou archivage ; aucune suppression de ses anciennes participations ou capacités.

## Implémentation

- Migration **v11 → v12** additive : `src/server/members/lifecycle-migration.ts`, miroir `prisma/migrations/20261021_smn45_member_lifecycle/migration.sql`. Ajout des champs `archived_at`, `archived_by`, table `smn_member_lifecycle_event` (action, membre, affectation éventuelle, date, auteur, horodatage, détails). Audit **sans FK vers le membre** pour conserver un événement de suppression autorisée.
- `src/server/members/lifecycle.ts` : `inspectMemberLifecycle`, `parseLifecycleAction`, `applyLifecycleAction` avec `BEGIN`, verrou de ligne du membre, validation métier, transaction, événement d'audit et relecture de l'effectif. Les updates de profils et d'affectations de SMN-43/44 verrouillent le même membre.
- `src/app/api/admin/members/[id]/lifecycle/route.ts` : GET analyse d'impact et POST actions. Authentification/autorisation Administrateur vérifiées serveur ; réponses individuelles `no-store`, contrôle d'origine pour toute mutation.
- `src/server/members/quick-create.ts` : roster affichant **exactement une ligne par identité**, même si plusieurs affectations closes existent ou si la personne est archivée/non affectée. Dernière affectation ouverte prioritaire, sinon dernière close ; aucune production de capacité fictive.
- `src/server/members/assignment.ts` : après réactivation, création d'une **nouvelle** affectation datée, strictement après toute précédente fin, sans rouvrir ni supprimer les anciennes. Les membres archivés ne peuvent pas recevoir d'affectation.
- `src/app/app/admin/members/member-lifecycle-editor.tsx` : liste historique, date de fin, actions protégées par confirmation, avertissement non bloquant et accès conditionnel à la suppression. Traductions JSON français/anglais.
- Diagnostic d'installation, schéma Prisma et migration du moteur alignés sur version 12.

## Couverture et limites de recette

Tests rédigés : `tests/member-lifecycle.test.ts` (validation, clôture, avertissement, archive/réactivation, refus historique, migration), `tests/member-assignment.test.ts` (nouvelle affectation après clôture), `tests/quick-team-members.test.ts` (lecture par affectation historique), et `scripts/verify-http-ci.mjs` (refus accès, API, fermeture, archivage, réactivation, statut, événements SQL, sous-effectif).

**Non attesté à ce stade :** tests Node, typage, lint, build, PostgreSQL 18.6 réel, recette Windows 11, restauration des données. Ne pas clôturer Jira avant validations. Le workflow BMAD `bmad-build` demande un dépôt local complet et le lanceur `uv run --no-cache`; non exécuté ici, adaptation manuelle par connecteurs GitHub/Jira.

## Étapes ultérieures

La clôture et l'archivage n'annulent pas les calendriers historiques ni les absences à venir ; les tables détaillées des absences et capacités seront livrées dans des Stories ultérieures et devront référencer `smn_member.id` sans cascade destructrice. Une règle de rétention commune à tous les domaines n'est pas déduite de SMN-45.
