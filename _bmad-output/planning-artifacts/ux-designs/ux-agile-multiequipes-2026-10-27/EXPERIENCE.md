---
name: "SMN — Modes Scrum/Kanban par équipe — Contrat d'expérience"
status: final
updated: 2026-10-27
sources:
  - "DESIGN.md"
  - "_bmad-output/planning-artifacts/briefs/agile-par-equipe-2026-10-27/BRIEF-PRODUIT.md"
  - "https://lmn24.atlassian.net/browse/SMN-282"
  - "https://lmn24.atlassian.net/browse/SMN-287"
---

# EXPERIENCE.md — SMN-287 — Scrum/Kanban multiéquipes

**Statut : final pour les parcours UX, après validation explicite des décisions UX-01, UX-02, UX-03 et UX-04.**
**Document pair :** [DESIGN.md](./DESIGN.md), qui définit les apparences et les composants visuels.
**Périmètre :** cible UX, non preuve de développement ou de recette.

## Foundation

Application SMN web responsive Next.js/React/Bootstrap, FR/EN, palettes et thèmes déjà existants. Une installation héberge plusieurs équipes Scrum/Kanban, mais le contexte de travail demeure **une équipe active et son cycle actif**. Les droits, les données, le mode Agile et l'état d'archivage sont calculés côté serveur. Conserver les comportements validés par SMN-282 et le design Cockpit Agile.

## Information Architecture

| Surface | Rôle UX | Équipe archivée |
| --- | --- | --- |
| `Paramètres > Équipes` | Créer, modifier, filtrer, archiver/réactiver | Visible aux administrateurs dans le filtre Archivées/Toutes |
| Page `Équipe` | Vision, but, membres, contexte ; édition générale via modale | Pas de travail opérationnel sur une équipe archivée |
| En-tête : Équipe | Sélection du contexte actif | Jamais proposée |
| En-tête : Sprint/Période | Cycle de l'équipe active, conforme à son mode | Jamais de cycle opérationnel d'une équipe archivée |
| Tableau de bord | KPI pertinents et réels de l'équipe | Inaccessible en contexte actif archivé |
| `Sprints` / `Périodes` | Cycles de l'équipe active, dépendant du mode | Non modifiables si équipe archivée |
| Calendrier / Registres / Rapports | Données et actions autorisées par mode et équipe | Historique accessible en lecture seule depuis l'administration si techniquement pris en charge et sécurisé |

**UX-01 validée :** la consultation historique d'une équipe archivée s'effectue depuis son entrée dans **Paramètres > Équipes** (action explicite « Consulter l'historique »), dans un contexte **lecture seule**, sans la placer dans le sélecteur d'équipe de travail. Le périmètre des liens de consultation doit être vérifié et autorisé côté serveur ; ne jamais renvoyer vers une page qui permet encore d'écrire.

## Voice and Tone

Microcopies FR à décliner en EN dans les catalogues existants :

- Champ : « Mode Agile * » ; aide : « Choisissez Scrum ou Kanban pour cette équipe. »
- Validation : « Sélectionnez Scrum ou Kanban pour créer l'équipe. »
- Verrou : « Ce mode ne peut plus être modifié : au moins un cycle a déjà été créé pour cette équipe. »
- Archivage : « Archiver cette équipe ? Elle disparaîtra du sélecteur, mais ses données et son historique seront conservés. »
- Confirmation : « Archiver l'équipe » / « Annuler ».
- Succès : « Équipe archivée. Elle reste consultable dans Paramètres > Équipes. »
- Réactivation : « Réactiver l'équipe » ; succès : « Équipe réactivée. »
- Dernière active : « Impossible d'archiver la dernière équipe active. Créez ou réactivez d'abord une autre équipe. »
- Historique : « Consultation en lecture seule — équipe archivée. »
- Aucun cycle : « Aucun sprint pour cette équipe. » / « Aucune période pour cette équipe. »
- Erreur : « Impossible de charger les cycles. Réessayez. »

Ne jamais présenter une indisponibilité réseau comme une absence de données ni un refus de sécurité comme un problème de navigateur.

## Component Patterns

### A. Créer une équipe

1. L'administrateur ouvre `Paramètres > Équipes`, clique sur « Nouvelle équipe ».
2. Le formulaire est vierge ; le mode Agile n'est **pas présélectionné**.
3. Il saisit le nom (obligatoire), sélectionne Scrum ou Kanban (obligatoire) et complète éventuellement produit, vision et but.
4. Si le mode manque, afficher une erreur à proximité du groupe radio et conserver les données saisies.
5. Après succès, montrer la nouvelle équipe **Active** dans la liste avec badge mode ; ne pas forcer son activation dans l'en-tête.

**Point d'attention :** « Scrum par défaut » concerne uniquement une migration d'historique indéterminé, jamais ce formulaire.

### B. Éditer l'équipe et son mode — UX-04

**Seule surface autorisée à modifier le mode : `Paramètres > Équipes`.** La modale de la page Équipe conserve nom, produit, vision et but, mais affiche le mode **en lecture seule** et, pour un admin autorisé, un lien vers `Paramètres > Équipes`.

- Sans historique de cycles : le mode enregistré est sélectionné dans le groupe radio, modifiable par un admin ; Enregistrer déclenche validation serveur, contrôle de révision et message de succès.
- Après première création de cycle : afficher la valeur seule et un motif lisible ; ne pas proposer une radio interactive. La suppression ou l'archivage du cycle ne change rien.
- En cas de collision entre deux sessions, refuser la mutation et proposer le rechargement du formulaire ; ne jamais écraser silencieusement les données.
- Conserver les champs facultatifs et un comportement identique entre les deux parcours de mise à jour des informations générales.

### C. Archiver une équipe — UX-01/02/03

1. Dans `Paramètres > Équipes`, l'admin filtre Actives, sélectionne une équipe et active « Archiver ».
2. Une confirmation décrit explicitement la disparition du sélecteur et la conservation de l'historique ; Annuler n'a aucun effet.
3. Après confirmation et succès, l'équipe passe à **Archivée** et disparaît du sélecteur global pour toutes les sessions concernées.
4. Elle reste retrouvable dans l'administration (filtre Archivées/Toutes) et propose « Consulter l'historique » et « Réactiver ».
5. Son historique est consultable **en lecture seule** ; les écrans et points d'entrée directs ne permettent aucune écriture opérationnelle (création ou modification de cycle, réunion, KPI, capacité, registres, rapports). L'action administrative Réactiver reste permise.
6. Si c'est la **dernière équipe active de l'installation**, l'archivage est interdit, y compris en cas de demandes concurrentes ; proposer une explication et la création ou réactivation préalable d'une autre équipe.
7. En cas d'archivage de l'équipe actuellement sélectionnée, éliminer le contexte actif obsolète, proposer une autre équipe autorisée et active selon la logique validée ou un écran de sélection ; ne jamais garder les données de l'ancienne équipe visibles comme actives.

**UX-02 validée :** les écritures métier sont bloquées **côté serveur** aussi, y compris les URL et requêtes API directes. Les lectures autorisées n'autorisent pas à leur tour l'édition. Une équipe archivée ne se réactive pas automatiquement lors de sa consultation.

### D. Réactiver une équipe

Dans le filtre Archivées, l'admin clique « Réactiver ». Après succès, l'équipe revient dans Actives, conserve son **ID**, mode Scrum/Kanban, verrouillage et intégralité des cycles, documents et rapports. La réactivation ne change pas automatiquement l'équipe active dans l'en-tête. Tout changement réel de contexte reste explicite.

### E. Changer l'équipe active

1. L'admin choisit une autre équipe **active et autorisée** dans l'en-tête.
2. Si un formulaire possède des changements non sauvegardés, demander confirmation avant de quitter ; Annuler préserve le contexte et le brouillon.
3. La sélection résolue côté serveur détermine le mode de la **nouvelle équipe**, jamais celui de l'ancienne.
4. Effacer les anciens `teamId`, `cycleId`, références et caches d'UI avant de présenter les données de la nouvelle équipe.
5. Sélectionner le cycle **en cours**, sinon **le plus récent**, sinon aucun. En cas de plusieurs cycles simultanément courants, avertir et prendre celui au début le plus récent sans modifier la base.
6. Conserver la rubrique commune si elle est applicable ; pour une rubrique incompatible ou un détail rattaché à l'ancienne équipe, rediriger vers sa liste correspondante autorisée ou vers Tableau de bord, sans réutiliser un identifiant d'objet obsolète.
7. Garder la dernière équipe accessible en préférence personnelle, sans traiter cette préférence comme une permission.

**Règle métier actualisée :** D-AGILE-02 « en cours > plus récent > aucun » prévaut pour ce nouveau périmètre sur un ancien contrat SMN-282 « en cours > prochain > dernier ».

### F. Navigation et cycles

- **Scrum :** entrée `Sprints`, Sprint sélectionné, indicateurs Scrum réels.
- **Kanban :** entrée `Périodes`, Période sélectionnée, indicateurs Kanban réellement disponibles.
- Les rubriques communes gardent leur identité Cockpit Agile, avec le contenu, les cérémonies et les paramètres de l'équipe active.
- Ne pas afficher de métriques fictives, de modèles inadaptés, de liens morts ni de rubriques artificiellement vides présentées comme « aucune donnée ».
- Les comptes sans droits d'administration ne voient pas de commandes réservées ; leurs habilitations multiéquipes détaillées restent celles décidées dans SMN-282, sans création implicite de droits V1.

## State Patterns

| État | Comportement attendu |
| --- | --- |
| Création sans mode | Message près du champ ; saisies conservées ; Enregistrer refusé |
| Mode non verrouillé | Groupe radio accessible en édition autorisée |
| Mode verrouillé | Valeur et cadenas lisibles ; changement refusé aussi côté serveur |
| Équipe archivée | Badge `Archivée`, aucune présence dans le sélecteur opérationnel |
| Consultation d'archive | Bandeau `Lecture seule` et aucune action métier modifiante |
| Dernière équipe active | Action d'archivage indisponible avec motif, refus serveur concurrent |
| Aucune équipe active accessible | Écran de sélection/information ; aucune équipe arbitraire ni donnée précédente |
| Aucun cycle | État vide du bon mode, sans blocage du choix d'équipe |
| Cycles en chargement | Neutraliser anciens cycles, annoncer le chargement |
| Erreur réseau | Erreur distincte de l'état vide, `Réessayer` disponible |
| URL vers une ressource d'une autre équipe | Refus/404 sans révélation de données |
| Conflit de révision ou équipe archivée entre-temps | Refuser, conserver les saisies si possible et proposer rechargement |
| Changement avec brouillon | Confirmer l'abandon ; Annuler conserve contexte et brouillon |

## Interaction Primitives

Navigation clavier naturelle : liste des équipes → formulaire → actions ; en-tête Équipe → Sprint/Période → Recherche. Les radios sont réunies dans un `fieldset` avec `legend`, validation associée et focus sur le premier champ problématique ; les dialogues ont un titre, un focus initial pertinent, Échap/Annuler et retour du focus au déclencheur. Garder une seule confirmation ouverte à la fois, éviter double soumission, annoncer les succès/échecs via régions de statut. Les états et actions sont toujours textuels, pas uniquement chromatiques ou accessibles au survol.

## Accessibility Floor

WCAG 2.2 AA visé : navigation complète au clavier, contrastes via DESIGN.md, focus visible, zones cliquables adaptées au tactile, annonces de chargement, d'erreur et de verrouillage, labels et aide reliés au contrôle, zoom 200 %, FR/EN, valeurs longues sans troncature définitive. Aucun lien faux ni contenu privé entre équipes.

## Key Flows

### Camille — Créer Kanban dans une installation Scrum

Camille ouvre Paramètres > Équipes, ajoute « Beta », choisit **Kanban** (rien n'était présélectionné), puis enregistre. Après sélection de Beta dans l'en-tête, la navigation affiche **Périodes** et les écrans pertinents. Alpha conserve son mode Scrum et son historique. **Moment décisif :** une même installation montre deux contextes sans les mélanger.

### Camille — Archiver une équipe sans perdre ses données

Camille sélectionne Alpha dans Paramètres, confirme l'archivage. Alpha disparaît de l'en-tête mais figure sous Archivées ; l'action « Consulter l'historique » affiche ses ressources en lecture seule. Camille réactive Alpha sans recréer l'équipe ni modifier son mode. **Moment décisif :** l'équipe disparaît du travail quotidien, pas des archives.

### Camille — Empêcher l'installation sans équipe active

Camille tente d'archiver la dernière équipe active. L'action explique pourquoi l'archivage est impossible ; l'API refuserait également une requête directe ou simultanée. Elle crée ou réactive une seconde équipe avant de recommencer. **Moment décisif :** aucune installation n'est laissée sans équipe opérationnelle par une archive.

### Camille — Comprendre le mode verrouillé

Une équipe Scrum a connu un Sprint qui a été supprimé depuis. Dans Paramètres > Équipes, Camille voit « Scrum » avec un cadenas et la justification, mais peut encore modifier les informations générales autorisées. Depuis la page Équipe, la modale montre seulement le mode et renvoie aux Paramètres. **Moment décisif :** restriction compréhensible sans manipulation infructueuse.

## Responsive & Platform

Desktop : liste (~1/3) et formulaire (~2/3) ; tablette étroite/mobile : liste puis formulaire, champs sur toute la largeur et boutons sans débordement. Dans l'en-tête, Équipe et Cycle peuvent passer à la ligne sans perdre leurs labels. Contrôler 320, 375, 390, 768, 1024, 1440 et ~1880 px, zoom 200 %, thèmes clair/sombre, palettes, navigation clavier et lecteurs d'écran. Les données du produit, Vision et But restent lisibles sur écrans réduits.

## Périmètre, précédence et vérification

Ce contrat **complète** les UX approuvées sur Équipe, Calendrier, Sprints, Registres et Rapports ; il ne recompose pas leurs maquettes. UX-01 à UX-04 sont validées, de même que D-AGILE-01 à D-AGILE-24. Les API, protections et états décrits sont des **attendus** et non une preuve de réalisation. Les habilitations des comptes `user` détaillées sont reportées à V1 conformément à SMN-282. SAFe et rapport consolidé Scrum+Kanban sont hors MVP.

**Aucun script BMAD, test utilisateur, recette Windows ni modification de dépôt ou de Jira n'a été réalisé pour finaliser ces contrats.**