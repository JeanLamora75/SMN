# SMN-67 — Prévisualisation d'un lot de Sprints

**Story** : https://lmn24.atlassian.net/browse/SMN-67  
**Dépendances** : PR #56 (cadence SMN-65), PR #57 (génération unitaire SMN-66). Branche de base : `feat/smn-66-single-sprint`.

## Réalisation
- API `POST /api/admin/sprints/preview` : calcul serveur, aucun INSERT de Sprint, aucun audit de création. Lecture protégée par autorisation Administrateur.
- Validation stricte du nombre entier de cycles (1–6) et de la date de départ.
- Réemploi des calculs de cadence et fuseau IANA de SMN-66.
- Vérification des chevauchements avec les Sprints persistés de la même équipe et à l'intérieur du lot ; renvoi des noms et bornes concernés.
- Formulaire sur la page de création : prévisualisation, recalcul global après modification, aucune modification individuelle des bornes, fermeture invalidant l'aperçu.
- Traductions JSON FR et EN.
- Le bouton de confirmation reste **désactivé** dans cette Story, y compris lorsque l'aperçu est valide : la confirmation transactionnelle et son audit appartiennent à SMN-68.

## Recette restant à exécuter
1. Saisir 0, 7, 1.5 ou une date invalide : aucun lot, erreur.
2. Prévisualiser 2–6 Sprints : vérifier noms, dates/heures locales et fuseau.
3. Ajouter un Sprint existant chevauchant : conflit explicite et confirmation bloquée.
4. Changer la date de départ : toutes les propositions recalculées sans déplacer les Sprints persistés.
5. Fermer l'aperçu ou changer un champ : résultat invalidé, aucune écriture.
6. Vérifier les changements d'heure, puis exécuter une compilation TypeScript et la recette PostgreSQL.

**État** : code publié sur branche dédiée, tests non exécutés. GitHub Actions indisponible. Aucune fusion sur `main`.
