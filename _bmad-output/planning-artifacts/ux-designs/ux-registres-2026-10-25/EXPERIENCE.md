---
name: SMN — Refonte UX du registre global
status: final
updated: 2026-10-25
description: Contrat des parcours, règles et états UX-REG-01 à 21.
sources:
  - https://lmn24.atlassian.net/browse/SMN-228
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
---
# EXPERIENCE.md — Registres SMN

**Validé en conversation le 25/10/2026.** [DESIGN.md](DESIGN.md) définit la présentation (`{colors.primary}`, `{components.registry-summary}`, etc.). Les décisions non arbitrées sont explicitement marquées **À préciser** ; elles n'autorisent aucune nouvelle règle métier implicite.

## Foundation
- Application Next.js/Bootstrap, thèmes existants, deux rôles MVP : admin (saisie), user (lecture collective autorisée) ; monoéquipe Scrum/Kanban. SAFe hors MVP.
- Registre global `/app/admin/registries` distinct des consultations contextuelles du tableau de bord et de la fiche Sprint `/app/admin/sprints/[sprintId]` ; ne pas modifier les instantanés Vn d'un cycle clos.
- Équipe entière par défaut, cycle seulement optionnel et borné serveur. Chaque fiche possède une identité métier stable, y compris multi-cycles.
- Six registres : risk, obstacle, dependency, decision, action, highlight ; ne jamais les dupliquer à des fins d'UX.

## Information Architecture
1. **Index** : bandeau repliable Points d'attention (compte toujours affiché), sept catégories dont Tous par défaut, recherche, statut Tous/À suivre/États finaux, filtre cycle optionnel, tri, pagination, vues Liste/Cartes.
2. **Liste** par défaut ; **Cartes** sur demande ; préférence propre au registre mémorisée. Une seule présentation visible, contenu identique.
3. **Fiche** avec bandeau permanent + onglets communs Synthèse, Relations, Historique et, selon type, Évaluation & ROAM (risque), Résolution (obstacle), Parties & vigilance (dépendance), Décision & actions (décision), Exécution (action) ; aucun onglet métier supplémentaire obligatoire pour fait marquant.
4. **Synthèse** : description intégrale et journal sur 2/3 ; blocs contextuels cycles/relations/activité sur 1/3, puis une seule colonne sur mobile.
5. **Édition** : crayon par section, modale spécifique et compacte. **Création** : formulaire complet en modale, champs métier applicables compris.
6. **Relations** : groupes par catégorie ; cycles séparés ; recherche d'une fiche existante par titre/type, jamais UUID tapé manuellement.
7. **Historique** : chronologie de révisions, changements réellement audités, détails dépliables.

## Voice and Tone
Libellés explicites plutôt que codes `risk`, `actorId` ou UUID : « Points d'attention », « À suivre », « États finaux », « Créer une autre », « Voir la fiche », « Modifié », « Commentaire retiré », « Réessayer ». Toujours signaler la source réellement indisponible plutôt qu'un faux registre vide. Textes standard dans `src/i18n/fr.json` et `en.json`.

## Component Patterns
### Index / filtres
- Tous + équipe entière par défaut ; choix de catégorie/cycle/statut/tri/recherche, appliqués en amont de la pagination.
- Dans « Tous », éléments actifs d'abord puis états finaux ; tri choisi volontairement prime, sans transformer le statut métier.
- **À préciser** : l'unique statut `recorded` des faits marquants n'a pas de classement actif/final évident, ne pas en inventer.
- Titres cliquables ; une action ⋯ par rangée selon les droits, avec alternative clavier.
- Bandeau attentions : repliable, nombre visible même replié, raisons/liaisons vérifiables provenant de SMN-104.

### Fiche / onglets
- Bandeau identité toujours visible en haut, sans dupliquer dans Synthèse ; description complète, journal chronologique du plus récent au plus ancien.
- Journal métier **distinct** de l'onglet Historique : commentaires successifs datés/auteur, créations ou associations de fiches métier réellement enregistrées.
- Ajouter commentaire rapide sans modale. « Créer une fiche liée » choisit Action/Décision/Fait marquant et ouvre formulaire de création complet, association automatique **atomique** seulement après succès, l'objet reste autonome et visible dans son registre.
- Corriger commentaire : conserver versions, auteur et heures ; mention « Modifié ». Retrait **logique** avec trace visible, jamais effacement physique par l'UX ; accès aux versions selon permissions. Le champ legacy `comment` n'est pas un journal multi-entrées : une migration/compatibilité explicite est requise.
- Édition par crayon/section en modale, pas d'édition globale imposée ; données sauvegardées rafraîchies uniquement sur réponse serveur positive.
- Création complète : tous champs pertinents accessibles, sans rendre tous facultatifs ni tous obligatoires. Après succès retour au registre / contexte source avec fiche mise en évidence, choix « Voir la fiche » et « Créer une autre ».

### Relations / historique
- Liens entrants/sortants présentés avec libellés intelligibles quand fondés ; association par recherche titre/type avec choix d'identité.
- Toute dissociation modifiable demande confirmation et précise que les fiches ne sont pas supprimées ; cycles clos protégés.
- Historique chronologique de changements audités, auteur lisible seulement si connu/autorisé, Avant/Après seulement pour champs modifiés.
- **À préciser** : ouverture de l'historique au rôle user ; préserver les règles serveur actuelles avant arbitrage.

## State Patterns
- **Vide initial** : aucune fiche créée ; CTA seulement si création autorisée.
- **Aucun résultat** : filtres sans correspondance ; commande Réinitialiser.
- **Source indisponible / réseau** : message d'erreur et Réessayer ; pas de zéro inventé.
- **Brouillon modifié** : avertir avant fermeture ou navigation irréversible.
- **Erreur 409 / indisponibilité 503** : modale et brouillon restent ; ne pas prétendre à un succès.
- **Conflit de modification** : conserver révision et demander actualisation contrôlée, jamais écrasement silencieux.
- **Lecture seule** : aucune action d'écriture ni données personnelles interdites.
- **État final** : fiche toujours consultable, pas de suppression/archivage automatique ; respecter transitions métier particulières et cycles figés.
- **Suppression de fiche** : **hors périmètre** tant que la politique métier n'est pas validée.

## Interaction Primitives
Contrôles natifs accessibles, focus initial en modale, tabulation confinée, Escape avec protection de brouillon, focus rétabli sur déclencheur. Actions icônes avec nom accessible. Pas de dialogue trompeur ; erreurs annoncées par texte/ARIA. Menus ⋯ actionnables au clavier. Les chaînes de liens se parcourent par fil d'Ariane sans multiplier des panneaux complexes.

## Accessibility Floor
Résolutions de recette 320/375/768/1024/1440 px, zoom 200 % ; contrastes, modes clair/sombre, focus, clavier, lecteur d'écran à tester réellement. Liste mobile refluée plutôt que scroll horizontal forcé ; sélecteur de catégorie compact ; Synthèse 1 colonne. Cibles tactiles et contrôles conformément au socle SMN-25. Les icônes ne constituent jamais le seul canal d'information.

## Key Flows
**K1 — Recherche transverse.** Une Scrum Master ouvre Registres → Tous (équipe) → filtre Risques/À suivre → consulte la ligne enrichie → ouvre risque → revient et retrouve ses filtres, tri/page et idéalement position.

**K2 — Création depuis liste.** Elle ouvre « Nouvelle fiche » → saisit formulaire complet selon type → serveur confirme → modale se ferme → fiche créée mise en évidence + « Voir la fiche » / « Créer une autre ». Échec : brouillon conservé.

**K3 — Suivi du risque.** Elle ouvre Synthèse → ajoute commentaire rapide → consulte la chronologie → corrige un commentaire (version visible), ou retire logiquement avec trace.

**K4 — Décision/action liée.** Depuis journal, elle choisit Créer une action → formulaire complet → création+relation atomiques → l'action apparaît dans sa catégorie et dans Relations → la chaîne de navigation permet de revenir au risque.

**K5 — Dissociation.** Depuis Relations → demande retirer le lien → confirmation précise « fiches conservées » → seul lien supprimé ; un cycle clôturé reste non modifiable.

**K6 — Historique.** Depuis la fiche → onglet Historique → déroule une révision et voit seulement les différences enregistrées, sans reconstruction des données historiques.

## Responsive & Platform
Registre web desktop/mobile ; préférences Liste/Cartes indépendantes des autres pages ; pas de dépendance à un nouvel IDE/CLI. Tous événements affichés avec date métier et/ou instant local Europe/Paris selon modèle source ; une date seule n'acquiert pas une heure fictive.

## Arbitrages restant explicitement ouverts
1. Catégorisation `highlight.recorded` dans les filtres « À suivre »/« États finaux ».
2. Règles et seuils supplémentaires d'attention, exclusivement à partir de SMN-104 ou d'une décision métier distincte.
3. Droits de lecture détaillée de l'historique (rôle user vs admin).
4. Règles générales de suppression des fiches : non implémenter sans accord.
Ces réserves ne bloquent pas les écrans de lecture, mais les fonctionnalités qui en dépendent ne doivent pas être inventées.

## Non-régression normative
Le référentiel SMN impose déjà une représentation spécifique de l'onglet Registres de la fiche Sprint, dont la lecture de snapshots Vn figés, les faits automatiques et les modales contextuelles. **La présente refonte du registre global n'écrase pas ce contrat**. Lire `docs/UX-REFERENTIEL-BMAD.md`, notamment l'avenant SMN-234 D8.
