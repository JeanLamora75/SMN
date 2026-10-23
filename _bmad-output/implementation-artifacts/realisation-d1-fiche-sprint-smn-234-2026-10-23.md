# SMN-234 — D1 : structure de la fiche Sprint, édition et sept onglets

**Date :** 23 octobre 2026. **Branche :** `main`. **État :** code publié, validation applicative complète et recette utilisateur en attente. **Référence :** [SMN-234](https://lmn24.atlassian.net/browse/SMN-234).

## Résultat développé

- **Route conservée :** `src/app/app/admin/sprints/[sprintId]/page.tsx` ; lien réel depuis la liste préexistant. Le contexte d'équipe et le Sprint sont contrôlés côté serveur, données du Sprint hors équipe non divulguées. La première lecture des objectifs est conservée, et appelée uniquement dans l'onglet Objectifs.
- **Bandeau compact :** nom du Sprint, dates présentées dans le fuseau IANA, produit/équipe, statut effectif. Aucun onglet Synthèse, ni duplicat des KPI du dashboard.
- **Sept onglets navigables :** Objectifs, Cérémonies, Capacité, Indicateurs, Registres, Tendances, Bilan. L'onglet Objectifs s'ouvre par défaut pour conserver le comportement déjà présent ; l'URL `?tab=` identifie les autres et la navigation clavier prévoit flèches, début et fin. Le contexte `sprintId` est préservé.
- **Édition réelle par crayon Bootstrap :** un crayon `pencil-square` pour le nom, utilisant `PATCH /api/admin/sprints/[id]` ; un crayon pour les dates des Sprints non clôturés, utilisant `POST /api/admin/sprints/reschedule` pour **prévisualiser** puis `PATCH` avec jeton pour confirmer. Le nom reste renommable sur Sprint clôturé, conformément au métier déjà codé. Les actions sont présentées en dialogue modal natif avec Annuler, erreurs et messages accessibles.
- **Gestion IANA et DST :** `src/lib/sprint-detail-time.ts` convertit les horaires localisés avec refus explicite des heures inexistantes ou ambiguës lors du changement d'heure, sauf lorsqu'une heure ambiguë déjà enregistrée n'est pas modifiée. Les dates envoyées à l'API respectent la borne de fin exclusive du Sprint.
- **Sécurité :** seuls les administrateurs reçoivent les commandes d'édition. Les API existantes conservent leurs contrôles serveur et jetons de prévisualisation ; les utilisateurs restent en lecture collective.
- **Progressivité :** les six autres onglets décrivent honnêtement leur raccordement futur D3/D4/D5/D6/D7/D8. L'édition/évaluation des objectifs et l'ajout d'objectif arriveront en D2. Aucun formulaire d'édition factice pour ces données.
- **Internationalisation :** nouvelles clés `sprintDetail` dans `src/i18n/fr.json` et `src/i18n/en.json` ; pas d'installation de dépendance. CSS sous `src/app/globals.css`.

## Fichiers livrés et modifiés

| Chemin | Action |
|---|---|
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Bandeau, navigation, affichage d'Objectifs conservé et chargement conditionnel |
| `src/app/app/admin/sprints/[sprintId]/sprint-detail-tabs.tsx` | Onglets client accessibles et URL par Sprint |
| `src/lib/sprint-detail-tabs.ts` | Parseur/constantes partagés serveur et client, évite l'import d'une fonction client par Server Component |
| `src/app/app/admin/sprints/[sprintId]/sprint-detail-editor.tsx` | Deux dialogues modaux admin, renommage et replanification via APIs existantes |
| `src/lib/sprint-detail-time.ts` | Conversion horaire IANA et contrôles DST |
| `src/app/app/bootstrap-icon.tsx` | Icône Bootstrap `pencil-square` ajoutée |
| `src/i18n/fr.json`, `src/i18n/en.json` | Libellés centralisés |
| `src/app/globals.css` | Modales et onglets responsives |
| `tests/smn-234-sprint-detail-d1.test.ts` | Tests de dates, droits, routage et structure de la fiche |

## Vérifications effectives et limites

**Effectuées :**
- Vérification par relecture GitHub des fichiers et clés de traduction JSON ; les deux catalogues JSON sont syntaxiquement valides.
- Contrôle TypeScript **isolé** du module `src/lib/sprint-detail-time.ts` dans une copie locale dont le blob SHA Git égale celui de `main` (`7bb39a0fcb8840730feaf21ab3b3380445ddcbde`).
- **8 assertions unitaires isolées exécutées et réussies** (Node.js 22 / TypeScript 5.8 disponible dans l'environnement d'exécution de contrôle) : fuseau Europe/Paris, entrée HH:mm, HH:mm:ss, date invalide, DST printemps inexistant, DST automne ambigu, préservation d'un instant ambigu précédemment enregistré. Cette validation ne couvre pas les dépendances Next.js ou les interactions navigateur.

**Non effectuées :** `pnpm typecheck` du projet, `pnpm exec tsx --test tests/smn-234-sprint-detail-d1.test.ts`, `pnpm build`, `pnpm i18n:check`, tests sur base PostgreSQL, tests des endpoints en session réelle et recette visuelle navigateur. Le checkout du dépôt et les dépendances Node 24 du projet ne sont pas disponibles localement dans cet environnement ; GitHub Actions reste indisponible. Les commandes du workflow BMAD basé sur `uv` n'ont pas été lancées, faute de répertoire projet complet, et ne sont pas prétendues exécutées.

**Qualification :** implémentation D1 publiée et contrôlée statiquement ; **D1 ne peut pas être déclaré recetté ni clos avant les tests locaux**. Story SMN-234 reste ouverte.

## Recette locale proposée sur Windows 11

Après synchronisation GitHub Desktop de `main` :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-detail-d1.test.ts tests/smn-header-sprint-context.test.ts tests/smn-235-dashboard-projection.test.ts tests/smn-237-dashboard-events.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

Dans l'application, ouvrir **Sprints > nom d'un Sprint** en administrateur, vérifier chaque onglet, les deux crayons et le dialogue de prévisualisation. Tester refus de replanification d'un Sprint clôturé, session rôle `user` (lecture seule), nom d'un ancien Sprint, doublon de nom, retour liste, bandeau compact, écran mobile et FR/EN. Ne pas valider une modification de date sur un Sprint réellement utilisé sans examiner les impacts ; le formulaire possède un aperçu obligatoire et sa confirmation est distincte.

## Suites

**D1 → D2** : réutiliser `smn_sprint_goal` et ses révisions pour ajouter, modifier et évaluer les objectifs, accessibles par leur identifiant depuis l'onglet Objectifs, sans réintroduire de sélection globale du Sprint. Les autres onglets restent indépendants de D2. Avant livraison définitive, corriger toute anomalie relevée par les tests et la recette D1.

**Références :** [audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md) · [plan D0–D9](plan-developpement-fiche-sprint-smn-234-2026-10-23.md) · [contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md).
