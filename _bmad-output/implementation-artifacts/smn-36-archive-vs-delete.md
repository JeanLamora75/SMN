# SMN-36 — Distinguer archivage réversible et suppression ordinaire

Date : 09/11/2026  
Jira : https://lmn24.atlassian.net/browse/SMN-36 — Epic SMN-2  
**État : implémentation renforcée sur `main`, tests unitaires rédigés et migration additive disponible ; recette réelle non attestée.**

## Existant vérifié
- `src/server/teams/write.ts` : archivage/réactivation d'équipe via `is_archived`, conservation du même `id`, des relations et audit dans la transaction ; refus de l'archivage de la dernière équipe active. La vérification de révision protège les changements concurrents.
- `src/server/members/lifecycle.ts` : `archived_at` et `archived_by` pour les membres, réactivation sur le même `id`, audit des changements. Le départ d'affectation ne vaut pas effacement.
- `src/server/sprints/deletion.ts`, `src/server/kanban/delete.ts` : suppression **logique** et audit atomique des cycles planifiés éligibles ; pas de destruction des historiques de clôture.
- `src/server/countries/lifecycle.ts` : archivage et réactivation des pays avec vérification des membres actifs et paramètres de référence.

## Correctifs du lot
1. **Suppression d'un membre provisoire vide :** l'ancienne opération tentait de supprimer la fiche puis d'insérer un événement dans son historique ; ce journal lié par identité rendait la suppression fragile/incohérente. Elle écrit désormais dans `smn_member_removal_audit`, **table sans clé étrangère vers la fiche supprimée**, avec un trigger refusant UPDATE/DELETE, en enregistrant uniquement identifiants techniques, Administrateur, révision, confirmation et date. La suppression et l'audit utilisent **la même transaction** : panne d'audit => ROLLBACK.
2. **Détection des références bloquantes :** `inspectMemberForeignReferences` examine chaque contrainte FK simple visant `smn_member` dans `pg_catalog` et compte les références réelles à l'identifiant ciblé. Une FK composite ou une relation incertaine interdit l'effacement. Les affectations, calendriers, lieux et événements déjà inspectés restent contrôlés par le module existant. Une violation FK au moment du DELETE entraîne aussi un refus avec ROLLBACK.
3. **Prévisualisation :** l'API existante `GET /api/admin/members/[id]/lifecycle` fournit désormais `deletionImpact` : nombre de références FK, sources, indicateur d'incertitude, état de l'audit, nécessité d'une confirmation et caractère permanent. Dans la fiche membre, les détails des liens bloquants sont consultables ; l'indisponibilité du journal et l'impossibilité de connaître les références sont explicites.
4. **Confirmation :** suppression ordinaire limitée à une fiche **provisoire vide**, jamais utilisée, sans historique ni relation ; confirmation littérale `SUPPRIMER` et révision concordante. Toute autre fiche doit être archivée, non supprimée. L'exécution revérifie les références sous transaction et un verrou sur la fiche ciblée.
5. **Migration contrôlée :** `src/server/members/removal-audit.ts` définit la table et `scripts/smn-36-removal-audit.ts` installe ou vérifie celle-ci sur une base PostgreSQL SMN locale. Aucun DDL appliqué automatiquement sur la base réelle ; tant que la table n'existe pas, `canDelete=false` et la route renvoie `audit-not-ready` (503).
6. Traductions FR/EN et tests `tests/smn-36-lifecycle-safety.test.ts` (archive, réactivation, suppression ciblée, références, conflits et panne d'audit).

## Qualification Windows : à exécuter

Avec une base de test isolée, sauvegardée et **explicitement sélectionnée**, dans PowerShell depuis la racine du dépôt :

```powershell
pnpm exec tsx scripts/smn-36-removal-audit.ts --check
pnpm exec tsx scripts/smn-36-removal-audit.ts --apply --confirm=INSTALL_MEMBER_REMOVAL_AUDIT
pnpm exec tsx scripts/smn-36-removal-audit.ts --check
pnpm exec tsx --test tests/smn-36-lifecycle-safety.test.ts
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
```

Ces commandes **n'ont pas été exécutées** depuis l'environnement GitHub. L'installation sur une base réelle doit suivre uniquement une recette réussie et un accord explicite. Le script ne publie pas de secrets, exige une connexion PostgreSQL locale vers `smn` ou `smn_*` et ne modifie pas le SQL figé de la baseline v33.

## Traçabilité des critères
| AC | Couverture actuelle |
|---|---|
| AC1 — Archivage avec identité/historique conservés | Déjà développé pour équipe/membre/pays ; contrat réexaminé, tests pour membres rédigés |
| AC2 — Réactivation sans duplication | Déjà développée ; tests de maintien de l'identifiant rédigés |
| AC3 — Protection si référence historique | Contrôle des FK réelles renforcé, informations d'impact exposées, blocage côté serveur |
| AC4 — Suppression ordinaire contrôlée | Corrigée pour fiche provisoire vide, trace indépendante et ROLLBACK ; migration et recette manquantes |
| AC5 — Application sur objets existants | Équipes et membres déjà présents, pas de dépendance à une future création |

## Limites et invariants
- Le service de suppression ne constitue **pas** un effacement RGPD exceptionnel. Pour une fiche comportant de l'historique, SMN-38/39/40 s'appliquent.
- La détection FK n'infère pas la présence dans les textes libres, archives Office/PDF ou métriques ; une **fiche véritablement utilisée** ne doit jamais passer le filtre « provisoire vide, révision zéro, aucun lien connu ».
- Les opérations d'archivage ne réécrivent pas le passé et ne restaurent pas fictivement des cycles clos.
- Des cycles clôturés et archives immuables ne sont jamais détruits par ce parcours.
- L'installation de la table d'audit, le succès des tests et la recette PostgreSQL restent **non attestés**. Ne pas clôturer Jira avant qualification.

## Adaptation BMAD
Le script `uv` du skill `.agents/skills/bmad-build/SKILL.md` n'est pas exécutable sur GitHub ; intervention via les connecteurs GitHub/Jira sans prétendre avoir exécuté le workflow officiel ou les tests.

## Garantie complémentaire du registre
Le registre de suppression ordinaire est protégé par un trigger PostgreSQL `smn36_removal_audit_immutable` interdisant `UPDATE` et `DELETE`. La vérification `MEMBER_REMOVAL_AUDIT_READY_SQL` contrôle sa présence, son activation, la fonction appelée et les événements couverts ; une simple table créée sans trigger ne donne jamais le droit de supprimer une fiche. Le script `--check` applique le même contrôle. Cette protection reste à qualifier par des tests SQL réels sur base isolée.
