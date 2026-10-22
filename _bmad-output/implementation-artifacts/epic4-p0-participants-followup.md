# P0-05 — Attribution des participants aux réunions exceptionnelles

Branche : fix/epic4-p0-meeting-participants.

## Réalisation initiale
- Tables de participation par réunion et historique d'audit.
- API PUT sécurisée par permission écriture, verrouillage de la réunion et du Sprint, refus si Sprint clôturé.
- Vérification de l'appartenance du membre à l'équipe sur au moins une partie de la période de réunion.
- Interface d'attribution des participants, traductions FR/EN.
- Aucune modification automatique de la capacité initiale ni des valeurs saisies.

## Reste bloquant
- L'attribution des participants ne suffit pas à établir une déduction JH exacte : calcul du chevauchement sur plages ouvrées, fractions Développeur, indisponibilités, et exclusion des doublons restent à implémenter.
- Le garde-fou existant continue à signaler la capacité réelle « non calculable » si des événements impactants sont présents.
- Le modèle ne précise pas encore le caractère exhaustif de la liste de participants : conserver l'échec sûr en présence de données non fiables.
- Compilation/Prisma/PostgreSQL et tests d'intégration non exécutés. Fusion main interdite (NO-GO).
