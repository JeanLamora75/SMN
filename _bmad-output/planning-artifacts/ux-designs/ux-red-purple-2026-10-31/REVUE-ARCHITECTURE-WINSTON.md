# Winston — Revue d'architecture Red & Purple (31/10/2026)

**Statut : revue statique, sans modification applicative ni exécution SQL.**

## Conclusion
**Faisable avec migration et corrections applicatives.** Il serait incorrect de n'ajouter que les sélecteurs CSS : aujourd'hui la quatrième valeur serait rejetée dans plusieurs couches.

## Points vérifiés sur main
1. `src/lib/appearance.ts` : `PALETTES=['ocean','forest','violet']`, type fermé, `validPalette` et `safeAppearance` ; toute valeur inconnue bascule vers ocean côté lecture.
2. `src/server/settings/manager.ts` : `parseGeneralSettings` rejette la quatrième valeur et `project` considère la donnée SQL invalide ; les écritures sont transactionnelles, auditables et protégées par révision.
3. `src/app/app/admin/settings/settings-form.tsx` : trois options codées en dur, données sérialisées dans PATCH ; succès synchronisé avec `data-smn-palette`.
4. `src/app/appearance.css` : variables spécifiques aux trois palettes, dans les deux modes ; aucun `red-purple`.
5. `src/app/layout.tsx` : `data-bs-theme` et `data-smn-palette` au SSR.
6. `src/server/settings/appearance-migration.ts` : **contrainte SQL historique** `CHECK (palette IN ('ocean','forest','violet'))` dans `APPEARANCE_MIGRATION_SQL` (migration v5 → v6). Le chemin historique est présent en source TS ; ne pas modifier rétroactivement sa définition.
7. `tests/appearance.test.ts` : assertions de la liste à trois palettes **et** de la contrainte historique, à distinguer des tests de la nouvelle migration.
8. `scripts/db-upgrade.ts` : refuse explicitement des migrations automatiques historiques ; logique de baseline v32, donc extension à traiter dans la procédure de migration actuelle, pas via l'ancien `ensureAccountsSchema` supposé.

## Décision d'architecture proposée
- Ajouter `red-purple` à l'allowlist TypeScript et à la validation serveur (valeurs libres interdites).
- Créer une **nouvelle migration explicite, additive et idempotence maîtrisée**, appliquée par le mécanisme de montée de version réellement en service ; ne pas changer la migration v6 historique ni ses checksums.
- Identifier en catalogue PostgreSQL le nom effectif de la contrainte (ne pas l'inventer), puis remplacer **la seule** contrainte `palette` par une nouvelle autorisant les quatre valeurs, sous transaction, en préservant les lignes et le DEFAULT `ocean`.
- Vérifier la compatibilité de la baseline v32, des installations neuves et des bases existantes ; éviter des manipulations SQL à l'exécution métier et tout DDL dynamique.
- Définir les tokens des deux modes `light/dark` dans `appearance.css`, étendre les 6 variantes `--bs-primary-rgb`/liens et contrôles nécessaires.
- Ajouter une option Paramètres et les textes FR/EN ; assurer cohérence SSR et API.
- Étendre les tests : migration PostgreSQL et vérification catalogue, 8 combinaisons, persistance/rechargement, refus des valeurs inconnues, révision concurrente, non-régression des trois palettes, contraste/keyboard, accessibilité des bannières.
- Surveiller `globals.css` : valeurs de couleurs fixes et sélecteurs `data-bs-theme` pouvant supplanter les tokens de `appearance.css`. Un audit ciblé CSS est indispensable pour un résultat global.

## Risques / arbitrages
- **Fort :** contrainte DB et validations TS incohérentes peuvent rendre les réglages non enregistrables. Déployer SQL et code de manière coordonnée.
- **Moyen :** mélange de couleurs codées en dur et tokens CSS → rendu partiel selon les pages.
- **Moyen :** rouge de marque confondu avec rouge d'erreur → garder les tokens sémantiques distincts.
- **Moyen :** dérive versions/baseline v32 → vérifier l'outil de migration actuel sur un clone de base avant toute application.
- **Bloquant UX avant validation** : contraste du texte blanc sur la bannière/dégradé et éléments interactifs.

## Ordre de réalisation recommandé
1. Validation finale du DESIGN/EXPERIENCE et couleurs sombres par Sally.
2. Audit du schéma réel et de la baseline en vigueur ; rédiger migration + tests.
3. Mettre à jour TypeScript/API/sélecteur/CSS/i18n dans un même lot.
4. Exécuter typecheck, tests d'intégration PG, tests CSS et recette clair/sombre sur les modules.
5. Ne déclarer livré qu'après vérification effective, puis actualiser la documentation SMN-24 et Jira sous approbation.

**Vérification** : liens source dans le dépôt GitHub `JeanLamora75/SMN`. Niveau de confiance élevé sur les blocages identifiés, moyen sur le nom réel de la contrainte et le parcours exact de migration en base : inspection PostgreSQL non effectuée.
