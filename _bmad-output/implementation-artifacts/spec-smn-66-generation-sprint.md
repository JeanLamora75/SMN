# SMN-66 — Génération unitaire d’un Sprint Scrum

**Jira** : https://lmn24.atlassian.net/browse/SMN-66
**Dépendance** : SMN-65 / PR #56, branche de base `feat/smn-65-scrum-cadence`.

## Implémentation
- `GET /api/admin/sprints` : prochain numéro, date recommandée ou demande de départ explicite lorsque l’équipe n’a aucun Sprint. `?startOn=AAAA-MM-JJ` calcule une proposition sans persister.
- `POST /api/admin/sprints` : création immédiate, transaction PostgreSQL, verrou par équipe, contrôle de recouvrement, audit de succès atomique.
- `/app/admin/sprints` : formulaire unique, date modifiable, nom calculé jusqu’à personnalisation.
- `src/server/sprints/creation.ts` : application de la cadence SMN-65 et de son fuseau IANA. Les bornes sont figées dans `start_at` et `end_at`.
- `prisma/migrations/20261021_smn66_single_sprint/migration.sql` : Sprint, audit et index.

## Contrôles attendus avant fusion
1. AC1 : aucune date préremplie et Sprint #1 si table vide.
2. AC2 : après un Sprint, suggestion du prochain départ selon la date locale de fin, pour tous les statuts.
3. AC3 : changement de date -> nouvelle proposition et nouveau nom tant que non personnalisé.
4. AC4 : POST unique, HTTP 201, Sprint et audit enregistrés ensemble.
5. AC5 : chevauchement même équipe -> HTTP 409 et aucune écriture. Contrôler en parallèle la concurrence.
6. Autorisations : utilisateur standard -> HTTP 403 en GET et POST.
7. Vérifier les passages à l’heure d’été/d’hiver en Europe/Paris et les horaires inexistants/ambiguës.
8. Exécuter `pnpm exec tsc --noEmit`, `pnpm lint` et une recette PostgreSQL avant merge.

## Réserves
Aucune exécution de tests sur GitHub Actions. Les commandes locales et la recette PostgreSQL ne sont pas encore attestées. La PR ne doit pas être fusionnée avant vérification.
