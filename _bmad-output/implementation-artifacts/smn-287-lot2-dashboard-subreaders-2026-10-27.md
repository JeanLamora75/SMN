# Lot 2 — Audit des sous-lecteurs du tableau de bord

Vérification statique de `cycle-reader.ts`, `attention-reader.ts` et `events-reader.ts`.

- `readCycleDashboard` contrôle déjà l'association `sprint.id + teamId`, mais la clause de mode dépendait de `installation.mode`. Correction : en schéma v29, elle exige désormais `team.agile_mode='scrum'` et `team.is_archived=false`. Pour les anciennes versions, elle conserve la clause historique sans référencer de colonne absente.
- `readCycleRegistry` et `readCycleNotesAndAlerts` filtrent par `teamId` et `cycleId`. Les tâches de configuration sont globales à l'installation et sont volontairement distinctes des notes de cycle.
- `readCurrentSprintEvents` prend uniquement un `sprintId` ; le point d'entrée `readCycleDashboard` vérifie l'appartenance avant de l'appeler. Le module mérite néanmoins un test croisé d'isolation interéquipes.

Limites : inspection statique uniquement. Les appels avals de capacité, historique et alertes ainsi que les autres routes API restent à auditer ; aucun build, test, migration ou déverrouillage exécuté.
