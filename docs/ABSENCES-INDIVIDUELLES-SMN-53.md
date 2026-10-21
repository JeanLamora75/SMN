# SMN-53 — Gestion des absences individuelles centralisées

[Jira SMN-53](https://lmn24.atlassian.net/browse/SMN-53) · [Spécification BMAD](../_bmad-output/implementation-artifacts/spec-smn-53-absences-individuelles.md)

## Depuis l'application

Dans **Administration → Membres**, ouvrir le **Calendrier individuel** d'une personne. La section **Absences individuelles** se trouve sous ses trames hebdomadaires et exceptions.

Renseigner une date de début et une date de fin, et sélectionner les créneaux inclusifs : **début matin, fin après-midi** pour un jour complet ; **début et fin matin** pour une demi-journée le matin ; **début et fin après-midi** pour l'après-midi. Plusieurs jours et les périodes passées sont acceptés. Choisir une catégorie active, saisir impérativement un **nom ou motif**, cocher **Absence prévue** le cas échéant, puis enregistrer.

La liste des absences de cette personne montre période, catégorie écrite et pastille de couleur, motif et statut prévu/imprévu. Le bouton **Corriger** charge la fiche centrale existante et incrémente sa révision sans créer une deuxième absence. Les absences demeurent liées **au membre** même lorsque plusieurs équipes ou affectations utilisent sa disponibilité.

## Catégories et dépendance SMN-52

Le socle ajoute, à l'installation/migration : **Congés, Formation, Maladie et Autre**, avec leurs couleurs. **SMN-52 n'a pas été développée ici** : le renommage, les changements de couleur et la désactivation par un Administrateur seront proposés dans la gestion des catégories correspondante. Le schéma relationnel permet ces changements futurs sans modifier l'identité des catégories référencées. La saisie « Maladie » ne demande aucun diagnostic : un libellé générique suffit, mais ne peut pas être vide.

## Persistance, audit et absence d'effets de bord

Les tables `smn_absence_category`, `smn_member_absence` et `smn_member_absence_history` sont ajoutées par la migration **v19**. Les modifications sont atomiques, verrouillées par membre, contrôlées par révision ; les créneaux qui se chevauchent sont refusés. Chaque correction conserve les valeurs **avant/après**, l'identité de l'acteur, la révision et l'horodatage. Les capacités initiales figées et les rapports PDF anciens ne sont pas recalculés. Aucune suppression de Daily ni notification collective automatique n'est déclenchée.

L'API permet GET et POST sur `/api/admin/members/{id}/absences`, l'écriture est réservée à l'Administrateur. Le GET accepte `onDate=YYYY-MM-DD` pour retrouver l'indisponibilité sur les créneaux du jour, exploitable dans les calculs ultérieurs. La capacité de développement consolidée n'est **pas encore calculée** ici.

## Recette sur base pilote

Après synchronisation de `main`, dans l'environnement Windows 11 et une **base PostgreSQL 18.6 pilote isolée et sauvegardée**, exécuter si disponible :

```powershell
pnpm i18n:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Vérifier la migration v18→v19, les quatre catégories, l'absence de catégorie vide ou motif vide (y compris pour une date passée), l'import de dates historiques, la demi-journée matin puis la demi-journée après-midi séparées, le refus d'un chevauchement, l'enregistrement d'une correction (révision et journal avant/après), la lecture sous les deux périodes/affectations d'un même membre, un utilisateur sans droit d'écriture (403), ainsi que la non-modification des rapports archivés/capacités figées et des Dailies.

**État :** tests de contrat fournis, compilation et recette non exécutées dans cette session ; GitHub Actions hors circuit. La Story reste **En cours** tant que la recette locale n'est pas documentée.
