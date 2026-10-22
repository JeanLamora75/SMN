# SMN-73 — Pause déjeuner et cérémonies segmentées

Jira : https://lmn24.atlassian.net/browse/SMN-73

## Livrables
- Paramètres de pause déjeuner par équipe Scrum, initialement 12:00–13:00, révision optimiste, écriture réservée à l'Administrateur.
- API GET/PATCH /api/admin/sprints/lunch, formulaire FR/EN.
- Planification des cérémonies avec découpage en segments lorsque la pause est rencontrée.
- Un enregistrement logique de cérémonie dans smn_sprint_ceremony, plusieurs segments si nécessaire dans smn_sprint_ceremony_segment.
- Review puis Rétrospective avant la marge finale de 30 minutes, sans temps de réunion pendant la pause.
- Paramètres appliqués uniquement lors de la génération des nouvelles cérémonies, sans recalcul des anciens Sprints.
- Aucun changement du moteur de calcul de capacité Développeur.

## Réserves / vérifications
- Recette à exécuter sur 1–4 semaines, une pause modifiée, une Planning traversant 12–13 h et deux cérémonies finales consécutives hors pause.
- Vérifier cas de réunions de grande durée chevauchant minuit, fuseaux IANA et DST, jours collectifs, dates historiques.
- Le référentiel complet des journées collectives et la personnalisation des timeboxes de SMN-72 restent à raccorder.
- Compilation TypeScript, validation Prisma, migration PostgreSQL et tests de bout en bout non exécutés ; GitHub Actions indisponible. Pas de fusion sur main.
