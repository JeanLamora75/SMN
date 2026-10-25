# SMN-252 — Navigation contextualisée entre fiches

**Date :** 25/10/2026  
**Statut :** implémentation sur branche dédiée ; **validation d’intégration et recette navigateur à effectuer**.  
**Source :** Jira [SMN-252](https://lmn24.atlassian.net/browse/SMN-252), UX-REG-21, [contrat de développement](../planning-artifacts/ux-designs/ux-registres-2026-10-25/CONTRAT-DEVELOPPEMENT.md).  
**Branche :** `feat/smn-252-registres-navigation`, créée à partir de `feat/smn-251-registres-historique`. `main` **non modifiée**.

## Réalisation

- État de liste sérialisé dans l’URL : catégorie, recherche, statut, propriétaire (administrateur), suivi, tri, cycle, page et mode Liste/Cartes. Retour depuis la fiche vers **l’URL précise** du registre. Position de défilement sauvegardée/restituée via `sessionStorage` lorsque le navigateur le permet.
- Fil d’Ariane avec origine et chaînage des IDs de fiches, navigation vers la fiche précédente et les ancêtres. Titres chargés depuis l’API déjà autorisée et vérifiés pour l’équipe ; une fiche absente ou non autorisée reste masquée sous un texte neutre.
- Navigation contextualisée depuis la liste, les cartes, la synthèse, les relations, les actions et les événements du journal, y compris créations liées.
- Retour direct sans historique antérieur possible. URL sécurisée : uniquement le registre SMN, filtres connus, UUID contrôlés et chaîne bornée.
- Protection des brouillons de commentaires, formulaires et éditions par section lors des liens et des changements d’onglet ; écoute du bouton Précédent avec demande de confirmation. Ce dernier comportement requiert **une recette navigateur réelle**.
- Traductions françaises et anglaises dans les catalogues, sans ajout de statut ni de modèle métier.
- Aucune modification des API métier, schémas PostgreSQL, règles de droits, audits ou snapshots Vn de cycles clôturés.

## Traçabilité des critères

| Critère Jira | Implémentation | Contrôle restant |
|---|---|---|
| AC1 — fil d’Ariane multi-fiches et retour | `registry-navigation.ts`, `registry-breadcrumbs.tsx` et passage du contexte | Parcours complet en navigateur |
| AC2 — filtres/page/vue/tri/scroll | `registry-list.tsx`, URL, stockage session | Retour scroll sur navigateurs et pagination réelle |
| AC3 — catégories et URL directe | Liens contextualisés dans les sections et parsing sécurisé | Essai de lien profond + rafraîchissement |
| AC4 — brouillons, clavier, Précédent | `data-registry-dirty`, garde navigation et `popstate` | Valider rejet/acceptation du bouton Précédent, focus |
| AC5 — indisponibilité sans fuite | 403/404 génériques et vérifications API pour les ancêtres | Tester permissions serveur et affichage mobile |

## Tests réellement effectués

1. **TypeScript isolé :** compilation stricte sans erreur de `src/lib/registry-types.ts` et `src/lib/registry-navigation.ts`, avec `tsc` global du conteneur. Le hash Git de la copie testée de navigation (`57ae3f36d48ca3c91f9e4b4b79ad936af81d30c8`) correspond au blob sur GitHub.
2. **Tests unitaires isolés :** `node --test /tmp/smn252/navigation.test.cjs` — **4 réussis, 0 échec** (roundtrip des filtres, chaînage sur 3+ fiches, origines dangereuses, paramètres invalides), sur Node v22.16.0. Ces tests ne constituent **pas** l’exécution de la suite SMN.
3. **Vérifications statiques GitHub :** 6 contrôles passés (JSON FR/EN, parité des clés, branchement de l’URL/retour, protection du brouillon, propagation des liens, contrôle API des ancêtres).
4. **Nouveau test de dépôt écrit mais NON exécuté :** `tests/smn-252-registry-navigation.test.ts`.

**Non exécutés :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, parcours Chrome/Edge et recette 320/375/768/1024/1440 px, contrôle admin/user, Scrum/Kanban. L’environnement courant ne dispose pas d’un clone complet SMN avec Node 24 / pnpm 12 ni de la base PostgreSQL du projet ; les GitHub Actions sont désactivées.

**Suite :** sur l’environnement du projet, contrôler `pnpm i18n:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` et exécuter REG-T27/REG-T28 avec captures et journal de résultats. Ne déclarer la Story terminée ni passer à SMN-253 avant résolution des anomalies éventuelles.

**Réserves métier :** les quatre arbitrages ouverts dans `EXPERIENCE.md` restent ouverts, inchangés.
