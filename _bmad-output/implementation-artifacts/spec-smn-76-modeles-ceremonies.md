# SMN-76 — Modèles personnalisés de cérémonies

Jira : https://lmn24.atlassian.net/browse/SMN-76

## Composants
- Paramétrage Administrateur FR/EN : nom, fréquence quotidienne, hebdomadaire avec jour ISO, ou une fois par Sprint avec position début/fin, heure locale et durée.
- Vérification de la règle de positionnement côté serveur et dans les contraintes SQL.
- Modèles persistés avec révision optimiste et historique de modifications ; activation/désactivation.
- Génération d'occurrences des modèles actifs lors de la **création d'un nouveau Sprint**, dans la transaction initiale.
- Chaque occurrence contient le lien vers l'identifiant et la révision du modèle initial ; aucune régénération des occurrences passées ou futures préexistantes lors des modifications du modèle.
- Aucune option de déduction de capacité Développeur.

## Réserves / recette
- Les occurrences personnalisées sont stockées dans `smn_scrum_template_occurrence` mais ne sont pas encore intégrées au calendrier central ni à son moteur de conflit ; cette intégration doit être vérifiée avant réception fonctionnelle.
- Les occurrences quotidiennes sont proposées les jours du lundi au vendredi ; l'intégration complète des jours collectifs, congés et fermetures reste à raccorder.
- L'UI ne dispose pas encore d'un écran dédié pour consulter individuellement les occurrences personnalisées.
- Vérifier les transitions DST IANA, l'absence de modifications des Sprints existants après versionnement/désactivation, les droits 403, le contrôle optimistic lock 409, les trois fréquences et l'absence de déduction de capacité.
- Compilation TypeScript, validation Prisma, migration PostgreSQL et tests locaux non exécutés ; GitHub Actions indisponible.

État : branche de développement, non testée, PR à conserver en brouillon jusqu'à recette.
