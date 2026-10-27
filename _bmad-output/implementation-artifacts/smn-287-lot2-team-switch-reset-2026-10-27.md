# Lot 2 — Réinitialisation de navigation lors du changement d’équipe

Un changement d'équipe depuis le sélecteur ramène désormais systématiquement à `/app?teamId=<nouvelle équipe>` sans conserver l'URL de la fiche, du cycle, du rapport, du filtre ou du brouillon précédents. L'ancien mode Scrum/Kanban n'influence plus la destination, puisqu'il pourrait correspondre à une autre équipe. Tests unitaires de navigation adaptés ; non exécutés.

Le changement de préférence reste vérifié côté serveur ; l'activation reste verrouillée par `MULTI_TEAM_CONTEXT_READY=false`. La propagation des données du Cockpit et la validation avec plusieurs équipes restent à faire. Aucun build, test ou migration exécuté.
