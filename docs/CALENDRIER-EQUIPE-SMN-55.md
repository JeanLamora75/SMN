# SMN-55 — Utiliser le calendrier d'équipe selon les droits

[Ticket SMN-55](https://lmn24.atlassian.net/browse/SMN-55) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-55-calendrier-equipe.md) · [Jours régionaux SMN-54](JOURS-REGIONAUX-SMN-54.md)

## Accéder au calendrier

Depuis le **Tableau de bord**, cliquer sur **Consulter le calendrier d'équipe**. Un lien équivalent est disponible dans **Administration → Membres**.

La seule équipe Scrum/Kanban du MVP est sélectionnée automatiquement. Modifier la date de départ ou la durée (**7, 14 ou 28 jours**) ou utiliser les boutons de navigation pour afficher une autre période. L'équipe est issue de l'installation : le calendrier ne crée jamais une deuxième équipe.

### Vue Utilisateur

L'Utilisateur voit, pour chaque date, uniquement les **effectifs collectifs** : membres affectés, membres avec une indisponibilité déclarée, membres avec au moins un créneau disponible confirmé et disponibilités inconnues. Aucun nom de membre, motif d'absence, catégorie individuelle ni bouton d'édition n'apparaît, et l'API ne transmet pas ces champs aux Utilisateurs. Les filtres individuels et par type/catégorie ne sont pas autorisés pour ce rôle.

Une personne absente au titre d'un jour régional et simultanément d'un jour férié national est **comptée une fois** dans la synthèse. Une référence nationale incomplète ou un calendrier de travail inexistant donne une disponibilité *inconnue*, jamais faussement zéro.

### Vue Administrateur

L'Administrateur voit aussi la **grille par membre et par jour affecté** : jour férié national identifié, absence(s) avec catégorie et motif écrits, pastille couleur complémentaire, caractère prévu/imprévu. Une journée sans affectation applicable apparaît comme « Non affecté ».

Utiliser les filtres de **membre**, **type prévu/imprévu** ou **catégorie**. Ils limitent l'affichage des événements mais **ne modifient ni le stockage ni la disponibilité réelle**, calculée toujours sur toutes les absences. Aucune mise à jour métier n'est émise au changement de filtre.

Pour créer ou modifier une absence, cliquer sur **Créer ou corriger** dans la cellule du membre et du jour. L'éditeur d'absence de SMN-53 s'ouvre : renseigner dates, demi-journées, catégorie, motif et prévue/imprévue, ou sélectionner **Corriger** pour une absence existante. Enregistrer. Le calendrier recharge sa grille ; la **fiche individuelle du membre** affiche exactement le même enregistrement et les mêmes modifications après rechargement. Aucun doublon n'est créé par l'équipe.

Les jours régionaux SMN-54 sont saisis et affichés comme des absences individuelles, sans catalogue régional. Leurs noms et catégories restent visibles dans la grille Administrateur (pas dans celle de l'Utilisateur).

## Droits et sécurité

- GET `/api/team-calendar?start=2026-05-01&days=7` : Administrateur et Utilisateur connectés, avec **projection collective uniquement pour l'Utilisateur**.
- GET avec `memberId`, `categoryId` ou `kind=planned|unplanned` : réservé à l'Administrateur, sinon HTTP 400.
- Création et correction : seul le POST existant `/api/admin/members/{id}/absences` est autorisé à l'Administrateur ; aucun POST sur l'API collective.
- Les nombres sont indicatifs, pas une capacité consolidée en jours-homme. La confidentialité des motifs est imposée avant sérialisation JSON.

## Recette locale sur Windows (à réaliser)

Après synchronisation de `main`, sauvegarder la base puis utiliser une base pilote PostgreSQL 18.6. Exécuter si disponibles :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier :
1. Accès de l'Administrateur à la synthèse et à la grille nominative, avec libellé de catégorie et couleur.
2. Sur le calendrier collectif, créer une absence avec motif puis recharger la fiche individuelle : même identifiant et valeurs ; corriger ensuite depuis le collectif et vérifier qu'il n'existe toujours qu'une absence, historisée.
3. Tester un jour régional SMN-54 coïncidant avec un jour national : la personne est comptée une fois et deux demi-journées de travail au maximum sont déduites.
4. Avec un compte `user`, vérifier uniquement les agrégats et l'absence des noms/motifs dans la réponse JSON (inspecteur réseau). Tester l'absence de droit POST, les filtres individuels interdits et le refus d'accès direct aux endpoints privés.
5. Tester les périodes 7/14/28 jours, un changement de mois ou d'année, un membre sans affectation sur la date, une catégorie inactive encore visible sur les historiques, et l'absence d'écritures lors de la consultation/du filtrage.

**État :** tests de contrat présents mais non exécutés ; tests HTTP/PostgreSQL et recette navigateur à réaliser. GitHub Actions est hors circuit ; conserver Jira « En cours » et BMAD `review` jusqu'à qualification.
