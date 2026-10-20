---
title: "SMN-14 — Se connecter, se déconnecter et protéger les sessions"
type: "feature"
created: "2026-10-20"
status: "in-progress"
route: "pilot-direct-main"
review_loop_iteration: 0
baseline_commit: "ceec7bf0f334753815d12980a598b7e2900fa56f"
context:
  - "_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-002-MIGRATIONS-SECRETS.md"
---

<frozen-after-approval reason="User Story Jira SMN-14, approuvée fonctionnellement en Epic 1">
## Intent

**But :** permettre aux comptes SMN existants (en premier lieu l'administrateur créé par SMN-12) de se connecter, de se déconnecter et d'accéder aux pages métier autorisées ; empêcher l'accès anonyme, les requêtes intersites et les sessions abusives. Conserver les deux seuls rôles `admin` et `user`.

**Critères :** sessions côté serveur, révocation immédiate à la déconnexion, 8 heures de durée absolue, 30 minutes d'inactivité utilisateur, aucune option « Se souvenir de moi », limitation des tentatives, cookies HttpOnly/SameSite et Secure sous HTTPS, mutation d'origine identique. Les requêtes de fond ne renouvellent jamais l'inactivité. Le compte initial doit changer son mot de passe avant l'accès métier, conformément à l'option A de SMN-12.
</frozen-after-approval>

## Code Map

- `src/server/auth/password.ts` : réutiliser le scrypt existant ; ne jamais enregistrer le secret en clair.
- `src/server/installation/current.ts` : lire la connexion PostgreSQL déjà configurée (portable ou existante), sans recréer de base.
- `src/server/access-policy.ts` et `src/app/app/page.tsx` : ouvrir seulement sur session authentifiée.
- `src/app/page.tsx` : remplacer le texte de blocage d'authentification pour une installation valide.
- `prisma/schema.prisma` et `src/server/installation/diagnostic.ts` : **ne pas changer le schéma SMN-12**, pour préserver la base installée.
- `.github/workflows/verify-i0.yml`, `tests/**` : Linux PostgreSQL éphémère, Windows démarrage et tests unitaires ; pas d'écriture sur base utilisateur.

## Tasks & Acceptance

- [ ] `src/server/auth/session.ts` : sessions opaques aléatoires en mémoire du processus serveur ; aucune persistance navigateur, expiration absolue 8 h/inactivité 30 min, révocation et vérification du compte réel en DB.
- [ ] `src/server/auth/credentials.ts` : login username/email + scrypt existant, réponse uniforme en cas d'échec et limitation de tentatives sans enregistrer les secrets.
- [ ] `src/app/api/auth/**` : login, logout, changement du mot de passe initial et signal explicite d'activité humaine ; cookies HttpOnly/SameSite/HTTPS ; contrôle d'origine strict pour les mutations.
- [ ] `src/app/login/**`, `src/app/change-password/**`, `src/app/app/**` : UI de connexion, renouvellement obligatoire avant métier, contenu privé minimal selon rôle et déconnexion.
- [ ] `tests/**` : limites 8 h/30 min, absence de prolongation via lecture, échec générique, sessions révoquées, CSRF, connexion sur base PostgreSQL temporaire.
- [ ] `docs/**`, Jira, BMAD : consignes de recette Windows et risques résiduels.

**Given** compte actif et mot de passe exact, **when** connexion, **then** session serveur contrôlée ; si mot de passe initial, redirection vers changement obligatoire.
**Given** pas de session ou session révoquée/expirée, **when** accès page/API privé, **then** refus sans données métier.
**Given** activité utilisateur explicitement signalée, **when** avant 30 min, **then** renouvellement d'inactivité uniquement, jamais du délai absolu de 8 h.
**Given** demande intersite ou tentatives répétées, **when** mutation ou login, **then** refus avec messages génériques, sans divulgation du compte.

## Implementation Notes

**Choix technique pilote :** sessions serveur en mémoire, invalide après redémarrage du processus (fail closed), **aucune migration ni altération automatique des données métier**. La persistance inter-processus est à réaliser avant déploiement multi-processus/web ; l'authentification Next/PostgreSQL existante est adaptée au pilote local. La table de comptes initiale n'a pas encore de champ actif/inactif : SMN-15 étendra la gestion des comptes ; les rôles enregistrés autres que admin/user seront refusés. Aucun plan « mot de passe oublié » n'est livré par SMN-14. Authentification métier bloquée sur `must_change_password` jusqu'au changement via formulaire. Le secret admin/admin initial reste permis uniquement pour la première authentification locale et doit être remplacé avant les pages privées.

**Adaptation BMAD :** pas d'exécution de `uv run render_skill.py` dans ce client GitHub ; l'implémentation et les vérifications s'effectuent depuis les connecteurs et GitHub Actions. Ne pas prétendre à un workflow BMAD généré ou à une revue indépendante.
## Spec Change Log

## Review Triage Log

## Verification

CI à renseigner après exécution réelle.
