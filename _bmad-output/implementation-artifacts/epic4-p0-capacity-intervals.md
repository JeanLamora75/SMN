# Epic 4 — P0-05 : moteur d'intervalles de réunions

## Contenu de la branche
- Fonctions pures d'union et bornage des intervalles UTC, évitant le double comptage des chevauchements.
- Fonction de conversion minutes → JH tenant compte des pourcentages d'allocation, de développement et de contribution.
- Quatre tests unitaires définis (chevauchement, bornage, pondération, erreur).
- Diagnostic de capacité réelle relié aux membres participant aux réunions exceptionnelles impactantes.
- Résultat d'équipe encore non calculable dès qu'une déduction nécessite des plages de travail exactes inconnues.

## Attention — pas encore conforme à SMN-81
Le calendrier de l'Epic 3 fournit des drapeaux de demi-journée disponible (matin/après-midi), pas leurs bornes horaires par membre. L'union des réunions ne peut être intersectée de manière fiable avec le temps de travail sans contrat d'horaires vérifié. Les fonctions mathématiques sont prêtes mais ne sont pas branchées à la déduction réelle afin d'éviter de fabriquer des JH.

## Vérifications
Les tests ont été écrits mais **pas exécutés**. Aucun build TypeScript/Prisma, ni essai PostgreSQL 18.6 ; GitHub Actions indisponible.

**NO-GO maintenu**, branche non fusionnée, prochains points : fixer explicitement les créneaux de travail, intégrer l'intersection et la déduction, lever P0-03/P0-04, compiler et tester.
