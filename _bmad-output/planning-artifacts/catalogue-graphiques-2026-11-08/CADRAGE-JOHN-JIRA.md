# John / BMAD — Catalogue graphique Office : cadrage consolidé et transmission Jira

**Date :** 8 novembre 2026  
**Statut :** Cadrage fonctionnel et UX validés ; architecture cible documentée ; **aucune nouvelle User Story Jira ni aucun développement autorisés à ce stade**.  
**Contexte :** SMN v33 · Rapports Office Word (DOCX) / PowerPoint (PPTX) · Epic historique [SMN-6](https://lmn24.atlassian.net/browse/SMN-6).  
**Responsable métier :** John (PM BMAD) ; architecture : Winston ; UX : Sally ; exécution future : Amelia / TEA.

## 1. Objectif et valeur
En tant qu'administrateur SMN, je veux configurer des styles graphiques réutilisables globalement afin que les rapports Word et PowerPoint soient homogènes, personnalisables et générés sans manipulations répétitives. La saisie manuelle du Scrum Master ou du RTE doit rester minimale.

**Périmètre :** graphiques exportés, pas les graphiques du Dashboard Builder ni les données du moteur v33. Six représentations initiales : barres, courbes, aires, secteurs, anneaux, jauge.

## 2. Décisions explicitement approuvées

| ID | Décision | Statut |
| --- | --- | --- |
| CG-01 | Configuration globale pour l'installation SMN, non spécifique à l'équipe. | Validé |
| CG-02 | Styles prédéfinis Cockpit Agile, Corporate, Minimal + styles personnalisés. | Validé |
| CG-03 | Style par défaut par type, avec surcharge facultative `STYLE` par tag Office. | Validé |
| CG-04 | Aperçu déclenché par action explicite, sans recalcul à chaque champ modifié. | Validé |
| CG-05 | Moteur SVG de composition commun à Word et PowerPoint, rendu en PNG pour Office. | Validé |
| UX-01 | M1 : catalogue en **galerie de cartes** (option A), édition sur fiche séparée. | Validé |
| UX-02 | M2 : **sections pliables à gauche / aperçu permanent à droite** (option C). | Validé |
| UX-03 | M3 : **sélecteur global facultatif de style à l'export** (option B). | Validé |

## 3. Exigences fonctionnelles (proposition de contrat pour Stories futures)

### FR-CG-01 — Catalogue global
Un administrateur visualise les styles prédéfinis et personnalisés en galerie visuelle ; chaque carte indique nom, origine, type(s) où le style est utilisé par défaut et actions autorisées.

### FR-CG-02 — Gestion des styles
Créer à partir d'un prédéfini, dupliquer, renommer, modifier et supprimer un style personnalisé. Les styles prédéfinis restent protégés. Empêcher la suppression d'un style défini par défaut tant qu'il n'a pas été remplacé. Gestion de conflit de révision et sauvegarde explicite.

### FR-CG-03 — Configurations et options
Paramètres communs : palette, fond, typographie, titre/sous-titre facultatifs, légende, formats numériques, étiquettes, espacement. Paramètres spécifiques : barres (orientation/groupement/empilement), courbes (trait/marqueurs), aires (opacité), secteurs (étiquettes), anneaux (rayon intérieur/texte central), jauges (épaisseur/seuils, comportement initial 0–100 %). Propriétés exposées uniquement lorsqu'applicables. Bornes techniques à déterminer lors de la planification ; aucun paramètre dangereux ou SVG brut accepté.

### FR-CG-04 — Défauts par type
Un administrateur choisit un style global par défaut indépendamment pour chacun des six types. Le style de compatibilité reste disponible pour les modèles existants.

### FR-CG-05 — Prévisualisation
Dans M2, l'aperçu reste visible mais ne se recalcule qu'au clic « Actualiser l'aperçu ». Données de démonstration clairement annoncées, traitement d'erreur conservant le brouillon, état « À actualiser » dès qu'un champ change.

### FR-CG-06 — Résolution des styles dans les exports
Ordre strict : **`STYLE` explicite dans le tag > style facultatif choisi pour le rapport > défaut du type > compatibilité historique**. Une référence explicitement invalide produit une erreur visible, sans repli silencieux. Le style facultatif du rapport n'est pas persisté dans la configuration globale ni ajouté au modèle.

### FR-CG-07 — Compatibilité Office
Les tags existants `{{CHART:TREND}}`, `TYPE`, `LAST` et `TAGS` restent acceptés. Un paramètre `STYLE=<identifiant>` est ajouté. Les documents déjà produits et archivés sont inchangés. Les données v33 (cycles, unités, valeurs absentes, droits) conservent leurs règles métier.

### FR-CG-08 — Permissions, i18n et documentation
L'édition des styles requiert le rôle administrateur ; l'utilisation respecte les droits de génération du rapport et les équipes autorisées. Écrans, erreurs, documentation des tags et aides en FR/EN centralisés. Documentation Rapports → Tags enrichie des styles et exemples d'utilisation.

## 4. Exigences non fonctionnelles (proposées)

- **NFR-CG-01 :** aucun chargement des styles sur les parcours non concernés ; chargement groupé côté serveur une seule fois par génération contenant des graphiques.
- **NFR-CG-02 :** pas de nouveau calcul d'indicateurs lors de la modification d'un style ; séparation stricte apparence / données v33.
- **NFR-CG-03 :** conserver budgets de tailles, séries (1–6), cycles (1–24), cohérence des unités, contrôle mémoire et limite des PNG existants.
- **NFR-CG-04 :** prévisualisation explicite et plafonnée ; données fictives ne doivent jamais se faire passer pour données réelles.
- **NFR-CG-05 :** benchmark local avant/après DOCX et PPTX, différents nombres et ratios de graphiques. **Cible à valider :** dégradation de durée médiane ≤10 % par rapport à la baseline ; ce n'est pas une mesure acquise.
- **NFR-CG-06 :** fichiers DOCX/PPTX valides dans Microsoft Office Windows 11, sans installation administrateur ; pas de modifications des autres objets ou des archives ; tests de non-régression FR/EN.
- **NFR-CG-07 :** accessibilité WCAG AA, interactions clavier et gestion des états chargement/brouillon/conflit/erreur.

## 5. Références et cohérence avec le produit actuel
- [Architecture cible Winston](./ARCHITECTURE-SPINE.md)
- [Design validé Sally](./DESIGN.md)
- [Expérience UX validée Sally](./EXPERIENCE.md)
- [Maquettes de conception](./MAQUETTES.html)
- [SMN-402 — Graphiques de tendances Office](https://lmn24.atlassian.net/browse/SMN-402)
- [SMN-410 à SMN-414 — Adaptation graphique PowerPoint](https://lmn24.atlassian.net/browse/SMN-414)

**Ne pas modifier rétroactivement les critères des SMN-402 / SMN-410 à 414.** Le catalogue de styles constitue une évolution indépendante qui s'appuie sur leurs interfaces existantes. L'Epic SMN-6 est une référence de rattachement documentaire, pas une décision de créer immédiatement de nouvelles Stories dedans.

## 6. Découpage de travail à proposer ultérieurement (non créé dans Jira)
| Lot | Périmètre | Dépendances principales |
|---|---|---|
| CG-L01 | Baseline de rendu et performances, tests existants | SMN-402 / SMN-410 à 414 |
| CG-L02 | Modèle de configuration globale versionné + validation + droits | Baseline, PostgreSQL |
| CG-L03 | Résolveur de style : tags, choix de rapport, défauts, compatibilité | CG-L02 |
| CG-L04 | Moteur SVG commun DOCX/PPTX + adaptateurs | CG-L01 et CG-L03 |
| CG-L05 | Catalogue visuel M1 et gestion des styles | CG-L02 |
| CG-L06 | Éditeur M2 et aperçu à la demande | CG-L04/CG-L05 |
| CG-L07 | Sélecteur M3 avant export + intégration API | CG-L03/CG-L04 |
| CG-L08 | Documentation FR/EN, non-régression Word/PPTX, recettes et benchmark | Tous les lots concernés |

Ce tableau **n'est pas** un ensemble de User Stories Jira approuvées. John préparera, si demandé, de petites Stories indépendantes avec critères d'acceptation, dépendances et impacts techniques, puis obtiendra la validation de l'utilisateur avant création.

## 7. Portes de validation et état des preuves
- [x] Cadrage fonctionnel approuvé.
- [x] UX M1/M2/M3 approuvée.
- [x] Architecture cible documentée avec avenant M3.
- [x] Traçabilité documentaire sur GitHub.
- [ ] Découpage Epic / User Stories approuvé.
- [ ] Autorisation explicite de création Jira des futures Stories.
- [ ] Développement et tests automatisés.
- [ ] Comparaison visuelle Office réelle et benchmark de performance.

**Travaux autorisés à ce stade : documentation BMAD et Jira uniquement.**
