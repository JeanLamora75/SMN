---
name: "SMN — Calendrier d’équipe : expérience Option B"
status: approved-for-handoff
updated: 2026-10-24
description: "Avenant d'expérience : bascule Cartes/Agenda, absences uniques agrégées par membre et par date."
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md
  - https://github.com/JeanLamora75/SMN/blob/main/docs/CALENDRIER-CENTRAL-SMN-64.md
  - https://github.com/JeanLamora75/SMN/blob/main/src/server/members/team-calendar.ts
  - https://github.com/JeanLamora75/SMN/blob/main/src/server/members/central-calendar.ts
---

# EXPERIENCE — Calendrier d'équipe, option B

## Foundation

**Surface :** application web desktop et mobile, MVP Scrum/Kanban monoéquipe, rôles `admin` et `user`. **UI system :** Next.js/React/Bootstrap et thèmes SMN existants. La composition et les tokens sont décrits dans [`DESIGN.md`](DESIGN.md). Ce document complète, sans effacer, les décisions du [contrat calendrier 22/10](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md).

## Information Architecture

- Menu principal « Calendrier d'équipe » inchangé, accessible selon droits.
- Bandeau : équipe réelle, Sprint/période choisi, bornes de dates inclusives, statut réel, navigation précédent/aujourd'hui/suivant.
- Barre d'outils : filtres **Cérémonies et réunions** / **Absences**, bascule **Cartes / Agenda**.
- Vue **Cartes** au premier accès ; possibilité de **vue Agenda** sans changer de route ni de contexte métier. Conserver le choix de vue pendant la navigation ; stockage persistant uniquement si conforme à la politique de préférences existante, sans nouveau schéma gratuit.
- Au clic d'un nom de réunion : ouvrir sa fiche réelle. Pour les absences agrégées, aucune divulgation de détails personnels dans la grille ou l'Agenda ; éventuelle navigation vers un écran existant uniquement selon droits, après contrôle des accès.
- Les jours fériés, fermetures et autres éléments collectifs existants restent accessibles/représentés selon leur nature ; **ne pas les fusionner dans le compteur d'absences**.

## Voice and Tone

- Libellé de référence **`Absences (N)`** dans les deux vues ; en anglais, traduction adaptée via `src/i18n/en.json` (ex. `Absences (N)`). Le nombre appartient au même libellé, pas à une seconde ligne ni à un tooltip obligatoire.
- Intitulé « Calendrier d'équipe », dates localisées en français/anglais, pas de `YYYY-MM` nu comme seul sous-titre.
- Un compteur de données manquantes n'est **pas** affiché comme `0`. Les résultats non disponibles affichent un état d'erreur ou d'incertitude explicitement distinct.

## Component Patterns

### CL-B01 — Deux vues, une seule source de données

- Sélecteur accessible `Cartes`/`Agenda`, une seule vue visible à la fois.
- Les **mêmes** événements et agrégats, **la même équipe, la même période** et **les mêmes filtres actifs** alimentent les deux vues. Basculer d'une vue à l'autre ne recharge pas ni ne modifie le Sprint sélectionné, ne crée rien et n'efface aucune saisie.
- `Cartes` par défaut. `Agenda` est une **présentation chronologique complémentaire**, pas une nouvelle route ni un second agenda concurrent.

### CL-B02 — Priorité absolue aux absences, sur une ligne

Pour toute date `D` de la période, si au moins une **absence personnelle enregistrée** intersecte `D` pour un membre effectivement rattaché à l'équipe sur `D` :

1. Afficher **une seule ligne** `Absences (N)`, indépendamment du nombre d'enregistrements d'absence et de leurs catégories.
2. Placer cette ligne **en première position dans les événements de D**, avant toute réunion/cérémonie (même si cette dernière commence à 08:00) et avant tout autre contenu événementiel.
3. Garder **nom, motif, catégorie, demi-journée, heure et identité des personnes absentes hors de cette ligne**, y compris en rôle administrateur. Pas de liste individuelle au survol de cette ligne par défaut.
4. `N` = cardinalité de l'ensemble des **identifiants de membres distincts** de l'équipe possédant au moins une absence enregistrée non supprimée dont la période inclut D, y compris une absence de demi-journée. Deux demi-journées pour un même membre = **1 membre**, pas 2. Deux périodes chevauchantes pour un même membre = **1 membre**. Absences de plusieurs personnes = autant de personnes distinctes.
5. Ne **pas** inclure les membres indisponibles uniquement pour jour férié national, fermeture d'entreprise ou calendrier individuel non travaillé, sauf s'il existe **en plus** une absence enregistrée correspondant à la règle ci-dessus.
6. Si `N=0`, **ne pas afficher de ligne « Absences (0) »**. Si le calcul est indisponible, ne pas transformer l'erreur en zéro ni masquer silencieusement un défaut de données.
7. Si une absence est corrigée ou supprimée logiquement, rafraîchir `N` sur la prochaine lecture appropriée sans falsifier les bilans historiques et sans double comptage.
8. Cette règle vaut pour **Cartes et Agenda**, avec le même N et le même ordre. Le filtre `Absences` peut masquer la ligne dans les deux vues, mais ne transforme pas N et n'altère pas les enregistrements.

**Exemple :** mercredi 21/10, A absent matin et après-midi par deux enregistrements, B absent toute la journée ; le rendu est **`Absences (2)`**, puis Daily et Affinage. Pas trois lignes, pas `Absences (3)`.

**Point d'architecture constaté le 24/10 :** `src/server/members/team-calendar.ts` calcule `reportedUnavailable`, qui inclut aussi les **jours fériés** et les **fermetures d'entreprise**. Il est **interdit** de réutiliser ce champ comme `N`. `projectCentralCalendar()` fournit des `memberId` pour l'administrateur mais une entrée d'agrégat `reportedUnavailable` pour l'utilisateur. **Amelia doit ajouter ou exposer une projection serveur distincte et assainie** (ex. `declaredAbsentMemberCount` par date) reposant uniquement sur les absences réelles de membres distincts, pour les deux rôles. L'API `user` **ne doit jamais sérialiser** des IDs de membres, motifs, catégories individuelles ou données personnelles. Conserver les contrôles d'accès existants et vérifier les réponses JSON côté réseau.

### CL-B03 — Ordonnancement des autres événements

Après la ligne des absences, afficher les cérémonies et réunions **par heure de début croissante**, avec lien vers la fiche et heures début/fin accessibles au clavier, au survol et sur tactile selon le contrat précédent. Les jours fériés se placent dans l'en-tête accolé à la date ; les fermetures d'entreprise conservent un type distinct et visible. Ne pas forcer un événement fictif pour remplir une journée.

### CL-B04 — Portée et navigation

- **Avec Sprint/période :** afficher **tous les jours entre début et fin inclus** ; 7 cartes/rangée desktop en partant du **premier jour de la période** ; dernière rangée éventuellement incomplète. Ne pas tronquer à 14 jours parce que le prototype simule deux semaines.
- **Sans période définie :** afficher **tout le mois civil courant** (28 à 31 jours).
- Date du jour selon fuseau IANA de l'équipe, y compris franchissements d'heure d'été/hiver. Les dates métier d'absence restent des dates calendaires, sans conversion UTC→navigateur causant un décalage.
- Navigation précédent/suivant : parcourir des périodes pertinentes (Sprint/période si contexte disponible ; mois sinon), **pas seulement `start ± 14 jours` du prototype**. « Aujourd'hui » revient au cycle courant s'il existe, sinon au mois courant. Pas de sélection de cycles non autorisés.
- Les filtres masquent/affichent, sans mutation métier. Les jours fériés et fermetures ne sont pas supprimés du système ni transformés en absences par filtrage.

### CL-B05 — Actions et permissions inchangées

- Lundi–vendredi, **jour férié compris** si l'action est permise et la période modifiable : actions **`+ Réunion` et `+ Absence` côte à côte en pied**, chacune ouvrant sa modale centrée distincte.
- Samedi et dimanche : **aucune action `+` dans cette grille**, y compris si un événement existe. Les événements enregistrés restent visibles.
- `+ Absence` : membre à sélectionner, dates de début **et** de fin préremplies par D, champs métier existants, droits serveur, préservation du brouillon, erreurs claires, rafraîchissement du compteur après succès. `+ Réunion` : champs métier adaptés aux réunions, création uniquement si véritable endpoint autorisé.
- Rôle `user` : lecture seule. Les boutons interdits n'apparaissent pas, les endpoints de modification restent protégés.

## State Patterns

| Situation | Comportement |
|---|---|
| 0 absence déclarée | Pas de ligne d'absence |
| 1 personne absente | Première ligne unique `Absences (1)` |
| 2 membres absents, 3 enregistrements | Première ligne unique `Absences (2)` |
| Absence uniquement le matin | Membre compté une fois pour cette date |
| Férié sans absence déclarée | Jour férié affiché, pas de `Absences (N)` |
| Fermeture d'entreprise sans absence déclarée | Fermeture affichée séparément, pas de `Absences (N)` |
| Même personne absente + férié | `Absences (1)` + férié distinct en en-tête ; aucune double comptabilisation |
| Cérémonie tôt le matin et une absence | `Absences (N)` avant la cérémonie malgré l'heure |
| Filtre Absences désactivé | Ligne agrégée masquée dans les deux vues, autres événements inchangés |
| Passage Cartes → Agenda | Même période, mêmes N, mêmes événements ; aucun effet serveur de mutation |
| Samedi/dimanche | Fond grisé, événements visibles, pas de + |
| Jour férié de semaine | Fond grisé, nom férié, + métier selon droits |
| Erreur de chargement | Alerte et réessai ; pas de faux zéro |
| Date historique | Données historiques autorisées, sans inventer de changement d'état |

## Interaction Primitives

Bascule accessible clavier et lecteur d'écran (`aria-pressed` ou tabs correctement gérés) ; focus visible selon `DESIGN.md`; liens de réunion activables au clavier ; dialogs avec focus initial, `Escape`/fermeture maîtrisée et retour de focus. Le bandeau `Absences (N)` est lisible comme un seul item par les lecteurs d'écran : par exemple libellé accessible « 2 membres absents le 21 octobre ». Aucune interaction nominative implicite.

## Accessibility Floor

Cible WCAG 2.2 AA à tester, thèmes SMN existants, FR/EN depuis JSON, zoom 200 %, largeur 320 px. À largeur réduite, utiliser **Agenda** comme alternative verticale lisible ; ne pas omettre les actions indispensables. Indicateurs indépendants de la couleur ; Bootstrap Icons décoratives masquées du lecteur d'écran si texte présent ; cibles tactiles et focus visibles. Ne pas exposer des informations individuelles dans DOM/attributs/tooltips/JSON du rôle `user`.

## Key Flows

### Camille, Scrum Master : identifier les absences avant les cérémonies

1. Camille ouvre le calendrier sur le Sprint en cours en vue **Cartes**.
2. Le mercredi, elle voit immédiatement **`Absences (2)`** tout en haut de la liste événementielle, puis la Daily et l'Affinage.
3. Elle bascule sur **Agenda** pour lire sa semaine chronologiquement.
4. **Moment clé :** l'Agenda reprend exactement `Absences (2)` avant les deux réunions de cette journée : aucune information contradictoire ni liste nominative envahissante.
5. Elle utilise `+ Absence` sur une date permise, sélectionne un membre, confirme l'ajout et voit le compteur recalculé sans perdre le contexte du Sprint.

### Alex, utilisateur en lecture seule : connaître l'effectif absent sans dévoilement

1. Alex consulte le calendrier de l'équipe.
2. Il voit `Absences (N)` en une ligne, mais **aucun nom, motif ou catégorie** n'est transféré par l'API publique de son rôle.
3. Il peut masquer les absences pour ne voir que les cérémonies.
4. **Moment clé :** le passage à la vue Agenda conserve les mêmes effectifs et le même périmètre, sans lui présenter un formulaire d'administration.

## Inspiration & Anti-patterns

Inspiration : calendrier professionnel compact, lecture en diagonale facilitée, tri métier explicite. Anti-patterns : grande grille vide, `+` ambigu sur week-end, listes nominatives d'absence dans la grille, état « absent » calculé à partir de toute indisponibilité, double agenda incohérent, 14 jours de démo pris pour une limite métier.

## Responsive & Platform

Desktop : 7 colonnes à partir du premier jour métier. Tablette : conserver l'accès à toute la période avec défilement contrôlé de la seule grille si nécessaire, et bascule Agenda visible ; ne pas miniaturiser en dessous des dimensions lisibles. Mobile : vue Agenda pleinement exploitable, contenu vertical, commandes clairement visibles, absence de perte fonctionnelle. Le prototype actuel utilise une grille horizontalement défilante ; toute alternative responsive doit respecter la recette d'accessibilité du projet.

## Limites d'implémentation

Ce document est un **contrat UX**, pas une preuve d'implémentation. Il n'autorise pas à introduire silencieusement des changements d'API incompatibles ni des données de membre au rôle `user`. Le code existant doit être étudié avant toute modification et les écarts soulevés avant arbitrage, sans altérer les décisions approuvées.