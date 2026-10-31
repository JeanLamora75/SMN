# Brief Sally → Amelia — Évaluation & ROAM, 31/10/2026

## Décision UX approuvée
Référence : maquette illustrée validée par l'utilisateur dans la conversation « Qualité des données », onglet Évaluation & ROAM. La maquette est une intention graphique, **pas une modification des règles de criticité**.

### Carte Évaluation du risque
- Afficher une matrice de **9 cases** (3 × 3), colonnes = probabilité Faible/Moyen/Élevé (de gauche à droite); lignes = impact Élevé/Moyen/Faible (du haut vers le bas), afin que les risques plus élevés se situent en haut à droite.
- Couleurs progressives correspondant aux scores **P × I** : 1–2 faible, 3–4 moyen, 6–9 élevé; conserver libellés de texte et information de score.
- Marquer la cellule enregistrée par contour et coche; si non évalué, aucune sélection et « Non évaluée ».
- En lecture seule, les cellules ne modifient rien. En édition (par le bouton Modifier existant) la cellule choisie adapte les deux valeurs, l'enregistrement et le contrôle des révisions restent existants.
- Ne jamais enregistrer une modification au simple survol ni inventer une valeur absente.

### Carte Classification ROAM
- **4 grandes tuiles 2 × 2** : Resolved, Owned, Accepted, Mitigated; couleur + icône + texte; sélection visible et lisible au clavier.
- La carte ROAM a la **même hauteur** que celle d'évaluation sur desktop; les tuiles occupent toute la hauteur disponible sous l'en-tête, hormis la date de dernière modification.
- En mode consultation, pas de changement métier; l'édition conserve le flux existant PATCH et la révision optimiste.

### Mise en page et contraintes
- Conserver le bandeau Cockpit Agile, les onglets et le bloc « Créer un obstacle à partir du risque ».
- Deux cartes côte à côte sur desktop, hauteur harmonisée; empilement responsive et navigation clavier.
- FR/EN JSON, thèmes clair/sombre, droits, absence de saisie, erreurs, focus, contraste sans dépendre des couleurs.
- Pas de DDL, changement API ni altération des scores/snapshots.
- Références métier : Jira SMN-92 (ROAM), SMN-93 (matrice), SMN-243 (fiche).
- Référence code : `src/app/app/admin/registries/risk-assessment.tsx`, `risk-roam.tsx`, `registry-detail.tsx`, `registry-cockpit.css`.
- Recette : les neuf combinaisons, non évaluée, les quatre ROAM, droits admin/user, couleurs, édition, sauvegarde/erreur/conflit, 375/768/1440 px, FR/EN.

## Consigne Amelia
Lire l'existant et le skill `.agents/skills/bmad-agent-dev/SKILL.md`, puis implémenter sans toucher aux règles de calcul, en réutilisant les composants et APIs existants. Branche `main` autorisée explicitement. Ne déclarer « terminé » qu'avec vérifications réellement exécutées; recette locale Windows à confirmer.
