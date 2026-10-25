# SMN-255 — Centre Rapports : compte rendu intermédiaire

Branche : `feat/smn-255-report-center` issue de `feat/smn-254-multiple-report-drafts`, non de main directement ; ne pas fusionner avant les gates SMN-254.

## Réalisé
- Page `/app/reports` : onglets Rapports, Modèles, Archives, recherche, filtre Sprint et statut, table responsive, états vides/erreur.
- Accès sidebar « Rapports » et depuis la préparation existante avec `cycleId` en contexte.
- Détail indépendant `/app/reports/[documentId]?cycleId=...` en lecture, sans attribuer à la page legacy une édition de brouillon spécifique.
- Sources existantes : `listReportTemplates`, `searchPdfArchives`, `listUserPdfArchives`; listing des documents avec jointure équipe et installation initialisée.
- Statuts d'archive, autorisations de téléchargement, et anciennes URLs conservés.
- FR/EN ajoutés dans les catalogues JSON existants.
- Création et édition reportées aux Stories de création/studio ; libellés honnêtes sans faux boutons.

## Réserves
- SMN-254 (base) n'est pas validée ; cette branche en dépend.
- Le listing est plafonné à 500 documents et n'a pas encore de pagination.
- Le filtre équipe est absent dans le MVP monoéquipe, conformément au contrat.
- Un compte user voit les brouillons collectifs par la politique collective/read existante, mais seulement ses archives ayant une autorisation explicite.
- Les filtres Sprint affichent les sprints ayant des documents dans la liste ; un lien entrant depuis un sprint vide conserve `cycleId` mais le sélecteur ne propose pas encore son libellé.
- L'onglet Archives n'applique pas la pagination du catalogue existant au-delà des 25 plus récentes pour l'admin.
- La prévisualisation des modèles et la création directe sont différées, non présentées comme livrées.

## Validation
- Relecture source par connecteur GitHub : effectuée.
- `pnpm typecheck`, `pnpm build`, tests ciblés, recettes PostgreSQL : non exécutés ici.
- GitHub Actions : désactivées.
- Jira : aucune transition vers Done.

À compléter : tests routage, filtres, permissions user/admin, états vides/erreur, archive existante et contexte Sprint, puis build local Windows avant fusion.
