---
title: "SMN-15 — Créer et administrer les comptes des utilisateurs"
type: "feature"
created: "2026-10-20"
status: "in-progress"
route: "pilot-direct-main"
review_loop_iteration: 0
---

<frozen-after-approval reason="Story Jira SMN-15 validée globalement le 19/10/2026">
## Intent
Permettre à un Administrateur authentifié de créer des comptes SMN et d'attribuer l'un des **deux seuls profils MVP** : Administrateur ou Utilisateur. Permettre la modification de rôle et la désactivation. Refuser les modifications directes et indirectes d'un simple utilisateur. Aucun compte n'est créé automatiquement depuis les fiches de membres Agile.

## Acceptance
- AC1 — Formulaire administrateur : nom d'utilisateur, e-mail, mot de passe initial et rôle.
- AC2 — Création atomique, identifiants uniques, mot de passe initial dérivé avec scrypt, changement obligatoire à la première connexion.
- AC3 — Changement de rôle ou désactivation effectif côté serveur, anciennes sessions inutilisables.
- AC4 — Un Utilisateur ne peut ni accéder à l'administration, ni appeler ses API.
- AC5 — Doublons et erreurs signalés sans divulguer les secrets et sans création partielle.
</frozen-after-approval>

## Périmètre technique
- Fichiers : `src/server/accounts/manager.ts`, `src/server/accounts/migration.ts`, `src/app/api/admin/accounts/**`, `src/app/app/admin/users/**`, `src/server/auth/credentials.ts`, `src/server/auth/session.ts`.
- Migration `prisma/migrations/20261020_smn15_accounts/migration.sql` : ajout non destructif de `is_active=true`, index d'unicité insensibles à la casse ; `schema_version=2`, historique et empreinte contrôlée.
- Compatibilité : base existante SMN-12 conservée. Migration exécutée à la première opération authentifiée et uniquement après validation de la migration initiale. Aucun effacement ni recréation de base.
- Refus de désactiver/rétrograder le dernier administrateur actif ; l'administrateur ne peut pas modifier son propre rôle ou désactiver sa session.
- Les comptes désactivés sont refusés à la connexion et au chargement de session. Un changement de rôle invalide les sessions émises sous l'ancien profil (revocation explicite + contrôle serveur).
- Pas d'e-mail envoyé automatiquement, ni d'invitation externe : l'administrateur transmet le secret initial de manière privée. Pas de mot de passe publié en réponse API.
- Dépendances : SMN-12, SMN-14. Le rôle n'est jamais déduit d'une fiche d'équipe Agile.

## Adaptation BMAD
Le skill `.agents/skills/bmad-build/SKILL.md` requiert un script `uv run ... render_skill.py` et impose un arrêt si la génération échoue. Ces scripts ne peuvent pas être exécutés à travers le connecteur GitHub ; **aucune exécution du workflow rendu n'est revendiquée**. Implémentation progressive suivant la Story approuvée, vérifications par GitHub Actions, documentation du pilote. Les scripts `resolve_customization.py` et `resolve_config.py` n'ont pas été exécutés.

## Vérification et limites
- Tests automatisés : collisions d'identifiants, rôle et état actif, protection contre auto-désactivation, dernier administrateur, transactions, authentification d'un compte désactivé, accès HTTP refusé aux simples utilisateurs, session révoquée après changement de rôle.
- Les tests PostgreSQL d'écriture s'exécutent sur un service CI éphémère uniquement, jamais sur le PostgreSQL personnel.
- La gestion des comptes reste dédiée à l'installation locale du MVP ; la gestion des e-mails et des invitations à distance n'est pas livrée.
- **Réalisation/CI/recette : à confirmer avant de passer cette Story en done.**
