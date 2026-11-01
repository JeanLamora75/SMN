# SMN-351 — Inventaire de démantèlement et préconditions

Statut : **bascule d'interface en cours sur main — sauvegarde et restauration confirmées le 01/11/2026 ; aucun DROP SQL exécuté**.

## KEEP — ne jamais supprimer avec l'ancien catalogue
- Calendriers et absences, capacités et leurs ouvertures, KPI capacités, fermetures et snapshots métiers versionnés, objectifs, tickets métiers, cérémonies, historiques.
- Le catalogue dynamique v33 : `smn_indicator_definition`, `smn_indicator_team_selection`, `smn_indicator_display_preference`, `smn_indicator_manual_value`, `smn_indicator_computed_result`, `smn_indicator_dependency`, `smn_indicator_cycle_revision`, `smn_indicator_system_revision`, `smn_indicator_team_grant`.
- `src/server/sprints/indicators-read.ts` et `src/server/sprints/trends.ts` **tant que** les consommateurs de snapshots historiques et du calcul des capacités en dépendent. Ne pas confondre anciennes valeurs d'indicateurs et observations conservées dans les snapshots métier.

## ADAPT — appelants constatés sur main
- `src/server/sprints/index.ts` calcule encore F01/F04/F07/F10/F11/F12 à partir des tables historiques.
- `src/app/app/admin/sprints/sprint-index-view.tsx` affiche encore ces colonnes.
- `src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx` expose encore des éditeurs historiques (SP/tickets/scores).
- `src/server/reports/standard-composition.ts`, `src/server/reports/html-preview.ts`, `src/server/sprints/trends.ts` et des rapports d'archives lisent des snapshots historiques dont l'intégrité doit être conservée.
- Les tableaux et rapports dynamiques v33 de SMN-349/350 doivent rester la projection cible ; retrait des anciens éditeurs seulement après remplacement fonctionnel sans placeholder.

## Constat PostgreSQL v33 du 01/11/2026

Diagnostic utilisateur : schéma 33, 33 migrations terminées, deux tables de valeurs candidates (`smn_sprint_story_points`, `smn_sprint_ticket_counts`), aucune dépendance SQL visible par le premier audit. Deux tables d'audit associées ont été reclassées dans les candidats. Les 26 autres objets d'abord marqués « unknown » sont des structures métier protégées KEEP. Cette absence de dépendances SQL cataloguées ne signifie **pas** absence d'appelants applicatifs : routes et composants historiques demeurent présents dans `main`.

## DROP — candidats, NON validés pour DROP SQL
- `smn_sprint_story_points`, `smn_sprint_ticket_counts`, `smn_sprint_confidence_clarity`, `smn_sprint_indicator_scores` : noms potentiels à **confirmer** par le diagnostic réel et par les dépendances d'API/tests/DDL.
- D'anciennes routes d'édition proprement indicateurs ne seront supprimables qu'après recension exhaustive des appels directs et des tests, puis validation des cas de bord.

## Critères bloquants de bascule
1. Sauvegarde de l'installation v33 et essai de restauration : **confirmés verbalement par l'utilisateur**, à distinguer d'un contrôle automatisé de restauration non effectué par ChatGPT.
2. Inventaire SQL réel, y compris FK/vues/triggers/fonctions, et appelants source/tests/exports, classé KEEP/ADAPT/DROP puis approuvé.
3. Comparaison de signatures PostgreSQL installation neuve vs migration existante (v33 et droits), et absence de divergence.
4. Tests d'intégrité métier, snapshots fermés, capacités, calendriers, Scrum/Kanban, RBAC, rapports HTML/PDF et régression.
5. Retrait des anciens API/UI sans placeholder, migration destructrice explicitement déclenchée et conditionnée, jamais automatisée silencieusement.
6. Recette locale Windows avant bascule fonctionnelle unique ; aucun héritage numérique des anciens indicateurs.

Diagnostic en **lecture seule** sur l'installation :
```powershell
pnpm exec tsx scripts/smn-351-legacy-audit.ts --check
pnpm db:diagnose
```
Ce diagnostic ne lance aucun DROP et ne change aucune préférence ni donnée métier.

Le runner BMAD `uv` n'est pas disponible dans le contexte ChatGPT ; lecture des skills et exécution via connecteurs GitHub/Jira.

## Bascule UI v33 — 01/11/2026

Les points d'entrée actifs de la page Sprint utilisent dorénavant la saisie universelle (`UniversalIndicatorInput`) et la projection dynamique v33 (`IndicatorReporting`). L'ancien éditeur Fxx du panneau Sprint n'est plus monté ; les colonnes Fxx et leurs lectures SQL ont été retirées de l'index Sprint, où s'affiche la projection configurée pour `cycle_list`. Le panneau des tendances anciennes n'est plus monté dans la fiche Sprint au profit de la projection `trends`. Les tests d'assertions UI historiques ont été réorientés vers ce contrat.

**Reste en place intentionnellement :** routes API et services historiques v32, fichiers de formulaires historiques non montés, lectures de snapshots de clôture pour les autres modules métier, états de capacité et de rapports. Les retirer sans audit des consommateurs et sans preuve de parité fonctionnelle casserait des contrats métiers indépendants. Le retrait physique des API/DDL demeure une phase distincte de SMN-351. Les tables n'ont pas été touchées.

## Retrait applicatif supplémentaire, sans DDL

- Sur les installations **v33**, les routes historiques `/api/admin/sprints/story-points`, `/tickets`, `/scores` et `/trends` sont explicitement fermées (`410 legacy-indicators-retired`) après authentification. Elles renvoient vers les routes dynamiques et ne peuvent plus servir à modifier d'anciennes valeurs.
- Le comportement des routes sur les bases historiques jusqu'en v32 reste isolé et conservé, afin d'éviter une rupture brutale des installations non migrées. Les services et fichiers historiques sont conservés temporairement comme compatibilité technique ; ils ne sont plus montés dans la fiche Sprint v33.
- La projection de la fiche Sprint utilise les préférences **`cycle_detail`**, distinctes de celles du tableau de bord, et n'est affichée qu'aux équipes explicitement habilitées.
- La nouvelle sélection des indicateurs sur la liste est fondée sur `cycle_list`, les tendances sur `trends` ; les anciennes colonnes fixes Fxx ont disparu.
- **Aucun DROP SQL n'a été lancé.** Les outils métier de capacité et les snapshots indépendants restent protégés.

## Mise en place finale de l'affichage dynamique (sans suppression SQL)

- La liste Sprint intègre maintenant les **colonnes dynamiques directement dans son tableau** : identifiant d'indicateur, libellé en infobulle, unité courte, ordre configuré par équipe, valeurs `NULL` visibles en « — », jauge lorsqu'elle est configurée. L'API `/api/admin/indicators/reporting?screen=cycle_list` fournit les valeurs ; les anciennes colonnes Fxx figées ne sont plus calculées.
- Le chargement est limité aux équipes auxquelles le compte a droit. La réponse affichée est liée à l'identité de l'équipe, afin de ne pas montrer les valeurs précédentes après un changement d'équipe.
- Sur la fiche Sprint, l'onglet Indicateurs utilise la configuration `cycle_detail`, la saisie universelle v33 et les habilitations ; l'onglet Tendances utilise `trends`.
- Pour les **nouveaux rapports Scrum en v33**, les anciennes métriques prédéfinies Fxx et leurs tendances ne sont plus composées : les indicateurs dynamiques ajoutés par SMN-350 deviennent la référence. Les références figées précédemment produites restent lisibles et ne sont pas remodifiées.
- Les API Fxx historiques v33 renvoient `410`. Les anciennes implémentations et tableaux SQL sont temporairement conservés pour les dépendances v32/snapshots métiers : **aucun DROP** ni récupération des vieilles valeurs.

Il reste à valider la recette navigateur Windows et la CI correspondant au dernier commit avant de certifier cette étape. La suppression SQL est exclue de cette livraison.

## Audit de dépendances métier — garde-fou complémentaire

**KEEP explicite** : les familles SQL contenant `capacity`, `calendar`, `absence`, `holiday`, `closure`, `snapshot`, `historical`, `history`, `report`, `archive`, `document`, `ceremony`, `meeting`, `member`, `attendance`, `work_slot`, `company`, `registry` ou `audit` sont traitées conservativement comme données métier à préserver, même lorsqu'une table nouvelle n'est pas dans l'inventaire manuel. Les tables de l'ancien système explicitement candidates et leurs audits restent des **candidats**, jamais des suppressions autorisées.

Le diagnostic `pnpm db:check:smn-351` distingue désormais `unsafeCandidates` (dépendances SQL cataloguées) et indique `readOnly: true`. L'absence de dépendance cataloguée ne certifie pas les dépendances applicatives TypeScript ni les fonctions SQL écrites en texte ; une analyse supplémentaire reste nécessaire avant tout DDL. Les snapshots métiers, historiques et références figées de rapports restent immuables. Les migrations de capacité et de calendrier sont hors périmètre DROP.

**Contrat de non-régression** : `tests/smn-351-cutover-guard.test.ts` contrôle que ces catégories sont classées KEEP et que les seules tables envisagées comme candidates sont celles des anciens indicateurs. Ce test ne démontre pas à lui seul la restauration ni l'exhaustivité de tous les appelants.

## Préparation nettoyage et comparaison v33 — 01/11/2026

- `pnpm db:preflight:smn-351` exécute une inspection SQL en lecture seule et renvoie volontairement un **code 2** : retrait **non autorisé** tant que comparaison neuve/migrée et audit applicatif ne sont pas certifiés.
- `pnpm db:compare:smn-351` compare les signatures PostgreSQL des deux **bases isolées v33** fournies dans `SMN_351_FRESH_DATABASE_URL` et `SMN_351_MIGRATED_DATABASE_URL`. Il refuse les URL absentes, identiques ou égales au connecteur de l'installation active ; il lit relations, colonnes, contraintes, index, triggers et fonctions dans des transactions en lecture seule. Les différences entraînent un code 2.
- Aucun outil de suppression SQL n'a été ajouté. La comparaison de deux bases réelles distinctes n'a pas encore été exécutée dans ChatGPT : des environnements préparés et leur résultat sont nécessaires.

## Comparaison automatique isolée — SMN-351

La commande `pnpm db:compare:smn-351:auto` ne nécessite pas de saisir les mots de passe PostgreSQL. Elle utilise **uniquement** la connexion locale SMN existante, vérifie que la source est `/smn` et que le compte peut créer des bases, crée deux bases temporaires aléatoires `smn351_fresh_*` et `smn351_migrated_*`, installe la v33 native dans la première et une baseline v32 suivie de la migration v33 dans la seconde, compare leurs signatures, puis supprime exclusivement ses deux bases temporaires.

**Limite importante :** ce scénario teste les deux chemins **baseline native v32 → v33** et **installation native v33**, et non une migration réelle depuis l'intégralité des 32 migrations historiques. Il ne suffit donc pas à lui seul à autoriser le nettoyage de la base SMN réelle. La comparaison ne modifie jamais `smn` et ne déclenche aucune suppression de table métier. Les différences de signature provoquent un code de sortie 2 ; il faut les examiner avant toute autorisation.
