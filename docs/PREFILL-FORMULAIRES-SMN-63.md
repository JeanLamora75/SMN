# SMN-63 — Préremplissage des formulaires membres et calendriers

[Jira SMN-63](https://lmn24.atlassian.net/browse/SMN-63) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-63-prefill.md)

## Les trois provenances de données

| Provenance | Ce qui apparaît | Conséquence |
| --- | --- | --- |
| **Enregistrée** | Dernière valeur sauvegardée, même si volontairement vide | **Prioritaire** sur toute suggestion |
| **Suggestion** | Pays de référence de l'installation, semaine type et choix initiaux de répartition | **Modifiable**, non enregistrée tant que l'Administrateur n'a pas validé |
| **Inconnue** | Champ vide ou valeur « Non calculable » | Pas de chiffre zéro, absence, date opérationnelle ni événement inventé |

Le nom de l'équipe est repris directement de l'installation dans les écrans de localisation, calendrier et affectation.

Un membre peut rester **Provisoire** avec une adresse e-mail non renseignée : il n'est pas nécessaire de compléter toutes ses données facultatives pour accéder aux autres fonctions. Un calendrier non configuré indique clairement que la semaine affichée est une suggestion.

Le formulaire d'absences ne crée rien lorsque l'on consulte une date. Aucun motif ni catégorie ne sont choisis automatiquement. L'enregistrement nécessite une action explicite.

Le calcul de capacité attend désormais la sélection de bornes métier : il n'assimile plus la date du jour à un cycle opérationnel. Si une capacité manuelle est en cours d'édition, les changements de dates ou le recalcul demandent confirmation avant l'abandon ; les réglages JH/h ne peuvent pas effacer silencieusement le brouillon.

**Exemple :** pays de référence « FR », localisation enregistrée volontairement avec un pays vide : la fiche reste vide, elle ne repasse pas à « FR ». Avec une localisation absente, « FR » est seulement proposé. Même logique pour la semaine déjà enregistrée par rapport au modèle lundi–vendredi.

**Exemple de capacité :** saisie manuelle 32 JH, calcul 30 puis 28 après changement de source : 32 JH reste la capacité retenue, et 28 JH demeure la référence de calcul visible. Une saisie manuelle explicite de 0 JH reste 0 JH. Une valeur inconnue reste **Non calculable**, jamais zéro.

## Recette Windows à effectuer

Synchroniser la branche `main`, puis depuis PowerShell, après sauvegarde d'une base de test :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier les AC : pays FR suggéré sur fiche neuve, pays DE précédemment enregistré prioritaire, pays enregistré NULL respecté ; semaine proposée vs semaine enregistrée ; modifications de valeurs manuelles non remplacées par un recalcul, y compris 0 JH ; e-mail facultatif et membre Provisoire utilisable ; absence de date ou de KPI artificiel ; aucune écriture lors de la prévisualisation d'une opération confirmable (import/lot/correction historique/replanification). Contrôler la protection des saisies non enregistrées à la navigation et au changement de réglages.

**Aucune migration PostgreSQL nouvelle.** Aucun test local ni parcours navigateur n'a été exécuté depuis cette session. GitHub Actions reste indisponible ; statuts Jira En cours / BMAD review jusqu'à recette.
