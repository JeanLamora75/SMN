# SMN — Référentiel UX approuvé pour tous les agents BMAD

**Décision du 21 octobre 2026 : contrats UX validés, développement non engagé.**

## Contrats faisant autorité

- [DESIGN.md](../_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) : présentation, composition, tokens et responsive.
- [EXPERIENCE.md](../_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) : parcours, règles, historique, accessibilité et recette.
- [Synthèse UXD-01 à UXD-27](../_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) : décisions, dépendances et arbitrages.
- [Maquette de référence décrite](../_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/MAQUETTE-REFERENCE.md) : capture originale approuvée dans la conversation UX du 21/10/2026 et non encore archivée dans GitHub.

## Règles UX impératives

- Interface pleine largeur, sidebar rétractable sous le header ; choix Équipe puis Sprint/période avant Recherche.
- Bloc Sprint/période en haut, avec nom, dates, objectif(s), 4 à 6 métriques ; quatre colonnes : Obstacles, Risques, Événements, Notes/Alertes, 5 cartes maximum chacune.
- Tri automatique, menus d'actions rapides, éléments résolus masqués par défaut mais accessibles via Voir tout, réorganisation des cartes métriques et colonnes, responsive 4/2/1.
- Capacité prévue et capacité réelle disponible en J/H, jamais assimilées à l'effort consommé.
- Story Points et tickets **initialement engagés**, comparés aux réalisés ; ne pas remplacer l'engagement initial par une valeur révisée.
- Compteur jours ouvrés du lundi au vendredi ; inclusion du jour courant/fuseau à préciser avant la formule définitive.
- Pas de carte « Avancement global » avant règle métier validée. Éventuels raccourcis à arbitrer séparément.
- Sur cycle historique, dernières données historiques fiables et corrigées ; sinon message « Aucun éléments à ce jour ». Pas de chiffres fictifs ni projection de l'état courant. Respecter D-PRD-122/130.
- MVP monoéquipe Scrum/Kanban, rôles admin et user ; textes FR/EN centralisés en JSON ; palettes et thèmes SMN-24 préservés.

**Conflits** : les deux contrats UX prévalent sur la capture illustrative ; le PRD et l'architecture conservent leur rôle pour règles métier/techniques déjà approuvées. Toute divergence est à signaler, non à résoudre tacitement.

**Validation UX ≠ développement ou recette.** Vérifier les producteurs de données, formulaires, schémas et preuves avant de déclarer un besoin livré.


## Contrat UX Équipe et membres — 22 octobre 2026 (approuvé)

**À consulter obligatoirement par tous les agents BMAD concernés par l'Epic 3 (SMN-3), l'administration des membres et leurs données individuelles.** Ces contrats complètent le référentiel du tableau de bord sans le modifier :

- [Équipe / Membres — README et statut des validations](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/README.md).
- [DESIGN.md — présentation validée](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/DESIGN.md).
- [EXPERIENCE.md — parcours et règles](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/EXPERIENCE.md).
- [MAQUETTES-REFERENCE.md — vues Cartes, Liste et fiche](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/MAQUETTES-REFERENCE.md).
- [CONTRAT-DEVELOPPEMENT.md — transmission à Amelia](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/CONTRAT-DEVELOPPEMENT.md).

**Règles validées :** menu principal « Équipe » ; présentation exclusive **Cartes OU Liste** via icônes en haut à droite ; dernière vue choisie mémorisée ; **six cartes par ligne et deux lignes initiales** sur desktop, membres actifs suivis immédiatement d'une carte « + » ouvrant une pop-up de création, places libres en cadre gris pointillé ; carte membre blanche arrondie avec nom, pictogramme asexué unique (sans photo individuelle MVP), trois rôles **SM / PO / Dev** colorés/grisés selon les rôles exercés, et fonction ; clic carte ou ligne **ouvre la fiche individuelle**. Fiche approuvée : bandeau identité, onglets **Profil / Affectation / Calendrier / Localisation / Historique**, sections de synthèse et **icônes crayon près des données éditables**. Les images personnelles issues d'un catalogue sont reportées à la **v1**.

**Règles métier :** données réellement enregistrées et historicisées, permissions administrateur et non-rétroactivité ; e-mail facultatif, membre distinct d'un compte, aucune valeur fictive. « Fonction » professionnelle distincte de rôle Agile. Ne pas transformer le statut d'archivage en simple champ éditable.

**Attention livraison :** l'ajout **individuel** d'une personne après initialisation et le champ « Fonction » ne sont pas attestés dans le code existant ; ils nécessitent validation de spécification et développement adapté. Ne pas attribuer ces capacités à SMN-42/43 sans vérification. Les cas > 11 actifs, la vue de départ et les champs précis du formulaire restent à arbitrer. Les illustrations montrent des données fictives.

**Statut :** choix UX entérinés en conversation le 22/10/2026, documentation publiée ; **aucune implémentation ni recette déclarée**. Les documents DESIGN/EXPERIENCE de cette section priment sur leurs exemples illustratifs en cas de conflit.

## Avenant normatif de conformité visuelle Équipe / Fiche — 22/10/2026

**Amelia et les autres agents doivent consulter [l'avenant UX correctif](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/AVENANT-UX-CORRECTIF-2026-10-22.md) et [la grille de recette visuelle](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/RECETTE-VISUELLE-2026-10-22.md) avant de déclarer conformes les écrans.** Trois [références SVG séparées](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/references-visuelles/cible-equipe-cartes.svg) et une comparaison structurelle sont versionnées. Ce sont des reconstitutions, pas les originaux PNG.

**Non-conformité constatée sur les captures fournies le 22 octobre 2026 :** grille et fiche dans un conteneur trop étroit ; cartes illisibles, badges SM/PO/Dev sur plusieurs lignes avec couleurs distinctes, carte + sans libellé ; fiche sans barre de cinq onglets ni disposition Profil à deux colonnes et sans crayons ciblés par donnée. Cause confirmée dans le code : .smn-page max-width 870px dans src/app/globals.css, et un container maxWidth 1000 dans le détail. Correction **ciblée** sans toucher les autres écrans et sans changer le métier. Aucune recette exécutable revendiquée. **Publication documentaire uniquement, aucun code ni Jira modifié par Sally.**

## Fiche membre V2 — décision finale du 22/10/2026

**Référence obligatoire pour Amelia :** [Contrat UX de fiche membre V2](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-UX-CONTRAT.md) et [grille de recette V2](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-RECETTE.md).

**Décisions qui remplacent la fiche ancienne :** un bandeau large sur deux zones, avec nom/fonction/rôles à gauche et e-mail/localisation à droite ; un seul crayon près du nom ouvrant la modale d'identité/localisation ; exactement **4 onglets Affectation, Calendrier, Absences, Historique**. Affectation et ses versions consultables directement ; Calendrier (trames, exceptions et versions) séparé d'Absences (liste, historique et modale dédiée) ; Historique global en lecture seule visible sans crayon. Formulaires de modification exclusivement en modales centrées, sans table d'historique intégrée au formulaire. La fonction est indépendante des rôles et doit être enregistrée et affichée dans la fiche et l'annuaire. La sauvegarde groupée profil/localisation exige une stratégie cohérente sans succès partiel silencieux.

**Priorité documentaire :** les anciens visuels et instructions de fiche avec onglets Profil et Localisation sont archivés pour traçabilité, **non applicables** au développement V2 ; la page Équipe Cartes/Liste conserve ses règles. Aucune implementation ou recette V2 réalisée par Sally, aucune modification Jira.


## Calendrier de sprint/période — décisions UX du 22/10/2026

**Référence obligatoire pour Amelia :** [Contrat UX de calendrier par 7 cartes](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-CONTRAT-UX.md) et [recette de calendrier](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/CALENDRIER-RECETTE-UX.md).

**Décisions validées :** sans période définie, afficher tous les jours du mois civil courant ; avec périodes, afficher préférentiellement le sprint/la période en cours, sinon la plus récente. La grille affiche **7 cartes par rangée**, avec noms de jours en en-têtes **commençant au premier jour de la période**. Chaque carte mentionne jour et mois abrégé à 3 caractères ; **si la date est fériée, le nom du jour férié apparaît immédiatement sous la date, sans grand espacement**, puis **la première réunion doit toujours être visuellement décollée du bloc date/férié** (y compris lorsqu'il n'y a pas de fête). Les réunions sont triées par heure de début. **Survol/focus du nom d'une réunion : heures de début et de fin. Clic du nom : navigation vers la page de réunion.** Pour jour ouvré autorisé, barre + en pied de carte ouvrant une **modale centrée** pour créer une réunion. **Samedis/dimanches : cartes grisées et SANS actions +. Jours fériés en semaine : cartes grisées MAIS AVEC les actions « + Réunion » et « + Absence » si créations autorisées**, car le jour férié peut ne concerner qu'une partie de l'équipe ; réunions déjà enregistrées visibles dans tous les cas. **Aujourd'hui : bordure plus épaisse/colorée**, y compris sur un jour grisé.

**Décisions rectificatives des 22–23/10/2026 :** chaque carte du lundi au vendredi propose **deux actions côte à côte en pied « + Réunion » et « + Absence »** selon les droits ; **+ Absence** ouvre une modale centrée demandant la sélection d'un membre, avec dates de début et fin préremplies à partir du jour de la carte. Le férié ne rend PAS systématiquement le jour non disponible pour la création : + permis du lundi au vendredi, même sur carte grisée, avec avertissement informatif non bloquant recommandé si le férié ne concerne que certains membres. Le week-end reste sans +, même s'il est férié. Il reste à représenter correctement le périmètre pays/membres affectés sans prétendre que toute l'équipe est absente. **Points à analyser avant développement :** route de consultation d'une réunion, intégration réelle des réunions/cycles, plages de dates au-delà de 7/14/28 jours et disponibilité des calendriers fériés. Les événements et droits existants ne doivent pas être effacés. Aucune implémentation, modification Jira ou recette réalisée dans cette livraison documentaire.


## Centre Paramètres — contrat UX approuvé le 23/10/2026

**Décision validée, pour Amelia :** une entrée « Paramètres » avec engrenage dans la sidebar principale rétractable ouvre un **portail de configuration**, pas directement le formulaire général. Ce portail affiche **14 rubriques exactement** dans 4 familles : (1) Application/personnalisation — Informations générales, Langues, Apparence ; (2) Organisation Agile — Cadence des sprints, Cérémonies et modèles, Règles de capacité ; (3) Calendriers/indisponibilités — Jours ouvrés, Pays et jours fériés, Fermetures d'entreprise, Catégories d'absences ; (4) Administration/maintenance — Utilisateurs et habilitations, Sécurité et sessions, Sauvegardes, Journal d'audit.

Les **deux icônes en haut à droite** activent **Cartes** (4/2/1 colonnes desktop/tablette/mobile) ou **Liste**, jamais les deux en même temps ; la préférence est mémorisée et distincte de celle d'Équipe. Toute carte/ligne active ouvre sa destination existante. Les rubriques non encore livrées restent honnêtement signalées « À venir »/« À compléter » sans lien fictif ; **Intégrations externes** et **Notifications** restent masquées. Tous droits et sauvegardes existants sont préservés, mode Scrum/Kanban pris en compte, FR/EN et thèmes conservés.

**Livrables normatifs BMAD** : [DESIGN.md](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/DESIGN.md), [EXPERIENCE.md](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/EXPERIENCE.md), [catalogue/URLs](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/CATALOGUE-ET-ROUTES.md), [contrat de développement](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [recette](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/RECETTE-UX.md), [mapping Jira](../_bmad-output/planning-artifacts/ux-designs/ux-parametres-2026-10-23/DECOUPAGE-JIRA.md).

**Jira** : [SMN-223 (Epic)](https://lmn24.atlassian.net/browse/SMN-223), [SMN-224 à SMN-227 (Stories)](https://lmn24.atlassian.net/browse/SMN-224). Le besoin validé est de **centraliser et présenter** les réglages, non de créer les moteurs métier manquants. Aucun code ni test effectué par cette publication documentaire.


## Avenant — Fiche membre V2 / onglet Absences — 23/10/2026

**Décision utilisateur :** l'onglet Absences affiche les absences du membre par dates décroissantes, réparties en « À venir et en cours » / « Passées » au regard du jour courant Europe/Paris. La première ligne est « + Ajouter une absence » ouvrant une modale de création **contenant uniquement les champs d'absence** ; chaque ligne non supprimée expose Corriger et Supprimer. Les modifications et suppressions d'une date révolue sont permises avec avertissement non bloquant.

**Historisation :** une suppression est logique et auditée ; la ligne reste visible « Supprimée » dans l'historique individuel, mais cesse de compter pour les contrôles de chevauchement, les disponibilités et les capacités non figées. La suppression ne réécrit jamais les références initiales figées ni les bilans clôturés. Les capacités dynamiques sont recalculées **à leur prochaine consultation** ; ce n'est pas une réécriture automatique de l'ensemble des métriques historiques.

**Sources de vérité :** [avenant d'implémentation et de recette](../_bmad-output/implementation-artifacts/ux-fiche-membre-v2-absences-2026-10-23.md), [contrat UX fiche V2](../_bmad-output/planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-UX-CONTRAT.md), [SMN-53](https://lmn24.atlassian.net/browse/SMN-53). La revue UX des autres onglets et la recette Windows restent distinctes. Aucune migration PostgreSQL n'est nécessaire pour cet avenant.


## Refonte de l'écran Sprints — UX validée le 23/10/2026

**Epic [SMN-228](https://lmn24.atlassian.net/browse/SMN-228), Stories [SMN-229 à SMN-234](https://lmn24.atlassian.net/browse/SMN-229).** Contrats opposables : [DESIGN Sprints](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/DESIGN.md), [EXPERIENCE Sprints](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/EXPERIENCE.md), [matrice fonctionnelle](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/MATRICE-FONCTIONS.md), [contrat Amelia](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), [recette](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/RECETTE-UX.md).

**Décisions validées :** régler **horaires d'équipe et pause déjeuner** sous **Paramètres > Jours ouvrés**, **modèles de cérémonie** sous **Paramètres > Cérémonies et modèles**, et cadence sous **Paramètres > Cadence des sprints**. Le menu Sprints affiche **la liste entière** de l'équipe en pleine largeur, uniquement **vue Liste**, état courant en tête, filtres/recherche/tri, un bouton « Générer des sprints » (assistant 1–6 avec prévisualisation), **actions ⋯ par ligne** (renommer/replanifier/supprimer sous contrôles), et lien vers le **Calendrier** contextuel. Opérations de réunion dans Calendrier/page Réunion ; bilans et capacités propres au sprint dans la page Bilan existante et **future fiche**. **[SMN-234](https://lmn24.atlassian.net/browse/SMN-234) est différée** ; pas de lien fictif sur le nom avant sa création. Les réglages généraux ne modifient pas les sprints historiques. Tout écran/URL legacy doit rester utilisable jusqu'à la bascule vérifiée.

**Aucune réalisation/test revendiqués par cette publication UX.**


## Étape 0 — Préparation technique de la refonte Sprints — 23/10/2026

**Livrable Amelia :** [Préparation technique, cartographie des fonctions, risques R01–R12 et gates G0–G6](../_bmad-output/implementation-artifacts/preparation-sprints-etape-0-2026-10-23.md). Ce document prolonge le [contrat UX Sprints approuvé avec Sally](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/CONTRAT-DEVELOPPEMENT.md), l'Epic [SMN-228](https://lmn24.atlassian.net/browse/SMN-228) et les Stories SMN-229 à SMN-234.

**Constats de sécurité :** le lecteur d'états plafonne actuellement à 100 sprints ; la route GET réconcilie des statuts par écriture en base ; l'autorisation actuelle est celle de l'admin Paramètres, tandis que Sally prévoit la consultation par utilisateur habilité. Ces contraintes doivent être traitées explicitement en S2 avant de déclarer l'index livré.

**Préservation :** ne pas retirer de l'ancienne page Sprints les paramètres, réunions, génération ni bilan avant qu'une nouvelle destination réelle soit validée. La reprise historique SMN-160 reste spécifiée mais non développée. La fiche Sprint SMN-234 est différée. La cadence / les dates IANA et les permissions métier restent des garde-fous.

**Tests ajoutés :** `tests/sprints-refonte-etape0.test.ts` (8 contrats) et `tests/sprints-refonte-dates-etape0.test.ts` (3 comportements). **Exécution réelle, typecheck et build à effectuer localement** après synchronisation de `main` ; leur présence ne constitue pas une recette.


## SMN-229 — Déplacement des réglages communs vers Paramètres (23/10/2026)

**Livrable de développement et recette Amelia :** [spécification/traçabilité SMN-229](../_bmad-output/implementation-artifacts/spec-smn-229-deplacement-parametres-sprints.md). Le contrat UX Sally Sprints `S1` est implémenté sur `main` **sous réserve de validation locale**.

- `/app/admin/settings/working-days` : plages horaires matin/après-midi, fuseau IANA, pause déjeuner ; la référence **lundi–vendredi** n'est pas éditable. Statut de rubrique **partiel**.
- `/app/admin/settings/ceremonies` : modèles de réunions récurrentes, fréquence, durée, horaire, actif ; aucune modification des occurrences historiques. Statut **partiel**.
- Portail Paramètres : deux cartes maintenant cliquables en mode Scrum, non applicables en mode Kanban. Cadence inchangée ; règles de capacité toujours non cliquables faute d'éditeur global.
- Page Sprints : trois formulaires de configuration partagée retirés du rendu, remplacés par des liens de transition ; toutes les autres fonctions conservées jusqu'aux prochains lots.
- Les trois API de configuration existantes, leurs restrictions admin et révisions n'ont pas été modifiées ; aucune migration ou mutation de sprint/événement déjà enregistré.
- **Attention aux capacités dynamiques :** les calculs à la demande peuvent utiliser les créneaux actuellement configurés ; les références de capacité/événements **persistés** ne sont pas réécrits. Ne pas prétendre à un versionnement historique des défauts qui n'existe pas.
- Tests ajoutés : `tests/smn-229-settings-relocation.test.ts` (9 scénarios statiques). Tests catalogue et navigation SMN-225/227 adaptés. `pnpm typecheck`, `pnpm build` et validation UI sur Windows restent **à exécuter**.

La Story Jira [SMN-229](https://lmn24.atlassian.net/browse/SMN-229) reste non clôturée en attendant la recette utilisateur.


## SMN-230 — Index des sprints (23/10/2026)

**Livrable Amelia :** [spec-smn-230-liste-sprints.md](../_bmad-output/implementation-artifacts/spec-smn-230-liste-sprints.md). Cible Sally étape S2 implémentée sur `main` **sous réserve des tests locaux et de la recette UX**.

- La route `/app/admin/sprints` est **une liste unique pleine largeur**, avec nom, période IANA, statut réel, recherche par nom (insensible à la casse), filtre, tri, état courant prioritaire, avertissements de données incohérentes et pagination SQL de 25 sprints (sans limite totale à 100).
- Nouveau `GET /api/sprints/index`, consultation collective (admin ou user), recherches bornées, **SELECT** dans `BEGIN READ ONLY`, sans lancer de réconciliation métier ou de migration dans le lecteur. Les vérifications de session privées habituelles restent distinctes et peuvent effectuer leur maintenance existante.
- Les outils d'édition hérités sont **conservés pour l'administrateur** à `/app/admin/sprints/tools`. Le CTA « Générer des sprints » y conduit transitoirement ; l'assistant unique 1–6 relève de SMN-231. Le menu `⋯` n'est pas encore contextualisé par ID (SMN-232), et le calendrier par ID reste explicitement indisponible (SMN-233). Ne pas annoncer ces fonctions comme opérationnelles.
- Navigation « Sprints » ouverte au rôle `user` en mode Scrum, **lecture seule**, sans donner accès aux outils admin ; mode Kanban inchangé.
- Le nom du sprint n'est pas cliquable avant la vraie fiche SMN-234. Aucun lien factice.
- Tests : `tests/smn-230-sprints-index.test.ts` (**14 scénarios** (dont installation sans table de sprint et schéma ancien sans suspension) avec simulation de 123 sprints et cinq pages), tests de navigation/SMN-229 actualisés. **Aucun test, build ou recette Windows exécuté par l'assistant ; résultats à confirmer sur le poste pilote.**

## SMN-231 — Assistant unique de génération des sprints (23/10/2026)

**Implémentation pilote Amelia :** [spec-smn-231-assistant-generation-sprints.md](../_bmad-output/implementation-artifacts/spec-smn-231-assistant-generation-sprints.md). Contrat UX Sally **S3** : une page dédiée `/app/admin/sprints/generate` ouverte par le bouton principal de la liste, avec **1. Configuration → 2. Prévisualisation → 3. Confirmation**, quantité 1–6, noms éditables et avertissements de doublons.

- Réutilisation de la cadence IANA, de `previewSprintBatch` et des schémas de cérémonies ; un nouveau service de jeton autorise **également 1 sprint** sans casser l'ancien contrat de lots 2–6.
- Contrôle des périodes conflictuelles, noms, options, empreinte de configuration, jeton périssable et à usage unique, verrou PostgreSQL par équipe, rollback atomique et audit. Seuls les administrateurs peuvent écrire.
- Reprise historique : générer les cérémonies **décoché par défaut** ; si sélectionné, marquage `generation_source='reconstructed'` visible dans Calendrier et les listes ; ne jamais interpréter comme événement réellement tenu. Les exports restant sans provenance seront qualifiés séparément.
- `prisma/migrations/20261023_smn231_sprint_wizard/migration.sql` : schéma technique additif (jeton, provenance), routines `ensure*` idempotentes. Données et snapshots existants conservés.
- Les anciens outils restent sur `/app/admin/sprints/tools` comme filet de sécurité transitoire ; les actions `⋯` par sprint relèvent de SMN-232.
- **Recette à effectuer** : `tests/smn-231-sprint-wizard.test.ts` (17 scénarios), `pnpm i18n:check`, `pnpm typecheck`, `pnpm build`, validation navigateur et PostgreSQL, notamment SMN-160. La seule lecture GitHub et les assertions statiques ne constituent pas une validation fonctionnelle.


## SMN-231 — Diagnostic des échecs de prévisualisation (23/10/2026)

Retour recette utilisateur : l'assistant de génération restait en étape Configuration après « Prévisualiser », avec un message d'erreur générique, sans signalement du stade d'échec. L'API de prévisualisation classe désormais les incidents par phase technique (schéma, périodes, équipe, pause, paramètres, noms, jeton) et SQLSTATE non sensible ; seule la console serveur journalise le message de la cause. Les étapes de l'assistant ne présentent plus de double numérotation.

**Traçabilité :** [avenant de recette SMN-231](../_bmad-output/implementation-artifacts/spec-smn-231-assistant-generation-sprints.md). **Prudence :** sans le nouveau diagnostic émis sur le poste Windows, aucune cause réelle du blocage n'est établie et la réussite fonctionnelle n'est pas attestée. L'utilisateur doit relancer la prévisualisation, relever l'étape et le code affichés si l'erreur se reproduit, puis confirmer les tests TypeScript et le build. Aucun changement Jira.


## Avenant de réalisation D1 de la fiche Sprint — 23/10/2026

Le cadrage UX de la fiche Sprint a été mis à jour après les anciennes mentions « future fiche », et prime pour cet écran : **sept onglets Objectifs, Cérémonies, Capacité, Indicateurs, Registres, Tendances, Bilan**, bandeau compact sans Synthèse, crayons Bootstrap à proximité des champs réellement modifiables. La Story de référence reste [SMN-234](https://lmn24.atlassian.net/browse/SMN-234) dans Epic SMN-228.

**Code D1 publié sur `main`** : route `src/app/app/admin/sprints/[sprintId]/page.tsx` conservée et enrichie ; le nom de la ligne de liste était déjà cliquable vers la fiche. Sept onglets de navigation, Objectifs existants préservés ; deux actions administrateur effectives sur le bandeau : renommer (PATCH protégé) et replanifier les dates (aperçu obligatoire puis PATCH à jeton). Les autres onglets sont explicitement non raccordés, sans données fictives. La conversion horaire est basée sur le fuseau IANA du Sprint et traite les heures ambiguës/inexistantes du DST. Le rôle utilisateur est en lecture collective, sans crayons.

**Preuves :** huit contrôles unitaires isolés réussis sur le convertisseur horaire, équivalence du SHA GitHub, traduction FR/EN valide ; aucun `pnpm typecheck`, build Next.js ni recette navigateur exécutés sur le projet complet. **D1 est publié mais en attente de validation locale**, D2–D9 non réalisés. Voir [livraison D1](../_bmad-output/implementation-artifacts/realisation-d1-fiche-sprint-smn-234-2026-10-23.md), [contrat UX](../_bmad-output/planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md) et [audit D0](../_bmad-output/implementation-artifacts/audit-d0-fiche-sprint-smn-234-2026-10-23.md).

Les anciennes mentions de fiche future ou de lien non cliquable sont **historiques** et ne décrivent plus l'état du code D1.


## Réalisation fiche Sprint — D2 Objectifs (23/10/2026)

Le code de l'onglet Objectifs de [SMN-234](https://lmn24.atlassian.net/browse/SMN-234) est publié sur `main`. Le Scrum Master admin peut **ajouter un objectif** créé avec état « Non évalué » et **éditer chaque objectif** (titre, commentaire et évaluation) via un crayon Bootstrap et une modal. La lecture collective du rôle utilisateur reste accessible sans boutons de modification. La persistance réutilise `writeSprintGoal`, les révisions et `smn_sprint_goal_audit`, avec refus de mutation des Sprints clôturés. La lecture du Sprint clôturé provient du snapshot Vn, pas des objectifs actuels.

**Statut qualité :** contrôles statiques des fichiers et contrats 12/12 ; tests TypeScript ajoutés mais **non exécutés**, compilation `pnpm typecheck` / build et recette navigateur toujours requises. [Livraison détaillée D2](../_bmad-output/implementation-artifacts/realisation-d2-objectifs-fiche-sprint-smn-234-2026-10-23.md). Les onglets autres qu'Objectifs restent à implémenter selon D3–D8.


## Fiche Sprint — D3 Indicateurs (23/10/2026)

Implémentation publiée de huit saisies administrateur (**F01–F04, F10–F11, I01–I02**), chacune avec crayon à côté de sa valeur, via trois dialogues de groupe. **F05=F01+F02−F03**, **F06=F05−F04**, **F07=F04/F05×100** lorsque F05>0 et **F12=F11/F10×100** lorsque F10>0. Les calculs évoluent **en temps réel sur brouillon** sans enregistrement jusqu'à confirmation, avec distinction `null`/zéro, absence de plafonnement à 100%. Les notes facultatives 1–5 Confiance et Clarté sont enregistrées dans un producteur dédié, versionnées et historisées ; les anciennes API de SP/tickets gardent leurs protections. Clôtures Vn : scores intégrés aux nouveaux snapshots, anciens snapshots incomplets signalés explicitement.

Qualité : **14 assertions isolées effectivement exécutées et réussies** sur le module exact de calcul (SHA Git vérifié) et compilation TS isolée. Le lot D3 est **codé mais non recetté** ; `pnpm typecheck`, tests intégrés et navigateur non exécutés. [Rapport BMAD](../_bmad-output/implementation-artifacts/realisation-d3-indicateurs-fiche-sprint-smn-234-2026-10-23.md). Prochain lot : **D4 — Cérémonies**.


## Fiche Sprint — D4 Cérémonies (23/10/2026)

**Livraison du code sur `main` :** onglet Cérémonies connecté à un lecteur collectif `SELECT-only`, prenant en charge la liste réellement **exhaustive par pagination** des réunions standards, personnalisées et exceptionnelles d'un Sprint, les données du snapshot de clôture Vn, les quatre statuts métiers + inconnu, la provenance de « tenue » et les réunions reconstituées, les dates en fuseau de l'équipe et les durées planifiées/réellement enregistrées. Badge, icône et lien vers la fiche de réunion sont affichés. Le lecteur du dashboard conserve son plafond de cinq pour la carte seulement. La fiche Réunion standard lit son statut réel si disponible, au lieu d'unknown systématique.

**Non réalisé :** ajout du statut Ajournée/Reportée (pas de champ métier approuvé), éditeur direct de statut sur la liste, et fiche individuelle figée sur le snapshot d'un Sprint clôturé (la route Réunion demeure opérationnelle). Aucun crayon artificiel de mutation n'est affiché. D1–D4 sont **codés mais en attente de recette intégrée**.

Vérifications réelles : 18/18 statiques ; compilation TS isolée d'un fichier SHA Git vérifié et 14/14 assertions isolées exécutées. `pnpm typecheck`, `tsx --test` du projet, build et navigateur non exécutés. [Rapport D4](../_bmad-output/implementation-artifacts/realisation-d4-ceremonies-fiche-sprint-smn-234-2026-10-23.md). Prochaine étape D5 : les **J/H de présence** par membre (distincts des J/H de développement).


## Fiche Sprint — D5 Capacité / présence des membres (23/10/2026)

**Publié sur GitHub `main` :** onglet Capacité présentant la liste des membres affectés au Sprint et leurs **J/H de présence planifiée/estimée**, principaux, distincts des **J/H de développement**, secondaires. Calcul depuis les `availableHalfDays` de `readDevelopmentCapacity` sans multiplier par la part de rôle Dev ou les allocations ; absences, jours fériés, fermetures et périodicité des affectations sont déjà gérés par le moteur. La présence n'est **pas une attestation de présence réelle**. Les calendriers individuels doivent représenter les temps partiels, et la cohérence `contractPercent`/calendrier fait l'objet d'un arbitrage ultérieur. Total non calculable si une source manque pour un membre ; aucune valeur manquante n'est remplacée par zéro.

**Autorisation :** seul l'administrateur possède `read members` et voit les noms et J/H individuels. Le rôle user n'engage pas de lecture nominative ; sa fiche Sprint reste accessible sans données privées. Les snapshots JSONB Vn de nouvelles clôtures enregistrent `memberPresence`. Les anciennes clôtures sans snapshot individuel ne sont pas recalculées.

**Validation réelle :** 22/22 contrôles statiques, module de calcul pur compilé isolément (SHA Git vérifié), **9/9 assertions isolées exécutées avec succès**. La compilation complète, les tests `tsx --test` intégrés et la recette PostgreSQL/navigateur restent à faire. [Compte rendu D5](../_bmad-output/implementation-artifacts/realisation-d5-capacite-presence-fiche-sprint-smn-234-2026-10-23.md). Prochain lot **D6 — Tendances**.


## Fiche Sprint — D6 Tendances graphiques (23/10/2026)

**Code publié `main` :** dans l'onglet Tendances, **trois graphiques G05, G06 et G07** sur le socle **G04, au maximum cinq derniers Sprints clôturés de la même équipe, jusqu'au Sprint de référence**. G05 affiche les SP terminés, G06 le pourcentage de réalisation calculable si engagement final >0, G07 les J/H de capacité réelle **issus des instantanés de clôture, non des J/H de présence de D5**. SVG natifs adaptatifs, axe temporel et unités SP/%/JH, ruptures pour les points `null`, taux supérieurs à 100 %, et alternative tableau accessible avec noms/liens/version Vn. Aucun champ ni crayon d'édition ; accessible en lecture collective admin/user.

**Technique :** `src/server/sprints/trends.ts` n'exécute plus de création de tables en consultation ; filtrage par `teamId` de la fiche. L'ancien lecteur `/api/admin/sprints/trends` reste disponible. Aucun ajout de bibliothèque.

**Contrôles exécutés :** 16/16 statiques GitHub, compilations TypeScript isolées sur SHA Git des fichiers exacts, 14 assertions graphiques et 28 assertions lecteur/projection réussies. **Tests SMN globaux, compilation Next.js, PostgreSQL et navigateur non exécutés**. [Compte rendu D6](../_bmad-output/implementation-artifacts/realisation-d6-tendances-fiche-sprint-smn-234-2026-10-23.md). **D7 — Bilan** est le prochain lot ; D8 registres reste dépendant des producteurs Epic 5.


## Fiche Sprint — D7 Bilan humain et IA (23/10/2026)

**Publié sur `main` :** deux blocs de Bilan indépendants, **Analyse du Scrum Master** et **Analyse IA**, disposés en deux colonnes desktop ou une colonne mobile. Chacun possède un crayon seulement si l'administrateur peut modifier le Sprint. Les deux contenus ont une clé de sauvegarde propre `(sprint_id,kind)`, leurs **révisions optimistes et audits indépendants**, des champs auteur/date, ainsi qu'une provenance. La saisie humaine dans « Analyse IA » **n'invoque aucun modèle** et reste marquée comme texte humain ; une future génération IA (Epic 9) ne pourra pas écraser une retouche humaine sans arbitrage explicite sur le marqueur `human_edited` et sa révision.

Les nouvelles clôtures enregistrent les deux analyses dans le snapshot Vn ; la lecture d'un Sprint fermé n'utilise jamais le texte courant. Une ancienne clôture sans champ de Bilan reste **indisponible**, jamais reconstruite. L'historique avant/après est conservé dans une table d'audit ; le navigateur affiche uniquement la dernière révision, pas un comparateur de toutes les anciennes versions. RBAC `admin` pour les écritures, `user` en lecture collective.

**Tests réels :** 20/20 contrôles statiques, compilation TS isolée d'un fichier au SHA Git identique et **20/20 assertions isolées** exécutées/réussies. **Tests intégrés du projet, PostgreSQL, `pnpm typecheck` et navigateur non exécutés.** [Rapport BMAD D7](../_bmad-output/implementation-artifacts/realisation-d7-bilan-fiche-sprint-smn-234-2026-10-23.md). Prochain incrément **D8 — Registres**, dépendant des producteurs Epic 5, puis D9 — Recette globale.


## Fiche Sprint — D8 Registres, socle d'intégration (23/10/2026)

**Fait vérifié :** les 24 Stories Epic 5 `SMN-89..112` sont au statut **À faire** et aucun code producteur des six registres n'est présent dans `main`. **D8 n'est pas complet** : aucun risque, obstacle, dépendance, décision, action ou fait marquant ne doit être simulé.

**Socle publié dans SMN-234 :** six catégories identifiables dans l'onglet Registres, listes chronologiques paginables dès qu'un producteur sera branché, contrats purs de temporalité (activité recouvrant le Sprint ou date métier des faits ponctuels), déduplication par identité de fiche, exclusion d'une autre équipe, contrôle SELECT-only Sprint+équipe, historique strict du dernier snapshot Vn **seulement s'il existe réellement**, sources partielles signalées. Sans producteur l'interface affiche **« Registres indisponibles (Epic 5) »**, pas une liste vide. Liens uniquement issus de routes internes vérifiées, aucun bouton d'édition factice.

**À réaliser dans Epic 5 puis raccorder** : création/consultation des registres SMN-89/90, statuts/audits/associations multi-cycles dont SMN-97, journal de faits SMN-106..110, instantanés V1/V2 SMN-111/112. Le port `RegistryReadProvider` est préparé mais **aucun adaptateur actif n'existe encore**. Le champ de snapshot proposé `qualitativeRegisters` est **provisoire** et doit être confirmé. **Tests D8 écrits, non exécutés en intégration**. La recette D9 ne peut pas conclure à la complétude des sept onglets à ce stade.

Référence : [rapport BMAD D8](../_bmad-output/implementation-artifacts/realisation-d8-registres-fiche-sprint-smn-234-2026-10-23.md).


## Fiche Sprint — D9 : revue transverse et non-régression (23/10/2026)

**Revue technique publiée :** sept onglets réels, mêmes `sprintId` et `teamId` autorisés, compte `user` sans modification ni données nominatives de membres, valeurs inconnues non remplacées par zéro, derniers snapshots Vn conservés, aucune génération IA factice, Registres Epic 5 non installés signalés explicitement. **Correctif d'historisation** : dans les Sprints clôturés, les liens Cérémonies et Registres vers des fiches actuelles sont désormais remplacés par une mention « Fiche historique individuelle indisponible » (FR/EN), pour éviter une divergence entre état enregistré et état vivant.

**Éléments de qualité réels :** 22 tests métier transverses isolés exécutés avec succès sur modules D3–D7 SHA Git identiques à `main` ; 31 contrôles statiques GitHub positifs sur sept onglets, RBAC, historique, pagination, traductions. Fichier de tests intégré `tests/smn-234-sprint-transverse-d9.test.ts` ajouté mais **non exécuté avec pnpm/tsx**, ainsi que `pnpm typecheck`, build, PostgreSQL et navigateur non réalisés. **Maintenir les anciens écrans/formulaires** en attendant validation de non-régression.

**Décision : D9 contrôle technique achevé mais D9 recette fonctionnelle globale NON VALIDÉE ; SMN-234 demeure À faire, D8 bloqué par Epic 5 SMN-89..112.** [Rapport de recette D9 et matrice AC](../_bmad-output/implementation-artifacts/rapport-recette-d9-fiche-sprint-smn-234-2026-10-23.md).
