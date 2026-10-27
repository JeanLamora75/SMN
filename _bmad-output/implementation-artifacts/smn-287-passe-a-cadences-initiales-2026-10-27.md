# Lot 1 — Passe A : cadence initiale par équipe

La création d'équipe v29 initialise dans la même transaction une cadence propre au mode choisi. Scrum utilise les défauts existants : deux semaines, lundi 09:00 à vendredi 18:00, fuseau Europe/Paris. Kanban utilise la fréquence mensuelle, premier jour lundi et Europe/Paris. Révision initiale 1. Les tables sont préparées par les fonctions existantes ; l'échec annule la transaction entière.

Les autres équipes ne sont pas modifiées, aucun cycle n'est créé automatiquement. La migration v29 et les écritures restent désactivées. Aucune compilation ni test exécuté ; vérification locale Windows 11 encore nécessaire.
