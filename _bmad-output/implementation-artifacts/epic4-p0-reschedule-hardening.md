# Epic 4 — P0-03, sécurisation des replanifications

Branche `fix/epic4-p0-reschedule-safety`, issue de `fix/epic4-p0-explicit-work-slots`.

## Mesures publiées
- Replanification `keep` refusée dès qu'une cérémonie, occurrence personnalisée ou réunion exceptionnelle sort des nouvelles bornes. Aucune mise à jour partielle dans ce cas.
- Contrôle répété sous transaction avant UPDATE, en plus de la prévisualisation.
- Jeton de prévisualisation incluant les avertissements observés et les anciennes bornes.
- Initialisation des schémas nécessaires aux diagnostics et événements.
- Lecture de capacité manuelle fondée sur les dates locales du Sprint plutôt que sur le préfixe UTC des horodatages.
- Référence de capacité réelle prévisualisée avec signalement des réunions exceptionnelles impactantes ; aucune écriture automatique dans les données manuelles, objectifs, Story Points ou snapshots.

## Limites et bloqueurs
- Mode `recalculate` non disponible : le déplacement sûr des événements personnalisés et protégés reste à concevoir et tester.
- La référence de capacité recalculée n'est pas encore persistée après confirmation ; elle demeure informative.
- La comparaison du jeton n'est pas une preuve transactionnelle complète si les événements sont modifiés entre l'aperçu et la confirmation sans sortir des nouvelles bornes.
- La piste d'audit ne conserve pas encore les refus et les sources détaillées du calcul.
- Les champs `datetime-local` de cette interface doivent actuellement être saisis en UTC, comme indiqué dans leurs libellés ; une ergonomie de fuseau équipe reste nécessaire.
- Compilation TypeScript, Prisma, migrations SQL et recette PostgreSQL non exécutées. Aucun test CI disponible.

**Verdict : P0-03 partiel, NO-GO conservé. Aucune fusion sur main.**
