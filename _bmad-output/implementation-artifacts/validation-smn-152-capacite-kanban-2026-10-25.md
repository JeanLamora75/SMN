# Validation technique SMN-152 — Capacité Kanban

**Date :** 25/10/2026  
**Story :** [SMN-152](https://lmn24.atlassian.net/browse/SMN-152) (Epic 7, distincte de [SMN-252](https://lmn24.atlassian.net/browse/SMN-252)).  
**Statut :** corrections proposées sur `fix/smn-152-kanban-capacity-validation`, **validation finale non attestée**. Branche `main` inchangée.

## Constats vérifiés dans le code de main

1. **État/ouverture Kanban :** `src/server/kanban/states.ts` contenait un bloc `DO $ BEGIN … END $` invalide pour PostgreSQL, empêchant potentiellement `reconcileKanbanStates`, les changements d'état et l'ouverture réelle (AC1). Correction en `DO $$ BEGIN … END; $$`.
2. **Clôture et non-rétroactivité :** `src/server/kanban/report.ts` lisait `readKanbanCapacityView` **aussi pour une période clôturée**, autorisant un recalcul d'après clôture (AC5). Le bloc Capacité des bilans clôturés lit dorénavant **le dernier snapshot Vn enregistré par identifiant de période**. Un snapshot manquant/invalide ne se reconstruit pas depuis la situation courante.
3. **Stabilité de l'ouverture :** `src/server/kanban/closure.ts` interroge dorénavant la capacité par `period.id` stable, et non uniquement par dates pouvant être replanifiées.
4. **Information utilisateur :** la page de rapport Kanban avertit explicitement de l'indisponibilité d'un snapshot clôturé.
5. **Tests :** tests de SMN-152 enrichis pour ouvrir/capturer, conserver le snapshot, valider les valeurs absentes et contrôler la présence des gardes serveur.

## Critères Jira et preuves

| Critère | Situation après correctif | Preuve restant à produire |
|---|---|---|
| AC1 — ouverture unique, provenance | Contrainte d'unicité et capture existantes ; syntaxe de migration corrigée | Transaction PostgreSQL réelle et ouverture à l'heure |
| AC2 — absence de réel futur | `safeKanbanGap` et `readActualCapacity` évitent les écarts fictifs | Test intégré période future |
| AC3 — capacité calculée/manuelle prioritaire | `readActualCapacity` conserve priorité de saisie, références et écarts | Vérification sur données d'équipe réelles |
| AC4 — données absentes ≠ zéro | `safeKanbanGap` préserve les valeurs `null` ; lecture Vn stricte | Cas `non-calculable` en base |
| AC5 — périodes clôturées immuables | Lecture du dernier `snapshot.capacity` au lieu du moteur live ; nouvelles versions à la reclôture | Fermer, corriger les absences, rouvrir, reclore, comparer V1/V2 |

## Tests réellement exécutés dans l'environnement d'assistance

- `node --test /tmp/smn152-validation/capacity-isolated.test.mjs` : **6 cas passés, 0 échoué** (fonctions métier extraites dans un module isolé, pas l'application entière), sur Node v22.16.0.
- `tsc --noEmit --strict --target ES2022 --lib ES2022 /tmp/smn152-validation/frozen-typecheck.ts` : **réussi**, compilation stricte du parseur isolé.
- Lecture des sources et comparaison des correctifs GitHub : exécutées.

**Non exécutés** : le fichier de test modifié `tests/smn-152-kanban-capacity.test.ts` dans le dépôt réel, `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, migration/transactions PostgreSQL et recette navigateur Windows. Le conteneur ne possède pas de clone SMN ni d'accès DNS à GitHub ; Node est en version 22 et pnpm absent. Aucune CI GitHub n'a été lancée.

## Suite obligatoire avant validation

Dans l'environnement SMN avec PostgreSQL et Node 24/pnpm 12, exécuter les cinq contrôles npm et les tests ciblés, puis confirmer les parcours d'ouverture, lecture avant/après clôture, correction post-clôture et V1/V2. Corriger les éventuels défauts avant fusion et changement du statut Jira. **Ne pas marquer SMN-152 terminée à ce stade.**

**SMN-252** reste sur la [PR #139](https://github.com/JeanLamora75/SMN/pull/139) non fusionnée et nécessite sa propre recette avant SMN-253.
