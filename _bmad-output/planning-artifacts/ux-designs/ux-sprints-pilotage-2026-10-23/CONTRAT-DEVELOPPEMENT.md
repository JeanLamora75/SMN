# Contrat de développement pour Amelia — Refonte de la page Sprints

**UX et séparation des responsabilités validées le 23/10/2026.** Lire d'abord [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), [MATRICE-FONCTIONS.md](MATRICE-FONCTIONS.md) et [RECETTE-UX.md](RECETTE-UX.md). La validation UX ne prouve ni code ni recette.

## Portée et règles non négociables

1. La page `/app/admin/sprints` devient la **liste de tous les sprints de l'équipe** (Scrum), pleine largeur, recherche, filtre, tri, état prioritaire « En cours », CTA unique « Générer des sprints », icônes Calendrier et ⋯ en fin de ligne. **Pas de 16 formulaires empilés.**
2. Déplacer les **éditeurs partagés** de plages horaires et de pause déjeuner vers **Paramètres > Jours ouvrés**, les modèles récurrents vers **Paramètres > Cérémonies et modèles**, et conserver **Cadence des sprints** dans Paramètres. Les **règles de capacité** ne deviennent modifiables que lorsqu'une vraie configuration existe ; ne pas confondre capacité réelle et règle générale.
3. Garder les opérations **sur sprint individuel** dans le menu contextualisé par ID : Renommer, Replanifier (aperçu d'impact), Supprimer avant tout démarrage (confirmation), Calendrier, Bilans/Clôture selon règles.
4. Les éléments propres à la **réunion/cérémonie** se gèrent via le **Calendrier ou sa page réunion** et ses APIs, pas dans la liste Sprints.
5. La **fiche Sprint** possède déjà une route de **première consultation**, mais sa refonte complète relève de **SMN-234**, avec bandeau, sept onglets et éditions contrôlées. N'activer que des actions/routes réellement présentes ; conserver la page Bilan actuelle jusqu'au remplacement vérifié.
6. Les mutations restent sécurisées serveur : droits, statuts, dates d'effet, archivage, historiques, conservation de la capacité initiale, transactions et absence de suppression implicite.
7. Le portail Paramètres [SMN-223](https://lmn24.atlassian.net/browse/SMN-223), le Calendrier validé et la Fiche membre V2 sont **contrats transverses**, pas des motifs de dupliquer APIs, modèles ou données.
8. Traductions **FR/EN centralisées**, thèmes et palettes, clavier/focus/ARIA, responsive ; aucun nouvel outil local/IDE ou GitHub Actions requis.

## Incréments indépendants recommandés

| Lot | Livraison et observables | Dépendances |
|---|---|---|
| S1 — Paramètres d'équipe | Formulaire horaires de travail + pause déjeuner accessible depuis Jours ouvrés, modèle réutilisable accessible depuis Cérémonies et modèles ; ancienne édition Sprints retirée seulement après raccordement | SMN-223, 225, 227 ; SMN-65 et 76 |
| S2 — Index | Page liste complète, états/dates, sprint en cours premier, recherche, filtre, tri, vide/erreur/chargement, pleine largeur ; aucun formulaire global | `GET /api/admin/sprints/states` ; autorisations ; calendriers IANA |
| S3 — Assistant génération | CTA unique et assistant unitaire/lot 1–6 avec aperçu, conflits, noms/date, génération cérémonies conforme, confirmation/retour liste | SMN-66, 67, 72, 77, 159, 160 |
| S4 — Actions contextuelles | ⋯ par sprint : renommer, replanifier, supprimer si jamais démarré avec contrôles et modales/aperçus | SMN-69, 70, 71, 82 |
| S5 — Navigation et fonctionnalités restituées | Lien Calendrier préfiltré au sprint, parcours réunions et bilan sans perte d'accès ; formulaires enlevés de l'index, mais présents aux bonnes destinations ; aucune régression | Contrat calendrier, SMN-64 et 87 ; écrans réunions/bilan |
| S6 — Fiche Sprint SMN-234 | Compléter la fiche de lecture existante : bandeau + sept onglets et éditions selon le [contrat dédié](FICHE-SPRINT-CONTRAT.md) ; lots D0–D9 séparés | SMN-234 ; Epic 3/4 pour capacités et cycles ; Epic 5 registres ; Epic 9 IA |

**L'ordre peut être adapté pour conserver une route accessible pendant le déplacement des éditeurs**. Notamment, retirer les composants legacy seulement lorsque l'utilisateur peut atteindre les fonctions ailleurs.

## Points de vérification technique

- Les paramètres `WorkSlotsForm`, `LunchForm`, `TemplateForm` ont des endpoints existants sous `/api/admin/sprints/` ; les réutiliser même si leur composant UI migre vers une route Paramètres. Modifier une règle globale **n'écrit jamais dans les cycles passés**.
- `SprintStateList` charge déjà une liste d'états, mais le rendu et les filtres devront évoluer ; vérifier exhaustivité, tri, pagination et interprétation des dates dans le fuseau de l'équipe.
- `RenameSprintForm`, `DeleteSprintForm`, `RescheduleForm` sont déjà séparés ; en faire des actions à ID prérempli depuis la ligne, **jamais un UUID à saisir**. Les refus côté serveur prévalent sur l'UI.
- La page `/app/admin/sprints/review` reste active, mais les opérations de bilan doivent recevoir le **contexte du sprint** si les API le permettent ; en cas d'absence d'un deeplink honnête, ne pas en fabriquer.
- Vérifier que le Calendrier permet de choisir un sprint par ID, et que ce sprint demeure celui sélectionné après chargement de la page ; un intervalle de dates uniquement ne suffit pas en cas de chevauchement ou homonymie.
- Les cas **Kanban** ne créent pas de Sprint ni de cérémonies Scrum ; la navigation reste conforme aux modes d'installation.

## Definition of Done / preuves

Pour chaque lot : code + tests éventuellement exécutés, résultat de typecheck/lint/build, captures réelles à largeur desktop et mobile, vérification des permissions, lien vers PR/commit et statuts de [RECETTE-UX.md](RECETTE-UX.md). GitHub Actions peut être indisponible, **ne jamais déclarer une exécution non faite**. Pas de clôture UX sans retour de recette visuelle.

**Le présent contrat ne lance aucun développement.**

## Avenant contractuel du 23 octobre 2026 — Fiche Sprint SMN-234

Le contrat détaillé [FICHE-SPRINT-CONTRAT.md](FICHE-SPRINT-CONTRAT.md) est **prioritaire pour le seul périmètre de la fiche Sprint** sur toutes les mentions antérieures « future fiche » ou « Synthèse / Cérémonies / Capacité / Indicateurs / Bilan et historique ». La route existe désormais sous la forme d'une **première fiche de lecture partielle**, non d'une fiche entièrement développée.

**Cible :** bandeau Sprint compact sans onglet Synthèse ; **Objectifs / Cérémonies / Capacité / Indicateurs / Registres / Tendances / Bilan**. Icône de modification pour champs éditables via action sécurisée ; aucun crayon sur valeurs calculées. Les règles Paramètres/Calendrier/index Sprints ci-dessus restent inchangées. Le plan d'implémentation par lots D0–D9 est dans `_bmad-output/implementation-artifacts/plan-developpement-fiche-sprint-smn-234-2026-10-23.md`.

**Aucune action logicielle n'est exécutée par ce cadrage.**

**Découpage spécial SMN-234** : conserver S1–S5 pour l'index Sprints. La phase S6 est décomposée en D0 inventaire/guards, D1 bandeau/tabs, D2 objectifs, D3 indicateurs, D4 cérémonies, D5 capacité par contributeur, D6 tendances, D7 bilan Analyse/Analyse IA, D8 registres après Epic 5, D9 recette transverse et conservation des anciens parcours. Chaque lot exige AC, tests et preuve, sans clôture anticipée.
