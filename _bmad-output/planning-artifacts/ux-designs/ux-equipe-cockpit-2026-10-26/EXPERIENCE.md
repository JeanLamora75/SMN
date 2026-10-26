---
name: "SMN — Équipe Cockpit Agile — Contrat d'expérience"
status: approved-design
updated: 2026-10-26
sources:
  - "DESIGN.md"
  - "../ux-equipe-membres-2026-10-22/EXPERIENCE.md"
  - "https://lmn24.atlassian.net/browse/SMN-282"
---

# EXPERIENCE.md — Équipe / Option A

## Foundation
Application SMN Next.js/React/Bootstrap, FR/EN, thèmes clair/sombre, fenêtres desktop à mobile. L'accord porte avant tout sur **l'harmonisation graphique**. Les flux métier, validations, édition de contexte, permissions et historiques existants restent inchangés. Conserver les sources de vérité propres à l'équipe courante ; plusieurs équipes Scrum/Kanban constituent la cible validée de SMN-282, sans supposer que tous les écrans sont déjà migrés.

## Information Architecture
- Écran existant `/app/admin/members` : **hero Équipe** contenant nom générique de rubrique, **Vision Produit** et **But du produit**, ainsi que commandes de présentation/création.
- Panneau Recherche/filtres séparé ; pastilles indiquant le contexte réel (équipe sélectionnée, vue, effectif).
- Zone principale exclusive **Cartes** ou **Liste** ; clic membre vers sa fiche existante.
- Fiche membre V2 : **non modifiée** par ce lot ; ses quatre onglets et ses contrats demeurent prioritaires.

## Voice and Tone
Employer labels existants traduits dans `fr.json` / `en.json`. « Vision Produit » et « But du produit » sont des **titres d'informations métier**, les contenus sont des valeurs utilisateurs jamais traduites automatiquement. Valeur absente : « Non renseignée » (équivalent traduit). En chargement ou erreur : message non trompeur, conserver hauteur raisonnable du bloc. Ne pas substituer un texte marketing d'exemple.

## Component Patterns
### Bandeau
Les sections Vision/But sont purement informatives avec accès à leur texte intégral. `TeamContextEditor` doit rester joignable (contrôle d'édition autorisé), même si son icône quitte la zone du titre. Les actions « Liste », « Cartes » gardent `aria-pressed` et la mémorisation existante `smn-team-roster-view`. Pas de préférence écrasée par la maquette illustrative.

### Filtres
La maquette ajoute une recherche et des champs Rôle Agile, Fonction, Statut. Leur **comportement minimal** : filtrer localement la liste **déjà accessible** par le compte et l'équipe en cours ; résultats identiques en Cartes/Liste ; champ texte insensible à la casse et accents si raisonnablement supporté ; rôle évalué sur la part enregistrée `>0`, fonction sur valeur réelle, statut sur valeur connue. « Effacer les filtres » revient à la sélection non filtrée par défaut (actifs). « Filtrer » applique les champs si mode à validation ; éviter un double déclenchement confus si filtrage immédiat. Les nombres et l'état vide sont recalculés.

Si une catégorie (ex. compétences/archives) n'existe pas dans la source autorisée, **ne pas simuler ses options** ; tracer l'écart en recette et conserver un contrôle honnête. Les filtres restent des choix d'affichage : ils ne modifient jamais le stockage ni les habilitations.

### Cartes et Liste
Carte = lien vers la fiche. Toujours drapeau si pays connu, sinon pas de drapeau inventé ; silhouette neutre ; SM, PO, Dev en positions stables ; fonction libre indépendante des parts Agile. « + Ajouter » depuis hero ou grille lance la même modale existante, avec contrôles serveur d'autorisation. Pour les comptes lecture seule, aucune action d'ajout trompeuse. La liste conserve la navigation existante, et une lecture possible des rôles, fonction et statut.

## State Patterns
Préserver chargement, erreur réseau, équipe non initialisée, liste vide, filtre sans résultat, membre provisoire, membre archivé selon données accessibles, long contenu de Vision/But, produit facultatif et données inconnues. Sur bascule d'équipe (si SMN-282 livré), invalider les résultats filtrés associés à l'ancienne équipe sans changer silencieusement de contexte ; aucune donnée interéquipes ne doit persister dans les cartes ou pastilles.

## Interaction Primitives
Tabulation logique Hero → filtres → membres, étiquette réelle pour chaque champ, focus visible, boutons clavier, lien membre distinct du bouton ajouter. Les emplacements gris ne sont pas tabulables. Les deux contrôles d'ajout doivent appeler **la même fonction autorisée**, sans création automatique lors du clic d'ouverture.

## Accessibility Floor
Contrastes WCAG 2.2 AA visés pour les trois palettes et les deux thèmes, zoom 200 %, cible de commande confortable et contenu non tronqué définitivement. Vision/But lisibles par lecteur d'écran ; si dépliage de texte long, l'état est annoncé. Bascules de vue accessibles avec `aria-pressed` et noms complets, filtres reliés à leurs labels, statuts et rôles exprimés par texte et pas la couleur seule.

## Key Flows
**Consultation quotidienne :** le Scrum Master ouvre Équipe, reconnaît le hero Registres, lit Vision et But, repère l'équipe courante et les membres actifs, filtre éventuellement par rôle, puis ouvre une fiche, sans modifier de donnée.

**Ajout autorisé :** il actionne « + Ajouter un membre » dans le hero ou dans la grille ; la modale existante s'ouvre ; validation et retour restent strictement ceux déjà livrés, puis les compteurs et listes reflètent les données rafraîchies.

**Lecture seule :** un utilisateur sans permission de gérer consulte uniquement les informations autorisées ; aucun bouton d'ajout actif, et aucune API d'écriture n'est ouverte par la refonte.

## Responsive & Platform
Desktop large : quatre zones du hero sur une ligne, Vision et But côte à côte, six cartes. Tablette : hero refluant, Vision/But côte à côte si possible, puis empilés. Mobile : pile verticale lisible, champs de filtre organisés sans scroll horizontal global, grille réduite. Mise en page adaptable aux fenêtres Windows 11 et au menu latéral déplié.

## Non-objectifs
Ne pas implémenter SMN-282 à travers ce lot, ni nouvelles API, nouveaux statuts, permissions, routes, intégrations, profils personnels, changements de fiche membre V2 ou édition supplémentaire. Ne pas appliquer le bandeau d'alertes collectives réservé aux Registres.