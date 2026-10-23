# Matrice de répartition — modules existants de la page Sprints

**Audit du code `main` le 23/10/2026.** La page `src/app/app/admin/sprints/page.tsx` assemble une suite de composants séparés dans un conteneur plafonné à 900 px. Les lignes ci-dessous sont un **plan de reclassement UX**, pas un constat que les nouvelles routes existent.

**Destination A = Paramètres partagés ; B = index Sprints/actions ; C = Calendrier/réunion propre au sprint ; D = future fiche Sprint / Bilan ; E = historique ou vue spécialisée.**

| Composant actuel | Cible | Règle de transfert |
|---|---|---|
| `SprintForm` | B | « Générer des sprints » dans l'assistant, mode **un seul sprint** |
| `BatchPreviewForm` | B + E | Assistant 1–6 avec preview/validation, historique des lots en consultation distincte |
| `SprintStateList` | B | Source de l'index : nom, dates, états, priorisation de l'actuel ; compléter API si pagination/filtres nécessaires |
| `RenameSprintForm` | B | Action ⋯ sur l'ID du sprint, modale, versions et doublons conservés |
| `DeleteSprintForm` | B | Action ⋯ uniquement sur sprint jamais démarré ; aperçu conséquences et confirmation |
| `RescheduleForm` | B | Action ⋯ sur ID ; supprimer le champ UUID brut, préserver aperçu/validation et règles non rétroactives |
| `WorkSlotsForm` | A | **Paramètres > Jours ouvrés** : créneaux horaires/fuseau, sans ouvrir artificiellement l'édition des jours lundi–vendredi |
| `LunchForm` | A | **Paramètres > Jours ouvrés** : pause déjeuner par défaut |
| `TemplateForm` | A | **Paramètres > Cérémonies et modèles** : modèles réutilisables pour les prochaines générations |
| `TemplateOccurrencesList` | C + E | Occurrences réellement générées par sprint ; pas dans un éditeur de modèle global |
| `MeetingConflicts` | C + D | Alertes contextualisées au calendrier / sprint concerné ; consultation ciblée, non un tableau global dans Sprints |
| `CeremonyEditor` | C | Modification d'une occurrence/série dans Calendrier ou page de réunion dédiée, sur vrai ID événement |
| `ExceptionalMeetingForm` | C | « + Réunion » du calendrier, date et sprint préremplis ; préserver API et contraintes |
| `AttendanceForm` | C + D | Statut réel de la réunion sur sa page / bilan de sprint, pas page liste |
| `ActualDurationForm` | C + D | Durée réelle sur la réunion, agrégée dans le sprint |
| `ExceptionalCapacityForm` | C + D | Participants/impact capacité au niveau réunion, données de capacité agrégées dans Sprint |
| `SprintReviewLink` | B + D | Raccourci « Préparer le bilan » contextuel ; conserver `/app/admin/sprints/review` jusqu'à future fiche ; ne pas rompre l'URL |
| `GoalsForm` | D | Objectifs propres au sprint dans future fiche ou Bilan existant, pas dans index |
| `StoryPointsForm` | D | SP propres au sprint, identifiants/versions conservés |
| `ReviewCapacity` | D | Capacité initiale/réelle du sprint distincte des **règles générales** du centre Paramètres |
| `SprintTrends` | D + E | Tendances, bilan et comparaison, pas réglages globaux |
| `SprintClosure` | D | Clôturer/rouvrir/reclôturer et instantanés suivant règles SMN-87, ne pas fusionner avec supprimer |

## Traces de vérification supplémentaires

- `src/app/app/admin/sprints/page.tsx` : les éditeurs ci-dessus sont rendus simultanément, sans index d'entrée unique.
- `src/app/app/admin/sprints/state-list.tsx` : lit `GET /api/admin/sprints/states` et affiche déjà id/nom/état/dates. **Néanmoins il n'offre pas de recherche, filtres ni actions intégrées**.
- `src/app/app/admin/sprints/rename-form.tsx`, `delete-form.tsx`, `reschedule-form.tsx` : APIs de mutations existantes, formulaires indépendants. Réutiliser les contrôles.
- `src/app/app/admin/settings/page.tsx` : **portail Paramètres déjà présent sur main** à la date de cet audit ; vérifier la disponibilité réelle de la rubrique Jours ouvrés / Cérémonies et modèles avant d'y placer les composants.
- `src/app/app/team-calendar/team-calendar-view.tsx` : une grille calendrier et des sprints apparaissent dans l'état du code vérifié ; **tester** la navigation avec un sprint spécifié plutôt que supposer que les deep links sont déjà pris en charge.
- `src/app/app/admin/sprints/review/page.tsx` : écran Bilan séparé actuellement disponible ; il doit rester fonctionnel tant que la future fiche n'est pas livrée.
- `src/lib/private-navigation.ts` : entrée « Sprints » en mode Scrum pour admin, accès au portail Paramètres admin et lien Calendrier. Ne pas inventer de route Kanban analogue si elle n'existe pas.

## Règles de priorités

Les paramètres de l'équipe ont un **seul point d'édition**, et les mutations sur un sprint utilisent son **identifiant réel** transmis depuis la ligne. Les réglages nouveaux ne doivent pas être inventés pour atteindre 14 cartes : travailler avec la Story [SMN-225](https://lmn24.atlassian.net/browse/SMN-225) du centre Paramètres. La fiche future est un **lot à part**, sans blocage des lots liste/actions.

**Toute conservation/migration des formulaires hérités nécessite une vérification des routes et permissions ; supprimer les imports d'affichage uniquement après que leurs fonctionnalités sont accessibles depuis une destination réelle.**