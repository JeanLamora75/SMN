# Brief BMAD — Sprints : harmonisation graphique Cockpit Agile (option A)

**Statut : option A validée par le commanditaire le 26/10/2026 ; spécification graphique uniquement.**  
**Agent UX : Sally / BMAD v6.12.4.**  
**Écran :** `/app/admin/sprints` (index des sprints Scrum).  
**Jira :** Epic [SMN-228](https://lmn24.atlassian.net/browse/SMN-228) ; Story graphique [SMN-284](https://lmn24.atlassian.net/browse/SMN-284) rattachée à l'Epic.  
**Source visuelle :** page Registres actuellement montrée par le commanditaire, et [avenant Cockpit Agile Option C](../ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md).

## 1. Besoin utilisateur

**En tant que** Scrum Master / RTE consultant les sprints de son équipe, **je souhaite** retrouver la même identité et les mêmes conventions visuelles que sur l'index Registres, **afin de** reconnaître immédiatement les informations, les commandes et la hiérarchie de l'interface sans changer mes habitudes fonctionnelles.

### Constat sur les captures du 26/10

- **Registres**, référence appréciée : bandeau bleu nuit à fort contraste, titre et sous-titre, commandes bien regroupées, filtres dans un panneau indépendant, repères de contexte, tableau lisible avec actions compactes.
- **Sprints**, situation actuelle : titre sur fond de page, boutons secondaires détachés, filtres volumineux, tableau aux styles hétérogènes avec le registre, sprint actif plus marqué par un fond brut que par un traitement unifié, note legacy visible en bas.
- Cible **A / harmonisation fidèle**, sans ajout de nouveaux indicateurs, nouvelle vue, navigation ou changement métier.

## 2. Composition graphique cible

1. **Hero bleu contrasté** sur toute la largeur utile : titre « Sprints de l'équipe » ; sous-titre de contexte équipe/mode Scrum issu des données réelles ; action « Reprise historique » secondaire, action « Générer des sprints » prioritaire à droite *si droits existants*. Boutons conformes au style Cockpit Agile.
2. **Pastilles d'états sous le titre** : Tous, En cours, À venir, Terminés, Clôturés ; les états Suspendu et autres valeurs réellement présentes restent accessibles. Pastilles = habillage du **même filtre** d'état existant, sans nouveau contrat de recherche, changement de tri ou double sélection contradictoire. Ne pas afficher de badge/chiffre non fourni par l'API.
3. **Panneau « Filtres et recherche » blanc** séparé : recherche par nom, tri existant, compteur réel de sprints, contexte équipe et bouton Actualiser ; si un sélecteur d'état résiduel est techniquement nécessaire pour des états non représentés dans les pastilles, sa valeur reste synchronisée. Jamais de deux filtres d'état indépendants.
4. **Panneau liste** séparé : en-tête gris clair, lignes lisibles et assez compactes, colonnes Sprint | Période | État | Actions inchangées, badges avec textes ; premier sprint actif accentué par bordure ou fond doux, sans déduire une alerte. Les actions existantes Calendrier et ⋯ restent reconnaissables et accessibles.
5. **Pagination et transition legacy** : ne pas supprimer la pagination ni le lien vers les outils existants. Réduire la dominance graphique de la note de transition sans la masquer prématurément.
6. **Responsive** : hero refluant correctement, sélecteur compact d'état sur petit écran, recherche prioritaire et filtres secondaires repliables si sans changement de valeur ; tableau adapté en lignes-fiches (toujours *une seule vue Liste*) sans actions coupées.

## 3. Invariants contractuels — ne PAS développer hors périmètre

- Ne pas changer le traitement du clic sur le nom du sprint, les liens existants, le bouton Calendrier ni le menu ⋯. Les choix de comportement ont été **explicitement reportés** par le commanditaire.
- Le code actuel contient un **bouton Calendrier provisoire** affichant un avis, et un menu ⋯ orientant vers les outils legacy : ne pas faire croire à une navigation opérationnelle. Ne pas corriger ces limites dans ce lot.
- Conserver recherche différée, filtres, tris `priority/newest/oldest`, pagination, rafraîchissement, génération, reprise historique, états `planned/active/finished/closed/suspended` et états additionnels, chargement/erreurs, états vides, avertissement de plusieurs sprints actifs et statut non vérifié.
- Aucun changement de routes, URL métier, API, droits, BDD/migrations, état des sprints, logique de calendrier, édition, génération ou historicalisation.
- Respecter admin / user (lecture seule), périmètres d'équipes réellement autorisés, historique, thèmes SMN, i18n FR/EN et accessibilité. Ne pas prendre les règles multiéquipes SMN-282 comme intégralement livrées ; ne pas élargir leur périmètre ici.
- Une seule vue **Liste** pour Sprints : pas de boutons Liste/Cartes copiés depuis Registres ; ne pas copier le bandeau d'alertes collectives spécifique aux Registres.

## 4. Fichiers à examiner côté Amelia (hypothèses à valider contre main)

- `src/app/app/admin/sprints/page.tsx`
- `src/app/app/admin/sprints/sprint-index-view.tsx`
- `src/app/app/admin/registries/registry-cockpit.css` (**référence, ne pas modifier**)
- `src/app/app/registries/` ou `src/app/app/admin/registries/` (inspecter l'emplacement réel, pas de copie aveugle)
- `src/app/globals.css`, `src/i18n/fr.json`, `src/i18n/en.json`
- Tests associés à l'index des sprints et aux composants du registre.

**Recommandation d'implémentation :** styles localement préfixés `.smn-sprints-cockpit` dans un fichier CSS dédié ; réutiliser variables existantes `--smn-brand`, `--smn-surface`, `--smn-foreground`, `--smn-border`, `--smn-muted`. Pas d'override global de table, bouton ou hero.

## 5. Critères graphiques synthétiques

- G1 : hero et actions visuellement conformes à l'Option C Registres, sans ambiguïté des droits.
- G2 : catégories de statut identifiables et filtrage **strictement équivalent**, y compris Suspendu/états inconnus ; une seule source de vérité.
- G3 : panneau filtres et contexte non redondants ; recherche/tri/Actualiser inchangés.
- G4 : tableau harmonisé, dates/localisation et statuts non altérés, actif visuellement distinct sans signal d'alerte faux.
- G5 : responsive 320/375/390/768/1024/1440 et zoom 200 % ; contraste, clavier et focus visibles.
- G6 : thèmes clair/sombre et toutes palettes existantes, i18n FR/EN, aria-labels maintenus.
- G7 : aucune régression de données, RBAC, tri/pagination, génération, historique, consultation et alertes existantes.
- G8 : tests réellement exécutés documentés, captures avant/après, preuves de conformité ; aucun test présumé réussi.

Voir les contrats graphiques [DESIGN.md](DESIGN.md), de comportement inchangé [EXPERIENCE.md](EXPERIENCE.md) et la [grille de recette](RECETTE-UX.md).

## 6. Maquette et validations

Référence principale = **captures Registres + Sprints fournies le 26/10/2026** et maquette de l'option A validée dans la conversation Sally. **Ces PNG/HTML ne sont pas encore archivés dans le dépôt** : ne pas inventer de chemin GitHub ; le contrat textuel ci-dessus fait foi à défaut de binaires.

**Décision validée :** option A sur le graphisme. **Décisions non validées, donc différées :** ouverture du sprint, clic sur Calendrier, contenu métier du menu ⋯, restructuration des parcours de gestion. Aucun développement ni recette exécutés par Sally.
