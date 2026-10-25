# SMN-243 — Fiche détaillée, bandeau et navigation par onglets

**Date :** 25/10/2026. **Statut : code présent sur une branche de développement, non testé localement, non fusionné.**
**Story :** https://lmn24.atlassian.net/browse/SMN-243.
**Branche :** `feat/smn-243-registres-fiche` ; créée depuis `feat/smn-242-registres-attention` (PR #129), qui dépend des PR #128 / SMN-241, #127 / SMN-240 et #126 / SMN-239.
**Références UX :** `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/{DESIGN,EXPERIENCE,CONTRAT-DEVELOPPEMENT,RECETTE-UX}.md`.

## Réalisation

- `src/app/app/admin/registries/[id]/page.tsx` : réutilise la route directe existante, l'autorisation collective serveur et la résolution de l'équipe installée ; équipe absente traitée par état traduit.
- `src/app/app/admin/registries/registry-detail.tsx` : **nouvelle présentation de lecture** via le GET existant `/api/admin/registries/[id]`, validation des type/statut/dates, ID exact et équipe ; refus de rendre des données inattendues ; gestion chargement, 404 et indisponibilité avec relance.
- Bandeau permanent : **Bootstrap Icon + type + titre + statut textuel**, date métier, échéance enregistrée et responsable seulement pour administrateur. La synthèse n'en répète pas les champs.
- Quatre onglets communs et conditionnels : **Synthèse**, **métier**, **Relations**, **Historique** ; fait marquant : **trois onglets** sans onglet métier fictif. Labels métier : « Évaluation & ROAM » (risque), « Résolution » (obstacle), « Parties & vigilance » (dépendance), « Décision & actions » et « Exécution ».
- `src/lib/registry-detail-tabs.ts` : table d'association des six types et contrat de navigation. `role=tablist/tab/tabpanel`, `aria-selected/controls/labelledby`, navigation flèches Gauche/Droite et Home/End, boutons focalisables ; panneaux non sélectionnés masqués sans effacer le lien ARIA.
- Réutilisation en **lecture seule** des composants métier existants : `RiskAssessment`, `RiskRoam`, `DependencyParties`, `DependencyVigilance`, `DecisionDetail`, `ActionLinks`, `RegistryRelations`, `RegistryCycles`; recours au même backend et aux droits existants. Un statut d'obstacle ou d'action est présenté comme **statut actuel** et non comme événement de résolution/fin d'exécution inventé.
- Les actions existantes `MaterializeRisk` et `DecisionActions` restent accessibles **uniquement à admin** ; elles ne créent aucun droit nouveau.
- **Historique :** onglet visible au rôle `user` avec explication de la restriction **sans requête à l'API d'historique**, dans l'attente de l'arbitrage explicite UX. `RegistryHistory` monté uniquement pour `admin`, permission backend inchangée.
- **Édition préservée** : le bouton « Modifier la fiche » admin ouvre temporairement l'éditeur `RegistryCreate` existant (avec validations et 409), puis recharge le détail après sauvegarde réussie. Une confirmation préalable à la sortie de l'éditeur limite la perte de brouillon ; l'édition **par modales/sections** reste le périmètre propre de SMN-245, non anticipé.
- `src/app/globals.css` : bandeau et onglets compacts responsive, variables du thème clair/sombre existant.
- `src/i18n/fr.json`, `en.json` : ajout de la section `registryDetail` (27 clés FR/EN).
- `tests/smn-243-registry-detail.test.ts` : 8 scénarios ciblés ajoutés **mais non exécutés**.

## Couverture des critères Jira

| AC | Implémentation | Vérification restante |
|---|---|---|
| AC1 | Identité visible en bandeau, propriétaire admin, échéance si renseignée | Recette données réelles et mobile |
| AC2 | Synthèse, Relations, Historique + 5 onglets métier conditionnels, aucun pour highlight | Chaque type avec fiche enregistrée |
| AC3 | API et composants métier Epic 5 réutilisés, actions existantes admin seulement, aucun changement des snapshots | Non-régression ROAM/risque, liens, cycles et audit |
| AC4 | Route directe conservée, navigation native boutons et touches ArrowLeft/ArrowRight/Home/End | Tests clavier/lecteur d'écran, URL directe |
| AC5 | Rôle user sans édition, propriétaire ni commentaire privé, historique verrouillé | Tests réels utilisateur admin/user et tests API |

## Réserves explicites

- **SMN-244** doit encore livrer la Synthèse structurée 2/3–1/3, les zones de journal/contextes : la présente Synthèse expose seulement la description complète existante, et l'ancien `comment` pour admin sous libellé **commentaire historique** (pas un faux fil de suivi).
- **SMN-245** introduira l'édition par section en modale ; la version SMN-243 conserve l'éditeur historique pour ne pas interrompre les fonctions existantes. Son annulation demande confirmation même quand aucun champ n'a été changé ; pas d'affirmation de conformité finale à la protection des brouillons.
- **SMN-250/251** traiteront les relations réorganisées et la chronologie des modifications : les composants historiques/relations existants sont simplement rebranchés, et leur présentation/migration n'est pas déclarée conforme à ces Stories.
- L'historique complet **du rôle user** est explicitement non arbitré ; ne pas étendre implicitement l'autorisation.
- Les composants `RegistryCycles` sont conservés pour les types déjà supportés. Leurs limites métier spécifiques Kanban restent celles des APIs existantes ; ne pas créer de données manquantes.
- La consultation détaillée porte sur une fiche **courante**, non sur les snapshots Vn de la fiche Sprint SMN-234. Aucun snapshot n'est reconstruit.
- Les données indisponibles ne sont pas remplacées par des valeurs de démonstration.

## Tests réalisés et non réalisés

- **22/22 assertions statiques ciblées positives** sur GitHub (règles de rendu, séparation auth, onglets, traductions, héritage des composants, non-écriture et responsive). Cette vérification est **statique**, pas un typecheck.
- JSON FR/EN parsés et parité des 27 clés confirmée.
- 8 scénarios `node:test` **écrits, non exécutés**.
- `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et recette navigateur/clavier/FR-EN/thèmes/RBAC/Scrum-Kanban : **non exécutés**.
- Scripts d'activation BMAD `uv run` non exécutés faute de checkout SMN accessible au processus d'exécution ; aucune validation BMAD fictive.

### Tests à réaliser sur le PC Windows 11 avec GitHub Desktop

```powershell
pnpm exec tsx --test tests/smn-90-registry-list.test.ts tests/smn-239-registry-transverse.test.ts tests/smn-240-registry-enriched-list.test.ts tests/smn-241-registry-card-view.test.ts tests/smn-242-registry-attention-band.test.ts tests/smn-243-registry-detail.test.ts
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Compléter par tests navigateurs : 6 catégories, admin/user, données manquantes, 404/503, ouverture par URL, flèches/Home/End/focus, description longue, changements de statut, thèmes clair/sombre, responsive 320/375/768/1024/1440, snapshots fermés non altérés.

**Definition of Done non atteinte ; ne pas déclarer SMN-243 validée avant ces contrôles.**
