# SMN-56 — Administration des jours de fermeture collective

[Jira SMN-56](https://lmn24.atlassian.net/browse/SMN-56) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-56-fermetures-entreprise.md) · [Calendrier d'équipe SMN-55](CALENDRIER-EQUIPE-SMN-55.md)

## Utilisation

Depuis le calendrier d'équipe, un Administrateur choisit **Administrer les fermetures**. Saisir un nom et les dates inclusives de début/fin, puis enregistrer. La fermeture couvre l'équipe unique du MVP et n'est jamais copiée sous forme d'absences individuelles.

Pour rectifier une ancienne fermeture, utiliser **Modifier**, ajuster dates ou nom et confirmer. La fiche garde son identifiant et incrémente sa révision ; les données antérieures sont tracées avec acteur et date dans la table d'historique. Pour annuler, décocher **Fermeture active** et enregistrer : l'historique est conservé et la fermeture n'apparaît plus dans le calendrier courant. Une réactivation est possible tant qu'elle n'entre pas en conflit avec une autre fermeture active.

Les dates impossibles, périodes inversées et recouvrements avec **une autre fermeture active** sont refusés explicitement. La modification simultanée d'une même fermeture provoque un conflit (409).

## Effets dans le calendrier d'équipe

La fermeture active est affichée **en tant qu'événement collectif identifié par son nom**, pour l'Administrateur et l'Utilisateur. Les motifs personnels restent privés selon SMN-55. Une fermeture, un jour férié national et une absence individuelle sur la même date ne produisent **qu'une seule indisponibilité par demi-journée**. Le calendrier ne fabrique aucune nouvelle absence individuelle.

La correction d'une date historique actualise la lecture dynamique, mais **ne recalcule pas les capacités initiales figées ni les anciens PDF archivés**.

## Recette sur base pilote (non exécutée dans cette session)

Sauvegarder une base pilote PostgreSQL 18.6 avant de récupérer `main`. Vérifier l'installation/migration du schéma **v19 → v20**, puis :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Contrôles fonctionnels recommandés : créer une fermeture de plusieurs jours, modifier ses dates, consulter l'historique en base, annuler puis réactiver ; refuser un 30 février, une période inversée, deux fermetures actives recouvrantes, une modification concurrente ; observer la fermeture dans la vue collective sous les deux rôles ; vérifier qu'un Utilisateur ne peut pas écrire ni consulter l'API d'administration ; provoquer un chevauchement férié national + absence + fermeture et confirmer **au maximum deux demi-journées déduites** pour une journée normalement travaillée ; vérifier qu'aucune absence nominative ni événement Daily n'a été créé ; vérifier la conservation des clichés initiaux et des anciens PDF.

**État :** tests écrits mais non exécutés ; migration PostgreSQL, compilation et recette navigateur à réaliser localement. GitHub Actions hors circuit. Jira **En cours**, BMAD **review**.
