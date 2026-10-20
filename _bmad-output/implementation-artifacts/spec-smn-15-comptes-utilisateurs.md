---
title: "SMN-15 — Créer et administrer les comptes des utilisateurs"
type: "feature"
created: "2026-10-20"
status: "review"
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
- **CI validée sur `main`** : [GitHub Actions, run 39452021758](https://github.com/JeanLamora75/SMN/actions/runs/39452021758). Linux/PostgreSQL 18 et Windows réussis ; 61 tests Linux dont 60 réussis, 0 échec et 1 ignoré parce qu'il cible Windows. Tests HTTP sur base éphémère : création de compte, doublons, refus d'accès aux Utilisateurs, modification de rôle avec invalidation de la session antérieure, désactivation, interdiction de l'auto-rétrogradation. Validation Prisma et build inclus. **Recette Windows 11 par l'utilisateur non encore effectuée sur SMN-15** ; rester en `review` jusqu'au retour réel sur l'interface et le redémarrage. La CI du paquet autonome ZIP constitue un flux distinct et n'est pas incluse dans cette preuve.

## Reprise vérifiée le 20/10/2026 — attente de recette Windows

Révision applicative contrôlée : `4f7b50f54d015cc60c571d7c30fbf87e833662e5`. Aucun correctif applicatif nécessaire identifié pour SMN-15 lors de cette reprise. Les commits ultérieurs à `d683fa3e` étaient déjà publiés : ils n'ont pas été réimplémentés.

### Preuves réellement consultées

[CI applicative 39453649402](https://github.com/JeanLamora75/SMN/actions/runs/39453649402), terminée avec succès : journaux et étapes des deux jobs consultés. Linux : **64 tests, 63 réussis, 0 échec, 1 ignoré** ; PostgreSQL **18.6**, Prisma, lint, TypeScript, build et scénario HTTP de production réussis. Windows : **53 tests, 52 réussis, 0 échec, 1 ignoré**, TypeScript, build et démarrage dev réussis. Le runner Windows est **Windows Server 2025**, pas le Windows 11 de l'utilisateur ; les intégrations PostgreSQL réelles sont exécutées dans le job Linux uniquement.

| Critère Jira | Vérification du code et preuve | Limite |
| --- | --- | --- |
| AC1 | `src/app/app/admin/users/page.tsx` contrôle la session et le rôle ; `users-admin.tsx` expose les quatre champs et exactement deux profils. Le scénario HTTP vérifie l'accès administrateur à la page. | Manipulation réelle du formulaire Windows 11 attendue. |
| AC2 | `manager.ts:createAccount` utilise un INSERT unique et scrypt ; `tests/setup-integration.test.ts` et `scripts/verify-http-ci.mjs` vérifient création, rôle, unicité et changement du secret initial. | L'absence de création depuis une fiche membre Agile est vérifiée par inspection du périmètre actuel ; ce parcours membre n'est pas encore livré. |
| AC3 | `updateAccount` est transactionnel ; la route PATCH révoque les sessions et `sessionAccount` relit le rôle et l'état en base. Le HTTP prouve révocation après changement de rôle et refus de connexion après désactivation ; l'intégration PG vérifie aussi la réactivation. | Persistance et redémarrage sur le PC utilisateur attendus. |
| AC4 | Gardes des pages et des routes GET/POST/PATCH ; le HTTP prouve refus 403 et redirection du simple Utilisateur. | Les requêtes refusées sont testées ; aucun scénario dédié ne compare toutes les lignes de la base avant/après chaque refus. |
| AC5 | INSERT atomique, index uniques insensibles à la casse, collision traduite en 409 et erreurs serveur génériques. Les tests PG vérifient le nombre de comptes inchangé après collision ; le HTTP vérifie l'absence du secret et du hachage dans la réponse de création. | Une panne PostgreSQL injectée pendant la création et son message dans le navigateur ne sont pas testés spécifiquement. |

### Échec distinct à ne pas masquer

La CI **n'est pas entièrement verte tous workflows confondus** : [Paquet Windows pilote 39452765111](https://github.com/JeanLamora75/SMN/actions/runs/39452765111), sur `dc4469c20d92fad4252c74f5aa0492f4f4897c40`, échoue dans `scripts/windows/verify-package.mjs:113` : « La préparation a dépassé dix minutes ». Compilation et construction du paquet réussissent ; installation autonome non validée. L'historique des exécutions montre des échecs de ce workflow avant les développements SMN-15. Le journal ne précise pas l'étape interne bloquée : aucune cause ni correction n'est affirmée sans reproduction instrumentée. Ce blocage reste ouvert ; il ne constitue pas une preuve d'échec des comptes sur l'installation déjà fonctionnelle de l'utilisateur. La recette ci-dessous utilise GitHub Desktop et `pnpm dev`, pas le ZIP autonome.

### Recette courte à exécuter par l'utilisateur

1. GitHub Desktop : `main` → Fetch/Pull origin. Arrêter SMN puis relancer `pnpm dev`. Conserver la base et la configuration existantes ; ne pas relancer l'installation.
2. Se connecter avec l'Administrateur existant ; ouvrir `/app/admin/users`. Créer un compte test Utilisateur, puis retenter le même identifiant : erreur explicite, une seule ligne.
3. Navigation privée : connecter ce compte, changer son secret initial ; vérifier le refus d'accès à `/app/admin/users`.
4. Administrateur : promouvoir ce compte ; vérifier que l'ancienne session est invalidée, puis reconnecter le compte. Le désactiver ; vérifier session refusée et nouvelle connexion impossible. Le réactiver en Utilisateur.
5. Arrêter et relancer SMN ; vérifier que les deux comptes et leurs états sont conservés et que l'Administrateur initial peut toujours se connecter.

**Statut conservé : BMAD `review`, Jira « En cours ». Aucune recette Windows 11 réalisée dans cette session ; aucune opération sur la base personnelle.** Attendre le retour utilisateur avant clôture.

### Adaptation BMAD de cette reprise

Skill Amelia et configuration consultés depuis GitHub ; `resolve_customization.py`, `resolve_config.py` et le rendu officiel `render_skill.py` exécutés avec succès sur une copie locale des fichiers BMAD. La langue française demandée par l'utilisateur prévaut sur la configuration TOML anglaise. La reprise est limitée à la vérification du développement déjà publié et à la mise à jour des preuves : aucun nouveau cycle de développement, aucune nouvelle revue multi-agents et aucune exécution complète du workflow build ne sont revendiqués. Le statut historique `review` est conservé pour ne pas recommencer la Story approuvée.
