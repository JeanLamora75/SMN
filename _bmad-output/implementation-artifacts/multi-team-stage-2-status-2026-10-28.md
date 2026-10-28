# SMN — Lot 2 : état de qualification de l'isolation multiéquipes

Date : 28 octobre 2026
Référence : GitHub main ; schéma PostgreSQL v30
Statut : **en cours — non validé pour activation**

## Résultats confirmés sur le PC utilisateur

- Diagnostic : installation `initialized`, schéma 30, 30 migrations terminées, 0 objet inconnu.
- TypeScript `pnpm exec tsc --noEmit` : succès confirmé avant le dernier lot.
- Tests statiques cycle historique : 10/10 confirmés.
- Tests de lecture isolée avec client PostgreSQL simulé : 5/5 confirmés.

Ces résultats ne prouvent pas l'isolation transactionnelle réelle.

## Parcours préparés en v30 dans le dernier lot

- Scrum : lecture et écriture des objectifs de Sprint, Story Points, scores (avec autorisation équipe et verrous pour les écritures).
- Kanban : renommage de période, métriques globales, flux, temps de cycle, objectifs, avec contrôle du rattachement d'équipe.
- Lectures Kanban : préférence d'équipe résolue côté serveur possible ; écritures : `teamId` explicite exigé.
- Fiche équipe : lecture et modification contextualisées (écritures verrouillées).
- Registre : création/évaluation/commentaires précédemment protégés.
- Script `scripts/audit-v30-live-readonly.ts` : vérification PostgreSQL réelle en lecture seule, `ROLLBACK`, sans génération de données.

## Critères restant à satisfaire avant activation

1. Faire passer le typage complet et les tests sur la branche `main` après l'intégralité du dernier lot.
2. Tester la recette PostgreSQL réelle sur deux équipes avec des fiches existantes ; noter explicitement les scénarios ignorés (`SKIP`).
3. Qualifier toutes les autres routes sensibles de l'audit v2, notamment capacité réelle, capacités de développement, cérémonies, périodes historiques, replanification et suppressions, reporting et brouillons.
4. Assurer le passage du contexte de l'équipe active depuis l'interface (tableau de bord, Sprint, Kanban, Calendrier, Registre et Rapports).
5. Exécuter des essais de création, modification, fermeture et suppression en base d'essai avec au moins deux équipes, puis des accès croisés interdits.
6. Tester la non-régression des installations historiques et des anciennes URL.
7. Vérifier une sauvegarde récupérable avant toute bascule locale.

## Décision de sécurité

Ne pas modifier `MULTI_TEAM_CONTEXT_READY=false` ni basculer
`SMN_MULTI_TEAM_WRITES_ENABLED` avant l'accomplissement des critères précédents.
Les correctifs de la branche `main` sont du code préparatoire, non une preuve de recette.

## Limitations

- L'audit v2 recense 155 routes et 45 alertes heuristiques à revoir ; certaines sont des faux positifs, certaines sont déjà sécurisées dans les services.
- Les tests des derniers commits ne sont pas encore exécutés sur l'installation Windows.
- Aucune validation transactionnelle Team A / Team B n'a encore été rapportée.

Prochaine décision : poursuivre la qualification par familles de mutations, sans demander d'intervention PC tant qu'un lot cohérent ne sera pas prêt.
