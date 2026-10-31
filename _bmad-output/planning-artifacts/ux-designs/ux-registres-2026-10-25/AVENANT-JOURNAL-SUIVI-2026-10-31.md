# Avenant UX validé — Journal de suivi des fiches Registres — 31/10/2026

## Décision Sally / référence visuelle
La seconde maquette validée en conversation remplace le grand formulaire « Ajouter un élément » affiché en permanence. Conserver le bandeau Cockpit Agile de la fiche et les onglets; placer **+ Ajouter au journal** en bas à droite du bandeau bleu, visible uniquement si l'utilisateur dispose des droits d'écriture. Ne pas afficher un bloc de création sous les onglets.

## Parcours de création
Le bouton du bandeau ouvre une **modale Cockpit Agile centrée**, avec focus initial, fermeture Échap, restitution du focus et avertissement sur brouillon non sauvegardé. Proposer Commentaire / Action / Décision / Fait marquant : Commentaire utilise l'API existante de commentaires historisés (texte 1–4000 caractères, confirmation serveur); Action / Décision / Fait marquant réutilisent le flux existant de création de fiche liée et ses contrôles transactionnels (SMN-249). Aucun événement fictif, aucune duplication de la source. En cas d'échec conserver la saisie. Ne pas ajouter de nouveaux champs métier sans API fiable.

## Barre de filtres
Directement sous les onglets, une seule barre blanche compacte : recherche textuelle dans les éléments disponibles, boutons Tout / Commentaires / Actions / Décisions / Faits marquants avec compteurs basés sur les données réellement chargées, tri Plus récents / Plus anciens, et option Afficher les éléments clôturés seulement si l'état de clôture est disponible de manière fiable (sinon masquer cette option). Les filtres se combinent; l'état vide est explicite et réinitialisable. Aucune valeur simulée.

## Chronologie
Sous la barre de filtres, liste chronologique en pleine largeur : date/heure réelles, pastille de type et icône, titre ou extrait, contenu et auteur connu (ou « inconnu »). Actions autorisées seulement : modifier/retirer et consulter les versions de commentaires via endpoints existants, ouvrir les fiches liées via routes contrôlées. Ne pas afficher Dupliquer, Lier ou Modifier pour des fiches liées si l'opération n'existe pas vraiment. Les retraits logiques restent traçables, comme l'historique des corrections; ne pas confondre journal métier et audit technique.

## Contraintes
Conserver l'isolement installation/équipe, RBAC, historique Vn, FR/EN via JSON, thème clair/sombre, clavier, accessibilité et responsive 320–1880px. Aucun DDL ni changement de modèle de données pour une refonte de présentation. CSS dédié et modifications limitées à l'onglet Journal et au bouton d'en-tête. Le journal sur la Synthèse, s'il existe, reste cohérent avec ces mêmes données.

## Consignes à Amelia
1. Lire SMN-248/249/247 et les composants de registre en place avant toute mutation.
2. Préserver strictement GET/POST/PATCH/DELETE, versions, protections des brouillons et modale de création liée.
3. Déplacer le point d'entrée d'ajout dans le bandeau; retirer le formulaire inline de l'onglet; employer une modale pour le commentaire.
4. Construire barre de filtre et chronologie avec les données réelles, sans ajouter de fonctionnalités « décoratives ».
5. Vérifier typecheck, tests ciblés, i18n, lint et responsive lorsque l'environnement le permet; indiquer clairement les validations non exécutées. Publication explicitement autorisée directement sur main.
