# SMN — Lot 3 : préparation de l'activation expérimentale

Date : 28 octobre 2026
Décision utilisateur : accepter administrativement le lot 2 **avec réserves**, passer au lot 3 puis activer le multiéquipes après préparation.

## Ce qui est préparé

- Double opt-in pour la navigation multiéquipes :
  `SMN_MULTI_TEAM_CONTEXT_READY=true` et
  `SMN_MULTI_TEAM_PILOT_ACK=I_ACCEPT_UNVERIFIED_ISOLATION`.
- Un troisième verrou, `SMN_MULTI_TEAM_WRITES_ENABLED=true`, contrôle les opérations d'écriture contextualisées ayant été adaptées.
- Précontrôle en lecture seule : `pnpm exec tsx scripts/stage3-preflight.ts`.
- Tests statiques : `pnpm exec tsx --test tests/multi-team-stage3-gates.test.ts`.
- Aucune activation effective n'a été faite sur le poste local.

## Protocole d'essai local — à exécuter uniquement après sauvegarde

1. Arrêter le serveur Next.js et sauvegarder la base portable PostgreSQL avec un mécanisme vérifié. Conserver une copie des données et de la configuration hors du dossier de travail.
2. Synchroniser `main` ; exécuter `pnpm exec tsc --noEmit` et les tests ciblés.
3. Exécuter `pnpm exec tsx scripts/stage3-preflight.ts` : schéma v30 initialisé, migrations terminées et tables requises.
4. Activer la navigation et la lecture en mode pilote **sans les écritures** en définissant les deux variables `SMN_MULTI_TEAM_CONTEXT_READY` et `SMN_MULTI_TEAM_PILOT_ACK` ; garder `SMN_MULTI_TEAM_WRITES_ENABLED` absent ou à `false`.
5. Relancer le serveur. Contrôler l'équipe sélectionnée, la navigation, le tableau de bord, les Sprints, Kanban, Calendrier, Registre et Rapports. Toute erreur de navigation bloque la suite.
6. Uniquement sur une installation sauvegardée et après essais positifs de lecture, activer le troisième verrou d'écriture. Créer une deuxième équipe pilote puis vérifier l'absence de lecture ou écriture croisée, les archives, les erreurs d'accès et les historiques.
7. Désactiver immédiatement les variables au moindre comportement inattendu. Arrêter l'application avant toute restauration de base.

## Réversibilité

- Désactiver : enlever les variables `SMN_MULTI_TEAM_CONTEXT_READY`,
  `SMN_MULTI_TEAM_PILOT_ACK` et `SMN_MULTI_TEAM_WRITES_ENABLED` puis relancer l'application.
- Cette désactivation **ne restaure pas** les données déjà écrites ; la sauvegarde est indispensable.
- La restauration PostgreSQL ne doit pas être improvisée : confirmer le format de sauvegarde et le port réel de l'instance locale avant d'écrire une commande de restauration.

## Réserves importantes

La bascule est expérimentale. Le lot 2 a été clôturé administrativement sur demande, pas validé techniquement. La couverture fonctionnelle et les écritures transversales ne sont pas encore démontrées sur deux équipes. Certains anciens parcours de v30 restent bloqués. Le pilotage ne doit pas être présenté comme une activation stable ou une mise en production.

## Critères permettant de déclarer le lot 3 terminé

- Revue des points d'entrée UI réalisée et navigation fonctionnelle en v30.
- TypeScript et tests du dernier commit exécutés avec succès.
- Précontrôle et test navigateur local effectués.
- Procédure de sauvegarde/restauration vérifiée.
- Recette multiéquipes en lecture et écriture réalisée avec deux équipes.

En l'absence de ces preuves, le statut est **préparé, non clôturé**.
