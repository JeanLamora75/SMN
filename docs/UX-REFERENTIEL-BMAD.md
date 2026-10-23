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
