---
name: Scrum Master Notebook — Équipe et membres
status: final
updated: 2026-10-22
description: Contrat visuel validé des vues Cartes, Liste et Fiche membre. Dimensions proposées indicatives, structure et comportements approuvés.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md
colors:
  primary: 'inherit:appearance/brand-primary'
  foreground: 'inherit:appearance/text-primary'
  secondary-text: 'inherit:appearance/text-secondary'
  page: 'inherit:appearance/surface-page'
  card: 'inherit:appearance/surface-card'
  border: 'inherit:appearance/border-subtle'
  role-selected: 'inherit:appearance/brand-primary'
  role-selected-text: 'inherit:appearance/primary-inverse'
  role-unselected: 'inherit:appearance/neutral-muted'
  placeholder-border: 'inherit:appearance/border-subtle'
typography:
  base: 'inherit:system-ui / Segoe UI'
  member-name:
    fontSize: '14px'
    fontWeight: '700'
  member-function:
    fontSize: '13px'
    fontWeight: '400'
rounded:
  member-card: '12px'
  panel: '12px'
  avatar: '9999px'
  role-pill: '6px'
spacing:
  grid-gap: '12px'
  card-padding: '14px'
  avatar-size: '56px'
  content-gutter: '16px'
components:
  team-view-switcher: 'two icon-only mutually exclusive buttons: grid and list'
  member-card: 'rounded clickable card with name / generic silhouette / three role badges / function'
  add-member-card: 'dashed outlined add tile in first free slot'
  empty-slot: 'gray dashed border, no interaction'
  member-detail: 'identity banner, tabs, two-column editable info panels'
---

> **IMPORTANT — NOUVEAU CONTRAT FICHE MEMBRE V2 (22/10/2026) :** [Fiche membre V2 — contrat UX définitif](FICHE-MEMBRE-V2-UX-CONTRAT.md). La structure de fiche à **cinq onglets, les panneaux Profil / Localisation, les multiples crayons et les anciens visuels SVG décrits plus bas sont OBSOLÈTES** pour la fiche. Conserver les sections Page Équipe Cartes/Liste ; pour la fiche appliquer **en-tête horizontal 2 zones + crayon unique près du nom + 4 onglets Affectation / Calendrier / Absences / Historique**, avec chaque historique métier affiché dans son onglet et modales d'édition ciblées. Lire aussi [Recette fiche membre V2](FICHE-MEMBRE-V2-RECETTE.md).


# SMN — DESIGN.md / Équipe & Membre

> **Structure visuelle approuvée par l'utilisateur le 22/10/2026.** Les valeurs numériques de style ci-dessus sont des **repères d'implémentation**, pas des mesures garanties des captures. Réutiliser prioritairement les variables existantes de SMN-24 et le [DESIGN dashboard](../ux-SMN-2026-10-21/DESIGN.md). Aucune nouvelle bibliothèque graphique requise.

## Brand & Style

Aspect professionnel calme et contemporain, conforme aux maquettes approuvées : bandeau global blanc, sidebar claire repliable sous l'en-tête, item « Équipe » actif en bleu, fond de contenu très clair, surfaces blanches, bordures fines, ombres discrètes, coins arrondis et bleu pour l'état actif des commandes. Thèmes clair/sombre et palettes ocean/forest/violet existantes à préserver. Les couleurs jouent un rôle sémantique et ne doivent jamais constituer le seul signal d'état.

## Colors

- **Rôles Agile :** exactement trois cases visibles en permanence et dans cet ordre : **SM**, **PO**, **Dev**. Case bleue/texte blanc ou contraste équivalent = la personne exerce effectivement ce rôle (part > 0 dans la version d'affectation applicable). Case gris pâle/texte gris = rôle non exercé. Plusieurs cases peuvent être actives.
- **Actif / archivé / provisoire :** état explicite par texte, sans en déduire des informations absentes. Le vert « Actif » visible dans la maquette de fiche est indicatif et doit respecter les thèmes.
- **Emplacements vides :** contour gris discontinu, surface vide et non interactive ; éviter de dessiner un « faux membre ».
- **Carte Ajouter :** contour discontinu à dominante bleu discret, signe « + » centré et libellé « Ajouter un membre ». Ce n'est jamais une personne ni un siège occupé.

## Typography

Nom en tête de carte, typographie plus marquée ; rôle et fonction doivent être lisibles à 100 % et à 200 % de zoom. Les fonctions professionnelles sont du texte libre distinct des trois rôles Agile. Couper un nom long seulement avec accès au texte intégral (infobulle accessible ou retour à la ligne). Ne pas utiliser les abréviations du métier comme substitut au libellé complet dans l'accessibilité : SM = Scrum Master, PO = Product Owner, Dev = Développeur.

## Layout & Spacing

### A. Page « Équipe » — structure commune

En-tête de page « Équipe » et sous-titre éventuel. Compteur d'effectif actif. **En haut à droite**, deux contrôles iconographiques adjacents et mutuellement exclusifs : **grille/cartes** et **liste**. Une seule icône est visuellement sélectionnée. Le contenu sous cet en-tête montre UNE SEULE des vues : jamais les deux l'une au-dessus de l'autre. Recherche et filtre éventuels utilisent les mêmes données indépendamment de la vue ; la recherche n'est affichée comme active que si elle fonctionne réellement.

### B. Vue Cartes — composition desktop approuvée

**Six colonnes et deux rangées de base, soit 12 emplacements** sur largeur desktop suffisante. Chaque membre **actif** reçoit une carte occupant un emplacement, dans l'ordre déterministe de la liste. La **première case libre immédiatement après le dernier membre actif** est « + Ajouter un membre ». Les autres cases du groupe de 12 sont vides, en contour gris pointillé, sans bouton ni contenu métier.

Carte membre (hauteur cohérente entre cartes, coins arrondis, fond blanc) :

1. Ligne haute : **nom du membre** (ou identité provisoire réelle) ; actions secondaires éventuelles via « … » sans gêner le clic principal.
2. Partie centrale : **UN seul pictogramme neutre / asexué** de silhouette de personne dans un cercle clair. Même pictogramme pour tous les membres du MVP ; aucune photographie, image générée, avatar genré, visage, initiale discriminante ou champ image à saisir.
3. Ligne de badges : **SM | PO | Dev**, les trois toujours visibles avec fond sélectionné ou grisé.
4. Ligne inférieure : **fonction du membre**, valeur métier libre si enregistrée, sinon « Non renseignée » ; **ne pas déduire artificiellement la fonction des rôles Agile**.

**Attention aux effectifs supérieurs à 11 :** à partir de 12 membres actifs, la carte Ajouter ne tient plus dans les 12 emplacements. La stratégie de dépassement (lignes supplémentaires de 6, pagination ou défilement) est **à confirmer**, sans masquer de membres ni la commande Ajouter. Le nombre de 12 désigne la maquette desktop initiale, pas une limite métier de membres.

Le rendu est **responsive** : sur fenêtres étroites, réduire raisonnablement le nombre de colonnes afin de conserver lisibilité, clic et accessibilité. Maintenir l'ordre membres → Ajouter → cases vides applicables. Les « six par ligne » sont une contrainte desktop, non smartphone.

### C. Vue Liste — une alternative exclusive

Même bandeau, compteur, recherche, droits, périmètre, tri et membres que la vue Cartes. **Tableau compact** avec :
- pictogramme neutre miniature puis **Nom** ;
- **Rôles Agile** sous forme des trois mêmes badges SM/PO/Dev ;
- **Fonction** professionnelle ;
- **Statut** textuel explicite ;
- zone d'action sobre avec chevron de consultation.
Chaque ligne de membre est entièrement activable pour ouvrir la fiche (les contrôles imbriqués restent indépendants). La **dernière ligne** propose « + Ajouter un membre » et ouvre la même pop-up que la carte Ajouter. Pas de seconde grille visible. Largeurs et colonnes à adapter sur mobile sans supprimer accès aux champs essentiels.

### D. Fiche membre — maquette approuvée

Page distincte depuis une carte ou une ligne :
- fil de retour **« ← Retour à l'équipe »** puis grand titre **« Fiche membre »** ;
- en haut à droite, actions de contexte autorisées : **Archiver** et/ou retour, sous réserve des protections d'archivage ;
- **bandeau d'identité pleine largeur**, fond blanc arrondi : grande silhouette générique à gauche, **nom** en évidence, statut explicite « Actif »/« Archivé »/« Provisoire » lorsqu'applicable, **SM | PO | Dev** colorés/grisés, et fonction juste dessous ;
- barre de cinq onglets ou équivalent accessible, ordre approuvé : **Profil | Affectation | Calendrier | Localisation | Historique** ;
- onglet **Profil** par défaut : grille de panneaux à deux colonnes sur desktop (une sur mobile). Colonne gauche : **Informations générales** (Nom, Fonction, E-mail, Statut) ; **Affectation actuelle** (Équipe, Taux d'affectation, Contribution, Date d'effet). Colonne droite : **Rôles Agile** (3 badges SM/PO/Dev) ; **Calendrier individuel** (synthèse fiable des jours travaillés/chômés) ; **Localisation** (Pays, Ville/Région, Fuseau horaire).
- **Crayon à côté d'une information éditable** (aligné à droite de la ligne), ou à côté du titre de section lorsque le même formulaire transactionnel sert plusieurs valeurs indissociables. Un seul clic prépare une édition ciblée, avec « Enregistrer / Annuler ».
- La disposition générale de la capture est la référence ; **les noms, e-mails, dates, heures, statuts, équipes et taux du visuel sont fictifs** et ne créent aucune valeur par défaut.

Aucun composant ne doit faire passer des exemples de la capture (notamment **« 8 h 09:00–17:00 »**, **« Paris UTC+01:00 »** ou la possibilité de modifier « Statut » librement) pour une règle métier applicable. Les horaires précis ne sont affichés que si réellement connus ; sinon plages matin/après-midi, « Non renseigné » ou synthèse calculable. Le fuseau affiché est la **zone IANA enregistrée**, avec conversion tenant compte de la date, et non une constante UTC+01.

## Elevation & Depth

Surface blanche et bordure fine, ombres très légères ; focus clavier très visible. La carte sélectionnée ou survolée s'identifie sans déplacement massif ni changement de taille. La tuile Ajouter se distingue par son contour discontinu bleu ; les réserves de grille restent grises.

## Shapes

Cards et panneaux à rayon modéré, avatars et états arrondis ; badges légèrement arrondis, pas des boutons d'action par défaut (les badges de rôles dans la synthèse sont informatifs).

## Components

- **CardLink** : toute la surface de la carte membre ouvre le détail de cette personne, au clavier comme à la souris ; le menu « … » éventuel reste indépendant.
- **ViewToggle** : icônes grille/liste côte à côte, état sélectionné visible, intitulés accessibles et attribut pressed/radio appropriés.
- **PencilEdit** : icône crayon avec cible explicite, focus, validation et annulation ; ne permet pas d'écraser de version historique.
- **IdentityIcon** : avatar générique commun au MVP, conforme aux couleurs de thème ; catalogue d'images individuel **reporté v1**.

## Do's and Don'ts

| À faire | À éviter |
|---|---|
| Montrer **une seule** vue à la fois | Empiler cartes et liste sur un écran |
| Montrer 6 cartes par ligne sur desktop et 2 rangées de base | Limiter silencieusement l'effectif à 12 |
| Préserver les trois badges, y compris grisés | Masquer les rôles inactifs ou assimiler fonction et rôle |
| Personnaliser le statut d'édition selon le champ | Rendre l'archivage équivalent à un changement de case « Actif » |
| Afficher explicitement l'inconnu | Inventer des horaires, localisations ou capacités |
| Utiliser silhouette neutre identique pour tous en MVP | Imposer une image par membre |

## Références et réserves

Le rendu illustratif validé en conversation n'est pas présent en tant que PNG dans le dépôt. La description des surfaces dans [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md) et les interactions de [EXPERIENCE.md](EXPERIENCE.md) constituent les contrats transmissibles. L'interface réelle et sa conformité pixel-perfect ne sont pas vérifiées.

## Avenant de fidélité visuelle — 22/10/2026

**Le présent chapitre rend opposables les proportions et la hiérarchie précédemment illustratives pour la cible desktop.** Voir [avenant correctif](AVENANT-UX-CORRECTIF-2026-10-22.md) et [recette visuelle](RECETTE-VISUELLE-2026-10-22.md) ; illustrations [Cartes](references-visuelles/cible-equipe-cartes.svg), [Liste](references-visuelles/cible-equipe-liste.svg), [Fiche](references-visuelles/cible-fiche-membre.svg).

- La zone Équipe / Fiche ne peut **pas rester limitée à 870 px** sur desktop large. Contrat pleine largeur du contenu après sidebar et marges. Six cartes doivent rester **réellement lisibles**, pas seulement six colonnes CSS écrasées dans un conteneur trop étroit.
- Les badges actifs SM, PO et Dev **partagent la même couleur de sélection bleu primaire du thème**, tous les absents le gris neutre. L'ancien affichage jaune SM / bleu PO / vert Dev est visuellement **non conforme**.
- Les trois badges figurent **sur une seule ligne** par carte sur desktop ; la fonction doit être lisible, non fragmentée en une suite de mots verticaux ; la tuile + doit afficher **« Ajouter un membre »**.
- Dans la fiche : bandeau **nom + statut + trois rôles + fonction**, puis la **barre des cinq onglets**, puis **deux colonnes** de synthèse de Profil ; les crayons adjacents aux données simples sont impératifs. Empiler des panneaux sans onglets est **non conforme**.
- Les visuels SVG versionnés sont des **reconstitutions**, non les originaux ; les valeurs sont fictives et les pixels non contractualisés. La recette doit comparer aux maquettes originelles validées lorsque accessibles.

Les règles métier et la conformité des champs restent subordonnées à EXPERIENCE.md, SMN-42 à 47 et SMN-63.