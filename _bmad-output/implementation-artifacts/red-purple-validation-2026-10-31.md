# Red & Purple — contrôle technique du 31/10/2026

## Correctifs publiés sur main
- Migration `prisma/migrations/20261031_red_purple_palette/migration.sql` : transaction, délais de verrouillage et de requête, contrôle d'existence de la colonne et du `CHECK` attendu, refus d'une contrainte absente/incompatible, ré-application sans changement lorsque `red-purple` est déjà autorisé. La migration v6 historique n'a pas été modifiée.
- `tests/appearance.test.ts` : correction des expressions régulières défectueuses, assertions de garde-fous SQL et contrastes supplémentaires.
- `src/app/appearance.css` : variables de compatibilité Cockpit Agile `--smn-background`, `--smn-foreground`, `--smn-heading`, `--smn-brand`, tokens Bootstrap et règles limitées à `data-smn-palette="red-purple"`; sélection active, boutons, en-têtes. Styles existants des trois palettes conservés.

## Vérifications réellement exécutées
- Lecture des fichiers sur GitHub `main`, comparaison de la contrainte nominale avec `prisma/baseline/v32/schema.sql`.
- Contrôles statiques JS sur les contenus lus : **9/9 réussis** : allowlist quatre palettes, présence des trois historiques, garde-fous SQL, nom de contrainte dans baseline, variantes light/dark, sélecteurs Cockpit Agile, libellés FR/EN, option Paramètres, contrôle des échappements regex.
- Calcul WCAG (Python) : blanc/#ba1732 6,45:1 ; #b9a5ff/#24252d 7,18:1 ; #ff7387/#24252d 5,85:1 ; #f4f3f6/#24252d 13,79:1 ; blanc/#991f3d 8,02:1 ; blanc/#35206c 13,34:1. Calcul sur aplats seulement, pas sur l'intégralité du rendu CSS.
- Aucun DDL exécuté sur une base de données.

## Non vérifié — critères de sortie
- **Pas d'exécution PostgreSQL** de la migration, ni de vérification du schéma vivant, rollback, vues ou dépendances en base.
- **Pas de `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check`** : dépôt non clonable dans le runtime (résolution DNS GitHub indisponible) ; la lecture passe par le connecteur.
- **Pas de recette navigateur** de Cockpit Agile ; le projet utilise toujours des valeurs CSS directes dans `globals.css` et `dashboard.css`. Les règles ajoutées ciblent les composants partagés identifiés, mais ne garantissent pas l'absence de toutes régressions visuelles sur chaque écran.
- La procédure de montée de version v32 doit approuver l'application de la nouvelle migration, avec sauvegarde et contrôle de sa présence dans l'historique.

## Recette requise avant livraison
1. Sur clone PostgreSQL v32, capturer le `pg_get_constraintdef` de `smn_general_settings_palette_check`, sauvegarder la table et sa révision ; exécuter la migration par la procédure supervisée ; vérifier les 4 valeurs permises et le refus d'une cinquième ; ré-exécuter pour vérifier l'idempotence ; comparer l'intégrité des données et audits.
2. Sur le poste Windows : `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check`, `pnpm exec tsx --test tests/appearance.test.ts` puis suites d'intégration pertinentes.
3. Contrôler dans le navigateur les 8 couples de palette/mode sur Tableau de bord, Équipe, Sprints, Calendrier, Registres, Rapports, Paramètres et modales ; examiner focus, hover, disabled, pastilles, tableaux, alertes et accessibilité.
4. Ne déclarer la tâche terminée qu'après preuves de ces validations.
