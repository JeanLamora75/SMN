---
name: SMN — Refonte de la page Sprints
status: final
updated: 2026-10-23
description: Contrat de parcours pour un index de sprints distinct des paramètres et de la future fiche.
sources:
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/EXPERIENCE.md
  - https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md
---

# EXPERIENCE.md — Sprints : navigation, création, actions et fiche future

**Décisions explicitement validées le 23/10/2026.** DESIGN.md décrit l'apparence. Ce contrat décrit la navigation et les règles métier que doit respecter Amelia. La documentation n'est pas une preuve de développement ni de tests.

## Foundation
MVP SMN **Scrum et Kanban monoéquipe** ; page **Sprints** en mode Scrum. Les **périodes Kanban** demeurent distinctes et ne doivent pas utiliser des cérémonies Scrum fictives. Administrateur = écriture soumise aux règles existantes ; Utilisateur = lecture selon habilitations serveur. Réutiliser les valeurs réellement persistées, les dates IANA de l'équipe et la traçabilité de chaque changement.

**Principe UX transversal approuvé** : `Paramètres` définit les défauts partagés → `Sprints` crée et administre les cycles → `Calendrier` visualise les réunions/absences → `Fiche Sprint (future)` présente les données propres au sprint → `Tableau de bord` contextualise ses métriques.

## Information Architecture

### A. Paramètres généraux de l'équipe

Déplacer la **surface d'édition** des paramètres communs hors de l'index Sprints, en réutilisant leurs composants, services et API existants.

- **Paramètres > Jours ouvrés** : édition des **plages horaires de travail de l'équipe** (matin/après-midi, fuseau) et de sa **pause déjeuner**. La semaine **lundi–vendredi** reste la règle connue ; ajouter une option pour éditer les jours eux-mêmes nécessite un besoin métier distinct. La carte « Jours ouvrés » doit être décrite comme partielle si seul le paramétrage des créneaux est livré.
- **Paramètres > Cadence des sprints** : durée, jours/heures de début/fin et fuseau, déjà dans le périmètre de configuration Scrum. Éviter d'inventer un second formulaire.
- **Paramètres > Cérémonies et modèles** : modèles **réutilisables** des réunions quotidiennes/hebdomadaires/par sprint et durées/horaires par défaut des cérémonies futures. Distinguer les occurrences générées (elles appartiennent aux sprints et au calendrier) de la définition d'un modèle. Source actuelle : TemplateForm, WorkSlotsForm, LunchForm, composantes de cadence/cérémonies ; vérifier ce qui est réellement modifiable avant de regrouper.
- **Paramètres > Règles de capacité** : seulement les **règles générales effectivement persistées**, et non les impacts ou valeurs propres à un sprint. Ne pas activer un écran de paramétrage fictif au seul motif qu'une vue de capacité existe.

**Effet temporel :** toute modification d'un défaut commun s'applique aux **nouvelles générations uniquement** ; pas de recalcul ni de modification silencieuse de sprints, événements, capacités initiales ou versions historiques. Les actions de replanification d'un sprint spécifique restent explicites et distinctes. Tous les écrans de Paramètres doivent respecter le contrat de [l'Epic SMN-223](https://lmn24.atlassian.net/browse/SMN-223) et sa bascule Cartes/Liste (qui NE s'applique pas à la page Sprints).

### B. Index « Sprints » — page principale

**Route conservée** : /app/admin/sprints (vérifiée dans le dépôt). Remplacer les éditeurs empilés par :

1. **Liste de tous les sprints de l'équipe courante**, dans le mode Scrum. Ne pas limiter le tableau aux sprints futurs ni aux sprints de la période sélectionnée dans le header. Si volumétrie élevée : pagination ou chargement progressif avec accès aux plus anciens.
2. **Colonnes minimales : nom, dates début/fin, état, actions** ; état courant clairement distingué sans retirer les autres lignes.
3. **Tri par défaut** : sprint en cours prioritaire puis autres sprints par **date de début décroissante**. Si plusieurs déclarés en cours ou chevauchement, signaler la cohérence métier sans inventer un statut ; garder les données sources et les règles serveur.
4. Recherche texte par nom, filtre d'état **Tous / À venir / En cours / Terminé / Clôturé**, tri par dates. Les états « suspendu » et éventuels autres états conservés par le serveur doivent apparaître et rester filtrables si disponibles ; ne pas les convertir arbitrairement.
5. **Une seule vue Liste** dans Sprints. La vue Cartes/Liste approuvée pour Équipe et Paramètres **n'est pas généralisée** à tous les écrans.
6. **Une action primaire** « Générer des sprints » (si autorisé), ouvrant un assistant de génération unitaire ou par lot, **pas deux formulaires permanents** ; aucun formulaire d'administration montré d'office.
7. **Par ligne** : « Voir dans le calendrier » seulement si un lien contextualisé fiable existe ; sinon état non navigable explicite ; menu ⋯ affichant **uniquement les opérations réellement autorisées** pour l'état du sprint. Le nom devient un lien lorsque la fiche Sprint aura été créée (voir § D), mais **aucun faux lien en attendant**.
8. Si zéro sprint : état vide explicite avec CTA de création si permission ; la consultation d'une liste et son filtrage ne doit jamais écrire en base.

### C. Actions pour un sprint précis

Menu d'actions contextuel **identifié par l'ID du sprint** (pas saisie d'UUID) :

| État | Actions UI proposées, sous réserve de l'API et des permissions effectives |
|---|---|
| **À venir** | Renommer ; replanifier avec aperçu ; voir calendrier ; supprimer **uniquement si jamais commencé**, après confirmation avec conséquences |
| **En cours** | Renommer ; voir calendrier ; replanifier seulement si règles existantes l'autorisent ; alertes/conflits propres au sprint |
| **Terminé** | Voir calendrier ; consulter/préparer bilan ; clôturer après validations et impacts ; renommer avec historisation |
| **Clôturé** | Lire les données et versions ; voir historique et bilan ; renommer selon règle métier et historisation ; réouverture par workflow autorisé seulement |

Ne pas déduire le droit d'écriture d'un badge d'état ou de la seule visibilité du bouton. La suppression doit utiliser la vérification serveur existante et **afficher les conséquences et la confirmation**. La replanification doit conserver ses contrôles : **prévisualisation des conséquences avant confirmation**, préservation des événements passés, capacité initiale et objectif selon les règles en vigueur ; dates et décalages à appliquer de façon atomique. Les libellés des actions inapplicables sont masqués ou explicitement désactivés avec explication.

Les opérations sur **une cérémonie / une réunion** (heure, présence, durée réellement tenue, participants, « impacte capacité », modèle appliqué, exception) relèvent du **Calendrier** et de la **future page Réunion**, ou en transition d'un écran dédié filtré au sprint, jamais de formulaires globaux qui demandent à nouveau de choisir le sprint.

### D. Fiche Sprint — cible ultérieure séparée du lot courant

**Future route possible** : /app/admin/sprints/[id] ; elle est **à créer**, non constatée comme existante.

**Structure proposée/validée comme direction** : bandeau avec nom, dates, statut, objectif enregistré, retour à la liste ; onglets **Synthèse / Cérémonies / Capacité / Indicateurs / Bilan et historique**. Modifier seulement via commandes dédiées et modales/contextes adaptés, exactement comme les décisions de la fiche Membre V2. Les informations agrégées (capacité, SP, objectifs, résultats) proviennent du sprint identifié : **aucune donnée de sprint voisin ne doit se mélanger**. Historique fondé sur les événements effectivement persistés.

**Différé** : développer cette fiche demande une Story dédiée et une analyse de ses données ; **elle ne doit pas bloquer la livraison de la liste ni rendre le nom artificiellement cliquable**.

### E. Cohérence avec le Calendrier

- « Voir dans le calendrier » ouvre, lorsqu'implémenté, **la plage exacte du sprint sélectionné**, en conservant les **7 cartes par ligne** et les intitulés des jours qui commencent à la date de début.
- Sur chaque carte du calendrier, le **jour férié en semaine est grisé mais conserve + Réunion et + Absence** (selon droits) ; week-ends gris sans ces actions ; aujourd'hui avec bordure renforcée ; nom du férié accolé à la date ; réunion un peu espacée en dessous.
- Clic sur le nom de réunion = **page Réunion réelle**, survol = heures de début/fin ; ne pas inventer la destination si la fonctionnalité n'existe pas.
- Les nouveaux liens depuis Sprints doivent transmettre **l'identifiant**, pas uniquement le nom ou un intervalle ambigu.
- **Sprints** et **Calendrier** peuvent être consultés indépendamment ; aucun changement du modèle de cycle par navigation.

## Voice and Tone
« Sprints de l'équipe », « Générer des sprints », « Rechercher un sprint », « État », « Voir le calendrier », « Actions », « Renommer », « Replanifier », « Supprimer », « Préparer le bilan ». Expliquer les refus métier sans erreurs techniques brutes.

## Component Patterns

**Table et menu :** lignes sélectionnables par liens explicitement présentés, menu ⋯ clavier accessible avec actions filtrées ; pas d'action destructive au simple clic de ligne.

**Assistant de création :**
1. Configuration — choisir **1 à 6 sprints**, date de début proposée, noms générés par défaut et modifiables, options métiers réellement disponibles. Réemployer cadence et modèles enregistrés, sans les rééditer ici.
2. Prévisualisation — dates et collisions, cérémonies qui seront générées (si appliqué), risques et conflits, sans persistance.
3. Confirmation — opération enregistrée en bloc avec les protections anti-chevauchement et jeton de prévisualisation si requis ; résumé et retour à la liste rafraîchie.

**Reprise historique** : ne pas traiter silencieusement un sprint passé comme sprint futur ; l'option « Générer les cérémonies de l'équipe » y est **désactivée par défaut**, conformément à [SMN-160](https://lmn24.atlassian.net/browse/SMN-160), et aucune réunion historique ne doit être prétendue tenue. Respecter les variantes génération unitaire et par lot sans retrait de fonctionnalités ; si leurs contrats ne permettent pas un assistant unifié au premier lot, le documenter au lieu de changer arbitrairement l'API.

## State Patterns
Chargement, aucune donnée, erreur réseau, succès d'édition, conflit de révision, action indisponible et attente de confirmation ont des états distincts. Les formulaires protègent les brouillons et évitent la double validation. Les filtres ne modifient rien en base ; ligne et liste se rafraîchissent après mutation confirmée sans perte inutile de contexte.

## Interaction Primitives
Liens réels vers pages, boutons réels pour opérations ; validation clavier, focus restauré au déclencheur après modal, touche Échap seulement si abandon protégé. Menus per-ligne orientés à la souris, toucher et clavier.

## Accessibility Floor
Tabulation/Entrée/Échap, ARIA pour menus et modales, focus visible, contraste et état non transmis par couleur seule, zoom 200 %, FR/EN et i18n JSON centralisée. Libellé accessible sur icônes Calendrier et ⋯.

## Key Flows

**UX-SP-01 — Chercher un sprint.** Le Scrum Master ouvre Sprints, voit le sprint courant prioritaire, recherche un ancien sprint par nom, lit ses dates et son état, puis consulte son calendrier sans parcourir aucun formulaire.

**UX-SP-02 — Corriger un futur sprint.** Dans la ligne À venir, il ouvre ⋯, sélectionne Replanifier, examine les impacts et avertissements réels, confirme ou annule ; le tableau reflète la mutation et garde les filtres actifs.

**UX-SP-03 — Préparer les prochains sprints.** Il configure au préalable la cadence, les plages et les modèles dans Paramètres ; dans Sprints il demande 3 nouveaux sprints, vérifie l'aperçu puis confirme. Aucun sprint déjà créé n'est modifié par les réglages généraux.

**UX-SP-04 — Explorer une cérémonie.** Depuis un sprint, il ouvre le Calendrier sur les dates de ce sprint, voit les réunions quotidiennes, survole leur nom pour les horaires et accède à leur page si elle existe ; aucune cérémonie ne se gère dans une section globale de 16 formulaires.

## Inspiration & Anti-patterns
Référence : page **Équipe** pour largeur et actions modales ; **Paramètres** pour configuration ; **Calendrier** pour jours/réunions ; **fiche membre** pour fiche détaillée future. À éviter : listes partielles de sprints sans signalement, champs UUID techniques, 16 formulaires empilés, liens « # » en attendant une route et édition rétroactive implicite.

## Responsive & Platform
Windows 11 desktop prioritaire, tablette/mobile exploitable ; une seule liste de sprints, adaptation du tableau avec informations essentielles conservées. Les modales peuvent être remplacées par une page d'assistant sur petit écran si nécessaire, sans modifier le parcours de confirmation.