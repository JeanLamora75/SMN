# SMN-234 D8 — Réactivation de l’onglet Registres après Epic 5

**Date :** 24 octobre 2026. **Incident :** l’onglet Registres d’une fiche Sprint indique encore que les six registres ne sont pas développés, alors que l’Epic 5 a livré les services centraux.

## Diagnostic vérifié sur GitHub main
- `src/app/app/admin/sprints/[sprintId]/page.tsx` appelait `readSprintRegisters(...)` **sans son fournisseur**, lequel retourne par conception `producer-not-installed`.
- `src/server/sprints/registers-detail-read.ts` cherchait `snapshot.qualitativeRegisters`, ancien contrat provisoire D8 ; `src/server/sprints/closure.ts` et `src/server/registries/closure-snapshot.ts` écrivent effectivement `snapshot.qualitative` avec `state/items/relations/facts`.
- L’Epic 5 persiste ses six types `risk`, `obstacle`, `dependency`, `decision`, `action`, `highlight` dans `smn_registry_item`. Les faits automatiques se trouvent dans `smn_automatic_highlight`, leurs préférences dans `smn_fact_selection`, les liens cycle dans `smn_registry_cycle_link` et la criticité des risques dans `smn_risk_assessment`.

## Correctifs
1. **Raccordement officiel** : `readEpic5SprintRegisterSource` dans `src/server/registries/sprint-adapter.ts`, appelé depuis la fiche Sprint seulement lorsque l’onglet est consulté.
2. **Sécurité** : requêtes `SELECT` bornées à l’installation initialisée, à l’équipe résolue sur le serveur, au Sprint, et aux faits d’origine vérifiable ; tables optionnelles détectées avant requête, pas de DDL.
3. **Temporalité** : dates `occurred_on` interprétées avec `sprint.timeZone` ; éléments permanents pertinents lorsqu’ils étaient ouverts durant le Sprint, statuts terminaux bornés par une transition réellement historisée (pas `updated_at` générique) ; liens explicites au Sprint honorés. Décisions et faits ponctuels sélectionnés dans `[startAt,endAt[` sauf lien explicite. Source et total non inventés.
4. **Faits marquants** : prise en compte des fiches manuelles et des événements automatiques liés aux risques/obstacles/dépendances/etc. et aux objectifs du Sprint ; exclusion des faits masqués/invalidés.
5. **Snapshots** : conversion stricte du `qualitative` effectivement enregistré ; conservation du contrat `qualitativeRegisters` pour compatibilité ; si ancien snapshot absent/non fiable, message d’historique manquant et **aucune reconstitution actuelle**. Les anciennes données de clôture ne renvoient pas vers des fiches aujourd’hui différentes.
6. **UX** : six filtres par catégorie et « Tous », filtre appliqué avant pagination, navigation retour aux fiches réellement persistées, statuts FR/EN et badges de criticité réelle ; retrait des textes périmés « registres non développés ».

## Vérifications et recette
Fichier de tests ajouté : `tests/smn-234-registres-epic5-adapter.test.ts`.
- Six types, dates et portées équipe/Sprint, faits manuels et automatiques, statut actif ou clôturé, historique SMN-111, absence de schéma, filtres et pagination, sécurité SELECT.
- Tests historiques à relancer : `tests/smn-234-sprint-registers-d8.test.ts`, `tests/smn-111-qualitative-closure.test.ts`, `tests/smn-112-qualitative-versions.test.ts` si présent, `tests/smn-registry-team-context.test.ts`.
- **Non exécutés ici** : tests TSX, `pnpm typecheck`, `pnpm build` et recette PostgreSQL/navigateur. GitHub Actions désactivé. Les contrôles statiques via connecteur ne constituent pas une validation d’exécution.

```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-234-registres-epic5-adapter.test.ts tests/smn-234-sprint-registers-d8.test.ts tests/smn-111-qualitative-closure.test.ts tests/smn-registry-team-context.test.ts
pnpm build
pnpm dev
```

**Recette manuelle :** ouvrir `/app/admin/sprints/<id>?tab=registers` avec des fiches de test : vérifier chaque catégorie, la liste filtrée, les liens et les compteurs, les périodes, la pagination, les profils admin/user, les données fermées et un snapshot historique. La Story SMN-234 ne doit pas être clôturée sans cette recette.

## Adaptation BMAD
Le skill d’agent Amelia et le skill bmad-build ont été lus sur GitHub. Le moteur officiel `uv run .../render_skill.py` et le workflow local n’ont pas été exécutés : aucun checkout du projet et de ses dépendances n’est présent dans la session. Conformément à la configuration, aucune validation BMAD scriptée n’est revendiquée.
