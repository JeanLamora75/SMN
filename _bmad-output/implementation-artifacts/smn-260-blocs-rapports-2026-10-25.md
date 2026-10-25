# SMN-260 — Gestion des blocs (incrément non validé)

## Livré sur branche
- Types de blocs `text`, `table`, `chart`, `kpi`, `image` avec identifiant stable et rubrique de rattachement.
- Ajout, suppression, visibilité, largeur et configuration de titre. Texte libre et liaison de métrique ; images saisies par URL sans téléchargement.
- Déplacement des blocs et rubriques par commandes monter/descendre accessibles sans glisser-déposer.
- Enregistrement indépendant dans `content.blocks` du rapport via PATCH existant ; données métier `content.metrics` affichées en lecture seule.
- Libellés FR/EN ; tests unitaires créés, non exécutés.

## Écarts vis-à-vis des critères
- AC1 : ordre et visibilité reflétés dans le rendu, persistence dépend du PATCH, tests intégration requis ; les blocs du modèle sont encore des rubriques, non des blocs initialisés.
- AC2 : les contrôles de contenu et largeur existent ; tableau, graphique, KPI sont encore présentés sous forme textuelle. Image affichée comme lien, pas comme visuel intégré. Styles riches et rendu final à développer.
- AC3 : ajout indépendant, sans changement automatique des autres blocs.
- AC4 : masquage non signalé par le Studio, mais le contrôle qualité de l'export doit être adapté dans sa Story.
- AC5 : boutons de déplacement disponibles et test unitaire pur ajouté, non exécuté.

## Réserves
- Aucun typecheck, build, test PostgreSQL ou recette accessibilité tactile n'a été exécuté.
- Pas de changement du schéma ni des archives PDF ; la taille totale du document reste limitée par le backend.
- Contrôle serveur de la forme `blocks` à renforcer pour empêcher des blocs malformés en PATCH direct.
- La composition libre au pixel reste exclue.
- PRs SMN-254 à SMN-259 sont encore en brouillon ; ne pas fusionner directement en main.
