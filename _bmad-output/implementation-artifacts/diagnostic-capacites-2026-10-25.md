# Diagnostic capacité — Sprint, tableau de bord et développement (25 octobre 2026)

## Constat sur `main` avant correctif

Le moteur `readDevelopmentCapacity` est effectivement invoqué par :
- `GET /api/admin/development-capacity?start=…&end=…` lorsque l'utilisateur lançait explicitement le calcul ;
- `readSprintMemberPresence` pour la fiche Sprint non clôturée (estimation de présence + J/H de développement) ;
- `readSprintCapacityKpiView` pour les références calculées C01/C02, sans écraser les valeurs enregistrées ;
- `readCycleDashboard` / `readActualCapacity` pour le réel courant.

Les membres ne deviennent calculables que si **tous les jours affectés pertinents** disposent d'une affectation non ambiguë avec version effective, d'un calendrier hebdomadaire/exception applicable, d'une localisation pays effective et d'une couverture nationale des jours fériés connue. Absences et fermetures sont déduites. Si une source manque, le J/H du jour est `null` et le total agrégé reste `null`, jamais zéro fictif.

La capacité initiale du tableau de bord provient d'un **snapshot d'ouverture immuable** ; la capacité réelle est progressive, bornée aux journées antérieures à la date de lecture et n'est pas inventée pour un Sprint futur. Les données de clôture Vn restent figées. Les C01/C02 de la fiche Sprint présentent séparément la **saisie manuelle** et la **référence calculée**.

## Défauts de déclenchement / diagnostic constatés

1. L'écran « Capacité de développement » démarrait avec deux dates vides. Aucun appel de calcul ne se produisait avant le clic explicite sur « Calculer ».
2. Après modification du paramètre `heures/JH`, le rapport était effacé sans recalcul automatique.
3. La fiche Sprint affichait le nombre de jours non fiables mais ne remontait pas les codes d'entrée manquante produits par le moteur ; il était difficile d'expliquer pourquoi 3 membres « actifs » n'aboutissaient pas à un total.
4. Le tableau de bord n'offrait pas de chemin direct vers un diagnostic pour le Sprint sélectionné.

## Correctifs proposés

- La page de développement reçoit les dates du Sprint de référence **réellement enregistré** (priorité au `cycleId` validé via le contexte serveur) ; elle calcule immédiatement sa période et annule une lecture périmée si l'utilisateur change les bornes. Si aucune période Scrum appropriée n'existe, dates manuelles préservées.
- Après sauvegarde du nombre d'heures/JH, recalcul explicite de la période sélectionnée.
- Les motifs `no-assignments`, `ambiguous-assignment`, `assignment-version`, `work-calendar`, `member-country`, `national-coverage` et les causes liées aux réunions exceptionnelles sont projetés sans données supplémentaires et visibles **uniquement dans l'onglet admin Capacité du Sprint**.
- Un lien « Vérifier la capacité » sur le tableau de bord, visible seulement aux comptes autorisés à lire les données membres, conserve le Sprint actif sélectionné.
- Traductions FR/EN ajoutées sans changer de tables, de formules ni de snapshots.

## Contrôles et limites

- Vérifications statiques par inspection des fichiers exacts sur GitHub : formules inchangées, lecture courante conservée, ouverture/snapshot historiques inchangés, droits de lecture nominatifs maintenus, clés FR/EN comparées.
- Test ajouté `tests/capacity-refresh-diagnostics.test.ts` : trois développeurs calculables, journées inconnues et diagnostics, lien contextualisé/permissions, sélection de Sprint et conservation des snapshots. **Test déposé mais non exécuté via pnpm dans le dépôt**.
- **Non réalisés ici** : connexion à PostgreSQL local Windows, inspection des trois développeurs de l'utilisateur et de leurs dates effectives, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette navigateur.

### Vérifications fonctionnelles recommandées

Sur un Sprint **non clôturé**, contrôler pour chacun des trois développeurs :
- affectation à l'équipe, date d'entrée et version des parts Développeur, allocation, contribution et contrat, couvrant les dates du Sprint ;
- calendrier hebdomadaire effectivement applicable aux mêmes dates (et non seulement « configuré aujourd'hui ») ;
- pays effectif et calendrier de jours fériés national au statut `configured` pour chaque année concernée ;
- absence et fermeture ; si le pourcentage Développeur est 0, un J/H de présence positif et 0 J/H de développement sont légitimes.

Cliquer sur « Vérifier la capacité » depuis le tableau de bord pour voir la période du même Sprint. Pour un Sprint futur, le réel doit rester non enregistré ; pour un Sprint clos, ne jamais recalculer la photographie Vn.

**Le diagnostic du code ne prouve pas que la base PostgreSQL locale possède les prérequis requis.**
