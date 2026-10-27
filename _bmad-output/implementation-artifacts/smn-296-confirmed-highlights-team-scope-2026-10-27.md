# SMN-296 — Isolation des faits marquants confirmés (27 octobre 2026)

Le lecteur `readConfirmedHighlights(db, teamId?)` refuse désormais les lectures sans équipe explicite à partir du schéma v28. Les résultats issus d'un registre sont filtrés par `smn_registry_item.team_id` ; ceux issus d'un objectif le sont par `smn_sprint.team_id`. La lecture monoéquipe historique reste possible en schémas 1 à 27.

Cette modification est une protection de périmètre, **pas une autorisation** : les appels multiéquipes doivent résoudre et autoriser l'équipe avant d'utiliser le lecteur. Des anciens écrans peuvent échouer fermés en v28/v29 jusqu'à leur adaptation. Les créations de faits marquants et les autres exports nécessitent encore un audit.

Code publié ; aucun test, build ni migration exécuté. Écritures multiéquipes désactivées.
