# SMN-297 — Cérémonies Scrum multiéquipes : lecture seule

Le Calendrier ouvre désormais les cérémonies générées et occurrences de modèle dans un composant en lecture seule sur les parcours contextualisés. Nouvelle API GET sous `api/admin/team-calendar/meetings/[kind]/[id]` : autorisation Admin, verrou global, résolution du teamId côté serveur et filtre SQL `s.team_id` sur le détail. La route historique demeure distincte pour le monoéquipe.

Les écritures des cérémonies, le suivi de présence, leurs comptes rendus et les liens au registre exigent encore une refonte sûre et restent non accessibles depuis cette modale multiéquipes. Un test source a été ajouté mais n'a pas été exécuté. Aucun changement de schéma ou déverrouillage.
