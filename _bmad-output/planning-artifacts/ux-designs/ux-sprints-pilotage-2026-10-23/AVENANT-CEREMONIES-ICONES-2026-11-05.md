# Avenant BMAD — Icône et couleur des modèles de cérémonies
Date : 05/11/2026 — Projet SMN / v33 — Story [SMN-229](https://lmn24.atlassian.net/browse/SMN-229)

## Décision fonctionnelle
Sous **Paramètres > Cérémonies et modèles**, un modèle de cérémonie existant ou nouvellement créé dispose de deux champs **facultatifs** : une icône Bootstrap Icons et une couleur appliquée exclusivement à cette icône. La sélection réutilise l'IconPicker transversal SMN avec catalogue complet, recherche, favoris et récents. Une palette accessible et nommée est utilisée pour la couleur, sans CSS libre. Aperçu immédiat près des commandes.

### Critères d'acceptation
1. AC7 — Même IconPicker que le Dashboard Builder, choix ou retrait; mise à jour locale du brouillon et aucun enregistrement avant Enregistrer.
2. AC8 — Palette prédéfinie (couleurs sûres et contrastées dans thèmes clair/sombre), valeur facultative et aperçu; « couleur par défaut » disponible, sans changer la couleur d'autres textes.
3. AC9 — Enregistrement et rechargement dans le modèle de cérémonie par équipe, via l'API existante, avec validation stricte côté serveur, historique des révisions, conflit optimiste, sans fuite d'équipe.
4. AC10 — Anciens modèles sans icône/couleur fonctionnent; les occurrences enregistrées et rapports édités restent inchangés. Les paramètres décoratifs seront utilisés par les futurs écrans lorsqu'ils sont explicitement raccordés.
5. AC11 — Tests validation lecture/création/édition/sécurité, PostgreSQL, interface, typecheck/lint et recette Windows avant clôture.

### Architecture et déploiement
- API et domaine : `src/server/sprints/ceremony-templates.ts`, `src/app/api/admin/sprints/templates/route.ts`.
- UI : `src/app/app/admin/sprints/template-form.tsx`, `src/app/app/icon-picker.tsx`, nouveau composant partagé de couleur.
- PostgreSQL : colonnes additives `icon_name text NULL` et `icon_color text NULL` sur `smn_scrum_ceremony_template`. La migration s'exécute explicitement et protège les installations existantes; pas de DDL silencieux en lecture. Les révisions et l'audit continuent.
- Valeurs autorisées par catalogue central; noms d'icônes issus de `isDashboardIcon` (catalogue Bootstrap 1.13.2). Couleurs nommées et mappées vers codes fixes, pas d'injection CSS.
- Les anciens producteurs d'occurrences restent intacts; aucun impact sur les capacités de sprint.

## État
Cadrage validé par la demande utilisateur. Publication documentaire précède l'implémentation. Tests à exécuter réellement avant toute déclaration de conformité.
