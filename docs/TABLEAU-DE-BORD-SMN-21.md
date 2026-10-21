# SMN-21 — Tableau de bord pilote

**Statut :** première itération ergonomique disponible sur `main`. **Périmètre :** Story [SMN-21](https://lmn24.atlassian.net/browse/SMN-21), producteur métier des données de cycles/indicateurs non livré. SMN-15 reste traité séparément et n'est pas clôturé à cause de ce changement de priorité.

## Accès et parcours

Se connecter à `http://localhost:3003` ; après validation du mot de passe initial, le chemin `/app` est **le tableau de bord par défaut**. L'en-tête contient le logo, l'identité de session et le bouton de déconnexion. La navigation responsive regroupe Pilotage, Cycles et bilans, Calendrier Agile, Points d'attention et Reportings ; la rubrique Administration des utilisateurs n'est visible que pour le rôle `admin`.

L'en-tête de contexte affiche uniquement les **noms de produit et d'équipe** et le mode de travail issus de `smn_installation`, `smn_product` et `smn_team`. Les données sont préparées sur le serveur par `src/server/dashboard/read.ts` : aucune requête de comptes ou données individuelles, aucun chargement de données métier depuis le navigateur.

Le tableau de bord affiche le premier cycle absent comme un **état vide utile**. Il ne calcule pas automatiquement de Sprint ou période Kanban, ni des KPI à 0. Les objectifs, métriques, événements, points d'attention et rapports apparaissent comme non renseignés ou non disponibles, car leurs interfaces de lecture métier ne sont pas encore développées. Les rubriques sont des ancres vers des sections de la page, **pas des liens trompeurs** vers des écrans inexistants.

## Décisions de cette itération

- Utiliser Bootstrap 5, complété par `src/app/dashboard.css`, pour une disposition lisible sur PC et mobile.
- Conserver **le même tableau de bord pour Administrateur et Utilisateur**. Les seules différences sont les accès à l'administration, autorisés côté serveur et protégés dans les routes dédiées.
- Ne pas ajouter de table, migration, cycle fictif, objectif factice, alerte calculée ou générateur de rapport prématuré.
- Rester conforme à la séparation des risques et des bilans : aucune action du tableau de bord ne modifie une fiche métier.

## Critères d'acceptation et limites

| Critère | État |
|---|---|
| AC1 : produit et équipe réels, état vide honnête | Réalisé pour une installation sans cycle. L'action de création à la demande demeure à relier à l'US de gestion des cycles. |
| AC2 : distinguer cycles en cours et bilans non clôturés | Contrat prévu ; impossible à vérifier de bout en bout tant que le stockage des cycles n'existe pas. |
| AC3 : objectifs, KPI, réunions réellement disponibles | Affichage non renseigné réalisé. Les futurs producteurs se raccorderont au contrat de lecture. |
| AC4 : alerte sans mutation | Aucun message n'est présenté comme une véritable alerte. Le tableau de bord ne déclenche aucune mutation métier. |
| AC5 : données collectives seulement pour Utilisateur | Lecture serveur limitée aux tables installation/produit/équipe ; les tests de sécurité vérifient l'absence de données individuelles et de lien admin. |

**Validation utilisateur attendue :** lisibilité du menu, hiérarchie du contexte produit/équipe, densité des cartes, comportement sur mobile. Aucun point de métier dépendant des cycles n'est déclaré terminé sur la seule base de cette itération.

## Tests et références

- `tests/dashboard-read.test.ts` : structure du contrat collectif, modes Scrum/Kanban, absence de KPI fictif, comportement en cas de contexte invalide.
- `scripts/verify-http-ci.mjs` : contrôles HTTP sur base PostgreSQL CI ; vérification de l'en-tête contextuel, absence d'e-mails individuels et accès utilisateur non administrateur.
- [Vérification I0](https://github.com/JeanLamora75/SMN/actions/workflows/verify-i0.yml) : s'appuyer sur une **exécution terminée et réussie** avant toute affirmation de couverture complète.

Architecture de référence : `_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/parcours-utilisateur-ergonomie.md`.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.

**Implication spécifique :** La maquette UX remplace la disposition du pilote SMN-21 **en tant que cible approuvée**, mais ne signifie pas que les données métier, les actions ou les indicateurs soient codés. Préserver l'état vide honnête et les tests avant livraison.


## Refonte UX validée — Lot 1 : structure et navigation (21/10/2026)

**Périmètre de code :** `src/app/app/private-shell.tsx`, `src/app/app/layout.tsx`, `src/app/app/private-navigation.tsx`, `src/app/dashboard.css`, `src/i18n/fr.json`, `src/i18n/en.json`.

- Le header privé utilise la largeur totale : marque SMN, commandes de menu, équipe réellement enregistrée, Sprint/période, recherche et compte. Le sélecteur d'équipe est désactivé au MVP monoéquipe ; celui du cycle affiche explicitement « Aucun cycle créé » faute de producteur métier ; la recherche est également indisponible, sans contrôle trompeur.
- Sidebar sous le header, déployée par défaut sur PC, repliée à 64 px via bouton ; les libellés restent disponibles via focus et survol des icônes. Sur mobile, le menu est déplié dans le flux de la page, refermable au bouton, à la navigation ou à Escape, avec restitution du focus.
- Contenu privé sans `max-width:1510px`. Conserve les styles de couleurs de `src/app/appearance.css` et les palettes ocean, forest et violet, clair et sombre.
- Les routes et les droits existants ne sont pas modifiés. Les liens des fonctionnalités futures restent non activés ; aucune création de cycle, migration SQL ou mutation métier.
- Le contenu métier de la page d'accueil demeure provisoirement celui du pilote ; bandeau Sprint, métriques et colonnes appartiennent aux lots 2 et 3.

**Vérifications prévues :** `tests/dashboard-shell-ux.test.ts`, `tests/responsive-accessibility.test.ts`, contrôle i18n FR/EN, lint, typecheck, build et CI `verify-i0.yml`. La recette utilisateur doit vérifier le comportement au clavier, à 320/375/768/1024/1440 px, au zoom 200 % et sur les six variantes de thème/palette ; aucun test statique ne prouve à lui seul une conformité WCAG.


**Résultats de contrôle au 21/10/2026 :** 12 assertions de cohérence sur le contenu réel des fichiers GitHub réussies (structure, accès, états désactivés, CSS, i18n et sécurité) et 26 vérifications source complémentaires réussies. Catalogues FR/EN : 462 clés communes sans écart ni paramètre de substitution manquant. Les workflows GitHub Actions de la PR #26 ont été déclenchés mais ont échoué en 2 secondes **sans runner attribué et sans aucune étape exécutée** sur Linux/Windows : [Vérification I0](https://github.com/JeanLamora75/SMN/actions/runs/39580664197). Aucun résultat de `pnpm test`, lint, typecheck ou build n'est donc revendiqué ; revue d'exécution et recette navigateur restent à effectuer.


## Refonte UX — Lot 2 : bandeau cycle et indicateurs (21/10/2026)

**Périmètre livré :** `src/app/app/cycle-overview.tsx` (nouveau composant de présentation), `src/app/app/page.tsx`, `src/app/dashboard.css`, et catalogues FR/EN.

- Le grand bandeau sombre et les anciennes cartes génériques Objectifs/Indicateurs sont remplacés par un **bandeau Sprint ou Période Kanban clair**, pleine largeur utile, avec véritable nom de produit et d'équipe, un lien autorisé vers leur fiche, et les emplacements de dates, statut et objectifs.
- Sur l'installation pilote sans cycle, titre **« Aucun cycle créé »**, dates indisponibles, objectifs non renseignés et aucune action de création trompeuse. Aucun nom, date ou état de cycle n'est simulé.
- **Quatre cartes KPI** : capacité prévue/réelle en J/H, Story Points **initialement engagés**/réalisés en SP, tickets **initialement engagés**/réalisés, puis jours **ouvrés restants**. Les trois premières cartes séparent leurs deux lignes par une bordure fine ; les données absentes affichent « Non renseigné » et « Aucun cycle précédent ». Le compteur affiche « Non calculable » jusqu'à disponibilité de dates fiables et arbitrage complet sur inclusion du jour courant/fuseau. Semaine lundi–vendredi rappelée ; **aucune formule de décompte n'est inventée**.
- Aucune carte « Avancement global », aucune comparaison numérique fictive, aucun calcul de capacité ou de performance individuelle. Les futures lectures métier devront respecter leur propre provenance et le contrat historique.
- Grille **4/2/1** selon la largeur du conteneur réel (`@container`), en conservant les variables des thèmes et palettes SMN-24.
- Les anciennes sections Calendrier, Points d'attention, Reporting restent disponibles à titre d'états vides avant leur conversion en quatre colonnes au lot 3. Les tâches facultatives de configuration sont déplacées après les zones de pilotage, sans suppression ni mutation.

**Tests ajoutés :** `tests/dashboard-cycle-overview.test.ts` (rendu serveur FR/EN, quatre cartes, absence de faux chiffres), `tests/dashboard-cycle-overview-source.test.ts` (insertion et structure CSS). Tests habituels et CI à vérifier séparément : `pnpm i18n:check`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm build`.

**Statut fonctionnel :** présentation du cas sans cycle ; la lecture des véritables cycles, les métriques, la clôture et la comparaison historique restent dépendantes de leurs User Stories. Ne pas déduire une validation métier des seuls contrôles de présentation.

**Vérification du lot 2 — 21/10/2026 :** revue de code par lecture des 9 fichiers de la PR #27, 11 contrôles statiques exécutés sur les sources de branche et parité de **486 clés** FR/EN sans différence de clé, de paramètre de traduction ou de référence de traduction. Aucun test de rendu ou d'intégration n'a été exécuté : [Vérification I0 #318](https://github.com/JeanLamora75/SMN/actions/runs/39582392261) et [Paquet Windows #133](https://github.com/JeanLamora75/SMN/actions/runs/39582392283) ont échoué avant l'allocation des runners (`runner_id=0`, `steps=[]`). **Ne pas interpréter ce blocage d'infrastructure comme un succès de `pnpm test`, lint, typecheck, build ou recette graphique.**
