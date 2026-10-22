# Epic 4 — P0-05 : plages horaires explicites et déduction des réunions

## Réalisation sur fix/epic4-p0-explicit-work-slots
- Table `smn_team_work_slots`, modèle Prisma, API GET/PUT et interface d'administration FR/EN.
- Configuration volontaire du matin, de l'après-midi et du fuseau IANA : aucun horaire métier implicite.
- Résolution des bornes locales en instants UTC, refus des heures inexistantes/ambiguës au changement d'heure.
- Pour la capacité réelle uniquement : intersection des réunions exceptionnelles impactantes avec les demi-journées effectivement disponibles de chaque participant, union des chevauchements et pondération des quotités (allocation × développeur × contribution).
- La durée de chaque demi-journée configurée doit correspondre à la moitié des heures/JH du moteur existant.
- Quand les données ne sont pas sûres (horaires absents, participants incomplets, changement d'heure, durée réelle différente de la durée planifiée), la capacité reste `not-calculable` : aucune déduction inventée.
- La capacité initiale et les historiques déjà clos ne sont pas modifiés.

## Réserves bloquantes restantes
- La configuration est actuellement un paramétrage d'équipe unique et non un historique versionné par membre/date. Elle doit être vérifiée pour les horaires individuels et les anciennes périodes avant une mise en production.
- Une durée réelle différente de la plage planifiée ne donne pas l'heure effective de fin ; tant que cette heure n'est pas tracée, le calcul est délibérément refusé.
- Les calendriers avec horaires individuels distincts du modèle d'équipe ne sont pas couverts.
- Les requêtes et l'API doivent être testées sur PostgreSQL 18.6, et le contrat Prisma doit passer la validation.
- Tests unitaires écrits mais non exécutés ; aucune compilation Next/TypeScript ni recette de bout en bout exécutée.
- Les autres points P0-03 et P0-04 et les corrections P1 restent ouverts.

**Décision de fusion : NO-GO maintenu.** Aucune fusion sur main.
