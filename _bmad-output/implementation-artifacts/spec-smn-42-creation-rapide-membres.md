# SMN-42 — Story 3.1 : Créer rapidement les membres de l'équipe

**Référence :** [SMN-42](https://lmn24.atlassian.net/browse/SMN-42) · Epic 3 · FR-5 / FR-7 / FR-61 · D-PRD-007/009/010/011/012/137 · AD-8/12/19/31 · UX et I18N-JSON.

## Constat sur le socle

Installation Express déjà opérationnelle : une équipe (identifiant stable `team`) et un produit par installation, comptes SMN distincts. Les droits Administrateur / Utilisateur existent. La migration additive de l'Epic 3 est requise pour créer les personnes métier.

## Contrat des critères d'acceptation

| Critère | Implémentation proposée |
|---|---|
| AC1 | `/app/admin/members` : effectif initial 3, nombre entier 3–50 ; installation Express reste indépendante de ce formulaire. |
| AC2 | `POST /api/admin/members` : transaction unique, 1 identité `smn_member` + 1 affectation `smn_member_assignment` par position ; 5 demandés → 5 couples. Référence d'équipe vérifiée côté serveur contre l'équipe singleton. |
| AC3 | Positions 1 et 2 : Scrum Master, Product Owner ; position 3 et suivantes : Développeur. Même règle initiale en Scrum et Kanban. |
| AC4 | Taux contractuel, affectation, part de rôle et contribution initialisés à 100 %. **Aucun champ de capacité JH/Story Points, aucun KPI créé.** Une part de rôle Scrum Master/Product Owner ne produit pas de capacité Développeur. |
| AC5 | `BEGIN/COMMIT/ROLLBACK`, verrou PostgreSQL `pg_advisory_xact_lock(20261021,42)` et clé de demande UUID dans `smn_member_batch`. En cas de perte de réponse, la même demande retourne le lot existant sans créer de doublons. |

## Schéma version 9

Migration `src/server/members/migration.ts` et SQL miroir `prisma/migrations/20261021_smn42_quick_team_members/migration.sql`. Tables :
- `smn_member_batch` : ID de demande, équipe, effectif, auteur, création ;
- `smn_member` : identité centrale, ordinal, nom provisoire, taux contractuel et contribution ;
- `smn_member_assignment` : membre, équipe, date d'arrivée, rôle et taux d'affectation/part de rôle.

La date d'arrivée initiale est la date civile UTC de la création de la fiche côté serveur ; elle est conservée indépendamment de `created_at` et deviendra modifiable dans SMN-44. Les noms `Membre N` sont provisoires, enregistrés avec l'ordinal et `is_provisional=true`. Le rendu anglais traduit l'étiquette `Member N` sans modifier le texte enregistré. La localisation individuelle, l'email et le calendrier hebdomadaire ne sont pas simulés et relèvent des Stories suivantes.

La contrainte UNIQUE installation/ordinal garantit des références distinctes ; un index empêche deux affectations courantes pour un même membre. Aucune migration destructive, aucune connexion utilisateur créée, aucune seconde équipe.

## Sécurité et UX

- `GET/POST /api/admin/members` et `/app/admin/members` protégés par la matrice de droits côté serveur : Administrateur seulement.
- Méthodes mutantes soumises à validation d'origine, entrée allowlist `teamId/count/requestId` et erreurs sans détails SQL.
- Navigation Administration et fiche d'équipe donnent accès au parcours.
- Textes localisés `src/i18n/fr.json`, `en.json` ; états chargement, refus, succès/échec et saisie non enregistrée.
- Parcours **initial** une seule fois par installation. Les modifications ultérieures de personnes, rôles et arrivées relèvent de SMN-43/44 ; des changements d'effectif unitaires ne sont pas ajoutés ici.

## Couverture et réserves de vérification

Tests unitaires rédigés : `tests/quick-team-members.test.ts` (bornes, rôles, transaction de cinq, rollback au troisième, anti-double lot, équipe singleton, schéma et absence de KPI). Test HTTP/PG ajouté à `scripts/verify-http-ci.mjs` : refus anonyme/Utilisateur, 5 membres, réessai de demande, absence de doublons, SQL `count(*)`.

**À exécuter effectivement :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, puis PostgreSQL 18.6 pilote. L'activation native du workflow BMAD `bmad-build` via `uv run --no-cache` n'a pas été exécutée : intégration manuelle via connecteur GitHub. Ne pas déclarer la Story terminée sans preuves.

Critères de recette sur PC Windows : installation Express sans membre ; 3 proposés ; 2 rejeté ; 5 créés distincts ; ordre des rôles ; 100 % ; aucune capacité ni compte créé ; relecture et rechargement ; réseau coupé/réessai ; refus du profil Utilisateur ; intégrité des migrations et absence de rupture des anciennes fonctionnalités.
