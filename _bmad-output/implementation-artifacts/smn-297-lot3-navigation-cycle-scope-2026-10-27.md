# Lot 3 — Cohérence de la navigation multiéquipes

Le sélecteur de cycles du shell vérifie désormais que le `defaultCycleId` renvoyé par le serveur figure effectivement parmi les cycles reçus pour l'équipe choisie. Sinon, il utilise le premier cycle autorisé ou une sélection vide. Lors d'un changement de cycle en mode multiéquipes, les paramètres historiques de l'URL ne sont pas conservés ; seuls le `teamId` courant et le `cycleId` vérifié sont émis. Le chemin historique monoéquipe est préservé.

Test source ajouté : `tests/smn-297-scoped-cycle-navigation.test.ts`. Aucun test, build ou migration exécuté. `MULTI_TEAM_CONTEXT_READY=false` ; aucun déploiement ni fusion.
