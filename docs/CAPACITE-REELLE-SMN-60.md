# SMN-60 — Suivre la capacité réellement constatée

[Jira SMN-60](https://lmn24.atlassian.net/browse/SMN-60) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-60-capacite-reelle.md) · [Capacité initiale SMN-59](CAPACITE-INITIALE-SMN-59.md)

La [qualification historique SMN-61](FIABILITE-CAPACITES-HISTORIQUES-SMN-61.md) permet de distinguer une capacité prévue **Connue**, **Estimée** ou **Non renseignée**, sans la confondre avec le réalisé et sans modifier les clichés de clôture.

## Parcours Administrateur

Depuis **Calendrier d'équipe → Calculer la capacité en JH**, choisir une période puis demander le calcul. Un bloc **Capacité réellement constatée** apparaît séparément des résultats prévisionnels et de l'engagement initial.

| Statut | Référence du réalisé affichée |
| --- | --- |
| **À venir** | Aucun réalisé ; aucune extrapolation de journées futures |
| **En cours** | Calcul seulement jusqu'à la **veille** de la date métier Europe/Paris, si les données sont fiables. Le jour courant n'est pas présumé terminé. |
| **Terminée non clôturée** | Calcul dynamique sur l'ensemble de la période passée ; une correction tardive peut le faire évoluer. |
| **Clôturée** | Lecture du **cliché de clôture immuable**, sans nouveau calcul même après modification des absences. |

La **saisie manuelle du réalisé** est un champ distinct de la **saisie manuelle de capacité prévisionnelle** SMN-58. L'Administrateur peut saisir une valeur collective en JH, y compris **0**, et elle reste prioritaire quand la référence du réalisé change. Pour la retirer, utiliser **Effacer la saisie réelle** : la correction est historisée et la référence constatée redevient prioritaire si elle est fiable.

Le bloc montre la référence constatée, la valeur réellement retenue et sa provenance. L'écart entre réalisé et engagement initial figé n'est visible **que lorsque la période est terminée ou clôturée ET que les deux valeurs sont connues**. Il représente un écart de capacité de l'équipe, jamais une notation individuelle.

## Clôture

Pour une période **entièrement terminée**, choisir **Clôturer le réalisé**, puis confirmer. Le service sauvegarde un cliché immuable de la référence de clôture et de la valeur retenue, avec source, date réelle et identifiant d'événement. L'enregistrement renseigne aussi `closed_at` de la période partagée avec SMN-58 : toute correction manuelle directe ultérieure est interdite.

Un second déclenchement de la clôture retourne le cliché original (idempotence). Si les données sont incomplètes, le cliché peut contenir « Non renseigné », jamais un faux zéro. Aucun ancien PDF ni cliché de capacité initiale SMN-59 n'est modifié. Une réouverture contrôlée est hors périmètre et devra faire l'objet de la procédure métier dédiée.

## Recette sur PC Windows (non exécutée ici)

Synchroniser `main`, sauvegarder la **base pilote PostgreSQL 18.6**, puis valider la migration **v23 → v24**.

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Scénarios à vérifier : période future sans réel, période commencée depuis moins d'un jour (référence non connue), période en cours (jusqu'à la veille), période terminée recalculable, initial 20 JH / réalisé 18 JH = écart -2 JH, initial manquant = aucun écart, saisie réelle manuelle de 0 JH, effacement et audit, fermeture explicite et répétée, changement d'absence après clôture sans effet sur le cliché, refus d'écriture directe (423), refus d'une clôture avant la fin, refus des rôles Utilisateur, absence de modification des PDF et engagement initial.

**Non exécutés ici** : tests locaux, migration réelle, HTTP et recette navigateur ; GitHub Actions hors circuit. Jira En cours et BMAD review jusqu'à vérification.
