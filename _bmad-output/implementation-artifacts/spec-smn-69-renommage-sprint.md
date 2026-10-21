# SMN-69 — Renommer un Sprint sans modifier l'historique

Jira : https://lmn24.atlassian.net/browse/SMN-69

## Réalisation
- Le nom suggéré lors de la création unitaire et par lot devient « Sprint du JJ/MM/AAAA au JJ/MM/AAAA ».
- Le formulaire unitaire conserve le nom personnalisé lors d'un recalcul des bornes (comportement déjà présent).
- `GET /api/admin/sprints/names` liste les Sprints réels, y compris clôturés, avec identifiant et dates.
- `PATCH /api/admin/sprints/[id]` valide le nouveau nom (trim, non vide, 160 caractères max), avec contrôle Administrateur côté serveur.
- Enregistrement transactionnel du champ `name` uniquement, avec audit `renamed` comprenant ancien nom, nouveau nom et statut courant. Dates, identifiant, statut et autres données restent intacts.
- Recherche de nom identique au sein de la même équipe, sans contrainte d'unicité ni refus de sauvegarde. Alerte affichée dans l'interface.
- Traductions centralisées FR et EN.

## Vérification fonctionnelle à effectuer
1. Générer un Sprint : contrôler le format du nom par défaut.
2. Personnaliser le nom, changer le début puis recalculer : conserver le nom saisi.
3. Tenter un nom vide ou composé d'espaces : refus, aucun audit.
4. Renommer avec un nom déjà présent : alerte non bloquante, deux Sprints distincts.
5. Renommer un Sprint clôturé : statut inchangé, aucune modification des dates ni des contenus historiques, audit `renamed` enregistré.
6. Contrôler les refus 403 pour un rôle non administrateur, et 404 pour un Sprint inexistant.
7. Compiler TypeScript, effectuer lint et recette sur PostgreSQL local avant fusion.

## État
Branche développée en continuité de SMN-68 (PR #59), sans exécution de tests. GitHub Actions indisponible. Aucun merge sur `main`.
