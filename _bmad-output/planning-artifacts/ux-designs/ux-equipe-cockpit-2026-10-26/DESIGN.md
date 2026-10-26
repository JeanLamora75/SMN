---
name: "SMN — Équipe — Harmonisation Cockpit Agile"
status: approved-design
updated: 2026-10-26
sources:
  - "BRIEF-BMAD-UX-EQUIPE-OPTION-A.md"
  - "../ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md"
colors:
  hero: "derived:--smn-brand"
  panel: "var(--smn-surface)"
  text: "var(--smn-foreground)"
  muted: "var(--smn-muted)"
  border: "var(--smn-border)"
  activeRole: "var(--smn-brand)"
typography:
  base: "system-ui / Segoe UI"
  heroTitle: "clamp(1.5rem, 2.15vw, 2.15rem)"
rounded:
  hero: "16px"
  panel: "15px"
  memberCard: "12px"
spacing:
  pageGutter: "16px to 24px"
  panelGap: "12px to 16px"
  cardGap: "12px"
components:
  hero: "title + vision + product goal + actions"
  filters: "search and real roster filters"
  memberCard: "flag + name + neutral avatar + SM/PO/Dev + professional function"
  roster: "cards or list, exclusive"
---

# DESIGN.md — Équipe Cockpit Agile / Option A

## Brand & Style
Adopter le langage visuel **Cockpit Agile de l'index Registres**, visible dans la capture de référence du commanditaire : fond de page clair, bloc bleu marine dominant et arrondi, panneaux blancs avec fins contours, texte bleu foncé, boutons et pastilles sobres. Réutiliser d'abord les tokens CSS existants et toutes les palettes/thèmes SMN. L'image validée le 26/10/2026 fixe la composition, non des valeurs de couleur absolues.

## Colors
Le hero peut réutiliser la recette de dégradé de `registry-cockpit.css`, sans dépendre de son sélecteur CSS ni modifier Registres. Son texte reste blanc/fort contraste. Panneaux, formulaires, cartes, placeholders et badges utilisent `--smn-surface`, `--smn-foreground`, `--smn-muted`, `--smn-border`, `--smn-brand` et équivalents thème sombre. Actif = badge bleu ; inactif = gris ; aucune couleur unique ne porte une information de rôle ou d'état sans libellé.

## Typography
Titre « Équipe » au niveau h1 dominant ; titres « Vision Produit » et « But du produit » en poids marqué ; leurs valeurs en texte normal multiligne. Titres panneaux « Filtres et recherche » et « Membres de l'équipe » plus discrets. Noms sur les cartes en gras lisibles, fonction textuelle plus douce mais contrastée. FR/EN et zoom 200 % sans coupure permanente d'information.

## Layout & Spacing
### Zone 1 — Hero bleu (pleine largeur utile)
La maquette **validée** établit cet ordre gauche → droite sur desktop :
1. **Titre « Équipe »** ;
2. **Vision Produit**, avec pictogramme cible, titre et contenu réel ;
3. **But du produit**, avec pictogramme pile/couches, titre et contenu réel ;
4. **Actions** « Liste » / « Cartes » / « + Ajouter un membre » (selon droits).

Les sections Vision et But sont **côte à côte dans le bandeau bleu**, jamais dans un bloc blanc sous le bandeau. Elles **remplacent** intégralement la phrase « Consultez les membres, leurs rôles… ». Une séparation verticale très fine entre zones est acceptable. Le texte long revient à la ligne et reste consultable intégralement ; jamais de texte fictif, placeholder mensonger ou coupe sans possibilité de lecture.

À largeur réduite, autoriser la ligne 1 : titre + actions ; puis une deuxième ligne Vision/But ou leur empilement. Aucun chevauchement. Conserver la commande d'édition du contexte existante dans une position accessible.

### Zone 2 — Filtres et recherche (panneau blanc)
En-tête avec icône filtres à gauche ; contexte sous forme de petites pastilles à droite : « Équipe : [nom] », « Vue : Cartes/Liste », « [n] membres [actifs/affichés] ». Le texte du compteur dit exactement ce qu'il compte. Contrôles : recherche, Rôle Agile, Fonction, Statut, « Filtrer » / « Effacer les filtres » ; leur présence visuelle est conditionnée à leur capacité à opérer sur les données disponibles. Les valeurs des filtres ne sont pas du contenu inventé. La recherche vise nom et fonction uniquement si ces champs sont connus ; pas de recherche par compétence fictive.

### Zone 3 — Grille / Liste (grand panneau blanc)
**Cartes :** six colonnes égales quand la largeur disponible l'autorise, cinq fiches et tuile Ajouter dans l'exemple. Même silhouette générique asexuée pour tous, pays par drapeau connu, nom complet (ou contenu réellement enregistré), badges **SM | PO | Dev** sur une seule ligne, fonction ou « Non renseignée ». Carte Ajouter sur fond clair, bordure pointillée bleue et label centré. Pas de portrait personnel.

**12 emplacements initiaux** : conserver la règle de deux rangées de six pour petite équipe ; les cases vides de la seconde rangée deviennent **des réserves courtes, pâles et non interactives**, comme sur la maquette validée. Elles ne gonflent pas le compteur. Si plus de 11 actifs, étendre la grille et préserver la tuile Ajouter sans couper les personnes.

**Liste :** même panneau et filtres ; présenter toutes les personnes éligibles dans une table compacte, avec au minimum identité, rôles, fonction, statut réel et accès à la fiche. Pas de vue Liste et Cartes simultanées.

## Elevation & Depth
Ombres subtiles seulement ; structurer par contours et marges cohérentes (panneaux ~12–16 px d'écart). Les cartes personnes doivent paraître plus légères que le hero. Pas de cartes géantes, ni de vaste deuxième rangée grise.

## Shapes
Héros arrondi ~16px, panneaux ~15px, cartes ~12px, badges compacts légèrement arrondis. Boutons Cartes/Liste et création conformes au modèle Registres, avec état actif explicite et focus visible.

## Components
- `TeamHero` (composition possible, non prescription technique) : titre, vision, goal, actions, édition de contexte préservée.
- `TeamFilterPanel` : recherche et filtres fonctionnels de données autorisées, pastilles de contexte réelles.
- `TeamRoster` : mode Cartes/Liste exclusif avec état mémorisé.
- `MemberCard` : carte entière = navigation fiche ; badges informatifs ; drapeau et avatar neutre.
- `AddMember` : hero et tuile conduisant à la modale existante, jamais deux circuits de création.
- `EmptySlot` : faible hauteur, décoratif uniquement.

## Do's and Don'ts
| À faire | À éviter |
| --- | --- |
| Reprendre hero, panneaux, contrôles de Registres sans dupliquer leurs composants aveuglément | Modifier le CSS du registre ou les composants métiers Registres |
| Placer Vision et But dans le hero côte à côte | Restaurer leur panneau blanc séparé ou l'ancien sous-titre |
| Utiliser les données réelles et états de chargement honnêtes | Reprendre « Team Koala »/« My Product » ou les textes exemples comme valeurs par défaut |
| Préserver 6 colonnes desktop et 12 positions initiales discrètes | Rendre les placeholders aussi imposants que les cartes |
| Maintenir toutes les fonctions existantes | Supprimer l'édition du contexte, l'archive, le mode Liste ou la création |
| Limiter les overrides CSS à la page Équipe | Modifier globalement `.smn-page` pour tout le projet |

**Précédence :** ce DESIGN remplace les seuls détails graphiques contradictoires de l'ancien DESIGN Équipe 22/10, pas la logique métier ni la fiche membre V2.