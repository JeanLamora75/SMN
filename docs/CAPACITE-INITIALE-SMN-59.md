# SMN-59 — Recette du figement de capacité initiale

[Jira SMN-59](https://lmn24.atlassian.net/browse/SMN-59) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-59-capacite-initiale.md) · [Capacité manuelle SMN-58](CAPACITE-MANUELLE-SMN-58.md)

La lecture d'une **date théorique** n'enregistre pas de capacité initiale. Pour créer le cliché, l'Administrateur doit déclencher un **événement explicite d'ouverture effective** depuis l'écran de capacité, avec confirmation.

Le [réalisé collectif SMN-60](CAPACITE-REELLE-SMN-60.md) est calculé séparément après l'ouverture ; il ne remplace jamais cet engagement initial.

Le cliché initial conserve alors la **capacité retenue au moment exact de l'ouverture** : saisie manuelle prioritaire, y compris 0 JH, ou référence calculée fiable. Il conserve la provenance (Saisie, Calcul, Non renseigné), la date réelle fournie par PostgreSQL et l'identifiant de l'événement. Le cliché est immuable : une nouvelle absence, même requalifiée Prévue, ne l'écrase pas ; la référence courante reste dynamique.

Un second appel, même après redémarrage, retourne le cliché original sans le régénérer. L'ouverture marque aussi la période SMN-58 comme figée, de sorte qu'une correction manuelle directe est refusée.

Pour une période **entièrement passée** sans trace initiale, le service ne reconstruit pas une prétendue capacité initialement connue : l'état est enregistré **Non renseigné**, même si la référence courante peut maintenant être calculée. Une estimation ultérieure nécessiterait un mécanisme identifié et distinct.

L'événement technique `POST /api/admin/capacity-openings` est destiné à être réutilisé par les futurs workflows de Scrum/Kanban. Leur raccordement devra se faire sur **l'ouverture réelle**, pas au simple affichage de la date de début.

## Recette Windows / PostgreSQL 18.6 (non exécutée)

Sauvegarder une base pilote, récupérer `main`, puis valider la migration **v22 → v23**.

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier : lecture seule sans cliché ; ouverture réelle avec saisie manuelle et sans saisie ; zéro explicite ; clic/rejeu technique deux fois ; changement de référence après absence ; période passée sans source initiale ; refus 423 de modifier l'override après ouverture ; refus des utilisateurs non Administrateurs ; unicité SQL et rejet d'UPDATE/DELETE par le trigger du cliché.

**Validation restant à faire :** tests exécutés, migration PostgreSQL et recette navigateur, raccordement des futurs événements d'ouverture Epics 4/7. GitHub Actions n'est pas utilisé. Jira En cours / BMAD review.
