# SMN-89 — Livraison incrémentale (23/10/2026)

Référence : https://lmn24.atlassian.net/browse/SMN-89

## Implémenté sur main
- Modèle central `smn_registry_item` et journal immuable `smn_registry_item_audit`, ajoutés lors de la première écriture validée.
- Six types de registres, liste contrôlée de statuts initiaux par type, titre requis, date civile modifiable, champs facultatifs réellement NULL.
- API `POST /api/admin/registries` protégée par authentification admin, contrôle d'origine et validation stricte des entrées ; création et audit dans une même transaction PostgreSQL.
- Route `/app/admin/registries` : formulaire commun Bootstrap, i18n FR/EN, retour d'erreur/succès explicite, date préremplie, création sans cycle obligatoire.
- API `GET /api/admin/registries/[id]` pour lecture individuelle et socle de développement de la fiche.
- Tests de contrat ciblés : `tests/smn-89-registry-creation.test.ts`.

## Limitations / recette requise
- **Non exécutés** dans le dépôt : `pnpm typecheck`, `pnpm exec tsx --test tests/smn-89-registry-creation.test.ts`, `pnpm build`, PostgreSQL et recette navigateur.
- La fiche détaillée d'enrichissement (AC4, édition après création) et l'accès à sa page UI sont encore à réaliser. L'identifiant et l'audit initial existent ; ne pas marquer AC4 réalisé.
- Le socle `GET` nécessite que la table ait été créée par une première écriture, conformément au contrat de migration additive actuel ; une migration installateur dédiée pourra le rendre disponible dès installation.
- Le menu de navigation principal n'intègre pas encore de lien vers Registres. La route directe est disponible.
- Pas de branche PR ni pipeline Actions : publication sur `main` conformément à la pratique pilote. Aucun statut Jira modifié.
- L'extension des attributs métier spécialisés (ROAM, criticité, dépendances externes, associations multi-cycles) relève des Stories suivantes de l'Epic 5.

## Commandes de recette locale
```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-89-registry-creation.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```
Puis vérifier admin/user, dates invalides, titre vide, créations par type, absence de cycle, intégrité transactionnelle et audit dans PostgreSQL.
