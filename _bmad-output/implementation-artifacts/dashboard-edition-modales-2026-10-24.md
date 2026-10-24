# SMN — Retouches des colonnes opérationnelles : édition en modales
Date : 24 octobre 2026
Branche : `ux/dashboard-edit-modals-20261024`

## Demande
Cliquer sur le titre de chaque risque, obstacle, événement et note/alerte ouvre la fiche éditable complète en modale ; après sauvegarde réussie, la carte et le compteur du tableau de bord sont rafraîchis. Supprimer le bloc de configuration redondant sous le dashboard.

## Réalisation
- `src/app/app/operational-edit.tsx` : nouvelle modale HTML `dialog` rendue dans le `body` (portal), titre déclencheur, lien secondaire vers la fiche et rafraîchissement `router.refresh()` après réponse positive seulement ; erreurs/conflict 409 affichés sans effacer le formulaire.
- `src/app/app/operational-overview.tsx` : tous les titres risques, obstacles, événements, notes et tâches de configuration déclenchent la modale ; conservation des liens de détail et des quatre actions Ajouter.
- `RegistryCreate`, `RiskRoam`, `RiskAssessment`, `RegistryCycles`, `RegistryRelations` : callbacks facultatifs après sauvegarde pour rafraîchir les projections, sans changer les pages dédiées.
- `src/server/dashboard/notes.ts` + `src/app/api/admin/dashboard/notes/[id]/route.ts` : lecture contextualisée et mise à jour auditée du contenu et du statut, protection des cycles clos et des mises à jour concurrentes.
- `src/server/dashboard/event-edit.ts` + `src/app/api/admin/dashboard/events/[kind]/[id]/route.ts` : édition des occurrences standard, issues de modèles ou exceptionnelles sans modification du modèle, aucune écriture depuis GET. Contrôles serveur sur les droits, Sprint, dates et statuts ; audit de modification et maintien de l'historique des cérémonies/présences.
- `src/lib/dashboard-local-datetime.ts` : dates des formulaires dans le fuseau du Sprint avec garde DST.
- `src/server/installation/contract.ts` : reconnaissance des deux tables additionnelles de journal d'édition.
- `src/app/app/page.tsx` : retrait du bloc de configuration bas de page ; Paramètres et alertes de configuration restent accessibles.
- `src/i18n/fr.json` / `src/i18n/en.json` : chaînes de dialogue localisées, statut « Non tenue » des événements.
- `tests/dashboard-operational-edit-modals-20261024.test.ts` et mise à jour du test de layout : couverture statique/lectures/dates. Tests complets à exécuter localement.

## Règles et limites
- Un compte `user` ouvre les informations autorisées en lecture seule. Les API PATCH continuent à exiger l'autorisation administrateur.
- Les alertes de configuration n'ont pas de titre ni de description éditables : seule la tâche de suivi `todo`/`done`/`ignored` est modifiable.
- La cérémonie standard de type `planning`/`review`/`daily`/`retrospective` conserve son type immuable : la modale édite sa date, durée et qualification.
- Les sous-formulaires conservent leurs validations propres. Le tableau de bord ne modifie jamais une occurrence de Sprint clôturé.
- L'ancienne liste Notes du Sprint ne propose pas encore un « Voir tout » dédié.
- Aucun diagnostic local, tests TSX, typecheck, build, intégration PostgreSQL ni test visuel navigateur n'a été exécuté par le connecteur GitHub. Le render BMAD via `uv run` n'a pas été exécuté, faute de checkout local accessible à cette session.

## Commandes PowerShell de recette
```powershell
git switch main
git pull origin main
pnpm typecheck
pnpm exec tsx --test tests/dashboard-operational-edit-modals-20261024.test.ts tests/dashboard-ux-dense-operational-20261024.test.ts tests/dashboard-operational-overview.test.ts tests/dashboard-ux-priority-cards.test.ts tests/smn-237-dashboard-events.test.ts tests/smn-238-dashboard-attention-recovery.test.ts tests/dashboard-operational-quick-add-20261024.test.ts
pnpm build
pnpm dev
```
Recette manuelle : ouvrir http://localhost:3003/app, tester chaque titre de carte en profil admin puis user, enregistrer une note, un obstacle, un risque (et sa criticité), une cérémonie de chaque origine, une tâche de configuration, puis vérifier que les cartes/compteurs sont actualisés. Tester le refus des Sprints clôturés et un conflit concurrent ; vérifier la disparition du bloc « Configuration — Paramétrage à compléter ».

Les stories Jira concernées ne doivent pas être clôturées avant la recette locale.
