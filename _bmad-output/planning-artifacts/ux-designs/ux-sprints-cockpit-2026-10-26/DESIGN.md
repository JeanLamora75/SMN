---
name: "SMN — Sprints Cockpit Agile — harmonisation graphique fidèle"
status: approved-design
updated: 2026-10-26
scope: "Index /app/admin/sprints ; aspect visuel exclusivement"
sources:
  - "../ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md"
  - "../ux-sprints-pilotage-2026-10-23/DESIGN.md"
colors:
  primary: "inherit:smn/brand-primary"
  hero: "inherit:registry-cockpit/hero-gradient"
  surface: "inherit:smn/surface"
  foreground: "inherit:smn/foreground"
  muted: "inherit:smn/muted"
  border: "inherit:smn/border"
typography:
  base: "inherit:system-ui / Segoe UI"
  pageTitle: "inherit:registry-cockpit/hero-title"
  body: "inherit:smn/body"
rounded:
  hero: "inherit:registry-cockpit/hero"
  panel: "inherit:registry-cockpit/panel"
spacing:
  page: "inherit:smn/page-gutter"
  panel: "12-18px"
components:
  hero: "title/subtitle, authorized historical/generate, state tabs"
  filters: "search, sort, context, reload"
  table: "Sprint / Période / État / Actions, one view only"
  row: "active subtle accent, text status, permitted existing controls"
---
# DESIGN.md — Index Sprints « Cockpit Agile »

**Validation :** harmonisation fidèle Option A approuvée le 26/10/2026. Supplément **esthétique** au [contrat Sprints existant](../ux-sprints-pilotage-2026-10-23/DESIGN.md), sans supplanter [EXPERIENCE Sprints](../ux-sprints-pilotage-2026-10-23/EXPERIENCE.md).

## Brand & Style
Une famille graphique unique avec l'index global **Registres**, ton sobre de cockpit métier. Pleine largeur, Bootstrap et variables SMN, pas de nouveau design system. L'index Sprints reste **Liste uniquement** ; ne pas copier Liste/Cartes, filtres de catégorie ou alertes des Registres.

## Colors
Hero contrasté avec dégradé inspiré de `.smn-registry-hero`, compatible thèmes. Titre, sous-titre et boutons lisibles. Panels = surface, bordures et texte du thème. Badges statut typographiques, accompagnés d'un libellé ; actif par accent doux, **pas par couleur seule**. Les statuts Suspendu, Clôturé, Terminé ne doivent pas disparaître ni fusionner.

## Typography
Reprendre hiérarchie du registre (titre fort, sous-titre discret, intertitre « Filtres et recherche », libellés compacts et dates lisibles). Nom du sprint bien visible ; aucun texte technique brut. Ne pas diminuer les cibles interactives pour reproduire exactement la densité d'une capture desktop.

## Layout & Spacing
1. **Hero** : haut = titre et sous-titre équipe · Scrum à gauche, « Reprise historique » et « Générer des sprints » à droite si admin ; sous-zone = pastilles d'état arrondies, une sélection active.
2. **Filtres** : panneau indépendant à 12–16px du hero, recherche par nom prioritaire, tri, contexte réel de l'équipe et décompte réel des sprints, Actualiser conservé. Les états disponibles non présentés en pastilles restent accessibles via sélecteur/« Autres états » selon données et largeur ; sélection synchronisée avec filtre existant.
3. **Liste** : panneau blanc arrondi, marge constante, en-tête gris clair, séparation légère, lignes compactes et lisibles. Garder les quatre colonnes ; accent visuel discret sur ligne active et libellé.
4. **Actions** : mêmes liens/boutons existants, mais alignement, taille, focus, bordures uniformisés. Aucune conversion de bouton provisoire en faux lien.
5. **Pagination** : pied de tableau cohérent avec registre ; note de transition outils historiques discrète mais accessible.
6. **Mobile** : hero en piles, génération visible selon droits, état dans sélecteur compact, filtres repliables si leur valeur persiste, présentation adaptative des lignes (sans seconde vue métier). Zéro scroll horizontal involontaire de la page.

## Elevation & Depth
Hero avec ombre faible ; panneaux à bordure subtile et ombre quasi imperceptible. La page est structurée par blocs, pas par alternance massive de gris.

## Shapes
Arrondis hérités du registre : hero proche 16px, panneaux proches 15px et boutons proches 9px, par tokens SMN. Ne pas figer de couleurs qui cassent les thèmes.

## Components
- Pastilles : focus et état sélectionné visibles, même valeurs de filtre que le sélecteur existant ; exceptions (statuts inconnus) non cachées.
- Champ recherche et tri : composants natifs accessibles, pas de nouveaux critères.
- Ligne : **nom de sprint**, dates `startAt/endAt`, état texte, contrôle calendrier provisoire et menu existant. Contenu et destinations actuels conservés.
- États : erreur, chargement, liste vide, aucun résultat et plusieurs actifs conservent leurs messages existants.

## Do's and Don'ts
**Oui** : isolation CSS `.smn-sprints-cockpit`, thème, responsive, focus visibles, parité de données, contraste.  
**Non** : changer l'API, créer de nouveaux KPI, copier Liste/Cartes, inventer un calendrier fonctionnel, restructurer les actions, modifier l'index Registres ni la fiche Sprint.

**Contrat comportemental** : [EXPERIENCE.md](EXPERIENCE.md) ; **arbitrages non décidés** à reporter au backlog dédié.
