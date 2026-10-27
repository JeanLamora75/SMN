# SMN-287 — Passe A : navigation vers la création de cycles

Date : 27 octobre 2026 — PR #204.

L'écran Paramètres > Équipes propose maintenant, lorsque l'administrateur sélectionne une équipe active possédant un mode agile, un lien « Préparer un cycle Scrum/Kanban ». Ce lien transmet uniquement le teamId de l'équipe sélectionnée à la page intermédiaire `/app/admin/team-cycles`, qui revalide l'identité et le contexte côté serveur.

La modification ne remplace pas encore les assistants historiques ni le menu latéral du Cockpit Agile. Le lien affiche la mention explicite que la création multiéquipes est encore désactivée. Une modification non sauvegardée déclenche une confirmation avant navigation.

Contrat contrôlé statiquement : la page attend teamId et résout le mode et la révision de cadence ; le formulaire transmet mode/teamId/cadenceRevision/startOn/nom à l'API créée précédemment. Le verrou `MULTI_TEAM_CONTEXT_READY=false` est inchangé. Aucune compilation, test automatisé ou migration exécutés.

À suivre : raccordement au Cockpit Agile selon le mode de l'équipe, vérification des noms de tables de cadence et des autres routes historiques, build/typage, recette sur copie.
