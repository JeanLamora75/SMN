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

## Avenant correctif — Tableau de bord, registres et Notes/Alertes — 24/10/2026

**Référence de réalisation :** [_bmad-output/implementation-artifacts/smn-238-dashboard-qualitatif-correctifs-2026-10-24.md](../_bmad-output/implementation-artifacts/smn-238-dashboard-qualitatif-correctifs-2026-10-24.md), Jira SMN-238.

- Les trois colonnes Obstacles, Risques et Notes/Alertes doivent refléter exclusivement des données persistées et vérifiables. Le producteur `producer-not-ready` ne peut pas rester une constante lorsque les tables de registre sont installées.
- La création d'un obstacle ou d'un risque depuis le tableau de bord associe explicitement la fiche au Sprint sélectionné, avec validation serveur et écriture atomique. Les données existantes sans lien apparaissent comme éléments d'équipe « sans Sprint », identifiés explicitement et sans attribution artificielle à un cycle.
- Une note du tableau de bord est un objet autonome lié au Sprint, distinct des notes de préparation du rapport. Les quatre actions « + Ajouter » restent des modales. L'utilisateur non administrateur ne peut rien créer.
- Les tâches globales de configuration sont reprises dans Notes/Alertes : `todo` en alerte, `done` en information terminée, `ignored` exclue. La provenance globale reste explicite, et le bloc de gestion existant demeure disponible.
- Au plus cinq éléments sont montrés par colonne ; la disponibilité réelle ne doit jamais être confondue avec une collection vide. Sources partielles et historique clos sont traités sans données fictives.
- La criticité/ROAM, les snapshots qualitatifs clôturés, le « Voir tout » complet et le remplacement éventuel du bloc de configuration constituent les points de recette/compléments à ne pas présumer terminés.

**Statut :** implémentation sur la branche corrective ; recette TypeScript, tests et validation visuelle Windows à confirmer. Cette note ne modifie pas les contrats UX déjà approuvés pour les autres écrans.


## Avenant UX — Quatre colonnes opérationnelles compactes (24/10/2026)

**Référence visuelle :** capture PJ2 fournie dans la conversation du 24/10/2026 ; PJ1 représente l'écart à corriger. La capture est illustrative pour le style et la densité, jamais pour des valeurs d'exemple : seules les données SMN réellement persistées doivent être affichées.

- **Disposition :** quatre colonnes Obstacles / Risques / Événements / Notes-Alertes, responsive 4/2/1 ; maximum cinq éléments par colonne, compteur réel. En-têtes compacts ; pas de textes explicatifs qui repoussent les cartes ; cartes à contenu naturel sans hauteur minimale exagérée, description limitée visuellement à deux lignes.
- **Risques et obstacles :** titre vers fiche réelle ; description persistée si présente ; statut traduit ; criticité explicite seulement si évaluée (sinon « Non évaluée ») ; responsable et dates uniquement s'ils existent ; couleur de sévérité cohérente. Les fiches héritées sans association explicite restent signalées discrètement « Équipe · sans Sprint ». La responsabilité nominative n'est visible qu'aux administrateurs conformément à la projection serveur.
- **Événements :** icônes Bootstrap Icons people-fill (Daily), calendar-check (Planning), bar-chart-line (Review), chat-dots (Rétrospective), sliders (Affinage), calendar-event (inconnu/exceptionnel). Mapper les noms des modèles réellement enregistrés, sans interpréter arbitrairement un type inconnu. Date dans le fuseau du Sprint et dans la langue de l'interface ; « Ven. 23 oct. : 09:00 — 09:15 » quand les deux instants tombent le même jour, deux dates distinctes sinon. Ne pas assimiler une occurrence reconstituée à une réunion tenue. Lieu/participants uniquement avec source effectivement persistée et autorisée.
- **Notes / alertes :** distinction entre note et tâche de configuration ; les titres et descriptions des tâches sont ceux des traductions de configuration existantes. Tâche todo = alerte active ; done = information terminée ; ignored = masquée. Les notes existantes du Sprint utilisent leur texte enregistré, sans description fictive.
- **Navigation et saisie :** conserver « Voir tout » vers un écran réel, le titre des fiches et réunions vers leur route effective, les autorisations existantes et quatre boutons « + Ajouter » centrés, gras, sans soulignement, ouvrant les formulaires dans des dialogues modaux sans navigation. Ne pas inventer de route de liste quand aucun module n'existe.
- **Recette :** vérifier visuellement sur navigateur 4/2/1 colonnes et thèmes, profils admin/user, 0/1/5/>5 entrées, descriptions longue/courte/absente, FR/EN, fuseaux et changement de jour, hiérarchie de statuts, Sprint historique, modales et absence de données personnelles non autorisées.

**État de livraison :** l'implémentation proposée dans `ux/dashboard-compact-cards-20261024` ne vaut pas recette locale. GitHub Actions reste désactivé ; exécuter typecheck, tests et build sur le poste Windows avant validation finale des US. Lié à SMN-21, SMN-237, SMN-238.


## Avenant UX — Édition en modales des cartes du tableau de bord (24/10/2026)

**Décision de retouche :** un clic sur le titre d'un obstacle, risque, événement, note ou alerte doit ouvrir un dialogue natif centré affichant les champs éditables réellement disponibles ; la sauvegarde réussie ferme la modale et rafraîchit la projection du Sprint sans navigation. Un petit lien distinct vers la fiche d'origine reste disponible. Le rôle `user` voit les informations autorisées sans commande d'écriture ; un Sprint clôturé n'est jamais modifié.

- **Registres :** réutiliser `RegistryCreate` en édition avec la fiche centrale complète. Les sauvegardes dans le formulaire principal, l'évaluation de risque, ROAM, les liens de cycles et les relations rafraîchissent également le cockpit. Ne pas contourner les contrôles SQL/audit existants.
- **Événements :** traiter séparément les occurrences des modèles (`template`), cérémonies héritées (`ceremony`) et réunions exceptionnelles (`exceptional`), sans modifier les modèles ni régénérer les cérémonies. Proposer titre modifiable sauf type de cérémonie historique immuable, date/heure locale du Sprint, durée et statut ; conversion sûre entre fuseau local et instant enregistré, avec rejet d'une heure ambiguë/non existante lors des changements d'heure. Contrôler sur le serveur l'installation, l'équipe, le Sprint, les bornes calendaires, les conflits de versions et les permissions. Toute modification est auditée.
- **Notes :** le champ `body` reste l'unique contenu modifiable ; statut ouvert/terminé ; ne pas introduire un faux champ de description. Préserver la lecture du seul Sprint/équipe autorisé, un audit distinct pour les révisions et la protection des cycles clos.
- **Alertes de configuration :** titres/descriptions du catalogue FR/EN en lecture seule, statut `todo` / `done` / `ignored` modifiable selon les droits via l'API existante. Une alerte ignorée cesse d'apparaître ; une tâche terminée conserve la sémantique d'information terminée.
- **Bas de page :** retirer **uniquement du tableau de bord** le bloc « Configuration — Paramétrage à compléter », redondant avec les cartes Notes / Alertes. Conserver la page Paramètres et les mécanismes d'administration des tâches.
- **Responsive, accessibility, retour :** préserver l'organisation 4/2/1, les quatre boutons d'ajout, la tabulation/fermeture Escape des dialogues et la navigation vers la fiche source. Rafraîchir seulement après succès serveur. Conserver la modale et les modifications saisies en cas d'erreur 409/503.
- **Recette à valider :** risques/obstacles avec champs et sous-formulaires, trois origines d'événements, notes ouvertes/terminées, alertes globales, admin/user, Sprint actif/historique/clôturé, changement d'heure Europe/Paris, édition concurrente, boutons « Ajouter », absence du bloc inférieur, FR/EN et 4/2/1.

**Livraison :** branche `ux/dashboard-edit-modals-20261024` ; les tests et le build locaux restent obligatoires avant recette finale. GitHub Actions est désactivé.


## Fiche Sprint — colonnes du tableau Capacités (24/10/2026)

La fiche Sprint, onglet **Capacités**, conserve le tableau de présences individuelles et ajoute après **Membre** les colonnes **Rôles Agile**, **Fonction** et **Contribution**, avant les colonnes J/H et fiabilité déjà existantes.

- **Rôles Agile :** utiliser exclusivement les parts réellement affectées au membre dans `smn_member_assignment_version` pendant la période du Sprint ; conserver les rôles dont la part est strictement positive, présenter les libellés localisés dans l'ordre Scrum Master, Product Owner, Développeur et les séparer par `, `. En cas de changement d'affectation/rôle durant le Sprint, afficher les rôles présents pendant cette période, sans inventer de rôle.
- **Fonction :** afficher la valeur `smn_member.professional_function` de la fiche membre ; en cas de valeur absente, indiquer `—`. La fonction courante peut évoluer tant que le Sprint n'est pas clôturé ; les nouveaux snapshots de clôture figent sa valeur.
- **Contribution :** utiliser exclusivement `contribution_percent` des versions applicables aux jours où le membre est affecté. Un seul taux enregistré est présenté `75 %` ; plusieurs taux successifs distincts s'affichent dans l'ordre de la période, par exemple `50 % → 80 %` ; `—` quand la valeur n'est pas fiable.
- **Qualité et historique :** ces trois données descriptives ne modifient aucun calcul de présence ou développement en J/H. Les snapshots de Sprints clôturés récents conservent ces attributs ; les anciens snapshots sans ces champs restent lisibles et affichent `—` sans consultation du profil actuel en substitution.
- **Sécurité et UX :** comme les données nominatives déjà présentes, ces champs restent visibles uniquement aux rôles autorisés à lire les membres (admin MVP). Les intitulés suivent le catalogue FR/EN ; sur une largeur réduite, le tableau utilise son conteneur responsive horizontal.
- **Pas de migration :** les colonnes proviennent des tables existantes. Si les attributs additionnels ne sont pas lisibles sur un schéma ancien, ne pas dégrader les chiffres J/H calculés à partir de calendriers valides.

Livraison technique associée : `src/server/sprints/presence-metadata-read.ts`, `src/lib/sprint-presence.ts`, `src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx` et `tests/smn-234-sprint-capacity-metadata.test.ts`. Tests et recette locale nécessaires avant clôture de la validation.


## Fiche Sprint — Registres réels après Epic 5 (24/10/2026)

La capture du 24/10/2026 montrait à tort « Les six registres ne sont pas encore développés (Epic 5) » sur la fiche du Sprint. Cet état était dû à un branchement manquant entre le lecteur D8 de SMN-234 et les services réellement persistés de l'Epic 5.

**Contrat UX correctif :**
- **Sources des six catégories :** `smn_registry_item` pour risque, obstacle, dépendance, décision, action et fait marquant manuel ; `smn_automatic_highlight` pour les faits marquants automatiques rattachés aux registres ou aux objectifs du Sprint. Pas d'élément synthétique.
- **Filtrage :** par défaut « Tous », avec onglets liens pour chacune des six catégories ; filtre applicable **avant** pagination et conservé dans les liens Précédent/Suivant. La sélection du Sprint et l'équipe sont résolues côté serveur et ne peuvent être remplacées par une valeur libre de querystring.
- **Métadonnées :** date métier convertie avec le fuseau IANA du Sprint, statut FR/EN, criticité uniquement si effectivement évaluée ; titres/liens vers les fiches existantes, sans construire de liens externes arbitraires.
- **Périmètre temporel :** décisions/faits dans la période `[début,fin[` ; risques, obstacles, dépendances et actions actifs au moins un instant du Sprint. Les associations explicites au Sprint restent visibles même si l'élément a commencé en amont. Les fins sont fondées sur les changements de statut effectivement audités.
- **Dédoublonnage :** identité stable `(type,id)`, y compris liens multi-Sprints ; pagination de 25 et contrôle de volume sans masquer arbitrairement les données.
- **Snapshots :** pour un Sprint clôturé, relire exclusivement le JSON `snapshot.qualitative` produit par SMN-111, en conservant l'ancien format `qualitativeRegisters` si présent. Ne jamais remplacer un snapshot absent/incomplet par les données courantes. Les fiches historiques figées n'ouvrent pas une fiche actuelle non équivalente.
- **Sécurité :** accès collectif existant, requêtes SELECT uniquement, équipe et installation courantes, pas de données nominatives nouvelles ni de modification de l'architecture PostgreSQL. Un registre absent n'est jamais affiché comme une liste vide attestée.
- **Recette :** tester les six registres vides/peuplés, faits automatiques, changements de statut, liens vers les fiches, multi-Sprints, date frontière, pagination et changement de type, langues FR/EN, Sprint actif/clôturé, profil utilisateur, ancienne installation partielle.

La conformité de ce contrat est **conditionnée à la recette locale** (`pnpm typecheck`, tests `tsx`, `pnpm build`, PostgreSQL et navigateur) car GitHub Actions est désactivé.


## Fiche Sprint — Onglet Cérémonies compact, édition en modale (24 octobre 2026)

La fiche Sprint (SMN-234, D4) conserve sa liste paginée de toutes les occurrences de réunions/cérémonies. La retouche UX inspirée de la capture du 24/10/2026 introduit :

- **Lignes denses :** sur grand écran, une seule grille horizontale par occurrence avec **titre + statut**, **date et horaire**, **durée prévue**, **durée réelle enregistrée** et **icône de modification** à droite. Suppression des grands espacements verticaux. Sur tablette et mobile, les informations se répartissent sur deux ou trois petites lignes sans débordement.
- **Pictogramme pleine hauteur :** à gauche, une bande colorée occupe la hauteur effective de la ligne ; elle reprend l'icône Bootstrap Icons correspondant à la nature de la réunion : Daily `people-fill`, Planning `calendar-check`, Review `bar-chart-line`, Rétrospective `chat-dots`, Affinage `sliders`, réunion exceptionnelle ou type inconnu `calendar-event`. Les modèles de cérémonie sont reconnus par leur nom réel.
- **Date locale :** utilisation du fuseau IANA du Sprint et du catalogue FR/EN. Même jour : « Lun. 26 oct. : 09:30 — 11:30 » ; jours distincts : une date pour chaque extrémité, sans répétition inutile de l'année.
- **Édition :** le bouton « Voir la réunion » de chaque ligne courante est remplacé par un crayon accessible au clavier et au lecteur d'écran, déclenchant la modale existante (`OperationalEdit`). Elle édite, sous réserve des droits et règles backend, le titre lorsqu'il n'est pas une cérémonie standard immuable, la date et heure, la durée prévue, la durée réelle enregistrée (si disponible) et le statut. Après sauvegarde confirmée, elle se ferme et provoque un `router.refresh()`.
- **Garanties :** réemploi de l'API d'édition contrôlant installation, équipe, Sprint et conflit optimiste. Les modifications de durée réelle partagent **la même transaction** et conservent les traces d'audit. Aucun lien factice vers un événement historique : les snapshots de Sprint clôturé restent en lecture seule ; un utilisateur non administrateur ne voit pas de bouton de modification.
- **Non-régression :** ne pas modifier la recherche des trois sources (`standard`, `custom`, `exceptional`), le statut attesté/inféré, les avertissements de reconstitution, le total ni la pagination sur 25 occurrences.

Tests associés : `tests/smn-234-sprint-ceremonies-compact-modal.test.ts`, à lancer avec `tests/smn-234-sprint-ceremonies-d4.test.ts` et les tests de la modale du dashboard. La recette visuelle FR/EN et responsive nécessite un navigateur local.


## Avenant SMN-234 D8 — Registres compacts, consultation et édition en modale (24/10/2026)

**Décision UX :** dans la fiche Sprint → onglet **Registres**, chaque élément des six catégories est représenté par une seule rangée compacte sur grand écran : **icône colorée pleine hauteur** (à gauche), **catégorie**, **statut**, **titre**, **criticité effective** (si renseignée), **date métier** et **crayon de modification** (à droite). Le statut doit impérativement précéder le titre dans l'ordre visuel et de lecture. Le titre reste **gras, sans soulignement** (survol et focus compris) et cliquable.

- Icônes Bootstrap conservées et agrandies : risque `exclamation-octagon-fill`, obstacle `exclamation-triangle-fill`, dépendance `stack`, décision `bullseye`, action `ticket-perforated-fill`, fait marquant `bell-fill`. Zone colorée occupant la hauteur de l'élément, sans hauteur artificiellement excessive.
- **Sept filtres** « Tous, Risques, Obstacles, Dépendances, Décisions, Actions, Faits marquants » : taille de police et taille des icônes augmentées, filtre actif conservé, pagination inchangée.
- **Date métier** affichée sans heure fictive `00:00`, dans le fuseau du Sprint : `24 oct. 2026`. Aucune date d'échéance, description, personne ou criticité n'est inventée.
- **Édition** : clic sur le titre ou le crayon → **une même modale** HTML native reprenant `RegistryCreate`, formulaire complet utilisé par la page dédiée, sous-formulaires de décision, action, dépendance, risque, relations, cycles et qualification compris. Les données sont rechargées via l'API existante, les droits/write, révisions et validations serveur restent applicables. Après chaque sauvegarde réussie, fermeture et `router.refresh()` de la fiche Sprint ; sur conflit, conserver le dialogue et les données saisies.
- **Différence entre sources :** une fiche manuelle identifiable par une URL exacte `/app/admin/registries/<id>` peut être éditée par l'administrateur ; un membre en lecture seule peut l'ouvrir en consultation. Un fait marquant **automatique** ne possède pas une fiche `RegistryCreate` du même identifiant : le titre ouvre donc une modale de **consultation**, sans faux crayon. Les snapshots de clôture ouvrent également une consultation de leur donnée figée, sans accéder aux fiches actuelles ni proposer de modifications.
- **Responsive** : une rangée par élément sur grand écran ; à moins de 1100 px, redistribution limitée à deux lignes ; sur mobile, au maximum trois rangées courtes, avec pictogramme de gauche toujours étiré selon la hauteur réelle de l'élément. Accessibilité clavier, `aria-haspopup="dialog"`, libellé accessible du crayon et fermeture Escape conservés.
- **Non-régression** : aucun changement aux producteurs SQL des six catégories, filtres serveur, états des sources, droits d'accès, comptage, pagination par 25, snapshots historiques, traductions FR/EN ou navigation de la fiche.

**Recette attendue :** au moins une fiche de chaque type, statut actif/terminé, risque évalué/non évalué, titre très long, date métier, six filtres + Tous, pagination, admin/user, modification depuis titre puis crayon, sous-formulaires, fait automatique, snapshot de clôture, 4 largeurs (desktop/tablette/mobile), FR/EN et erreur de concurrence. Les tests et le build sont à réaliser localement ; GitHub Actions est désactivé.


## Panneau latéral gauche — premier lot de refonte (24/10/2026)

**Référence visuelle :** capture fournie d’une sidebar compacte, fond clair, icônes visibles et une ligne par menu. Cette décision concerne la navigation privée commune et complète SMN-22, SMN-23 et la centralisation des Paramètres de SMN-227.

**Demandes retenues pour ce premier lot :**
- Retirer entièrement de la sidebar le bloc « ESPACE DE TRAVAIL / [produit] / [équipe] / Mode Scrum/Kanban ». La sélection d’équipe et de Sprint reste visible dans l’en-tête, sans doublon latéral. Le produit reste disponible dans les pages métier qui le présentent.
- Faire apparaître les trois premières lignes dans cet ordre : **Tableau de Bord**, **Équipe**, **Calendrier**. L’élément « Calendrier » pointe toujours vers `/app/team-calendar` ; l’équipe admin vers `/app/admin/members`, sans ouvrir de droit supplémentaire aux utilisateurs en lecture seule.
- Retirer **Sécurité du compte** de la sidebar car le catalogue des Paramètres conserve son accès à `/app/security`. Ne pas supprimer cette page, ses formulaires ou ses contrôles d’authentification.
- Retirer **Événements Agile**, ancienne entrée « À venir » sans destination active. Ne pas supprimer les événements réels du calendrier et de l’application.
- Ne pas reconfigurer le reste des entrées métier lors de ce lot ; les prochains changements de libellés ou de périmètre seront proposés/validés séparément.
- Libellés latéraux toujours sur **une seule ligne**, sans césure : largeur de sidebar ajustée, `white-space: nowrap`, `text-overflow: ellipsis` en ultime protection pour les petits écrans ; texte complet conservé dans l’attribut `title` et `aria-label`.
- Icônes Bootstrap Icons au lieu de caractères Unicode : maison `house-fill`, équipe `people-fill`, calendrier `calendar3`, autres catégories via les icônes déjà disponibles. Taille de pictogramme portée à **22 × 22 px**, dans une case de 26 px centrée sur une ligne d’environ 46 px.
- Lignes regroupées dans un seul flux visuel vertical ; les titres de groupes restent accessibles aux lecteurs d’écran mais ne sont plus visibles visuellement. État actif bleu clair, marquage latéral, focus clavier ; menu réduit et menu mobile conservés.

**Non-régression attendue :** rôle admin/user, Scrum/Kanban, accès direct Paramètres/Sécurité, redirections d’autorisation côté serveur, sous-routes Calendrier/Sprints/Registres, focus menu mobile et fermeture Escape. Les vérifications s’effectuent via `tests/private-navigation.test.ts`, `tests/smn-227-settings-navigation.test.ts` et `tests/smn-sidebar-first-pass-20261024.test.ts` ; la recette visuelle est à effectuer sur Windows 11.


## Avenant — Panneau latéral, deuxième lot (24 octobre 2026)

**Décision fonctionnelle validée :** poursuivre la simplification après le retrait du bloc « Espace de travail ». Le panneau latéral présente désormais **exactement six entrées principales**, de haut en bas :
1. **Tableau de Bord** → `/app` ;
2. **Équipe** → `/app/admin/members` pour l'administrateur (entrée non cliquable si rôle insuffisant) ;
3. **Sprint** → `/app/admin/sprints` en mode Scrum ; préserver l'appellation « Périodes Kanban » et l'indisponibilité de route tant que la liste Kanban n'est pas livrée ;
4. **Calendrier** → `/app/team-calendar` ;
5. **Registre** → `/app/admin/registries`, correspondant à l'ensemble des six catégories de l'Epic 5, sans limiter le menu aux risques/obstacles ;
6. **Rapports** → entrée visible mais indisponible tant qu'une page de rapports autonome n'a pas été livrée : ne pas créer de destination fictive.

**Pied de panneau :** l'entrée **Paramètres** apparaît dans une zone distincte située tout en bas du panneau sur desktop, séparée des six entrées par une fine bordure horizontale. Son adresse est `/app/admin/settings`. Elle demeure réservée au rôle administrateur selon les autorisations MVP déjà en vigueur ; aucune exposition de données à un utilisateur non autorisé. Sur mobile, la séparation est conservée et Paramètres suit les six entrées, sans imposer un pied fixe gênant le défilement.

**Présentation :** les icônes Bootstrap existantes de 22 px et les libellés sur une seule ligne sont conservés, ainsi que le menu rétractable, les info-bulles au focus et la navigation clavier. Les anciennes lignes « Bilans de cycles » et « Briefs IA » ne figurent plus dans la sidebar ; les fonctions et pages métier indépendantes ne sont pas supprimées. L'intitulé « Paramètres généraux » devient « Paramètres » dans la sidebar et ses traductions FR/EN, sans changer les sous-écrans existants.

**Validation à effectuer :** vérifier l'ordre exact, la position basse à différentes hauteurs de fenêtre, le séparateur, les profils admin/user, les modes Scrum/Kanban, la cohérence active des sous-routes, le menu réduit et les petits écrans. Tests de navigation : `tests/private-navigation.test.ts`, `tests/smn-sidebar-first-pass-20261024.test.ts`, `tests/smn-sidebar-second-pass-20261024.test.ts` et `tests/smn-227-settings-navigation.test.ts`.


## Calendrier d'équipe — Option B validée le 24/10/2026 (avenant normatif)

**Référence obligatoire pour Amelia :** [README du dossier UX Option B](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/README.md), [DESIGN.md](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/DESIGN.md), [EXPERIENCE.md](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/EXPERIENCE.md), [maquette HTML](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/MAQUETTE-CALENDRIER-OPTION-B.html) et [recette UXB-01 à UXB-30](../_bmad-output/planning-artifacts/ux-designs/ux-calendrier-option-b-2026-10-24/RECETTE-UX.md).

- **Deux présentations d'un même calendrier :** Cartes par défaut et Agenda complémentaire ; mêmes dates, équipe, Sprint et filtres.
- **Une seule ligne « Absences (N) » en premier par jour** lorsqu'au moins une absence personnelle enregistrée couvre ce jour. N = nombre de membres distincts concernés, indépendamment du nombre d'enregistrements, et **non pas** le nombre général de membres indisponibles. A/A/B = 2.
- Le compteur exclut les jours fériés, fermetures et temps non travaillés sans absence personnelle enregistrée ; aucun nom, motif ou catégorie individuelle sur cette ligne ni dans la projection `user`.
- Cartes compactes avec pictogrammes Bootstrap Icons ; actions « + Réunion » et « + Absence » en pied des jours de semaine autorisés ; aucune création proposée le week-end.
- Les règles du contrat du 22/10 restent applicables, sauf modification explicite de cet avenant.
- **Statut livraison :** code engagé sur `main` le 24/10, en attente de recette intégrée et validation visuelle utilisateur. Ne pas déclarer conforme sur la seule base des commits.



## Calendrier — Décalage manuel des réunions (24 octobre 2026)

**Avenant UX :** depuis les vues Cartes et Agenda, le titre ouvre une fenêtre modale. En rôle administrateur, le formulaire d'un événement non annulé et d'un sprint non clôturé permet de modifier indépendamment **date/heure de début** et **date/heure de fin**, pour une cérémonie, une occurrence de réunion récurrente ou une réunion exceptionnelle. La durée prévue est **recalculée** ; les modifications d'occurrence ne changent pas le modèle de récurrence. Les utilisateurs en lecture seule conservent une fiche non éditable. Ne pas confondre le décalage manuel avec le repositionnement automatique des cérémonies « début / fin de sprint ».

Implémentation et recette : [calendrier-modification-horaires-reunions-2026-10-24.md](../_bmad-output/implementation-artifacts/calendrier-modification-horaires-reunions-2026-10-24.md). **Statut : publié sur main, validation d'exécution à effectuer.**


## Calendrier — Info-bulle nominative des absences (24 octobre 2026)

Dans les vues **Cartes** et **Agenda**, la ligne compacte `Absences (N)` reste inchangée. **Pour les administrateurs uniquement**, le survol de cette ligne (ou le focus clavier, ou l'activation tactile) révèle une info-bulle contenant **un nom de membre absent par ligne**, trié alphabétiquement, sans doublon d'identité. Un membre absent le matin et l'après-midi figure une seule fois. La liste est calculée depuis les données détaillées déjà autorisées du calendrier, selon **exactement la même condition** que le compteur `N`. Aucun motif, aucune catégorie, aucun détail individuel supplémentaire n'est ajouté à l'info-bulle.

Le rôle `user` conserve la ligne `Absences (N)` **sans info-bulle nominative** : les noms ne sont pas transmis dans la réponse de l'API collective.

Implémentation : `src/lib/calendar-absence-names.ts`, `src/server/members/team-calendar.ts`, `src/app/app/team-calendar/{team-calendar-view,calendar-option-b}.tsx`, `src/app/globals.css`, traductions FR/EN.

Recette : vérifier A/A/B = 2 noms et `Absences (2)`, le survol/focus en Cartes et Agenda, un compte `user` et les deux thèmes. Les tests doivent être exécutés localement avant clôture. Jira inchangé.


## Tableau de bord — I01/I02, cinquième carte de tachomètres (24 octobre 2026)

**Décision utilisateur validée, normative pour les agents Sally/Amelia/BMAD. Référence Jira : [SMN-21, AC-UX08 à AC-UX13](https://lmn24.atlassian.net/browse/SMN-21).** Cette règle complète les contrats du 21/10 et n'altère pas les cartes ou colonnes existantes.

- **Disposition :** cinquième carte sur la rangée des KPI, immédiatement à droite de « Jours ouvrés restants » lorsque la largeur desktop le permet. Les quatre cartes initiales demeurent : Capacité, Story Points, Tickets, Jours ouvrés restants. La cinquième contient **I01 Confiance de l’équipe**, puis une **ligne fine**, puis **I02 Clarté des objectifs**. Les deux indicateurs sont empilés verticalement et rendus de manière compacte, avec le style et les tokens des cartes existantes.
- **Données :** notes entières réelles de 1 à 5, propres au Sprint sélectionné. Convertir chacune en pourcentage par `note / 5 × 100` : **1→20 %, 2→40 %, 3→60 %, 4→80 %, 5→100 %**. Deux **tachomètres distincts**, valeur % lisible et éventuellement `n/5` en complément. Aucun indicateur composite.
- **Absence de donnée (règle impérative) :** si la valeur est absente/non saisie, rendre un **tachomètre complètement vide, neutre, gris**, accompagné de **« Non renseigné »**. **Ne jamais afficher 0 %, 0/5, une portion active ni une note par défaut** ; ne jamais transformer `null` en zéro. Si une seule note est absente, l'autre s'affiche normalement. Valeur hors de 1–5 : invalide, ne pas la présenter comme une mesure.
- **Contexte et sécurité :** lire les valeurs réellement persistées du Sprint/équipe choisi, appliquer le contexte sélectionné et les règles d'historique des cycles clôturés. Pas de mélange entre Sprints, d'invention de notes ou de saisie depuis la carte. Vérifier l'existence d'un producteur I01/I02, son modèle et ses permissions avant d'implémenter ; s'il manque, le traiter explicitement sans fausse donnée.
- **Responsive :** cinq cartes sur une même ligne si la largeur rend le contenu lisible ; repli gracieux en plusieurs rangées sur écrans étroits. Ne pas confondre avec la disposition **4/2/1 des quatre colonnes opérationnelles**, qui reste inchangée. Accès clavier, texte alternatif à la jauge, FR/EN, thèmes clair/sombre et palettes.
- **Recette obligatoire :** cas null, 1, 2, 3, 4, 5, valeur invalide, un seul indicateur renseigné, changement de Sprint, cycle clôturé, droits admin/user, traductions et responsive. Non-régression des quatre cartes existantes. `pnpm lint`, `pnpm typecheck`, tests ciblés et `pnpm build` sur le poste local ; ne pas prétendre les avoir exécutés avant vérification.

**État documentaire :** Jira et UX validés ; implémentation **non réalisée par cet avenant**. Priorité à la définition de [SMN-21](https://lmn24.atlassian.net/browse/SMN-21) en cas de doute. Ne pas fermer SMN-21 avant recette utilisateur.


## Avenant UX — C01/C02, capacités J/H dans la fiche Sprint (24/10/2026)

**Décision utilisateur du 24/10/2026, applicable à SMN-234 et à SMN-21.**
Dans la fiche Sprint, onglet Indicateurs, ajouter un bloc **Capacité du Sprint**
avec **C01 — Capacité prévue (J/H)** et **C02 — Capacité réelle (J/H)**.
Chaque champ possède une édition ciblée et présente **à côté une référence calculée par SMN**
lorsqu'elle est fiable. Le bloc Capacité du tableau de bord lit les valeurs enregistrées
de **ce Sprint** ; les quatre autres cartes et I01/I02 sont conservés.

### AC-CAP01 — Référence et préremplissage non destructif

- À l'ouverture du formulaire, un champ sans saisie enregistrée (null) est **prérempli côté formulaire**
  avec la référence calculée disponible ; si aucun calcul fiable n'existe, rester vide.
  La consultation seule n'écrit rien en PostgreSQL : confirmation nécessaire pour enregistrer.
- Une valeur enregistrée, y compris **0 J/H**, n'est **jamais remplacée** par une référence recalculée.
  Les deux références restent affichées à côté, même si elles diffèrent de la saisie.
- L'administrateur peut corriger une saisie (jusqu'à quatre décimales, valeur non négative) ou vider
  un champ ; le champ vide revient au mode calcul/proposition lorsque la source le permet.
  Distinguer **« Non renseigné »** et **« Non calculable »**.

### AC-CAP02 — Provenance, cycle et source

- C01 utilise le moteur readDevelopmentCapacity pour la **période entière** lorsque les
  sources sont complètes. Ce recalcul est une **référence actuelle**, non une
  reconstitution de l'engagement initial gelé par smn_capacity_initial_snapshot.
- C02 utilise la **référence constatée** de readActualCapacity : pour un cycle en cours,
  seules les journées écoulées sont couvertes ; aucun réalisé futur.
- La nouvelle table smn_sprint_capacity_kpi contient des **saisies de KPI du Sprint**
  distinctes des instantanés immuables du moteur de capacité. Priorité du cockpit :
  KPI Sprint enregistré, puis valeur retenue du moteur existant ; aucune réécriture
  des sources du calcul. Changements audités avec contrôle de révision.
- ID du Sprint et droits validés côté serveur. Administrateur en écriture,
  utilisateur en lecture seule. Sprint **terminé non clôturé** éditable ;
  Sprint **clôturé** protégé et lu depuis son snapshot, sans recalcul rétroactif.

### AC-CAP03 — Restitution, audit et recette

- Deux champs C01/C02 en cartes compactes avant Story Points, avec libellés FR/EN
  et référence calculée séparée ; formulaire en modal.
- Après enregistrement, le tableau de bord affiche le KPI saisi et sa provenance
  « Saisie » ; le changement de Sprint ne réutilise aucune autre équipe ou période.
- À la clôture, les valeurs retenues sont capturées dans snapshot.capacity ; les
  saisies du KPI dans snapshot.capacityKpis. Un ancien snapshot sans source reste
  historique/indisponible ; aucune donnée actuelle ne recompose le passé.
- Recette : null/0/décimales/invalides, calcul disponible/indisponible, révision
  concurrente, terminé vs clôturé, admin vs user, changement de Sprint, FR/EN,
  responsive et synchronisation avec tableau de bord ; contrôles locaux
  pnpm typecheck, pnpm lint, tests ciblés, pnpm build et vérification visuelle.

**Statut :** implémentation préparée, contrôles locaux et recette utilisateur en attente.
Cet avenant ne modifie pas les règles de gel du moteur de capacité SMN-58/60.


## Avenant UX — Modification du contexte de l’équipe (24 octobre 2026)

**Décision validée de l’utilisateur — SMN-221 (Epic 3), intégration au rapport SMN-120.**
Dans l’en-tête de la page « Équipe » (vues Cartes et Liste), afficher une petite
icône Bootstrap **pencil-square immédiatement à droite du nom de l’équipe** ;
ne pas confondre avec le bouton d’ajout d’un membre.

**UX-TEAM-CTX01 — Modale unique.** L’administrateur active le crayon et ouvre
une **modale centrée**, préremplie depuis les données réelles, avec trois champs :
1. Nom de l’équipe (requis, 1–120 caractères).
2. Vision Produit (texte libre facultatif, jusqu’à 5 000 caractères).
3. But du produit / Product Goal (texte libre facultatif, jusqu’à 5 000 caractères).

**UX-TEAM-CTX02 — Écriture transactionnelle et historique.** Enregistrer
commet les trois données ensemble avec contrôle de révision concurrente,
auteur/horodatage et audit par version. Annuler ne modifie rien. La modale
propose un historique des versions consultable. Une lecture GET n’exécute
aucune DDL et ne fabrique aucune valeur manquante.

**UX-TEAM-CTX03 — Portée et sécurité.** L’ID de l’équipe demeure identique,
le produit de référence et le mode Scrum/Kanban sont **immuables**.
Les contenus Vision et Product Goal sont attachés à l’équipe, indépendamment
des objectifs de Sprint, et alimentent le lecteur existant des rapports
`readTeamReportContext` et sa configuration d’inclusion. Aucun PDF déjà
archivé n’est recalculé. Écriture administrateur uniquement, GET protégé
pour lecteurs collectifs, aucune donnée membre nominative dans le retour.
Les deux vues Cartes/Liste, la grille 6×2, les cartes et l’ajout de membre restent inchangés.

**UX-TEAM-CTX04 — Recette.** Tester nom vide/trop long, contenus facultatifs,
écriture atomique, révision concurrente, annulation, historique, refus du
rôle utilisateur, réutilisation dans le reporting, FR/EN, clavier, thème
clair/sombre, desktop/mobile. Aucun succès de recette non exécutée ne doit
être revendiqué. Voir la documentation du lot dans
`_bmad-output/implementation-artifacts/smn-221-team-context-2026-10-24.md`.
