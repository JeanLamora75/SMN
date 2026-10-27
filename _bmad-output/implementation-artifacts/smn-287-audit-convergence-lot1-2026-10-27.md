# SMN — Lot 1 multiéquipes : audit de convergence et plan de clôture

Date : 27 octobre 2026. Analyse statique de la PR brouillon #204 (99 commits, 77 fichiers). Aucune compilation, aucun test, aucune migration exécutés.

## Constats vérifiés

1. `MULTI_TEAM_CONTEXT_READY=false` dans `src/lib/team-context-readiness.ts` bloque volontairement plusieurs parcours HTTP. Ne pas changer avant qualification.
2. Les créateurs `src/server/sprints/scoped-create.ts` et `src/server/kanban/scoped-create.ts` sont des services non exposés. La création de cycles depuis l'interface n'est donc pas achevée.
3. `src/server/teams/write.ts` prépare les écritures d'équipe en v29, mais leur mise à disposition doit être vérifiée avec les routes et avec les contrôles d'autorisation.
4. Les lectures de capacité, KPI, archives et registres ont reçu des correctifs localisés. Elles n'établissent pas une preuve globale d'absence d'accès interéquipes.
5. `src/server/registries/confirmed-highlights.ts` impose désormais un `teamId` pour v28/v29 ; les appelants doivent être recensés et autorisés pour éviter des pages indisponibles.
6. La migration v29 est préparée mais non déployée ; il reste les sauvegardes, le scénario de retour arrière et la recette sur copie locale.
7. La PR contient des tests préparés mais ils n'ont pas été exécutés. La qualité de compilation, l'intégrité SQL et la compatibilité runtime restent inconnues.

## Plan resserré — trois passes de finalisation

### Passe A — Contrat intégration et compilation
Recenser les routes et fonctions qui exposent : sélection de l'équipe, création Scrum/Kanban, calendrier, capacités, registres, rapports. Corriger les appels orphelins et contradictions de version sans ouvrir le verrou global. Exécuter les vérifications de type, lint et tests possibles dans un environnement de travail adéquat ; documenter les échecs existants séparément.

### Passe B — Parcours fonctionnel sécurisé
Intégrer des parcours complets : équipe active Scrum et Kanban, cycle propre à l'équipe, membres/affectations, calendrier, capacités, registre et rapports. Vérifier le refus d'une ressource d'une autre équipe, et le comportement des équipes archivées. Prévoir états vides et diagnostics explicites. Revoir le verrou global uniquement après démonstration des contrôles.

### Passe C — Migration et recette Windows 11
Préparer guide de sauvegarde/restauration, tester la migration sur copie, contrôler la rétrocompatibilité v27/v28, puis faire la recette fonctionnelle de l'administrateur. Migration réelle et fusion vers main uniquement après autorisation distincte.

## Critères pour déclarer le lot 1 terminé

- Un administrateur peut créer deux équipes de modes différents, changer de contexte sans mélanger les données, créer les cycles correspondants et accéder à leurs écrans métier.
- Les données membres, capacités, calendriers, registres et rapports sont correctement isolées.
- Une équipe archivée est non modifiable, son historique autorisé est consultable.
- Scénarios d'ID étranger et droits refusés vérifiés.
- Compilation, tests clés et migration sur copie documentés et réussis ; recette Windows 11 acceptée.

**Décision :** ne pas fusionner ni activer les écritures multiéquipes à ce stade. Passer des micro-incréments à des lots complets A/B/C avec liste de preuves de validation.
