# SMN-99 — Actions et relations avec décisions/obstacles

Jira : https://lmn24.atlassian.net/browse/SMN-99

Livré sur `main` : réutilisation du formulaire de registre (titre obligatoire, responsable texte libre, date cible nullable, statut À faire/En cours/Terminée/Annulée, historique acteur/date SMN-91), sans création de compte ou sous-tâches. Ajout d'une liaison atomique et auditée entre une action et une décision ou un obstacle existant de la même équipe. API GET/PATCH protégée, affichage et navigation sur la fiche action, i18n FR/EN. Règle pure : une action sans échéance n'est jamais en retard, de même qu'une action terminée ou annulée.

Limites : la relation inverse n'est pas encore affichée sur les fiches de décision ou obstacle (AC3 partiel). Les échéances ne sont pas encore raccordées au cockpit. La saisie des liens se fait après création. Aucun typecheck, test, build ou essai PostgreSQL/navigateur exécuté ; aucun GitHub Actions. Jira reste ouvert.

Vérifier sur Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-99-action-links.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
