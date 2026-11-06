# SMN-401 — Tableaux dynamiques PowerPoint

**Story :** https://lmn24.atlassian.net/browse/SMN-401  
**Statut :** En cours ; **recette ciblée Node.js 24 réussie (8/8, TypeScript et ESLint)**, recette Microsoft PowerPoint/Windows et PostgreSQL réelle non effectuée.

## Contrat d'utilisation des modèles

Dans un tableau PowerPoint existant (`a:tbl`), placer un marqueur dans l'une des cellules de la **ligne modèle** :

| Source | Marqueur | Champs proposés dans les cellules |
|---|---|---|
| Membres affectés au sprint | `{{ROW:MEMBERS}}` | `{{MEMBER_NAME}}`, `{{MEMBER_ROLE}}`, `{{MEMBER_START}}`, `{{MEMBER_END}}` |
| Indicateurs actifs | `{{ROW:INDICATORS}}` | `{{INDICATOR_NAME}}`, `{{INDICATOR_TAG}}`, `{{INDICATOR_VALUE}}`, `{{INDICATOR_UNIT}}` |

Les données sont identiques à celles de SMN-400, issues des services SMN avec contrôle de l'équipe et du sprint. La ligne de référence est répliquée, avec son XML de mise en forme et la hauteur définie. Les marqueurs peuvent être séparés entre plusieurs runs PowerPoint. Les autres zones des diapositives, les notes, les thèmes et les relations restent hors cible.

## Règles de génération

1. **0 enregistrement** : une ligne d'information `N/D` préserve la structure du tableau.
2. **1 ou N enregistrements** : toutes les lignes sont produites, sans plafond métier de pagination. Une garde technique expérimentale à 10 000 lignes déclenche une erreur explicite, sans troncature silencieuse.
3. **Dépassement de la diapositive** : les lignes débordent naturellement ; **aucune** nouvelle diapositive, aucun déplacement des objets adjacents et **aucun** redimensionnement artificiel du tableau ou de la diapositive par SMN.
4. **Disposition** : le style des cellules, les hauteurs de ligne, les fusions horizontales simples (`gridSpan` / `hMerge`) sont recopiés.
5. **Cas non pris en charge** : fusion verticale, tableau imbriqué, marqueur ambigu et source inconnue donnent une erreur explicite. Le modèle original n'est jamais modifié.
6. **Limites** : un moteur de remplacement XML simplifié reste expérimental ; les constructions Office complexes, les signatures, les macros, les rendus sur divers logiciels et le débordement visuel ne sont pas garantis.

## Implémentation

- [Moteur PPTX](../../scripts/smn-401-powerpoint-tables.mjs)
- [API générateur Office](../../src/app/api/admin/reports/office-templates/generate/route.ts)
- [Projection des lignes membres et indicateurs](../../src/server/reports/office-word-rows.ts)
- [Tests](../../tests/smn-401-powerpoint-tables.test.mjs)
- [CI dédiée](../../.github/workflows/smn-401-powerpoint-tables.yml)

## Critères d'acceptation et vérification

- CA-5.1 : répétition de lignes, styles, fusions horizontales, valeurs XML et intégrité du package.
- CA-5.2 : N/D si source vide, sans modification d'autres objets.
- CA-5.3 : absence de modification de `p:xfrm`, des dimensions de la diapositive, d'ajout de diapositives ; comportement visuel de débordement à recetter sous Microsoft Office.
- CA-5.4 : refus explicite des structures non supportées sans livrer de fichier partiel.
- CA-5.5 : toutes les lignes sauf garde de ressources technique, jamais de troncature silencieuse.

**Commande de test :** `pnpm exec tsx --test tests/smn-401-powerpoint-tables.test.mjs` ; le workflow inclut également `pnpm typecheck` et un ESLint ciblé sur Node 24 Linux.  
**Suivi :** https://github.com/JeanLamora75/SMN/actions/workflows/smn-401-powerpoint-tables.yml

Les tests isolés ne remplacent pas une recette complète depuis les données réelles de PostgreSQL, ni une validation sur PowerPoint installé sur Windows 11.

## Résultat CI du 06/11/2026

- Première exécution : 7/8, échec d'une assertion incorrectement écrite dans un test (aucun défaut moteur identifié pour ce cas).
- Correction publiée sur `main` : commit `57473f1b56804af1af852e4f1c514a0913d44c56`.
- [Exécution GitHub Actions 42300538698](https://github.com/JeanLamora75/SMN/actions/runs/42300538698) : **success**, 8/8 tests PowerPoint réussis sous Node 24 Linux, typecheck réussi, ESLint ciblé réussi.
- La CI réussie confirme les tests de contrats synthétiques, pas la compatibilité visuelle sous Microsoft PowerPoint ni la lecture sur une installation Windows 11 réelle.
