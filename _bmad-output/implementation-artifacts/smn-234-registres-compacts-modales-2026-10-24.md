# SMN-234 D8 — Révision UX : rangées Registres compactes et modales

Date : 24 octobre 2026
Référence visuelle : capture fournie « Sprint, onglet Registres, 4 fiches ».
Source fonctionnelle : `docs/UX-REFERENTIEL-BMAD.md`, registre Epic 5 et modèles SMN-234.

## Besoin validé par la demande
1. Rendre les fiches des six registres plus compactes, idéalement **une seule ligne sur grand écran**.
2. Augmenter la taille du pictogramme à gauche et l'étirer à la hauteur de chaque rangée.
3. Conserver titre en gras, cliquable **sans soulignement** et mettre le badge de statut **avant** ce titre.
4. Remplacer le bouton « Ouvrir la fiche » par une icône crayon en bout de ligne.
5. Ouvrir le **même formulaire complet** via le titre ou le crayon, puis actualiser la page après sauvegarde.
6. Agrandir la police et les icônes des sept filtres, sans modifier leur fonctionnement.

## Implémentation
- `src/app/app/admin/sprints/[sprintId]/sprint-register-row.tsx` (nouveau) : composant client de rangée, iconographie dédiée, déclencheurs titre/crayon vers un même `dialog` rendu en portal hors du DOM de la liste, réemploi du formulaire `RegistryCreate` et de ses validations. Rafraîchissement `router.refresh()` seulement après une sauvegarde réussie.
- `src/app/app/admin/sprints/[sprintId]/sprint-registers-panel.tsx` : lignes déléguées au composant compact, données et statuts déjà traduits, date métier affichée sans `00:00`, sept filtres inchangés et pagination conservée.
- `src/app/app/admin/sprints/[sprintId]/page.tsx` : passage du contexte équipe et des droits d'édition, sous protection des Sprints clôturés.
- `src/app/dashboard.css` : grille desktop (catégorie, statut, titre, priorité, date, action) ; grilles tablette et mobile ; zone pleine hauteur et iconographie colorée par type ; boutons de filtre agrandis ; titre fort, non souligné, avec focus visible.
- `src/app/app/admin/registries/registry-create.tsx` : propagation du callback `onSaved` sur les sous-formulaires préexistants de décision, actions, relations, dépendances, ROAM, criticité et risque matérialisé ; leurs pages indépendantes ne changent pas.
- `src/app/app/admin/registries/` : callbacks facultatifs sur `decision-detail`, `decision-actions`, `action-links`, `dependency-parties`, `dependency-vigilance` et `materialize-risk`.
- `src/i18n/fr.json`, `src/i18n/en.json` : intitulés accessibles « Modifier la fiche », « Consulter la fiche », « Priorité ».
- `tests/smn-234-sprint-registers-compact-modals.test.ts` ajouté ; anciens tests D8 et Epic 5 adaptés au remplacement du bouton par la modale.

## Garanties et limites
- **Fiches réelles** : seules les entrées avec URL normalisée correspondant strictement à la fiche de l'id dans les registres de l'installation utilisent `RegistryCreate`. La modale complète et ses sous-formulaires respectent les règles serveur existantes, le statut, la priorité, les révisions et les permissions.
- **Faits marquants automatiques** : absence de fiche du registre à cet identifiant : titre ouvrant une consultation des champs réellement projetés ; **aucun crayon** susceptible de modifier une autre fiche.
- **Snapshots clôturés** : titre ouvrant une consultation figée, sans modification et sans relecture du registre courant.
- **Rôle user** : accès en consultation ; aucun crayon d'édition.
- **Aucune modification de schéma, d'API ou du producteur de données**. Aucun champ de description, responsable ou priorité non présent dans la projection n'est inventé.
- **Adaptation BMAD** : skill agent Amelia disponible sur GitHub, les commandes locales `uv run` ne sont pas exécutées via le connecteur, pas de prétention de validation BMAD automatisée.

## Vérifications
Revue statique des interfaces, importations et contrats via GitHub, avec fichiers de test de non-régression ajoutés. **Non exécutés dans cette session** : `pnpm typecheck`, tests Node/TSX, `pnpm build`, intégration PostgreSQL ou recette visuelle. GitHub Actions reste indisponible.

### Recette Windows PowerShell
```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-registers-compact-modals.test.ts tests/smn-234-sprint-registers-d8.test.ts tests/smn-234-registres-epic5-adapter.test.ts
pnpm build
pnpm dev
```

Vérifier dans **Sprint 2 → Registres** : tous les filtres, 4 fiches affichées en lignes compactes, date sans 00:00, la visibilité du statut devant le titre, le crayon, la modale et sa sauvegarde suivie d'actualisation ; droits user, Sprint clôturé, fait automatique, priorité absente, onglets FR/EN, affichage 1440/1024/390/320 px. Ne pas clôturer SMN-234 sans résultat de cette recette.
