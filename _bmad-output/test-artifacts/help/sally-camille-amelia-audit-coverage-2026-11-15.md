# Audit transverse des points d'entrée Aide et du rendu des boutons — SMN

**Date :** 2026-11-15  
**Intervenants :** Camille (inventaire et guides FR/EN), Sally (règle de présentation), Amelia (composants et tests).  
**Sources :** arbre GitHub `main`, les **63** fichiers `src/app/app/**/page.tsx`, leurs principaux composants d'en-tête, `src/lib/private-navigation.ts`, `src/lib/help-catalog.ts`, `src/app/app/help/help-header-action.tsx`, `src/app/app/help/help-context-button.tsx`, feuilles CSS d'en-tête, `content/help/{fr,en}`, `scripts/windows/verify-offline-help.mjs` et workflow `.github/workflows/help-quality.yml`.

## Problème et correction prioritaire

- Le **Tableau de bord** (`/app`) et le **Dashboard Builder** (`/app/dashboard-builder`) n'avaient pas d'aide dédiée. **Correction :** article `dashboard` FR/EN et bouton dans `CycleOverview` et `DashboardEditor` (lecture et personnalisation).
- **Indicateurs** (`/app/admin/indicators`) possédait déjà un `HelpHeaderAction` ; défaut de placement/présentation dans l'en-tête. **Correction :** action à droite du titre, avec la classe visuelle commune.
- **Liens** (`/app/admin/links`) n'avait pas de bouton ni d'article. **Correction :** article `links` FR/EN, bouton dans `LinksCockpit`, mapping complémentaire sur `/app/admin/settings/links`.
- **Fond incohérent :** plusieurs en-têtes appliquaient des classes de bouton transparentes, notamment `smn-settings-detail-hero-action .btn` et `btn-outline-light` dans Calendrier. **Correction Sally :** composant `HelpContextButton` appliquant systématiquement `smn-help-header-button` ; CSS centralisé `help-dialog.css` avec **fond blanc opaque, texte sombre, contraste et focus clavier**, y compris en présence d'une classe spécifique fournie par l'écran. Aucun fond transparent ne doit demeurer pour un bouton Aide.
- Les deux nouveaux articles font passer la couverture de **14 à 16 guides canoniques par langue**, sans changer les identifiants existants. Mise à jour des index FR/EN, tests d'installation hors ligne, README et assertions liées au nombre d'articles.

## Contrôle des rubriques du menu latéral

| Rubrique | Route principale | État d'intégration Aide après correction |
|---|---|---|
| Tableau de bord | `/app` | **Nouveau** `dashboard`, vue de cycle |
| Dashboard Builder (depuis le Tableau de bord) | `/app/dashboard-builder` | **Nouveau** `dashboard`, consultation/édition |
| Membres | `/app/admin/members` | `members`, bouton dans `TeamOverview` |
| Cycles Scrum | `/app/admin/sprints` | `sprints`, bouton dans `SprintIndexView` |
| Périodes Kanban | `/app/admin/kanban-periods` | `kanban-periods`, bouton dans `KanbanPeriodForm` |
| Tickets | `/app/tickets` | `tickets`, bouton dans composant de la page |
| Calendrier | `/app/team-calendar` | `calendar`, bouton dans `TeamCalendarView` |
| Indicateurs | `/app/admin/indicators` | `indicators`, bouton déjà existant, repositionné |
| Registres | `/app/admin/registries` | `registries`, bouton dans `RegistryList` |
| Liens | `/app/admin/links` | **Nouveau** `links`, bouton dans `LinksCockpit` |
| Rapports | `/app/reports` | `reports`, bouton dans la page |
| Paramètres (portail) | `/app/admin/settings` | `general-settings`, bouton existant |
| Centre d'aide | `/app/help` | Page d'aide autonome, sans bouton supplémentaire attendu |

Le test `tests/help-navigation-visual-consistency.test.ts` parcourt dynamiquement les destinations présentes dans `privateNavigation` pour les deux rôles et les modes Scrum/Kanban, contrôle la correspondance vers un article autorisé, les raccordements réels des vues principales, le fond blanc invariant et les contenus FR/EN des deux nouveaux articles.

## Audit des autres pages : résultat et dette explicite

Les 63 fichiers `page.tsx` ont été recensés et examinés statiquement pour les éléments de composition : titre propre, `SettingsPageShell`, `HelpHeaderAction`, délégation à un composant enfant, redirection et présence d'un point d'entrée. **L'absence de `HelpHeaderAction` directement dans `page.tsx` n'est pas une preuve d'absence de bouton** lorsque le header est dans un composant enfant ; cette distinction a été appliquée à Membres, Sprints, Calendrier, Tickets, Registres, Liens et Dashboard Builder.

### Écrans Paramètres encore sans guide dédié

Le shell `SettingsPageShell` dessine bien un emplacement Aide, mais `HelpHeaderAction` ne rend **aucun bouton** sans correspondance dans le catalogue. Les sous-pages suivantes nécessitent encore des guides spécialisés et un mapping exact :

- `/app/admin/settings/ceremonies`
- `/app/admin/settings/holidays-closures`
- `/app/admin/settings/registries`
- `/app/admin/settings/reports/charts`
- `/app/admin/settings/working-days`
- `/app/admin/absence-categories`
- `/app/admin/companies`
- `/app/admin/kanban-cadence`
- `/app/admin/scrum-cadence`
- `/app/admin/users`
- `/app/security`

La sous-page `/app/admin/settings/indicators` a aussi un en-tête indépendant sans Aide spécifique. Ces éléments **ne sont pas qualifiés comme corrigés par cette intervention**. Aucun article d'une autre famille n'est substitué silencieusement à un guide pertinent.

### Pages secondaires ou fonctionnelles hors menu principal

Certaines routes de détail, génération, historique, rapports préparés, archives, audit, IA, restauration ou calendrier événementiel ne sont pas raccordées à un guide contextuel dédié, notamment les routes dynamiques `[id]` et `[sprintId]`. Elles nécessitent une analyse fonctionnelle par famille avant de décider d'un bouton vers le guide parent ou d'un nouvel article. Le catalogue actuel reste à **correspondance exacte** pour prévenir l'exposition de contenu d'un autre contexte.

Exemples recensés : `/app/admin/sprints/[sprintId]`, `/app/admin/registries/[id]`, `/app/reports/[documentId]`, `/app/admin/countries`, `/app/admin/company-closures`, `/app/admin/backups`, `/app/admin/audit`, `/app/admin/historical-csv`, `/app/admin/ai-briefs/**`, `/app/team-calendar/meeting/[kind]/[id]`, `/app/team/[id]`.

**Décision de portée :** couverture de **toutes les entrées principales du menu** et présentation commune pour tous les boutons Aide existants ; inventaire des autres pages, avec dette explicitement ouverte pour leurs guides. Cela **ne signifie pas** que chaque route secondaire des 63 pages a une aide contextuelle fonctionnelle.

## Sécurité et exécution

- Article `dashboard` en lecture `collective` ; article `links` en lecture `settings`, réservé à l'administrateur, conformément à la route métier de Liens.
- Aucune écriture en base, aucune mutation API métier, aucun changement des droits de modification.
- `scripts/windows/verify-offline-help.mjs` vérifie maintenant l'empaquetage des **16** guides FR et EN ; la vérification de fichier n'est pas un test d'installation Windows sur une vraie machine.
- CI Aide : exécuter et citer le **dernier run terminé** du workflow ; ne pas annoncer la qualification visuelle réelle sur la seule base d'une assertion CSS ou d'une fixture.

## Prochain lot recommandé

Préparer avec Sally/Camille les guides ciblés pour les sous-pages Paramètres encore sans aide ; faire implémenter les raccordements par Amelia, puis prioriser les écrans de détail utilisés fréquemment (sprint, registre, rapport, fiche membre). Murat devra valider une recette navigateur réelle sous les deux thèmes, en FR/EN et en mobile avant de considérer le rendu pleinement qualifié.

**Limites :** audit statique de GitHub ; pas de capture utilisateur contrôlée ni de session authentifiée exécutée ici. Aucun script `uv` exécuté. Aucun ticket Jira modifié.

## Résultat CI terminal — 2026-11-15

- [GitHub Actions — run 43715059272](https://github.com/JeanLamora75/SMN/actions/runs/43715059272) : **success**, après correction de l’assertion AU-03 restée sur 14 guides. Contrôles des index FR/EN, contrats Aide et permissions, 3 passages Chromium, TypeScript/i18n et build de production réussis.
- [Run initial rouge 43714964763](https://github.com/JeanLamora75/SMN/actions/runs/43714964763) : échec sur une assertion de comptage de guides obsolète, corrigée sans modification fonctionnelle supplémentaire.
- La réussite CI confirme le comportement sous fixtures et les contrats, **pas** une revue visuelle authentifiée des 63 pages.
