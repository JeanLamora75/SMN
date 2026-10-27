# Lot 2 — Choix de cycle dans l'en-tête du Cockpit Agile

Sur un déploiement multiéquipes activé, `PrivateShell` lit maintenant les options de cycles depuis `GET /api/admin/team-cycles/list?teamId=...`, et non les API historiques monoéquipes. Le résultat est rejeté si l'identifiant d'équipe et le mode Agile ne correspondent pas à ceux du contexte courant. Le sélecteur n'accepte que les identifiants reçus du serveur. Au changement d'équipe, les valeurs locales sont recalculées et l'ancienne sélection n'est pas réutilisée si elle est absente des nouvelles options.

Le flux historique reste utilisé tant que le sélecteur multiéquipes est inactif. Cette lecture est limitée aux 50 premières entrées Scrum et à 200 périodes Kanban ; une pagination du sélecteur et un contrat de contexte plus compact restent à qualifier.

Aucun test, build, migration ou déverrouillage effectué. `MULTI_TEAM_CONTEXT_READY=false` reste inchangé.
