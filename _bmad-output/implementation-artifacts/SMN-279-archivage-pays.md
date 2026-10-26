# SMN-279 — Archivage et réactivation sécurisés des pays

**Statut : code publié sur branche, aucune recette exécutée, aucune fusion.**

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-279
- Branche : `feat/smn-279-country-archive`
- Base : `feat/smn-278-import-contextual-return` (PR #198), elle-même issue de SMN-270 à SMN-277.
- Skill officiel Amelia `.agents/skills/bmad-agent-dev/SKILL.md` consulté sur GitHub. Le moteur `uv` BMAD ne peut pas être exécuté avec les seuls connecteurs disponibles ; adaptation par lecture/écriture explicite des sources, sans prétendre avoir validé un build.

## Contrat fonctionnel

**Archivage logique**, sans suppression : `smn_country.archived_at` est indépendant des statuts annuels techniques et administratifs. Les pays existants dont le champ est NULL restent actifs. Le même code ISO, les dates, les attestations, les membres historiques et les audits restent accessibles à la consultation et après réactivation.

### Critères d'acceptation

| AC | Comportement codé |
| --- | --- |
| AC1 | Le champ `archived_at` existant depuis SMN-273, la révision pays de SMN-271 et le catalogue sont exposés comme `archived` / `archivedAt`. Filtre distinct `Actifs / Archivés / Tous` ; archivage indépendant du statut annuel. |
| AC2 | `GET /api/admin/countries/{code}/lifecycle` inspecte les membres **non archivés** dont la dernière localisation effective à la date courante désigne le pays ou qui ont une localisation future programmée vers celui-ci. Le nombre réel et les 20 premières fiches sont renvoyés **aux seuls administrateurs**. Si un membre bloque, la transaction refuse l'archivage (409) et la fenêtre propose des liens `/app/admin/members/{id}`. Aucune mutation de ces fiches. |
| AC3 | Le pays de référence des paramètres généraux ne peut pas être archivé : il faut d'abord choisir un autre pays de référence. Les vérifications, prises sous verrou consultatif partagé et verrou `FOR UPDATE` sur le pays, sont refaites au commit. Le moteur de changement du pays de référence, de localisation membre, de première création du roster et de réactivation de membre utilise le même verrou pour écarter les écritures concurrentes. |
| AC4 | `POST .../lifecycle` `{action:"archive",revision,confirmed:true}` : refus sans confirmation, pays déjà archivé, membre actif, pays de référence ou révision dépassée. Succès : `archived_at=now()`, incrément de révision et insertion dans `smn_country_lifecycle_audit` (acteur, date, action, ancien/nouvel état, ancienne/nouvelle révision), en **une seule transaction**. |
| AC5 | Même endpoint avec `action:"reactivate"` : retire `archived_at` sur la ligne existante, incrémente la révision et historise. Ne recrée aucun code ni jour férié. Les historiques restent tels quels. |
| AC6 | GET et POST d'administration avec `settings/write` côté serveur ; rôle utilisateur non habilité : 403. Les modifications directes du nom, les mutations manuelles des jours fériés, imports CSV/ICS et préchargements refusent désormais un pays archivé. Sa modale de calendrier est **en lecture seule**. Les références, capacités historiques et rapports figés ne sont pas réécrits. |

## Schéma et audit

- `src/server/countries/archive-migration.ts` prépare additivement et idempotemment `smn_country_lifecycle_audit` avec index pays/date. `archived_at` et `revision` proviennent des évolutions préalables de SMN-273 et SMN-271 ; aucune migration destructrice.
- `prisma/schema.prisma` et `src/server/installation/contract.ts` connaissent la table d'audit.
- `smn_country` ne contient aucun nouveau champ autonome de statut annuel ; `archived_at` est la seule information d'archivage.
- Aucune suppression physique ni modification des dates, audits antérieurs, localisation historique des membres, snapshots de capacité ou PDF archivés.

## Sécurité et synchronisation

La constante `COUNTRY_LIFECYCLE_LOCK` est acquise sous transaction avant l'inspection et les écritures des fonctionnalités liées :

- Pays : inspection/archivage/réactivation.
- Membre : ajout/changement de localisation et réactivation d'un membre archivé.
- Paramètres généraux : modification du pays de référence.
- Initialisation de l'équipe : première affectation du pays de référence aux membres.
- Jours fériés : mutation manuelle, import CSV/ICS et préchargement.

Les fonctions préexistantes possédant leurs propres verrous 49/50 les conservent, puis acquièrent le verrou de cycle du pays ; la transaction d'archivage n'acquiert pas ces anciens verrous. La protection n'est pas seulement visuelle : l'API et les services revérifient `archived_at`.

Le contrôle de membre futur est volontairement plus prudent que « membre actuellement rattaché » : un pays avec une future localisation déjà programmée est également bloqué. Il évite une activation ultérieure sur un pays indisponible.

## UI

- Liste du catalogue : filtre `Actifs / Archivés / Tous`, filtre annuel indépendant, badge `Archivé` distinct du statut annuel.
- Menu d'action : `Archiver` sur actif, `Réactiver` sur archivé, renommage désactivé sur archivé.
- Fenêtre de confirmation : pays/ISO/drapeau, avertissement sur conservation historique, blocages par pays de référence ou membres, liens vers les profils, case de confirmation requise.
- Pays archivé : son calendrier reste consultable ; plus d'action d'ajout, correction, suppression ou import.
- Annuler ne déclenche aucune écriture ; après succès, catalogue rechargé, filtres et année commune préservés.

## Fichiers principaux

- Nouveaux : `src/server/countries/archive-migration.ts`, `src/server/countries/lifecycle.ts`, `src/app/api/admin/countries/[code]/lifecycle/route.ts`, `src/app/app/admin/countries/country-lifecycle-modal.tsx`, `tests/country-lifecycle.test.ts`.
- Modifiés : `src/server/countries/catalog.ts`, `src/app/app/admin/countries/country-admin.tsx`, `src/server/members/location.ts`, `src/server/members/lifecycle.ts`, `src/server/members/quick-create.ts`, `src/server/settings/manager.ts`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/members/route.ts`, `src/app/api/admin/members/[id]/lifecycle/route.ts`, `src/server/holidays/csv-import.ts`, `src/server/holidays/ics-import.ts`, `src/server/holidays/manual.ts`, `src/server/holidays/preload.ts`, `prisma/schema.prisma`, `src/server/installation/contract.ts`, `src/i18n/fr.json`, `src/i18n/en.json`.
- Faux stockages SQL des tests existants adaptés aux nouveaux contrôles. Aucun test lancé.

## Contrôles réellement effectués

- **Revue statique sur GitHub uniquement** des appels API, des transactions, de la conservation de l'historique, des garde-fous de référence et de membres, des erreurs, des nouvelles relations Prisma et de l'inscription de la table dans la liste blanche.
- FR/EN : **3 279 clés** dans chaque catalogue, structures et paramètres de traduction identiques.
- Nouveau fichier de tests unitaires rédigé, **non exécuté**.
- Aucun GitHub Actions, pnpm lint/typecheck/test/build, recette PostgreSQL ou navigateur. L'utilisateur réalise les tests **sur son PC Windows 11**.

## Recette Windows à effectuer

1. Sauvegarder la base PostgreSQL SMN avant sélection de `feat/smn-279-country-archive` dans GitHub Desktop. Cette branche contient toute la chaîne SMN-270 à 278.
2. Dans Paramètres → Pays, vérifier que les pays existants sont **Actifs** ; sélectionner un pays autre que celui de référence sans membre, puis archiver. Vérifier le badge et l'apparition dans **Archivés**.
3. Afficher le pays archivé : les dates et validations doivent être visibles **en lecture seule**. Un appel direct pour renommer, modifier les jours fériés, importer CSV/ICS, ou attribuer ce pays à un membre doit être refusé.
4. Réactiver depuis la liste : même ISO, mêmes calendriers et historique, incrément de révision et audit.
5. Tenter d'archiver le pays de référence : refus et invitation à modifier d'abord le paramètre général. Choisir un autre pays valide, puis reprendre.
6. Tenter d'archiver un pays avec membre actif : vérifier le compteur et les liens vers les fiches. Mettre à jour la localisation membre ; recommencer. Tester également une localisation future programmée.
7. Depuis deux onglets, tenter archive/renommage ou archive/réactivation sur la même révision ; vérifier HTTP 409 et absence de réécriture perdue.
8. Vérifier que les membres archivés et localisations **purement historiques** ne bloquent pas à tort, tandis qu'une réactivation de membre vers un pays archivé est refusée.
9. Vérifier profil `user` : aucune écriture via l'UI ni l'API ; thèmes FR/EN, mobile, clavier et focus.
10. Exécuter localement `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`; partager les erreurs avant fusion.

**Ne pas fusionner sur main ni clore SMN-279 avant recette locale.**
