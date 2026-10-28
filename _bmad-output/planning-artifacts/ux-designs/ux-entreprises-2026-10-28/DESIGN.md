# DESIGN — Entreprises et disponibilités — SMN
**BMAD v6.12.4 — Sally UX Designer — 28/10/2026**
**Statut : contrats UX approuvés en conversation (UX-ENT-01 à 12). Implémentation et recette non attestées.**
**Référence :** [Brief PM](../../briefs/entreprises-disponibilites-2026-10-28/BRIEF-BMAD-PM.md) ; `docs/UX-REFERENTIEL-BMAD.md` ; SMN-298 ; Paramètres Cockpit Agile.

## Navigation et catalogue
Entrée **Paramètres > Entreprises** globale à l'installation, indépendante de l'équipe sélectionnée. Catalogue **Cartes par défaut**, 3 colonnes desktop / 2 tablette / 1 mobile ; bascule exclusive Cartes/Liste, préférence mémorisée indépendamment des autres modules. Recherche par nom, filtre actives/archivées/toutes et création selon droits. Carte : icône, nom, pastille de couleur, commentaire abrégé si renseigné, nombre de membres visibles, statut et menu d'actions autorisées ; clic ouvre la fiche. Liste compacte : nom, commentaire, membres, statut, actions.

## Fiche entreprise
Bandeau Cockpit Agile : icône, nom, couleur, commentaire abrégé, statut et actions permises. Trois onglets horizontaux : **Informations**, **Fermetures**, **Membres**.
- **Informations :** nom, commentaire, couleur, statut ; crayon ouvrant une modale selon droits.
- **Fermetures :** **tableau unique** Nom | Début | Fin | Statut | Actions, recherche par nom, filtres année et statut, tri chronologique. Bouton Ajouter ; modification, annulation, consultation historique selon droits.
- **Membres :** **tableau compact en lecture seule** Membre | Équipe | Fonction | État, recherche par membre, filtre par équipe, accès à la fiche si autorisé. Pas de modification d'affectation ici ; aucun effectif ou nom non autorisé exposé.

## Modales et actions
Une **seule modale création/édition entreprise** : nom obligatoire, commentaire facultatif multiligne, couleur sélectionnée dans la palette prédéfinie Cockpit Agile (sans hex libre). Valeur par défaut valide ; tokens des thèmes existants à respecter. Actions Annuler et Enregistrer alignées ; protection contre sortie avec données non enregistrées. Archivage/réactivation hors formulaire, via actions dédiées.
- **Archivage :** confirmation contextualisée donnant le nombre de membres visibles et expliquant la conservation des affectations et des fermetures, ainsi que l'interdiction des nouvelles associations. Réactivation : confirmation simple.
- **Fermeture :** modale création/édition unique : nom, début et fin obligatoires, journées entières ; fin >= début ; **chevauchement entre fermetures actives d'une même entreprise bloqué** avec message précis ; fermetures annulées exclues de ce contrôle. Annulation distincte avec confirmation et historisation, sans suppression.
- Les erreurs restent dans les formulaires et conservent les valeurs saisies. Les contrôles sont aussi effectués côté serveur.

## Membres et calendrier
- À la création d'un membre : champ Entreprise facultatif proposant les entreprises actives ; aucune entreprise possible. Entreprise choisie ensuite affichée en lecture seule ; **pas de transfert d'entreprise** (clôture de l'ancienne fiche, création d'une nouvelle).
- Vue Cartes membres : petite pastille de couleur + nom de l'entreprise **sous le nom du membre** ; si non renseignée, aucune ligne ajoutée. Vue Liste et fiche : même identité discrète. Entreprises archivées restent visibles pour les associations existantes.
- Calendrier équipe : fermeture affichée **comme information**, distincte des événements et absences, avec entreprise, couleur et titre, si au moins un membre autorisé de l'équipe est concerné. Jamais un blocage graphique collectif. Clic : **modale lecture seule détaillée** (entreprise, période, durée, nombre et liste nominative des membres visibles selon droits), aucune action d'édition.

## États, permissions et responsive
États : chargement, catalogue vide, filtres sans résultat, aucune fermeture, aucun membre, entreprise archivée, erreur, conflit d'édition, lecture seule. Masquer les actions non autorisées, en plus des protections serveur. Respecter FR/EN centralisés, palettes et thèmes existants, keyboard/focus, labels/contrastes, zoom 200 %, défilement horizontal accessible des tableaux. N'utiliser jamais la couleur seule comme indicateur. Modales conformes à SMN-298.

## Frontière de responsabilité
Le présent contrat définit l'UX, pas les migrations, le moteur de capacité ni une preuve d'implémentation. Conserver ENT-01 à ENT-14, spécialement déduction sans doublon et préservation des capacités initiales figées. Audit Winston nécessaire sur données historiques, droits et moteur de capacité.
