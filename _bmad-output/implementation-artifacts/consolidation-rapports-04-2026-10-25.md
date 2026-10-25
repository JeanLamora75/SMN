# Consolidation 04 — Rendu PDF et archives

## Correctifs publiés
- Contrôle serveur avant export/archivage : un bloc visuel visible de type `chart`, `table` ou `image` interdit l'export tant que le moteur PDF ne le restitue pas fidèlement ; les rubriques masquées ne bloquent pas.
- Code qualité distinct `unsupported-pdf-block`, traductions FR/EN, message d'erreur explicite. Aucun rendu simplifié trompeur n'est accepté pour ces blocs.
- Après le rendu Chromium, la route PDF relit le rapport et revérifie la révision attendue ; si le brouillon a changé durant le rendu, l'opération est rejetée avant transmission ou archivage.
- Archivage historique privé, hash SHA-256, stockage immuable et contrôle des droits laissés inchangés.

## Limites et critères toujours ouverts
- Une modification serveur entre la seconde vérification et le stockage de l'archive reste possible : pour une garantie atomique, produire et archiver une référence persistante immuable au snapshot exact avant rendu, avec stockage sûr et historique associé.
- Graphiques, tableaux complexes et images PDF ne sont toujours pas implémentés fidèlement : ils bloquent désormais l'export au lieu d'être remplacés silencieusement.
- Sommaire paginé, numéros de pages, logos et en-têtes/pieds de page complets non validés.
- Aucune génération PDF réelle, aucun test PostgreSQL, aucun `pnpm typecheck`, aucun `pnpm build` et aucune recette d'archives n'ont été exécutés.
- PR dépendante des PR précédentes, aucune fusion `main` ni changement Jira.

**Statut : correctifs de sécurité et de fidélité défensifs, non validés en exécution.**
