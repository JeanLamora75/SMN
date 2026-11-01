# SMN — Dashboard Builder
## Spécification fonctionnelle consolidée — v1.0

**Date :** 1er novembre 2026  
**Agent :** John — Product Manager (BMAD Method 6.12.4)  
**Statut :** cadrage métier validé en conversation (D-DB-01 à D-DB-31) ; document de travail à approuver formellement ; réserves UX/architecture à lever.  
**Périmètre :** Dashboard d'équipe Scrum/Kanban, personnalisation par utilisateur habilité et par équipe.  
**Traçabilité :** décisions établies avec le demandeur ; ce document ne vaut ni recette ni validation technique.

## 1. Vision et périmètre

Transformer le tableau de bord d'équipe précédemment fixe en **Dashboard Builder**, outil de composition visuelle simple. L'utilisateur construit des lignes contenant des blocs, choisit un modèle de disposition pour chaque bloc, puis renseigne librement ses emplacements avec des sources SMN et leurs représentations compatibles. L'édition des données métier reste dans leurs modules d'origine.

**Objectifs :** prise en main rapide ; modularité ; utilisation des indicateurs v33, registres, cérémonies, membres, liens, objectifs de sprint, vision et but du produit ; configuration personnelle par équipe ; absence de saisies redondantes ; responsive ; chargement fluide ; historique fiable.

**Exclusions :** texte libre saisi dans le Dashboard ; création/modification directe des informations métier ; partage de Dashboards entre utilisateurs ; nouvelles fonctions SAFe non spécifiées ; intégration d'une source inexistante dans SMN sans Story distincte.

## 2. Glossaire

- **Dashboard :** configuration propre au couple (compte utilisateur, équipe).
- **Header applicatif :** sélecteurs équipe/cycle existants, indépendants du Builder.
- **En-tête du Dashboard :** cadre conservé avec exactement deux blocs dynamiques personnalisables.
- **Ligne :** conteneur ordonné sous l'en-tête.
- **Bloc :** conteneur redimensionnable comprenant un modèle de disposition.
- **Modèle :** patron prédéfini d'emplacements, indépendant des contenus.
- **Emplacement :** zone réceptrice d'une source de données et d'une représentation compatibles.
- **Contexte global :** équipe active et sprint/période sélectionné ; exception locale possible pour le cycle, jamais pour l'équipe.

## 3. Registre des décisions validées

| Décision | Règle retenue |
|---|---|
| D-DB-01 | Dashboard personnel distinct par utilisateur habilité et par équipe. |
| D-DB-02 | En-tête conservé ; zone inférieure constituée de lignes et blocs librement ajoutés. |
| D-DB-03 | Chaque bloc utilise un modèle de présentation prédéfini. |
| D-DB-04 | Chaque emplacement se configure via un bouton « + » ; choix d'une source SMN. |
| D-DB-05 | Catalogue extensible : Amelia peut ajouter de nouveaux modèles. |
| D-DB-06 | Les modèles définissent uniquement la disposition ; sources et représentations sont libres par emplacement, sous réserve de compatibilité. |
| D-DB-07 | Largeur des blocs ajustable ; positions/dimensions mémorisées par utilisateur et équipe. |
| D-DB-08 | Hauteur automatique par défaut, ou personnalisable ; débordement consultable et retour au mode auto. |
| D-DB-09 | Mode Consultation distinct d'un mode Personnalisation dédié. |
| D-DB-10 | Enregistrer / Annuler ; édition provisoire, avertissement en sortie non sauvegardée, sauvegarde atomique. |
| D-DB-11 | Contexte global équipe/cycle avec exceptions par emplacement ; équipe toujours celle du Dashboard. |
| D-DB-12 | Après choix de la source, sélection par miniature parmi les représentations compatibles. |
| D-DB-13 | Listes pertinentes par défaut, personnalisation avancée facultative des colonnes, ordre, filtres, tri et nombre d'éléments. |
| D-DB-14 | Deux blocs entièrement configurables dans l'en-tête du Dashboard, distincts des sélecteurs globaux équipe/cycle. |
| D-DB-15 | Dashboard initial Scrum ou Kanban suivant le mode Agile de l'équipe. |
| D-DB-16 | Sources textuelles exclusivement issues des données métier SMN (vision, Product Goal, objectifs) ; aucun éditeur libre. |
| D-DB-17 | Réinitialisation et duplication de disposition entre équipes accessibles à l'utilisateur, sans transfert de données métier. |
| D-DB-18 | Glisser-déposer des lignes et blocs, y compris entre lignes ; alternatives accessibles ; suppression avec confirmation appropriée. |
| D-DB-19 | Duplication intégrale de la configuration d'un bloc, sans duplication des données métier. |
| D-DB-20 | Emplacements jamais configurés masqués en consultation ; ceux configurés mais sans données restent visibles. |
| D-DB-21 | Permission propre de personnalisation, distincte de la consultation. |
| D-DB-22 | Adaptation responsive automatique sans altérer la configuration de référence sur ordinateur. |
| D-DB-23 | Actualisation automatique périodique et action manuelle « Actualiser ». |
| D-DB-24 | Nouvelles versions des modèles appliquées automatiquement aux blocs qui les utilisent, sans perte silencieuse de configuration. |
| D-DB-25 | Modèles obsolètes retirés des nouvelles créations mais conservés pour les blocs déjà utilisateurs. |
| D-DB-26 | Réinitialisation complète uniquement : en-tête, lignes, blocs ; opération confirmée et provisoire avant Enregistrer. |
| D-DB-27 | Dashboard initial équilibré Scrum/Kanban : deux blocs d'en-tête, indicateurs, listes métier, informations produit sur environ trois lignes. |
| D-DB-28 | Chargement progressif intelligent : structure immédiate, blocs visibles prioritaires, états et erreurs isolés. |
| D-DB-29 | Accès unifié aux contenus du Dashboard selon habilitation d'équipe : consultation seule = lecture seule ; édition requiert consultation ; aucun droit = équipe/Dashboard invisibles. À concilier avec protection des données sensibles. |
| D-DB-30 | Catalogue initial : M01 Simple, M02 Duo, M03 Trio, M04 Quatuor, M05 Asymétrique, M06 Composé. |
| D-DB-31 | Changement volontaire de modèle : correspondance des premiers emplacements, confirmation avant retrait des excédents ; Annuler restaure tout avant sauvegarde. |

**Convention :** les numéros D-DB représentent le cadrage utilisateur et ne constituent pas encore des identifiants de Stories Jira.

## 4. Catalogue initial de modèles

| Code | Nom | Géométrie logique | Emplacements |
|---|---|---|---|
| M01 | Simple | 1 seul | 1 |
| M02 | Duo | 2 égaux | 2 |
| M03 | Trio | 3 égaux | 3 |
| M04 | Quatuor | 4 égaux | 4 |
| M05 | Asymétrique | 1 large + 1 étroit | 2 |
| M06 | Composé | 1 large + 2 étroits | 3 |

Les dimensions exactes, ratios et comportement interne mobile seront spécifiés par Sally puis évalués par Winston. Un modèle définit la géométrie, pas les sources de données ni un type obligatoire de graphique. Chaque nouvel ajout au catalogue doit avoir une identité stable, des règles de compatibilité et une miniature. 

**Évolution :** mises à jour automatiques D-DB-24 avec mécanisme de migration préservant toutes les configurations ; archivage de modèle D-DB-25 sans rupture de blocs existants. Le retrait volontaire d'emplacements D-DB-31 est un parcours différent de la migration automatique.

## 5. Sources et représentations

### 5.1 Familles de sources
1. **Indicateurs v33 :** mesures quantitatives autorisées au niveau de l'équipe ou du cycle, valeurs courantes et historiques conformément aux définitions et snapshots applicables.
2. **Registres :** risques, obstacles, dépendances et autres événements métier disponibles via les services existants ; selon catalogue et habilitations.
3. **Cérémonies / calendrier :** événements et cérémonies datés rattachés au contexte pertinent.
4. **Équipe et membres :** listes et informations collectives autorisées ; données personnelles sensibles à qualifier séparément.
5. **Liens :** catalogue de liens généraux ou spécifiques à l'équipe.
6. **Informations métier textuelles :** objectif(s) du sprint, vision du produit, but du produit et autres objectifs réellement enregistrés dans SMN.

### 5.2 Présentations candidates
- Valeur chiffrée avec unité et libellé.
- Jauge uniquement lorsque le sens, les bornes et l'échelle sont valides.
- Courbe de tendance avec historique comparable.
- Histogramme si séries compatibles.
- Liste et tableau pour les collections, avec navigation vers fiche si autorisée.
- Carte ou texte métier en lecture seule.

**Règle centrale :** seuls les formats compatibles avec la source sont proposés. Aucun calcul métier nouveau ne doit être inventé pour rendre un graphique possible. Une absence de valeur n'est pas égale à zéro. Les définitions v33, unités, snapshots et contextes historiques s'appliquent.

### 5.3 Filtres et contexte
- Chaque emplacement suit par défaut le cycle choisi dans le header applicatif, lorsque sa source est cyclique.
- Exception facultative : toute l'équipe ou cycle explicitement sélectionné, dans la même équipe.
- Un changement de cycle recharge uniquement les emplacements concernés.
- Filtres propres à la source : statuts, responsables, dates, catégories, nombre de lignes, champs affichables.
- Une référence de cycle inaccessible ou supprimée est signalée, sans effacement silencieux du choix enregistré.

## 6. Parcours utilisateur

### P1 — Première ouverture
1. L'utilisateur habilité ouvre l'équipe.
2. SMN recherche la configuration personnelle pour cette équipe.
3. En l'absence de configuration, SMN instancie une disposition initiale équilibrée selon Scrum ou Kanban.
4. Les blocs chargent les données disponibles ; les sources sans résultat affichent un état vide explicite.
5. Le Dashboard demeure utilisable sans personnalisation préalable.

### P2 — Construction d'un Dashboard
1. L'utilisateur disposant de la permission lance « Personnaliser ».
2. Il ajoute une ligne puis un bloc.
3. Une galerie de miniatures propose M01 à M06.
4. Il sélectionne un modèle ; des emplacements vides avec « + » apparaissent.
5. Pour chaque emplacement, il choisit une source puis une représentation compatible.
6. Il configure éventuellement les filtres et dimensions.
7. Il peut continuer à créer autant de lignes et blocs que souhaité, sous réserve des garde-fous techniques justifiés.
8. « Enregistrer » applique atomiquement les modifications ; « Annuler » restaure la version enregistrée.

### P3 — Réorganisation
En mode Personnalisation : glisser-déposer des lignes et blocs, déplacement entre lignes, redimensionnement largeur/hauteur, retour à hauteur automatique, actions alternatives clavier/tactile. En mode Consultation : commandes d'édition absentes.

### P4 — Modification du modèle
Choix d'un autre modèle ; conserver dans l'ordre les contenus correspondant aux emplacements existants. Pour un modèle plus petit, avertir avant retrait des emplacements excédentaires. Le changement reste révocable jusqu'à « Enregistrer ». La migration automatique d'un modèle livré par Amelia doit préserver les configurations.

### P5 — Duplication de bloc
Copier modèle, dimensions, sources, représentation, filtres et exceptions de contexte ; nouveau bloc indépendant. Les valeurs métier sont relues, jamais recopiées.

### P6 — Duplication entre équipes
Un utilisateur habilité sélectionne une équipe source et une équipe de destination auxquelles il a accès, puis confirme le remplacement de disposition. Copier la configuration seule ; réévaluer les références de cycle, les indicateurs et les sources pour l'équipe cible. Préserver les éléments compatibles et signaler ceux à reconfigurer. Ne jamais transporter de données métier d'une équipe vers une autre.

### P7 — Réinitialisation
Depuis le mode Personnalisation, une commande confirmée remplace la composition complète (deux blocs d'en-tête inclus) par le Dashboard initial du mode Agile de l'équipe. Cette opération ne devient définitive qu'après « Enregistrer » ; « Annuler » restaure la composition précédente.

### P8 — Changement d'accès
Consultation + personnalisation : lecture et modification de sa propre disposition. Consultation seule : lecture de la disposition, plus d'accès au Builder. Plus d'accès équipe : l'équipe et son Dashboard sont inaccessibles. La configuration personnelle demeure conservée pour une éventuelle restitution ultérieure. L'édition ne confère jamais la consultation en l'absence de celle-ci.

## 7. Règles détaillées de consultation et d'erreur

- Emplacement non configuré : visible avec « + » uniquement en personnalisation ; masqué en consultation.
- Bloc entièrement non configuré : masqué en consultation.
- Source configurée avec résultat vide : montrer « Aucun résultat » adapté à la source, jamais un zéro fictif.
- Source indisponible / désactivée : conserver le paramétrage et afficher une explication.
- Erreur de chargement : état propre à l'emplacement, commande Réessayer ; les autres emplacements restent opérationnels.
- Valeur zéro valide : affichage numérique exact.
- Lien de fiche métier : navigation sans basculer le Dashboard en Personnalisation.
- Cycle clos : respecter les captures figées et corrections historiques ; ne pas substituer l'état courant à une donnée ancienne.
- L'actualisation périodique ou manuelle ne modifie jamais la disposition sauvegardée.

## 8. Exigences fonctionnelles et critères d'acceptation

| ID | Exigence | Critère principal testable |
|---|---|---|
| DB-FR-01 | Configuration personnelle par équipe | Deux comptes ou deux équipes n'écrasent jamais leurs configurations mutuelles. |
| DB-FR-02 | Header conservé | Deux blocs personnalisables demeurent dans l'en-tête ; les sélecteurs globaux restent opérationnels. |
| DB-FR-03 | Création lignes/blocs | Ajouter plusieurs lignes et plusieurs blocs sans limite métier arbitraire. |
| DB-FR-04 | Modèles de disposition | M01–M06 proposés avec miniatures et emplacement(s) correct(s). |
| DB-FR-05 | Sources et compatibilité | Le « + » propose sources SMN et seules les représentations compatibles. |
| DB-FR-06 | Sources texte métier | Vision, but du produit, objectif de sprint sont affichés depuis leur origine sans éditeur libre. |
| DB-FR-07 | Filtres contextuels | Par défaut cycle global, exception possible sans fuite interéquipe. |
| DB-FR-08 | Listes métier | Configuration simple immédiatement utile, paramètres avancés facultatifs. |
| DB-FR-09 | Redimensionnement | Largeur ajustable, hauteur automatique ou fixée et retour auto ; dimensions mémorisées. |
| DB-FR-10 | Déplacement | Drag-and-drop entre lignes et alternative non gestuelle. |
| DB-FR-11 | Enregistrement | Annuler restaure exactement l'état enregistré ; échec réseau conserve le brouillon à l'écran. |
| DB-FR-12 | Duplication | Bloc copié indépendamment, sans duplication de données métier. |
| DB-FR-13 | Changement modèle | Suppression excédents confirmée ; Annuler rétablit la disposition et toutes les configurations. |
| DB-FR-14 | États vides | Non configurés masqués ; sources configurées vides, erreurs ou indisponibles explicites. |
| DB-FR-15 | Dashboard initial | Première ouverture Scrum/Kanban propose une composition équilibrée et modifiable. |
| DB-FR-16 | Duplication / reset | Transfert configuration seulement ; reset intégral confirme puis attend Enregistrer. |
| DB-FR-17 | Droits | Lire ≠ personnaliser ; sans habilitation équipe, aucune consultation ni modification possibles. |
| DB-FR-18 | Responsive | Une configuration unique reste lisible sur ordinateur, tablette, mobile. |
| DB-FR-19 | Actualisation | Auto et manuel ; l'échec d'un bloc ne bloque pas les autres. |
| DB-FR-20 | Chargement progressif | Structure immédiate, blocs visibles chargés prioritairement. |
| DB-FR-21 | Catalogue évolutif | Nouvelles versions appliquées selon D-DB-24 ; modèles obsolètes encore utilisables si référencés. |
| DB-FR-22 | Fidélité v33 | Valeurs, unités, absence/0, snapshots de clôture et historique conformes aux services métiers. |

**Cas limites obligatoires :** plus de blocs que largeur disponible ; grand nombre de lignes ; bascule mobile ; suppression de ligne non vide ; édition interrompue par changement de cycle/équipe ; perte de droit pendant l'édition ; absence de cycle ; configuration pointant vers un cycle supprimé ; mise à jour de modèle réduisant son nombre d'emplacements ; indicateur non comparable ou non calculable ; échec partiel de chargement ; changement de contexte pendant une actualisation.

## 9. Exigences non fonctionnelles à instruire

- **Sécurité :** vérifier habilitations côté serveur, cloisonnement équipe, droits de consultation/édition, données sensibles, intégrité de la configuration et caches isolés par équipe/utilisateur.
- **Performance :** mesurer le temps jusqu'à structure visible, chargement des blocs prioritaires, volume des requêtes, fréquence de rafraîchissement et comportement de dizaines de blocs ; aucun seuil chiffré arbitraire n'est ici validé.
- **Accessibilité :** navigation clavier, alternatives au drag-and-drop, focus, libellés, couleurs contrastées et mode mobile.
- **Internationalisation :** libellés UI centralisés FR/EN ; textes métier affichés dans leur langue de saisie.
- **Résilience :** erreurs d'emplacements isolées, retries, sauvegarde atomique, non-perte de configuration.
- **Responsive :** réordonnancement lisible sans détruire les dimensions ordinateur.

## 10. Revue de cohérence : écarts et réserves

### R1 — Ancien UX Dashboard
Les contrats d'octobre 2026 imposent un header de cycle, 4–6 cartes métriques et quatre colonnes fixes. La nouvelle disposition libre remplace leur géométrie et leur organisation obligatoire, mais conserve les règles métier valides (historique, unités, zéro distinct de non renseigné, signalétique et navigation). Sally doit tracer les clauses remplacées, conservées et adaptées.

### R2 — Accès unifié D-DB-29
Le demandeur valide que la consultation du Dashboard d'une équipe donne accès à ses contenus métier sans autorisations Dashboard supplémentaires par module. Winston doit préciser les règles de sécurité serveur et les catégories de données sensibles à exclure ou protéger, sans réintroduire tacitement des permissions que le métier vient d'écarter. Tout conflit réel doit être soumis à arbitrage.

### R3 — Migrations automatiques D-DB-24 et retrait volontaire D-DB-31
Une migration de modèle livrée avec l'application peut changer la présentation mais ne doit perdre aucun paramétrage silencieusement. Un changement volontaire de modèle peut retirer les emplacements excédentaires après confirmation, dans un brouillon annulable. Winston doit définir une stratégie de versionnage, migration et reprise.

### R4 — Services d'indicateurs v33
Toutes les lectures et historiques doivent passer par les sources actives v33, avec leurs règles de snapshots, de calcul et de comparaison ; aucun retour aux anciennes tables. L'inventaire des indicateurs réellement compatibles avec valeur/jauge/tendance nécessite confirmation technique.

### R5 — Cadrage historique monoéquipe
Des documents BMAD anciens supposent le MVP monoéquipe. Le cadrage Dashboard Builder repose sur les décisions multiéquipes récentes. Identifier et neutraliser uniquement les clauses désormais obsolètes, sans réécrire rétroactivement leur historique.

### R6 — Dashboard initial
Le modèle initial équilibré Scrum/Kanban est validé dans sa densité, mais la liste exacte des sources/indicateurs doit être confrontée à la disponibilité métier effective. Pas de création de valeur fictive.

### R7 — Performances
Ne pas imposer de plafond métier de lignes/blocs sans nouveau choix utilisateur. Prévoir des limites techniques motivées, sécurité ressources et indicateurs de qualité mesurables.

### R8 — En-tête
Distinguer clairement le bandeau général équipe/cycle, le cadre de Dashboard conservé et les deux blocs dynamiques ; garder la navigation de contexte et l'accès aux détails pertinents.

### R9 — Permissions et session
Clarifier le comportement d'une édition ouverte lorsque les permissions sont révoquées ; la sauvegarde doit revérifier les autorisations, sans perdre ni exposer des données privées.

## 11. Dépendances et livraison BMAD

**Sally (UX)** : maquettes mode Consultation/Personnalisation, galerie des six modèles, choix de source/visualisation, menus et confirmations, comportement responsive et accessible.  
**Winston (Architecture)** : schéma de données par utilisateur/équipe, droits, API de sources, modèles versionnés, stratégie migration, transactions, performance et historique v33.  
**John (PM)** : rapprocher cette spécification du PRD et des tickets existants avant découpage, sans doublon.  
**Amelia (Dev)** : implémenter après validation UX/architecture et des Stories, tests locaux Windows/PostgreSQL/TypeScript/Lint, aucune recette revendiquée sans exécution.

**Lots candidats non encore approuvés :**
1. Stockage et habilitations du Dashboard personnel.
2. Bibliothèque de modèles et éditeur lignes/blocs.
3. Connecteurs sources et représentations v33/métier.
4. Sauvegarde, duplication, changement modèle et réinitialisation.
5. Responsive, accessibilité, chargement et rafraîchissement.
6. Migration de l'ancien Dashboard, jeux de tests et validation utilisateur.

## 12. Références

- [Contrat UX antérieur — DESIGN](../ux-designs/ux-SMN-2026-10-21/DESIGN.md)
- [Contrat UX antérieur — EXPERIENCE](../ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md)
- [Contexte projet](../../../docs/PROJECT-CONTEXT.md)
- [PRD SMN](../prds/prd-SMN-2026-10-18/prd.md)
- [Référentiel UX transversal](../../../docs/UX-REFERENTIEL-BMAD.md)
- [Projet Jira SMN](https://lmn24.atlassian.net/jira/software/projects/SMN)

**Statut final de ce document :** livrable de cadrage produit publié pour revue. Les décisions D-DB-01 à D-DB-31 ont été validées dans la conversation ; le document n'affirme aucune validation d'architecture, aucun développement ni aucun test.
