# Epic 2 — Lot 1 : sécurisation des migrations, de l'immuabilité et de l'audit

**Date :** 9 novembre 2026  
**Stories :** [SMN-29](https://lmn24.atlassian.net/browse/SMN-29), [SMN-35](https://lmn24.atlassian.net/browse/SMN-35), [SMN-36](https://lmn24.atlassian.net/browse/SMN-36).  
**Référence :** branche `main`, baseline native v33 conservée intacte.  
**Principe :** aucune migration n'a été appliquée à l'installation de travail ; les scripts requièrent un lancement et une confirmation explicites.

## 1. Anomalies identifiées et corrigées

### SMN-36 : journal d'effacement ordinaire
- **Défaut reproductible dans le SQL source** : la fonction PL/pgSQL utilisait `AS $` / `$;`, qui ne constitue pas une délimitation valide du corps. Correction en `$smn36_guard$` et `$smn36_guard$;`.
- L'installation utilise désormais `CREATE OR REPLACE TRIGGER smn36_removal_audit_immutable` (PostgreSQL 18) : une seconde application rétablit un déclencheur supprimé/désactivé/mal configuré, au lieu de présumer qu'un nom suffit.
- Table `smn_member_removal_audit` indépendante de la fiche membre supprimée, sans nom/e-mail, avec référence acteur et révision. Un trigger interdit `UPDATE` et `DELETE`.
- Le service `lifecycle.ts` ne propose la suppression d'une fiche provisoire vide que si l'audit et son trigger sont vérifiés, les références absentes, la révision cohérente et la confirmation explicite.
- `scripts/smn-36-removal-audit.ts` : `--check` et `--apply --confirm=INSTALL_MEMBER_REMOVAL_AUDIT`. Les commandes ne sont pas exécutées automatiquement.

### SMN-35 : immuabilité des archives
- `smn35_archive_write_guard` passe d'un contrôle de présence par nom à une création **idempotente** par `CREATE OR REPLACE TRIGGER`. Ceci corrige le cas où un trigger de ce nom existe mais n'est plus une protection valide.
- Le contrôle `SMN35_ARCHIVE_GUARD_CHECK_SQL` examine l'activation, la fonction exacte et les événements `BEFORE UPDATE OR DELETE FOR EACH ROW` pour les snapshots de clôture et les archives PDF.
- Les transactions métier et l'audit de rétention restent dans une unité `BEGIN`/`COMMIT`/`ROLLBACK` ; **aucune garantie de transaction commune PostgreSQL/fichiers** n'est induite.
- `scripts/smn-35-archive-guards.ts` conserve une validation explicite de la base locale et le mode `--check`.

### SMN-29 : journal d'audit transversal
- `src/server/audit/journal.ts` agrège désormais les événements réellement conservés pour les comptes, paramètres, authentification, politique et purge des sauvegardes, sprints, cycle de vie des membres, contexte d'équipe, registres et archives PDF.
- Le journal de suppression ordinaire est inclus **uniquement si** sa table additive est présente ; son absence ne casse pas le journal v33 existant.
- La projection utilise une **liste blanche d'actions/types**, une source persistée, la date UTC, l'acteur et des références techniques ; les `JSONB` libres, mots de passe, contenus de documents, libellés personnels et e-mails ne sont pas repris. Les simples consultations ne créent aucun événement de succès.
- La route `GET /api/admin/audit` et la page Administration conservent les contrôles d'autorisation existants. Les nouveaux intitulés sont traduits FR/EN.
- Une entrée métier enregistrée représente l'existence d'un événement persistant ; elle ne prouve **pas**, à elle seule, qu'un fichier externe à PostgreSQL est toujours présent ou qu'une restauration a été testée.
- Cet enrichissement couvre **les sources explicitement raccordées**. La couverture exhaustive de toutes les écritures v33 et des fonctionnalités futures, notamment Dashboard Builder et indicateurs dynamiques, nécessitera une matrice dédiée par route et opération ; aucun audit non existant n'est inventé.

## 2. Validation automatisée

### Tests de contrat
- `tests/epic2-lot1-audit-coverage.test.ts` : liste blanche, confidentialité, refus des faux succès, lecture facultative de l'audit de suppression, syntaxe et idempotence du DDL.
- Suites existantes incluses : `tests/audit-journal.test.ts`, `tests/smn-35-atomicity-immutability.test.ts`, `tests/smn-36-lifecycle-safety.test.ts`.

### Test PostgreSQL 18 isolé
- `tests/epic2-lot1-postgres.test.ts` : nécessite une URL de maintenance `SMN_TEST_DATABASE_URL` vers **/postgres** sur un serveur local PostgreSQL 18. Crée une base temporaire `smn_epic2_lot1_*`, crée seulement les relations nécessaires à la recette, installe **deux fois** les triggers SMN-35/36, vérifie leur état, insère une ligne de registre indépendant, teste les refus `UPDATE/DELETE`, exige la conservation des lignes et vérifie le journal transversal avec ses sources minimales. Une panne injectée provoque un `ROLLBACK` sans modification résiduelle. La base de test est supprimée en fin de test.
- Le test prouve l'exécution du DDL et l'atomicité SQL sur la **maquette ciblée** ; une seconde qualification sur l'installation native v33 complète reste utile pour vérifier les interactions entre les fonctionnalités récentes.

### GitHub Actions
Workflow `[epic2-lot1-postgres.yml](https://github.com/JeanLamora75/SMN/actions/workflows/epic2-lot1-postgres.yml)` : tests de contrat Windows/Linux, `pnpm typecheck`, `pnpm i18n:check`, et exercice réel PostgreSQL 18 en conteneur jetable.

**Premier résultat observé :** run [42610728952](https://github.com/JeanLamora75/SMN/actions/runs/42610728952). Les tests unitaires Windows/Linux et le job PostgreSQL 18 ont réussi. Le typecheck a trouvé un défaut de syntaxe préexistant dans `src/server/backup/erasure-private-documents.ts` (ligne 36), corrigé dans le même lot sans changer l'algorithme métier SMN-38. Le workflow complet a échoué sur cette erreur ; la correction est soumise à une nouvelle exécution.

**Statut de la nouvelle exécution :** se reporter aux jobs GitHub Actions et mettre à jour ce bilan selon le résultat final, sans déclarer un succès avant vérification.

## 3. Commandes manuelles contrôlées

Depuis PowerShell Windows, avec une base d'essai PostgreSQL SMN locale choisie explicitement :

```powershell
pnpm exec tsx scripts/smn-35-archive-guards.ts --check
pnpm exec tsx scripts/smn-36-removal-audit.ts --check

# Après une sauvegarde vérifiée et une recette PostgreSQL 18 réussie :
pnpm exec tsx scripts/smn-35-archive-guards.ts --apply --confirm=INSTALL_ARCHIVE_GUARDS
pnpm exec tsx scripts/smn-36-removal-audit.ts --apply --confirm=INSTALL_MEMBER_REMOVAL_AUDIT

pnpm exec tsx scripts/smn-35-archive-guards.ts --check
pnpm exec tsx scripts/smn-36-removal-audit.ts --check
```

**Ne pas lancer les deux commandes `--apply` sur une base réelle sans contrôler le schéma, les sauvegardes et le périmètre.** Ce lot ne crée ni restauration active ni effacement exceptionnel. Les scripts `uv` BMAD ne sont pas exécutables via GitHub et n'ont pas été invoqués.

## 4. Conditions de clôture du lot

1. Le workflow GitHub Actions du lot est vert sur Windows/Linux et PostgreSQL 18.
2. Le statut des triggers est contrôlé sur une **installation native v33 complète de test**, sans modifier la baseline versionnée.
3. Les migrations sont idempotentes et ne bloquent pas les créations de nouvelles archives (seulement leur réécriture ou suppression).
4. Les scénarios d'audit, de sécurité et de rollback sont démontrés.
5. L'Administrateur valide fonctionnellement le journal et l'impossibilité de supprimer une fiche référencée.

Les Stories Jira peuvent rester « En cours » tant qu'une preuve pertinente d'installation sur la base cible et une recette métier de validation ne sont pas apportées. Le statut de développement ne doit jamais être confondu avec l'activation sur l'installation utilisateur.
