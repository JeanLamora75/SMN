# SMN — Contrat BMAD UX d'harmonisation des pages Paramètres (Sally → Amelia)

**Date :** 12 novembre 2026  
**Statut :** Proposition UX à valider fonctionnellement ; aucun développement ni recette réalisé par ce contrat.  
**Émetteur :** Sally — UX Designer, BMAD Method v6.12.4  
**Destinataires :** Amelia (développement), Winston (revue architecture si changement transversal), John (backlog si demandé).  
**Branche de référence examinée :** GitHub `JeanLamora75/SMN`, `main`.

## 1. Intention et références visuelles

L'utilisateur considère **Paramètres > Indicateurs** et **Paramètres > Styles graphiques** comme **globalement conformes** à son attente. Les autres pages du menu Paramètres doivent converger vers leur qualité de présentation et leurs conventions d'interaction, **sans reproduction mécanique** de fonctions non pertinentes.

Références normatives d'implémentation :

1. `src/app/app/admin/settings/indicators/page.tsx`, `settings-tabs.tsx`, `indicator-settings-cockpit.css` et `src/app/app/admin/indicators/catalog-client.tsx` : titre/description, pleine largeur, panneau de contrôle, onglets, recherche/filtres, cartes/liste, création/modification par modale lorsqu'adaptée.
2. `src/app/app/admin/settings/reports/charts/page.tsx`, `style-gallery.tsx`, `style-editor.tsx`, `style-gallery.css` : galerie responsive, cartes visuelles, distinction modèles/personnalisés, aperçu fidèle, éditeur deux colonnes et barre d'actions, états chargement/erreur/succès.
3. `src/lib/settings-catalog.ts` et `src/app/app/admin/settings/settings-catalog-view.tsx` : **six familles actuelles**, visibilité par droits et mode, liens réels, préférence Cartes/Liste du portail.
4. `docs/UX-REFERENTIEL-BMAD.md` et contrats UX antérieurs : conserver les invariants métier et d'accessibilité. L'ancien contrat de portail du 23/10/2026 (4 familles / 14 rubriques) est **historique** ; il ne doit pas ramener le catalogue actuel en arrière.
5. Tous les textes de production via le système i18n FR/EN centralisé. Les libellés en dur observés dans certains composants existants sont des dettes à corriger, **pas des modèles à répliquer**.

**Périmètre :** présentation et ergonomie de toutes les destinations actuelles du menu Paramètres, sauf les deux références (à préserver, avec seulement correctifs transversaux légers validés). Les pages métiers extérieures atteintes depuis Paramètres sont incluses pour leur **enveloppe UX**, non pour une réécriture de leurs règles.

**Décision UX complémentaire validée le 12/11/2026 :** aucun chemin de fer/fil d’Ariane/breadcrumb, ni bouton de retour au portail Paramètres dans l’en-tête de **toutes** ces pages, y compris les deux références. La navigation latérale de SMN conserve l’accès au portail. Les contrôles Annuler/Retour propres à une sous-opération (éditeur, formulaire, dialogue) restent autorisés et nécessaires.

## 2. Inventaire vérifié du menu actuel

Source : `src/lib/settings-catalog.ts`. **19 entrées réparties en six familles**, visibles selon rôle/mode ; deux références et une entrée non développée. Les routes ci-dessous sont des chemins du produit, pas une preuve de recette navigateur.

| Famille | Entrée | Route réelle | État et intention UX |
|---|---|---|---|
| Application | Informations/préférences générales | `/app/admin/settings/general` | Harmoniser écran et sous-sections Général/Langue/Apparence ; URL avec fragments conservée |
| Application | Langues | `/app/admin/settings/general#settings-language` | Accès ciblé au même formulaire, pas de deuxième configuration |
| Application | Apparence | `/app/admin/settings/general#settings-appearance` | Accès ciblé au même formulaire et préservation thèmes/palettes |
| Organisation | Équipes | `/app/admin/settings/teams` | Catalogue/liste et édition contextuelle ; statut partiel conservé |
| Organisation | Entreprises | `/app/admin/companies` | Catalogue et création/modification, archivage/réactivation |
| Organisation | Cadence | `/app/admin/scrum-cadence` ou `/app/admin/kanban-cadence` | Formulaire compact + récapitulatif, dépend du mode |
| Pratiques | Cérémonies et modèles | `/app/admin/settings/ceremonies` | Liste de modèles, détail/édition, uniquement Scrum |
| Pratiques | Règles de capacité | Pas de route | **Planifié : ne pas créer de faux écran ni de pseudo-éditeur** |
| Pratiques | Indicateurs | `/app/admin/settings/indicators` | **Référence UX, hors refonte** |
| Pratiques | Registres | `/app/admin/settings/registries` | Deux sections : mise en évidence automatique, alertes d'échéance |
| Pratiques | Liens | `/app/admin/settings/links` | Inventaire filtrable et catégories, préserver la portée transverse/équipe |
| Calendrier | Jours ouvrés | `/app/admin/settings/working-days` | Horaires/fuseau et pause déjeuner, uniquement Scrum |
| Calendrier | Pays et jours fériés | `/app/admin/settings/holidays-closures#holidays` | Catalogue pays/fériés, import et années conservés |
| Calendrier | Fermetures d'entreprise | `/app/admin/settings/holidays-closures#closures` | Liste/éditeur de fermetures, droits renforcés |
| Calendrier | Catégories d'absences | `/app/admin/absence-categories` | Liste, états et éditeur, historique non altéré |
| Rapports | Styles graphiques | `/app/admin/settings/reports/charts` | **Référence UX, hors refonte** |
| Administration | Utilisateurs et habilitations | `/app/admin/users` | Liste et création/édition de droits, sécurité prioritaire |
| Administration | Sécurité et sessions | `/app/security` | Mot de passe + phrase de récupération administrateur ; ne pas inventer la gestion des sessions |
| Administration | Maintenance | `/app/admin/settings/maintenance` | Trois onglets selon droits : mises à jour hors ligne, sauvegardes/restauration, journal d'audit |

**Important :** le menu fournit 19 *entrées*, mais Général/Langues/Apparence se partagent un formulaire et Pays/Fériés/Fermetures une page à onglets. Ne pas compter chaque carte comme un écran autonome. Les liens vers des sections doivent continuer à ouvrir la bonne section.

## 3. Système UX cible — exigences communes

### UX-COM-01 — Cadre de page
Sur toutes les pages cibles : `container-fluid`, largeur exploitable à droite de la sidebar, marges cohérentes, en-tête de référence avec sur-titre de contexte, titre H1 unique et sous-titre court expliquant l'usage. **AUCUN chemin de fer, fil d’Ariane, breadcrumb ou lien « Retour à Paramètres » en tête des pages : la navigation principale/latérale suffit.** Supprimer ces éléments des deux pages références également, sans toucher à leurs fonctionnalités. Les boutons « Annuler » internes à un éditeur ou une modale, eux, sont conservés. Éliminer les `container` et `maxWidth:900/740` hérités **au niveau de l'enveloppe** ; conserver une largeur de lecture raisonnable **pour un formulaire compact** à l'intérieur d'un panneau centré. Ne jamais étirer un champ unique sur toute la largeur.

### UX-COM-02 — Hiérarchie, composants et actions
Reprendre les tokens/éléments `smn-panel`, fonds, bordures, arrondis, typographie, boutons primaires/secondaires, espacements et états des deux références, sans copier leurs couleurs codées en dur lorsque le thème SMN impose des tokens. Zone de filtres/commandes avant le contenu ; action principale clairement identifiable ; actions destructrices distinctes, confirmations adaptées ; formulaire complexe dans une page dédiée ou une modale accessible suivant taille ; jamais de CRUD hétérogène sous une liste sans séparation visuelle claire.

### UX-COM-03 — Motifs à appliquer seulement s'ils servent l'usage
- **Catalogue d'objets** (équipes, entreprises, cérémonies, catégories, utilisateurs, pays et liens) : recherche/filtres si utiles, compteur/état vide, vue **Liste et Cartes uniquement si les deux sont réellement utiles** ; vue mémorisée *par rubrique* si introduite ; une seule action principale ; éditions en modales centrées pour petits formulaires et pages/panneaux dédiés si formulaire dense ou critique.
- **Formulaire de configuration** (général, cadence, horaires, registres, sécurité) : sections/onglets clairs, résumé des valeurs, aide contextuelle, états non enregistrés/chargement/erreur/succès ; **pas de toggle Cartes/Liste artificiel**.
- **Maintenance et opérations sensibles** : onglets explicites, informations de risque, progression et résultat vérifiables, confirmations fortes ; pas de faux aperçus et pas de suppression des garde-fous.
- **Styles graphiques** : la galerie et l'éditeur sont la référence pour des objets visuels, pas une obligation de mettre une image sur les pages métier.

### UX-COM-04 — Navigation
Sans chemin de fer ni fil d’Ariane sur aucune page des Paramètres. Les onglets doivent conserver et respecter les fragments d'URL actuels (`#settings-language`, `#settings-appearance`, `#holidays`, `#closures` et autres fragments existants). Navigation clavier Arrow/Home/End quand rôle `tablist` ; `aria-controls`, `aria-selected`, focus visible ; pas d'onglet masqué impossible à atteindre. Préserver favoris et liens directs. Les listes de liens ne doivent pas faire croire à une autorisation inexistante.

### UX-COM-05 — Données et sécurité invariantes
**Aucun changement de schéma ou logique métier** du seul fait de cette harmonisation. Réutiliser endpoints, permissions serveur, validations, audit, révisions optimistes, historiques, règles Scrum/Kanban, entreprise/équipe, isolation données, restauration sécurisée Epic 2 et capacité actuelle. Les actions modifiant données, comptes, sécurité, archives, sauvegardes ou mises à jour conservent toutes leurs vérifications. Les indicateurs et exports Office ne changent pas de calcul ni de format.

### UX-COM-06 — Traduction, responsive, accessibilité
FR/EN par clés du catalogue i18n (aucune nouvelle chaîne en dur), mode clair/sombre et palettes existantes, desktop/tablette/mobile ; préférer grille 3/2/1 pour objets avec aperçus et 4/2/1 pour petites cartes selon densité. États vides, filtres sans résultats, chargements, erreurs réseau, conflit de version, accès lecture seule et confirmation accessibles. Zoom 200 %, absence d'overflow horizontal imprévu, focus/étiquettes explicites. Ne pas faire reposer le statut sur la seule couleur.

### UX-COM-07 — Non-régression de la page de référence
Indicateurs et Styles graphiques restent fonctionnellement inchangés. Ne pas imposer de composant commun qui écraserait leurs présentations. Toute consolidation vers un composant partagé se fait seulement si elle respecte les deux références et passe leur recette de non-régression.

## 4. Contrats spécifiques par destination

### UX-PAR-01 — Général, langues, apparence
**Fichiers :** `settings/general/page.tsx`, `settings/settings-form.tsx`. Conserver les trois sections existantes et les liens profonds. Enveloppe cockpit + navigation visuelle des sous-sections + panneau de configuration de largeur adaptée. Réunir la commande Enregistrer/Actualiser et l'indicateur de brouillon ; conserver immutabilité mode/produit, pays, thème, palette et locale. Recette : chaque carte du portail ouvre exactement sa section, rechargement compris, sans écrasement d'un brouillon.

### UX-PAR-02 — Équipes
**Fichiers :** `settings/teams/page.tsx`, `teams-settings.tsx`. Transformer la disposition liste latérale/formulaire en catalogue lisible sur grand écran, avec sélection et détail clair ou édition par panneau. Montrer statut actif/archivé, mode, nom, produit et droits ; ne jamais dissimuler les actions archivage/réactivation derrière une jolie carte. Protéger les brouillons et préservations historiques d'affectation.

### UX-PAR-03 — Entreprises
**Fichiers :** `companies/page.tsx`, `companies-admin.tsx`. Harmoniser un tableau existant et son formulaire intégré avec un catalogue filtrable et édition clairement séparée ; cartes/liste si densité le justifie. Respecter couleur, commentaire, archivage et réactivation ; conserver route et API. Supprimer les chaînes FR codées en dur via i18n.

### UX-PAR-04 — Cadence Scrum/Kanban
**Fichiers :** `scrum-cadence/page.tsx`, `cadence-form.tsx`, `kanban-cadence/page.tsx`, `kanban-cadence-form.tsx`, `cadence-proposal.tsx`. Même cadre visuel, panneaux de paramètres et résumé/explication. Champs et API propres à chaque mode, fuseau IANA et validations existantes. Aucun basculement de mode ni recalcul historique. Aucun toggle Cartes/Liste.

### UX-PAR-05 — Cérémonies
**Fichiers :** `settings/ceremonies/page.tsx`, `sprints/template-form.tsx`. Faire ressortir la liste des modèles, recherche/états si utiles, bouton créer, fiche d'édition structurée. Conserver fréquence, créneau, durée, activation, révision, distinction modèles/occurrences ; ne pas transformer ce catalogue en suppression globale des cérémonies de sprint.

### UX-PAR-06 — Registres
**Fichiers :** `settings/registries/page.tsx`, `registries/automatic-highlights-settings.tsx`, `registries/registry-deadlines.tsx`. Onglets existants maintenus ; sections en panneaux cohérents avec explicitation de l'effet de chaque réglage. Une validation enregistrée visible, erreurs compréhensibles et lecture seule explicite. Ne pas changer les règles d'alerte et seuils.

### UX-PAR-07 — Liens
**Fichiers :** `settings/links/page.tsx`, `links-admin-inventory.tsx`, `category-admin.tsx`, `links-admin-cockpit.css`. Conserver l'inventaire filtrable (équipe, portée, catégorie, recherche) et l'administration des catégories. Séparer visuellement **Inventaire** et **Catégories** (onglets recommandés si navigation et focus maintenus). Pour les liens de portée transverse/équipe, préserver les règles d'accessibilité et de comptage. Garder la modale de suppression avec réaffectation des liens.

### UX-PAR-08 — Jours ouvrés
**Fichiers :** `settings/working-days/page.tsx`, `sprints/work-slots-form.tsx`, `lunch-form.tsx`. Onglets Horaires/Pause déjeuner conservés, formulaires lisibles et résumé des horaires/fuseau ; la semaine ouvrée lundi-vendredi et la logique de capacité restent intactes. Pas de conversion en cartes d'objets.

### UX-PAR-09 — Pays, fériés, fermetures
**Fichiers :** `settings/holidays-closures/page.tsx`, `countries/country-admin.tsx`, `company-closures/company-closures-admin.tsx`. Conserver lien profond et séparation des deux onglets. Pays : recherche, filtrage, année, gestion/calendrier/import existants ; vue liste prioritaire pour densité. Fermetures : contexte entreprise, périodes, édition et états. Ne pas confondre jour férié du pays d'un membre avec absence de toute l'équipe. Permissions de l'onglet Fermetures maintenues.

### UX-PAR-10 — Catégories d'absences
**Fichiers :** `absence-categories/page.tsx`, `absence-categories-admin.tsx`. Catalogue simple avec couleur et statut visibles, actions nouvelles/modifier clairement séparées, formulaire modale ou panneau. Conserver catégories historiques, contrôles et comportement des absences déjà enregistrées. i18n systématique.

### UX-PAR-11 — Utilisateurs et habilitations
**Fichiers :** `users/page.tsx`, `users-admin.tsx`. Présentation proche du catalogue Indicateurs, mais **liste prioritaire** pour rôles, accès et actions ligne ; création dans panneau/modale sécurisée adaptée. Préserver mot de passe initial, comptes, changement de rôle, interdiction d'auto-modification problématique, contrôles des API et messages d'échec. Aucune exposition de secret dans les cartes ou aperçus.

### UX-PAR-12 — Sécurité
**Fichiers :** `security/page.tsx`, `security-form.tsx`, formulaire de changement de mot de passe. Maintenir un parcours personnel accessible aux utilisateurs autorisés et la phrase de récupération réservée à l'admin. Enveloppe pleine largeur, **deux panneaux de largeur de lecture raisonnable**, aide claire et signalisation du caractère sensible. Ne jamais afficher les secrets après sauvegarde, ni introduire de gestion de sessions absente.

### UX-PAR-13 — Maintenance (priorité sécurité)
**Fichiers :** `settings/maintenance/page.tsx`, `maintenance/updates-admin.tsx`, `backups/backups-admin.tsx`, `audit/audit-journal-view.tsx`. Trois onglets accessibles uniquement selon droits : **Mises à jour**, **Sauvegardes/restauration**, **Journal d'audit**. Ne déplacer/modifier aucun garde-fou Epic 2 : analyse avant restauration, conditions d'autorisation, précontrôles, rollback, compatibilité, protection des historiques et comptes. Présenter progression et résultats exacts, distinguer `préparé` / `autorisé` / `appliqué` / `refusé`. Sauvegardes : actions et inventaire séparés, rétention/effacement avec confirmation. Mises à jour ZIP : sélection, vérification, confirmation, résultat. Audit : filtres/lecture, pas de modification. Jamais de succès supposé à partir d'une simple réponse UI.

### UX-PAR-14 — Capacité planifiée
**Fichier :** `src/lib/settings-catalog.ts`. La rubrique sans route reste `planned` et non interactive. Aucun paramétrage fictif ni API improvisée ; une US métier autonome sera nécessaire si son éditeur est demandé.

## 5. Contrats d'intégration pour Amelia

1. **Inventorier avant écriture** les composants réellement réutilisés et leurs tests. Documenter tout écart avec ce contrat.
2. Créer de préférence des **primitives UX légères** : `SettingsPageShell`, `SettingsSectionPanel`, `SettingsCollectionToolbar`, `SettingsFeedback` ; s'appuyer sur CSS/tokens SMN plutôt que des copies de CSS spécifiques. Introduire `SettingsCollectionView` uniquement là où la vue Cartes/Liste sert le besoin. Tous nouveaux composants partagés doivent être testés sur les deux références avant adoption.
3. Ne pas réécrire les endpoints ni migrations pour harmoniser la présentation. Les autorisations serveur sont la référence, pas le masquage visuel.
4. Chaque modification s'accompagne d'une vérification FR/EN, de liens profonds, des états lecture seule/erreur/vide/chargement, et d'un contrôle de non-régression métier.
5. Ne pas utiliser les scripts `uv` sur GitHub ; appliquer BMAD via les fichiers du dépôt et commandes Node/pnpm disponibles. Ne jamais déclarer tests/CI/recette exécutés sans preuve.

## 6. Découpage de livraison proposé (sans tickets Jira créés)

| Lot | Portée | Critère de sortie |
|---|---|---|
| H0 | Inventaire, captures avant et matrice de non-régression | Routes, permissions et API figées comme référence ; arbitrages visuels documentés |
| H1 | Shell commun, titres sans chemin de fer, panneaux, états, i18n | Tous écrans cibles cohérents sans régression des pages références |
| H2 | Général, cadence, jours ouvrés, registres, sécurité | Formulaires et onglets homogènes, liens profonds et brouillons protégés |
| H3 | Équipes, entreprises, cérémonies, liens, catégories d'absence | Catalogues lisibles, actions et édition sans perte de fonction |
| H4 | Pays/fériés/fermetures, utilisateurs | Listes et éditions denses, permissions/historique conservés |
| H5 | Maintenance (sauvegardes, restauration, mises à jour, audit) | Recette sécurité complète, Epic 2 sans régression |
| H6 | Recette transversale et publication | Tests et captures, FR/EN, modes Scrum/Kanban, admin/user, responsive, revue utilisateur |

**Ordre indicatif**, adapter le parallélisme aux dépendances réelles. L'utilisateur validera les choix UX structurants avant toute création/modification Jira et avant refonte des actions sensibles.

## 7. Critères d'acceptation transverses (Given / When / Then)

- **AC-01** Étant sur une entrée active du catalogue, quand j'ouvre sa destination, alors j'obtiens un en-tête cohérent, aucun chemin de fer/fil d’Ariane et les fonctions existantes sans route cassée.
- **AC-02** Étant sur Langues/Apparence ou Fériés/Fermetures, quand je suis un lien avec fragment ou recharge la page, alors la section désignée est active.
- **AC-03** Étant administrateur ou utilisateur standard, quand j'ouvre directement une URL protégée, alors l'API et la page appliquent encore les règles d'accès actuelles ; une modification non autorisée est impossible.
- **AC-04** Étant en Scrum puis en Kanban, alors les rubriques non applicables restent correctement marquées ou masquées conformément au catalogue, et aucun réglage Scrum n'altère Kanban.
- **AC-05** Lorsque j'édite un formulaire et tente de partir, alors le brouillon est sauvegardé ou son abandon clairement confirmé selon la règle actuelle ; aucun succès partiel silencieux.
- **AC-06** Quand je filtre une collection, alors zéro résultat, erreur et chargement restent compréhensibles ; cartes et liste, lorsqu'elles existent, exposent les mêmes actions autorisées.
- **AC-07** Quand je suis en FR/EN, clair/sombre et sur desktop/tablette/mobile, alors les libellés sont traduits, les actions restent accessibles au clavier et la mise en page ne déborde pas.
- **AC-08** Quand un style graphique ou un indicateur est consulté après harmonisation, alors l'interface de référence et ses opérations métier continuent de fonctionner sans changement non approuvé.
- **AC-09** Quand une restauration ou une mise à jour est refusée par ses contrôles, alors l'interface indique le refus et **n'autorise aucune action contournant le verrou**.
- **AC-10** Quand je vérifie un ancien favori ou lien profond, alors il atteint toujours son écran/onglet utile.
- **AC-11** Quand l'utilisateur ouvre « Règles de capacité », qui est planifié, alors aucun faux lien ou écran CRUD factice n'est proposé.
- **AC-12** La livraison indique précisément les tests exécutés, preuves GitHub Actions obtenues et limites de recette Windows, sans confondre conformité UX et validation technique.

## 8. Tests/recette exigés

- **Statique :** typecheck, lint, tests ciblés composants/permissions/i18n/catalogue, build.
- **Comportement :** navigation depuis les 19 entrées selon droits, URLs avec fragments, focus, sauvegarde et conflit, archivages, erreurs réseau, formulaires invalides.
- **Visuel :** captures comparatives avant/après sur grand desktop, 1024 px, 768 px et mobile ; thème clair/sombre, palettes SMN, zoom 200 % ; comparaison avec Indicateurs et Styles graphiques.
- **Métier :** préserver APIs et résultats de chaque page ; priorité régression restauration/sauvegardes/mises à jour et intégrité historique.
- **Preuves :** SHA des commits, résultats réels CI, éventuelle recette locale Windows. Une CI verte ne remplace pas la validation visuelle ni les tests métier sur données réalistes.

## 9. Décisions à valider par le propriétaire fonctionnel

1. Adopter l'harmonisation **par familles d'écrans**, plutôt que des cartes/liste imposées sur toutes les pages.
2. Pour les catalogues adaptés, permettre des modes Cartes/Liste optionnels avec préférence indépendante, sans imposer cette bascule aux pages de formulaires.
3. Conserver la structure actuelle des six familles et toutes les routes ; « Règles de capacité » reste planifiée.
4. Ne réaliser aucun changement métier sur les opérations sensibles, et conserver **Indicateurs** / **Styles graphiques** comme références.

**Statut de livraison documentaire :** contrat rédigé à partir d'une inspection statique des routes, composants et styles GitHub. **Aucun test, aucune CI, aucune capture navigateur et aucune implémentation exécutés**. Les propositions structurantes restent soumises à validation utilisateur avant transmission pour développement.
