# AU-01 — Alignement des droits de lecture de l'aide Kanban

**Responsables :** Winston (décision architecturale), Amelia (implémentation et tests)  
**Date de revue :** 2026-11-14  
**Origine :** [Audit de Camille](./camille-audit-au-2026-11-14.md)  
**État du développement :** publié sur `main`, validation CI à vérifier sur le run indiqué ci-dessous.

## Problème vérifié

Dans `src/app/app/admin/kanban-periods/page.tsx`, la consultation des périodes repose sur `canAccess(account, "read", {type:"collective",exists:true,inScope:true})`. Mais dans `src/lib/help-catalog.ts`, l'article `kanban-periods` utilisait `resource:"settings"`, ce qui le masquait aux comptes utilisateur standard malgré leur accès métier légitime.

## Décision Winston

Faire correspondre **le droit de lecture de l'article** au droit de lecture du module. Garder le garde-fou `modes:["kanban"]` et les contrôles de session. **Aucune élévation de droit d'écriture.** Les formes et routes de mutation restent gérées séparément avec `canManage={account.role==="admin"}`. Aucune modification à `src/server/access-policy.ts`, au serveur de périodes ou à la base.

## Modification Amelia

- `src/lib/help-catalog.ts` : passer **uniquement** l'article `kanban-periods` de `settings` à `collective`.
- `tests/smn-459-help-catalog.test.ts` : ajuster les droits attendus des utilisateurs standard et leur accès au contexte Kanban.
- `tests/help-au01-kanban-access.test.ts` : scénarios utilisateur/admin, actif/inactif, mot de passe à changer, Scrum/Kanban, ouverture de contenu FR/EN, recherche, checklist et maintien des restrictions de gestion.
- `.github/workflows/help-quality.yml` : inclure le nouveau test dans la suite bloquante et les déclencheurs GitHub.

## Matrice comportementale

| Profil | Mode | Lire le guide `kanban-periods` | Créer une période |
|---|---|---|---|
| Administrateur actif | Kanban | Oui | Oui, si les autres règles métier sont remplies |
| Utilisateur actif | Kanban | Oui | Non |
| Administrateur actif | Scrum | Non | Sans objet dans ce contexte |
| Utilisateur actif | Scrum | Non | Non |
| Compte inactif / session non autorisée | Kanban | Non | Non |

Le compte standard Kanban doit aussi voir la tâche `cadence` de la checklist et trouver l'article dans la recherche FR/EN. La modification n'ajoute pas de bouton contextuel sur l'écran : cela reste **AU-02**.

## Preuves CI

- [CI après correction syntaxique du test](https://github.com/JeanLamora75/SMN/actions/runs/43650657243) : vérifier la conclusion terminale.
- [Premier run avec erreur de syntaxe dans le test, corrigée ensuite](https://github.com/JeanLamora75/SMN/actions/runs/43650590274).

**Limites :** ces contrôles utilisent les contrats de code et des tests automatisés. Ils ne constituent pas une recette de session administrateur/utilisateur réelle avec PostgreSQL sur une installation Windows.
