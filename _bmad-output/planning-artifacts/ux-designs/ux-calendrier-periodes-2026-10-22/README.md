# Référence UX — Calendrier SMN par période (22/10/2026)

**Statut : parcours et règles de présentation approuvés en conversation ; développement non réalisé dans ce dossier.**

- [Contrat UX de calendrier](CALENDRIER-CONTRAT-UX.md) — décisions fonctionnelles, maquette textuelle, comportement et inventaire de l'existant.
- [Grille de recette](CALENDRIER-RECETTE-UX.md) — 24 critères contrôlables, tous non exécutés ou à arbitrer.

## Décisions essentielles

- Sans sprint/période : **mois civil courant entier**.
- Avec sprints/périodes : **période en cours prioritaire** ; sinon la plus récente, avec la règle des seuls futurs à préciser.
- Grille de **7 cartes par rangée** en commençant à la **première date de la période** ; en-têtes = jours réordonnés à partir de ce jour.
- Cartes samedi/dimanche/**jours fériés applicables** : grisées et **sans +** ; réunions existantes toujours visibles.
- **Aujourd'hui** : bordure plus forte/colorée, y compris si férié (gris + bordure).
- Jour + mois 3 caractères ; réunions triées par heure croissante ; **survol du nom = heures de début et fin** ; **clic du nom = page dédiée**.
- Sur journée ouvrée autorisée : **ligne + Réunion** en bas de carte, création dans une **modale centrée** sur voile gris avec date préremplie.

## Dépendance métier avant implémentation

Le calendrier national est actuellement déterminé par pays de localisation membre dans le modèle d'indisponibilité. Il faut choisir explicitement **quel calendrier férié fait autorité pour une équipe internationale** afin de définir les cartes grisées et d'interdire +. En cas de données fériées manquantes, prévoir une règle transparente. La réutilisation de la page de réunion exige de vérifier/créer une route réelle.

**Aucun code ni Jira modifié par ces documents.**