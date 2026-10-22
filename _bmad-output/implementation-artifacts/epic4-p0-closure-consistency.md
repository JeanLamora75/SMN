# Epic 4 — P0-04 : intégrité des clôtures et tendances

## Correctifs publiés
- Suppression des jointures vers les Story Points et valeurs de capacité vivantes dans `trends.ts` : seules les valeurs du dernier instantané d'un Sprint actuellement clôturé alimentent les tendances.
- Initialisation du schéma de clôture avant la lecture des tendances.
- Sélection de la capacité initiale et réelle au moyen de sous-requêtes scalaires déterministes ; absence de multiplication de lignes par plusieurs snapshots.
- Capture des participants explicites des réunions exceptionnelles dans les versions de clôture.
- Les instantanés précédents restent immuables grâce au trigger de la migration précédente.

## Réserves
- Les valeurs de capacité absentes restent nulles ; aucune reconstruction rétroactive.
- Vérifier l'ordre des migrations et la structure SQL réelle des snapshots sur PostgreSQL 18.6.
- La protection contre toutes les écritures métier concurrentes, les historiques de décisions, les champs spécifiques et les formats de bilan doivent être revus globalement.
- Aucun test, build TypeScript, validation Prisma ou migration exécuté. NO-GO maintenu.
