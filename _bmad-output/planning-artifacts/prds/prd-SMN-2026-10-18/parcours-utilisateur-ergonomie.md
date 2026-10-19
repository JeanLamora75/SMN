# SMN — Parcours utilisateur et ergonomie : exigences détaillées

**Statut :** validation fonctionnelle groupée le 19 octobre 2026 ; détails UX et mesures de recette encore à spécifier.  
**Référence :** [PRD principal](prd.md), FR-58 à FR-65.  
**Décision :** **D-PRD-127**, approbation globale des recommandations **UX-01 à UX-08**.

## 1. Contraintes déjà actées et préservées

- **MVP :** application web responsive sur ordinateur, tablette et smartphone, sans obligation d'application native (D-PRD-001/NFR-1). **Bootstrap 5**, variables CSS, palettes personnalisables, modes clair/sombre et interface **français/anglais** (F-112 à F-115).
- **Utilisateur principal :** Scrum Master (puis RTE en SAFe v1.0) ; saisie minimale et données préremplies uniquement à partir de sources fiables (F-01, F-08, D-PRD-073).
- **Initialisation Express ou Guidée/Tutorée** vers le **même tableau de bord** (FR-1/FR-2) ; seules les informations initiales déjà validées sont requises. En Scrum/Kanban : mode, première équipe, produit de référence obligatoire ; en SAFe v1.0, nom d'ART selon les règles F-123/F-124.
- **Zone facultative de configuration** (FR-3) avec tâches **À faire / Terminée / Ignorée**, distinctes des actions métier et jamais bloquantes. Détection d'une tâche réellement accomplie seulement si son état est fiable ; aucune réactivation automatique supposée.
- **Périodes et événements :** création des Sprints/périodes à la demande, calendrier et statut des événements connus, respect de la localisation/fuseaux, jours fériés, disponibilités et absences (FR-8 à FR-24). Ne pas inventer de déplacement ou de donnée réalisée.
- **Bilan consolidé à quatre blocs** (objectifs, métriques, capacité, tendances) en Scrum/Kanban, avec **sauvegardes indépendantes des blocs de saisie**, tendances en lecture seule et distinction valeurs provisoires/enregistrées (D-PRD-071 à D-PRD-074, FR-20/FR-21).
- **Replanification :** un récapitulatif explicite précède une **confirmation globale atomique**, seules les modifications volontairement acceptées sont sauvegardées (D-PRD-118). Les cycles clôturés et anciens PDF restent protégés (F-91/F-93/F-96).
- **Liens transverses :** les fiches centrales (risques, dépendances et autres registres) et leurs associations sont historiques et ne doivent pas être dupliquées pour simplifier la navigation (FR-25/FR-34 à FR-41).
- **Aucune fonctionnalité avancée SAFe/PI** n'est requise au MVP ; préparer la mutualisation des composants pour la version 1.0.

## 2. Exigences et critères d'acceptation

### FR-58 / UX-01 — Afficher le tableau de bord de pilotage courant

**Besoin :** disposer immédiatement des informations permettant au SM de préparer les actions du jour sans saisir à nouveau son contexte.

**Critères d'acceptation :**
1. À la fin de l'installation Express ou Guidée, accéder au **tableau de bord** de l'équipe créée (FR-2) ; il est également accessible depuis la navigation générale.
2. Le tableau de bord identifie **équipe/produit**, **Sprint courant** ou **période Kanban pertinente**, ses dates et son état lorsqu'un cycle existe ; aucun cycle absent n'est remplacé par une période fictive.
3. Il réunit dans une vue synthétique : **objectif(s) disponibles**, **indicateurs réellement enregistrés/calculables**, **événements Agile à venir ou du cycle**, **points d'attention** existants et lien vers les bilans. Les données non disponibles sont explicitement absentes/non renseignées, jamais 0 par défaut.
4. Les informations de suivi d'un cycle **ne se substituent pas** à leur source : une action contextuelle ouvre la fiche ou le bilan correspondant. Les alertes restent informatives et ne changent aucun statut.
5. En l'absence de cycle actuel, montrer **un état vide utile**, avec accès à la **génération à la demande** des Sprints ou périodes ; ne pas créer automatiquement le cycle suivant (D-PRD-093).
6. En cas de plusieurs cycles éligibles (par exemple, périodes terminées non clôturées), distinguer clairement **cycle en cours** et **bilans en attente** (F-92). Le choix précis du cycle par défaut dans ces situations reste à définir sans masquer les autres.
7. En SAFe v1.0, le tableau de bord pourra proposer une vue ART et des accès aux équipes, sans agréger des Story Points interéquipes non comparables (F-73).

### FR-59 / UX-02 — Organiser une navigation lisible par fonctions

**Critères d'acceptation :**
1. La navigation présente des accès **regroupés par fonction** : **Pilotage**, **Calendrier**, **Cycles et bilans**, **Registres**, **Reportings et briefs IA**, **Administration/paramètres**. La dénomination finale peut être adaptée à l'UX, sans supprimer d'accès validé.
2. Un groupe peut ouvrir des fonctions pertinentes sans afficher en permanence une **longue liste plate de sous-menus** ; l'utilisateur peut identifier la rubrique active et retrouver la page d'origine.
3. Les fonctions dont le mode ne dispose pas **ne sont pas proposées comme déjà opérationnelles** : menus et intitulés Scrum/Kanban adaptés, éléments SAFe hors MVP non actifs.
4. L'accès au **tableau de bord** et au **contexte équipe/produit actif** reste facile depuis les écrans métier. Les actions administratives restent identifiables comme distinctes des données métier.
5. L'organisation est cohérente sur ordinateur, tablette et mobile : menus réduits/repliables selon le support, sans perdre une fonctionnalité indispensable.
6. Les libellés, messages de navigation et aides sont proposés en **français/anglais**, sans modifier la langue des textes métier libres.

### FR-60 / UX-03 — Naviguer directement vers les fiches liées

**Critères d'acceptation :**
1. Depuis une **mesure du bilan**, accéder à sa **source ou section métier** lorsque cette source existe ; depuis un **événement**, ouvrir le détail de l'événement ; depuis une **alerte**, ouvrir la fiche risque, obstacle, dépendance, action ou objectif concerné.
2. Depuis une fiche centrale, retrouver ses **cycles et autres objets liés**, puis revenir aux vues synthétiques sans devoir rechercher manuellement l'identifiant de la fiche.
3. En consultation historique, conserver le **cycle et périmètre interrogés** dans les liens lorsque nécessaire ; une navigation vers une fiche courante ne doit pas faire croire que son état présent était celui de l'ancien cycle clôturé.
4. Les liens vers un objet manquant, supprimé/archivé ou non accessible produisent un **message explicite**, jamais une fiche inventée ni une erreur silencieuse.
5. Les liens n'exécutent **aucune modification métier** et ne déclenchent pas d'envoi externe ; ils respectent les droits d'accès à définir dans le domaine Sécurité.
6. Les actions de retour, filtres ou chemin de navigation doivent permettre à l'utilisateur de **retrouver facilement le contexte de départ**, avec comportement exact de conservation des filtres à concevoir.

### FR-61 / UX-04 — Minimiser la saisie avec préremplissage fiable

**Critères d'acceptation :**
1. Lors de la création ou modification d'une fiche, proposer les champs **connus avec certitude** : équipe/produit, cycle sélectionné, date locale pertinente, statut initial métier, valeurs par défaut de paramètres administrables, en respectant leur origine et leur portée.
2. L'utilisateur peut **corriger les champs préremplis modifiables** ; un préremplissage **ne transforme pas en observation** une date, valeur ou capacité simplement proposée.
3. Les **KPI facultatifs**, commentaires et dates de certains registres restent facultatifs comme prévu par les FR spécifiques. Ne jamais remplacer un champ vide par **0**, un participant inventé ou une information automatiquement dérivée sans preuve.
4. Les valeurs réellement calculables sont proposées sans double saisie ; les **valeurs manuelles enregistrées conservent leur priorité** et le statut d'une valeur calculée est distinguable d'une valeur source.
5. Une création rapide peut être **complétée progressivement**, sans bloquer l'accès aux autres fonctionnalités dès lors que les seuls champs obligatoires déjà validés sont présents.
6. Aucun écran UX ne contourne la **confirmation explicite** des imports ou replanifications ni les règles de **réouverture des cycles clôturés**.

### FR-62 / UX-05 — Offrir une consultation calendaire unifiée

**Critères d'acceptation :**
1. Le SM peut consulter, dans une **interface de calendrier commune**, les **bornes des cycles**, **événements Agile/réunions** et **absences/indisponibilités** pertinentes pour le périmètre consulté.
2. Les éléments disposent de **catégories ou repères visuels distincts** et de liens contextuels permettant d'ouvrir les fiches sous-jacentes ; un élément affiché n'est pas dupliqué en une nouvelle fiche métier.
3. Des **filtres adaptés** permettent de limiter l'affichage au type (cycles, événements, absences), au contexte équipe/périmètre, à la période et, **lorsque approprié et autorisé**, au membre. Les filtres n'altèrent pas les données.
4. Les **statuts d'événements** et les jours non travaillés sont restitués comme enregistrés ; une cérémonie passée inconnue ne doit pas être présentée comme réellement « Tenue » lors d'une reprise historique.
5. Les fuseaux horaires locaux et le **fuseau de référence de l'équipe**, ainsi que les périodes qui traversent un changement d'heure, ne créent ni décalage artificiel ni modification du cycle (FR-9/FR-10/D-PRD-103).
6. Les **absences individuelles et leurs motifs** sont visibles dans les vues métiers appropriées selon les droits applicables, mais ne sont **pas incluses par défaut dans les rapports externes** ni dans les TXT IA (FR-33/FR-53).
7. Le calendrier permet de **consulter** les éléments et d'accéder à leur édition dédiée ; l'interface ne permet pas implicitement de déplacer des événements historiques, des dates de cycles ou des absences par un simple glisser-déposer non confirmé.

### FR-63 / UX-06 — Rendre les parcours essentiels utilisables sur tous les supports

**Critères d'acceptation :**
1. Les parcours majeurs du MVP — **installation, tableau de bord, calendrier, cycles, bilans, registres, rapport HTML/PDF, briefs TXT IA et administration essentielle** — sont utilisables sur **ordinateur, tablette et smartphone**, dans un navigateur.
2. Les éléments Bootstrap 5 choisis sont **responsives**, et leurs alternatives sur écran étroit conservent toutes les actions métier essentielles, sans exiger un défilement horizontal pour des interactions fondamentales si une présentation adaptée est possible.
3. La navigation et les formulaires restent utilisables **au clavier**, avec **libellés explicites**, ordre de focus cohérent, états d'erreur lisibles, textes alternatifs et actions non dépendantes de la seule couleur.
4. Les palettes et les thèmes **clair/sombre** sont appliqués de façon cohérente aux écrans, notifications, graphiques et états ; aucune signification métier critique ne repose uniquement sur une couleur.
5. Les interfaces et aides standardisées sont disponibles en **français/anglais** et les contenus saisis restent dans leur langue, sans traduction forcée.
6. Les navigateurs/versions cibles, tailles de référence, **niveau d'accessibilité visé et mesures chiffrées de performance** seront définis dans le domaine Recette et exigences non fonctionnelles ; le principe d'accessibilité ne vaut pas affirmation de conformité WCAG mesurée.

### FR-64 / UX-07 — Signaler les modifications non sauvegardées et résultats d'opération

**Critères d'acceptation :**
1. Lorsqu'un formulaire comporte des **modifications non enregistrées**, la situation est **visible**. Un changement de contexte ou une sortie d'écran ne doit pas perdre silencieusement les données : proposer de revenir/continuer avec une conséquence clairement annoncée lorsque le support le permet.
2. Après une action explicite **Enregistrer**, afficher un **succès seulement si l'écriture a été confirmée** et une erreur compréhensible en cas d'échec ; les données non validées ne doivent pas être présentées comme sauvegardées.
3. Dans les bilans Scrum/Kanban, conserver **les sauvegardes indépendantes des trois blocs de saisie** et le bloc Tendances en lecture seule (D-PRD-071 à 074). Un bloc sauvegardé n'impose pas la sauvegarde des autres.
4. Les **prévisualisations de calculs** avant sauvegarde sont identifiées comme provisoires ; elles **n'alimentent pas les graphiques** ni les reportings avant enregistrement (D-PRD-074).
5. Les opérations nécessitant une **confirmation globale atomique** (replanification de cycles D-PRD-118, création de lots D-PRD-101) préservent leur contrôle et leur absence de persistance partielle ; le système ne leur substitue pas un autosave implicite.
6. Les corrections sur **cycles clôturés** exigent les droits, protections et réouvertures déjà validés. Les anciens PDF restent figés.
7. Un avertissement **non bloquant** ne doit pas être traité comme une erreur bloquante. Les états de données non renseignées ou invalides sont présentés avec des messages compréhensibles ; absence ≠ zéro.

### FR-65 / UX-08 — Accompagner l'initialisation sans imposer la configuration complète

**Critères d'acceptation :**
1. Au premier lancement, proposer le choix **Express / Guidé ou Tutoré**, avec des explications simples de leurs objectifs respectifs (FR-1).
2. En **Express**, ne demander que les informations métier obligatoires validées, proposer des paramètres par défaut utiles, puis accéder au **même tableau de bord** que le parcours Guidé (FR-1/FR-2).
3. En **Guidé**, présenter les paramètres pertinents étape par étape et laisser facultatifs les réglages non requis ; un utilisateur peut accéder à l'application sans compléter toutes les préférences.
4. Depuis le tableau de bord, proposer une liste **facultative « Paramétrage à compléter »**, distincte des actions métier, avec états **À faire / Terminée / Ignorée** (FR-3). Ignorée ≠ Terminée, et aucune des deux ne bloque l'usage.
5. Une tâche encore **À faire** peut passer automatiquement à **Terminée** si SMN constate effectivement la réalisation correspondante ; une configuration non vérifiable reste gérée manuellement. Ne pas présumer de réactivation automatique d'une tâche Ignorée.
6. Les réglages administrables restent modifiables **après l'initialisation** selon les règles de non-rétroactivité propres à chaque paramètre ; le **mode Agile et le produit de référence restent fixes** pendant une installation (F-41/F-49/F-121/F-122).
7. Le catalogue et l'ordre détaillé des étapes, les textes d'aide, la progression et le comportement des tâches ignorées puis complétées seront définis en conception ; ils ne constituent pas de nouveaux prérequis fonctionnels.

## 3. Hors périmètre et arbitrages restants

- Aucun glisser-déposer modifiant automatiquement des dates protégées, aucun mécanisme de sauvegarde automatique universelle, aucun ajustement rétroactif silencieux des capacités/historiques.
- Le niveau WCAG précis, les navigateurs/versions cibles, les tailles d'écran de recette, les budgets de performance et les niveaux d'autorisations seront fixés dans les blocs Sécurité/Recette ; aucune certification ou conformité n'est déclarée accomplie.
- La disposition exacte des menus, icônes, filtres, tableaux, cartes, états vides, comportement du retour et la politique de conservation des brouillons non sauvegardés sont des décisions UX/techniques ouvertes, sans changer les règles métier.
- Aucune fonctionnalité avancée ART/PI n'est introduite dans le MVP Scrum/Kanban.

**Traçabilité :** D-PRD-001 à D-PRD-005, D-PRD-071 à D-PRD-074, D-PRD-079, D-PRD-093, D-PRD-101, D-PRD-103, D-PRD-118, D-PRD-123 à D-PRD-127 ; F-01/F-05/F-08/F-20/F-23/F-24/F-25/F-53/F-71/F-72/F-84/F-91 à F-97/F-112 à F-115/F-121 à F-124 ; FR-1/FR-2/FR-3/FR-8 à FR-24/FR-26 à FR-57.
