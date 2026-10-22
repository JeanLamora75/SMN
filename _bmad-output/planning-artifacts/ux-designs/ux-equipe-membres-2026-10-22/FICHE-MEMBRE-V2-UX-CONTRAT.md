# SMN — Fiche membre UX V2 : référence consolidée pour Amelia

**Validé métier / UX : 22 octobre 2026, Sally — BMAD v6.12.4.**  
**Statut : CONTRAT DE CONCEPTION APPROUVÉ ; implémentation et recette NON attestées.**

**Autorité documentaire : CE FICHIER PRIME pour la fiche membre sur les descriptions plus anciennes à cinq onglets, les captures et les SVG antérieurs.** La page « Équipe » Cartes/Liste conserve ses décisions déjà validées ; seul le détail membre est réorganisé.

Références : Epic [SMN-3](https://lmn24.atlassian.net/browse/SMN-3) ; Stories SMN-42 à SMN-47 et SMN-63 ; [contrat UX général](DESIGN.md) ; [comportements](EXPERIENCE.md) ; [avenant après captures](AVENANT-UX-CORRECTIF-2026-10-22.md) ; [source Fiche actuelle](https://github.com/JeanLamora75/SMN/blob/main/src/app/app/admin/members/%5Bid%5D/member-detail.tsx).

## 1. Décisions fermes (ne pas les réinterpréter)

| UX ID | Décision approuvée | Conséquence |
|---|---|---|
| M-V2-01 | **Un seul bandeau d'identité sur toute largeur utile de l'écran**, sous « ← Équipe » | Supprimer l'onglet « Profil » et ses panneaux redondants |
| M-V2-02 | **Gauche du bandeau** : avatar asexué générique, NOM, FONCTION, badges SM / PO / Dev, statut « Actif/Archivé/… » lorsqu'applicable | Fonction = texte professionnel distinct des rôles ; trois badges toujours visibles, colorés en bleu si exercés, grisés sinon |
| M-V2-03 | **Droite du même bandeau** : adresse e-mail + localisation (pays, région/ville, fuseau IANA si enregistrés) | Profiter de la largeur, ne pas faire croître inutilement la hauteur ; informations non renseignées explicites |
| M-V2-04 | **Un seul crayon à côté du nom** déclenche **UNE fenêtre modale commune** pour Nom + E-mail + Fonction + Pays + Région + Ville + Fuseau horaire | Aucun autre crayon isolé pour e-mail/fonction/localisation ; révisions/date d'effet de localisation conservées |
| M-V2-05 | **Quatre onglets exclusivement** : **Affectation | Calendrier | Absences | Historique** | Supprimer les anciens onglets « Profil » et « Localisation », et les panneaux doublons |
| M-V2-06 | Les onglets sont des **pages de consultation**, avec données actuelles ET versions/historiques directement visibles ; seules les modifications ouvrent une modale | Aucune table d'historique enfermée derrière un crayon ou dans le bas du formulaire de saisie |
| M-V2-07 | **Affectation** : résumé de l'affectation, répartition SM/PO/Dev, dates d'effet, historique de versions sous le résumé ; crayon unique « Modifier l'affectation » | Modal allégée avec date d'effet, paramètres chiffrés, parts Agile et validation 100 % ; PAS de table de versions dans la modale |
| M-V2-08 | **Calendrier** : trame hebdomadaire, exceptions ponctuelles, historiques des trames et exceptions ; 2 actions distinctes Modifier trame / Ajouter exception | Les absences sont retirées du formulaire Calendrier et placées exclusivement dans Absences |
| M-V2-09 | **Absences** : liste des absences, dates, demi-journées, catégorie, état et versions enregistrées ; Ajouter / Modifier une absence dans une modale dédiée | Ne pas imbriquer MemberAbsenceEditor au bas d'un formulaire de calendrier |
| M-V2-10 | **Historique** : chronologie globale disponible, consultable dès le clic sur l'onglet, sans crayon | Source réelle : affectations, calendrier, absences, localisation, cycle de vie et identité seulement si historiques disponibles |
| M-V2-11 | Toutes les modales sont **centrées dans le viewport**, avec fond gris sombre semi-transparent, focus modal, actions Annuler/Enregistrer ; défilement interne pour contenus longs | Interdire l'injection des éditeurs en pied de fiche ; une opération = une fenêtre ; ne pas emprisonner un formulaire de calendrier+absences+historique géant |
| M-V2-12 | L'entrée par carte ou ligne depuis Équipe ouvre directement la fiche et son **onglet Affectation** initialement | Conserver lien retour Équipe, ID métier, droits serveur, contexte de membre |

## 2. Hiérarchie du bandeau (desktop)

Deux zones horizontales à l'intérieur du MÊME panneau blanc arrondi ; pleine largeur du contenu entre sidebar et bord droit, marges normales. **Pas deux grandes cartes empilées.** Le bandeau doit rester de hauteur modérée.

~~~text
← Équipe
┌────────────────────────────────────────────────────────────────────────────────────┐
│   (avatar)   NOM DU MEMBRE       [✎] [Actif]   │  ✉ Adresse e-mail                 │
│              Fonction professionnelle         │    william@localhost.com           │
│              [SM bleu] [PO gris] [Dev gris]    │  ⌖ Localisation                    │
│                                               │    Ville, Région, Pays             │
│                                               │    Zone IANA si enregistrée        │
└────────────────────────────────────────────────────────────────────────────────────┘
  [ Affectation ] [ Calendrier ] [ Absences ] [ Historique ]
  [ CONTENU DE L'ONGLET CHOISI SEUL ]
~~~

La localisation peut être « Non renseignée » ; **ne pas déduire Paris, France ou Europe/Paris depuis l'exemple**, ni inférer le fuseau de la langue. L'e-mail reste facultatif. La fonction professionnelle n'est **pas** un alias de l'un des rôles SM/PO/Dev.

Sur mobile / zoom fort, les zones peuvent s'empiler pour rester lisibles. Sur desktop, favoriser l'alignement gauche/droite et garder les badges sur une ligne. La couleur bleue est celle du thème primaire (y compris palette active) et le gris signifie rôle non exercé.

## 3. Modale unique « Modifier les informations du membre »

Déclencheur : **le seul crayon du bandeau près du nom** (avec libellé accessible « Modifier les informations de NOM »). La fiche reste visible mais bloquée derrière le voile gris (opacité indicative ~50 %).

~~~text
          ┌───────────────────────────────────────────────────┐
          │ Modifier les informations du membre           [×] │
          │ Informations générales                           │
          │  Nom *                                            │
          │  Adresse e-mail (facultative)                    │
          │  Fonction (facultative)                          │
          │ Localisation                                     │
          │  Pays                                            │
          │  Région                      Ville               │
          │  Fuseau horaire IANA                             │
          │  Date d'effet (si changement de localisation)    │
          │                      [Annuler] [Enregistrer]      │
          └───────────────────────────────────────────────────┘
~~~

### Règles métier / limites de l'accord

- Le formulaire présente des **valeurs enregistrées**, ou des suggestions clairement identifiées comme telles (SMN-63) ; une simple ouverture/fermeture n'écrit rien.
- Le **Nom** est obligatoire ; l'e-mail est facultatif ; la **Fonction professionnelle est un champ texte facultatif distinct de la répartition Agile**, affiché dans le bandeau ET dans les vues Cartes/Liste de l'équipe.
- Le code précédemment vérifié du profil prend en charge nom + e-mail seulement : **Amelia doit analyser et mettre en place la persistance de la Fonction** (API, schéma, migration si nécessaire, traduction/validation), sans prétendre que le champ existe déjà.
- Les données de localisation ont une **date d'effet et des versions**, donc leur mise à jour doit respecter le système d'historisation SMN-47. Une date d'effet est demandée lorsque la localisation change, avec validations temporelles et révocation/gestion des brouillons.
- **Un bouton Enregistrer pour le formulaire complet.** **Exigence de cohérence : aucune sauvegarde partielle silencieuse** ; une seule confirmation de succès après persistance vérifiée de toutes les parties modifiées. **Dépendance technique à analyser :** les endpoints profil et localisation sont séparés ; Amelia doit proposer un mécanisme atomique ou une stratégie d'échec/compensation explicitement documentée et approuvée avant de déclarer l'enregistrement groupé conforme. Ne pas simuler l'atomicité par deux sauvegardes indépendantes non signalées.
- Bouton Annuler, croix, et touche Échap si abandon autorisé ; demander confirmation en cas de champs modifiés. Un clic sur le voile ne fait pas perdre le brouillon. Conserver le focus dans la modale, le rendre au crayon en sortant ; un état « enregistrement en cours » empêche double soumission.
- Après sauvegarde, mettre à jour bandeau + vue Équipe et garder l'onglet courant ouvert ; en cas de conflit de révision, erreur visible sans effacer la saisie.
- Les rôles Agile et pourcentages **NE SONT PAS dans cette modale** : ils se gèrent exclusivement dans Affectation. Le statut d'archivage ne devient pas un champ éditable libre.

## 4. Onglets — consultation première, édition secondaire

### 4.1. Affectation (premier onglet)

**Visible sans crayon :** équipe actuelle (monoéquipe MVP), temps contractuel %, affectation à l'équipe %, coefficient de contribution %, date d'effet, SM/PO/Dev et parts effectives ; panneau « Historique des versions » listant les versions datées (y compris versions futures si disponibles) avec révision, date d'effet et valeurs pertinentes. Zéro donnée fictive.

**Une action « Modifier l'affectation »** ouvre un formulaire compact : date d'effet + 3 pourcentages + les 3 parts Agile. **Somme des rôles = 100 %** et affectation <= temps contractuel, selon les contrôles métier existants ; indicateur live du total recommandé. Boutons Enregistrer/Annuler ; **pas d'historique de versions dans la modale**.

### 4.2. Calendrier

**Visible sans crayon :** trame hebdomadaire matin/après-midi par jour, avec état « proposée non enregistrée » ou « enregistrée » explicite ; exceptions ponctuelles avec date, demi-journées et note si renseignée ; **historique des versions de trame ET des exceptions**.

Actions distinctes : **« Modifier la trame »** ouvre une modale pour les jours/demi-journées + date d'effet seulement ; **« Ajouter une exception »** ouvre sa propre modale pour date / créneaux / note ; modifier une exception existante seulement si les règles métier le permettent. **Ne pas ajouter dans ces modales les absences, la localisation ni les historiques.**

### 4.3. Absences

**Visible sans crayon :** tableau des absences du membre (période de début-fin, demi-journées, catégorie, caractère planifié/confirmé tel que réellement enregistré, commentaire si disponible), avec historique des modifications réellement conservées ; contrôles utiles de période et état. États « Aucune absence », chargement et erreur.

Actions : **« Nouvelle absence »** et, si autorisé, **« Modifier une absence »**. Chaque action ouvre un formulaire d'absence **seul** : dates/créneaux, catégorie et autres champs requis par les règles existantes ; pas d'éditeur de trame ou de tableau des versions dans la modale. Préserver la validation des jours fériés/fermetures, conflits, catégories et demi-journées.

### 4.4. Historique global

**Visible directement au clic, sans crayon :** chronologie en lecture seule, événements triés du plus récent au plus ancien **en fonction des dates disponibles**, avec origine/type, date d'effet, révision et synthèse selon les données disponibles ; distinguer date d'effet et date de création si connues.

Agrégation progressive : événements d'affectation/fin d'affectation, versions de calendriers/exceptions, absences, versions de localisation et événements du cycle de vie ; changements d'identité uniquement si l'historisation existe réellement. Une chronologie vide doit afficher « Aucun élément d'historique disponible à ce jour », pas un crayon donnant accès à des informations cachées. Les listes détaillées par domaine restent dans leur onglet et **peuvent coexister avec un récapitulatif global**, sans duplication d'édition.

**Cycle de vie :** archivage/réactivation/fin d'affectation via actions de gestion distinctes, confirmées, soumises aux droits et règles SMN-45, et non par un crayon « Historique ».

## 5. Refonte des composants (guidance à Amelia, pas code exécuté)

| Source actuelle sur main | Écart UX | Cible |
|---|---|---|
| src/app/app/admin/members/[id]/member-detail.tsx | Cinq onglets, profil dupliqué, localisations isolées, modales de composants monolithiques | Bandeau 2 zones, crayon unique, 4 onglets et vues de consultation |
| src/app/app/admin/members/member-profile-editor.tsx | Nom/e-mail uniquement | Édition coordonnée nom, e-mail, fonction et localisation, sans perte de validations |
| src/app/app/admin/members/assignment-editor.tsx | Tableau des versions intégré à la modale | Isoler lecture et historique de l'édition des seuls paramètres |
| src/app/app/admin/members/member-calendar-editor.tsx | Mélange trame, exceptions et MemberAbsenceEditor | Séparer consultation, formulaire trame, formulaire exception et module Absences |
| src/app/app/admin/members/member-absence-editor.tsx | Gestion imbriquée dans Calendrier | Module autonome de consultation/liste avec pop-up créer/modifier |
| src/app/app/admin/members/member-location-editor.tsx | Onglet et éditeur séparés | Réemployer services datés dans modale d'identité, afficher résumé à droite |

**Conserver** le menu « Équipe », les deux modes Cartes/Liste exclusifs, la grille 6×2 à largeur desktop, la silhouette neutre, la tuile + et les protections métier existantes. Ne pas remodeler la base ou les API sans analyse et découpage de Story pertinent.

## 6. Gestion des états, sécurité et cohérence

- Les quatre onglets partagent **un seul membre actif en contexte**. Chaque onglet lit les données de source de vérité ; pas de copie figée contradictoire entre header, onglets et listes.
- Membre archivé : consultation autorisée selon droits ; crayons et actions de modification respectent les interdictions et workflows existants. Membre provisoire : son nom et son état restent identifiables sans imposer l'e-mail.
- Données indisponibles / suggérées / inconnues : libellés explicites, pas de capacité 0 ou d'absence inventée. Les données propres à la localisation peuvent être datées (à la date sélectionnée) et doivent l'indiquer.
- Contrôle d'accès à l'API et à la fiche selon politique serveur existante ; le nouveau champ Fonction est traité comme une donnée du membre avec mêmes droits.
- Modal visible dans le viewport, fond gris, contrôles au clavier, aria-label sur crayon unique, focus trap, restauration du focus, taille responsive et défilement **interne** pour longs formulaires ; pas de formulaire au bas de la page.
- Historique : ne pas créer d'événements à la consultation, ne pas mélanger auteurs/dates inconnus et valeurs devinées.
- Labels en **fichiers de traduction centralisés** FR/EN, thèmes clair/sombre et trois palettes conservés.

## 7. Ordre de développement proposé (sous responsabilité Amelia)

**Lot F1 — Structure sans doublons :** bandeau gauche/droite, suppression Profil/Localisation, quatre onglets consultation, résumé Affectation + versions visibles. Garder un jeu de données de démonstration distinct de la production.

**Lot F2 — Modale identité unifiée :** Fonction persistée, localisation datée, validations existantes, enregistrement groupé cohérent, sortie protégée ; mise à jour du bandeau et des cartes/liste.

**Lot F3 — Calendrier et Absences autonomes :** trame/exceptions consultables + historiques sur Calendrier ; liste/historique d'absences sur Absences ; modales ciblées.

**Lot F4 — Historique transversal et recette :** agrégation des sources réellement disponibles, droits, i18n, responsive, tests de non-régression et validation utilisateur sur captures comparables.

Les lots F2–F4 peuvent nécessiter de compléter Jira **après accord explicite** ; ne pas déclarer de modification Jira déjà accomplie. GitHub Actions indisponible dans le contexte du projet : Amelia doit distinguer les vérifications réellement faites sur poste local des tests non lancés.

## 8. Point de contrôle avant recette

Voir [FICHE-MEMBRE-V2-RECETTE.md](FICHE-MEMBRE-V2-RECETTE.md) pour la liste des critères d'acceptation et preuves à fournir. **Les anciens schémas à cinq onglets sont conservés pour l'historique documentaire et sont dorénavant OBSOLÈTES pour la fiche ; ne plus les reproduire.**

**Aucun code applicatif, migration, test navigateur ou changement Jira n'est réalisé par cette publication de Sally.**