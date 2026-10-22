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


## Sally — Correction des interactions (dernier échange)
- Onglet Profil sélectionné à l'ouverture, page Membre sans plafond de largeur.
- Onglet Historique : consultation déclenchée au clic sur l'onglet, affichage des affectations et de l'état archivé depuis l'API existante `/api/admin/members/[id]/lifecycle`, message « Aucun élément à ce jour » lorsque aucune donnée pertinente n'est disponible ; aucun crayon préalable requis.
- Crayons Profil, Affectation, Calendrier, Localisation, Cycle de vie : éditeurs rendus dans une fenêtre modale centrée (fond obscurci, zone scrollable, fermeture Escape, gestion partielle du focus) au lieu d'un formulaire inséré au bas de la page.
- La fermeture par la croix demande confirmation pour éviter la perte de saisie. Les formulaires gardent leurs propres contrôles et confirmations.
- **Limites** : l'historique ne consolide pas encore tous les événements du membre (notamment modifications de profil, calendrier, localisation) ; les vues Calendrier et Localisation proposent leur description en lecture, et non encore un résumé complet de leur contenu. Contrôle TypeScript et recette navigateur non exécutés, à confirmer sur Windows.


## Dernières spécifications Sally — identité unifiée, quatre onglets (22 octobre)
Source : dernières décisions UX de Sally communiquées par l'utilisateur.
Contrat : un seul crayon près du nom pour Nom, e-mail, Fonction professionnelle, Pays, Région, Ville et fuseau IANA ; rôles Agile éditables uniquement depuis Affectation ; bandeau horizontal avatar/nom/fonction/rôles à gauche et e-mail/localisation à droite ; onglets strictement Affectation, Calendrier, Absences, Historique ; Historique en lecture sans action crayon.

Livré sur main :
- Entête et navigation quatre onglets ; suppression de l'onglet Profil et Localisation.
- Fenêtre unique d'édition d'identité avec nom, e-mail, champs de localisation. Les deux anciennes API sont invoquées successivement : **non atomique**, un échec du second enregistrement peut laisser le premier appliqué. Un message l'indique ; recharge préalable requise avant un nouvel essai.
- Création individuelle après initialisation déjà présente et conservée.
- Onglet Absences relié à l'éditeur existant, historique d'affectations conservé en lecture directe.
Non livré (bloquant pour conformité complète) :
- Fonction professionnelle persistante : schéma v26 sans colonne ni migration, saisie désactivée et indiquée comme indisponible. Implémentation correcte requiert migration versionnée v27, intégration à la validation stricte de schéma et cohérence Prisma, contrats API, historique, puis recette.
- Transaction unique et endpoint atomique pour profil et localisation ; sauvegarde actuelle en deux appels.
- Historique consolidé de tous changements (profil, fonction, calendrier, absences, localisation) et affichage riche en lecture seule des onglets.
- Aucun test TypeScript, navigateur ou migration PostgreSQL exécuté dans cette session. Ne pas considérer la refonte comme finalisée.


## Fin de réalisation : Fonction métier, sauvegarde atomique et v27 (22/10 au soir)
- Fonction professionnelle nullable (max. 120 caractères) : `smn_member.professional_function`, présentée dans la liste Équipe et le bandeau Membre.
- Formulaire commun (un seul crayon du bandeau) : nom, e-mail, fonction, pays, région, ville, fuseau horaire ; `PUT /api/admin/members/[id]/identity` assure une transaction PostgreSQL unique, un verrou sur la fiche, des révisions vérifiées, et un rollback complet en cas d'échec.
- Migration **v27 additive** avec historique d'identité `smn_member_identity_history`. Les changements de profil et localisation sont audités dans la même transaction.
- Le diagnostic strict (`diagnostic.ts`, `probe.ts`, `contract.ts`) reconnaît v27, 27 entrées de migration et la nouvelle table. Modèle Prisma synchronisé.
- Script de migration : `pnpm exec tsx scripts/migrate-member-identity-v27.ts` pour prévalidation **sans écriture**, puis `pnpm exec tsx scripts/migrate-member-identity-v27.ts --apply` après sauvegarde du PostgreSQL SMN et arrêt du serveur. Ne jamais recréer/vider la base.
- Onglet Calendrier : lecture du rythme hebdomadaire et exceptions avec édition via modale.
- Onglet Historique : regroupement chronologique des sources de données existantes (identité, affectations, calendrier, absences, localisations). Les historiques des révisions d'absences antérieures ne sont pas encore reproduits intégralement.
- Un test unitaire `tests/member-identity.test.ts` couvre les entrées, la transaction et le rollback.

### Important
Code publié sur `main`, **migration non exécutée** ; pas de compilation ni de test navigateur dans l'environnement d'assistance. Après synchronisation Git, exécuter `pnpm typecheck` et les tests, puis la migration contrôlée avec une sauvegarde préalable. Le fonctionnement n'est pas encore certifié par recette.


### Dernière vérification de l'historique et séquence de recette
- L'API d'historique expose désormais également les **révisions d'absences**, les **événements de cycle de vie**, et les **versions d'affectation**. Les informations d'identité créées avant la mise en place de l'audit v27 ne sont pas reconstituées artificiellement.
- Les clés de traduction FR/EN ajoutées ont été comparées statiquement ; les principaux raccordements (v27, diagnostic, interface et endpoint) ont été inspectés, mais aucune compilation n'a été exécutée.
- Après sauvegarde existante de SMN et arrêt du serveur :
  1. Synchroniser `main`.
  2. Exécuter `pnpm typecheck` et `pnpm exec tsx --test tests/member-identity.test.ts`.
  3. Prévalider avec `pnpm exec tsx scripts/migrate-member-identity-v27.ts` (lecture seule).
  4. En présence de `Diagnostic: initialized` et `version 26`, appliquer `pnpm exec tsx scripts/migrate-member-identity-v27.ts --apply`.
  5. Vérifier `pnpm exec tsx scripts/diagnose-schema.ts` → initialized, version 27, 0 objet inconnu.
  6. Lancer `pnpm dev` et recetter Équipe, fonction professionnelle, transaction unique, quatre onglets, calendrier, absences et historique.
- Si une étape échoue, **ne pas** réinitialiser ou supprimer la base. Partager le diagnostic et préserver la sauvegarde.

**Aucun test effectif ni migration réelle n'a été réalisé depuis ChatGPT.**
