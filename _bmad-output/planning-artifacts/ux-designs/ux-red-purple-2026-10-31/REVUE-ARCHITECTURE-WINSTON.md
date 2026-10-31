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


## Validation et transmission Winston → Amelia (31 octobre 2026)
**Entrées figées pour l'implémentation :** [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md), variante sombre A Anthracite & Red Purple approuvée, quatrième palette `red-purple`, trois palettes historiques intactes.

**Séquence impérative :**
1. **Inventaire avant modification.** Relever la version réelle de PostgreSQL et de la baseline/migration, retrouver la contrainte `CHECK` active sur `public.smn_general_settings.palette`, examiner ses dépendances et la procédure de montée de version v32. Ne pas supposer le nom de la contrainte ni exécuter un DDL runtime.
2. **Migration non destructive.** Préparer une migration versionnée distincte de l'historique v6, remplaçant exclusivement la contrainte `CHECK` par l'allowlist à quatre valeurs, en conservant les lignes, le DEFAULT ocean, les révisions et les historiques. Couvrir installation neuve et ancienne ; rollback/échec explicites, pas de migration silencieuse en lecture.
3. **Contrat de domaine.** Étendre `src/lib/appearance.ts` (`PALETTES`, `Palette`, `validPalette`, `safeAppearance`) et vérifier tous les usages, `src/server/settings/manager.ts`, API de paramètres et projection depuis la DB. Pas de CSS ni de code hexadécimal libre fourni par l'utilisateur.
4. **Rendu global.** Ajouter les tokens `red-purple` clair/sombre dans `src/app/appearance.css` (notamment `--bs-primary-rgb`, liens, focus, boutons, fonds et surfaces). Vérifier la priorité des règles de `src/app/globals.css` et des sélecteurs Bootstrap; corriger les couleurs codées en dur ciblées sans modifier les trois autres palettes.
5. **Interface et traduction.** Ajouter l'option `red-purple` à `src/app/app/admin/settings/settings-form.tsx` et aux messages FR/EN; conserver la lecture SSR `src/server/settings/appearance.server.ts`, `data-bs-theme`, `data-smn-palette` et l'audit/revision de l'API.
6. **TDD et recette.** Mettre à jour `tests/appearance.test.ts` sans réécrire les assertions d'historique v6 ; ajouter tests de la nouvelle migration et de la contrainte SQL finale, des huit combinaisons, rechargement/SSR, rejet des valeurs invalides, conflit 409, conservation des données, accessibilité WCAG AA, responsive, régressions sur Océan/Forêt/Violet. Exécuter réellement `pnpm typecheck`, `pnpm lint`, `pnpm i18n:check`, les tests ciblés et l'intégration PostgreSQL si disponible. Rapporter les commandes non exécutables au lieu de les déclarer vertes.
7. **Handoff.** Détailler les fichiers modifiés, les décisions, la migration, les preuves de tests et les risques résiduels. Ne publier aucune modification fonctionnelle sans validation supplémentaire. Demander la validation de recette de l'utilisateur avant d'affirmer la livraison complète.

**Attention :** la restriction SQL historique est avérée dans `src/server/settings/appearance-migration.ts`. Le schéma PostgreSQL vivant n'a pas été interrogé à ce jour ; toute instruction `DROP CONSTRAINT` doit être fondée sur un constat SQL réel. Le workflow récent `scripts/db-upgrade.ts` exige une maintenance explicite et n'est pas une preuve qu'une migration automatique fonctionnerait.

**Décision d'architecture :** catalogue fermé de quatre palettes × deux modes ; aucune nouvelle dépendance de thème ni modification du design structurel Cockpit Agile. Le prochain agent est Amelia, responsable de l'implémentation et des preuves TDD, après accord sur le démarrage du développement.
