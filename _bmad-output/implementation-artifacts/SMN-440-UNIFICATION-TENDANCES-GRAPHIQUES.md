# SMN-440 — Unifier Tendances et graphiques Office

**Epic :** [SMN-6](https://lmn24.atlassian.net/browse/SMN-6) · **User Story :** [SMN-440](https://lmn24.atlassian.net/browse/SMN-440)

## Décision

Le graphique interactif des tendances d'indicateurs dynamiques v33 et celui des tendances historiques de la fiche Sprint doivent employer le même moteur de rendu SVG/PNG que l'export Office, tout en conservant les sélections métier et la navigation existante.

## Architecture livrée dans le code

- **Moteur graphique :** `scripts/smn-412-adaptive-chart.mjs` (le même que dans `src/server/reports/office-indicator-charts.ts`).
- **Endpoint d'image :** `src/app/api/admin/reports/charts/render/route.ts` ; contrôle d'accès à l'API, validation stricte des paramètres, catalogues de styles chargés côté serveur, réponses PNG `no-store`.
- **Composant commun :** `src/app/app/admin/indicators/shared-trend-chart.tsx` ; choix d'un style par défaut du type ou du catalogue ; affichage du PNG serveur ; téléchargement du même PNG.
- **Vues raccordées :** `indicator-trends.tsx` et `sprint-trends-panel.tsx`.
- **Parité FR/EN :** `src/i18n/fr.json` et `src/i18n/en.json`.
- **Tests :** `tests/smn-440-shared-trend-renderer.test.ts` ; CI Windows et Linux `.github/workflows/smn-440-shared-trends.yml`.

## Choix et limites

1. Le navigateur fournit les séries d'affichage déjà récupérées depuis les endpoints de tendances autorisés ; le nouvel endpoint ne lit jamais directement les données métier. Il valide la taille, les valeurs, le type, l'authentification et le style autorisé, puis produit une image. Il ne stocke aucun résultat.
2. Le composant réutilise le catalogue de styles Office existant ; aucun réglage local n'écrase le style global.
3. Pour les histogrammes, lignes et aires, une série conserve ses valeurs successives sur les sprints.
4. Pour les secteurs et anneaux des tendances historiques, chaque sprint de la plage est traité comme une portion d'un graphique de répartition, avec un seul point de référence. Cette adaptation garantit l'utilisation du moteur Office mais conserve une présentation de la part de chaque sprint sur la plage ; la mise en page du moteur commun doit être vérifiée visuellement.
5. Les règles de données absentes et les vérifications de jauge existantes sont conservées en amont.
6. L'affichage est un PNG généré côté serveur, non un SVG interactif dans le navigateur. Le survol détaillé des points du précédent SVG n'est pas conservé sous la même forme ; le tableau chiffré reste présent. **À valider fonctionnellement si les infobulles étaient impératives.**
7. Une plage de plus de six sprints en mode secteurs peut excéder la limite de six séries du moteur commun : un message d'erreur peut être renvoyé. Il faut contraindre explicitement la plage pour cet affichage si les utilisateurs travaillent sur des plages plus longues.

## Validation

Le succès des tests CI ne doit être déclaré qu'après lecture du workflow réellement exécuté sur le commit `main`. Une recette avec PostgreSQL, différents droits, styles personnalisés et comparaison visuelle avec un export DOCX/PPTX reste nécessaire avant clôture Jira.

> Les scripts `uv` ne sont pas exécutables dans GitHub. Aucune preuve d'exécution locale n'est revendiquée.
