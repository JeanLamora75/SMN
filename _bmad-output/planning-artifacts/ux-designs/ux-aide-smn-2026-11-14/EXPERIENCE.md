---
name: "SMN — Aide et première configuration : parcours et comportements"
status: "proposition-ux-a-valider"
updated: 2026-11-14
owner: "Sally — UX Designer BMAD v6.12.4"
sources:
  - "docs/UX-REFERENTIEL-BMAD.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-parametres-reorganisation-2026-11-10/EXPERIENCE.md"
  - "src/lib/private-navigation.ts"
  - "src/app/app/dashboard-builder/modal-focus.ts"
---

# EXPERIENCE.md — Centre d'aide, modale contextuelle et checklist

**Décisions utilisateur définitives reçues le 14/11/2026 :** entrée « Aide » dans la sidebar **immédiatement au-dessus de Paramètres** ; aide contextuelle en **modale Cockpit Agile** ; onboarding sous forme de **checklist avec progression**. [DESIGN.md](DESIGN.md) décrit l'apparence ; ce document décrit les comportements. L'implémentation, les routes proposées et les textes non encore vérifiés ne sont pas des fonctionnalités existantes.

## Foundation

- Produit : SMN, application web utilisée principalement sur Windows 11 (desktop), avec adaptations tablette/mobile, clavier/souris/tactile, français et anglais, thèmes et palettes existants.
- Public : Scrum Master, RTE, administrateur et utilisateur habilité. Ne pas supposer les mêmes droits pour tous ni la disponibilité des fonctions Scrum en Kanban.
- Finalité : rendre autonome un utilisateur pour configurer puis utiliser SMN ; le Centre d'aide n'effectue **aucune mutation métier** en consultation.
- Design system : Cockpit Agile + Bootstrap + navigation privée réelle. Tokens visuels dans `{colors.*}`, `{rounded.*}` et `{spacing.*}` de [DESIGN.md](DESIGN.md).

## Information Architecture

### Navigation

1. Ajouter **Aide** comme entrée de la sidebar du shell privé, avant **Paramètres**. C'est une décision d'ordre de navigation, pas une seconde arborescence.
2. URL **proposée** : `/app/help` (à confirmer par Winston selon conventions et conflits éventuels). La route doit rester accessible aux utilisateurs authentifiés ; elle ne révèle pas d'actions administrateur par défaut.
3. Au Centre d'aide : quatre familles **Bien démarrer**, **Configurer SMN**, **Guides par module**, **FAQ et dépannage**.
4. Chaque écran métier doté d'une aide affiche un bouton `Aide` en en-tête ; sa modale ouvre directement l'article lié à **ce contexte précis**, pas systématiquement la page d'accueil.
5. Les articles sont identifiés indépendamment des URLs de pages. Une même rubrique peut être ouverte depuis la recherche, un parcours ou une modale sans doubler le contenu.
6. Navigation vers article complet depuis une modale : ouverture du Centre d'aide sur l'article demandé avec URL partageable ; **préserver les brouillons**, par exemple en ouvrant une nouvelle fenêtre/onglet si quitter l'écran entraînerait une perte. Les contrôles de navigation SMN existants font autorité.

### Couverture documentaire initiale proposée

| Famille | Exemples d'articles attendus | Accès |
|---|---|---|
| Bien démarrer | Initialisation ; premier administrateur ; première équipe ; premier sprint | Selon état d'installation |
| Configurer SMN | Paramètres généraux ; équipes ; cadence ; jours ouvrés ; modèles de cérémonies ; rôles et habilitations | Selon permissions |
| Guides par module | Équipes et membres ; Sprints ; Tickets (CSV) ; Calendrier ; Indicateurs ; Registres ; Rapports ; Sauvegarde et restauration | Documents adaptés au rôle/mode |
| FAQ | Import CSV invalide ; refus d'accès ; données indisponibles ; restauration ; erreurs usuelles | Sans divulguer de données privées |

Les exemples ne constituent pas un catalogue validé du produit ; Camille devra confirmer chaque article avec la fonctionnalité réelle.

## Voice and Tone

- Adresser la consigne à l'utilisateur, à l'impératif poli ou à l'infinitif, une action par étape.
- Éviter les noms de fichiers, SHA, SQL et IDs Jira dans les instructions ordinaires. Les conserver dans la traçabilité documentaire technique, non dans l'aide.
- Ne jamais promettre un résultat qui dépend d'un droit, d'une configuration ou d'un service externe.
- Si le parcours n'est pas disponible : « Cette action n'est pas accessible avec vos droits » ou « Cette fonctionnalité n'est pas disponible pour cette équipe », sans lien mensonger.
- Les chaînes utilisateur et contenus sont disponibles en français et anglais, avec fallback contrôlé et visible en cas d'article non traduit (pas de faux texte anglais).

## Component Patterns

### Aide contextuelle — modale Cockpit Agile (décision validée)

- Clic **Aide** de la page ouvre un dialog portant un titre contextuel `Aide — <nom d'écran>`, résumé, prérequis éventuels, étapes numérotées, résultat attendu, avertissements et « Guide complet ».
- **Fermeture** : `Fermer`, croix, touche Escape ; focus restitué au bouton d'ouverture. Fermer la modale ne modifie aucune donnée ou préférence métier.
- Le focus est placé dans la modale à l'ouverture et reste piégé dans le dialog avec Tab/Shift+Tab ; `role="dialog"`, `aria-modal="true"`, `aria-labelledby` et si utile `aria-describedby`.
- **Pas de double modale** : depuis un formulaire modal existant, l'aide doit être proposée sans ouvrir deux dialogs simultanés ; privilégier un lien de guide accessible sans perdre les saisies. Modalité exacte à arbitrer au niveau du composant partagé.
- Le bouton Aide n'est pas un bouton de soumission ; il ne change pas l'état `dirty` des formulaires.

### Recherche et consultation

- Recherche par titre et contenu pertinent, FR/EN, insensible à la casse/accents ; résultats organisés par article avec indication du module.
- Aucun contenu réservé aux droits admin n'apparaît dans les résultats d'un utilisateur non autorisé ; l'URL directe et les métadonnées subissent les mêmes filtres.
- Effacer la recherche restaure l'accueil sans effacer la progression.
- Aucun résultat : texte explicite et action de réinitialisation ; erreur de chargement : message et nouvelle tentative.

### Checklist de configuration — contrat de suivi

- Liste ordonnée d'étapes, chacune avec : titre, finalité, prérequis, consignes, lien vers l'écran autorisé et **commande séparée** « Marquer comme terminé » / « Reprendre ».
- États : `À faire`, `En cours` (si l'utilisateur l'indique), `Terminé (déclaré)`. **Ne jamais assimiler une page visitée à une configuration validée.**
- Début du parcours : toutes les étapes initialement « À faire » sauf statut explicitement importé ou choisi ; progression exprimée `X / Y étapes déclarées terminées`, sans jugement sur la qualité réelle de la configuration.
- Retour arrière : l'utilisateur peut reprendre une étape terminée et ajuster le suivi ; confirmation seulement si une remise à zéro globale détruit une progression enregistrée.
- Les étapes non applicables ou sans permission sont identifiées comme telles et non simulées « Terminées ». Définir distinctement le dénominateur des étapes applicables, et l'expliciter.
- Le suivi reste identifiable après rechargement et reprise de session (**persistence UX exigée**), avec le périmètre technique à décider par Winston.
- L'étape peut ouvrir son guide sans changer de statut. Les changements d'état doivent être confirmés par le stockage choisi ; erreur de sauvegarde = statut inchangé et message clair.
- Une étape parent peut regrouper plusieurs sous-étapes ; l'ordre et les prérequis ne doivent pas masquer les liens utiles.

## State Patterns

| Situation | Comportement |
|---|---|
| Première visite | Centre d'aide immédiatement consultable ; checklist affichée, états par défaut explicites |
| Utilisateur ayant déjà configuré SMN | Aucune fausse détection de tâches terminées ; possibilité de déclarer son avancement |
| Article absent | Afficher « Aide indisponible pour cet écran » avec lien vers le Centre d'aide |
| Article non traduit | Signaler la langue du contenu de repli, si celui-ci est autorisé |
| Aucune permission sur une étape | Expliquer la limitation ; pas de bouton de navigation actionnable |
| Mode Kanban | Exclure ou adapter les étapes spécifiques à Scrum, sans marquer artificiellement leur réalisation |
| Erreur d'enregistrement progression | Conserver la valeur confirmée, proposer de réessayer |
| État hors ligne / indisponibilité serveur | Documentation lisible si possible ; ne jamais prétendre avoir sauvegardé |
| Version applicative incompatible avec un article | Afficher avertissement de version ou masquer l'article devenu erroné après contrôle documentaire |
| Recherche sans résultat | Message et « Effacer la recherche » |

## Interaction Primitives

- Recherche via clavier (Enter si nécessaire), touche Escape dans un champ uniquement si ce comportement ne gêne pas la fermeture du dialog.
- Boutons nommés et actionnables ; le lien « Ouvrir l'écran » respecte les mécanismes Next/SMN et les protections d'accès.
- Navigation vers l'aide depuis un écran contenant des modifications non enregistrées : préserver l'avertissement `useUnsavedChanges`, ne pas contourner silencieusement.
- L'action « Terminé » reste réversible, non destructrice, et n'exécute jamais l'étape métier correspondante.
- Les états de chargement / succès / erreur sont annoncés aux technologies d'assistance sans déplacement inattendu du focus.

## Accessibility Floor

- Dialog accessible au clavier : focus initial, Tab/Shift+Tab piégé, Escape, retour du focus, absence de double dialog.
- Page : H1 unique, titres hiérarchisés, listes ordonnées réelles, labels de recherche, liens nommés, statuts `aria-live` adaptés.
- Checklist : statut donné par texte et icône, taille de cible suffisante, pas de drag-and-drop obligatoire.
- Zoom 200 %, sidebar réduite, mobile portrait, sombre/clair et palettes prises en charge ; pas de scroll horizontal forcé dans le contenu.
- Conformité WCAG 2.2 AA **cible de recette**, non déclarée acquise.

## Key Flows

### Parcours P1 — Premier administrateur

1. Après initialisation, l'administrateur ouvre le menu **Aide**.
2. Il sélectionne **Première configuration** et voit l'ordre des étapes et leur état « À faire ».
3. Il lit les prérequis de « Créer une équipe », puis suit le lien vers la page autorisée.
4. Il configure réellement l'équipe dans l'écran métier ; l'aide n'effectue aucune écriture métier.
5. De retour, il marque l'étape **Terminée** ; le compteur évolue **après confirmation du stockage**.
6. Il rouvre SMN : la progression est conservée. Il peut repasser l'étape en « À faire » ou « En cours ».

### Parcours P2 — Aide sur l'écran Équipes

1. Un utilisateur autorisé consulte les équipes.
2. Il clique sur le bouton **Aide** de l'en-tête.
3. Une modale Cockpit Agile s'ouvre sur « Aide — Équipes », sans quitter la liste ni changer les filtres.
4. Il consulte les étapes et le lien vers le guide complet ; ferme avec Escape.
5. Il retrouve son focus sur le bouton Aide, ses filtres et son état de formulaire intacts.

### Parcours P3 — Permissions

1. Un utilisateur non administrateur accède au Centre d'aide.
2. Il peut lire les concepts généraux mais ne voit ni lien ni description révélant un objet de configuration sensible.
3. Les étapes nécessitant l'administration sont signalées comme non accessibles ou orientées vers l'administrateur.
4. Une URL directe d'aide ne contourne pas les droits ni les restrictions d'équipe.

### Parcours P4 — Recherche et dépannage

1. L'utilisateur recherche « import CSV ».
2. Les résultats proposent les articles pertinents dans sa langue et dans son périmètre autorisé.
3. Il ouvre l'article Tickets, consulte les prérequis et les en-têtes CSV vérifiés par Camille.
4. Il retourne au Centre d'aide sans perdre sa progression ni son contexte.

## Responsive & Platform

- Desktop : Centre d'aide pleine largeur, cartes 2 colonnes si utile ; modale centrée au-dessus de la page.
- Tablette : réorganisation des cartes, modale dimensionnée selon la largeur réelle.
- Mobile : une colonne ; modale quasi plein écran avec header/fermeture toujours visibles, corps vertical scrollable ; contrôle du clavier logiciel.
- Installation locale : **pas de dépendance obligatoire à Internet** pour lire l'aide embarquée ; l'export Word/PDF peut être traité ultérieurement.

## Périmètre et décisions ouvertes (non silencieusement arbitrées)

- **Validés par l'utilisateur** : menu au-dessus de Paramètres ; modale Cockpit Agile ; checklist avec progression.
- **Proposés par Sally** : route `/app/help`, quatre familles, mots-clés de recherche, états manuels, page partageable, modèle article ; Winston/John vérifieront le détail métier.
- **À arbitrer techniquement** : persistance et périmètre du progrès, moment où l'aide est disponible durant l'installation, partage entre installations, gestion des articles obsolètes, stockage et export Word/PDF, permissions précises des articles, correspondance route/article.
- **Non demandé / non inclus** : assistant IA conversationnel en ligne, exécution automatique des réglages via la checklist, marquage de réussite métier sans preuve, changement des droits existants.

