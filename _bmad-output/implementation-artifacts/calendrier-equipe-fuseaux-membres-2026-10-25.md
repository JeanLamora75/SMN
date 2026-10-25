# SMN — Calendrier international, fuseau d'affichage (25/10/2026)

## Besoin confirmé
La vue « Calendrier d'équipe » doit pouvoir afficher les réunions et cérémonies dans le fuseau IANA d'un membre de l'équipe internationale. Si un seul fuseau existe, ne pas montrer de sélection.

## Implémentation
- API GET `/api/team-calendar/time-zones` : liste dédupliquée des fuseaux IANA des membres actifs, affectés à l'équipe, selon la dernière localisation effective à la date courante. Autorisation de lecture collective ; aucune localisation individuelle n'est transmise.
- En-tête : un unique fuseau → libellé seul ; plusieurs fuseaux → liste déroulante ; absence de données → Europe/Paris ; erreur réseau → avertissement.
- Les cartes et l'agenda utilisent le fuseau choisi pour afficher les heures et la date locale des cérémonies et réunions.
- La sélection ne change ni la base PostgreSQL, ni les instants UTC, ni les horaires planifiés, ni les capacités.
- Changement de jour possible autour de minuit selon le fuseau choisi ; les dates du cycle restent les dates de référence du calendrier.

## Références
Jira : SMN-55, SMN-64.
Code : `src/app/api/team-calendar/time-zones/route.ts`, `src/app/app/team-calendar/team-calendar-view.tsx`, `src/app/app/team-calendar/calendar-option-b.tsx`.

## Recette
1. Deux membres avec `Europe/Paris` et `Asia/Kolkata` : sélecteur visible, comparaison heures et dates de cérémonies.
2. Même fuseau pour tous : absence de sélecteur, libellé compact.
3. Aucun fuseau renseigné : repli Europe/Paris.
4. Membres archivés ou dont l'affectation est terminée : leurs fuseaux ne sont pas proposés.
5. Calculer les changements d'heure de mars et octobre, événements avant/après minuit.
6. Contrôler lecture seule pour l'Utilisateur, absence de données nominatives dans l'API.
7. Exécuter `pnpm lint`, `pnpm typecheck`, `pnpm build` et les tests dédiés.

**Non exécuté dans cette session :** compilation, tests et recette PostgreSQL/navigation.
