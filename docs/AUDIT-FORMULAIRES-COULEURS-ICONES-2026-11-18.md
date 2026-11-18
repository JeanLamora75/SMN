# Audit SMN — Champs Couleur et Icône
Date : 18 novembre 2026  
Périmètre : branche `main`, composants React de `src/` (339 fichiers `.tsx/.jsx` parcourus).

## Objectif
Lorsqu'un formulaire demande une couleur ou une icône, présenter un sélecteur visuel plutôt qu'une saisie libre opaque. Préserver les contrats de données existants et la compatibilité FR/EN.

## Constats et corrections

| Formulaire | État avant audit | Décision / correction |
| --- | --- | --- |
| Paramètres > Indicateurs, catalogue | `HexColorPicker` et `IconPicker` existants | Conforme, conservé |
| Paramètres > Indicateurs, affichages | Affichage d'icônes, pas de saisie de couleur ou d'icône | Pas de modification |
| Paramètres > Cérémonies | `IconPicker` avec palette colorée | Conforme, conservé |
| Dashboard Builder — blocs et emplacements | `IconPicker` avec choix de teinte intégrée | Conforme, conservé |
| Styles graphiques | Entrées natives `type="color"` (fond, texte, palette) | Conforme, conservé |
| Paramètres > Catégories d'absence | Champ texte HEX en doublon avec `type="color"` | Unifié sur `HexColorPicker` ; couleur obligatoire, pas d'effacement |
| Paramètres > Sociétés | Liste de codes métier de couleurs sans visualisation | Convertie en palette de pastilles colorées, choix exclusif et accessible |

## Contrats préservés
- **Définitions d'indicateurs et catégories d'absence** : `#RRGGBB`, sans migration SQL.
- **Sociétés** : IDs sémantiques existants `blue, indigo, violet, teal, green, amber, orange, red` ; pas de conversion en HEX côté API.
- **Cérémonies et Dashboard** : codes de couleurs de cérémonie, noms d'icônes Bootstrap validés.
- **Graphiques** : couleurs HEX existantes et rendu SVG/PNG inchangés.

## Tests de régression
- `tests/smn-form-colors-icons-audit.test.ts`
- `tests/absence-categories-cockpit-modal.test.ts` et `tests/absence-category-cockpit-modal.test.ts`, adaptés
- Tests préexistants du catalogue d'indicateurs, de cérémonies et des styles graphiques

## Limites de qualification
Audit statique du code React, et non parcours exhaustif avec saisie et sauvegarde dans Chromium. Les tests et workflows CI doivent être effectivement exécutés pour valider les interactions. Un contrôle statique ne prouve pas qu'aucun champ n'est caché par un état métier non exercé. Les valeurs de couleur stockées en base ne sont pas modifiées par cet audit.
