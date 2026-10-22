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

**Décisions validées :** sans période définie, afficher tous les jours du mois civil courant ; avec périodes, afficher préférentiellement le sprint/la période en cours, sinon la plus récente. La grille affiche **7 cartes par rangée**, avec noms de jours en en-têtes **commençant au premier jour de la période**. Chaque carte mentionne jour et mois abrégé à 3 caractères ; **si la date est fériée, le nom du jour férié apparaît immédiatement sous la date, sans grand espacement**, puis **la première réunion doit toujours être visuellement décollée du bloc date/férié** (y compris lorsqu'il n'y a pas de fête). Les réunions sont triées par heure de début. **Survol/focus du nom d'une réunion : heures de début et de fin. Clic du nom : navigation vers la page de réunion.** Pour jour ouvré autorisé, barre + en pied de carte ouvrant une **modale centrée** pour créer une réunion. **Samedis/dimanches : cartes grisées et SANS +. Jours fériés en semaine : cartes grisées MAIS AVEC + Réunion si création autorisée**, car le jour férié peut ne concerner qu'une partie de l'équipe ; réunions déjà enregistrées visibles dans tous les cas. **Aujourd'hui : bordure plus épaisse/colorée**, y compris sur un jour grisé.

**Décision rectificative du 22/10/2026 :** le férié ne rend PAS systématiquement le jour non disponible pour la création : + permis du lundi au vendredi, même sur carte grisée, avec avertissement informatif non bloquant recommandé si le férié ne concerne que certains membres. Le week-end reste sans +, même s'il est férié. Il reste à représenter correctement le périmètre pays/membres affectés sans prétendre que toute l'équipe est absente. **Points à analyser avant développement :** route de consultation d'une réunion, intégration réelle des réunions/cycles, plages de dates au-delà de 7/14/28 jours et disponibilité des calendriers fériés. Les événements et droits existants ne doivent pas être effacés. Aucune implémentation, modification Jira ou recette réalisée dans cette livraison documentaire.
