# SMN — Maquettes de référence du studio de rapports

**Date :** 25 octobre 2026  
**Statut :** propositions visuelles à approuver avec les contrats BMAD  
**Périmètre :** Centre Rapports, bibliothèque de modèles, studio et export  
**Contrats prioritaires :** [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md).

La planche et les captures PNG sont fournies dans l'archive UX téléchargeable de la conversation. Le prototype HTML versionné dans `mockups/` reproduit ces états.

## Ouverture du prototype

Ouvrir le fichier [`mockups/studio-rapports-reference.html`](mockups/studio-rapports-reference.html) dans un navigateur sur ordinateur. **Il fonctionne sans serveur ni connexion réseau**, et toutes les opérations sont purement démonstratives. Les onglets et commandes de la barre latérale permettent de consulter les quatre écrans. Le simulateur permet de créer un rapport fictif, de choisir un modèle, de changer de mode, de masquer/réordonner une rubrique, de passer du graphique au tableau, de comparer 21 SP fictifs à 23 SP fictifs, d'actualiser uniquement ce rapport et d'ouvrir le contrôle export.

Les modifications sont seulement en mémoire vive du navigateur et **perdues au rechargement** ; aucune requête n'est envoyée à SMN, GitHub ou Jira. Les actions « Exporter » et « Figer » montrent le parcours, **sans produire un PDF ni une archive réelle**. Les notifications de sauvegarde indiquent « simulation » : il ne s'agit pas d'une sauvegarde serveur.

| Réf. | Capture | Règle UX principale |
|---|---|---|
| M01 | 01 — Centre Rapports (PNG fourni dans l'archive UX locale) | Recherche, filtres, multiples rapports indépendants par Sprint, Centre unique |
| M02 | 02 — Modèles (PNG fourni dans l'archive UX locale) | Modèles système protégés, version et usage/duplication ; administration personnalisée |
| M03 | 03 — Studio Composition (PNG fourni dans l'archive UX locale) | Plan / papier / propriétés ; modes, autosave, fraîcheur des données, A4 unique |
| M04 | 04 — Contrôle avant export (PNG fourni dans l'archive UX locale) | Vérification automatique, avertissements non bloquants, export direct |
| M05 | 05 — Studio mobile (PNG fourni dans l'archive UX locale) | Lecture mobile et rédaction simple ; aperçu A4 fidèle accessible séparément |
| M06 | 06 — Création (PNG fourni dans l'archive UX locale) | Modèle, titre et langue ; nouveau rapport indépendant |
| M07 | 07 — Comparaison (PNG fourni dans l'archive UX locale) | Conserver ou actualiser volontairement des valeurs sources ; commentaires intacts |

## États couverts et limites

**Couverts en démonstration :** filtres Rapports, onglets Rapports/Modèles/Archives, création de rapport, prévisualisation simple d'un modèle, différents modes du studio, réorganisation et visibilité de rubriques, affichage graphique/tableau, actualisation volontaire des données 21→23 SP, sélection de couverture, contrôle export, ajout fictif à la liste des archives, lecture responsive.

**Présentés dans les contrats mais non réalisés en prototype :** génération complète réelle depuis les API, gestion intégrale de l'éditeur de modèles/versionnement, rendu de 20+ pages, pagination calculée, répétition technique des en-têtes de tableaux, restauration Annuler/Rétablir, conservation serveur du brouillon, i18n effective FR/EN, thème sombre et autres palettes, autorisations serveur, PDF binaire et conformité WCAG. Ces fonctions devront être développées et testées ; une maquette ne prouve pas leur disponibilité.

## Contraintes visuelles à ne pas déduire des illustrations

- Toutes les valeurs d'équipe, de Sprint, de capacité, de Story Points et de pagination sont **fictives**.
- Le thème clair/ocean illustre une direction, sans remplacer les palettes existantes SMN.
- Les trois modèles présentés dans la bibliothèque sont des **exemples**, pas une promesse de catalogue définitif.
- Les libellés exacts, les dimensions et les breakpoints restent des propositions, à ajuster contre la charte SMN et les tests UX.
- Les captures sont des états illustratifs du HTML, **pas des captures de l'application SMN**.

## Ordre de priorité et arbitrages

1. Décisions UX du 25 octobre 2026, consignées dans [la synthèse](SMN-SYNTHESE-UX-STUDIO-RAPPORTS-2026-10-25.md).
2. Contrats [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md), une fois approuvés : ils prévalent sur le HTML et les captures.
3. Maquettes HTML et PNG, pour la composition visuelle illustrative seulement.
4. Les règles métier/techniques du PRD, de l'architecture et les droits actuels restent des contraintes supérieures pour les données ; toute divergence est à signaler.

**Aucun code du dépôt, aucun ticket Jira, aucune base PostgreSQL et aucune route applicative n'a été modifié(e) par cette livraison.**

**Publication documentaire :** le HTML de démonstration est versionné dans le présent dossier. Les PNG ne sont pas inclus à ce stade dans GitHub ; ne pas suivre de lien `references-visuelles/` inexistant.
