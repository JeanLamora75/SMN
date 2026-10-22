# SMN — Refonte UX Équipe / Membre (Epic 3)

Date : 2026-10-22
Publication : directement sur `main`, sans Pull Request.
Périmètre UX prioritaire : SMN-42 à SMN-47, SMN-63.

## Décisions reprises des échanges Sally
- Accès à la page Équipe depuis le menu de pilotage.
- Bascule exclusive Cartes / Liste, dernier choix mémorisé localement.
- Cartes arrondies, 6 colonnes sur grand écran, deux rangées minimales, emplacements gris en pointillés.
- Nom, pictogramme neutre commun, badges SM / PO / Dev actifs ou grisés ; fonction professionnelle sous les badges.
- Carte + après les membres actifs ; fenêtre de création individuelle.
- Carte ou ligne sélectionnée ouvre la fiche Membre ; icônes de modification adjacentes aux informations.

## Réalisation
- `src/app/app/admin/members/page.tsx` devient l'accueil de l'équipe.
- `team-overview.tsx` affiche les membres via `GET /api/admin/members`, propose les modes Cartes/Liste, et crée un membre individuel via `POST /api/admin/members`.
- Nouvelle route `/app/admin/members/[id]` : fiche membre et accès aux éditeurs existants (profil, rôles, calendrier, localisation, cycle de vie).
- L'ancienne administration par lots reste accessible à `/app/admin/members/manage` pour l'initialisation.
- La création individuelle est distincte du POST initial par lots : `{teamId,displayName,requestId}`. Le serveur valide les entrées et autorisations ; transaction avec verrou consultatif ; identifiant de requête UUID repris pour prévenir les doublons ; rôle initial Développeur ; maximum 50 membres.
- Les libellés spécifiques sont centralisés en français et anglais.

## Réserves / dettes
1. Le modèle `smn_member` ne contient pas encore de colonne `professional_function`. L'interface affiche explicitement « Fonction non renseignée » ; une migration versionnée, les écrans d'édition et les contrats d'API devront être définis pour rendre cette information persistante.
2. La contrainte historique `smn_member.batch_id NOT NULL` impose actuellement le rattachement des membres individuels au premier lot de l'équipe. `requested_count` reste la taille initiale du lot ; le rejeu initial est filtré par `member_number`. **Dette de modèle** : ajouter à terme une provenance dédiée par membre / création et une migration compatible avec le diagnostic strict ; ne pas détourner silencieusement les quantités historiques.
3. La présentation au-delà de 12 membres étend la grille par rangées de six ; cette extrapolation doit être validée avec Sally.
4. Les actions sont restreintes au rôle disposant de l'autorisation `members` existante ; vérifier séparément l'expérience des rôles lecture seule.
5. Les icônes et zones de création nécessitent une vérification navigateur clavier/lecteur d'écran/responsive.
6. Aucun build TypeScript, test automatisé, validation PostgreSQL ou test navigateur exécuté dans cet environnement. GitHub Actions reste indisponible.

## Recette Windows
Après Pull de `main` et démarrage `pnpm dev` :
1. Ouvrir le menu « Équipe » : carte 6 colonnes grand écran, au moins deux rangées, badge actif/grisé, emplacements pointillés.
2. Basculer Cartes/Liste ; recharger la page et vérifier la mémorisation.
3. Sélectionner une carte ou ligne : vérifier la navigation vers la fiche Membre.
4. Modifier le nom et l'email ; changer l'affectation et les rôles ; gérer calendrier, localisation et cycle de vie.
5. Cliquer sur + ; créer un nouveau membre ; vérifier son apparition, son rôle Dev, puis modifier ses informations.
6. Tester saisies invalides, 50 membres, requête répétée et cas de refus d'autorisation.
7. Tester mobile et 200 % de zoom.
8. Si aucune fiche n'existe, initialiser la liste depuis le lien vers la création par lot.

La livraison est à **recetter**, et non déclarée validée fonctionnellement.


## Correctif de conformité aux décisions Sally — 22/10 (seconde passe)
L'implémentation initiale ne respectait pas le contrat visuel. Correctifs publiés directement sur main :
- `.smn-page` plafonnait toutes les pages à 870 px. Surcharge dédiée `.smn-team-page,.smn-member-page` pour affichage pleine largeur.
- Grille Équipe aérée six colonnes grand écran, cartes de hauteur minimale 222 px et emplacements vides en pointillés.
- Badges SM/PO/Dev **bleus si actifs / gris sinon**, maintenus sur une ligne. Avatar MVP neutre et absence de photographie nominative.
- Carte d'ajout explicitement intitulée « Ajouter un membre ».
- Fiche Membre : bandeau identité complet et onglets Profil / Affectation / Calendrier / Localisation / Historique ; profil en deux colonnes et crayons à proximité des valeurs.
- Onglets Calendrier et Localisation montrent les éditeurs existants directement au lieu de masquer leurs données dans des cartes descriptives.
- L'archivage et la réactivation restent gérés via l'éditeur de cycle de vie existant ; les confirmations d'origine sont conservées.

**Limites restant à traiter :** la fonction professionnelle n'est toujours pas enregistrée en base ; l'onglet Historique ne constitue pas encore un historique agrégé ; les champs du calendrier et de la localisation réutilisent les écrans d'administration existants. Une validation visuelle en navigateur face aux maquettes approuvées et une compilation TypeScript restent indispensables. Pas de validation fonctionnelle affirmée.
