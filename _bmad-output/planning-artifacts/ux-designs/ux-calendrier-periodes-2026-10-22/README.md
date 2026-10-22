# Référence UX — Calendrier SMN par période (22/10/2026)

**Statut : parcours et règles de présentation approuvés en conversation ; développement non réalisé dans ce dossier.**

- [Contrat UX de calendrier](CALENDRIER-CONTRAT-UX.md) — décisions fonctionnelles, maquette textuelle, comportement et inventaire de l'existant.
- [Grille de recette](CALENDRIER-RECETTE-UX.md) — 38 critères contrôlables, non exécutés.

## Décisions essentielles

- Sans sprint/période : **mois civil courant entier**.
- Avec sprints/périodes : **période en cours prioritaire** ; sinon la plus récente, avec la règle des seuls futurs à préciser.
- Grille de **7 cartes par rangée** en commençant à la **première date de la période** ; en-têtes = jours réordonnés à partir de ce jour.
- **Samedi/dimanche** : cartes grisées **sans +**. **Jour férié en semaine** : carte **grisée AVEC + Réunion**, si l'ajout est autorisé ; réunions existantes toujours visibles.
- **Aujourd'hui** : bordure plus forte/colorée, y compris si férié (gris + bordure et + en semaine si autorisé).
- Jour + mois sur 3 caractères, **nom du jour férié immédiatement en dessous, collé à la date** lorsqu'il y en a un ; **première réunion toujours espacée visuellement sous le bloc date/férié**, même sur une journée normale. Réunions triées par heure croissante ; **survol du nom = heures de début et fin** ; **clic du nom = page dédiée**.
- **Deux actions côte à côte en bas des cartes éligibles : « + Réunion » et « + Absence »**, du lundi au vendredi, jours fériés compris, selon les permissions propres à chaque action. Chaque action ouvre sa **modale centrée** sur voile gris ; **+ Absence** préremplit début et fin sur la date de la carte et demande le choix du membre concerné. Le week-end reste sans actions + dans cette grille.

## Dépendance métier avant implémentation

Le calendrier national est actuellement déterminé par pays de localisation membre dans le modèle d'indisponibilité. **Un jour férié peut ne concerner qu'une partie de l'équipe** : c'est précisément pourquoi la création de réunion reste possible en semaine, malgré le fond grisé. Informer sans bloquer et ne pas prétendre que toute l'équipe est indisponible. Si les données fériées sont absentes, signaler leur couverture inconnue sans interdire + pour cette seule raison. Les week-ends restent sans +. La réutilisation de la page de réunion exige de vérifier/créer une route réelle.

**Aucun code ni Jira modifié par ces documents.**