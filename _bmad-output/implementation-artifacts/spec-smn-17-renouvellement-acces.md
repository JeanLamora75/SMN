---
title: "SMN-17 — Révoquer les accès compromis et renouveler son mot de passe"
type: feature
created: "2026-10-20"
status: review
route: dispatch
review_loop_iteration: 0
remote_baseline_commit: "313482fa3fbd6f12c11c410fb079ecb706be31bd"
context: []
---

<frozen-after-approval reason="Story fonctionnellement approuvée en Epic 1, Jira SMN-17 ; mandat autonome déjà accordé le 20/10/2026">
## Intent
Permettre aux deux profils de renouveler le mot de passe avec preuve de l'ancien, trace sans secret et révocation des sessions. Fournir une récupération locale, sûre, de l'Administrateur existant par phrase de secours préparée au préalable, sans endpoint anonyme ni e-mail.

## Contraintes
Toujours préserver les comptes, la base et les secrets préexistants, appliquer la politique des sessions 8 h absolues / 30 min d'inactivité, l'identité et l'Origin locales, et tracer dans la même transaction le renouvellement/révocation logique. Saisie masquée de tous les secrets lors de la commande et absence d'arguments secrets.
Jamais de mot de passe en clair en base, de second administrateur automatique, de SQL manuel demandé, d'accès navigateur anonyme de secours, de récupération des clés perdue, de troisième rôle ni de SAFe pour le MVP. La phrase de secours est distincte des sauvegardes et n'est utilisable qu'une fois.

## Matrice des cas
| Cas | Attendu |
|---|---|
| Première connexion | Changement obligatoire avant métier ; cookie renouvelé après réussite |
| Titulaire actif, secret correct et nouveau distinct | Rotation salée, transaction tracée et sessions antérieures révoquées |
| Secret incorrect / ancien / réutilisé | Refus générique sans écriture et sans exposition |
| Compte désactivé / rôle invalide / session ancienne | Refus serveur à chaque requête |
| Administrateur prouvant son mot de passe actuel | Préparation ou remplacement d'une phrase de secours salée |
| Utilisateur ou anonyme voulant préparer/récupérer | Refus, aucun raccourci de privilège |
| Commande locale interactive, phrase préparée valide | Renouvellement du même compte, consommation de phrase, audit et invalidation des sessions |
| Phrase absente ou échec de transaction | Refus et pas de succès annoncé |
</frozen-after-approval>

## Carte du code
- `src/server/accounts/recovery-migration.ts`, `prisma/migrations/20261020_smn17_recovery/migration.sql`, `prisma/schema.prisma` : migration v3 additive et traçabilité.
- `src/server/accounts/migration.ts`, `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts` : migration atomique, diagnostics et checksum.
- `src/server/auth/recovery.ts`, `src/app/api/auth/change-password/route.ts` : renouvellement après preuve, audit et révocation.
- `src/app/api/auth/recovery-phrase/route.ts`, `src/app/app/security/` : préparation pour Administrateur identifié.
- `scripts/recover-admin.mjs`, `scripts/windows/package-portable.mjs` : récupération locale à saisie masquée.
- `tests/recovery-policy.test.ts`, `scripts/verify-http-ci.mjs`, `scripts/windows/verify-package.mjs` : contrôles unitaires / HTTP / paquet autonome.

## Critères de preuve
- [x] Code de rotation et de révocation par empreinte de session, y compris après la première connexion.
- [x] Migration additive avec verrou, checksum et audit sans secret.
- [x] Interface authentifiée pour préparer la phrase, contrôlée au serveur.
- [x] Commande locale sans secrets en arguments, phrase à usage unique, mot de passe saisi masqué.
- [x] CI sur révision stabilisée Linux PostgreSQL, HTTP, TypeScript et Windows, [run 39472442560](https://github.com/JeanLamora75/SMN/actions/runs/39472442560), réussite.
- [x] Contrôle du paquet Windows autonome sur révision stabilisée, [run 39472442745](https://github.com/JeanLamora75/SMN/actions/runs/39472442745), réussite et artefact 12286339309.
- [ ] Relectures BMAD indépendantes du diff stabilisé et triage.
- [ ] Recette globale Windows 11 de l'utilisateur. Jira demeure En cours.

## Notes de reprise
L'autre session disposait d'une implémentation locale non publiée de SMN-17 au terme du build de production ; aucun commit SMN-17 n'était présent sur main lors de la reprise. Le code est donc reconstruit depuis le baseline GitHub `313482fa`, sans prétendre récupérer le diff perdu. Développement sur `dev/smn-17-reprise-20261020` et PR #12 ; aucune fusion avant vérifications de CI.

Les commandes de tests applicatives CI sont exécutées exclusivement contre le service PostgreSQL éphémère GitHub Actions. Aucune modification de base utilisateur, aucune suppression ni réinstallation.

## Preuves et limites
Le commit vérifié `af81af224a97bf8ab8bf0484fb3f1fb496824197` a réussi la CI Linux/PostgreSQL 18, tests HTTP et Windows ([39472442560](https://github.com/JeanLamora75/SMN/actions/runs/39472442560)). Le paquet Windows autonome a passé compilation, installation isolée et smoke incluant l'exécutable de récupération sans TTY ([39472442745](https://github.com/JeanLamora75/SMN/actions/runs/39472442745)). La non-régression est exécutée sur des données CI éphémères, et non la base utilisateur. Ces preuves ne constituent pas une récupération réelle sur le PC de l'utilisateur ; les trois revues indépendantes BMAD ne sont pas attestées. La recette globale Windows 11 demeure différée.
