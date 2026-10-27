# SMN-289 — Mode Agile dans Paramètres > Équipes — 27/10/2026

**Statut : code préparé, non testé et non déployé.**

Modifications : contrat de formulaire exigeant `agileMode` en création/édition ; écritures serveur v29 enregistrant ce mode en création et refusant sa modification après verrouillage ; refus d'édition des équipes archivées dans le service ; listing enrichi ; radios Scrum/Kanban sans valeur initiale dans Paramètres > Équipes ; verrou et badge ; API d'écriture restreinte à v29.

**Important :** l'interrupteur `SMN_MULTI_TEAM_WRITES_ENABLED` reste désactivé. v29 n'a pas été appliquée. Les autorisations transversales de SMN-296 ne sont pas encore terminées. Les anciens tests du contrat SMN-282 doivent être réécrits pour le nouveau champ obligatoire, puis exécutés sur Windows ; tant que ce n'est pas fait, le build peut échouer. Les catalogues FR/EN doivent recevoir des clés dédiées et la modale Équipe doit présenter le mode en lecture seule. La lecture administrative conserve la compatibilité v28 en renvoyant un mode nul tant que la migration n'existe pas.

Pas de validation Prisma, TypeScript, test API, test DB ou recette exécutés. Les écritures ne doivent pas être activées.
