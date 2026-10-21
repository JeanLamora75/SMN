# SMN-29 — BMAD Story 2.1, journal des opérations sensibles

## Références
- Jira : https://lmn24.atlassian.net/browse/SMN-29
- Epic 2, FR-70 et FR-73, AD-19/26/31, SEC-05, D-PRD-135.
- Deux rôles : Administrateur et Utilisateur ; le journal est réservé à l'Administrateur.

## Décisions de conception
- Regrouper les audits existants des paramètres et de l'authentification dans **une lecture unifiée** sans dupliquer les événements. Ajouter seulement le référentiel d'audit des comptes qui manquait.
- Journaliser la création/mutation d'un compte en utilisant la **même transaction PostgreSQL** que l'écriture métier, avec rollback si la trace échoue. L'ID de l'événement sert de référence de l'opération.
- Enregistrer uniquement les différences de rôle et état actif pour les comptes, pas les e-mails, identifiants de connexion, secrets ni empreintes.
- Projecteur de consultation filtrant les JSONB historiques des réglages ; seuls locale, thème, palette et pays apparaissent avec le rôle et le statut des comptes. Résultat Réussie si et seulement si l'événement persistant existe.
- Ne pas créer d'audit de navigation, d'aperçu, d'échec ou de rejet ; les anciens refus ne sont pas artificiellement reconstruits.
- Accès refusé pour Utilisateur et visiteur au niveau de la route et de l'API, indépendamment des menus. Consultation limitée à 100 événements sans filtre client.
- Migration additive de schéma v7, intégrée au contrôleur d'installation et au diagnostic, aucune purge ni destruction.

## Traçabilité de réalisation
- **AC1** : `src/server/audit/journal.ts` et `src/app/app/admin/audit/page.tsx`
- **AC2–3** : `src/server/accounts/manager.ts` et `src/server/audit/account-migration.ts`
- **AC4** : `src/server/access-policy.ts`, `src/app/api/admin/audit/route.ts`, vérifications HTTP
- **AC5** : événement seulement sur écriture commise et changement réel
- **Tests écrits** : `tests/audit-journal.test.ts`, fixtures SQL et HTTP, vérification migrations

Voir [la documentation de recette](../../docs/AUDIT-OPERATIONS-SMN-29.md).

## Réserve de validation
Aucun test Windows ou CI réellement exécuté n'est implicitement déclaré réussi. Les écritures SQL, le build et les parcours d'écran doivent être vérifiés dans un environnement éphémère/local. La fermeture Jira dépend de cette recette.

## Publication

La [PR #24](https://github.com/JeanLamora75/SMN/pull/24) a été fusionnée dans `main` le 21/10/2026 (`b8877883d014b15052fbb86cb6d21ca511df7040`). Qualification : contrôles statiques uniquement, 431 clés i18n FR/EN alignées ; CI Linux/Windows en échec avant les étapes ; recette Windows et validation de migration v7 non réalisées. Jira **En cours**.
