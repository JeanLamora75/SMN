# SMN-64 — Utiliser le calendrier central partagé

[Story SMN-64](https://lmn24.atlassian.net/browse/SMN-64) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-64-calendrier-central.md)

## Consulter les éléments connus

Depuis le menu latéral **Calendrier → Calendrier central partagé**, sélectionner une date de début, puis une période de **7, 14 ou 28 jours**. La section « Calendrier central partagé » liste les événements datés réellement disponibles : les **absences/indisponibilités** et leurs catégories, les **fermetures collectives** et les **jours fériés connus**, avec légende et lien vers le registre source lorsque le rôle l'autorise.

L'Administrateur peut filtrer par membre, catégorie, absence prévue/imprévue et type d'élément. Le rôle Utilisateur voit uniquement les **effectifs agrégés par date**, sans nom, catégorie personnelle, motif, diagnostic ou localisation individuelle. Les filtres de type et période restent accessibles aux deux rôles. Dans le MVP, le filtre « Équipe » montre l'unique équipe installée : aucune équipe extérieure ne peut être sélectionnée.

Les liens « Ouvrir la source » pointent sur les registres existants, et l'Administrateur dispose du bouton d'édition de l'absence **auprès de la fiche membre d'origine**, sans créer un second enregistrement.

## Cycles Scrum / Kanban et réunions Agile

Le système ne possède pas encore de table ou de producteur réel pour les **Sprints, périodes Kanban et réunions Agile**. Le calendrier affiche donc les mentions « Aucun cycle opérationnel enregistré » et « Aucune réunion Agile enregistrée » ; il n'invente **ni cérémonie tenue, ni date de Sprint, ni événement historique** à partir des périodes de capacité. Les Stories des futurs Epics 4 et 7 raccorderont ces objets au contrat de lecture lorsqu'ils existeront.

Lorsqu'une réunion réelle sera disponible, le contrat n'affichera « Tenue » **que si son statut enregistré le dit explicitement**. Sans statut, il affichera « Statut non renseigné », même si la date est ancienne.

## Dates et confidentialité

Les absences et fermetures sont conservées en **dates métier `YYYY-MM-DD`** ; leur affichage n'utilise pas le fuseau du navigateur, ce qui évite de déplacer une absence à J−1 pendant un changement d'heure. Pour une réunion horodatée, le modèle utilise l'instant UTC d'origine et le fuseau IANA lié à la source (par exemple `Europe/Paris`) ; il peut afficher les deux, avec le statut enregistré.

Le calendrier est une **projection en lecture seule** : aucun glisser-déposer n'est autorisé. Choisir un filtre, une période ou un jour ne modifie aucune absence, cycle ou événement. Les corrections par l'Administrateur restent réalisées via les formulaires métier existants, avec leurs propres validations.

## Recette locale Windows / PostgreSQL 18.6

Synchroniser `main`. Aucune migration nouvelle n'est requise. Depuis PowerShell :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Scénarios : absence réelle + fermeture + couleur et lien de source ; utilisateur sans nom ni motif privé (inspecter aussi JSON de `GET /api/team-calendar`) ; types et dates filtrés sans POST ; absence de cycles et réunions fictifs ; aucune réunion passée présumée « Tenue » ; date d'absence `2026-10-25` inchangée selon le fuseau navigateur ; réunion synthétique de test avec UTC et Europe/Paris lors de la bascule été/hiver ; rôle Utilisateur refusé sur filtre `memberId`; impossibilité de déplacer par glisser-déposer.

Les scénarios d'injection de réunions/cycles de test sont couverts par **tests de contrat**, pas par une création d'enregistrement réel en base. Tester l'absence de nouvelles écritures lors de la consultation.

**Exécution non attestée ici** : tests locaux, compilation, HTTP et recette navigateur. GitHub Actions est hors circuit ; Jira En cours et BMAD review en attente de preuves.
