# SMN-43 — Story 3.2 : Compléter la fiche centrale d'un membre

**Référence :** [Jira SMN-43](https://lmn24.atlassian.net/browse/SMN-43) · Epic 3 · FR-5/6/61 · D-PRD-007/008/009/137 · AD-8/12/19/31.

## Contrat validé

**AC1** — Modifier « Membre 2 » en nom réel met à jour `smn_member.display_name` **avec le même ID**, sans réécrire `smn_member_assignment` ni les dates d'effet. La première modification du nom provisoire fait passer `is_provisional` à `false`, une correction ultérieure ne redevient pas provisoire.

**AC2** — L'e-mail est facultatif en création rapide (SMN-42 initialise `email=NULL`) comme en édition (`null` et saisie vide acceptés). Ni compte `smn_account` ni message sortant ne sont créés.

**AC3** — L'e-mail valide est stocké **uniquement sur la fiche centrale** en `smn_member.email`. Contrôles côté navigateur et serveur ; normalisation trim/minuscules, longueur maximale 254, format `nom@domaine.tld`. Format refusé → 400, aucune écriture. L'enregistrement conserve la révision et la date de dernière mise à jour.

**AC4** — La route privée `GET /api/admin/members`, la route `PATCH /api/admin/members/[id]`, et `/app/admin/members` utilisent la matrice `members` Administrateur uniquement. L'Utilisateur ne reçoit pas d'e-mail, de nom individuel ni de référentiel individuel ; la fiche collective d'équipe reste accessible selon ses droits, sans données individuelles.

**AC5** — L'interface affiche explicitement les statuts « Provisoire »/« Confirmée », conserve les IDs et rattachements, marque `developmentCapacityJh:null` tant qu'aucun calcul de capacité n'existe. Le mail seul ne confirme pas une fiche provisoire. Les champs ne sont pas exportés automatiquement dans les vues collectives.

## Implémentation et modèle

Migration additive PostgreSQL **v10** : `src/server/members/profile-migration.ts` et `prisma/migrations/20261021_smn43_member_profile/migration.sql`.

Nouveaux champs dans `smn_member` : `email text NULL`, `revision integer NOT NULL DEFAULT 0`, `updated_at timestamptz NOT NULL DEFAULT now()`. La colonne `is_provisional` créée par SMN-42 continue de représenter le statut. Aucune colonne e-mail ajoutée aux affectations ou comptes de connexion.

`src/server/members/profile.ts` valide `{displayName,email,revision}` et modifie uniquement la personne dans une transaction SQL avec `SELECT ... FOR UPDATE`, verrouillage optimiste de la révision, `COMMIT` ou `ROLLBACK`. Les cas de modification concurrente renvoient 409. Rejet des clés superflues, chemins ou IDs invalides.

`src/app/app/admin/members/member-profile-editor.tsx` fournit l'édition d'un membre, le signalement de saisie en cours et la confirmation d'abandon. Les nouveaux libellés sont localisés dans `src/i18n/{fr,en}.json`. Aucun onglet d'édition des affectations (réservé à SMN-44).

## Dépendances et impacts

- Prérequis : SMN-42 et schéma v9 ; la migration doit rester automatique et non destructive.
- Impacts : schéma Prisma, migrations v10, diagnostic PostgreSQL, projection de liste individuelle, écran Administrateur, tests.
- Pas de modification des modèles de capacité, de l'historique des affectations ou des comptes applicatifs.
- Les prochaines Stories 3.3/SMN-44 et 3.4/SMN-45 pourront réutiliser la fiche centrale ; elles ne doivent pas dupliquer l'e-mail.

## Vérifications et qualification

Tests écrits : `tests/member-profile.test.ts` (nom confirmé, e-mail absent et invalide, statut provisoire préservé, révision obsolète, opération SQL atomique, non-mutabilité des affectations). Contrôles HTTP/PG ajoutés à `scripts/verify-http-ci.mjs` : refus 400/403/409, identifiant stable, lecture après rechargement, effacement e-mail, comptes et affectations inchangés.

Statut : **développement documenté, recette non attestée** tant que `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, les tests HTTP/Postgres 18.6 et une recette Windows 11 n'ont pas été exécutés avec succès.

Adaptation BMAD : le skill officiel `bmad-build` demande l'exécution locale de `uv run --no-cache` sur un dépôt complet. Le développement est réalisé à travers les connecteurs Github/Jira, sans ce script sur le poste de l'utilisateur ; aucune validation BMAD native n'est revendiquée.
