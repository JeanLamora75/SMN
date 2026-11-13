---
name: "SMN — Tickets CSV historiques — Parcours UX"
status: "partial-validation"
updated: "2026-11-13"
description: "Contrat comportemental BMAD des écrans et modales Tickets"
sources:
  - "../../architecture/architecture-tickets-2026-11-13/CONTRAT-FONCTIONNEL-ET-TECHNIQUE.md"
  - "../../../../docs/UX-REFERENTIEL-BMAD.md"
---

# EXPERIENCE.md — Tickets CSV : comportements

**Référence visuelle obligatoire :** [DESIGN.md](DESIGN.md), notamment `{components.header}`, `{components.filters}`, `{components.tables}`, `{components.modal}`. **Tous les écrans ET toutes les modales doivent avoir le rendu Cockpit Agile**, sans exception.

**Périmètre approuvé :** organisation générale Fichiers et Consultation validée le 13/11/2026. Les règles restant à arbitrer sont identifiées ; ce document ne vaut pas décision métier nouvelle.

## Foundation

- Application web locale SMN, desktop prioritaire, tablette et mobile pris en charge.
- React/Next.js/Bootstrap via composants SMN existants, thèmes et langue FR/EN actifs.
- CSV/JSON sur disque et choix d'une **photographie datée** ; ne pas confondre date métier et vraie date d'import.
- Analyse CSV distincte des **indicateurs v33 exclusivement saisis manuellement**.

## Information Architecture

- Sidebar : entrée **Tickets** sous navigation principale.
- Page `Tickets`, contexte équipe + sprint Scrum ou période Kanban du **header SMN**.
- Trois onglets : **Fichiers**, **Consultation**, **Comparaison**.
- Actions globales : **Indicateurs**, **Comparer**, **Importer un CSV**, selon permissions.
- Surfaces modales : **Importer**, **Saisie des indicateurs**, **Confirmation de suppression / conflit de date**, plus erreurs contextuelles. Aucun formulaire de création/édition directement inséré dans le tableau.
- Paramètres : champ **URL Jira** (emplacement exact dans les Paramètres à harmoniser avec leurs familles actuelles).

## Voice and Tone

Libellés d'action courts (« Importer un CSV », « Comparer », « Indicateurs », « Consulter », « Télécharger », « Supprimer », « Annuler », « Enregistrer »). Expliquer clairement les refus sans exposer de chemin serveur. Messages FR/EN par catalogues i18n SMN ; la date métier peut être historique, la date réelle d'import n'est pas modifiable.

## Component Patterns

### Vue Fichiers

- À l'entrée, afficher les photographies de l'équipe/cycle actifs, par **date métier** et avec date réelle d'import séparée.
- Chaque ligne est sélectionnable ; la consultation utilise la photographie choisie. Éviter qu'une sélection ouvre ou supprime immédiatement le fichier.
- Actions de ligne selon droits : consulter, télécharger, supprimer (confirmation), autres éventuelles actions via menu.
- Par défaut, utiliser la plus récente **date métier** est une proposition UX à valider ; aucun cumul de tous les CSV.
- Panneau de synthèse du cycle et, si une photographie est sélectionnée, indicateurs descriptifs issus de **ce CSV uniquement**. Ces totaux ne modifient jamais les indicateurs v33.

### Vue Consultation

- Le fichier source, sa date métier et sa provenance sont visibles avant le tableau.
- Afficher résumé, recherche, filtres, regroupements, tri et liste ; changements de filtre actualisent **uniquement la consultation**.
- Calculs affichables : nombre de tickets, somme des Story Points, comptes par type, statut et préfixe de clé Jira ; valeurs non numériques ou manquantes à traiter selon le futur contrat CSV.
- L'identifiant Jira construit un lien vers l'URL validée dans Paramètres ; aucune requête API Jira pour afficher la liste.
- Permettre de retrouver la vue Fichiers pour changer de photographie.

### Vue Comparaison

- Deux photographies **du même cycle** ; classement selon leurs **dates métier** ; ancienne comme référence et nouvelle comme cible.
- Résultats : ajoutés, retirés, terminés, rouverts, changements de SP et autres champs retenus, avec détails par clé Jira ; un ticket peut appartenir à plusieurs catégories de changements.
- « Retiré » signifie absent du CSV récent, pas supprimé dans Jira.
- Pas de comparaison valide avec moins de deux photographies distinctes. Même date métier : règle non encore arbitrée.
- Exposer à l'utilisateur les statuts retenus comme « terminés » lorsque cette configuration aura été définie.
- Données consultables et exportables selon le futur contrat d'intégration Office.

### Modale Importer un CSV

- Ouvrir depuis le header, sans quitter le cycle en cours.
- Champs : fichier CSV et **date métier modifiable**, y compris antidatée. Afficher le cycle destinataire en lecture seule.
- Contrôler les colonnes fixes, valeurs et doublons ; afficher le diagnostic avant publication du fichier. Ne pas masquer un échec.
- La véritable date/heure d'import est enregistrée automatiquement et n'est pas éditable.
- Aucun écrasement silencieux en cas de collision ; choix final à valider.

### Modale Indicateurs

- Présenter uniquement les indicateurs **manuels** du cycle sélectionné et autorisés, en réutilisant les règles/formulaires du moteur v33.
- Enregistrement explicite ; pas de préremplissage par les calculs CSV ; pas de synchronisation ni de mutation d'indicateurs à partir d'une consultation ou comparaison.

## State Patterns

- **Aucun CSV :** état vide invitant à importer, si droit ; sinon explication en lecture seule.
- **CSV invalide :** message avec colonnes/lignes concernées, conservation du formulaire, aucune fausse réussite.
- **Chargement et fichier volumineux :** indicateur de progression si pertinent, navigation non gelée ; la stratégie technique de pagination/limites sera définie.
- **Une seule photographie :** consultation possible, comparaison désactivée et raison affichée.
- **Droits insuffisants :** masquer ou désactiver les mutations, contrôle serveur obligatoire.
- **Erreur de lecture / fichier corrompu / indisponible :** message clair et action de retour ou réessai ; ne jamais présenter des totaux approximatifs comme valides.
- **Données manquantes :** état distinct de zéro et de « aucun ticket ».
- **Changement de sprint/période :** vider les sélections devenues invalides, recharger les fichiers du nouveau cycle ; aucun mélange inter-cycle.

## Interaction Primitives

- Navigation par onglets et retour au contexte, sans perte non signalée de saisie en modale.
- Tri explicite ascendant/descendant ; filtres avec bouton de réinitialisation ; pagination ou virtualisation selon volumétrie validée.
- Confirmation préalable aux actions destructives ; état de réussite après confirmation serveur seulement.
- Modales Cockpit Agile : ouverture par bouton, initialisation focus, fermeture Escape si sûre, restitution du focus et blocage de fermeture accidentelle lorsqu'un import est en cours ou qu'une saisie est non enregistrée.
- Les boutons en haut de page et les actions de tableau utilisent les conventions d'icônes SMN.

## Accessibility Floor

- Libellés et descriptions pour tous contrôles ; pas d'action icon-only inaccessible.
- Onglets navigables au clavier, état actif annoncé, titres sémantiques et tableaux accessibles.
- Focus visible, ordre logique, contraste clair/sombre, pas d'information portée par la couleur seule.
- Modale `role=dialog` ou équivalent natif avec nom accessible, focus contenu et retour focus.
- Affichage responsive avec défilement du tableau seulement (pas de débordement de toute la page).

## Responsive & Platform

- Desktop : disposition de la maquette validée (tableau principal et synthèse latérale).
- Tablette/mobile : panneaux empilés ; actions pouvant revenir à la ligne ou à un menu d'actions ; filtres en colonnes adaptées ; tableau défilable avec identification permanente de la photographie.
- Texte long Jira, noms de fichiers et erreurs restent lisibles sans tronquage irréversible.

## Key Flows

### Parcours 1 — Consulter une photographie

Le Scrum Master ouvre Tickets depuis la sidebar. Le cycle du header est présélectionné. Il voit les fichiers datés, choisit une photographie, passe à Consultation et filtre les bugs. Le tableau et les totaux explicitent leur périmètre ; il ouvre un ticket Jira par son lien. **Aucune donnée n'est chargée en base depuis le CSV.**

### Parcours 2 — Importer une photographie antidatée

Le Scrum Master clique Importer un CSV. La modale Cockpit Agile affiche le cycle et demande fichier + date métier. Il sélectionne un export datant du 23/05/2025, bien qu'il l'importe le 13/11/2026 ; après contrôle, le fichier et son JSON sont conservés. La liste affiche les **deux dates distinctes**.

### Parcours 3 — Comparer deux photographies

Le Scrum Master choisit deux CSV du sprint ; la vue Comparaison ordonne les dates ancienne/nouvelle puis affiche additions, retraits, terminés et modifications. Il ouvre les détails et sélectionne une synthèse utilisable dans les rapports, sans modifier aucun indicateur v33.

### Parcours 4 — Saisir des indicateurs

Le Scrum Master clique Indicateurs. Une modale Cockpit Agile présente les indicateurs manuels v33 du cycle. Il renseigne puis enregistre une valeur ; aucune valeur calculée depuis les CSV n'est proposée comme alimentation automatique.

## Open Questions (non bloquantes pour contrat visuel, à régler avant implémentation)

1. Schéma CSV exact et statuts considérés comme terminés.
2. Politique des CSV de même date métier, collisions et suppression.
3. Périmètre des totaux sous filtre et mode de pagination.
4. Vue Comparaison détaillée : présentation/filtre/export (maquette à valider).
5. Formats précis de projection des comparaisons dans les rapports Office.
6. Détails de la modale Import et de la modale Indicateurs (maquettes à valider).
7. Droits en cycle clôturé et messages à utiliser.
8. Catégorie de Paramètres accueillant l'URL Jira.

## Critères de recette UX obligatoires

- [ ] Tous les écrans ET modales Tickets ont le rendu **Cockpit Agile** (style existant, aucun thème parallèle).
- [ ] Page pleine largeur ; filtres, données et synthèses sont des blocs distincts avec espacement visible.
- [ ] Header et actions avec icônes, et trois onglets Fichiers / Consultation / Comparaison.
- [ ] Fichiers et Consultation correspondent à l'organisation des maquettes approuvées, **sans imposer leurs couleurs ni chiffres fictifs**.
- [ ] Modales centrées, en-tête/corps/pied Cockpit Agile, accessibilité clavier et adaptation mobile.
- [ ] Header cycle synchronisé aux données affichées et aucun mélange entre cycles.
- [ ] Différence date métier / date réelle d'import visible.
- [ ] Indicateurs v33 uniquement manuels, jamais alimentés par CSV.
- [ ] Libellés et messages FR/EN via fichiers i18n.
- [ ] Tests UX sur thème clair/sombre, desktop/mobile, absence de fichier, erreur, permissions, chargement.

**État de livraison :** contrat documentaire, aucune implémentation ni recette attestée.

## Décisions UX complémentaires validées — 13/11/2026

1. Import CSV à **six colonnes** : `Id jira`, `Type de ticket`, `Titre du ticket`, `Priorité`, `Statut`, `Story points`, dans cet ordre. La modale d'import présente les erreurs de structure/colonnes avec une formulation compréhensible.
2. Pour le même **sprint/période, équipe et date métier**, une photographie déjà présente déclenche **une modale Cockpit Agile de confirmation du remplacement** indiquant le fichier et la date. Boutons **Annuler** et **Remplacer** ; aucun remplacement sans confirmation ; annuler laisse les fichiers inchangés.
3. Sur chaque ligne de la liste des photographies, proposer l'action **Supprimer** dans les actions autorisées. Clic → **modale Cockpit Agile de confirmation** avec nom du fichier et date métier, puis suppression cohérente de la photographie ; liste et synthèse actualisées, sans sélection fantôme. Annuler ne fait rien.
4. Durant un remplacement ou une suppression, désactiver les actions conflictuelles ; n'afficher un succès qu'après confirmation du serveur. Si l'opération échoue, conserver la photographie existante et un message explicite.
5. Tous les dialogues ci-dessus suivent impérativement `{components.modal}`, via `.smn-cockpit-modal`, et respectent les permissions, la navigation clavier, le focus, les thèmes et l'i18n FR/EN.

Ces choix remplacent les anciennes questions ouvertes sur les dates en doublon et l'existence d'une action de suppression ; les droits sur un cycle clôturé et la récupération après suppression restent à qualifier.
