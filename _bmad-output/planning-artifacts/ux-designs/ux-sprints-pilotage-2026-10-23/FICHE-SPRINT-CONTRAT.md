---
name: "SMN — Contrat UX et fonctionnel de la fiche Sprint"
version: "1.0 - cadrage du 23 octobre 2026"
jira: "SMN-234"
epic: "SMN-228"
status: "cadrage fonctionnel convenu; détails signalés à arbitrer"
language: fr
references:
  - "./DESIGN.md"
  - "./EXPERIENCE.md"
  - "./CONTRAT-DEVELOPPEMENT.md"
  - "../ux-SMN-2026-10-21/DESIGN.md"
---

# Fiche Sprint SMN — Contrat UX/Fonctionnel (SMN-234)

## Décision et périmètre

Le commanditaire demande de remplacer la première fiche Sprint **partielle en lecture seule** par une fiche de pilotage contextuelle, administrable par icône d'édition associée à chaque champ. **Aucun développement n'est commandé par ce document.**

La route `src/app/app/admin/sprints/[sprintId]/page.tsx` **existe déjà** : elle lit le nom, les dates, l'état et les objectifs du Sprint. C'est cette route qui sera enrichie ; ne pas recréer une fiche concurrente. Source de vérité de l'objet : `sprintId` + équipe autorisée, sans conflation avec le cycle sélectionné sur un autre écran.

**Décision explicite : supprimer l'onglet Synthèse.** Un bandeau compact, permanent au-dessus des onglets, suffit à présenter nom, dates/heures, état, équipe et produit. Actions métier de renommer et replanifier par workflows existants. Le badge d'état ne constitue pas une édition directe de statut.

**Sept onglets :** Objectifs | Cérémonies | Capacité | Indicateurs | Registres | Tendances | Bilan. La mise en page choisit plein écran utile et Bootstrap (icônes intégrées localement). « Admin » peut éditer si la règle serveur de la donnée et de l'état du Sprint le permet ; « Utilisateur » ne dispose que de lectures collectives autorisées. Crayon `pencil-square` visible à droite de **chaque donnée effectivement éditable** et libellé accessible « Modifier [champ] ». Valeurs purement calculées et historique immuable sans crayon.

Les données indisponibles, non renseignées, nulles et égales à zéro sont des états distincts et lisibles. Les dates utilisent le fuseau IANA effectif et tiennent compte des changements été/hiver. Les modifications ne se propagent jamais implicitement à d'autres Sprints. Les réglages de cadence, jours ouvrés et modèles restent dans Paramètres.

## Architecture de l'information par onglet

### 1 — Objectifs

Permettre l'ajout d'un objectif et la consultation/édition de la liste **complète** des objectifs du Sprint. Pour chacun : intitulé, évaluation (Non évalué, Atteint, Partiellement atteint, Non atteint), commentaire, action d'édition et historique enregistré. L'évaluation s'édite **dans la fiche de l'objectif**, pas sur un statut global inventé. Utiliser la persistance, les révisions et le droit serveur existants `smn_sprint_goal` (SMN-83). Absence d'objectif ≠ objectif atteignant zéro.

### 2 — Cérémonies

Liste **exhaustive** de toutes les cérémonies, occurrences de modèles et réunions exceptionnelles comprises **sur les dates de ce Sprint**, classées par date/heure ; pagination si le nombre est important, mais accès à toutes les occurrences, sans troncature silencieuse à cinq. Chaque ligne : date, créneau, nom, type/icône Bootstrap propre, durée prévue/réelle connue, statut **dominant et lisible par son texte**, lien vers la page réunion réelle pour modifier. Prévoir filtre de statut si utile, sans remplacer la liste exhaustive initiale.

États persistés actuellement : `scheduled`, `held`, `not_held`, `cancelled`. Une fin dépassée avec statut automatique `held` peut avoir été déduite par `reconcileAttendance` ; afficher sa provenance / confirmation lorsqu'elle est distinguable. **« Ajournée » ou « reportée » reste une demande ouverte** : définir la différence entre un changement de date et une non-tenue avant d'étendre les états. Ne jamais inventer une réunion tenue lors d'une reprise historique. Les modifications d'une occurrence ne changent pas le modèle partagé par défaut.

### 3 — Capacité

Liste complète des membres réellement affectés pendant tout ou partie du Sprint et susceptibles de contribuer, avec nom public autorisé, rôle, période de participation et **nombre de J/H de présence sur le Sprint** en avant. Une colonne séparée peut présenter les **J/H consacrés au développement** afin de ne pas confondre disponibilité brute, allocation et capacité de développement ; privilégier en toutes circonstances le J/H de présence demandé comme donnée principale.

Le moteur `src/server/capacity/engine.ts` fournit déjà un `MemberCapacity.totalJh` **de développement** avec ventilation `DayCapacity` ; il ne prouve PAS la présence brute en J/H. Un producteur collectif supplémentaire doit définir les plages de présence de l'équipe, absences planifiées/imprévues, fériés, fermetures, arrivée/départ, temps partiel et taux d'affectation. Il ne faut pas publier un calcul dérivé de J/H développement sous l'étiquette « présence ». Totaux, unitaires et source indisponible affichés honnêtement. Respecter les gardes de confidentialité déjà en place : le champ nominatif ne doit pas être envoyé au rôle non autorisé.

### 4 — Indicateurs

**Huit valeurs modifiables** : F01 SP initiaux, F02 SP ajoutés, F03 SP retirés, F04 SP terminés, F10 tickets initiaux, F11 tickets terminés, I01 confiance 1–5, I02 clarté des objectifs 1–5. Chaque champ possède sa propre affordance de modification ; possibilité de regrouper dans une même modal les champs d'un bloc fonctionnel pour préserver l'atomicité des quatre SP / deux tickets. La validation est serveur, nulle/absente distincte de zéro, conservation d'audit et révision optimiste.

**Quatre dérivés affichés en direct** : F05 engagement final = F01 + F02 − F03 ; F06 SP restants = F05 − F04 ; F07 taux SP = F04/F05×100 quand F05 strictement positif ; F12 taux tickets = F11/F10×100 quand F10 strictement positif. Les brouillons recalculent immédiatement ces valeurs et portent la mention **« Provisoire — non enregistré »**, tandis que les widgets enregistrés réagissent à la sauvegarde effective. Ni plafonnement automatique des pourcentages >100 % ni zéro inventé pour dénominateur absent/égal à zéro. La persistance de I01 et I02, avec horodatage et auteur, **n'existe pas encore** : Story à implémenter dans le lot concerné.

### 5 — Registres

Une seule liste par date, regroupant les fiches de **six registres** : Risques, Obstacles, Dépendances, Décisions, Actions et Faits marquants. Afficher les objets qui sont **créés/ouverts durant le Sprint OU encore actifs à n'importe quel instant du Sprint**, y compris ceux clos/résolus au cours de cette période. Ne pas limiter la requête aux seules fiches créées entre les bornes. Les fiches ponctuelles (décisions, faits) suivent la date métier ; les états continus utilisent la période de validité d'association. Une fiche liée à plusieurs Sprints demeure unique. Afficher type, date métier, nom, statut, niveau de priorité fondé, lien réel de lecture/édition selon droit. Filtres facultatifs type/statut, liste exhaustive par pages. Sur Sprint clos : lecture de la version qualitative de clôture (SMN-111/112), jamais substitution de l'état courant. Sans producteur Epic 5, indiquer « Registres indisponibles », sans simulation.

### 6 — Tendances

Trois **graphiques** distincts portant sur **G04 = cinq derniers Sprints clôturés éligibles**, contextualisés à l'équipe et à la date du Sprint de référence : G05 SP terminés, G06 taux de réalisation, G07 capacité réelle J/H. Source existante `readSprintTrends`, à adapter depuis la présentation actuelle sous forme de tableaux vers une visualisation graphique. Axe chronologique, étiquettes unités, données manquantes non converties en 0, alternative tableau accessible. Clôtures Vn immuables ; ne pas inclure les Sprints postérieurs au cycle consulté.

### 7 — Bilan

Deux blocs autonomes **côte à côte sur desktop et empilés sur mobile** :
- **Analyse** : zone textuelle éditable par le Scrum Master, avec sauvegarde, date/auteur, dernière version, révisions.
- **Analyse IA** : zone textuelle également éditable et historisée, identifiant la provenance d'une génération IA et de chaque retouche humaine. La génération automatisée et les briefs/analyses IA (Epic 9) sont des **dépendances différées**, pas une fonctionnalité supposée exister. Un admin peut rédiger ou corriger le texte sans lancer d'IA.

Éditions et sauvegardes indépendantes ; gérer le conflit de version ; empêcher tout écrasement des modifications humaines par une génération future ; rattacher aux versions V1/V2 de clôture en conservant les états attestés. Sur Sprint clôturé, lecture historique et workflows autorisés, pas de mutation ordinaire.

## Navigations, droits et interactions transverses

- Entrée par la liste /app/admin/sprints, par le bandeau du tableau de bord ou par le calendrier ; tout lien transmet le `sprintId`.
- Un seul Sprint à la fois ; ne pas recréer de sélecteur de Sprint dans chaque bloc. Les états de brouillons sont protégés lors d'un changement d'onglet ou navigation, avec confirmation de l'abandon.
- Des données éditables peuvent avoir un crayon ouvrant une modal préremplie ; une cérémonie ou une fiche de registre peut avoir un **lien vers sa page dédiée** si l'édition y est plus pertinente. Une valeur calculée n'a jamais d'icône d'édition.
- Contrôles clavier, focus restitué après modal, contraste, libellés ARIA nommant la donnée, FR/EN centralisés JSON, dark/light + palettes, zoom 200 %, responsive avec table lisible.
- Gestion des états vides, d'indisponibilité, d'erreur et de chargement sans inventer de faits.
- Pas de modification de données ou de Jira du seul fait de consulter la fiche ; pas de duplication de la logique de calcul, de permission ou d'historisation.

## Sources vérifiées et périmètre de futures US

- Fiche partielle réelle : `src/app/app/admin/sprints/[sprintId]/page.tsx`.
- Objectifs : `src/server/sprints/goals.ts` ; SP : `story-points.ts` ; tickets : `ticket-counts.ts`.
- Réunions et statuts : `template-occurrences.ts`, `attendance.ts`, `actual-duration.ts`, `exceptional-meetings.ts`.
- Développement J/H par personne : `src/server/capacity/engine.ts`.
- Tendances : `src/server/sprints/trends.ts` ; clôtures : `src/server/sprints/closure.ts`.
- Registres : **Epic 5 pas encore réalisée** ; rapports : Epic 6 ; analyses IA : Epic 9 ; reprise : Epic 8.

Le plan d'implémentation et les étapes de vérification sont dans `_bmad-output/implementation-artifacts/plan-developpement-fiche-sprint-smn-234-2026-10-23.md`. L'inscription des exigences dans une Story unique SMN-234 **ne signifie pas** qu'elles devront être développées en un seul lot ; les incréments devront être découpés en unités indépendantes et testables.

## Arbitrages ouverts (ne pas confondre avec des validations)

1. **Ajournée / reportée** : statut autonome ou déplacement de créneau et historique de report, distinct de `not_held` et `cancelled`.
2. **Définition du J/H de présence** : heures contractuelles, allocation équipe, temps partiel, absences et jours partiels, échelle d'arrondi ; affichage collectif versus nominatif selon profil.
3. **Confiance / clarté (1–5)** : fréquence d'évaluation, conservation de plusieurs mesures et sens d'une correction historique.
4. **Analyse IA** : provenance, date, versions, protection face à régénération, intégration future réelle de l'Epic 9.
5. **Ordre d'ouverture de la fiche** : Indicateurs proposé par Amelia comme onglet initial, **non encore explicitement validé** ; ne pas figer dans le contrat d'acceptation.

**Statut** : cadrage documenté et publié, code non modifié ; validation de fin de développement non acquise.


## État de développement D1 — 23 octobre 2026

La structure D1 de la fiche Sprint est publiée sur `main` : bandeau compact, sept onglets avec Objectifs conservés, deux crayons admin (nom et dates) activant les **véritables** commandes métier, traduction FR/EN, navigation clavier, contrôles IANA/DST. Les six autres onglets sont pour l'instant des écrans d'attente explicitement identifiés ; les actions Objetifs (ajout et édition) restent du ressort de D2.

Cette publication **ne vaut pas recette finale** : seuls huit essais unitaires isolés du module horaire ont été exécutés avec succès ; compilation complète, API/DB et contrôle navigateur restent à effectuer. Traçabilité : [réalisation D1](../../../implementation-artifacts/realisation-d1-fiche-sprint-smn-234-2026-10-23.md).


## État D2 — 23 octobre 2026

La partie Objectifs de SMN-234 est maintenant **implémentée dans le code sur main**, avec liste intégrale, création, édition et évaluation dans une modal Bootstrap, commentaires et contrôle de révision côté API. Le code crée toujours un objectif avec `not_evaluated`. Un utilisateur en lecture collective peut consulter les objectifs, mais aucun crayon ni bouton Ajouter n'est exposé. La page d'un Sprint clôturé lit uniquement sa liste d'objectifs depuis l'instantané Vn de clôture, sans conversion en source courante.

Le lecteur spécifique `src/server/sprints/goals-detail-read.ts` reste compatible avec `REPEATABLE READ READ ONLY` : aucun DDL ni correction implicite des données. Le contrat UI demeure celui des **sept onglets**, sans Synthèse. La recette complète est **en attente** de tests locaux et visuels ; voir [livraison D2](../../../implementation-artifacts/realisation-d2-objectifs-fiche-sprint-smn-234-2026-10-23.md).


## État D3 — 23 octobre 2026

L'onglet **Indicateurs** est développé sur `main` : huit champs F01/F02/F03/F04/F10/F11/I01/I02 avec crayons d'édition uniquement pour l'admin sur Sprint non clôturé ; les dérivés F05/F06/F07/F12 se recalculent **dans le brouillon de la modal** dès une saisie valide et restent non enregistrés jusqu'à confirmation. Les trois groupes (Story Points, Tickets, Confiance/Clarté) sont sauvegardés séparément avec protections de révision/audit. Les deux notes 1–5 sont persistées dans `smn_sprint_scores` et auditées dans `smn_sprint_scores_audit`. Chaque nouvelle clôture capture les notes et les valeurs SP/tickets en snapshot Vn, sans substituer les sources courantes aux clichés anciens incomplets. Le lecteur dédié est SELECT-only sous contrôle de l'équipe. Aucun champ calculé ne comporte un crayon.

Vérifications : revue statique 18/18, compilation TS isolée du vrai module de calcul et 14/14 tests purs d'indicateurs réussis ; **la compilation globale Next.js, les tests d'intégration DB/API, les tests du dépôt et la recette visuelle sont encore à exécuter**. Suivi : [livraison D3](../../../implementation-artifacts/realisation-d3-indicateurs-fiche-sprint-smn-234-2026-10-23.md).


## État de réalisation D4 — 23 octobre 2026

L'onglet **Cérémonies** de la fiche Sprint est implémenté : trois types de sources (cérémonies standards, modèles personnalisés et réunions exceptionnelles), liste triée du plus ancien au plus récent, pagination de 25 sans limite finale implicite, badges de statut **Prévue / Tenue / Non tenue / Annulée / Inconnu**, distinction « Tenue déduite automatiquement » et « Reconstituée », dates localisées selon IANA, durées prévue et réelle distinctes, accès à la fiche Réunion et retour au Sprint. Les données des Sprints clôturés proviennent du snapshot Vn ; une source courante absente est signalée comme partielle, non comme une liste faussement complète.

**Attention :** « Ajournée/Reportée » ne fait toujours pas partie des statuts persistés du producteur. Aucune fusion abusive avec « Non tenue » ou « Annulée » n'a été créée ; une décision métier est nécessaire avant de construire ce nouvel état. La fiche d'une réunion individuelle consulte actuellement la table opérationnelle, même si la liste du Sprint clôturé utilise le snapshot Vn.

**État qualité :** revue statique 18/18 ; module pur `sprint-ceremony-detail.ts` compilé isolément, SHA Git vérifié et 14 assertions isolées exécutées avec succès. Compilation globale / tests du projet / recette navigateur et PostgreSQL **non exécutés**. [Rapport D4](../../../implementation-artifacts/realisation-d4-ceremonies-fiche-sprint-smn-234-2026-10-23.md).


## État de réalisation D5 — 23 octobre 2026

L'onglet **Capacité** présente désormais aux administrateurs les **membres affectés pendant le Sprint**, avec leurs **J/H de présence estimée** comme donnée principale, leurs **J/H de développement** distincts et une indication d'éventuelles journées non calculables. La source est le moteur existant (calendriers hebdomadaires et exceptions, absences, fériés, fermetures, périodes d'affectation). **Une demi-journée disponible représente 0,5 J/H de présence**, indépendamment du rôle Dev, de l'allocation et de la contribution : ceux-ci affectent les J/H de développement, pas l'estimation de présence. L'interface précise qu'il ne s'agit pas d'un pointage de présence effectivement constatée.

**Droit :** les informations nominatives `members` sont réservées à l'admin conformément à `access-policy.ts` ; le rôle user conserve la fiche en lecture, sans chargement ni transmission de données individuelles. Aucun crayon inerte n'est affiché. Les J/H non calculables restent `null`, jamais un faux zéro ; le total disparaît si un membre manque de données. Les **nouvelles** clôtures enregistrent `memberPresence` dans le snapshot Vn. Les anciens snapshots non dotés de cet historique affichent **indisponible**, sans recalcul rétroactif.

**Arbitrage restant** : contrôler/alerter lorsqu'un `contractPercent` à temps partiel ne correspond pas aux demi-journées prévues au calendrier individuel ; ne pas effectuer de deuxième multiplication par ce pourcentage sans définition métier validée.

**Vérification :** revue statique 22/22, module TypeScript pur compilé isolément (SHA Git confirmé), 9/9 assertions isolées exécutées/réussies. Recette SMN, `pnpm typecheck`, tests complets du dépôt, PostgreSQL et navigateur non exécutés. Voir [réalisation D5](../../../implementation-artifacts/realisation-d5-capacite-presence-fiche-sprint-smn-234-2026-10-23.md).


## État de réalisation D6 — 23 octobre 2026

L'onglet **Tendances** est développé dans la fiche Sprint : **G04** sélectionne au plus les **cinq dernières clôtures éligibles** de la même équipe jusqu'au Sprint consulté. **G05** = SP terminés ; **G06** = taux de réalisation (réalisé/engagement final si strictement positif), sans plafond artificiel ; **G07** = capacité réelle **J/H enregistrée dans le snapshot de clôture**. Ces trois valeurs ont leurs **graphiques SVG distincts**, un axe chronologique, des unités, une échelle adaptée et un **tableau accessible** comportant les valeurs exactes et la version Vn. Absence de valeur = `null` et interruption de courbe, pas de zéro fictif ; zéro réel affiché. Les liens de tableau renvoient aux fiches Sprint, sans édition artificielle.

La lecture `readSprintTrends` est devenue **SELECT-only**, compatible avec la transaction READ ONLY du dashboard et de la fiche. Les versions de clôture sont lues sans migration/DDL ni substitution de mesures courantes. Le formulaire historique admin conserve l'endpoint existant.

**Validation partielle réelle :** 16/16 vérifications statiques, compilations TS isolées des modules sources SHA Git vérifiés, **14/14 assertions graphiques et 28/28 assertions du lecteur historique exécutées avec succès** (lecteur PostgreSQL simulé). Compilation totale du projet, tests du dépôt et recette navigateur/PG réel **restent nécessaires** ; voir [rapport D6](../../../implementation-artifacts/realisation-d6-tendances-fiche-sprint-smn-234-2026-10-23.md).


## État de réalisation D7 — 23 octobre 2026

Le **Bilan** est désormais composé de **deux éditeurs indépendants** : Analyse du Scrum Master et Analyse IA. Sur desktop, les blocs sont côte à côte ; sur mobile, empilés. Chaque bloc dispose d'un crayon uniquement en administrateur sur Sprint non clôturé ; un texte de 3000 caractères maximum peut être ajouté, corrigé ou volontairement vidé. Une sauvegarde comporte sa révision propre, son auteur, son horodatage et un enregistrement d'audit avant/après dans `smn_sprint_review_analysis_audit`. Les anciennes révisions sont persistées ; une interface de comparaison de l'historique intégral reste à envisager, non revendiquée comme réalisée.

**IA :** le champ Analyse IA est **éditable manuellement** mais **aucune génération IA automatique** n'est prétendue disponible : `origin=human` quand une personne écrit ce texte. Les marqueurs `human_edited`, `generation_id` et la révision doivent empêcher tout écrasement silencieux par les futurs workflows Epic 9. Le même conflit optimiste protège les deux blocs sans mélanger leurs versions.

**Historique clos :** chaque **nouvelle** clôture Vn capture les deux analyses, leurs textes, auteur/date/version/provenance. Un Sprint clos lit uniquement son propre snapshot Vn ; si un ancien snapshot ne comporte pas `reviewAnalysis`, la rubrique est **historique indisponible**, sans substitution. Aucun changement direct n'est autorisé sur un Sprint clos.

**Vérification :** 20/20 contrôles statiques ; compilation TypeScript stricte du fichier exact SHA Git vérifié et **20/20 assertions isolées exécutées/réussies**. Recette intégrée PostgreSQL/Next.js, `pnpm typecheck`, build et navigateur **non effectués**. Voir [rapport D7](../../../implementation-artifacts/realisation-d7-bilan-fiche-sprint-smn-234-2026-10-23.md).


## État d'intégration D8 — 23 octobre 2026 : Registres (bloqué par Epic 5)

Les **six catégories** de l'onglet Registres sont maintenant présentes dans la fiche, avec un moteur pur de sélection temporelle et pagination par 25, une projection collective **SELECT-only** contrôlant Sprint/équipe et une interface compatible avec des données réelles fournies par un futur `RegistryReadProvider`. Les risques/obstacles/dépendances/actions sont sélectionnés lorsqu'ils ont été **ouverts pendant le Sprint OU actifs à un instant de la période**, y compris ouverts auparavant et résolus pendant ; décisions/faits marquants par date métier. Une fiche associée à plusieurs cycles conserve son identité. Les liens ne sont proposés que lorsqu'une route interne **réelle** est fournie. Aucun statut/ROAM, priorité ou fait automatique n'est inventé.

**Blocage vérifié :** GitHub ne contient pas encore les producteurs métier Epic 5 ; Jira SMN-89 à SMN-112 comporte toujours **24 Stories « À faire »**. La fiche Sprint affiche donc honnêtement **« Registres indisponibles »**, sans total nul factice ni fausse URL. La lecture historique n'utilisera que le dernier snapshot Vn dès que **SMN-111/112** y enregistreront les six registres. Le champ proposé `snapshot.qualitativeRegisters` doit être **confirmé/adapté avec Epic 5**, non considéré comme schéma métier livré ni écrit par D8.

**Qualité et limites :** tests ciblés dans `tests/smn-234-sprint-registers-d8.test.ts` publiés ; `pnpm typecheck`, exécution `tsx --test`, PostgreSQL, build et navigateur restent à faire. **D8 socle disponible, pas fonctionnalité terminée**. Voir [réalisation D8](../../../implementation-artifacts/realisation-d8-registres-fiche-sprint-smn-234-2026-10-23.md). D9 de préparation technique possible, mais validation des sept onglets subordonnée aux six registres effectivement persistés.


## État de recette D9 — 23 octobre 2026 : revue technique publiée, validation globale en attente

**Revue des sept onglets et de leurs droits :** 31/31 contrôles statiques positifs dans les sources GitHub `main` (contexte Sprint et équipe, historique Vn, lecture strictement SELECT-only, données nominatives D5 limitées à l'admin, sources Registres D8 absentes explicitement, FR/EN). **22 tests métiers isolés réellement exécutés avec succès sous Node.js 22**, sur des modules dont les empreintes Git correspondent aux blobs GitHub : indicateurs D3, cérémonies D4, présence D5, tendances D6, validation Bilan D7.

**Correction D9 :** désactivation des liens de détail dans les **listes de snapshot de clôture** Cérémonies/Registres. Un lien vers la réunion/fiche courante pourrait afficher une situation contraire au bilan historique. Message de non-disponibilité historique, localisé FR/EN. Ne pas prétendre disposer d'une fiche historisée individuelle sans route adaptée.

**État de validation :** le fichier de tests `tests/smn-234-sprint-transverse-d9.test.ts` est livré, mais **aucun `pnpm typecheck`, `tsx --test` complet, build Next.js, PostgreSQL ni recette navigateur n'a été exécuté dans le dépôt SMN**. Les anciens formulaires restent installés et accessibles jusqu'à leur recette de remplacement. D8 nécessite toujours les producteurs de l'Epic 5. SMN-234 demeure ouverte, DoD non satisfaite. [Rapport BMAD D9 détaillé](../../../implementation-artifacts/rapport-recette-d9-fiche-sprint-smn-234-2026-10-23.md).
