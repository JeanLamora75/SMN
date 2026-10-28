# SMN-324 — Fermetures d'entreprise dans le calendrier

En schéma v31, la lecture du calendrier sélectionne les fermetures actives des entreprises représentées par des membres affectés à l'équipe administrateur résolue côté serveur. Les résultats incluent l'identité de l'entreprise, sa couleur, les dates et les membres du périmètre concerné.

Les événements de fermeture sont **informatifs** : aucune absence nominative n'est créée et aucune case entière n'est rendue indisponible à cause de l'affichage. Dans les deux vues du calendrier, cliquer sur le libellé ouvre une modale en lecture seule avec entreprise, période et membres accessibles. L'édition reste exclusivement dans les écrans de gestion des entreprises.

La route calendrier multiéquipe v31 refuse les accès non administrateurs tant que le contrat d'autorisation des équipes n'a pas été étendu. Aucune donnée d'une autre équipe ne doit sortir de la requête. Les anciennes bases conservent l'ancienne projection par équipe.

## Vérifications sur Windows
```powershell
pnpm exec tsx --test tests/calendar-company-closures.test.ts
pnpm exec tsc --noEmit
pnpm db:diagnose
```

Recette visuelle à effectuer dans les vues Cartes et Agenda : affichage de la couleur, clic et fermeture de la modale, absence de bouton d'édition, filtrage par équipe, fermeture sans membre visible et chevauchements.

Aucun test ni migration n'a été exécuté par ChatGPT.
