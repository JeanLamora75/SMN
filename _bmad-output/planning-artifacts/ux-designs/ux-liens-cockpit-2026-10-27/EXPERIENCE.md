# EXPERIENCE — SMN Liens et ressources
Sally UX BMAD v6.12.4 | 27 octobre 2026 | SMN-305 | Décisions D01-D09 et UX-01-UX-07 validées

## Parcours 1 — Consulter et ouvrir
Le contexte est l'équipe sélectionnée dans le header. Ouverture du menu Liens : récupération des ressources transverses + de cette équipe autorisées. Cartes par défaut trois colonnes desktop ; liste alternative ; recherche/portée/catégorie/tri depuis une barre compacte. Bouton **Ouvrir** dans un nouvel onglet ; ne jamais confondre le clic et la modification. Changement d'équipe : rafraîchissement du jeu de données et des compteurs, aucun lien de l'équipe précédente affiché ensuite.

## Parcours 2 — Ajouter / Modifier
Utilisateur autorisé clique Ajouter ou crayon : modale unique, équipe active préremplie pour spécifique, champs Titre/URL/Catégorie obligatoires et Description facultative. Un utilisateur non admin n'a pas accès à la portée transverse ni aux transferts non autorisés. Le serveur valide l'autorisation, la portée et HTTP(S). Si validation incorrecte, les champs et leur texte restent renseignés, focus et message explicites. Enregistrement réussi : fermeture et actualisation de la vue appelante sans perdre les filtres.
Les menus d'actions sont présents sur chaque carte **et** chaque ligne ; ils incluent la suppression si autorisée. Supprimer requiert une confirmation claire. Suppression directe : la ressource disparaît du catalogue ; les copies des rapports publiés ne sont pas effacées.

## Parcours 3 — Administration Paramètres
Administrateur ouvre Gestion des liens depuis le Centre Paramètres : onglet Tous les liens (toutes équipes, filtres, recherche), onglet Catégories (catalogue global). Modification de portée spécifique→transverse, inverse avec équipe obligatoire, et transfert spécifique équipe A→B explicites ; confirmation et feedback puis visibilité recalculée selon droits. Actions journalisées selon audit existant.
Catégorie utilisée : la suppression est refusée avec indication de sa réaffectation préalable ; aucune catégorie orpheline. L'utilisateur non administrateur n'accède pas aux actions réservées.

## Parcours 4 — Insérer dans Studio Rapports
La liste des liens disponibles est déterminée par **l'équipe du rapport**. Recherche et sélection multiple ; sélection visible dans panneau distinct ; retrait et réordonnancement par glisser-déposer **ou boutons clavier** Monter/Descendre. Persister l'ordre. Une référence devenue indisponible en brouillon est marquée, conserve un état explicatif et **bloque publication** jusqu'à retrait ou remplacement ; ne jamais la masquer silencieusement.
À la publication, figer titre, URL, description/catégorie affichées, identifiant logique, ordre et horodatage. Les rapports publiés et leurs exports ne changent pas après modification, suppression ou transfert du lien source. PDF : liens actifs ; Markdown : liens correctement sérialisés.

## Cas d'erreur et contraintes
- Aucun lien : proposition Ajouter si autorisé ; aucun résultat aux filtres : Réinitialiser.
- URL invalide, duplication autorisée entre équipes, erreur serveur, collision d'édition : messages exploitables et saisie conservée.
- Changement d'équipe, permission révoquée, transfert, accès API falsifié : contrôles serveur ; ne jamais exposer des liens d'une autre équipe.
- Catégorie utilisée ne peut être supprimée ; confirmation destructive pour lien ; aucune donnée de rapport publié modifiée.
- Modales SMN-298 : focus initial, tabulation contrainte, fermeture ESC raisonnable, retour au déclencheur, boutons anti-double clic.
- Tous thèmes, FR/EN, lecteurs d'écran, responsive 3/2/1 cartes, navigation clavier et ordre de référence accessible.

## Matrice de recette essentielle
1. Admin équipe A voit A + transverses, bascule B voit B + transverses.
2. User habilité voit et modifie ses spécifiques, jamais les transverses ; accès API aux autres équipes refusé.
3. Nouvelle création : équipe du header correctement proposée ; édition ne transfère pas un lien.
4. Barre filtres, recherche, bascule Carte/Liste ; les actions Ouvrir, crayon et menu restent cohérentes.
5. Suppression directe confirmée ; catégorie utilisée non supprimable.
6. Administration transverse/spécifique et transferts avec feedback, trace et règles d'autorisation.
7. Studio : uniquement liens équipe du rapport + transverses ; réordonnancement souris ET clavier, persistance et export PDF/MD.
8. Brouillon avec référence invalide bloqué ; rapport publié demeure identique après mutation de la source.
9. Navigation mobile, FR/EN, thèmes, contraste, focus et erreurs validés.
10. Vérifications lint, typecheck, tests, build **à effectuer en phase de développement**, recette finale sur PC de l'utilisateur.

## Réserves techniques
Contrôler les capacités réellement livrées par SMN-282 (habilitation), SMN-298 (modales), Paramètres Cockpit et Studio Rapports. Ne pas introduire de nouvelles règles métier non approuvées ni déclarer de test non exécuté.
