# SMN — Avenant fonctionnel à SMN-IND-SPEC-001
Statut : avenant documentaire de conception ; conserve l'historique du document initial.

## Extension IND-16 — Formules mathématiques
Remplacer dans une future révision consolidée l'interdiction des fonctions avancées par : formules à tags, nombres décimaux, + - * /, unaires, parenthèses, multiplication implicite, pourcentage postfixé, puissances et fonctions autorisées MIN/MAX/ROUND. Aucun accès à des fonctions arbitraires, code JS, eval, objets, boucles, réseau ou SQL. Les erreurs de validation syntaxique sont refusées avant publication.
- Priorités : parenthèses et fonctions, %, puissance (associative à droite), unaires, multiplication/division, addition/soustraction ; `-2^2=-4`, `2^-2=0.25`.
- `ROUND(x,n)` utilise HALF_UP explicite ; pas d'arrondi intermédiaire à deux décimales.
- Exposant fractionnaire admis seulement sur base positive ; `0^0` non défini ; 0 puissance négative = division par zéro.
- Un résultat non défini affiche « — » et un motif explicatif ; une erreur technique annule la transaction.

## Précisions complémentaires
1. Catalogue global initialement vide, tags uniques et immuables, type manuel/calculé verrouillé pour toujours dès le premier usage.
2. Une valeur courante par indicateur et cycle Scrum/Kanban ; `NULL` distinct de `0`. Modifications possibles après clôture.
3. Sélection/activation commune à l'équipe et indépendante de la visibilité/ordre par écran. Les dépendances implicites peuvent être utilisées sans affichage.
4. Archivage par `archived_at` : préserve les usages sélectionnés, mais interdit nouvelle sélection et réactivation locale tant qu'archivé.
5. Source manquante, division par zéro, domaine invalide ou dépendance indisponible : « — » explicatif. Une dépendance indisponible renseigne son tag source ; causes multiples départagées de manière déterministe.
6. Aperçu groupé sans écriture avant confirmation ; sauvegarde atomique, conflit de révision explicite.
7. Changement global de formule : simulation préalable, confirmation identique au contenu simulé, refus si révision obsolète, recalcul de tous les cycles concernés quelle que soit leur situation.
8. Calendrier/capacité existants préservés ; recalcul synchrone dans la transaction du changement métier. Snapshots historiques indépendants protégés.
9. Rapports ajustables ponctuellement ; tendances sur tous statuts sans interpolation d'une valeur absente.
10. Retrait ciblé des anciens indicateurs et de leurs valeurs sans migration, sous contrôle d'inventaire préalable ; aucune suppression des données métier liées aux capacités/calendriers.
11. Précision décimale interne contrôlée et limites techniques cumulées plutôt que limite arbitraire de profondeur de dépendances.

## Nouveaux critères d'acceptation proposés
- Formellement valider la grammaire étendue, les priorités, les erreurs de domaine et les conventions d'arrondi.
- Interdire publication de simulation globale obsolète ; re-simuler avant une nouvelle confirmation.
- Vérifier propagation explicative des indisponibilités dans une chaîne de calcul.
- Vérifier NULL/0, fermeture/réouverture, toutes équipes et tous états.
- Vérifier atomicité transactionnelle sur modification de calendrier et incident de recalcul.
- Vérifier non-régression sur capacités, snapshots et exports indépendants des indicateurs.

## Traçabilité
Document d'origine : `SMN-IND-SPEC-001.md`. Les divergences, particulièrement IND-16, sont volontairement exposées au lieu d'effacer l'historique. Aucune adaptation Jira ni développement n'est réalisée par cet avenant.
