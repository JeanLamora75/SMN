---
story: SMN-21
status: in-progress
implementation: first-ux-iteration
language: fr
date: 2026-10-20
---
# SMN-21 — First dashboard iteration

## Intent vérifié
Lire l'identité du produit, de l'équipe et le mode réellement enregistrés ; présenter une première expérience post-connexion sans faux cycles ni fausses métriques ; maintenir la confidentialité du profil Utilisateur. Le périmètre d'AC2/AC3 continuera à s'enrichir avec les Stories productrices de cycles et indicateurs.

## Artefacts modifiés
- `src/server/dashboard/read.ts` — contrat collectif en lecture seule, champs personnels absents.
- `src/app/app/page.tsx` — interface responsive, sections et navigation.
- `src/app/dashboard.css`, `src/app/layout.tsx` — présentation.
- `tests/dashboard-read.test.ts`, `scripts/verify-http-ci.mjs` — contrôles.
- `docs/TABLEAU-DE-BORD-SMN-21.md` — recette et limites.

## Restrictions
Aucune création automatique de cycle ni mutation métier. Aucune vérification d'AC2 avec données de cycles n'est possible avant la livraison de leur modèle et interfaces. Les modules non livrés sont identifiés comme futurs. Les deux seuls profils restent admin et user.

## Workflow
Implémentation incrémentale via connecteur GitHub, publication directe sur main comme décidé pour le pilote. La commande BMAD de rendu du skill ne peut pas être exécutée depuis le seul connecteur GitHub ; ne pas assimiler cette adaptation à l'exécution complète du workflow officiel. La validation complète attend le retour ergonomique utilisateur et les futurs producteurs.


## Extension — refonte UX, lot 1 (21/10/2026)

**Contrats :** `DESIGN.md` et `EXPERIENCE.md` approuvés le 21/10/2026. Objectif du lot : infrastructure UI pleine largeur, header et sidebar, sans réinterpréter l'UX.

**Tâches de développement :**
- [x] Coque privée partagée, header pleine largeur et sélecteurs natifs respectant le contexte réel.
- [x] Navigation latérale rétractable et version mobile, focus clavier et fermeture Escape.
- [x] Messages FR/EN centralisés, réutilisation des tokens de thèmes.
- [x] Tests de structure ajoutés et contrôle de recette initial mis à jour.
- [ ] CI GitHub Actions exécutée et analysée.
- [ ] Publication après vérification sur `main`.

**Critères lot 1 :** UX-TDB-01 (layout), UX-TDB-02 (menu), UX-TDB-03 partiel (aucun cycle fictif), UX-TDB-14 (structure responsive) et UX-TDB-15 partiel (navigation clavier + FR/EN). Les AC métier SMN-21 ne sont pas déclarés satisfaits par cette mise en page.

**Écarts et suites :** la mise en page de la page `/app` elle-même (bandeau Sprint et cartes) est programmée au lot 2. Les colonnes et la configuration non dominante relèvent du lot 3. Cycles, recherche globale et préférences persistées restent indisponibles.

**Adaptation BMAD :** lecture du skill Amelia et du workflow Build via GitHub ; ce contexte de développement via connecteurs ne permet pas de prétendre que la commande locale de rendu `uv run ...render_skill.py` a été exécutée. Travail jalonné par ce document, tests et PR vérifiables.

**Contrôles constatés :** vérifications source exécutées sur les contenus de branche (12+26 assertions, JSON FR/EN parité 462 clés, aucune variable manquante). Workflow [I0 #315](https://github.com/JeanLamora75/SMN/actions/runs/39580664197) lancé, mais refus d'exécution avant allocation d'un runner Linux ou Windows (jobs sans étapes, durée 2 secondes). Tests `pnpm` et recette navigateur **non exécutés** ; ne pas marquer les AC d'intégration comme validés. Publication technique à tracer par PR #26, validation qualité restant ouverte.


## Extension — UX cockpit lot 2 (21/10/2026)

**Intention approuvée :** réaliser le bandeau Sprint/Période et les quatre KPI de `DESIGN.md` / `EXPERIENCE.md` sans modifier le référentiel UX ni créer de producteurs de données inexistants. La Story SMN-21 reste `in-progress`.

**Code Map :**
- `src/server/dashboard/read.ts` : projection serveur collective, `currentCycle: null`, objectifs et métriques absents.
- `src/app/app/cycle-overview.tsx` : composant de rendu côté serveur du contexte réel et des états KPI indisponibles.
- `src/app/app/page.tsx` : maintien de la connexion, permissions et route de retour ; bandeau prioritaire avant événements, registres, reporting, puis configuration facultative.
- `src/app/dashboard.css` et `src/app/appearance.css` : layout par conteneur, couleurs sémantiques existantes ; `src/i18n/fr.json` / `en.json` : tous les libellés.
- `tests/dashboard-cycle-overview.test.ts`, `tests/dashboard-cycle-overview-source.test.ts` : contrats de rendu, sécurité des états vides, responsive.

**Critères testables immédiatement :**
- [x] Bandeau UX, nom produit/équipe réels, objet Sprint vs Kanban et lien équipe autorisé.
- [x] Trois cartes métriques doubles avec labels des engagements initiaux ; quatrième carte jours ouvrés.
- [x] Aucune valeur zéro ou pourcentage fictif ; comparaison précédente indisponible ; aucune carte Avancement global.
- [x] Grille préparée en quatre/deux/une carte(s) selon la largeur du conteneur.
- [x] Préservation des thèmes, traduction FR/EN et fonctionnement des rôles par réutilisation du garde serveur.
- [ ] Exécution effective des tests automatisés et des scénarios navigateur documentée.
- [ ] Raccordement des véritables cycles / sources de capacité, SP, tickets et historiques (futures Stories).

**Bloquants connus :** modèle cycle absent ; inclusion du jour courant/fuseau non arbitrée ; pas de référence historique fiable. Aucun champ SQL ajouté, aucune migration et aucun calcul nouveau. Le lot 3 constituera les quatre colonnes métier.

**Workflow BMAD adapté :** plan précédemment approuvé, modifications via branche/PR et connecteur GitHub ; le `render_skill.py` local n'est pas présenté comme exécuté. Les résultats réels de vérification figurent dans l'historique GitHub/Jira et doivent être complétés avant toute qualification « terminé ».

**Vérification du lot 2 — 21/10/2026 :** revue de code par lecture des 9 fichiers de la PR #27, 11 contrôles statiques exécutés sur les sources de branche et parité de **486 clés** FR/EN sans différence de clé, de paramètre de traduction ou de référence de traduction. Aucun test de rendu ou d'intégration n'a été exécuté : [Vérification I0 #318](https://github.com/JeanLamora75/SMN/actions/runs/39582392261) et [Paquet Windows #133](https://github.com/JeanLamora75/SMN/actions/runs/39582392283) ont échoué avant l'allocation des runners (`runner_id=0`, `steps=[]`). **Ne pas interpréter ce blocage d'infrastructure comme un succès de `pnpm test`, lint, typecheck, build ou recette graphique.**


## Extension UX — lot 3, colonnes opérationnelles (21/10/2026)

**Cadrage validé :** quatre colonnes fixes Obstacles, Risques, Événements et Notes/Alertes ; jusqu'à 5 fiches chacune à terme ; actions « Voir tout » et « Ajouter » conditionnées aux fonctionnalités existantes, aux permissions et à l'état du cycle. Aucun filtre, score, tri métier ou instantané historique n'est réinventé.

**Code Map :**
- `src/app/app/operational-overview.tsx` : présentation des quatre colonnes en état de source **indisponible**, pictogrammes sémantiques, libellés d'actions non cliquables. Aucune simulation d'occurrence.
- `src/app/app/page.tsx` : ordre `CycleOverview`, `OperationalOverview`, configuration facultative et footer. Garde d'accès serveur, lecture collective et droits de configuration conservés.
- `src/app/dashboard.css` : grille responsive liée au conteneur (4/2/1), variables de thème et couleur d'avertissement Bootstrap.
- `src/i18n/fr.json`, `src/i18n/en.json` : libellés complets centralisés.
- `tests/dashboard-operational-overview.test.ts` : preuve attendue de rendu statique et de structure des colonnes.

**Réalisation technique :**
- [x] Quatre panneaux et libellés cohérents ; ordre validé.
- [x] Message historique exact « Aucun éléments à ce jour » et description honnête de source indisponible.
- [x] Indisponibilité des compteurs, « Voir tout » et « Ajouter » sans action fictive.
- [x] Différenciation visuelle/textuelle des types Note et Alerte ; pas d'alerte de configuration courante injectée au passé.
- [x] Grille en 4/2/1 par largeur utile et réemploi des palettes et traductions.
- [x] Test de rendu/source ajouté, exécution CI et recette navigateur **à vérifier**.
- [ ] Producteurs métier, filtres et tris, limite de cinq fiches, statuts/permissions par fiche, actions et instantanés historiques (Stories ultérieures).

**Sécurité / absence de régression visée :** API `readCollectiveDashboard` non modifiée ; aucun nouveau droit, table, migration, endpoint, action ni donnée individuelle. Les panneaux vides n'affirment jamais « 0 risque » à partir d'une absence de producteur.

**Adaptation BMAD :** réalisation via GitHub/connecteurs ; script de rendu du workflow BMAD non exécuté. Ne pas confondre tests écrits, contrôles statiques, et tests effectivement lancés.


**Revue du lot 3 et limite CI — 21/10/2026 :** PR [#28](https://github.com/JeanLamora75/SMN/pull/28). **14 contrôles statiques** effectués sur les fichiers de la branche (quatre colonnes, ordre, libellés, absence de liens fictifs et de chiffres inventés, maintien des garde-fous serveur, grille responsive et thèmes). Parité des **505 clés FR/EN** et paramètres de substitution vérifiée sans divergence. Le test de rendu `tests/dashboard-operational-overview.test.ts` a été ajouté mais **pas exécuté**. GitHub Actions [I0 #322](https://github.com/JeanLamora75/SMN/actions/runs/39583828423) et [Windows #137](https://github.com/JeanLamora75/SMN/actions/runs/39583828539) échouent avant attribution d'un runner : `runner_id=0`, `steps=[]`. L'environnement d'exécution local ne permet pas non plus de récupérer la branche distante (résolution DNS indisponible). **Pas de résultat probant de `pnpm test`, lint, typecheck, build ni de recette navigateur.** SMN-21 ne peut pas être clôturée sur ces seuls contrôles.


## Extension UX — lot 4 : recette transverse et corrections (21/10/2026)

**Contrats source :** `DESIGN.md` et `EXPERIENCE.md` approuvés. La Story SMN-21 reste `in-progress` jusqu'aux preuves d'exécution et aux livraisons métiers.

**Défauts de structure identifiés et corrections :**
- Header étroit : Équipe / Sprint-Période / Recherche empilés à largeur CSS ≤480 px au lieu de colonnes comprimées.
- Sidebar desktop repliée : éviter de rendre des rubriques en bas du menu inatteignables à cause d'un conteneur sticky à hauteur fixe ; autoriser le défilement normal du document en mode réduit.
- Retour desktop depuis mobile : réinitialiser l'ouverture mobile afin de ne pas réafficher plus tard un menu ouvert à l'insu de l'utilisateur.
- Sélecteurs indisponibles : ajouter des descriptions programmatiquement associées pour que le motif de désactivation ne dépende pas du survol de la souris.
- Transition mobile avec sidebar desktop repliée : restaurer le mode bloc des groupes, la lisibilité du statut « À venir » et le scroll vertical.

**Tests / QA :**
- [x] Nouveau fichier `tests/dashboard-ux-lot4-accessibility.test.ts`, incluant une vérification programmatique des couleurs CSS pour les six thèmes.
- [x] Plan de recette `docs/RECETTE-UX-TDB-SMN-21.md` avec cases non cochées.
- [x] Contrôle de sources indépendant (12 assertions), 505 clés FR/EN cohérentes ; contrastes mesurés de 4,74:1 au minimum pour les associations étudiées.
- [ ] Suite `pnpm test`, lint, typecheck, build et navigation HTTP Windows/Linux : **pas encore exécutées avec succès**.
- [ ] Recette manuelle de l'accessibilité et des breakpoints au navigateur, lecteur d'écran inclus.
- [ ] Raccordement effectif des producteurs métier, historiques, droits sur les mutations et préférences persistées (Stories futures).

**Limitation BMAD :** l'environnement par connecteurs ne permet pas d'affirmer l'exécution du rendu `uv run ...render_skill.py`. Les validations source sont réelles mais ne remplacent pas le workflow exécutable, ni une certification WCAG.


**Résultat CI observé sur la PR #29 — 21/10/2026 :** [Vérification I0 #326](https://github.com/JeanLamora75/SMN/actions/runs/39585419874) et [Paquet Windows #141](https://github.com/JeanLamora75/SMN/actions/runs/39585419871) ont tous deux échoué **avant démarrage des tests** : jobs `windows-smoke`, `linux-postgres` et `portable-windows` avec `runner_id=0` et `steps=[]`. Le statut GitHub « failure » ne constitue pas un résultat de `pnpm test`, `lint`, `typecheck` ou `build`. La cause exacte de non-attribution des runners n'est pas identifiée via les journaux disponibles. Les **16 contrôles statiques** indépendants et le calcul des 30 contrastes ont été exécutés sur les sources ; le reste de la matrice navigateur doit être effectué sur Windows.
