# SMN-297 — Revue complémentaire des audits

Le service de compte rendu ne répète plus le contrôle de présence du Sprint après verrouillage. Le suivi des cérémonies vérifie maintenant que ses deux tables d'historique existent avant toute écriture, sans DDL implicite.

Risque restant : lecture des absences personnelles avant filtrage côté serveur. Des tests d'intégration sont nécessaires. Un test statique a été ajouté mais non exécuté. Aucun changement de base, activation ou fusion.
