# DESIGN — Paramètres Cockpit Agile compact

Décisions UX validées le 27/10/2026 : UX-01 onglets horizontaux, UX-02 fériés+fermetures, UX-03 maintenance sauvegardes+historique, UX-04 Cockpit compact, UX-05 pas de recherche globale, UX-06 édition des listes en modales, UX-07 sauvegarde par formulaire, UX-08 cartes indisponibles grisées « À venir ». Scope strictement UX, aucune règle métier nouvelle. Références : SMN-223 à 227 ; SMN-228 ; SMN-229 ; SMN-282 ; SMN-298 ; docs/UX-REFERENTIEL-BMAD.md.

## Portail
Une entrée Paramètres dans sidebar. Portail pleine largeur, groupes Application (1), Organisation Agile (5), Calendriers et disponibilités (3), Administration (3). Douze cartes sur grille Bootstrap responsive : 4/2/1 colonnes desktop/tablette/mobile ; bascule Cartes/Liste conservée et mémorisée. Carte : icône, titre français/anglais localisé, description courte, statut discret. Aucune recherche globale. « À venir » grisé sans clic ; « À compléter » si une fonction partielle demeure utilisable. Ne jamais exposer une action sans droits.

## Pages
Fil d’Ariane / en-tête avec icône+titre+description / onglets horizontaux / panneaux compacts / pied d’action propre à chaque formulaire. Grille de champs deux colonnes si cohérent, une sur mobile. Tableaux compacts avec actions en fin de ligne. Modales d’édition conformes au contrat SMN-298. États vide/erreur/chargement/lecture seule réels. Pas de hauteurs artificielles ; défilement accessible à 200 % de zoom.

## Design system
Classes et composants Bootstrap/React-Bootstrap existants, surface, accent, bordure et typographie via tokens SMN ; thèmes clair/sombre et palettes ocean/forest/violet ; pas de couleurs codées en dur ni de nouvelle bibliothèque. FR/EN centralisés, libellés métier sans codes techniques, focus et contraste perceptibles. Conservation des conventions UX approuvées hors Paramètres.
