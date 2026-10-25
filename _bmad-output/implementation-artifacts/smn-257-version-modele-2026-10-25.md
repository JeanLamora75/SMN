# SMN-257 — Version du modèle attachée au rapport

## Livré sur branche
- Conservation existante du `template_id`, `template_version` et de `content.templateSnapshot` à la création (héritage SMN-254).
- Comparaison en lecture seule de la copie figée avec la version courante.
- Route GET sécurisée `/api/admin/reports/sprints/[id]/documents/[documentId]/template-update`.
- Avertissement discret en fiche rapport, traduction FR/EN.
- Tests unitaires de comparaison ajoutés.

## Critères
- AC1 : modèle et version épinglés à la création via SMN-254 ; non testé en PostgreSQL.
- AC2 : notification et comparaison de rubriques/options, sans mutation. Aperçu comparatif détaillé non réalisé.
- AC3 : adoption confirmée non réalisée : manque la stratégie de fusion des blocs et de protection des commentaires.
- AC4 : aucune mise à jour à la consultation (lecture seule) ; à tester en intégration.
- AC5 : archives PDF privées inchangées, non testées.

## Contrôles
- `pnpm exec tsx --test tests/smn-257-template-pinning.test.ts` : non exécuté.
- `pnpm typecheck`, `pnpm build`, intégration PostgreSQL/archives : non exécutés.
- Aucun merge, aucune transition Jira Done.

## Point de décision
Avant d'implémenter l'adoption V2, définir explicitement les modifications acceptables en présence de sections réordonnées, commentaires humains et futurs blocs du Studio. Le contrat interdit leur perte. Ne pas effectuer de mise à jour automatique.
