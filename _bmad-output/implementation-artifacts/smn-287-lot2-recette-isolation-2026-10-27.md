# SMN-287 — Recette locale du lot 2 (brouillon, sans application de migration)

## Prérequis

Windows 11, Node.js 24, pnpm, branche `feat/smn-287-agile-multi-teams-20261027`. Ne pas modifier `MULTI_TEAM_CONTEXT_READY`, ne pas activer `SMN_MULTI_TEAM_WRITES_ENABLED` et ne pas exécuter de migration v29 sur la base de travail.

## Vérifications sans changement de base

Dans PowerShell, à la racine du dépôt :

```powershell
pnpm install --frozen-lockfile
pnpm exec tsx --test tests/smn-287-lot2-isolation-guards.test.ts tests/smn-287-active-team-v29.test.ts tests/smn-282-team-navigation.test.ts
pnpm typecheck
pnpm lint
```

Les tests supplémentaires vérifient statiquement la présence des verrous sur un sous-ensemble critique des routes, la séparation des versions v27/v28/v29 et la destination de navigation après changement d'équipe. Ils ne constituent pas à eux seuls des tests d'intégration HTTP ni une preuve d'isolation des données.

## Recette d'intégration à préparer sur base de test isolée

Utiliser une copie de base dédiée, jamais la base de travail. Préparer trois équipes distinctes : A (Scrum), B (Scrum), C (Kanban) ; créer des Sprints A/B et des périodes C, ainsi que métriques, notes et événements distincts. Vérifier qu'un utilisateur non autorisé ne peut pas accéder à B par modification de l'URL ; qu'un contexte d'équipe différent invalide les ID de Sprint ; que la liste des cycles ne mélange jamais A/B/C ; que les anciennes routes sensibles refusent v29 ; et que les valeurs, registres et capacités sont cloisonnés. Vérifier aussi le fonctionnement historique v27 sur une installation séparée.

**Critère de sortie** : aucune fuite A/B/C, API historiques bloquées, nouveaux services contextualisés testés, `pnpm typecheck`, `pnpm lint`, `pnpm test` et `pnpm build` satisfaisants. L'activation, l'application de migration et la fusion nécessitent une validation explicite.

Statut : protocole rédigé, commandes NON exécutées.
