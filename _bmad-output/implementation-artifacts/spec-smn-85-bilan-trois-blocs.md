# SMN-85 — Bilan Scrum : trois blocs indépendants

Jira : https://lmn24.atlassian.net/browse/SMN-85

## Développement initial
- Page dédiée `/app/admin/sprints/review` avec ordre Objectifs, Story Points, Capacité du Sprint.
- Réutilisation des écritures indépendantes et audit des blocs Objectifs (SMN-83) et Story Points (SMN-84).
- Capacité du Sprint en lecture seule via moteur existant Epic 3 : valeurs retenues initiale et réelle, référence réelle calculée, provenances et écart JH seulement si sources fiables.
- Absence de zéro fictif pour les sources indisponibles : valeur nulle affichée « Non calculable ».
- Alertes sur brouillons Objectifs et Story Points, avertissement navigateur à la fermeture/rechargement, demande de confirmation lors d'un changement de Sprint dans chaque bloc.
- Aucun enregistrement automatique des autres blocs ; capacité initiale figée et manuelle réelle non modifiées.

## Points non finalisés
- La sélection du Sprint n'est pas encore centralisée : chaque bloc possède son propre sélecteur. Il faut vérifier qu'un bilan d'un seul Sprint est bien consulté dans les trois blocs.
- Le bouton « Enregistrer » ne figure pas sur la capacité, puisqu'elle est seulement en lecture dans cet écran. AC1 partiel sur la notion de trois blocs éditables.
- Les avertissements `beforeunload` protègent rechargement/fermeture et les changements de sélection du Sprint ; la navigation client Next.js vers d'autres routes n'est pas entièrement interceptée avec une modale Rester / Quitter sans enregistrer. AC5 partiel.
- La fiabilité des écarts JH doit être vérifiée face aux périodes de capacité non strictement alignées aux dates du Sprint.
- La capacité initiale n'expose pas de référence calculée distincte dans cette version (valeur affichée « Non calculable »). AC2 partiel.
- Tests TypeScript/Prisma/PostgreSQL, recette des trois blocs et de la navigation non exécutés ; GitHub Actions indisponible.

État : développement partiel, PR en brouillon, aucune fusion vers main.
