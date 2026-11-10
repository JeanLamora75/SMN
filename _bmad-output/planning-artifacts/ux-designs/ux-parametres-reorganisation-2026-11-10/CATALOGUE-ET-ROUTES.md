# Catalogue, destinations et correspondances — Paramètres V2

**Inventaire vérifié dans `src/lib/settings-catalog.ts`, `settings-catalog-view.tsx` et pages de destination sur GitHub `main` le 10/11/2026.** Il s'agit du **contrat de destination pour Amelia**, pas de la confirmation d'un comportement validé en navigateur. Les entrées marquées conditionnelles nécessitent un test d'accès réel.

| # | Famille | Entrée canonique | ID proposé | Route à conserver / destination | Situation |
|---|---|---|---|---|---|
| 01 | Application | Informations générales | `preferences` | `/app/admin/settings/general` | Formulaire existant, mode et produit figés |
| 02 | Application | Langues | `language` | `/app/admin/settings/general#settings-language` | Onglet existant ; ne pas dupliquer |
| 03 | Application | Apparence | `appearance` | `/app/admin/settings/general#settings-appearance` | Onglet existant ; ne pas dupliquer |
| 04 | Organisation | Équipes | `teams` | `/app/admin/settings/teams` | Page existante ; gérer droits et éventuelles fonctions partielles |
| 05 | Organisation | Entreprises | `companies` | `/app/admin/companies` | Aujourd'hui carte spéciale ; intégrer au registre ; admin |
| 06 | Organisation | Cadence des sprints | `cadence` | `/app/admin/scrum-cadence` ou `/app/admin/kanban-cadence` | Dépend du mode |
| 07 | Pratiques | Cérémonies et modèles | `ceremonies` | `/app/admin/settings/ceremonies` | Scrum ; modèles d'équipe, partiel |
| 08 | Pratiques | Règles de capacité | `capacity` | Aucune route d'édition prouvée | Planifiée ; non cliquable |
| 09 | Pratiques | Indicateurs | `indicators` | `/app/admin/settings/indicators` | Aujourd'hui section spéciale ; admin |
| 10 | Pratiques | Registres | `registries` | `/app/admin/settings/registries` | Paramétrage (pas fiches de registre) |
| 11 | Pratiques | Liens | `links` | `/app/admin/settings/links` | Inventaire et catégories, admin ; partiel selon capacités |
| 12 | Calendriers | Jours et horaires ouvrés | `workingDays` | `/app/admin/settings/working-days` | Heures et pauses, Scrum ; partiel |
| 13 | Calendriers | Pays et jours fériés | `holidays` | `/app/admin/settings/holidays-closures#holidays` | Onglet existant ; consolider un seul accès |
| 14 | Calendriers | Fermetures d'entreprise | `closures` | `/app/admin/settings/holidays-closures#closures` ou `/app/admin/company-closures` | Une seule entrée ; valider route utilisable selon droits |
| 15 | Calendriers | Catégories d'absences | `absences` | `/app/admin/absence-categories` | Page existante |
| 16 | Rapports | Styles de graphiques | `chartStyles` | `/app/admin/settings/reports/charts` | Aujourd'hui section spéciale ; admin |
| 17 | Administration | Utilisateurs et habilitations | `users` | `/app/admin/users` | Ressource `accounts` |
| 18 | Administration | Sécurité et sessions | `security` | `/app/security` | Partiel ; mot de passe personnel reste accessible ailleurs |
| 19 | Administration | Maintenance | `maintenance` | `/app/admin/settings/maintenance` (`#updates`, `#backups`, `#audit`) | Onglets réels dépendants des permissions |

## Gestion des 19 entrées

- **Aucune rubrique ne doit apparaître deux fois** en dehors de suggestions de recherche renvoyant vers la même entrée canonique. L'ancienne carte « Fermetures d'entreprise » dans Entreprises doit disparaître du portail, mais la fonctionnalité doit rester accessible sous Calendriers.
- **Maintenance** = une carte unique ; les termes `mise à jour`, `update`, `sauvegarde`, `backup`, `audit` peuvent être indexés en alias de recherche sur cette carte. Vérifier que l'utilisateur peut effectivement accéder au sous-onglet recherché avant de l'annoncer dans la recherche ; si seule une capacité est autorisée, limiter les alias présentés à celle-ci.
- **Rapports et visualisation** : aujourd'hui seule la galerie des styles de graphiques est clairement vérifiée comme page de paramétrage dédiée. Les exports Word/PowerPoint et leurs opérations demeurent dans le Centre Rapports métier ; on pourra ajouter une rubrique réelle de configuration **plus tard**, après validation.
- **Registres** dans les paramètres = options des registres ; le menu opérationnel Registres conserve son emplacement.
- Les catégories « Application / Organisation / Pratiques / Calendriers / Rapports / Administration » correspondent à **six IDs de groupe**. Les anciens IDs `application`, `agile`, `calendar`, `administration` peuvent être conservés temporairement dans les traductions et liens internes ; choisir une table explicite des nouveaux groupes, pas un remplacement non maîtrisé.
- Paramètre `showCompanies` de `SettingsCatalogView` : **supprimé** de la nouvelle conception ; les capacités d'affichage sont générées depuis le registre unique. Ne pas supprimer des écrans ni leurs API.
- Chaque ID du catalogue a une seule clé titre, description, icône Bootstrap, statut, destination, ressources serveur et mots-clés FR/EN.

## Liens et retours à qualifier

1. `settings-form.tsx` lit déjà `#settings-language` et `#settings-appearance` via `hashchange` : conserver le contrôle de brouillon lors d'un changement d'onglet.
2. `settings-tabs.tsx` reconnaît les ancres `#holidays`, `#closures`, `#updates`, `#backups`, `#audit` : utiliser les vrais IDs constatés, ne pas inventer un nouvel onglet.
3. Les pages `settings/links` et `settings/indicators` n'exposent pas toutes deux, dans le code vérifié, un lien Retour au portail : une amélioration ciblée de navigation est recommandée, sans toucher à leurs fonctions.
4. `settingsCatalog` filtre des droits et `SettingsCatalogView` rend aujourd'hui des cartes spéciales selon `showCompanies={account.role==="admin"}`. La refonte doit **homogénéiser** ce filtrage, sans élargir l'accès ni dégrader les contrôles des pages enfants.
5. Préserver les anciens favoris `/app/admin/settings`, `/app/admin/settings/general`, `/app/admin/settings/maintenance` et toutes destinations métier. La famille est un rangement du portail, pas une modification de l'URL de destination.

## Références GitHub

- [Registre actuel](https://github.com/JeanLamora75/SMN/blob/main/src/lib/settings-catalog.ts)
- [Vue actuelle](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/settings-catalog-view.tsx)
- [Onglets du formulaire](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/settings-form.tsx)
- [Onglets de maintenance](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/maintenance/page.tsx)
- [Onglets génériques](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/settings-tabs.tsx)

**Statut :** inventaire et destinations à transférer à Amelia ; aucun résultat de recette revendiqué.
