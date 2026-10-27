# SMN-296 — Cloisonnement du générateur de cérémonies — 27/10/2026

Modifications publiées sur PR #204 :
- `saveTemplateOccurrences` accepte `expectedTeamId`, et refuse la génération si le Sprint appartient à une autre équipe, avant de charger les modèles et jours bloqués.
- `saveGeneratedCeremonies` propage ce paramètre sans casser les anciens appelants.
- `createScopedSprint` fournit l'équipe autorisée au générateur.
- Un test de non-régression de refus interéquipes est préparé dans `tests/smn-296-ceremony-team-scope.test.ts`.

**Portée et réserves :** ne sécurise pas les autres points d'entrée de lecture/édition des cérémonies ou du calendrier. Pas de tests exécutés, ni build, ni migration. Les écritures multiéquipes restent désactivées.
