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

## Audit statique complémentaire du diagnostic v28/v29

Le diagnostic vérifie l'existence des deux migrations versionnées, leurs sommes de contrôle, la validité des structures multiéquipes puis du mode Agile v29. `probePostgres` fonctionne dans une transaction PostgreSQL en lecture seule. Un contrôle supplémentaire a été ajouté au test de prévalidation pour empêcher la disparition accidentelle des deux validations de schéma. La réussite de ce test n'atteste pas la bonne restauration d'une sauvegarde ni la validité du SQL sur une base réelle.

Le script v29 refuse explicitement une base qui n'est pas en v28. Aucun mécanisme d'application automatique n'a été activé. Audit documentaire uniquement, non exécuté.

## Protection ajoutée aux scripts de répétition

Les scripts v28 et v29 exigent désormais l'option `--rehearsal`, la variable locale `SMN_REHEARSAL_DATABASE_URL`, et une cible PostgreSQL sur loopback avec un port différent de la connexion SMN normale. L'ancien lancement avec les seuls paramètres `--apply --backup-file` est refusé. Le fichier `src/server/teams/rehearsal-target.ts` centralise le contrôle et `tests/smn-297-rehearsal-target.test.ts` contient les cas négatifs. **Attention : cela ne prouve pas qu'une instance est réellement indépendante.** La vérification du cluster cible (data directory / identité système), de l'absence de proxy, et de la restauration reste obligatoire avant exécution ; ne pas lancer les scripts à cette étape. Les tests n'ont pas été exécutés.
