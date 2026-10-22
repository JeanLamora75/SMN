# Maquettes approuvées — Équipe / Membres (22 octobre 2026)

> **FICHE MEMBRE : VERSION PRÉCÉDENTE OBSOLÈTE.** La partie ci-dessous consacrée à la fiche à cinq onglets n'est plus applicable. Pour les décisions actuelles : [Fiche membre V2](FICHE-MEMBRE-V2-UX-CONTRAT.md), et [recette V2](FICHE-MEMBRE-V2-RECETTE.md). Les deux vues de la page Équipe restent inchangées.

**Statut : architecture d'écran, contenus et interactions approuvés.** Ces schémas reproduisent la **composition** validée en conversation ; ce sont des wireframes textuels et non une copie pixel-perfect des rendus illustratifs. Noms, e-mails, statuts, rôles de démonstration, horaires et dates sont fictifs.

## 1. Équipe — Vue Cartes (seule vue visible)

Sous le header global et la sidebar « Équipe » sélectionnée :

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Équipe                                    [ Rechercher… ]     [▦ Cartes][☷ Liste]   │
│ 8 membres actifs                              (▦ sélectionné / ☷ non sélectionné)   │
│                                                                                      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ │ Alice Martin  │ │ Benoît Dubois │ │ Claire Laurent│ │ David Moreau  │ │ Emma Richard  │ │ François Petit │
│ │      ◯♙       │ │      ◯♙       │ │      ◯♙       │ │      ◯♙       │ │      ◯♙       │ │      ◯♙       │
│ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │
│ │ Scrum Master  │ │ Product Owner │ │ Développeuse  │ │ Développeur   │ │ Scrum Master  │ │ Développeur   │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
│ ┌───────────────┐ ┌───────────────┐ ┏ ┄ ┄ ┄ ┄ ┄ ┄ ┓ ┌ ┄ ┄ ┄ ┄ ┄ ┄ ┐ ┌ ┄ ┄ ┄ ┄ ┄ ┄ ┐ ┌ ┄ ┄ ┄ ┄ ┄ ┄ ┐
│ │ Julie Bernard │ │ Kevin Robert  │ ┃      +       ┃ ┆             ┆ ┆             ┆ ┆             ┆
│ │      ◯♙       │ │      ◯♙       │ ┃ Ajouter un    ┃ ┆             ┆ ┆             ┆ ┆             ┆
│ │ [SM][PO][Dev] │ │ [SM][PO][Dev] │ ┃ membre        ┃ ┆             ┆ ┆             ┆ ┆             ┆
│ │ Développeuse  │ │ Développeur   │ ┗ ┄ ┄ ┄ ┄ ┄ ┄ ┛ └ ┄ ┄ ┄ ┄ ┄ ┄ ┘ └ ┄ ┄ ┄ ┄ ┄ ┄ ┘ └ ┄ ┄ ┄ ┄ ┄ ┄ ┘
└──────────────────────────────────────────────────────────────────────────────────────┘
~~~

Légende : pastille **bleue** si rôle exercé ; **grise** sinon. Reproduire le style de cartes blanches, arrondies, légères ombres, identité en haut et avatar neutre au centre. Les cases grises pointillées n'ont aucune interaction ; le plus ouvre la pop-up. Clic sur une carte entière = fiche de cette personne. **Six colonnes × deux rangées à largeur desktop adaptée** ; la hauteur et le nombre de colonnes sont ajustés en responsive.

## 2. Équipe — Vue Liste (remplace totalement la grille)

~~~text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Équipe                                   [ Rechercher… ]       [▦ Cartes][☷ Liste]   │
│ 8 membres actifs                                                (☷ sélectionné)       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Nom + ◯♙            Rôles Agile               Fonction             Statut      Action  │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Alice Martin        [SM] [PO] [Dev]           Scrum Master          Actif         >    │
│ Benoît Dubois       [SM] [PO] [Dev]           Product Owner         Actif         >    │
│ Claire Laurent      [SM] [PO] [Dev]           Développeuse          Actif         >    │
│ David Moreau        [SM] [PO] [Dev]           Développeur           Actif         >    │
│ Emma Richard        [SM] [PO] [Dev]           Scrum Master          Actif         >    │
│ François Petit      [SM] [PO] [Dev]           Développeur           Actif         >    │
│ Julie Bernard       [SM] [PO] [Dev]           Développeuse          Actif         >    │
│ Kevin Robert        [SM] [PO] [Dev]           Développeur           Actif         >    │
├┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┤
│ + Ajouter un membre                                                               >  │
└──────────────────────────────────────────────────────────────────────────────────────┘
~~~

**La liste et les cartes ne sont jamais simultanées.** Clic sur ligne/chevron = fiche. Clic sur Ajouter = même pop-up que vue Cartes.

## 3. Fiche membre — onglet Profil initial

~~~text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ← Retour à l'équipe                                                               │
│ Fiche membre                                    [Archiver]  [Retour]               │
│ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ │   ◯♙     Alice Martin    [Actif]                                               │ │
│ │          [SM bleu] [PO gris] [Dev gris]                                        │ │
│ │          Scrum Master                                                         │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
│ [Profil actif] [Affectation] [Calendrier] [Localisation] [Historique]              │
│                                                                                   │
│ ┌── Informations générales ────────────┐  ┌── Rôles Agile ──────────────────────┐ │
│ │ Nom      Alice Martin             ✎  │  │ [SM bleu] [PO gris] [Dev gris]  ✎  │ │
│ │ Fonction Scrum Master             ✎  │  └────────────────────────────────────┘ │
│ │ E-mail   alice@exemple.fr         ✎  │  ┌── Calendrier individuel ────────────┐ │
│ │ Statut   Actif                [Gérer]│  │ Jours travaillés : selon source  ✎  │ │
│ └──────────────────────────────────────┘  │ Jours non travaillés : selon source │ │
│ ┌── Affectation actuelle ──────────────┐  └────────────────────────────────────┘ │
│ │ Équipe        Équipe courante (fixe)  │  ┌── Localisation ────────────────────┐ │
│ │ Taux          100 %               ✎  │  │ Pays          France            ✎  │ │
│ │ Contribution  selon données       ✎  │  │ Région / ville selon données    ✎  │ │
│ │ Date d'effet  selon version       ✎  │  │ Zone IANA     Europe/Paris      ✎  │ │
│ └──────────────────────────────────────┘  └────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
~~~

**Lecture de la capture approuvée :** bandeau identité, puis onglets, puis deux colonnes de panneaux arrondis. Chaque crayon est **adjacent à l'information modifiable** ; le statut passe par une action de gestion du cycle de vie (pas une modification directe de « Actif »). Les panneaux Rôles, Calendrier et Localisation renvoient à leurs formulaires complets afin de conserver dates d'effet et historicité.

## 4. Nouveau membre — pop-up demandée (structure, pas champs validés)

~~~text
            ┌────────────────────────────────────┐
            │ Ajouter un membre               ×  │
            │ Équipe : [nom courant, non modifiable]│
            │ [Champs de création à finaliser]    │
            │                                     │
            │ [Annuler] [Enregistrer le membre]   │
            └────────────────────────────────────┘
~~~

L'utilisateur a validé **l'ouverture de la pop-up** et l'effet métier attendu (**un nouveau membre lié à l'équipe courante**), **pas** la liste précise de champs ou le comportement au-delà de 12 emplacements. Éviter de livrer les hypothèses comme faits validés.

## 5. Remarques de fidélité

- Les visuels initiaux de la conversation sont la **référence de direction graphique approuvée**, mais leurs PNG ne sont pas déposés ici.
- Les initiales, personnages illustratifs, badges et fonctions des exemples ne créent pas de fiches réelles.
- Pas d'image de personne demandée au MVP ; future sélection de portraits prédéfinis en v1 uniquement.
- Les valeurs dans la fiche membre, y compris journées de 8h et les dates, ne doivent **pas** être prises pour des paramètres par défaut du système.
- Les contrats [DESIGN.md](DESIGN.md) et [EXPERIENCE.md](EXPERIENCE.md) priment en cas de désaccord avec les exemples.

## Illustration référencée et correction — 22/10/2026

Les reconstructions vectorielles du dossier [references-visuelles](references-visuelles/cible-equipe-cartes.svg) permettent d'ouvrir séparément les trois vues approuvées : [Cartes](references-visuelles/cible-equipe-cartes.svg), [Liste](references-visuelles/cible-equipe-liste.svg) et [Fiche](references-visuelles/cible-fiche-membre.svg). La [comparaison de proportions](references-visuelles/comparaison-structure.svg) rend l'écart actuel explicite. Pour les faits observés et critères stricts, voir [AVENANT-UX-CORRECTIF-2026-10-22.md](AVENANT-UX-CORRECTIF-2026-10-22.md).

**Ne pas prétendre que ces SVG sont les captures originales** : ils restituent les décisions graphiques déjà approuvées et leurs exemples sont fictifs.