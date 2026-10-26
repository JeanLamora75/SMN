# SMN-284 — Compte rendu de développement (branche de revue)

Date : 26/10/2026. Branche : `feat/smn-284-sprints-cockpit`. Cible : `main`.

## Livré dans la branche

- `src/app/app/admin/sprints/sprint-index-view.tsx` : bandeau Cockpit Agile, commandes d'en-tête conservées, pastilles d'états synchronisées avec le filtre unique, sélecteurs états additionnels et mobile, panneau filtres et contexte, liste compacte, accent de sprint actif, libellés contextuels en format mobile.
- `src/app/app/admin/sprints/sprints-cockpit.css` : styles isolés `.smn-sprints-cockpit`, reprise visuelle Registres, adaptation mobile sans deuxième vue métier et focus visibles.
- `src/app/app/admin/sprints/page.tsx` : import CSS index uniquement.
- `src/i18n/fr.json`, `src/i18n/en.json` : quatre libellés nouveaux.
- `tests/smn-284-sprints-cockpit.test.mjs` : assertions statiques vérifiant la composition, les comportements préservés, l'état du filtre, l'isolation CSS et les langues.

## Périmètre conservé

Lecture `/api/sprints/index`, états API, droits admin/user, tri, pagination, recherche différée, génération, reprise historique, URL du détail sprint, bouton Calendrier provisoire, menu ⋯ et lien de transition **inchangés**. Aucun changement de SQL, API, DB, migration, route de destination, modèle métier ou écran Registres.

## Contrôles effectivement effectués

- Lecture comparative GitHub `main` et branche dédiée : **6 fichiers de code/tests** modifiés ou créés (+ rapport).
- 8 contrôles statiques ciblés **exécutés sur le contenu de la branche via le connecteur GitHub** : 8 réussis, 0 échoués. Couverture : isolation CSS, filtre d'état unique, maintien des liens/messages, états suspendus, responsive et focus, liste sans cartes, traductions FR/EN, équilibre des accolades CSS.
- JSON FR et EN : `JSON.parse` réussi, nouvelles valeurs `sprintsIndex` présentes et clés identiques.
- GitHub compare : branche en avance sur `main`, sans retard au moment du contrôle.

## Contrôles non exécutés — conditions de validation

**Le dépôt n'est pas présent dans le conteneur d'exécution et git ne résout pas github.com.** L'activation du workflow BMAD `bmad-build` a été tentée une fois via `uv run --no-cache .../_bmad/scripts/render_skill.py` : **échec code 2, fichier manquant**. Travail effectué ensuite au moyen du connecteur GitHub ; ce n'est pas une exécution complète du workflow BMAD.

L'environnement local dispose de Node 22, alors que SMN exige Node 24 + pnpm 12 ; `corepack pnpm --version` échoue sur la résolution réseau npm.

| Vérification | Statut |
| --- | --- |
| `pnpm i18n:check` | NON EXÉCUTÉ — checkout/outil absents |
| `pnpm lint` | NON EXÉCUTÉ — checkout/outil absents |
| `pnpm typecheck` | NON EXÉCUTÉ — checkout/outil absents |
| `pnpm test` | NON EXÉCUTÉ — checkout/outil absents |
| `pnpm build` | NON EXÉCUTÉ — checkout/outil absents |
| Tests navigateurs / responsive 320–1440px / zoom 200 % | NON EXÉCUTÉS |
| Contrôle thèmes clair/sombre + accessibilité clavier/contraste réel | NON EXÉCUTÉ |
| Comparaison captures de l'application avant/après | NON EXÉCUTÉ |

Les huit contrôles statiques ne remplacent **pas** les tests applicatifs ni un test visuel navigateur. Les critères AC-10 à AC-14 et la Definition of Done restent à confirmer sur checkout Node 24 / pnpm 12 et navigateur.

## Suite à donner

Relecture de la PR par l'utilisateur ; exécution des contrôles demandés sous environnement SMN ; capture de la page réelle aux largeurs spécifiées et comparaison à la maquette validée ; corrections éventuelles. Ne pas fusionner la PR ni clôturer SMN-284 avant ces preuves et validation.
