# Consolidation 03 — Sauvegarde, export et archivage

## Modifications
- Contexte client partagé entre le Studio et les actions PDF : indicateur `dirty`, requête `busy`, révision serveur acquittée.
- Toute modification rédactionnelle, annulation ou rétablissement désactive export et archivage jusqu'à confirmation de la sauvegarde.
- La requête PDF transmet la révision attendue ; l'API bloque avec HTTP 409 si le serveur contient une révision différente.
- Traductions FR/EN. Le stockage PDF immuable existant reste inchangé.

## Limites
- Le contrôle de révision intervient au début de la génération. Une modification acceptée après la lecture de la version mais durant le rendu doit encore être traitée par un mécanisme de snapshot/transaction ou révalidation de fin.
- Une mise à jour externe après affichage est rejetée en HTTP 409, sans gestion UX de rechargement dédiée.
- PDF non encore garanti fidèle à l'aperçu (graphiques, tableaux, images, pagination).
- Pas de typecheck, build, test serveur ou navigateur réel exécuté ; tests de concurrence nécessaires.
- La comparaison et l'actualisation des données doivent également être coordonnées côté interface avec les edits en cours.

## Statut
PR brouillon, aucune fusion main ni clôture Jira.
