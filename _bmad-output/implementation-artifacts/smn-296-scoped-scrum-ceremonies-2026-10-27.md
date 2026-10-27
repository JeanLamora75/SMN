# SMN-296 — Génération des cérémonies Scrum par équipe

Date : 27 octobre 2026. Code publié sur PR #204, **non testé**.

Le service `src/server/sprints/scoped-create.ts` appelle désormais `saveGeneratedCeremonies` avant le COMMIT de création. Le générateur existant identifie `team_id` depuis le Sprint nouvellement inséré, puis sélectionne les modèles de cérémonies actifs appartenant à cette équipe. Le nombre d'occurrences créées est inclus dans le résultat.

Une erreur pendant la génération doit faire échouer la transaction globale. Les cérémonies ne sont pas générées par défaut : seules les occurrences correspondant aux modèles personnalisés actifs sont produites.

**Réserve** : les tests de création Scrum ont été adaptés mais non exécutés. Le moteur d'occurrences exécute encore des vérifications et des opérations DDL conditionnelles ; leur compatibilité transactionnelle et la sécurité des fonctions auxiliaires doivent être éprouvées. Aucune route HTTP exposée, aucune migration appliquée. Les autres API métier et SMN-296 restent en cours.
