# SMN-267 — Contrôle qualité avant export

## Incrément
- Contrôle de présence des données, provenance IA, statut courant provisoire, blocs invalides et tableaux pouvant nécessiter vérification.
- Les rubriques volontairement masquées n'entraînent pas de fausse erreur de donnée manquante.
- Vue des avertissements dans le nouveau Centre/Studio, FR/EN, tests unitaires rédigés.

## Limites bloquantes
- Le nouveau moteur PDF fidèle du Studio n'est pas connecté. Aucune action Exporter qui réussirait réellement ; AC1 et AC4 ne sont pas livrés.
- Vérification de fraîcheur réelle inter-versions et navigation directe vers bloc : à compléter.
- Détection de tableau trop large non fondée sur un calcul de largeur réelle ; simple règle prudente.
- Règles à appliquer côté serveur sur le dernier brouillon accepté avant futur export.
- Les avertissements éditoriaux ne prouvent jamais l'exactitude d'une analyse IA.
- Tests, TypeScript, build, recette PDF et PostgreSQL non exécutés.
- Risque de concurrence autosave/refresh SMN-264 toujours ouvert.
- Dépend des PR #146 à #158 ; ne pas fusionner ni clôturer Jira.
