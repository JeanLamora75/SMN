# DESIGN — SMN Liens et ressources — Cockpit Agile
Agent Sally | 27 octobre 2026 | Contrat UX validé D01-D09, UX-01-UX-07 | Epic Jira SMN-305

## Références
Brief BMAD John : `_bmad-output/planning-artifacts/product-briefs/module-liens-ressources-2026-10-27/BRIEF-BMAD-JOHN.md`.
Contrats opposables : `docs/UX-REFERENTIEL-BMAD.md`, Paramètres Cockpit du 27/10/2026, modales SMN-298 ; préservation de la sécurité multiéquipes SMN-282.

## Page Liens
- Sidebar : nouvelle entrée **Liens** entre Registre et Rapports, icône de lien, libellé FR/EN.
- Header Cockpit pleine largeur : titre Liens, équipe active, action **+ Ajouter un lien** si autorisé.
- Recherche visible suivie d'une **barre compacte** regroupant portée (Tous/Transverses/Équipe), catégorie et tri. Compteurs justes ; ne pas montrer les liens des équipes non autorisées.
- **Cartes par défaut** sur grille 3 colonnes desktop, adaptable 2 colonnes tablette/1 mobile. Bascule exclusive Carte/Liste en haut à droite, préférence mémorisée selon conventions existantes.
- Cartes homogènes, hauteur déterminée par contenu, icône, titre, description éventuellement tronquée de façon accessible, catégorie, portée lisible, bouton explicite **Ouvrir** (nouvel onglet) et icône crayon **Modifier** selon droits. **Menu d'actions sur chaque carte** avec les opérations autorisées, dont Supprimer.
- Vue Liste compacte, mêmes champs essentiels et même trio Ouvrir / Modifier / Menu, aucune action perdue.
- L'ouverture externe est distincte de la modification : pas de carte entièrement cliquable qui déclenche une action ambiguë ; protéger les liens externes avec `noopener/noreferrer`.
- Responsive, États : chargement, vide initial, aucun résultat aux filtres (action réinitialiser), erreurs serveur/droits, changement d'équipe. Pas de données fictives en production.

## Modale unique Ajouter/Modifier
Suivre la structure standardisée SMN-298 : header icône/titre/fermer, body, footer Annuler et Enregistrer ; labels visibles et indications d'obligation ; grille deux colonnes pour champs courts sur desktop, une colonne mobile.
Champs : Titre*, URL*, Description, Catégorie*, Visibilité*, Équipe conditionnelle. Pour nouveau lien spécifique, préremplir l'équipe du header ; la modification ne la change jamais implicitement. La visibilité transverse et les transferts sont accessibles aux seuls administrateurs dans le périmètre prévu par John.
Erreurs à proximité des champs, URL acceptée seulement en HTTP(S), feedback réseau, prévention double soumission, conservation de la saisie en cas d'erreur. Après succès, rafraîchir sans perdre recherche/filtres/contexte.

## Menu d'actions et confirmation
Le menu apparaît sur **chaque carte ou ligne**, navigable au clavier ; commandes désactivées ou non exposées suivant droits. Supprimer ouvre une **modale de confirmation** avec nom du lien, conséquence et action destructive clairement distinguée. Suppression directe après confirmation, jamais de suppression silencieuse.

## Paramètres
Respecter le Centre Paramètres Cockpit du 27 octobre 2026 : intégrer **Gestion des liens** à l'architecture réellement en place, sans réintroduire l'ancien portail obsolète.
Deux onglets recommandés : **Tous les liens** et **Catégories**. Première vue avec recherche, filtres par équipe/portée/catégorie et actions administrateur : éditer, convertir transverse/spécifique, transférer équipe, supprimer. Deuxième vue : créer/renommer/supprimer catégorie globale ; si utilisée, afficher un message bloquant précisant le besoin de réaffecter ses liens avant suppression.
Tout changement de portée ou d'équipe exige un choix explicite et confirmation adaptée ; ne jamais affecter silencieusement les snapshots des rapports publiés.

## Studio Rapports
Bloc **Liens et références** : deux zones (bibliothèque disponible avec recherche/filtre ; références sélectionnées). Sélection uniquement parmi les liens transverses et ceux de **l'équipe du rapport**, pas celle affichée dans le header.
Chaque référence sélectionnée montre titre, catégorie, aperçu URL, retirer et poignée de réordonnancement. **Glisser-déposer avec alternative clavier** (commandes Monter / Descendre accessibles et annoncées aux lecteurs d'écran) ; ordre sauvegardé.
En brouillon, une référence supprimée ou inaccessible apparaît comme **indisponible** avec explication et options remplacer / retirer, et bloque la publication tant que non résolue. Une référence publiée reste figée et peut être ouverte/exportée.

## Design system / accessibilité
Bootstrap/React-Bootstrap et tokens SMN existants (thèmes clair/sombre si supportés), aucune couleur hexadécimale en dur. FR/EN centralisé dans JSON, aucun code technique exposé. Navigation clavier complète, focus visible, menu ESC, aria labels, confirmations, responsive tactile ; tests contrastes et annonces de réordonnancement.
