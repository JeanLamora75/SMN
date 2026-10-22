# SMN — refonte UX Calendrier selon Sally
Date : 2026-10-23
Source : décisions de Sally reprises dans les échanges avec l'utilisateur, puis confrontation avec l'implémentation de main.

## Règles de présentation validées
- Période affichée par défaut : sprint en cours en priorité ; sinon sprint/période la plus récente connue ; sans sprint, mois courant.
- Grille de **7 jours par rangée**, démarrant au premier jour de la période, sans ajout artificiel des jours antérieurs.
- Dates courtes jour + mois abrégé et libellé du jour.
- Jours samedi/dimanche et jours fériés : fond grisé, mais l'ajout d'une réunion doit rester possible.
- Jour courant : bordure plus épaisse et colorée.
- Nom du jour férié : affiché directement sous la date.
- Réunions : zone visuellement séparée de la date même sans jour férié, ordre chronologique ; survol montre début et fin, clic sur le nom mène vers l'écran de gestion de réunion disponible.
- Bouton « + » dans chaque case pour création via fenêtre modale centrée.

## Implémentation
- `src/app/app/team-calendar/team-calendar-view.tsx` remplace les multiples tableaux par les cartes quotidiennes.
- Période par défaut dérivée des états de sprint (`/api/admin/sprints/states`), avec mois en repli et navigation par période/mois.
- Les jours fériés, fermetures et absences restent issus de `GET /api/team-calendar` ; pour une durée hors de ses tailles admises (7/14/28), des fenêtres de 28 jours sont chargées et l'affichage est limité à la vraie période.
- Nouvelle lecture `GET /api/team-calendar/meetings` pour cérémonies et réunions exceptionnelles.
- Création via `POST /api/admin/sprints/exceptional-meetings`, sous les contrôles métier et d'autorisation existants.
- Style responsive, défilement horizontal des rangées à largeur limitée, translation FR/EN.

## Limites connues
- **Lien au détail :** l'application ne dispose pas encore d'une route de détail dédiée à une réunion. Le clic amène à la page existante `/app/admin/sprints`. La navigation vers un détail individualisé exige une route et une lecture dédiée.
- **Création hors sprint :** l'API existante de réunions exceptionnelles exige `sprintId` et refuse les réunions en dehors du sprint (et les périodes fermées). Le bouton reste proposé pour les jours fériés d'un sprint ; sur les mois sans sprint, la modale explique l'impossibilité de créer. Une réunion hors sprint exige une évolution du modèle métier à cadrer.
- **Utilisateurs non-admin :** les liens de gestion des sprints ne sont pas proposés si l'utilisateur n'est pas administrateur ; le calendrier garde une lecture seule.
- Le libellé « férié » est alimenté par les données calendaires connues pour les membres de l'équipe ; une couverture nationale non configurée ne produit pas de libellé inventé.
- Aucune compilation TypeScript, test serveur ou test de rendu navigateur exécuté dans la session d'assistance. GitHub Actions indisponible.

## Recette
1. `pnpm typecheck`, puis `pnpm dev` sur Windows, après Pull main.
2. Vérifier sprint courant, puis mois courant quand il n'y a aucun sprint.
3. Vérifier l'affichage 7 colonnes au premier jour, fonds grisés pour week-ends/fériés, surlignage de la date actuelle.
4. Vérifier les jours fériés affichés sous la date, la séparation avant les réunions et leur ordre.
5. Survoler une réunion ; vérifier les heures. Cliquer sur son titre ; vérifier le lien vers gestion Sprints.
6. Créer une réunion via + durant un sprint, y compris sur un jour férié ; vérifier validations horaire et rafraîchissement.
7. Ouvrir sur écran étroit ; contrôler l'accès horizontal et l'absence de chevauchement.
8. Ne pas considérer la fonctionnalité conforme avant tests effectifs et validation visuelle par l'utilisateur.


## Compléments de réalisation
- `GET /api/team-calendar/periods` lit les sprints en lecture seule avec l'autorisation du calendrier, sans dépendre de l'autorisation d'administration ni déclencher de réconciliation.
- Les réunions disposent désormais d'une page de **consultation individuelle** : `/app/team-calendar/meeting/[kind]/[id]` ; lien accessible aux utilisateurs autorisés en lecture, séparé des actions d'administration. Son statut n'est pas inventé lorsqu'il est indisponible.
- Les traductions de la fiche réunion sont centralisées en FR/EN.
- Les règles d'affichage ont fait l'objet d'un contrôle statique (sept colonnes, jour courant, férié sous date, réunions triées, heures au survol, modale, routes, catalogues FR/EN). Ceci n'est **pas** une compilation ou une recette navigateur.
- **Création hors sprint** toujours non prise en charge par le modèle métier actuel ; ne pas simuler de création.
