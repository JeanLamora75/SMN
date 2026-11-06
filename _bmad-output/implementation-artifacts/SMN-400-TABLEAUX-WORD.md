# SMN-400 — Tableaux Word dynamiques

**État : En cours — implémentation sur `main`, recette CI Node 24 verte ; tests d'intégration PostgreSQL et inspection Microsoft Word/Windows encore à confirmer.**

## Convention du modèle

Dans un tableau DOCX, placer une ligne modèle contenant un marqueur de source. Ce marqueur est placé dans un paragraphe quelconque de la ligne, sans configurer d'emplacement dans SMN ; la ligne est répétée une fois par enregistrement métier disponible.

| Source | Marqueur de ligne | Tags dans les cellules |
|---|---|---|
| Membres affectés au sprint | `{{ROW:MEMBERS}}` | `{{MEMBER_NAME}}`, `{{MEMBER_ROLE}}`, `{{MEMBER_START}}`, `{{MEMBER_END}}` |
| Indicateurs actifs pour l'équipe | `{{ROW:INDICATORS}}` | `{{INDICATOR_NAME}}`, `{{INDICATOR_TAG}}`, `{{INDICATOR_VALUE}}`, `{{INDICATOR_UNIT}}` |

Le marqueur peut être fragmenté entre plusieurs runs Word ; les valeurs simples utilisent le moteur de SMN-399. Le marqueur est supprimé du document final.

**Sources des données :**
- Membres : affectations de `smn_member_assignment` qui chevauchent les dates du sprint autorisé, avec `smn_member` de la même installation. Le champ `MEMBER_ROLE` expose la **fonction professionnelle enregistrée dans la fiche membre**, pas une reconstruction historique de la répartition des rôles du sprint.
- Indicateurs : liste `readReportIndicatorProjection`, filtrée par sélection active de l'équipe. Les valeurs numériques respectent FR/EN et deux décimales maximum.
- Aucun accès aux autres équipes ni calcul métier parallèle.

## Comportements vérifiables

- `N` lignes métier disponibles → `N` copies de la ligne modèle, sans seuil de pagination arbitraire ni nouvelle page ajoutée par SMN.
- Aucune ligne → une ligne portant `N/D` pour les colonnes définies par tags connus, sans supprimer la structure du tableau.
- Styles de ligne/cellule, bordures, `w:gridSpan` (fusion horizontale), attributs de hauteur et paragraphes voisins conservés par duplication de `w:tr`.
- Rejet explicite des fusions verticales, des tableaux imbriqués, des sources inconnues et des lignes ambiguës.
- Protection expérimentale de ressources à 10 000 lignes : **erreur explicite** et aucun document partiellement délivré au-dessus de ce volume. Ce plafond est une protection technique à qualifier, **pas une limite métier**.
- Le rapport est toujours téléchargé sans écriture serveur ni mutation du modèle, en attendant SMN-403.

## Fichiers développés

- [Moteur de lignes Word](../../scripts/smn-400-word-tables.mjs)
- [Projection membre et indicateurs](../../src/server/reports/office-word-rows.ts)
- [API de génération intégrée](../../src/app/api/admin/reports/office-templates/generate/route.ts)
- [Tests automatisés](../../tests/smn-400-word-tables.test.mjs)
- [Workflow CI dédié](../../.github/workflows/smn-400-word-tables.yml)

## Statut des preuves

La première recette couvre tableaux 0/1/N, deux sources de lignes indépendantes, conservation des parties ZIP hors cible, styles de ligne, XML échappé, coexistence avec tags simples et refus des structures non prises en charge. **Résultat vérifié :** [exécution GitHub Actions 42299892085](https://github.com/JeanLamora75/SMN/actions/runs/42299892085) : **9 tests réussis sur 9**, `pnpm typecheck` et ESLint ciblé réussis sur Node.js 24 Linux. Les tests mettent en œuvre des packages Open XML synthétiques ; ils ne constituent pas une recette de rendu Microsoft Word.

**Restent non prouvés avant clôture :** tests de l'API avec base PostgreSQL réellement chargée, recette Microsoft Word sous Windows 11, tableaux très volumineux/complexes, vérification visuelle des modèles métiers et durcissement du traitement Open XML. Le moteur Open XML utilise encore des expressions régulières et un lecteur ZIP expérimental : il ne faut pas présumer une fidélité universelle.

**Jira :** https://lmn24.atlassian.net/browse/SMN-400
