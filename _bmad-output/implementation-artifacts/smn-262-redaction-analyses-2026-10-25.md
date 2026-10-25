# SMN-262 — Rédaction et insertion explicite d'analyses

## Livré
- Studio : commentaires par rubrique et blocs textuels (hérités de SMN-259/260).
- Sélection explicite depuis le journal existant des analyses d'un Sprint, filtré par équipe via `readAnalysisJournal`.
- Origine humaine/IA, identifiant de source et identifiant d'archive lorsque présent conservés dans une copie du rapport.
- La copie est modifiable sans modifier la réponse/brief original, ni un autre rapport.
- Aucune génération IA ni import automatique de texte.
- Traductions FR/EN et tests de conservation de la provenance ajoutés.

## Statut des critères
- AC1 : zones par rubrique + blocs libres existants, à vérifier de bout en bout.
- AC2 : `content.userNotes`, `content.blocks`, `content.analyses` propres au document, sauvegardés via PATCH ; intégration non testée.
- AC3 : sélection de journal `human` ou `ai`, copie explicitement éditable ; permissions de lecture existantes à tester.
- AC4 : aucune fonctionnalité de génération IA développée.
- AC5 : aucun rafraîchissement de données automatique ; chemin de rafraîchissement dédié à développer en conservant `analyses` et `userNotes`.

## Risques et limites
- Les analyses insérées sont stockées en texte brut dans le JSON du brouillon. Une sélection très longue peut dépasser la limite de 500 kB de l'API PATCH : prévoir validation/troncature volontaire après décision UX, sans perte silencieuse.
- Le journal peut renvoyer au maximum 300 entrées ; contrôle d'accès API et filtrage de l'équipe à valider en recette.
- Il manque une distinction UI entre annotation humaine et analyse IA retouchée dans le PDF final.
- Sauvegarde explicite du Studio et politique de concurrence non encore stabilisées.
- Typecheck, build, tests et recette PostgreSQL non exécutés. PR précédente SMN-254 à SMN-261 non fusionnées.
