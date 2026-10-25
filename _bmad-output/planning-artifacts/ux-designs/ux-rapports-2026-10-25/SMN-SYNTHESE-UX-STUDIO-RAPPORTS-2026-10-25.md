# SMN — Synthèse UX finale de conception du Studio de rapports

**Projet :** Scrum Master Notebook (SMN)  
**Atelier :** Sally — UX Designer, BMAD v6.12.4  
**Date :** 25 octobre 2026  
**Statut :** synthèse des 21 décisions **approuvée en conversation le 25 octobre 2026** ; aucune implémentation ni recette attestée.  
**Périmètre :** rapports de Sprint Scrum pour le MVP, avec réutilisation du concept pour Kanban et extension SAFe/ART ultérieure.

## 1. Intention produit

Transformer le formulaire vertical actuel de préparation du rapport en un **studio hybride** : un rapport généré depuis un modèle versionné, une composition visuelle avancée par blocs, une rédaction directe dans le document, une prévisualisation paginée et un export PDF rapide. L'application doit minimiser la saisie du Scrum Master, produire des rapports exécutifs ou exhaustifs et préserver le sens, la provenance et la qualité des données Agile.

### Principes non négociables

- Les données factuelles sont issues des sources SMN et **ne sont pas corrigées en tant que valeurs dans le rapport** ; les corrections métier s'effectuent à la source.
- Les champs manquants ne sont jamais remplacés par des zéros ou des estimations inventées. Les unités SP, tickets, J/H, scores 1–5 restent explicites et distinctes.
- La capacité prévue/réelle décrit une **disponibilité**, non un effort consommé ; les engagements initiaux en SP/tickets ne sont pas silencieusement remplacés par des engagements révisés.
- Les rapports historiques respectent les instantanés, les corrections historisées et leurs limites de preuve. Une interprétation IA n'est jamais présentée comme un fait mesuré.
- Une action « Exporter en PDF » n'implique **ni publication formelle ni archivage obligatoire**.

## 2. Registre des décisions UX validées

| ID | Sujet | Décision validée |
|---|---|---|
| UX-R01 | Concept général | **C** — Studio hybride : démarrage depuis un modèle puis composition visuelle. |
| UX-R02 | Mise en forme | **B** — Mise en forme avancée et encadrée par blocs. |
| UX-R03 | Initialisation | **A** — Génération complète et automatique du brouillon avec les données disponibles. |
| UX-R04 | Versionnement des modèles | **C** — Versions distinctes et mise à jour volontaire avec comparaison préalable. |
| UX-R05 | Indicateurs | **B** — Graphique, tableau ou les deux pour un même bloc. |
| UX-R06 | Rédaction | **C** — Zones prépositionnées par le modèle et blocs rédactionnels libres. |
| UX-R07 | Intervention IA | **A** — Assistant/brief IA **séparé** ; sélection manuelle des analyses à inclure. Aucune génération IA directe dans l'éditeur. |
| UX-R08 | Pagination | **B** — Automatique, avec ajustements manuels ciblés. |
| UX-R09 | Sortie du rapport | **A** — Export direct, archivage facultatif ; aucune publication/approbation imposée. |
| UX-R10 | Bibliothèque des modèles | **B** — Modèles système protégés et modèles personnalisés administrés. |
| UX-R11 | Espace de travail | **B** — Panneaux indépendamment rétractables ; modes Composition, Rédaction, Aperçu. |
| UX-R12 | Sauvegarde | **A** — Sauvegarde automatique du dernier brouillon, Annuler/Rétablir en session ; aucun historique durable des brouillons ni points de restauration. |
| UX-R13 | Format du document | **A** — A4 portrait **ou** paysage, orientation unique par rapport selon son modèle. |
| UX-R14 | Couverture et sommaire | **B** — Hérités du modèle, personnalisables pour chaque rapport. |
| UX-R15 | Nombre de rapports | **B** — Plusieurs rapports **indépendants** pour un même Sprint. |
| UX-R16 | Fraîcheur des données | **B** — Copie/référence de données à la dernière préparation, détection des changements, comparaison et actualisation volontaire. |
| UX-R17 | Contrôle avant export | **B** — Vérification automatique non intrusive ; seuls les problèmes réellement bloquants empêchent la sortie. |
| UX-R18 | Navigation | **B** — Centre Rapports global, plus accès contextuel depuis chaque fiche Sprint. |
| UX-R19 | Responsive | **B** — Ordinateur complet ; tablette avec édition complète et panneaux escamotables ; téléphone orienté consultation, export, commentaires et corrections simples. |
| UX-R20 | Concurrence d'édition | **A** — Dernier enregistrement confirmé fait autorité, sans verrou ni résolution de conflits ; risque assumé de perte de modifications concurrentes. |
| UX-R21 | Contenus volumineux | **B** — Adaptation intelligente selon le bloc, alertes ciblées et aucune suppression/troncature silencieuse. |

**Règle d'interprétation :** les choix précédents supplantent les recommandations non retenues de Sally, notamment l'IA directement intégrée, l'historique durable, l'orientation mixte et la résolution avancée des conflits.

## 3. Architecture de l'information

### 3.1 Centre Rapports

Entrée principale **Rapports** comportant trois vues/onglets : **Rapports**, **Modèles**, **Archives**. Recherche et filtres par Sprint/période, statut, modèle, équipe lorsque multiéquipe disponible, et tri par dernière modification. Les rapports de travail peuvent être repris et supprimés sous réserve des droits ; les archives restent immuables.

### 3.2 Accès contextuel Sprint

Depuis la fiche Sprint, action **Rapports** ouvrant la liste centrale déjà filtrée sur ce Sprint. Retour explicite vers la fiche Sprint, sans créer une seconde expérience de gestion. Un Sprint peut posséder plusieurs documents indépendants (exécutif, standard, exhaustif, variantes personnalisées).

### 3.3 Bibliothèque des modèles

Miniatures fidèles, type (système/protégé ou personnalisé), version, description, aperçu, utiliser et dupliquer. L'**administrateur** conçoit, modifie et versionne les modèles personnalisés ; les modèles système ne se modifient pas directement. Les utilisateurs en lecture seule ne reçoivent aucune capacité de mutation par la simple présence de cette bibliothèque. Les variantes « Exécutif », « Standard » et « Exhaustif » constituent une **proposition de modèles initiaux**, pas une liste définitivement validée de livrables.

### 3.4 Studio d'un rapport

- **En-tête persistant :** nom du rapport, Sprint, modèle/version, état de sauvegarde, Annuler/Rétablir, Aperçu, Exporter PDF, Figer et archiver.
- **Plan à gauche :** rubriques et blocs, hiérarchie, visibilité, réordonnancement, insertion.
- **Document au centre :** pages fidèles au rendu final, rédaction directement dans la page, prévisualisation des blocs, zoom et pagination.
- **Panneau de droite :** propriétés contextuelles du bloc sélectionné.
- **Modes :** Composition (structure et propriétés), Rédaction (document élargi), Aperçu (lecture seule sans poignées ni contrôles d'édition).
- Panneaux gauche/droit rétractables indépendamment ; l'ordre et le contenu du rapport ne changent pas lors du basculement de mode.

## 4. Modèles, blocs et identité visuelle

Chaque modèle possède : **identité graphique**, **structure**, **bibliothèque de blocs**, **liaisons aux données SMN**, **règles de génération/rendu**. Les styles de titres, paragraphes, tableaux, KPI et graphiques sont hérités, avec des variantes ponctuelles par bloc. Les choix de couverture et de sommaire peuvent être surchargés dans un rapport, sans modifier son modèle.

Blocs cibles : textes enrichis, titres, tableaux libres, KPI, graphiques de tendance, tableau/graphique combiné, listes d'objectifs, cérémonies, risques, dépendances, décisions, actions, obstacles, analyses sélectionnées, images, séparateurs, sauts de page et annexes. Leur disponibilité effective dépend des sources métier existantes.

**Graphiques et tableaux :** choix parmi des formes adaptées à la nature de l'indicateur ; période et profondeur historique configurables ; unités explicites, axes non trompeurs, légendes, valeurs facultatives, sources et qualité de données. Ne jamais additionner des SP d'équipes distinctes comme une métrique ART sans définition métier valide.

**Couverture et sommaire :** facultatifs et configurables par rapport. Champs automatiques pour titre, équipe, produit, période, numéro de page, version archivée si présente ; sommaire synchronisé avec les titres et la pagination. En-têtes et pieds de page définis au modèle. A4 portrait ou paysage **pour tout le rapport**, pas d'alternance par rubrique/page.

## 5. Parcours cible de bout en bout

1. Depuis une fiche Sprint ou le Centre Rapports, accéder aux documents existants.
2. Reprendre un brouillon, ou créer un nouveau rapport en choisissant modèle, titre et langue.
3. Générer **un brouillon complet** depuis les données disponibles, avec les emplacements rédactionnels du modèle.
4. Ajuster la structure, le visuel, les blocs et les commentaires directement dans le studio. Les valeurs métier restent liées à leur source.
5. Préparer **séparément** les briefs IA ; choisir explicitement lesquels sont inclus dans le rapport, en indiquant qu'il s'agit d'interprétations.
6. Si les données sources ont évolué, afficher les différences et permettre une mise à jour **volontaire** sans écraser les commentaires ; signaler les textes potentiellement à réexaminer.
7. Afficher et vérifier le document paginé. Autoriser les sauts de page manuels et les propriétés « conserver ensemble » pertinentes.
8. À la demande d'export, exécuter un contrôle automatique. Sans problème, générer directement le PDF ; avec avertissement, proposer corriger ou poursuivre ; avec erreur bloquante, expliquer et empêcher le PDF invalide.
9. Préserver le brouillon après **export simple**. En option, **Figer et archiver** une version immuable ; une correction future se traduit par une nouvelle version figée, sans écraser l'archive précédente.

## 6. Sémantique des données et mises à jour

Le rapport conserve l'état de ses données à sa dernière préparation/actualisation. Les valeurs historiques, les versions de clôture et la qualité de preuve doivent être affichées fidèlement. Les indicateurs absents sont représentés comme « Non renseigné » / « Non calculable », jamais comme des zéros arbitraires.

En cas de modification d'une source SMN, le rapport n'est **pas** mis à jour silencieusement : il reçoit un signalement et une comparaison quand cette différence est vérifiable. L'utilisateur décide d'actualiser. Les commentaires humains et analyses IA déjà sélectionnées ne sont pas réécrits ; les passages pouvant dépendre d'anciennes valeurs peuvent être signalés pour relecture. L'actualisation d'un rapport n'affecte pas les autres rapports du même Sprint.

**Version du modèle ≠ version du rapport archivé ≠ état du dernier brouillon.** Une nouvelle version de modèle peut être proposée au brouillon, mais jamais appliquée silencieusement. Comparer l'effet sur la structure et protéger les contributions éditoriales.

## 7. Édition et sauvegarde

- Sauvegarde automatique centralisée, avec états « Modifications », « Enregistrement… », « Enregistré », « Échec » ; seul le serveur peut confirmer « Enregistré ».
- Le dernier brouillon enregistré est repris à la réouverture. Annuler/Rétablir est limité à la session ; **aucun** journal durable détaillé ni points de restauration.
- **Dernière écriture acceptée prioritaire** entre plusieurs onglets/sessions ; le risque d'écrasement est accepté. Éviter toutefois qu'une requête plus ancienne provenant de la **même session** écrase une sauvegarde plus récente.
- Le statut d'erreur de sauvegarde est explicite ; un export n'est pas présenté comme représentant des modifications non enregistrées. Déterminer une règle sûre en cas d'échec (exporter seulement la dernière version confirmée ou demander de réessayer).

## 8. Rendu, pagination et débordements

- Pagination automatique A4 dans l'orientation unique du modèle, avec sauts de page ajustables, maintien des KPI et graphiques sur une seule page lorsque possible.
- Texte long : flux naturel entre pages ; titres non isolés. Tableaux longs : fractionnement par lignes, répétition des en-têtes et continuité lisible. Graphiques : ne pas couper image, légende et titre si le bloc peut tenir intégralement sur une page.
- Si le contenu ne tient pas correctement, **alerter** et proposer des corrections ciblées (largeur/ordre des colonnes, variante compacte, annexe, taille raisonnable). Ne jamais masquer ou tronquer des valeurs pour dissimuler le problème.
- L'aperçu doit reproduire le plus fidèlement possible le PDF. Les divergences de moteur de rendu devront être étudiées et testées ; aucune fidélité parfaite n'est présumée aujourd'hui.

## 9. Contrôle qualité et export

Trois niveaux : **erreur bloquante** (PDF techniquement invalide, données nécessaires au rendu réellement indisponibles, droits insuffisants), **avertissement** (donnée manquante, texte provisoire, risque d'obsolescence, présentation douteuse), **information** (source estimée/historique, analyse IA identifiée, version de modèle).

Les avertissements ne bloquent pas automatiquement l'export. Les rubriques volontairement masquées et textes facultatifs vides ne sont pas considérés comme anomalies. Le contrôle est lancé au moment de l'export, sans écran intermédiaire si tout est conforme. L'archivage est **volontaire** et distinct de l'export direct. Les archives sont immuables et consultables via le Centre Rapports.

## 10. Responsive, accessibilité, i18n et droits

- **Desktop :** plan + pages + propriétés, chacun rétractable ; tous les modes.
- **Tablette :** édition complète avec panneaux temporaires escamotables ; priorité à la zone document.
- **Smartphone :** lecture adaptée au petit écran, navigation, export, correction de texte/commentaires ; pas de mise en page avancée complexe. Proposer séparément l'aperçu fidèle de la page A4.
- Accessibilité : clavier pour réordonnancement, indications de focus, libellés de boutons et d'icônes, contrastes dans les thèmes existants, zoom et textes longs FR/EN. La seule couleur ne doit jamais porter un statut. Recette WCAG 2.2 AA à conduire, non attestée.
- Respecter le modèle de droits en vigueur : administration des modèles personnalisés et actions sur les rapports selon habilitations serveur. Le rôle « user » MVP reste lecture seule, sauf décision métier explicite future.
- Textes de l'interface centralisés FR/EN ; les contenus métier libres et analyses conservent la langue de leur source, avec signalétique explicite lorsqu'elle diffère de celle du document.

## 11. Contrôles de recette UX proposés

1. Un rapport de 2 pages et un rapport de 20+ pages sont composables sans formulaire vertical monolithique.
2. Un même Sprint peut posséder au moins deux rapports indépendants avec des modèles distincts.
3. Les modèles système sont protégés ; duplication et versionnement des modèles personnalisés fonctionnent sans altérer les rapports antérieurs.
4. La génération initiale préremplit les seuls champs réellement disponibles ; pas de faux chiffre.
5. Un KPI peut être restitué en graphique, tableau ou graphique + tableau, avec unités et source.
6. Une analyse IA ne s'intègre que par sélection explicite d'un brief externe ; aucune suggestion spontanée dans le studio.
7. Les commentaires prépositionnés et les blocs rédactionnels libres se sauvegardent automatiquement et restent éditables.
8. Les modes Composition/Rédaction/Aperçu et la visibilité des panneaux n'altèrent pas le rapport.
9. A4 portrait et A4 paysage fonctionnent comme orientations uniques d'un document, avec couverture et sommaire configurables.
10. Long tableau : pages multiples, en-têtes répétés et aucune troncature ; graphique non fractionné si sa taille est admissible.
11. Une correction SMN apparaît comme modification de source, n'actualise pas les rapports silencieusement et préserve les commentaires après acceptation.
12. Export direct d'un brouillon vérifié = PDF sans archivage ; le brouillon reste modifiable.
13. « Figer et archiver » conserve un instantané immuable, accessible même après corrections ultérieures.
14. Aucun écran de contrôle ne ralentit un export propre ; les avertissements offrent une sortie volontaire ; les blocages sont motivés.
15. L'échec de sauvegarde ne devient jamais faussement un succès ni un export prétendument à jour.
16. La dernière sauvegarde serveur l'emporte entre sessions : comportement documenté, y compris sa limite de perte de données.
17. L'expérience tablette permet l'édition complète ; l'expérience mobile se concentre sur consultation et corrections simples.
18. Les chemins depuis la fiche Sprint et le Centre Rapports convergent vers les mêmes documents et conservent leur contexte.
19. Les données historiques de SP engagés et de capacité ne sont pas altérées par une présentation attractive.
20. L'écran respecte les thèmes SMN existants, les chaînes FR/EN et les interactions clavier.

## 12. Points restant à qualifier sans modifier les choix validés

**Vérifications techniques nécessaires :**

- Inventaire effectif des données et des API pour la génération complète, y compris preuves historiques et inclusion d'analyses IA.
- Modèle de données à faire évoluer pour plusieurs rapports par Sprint, blocs configurables, modèles versionnés, états de fraîcheur et archives immuables.
- Stratégie de sauvegarde automatique et de sérialisation garantissant l'ordre des requêtes **au sein de chaque session**, malgré la politique multi-session dernier écrit gagnant.
- Sécurité/sanitation des textes enrichis, images, liens et exports.
- Fidélité réelle entre prévisualisation et PDF ; pagination des tableaux, sommaire avec pages et limites du moteur actuel.
- Autorisations détaillées (lecture, création/export, administration de modèles) en cohérence avec les rôles MVP.
- Performances sur de longs rapports, gros tableaux et historique de plusieurs Sprints.

**Détails fonctionnels à documenter dans DESIGN/EXPERIENCE, sans rouvrir artificiellement l'atelier :** taille minimale lisible des blocs, vocabulaire exact des actions, comportement précis en cas d'export pendant un échec de sauvegarde, politique de choix du modèle par défaut, règles d'affichage des données absentes, et tests de clavier/zoom.

## 13. Livrables BMAD préparés après accord

1. `DESIGN.md` — direction visuelle et composants, tokens et variantes, styles des documents, pagination et responsive.
2. `EXPERIENCE.md` — architecture de l'information, parcours, interactions, états, erreurs, accessibilité, sources, export et cas limites.
3. Maquettes de référence des quatre écrans : Centre Rapports, Bibliothèque/Éditeur de modèles, Studio, Contrôle avant export ; versions desktop/tablette/mobile des écrans clés.
4. Contrat de développement à remettre à Amelia et grille de recette UX ; cartographie des Epic/Stories à confronter à Jira avant toute création ou modification.

**Aucune modification GitHub/Jira autorisée ou réalisée par cette synthèse.** Aucun script de validation, build ou test n'est prétendu exécuté. La création/publication de ces documents dans le dépôt et les changements Jira requièrent un accord distinct de l'utilisateur.

## 14. Références de vérification

- Référentiel UX déjà présent : https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
- Workflow BMAD UX : https://github.com/JeanLamora75/SMN/blob/main/.agents/skills/bmad-ux/SKILL.md
- Écran actuel : https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/sprints/%5BsprintId%5D/report/page.tsx
- Éditeur actuel des modèles : https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/sprints/%5BsprintId%5D/report/report-template-chooser.tsx
- Impression actuelle : https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/sprints/%5BsprintId%5D/report/preview/print.css

**Niveau de confiance :** très élevé pour la retranscription des arbitrages UX (≈ 98 %) ; modéré pour la faisabilité technique détaillée (≈ 80 %, à vérifier dans le code et en recette). Aucun accès web avancé ni nouvelle vérification du dépôt lors de cette consolidation.