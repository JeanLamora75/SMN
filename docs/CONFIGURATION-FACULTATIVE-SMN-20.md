# SMN-20 — Suivi facultatif de la configuration

**Jira :** https://lmn24.atlassian.net/browse/SMN-20  
**État :** implémenté sur `feat/smn-20-after-i18n`, en attente de CI exécutée et de recette sur Windows.  
**Prérequis :** socle JSON de SMN-27 (`dev/smn-27-i18n-json-20261020`) non fusionné sur `main`.

## Comportement

La zone « Paramétrage à compléter » s'affiche sous le contexte produit/équipe de `/app` uniquement pour **Administrateur**. Une tâche a un état persistant : `todo` (À faire), `done` (Terminée), `ignored` (Ignorée). Ignorée reste indépendante des tâches terminées. L'administrateur peut choisir les trois états. Aucun réglage facultatif ne bloque les autres parcours ; l'utilisateur simple n'accède pas à ce registre.

| Identifiant stable | Action | Signal fiable d'achèvement |
|---|---|---|
| `reference-country` | `/app/admin/settings` | Pays non nul persisté dans `smn_general_settings`, après enregistrement effectif |
| `recovery-phrase` | `/app/security` | Phrase de secours d'un administrateur actif enregistrée, après contrôle du secret actuel |
| `display-preferences` | `/app/admin/settings` | Aucun : validation uniquement manuelle, car les valeurs par défaut FR/clair ne prouvent pas une personnalisation |

Un contrôle automatique n'écrit `done` que si l'état courant est `todo` et qu'un événement **réel** a été enregistré. `ignored` n'est jamais réactivé ou converti automatiquement ; `done` n'est pas automatiquement rouvert (même si le réglage est modifié ensuite). La migration additive vérifie les signaux persistés **avant** le déploiement afin de ne pas afficher comme inachevée une configuration antérieure déjà vérifiable. Les tâches sans signal restent À faire.

## Stockage et API

Migration additive `20261020_smn20_configuration_tasks`, `schema_version=5`. Nouvelle table `smn_configuration_task` isolée des tables cycles, risques, actions métier et reportings ; contraintes de clés et d'états, FK installation/acteur. Migration et diagnostique PostgreSQL vérifient le schéma et les sommes de contrôle ; aucun reset utilisateur.

`GET /api/admin/configuration-tasks` retourne les états (lecture pure). `PATCH` exige un administrateur actif, une session valide, une origine locale autorisée et exactement `{key,status}`; seules les clés et les trois valeurs connues sont acceptées. Statuts HTTP : 200, 400, 403, 503. Aucune donnée personnelle ou hash de récupération n'est renvoyé.

Libellés UX intégralement dans `src/i18n/fr.json` et `en.json` sous `configuration.*`, via le contexte i18n de SMN-27. La checklist est une section administrative distincte ; aucun calcul des métriques métier et aucune insertion dans les registres.

## Recette et preuves

- Unitaires : `tests/configuration-tasks.test.ts`, compléments à `tests/general-settings.test.ts`, `tests/recovery-policy.test.ts`.
- HTTP + PostgreSQL réels en CI : `scripts/verify-http-ci.mjs` (authentification, refus anonymes/utilisateurs, CSRF, tâche manuelle ignorée, pays enregistré, phrase de secours, version 5).
- `pnpm i18n:check`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` à vérifier sur un runner attribué.
- Recette manuelle Windows : mise à jour depuis une installation v4 avec pays renseigné / absent ; changement FR/EN ; compte utilisateur simple ; rechargement ; signal enregistré et comportement `ignored`.

**Limites documentées :** la configuration Scrum/Kanban avancée non encore livrée n'est pas présentée comme tâche. La prochaine modification du catalogue doit rester explicite et versionnée. L'approbation fonctionnelle de SMN-20 ne constitue pas une recette technique exécutée.
