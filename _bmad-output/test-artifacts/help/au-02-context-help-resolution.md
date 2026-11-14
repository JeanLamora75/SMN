# AU-02 — Aide contextuelle Membres, Calendrier et Périodes Kanban

**Responsables :** Camille (contrat documentaire), Sally (placement ergonomique), Amelia (développement et tests)  
**Date de consultation :** 2026-11-15  
**Périmètre :** ajouter les entrées de l'aide contextuelle déjà documentée, sans remplacer les formulaires métier ni introduire un autre contenu d'aide.

## Contrat éditorial Camille

Les articles canoniques existent déjà en **français et anglais** sous `content/help/<locale>/{members,calendar,kanban-periods}.md`. Les routes et les IDs sont déclarés dans `src/lib/help-catalog.ts`. Les trois boutons réutilisent exclusivement `HelpHeaderAction` / `HelpContextButton` et l'API de lecture `GET /api/help/articles/[articleId]`.

## Décision UX Sally

- **Membres :** insérer l'aide dans la zone d'actions de l'en-tête `smn-team-hero-actions`, avant les boutons d'affichage/l'ajout, en utilisant le style secondaire existant `smn-team-view-button` ; ne pas toucher aux fiches et filtres.
- **Calendrier :** placer l'aide à proximité des commandes de navigation de l'en-tête `smn-cal-hero-top` ; utiliser un bouton secondaire contrasté et conserver la sélection de période ainsi que les flèches.
- **Périodes Kanban :** placer l'aide à droite du titre principal dans `KanbanPeriodForm`, hors formulaire de création ; garder la possibilité de consulter le guide sans permission de création.
- Sur mobile : conserver les conteneurs `flex-wrap`. Les boutons de l'aide sont `type="button"` et ne soumettent aucun formulaire.
- Une modale concurrente renvoie vers le guide complet dans un nouvel onglet ; la modale Aide restaure le focus au déclencheur à sa fermeture. Les règles d'accessibilité et de contenu sont **celles du composant partagé**, pas une nouvelle implémentation.

## Modifications Amelia publiées

1. `src/app/app/help/help-header-action.tsx` : routes exactes
   - `/app/admin/members` → `members`
   - `/app/team-calendar` → `calendar`
   - `/app/admin/kanban-periods` → `kanban-periods`
2. `src/app/app/admin/members/team-overview.tsx` : action dans l'en-tête Cockpit Équipe.
3. `src/app/app/team-calendar/team-calendar-view.tsx` : action dans l'en-tête Calendrier, à côté de la navigation.
4. `src/app/app/admin/kanban-periods/period-form.tsx` : action à côté du titre.
5. `tests/help-au02-context-entry.test.ts` : validation des routes exactes, points d'entrée, documents FR/EN et droits.
6. `.github/workflows/help-quality.yml` : ajout de ce test bloquant et des déclencheurs sur les trois vues.

## Autorisations préservées

- `members` reste une ressource `settings`, accessible uniquement à l'administrateur autorisé dans le catalogue d'aide ; la page métier protège aussi la lecture via une ressource `members`.
- `calendar` reste une ressource `collective` consultable par administrateur/utilisateur autorisé.
- `kanban-periods` reste `collective` en mode `kanban` uniquement, conformément au correctif AU-01 ; l'écriture métier demeure réservée à l'administrateur.
- Aucun changement de PostgreSQL, de permissions serveur, de contenu Markdown, de traductions ni d'index.

## Contrôles et limites

- [GitHub Actions — CI AU-02](https://github.com/JeanLamora75/SMN/actions/runs/43651197433) : lire la **conclusion terminale** et non déduire une réussite d'une étape intermédiaire.
- Le test AU-02 est bloquant dans la suite de contrats de la CI. Les tests Chromium existants vérifient le composant modal en **fixture**, mais ne couvrent pas une session authentifiée sur chacune des trois pages réelles.
- La recette utilisateur restante est de vérifier l'affichage, le focus, l'absence de perte des brouillons, l'accessibilité mobile/zoom 200 %, et les profils admin/utilisateur Kanban avec une installation SMN réelle.

**Statut de la démarche :** développé ; qualification à interpréter depuis la CI et une recette navigateur réelle. Aucune story Jira créée ou changée, aucun script `uv` exécuté.
