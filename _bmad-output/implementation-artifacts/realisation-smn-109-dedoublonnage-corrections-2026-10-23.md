# SMN-109 — Déduplication et invalidation des faits automatiques

Jira : https://lmn24.atlassian.net/browse/SMN-109

## Livraison sur main

- Déduplication SMN-108 préexistante : contrainte unique `(category,source_kind,source_id,source_revision)` et `ON CONFLICT DO NOTHING`, indépendante du nombre de cycles liés ; de nouvelles transitions avec révision source distincte créent des faits distincts.
- Invalidation explicite par administrateur avec motif obligatoire, auteur et horodatage, sans suppression physique du fait ni de sa provenance. Refus de double invalidation ; transaction avec verrou sur le fait.
- Affichage « Automatique », identifiant et révision source, date d'enregistrement, état actif/invalide, motif de correction et accès à la source registre. Les faits invalidés restent dans la consultation historique mais ne sont plus présentés comme actifs.
- API PATCH protégée, libellés FR/EN, tests `tests/smn-109-highlight-invalidation.test.ts` préparés.

## Réserves

- Le journal ne possède pas de champ « date d'effet métier » distinct de `created_at` pour un événement automatique ; AC5 incomplet. La source a sa propre date métier, mais elle n'est pas figée dans l'événement.
- La liste historique montre toujours les faits invalidés, avec un statut explicite ; une future vue des faits actifs doit les exclure de ses sélections.
- Les transitions source doivent être vérifiées en PostgreSQL, en particulier la déduplication après un retry et un retour réel à la criticité Élevée.
- Tests, typecheck, build et recette PostgreSQL/navigateur non exécutés. GitHub Actions indisponibles ; Jira reste ouverte.

Vérifier sur Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-109-highlight-invalidation.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
