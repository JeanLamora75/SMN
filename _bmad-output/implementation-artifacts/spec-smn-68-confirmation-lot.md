# SMN-68 — Confirmer un lot valide avec écriture atomique et audit

Référence : https://lmn24.atlassian.net/browse/SMN-68

## Fonctionnement

1. SMN-67 calcule et contrôle un lot de 2 à 6 Sprints. Pour un lot valide, l'API enregistre un jeton de prévisualisation lié à l'acteur et à l'équipe, valable 10 minutes, avec empreinte des Sprints.
2. La confirmation POST /api/admin/sprints/batch reçoit exclusivement ce jeton.
3. La transaction verrouille la ligne d'aperçu puis verrouille l'équipe, recalcule la cadence et les chevauchements, compare l'empreinte, crée tous les Sprints et leurs audits individuels, enregistre un audit global et marque le jeton consommé.
4. Tout échec déclenche ROLLBACK. Un aperçu périmé, consommé, appartenant à un autre acteur ou devenu incohérent est rejeté.
5. GET /api/admin/sprints/batch récupère les 50 derniers lots avec auteur, heure, équipe, paramètres de cadence, identifiants, noms et bornes.
6. L'interface offre un bouton de confirmation uniquement après un aperçu valide, un retour de succès et l'historique des lots.

## Sécurité et invariants

- Les écritures sont limitées au rôle Administrateur par autorisation serveur.
- Une prévisualisation ne crée jamais de Sprint.
- L'intégrité des chevauchements est revérifiée **à la confirmation**, avec verrou transactionnel par équipe.
- Des bornes contiguës sans intervalle commun sont valides (`start < other.end && end > other.start`).
- Les fuseaux IANA sont calculés à partir des heures locales, avec leurs transitions été/hiver, par le service SMN-66.
- L'aperçu devient inactif lorsque l'utilisateur ferme la boîte ou change les entrées. Une nouvelle demande crée un jeton différent.

## Recette non exécutée

- Créer 2 à 6 Sprints sur un lot valide et inspecter les audits.
- Vérifier qu'un jeton est à usage unique et lié à son auteur.
- Créer entre prévisualisation et confirmation un Sprint en conflit : tout le lot doit être refusé.
- Injecter une panne en cours d'écriture : aucun Sprint/audit partiel.
- Refaire les scénarios sur un passage à l'heure d'été/hiver.
- Exécuter compilation TypeScript, migration PostgreSQL, lint et recette fonctionnelle sur environnement capable de lancer le projet.

GitHub Actions indisponible. Cette branche n'est pas fusionnée sur `main` avant validation.
