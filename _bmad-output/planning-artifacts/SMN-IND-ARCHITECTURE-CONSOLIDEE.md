# SMN — Architecture consolidée des indicateurs dynamiques Scrum/Kanban
Statut : architecture de conception validée en atelier ; non implémentée. Date : 31/10/2026.
Référence : SMN-IND-SPEC-001 ; ADR-01 à 30 ; REV-01 à 06 ; ARCH-01 à 06.

## Objectif
Remplacer les indicateurs prédéfinis par un catalogue global vide à l'installation, paramétrable par administrateurs. Sélection et affichage par équipe ; valeurs manuelles et résultats calculés persistants par sprint/période Kanban. Ne pas migrer les anciennes valeurs ; conserver calendriers, capacités, fermetures, absences et snapshots métiers indépendants.

## Domaines
Module serveur central conceptuel `src/server/indicators/` : `catalog/`, `formula/`, `dependencies/`, `calendar/`, `calculation/`, `persistence/`, planificateur d'impacts et orchestrateur. Le calculateur est pur : AST + sources préchargées immuables. Le registre TypeScript des tags calendaires est technique et non géré dans le catalogue.

## Modèle relationnel conceptuel (8 tables)
- `smn_indicator_definition` : tag global unique et immuable, titres, unités, style, type manuel/calculé, formule, `formula_revision`, `type_locked` irréversible après premier usage, `archived_at`.
- `smn_indicator_team_selection` : clé unique équipe/indicateur, `is_active`; désactivation conserve les valeurs.
- `smn_indicator_display_preference` : clé unique équipe/indicateur/écran, visibilité et ordre ; référence la sélection de la même équipe.
- `smn_indicator_manual_value` : valeur `NUMERIC NULL`, clé unique (équipe, type de cycle, cycle, indicateur).
- `smn_indicator_computed_result` : même clé unique ; valeur `NUMERIC NULL`, état available/unavailable, motif, détail, source directe indisponible, révision formule.
- `smn_indicator_dependency` : références directes aux indicateurs (FK) ou tags calendaires réservés (registre TS), discriminant et contraintes exclusives.
- `smn_indicator_cycle_revision` : révision commune de saisie par équipe/type de cycle/cycle.
- `smn_indicator_system_revision` : compteur global de cohérence pour simulations et écritures pertinentes.

Les références cycle sont polymorphes (`cycle_type='scrum'|'kanban'`, `cycle_id`) : aucune FK polymorphe ni trigger ; existence, périmètre équipe, nettoyage et concurrence validés dans les services TypeScript. PostgreSQL assure CHECK, FK ordinaires, index, unicités. Les écritures SQL hors services peuvent contourner l'intégrité polymorphe : audit dédié en lecture seule.

## Calcul et formules
Grammaire étendue autorisée : constantes décimales, tags, + - * /, signes unaires, parenthèses, multiplication implicite, %, puissances, fonctions whitelist MIN/MAX/ROUND. Pas de JS arbitraire ni eval. Priorités convenues : postfixe %, puissance associative à droite, signe unaire, * et /, + et -. Exemples : `-2^2=-4`, `2^3^2=512`, `2^-2=0.25`. `ROUND` applique HALF_UP, puissance fractionnaire seulement sur base strictement positive, `0^0` invalide. Adaptateur `DecimalEngine` vers une bibliothèque spécialisée à qualifier ; stockage NUMERIC sous chaîne, aucun arrondi automatique à 2 décimales pendant le calcul.

`CalculationResult` : union discriminée available(value) ou unavailable(reason). Motifs : missing_source, division_by_zero, dependency_unavailable (tag source directe), invalid_domain (détail normalisé). Échecs techniques (budget, panne DB, conflit technique) : exception typée, rollback, jamais unavailable. Une source absente ne vaut jamais zéro.

## Dépendances et recalcul
Graphe immuable par opération, sources et dépendants indexés, détection de cycle et tri topologique itératif de Kahn, ordre lexical déterministe à égalité. Filtrage double : cycles métiers effectivement concernés (conservateur si incertain), puis indicateurs dépendants transitivement ; tous statuts éligibles. Sources implicites utilisables même si masquées/désactivées pour l'affichage. Pas de profondeur métier arbitraire ; budgets cumulés AST, chiffres, précision, opérations, évaluations, durée ; dépassement = échec transactionnel.

## Transactions et concurrence
Le service propriétaire ouvre la transaction et transmet le même `pg.Client` à l'orchestrateur ; jamais de BEGIN/COMMIT autonome dans un calcul sous transaction. Verrou global dans un ordre partagé ; contrôles de révision pour la saisie et les prévisualisations. Simulation de formule sans écriture et avec révision globale/empreinte du contenu ; si obsolète lors de la confirmation humaine, refus puis nouvelle simulation. Recalcul interne peut reconstruire son plan si obsolète. Écritures métier, résultats et révisions forment un seul COMMIT ou ROLLBACK, même avec lots SQL internes ; retries seulement sur défauts transitoires.

## UI, droits, exploitation
Administrateurs globaux : définitions. Membres habilités : sélection/valeurs dans leur équipe. Modales Cockpit Agile, aperçu immédiat, sauvegarde atomique, null distinct de 0. Préférences partagées par équipe/écran ; tendances tous cycles et trous si null ; rapports ajustables ponctuellement sans changer les préférences. Archivage global conserve les usages existants et bloque toute nouvelle sélection/réactivation locale d'un indicateur archivé. Logs structurés via adaptateur applicatif (rotation cible 30 j, 10 Mo/fichier, 200 Mo au total) sans nouvelle table d'opérations. Audit structurel/numérique en lecture seule.

## Réserves techniques
La documentation ne constitue ni code testé ni DDL prêt à exécuter. Avant développement : inventaire exhaustif ancien SQL et appelants ; qualification bibliothèque décimale ; protocoles transactionnels calendaires existants ; définition exacte des tags ; calibrage budgets ; tests de migration, capacité et snapshots. Voir `SMN-IND-REVUE-TECHNIQUE.md` et `SMN-IND-MIGRATION-TESTS.md`.
