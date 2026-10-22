# SMN-84 — Saisie et dérivés des Story Points

Jira : https://lmn24.atlassian.net/browse/SMN-84

## Implémentation initiale
- Quatre valeurs sources nullable : engagement initial, SP ajoutés, SP retirés, SP terminés.
- Calculs dérivés uniquement si les données nécessaires sont disponibles : engagement final = initial + ajoutés − retirés ; SP non terminés = final − terminés ; taux = terminés / final × 100 pour final > 0.
- Pas de plafonnement du taux, valeurs au-delà de 100 % acceptées avec alerte non bloquante.
- Prévisualisation client pure, sans sauvegarde ni mise à jour de tendances ou transfert automatique.
- Enregistrement SQL atomique avec contrôle de révision, audit, refus des changements sur Sprint clôturé.
- API d'administration et formulaire FR/EN.

## Limitations
- Le bloc Story Points est pour l'instant présent sur la page d'administration des Sprints, pas encore dans un bilan complet finalisé.
- Les sources sont stockées comme entiers positifs ou nuls, dans une limite technique de 1 000 000 000 ; des décimales ne sont pas autorisées par cette implémentation.
- La règle métier sur un engagement final négatif est laissée calculable pour final/non terminés, mais taux non calculable ; à valider en recette.
- Aucune compilation TypeScript, validation Prisma ou exécution PostgreSQL réelle effectuée. GitHub Actions indisponible.
- PR en brouillon, aucune fusion main.
