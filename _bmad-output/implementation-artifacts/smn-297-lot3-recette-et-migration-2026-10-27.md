# Lot 3 — SMN-297 : recette, migration et retour arrière (préparation)

**État : démarré, non validé.** Le lot 2 est codé mais non testé ; aucun verrou n'est activé. Ce document n'autorise ni migration, ni fusion.

## Phase 3A — Contrôles sur PC Windows sans modification PostgreSQL

Sur une branche de travail à jour :

```powershell
pnpm install --frozen-lockfile
pnpm exec tsx --test tests/smn-297-migration-preflight.test.ts tests/smn-287-lot2-isolation-guards.test.ts tests/smn-287-active-team-v29.test.ts
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm db:diagnose
```

Consigner les résultats de chaque commande, distinguer défauts nouveaux et défauts déjà connus. Ne pas exécuter les scripts `apply-*` à ce stade.

## Phase 3B — Répétition sur base jetable, après autorisation distincte

Créer une **copie indépendante** du PostgreSQL de travail, vérifier sa restauration avant toute migration. La séquence prévue est `v27 → v28 → v29`, jamais une application directe de v29 à v27. Les scripts existants `scripts/apply-multi-team-migration.ts` et `scripts/apply-team-agile-migration.ts` exigent `--apply` et un fichier de sauvegarde non vide : cette vérification de présence n'atteste **pas** que le contenu de la sauvegarde est restaurable.

Vérifier après chaque étape le diagnostic, le journal des migrations, les membres, les équipes, les Sprints, le mode Agile verrouillé et les calendriers. Ne jamais réaliser cette répétition sur la base de travail sans nouvel accord explicite.

## Phase 3C — Recette d'isolation et retour arrière

Équipes de test : A Scrum, B Scrum, C Kanban. Contrôler les accès autorisés, les ID étrangers, l'archivage et la consultation historique. Vérifier capacités, notes, événements, registres, rapports et PDF. Le retour arrière de référence est la restauration de la copie de sauvegarde validée, pas une commande SQL inverse improvisée.

## Critères de sortie

Toutes les commandes de qualité doivent être vérifiées, les scénarios A/B/C et la restauration documentés ; absence de fuite entre équipes ; validation fonctionnelle explicite du propriétaire. La PR #204 reste en brouillon, `MULTI_TEAM_CONTEXT_READY=false`, et les migrations ne sont ni appliquées ni autorisées par ce document.
