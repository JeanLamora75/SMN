# SMN — Dashboard Builder — Refonte Cockpit Agile (04/11/2026)

## Référence

- [Contrat UX validé](../planning-artifacts/ux-designs/ux-dashboard-builder-2026-11-04/REFERENCE-RESTITUTION-VALIDEE.md).
- [Planche SVG de référence](../planning-artifacts/ux-designs/ux-dashboard-builder-2026-11-04/dashboard-builder-reference.svg).
- Référence du shell : `src/app/app/private-shell.tsx`, `private-navigation.tsx`, `active-team-selector.tsx`.

## Travail publié sur main

- `dashboard-consultation.tsx` : bandeau métier Cockpit Agile sous le shell SMN, sprint et statut lisibles, deux cartes dynamiques d'en-tête intégrées, équipe en lecture seule, Actions et Actualiser, répartition des cellules configurées lorsque le modèle est incomplet.
- `dashboard-visualization.tsx` : hiérarchie typographique des KPI, graphiques SVG avec graduations, libellés et description accessible. N'utilise que les valeurs reçues.
- `dashboard-business-list.tsx` : listes métiers compactes, liens, badges de statut, pagination et actions d'ajout préexistantes conservées.
- `dashboard-dimensions.module.css` : design isolé au Dashboard Builder, bandeau métier, cartes, listes, style Bootstrap/SMN et adaptations tablette/mobile.
- `dashboard-editor.tsx` / `page.tsx` : passage du nom de l'équipe à titre informatif, sans second sélecteur.
- `slot-wizard.tsx` : noms de représentations en français et aperçus de formes graphiques dépourvus de données métier simulées.
- `tests/smn-363-dashboard-draft.test.ts` : contrat du bandeau adapté et garde-fous statiques supplémentaires.

## Invariants

- Aucun changement des fichiers de shell, des permissions, du moteur d'indicateurs v33, des schémas PostgreSQL, des migrations ni du stockage de dispositions.
- Les cartes et graphiques continuent d'utiliser les producteurs autorisés et le contexte sprint/équipe existant.
- La bascule du Dashboard Builder comme page d'accueil reste **fermée** par `SMN_DASHBOARD_BUILDER_CUTOVER` conformément au contrat SMN-374. Ne pas activer avant validation des adaptateurs, tests BDD et recette Windows.
- **Jauges :** le service de lecture batch ne fournit aujourd'hui ni `minimum`, ni `maximum`. Faute de bornes garanties, le mode consultation affiche « Bornes de jauge invalides » plutôt que d'inventer un ratio. Raccorder des bornes métier validées dans un lot séparé pour rendre les jauges opérationnelles.

## Vérifications réalisées

- Lecture des composants GitHub depuis `main`, comparaison de la référence UX et des signatures de composants.
- 13 contrôles statiques effectués via le connecteur : shell, bandeau, équipe unique, deux KPI d'en-tête, grille incomplète, listes, KPI, jauges, aperçus, responsive, mode édition, feature gate et assertion de test. **13/13 réussis.**
- Les fichiers ont été relus après publication.

## Vérifications non réalisées

- `pnpm typecheck`, `pnpm lint`, tests Node TSX, compilation Next, tests PostgreSQL, exécution de GitHub Actions et recette visuelle en navigateur : **non exécutés**, car le connecteur GitHub ne fournit pas d'environnement d'exécution du projet.
- Le skill officiel Amelia `SKILL.md` de `.agents/skills/` n'a pas pu être récupéré par le connecteur sur les chemins tentés. `_bmad/bmm/config.yaml` et `_bmad/_config/manifest.yaml` ont été lus (BMAD 6.12.4). Intervention conduite selon les règles BMAD connues et documentée comme adaptation ; ne pas assimiler cela à l'exécution du workflow officiel.

## Recette locale Windows 11

Depuis une copie à jour du dépôt :

```powershell
git pull origin main
pnpm typecheck
pnpm lint
pnpm exec tsx --test tests/smn-363-dashboard-draft.test.ts tests/smn-362-dashboard-header.test.ts tests/smn-355-dashboard-layout.test.ts tests/smn-358-dashboard-sources.test.ts
pnpm build
pnpm dev
```

Ouvrir `http://127.0.0.1:3003/app/dashboard-builder` (sur une installation utilisant le port 3003), avec session connectée et équipe autorisée. Comparer en consultation et personnalisation avec la maquette validée, vérifier le menu latéral et le header global, thèmes, quatre tailles de bloc, les six modèles M01–M06, sprints actif et clos, sources absentes et usages mobiles.

## Statut

**Implémentation de restitution publiée sur main, vérifications statiques positives. Validation technique et visuelle finale en attente des tests locaux et de la recette.** Ne pas déclarer livraison terminée ni CI verte.
