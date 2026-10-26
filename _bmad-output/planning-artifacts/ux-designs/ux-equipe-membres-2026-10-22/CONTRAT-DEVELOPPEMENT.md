# Contrat de développement UX — Équipe et membres

> **MISE À JOUR FICHE V2 :** les lots et composants de la fiche définis plus bas s'appliquent uniquement à l'ancienne conception. Le contrat en vigueur est [FICHE-MEMBRE-V2-UX-CONTRAT.md](FICHE-MEMBRE-V2-UX-CONTRAT.md) et sa [recette](FICHE-MEMBRE-V2-RECETTE.md). Nouveau bandeau avec un seul crayon d'identité/localisation, quatre onglets, séparation Calendrier/Absences et historiques visibles dans chaque onglet. Les exigences des vues Équipe Cartes/Liste restent valides.


**22/10/2026 — Référence approuvée, implémentation non réalisée.** Destinataire : Amelia, développeuse BMAD. Lire impérativement [DESIGN.md](DESIGN.md), [EXPERIENCE.md](EXPERIENCE.md) et [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md).

## 1. Décisions et périmètre

| Décision | Référence | Nature |
|---|---|---|
| Menu principal « Équipe », accessible aux administrateurs autorisés | Maquettes Équipe | Refonte navigation |
| Choix exclusif Cartes/Liste par icônes en haut à droite, dernier choix mémorisé | Maquettes Équipe | Refonte UX |
| Six colonnes × deux rangées initiales, arrondis, nom/silhouette neutre/badges/fonction | Maquette Cartes | Refonte UX |
| Rôles SM / PO / Dev toujours visibles, actif coloré, absent grisé, plusieurs actifs possibles | SMN-44 | Réutilisation métier |
| Carte « + » après les membres actifs, reste des cases grises pointillées | Maquette Cartes | Refonte UX |
| Liste alternative : avatar neutre, nom, trois badges, fonction, statut, action de fiche | Maquette Liste | Refonte UX |
| Carte ou ligne entièrement cliquable vers même fiche membre | Maquettes Équipe | Refonte navigation |
| Fiche membre : bandeau identité, onglets, deux colonnes de panneaux, crayons adjacents | Maquette Fiche | Refonte UX |
| Nouvelle création individuelle par pop-up, dans l'équipe existante | Maquettes Équipe | **Nouvelle capacité métier** |
| Aucune image personnelle MVP ; galerie prédéfinie seulement envisagée v1 | Décision utilisateur | Hors MVP |
| Fonction professionnelle distincte de rôle Agile | Maquettes | **Donnée à vérifier / enrichir** |

## 2. État du code existant — branch main

- [src/app/app/admin/members/page.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/page.tsx) : page avec Bootstrap container, à rendre pleine largeur utile pour six colonnes.
- [quick-members-admin.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/quick-members-admin.tsx) : tableau avec cinq boutons par membre et formulaires affichés dessous ; pas de fiche dédiée ni switch Cartes/Liste.
- [src/lib/private-navigation.ts](https://github.com/JeanLamora75/SMN/blob/main/src/lib/private-navigation.ts) : « Membres » rangé dans Administration, pas de menu principal Équipe.
- [member-profile-editor.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/member-profile-editor.tsx) : nom + email révisables, pas de champ Fonction dans le type consulté.
- [src/app/api/admin/members/route.ts](https://github.com/JeanLamora75/SMN/blob/main/src/app/api/admin/members/route.ts) et [createQuickMembers](https://github.com/JeanLamora75/SMN/blob/main/src/server/members/quick-create.ts) : **POST actuel réservé à la première initialisation de 3–50 membres** ; si un membre existe déjà, retourne « already-initialized ». Ne permet pas d'ajouter une personne ultérieurement.
- Éditeurs métier à réutiliser/adapter : [assignment-editor.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/assignment-editor.tsx), [member-calendar-editor.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/member-calendar-editor.tsx), [member-location-editor.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/member-location-editor.tsx), [member-lifecycle-editor.tsx](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/member-lifecycle-editor.tsx).

**Ne pas déclarer implémentées** les deux nouvelles vues, la fiche, le champ Fonction ou la création individuelle tant que ces éléments n'ont pas été développés et vérifiés.

## 3. Invariants à respecter

1. MVP monoéquipe Scrum/Kanban ; aucun choix réel de seconde équipe.
2. Un membre métier n'est pas un compte utilisateur ; pas de connexion ni d'e-mail imposé ou envoyé.
3. Seuls les administrateurs autorisés accèdent aux données personnelles et aux mutations, y compris par accès direct API/URL.
4. Rôles Agile répartis par parts : somme des parts = 100 %, affectation bornée par temps contractuel ; fonction libre distincte ; rôle Dev seul contribue à la disponibilité développeur.
5. Versions, dates d'effet, historique et prévention de la rétroactivité non contrôlée ; archivage sous workflow protégé, pas de bascule libre « actif ».
6. États enregistrée/suggérée/inconnue, aucune heure, capacité, absence, ville ou zone IANA inventées.
7. Tous textes standard dans src/i18n/fr.json et src/i18n/en.json ; préserver mode sombre et palettes SMN-24.
8. Design accessible clavier/lecteur d'écran, focus/contraste et zoom ; aucune photo personnelle au MVP.

## 4. Lots recommandés pour Amelia

### Lot 1 — Navigation et vues
Accès menu Équipe, layout pleine largeur, switch exclusif Cartes/Liste, grille desktop 6×2 initiale et responsive, badges SM/PO/Dev, pictogramme neutre, + et emplacements pointillés, liste avec ligne +. Données réellement actives et affichage honnête des champs inconnus.

### Lot 2 — Fiche et modifications
Page sécurisée par ID métier, retour à Équipe, bandeau identité, cinq onglets, panneaux Profil selon maquette, crayons sur champs éditables. Réemploi des éditeurs existants pour rôles/affectation/calendrier/localisation/historique ; cycle de vie contrôlé. Déterminer et faire valider la persistance éventuelle de Fonction distincte des rôles Agile.

### Lot 3 — Ajout individuel (besoin fonctionnel complémentaire)
Après validation de la composition exacte du formulaire : modal ouverte par + en cartes et en liste, création d'**un** membre rattaché à l'unique équipe, nouvelle opération serveur transactionnelle/idempotente, protections de conflit et de permissions. Ne pas détourner le POST d'initialisation existant. Une Story Jira nouvelle/amendée doit être préparée et soumise à autorisation avant modification Jira.

### Lot 4 — Préférence et recette
Portée de mémorisation du mode à valider, compatibilité FR/EN et thèmes, responsive, tests des scénarios R01–R14 dans [EXPERIENCE.md](EXPERIENCE.md), anti-régression métier/permissions/versions. Ne jamais revendiquer une commande ou GitHub Actions exécutée sans preuve.

## 5. Arbitrages restant ouverts

| Sujet | Statut |
|---|---|
| Dépassement de douze positions (12+ membres actifs) : ajout toujours accessible | **À confirmer** avant développement final |
| Vue initiale si aucune préférence enregistrée | **À confirmer** |
| Champs, validations et préremplissage de la pop-up Ajouter | **À confirmer** |
| Stockage / validation du champ « Fonction » | **À confirmer** |
| Préférence d'affichage par compte ou installation | **À confirmer** |
| Recherche et filtres complets, au-delà de la composition illustrative | **À préciser** |

Ces questions ne remettent pas en cause la validation des **trois maquettes structurantes** ; Amelia ne doit simplement pas déduire des règles métier inconnues à partir d'exemples.

## 6. Critères de recette et DoD

Comparer les vues et fiche à [MAQUETTES-REFERENCE.md](MAQUETTES-REFERENCE.md) et au rendu original de la conversation lorsque disponible ; vérifier au minimum **0, 8, 11, 12, 13 membres actifs** ; multi-rôle ; provisoire ; archivé ; rôle sans droits ; annulation et sauvegarde ; dates d'effet ; signalisation des inconnues ; deux langues ; thèmes ; responsive ; clavier et zoom.

L'écran actif **ne doit jamais montrer Cartes et Liste ensemble**. Une carte et une ligne conduisent à la **même fiche**. Aucun clic de consultation ou préremplissage ne réalise une écriture.

**Aucun développement, modification de données, test runtime ou opération Jira n'a été fait dans le cadre de cette validation UX.**

## État post-développement — avenant du 22 octobre 2026

**Ce document initial précédait la livraison visible dans les captures utilisateur.** Le constat actuel est une **implémentation partielle mais visuellement non conforme**. Voir [AVENANT-UX-CORRECTIF-2026-10-22.md](AVENANT-UX-CORRECTIF-2026-10-22.md) pour les écarts prouvés et **leurs localisations précises dans le code**, et [RECETTE-VISUELLE-2026-10-22.md](RECETTE-VISUELLE-2026-10-22.md) pour les preuves exigées.

**Amelia doit prioritairement corriger les couches de présentation existantes**, sans réécrire le serveur ni Jira au seul motif d'un écart esthétique. La simple présence de row-cols-xl-6 ou container-fluid n'est pas une preuve : .smn-page reste plafonnée à 870 px en CSS. Le rendu attendu est une page Équipe **pleine largeur, six cartes réellement lisibles**, et une fiche **pleine largeur à cinq onglets et panneaux deux colonnes**. Fournir des captures d'écrans comparables et demander validation. Aucun test runtime n'a été exécuté par Sally.

## Avenant normatif — En-tête Équipe / Vision Produit / Product Goal (24/10/2026)

Cette décision **complète les vues Équipe Cartes et Liste** sans modifier leur
présentation, les badges, l’ajout individuel ni la fiche des membres.

- Une icône Bootstrap `pencil-square` est placée juste après le **nom de l’équipe**
  dans l’en-tête. Visible à l’administrateur, elle ouvre une modale unique.
- Champs : **Nom de l’équipe** obligatoire ; **Vision Produit** et **But du
  produit (Product Goal)** facultatifs. Texte non traduit automatiquement.
- Un seul clic Enregistrer réalise une **transaction atomique** avec
  contrôle de révision et audit. Une modale permet de consulter les versions
  antérieures. Aucune valeur initiale inventée.
- Les textes sont rattachés à l’équipe unique Scrum/Kanban, pas au produit fixe
  ni à un Sprint : l’ID, le produit initial et le mode restent invariants.
- Lecture collective authentifiée, modification admin uniquement ; sécurité
  côté API, pas seulement une icône cachée.
- Les rapports utilisent le producteur existant `smn_team_context` via
  `readTeamReportContext` ; aucune altération rétroactive des archives.
- Traductions FR/EN centralisées, modale accessible, responsive.

**Story propriétaire :** [SMN-221](https://lmn24.atlassian.net/browse/SMN-221).
**Story consommatrice :** [SMN-120](https://lmn24.atlassian.net/browse/SMN-120).
**Recette requise :** changement de nom, Vision, Goal, null, 0 changement,
conflit, annulation, erreurs, droits, historique, reporting, clavier et mobile.

## Correctif de conformité — modale Équipe et nom du produit (24/10/2026)

Le contenu de la modale **doit tenir entièrement dans sa fenêtre**, même
sur petit écran : supprimer l'ancienne contradiction entre le conteneur
620 px et le contenu 680 px. Utiliser un conteneur dédié plafonné par la
largeur du viewport, champs à 100 %, `min-width: 0`, défilement vertical
uniquement en cas de manque de hauteur. Boutons Annuler et Enregistrer
toujours à l'intérieur de la modale.

L'administrateur dispose de quatre champs :
1. Nom de l'équipe (1–120 caractères, requis).
2. Nom du produit (1–120 caractères, requis).
3. Vision Produit (0–5 000 caractères, facultatif).
4. But du produit / Product Goal (0–5 000 caractères, facultatif).

Précision fonctionnelle postérieure au contrat initial : le **nom d'affichage
du produit est modifiable**, **pas son identifiant**. Le mode et les clés de
liaison restent immuables. La modification du nom produit est enregistrée
dans la **même transaction et révision** que les valeurs du contexte équipe ;
l'audit versionné inclut le nom du produit avant/après, sans altérer les
archives des sprints ni les PDF existants.

Le formulaire affiche les valeurs existantes, l'enregistrement respecte les
droits administrateur, et les libellés sont traduits en FR/EN.

Voir l'avenant correspondant du référentiel UX et la Story SMN-221.

## Addendum UI — Bandeau Équipe enrichi (24/10/2026)

La modification de l'en-tête de la **page Équipe** couvre les deux
présentations Cartes et Liste :
1. **En haut à gauche** : nom de l'équipe et crayon d'édition ; en dessous
   « Produit : [nom enregistré] · [nombre de membres actifs] ».
2. **À droite** : « Vision Produit », puis « But du produit », chacun précédé
   d'une icône dans le même cartouche de 39 px que les KPI du tableau de bord.
   Une ligne fine `--smn-border` sépare les deux sections.
3. **En haut à droite** : contrôle Cartes/Liste inchangé. En dessous de
   1150 px, les sections Vision/But passent sous l'identité sur toute
   la largeur. Les cartes des membres et leur grille ne sont pas modifiées.
4. Valeurs réelles issues de SMN-221 ; texte manquant « Non renseigné »,
   chargement et indisponibilité explicités. Limite visuelle de trois lignes
   par rubrique sans tronquer les valeurs enregistrées. Après la sauvegarde
   des quatre champs dans la modale, les quatre champs de synthèse sont
   rafraîchis en mémoire et les autres vues via le refresh existant.
5. Lecture GET authentifiée, écriture admin uniquement, FR/EN et palettes.
   Aucune écriture en base sur le simple affichage.

Recette : vérifier desktop et mobile, même hauteur de cartouche que les
KPI, séquence Produit/effectif, fine bordure Vision/But, contenus
absents ou longs, rafraîchissement après sauvegarde et changement
Cartes/Liste. Les tests en dépôt ne remplacent pas la recette navigateur.

## Dernière décision — répartition du bandeau en 3 blocs égaux (24/10/2026)

Sur grand écran, la zone d'en-tête Équipe est répartie en trois blocs
horizontalement alignés, avec deux traits verticaux discrets :
- Équipe / crayon, Produit et effectif actif ;
- Vision Produit + icône de 39 × 39 px ;
- But du produit + icône de 39 × 39 px.

Le sélecteur Cartes/Liste demeure dans son coin droit, hors des
trois zones métier. Le CSS réalise la répartition 1fr + (2fr divisé
en 2 × 1fr), permettant trois blocs équilibrés et des marges internes.
Ne pas réintroduire la superposition de Vision et But sur desktop.

Responsive : à 1150 px et moins, identité / sélecteur en première
ligne puis Vision/But juxtaposés ; à 650 px et moins, Vision/But
s'empilent. Traits verticaux entre colonnes tant qu'elles sont
juxtaposées, traits horizontaux lorsque les rangées changent.

La Story de référence reste SMN-221 ; il s'agit d'une évolution
visuelle exclusivement, sans effet métier ni mutation de la base.

## Addendum de préparation — SMN-282 (26/10/2026)

La demande d'une page **« Paramètres > Équipes »** permettant de créer ou modifier une équipe est tracée dans [SMN-282](https://lmn24.atlassian.net/browse/SMN-282) et son [avenant de spécification](AVENANT-GESTION-EQUIPES-SMN-282-2026-10-26.md). Seul le **nom d'équipe** est obligatoire ; nom du produit, vision et Product Goal sont facultatifs. L'entrée Paramètres est une **destination cible**, pas une route déclarée fonctionnelle.

**Attention : ce besoin constitue une évolution structurante contraire à l'invariant monoéquipe de ce contrat et à D-PRD-137.** Tant que la décision d'étendre le périmètre Scrum/Kanban, la persistance du produit facultatif et l'isolation interéquipes ne sont pas arbitrées, conserver les protections de la version actuelle. Ne pas amorcer la migration ni proclamer la nouvelle Story « Ready for Development ». Toute adaptation de SMN-221 doit préserver les versions et les données existantes.
