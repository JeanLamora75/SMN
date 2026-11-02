# SMN-374 — Plan de basculement du Dashboard historique

## Statut
**Préparation publiée, activation interdite avant validation fonctionnelle et technique.**

Le remplacement demandé par A-DB-15 n'est pas autorisé tant que les adaptateurs métiers et la recette ne sont pas conformes. L'ancien Dashboard reste la vue canonique par défaut. Les deux routes ne sont pas considérées simultanément comme une production nouvelle.

## Préconditions obligatoires
1. Vérifier installation native v33 et les droits de lecture/édition équipe, y compris utilisateurs non administrateurs.
2. Raccorder et valider les sources d'indicateurs v33, instantanés des cycles clôturés, capacité, registres, objectifs, événements et liens, avec zéro référence aux tables métriques retirées.
3. Exécuter les tests du Dashboard Builder SMN-353 à SMN-374 et les tests d'intégration PostgreSQL; vérifier Scrum, Kanban, multiéquipes, permissions et cycles anciens.
4. Vérifier que les sauvegardes générales SMN sont disponibles; réaliser la recette locale Windows et obtenir l'accord explicite de lancement.

## Activation
Configurer `SMN_DASHBOARD_BUILDER_CUTOVER=enabled` dans la configuration d'exécution locale approuvée, puis redémarrer le serveur. Toutes les navigations vers `/app` redirigent alors vers `/app/dashboard-builder`, en préservant les paramètres `teamId` et `cycleId`. Aucun changement n'est apporté aux données métier ou aux dispositions enregistrées par cette redirection.

## Retour arrière
Retirer la variable ou choisir une autre valeur, puis redémarrer le serveur. `/app` restitue immédiatement la vue historique. Aucune migration destructive ni réécriture de données n'est nécessaire. Ne pas supprimer les tables historiques avant certification du nouveau Dashboard.

## Limites et travaux bloquants observés le 2 novembre 2026
- Les adaptateurs calendriers, objectifs, liens et autres sources historiques restent incomplets (catalogue « adapter-not-connected »).
- Le Dashboard Builder ne garantit pas encore les projections métier, historiques et capacités de l'ancien écran.
- Les tests de bout en bout, d'accessibilité, PostgreSQL et recette Windows ne sont pas exécutés dans cet environnement.
- Il n'est donc **pas conforme** de basculer actuellement la valeur du paramètre à « enabled ».

## Commandes de vérification (à exécuter localement)
```powershell
pnpm typecheck
pnpm lint
pnpm test:smn-374
pnpm test:smn-351
```
Conserver les traces de tests et l'approbation de lancement dans Jira SMN-374 avant activation.
