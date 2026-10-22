# Avenant UX correctif — Équipe et fiche membre

> **Note de version (fiche uniquement) :** ce diagnostic historique décrivait l'ancienne fiche. Il ne faut plus reproduire les cinq onglets, ni le panneau Profil en deux colonnes : le contrat actuel est [FICHE-MEMBRE-V2-UX-CONTRAT.md](FICHE-MEMBRE-V2-UX-CONTRAT.md), avec quatre onglets, un bandeau horizontal et un seul crayon. La [recette V2](FICHE-MEMBRE-V2-RECETTE.md) remplace les anciens critères fiche. Les constats sur la page Équipe restent valables.

**22 octobre 2026 | Sally — UX Designer BMAD | Décisions UX déjà actées | Pas de code ni de Jira.**

Le commanditaire a montré deux captures de la réalisation d'Amelia (vue Cartes et fiche Membre 1) et constaté une **non-conformité visuelle et de structure** aux maquettes approuvées. Ceci est un diagnostic **sur captures et lecture du code actuel**, non une recette exécutée du fonctionnement des API.

## Références visuelles désormais versionnées

Ces SVG sont des **reconstitutions vectorielles explicites** des maquettes approuvées, **pas les PNG originaux ni les captures de l'application**, qui restent seulement accessibles dans la conversation de validation.

- **[Cible Équipe — Cartes](references-visuelles/cible-equipe-cartes.svg)** : 6 × 2, silhouette neutre, 3 badges horizontaux, carte Ajouter, placeholders.
- **[Cible Équipe — Liste](references-visuelles/cible-equipe-liste.svg)** : présentation exclusive, mêmes rôles, fonction, statut et ligne Ajouter.
- **[Cible Fiche membre](references-visuelles/cible-fiche-membre.svg)** : bandeau complet, 5 onglets, colonnes symétriques, crayons sur champs.
- **[Comparaison largeur et composition](references-visuelles/comparaison-structure.svg)** : problème de densité et proportions.

Les noms, statuts, dates et fonctions dessinés sont **fictifs**. Les contrats [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md) prévalent sur les illustrations.

## Écarts Équipe constatés

| Réf. | Captures de la réalisation | Contrat UX impératif |
|---|---|---|
| EQ01 **BLOQUANT** | Grille enfermée dans un panneau centré d'environ 800 px sur fenêtre 1 880 px, très grande zone vide à droite | **Toute largeur utile de contenu** après sidebar, marges raisonnables, 6 cartes lisibles par rangée sur grand écran |
| EQ02 **BLOQUANT** | Cartes extrêmement étroites, texte verticalisé | Cartes blanches élégantes, coins arrondis, tailles homogènes et espaces confortables |
| EQ03 **BLOQUANT** | Badges SM/PO/Dev passent sur plusieurs lignes | Les **trois badges côte à côte sur une seule ligne** par carte desktop |
| EQ04 | SM jaune, PO bleu, Dev vert | **Bleu unique pour tous rôles exercés** ; gris unique pour rôles non exercés, plusieurs badges bleus possibles |
| EQ05 | « Fonction non renseignée » découpée mot par mot | Fonction sous badges, lisible sur une ou deux lignes ; valeur inconnue explicite |
| EQ06 | Carte Ajouter = symbole + seul | + centré et texte visible **« Ajouter un membre »** dans la carte cliquable |
| EQ07 | Titre = « Team Tiger » | Titre **« Équipe »**, nom réel de l'équipe comme contexte secondaire, effectif actif distinct |
| EQ08 **CONFORME** | Silhouette neutre commune, 12 emplacements, placeholders | Conserver pictogramme asexué commun MVP, ordre membres → Ajouter → vides pointillés |
| EQ09 **NON VÉRIFIÉ** | Aucune capture Liste | Vue Liste doit remplacer et non accompagner Cartes, badges et fonction visibles, ouverture d'une fiche par ligne |

### Cause technique documentée

- Dans **src/app/globals.css**, la règle **.smn-page { max-width: 870px; }** bride toujours la page.
- Dans **src/app/app/admin/members/page.tsx**, le conteneur est bien « container-fluid » mais porte la classe **smn-page** : « container-fluid » ne neutralise **pas** un max-width CSS.
- Dans **src/app/app/admin/members/team-overview.tsx**, **row-cols-xl-6** existe mais reçoit seulement cette largeur bridée ; « flex-wrap » sur les badges autorise plusieurs lignes, les classes text-bg-warning / text-bg-primary / text-bg-success codent les rôles par couleurs distinctes et la tuile Ajouter montre uniquement +.
- **Instruction ciblée, sans développement ici :** lever le plafond **sur les pages Équipe et Fiche seulement**, sans supprimer la contrainte sur des pages étrangères à cette refonte. Mesurer le conteneur rendu, pas seulement ajouter « container-fluid ». Prévoir des cartes avec 3 badges sans retour à la ligne en desktop, sans défilement horizontal global.

## Écarts Fiche membre constatés

| Réf. | Capture actuelle | Contrat UX impératif |
|---|---|---|
| FM01 **BLOQUANT** | Fiche dans une colonne étroite et beaucoup d'espace vacant | Fiche sur largeur utile, bandeau et panneaux jusqu'à la zone droite |
| FM02 **BLOQUANT** | Bandeau limité à avatar, nom, e-mail et statut texte | Bandeau **avatar neutre / nom / badge de statut / badges SM, PO, Dev / fonction** |
| FM03 **BLOQUANT** | Pas de navigation par onglets | **Profil, Affectation, Calendrier, Localisation, Historique**, dans cet ordre, Profil actif initial |
| FM04 **BLOQUANT** | Blocs fonctionnels empilés, deux seuls sur une ligne | **Onglet Profil à deux colonnes** : gauche Informations générales + Affectation actuelle ; droite Rôles Agile + Calendrier individuel + Localisation |
| FM05 | Crayons uniquement sur en-têtes de sections | **Crayon à droite de chaque champ simple modifiable** (nom, fonction, e-mail...) ; pour données historisées interdépendantes, crayon du groupe renvoyant au formulaire transactionnel |
| FM06 | Calendrier et localisation surtout textes « Voir et ajuster... » | Résumés **des valeurs enregistrées** ou « Non renseigné »/« Suggéré non enregistré », avec action ciblée |
| FM07 | « Cycle de vie » comme bloc central de présentation | Archiver dans actions de gestion, avec workflow protégé ; historique dans onglet Historique |
| FM08 | Jaune/bleu/vert selon rôle | Bleu homogène exercé, gris non exercé |
| FM09 **CONFORME** | Retour vers Équipe + icône impersonnelle | Conserver |

### Cause technique documentée

- **src/app/app/admin/members/[id]/page.tsx** enveloppe la fiche dans **smn-page**, donc limite **870 px**.
- **src/app/app/admin/members/[id]/member-detail.tsx** rajoute un **container** et **style={{maxWidth:1000}}** ; ces plafonds contredisent la pleine largeur.
- Le composant n'implémente **aucun onglet** ; il empile Rôles, Calendrier, Localisation et Cycle de vie.
- Le helper d'édition crée **un bouton par section**, et non un crayon par champ ; les panneaux Calendrier/Localisation exposent principalement des messages génériques.
- **Instruction ciblée :** reconstruire le **squelette visuel exact** (bandeau → onglets → panneaux Profil 2 colonnes), puis y reconnecter les données et éditeurs existants. Ne pas afficher une case « Statut » libre : le cycle de vie garde ses confirmations.

## Instructions d'exécution pour Amelia

1. Ne pas développer de nouveau code métier à partir du seul avenant ; limiter la correction en premier lieu à la présentation.
2. Préserver les règles SMN-42 à 47 / SMN-63, contrôle d'accès serveur, versions et dates d'effet ; ne pas inventer fonction, email, horaires, capacité, localisations ou membres fictifs.
3. Réutiliser les composants et tokens Bootstrap/thèmes SMN déjà présents, sans changer globalement .smn-page pour toutes les pages.
4. Desktop ~1 880 px : **6 cartes par rangée, 2 rangées initiales** (12 cases au minimum) ; membres actifs suivis immédiatement de la carte + et des cases grises pointillées. Ne jamais masquer le + si effectif au-delà de onze.
5. Les contrôles « Cartes » / « Liste » restent exclusifs et visibles en haut à droite ; jamais les deux vues simultanées.
6. Fiche : crayon pour données modifiables et droit correspondant ; formulaires datés de rôles/calendrier/localisation conservés. Historiques non réécrits silencieusement.
7. Ne pas transformer la maquette en source de données : « 8 h 09:00–17:00 » et « Paris UTC+01 » ne sont pas des valeurs métier universelles.
8. Livrer **captures navigateur avant/après à viewport comparable**, mesure de largeur du panneau, **preuves de résultat** de [RECETTE-VISUELLE-2026-10-22.md](RECETTE-VISUELLE-2026-10-22.md) et demander acceptation visuelle du commanditaire.

## Portée et réserves

Cet avenant renforce la restitution de maquettes **déjà validées** : il ne modifie pas la conception métier. La présence d'un champ « Fonction » persisté, l'exhaustivité des synthèses calendrier/localisation et le bon fonctionnement de la création individuelle restent **à vérifier** avant de les attester. L'ajout d'un membre et sa suppression/archivage ne doivent pas être réécrits sans analyse. La capture de la vue Liste n'a pas été fournie, donc sa conformité actuelle ne peut pas être affirmée.

**Statut : documentation seulement. Aucun développement ni ticket Jira modifié ; aucune recette runtime revendiquée.**