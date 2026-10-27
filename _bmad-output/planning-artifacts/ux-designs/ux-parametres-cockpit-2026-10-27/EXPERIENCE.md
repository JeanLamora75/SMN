# EXPERIENCE — Parcours Paramètres

Décisions UX validées le 27/10/2026 : UX-01 onglets horizontaux, UX-02 fériés+fermetures, UX-03 maintenance sauvegardes+historique, UX-04 Cockpit compact, UX-05 pas de recherche globale, UX-06 édition des listes en modales, UX-07 sauvegarde par formulaire, UX-08 cartes indisponibles grisées « À venir ». Scope strictement UX, aucune règle métier nouvelle. Références : SMN-223 à 227 ; SMN-228 ; SMN-229 ; SMN-282 ; SMN-298 ; docs/UX-REFERENTIEL-BMAD.md.

## Navigation
Depuis Paramètres, ouvrir une carte vers sa page. L’onglet sélectionné est visible, accessible clavier et directement atteignable depuis les anciennes URL/ancres via redirection ou traduction d’état. Bascule Cartes/Liste mémorisée, même contenu et mêmes droits. En Scrum/Kanban afficher le paramétrage adapté au mode effectif ; ne jamais offrir un changement non autorisé.

## Opérations
Modifier une ligne déclenche une modale commune SMN-298 : préremplissage, validation, Annuler/Enregistrer, focus restauré, comportement Escape compatible avec modifications en cours, double soumission bloquée. Dans une page multi-formulaires, chaque formulaire sauvegarde indépendamment ; changement d’onglet avec données modifiées avertit ou protège la saisie. Messages succès/erreur explicites, aucune perte silencieuse, permissions API inchangées.

## Accessibilité et traduction
Libellés FR/EN humanisés sans clés i18n ni identifiants techniques visibles ; navigation Tab/flèches pour les onglets, rôles ARIA, titres, focus et messages d’erreur. États gris non confondus avec les restrictions d’accès ; une fonction non autorisée n'est jamais rendue accessible par le portail.

## Non-régression
Pas de modifications API, schéma, règles de capacité, historique, permissions ou métiers. Ne pas créer les fonctions apparaissant uniquement dans les maquettes. Les pages opérationnelles Équipe, Sprint, Calendrier et Rapports demeurent distinctes des paramètres.
