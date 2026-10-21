# SMN — Scrum Master Notebook

Application destinée aux Scrum Masters, développée selon BMAD 6.12.4. MVP Scrum et Kanban, usage local initial sur Windows 11, avec Next.js 16/React 19, TypeScript, Bootstrap 5.3, PostgreSQL et Prisma 7.

**Pour installer SMN sans configurer PostgreSQL :** [Guide pilote en quelques clics](docs/INSTALLATION-SIMPLE.md). Le paquet autonome Windows est en cours de qualification ; utiliser seulement un artifact du workflow Windows réussi.

## État du pilote — 20 octobre 2026

**SMN-11 est livré sur `main`.** SMN démarre sur `127.0.0.1:3003` ; les ports 3000 à 3002 restent réservés à l'autre projet.

**SMN-12 est désormais aussi intégré à `main`** via la [PR nº 11](https://github.com/JeanLamora75/SMN/pull/11). L'assistant Express peut créer, après confirmation explicite, sa base PostgreSQL locale dédiée, appliquer la migration initiale et enregistrer le produit, l'équipe et le compte Administrateur. **La recette sur le PC utilisateur reste à effectuer.** Le tableau de bord et les connexions restent bloqués avant SMN-14.

**Mode de travail du pilote, selon demande utilisateur (20/10/2026) :** développer et publier directement sur `main` sans branche ni PR obligatoires, en gardant les commits Git, les vérifications locales disponibles et la documentation à jour. Aucune création de base ou opération destructive n'est implicite.

Voir [Installation et essais](docs/INSTALLATION.md) pour GitHub Desktop et PowerShell.

## Validation des développements — décision du 21 octobre 2026

**GitHub Actions est indisponible : plus aucun test automatisé exécuté sur GitHub n'est requis pour SMN, jusqu'à décision contraire.** Les agents BMAD continuent de rédiger des tests ; leur exécution se fait localement quand elle est possible, avec collecte des preuves et recette sur Windows/PostgreSQL pilote. Une fusion dans `main` ne signifie pas « tests réussis ». **Référence transversale pour tous les agents :** [Politique de validation sans GitHub Actions](docs/POLITIQUE-VALIDATION-SANS-GITHUB-ACTIONS.md).

## Référentiels du projet

- [Contexte et décisions](docs/PROJECT-CONTEXT.md)
- [État du projet BMAD](docs/ETAT-PROJET-BMAD.md)
- [Index BMAD](_bmad-output/planning-artifacts/README.md)
- [User Stories Jira](https://lmn24.atlassian.net/jira/software/projects/SMN)
- [Travail I0 / SMN-11](https://lmn24.atlassian.net/browse/SMN-11)

La préparation documentaire demeure sous verdict **CONCERNS** jusqu'aux preuves complémentaires. Les tests GitHub Actions ne prouvent pas à eux seuls le bon fonctionnement sur un poste Windows 11.


## Contrats UX du tableau de bord — validés le 21 octobre 2026

**Référence obligatoire pour les agents BMAD (PM, Analyst, UX, Architect, Dev, QA) et pour les futures User Stories :** [DESIGN.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/DESIGN.md) · [EXPERIENCE.md](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/EXPERIENCE.md) · [Synthèse UXD-01 à UXD-27](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/SYNTHESE-CADRAGE-UX-SMN.md) · [Sommaire et maquette décrite](https://github.com/JeanLamora75/SMN/blob/main/_bmad-output/planning-artifacts/ux-designs/ux-SMN-2026-10-21/README.md).

**Décisions validées :** écran pleine largeur, sidebar rétractable, sélecteurs équipe/cycle dans le header, cartes J/H prévu/réel, SP et tickets **initialement engagés**/réalisés, compteur en jours ouvrés **du lundi au vendredi**, pas de carte « Avancement global » sans règle validée, quatre colonnes (obstacles, risques, événements, notes/alertes), 5 éléments actifs maximum par colonne, tri automatique, actions rapides contrôlées, historique fidèle ou message exact **« Aucun éléments à ce jour »**, personnalisation des métriques/colonnes, responsive 4/2/1.

**Statut :** contrats UX approuvés et publiés, **pas** de nouvelle fonctionnalité ou de recette attestée. Les producteurs de données, règles d'historisation, droits et catalogues FR/EN restent à vérifier avant implémentation.
