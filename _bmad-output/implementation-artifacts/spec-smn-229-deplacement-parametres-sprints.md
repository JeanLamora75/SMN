# SMN-229 — Paramètres d'équipe : horaires, pause et modèles de cérémonies

**Date :** 23/10/2026  
**Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)  
**Story :** [SMN-229](https://lmn24.atlassian.net/browse/SMN-229)  
**Référence normative :** [CONTRAT-DEVELOPPEMENT.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [MATRICE-FONCTIONS.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md), [RECETTE-UX.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md).

## Périmètre livré sur `main`

- **Paramètres > Jours ouvrés** : route `/app/admin/settings/working-days`. Réutilise directement `WorkSlotsForm` (début/fin des demi-journées et zone IANA) et `LunchForm` (début/fin de pause déjeuner), avec leurs API et révisions existantes. Bandeau explicatif : **lundi–vendredi fixe** dans cette version ; *aucun nouvel éditeur de jours ou moteur de calendrier*.
- **Paramètres > Cérémonies et modèles** : route `/app/admin/settings/ceremonies`. Réutilise directement `TemplateForm` (nom, fréquence, jour/position, heure, durée, actif, versions). Les occurrences réelles, présences et exceptions restent dans les modules de sprint/calendrier.
- Les deux pages sont protégées comme les Paramètres : `currentAccount`, obligation de changement de mot de passe, `canAccess(...,"read",{type:"settings"})`, et vérification de l'installation `scrum` côté serveur. En cas de mode Kanban ou base indisponible, aucun formulaire Scrum n'est exposé.
- `settings-catalog.ts` : les 2 cartes disposent désormais d'URLs réelles, chacune au statut **partiel** (toutes les options du nom de rubrique ne sont pas disponibles). Pour Kanban, ces 2 cartes sont **non applicables** et non cliquables. `Cadence` conserve `/app/admin/scrum-cadence` ; `Règles de capacité` reste non cliquable (pas de configuration globale complète à exposer).
- `src/app/app/admin/sprints/page.tsx` n'affiche plus `WorkSlotsForm`, `LunchForm` ni `TemplateForm`. Les **liens de transition** vers les deux nouvelles pages et vers Cadence ont été ajoutés en haut de la page Sprints ; les autres parcours, notamment création, liste, renommage, suppression, replanification, réunions et bilan, sont conservés.
- `src/i18n/fr.json` et `en.json` : nouveaux libellés de pages, descriptions du catalogue corrigées pour exprimer honnêtement les limites, parité FR/EN.

## Carte AC → preuves de source

| Critère Jira | Fichiers et comportement |
|---|---|
| AC1 Plages et pause | `settings/working-days/page.tsx` importe les deux éditeurs. Les API `/api/admin/sprints/work-slots` GET/PUT et `/api/admin/sprints/lunch` GET/PATCH restent inchangées. |
| AC2 Jours fixes | Texte `settingsSprint.workingDaysScope` ; aucun contrôle d'édition des jours lundi-vendredi ajouté ; carte `workingDays` porte le statut partiel. |
| AC3 Modèles récurrents | `settings/ceremonies/page.tsx` importe `TemplateForm` ; API `/api/admin/sprints/templates` GET/POST et historique révisionnel inchangés. Aucune occurrence éditable dans cette page. |
| AC4 Cadence/capacité | Catalogue `cadence` inchangé ; `capacity` avec `href=null`. |
| AC5 Non-rétroactivité | Aucune modification du moteur de génération de sprint, des anciennes occurrences, des engagements, des instantanés de capacité ni des données métier ; les formulaires existants écrivent seulement leurs configurations partagées et respectent les révisions. **Limite à surveiller :** certaines capacités *recalculées à la demande* peuvent utiliser la configuration de créneaux courante (voir `readDevelopmentCapacity` avec `includeExceptionalImpact`) ; l'historisation de ces paramètres avec date d'effet n'existe pas et n'a pas été inventée. Les données historiques **persistées** ne sont pas écrasées par cette refonte UX, mais il faut qualifier séparément les simulations rétroactives. |
| AC6 Transition | Ancien index toujours accessible, liens utiles vers nouvelles pages, les autres composants restent présents et les routes/API ne changent pas ; protection SSR et écriture admin. |

## Tests

Nouveau fichier `tests/smn-229-settings-relocation.test.ts` : **9 tests statiques / contractuels** (liens et statuts du catalogue, Scrum/Kanban, routes, droits, API conservées, invariants transactionnels et absence de suppression des fonctions du sprint, parité FR/EN).

Tests historiques adaptés :
- `tests/smn-225-settings-catalog.test.ts` : cartes partielles avec destination au lieu de liens absents.
- `tests/smn-227-settings-navigation.test.ts` : navigation vers les deux pages, retour portail et droits conservés.

Contrôles statiques de publication réalisés sur GitHub : présence des fichiers, vrais imports, liens, garde SSR, nouvelles clés FR/EN et tests. **Aucun test Node, typecheck, lint, build, navigation dans le navigateur ou écriture PostgreSQL n'a été exécuté par Amelia** dans l'environnement connecté. Pas de GitHub Actions selon la politique projet.

### Recette Windows 11 à exécuter

Après `Fetch origin → Pull origin` dans GitHub Desktop :

```powershell
pnpm exec tsx --test tests/smn-229-settings-relocation.test.ts tests/smn-225-settings-catalog.test.ts tests/smn-227-settings-navigation.test.ts
pnpm i18n:check
pnpm typecheck
pnpm build
pnpm dev
```

Puis tester avec un admin Scrum :
1. Paramètres : ouvrir **Jours ouvrés** ; vérifier les 4 horaires et zone ; sauvegarder une valeur et relire après F5, puis restaurer la configuration initiale si le test était ponctuel.
2. Ouvrir **Cérémonies et modèles**, créer ou modifier un modèle de test, vérifier sa révision et activer/désactiver ; confirmer absence de mutation des réunions historiques et des données déjà créées.
3. Vérifier que l'index Sprints affiche **les liens** et non les 3 anciens éditeurs, tout en conservant les autres outils.
4. Tester refus user non admin, mode Kanban, FR/EN, mobile, tabulation clavier, erreurs de conflit de révision et navigation arrière/favoris.
5. Vérifier le caractère non rétroactif des valeurs *enregistrées* sur un sprint existant ; ne pas confondre données figées et vues dynamiques recalculées.

**État : code source publié sur `main`, recette locale et validation fonctionnelle utilisateur à effectuer avant de marquer Jira terminée ou d'entamer SMN-230.**

## Adaptation BMAD

Workflow Amelia via lecture du skill `.agents/skills/bmad-agent-dev/SKILL.md`, configuration équipe et documents UX. La commande officielle `uv run` n'est pas disponible dans le contexte connecté au dépôt, les modifications sont effectuées via GitHub. Aucune commande locale ou test CI n'est annoncé comme exécuté.
