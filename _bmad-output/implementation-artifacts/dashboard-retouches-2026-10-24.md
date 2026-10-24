# Ajustements tableau de bord — 24 octobre 2026

Demande : supprimer le surtitre Sprint ; afficher « Sprint 1 - Team Tiegr » sans ligne produit ; afficher au maximum trois objectifs non cliquables ; retirer le second lien calendrier ; activer Ajouter risque/obstacle/note.

## Livré sur main
- `src/app/app/cycle-overview.tsx` : suppression du surtitre, titre de cycle avec équipe, disparition du produit/équipe sous l'en-tête ; trois objectifs en liste simple sans lien.
- `src/app/app/operational-overview.tsx` : suppression du lien de bas de carte « Consulter le calendrier », en conservant le lien « Voir tout » du panneau Événements. Pour un administrateur, création de risque/obstacle pointant vers le formulaire des registres et création de note vers l'éditeur de notes du rapport de Sprint ; les boutons restent visibles lorsque les données des panneaux sont indisponibles.
- `src/app/app/admin/registries/registry-create.tsx` : le type « obstacle » est présélectionné par le paramètre de navigation.
- `src/app/app/page.tsx` : les actions d'édition sont réservées aux administrateurs.
- `src/app/app/admin/sprints/[sprintId]/report/report-draft-notes.tsx` : ancre d'accès direct aux notes du rapport.

## Limite fonctionnelle
L'application possède actuellement un éditeur de notes *du rapport*, et non une création autonome de note sur le tableau de bord. Le lien « Ajouter une note » ouvre donc ce véritable éditeur existant. Il ne crée pas une entrée spécifique dans le flux Notes/Alertes du tableau de bord. Une User Story dédiée est nécessaire pour la vraie création d'une note d'équipe/Sprint et son raccordement à la projection des panneaux. Les formulaires de registres ne pré-sélectionnent pas encore automatiquement le lien de cycle dans la table de relations ; vérifier la liaison au Sprint après création.

## Vérification nécessaire
Les commits sont publiés sans exécution de tests locaux. Exécuter : `git pull`, `pnpm typecheck`, `pnpm exec tsx --test tests/dashboard-header-quick-actions-20261024.test.ts`, `pnpm build`. Recette écran : titre, 0/1/3/4 objectifs, panneau événements, clics sous compte admin et user.
