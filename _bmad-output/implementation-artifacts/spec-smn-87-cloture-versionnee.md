# SMN-87 — Clôture, réouverture et reclôture versionnées

Jira : https://lmn24.atlassian.net/browse/SMN-87

## Implémentation initiale
- L'état `finished` reste indépendant de `closed`, la réconciliation calendaire ne clôturant pas automatiquement.
- Clôture manuelle d'un Sprint terminé et non déjà clôturé, sans obligation de valeurs facultatives. Les absences sont conservées comme nulles ou listes vides.
- Instantané JSON immuable V1 puis V2/V3 comprenant les objectifs, SP persistés, réunions standards/personnalisées/exceptionnelles et références capacité déjà disponibles ; audit avec auteur et date.
- Réouverture uniquement de `closed` vers `finished`, sans altération des instantanés précédents ni de la capacité initiale figée.
- Accès à la dernière version et aux anciennes, API et interface Administrateur FR/EN.
- Transactions PostgreSQL et verrouillage du Sprint. Aucune modification des PDF.

## Réserves à lever
- Vérifier la cohérence de tous les états de capacité, des règles de protection des périodes et la portée exacte des associations à figer ; plusieurs relations ne sont pas incluses dans la photographie initiale.
- Le calcul des tendances de SMN-86 lit encore les sources courantes, pas systématiquement le dernier instantané versionné.
- L'interface de consultation des versions utilise un affichage JSON technique plutôt qu'un bilan métier mis en forme.
- L'instantané n'est pas encore physiquement protégé contre UPDATE/DELETE par des droits ou triggers SQL ; l'immutabilité repose sur l'absence de mutation applicative.
- Tests TypeScript, Prisma, PostgreSQL et de non-régression non exécutés. GitHub Actions indisponible.

**Statut : développement partiel en PR brouillon, non fusionnée sur main.**
