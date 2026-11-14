# Audit Murat — Epic Aide SMN-458

Date : 14 novembre 2026. Périmètre : SMN-459 à SMN-469, contrôles HELP-01 à HELP-30.

## Méthode et sources
- Stories Jira SMN-458/459..469, `RECETTE-UX.md` et `RECETTE-EXECUTION-SMN-469.md`.
- Suites `tests/smn-459-help-catalog.test.ts` à `tests/smn-469-help-*.ts` et `tests/smn-468-offline-help.test.mjs`.
- Logs réels GitHub Actions : [premier échec Chromium](https://github.com/JeanLamora75/SMN/actions/runs/43645868245), [diagnostic CSS/React](https://github.com/JeanLamora75/SMN/actions/runs/43646362010), [diagnostic callbacks / CSS](https://github.com/JeanLamora75/SMN/actions/runs/43646471381), [erreur clavier Puppeteer](https://github.com/JeanLamora75/SMN/actions/runs/43646558325).
- Dernière passe de qualification avant burn-in : [43646690516](https://github.com/JeanLamora75/SMN/actions/runs/43646690516). Le résultat final doit être lu directement dans GitHub Actions : ne pas déduire une réussite du simple passage à l'étape de build.

## Défaillances constatées et réparations
1. **P1 — Tests navigateur non compilables.** Le CSS importé par la modale et React depuis la namespace virtuelle de la fixture empêchaient les trois tests Chromium de démarrer. Réparation : interception des CSS par le bundler de fixture et résolution de React dans les dépendances du dépôt, sans remplacer le composant métier.
2. **P1 — Callbacks Puppeteer incompatibles avec la transpilation TSX.** Certains callbacks exécutés dans Chromium invoquaient `__name`, injecté par le transformateur mais absent du monde navigateur. Réparation : installation explicite de ce helper uniquement dans les contextes de fixture avant navigation.
3. **P1 — Séquence clavier non supportée.** `keyboard.press("Shift+Tab")` n'est pas une touche valide pour Puppeteer. Réparation : `down("Shift")`, `press("Tab")`, `up("Shift")`. Test réel de maintien du focus dans la modale conservé.
4. **P1 — Iconographie de la checklist non typée.** L'icône `box-arrow-up-right` n'existait pas dans le composant Bootstrap autonome, interrompant le typage TypeScript. Réparation : icône intégrée `arrow-right`.
5. **P2 — Régressions historiques détectées par la CI SMN-469 (traitées avant cet audit).** Séparateur manquant dans `private-navigation.ts`, libellés `Aide / Help` absents, script d'index avec `await` non compatible avec l'import `tsx`, usage erroné de `assert.doesNotRejects`, cas du document périmé trop court. Les journaux ont confirmé les symptômes et leurs correctifs.

## Niveau de preuve et points ouverts

| Exigence | Niveau actuel | Limite |
|---|---|---|
| Catalogue, droits, mode Scrum/Kanban | Contrats Node exécutables | Tests des politiques et chargeurs, pas de session browser administrateur/utilisateur réelle |
| FR/EN, recherche, index, fallback | Contrats Node exécutables | Mesure du chargement initial et HAR multi-langue manquants |
| Modale, clavier, brouillons | Chromium avec composants réels en fixture | Ce n'est pas un navigateur connecté au serveur Next complet |
| Checklist et `localStorage` | Chromium, navigation et quota, profils isolés | Connexion/reconnexion réelle et concurrence multi-onglets non attestées |
| Absence d'API mutante Aide | Analyse source et trafic GET de fixture | Absence d'écriture PostgreSQL **non prouvée** par instrumentation SQL |
| ZIP offline | Vérification des fichiers et garde-fous de packaging | Installation du ZIP Windows et réseau externe coupé non attestés |
| Thèmes et mobile | Fixture modale mobile sombre et captures | Palettes, tablette, zoom 200 %, parcours Centre d'aide réel à qualifier |
| CI | Runners GitHub Actions avec assertions non neutralisées | Une seule exécution verte ne prouve pas la stabilité temporelle ; burn-in requis |

## Recommandations de seuil
- **P0/P1 :** toute suite rouge bloque la qualification. Aucun `skip` ou `continue-on-error` sur les tests.
- **P1 :** exécuter plusieurs fois les tests Chromium sur runner propre et conserver des captures diagnostiques même en cas d'échec.
- **P1 :** l'intégration réelle de Next.js + profils et PostgreSQL doit vérifier la lecture seule par instrumentation SQL.
- **P1 :** un ZIP installé Windows avec Internet externe coupé doit être validé avant de déclarer SMN-468/469 terminées.
- **P2 :** ajouter une mesure HAR et une couverture visuelle à 200 % de zoom.

## Gouvernance
Les 30 contrôles disposent d'une correspondance de tests/proofs dans `RECETTE-EXECUTION-SMN-469.md`. Ils ne sont **pas tous attestés**. Les statuts Jira de l'Epic et des stories étaient « À faire » lors de la consultation. Ne pas les changer automatiquement sans accord utilisateur.

Aucun script `uv` n'a été lancé. Les tests s'exécutent via Node.js, `pnpm exec tsx` et GitHub Actions.
