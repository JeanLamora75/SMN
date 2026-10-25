---
name: SMN — Refonte UX du registre global
status: final
updated: 2026-10-25
description: Contrat visuel validé pour les six registres ; 21 décisions UX-REG.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
  - https://lmn24.atlassian.net/browse/SMN-228
colors:
  primary: "inherit:appearance/brand-primary"
  surface: "inherit:appearance/surface-page"
  card: "inherit:appearance/surface-card"
  border: "inherit:appearance/border-subtle"
  foreground: "inherit:appearance/text-primary"
  muted: "inherit:appearance/text-secondary"
  attention: "inherit:existing-semantic-colors-only-when-backed-by-rule"
typography:
  base: "inherit:system-ui / Segoe UI"
  heading: "inherit:existing-smn-hierarchical-headings"
  content: "inherit:existing-smn-body"
rounded:
  panel: "inherit:smn-panel-radius"
  card: "inherit:smn-card-radius"
spacing:
  pageGutter: "inherit:smn-page-gutter"
  gridGap: "12px"
  panelPadding: "12-16px"
components:
  registry-switcher: "two exclusive actions Liste / Cartes; Liste default"
  registry-attention: "compact collapsible band, count always visible"
  registry-list-row: "icon+type, title, 2-line description, status, permitted owner, due and actions"
  registry-card: "same dataset and metadata as list in compact vertical composition"
  registry-detail: "persistent header plus common and type-specific tabs"
  registry-summary: "two columns approx 2/3 and 1/3 on desktop"
  registry-modal: "centered full creation or focused section edit"
---
# DESIGN.md — Registres SMN

**Statut : conception UX validée en conversation le 25/10/2026 ; développement et recette NON exécutés.** [EXPERIENCE.md](EXPERIENCE.md) définit les comportements. En cas de conflit, les contrats explicitement validés priment sur les maquettes fictives. Ne pas remplacer le contrat distinct de l'onglet Registres de la fiche Sprint.

## Brand & Style
Interface métier sobre, dense mais lisible, Bootstrap 5 et Bootstrap Icons, héritant des thèmes et palettes existants du produit SMN. Pleine largeur dans le shell privé avec sidebar rétractable. Pas de décoration ni d'échantillons de données inventés.

## Colors
Employer les variables de thème existantes (`{colors.primary}`, `{colors.surface}`, `{colors.card}`, `{colors.border}`, `{colors.foreground}`, `{colors.muted}`). L'icône exprime le **type**, le texte + repère expriment le **statut**, un troisième indicateur n'exprime l'**attention** que si un producteur métier la justifie. Ni le statut « ouvert » ni l'absence de criticité ne déclenchent arbitrairement une couleur d'urgence. Contraste à vérifier en clair/sombre.

## Typography
Hiérarchie : titre Registres ; nombre de points d'attention ; sept filtres ; barre de recherche/filtrage ; titre de fiche ; sections/onglets. Titre de ligne gras et sans effet souligné décoratif ; description sur **deux lignes maximum en liste**, description **intégrale en fiche**. Aucune taille spécifique ne doit dégrader la lisibilité à 200 % de zoom.

## Layout & Spacing
1. Page globale `/app/admin/registries` : bandeau compact « Points d'attention collectifs » en premier, catégories **Tous / Risques / Obstacles / Dépendances / Décisions / Actions / Faits marquants**, filtres, vue Liste par défaut et Cartes alternative.
2. Bandeau repliable : nombre toujours visible ; hauteur minimale à l'état fermé. Si le producteur échoue, signaler « indisponible », jamais zéro.
3. Liste desktop : rangées compactes, grille de colonnes si largeur suffisante, avec icône Bootstrap, type, titre, description 2 lignes, statut+texte, responsable autorisé, échéance enregistrée, action ⋯. Aucun libellé technique brut.
4. Cartes : mêmes entrées, même périmètre/recherche/tri/pagination ; pas de rangées artificielles ni de hauteur excessive. Dernière vue choisie mémorisée propre au registre.
5. Fiche détaillée : bandeau identité type/titre/statut/propriétaire autorisé/échéance ; onglets **Synthèse / [métier si applicable] / Relations / Historique**.
6. Synthèse desktop : `2/3` description intégrale + journal ; `1/3` cycles, fiches liées, activité récente. Ne pas répéter le bandeau dans ces blocs.
7. Modales : **création complète** centrée largeur cible ~800px, édition **par section** dans une modale adaptée ; champs brefs sur une même rangée si possible ; actions fixes/accessibles en pied ; scroll interne si long formulaire. Les formulaires métier complets ne deviennent pas facultatifs du seul fait d'un changement visuel.
8. Responsive : liste refluant vers des lignes-fiches compactes sur mobile sans scroll horizontal forcé. Sept filtres en sélecteur compact sur smartphone ; Synthèse 1 colonne ; modales largeur utile mobile et focus maîtrisé. Recette 320/375/768/1024/1440px.

## Elevation & Depth
Séparateurs subtils, fond de surface existant, focus visible. Mettre en évidence une fiche juste créée de façon temporaire sans confondre la mise en avant avec un statut métier.

## Shapes
Arrondis, espacements et ombres cohérents avec les composants SMN existants, sans nouveau design system. Cibles tactiles conformes au socle mobile SMN-25.

## Components
- **Type et statut** : catégories des six registres ; réemployer Bootstrap Icons dont les mapping valides déjà utilisés par la fiche Sprint (`exclamation-octagon-fill`, `exclamation-triangle-fill`, `stack`, `bullseye`, `ticket-perforated-fill`, `bell-fill`) quand réutilisables, cohérence avec modules voisins obligatoire.
- **Point d'attention** : indicateur additionnel distinct du statut, conditionné à une règle vérifiée de SMN-104.
- **Journal de suivi** : entrée datée avec type/auteur, commentaire libre, création d'action/décision/fait ; « Modifié » et trace de retrait ; pas de faux statut ou fausse personne.
- **Relations** : sections par catégorie ; cycles séparés ; titres cliquables ; bouton Associer existant par recherche, dissociation avec confirmation.
- **Historique** : chronologie la plus récente d'abord, détails Avant/Après dépliables ; afficher uniquement les champs réellement modifiés.
- **Actions** : icônes crayons proches de la section modifiable, sans exposer de commandes d'écriture au rôle user.
- **État vide** : distinguer absence totale, filtres sans résultat, accès refusé et source indisponible.

## Do's and Don'ts
**À faire :** préserver shell SMN, FR/EN centralisés, vrai périmètre serveur, états/focus explicites, données réelles seulement, cycles clos et historiques Vn.  
**À éviter :** saisie d'UUID en interface ; statut inventé « Archivé » ; couleur de criticité fondée sur Ouvert ; copie de fiches ; suppression lors de dissociation ; remplacement d'un snapshot par des valeurs courantes ; modification de l'onglet Sprint par contagion.

Voir [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md) et [RECETTE-UX.md](RECETTE-UX.md).
