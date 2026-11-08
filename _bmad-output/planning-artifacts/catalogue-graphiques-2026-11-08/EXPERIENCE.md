# EXPERIENCE — Catalogue graphique Office

**Statut : proposition UX à valider** · **2026-11-08** · **Sally (BMAD UX)**  
Référence visuelle : [DESIGN.md](./DESIGN.md). Les tokens `{colors.brand}`, `{colors.background}`, `{colors.text}`, `{rounded.panels}` en héritent.

## Foundation
Application web SMN, Bootstrap + Cockpit Agile, usage majoritaire desktop. Seul l'administrateur édite les styles ; un utilisateur habilité à générer des rapports consomme leurs paramètres.

## Information Architecture
```
Paramètres
  Rapports
    Graphiques
      Catalogue de styles
      Fiche de style
        Options communes
        Barres / Courbes / Aires / Secteurs / Anneau / Jauge
        Aperçu à la demande
      Styles par défaut (six types)
      Intégration Office (exemples et copie)
```
La page `Rapports → Tags` reste la source de documentation des modèles Word/PPTX.

## Voice and Tone
Libellés métier en français et anglais. « Style », « Aperçu », « Définir par défaut », « Dupliquer », « Modifications non enregistrées », « Recalculer l'aperçu ». Les propriétés techniques inhabituelles ont une aide courte et un exemple.

## Component Patterns
**M1 — Catalogue :** recherche et filtres, cartes/listes de styles, indication du style par défaut par type. Écran vide avec invitation à créer un style personnalisé. Les trois styles prédéfinis ne sont jamais supprimables.

**M2 — Éditeur :** choix du style puis du type ; options communes toujours disponibles, options spécifiques conditionnelles ; panneau d'aperçu visible, initialement « Aperçu à actualiser ». Bouton « Actualiser l'aperçu » déclenche exactement une requête.

**M3 — Utilisation dans Office :** exemple de tag et bouton Copier ; expliquer qu'un tag sans STYLE utilise le défaut du type et qu'une référence inconnue échoue explicitement. Pas de formulaire obligatoire pendant l'export.

## State Patterns
- Chargement : squelette de liste, pas de blocage des autres pages.
- Aucune sélection : inviter à choisir un style.
- Non modifié : bouton Enregistrer désactivé.
- Modifié : badge « Non enregistré » ; l'aperçu précédent devient « À actualiser ».
- Erreur d'aperçu : message contextualisé, valeurs saisies conservées.
- Sauvegarde en cours : actions désactivées et retour d'état ; échec laisse le brouillon.
- Conflit de révision : informer, demander relecture et choix explicite ; aucune perte silencieuse.
- Suppression impossible : indiquer la raison (prédéfini, utilisé comme défaut).
- Navigation avec modifications : confirmation conserver/abandonner.

## Interaction Primitives
Clavier complet, focus visible, boutons nommés, validations serveur reflétées dans le formulaire. Définition du style par défaut confirmée explicitement ; duplication indépendante du style source. Le sélecteur de style n'ouvre aucun traitement de rapport.

## Accessibility Floor
Contraste textuel ≥ WCAG AA ; libellés `label` associés aux contrôles ; messages `role=status/alert` ; sélection de couleurs jamais fondée sur la couleur seule ; menus clavier et navigation sans souris.

## Responsive & Platform
Desktop 2 colonnes ; tablette 1 colonne avec aperçu sous formulaire ; mobile contrôles empilés et actions visibles, aucun tableau horizontal indispensable.

## Key Flows
**F1 — Personnaliser un style.** L'administrateur ouvre Paramètres → Rapports → Graphiques, duplique Corporate, le renomme, modifie la palette et les lignes, actualise l'aperçu, enregistre, définit éventuellement ce style comme défaut du type Courbes.

**F2 — Générer normalement.** L'utilisateur ouvre Rapports → Modèles, sélectionne un modèle et un sprint, génère sans nouveau choix obligatoire. Le rendu utilise le style par défaut et conserve les données v33.

**F3 — Surcharge par modèle.** L'administrateur insère `{{CHART:TREND|TYPE=line|TAGS=VELOCITY|LAST=6|STYLE=corporate}}` ; SMN utilise Corporate. Une faute dans STYLE produit une erreur explicite, jamais un repli invisible.

## Maquettes de référence
- [MAQUETTES.html](./MAQUETTES.html) — prototype visuel autonome, non intégré à SMN ; vues catalogue, édition, pré-génération.
- Les libellés et valeurs de graphiques de la maquette sont **démonstratifs**.

## Critères de recette UX
- Le défaut par type est identifiable sans ouvrir chaque style.
- L'aperçu ne se met pas à jour tant que l'utilisateur ne clique pas « Actualiser l'aperçu ».
- Aucun paramètre non applicable n'est visible pour le type choisi.
- Sauvegarde, annulation et sortie avec brouillon sont explicites.
- Les trois modèles prédéfinis et les styles utilisateurs sont distinguables.
- Le parcours d'export courant ne gagne aucune étape obligatoire.
- Tous les états sont accessibles au clavier et en FR/EN.

**À valider avant implémentation :** écran M1/M2/M3, hiérarchie, choix des champs visibles par défaut, copie du tag, stratégie d'avertissement pour la suppression.
