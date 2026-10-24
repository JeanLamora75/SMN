# SMN-22 — Navigation structurée selon le rôle et le mode

- Story Jira : https://lmn24.atlassian.net/browse/SMN-22
- Branche : `feat/smn-22-navigation-mode-role`
- Epic : SMN-1 ; incrément I0
- Statut : **intégrée dans `main` via [PR #17](https://github.com/JeanLamora75/SMN/pull/17)** ; recette sur PC / CI non attestée

## Fonctionnement livré

Le layout partagé `src/app/app/layout.tsx` donne le même en-tête, le même contexte produit/équipe, le même contrôle de session, la même navigation et la même activité de session aux écrans du tableau de bord, de sécurité et d'administration. L'authentification et le profil sont relus côté serveur ; les liens d'administration sont affichés uniquement pour le profil Administrateur.

Le modèle pur `src/lib/private-navigation.ts` expose les six rubriques Pilotage, Calendrier, Cycles/bilans, Registres, Rapports/IA et Administration. La dernière est absente pour le profil Utilisateur ; seules les routes effectivement livrées sont cliquables : `/app`, `/app/security`, `/app/admin/users` et `/app/admin/settings`. Les modules futurs affichent « À venir » sans lien ni route prétendument opérationnelle.

Pour Scrum, la rubrique Cycles annonce « Sprints » ; pour Kanban, « Périodes Kanban ». SAFe/ART n'est pas présenté comme disponible au MVP. Si la lecture du contexte échoue, ni produit/équipe ni mode agile ne sont inventés ; un message d'indisponibilité remplace les données manquantes.

L'entrée active reflète la page courante (y compris les sous-pages), et la navigation comporte un lien d'évitement clavier, des états accessibles et une disposition responsive. Les labels FR/EN sont exclusivement dans `src/i18n/fr.json` et `src/i18n/en.json`, pas dupliqués dans les composants.

## Contrôles de sécurité

Le masquage n'est pas une autorisation. `src/server/access-policy.ts`, `src/server/auth/authorization.ts` et les pages/API d'administration existantes continuent de vérifier le rôle, la session active et l'origine HTTP des modifications. Aucun endpoint de nouvelle opération métier n'a été ajouté.

## Traçabilité

| Exigence | Réalisation | Vérification |
| --- | --- | --- |
| AC1 | Groupe métier visible dans le menu commun | `tests/private-navigation.test.ts` |
| AC2 | Scrum/Kanban selon l'installation, aucune fonction SAFe/ART active | `tests/private-navigation.test.ts` |
| AC3 | Contexte affiché, page active, responsive et accès clavier | `src/app/app/layout.tsx`, `src/app/app/private-navigation.tsx`, `src/app/dashboard.css` |
| AC4 | Menus administration admin uniquement et protection côté serveur conservée | `tests/private-navigation.test.ts`, `tests/authorization.test.ts` |
| AC5 | Fonctions non livrées en états indisponibles non cliquables | `src/lib/private-navigation.ts`, `tests/private-navigation.test.ts` |

## Commandes de recette

```powershell
pnpm install --frozen-lockfile
pnpm i18n:check
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Avec GitHub Desktop, effectuer **Fetch origin**, puis **Pull origin** sur la branche `main`, avant les commandes ci-dessus.

Sur PC : vérifier les profils Admin et Utilisateur, les modes Scrum et Kanban, la mise en évidence de chaque page, l'écran étroit, la navigation clavier et les accès directs aux routes API d'administration. La publication de la branche ne vaut pas preuve d'exécution de ces commandes.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.

**Implication spécifique :** Cible visuelle : sidebar sous le header, occupant toute hauteur disponible, rétractable et accessible au clavier ; header pleine largeur avec sélecteurs équipe et cycle à gauche de Recherche. Le mode multiéquipe n'est pas livré au MVP.


## Avenant de navigation — 24 octobre 2026 (refonte en deux lots)

La description initiale SMN-22 des **six groupes de navigation** correspond à l'état historique de sa PR #17. Elle est remplacée dans le panneau latéral du MVP par un **groupe principal de six entrées métier**, ordonné comme suit : Tableau de Bord, Équipe, Sprint, Calendrier, Registre, Rapports. Pour un administrateur, un **groupe Paramètres** distinct est repoussé en bas et séparé par un trait horizontal fin. Les titres de groupes restent dans l'arbre d'accessibilité mais sont cachés visuellement.

Les règles de sécurité de SMN-22 ne changent pas : Équipe et Paramètres ne sont cliquables que si le rôle courant dispose de l'autorisation ; Rapports demeure visible, sans lien tant que sa page autonome n'existe pas. En mode Kanban, l'entrée liée aux cycles conserve l'intitulé « Périodes Kanban » et sa restriction existante. Le lien Sécurité est conservé dans les Paramètres et les pages/routes de cycles, de calendrier et des registres ne sont pas supprimées.

Référentiel fonctionnel à jour : `docs/UX-REFERENTIEL-BMAD.md`. Couverture attendue : `tests/private-navigation.test.ts`, `tests/smn-sidebar-first-pass-20261024.test.ts`, `tests/smn-sidebar-second-pass-20261024.test.ts`, `tests/smn-227-settings-navigation.test.ts`.

Cette évolution est une refonte UX, pas une affirmation de recette réussie. GitHub Actions étant désactivé, typecheck, tests et build doivent être exécutés localement.
