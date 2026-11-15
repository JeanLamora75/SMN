# Sally + Camille — Parcours guidé de première configuration SMN

**Date :** 2026-11-15  
**Statut :** conception UX intégrée dans l'article `overview` FR/EN et ordre de checklist ; qualification CI et recette navigateur à vérifier.  
**Agents :** Sally (parcours et expérience d'apprentissage), Camille (contenu vérifié dans le code), adaptations du connecteur GitHub (pas de script `uv`).

## Problème utilisateur

L'utilisateur qui vient d'installer SMN et d'ouvrir l'Aide n'a pas besoin des instructions d'installation déjà réalisées. La page `overview` ne doit pas être une liste abstraite de noms techniques `general`, `team`, `cadence`, mais répondre pour chacune des étapes : pourquoi elle est nécessaire, où aller, quelles données saisir, ce que SMN en fait et comment vérifier le résultat.

Le README d'installation dans le ZIP est **hors périmètre**, à traiter plus tard.

## Décision UX de Sally

1. **Se placer après la connexion** : aucun bloc d'installation ou de création du premier compte ; la première étape est « Vérifier les paramètres généraux ».
2. **Un ordre de configuration dépendant de ce qui existe** : paramètres généraux → équipe → membres et affectations → jours travaillés et calendrier → cycle Scrum/Kanban → tickets → indicateurs et rapports → sauvegarde.
3. **Une structure récurrente et explicite** à chaque étape : « Pourquoi ? », « À faire », « Ce que SMN en fait », « À vérifier ». Cette structure fonctionne avec le sous-ensemble Markdown réellement rendu, sans composant supplémentaire.
4. **Branches Scrum/Kanban** dans la seule étape des cycles ; ne pas faire exécuter les deux parcours.
5. **Réutiliser les guides existants** comme pages de détail, accessibles depuis « Lire le guide » de la checklist. Cela évite la duplication des 14 IDs canoniques ou la création de nouvelles routes, et conserve la recherche et le chargement à la demande des articles.
6. **La checklist reste déclarative et locale** : aucun bouton « Terminé » ne provoque une création métier ni une écriture PostgreSQL. L'ordre d'affichage change mais pas la clé de stockage `smn.help.setup.v1`, les identifiants des étapes ni les anciennes coches.
7. **Les permissions restent visibles sans contournement** : les actions administratives sont explicitement signalées ; depuis `overview`, les seuls liens directs conduisent à des écrans collectifs accessibles aux utilisateurs autorisés. Les guides restreints restent filtrés selon le rôle.
8. **Ne pas annoncer les bénéfices comme automatiques** : les indicateurs et rapports exploitent uniquement les données et sources réellement disponibles ; import de tickets facultatif si aucun CSV ; aucun faux zéro pour les valeurs manquantes.
9. **Navigation cognitive** : l'article présente les huit étapes successives ; la checklist de la page Centre d'aide offre la progression, les raccourcis vers les écrans et les guides spécialisés. Les états ne sont pas validés automatiquement.

## Matrice du nouveau parcours

| Étape | Écran de configuration / guide canonique | Prérequis | Résultat contrôlé |
|---|---|---|---|
| 1. Préférences et référence | `general-settings` | Administrateur | Langue, thème, pays, informations fixes vérifiés |
| 2. Équipe et produit | `teams` | Administrateur, contexte installation | Nom, mode Scrum/Kanban, produit et description présents |
| 3. Membres et affectations | `members` | Équipe, administrateur | Membres actifs/inactifs et périodes corrects |
| 4. Calendrier et jours travaillés | `calendar` | Équipe et membres ; période si disponible | Informations calendaires cohérentes |
| 5. Premier cycle | `sprints` ou `kanban-periods` | Mode et équipe | Sprint ou période consultable, dates cohérentes |
| 6. Tickets | `tickets` | Équipe et cycle ; CSV facultatif | Photographie et date vérifiées si import |
| 7. Indicateurs et rapports | `reports` (+ guide `indicators`) | Données disponibles | Sources et rendu contrôlés |
| 8. Sauvegarde | `backup` | Administrateur autorisé | Archive et contrôles vérifiés |

**Particularité :** l'étape « Calendrier » précède « Cycle » pour préparer les règles de travail ; le guide demande expressément de **revenir au calendrier après la création du cycle** pour vérifier les vues dépendant de la période. Cela évite une dépendance circulaire non expliquée.

## Sources de code consultées

- `src/app/app/admin/settings/settings-form.tsx` : onglets Général/Langue/Apparence, pays, options et contrôle de révision ;
- `src/app/app/admin/settings/teams/teams-settings.tsx` : nom, mode Agile, produit, vision, objectif, règles de modification ;
- `src/app/app/admin/members/team-overview.tsx` : membre, rôles, affectations, statut actif/inactif et création ;
- `src/app/app/admin/settings/working-days/page.tsx`, `src/app/app/team-calendar/team-calendar-view.tsx` : jours travaillés et calendrier ;
- `src/app/app/admin/sprints/sprint-index-view.tsx` et `src/app/app/admin/kanban-periods/period-form.tsx` : génération/consultation des cycles ;
- `content/help/{fr,en}/tickets.md`, `reports.md`, `backup.md` et les pages métiers auditées dans les rapports AU-05 ;
- `src/lib/help-setup.ts`, `src/lib/help-catalog.ts`, `src/app/app/help/page.tsx`, `src/app/app/help/help-setup-checklist.tsx`.

## Diff fonctionnel livré

- `content/help/{fr,en}/overview.md` : remplacement de l'ancien contenu générique par un parcours guidé détaillé et strictement post-connexion, avec huit étapes, branches Scrum/Kanban et résultat attendu.
- `src/lib/help-setup.ts` : ordre `members` avant `calendar`, sans modifier l'identité ni la sauvegarde des étapes.
- `content/help/.index/{fr,en}.json` : index recalculés.
- `tests/smn-466-help-first-setup.test.ts` et `tests/smn-460-help-content.test.ts` : tests antérieurs adaptés au texte utile, non aux anciennes étiquettes de clés techniques.
- `tests/help-first-setup-journey.test.ts` : vérification de l'ordre, des huit étapes, des quatre rubriques par étape, de la distinction des modes et permissions, des guides existants et des index.
- `.github/workflows/help-quality.yml` : nouveau test intégré à la CI bloquante.

## Limites et suite

- Les pages métiers de SMN n'ont pas été transformées en assistant de configuration automatique : l'Aide oriente l'utilisateur, elle ne remplit pas les formulaires.
- Les documents d'étape existants servent de pages de détail via la checklist ; certaines peuvent encore nécessiter un enrichissement distinct. Un éventuel assistant pas-à-pas interactif multi-écrans avec navigation Suivant/Précédent, ou un découpage de `overview` en plusieurs IDs, demanderait un cadrage Winston/Amelia et une décision de produit.
- Les contrôles automatisés ne constituent pas un test sur un poste Windows avec PostgreSQL et compte réel.
- La version anglaise est synchronisée fonctionnellement ; aucune relecture linguistique indépendante n'a été menée.
- Ne pas publier un README d'installation Windows dans le ZIP sans demande ultérieure.

**Validation GitHub :** [CI suite Aide après refonte](https://github.com/JeanLamora75/SMN/actions/runs/43708047287), résultat terminal à vérifier avant attestation.
