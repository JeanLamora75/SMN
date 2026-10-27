# Lot 2 — Routes historiques des cérémonies et réunions exceptionnelles

Les routes de modification et de lecture d'historique d'une cérémonie `sprints/ceremonies/[id]`, de consultation et création des réunions exceptionnelles `sprints/exceptional-meetings`, ainsi que de lecture de l'historique `sprints/exceptional-meetings/[id]`, utilisent désormais `withLegacyTeamApi` pour empêcher des accès monoéquipe non contextualisés sur les schémas v28/v29. La liste des cérémonies était déjà protégée.

Ces routes restent fonctionnelles en schéma historique (v27 ou antérieur). Des routes multiéquipes dédiées avec vérification explicite de l'appartenance du Sprint seront nécessaires. Tests d'API et audit des autres événements à poursuivre. Aucun build, test, migration ou déverrouillage exécuté.
