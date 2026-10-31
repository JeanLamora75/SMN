# SMN-341 — Validation technique Winston avant implémentation Amelia

**Date : 31 octobre 2026**  
**Décision : architecture VALIDÉE AVEC GATES DE QUALIFICATION.** Cette validation est une approbation de conception, pas une preuve d'implémentation ni de tests réussis.

## 1. Sources vérifiées
- Jira [SMN-341](https://lmn24.atlassian.net/browse/SMN-341) : Story, critères d'acceptation, statut À faire.
- `_bmad-output/planning-artifacts/SMN-IND-ARCHITECTURE-CONSOLIDEE.md`
- `_bmad-output/planning-artifacts/SMN-IND-AVENANT-FONCTIONNEL.md`
- `_bmad-output/planning-artifacts/SMN-IND-REVUE-TECHNIQUE.md`
- `package.json` : Node >=24 <25, TypeScript 5.9.3, pnpm 12.10.0, `tsx` ; aucune bibliothèque décimale spécialisée directement déclarée.

L'agent BMAD Winston est matérialisé par `.agents/skills/bmad-agent-architect/SKILL.md`. La configuration et le workflow officiel nécessitant `uv` ne sont pas exécutés dans cette revue : adaptation par lecture des sources GitHub.

## 2. Décisions fermes et contrôles contractuels

| ID | Décision contraignante pour Amelia | Justification / test contractuel |
|---|---|---|
| DEC-341-01 | Moteur **pur** sous `src/server/indicators/formula/`; parse -> AST immuable -> validation -> évaluation via `DecimalEngine`. Aucun accès DB, IO, API, eval/Function. | Test sans DB ni Next.js ; interdiction d'exécuter du code fourni par l'utilisateur. |
| DEC-341-02 | Grammaire explicite : nombres décimaux à point (à normaliser en UI), tags A-Z_0-9, parenthèses, + - * / ^, unaire +/-, % postfixe, multiplication implicite, MIN/MAX/ROUND exclusivement. | Cas inconnus rejetés par erreur de validation typée ; caractères non consommés rejetés. |
| DEC-341-03 | Ordre de liaison : fonctions/parenthèses, % postfixe, puissance associée **à droite**, puis signe unaire, multiplication/division, addition/soustraction. | `-2^2=-4`, `2^3^2=512`, `2^-2=0.25`. Le parseur Pratt ou descente récursive est autorisé s'il satisfait ces invariants ; choix d'implémentation local. |
| DEC-341-04 | Évaluation décimale dédiée ; opérations sérialisées en chaînes décimales vers stockage NUMERIC, pas de JS Number pour les calculs. Pas d'arrondi arbitraire intermédiaire à 2 décimales. | `0.1+0.2=0.3` à la précision attendue ; nombres négatifs, décimaux et limites couverts. |
| DEC-341-05 | `ROUND(x,n)` utilise explicitement **HALF_UP** ; arguments et arrondi validés, sans changement de précision globale pour les autres expressions. | `ROUND(1.005,2)=1.01`, `ROUND(-1.005,2)=-1.01` et tests des moitiés. |
| DEC-341-06 | Puissance fractionnaire seulement sur base >0 ; `0^0` indisponible `invalid_domain`, `0^negative` indisponible `division_by_zero`. | Tests des erreurs de domaine, puissances entières négatives et exposants fractionnaires. |
| DEC-341-07 | `NULL` ou tag non renseigné n'est **jamais** zéro. `CalculationResult` est une union discriminée `available(value)` ou `unavailable(reason)`. | Motifs `missing_source`, `division_by_zero`, `dependency_unavailable` (tag source), `invalid_domain` ; zéro reste une valeur valide. |
| DEC-341-08 | Erreurs techniques (budget dépassé, erreur runtime, panne d'adaptateur) remontent en exception typée, jamais en valeur indisponible métier. | Les couches transactionnelles doivent rollback ; interdiction de masquer des erreurs techniques. |
| DEC-341-09 | Limites **cumulées** AST, longueur, nombre de chiffres, opérations, précision, évaluations et temps ; pas de limite arbitraire de profondeur métier pour les dépendances. | Budget vérifié à la validation et à l'évaluation ; invariants sûrs même sous formules adverses. |
| DEC-341-10 | Préparer l'AST pour l'extraction des tags et la Story SMN-342 ; calcul pur, sources préchargées immuables, ordre de traitement déterministe. | Pas d'appels SQL depuis l'interpréteur et pas d'état mutable partagé entre équipes. |

## 3. Clarifications proposées pour implémentation
- `MIN` et `MAX` : minimum deux arguments, possibilité de plusieurs ; rejeter un argument vide et les virgules ambiguës.
- `ROUND(x,n)` : exactement deux arguments et `n` entier fini ; plage autorisée et formats numériques de sortie à fixer par tests de qualification.
- Tags : lexing distinct du catalogue global ; seuls les tokens reconnus comme identifiants et réservés sont acceptés ; valider unicité/réservation au niveau catalogue. Les séparateurs décimaux localisés sont une responsabilité UI.
- Multiplication implicite : `2(TAG)`, `(A)(B)`, `2TAG` autorisés si la tokenisation est non ambiguë ; une juxtaposition de deux identifiants est rejetée afin de préserver l'identité des tags ; `2MIN(A,B)` ne doit pas devenir une fonction non autorisée.
- `MIN`/`MAX`/`ROUND` sont des noms de fonctions réservés ; collisions de tags refusées.

Ces clarifications sont **propositions techniques** pour Amelia ; en cas de divergence fonctionnelle de la spécification, ouvrir une décision et ne pas changer silencieusement le contrat.

## 4. Qualification décimale — condition bloquante
`decimal.js` est un **candidat**, pas une dépendance définitivement approuvée. Avant fusion d'une implémentation :
1. Vérifier version compatible Node 24/TS 5.9, licence, disponibilité du package, maintenabilité et absence de vulnérabilité connue (validation dans l'environnement autorisé).
2. Tester `ROUND_HALF_UP`, les puissances fractionnaires et négatives, le contrôle des exponentiations coûteuses, les très grands exposants, les précisions et limites déterministes.
3. Encapsuler strictement dans `DecimalEngine` ; ne pas exposer les types de la bibliothèque dans l'API publique du moteur.
4. Pinner la version dans `package.json`/`pnpm-lock.yaml` uniquement après qualification ; aucun ajout n'a été effectué dans cette revue.

## 5. Gates Amelia / non-régression
- Écrire d'abord les tests `node:test`/tsx, table de vérité des priorités, erreurs syntaxiques, limites, `NULL`/0 et typage strict.
- Exécuter `pnpm exec tsx --test ...`, `pnpm typecheck`, `pnpm lint` ; publier les résultats réels. La Story ne peut pas être terminée avec des tests seulement rédigés.
- Le module fonctionne sans PostgreSQL ; ne pas activer les nouveaux indicateurs UI, ne pas déclencher une migration et ne pas modifier les algorithmes historiques de capacité et Kanban.
- Liaison avec SMN-342, SMN-344 et SMN-346 ensuite, avec tests du graphe, disponibilité des sources, simulation et transaction globale.

## 6. Avis de Winston
**GO pour lancer Amelia sur le moteur pur et les tests unitaires de SMN-341.**  
**NO-GO** pour considérer la bibliothèque définitivement choisie, pour publier des formules sans qualification numérique et pour déployer l'intégration de persistance avant SMN-338.

Cette décision ne vaut pas démarrage de l'agent Amelia. Le commanditaire a demandé de valider les choix techniques **avant** son activation.
