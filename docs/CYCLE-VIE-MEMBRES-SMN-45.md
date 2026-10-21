# SMN-45 — Clôture et archivage d'un membre

[Story Jira](https://lmn24.atlassian.net/browse/SMN-45) · [Contrat BMAD](../_bmad-output/implementation-artifacts/spec-smn-45-cycle-vie-archivage-membres.md)

## Utilisation (Administrateur)

Dans **Administration → Membres de l'équipe → Clore / Archiver**, la fiche présente les participations déjà enregistrées et l'état **En activité / Sans affectation active / Archivé**.

Pour un départ, choisir la **dernière date de participation réelle** puis confirmer **Clore l'affectation**. L'action ne supprime ni l'identité ni les répartitions de rôles enregistrées. Elle ne crée pas automatiquement un membre de remplacement. Si l'effectif actif descend à deux personnes ou moins, un **avertissement non bloquant** apparaît.

Après avoir fermé toutes ses affectations, sélectionner **Archiver la fiche inactive**. La fiche reste consultable dans la liste, ses identifiants, e-mails, participations et données futures continuent d'exister. **Réactiver** retire le statut d'archive sans recréer la personne et **sans rouvrir** une ancienne affectation. Pour qu'elle participe à nouveau, ouvrir **Gérer l'affectation** et enregistrer une nouvelle participation après la précédente date de fin.

La **suppression définitive** est intentionnellement très restrictive : seule une fiche provisoire et véritablement vide, sans affectation ni historique, peut présenter cette action. Une confirmation textuelle `SUPPRIMER` est exigée en plus du dialogue de confirmation. Pour toute fiche possédant de l'historique, l'application refuse la suppression et propose clôture ou archivage. Aucune suppression par cascade n'est autorisée.

L'interface ne crée jamais une seconde équipe Scrum/Kanban au MVP. L'extension multiéquipes sera décidée dans SAFe v1.0.

## Tests manuels sur installation pilote Windows

Récupérer la branche `main` avec GitHub Desktop puis lancer :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier une équipe de trois membres : clôturer le premier → **2 membres actifs**, avertissement et historique conservé ; archiver puis réactiver la fiche → même identifiant, affectation précédente toujours close ; essayer de supprimer → refus pour historique ; réaffecter après la date de fin ; vérifier qu'un compte Utilisateur n'accède pas aux données personnelles, ni par la page ni par l'API.

**Base :** migration additive v12. Exécuter la recette sur PostgreSQL 18.6 pilote. Tant que la sauvegarde/restauration de l'Epic 2 n'a pas été qualifiée, éviter l'application de migrations sur des données importantes.

**Qualification :** les scénarios décrits sont des instructions de test, pas la preuve qu'ils ont été exécutés.
