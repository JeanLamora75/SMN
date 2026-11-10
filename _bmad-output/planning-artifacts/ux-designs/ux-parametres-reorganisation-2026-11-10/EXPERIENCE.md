---
name: "SMN — Paramètres V2 : architecture et expérience"
status: "final-ux-sous-reserve-recette"
updated: 2026-11-10
owner: "Sally — UX Designer BMAD v6.12.4"
sources:
  - "https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/EXPERIENCE.md"
  - "https://github.com/JeanLamora75/SMN/blob/main/src/lib/settings-catalog.ts"
  - "https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/settings/settings-catalog-view.tsx"
---

# EXPERIENCE.md — Centre Paramètres V2

**Contrat comportemental UX validé quant aux six familles et à la recherche transversale, le 10 novembre 2026.** Le [DESIGN.md](DESIGN.md) associé définit exclusivement l'apparence. Les critères détaillés sont dans [RECETTE-UX.md](RECETTE-UX.md) et les routes dans [CATALOGUE-ET-ROUTES.md](CATALOGUE-ET-ROUTES.md). Ce document **remplace pour le portail** la classification initiale 14 rubriques / 4 familles du 23 octobre. Les autorisations, règles métier et parcours fonctionnels conservés dans les anciens contrats demeurent applicables. Aucune réalisation de code ici.

## Foundation

**Usage :** application web SMN, desktop Windows 11 principalement, aussi tablette et mobile, clavier/souris/tactile ; Scrum Master ou RTE habilité, administrateur principalement. Stack : Next.js, Bootstrap, composants Cockpit Agile, thèmes clair/sombre et palettes existantes. Identité graphique héritée de `{colors.primary}`, `{colors.card}`, `{typography.base}` dans [DESIGN.md](DESIGN.md).

**Problème :** l'ancien portail combine le catalogue `settingsCatalog()` et quatre sections codées dans `settings-catalog-view.tsx` (styles de graphiques, indicateurs, entreprises, fermetures). Les utilisateurs doivent deviner où chercher ; la même destination peut apparaître plusieurs fois.

**Résultat attendu :** un centre de réglages cohérent en **six familles**, une **recherche locale transversale**, une seule carte canonique par fonction et des raccourcis conservant leurs écrans de destination existants. Aucun changement d'une valeur métier par simple consultation de la page.

## Information Architecture

**Page mère unique :** `/app/admin/settings`. Aucun nouvel écran obligatoire pour restructurer le portail ; la sidebar continue à mener ici. `/app/admin/settings/general` reste le formulaire global actuel.

### Six familles, ordre impératif

1. **Application et personnalisation** — Informations générales ; Langues ; Apparence.
2. **Organisation et équipes** — Équipes ; Entreprises ; Cadence des sprints.
3. **Pratiques et référentiels Agile** — Cérémonies et modèles ; Règles de capacité ; Indicateurs ; Registres ; Liens.
4. **Calendriers et disponibilités** — Jours et horaires ouvrés ; Pays et jours fériés ; Fermetures d'entreprise ; Catégories d'absences.
5. **Rapports et visualisation** — Styles de graphiques.
6. **Administration et maintenance** — Utilisateurs et habilitations ; Sécurité et sessions ; Maintenance (Mises à jour, Sauvegardes, Journal d'audit).

**19 entrées canoniques au catalogue V2 avant filtrage.** La gestion des rapports Office ne possède pas de page de **paramétrage de rapports** identifiée par le catalogue actuel : ne pas créer de lien fictif ; préparer seulement l'extensibilité de la famille. Pour la maintenance, un **seul accès existant** dirige vers la page avec ses vrais onglets ; l'utilisateur peut y choisir Sauvegardes ou Audit. La recherche sur « sauvegarde », « audit », « mise à jour » renvoie **Maintenance**, pas trois cartes en double.

**Précisions métier :**
- Langues et Apparence réutilisent `/app/admin/settings/general#settings-language` et `#settings-appearance`, onglets déjà gérés par `settings-form.tsx` ; « Informations générales » va vers `/app/admin/settings/general`, sans cloner les formulaires.
- Entreprises a sa propre destination `/app/admin/companies`. Fermetures d'entreprise existe sous `/app/admin/settings/holidays-closures#closures` ou `/app/admin/company-closures` selon disponibilité/droits réellement vérifiés au développement ; **une seule entrée dans le portail**.
- Pays/jours fériés est accessible via `/app/admin/settings/holidays-closures#holidays` (ou route dédiée vérifiée), pas une seconde carte « Pays » ailleurs.
- Cadence résout `/app/admin/scrum-cadence` ou `/app/admin/kanban-cadence` selon le mode, comme dans le catalogue existant ; jamais pointer Kanban vers Scrum.
- Cérémonies est le **paramétrage de modèles d'équipe**, pas l'onglet Cérémonies d'un sprint ni une liste d'événements.
- Règles de capacité est `planned` dans le code : afficher « À venir », **sans lien** ni faux éditeur.
- Liens donne accès à l'administration actuelle des liens et catégories (`/app/admin/settings/links`) sans créer de doublon « catégories » si la page le propose déjà.
- Indicateurs (`/app/admin/settings/indicators`) est réservé à l'administrateur dans le code de la page. Ne jamais le révéler à un compte non autorisé ; l'adaptation serveur/catalogue doit correspondre à l'autorisation réelle.
- Mises à jour/sauvegardes/audit restent dans `/app/admin/settings/maintenance`, avec les onglets déjà conditionnés aux permissions. La carte d'entrée ne donne pas accès à un onglet non autorisé.

### Entrées, ordre et identifiants

Le catalogue constitue **la source de vérité unique** de toutes les entrées, y compris styles de graphiques, entreprises et indicateurs ; retirer les sections spéciales codées en dur dans la vue. IDs stables, clé de famille, icône, titre/description i18n, destination, mots-clés de recherche FR/EN, condition de mode et de rôle/permission, état de disponibilité. **Ne pas** réutiliser un ID pour une autre fonction.

La recherche masque les familles devenues vides. Hors recherche, une famille vide suite aux droits/mode peut être omise sans créer de vignette vide ; l'ordre des six familles restantes est conservé.

### Droits / modes

- Ne montrer que les fonctions consultables réellement par le compte. Le portail ne confère jamais un droit : chaque page et API conserve sa propre vérification serveur. Préserver les règles des ressources `settings`, `accounts`, `backups`, `audit`.
- Les données sensibles (audit, utilisateurs, sauvegardes) ne doivent pas se retrouver dans les résultats de recherche d'un rôle non autorisé.
- Mode Scrum/Kanban : respecter les destinations compatibles et la disponibilité réelle ; `not-applicable` reste non cliquable. Ne pas basculer l'installation.
- Contexte équipe : aucune attribution implicite à une autre équipe. Les destinations existantes restent responsables des scopes, sélections et permissions internes.
- État de capacité du catalogue doit être déterminé depuis la livraison réelle, non la simple existence de l'URL.

## Voice and Tone

- « Paramètres » / « Configurez votre environnement de travail ».
- « Rechercher un paramètre… », « Effacer la recherche », « Aucun paramètre trouvé », « Effacer la recherche pour afficher toutes les rubriques ».
- Descriptions verbales courtes : « Gérer les modèles de réunions de vos équipes », « Définir la cadence de travail », « Gérer les sauvegardes, les mises à jour et l'audit ».
- États : « Disponible », « À compléter », « À venir », « Non applicable ». Un service momentanément en erreur n'est pas « À venir ».
- Tous les libellés, aliases et descriptions **FR et EN** sont centralisés ; traductions anglaises de longueur variable acceptées.

## Component Patterns

### Barre de recherche transversale

- Champ `type=search`, sans auto-focus forcé. Saisie filtrante **immédiate**, côté client, sans API ni accès aux données métier.
- Filtrer uniquement les **entrées du catalogue déjà autorisées** reçues du serveur. Termes indexés : titre, description et aliases métier (ex. « vacances » → absences, « audit » → maintenance, « dashboard » → indicateurs selon traduction).
- Recherche insensible à la casse et aux accents ; normalisation Unicode `NFD` + retrait des diacritiques, espaces superflus et casse, sans réinterpréter les requêtes comme regex.
- Correspondance par sous-chaîne sur les champs indexés. Plusieurs mots : correspondance **ET** indépendamment du champ, dans les mêmes données d'une rubrique. Pas d'accès aux contenus des réglages.
- Gérer `Escape` pour vider le champ lorsque celui-ci est ciblé et non vide ; bouton de remise à zéro visible pendant la saisie.
- Mettre à jour les six familles **dans la vue active** (Cartes ou Liste). Ne jamais basculer la vue automatiquement à la suite d'une recherche.
- L'interface annonce « x rubriques trouvées » seulement si filtre non vide ; si zéro, état vide + effacement accessible. Un résultat unique affiche sa famille au-dessus.
- Pas de sauvegarde persistante des requêtes ; effacer au rechargement par défaut (pas de conservation de données personnelles).
- Pas de tri par score ni de déplacement des rubriques, afin de garder les repères spatiaux.

### Bascule Cartes/Liste

- Deux boutons icônes en haut à droite, exclusifs, `aria-pressed`, labels explicites, focus clavier.
- Préférence persistante via la clé existante `smn-settings-catalog-view` en `localStorage`. Absence de préférence → Cartes. Aucune collision avec la préférence Équipe.
- Même contenu et même ordre en Cartes et Liste. La recherche est conservée pendant la bascule dans une même visite.

### Tuile, lien et statut

- Une seule surface cliquable par entrée opérationnelle, lien sémantique `<Link>`, sans événement de modification métier sur clic. État `planned` → aucune cible, aucune icône chevron suggérant une navigation.
- La mention `partial` n'empêche pas de cliquer si la destination réelle offre des fonctions utilisables. Ne jamais rediriger vers une page 404 pour afficher un avertissement.
- Les règles de retour sont conservées par les pages enfants ; les pages ayant aujourd'hui un retour manquant nécessitent un correctif de navigation UX ciblé, sans réécrire leur logique métier.

### Catalogue unique

- Composant de vue **purement présentational** : aucune section spéciale « showCompanies » ni listes de cartes codées en dur. Enrichir `settingsCatalog` ou créer un registre partagé équivalent pour les 19 entrées canoniques.
- L'API métier et la configuration globale ne sont pas exposées au client plus largement qu'avant : ne transmettre que les informations du catalogue déjà autorisé.

## State Patterns

1. **Normal :** toutes les entrées permises et applicables s'affichent selon six sections ordonnées.
2. **Mode Liste :** même résultat, une ligne par entrée.
3. **Recherche active :** seules les entrées correspondantes et leurs sections apparaissent.
4. **Aucun résultat :** message non alarmiste et commande de réinitialisation, sans section vide.
5. **Accès limité :** disparition des entrées non autorisées ; accès direct aux pages/API toujours refusé.
6. **Fonction non prête :** état non interactif, libellé explicite, aucun faux lien.
7. **Erreur de consultation d'une rubrique :** l'échec est géré dans la rubrique propriétaire ; la liste Paramètres n'invente pas un statut `planned`.
8. **Chargement / hydratation :** rendu initial stable (Cartes par défaut), transition à la préférence mémorisée sans perdre le focus ni provoquer un saut majeur de page.
9. **Retour depuis une rubrique :** conserver Cartes/Liste. Conserver la recherche seulement pendant la visite en cours, pas au prix d'une URL fragile ni d'un état caché persistant.

## Interaction Primitives

- Tab / Shift+Tab parcourent champ de recherche, effacement, boutons Cartes/Liste et liens actifs. Enter suit le lien. Boutons non interactifs jamais au tab-order.
- Le bouton `Effacer` agit sur le filtre, ne modifie aucun paramètre.
- Le changement de mode n'enregistre que la préférence locale et n'écrit jamais en PostgreSQL.
- Browser back respecte les destinations existantes ; pas de redirection silencieuse imposée vers une catégorie.
- Ne pas ajouter de confirmations à l'ouverture de rubriques (seuls leurs formulaires propriétaires décident de leurs protections de brouillon).

## Accessibility Floor

- H1 unique, H2 pour les six familles, libellés structurés, landmarks `main` et `section aria-labelledby`.
- Champ de recherche avec label accessible persistant ; bouton Effacer explicitement nommé. Résultat `aria-live="polite"` avec fréquence raisonnable ; éviter d'annoncer chaque frappe plusieurs fois.
- Focus visible en Cartes et Liste, indicateur d'état actif non fondé sur couleur seule. Contrastes thèmes et palettes existantes ; zoom à 200 %, navigation mobile sans scroll horizontal.
- Icônes décoratives `aria-hidden` ; toute information de disponibilité disponible en texte.
- Le moteur de recherche ne renvoie pas les rubriques sécurisées filtrées côté serveur.

## Key Flows

**UX-PAR-V2-01 — Camille, Scrum Master : retrouver les Daily.** Camille ouvre Paramètres → saisit « cérémonie » → voit une seule carte dans « Pratiques et référentiels Agile » → ouvre les modèles de cérémonies de l'équipe. Elle n'arrive pas sur les occurrences d'un sprint et conserve son contexte.

**UX-PAR-V2-02 — Alex, RTE : retrouver une mise à jour.** Alex saisit « mise à jour » → une carte « Maintenance » apparaît sous « Administration et maintenance » → il l'ouvre et accède à l'onglet « Mises à jour » déjà existant. Aucune fausse seconde page.

**UX-PAR-V2-03 — Zoé, admin : changer de thème.** Zoé ouvre « Apparence » sous Application → atterrit directement sur l'onglet existant du formulaire général → enregistre ; les protections de modifications non enregistrées sont conservées → elle revient et retrouve la vue Liste choisie auparavant.

**UX-PAR-V2-04 — Morgan, utilisateur à droits limités.** Morgan n'accède pas au portail si ses droits actuels l'interdisent. S'il y accède à l'avenir sous un profil habilité, la recherche n'affiche aucun lien sensible hors de son périmètre, y compris avec les mots « audit » ou « sauvegardes ».

**UX-PAR-V2-05 — Anaïs, gestionnaire multiéquipes.** Elle choisit Équipes dans Organisation → ouvre l'éditeur existant avec ses contrôles de contexte. Le portail n'a pas changé son équipe active et n'introduit aucun changement silencieux.

## Inspiration & Anti-patterns

**Source d'inspiration :** cockpit de configuration à six domaines, non un tableau de bord à KPI. Les cartes matérialisent des destinations, pas des métriques.

**À proscrire :** menu fourre-tout, sections techniques additionnelles hors hiérarchie, doublons Entreprises/Fermetures, trois cartes pour une page Maintenance partagée, redirection vers une fausse configuration des règles de capacité, accès administratif exposé par la recherche, rupture des anciennes URL.

## Responsive & Platform

- Grand desktop : quatre cartes max par ligne, adaptées à la largeur restante après sidebar. Tablette : deux ; smartphone : une. Vue Liste fluide avec repli description/statut si nécessaire.
- Recherche et bascule visibles sur tous formats ; sur mobile, contrôles peuvent passer sur deux rangées sans chevauchement.
- Les libellés anglais peuvent déborder sur plusieurs lignes ; aucune troncature empêchant de comprendre la destination.
- Le comportement et les droits ne dépendent jamais de la taille d'écran.

## Non-objectifs, dépendances, livraison

**Exclusions :** création de paramètres métier inexistants, modification des données du sprint, refonte des formulaires de destination, migration PostgreSQL, modification du rôle utilisateur, intégration Jira/GitHub, nouvelles notifications. Cette tâche organise les accès existants.

**Adaptation BMAD :** mise à jour documentaire du workflow `bmad-ux` en mode manuel (scripts `uv`, memlog et sous-agents non exécutables ici). Les deux contrats sont rédigés depuis les décisions utilisateur et les sources GitHub. Pas de rendu navigateur, revue automatisée, validation de code ou exécution de tests revendiqués. Les questions d'implémentation et le découpage sont documentés pour Amelia dans [CONTRAT-DEVELOPPEMENT.md](CONTRAT-DEVELOPPEMENT.md).
