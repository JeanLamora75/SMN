# SMN-230 — Index des sprints : liste paginée, recherche, états et tri

**Date :** 23 octobre 2026  
**Statut :** implémentation publiée sur `main`, **recette utilisateur non exécutée**.  
**Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)  
**Story :** [SMN-230](https://lmn24.atlassian.net/browse/SMN-230)  
**Sources :** [DESIGN.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/DESIGN.md), [EXPERIENCE.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/EXPERIENCE.md), [CONTRAT-DEVELOPPEMENT.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [RECETTE-UX.md](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md).

## Comportement de la page cible

La page principale `/app/admin/sprints` devient une page pleine largeur (hérite de la sidebar) affichant la **liste unique** des sprints de l'équipe Scrum :
- En-tête « Sprints de l'équipe » et nom de l'équipe réellement récupéré en base.
- Une action primaire « Générer des sprints » **réservée à l'administrateur**, temporairement reliée à `/app/admin/sprints/tools#create-sprints` ; l'assistant unique sera livré à SMN-231.
- Recherche par nom, **insensible à la casse** (recherche SQL littérale `strpos(lower(name),lower($search))`), filtre d'état (Tous, À venir, En cours, Terminé, Clôturé, Suspendu et éventuels statuts additionnels en base), tri « En cours d'abord » puis dates décroissantes ou croissantes. **Pas de recherche sans accents** implémentée ; le comportement exact est explicitement limité à la casse.
- Tableau `Sprint / Période / État / Actions`, dates formatées en FR/EN avec le **fuseau IANA enregistré sur chaque sprint**, priorisation en cours réellement actif et couleur + libellé.
- Si le statut enregistré est décalé des dates (p. ex. `planned` alors que le début est passé ou `active` après sa fin), l'index **conserve l'état persisté** et indique « État enregistré à vérifier », sans fabriquer une transition.
- Si plusieurs sprints sont simultanément « En cours » dans leurs bornes actuelles, un avertissement global est affiché, y compris pour des cycles situés hors de la page affichée. Aucune donnée métier n'est modifiée.
- Installation sans sprint : absence de table reconnue en consultation via `to_regclass`, état vide explicite ; ancien schéma sans colonne `auto_suspended` pris en charge en lecture sans migration ni DDL.
- Pagination **SQL côté serveur** de 25 éléments par page (max. 50 via API), `LIMIT / OFFSET`, tri stable (date + ID), `count` appliqué aux filtres avant pagination ; aucun plafond implicite à 100.
- États chargement, erreur, liste vide et aucun résultat filtré distincts. Actualiser, pagination Précédente/Suivante, clavier et libellés accessibles, tableau `table-responsive`.
- **Fiche Sprint différée :** le nom est du texte, pas un lien vers une URL inexistante.
- **Calendrier :** l'icône est un contrôle non navigant qui explique que la liaison fiable par ID appartient à SMN-233. **Actions par ligne :** menu `⋯` pour admin, avec lien honnête vers les outils de gestion existants, sans prétendre préremplir l'ID. Le câblage par sprint réel appartient à SMN-232.

## Lecture, sécurité et absence de mutation métier à la recherche

### Lecture nouvelle, isolée
- `src/server/sprints/index.ts` : parseur de filtres bornés et requêtes **SELECT uniquement** ; identifiant d'équipe issu de `smn_installation` initialisée en mode Scrum ; ne déclenche jamais `reconcileSprintStates`, DDL, audit ou événement.
- `src/server/sprints/read-only-db.ts` : client PostgreSQL et transaction `BEGIN READ ONLY` pour exécuter les seules requêtes du nouvel index, `COMMIT / ROLLBACK` et fermeture en toute circonstance. La fonction de recherche ne passe pas par `withAuthDb`, dont le préambule réalise des contrôles/installations additifs. Les contrôles d'authentification partagés (`currentAccount`, `authorizeApi`, layout privé) passent **toujours** par leur mécanisme existant, qui peut faire de la maintenance de schéma ; il serait inexact de promettre une requête HTTP globale totalement dépourvue de SQL d'écriture.
- `src/app/api/sprints/index/route.ts` : endpoint GET avec `authorizeApi(request,"read",{type:"collective",...})`, entrée strictement validée (page, taille, recherche, état, tri) et réponse bornée, y compris total et statuts disponibles.
- `src/app/app/admin/sprints/page.tsx` : garde serveur `currentAccount`, `canAccess(...,"read",collective)`, mode Scrum vérifié par transaction read-only. L'admin **et** le rôle `user` peuvent consulter les cycles ; Kanban n'a pas de sprint Scrum.
- `src/lib/private-navigation.ts` : lien Sprints activé en mode Scrum pour les utilisateurs autorisés ; menu Cycles reste actif sur la route transitoire.

### Contrat de réconciliation préservé
L'ancien `GET /api/admin/sprints/states` utilise toujours `readSprintStates` / `reconcileSprintStates` et peut **modifier** les statuts/écritures de déclenchement lors d'un chargement par un écran d'administration. Il conserve aussi sa limite historique de 100 pour ces anciens écrans. Le nouveau lecteur **n'en dépend pas** ; le découplage complet de la réconciliation dans un scheduler ou mécanisme dédié est un sujet métier distinct. Cette étape n'altère ni son comportement ni les transitions persistées.

## Préservation des outils existants
- `src/app/app/admin/sprints/tools/page.tsx` : nouvel emplacement **administrateur uniquement** contenant l'ancien empilement de modules (création seule / lot, renommage, suppression, états, réunions, conflits, durées, capacité exceptionnelle, replanification, accès Bilan) sans les trois éditeurs de défauts déplacés vers Paramètres lors de SMN-229.
- Ancres `#create-sprints` et `#sprint-operations` ; retour vers la liste, liens Paramètres réels.
- **La page Sprints principale n'affiche aucun de ces formulaires.** Le nettoyage définitif n'est prévu qu'après SMN-231/232/233. `/app/admin/sprints/review` reste inchangée.

## Traçabilité Jira AC

| AC SMN-230 | Implémentation / réserve |
|---|---|
| AC1 Index pleine largeur | Liste principale seule, pleine largeur, aucune modale ni formulaire ouvert d'office |
| AC2 Historique complet | Lecture paginée en base, COUNT et LIMIT/OFFSET ; test de 123 sprints et cinq pages |
| AC3 Sprint actif prioritaire | Ordre SQL `active` non suspendu dans les bornes puis début décroissant ; état incohérent signalé, jamais falsifié |
| AC4 Recherche/filtres/tri | Valeurs contrôlées, SQL SELECT, priorité explicite / dates croissantes ou décroissantes |
| AC5 États/permissions | GET collectif lecture seule, user sans mutation, admin CTA, états vide/erreur/chargement |
| AC6 Responsive/ARIA/FR-EN | Bootstrap table responsive, labels, statut textuel, `details` natif, deux catalogues JSON |
| AC7 Fiche Sprint différée | Nom non cliquable, pas d'URL fictive |

**Limites assumées des étapes ultérieures :** le bouton générer pointe vers l'outil unitaire/lot historique (SMN-231 à venir), le `⋯` n'est pas encore un menu d'opérations préremplies par ID (SMN-232), et « Calendrier par ID » est présenté comme en attente (SMN-233). Aucun faux succès fonctionnel n'est annoncé pour ces 3 chantiers.

## Fichiers

Nouveaux :
- `src/server/sprints/index.ts`
- `src/server/sprints/read-only-db.ts`
- `src/app/api/sprints/index/route.ts`
- `src/app/app/admin/sprints/sprint-index-view.tsx`
- `src/app/app/admin/sprints/tools/page.tsx`
- `tests/smn-230-sprints-index.test.ts` (**14 tests** : validation paramètres, 123 sprints, filtres, tri, actif, absence de mutation, états incohérents, permissions, transition, transaction read-only et i18n).

Modifiés :
- `src/app/app/admin/sprints/page.tsx`, `src/lib/private-navigation.ts`
- `src/i18n/fr.json`, `src/i18n/en.json`
- `tests/private-navigation.test.ts`, `tests/smn-227-settings-navigation.test.ts`, `tests/smn-229-settings-relocation.test.ts`
- Référentiel UX BMAD.

## Recette Windows 11

Synchroniser GitHub Desktop `main`, puis dans PowerShell :

```powershell
pnpm exec tsx --test tests/smn-230-sprints-index.test.ts tests/private-navigation.test.ts tests/smn-227-settings-navigation.test.ts tests/smn-229-settings-relocation.test.ts
pnpm exec tsx --test tests/sprints-refonte-etape0.test.ts tests/sprints-refonte-dates-etape0.test.ts
pnpm i18n:check
pnpm typecheck
pnpm build
pnpm dev
```

Vérifier sur `http://127.0.0.1:3003/app/admin/sprints` : pleine largeur, priorité actif, recherche, états, tri, historique en pagination, erreurs / vides, console sans erreur, liste FR/EN et responsive, boutons au clavier, page outils admin, absence de CTA et d'accès outils pour `user`. Pour les essais sur une base de test volumineuse, **ne pas générer artificiellement 100 sprints en production** : les 123 lignes du test sont simulées en mémoire.

**Exécutions réellement effectuées :** vérifications de structure des sources publiées via GitHub. **Non effectuées :** exécution de `tsx`, `tsc`, `pnpm build`, authentification HTTP / PostgreSQL réel, recette navigateur et capture écran. GitHub Actions indisponibles. Jira reste « À faire » en attente de validation.

**Adaptation BMAD :** agent Amelia et contrats lus dans le dépôt, implémentation via connecteur GitHub. Le workflow officiel `uv run` n'est pas exécuté sur une copie locale, aucun résultat fictif de validation.
