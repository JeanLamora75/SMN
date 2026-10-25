# SMN-261 — Représentation des métriques (incrément partiel)

## Réalisations
- Lecture des mesures du rapport déjà préremplies, sans écriture dans la base métier.
- Présentation KPI/tableau, légende lisible, unité, source `sourceId` si disponible, message explicite en cas d'absence.
- Graphique non gradué sans base de comparaison : aucun axe ou pourcentage inventé.
- API de sélection du mode d'affichage via type `MetricPresentation` (chart/table/both), branchée aux types de bloc existants.
- Fonctions pures `metricDescriptor`, `metricScale`, `limitedHistory` ; borne maximale de cinq cycles dans la fonction de sélection.
- Tests unitaires ajoutés ; traductions FR/EN.

## Écarts Jira
- AC1 : un seul indicateur source est affiché en présentation simplifiée ; pas de graphique statistique ou graphique+tableau robuste.
- AC2 : limite de cinq cycles définie, mais collecte historique versionnée absente ; aucune requête historique non vérifiée n'est présentée.
- AC3 : null conservé et aucune comparaison inventée.
- AC4 : libellés distincts SP engagés/terminés, capacité disponible, pas d'effort consommé.
- AC5 : textes accessibles et tableau ; exporter en PDF les nouveaux blocs demeure à intégrer dans les Stories export.

## Vérifications
- Non exécutés : tests, typecheck, build, intégration PostgreSQL, contrôle lecteurs d'écran et PDF.
- PRs précédentes non fusionnées ; aucune modification sur `main` ni transition Jira.
- Points techniques à traiter avant l'intégration : rendre les labels traduisibles, ajouter une vraie source historique de cinq cycles, valider les sélections de métriques en backend et vérifier la sérialisation du modèle en export.
