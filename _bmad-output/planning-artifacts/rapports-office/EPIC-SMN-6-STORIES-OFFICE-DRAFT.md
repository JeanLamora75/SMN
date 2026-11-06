---
title: "SMN — Extension BMAD Stories Office à l'Epic SMN-6"
status: draft
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - "_bmad-output/planning-artifacts/rapports-office/specification-fonctionnelle.md"
  - "_bmad-output/planning-artifacts/architecture/rapports-office/ARCHITECTURE-SPINE.md"
  - "docs/UX-REFERENTIEL-BMAD.md"
targetEpic: "SMN-6"
jiraCreation: false
---

# SMN — Extension de l'Epic 6 : génération Office pilotée par modèles

## Overview

**Découpage des neuf Stories approuvé par le Product Owner le 06/11/2026. Document BMAD en cours de validation finale ; aucune création Jira autorisée à ce stade.** Extension autonome des Stories de l'Epic [SMN-6](https://lmn24.atlassian.net/browse/SMN-6) existante ; le fichier historique `_bmad-output/planning-artifacts/epics.md` reste inchangé. Numérotation **6.1–6.9 locale à cette extension**, provisoire : ne pas la confondre avec les numéros historiques de Stories de l'Epic 6. Les nouvelles clés Jira seront attribuées par Jira après accord.

## Requirements Inventory

### Functional Requirements

36 exigences **FR-001 à FR-036**, source [spécification fonctionnelle](./specification-fonctionnelle.md), réparties en sept capacités :
- FR-001–004 : découverte des modèles et préservation des originaux.
- FR-005–008 : données et contexte autorisé.
- FR-009–014 : tags simples, N/D, zéro et formatage.
- FR-015–019 : tableaux dynamiques et débordement.
- FR-020–025 : graphiques rendus en images.
- FR-026–030 : fidélité et intégrité Office.
- FR-031–036 : sauvegarde, confirmation et erreurs.

### NonFunctional Requirements

**NFR-01 à NFR-07** : intégrité, fidélité, sécurité, utilisabilité, interopérabilité, maintenabilité, limites de ressources.

### Additional Requirements

Architecture Winston : **AD-01 à AD-10**, circuit indépendant des rapports PDF/archives, lecture autorisée, parseur unique, manipulation minimale Open XML, images de tendance avec rendu réutilisable, remplacement de fichiers sûr, preuves de concept **P1–P6**.

### UX Design Requirements

- **UX-DR01** : interface Cockpit Agile / Bootstrap conforme au référentiel SMN.
- **UX-DR02** : sélection simple de modèle et contexte, sans chemin technique.
- **UX-DR03** : confirmation modale explicite avant tout écrasement.
- **UX-DR04** : états loading/succès/erreur et contrôle clavier accessibles.
- **UX-DR05** : libellés et messages centralisés dans les JSON i18n FR/EN.

### FR Coverage Map

| Plage FR | Stories de couverture |
|---|---|
| FR-001–004 | 6.2, 6.8, 6.9 |
| FR-005–008 | 6.3, 6.6, 6.8 |
| FR-009–014 | 6.3 |
| FR-015–019 | 6.4, 6.5 |
| FR-020–025 | 6.6 |
| FR-026–030 | 6.1, 6.3–6.6, 6.9 |
| FR-031–036 | 6.7, 6.8, 6.9 |

## Epic List

### Epic existante SMN-6 — Composer, exporter et retrouver des rapports professionnels

**Extension fonctionnelle** : le Scrum Master/RTE génère des copies Word/PPTX à partir de fichiers modèles, avec valeurs, tableaux et graphiques SMN. Les exports Office sont **sans historique ni révision**, contrairement aux contrats PDF historiques qui restent inchangés.

**FRs couvertes :** FR-001 à FR-036. **Stories proposées :** 9.

## Epic SMN-6 : Extension — Exports Office Word et PowerPoint

### Story 6.1 : Valider la fidélité des transformations Office par une preuve de concept

**En tant que** responsable du produit SMN,
**je veux** disposer d'une preuve vérifiable que les modèles Word et PowerPoint restent fidèles après insertion ciblée de données,
**afin de** éviter d'engager un moteur de rapports incompatible avec les présentations préparées.

**Couverture :** FR-026 à FR-030 ; NFR-01, NFR-02, NFR-05 ; AD-05, AD-06, AD-08, AD-10.  
**Dépendances :** Aucune.

**Critères d'acceptation :**

**CA-1.1** — **Étant donné** un modèle DOCX avec styles, en-têtes/pieds et tags fragmentés est fourni, **lorsque** le POC remplace les tags, **alors** le fichier est ouvrable, les parties non ciblées sont préservées et les différences observées sont consignées.

**CA-1.2** — **Étant donné** un modèle PPTX avec thème, masque, notes, formes et zones textuelles est fourni, **lorsque** le POC insère valeurs et image, **alors** aucun objet non ciblé ne change de position ou ne disparaît.

**CA-1.3** — **Étant donné** des tableaux avec 0, 1 ou N lignes et des valeurs longues dans des modèles Word et PowerPoint, **lorsque** le contenu dépasse l'espace prévu, **alors** le dépassement est accepté ; le POC vérifie que SMN ne modifie pas artificiellement les dimensions ou positions des objets pour faire tenir le contenu, et consigne les limites.

**CA-1.4** — **Étant donné** les essais sont exécutés dans l'environnement Windows 11 pertinent, **lorsque** les résultats sont examinés, **alors** choix de bibliothèque, licence, versions, preuves et échecs sont documentés pour arbitrage.

### Story 6.2 : Découvrir automatiquement les modèles Office disponibles

**En tant que** Scrum Master ou RTE habilité,
**je veux** voir et sélectionner les modèles Word et PowerPoint déposés dans mon répertoire de modèles,
**afin de** choisir un rapport sans configuration ni saisie de modèle dans SMN.

**Couverture :** FR-001 à FR-004 ; FR-031 ; NFR-03, NFR-04 ; AD-01, AD-02.  
**Dépendances :** Story 6.1 pour la bibliothèque et les limites du format.

**Critères d'acceptation :**

**CA-2.1** — **Étant donné** un fichier DOCX ou PPTX valide est ajouté au répertoire autorisé, **lorsque** j'actualise l'écran Rapports, **alors** son nom et son format sont proposés automatiquement.

**CA-2.2** — **Étant donné** un modèle est retiré, **lorsque** j'actualise, **alors** il disparaît sans action en base de données.

**CA-2.3** — **Étant donné** un fichier non autorisé, temporaire, symlink ou chemin hors racine est présent, **lorsque** SMN parcourt le catalogue, **alors** il n'est pas utilisable.

**CA-2.4** — **Étant donné** un utilisateur n'a pas accès à l'écran ou à son équipe, **lorsque** lorsqu'il demande un modèle via l'API, **alors** les droits serveur sont vérifiés et aucun chemin interne sensible n'est divulgué.

### Story 6.3 : Générer un document Office avec des valeurs simples SMN

**En tant que** Scrum Master ou RTE habilité,
**je veux** remplacer les tags reconnus d'un modèle par les informations de l'équipe et du sprint sélectionnés,
**afin de** obtenir un rapport prérempli sans retoucher sa présentation.

**Couverture :** FR-005 à FR-014 ; FR-026 à FR-030 ; NFR-01, NFR-06 ; AD-03 à AD-05.  
**Dépendances :** Stories 6.1–6.2 ; réutiliser les projections existantes.

**Critères d'acceptation :**

**CA-3.1** — **Étant donné** un tag connu référence une valeur disponible, **lorsque** je génère, **alors** seule sa zone est remplacée et la valeur correspond à la projection métier autorisée.

**CA-3.2** — **Étant donné** un tag est inconnu, **lorsque** je génère, **alors** il reste intact.

**CA-3.3** — **Étant donné** une valeur connue est absente et une autre vaut zéro, **lorsque** je génère, **alors** elles s'affichent respectivement N/D et 0.

**CA-3.4** — **Étant donné** un tag est fragmenté en runs Office, **lorsque** je génère, **alors** il est remplacé sans supprimer le style ni le texte adjacent.

**CA-3.5** — **Étant donné** une sélection équipe/cycle non autorisée ou un tag reconnu mal paramétré est soumis, **lorsque** l'API contrôle la demande, **alors** elle rejette l'accès non autorisé ou signale une erreur de syntaxe, sans inventer de valeur.

### Story 6.4 : Alimenter des tableaux dynamiques dans les modèles Word

**En tant que** Scrum Master ou RTE habilité,
**je veux** renseigner automatiquement les lignes d'un tableau Word à partir des données de SMN,
**afin de** produire des synthèses détaillées dans mon propre style Word.

**Couverture :** FR-015 à FR-018 ; FR-026 à FR-030 ; NFR-02, NFR-05 ; AD-03, AD-05, AD-06.  
**Dépendances :** Stories 6.1 et 6.3 ; contrats de lignes modèles.

**Critères d'acceptation :**

**CA-4.1** — **Étant donné** un tableau modèle compatible et plusieurs enregistrements existent, **lorsque** le rapport est généré, **alors** une ligne est créée par enregistrement avec les styles de la ligne modèle.

**CA-4.2** — **Étant donné** aucune ligne métier n'est disponible, **lorsque** le rapport est généré, **alors** N/D apparaît à la zone prévue et le document reste valide.

**CA-4.3** — **Étant donné** des cellules non dynamiques entourent le tableau, **lorsque** les lignes sont générées, **alors** elles demeurent intactes.

**CA-4.4** — **Étant donné** un tableau contient des constructions non prises en charge, **lorsque** le moteur l'analyse, **alors** il produit un diagnostic explicite au lieu d'altérer silencieusement le fichier.

### Story 6.5 : Renseigner des tableaux dynamiques dans les modèles PowerPoint

**En tant que** Scrum Master ou RTE habilité,
**je veux** remplir des tableaux PowerPoint sans dégrader les diapositives préparées,
**afin de** générer des présentations prêtes à l'emploi.

**Couverture :** FR-015 à FR-019 ; FR-026 à FR-030 ; NFR-02, NFR-05 ; AD-05, AD-06.  
**Dépendances :** Stories 6.1 et 6.3 ; règle de débordement validée le 06/11/2026.

**Critères d'acceptation :**

**CA-5.1** — **Étant donné** un tableau PPTX compatible comporte assez d'espace, **lorsque** les données sont injectées, **alors** les lignes et styles sont conservés et la diapositive reste lisible.

**CA-5.2** — **Étant donné** aucune donnée n'est disponible, **lorsque** je génère, **alors** N/D apparaît sans déplacement des autres objets.

**CA-5.3** — **Étant donné** un tableau dont les données dépassent l'espace prévu sur une diapositive, **lorsque** SMN produit le rapport, **alors** le dépassement est accepté : SMN conserve les dimensions et positions d'origine, ne grossit pas artificiellement le tableau ou la diapositive et ne crée pas de diapositive supplémentaire pour corriger ce dépassement.

**CA-5.4** — **Étant donné** un tableau comporte une disposition non compatible, **lorsque** sa génération est demandée, **alors** SMN indique les limites sans corrompre la présentation.

### Story 6.6 : Insérer les graphiques de tendances SMN comme images

**En tant que** Scrum Master ou RTE habilité,
**je veux** placer les graphiques de tendances des indicateurs dans mes modèles et, si nécessaire, ajuster leurs séries et leur période par tag,
**afin de** illustrer les performances sans recréer les graphiques dans Office.

**Couverture :** FR-020 à FR-025 ; FR-026 à FR-030 ; NFR-06, NFR-07 ; AD-03, AD-04, AD-07, AD-08.  
**Dépendances :** Stories 6.1 et 6.3 ; moteur de tendance SMN v33 déjà présent.

**Critères d'acceptation :**

**CA-6.1** — **Étant donné** un emplacement graphique valide et une série disponible sont fournis, **lorsque** je génère, **alors** une image nette est insérée sans déformation à l'emplacement réservé.

**CA-6.2** — **Étant donné** plusieurs indicateurs compatibles de même unité sont demandés, **lorsque** la génération se termine, **alors** les courbes et la légende correspondent aux données sources.

**CA-6.3** — **Étant donné** les options facultatives de période et de type sont omises ou renseignées, **lorsque** le tag est traité, **alors** les valeurs par défaut ou paramètres validés sont appliqués avec les mêmes règles métier que l'écran Tendances.

**CA-6.4** — **Étant donné** aucune donnée graphique exploitable n'est disponible, **lorsque** je génère, **alors** la zone affiche N/D plutôt qu'un graphique fictif.

**CA-6.5** — **Étant donné** des indicateurs incompatibles ou des options hors limites sont demandés, **lorsque** le moteur contrôle le tag, **alors** il retourne une erreur explicite.

### Story 6.7 : Enregistrer les rapports Office avec confirmation avant écrasement

**En tant que** Scrum Master ou RTE habilité,
**je veux** sauvegarder mon rapport dans un répertoire et confirmer explicitement le remplacement d'un fichier existant,
**afin de** conserver la maîtrise de mes fichiers sans risque de destruction involontaire.

**Couverture :** FR-031 à FR-036 ; NFR-01, NFR-03 ; AD-02, AD-09.  
**Dépendances :** Stories 6.2–6.3 ; adaptable aux tableaux et graphiques ultérieurs.

**Critères d'acceptation :**

**CA-7.1** — **Étant donné** un nom de sortie libre est demandé, **lorsque** la génération est valide, **alors** le rapport est écrit dans le répertoire autorisé.

**CA-7.2** — **Étant donné** le fichier existe, **lorsque** je tente la sauvegarde, **alors** une confirmation explicite est affichée avec le nom et la destination.

**CA-7.3** — **Étant donné** j'annule la confirmation, **lorsque** la requête est abandonnée, **alors** les octets du fichier préexistant restent identiques.

**CA-7.4** — **Étant donné** je confirme mais une erreur ou un verrouillage Windows intervient, **lorsque** la génération ou promotion échoue, **alors** le fichier existant reste intègre et un message compréhensible apparaît.

**CA-7.5** — **Étant donné** un autre processus modifie la destination entre confirmation et écriture, **lorsque** la sauvegarde finale contrôle l'état, **alors** l'écrasement ne se produit pas silencieusement.

**CA-7.6** — **Étant donné** le rapport est enregistré, **lorsque** la génération se termine, **alors** aucune entrée d'historisation de rapports Office ni révision de modèle n'est créée en base.

### Story 6.8 : Offrir une génération de rapport Office intégrée et accessible

**En tant que** Scrum Master ou RTE habilité,
**je veux** choisir un modèle et un périmètre depuis une interface Cockpit Agile puis lancer la génération,
**afin de** utiliser Word et PowerPoint facilement sans manipulation technique.

**Couverture :** FR-001 à FR-008 ; FR-031 à FR-036 ; NFR-04 ; UX Cockpit Agile et i18n FR/EN ; AD-02, AD-03.  
**Dépendances :** Stories 6.2, 6.3 et 6.7 ; capacités tableaux et graphiques activées à leur livraison.

**Critères d'acceptation :**

**CA-8.1** — **Étant donné** j'ouvre Rapports avec une équipe autorisée, **lorsque** je choisis un modèle et le contexte requis, **alors** je peux demander une génération sans saisir de chemin technique.

**CA-8.2** — **Étant donné** un fichier cible existe, **lorsque** l'API détecte la collision, **alors** une modale Cockpit Agile accessible au clavier présente confirmer ou annuler.

**CA-8.3** — **Étant donné** une erreur survient, **lorsque** la génération échoue, **alors** l'écran présente une erreur compréhensible sans détails de chemin sensible.

**CA-8.4** — **Étant donné** je passe du français à l'anglais, **lorsque** je consulte l'écran, **alors** les libellés et messages issus des catalogues JSON correspondants sont traduits.

**CA-8.5** — **Étant donné** une équipe non autorisée est sélectionnée, **lorsque** la génération est demandée, **alors** le serveur rejette l'opération.

### Story 6.9 : Qualifier la fidélité et la sécurité des exports Office en recette

**En tant que** responsable qualité SMN,
**je veux** disposer de preuves de non-régression et de fidélité pour Word et PowerPoint,
**afin de** autoriser l'utilisation de la fonctionnalité sans altérer les rapports existants.

**Couverture :** FR-004, FR-007, FR-026 à FR-036 ; AC-01 à AC-15 ; NFR-01 à NFR-07 ; AD-10.  
**Dépendances :** Stories 6.1 à 6.8.

**Critères d'acceptation :**

**CA-9.1** — **Étant donné** des modèles étalons Word/PPTX et scénarios N/D, zéro, tableaux, graphiques sont disponibles, **lorsque** les tests sont exécutés, **alors** les AC pertinents passent et leurs preuves sont conservées.

**CA-9.2** — **Étant donné** un contenu Office malformé ou disproportionné est soumis, **lorsque** la génération le contrôle, **alors** il est rejeté sans saturation ni divulgation.

**CA-9.3** — **Étant donné** les exports PDF, archives et modèles en base existants sont testés, **lorsque** la recette se termine, **alors** aucune régression causée par le nouveau circuit Office n'est constatée.

**CA-9.4** — **Étant donné** la recette Windows 11, typecheck, lint et tests automatisés sont exécutés, **lorsque** les résultats sont consolidés, **alors** le statut de livraison distingue tests exécutés, échecs et validations manuelles.

## Arbitrages à valider avant de déclarer les Stories prêtes au développement

1. **Arbitré le 06/11/2026 :** les tableaux PowerPoint et les valeurs trop longues peuvent déborder ; SMN conserve les dimensions et positions existantes sans agrandissement automatique, sans création forcée de diapositives et sans troncature implicite.
2. **À détailler dans les tests de fidélité :** distinguer dimensions initiales fixes des lignes nouvellement ajoutées, et vérifier que SMN n'applique aucune déformation artificielle.
3. Convention précise des emplacements images et lignes modèles.
4. Nom de fichier de sortie proposé, et possibilité de le modifier.
5. Langue et locale du rapport Office.
6. Catalogue initial des tags, tableaux, types de graphiques et plafonds de ressources.
7. Politique de fichiers Word/PPTX verrouillés et choix définitif de la bibliothèque après POC.

**Statut au 06/11/2026 :** le Product Owner valide le découpage des neuf Stories et la règle de débordement. La validation finale de complétude BMAD et les arbitrages restants sont encore en cours. Pas de création, édition ni changement d'état Jira.
