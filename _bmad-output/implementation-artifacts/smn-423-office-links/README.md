# SMN-423 — Export des liens accessibles dans Word et PowerPoint

**John (cadrage) / Amelia (développement) · 8 novembre 2026**

- Jira : https://lmn24.atlassian.net/browse/SMN-423
- Epic : SMN-6 — Composer, exporter et retrouver des rapports professionnels
- Environnement : SMN v33, Node/pnpm, GitHub `main`. Aucun script `uv` exécuté.

## Besoin validé

Deux collections *indépendantes*, exploitables dans des emplacements distincts, sans sélection manuelle :

| Collection | Critère de visibilité | Marqueur |
|---|---|---|
| Transverse | Portée `TRANSVERSE`, visible pour l'acteur | `{{ROW:LINKS_TRANSVERSE}}` |
| Équipe | Portée `EQUIPE`, `teamId` du rapport uniquement | `{{ROW:LINKS_TEAM}}` |

Chacune est triée par **nom de catégorie, titre, ID** (insensible à la casse). La source unique est `listLinks(db,actor,teamId)`, avec ses contrôles PostgreSQL d'installation, d'habilitation et d'équipe. Le code revérifie la portée et le `teamId` pour empêcher une fuite interéquipes.

Champs communs : `{{LINK_TITLE}}`, `{{LINK_URL}}`, `{{LINK_LABEL}}`, `{{LINK_DESCRIPTION}}`, `{{LINK_CATEGORY}}`, `{{LINK_SCOPE}}`. La description vide est affichée `N/D`, la portée est traduite FR/EN. `LINK_LABEL` est le titre cliquable. Compteurs hors `ROW` : `{{LINK_COUNT_TRANSVERSE}}`, `{{LINK_COUNT_TEAM}}` (0 inclus). Zéro lien => aucune ligne de données.

### Exemple Word

Dans une table avec 3 colonnes, placer une ligne modèle contenant :

| Lien | Catégorie | Accès |
|---|---|---|
| `{{ROW:LINKS_TEAM}}{{LINK_TITLE}}` | `{{LINK_CATEGORY}}` | `{{LINK_LABEL}}` |

Créer une **deuxième table indépendante** pour `{{ROW:LINKS_TRANSVERSE}}`, dans une autre page si souhaité. Dans PowerPoint, utiliser une ligne de table ou un paragraphe contenant le ROW avec les champs du même enregistrement. Une zone de texte PowerPoint dont les champs sont répartis sur des paragraphes distincts ne constitue pas une seule ligne répétable (limite historique).

## Architecture

1. `src/server/reports/office-link-rows.ts` — liste accessible, contrôle de portée, tri, données de ligne, compteurs, tokens temporaires de lien.
2. `scripts/smn-400-word-tables.mjs` et `scripts/smn-401-powerpoint-tables.mjs` — connaissent les deux ROW et suppriment les lignes vides.
3. `scripts/smn-423-office-link-hyperlinks.mjs` — transforme les tokens de `LINK_LABEL` en **véritables hyperliens OOXML**, par création de relations externes `TargetMode="External"` et de `r:id` dans les runs Word / PowerPoint. Les URLs sont validées (HTTP(S), pas d'identifiants), XML échappé, IDs de relations uniques par part. Aucun appel HTTP vers les URLs. Les autres ZIP parts sont inchangées.
4. `scripts/smn-399-office-scalars.mjs` — ajoute les deux compteurs.
5. `src/app/api/admin/reports/office-templates/generate/route.ts` — depuis le contexte équipe/sprint autorisé, alimente les deux jeux de lignes, substitue les liens après l'expansion des ROW, puis traite scalaires, drapeaux et graphiques. Les archives existantes ne sont jamais modifiées.
6. `src/app/app/reports/office-tags.tsx` — documentation interactive FR/EN des deux familles.

## Tests et recette

```powershell
pnpm test:smn-423
pnpm typecheck
pnpm i18n:check
```

Suite `tests/smn-423-office-links.test.ts` : tri / séparation / exclusion d'autres équipes, compteurs, zéro ligne, échappement XML, validation URLs, insertion de relations externes dans DOCX et PPTX synthétiques, préservation des autres parties ZIP.

**Preuve CI :** https://github.com/JeanLamora75/SMN/actions/runs/42513280649 — succès Windows et Linux : tests, TypeScript, ESLint et i18n. Cette exécution ne vaut pas ouverture réelle dans Microsoft Office.

**Recette manuelle non exécutée** : ouvrir les deux formats dans Microsoft Word et PowerPoint sur Windows 11, cliquer réellement sur `LINK_LABEL`, vérifier les liens transverses et d'équipe sur des pages/diapositives différentes, la présence de tous les liens accessibles, le zéro lien, les deux langues et l'absence de liens interéquipes. Ne pas déclarer la Story terminée avant cette recette.

### Limites et protections

- L'export des liens est un instantané courant du catalogue : aucun figement historique supplémentaire n'est introduit.
- L'API et le stockage continuent d'appliquer leurs droits serveur ; les liens accessibles dépendent du compte et de l'équipe autorisés.
- Le nombre de liens est limité à 10 000 pour protéger les ressources ; un dépassement produit une erreur explicite, sans troncature silencieuse.
- Seuls les liens HTTP(S) sont pris en charge. Les URI `javascript:`, `file:`, les URLs à identifiants et les valeurs malformées sont refusées.
- La validation des fichiers avec de vrais modèles Office est distincte des fixtures synthétiques.
