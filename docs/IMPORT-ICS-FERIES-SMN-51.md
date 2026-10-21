# SMN-51 — Import iCalendar (.ics) de jours fériés nationaux

[Story Jira SMN-51](https://lmn24.atlassian.net/browse/SMN-51) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-51-import-ics-feries.md) · [Import CSV SMN-50](IMPORT-CSV-FERIES-SMN-50.md)

## Utilisation sur l'écran Administration → Pays

1. Dans la section **Importer des jours fériés depuis un fichier ICS**, choisir le pays cible et un fichier `.ics` **local**, encodé en UTF-8, d'au plus 1 Mio.
2. Cliquer sur **Lire les événements** : consulter les dates, noms, événements refusés et motifs. **Aucun jour férié n'est écrit à cette étape.**
3. Cocher les seuls événements correspondant à des jours fériés du pays sélectionné. Ne pas cocher les réunions, congés personnels ni autres événements simplement parce qu'ils se déroulent sur une journée entière. Aucune case n'est précochée.
4. Définir la politique sur les dates déjà présentes : **Ignorer** (défaut) ou **Remplacer les noms différents**. Cliquer sur **Prévisualiser les événements retenus** : vérifier les doublons et les décisions ; valider ensuite **Confirmer l'import ICS**.
5. L'import affiche le nombre de dates ajoutées, corrigées et rejetées. Les modifications sont tracées en base avec `origin='ics'` ; elles n'écrasent ni les capacités initiales figées ni les PDF archivés.

## Interprétation prudente des calendriers

SMN n'est pas un moteur général de récurrences RFC 5545. Pour éviter d'inventer des journées non travaillées, seuls les événements d'une **journée entière unique** sont sélectionnables.

Exemple minimal admissible :

```ics
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:holiday-20260501
DTSTART;VALUE=DATE:20260501
DTEND;VALUE=DATE:20260502
SUMMARY:Fête du Travail
END:VEVENT
END:VCALENDAR
```

La fin `DTEND` est **exclusive** (le 2 mai n'est pas un deuxième jour férié dans cet exemple). Un événement sur plusieurs jours, une récurrence `RRULE`/`RDATE`, une exception `EXDATE`, un horaire local/`TZID`, une annulation, un événement sans date ou nom sûr est visible avec un motif de rejet et ne peut pas être importé par ce flux.

**Aucun abonnement par URL ni aucune synchronisation permanente** ne sont implémentés dans ce MVP. Les lignes ICS sont lues localement par le navigateur et transmises au serveur lors des actions de l'Administrateur ; le serveur ne télécharge aucun calendrier distant.

## Recette de qualification (à exécuter localement, non attestée ici)

Sur Windows 11, après synchronisation de `main`, utiliser une **base PostgreSQL 18.6 pilote isolée**, avec sauvegarde préalable. Exécuter les commandes applicables au projet :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Contrôler la migration **v17 → v18** sans perte d'audit CSV existant ; uploader l'ICS exemple ; vérifier qu'aucune ligne n'est créée à l'inspection ; sélectionner un seul événement férié ; prévisualiser, confirmer et contrôler la trace `origin='ics'`. Recharger le fichier (ne pas multiplier les dates), tester `skip` puis `replace`, plusieurs pays, réunion horaire, événements multi-jours, `RRULE`, `TZID`, annulation, date impossible, fichier non ICS, fichier trop gros, rôle non Administrateur (403), origine HTTP étrangère (403) et conflit entre aperçu et confirmation (409). S'assurer que capacités figées et anciens PDF restent inchangés.

**État de validation :** tests écrits mais pas exécutés ici ; tests d'intégration PostgreSQL/HTTP et recette manuelle à réaliser. GitHub Actions est exclu selon la politique SMN, et une fusion sur `main` n'est pas un certificat de recette.
