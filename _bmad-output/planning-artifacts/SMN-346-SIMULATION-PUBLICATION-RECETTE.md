# SMN-346 — Simulation et publication des formules globales

Date : 01/11/2026 — Amelia (BMAD Developer). Adaptation ChatGPT : skills lus directement sur GitHub ; `uv` non exécuté.

## Contrat

Le module `src/server/indicators/formula-publication.ts` fournit `previewFormula` et `publishFormula`.

La simulation utilise **une transaction PostgreSQL REPEATABLE READ READ ONLY**. Elle valide le parseur de SMN-341, les sources et le DAG de SMN-342, le budget des cycles et les calculs non persistants. Elle retourne la révision globale, une empreinte SHA-256 du catalogue, des dépendances, des cycles et de la proposition, les indicateurs impactés, le nombre de cycles, de résultats et d'indisponibilités. Aucune valeur ni révision n'est modifiée.

La publication requiert **exactement la révision globale et l'empreinte de cette simulation**, acquiert le verrou global avant les écritures, reconstruit et vérifie le plan, remplace la formule et ses arêtes, incrémente `formula_revision` et recalcule les cycles Scrum/Kanban concernés avec SMN-344 sur le même `pg.Client`, puis incrémente la révision globale et effectue un unique COMMIT. Une confirmation obsolète donne `stale_preview` (409 API), sans publication. Les refus de grammaire, graphe ou budget ne sont pas automatiquement rejoués. Les exceptions techniques sont propagées après ROLLBACK, sans promesse de retry automatique.

La route `POST /api/admin/indicators/formulas` requiert un compte administrateur authentifié et le droit d'écriture selon la politique actuelle. `{"action":"preview","indicatorId":"…","formula":"…"}` renvoie l'aperçu ; `{"action":"publish","indicatorId":"…","formula":"…","confirmation":{"globalRevision":"…","fingerprint":"…"}}` confirme cet aperçu, après confirmation explicite côté interface appelante. Le serveur n'accepte aucune simple confirmation booléenne ni une empreinte calculée par le client.

## Limites et sécurité

- Un lot est limité à 1 000 cycles et 100 000 couples cycle/indicateur ; les budgets du parseur et du graphe restent en vigueur.
- Les données de capacité et snapshots historiques restent indépendants de la publication.
- Les sources calendaires non alimentées restent indisponibles, jamais égales à zéro.
- Aucun schéma supplémentaire ni table de journal n'est ajouté. Les logs de publication ne contiennent pas les valeurs calculées.
- Les opérations de recalcul peuvent échouer si un service externe ne tient pas le contrat v33 ; aucun succès n'est revendiqué avant la validation CI.
- La simulation s'appuie sur la révision globale pour détecter les écritures métier contractuelles. La publication revalide aussi l'empreinte du contenu persistant ; toute modification de catalogue doit prendre le verrou global pour assurer la sérialisation stricte.

## Recette

`pnpm db:test:smn-346` : installation v33 isolée, simulation read-only, propagation sur deux cycles et un indicateur dépendant, contrôle de formule et révision, refus stale après changement concurrent, refus cycle, rollback atomique sous erreur provoquée. `pnpm validate:smn-346` : intégration PostgreSQL + TypeScript + ESLint. La CI exécute la recette sur PostgreSQL éphémère ; aucune migration sur la base personnelle v32.

## Références

- [Jira SMN-346](https://lmn24.atlassian.net/browse/SMN-346)
- [Architecture](SMN-IND-ARCHITECTURE-CONSOLIDEE.md)
