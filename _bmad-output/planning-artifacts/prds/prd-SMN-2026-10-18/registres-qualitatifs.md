# SMN — Registres qualitatifs : exigences et critères d'acceptation

**Statut :** validé fonctionnellement le 19 octobre 2026 ; détails d'UX/architecture encore ouverts.  
**Référence :** [PRD principal](prd.md), FR-25 et FR-34 à FR-41.  
**Validation groupée :** D-PRD-124 — QLT-01 à QLT-08, approuvées sans modification par l'utilisateur.

## 1. Socle déjà validé, inchangé

- **Six registres disponibles dès le MVP Scrum/Kanban** : risques, obstacles, dépendances, décisions, actions, faits marquants ; extension SAFe/ART en version 1.0. L'utilisateur opérateur reste le Scrum Master/RTE, sans saisie imposée aux équipiers (Product Brief, F-11 à F-13, F-74 à F-90, F-110/F-111).
- **Fiches identifiées, historisées et liées entre elles**, pouvant perdurer sur plusieurs cycles. Registres de risques et dépendances partagés selon leur périmètre, **sans duplication d'une même fiche** ; rattachement possible à plusieurs cycles (F-74/F-75, D-PRD-121).
- **Risques :** classification **ROAM** (Resolved, Owned, Accepted, Mitigated) distincte de la criticité ; probabilité/impact facultatifs à **trois niveaux chacun** : Faible/Moyen/Élevé (F-75/F-76).
- **Obstacles :** Ouvert, En cours de résolution, Résolu, Abandonné ; réouverture et cycle de vie distinct de celui du risque d'origine (F-77/F-78/F-89).
- **Dépendances :** Ouverte, En cours, Satisfaite, Annulée ; indicateur « À risque » distinct du statut, réouverture possible ; acteur externe possible sans compte ou équipe SMN (F-74/F-90).
- **Décisions :** Active, Remplacée, Annulée ; préserver justification et lien vers l'éventuelle décision remplaçante (F-85/F-86).
- **Actions :** À faire, En cours, Terminée, Annulée ; responsable en **texte libre**, date d'échéance facultative, pas de sous-tâches ni pourcentage d'avancement (F-87/F-88).
- **Alertes existantes :** seuil anticipatif **trois jours calendaires par défaut, paramétrable** pour actions et dépendances avec échéance ; pas de notification externe ou modification de statut par les alertes (F-80 à F-84).
- **À la clôture :** instantané risques/dépendances pour les bilans historiques (D-PRD-122) ; **QLT-08 étend cette règle** aux quatre autres registres, sans réécriture des anciens PDF.
- **Modèles et exports :** points qualitatifs sélectionnables dans les rapports HTML/PDF et briefs TXT IA selon leurs règles de confidentialité distinctes (D-PRD-123/FR-26 à FR-33 ; F-98 à F-109).

## 2. FR et critères d'acceptation

### FR-34 / QLT-01 — Saisir rapidement les éléments des six registres

**Besoin :** éviter une saisie administrative disproportionnée pour chaque constat.

**Critères d'acceptation :**
1. Le SM/RTE dispose d'un parcours **commun de création rapide**, accessible depuis le registre concerné et les contextes pertinents (équipe, cycle, cockpit), tout en conservant les champs spécifiques au type choisi.
2. Une nouvelle fiche requiert **un titre non vide** ; sa **date est préremplie** et modifiable si elle correspond à un fait passé. Le système propose un **statut initial approprié au type de fiche**, que l'utilisateur peut ajuster parmi les statuts autorisés.
3. **Description, responsable, échéance, liens et commentaires sont facultatifs** sauf contrainte métier déjà actée pour un type précis ; ne pas inventer une fausse échéance ou un responsable automatique. Les dates d'effet et champs obligatoires additionnels restent à définir explicitement.
4. Une fois la fiche enregistrée, l'utilisateur peut l'enrichir ultérieurement **sans perdre son identifiant**, sa date de création ou l'historique ; la création échouée n'est pas présentée comme réussie.
5. La création n'exige **aucun cycle obligatoire** pour les risques et dépendances (D-PRD-121). La règle des autres types ne doit pas être assimilée implicitement à ce cas tant que leur rattachement n'est pas spécifié.

### FR-35 / QLT-02 — Consulter des registres centralisés et des fiches reliées

**Critères d'acceptation :**
1. Les six catégories sont **identifiables et consultables** depuis une vue centralisée ; chaque enregistrement possède **un identifiant stable** et un historique exploitable.
2. Le SM/RTE peut **filtrer** les listes selon les propriétés disponibles : **équipe/périmètre, cycle, statut, responsable**. Un filtre non applicable à un registre n'exige pas la création d'une valeur métier fictive.
3. Une fiche peut porter **plusieurs associations compatibles** avec les règles du registre (autres objets, objectifs, équipes/cycles) et des **liens bidirectionnels** consultables depuis les deux objets lorsque cela a déjà été validé (F-13/F-79).
4. Un risque ou une dépendance lié à plusieurs cycles reste **une seule fiche centrale**, dont le statut et le responsable sont communs, avec liens vers les cycles associés (D-PRD-121).
5. Ajouter, modifier ou retirer une relation **ne supprime pas silencieusement** les fiches liées et **laisse une trace** ; respecter les cycles clôturés et les instantanés historiques.
6. Le registre central distingue les informations actuelles des **photographies d'état conservées pour les bilans clôturés** (QLT-08).

### FR-36 / QLT-03 — Évaluer la criticité indicative des risques sur une matrice 3 × 3

**Critères d'acceptation :**
1. Le risque offre deux champs **indépendants et facultatifs**, probabilité et impact, avec les valeurs **Faible / Moyen / Élevé**.
2. Lorsque **les deux valeurs** sont connues, SMN calcule et montre une **criticité indicative** à partir d'une **matrice 3 × 3 cohérente**. Un changement de probabilité ou d'impact actualise la criticité calculable.
3. Si **une des deux valeurs manque**, afficher « Non calculable » ou un équivalent explicite, **jamais Faible ni zéro par défaut**.
4. La **criticité et la classification ROAM** sont **indépendantes** : changer ROAM ne change ni la probabilité, ni l'impact, ni la criticité, et inversement.
5. La matrice doit classer des niveaux croissants de probabilité et impact sans inversion de gravité. **La correspondance exacte des neuf cellules aux classes de criticité, les seuils/couleurs et leur éventuel paramétrage restent à arbitrer avant implémentation** : aucune table numérique précise n'est réputée approuvée par la seule validation QLT-03.
6. Les bilans et points d'attention n'affichent une criticité mesurée/calculée que si les deux champs existent, en conservant la provenance des données.

### FR-37 / QLT-04 — Créer des fiches liées avec assistance

**Critères d'acceptation :**
1. Depuis un risque matérialisé, l'action **« Créer un obstacle »** crée une **nouvelle fiche avec identifiant distinct**, description/contexte préremplis depuis le risque, puis offre leur **lien réciproque** (F-77).
2. La fiche risque **reste présente et conserve** son ROAM, sa criticité et son historique après la création ; l'obstacle suit **son propre cycle de vie**.
3. Depuis une décision, il est possible de **créer une ou plusieurs actions** avec des informations de contexte préremplies et un **lien bidirectionnel** vers la décision (F-87).
4. Les champs proposés sont **éditables avant enregistrement**. Aucune création automatique de lien/d'objet ne change par elle-même les statuts du risque, obstacle, décision ou action.
5. La résolution de l'obstacle peut **suggérer** une revue de ROAM ; la clôture d'une action ne clôture pas automatiquement l'obstacle, et les décisions remplacées conservent leurs liens/historiques.

### FR-38 / QLT-05 — Suivre les dépendances interéquipes et externes

**Critères d'acceptation :**
1. Une dépendance possède **une fiche centrale unique** ; elle peut lier une équipe demandeuse à une équipe contributrice, éventuellement d'un autre périmètre autorisé (F-74).
2. L'utilisateur peut sélectionner une **équipe existante de SMN** ou saisir le **nom libre d'une équipe externe**, sans obligation de créer cette dernière comme équipe ni de lui ouvrir un compte utilisateur.
3. La dépendance conserve **statut** (Ouverte/En cours/Satisfaite/Annulée), **indicateur « À risque » indépendant**, échéance facultative, liens et historique.
4. La dépendance peut être associée à **plusieurs cycles sans duplication** ; modifier une échéance ou le statut ne modifie pas automatiquement les cycles reliés, et la replanification d'un cycle conserve la fiche (D-PRD-120/121).
5. Les relations équipe/ART, leur visibilité et les droits d'édition respecteront l'organisation SAFe v1.0 sans importer la gestion multi-ART au MVP. Les cas de fermeture/réouverture de cycles restent tracés selon F-91/F-93/F-96.

### FR-39 / QLT-06 — Afficher les points d'attention sans changer les données

**Critères d'acceptation :**
1. Le **cockpit « Points d'attention »** réunit, lorsqu'ils existent : **risques à criticité élevée**, **obstacles ouverts**, **dépendances marquées « À risque »**, **dépendances/actions proches de leur échéance, dues ou en retard**, et **objectifs associés à des éléments problématiques**, selon F-80 à F-84.
2. Les actions et dépendances **ouvertes** avec date cible utilisent un **seuil d'anticipation commun de 3 jours calendaires par défaut**, modifiable en administration ; la date manquante n'engendre aucune fausse alerte d'échéance.
3. Les échéances des fiches **terminées/annulées/satisfaites** ne déclenchent plus d'alertes de retard. Les règles plus fines de l'état « À risque » restent distinctes des dates.
4. Chaque alerte permet **d'accéder à la fiche et au cycle/périmètre concernés** quand ils existent ; filtres équipe/ART disponibles selon le mode.
5. Les alertes sont **informatives et non bloquantes** : aucun passage de statut, changement d'objectif, correction d'échéance ou envoi de notification externe n'en découle automatiquement.
6. Une criticité inconnue (probabilité/impact absents) n'est **pas assimilée à une criticité faible ou élevée**.
7. La vue peut signaler les cycles terminés **non clôturés** déjà prévus par F-84, sans les clôturer automatiquement.

### FR-40 / QLT-07 — Constituer un journal sélectionnable des faits marquants

**Critères d'acceptation :**
1. Un **journal chronologique des faits marquants**, distinct de l'audit exhaustif des six registres, présente les faits **saisis manuellement** et ceux **remontés automatiquement** selon les catégories actives (F-110/F-111).
2. Un catalogue **initial de catégories significatives** est fourni et administrable. Exemples de catégories **indicatives** à finaliser lors de la conception : décision marquante, résolution d'obstacle, changement de risque élevé, objectif atteint, livraison ou incident collectif. Il ne faut pas supposer que toutes les occurrences sont significatives sans règle.
3. Le SM/RTE peut **activer ou désactiver les catégories automatiques** ; les réglages s'appliquent aux nouveaux événements pertinents selon les règles de provenance, **sans réécriture silencieuse de l'historique passé**.
4. Un fait créé automatiquement **garde une référence vers son objet source** ; il n'est pas une fiche indépendante à l'histoire divergente.
5. Le SM/RTE peut **ajouter un fait manuel**, promouvoir un élément dans la restitution ou **masquer un élément dans le journal** sans supprimer ni modifier son objet source ni les traces d'audit.
6. Le journal peut alimenter les **rapports HTML/PDF et briefs TXT** selon leur sélection et règles de confidentialité, sans présenter un fait masqué comme explicitement sélectionné.

### FR-41 / QLT-08 — Figer les informations qualitatives à la clôture

**Critères d'acceptation :**
1. **À la clôture de chaque cycle**, conserver automatiquement un **instantané daté** des éléments qualitatifs **associés au cycle à cet instant** : risques, dépendances (**déjà validés par D-PRD-122**), ainsi que **obstacles, décisions, actions et faits marquants** ; inclure les statuts et champs existants pertinents à leur représentation historique.
2. Pour un cycle **non clôturé**, les écrans de bilan utilisent les **informations courantes connues**, sans créer un historique de clôture imaginaire.
3. Pour un cycle **clôturé**, les **bilans historiques et nouveaux rapports** utilisent les **états instantanés enregistrés à la clôture**, sans substituer le dernier statut de la fiche centrale à l'état passé.
4. Les registres centraux peuvent **continuer d'évoluer pour les cycles suivants** ; les anciens instantanés et **PDF déjà exportés** ne sont **ni écrasés ni reconstruits automatiquement**.
5. Pour un **fait marquant**, figer l'existence, la date et les informations de restitution connues à la clôture ; ne pas lui inventer de statut de workflow s'il n'en possède pas. Conserver l'identité et les liens de la source, y compris en cas de masquage/promotion distincte dans le journal.
6. **D-PRD-130/A3 :** chaque clôture crée un **nouvel instantané immuable V1, V2, etc.** ; une réouverture conserve les versions précédentes, et une reclôture produit la suivante. Les nouveaux bilans des cycles **clôturés** utilisent **la dernière version**, les cycles **rouverts et donc non clôturés** l'état courant. Les versions précédentes restent consultables, les PDF existants inchangés ; pour une période rétrosaisie, ne pas inventer une photographie passée sans preuve.
7. Le traitement s'applique au **MVP Scrum/Kanban** et s'étend aux **PI SAFe v1.0** en respectant les liens interéquipes et la consolidation du train.

## 2 bis. D-PRD-130/A3 — Scénarios de vérification des instantanés

**[Règle et scénarios détaillés](clarifications-d-prd-130.md) :** la version d'instantané est liée au **cycle et à une clôture effective horodatée**, contient les associations connues à cette clôture et les états des six registres, sans changer les fiches centrales.

1. Première clôture d'un Sprint → **V1** (statuts, données et associations) ; création d'un PDF depuis V1.
2. Réouverture → statut **Terminé**, V1 **consultable et non modifiée** ; le bilan provisoire lit le registre courant.
3. Mise à jour volontaire d'un risque et d'une action, puis reclôture → **V2** ; nouveau rapport utilisant V2 ; V1 et PDF précédent inchangés.
4. Sprint créé rétrospectivement sans preuve des états d'époque → **état historique indisponible**, pas d'attribution automatique des statuts actuels à la date passée. Toute information retrouvée possède sa provenance et une date de saisie distincte de l'époque décrite.
## 3. Limites et points à finaliser

- **QLT-03 :** table exacte des neuf combinaisons (criticité faible/moyenne/élevée), seuils, couleur et éventuel paramétrage. La décision valide la **matrice 3×3 indicative**, pas une formule numérique arbitraire.
- **QLT-07 :** catalogue initial exact et règles de qualification des « faits significatifs » ; déclencheurs, prévention des doublons et traitements en cas de changement du paramétrage.
- **QLT-08 :** le **principe métier de versionnement V1/V2 et d'utilisation de la dernière version** est arbitré en D-PRD-130/A3. Restent ouverts : modèle technique, présentation des versions et preuve/provenance des faits historiques saisis après leur période.
- **QLT-01/02/05 :** validations supplémentaires spécifiques des six fiches, règles de suppression/archivage, propriétés des liens interéquipes/externes, droits de modification et ergonomie responsive.
- Les champs et scénarios techniques de sauvegarde/restauration, confidentialité/autorisation et rétention seront détaillés dans le domaine **Sécurité et exploitation** ; aucun changement de droits global n'est décidé ici.
- Aucun service de notification externe, nouvelle intégration Jira ou mécanisme de collaboration des équipiers n'est inclus dans ces décisions.

**Traçabilité :** D-PRD-120 à D-PRD-122, D-PRD-124 (QLT-01 à QLT-08), FR-25, F-11 à F-13, F-74 à F-90, F-91 à F-96, F-110/F-111, D-PRD-123 sur les rapports. Les règles du registre risques/dépendances déjà détaillées dans [risques-dependances.md](risques-dependances.md) demeurent applicables sans duplication de leur fiche centrale.
