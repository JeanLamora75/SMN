# SMN-272 — Grande modale du calendrier national

**Statut : code publié sur branche, non testé en intégration, non fusionné.**

## Références et filiation

- [SMN-272](https://lmn24.atlassian.net/browse/SMN-272).
- Branche : `feat/smn-272-country-calendar-modal`.
- Base : `feat/smn-271-country-modals` (PR #191), elle-même issue de `feat/smn-270-country-catalog` (PR #190).
- Les maquettes Pays validées en conversation ne sont pas matérialisées dans le dépôt de travail ; les critères Jira déterminent cette version.

## Contrat fonctionnel et réalisations

| Critère | Réalisation |
|---|---|
| AC1 | Nom du pays et « Gérer » ouvrent le même dialogue natif centré. Largeur ~85vw desktop, max 1300px ; hauteur ~90dvh avec défilement interne. En-tête : drapeau / ISO / nom / année / état annuel. Fermeture par bouton ou Échap, retour du focus vers le bouton d'origine. Filtres et millésime global conservés. |
| AC2 | L'année **locale à la modale** est indépendante du filtre global. Sélecteur + précédent/suivant sur 1900–2200 ; nouvelle lecture serveur du couple (pays, année). Recréation du composant de lecture à chaque changement d'année et abandon de la requête précédente. Données HTTP reçues rejetées si pays/année divergent ou si une date appartient à une autre année. |
| AC3 | Mode **Liste** par défaut, dates et intitulés chronologiques issus du serveur. Affichage distinct du chargement, d'une erreur réseau avec Réessayer, de l'absence de dates et des statuts Invalide / Inconnu. Aucun bouton de modification fictif : la modification sera réalisée dans les stories ultérieures. |
| AC4 | Mode **Calendrier** secondaire avec grille lundi→dimanche, mois navigables (y compris changement de millésime décembre/janvier), jours fériés identifiés par leur nom et sélectionnables au clic, avec la touche Entrée / espace au clavier. Fiche de date inline. Aucun import ni mutation lors de cette consultation. Même payload serveur que le mode Liste. |
| AC5 | Une seule modale active, pas de modale enfant. Adaptation presque plein écran sous 768px, contraste et variables de thème SMN, lecture et défilement clavier, boutons à libellés accessibles et lecteurs d'écran. Les accès existants de la page et de l'API restent réservés aux administrateurs pour les calendriers nationaux, conformément à l'arbitrage UX. |

## Fichiers

- `src/app/app/admin/countries/country-calendar-modal.tsx` — composant de consultation et grille mois.
- `src/app/app/admin/countries/country-admin.tsx` — déclencheurs nom / « Gérer », retrait de l'ancien petit dialogue.
- `src/lib/countries/month-grid.ts` — calcul civil UTC, navigation et vérification du périmètre HTTP.
- `tests/country-month-grid.test.ts` — tests couvrant lundi en premier, mois bissextiles, limites, décembre/janvier et protection contre les mauvaises années.
- `src/app/globals.css` — dimensions, responsive et thèmes.
- `src/i18n/fr.json`, `src/i18n/en.json` — labels, statuts et alertes.

## Sécurité et non-régression

Aucune modification du modèle PostgreSQL ni des données. La route existante `GET /api/admin/countries/calendar?country=...&year=...` est inchangée et reste protégée par `settings/read`. Aucune écriture ni activation anticipée d'édition/validation.

La liste historique des dates d'une année reste indépendante des statuts de validation administrative, qui seront traités plus tard. Les états Inconnu / Non configuré ne signifient pas « zéro jour férié ».

## Vérifications effectuées

- Lecture des sources de la branche et revue statique : intégration des deux boutons, modal accessible, contrôle pays/année côté client, annulabilité des requêtes, responsive.
- Catalogues FR et EN : **3 169 clés chacun**, clés correspondantes et placeholders identiques.
- Tests **écrits mais non exécutés**. Aucun test Github Actions lancé manuellement ni revendiqué.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, recette navigateur et PostgreSQL : **non exécutés** ; exécution réservée à l'utilisateur sous Windows.

## Checklist de recette sur PC

1. Ouvrir la branche `feat/smn-272-country-calendar-modal` dans GitHub Desktop (elle contient SMN-270/271/272).
2. Dans `/app/admin/countries`, conserver une recherche et un filtre, ouvrir un pays en cliquant son **nom** ; vérifier l'année et le statut. Fermer via Échap ; le focus revient au nom et les filtres restent.
3. Recommencer avec « Gérer » et fermer par la croix ou le bouton.
4. Naviguer 2026 → 2027 et vérifier que les dates 2026 ne subsistent pas ; utiliser précédent/suivant, y compris une année sans données.
5. Vérifier la Liste, puis passer au Calendrier ; changer de mois, de décembre à janvier ; cliquer un jour férié et naviguer au clavier (Tab / Entrée / Espace).
6. Vérifier la distinction entre **année vide**, **Inconnu**, **Invalide** et **Erreur de chargement**.
7. Vérifier versions FR/EN, thème sombre, écran mobile, zoom 200 % et scroll contenu ; aucun faux bouton d'édition.
8. Vérifier qu'un compte `user` ne peut ni consulter la page admin ni interroger l'API nationale.
9. Exécuter les commandes locales convenues `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ; transmettre les éventuels diagnostics.

## Adaptation BMAD

Skill `.agents/skills/bmad-agent-dev/SKILL.md` et configuration consultés sur GitHub. Les résolveurs `uv` et la validation globale BMAD ne sont pas exécutables dans le contexte connecteur ; aucune exécution n'est revendiquée. Document de transfert pour recette manuelle avant la fusion.

**Ne pas fusionner ni marquer SMN-272 « Terminé » avant validation des contrôles locaux.**
