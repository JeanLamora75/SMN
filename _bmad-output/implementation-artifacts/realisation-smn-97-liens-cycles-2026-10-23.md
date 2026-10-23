# SMN-97 — Association des risques et dépendances aux cycles

Jira : https://lmn24.atlassian.net/browse/SMN-97

## Livré sur main

- Relation N:N entre fiche centrale et Sprint dans `smn_registry_cycle_link`, unicité `(item_id,sprint_id)` : aucun duplicata de risque ou dépendance.
- Journal append-only `smn_registry_cycle_link_audit` pour chaque ajout/retrait, acteur/date/action.
- Validation serveur : type risque/dépendance, équipe de l'installation, Sprint existant non supprimé, Sprint non clôturé, permissions administrateur ; transaction et rollback.
- API GET/PATCH `api/admin/registries/[id]/cycles` ; lecture collective et édition admin.
- Fiche risque/dépendance : liste des Sprints associés, liens ajoutables/retirables ; traductions FR/EN.
- Tests ciblés ajoutés dans `tests/smn-97-cycle-links.test.ts`.

## Limites et dépendances

- **Périmètre effectif Scrum uniquement** : les périodes Kanban de l'Epic 7 ne sont pas disponibles dans le modèle examiné. L'API refuse donc cette association tant que le modèle canonique n'est pas prêt.
- **AC2** : l'identité centrale est unique, mais le raccordement des listes de Sprint à ces liens reste à terminer ; elles ne présentent pas encore automatiquement la fiche liée.
- **AC4** : les écritures ne touchent jamais les snapshots ni les PDF ; l'intégration au contenu du snapshot Vn dépend des Stories dédiées. Un Sprint clôturé ne peut être modifié par cette API.
- Le contrôle audit de refus dépend toujours de l'infrastructure HTTP / sécurité. Les changements réussis sont audités ; les refus ne sont pas inscrits dans le journal métier des liens.
- Aucun test typecheck/build/PostgreSQL/navigateur n'a été exécuté, Jira non clôturé, GitHub Actions indisponibles.

Validation Windows : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/smn-97-cycle-links.test.ts`, `pnpm i18n:check`, `pnpm build`.
