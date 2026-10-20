---
title: "SMN-18 — Paramètres généraux et préservation des historiques"
type: feature
created: "2026-10-20"
status: review
route: dispatch
review_loop_iteration: 0
remote_baseline_commit: "560f3e8e8b1f101305463ab7dcaa88b15494c643"
context: []
---

<frozen-after-approval reason="Story 1.8 validée globalement avec Epic 1 le 19/10/2026, tests Windows 11 différés">
## Intent
L'Administrateur modifie les seules préférences administrables de l'installation sans réécrire le mode, le produit ou des données historiques.

## Frontières
Toujours : lecture/écriture autorisées par la politique serveur à deux profils. Valeurs validées et enregistrées atomiquement, audit et révisions traçables, mode/produit immuables. Une préférence modifiée s'applique à la configuration présente et aux nouvelles créations futures, pas aux objets historiques.
Jamais : nouveau rôle, changement de mode/produit, actualisation automatique de cycles passés, installation implicite nouvelle, réécriture des capacités, génération fictive de données, traduction / thème applicatif complet (Stories 1.14 et 1.15), nouveau catalogue de pays (Epic 3).

## I/O et critères AC1–AC5
| Critère | Cas | Résultat |
| --- | --- | --- |
| AC1 | Admin change FR/EN, clair/sombre, pays de référence | Valeur stockée v4 et récupérable par GET |
| AC2 | Admin injecte mode/produit dans PATCH | 400, aucune écriture |
| AC3 | Réglage appliqué | Révision + timestamp ; pas d'écriture dans les tables des cycles, capacités, historiques |
| AC4 | Utilisateur tente interface/API | Page protégée et refus 403 GET/PATCH |
| AC5 | Saisie invalide, conflit concurrent ou échec de la transaction | 400/409/503, aucun succès, rollback et diagnostic sans secret |

</frozen-after-approval>

## Carte du code
- `src/server/settings/{manager,migration}.ts`, `prisma/migrations/20261020_smn18_general_settings/migration.sql`, `prisma/schema.prisma` : persistance et contraintes.
- `src/server/accounts/migration.ts`, `src/server/db/probe.ts`, `src/server/installation/{contract,diagnostic}.ts` : migration versionnée non destructive, schéma reconnu.
- `src/app/api/admin/settings/route.ts` : GET et PATCH contrôlés par `authorizeApi`.
- `src/app/app/admin/settings/`, `src/app/app/page.tsx` : formulaire, dates, portée et lien de navigation.
- `scripts/recover-admin.mjs` : rétrocompatibilité SMN-17 de la v4.
- `tests/general-settings.test.ts`, `scripts/verify-http-ci.mjs` : tests unitaires, transactionnels et HTTP.

## Avancement
- [x] Architecture & migration additive v4.
- [x] Validation stricte des valeurs et refus des champs immuables.
- [x] Lecture et écriture serveur réservées à l'Administrateur.
- [x] Contrôle transactionnel, trace et révision concurrente.
- [x] Présentation des effets et limites de portée.
- [x] CI applicative Linux/PostgreSQL 18/HTTP/TypeScript + Windows sur `77c913ef` : [run 39474997208](https://github.com/JeanLamora75/SMN/actions/runs/39474997208), réussite.
- [x] Paquet Windows autonome sur `f71f39d4` : [run 39474562070](https://github.com/JeanLamora75/SMN/actions/runs/39474562070), réussite. La comparaison GitHub entre `f71f39d4` et `77c913ef` ne relève aucune modification de code applicatif, seulement documentation et scénario HTTP. Exécution ultérieure sur `77c913ef` non encore attestée.
- [ ] Revue indépendante complète du diff.
- [ ] Recette globale utilisateur Windows 11.

## Vérification
**Preuves exécutées — 20 octobre 2026** : la [CI I0 39474997208](https://github.com/JeanLamora75/SMN/actions/runs/39474997208) sur la révision de code `77c913ef` réussit Linux/PostgreSQL 18, tests unitaires, sondes HTTP (y compris rollback après audit PostgreSQL forcé), Prisma, TypeScript, build et Windows. Le [paquet Windows 39474562070](https://github.com/JeanLamora75/SMN/actions/runs/39474562070) réussit sur `f71f39d4`, même code applicatif selon [la comparaison](https://github.com/JeanLamora75/SMN/compare/f71f39d4...77c913ef). Les tests sont exécutés sur runner éphémère, pas sur la base personnelle de l'utilisateur. **Recette Windows 11 réelle et revue indépendante encore à effectuer**, statut review sans clôture Jira.
