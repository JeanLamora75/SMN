# SMN-104 — Cockpit des points d'attention collectifs

Référence : https://lmn24.atlassian.net/browse/SMN-104

## Code livré sur main

- Lecture seule consolidée : risque de criticité élevée si ROAM différent de Resolved, obstacle ouvert/en cours, dépendance active explicitement À risque, action/dépendance dont l'échéance est proche ou dépassée selon le seuil SMN-103.
- API GET authentifiée `/api/admin/registries/attention` avec équipe installée et cycle Scrum optionnel validé. Calcul de la journée calendaire en Europe/Paris. Aucune écriture, changement de statut ou notification externe.
- Affichage accessible avec texte et icônes sur la page des registres, liens directs vers les fiches, FR/EN.
- Tests de règles préparés dans `tests/smn-104-attention.test.ts`.

## Travaux encore requis / recette

- Le sélecteur de cycle n'est pas encore raccordé à l'interface : la vue affiche actuellement toute l'équipe. Le serveur sait filtrer par Sprint explicitement lié, pas par période Kanban.
- Les sections contextuelles objectifs exposés / cycles terminés non clôturés (AC4) ne sont pas encore développées.
- L'intégration à la page principale du tableau de bord et aux snapshots historiques reste à finaliser.
- Les listes de registres sont réutilisées sans exposer de champs personnels sensibles. La recette des permissions reste à exécuter.
- Aucun typecheck, tests, build, recette PostgreSQL ou navigateur n'a été exécuté dans cette session. Jira non clôturé ; GitHub Actions indisponibles.

Validation Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-104-attention.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
