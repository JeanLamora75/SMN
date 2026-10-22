---
name: Scrum Master Notebook — Équipe et membres
status: final
updated: 2026-10-22
description: Comportements validés pour les vues Équipe Cartes/Liste et la fiche membre ; les décisions encore ouvertes sont explicitement marquées.
sources:
  - https://lmn24.atlassian.net/browse/SMN-3
  - https://github.com/JeanLamora75/SMN/blob/main/docs/UX-REFERENTIEL-BMAD.md
---

# SMN — EXPERIENCE.md / Équipe & Membre

> **Contrat UX validé** sur les parcours principaux en conversation les 21 et 22/10/2026. Voir [DESIGN.md](DESIGN.md) pour la composition. **Aucune recette visuelle ou fonctionnelle exécutée** ; la fiche de « Fonction » et l'ajout d'un membre après initialisation nécessitent un examen fonctionnel/technique.

## Foundation

- Cible : Scrum Master / RTE, application web responsive Windows 11, Next.js / React / Bootstrap 5 ; minimiser les gestes et la saisie.
- MVP Scrum/Kanban : **une seule équipe** interne par installation. Ne pas exposer une seconde équipe ni un sélecteur multiéquipe fonctionnel.
- **Membre métier ≠ compte de connexion SMN** : ajouter un membre ne crée ni compte, ni accès ni e-mail obligatoire.
- **Données nominatives et calendriers individuels** accessibles seulement aux profils autorisés (règle actuellement Administrateur côté serveur). La nouvelle entrée principale « Équipe » ne doit jamais exposer ces données aux utilisateurs non autorisés.
- **Aucune valeur inventée** : conserver les états connue/enregistrée, suggérée, inconnue (SMN-63), et toutes les protections de révisions/date d'effet, confidentialité et historicisation.
- Traductions centralisées dans **src/i18n/fr.json** et **src/i18n/en.json**. Préserver navigation, thème clair/sombre et palettes existants.

## Information Architecture

| Surface | Accès | Finalité |
|---|---|---|
| Menu principal « Équipe » | Sidebar, visible lorsque la consultation de membres est autorisée | Ouvrir la gestion de l'équipe |
| Page Équipe | Route existante **/app/admin/members** réutilisable ; URL exacte non contractuelle | Liste des membres de l'unique équipe, recherche, sélection de présentation |
| Vue Cartes | Bouton icône grille en haut à droite | Grille de cartes actives + carte Ajouter + emplacements réservés |
| Vue Liste | Bouton icône liste en haut à droite | Table des mêmes membres + ligne Ajouter |
| Pop-up Ajouter | Clic sur carte + / ligne Ajouter | Créer **un** nouveau membre métier, rattaché à l'équipe courante |
| Fiche membre | Clic sur carte ou ligne | Consulter et éditer données individuelles, onglets et historique |
| Formulaires ciblés | Icône crayon près d'un champ/section | Modification autorisée et historisée de l'information concernée |
| Archivage | Action « Archiver » de la fiche, séparée de l'édition courante | Workflow protégé de fin d'affectation/archivage SMN-45 |

Pour la fiche, privilégier une URL adressable, sécurisée et stable contenant **l'identifiant métier** (schéma proposé : /app/admin/members/[id]) avec lien retour à « Équipe ». L'URL n'est pas elle-même un critère d'acceptation tant que l'architecture du projet n'a pas été arbitrée.

## Voice and Tone

- Nom « Équipe » dans la navigation et le titre d'écran.
- « 8 membres actifs » uniquement lorsque 8 affectations actives non archivées existent réellement ; **ne pas confondre fiche confirmée/provisoire et affectation active**.
- « SM », « PO », « Dev » sur petits badges ; nom complet accessible via infobulle/aria-label.
- « Fonction non renseignée », « E-mail non renseigné », « Calendrier suggéré (non enregistré) », « Localisation inconnue », « Pas d'affectation active » selon vérité de la base.
- « Archiver » ne signifie pas « Supprimer ». « Actif » ne se coche pas librement ; il est dérivé de l'affectation et de l'archivage.

## Component Patterns

### Entrée de menu et changement de présentation

1. L'Administrateur autorisé clique **Équipe** depuis le menu latéral principal (et non dans un sous-menu obscur de réglages).
2. La page affiche seulement les **membres actifs** par défaut. Définition : fiche non archivée + participation/affectation active pour la période courante. Une fiche provisoire peut être active ; ne pas l'exclure par défaut.
3. Deux icônes en haut à droite : **Cartes (grille)**, **Liste (lignes)**. Les deux sont des boutons exclusifs et accessibles (nom, état sélectionné).
4. Un clic sur l'icône non active **remplace** la vue ; aucune juxtaposition, aucun doublon, aucun changement de données, d'équipe ni de filtres. Le dernier choix est **mémorisé** entre navigations et sessions si une persistance compatible est disponible ; la portée de cette préférence est à confirmer avant écriture.
5. Le premier choix de mode en l'absence de préférence n'a **pas encore été explicitement validé** (maquettes des deux options approuvées ; ne pas confondre avec une préférence de démarrage).

### Grille Cartes

- Remplir les emplacements dans l'ordre courant des membres réellement actifs, **un membre = une carte**.
- Première case libre immédiatement après les membres : **carte + Ajouter un membre**.
- En dessous de 12 emplacements occupés, toutes les autres cases des **deux rangées de six** restent grises pointillées et inertes.
- La carte Ajouter et les emplacements vides ne doivent pas augmenter artificiellement le compteur de membres.
- Plusieurs rôles Agile actifs : les badges correspondants sont tous bleus, les autres gris ; ne pas se limiter à un seul rôle primaire.
- **Toute la carte membre ouvre sa fiche** au clic ou au clavier, jamais l'éditeur en bas de la liste. Les éventuelles commandes secondaires doivent être dissociées de la surface cliquable.
- Pour le cas 12 membres actifs ou plus, une règle de débordement est **à valider** avant fin de développement (afficher tous les membres + Ajouter, ne jamais cacher ce dernier).
- Les emplacements pointillés vides ne sont ni tabulables ni cliquables.

### Liste

- Même source de vérité, même tri, mêmes filtres, mêmes libellés et mêmes rôles que les Cartes.
- Une seule table visible ; ligne = pictogramme neutre, nom, 3 badges SM/PO/Dev, fonction, statut, action d'ouverture.
- Ligne finale « Ajouter un membre » ; la même fenêtre modale s'ouvre qu'en mode Cartes. Si aucune personne active, cette action reste visible.
- Une ligne entière est activable pour ouvrir la fiche ; les boutons secondaires éventuels ont des libellés distincts.

### Ajout individuel (pop-up modale)

- **Décision approuvée :** le « + » ouvre une pop-up pour créer **un nouveau membre de l'équipe courante** ; validation explicite, fermeture par Annuler / croix / Échap si aucun brouillon non sauvegardé, indication des erreurs près des champs, reprise de la vue courante après succès.
- **Conditions incontournables :** ne pas créer de compte SMN, ne pas déclencher d'envoi d'e-mail, ne pas inventer une deuxième équipe, ne pas effacer l'historique d'un ancien membre, éviter tout doublon sur retry réseau, préserver préremplissage SMN-63 sans écriture avant Enregistrer.
- **Le formulaire détaillé n'est pas encore validé** : proposer le minimum de champs compatibles avec le nouveau modèle (nom/provisoire, fonction facultative, rôle(s) avec parts, date d'effet, e-mail facultatif, valeurs suggérées). Amelia doit faire valider les champs obligatoires, la distinction confirmation/provisoire et les règles d'affectation avant d'implémenter les mutations ; ne jamais supposer que « Développeur » est le seul rôle possible.
- **Écart connu :** l'API POST /api/admin/members crée uniquement un premier lot de 3 à 50 personnes et répond « already-initialized » si l'équipe est déjà initialisée. **Créer un membre individuel supplémentaire exige une nouvelle capacité serveur, dans une US dédiée ou explicitement amendée**, sans contourner l'API existante par hack front-end.

### Fiche membre

1. Depuis une carte ou une ligne, ouvrir une fiche indépendante, conserver l'ID métier en URL/état, afficher un lien **« Retour à l'équipe »**.
2. Bandeau d'identité : silhouette neutre commune au MVP, nom, état, badges SM/PO/Dev, fonction ; ne pas inventer un avatar personnel.
3. Onglets : **Profil**, **Affectation**, **Calendrier**, **Localisation**, **Historique** ; naviguer sans perdre la personne sélectionnée.
4. Onglet Profil : colonnes de synthèse de la maquette : **Informations générales**, **Affectation actuelle**, **Rôles Agile**, **Calendrier individuel**, **Localisation**. Les cartes récapitulatives sont alimentées par les mêmes données que leurs onglets détaillés, et non par des doublons.
5. Sur chaque **information modifiable**, crayon aligné sur la ligne. Exemple simple « Nom », « Fonction », « E-mail » : focus direct dans éditeur dédié ou en ligne avec boutons **Enregistrer**/**Annuler**. Sur propriétés versionnées complexes (rôles, pourcentages, calendrier, localisation, dates), le crayon de section ouvre un formulaire **transactionnel groupé** qui conserve date d'effet, contraintes de somme et version.
6. Les champs en **lecture seule** n'affichent pas un crayon trompeur : équipe unique non éditable par affectation vers une autre équipe ; ancien historique non réécrivable. Le « crayon » à côté de **Statut** (présent à titre illustratif sur la maquette) doit ouvrir uniquement le **workflow de cycle de vie** avec confirmations, pas offrir un champ libre « actif ».
7. Les **rôles Agile SM/PO/Dev** sont des parts d'affectation et peuvent se cumuler. L'édition suit SMN-44 (total des parts = 100 % et contrôle d'affectation vs temps contractuel) ; un rôle inactif ne contribue pas à une capacité développeur.
8. La section **Calendrier individuel** résume les plages réellement connues (jours/demi-journées). Ne pas afficher « 8 heures 09h–17h » si seule une information matin/après-midi est connue. Calendriers suggérés identifiés non enregistrés ; les absences relèvent de l'onglet Calendrier.
9. La section **Localisation** résume le pays, la région/ville, le fuseau IANA et l'origine enregistrée ; ne pas dériver le fuseau d'un pays, ni convertir une heure avec un décalage d'été/hiver figé.
10. **Historique** : consulter les versions datées (profil si disponible, affectations, calendrier, localisation, archive) en respectant la traçabilité existante. Aucun clic ne doit réécrire les périodes passées sans circuit métier prévu.
11. **Archiver** via action dédiée : si affectation ouverte, la terminer d'abord conformément à SMN-45 ; confirmation, protection des historiques, alerte non bloquante si équipe < 3 membres ; après succès, membre disparaît du filtre actifs mais reste consultable dans l'archive par une entrée explicitement prévue, si son périmètre est autorisé.
12. **Modification non sauvegardée** : navigation onglets, retour à la liste, changement de vue et fermeture de modal doivent préserver ou avertir avant perte du brouillon ; garde anti-double soumission et erreur réseau réessayable.

## State Patterns

| Cas | Restitution |
|---|---|
| Chargement | Indicateur de chargement sans fausses personnes |
| Aucun membre | Compteur 0, carte Ajouter disponible, cases vides grises ; ne pas bloquer l'installation Express |
| 8 membres actifs | 8 cartes, 9e = Ajouter, 3 cases pointillées pour atteindre 12 |
| 11 membres actifs | 11 cartes + Ajouter en 12e position |
| 12 membres et plus | Règle de débordement ouverte ; aucun membre et aucune action masqués |
| Membre provisoire actif | Carte présente avec son nom provisoire explicite ; édition possible selon droits |
| Membre clôturé/archivé | Absent de la vue « Actifs », accessible via filtre/archives prévu et droits |
| Données incomplètes | « Non renseigné » / « Suggéré » selon source, jamais zéro artificiel |
| Panne GET/POST | Message contextualisé + Réessayer, conserver les brouillons |
| Conflit de version 409 | Expliquer la divergence et proposer recharge sans effacement silencieux |
| Aucun droit individuel | Aucune donnée sensible affichée, accès serveur refusé |

## Interaction Primitives

Tab et Enter/Espace doivent permettre bascule Cartes/Liste, ouverture d'une carte/ligne, lancement d'édition au crayon, confirmation et annulation. Les modales déplacent le focus à l'ouverture, le retiennent à l'intérieur, le restituent à l'élément déclencheur après fermeture, et n'entraînent pas de mutation sur simple affichage.

## Accessibility Floor

Cible WCAG 2.2 AA à **vérifier** lors de la recette : focus visible, contrastes, textes français/anglais, zoom 200 %, 320 px, clavier, lecteurs d'écran, absence de codage couleur seul. Badge « SM » accessible comme « Scrum Master, rôle exercé » ou « Scrum Master, rôle non exercé ». Avatar générique purement décoratif ou décrit sans genre. Les trois badges de la carte ne sont pas des boutons sauf s'ils ouvrent un comportement explicitement défini.

## Key Flows — parcours et critères de recette proposés

- **R01** : administrateur ouvre « Équipe » depuis la sidebar, voit seulement les membres ayant une affectation active non archivée ; aucune fausse valeur.
- **R02** : avec 8 membres actifs, afficher 8 cartes + 1 ajout + 3 cases vides sur 2 × 6 ; silhouette identique sur chacune des 8 personnes.
- **R03** : en liste puis en cartes, mêmes 8 membres, badges et fonctions ; **jamais les deux vues simultanées** ; persistance après retour selon règle validée.
- **R04** : un membre à 40 % SM / 60 % Dev affiche SM et Dev colorés, PO grisé ; un autre 100 % PO affiche PO seul.
- **R05** : un clic sur carte **ou ligne** ouvre **le même ID métier** dans la fiche dédiée ; retour « Équipe » récupère vue, recherche et filtres si faisable.
- **R06** : clic sur Ajouter ouvre modal, Annuler ne crée rien ; Enregistrer valide un **seul** nouveau membre rattaché à l'équipe actuelle sans compte login ; sa carte et son statut apparaissent après actualisation ; retry sans doublon.
- **R07** : sur fiche, crayon Nom change uniquement Nom après Enregistrer ; Annuler conserve l'ancien ; e-mail peut rester vide ; Fonction peut être inconnue.
- **R08** : crayon Affectation/Rôles ouvre édition versionnée, exige total 100 % et date d'effet ; les périodes passées ne changent pas.
- **R09** : calendrier suggéré sans sauvegarde est explicitement distingué du calendrier enregistré ; absences/exception ne sont pas créées à la lecture.
- **R10** : fuseau IANA et pays restent distincts de la langue ; affichage Paris tient compte du changement d'heure à la date pertinente.
- **R11** : Archivage exige règles SMN-45 ; la fiche reste consultable dans historique autorisé, pas de suppression en cascade.
- **R12** : une modification non sauvegardée déclenche un avertissement clair à la sortie ; aucune sauvegarde silencieuse.
- **R13** : rôle Utilisateur sans droit individuel : aucune fiche nominative/e-mail via menu, URL directe ou API.
- **R14** : tester FR/EN, trois palettes, deux thèmes, responsive, clavier et 200 % zoom ; aucune erreur technique brute.

## Inspiration & Anti-patterns

S'inspirer du rendu **validé par l'utilisateur**, pas d'un répertoire d'administration CRUD. Ne pas juxtaposer les deux modes, donner cinq boutons par ligne, afficher les formulaires sous toute la liste, imposer une photo ni détourner les clics de la fiche vers une édition intempestive. Les données de la maquette ne valent pas preuve de présence de champs en base.