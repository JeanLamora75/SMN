# Consolidation 01 — Refonte Studio rapports

## Correctif
L'API PATCH des documents conserve désormais les champs `metrics` et `dataSource` enregistrés en base lors d'une écriture de texte/composition du Studio. L'actualisation volontaire du Sprint reste seule autorisée à modifier ce snapshot métier.

Conséquence : une sauvegarde rédactionnelle périmée n'annule pas la dernière actualisation des chiffres. Les autres champs éditoriaux restent soumis à la règle « dernière écriture serveur acceptée ».

## Contrôles et réserves
- Test de non-régression ajouté, non exécuté.
- Scénario PostgreSQL de concurrence réelle à réaliser avant toute fusion.
- Le nouveau rendu PDF, la pagination, les historiques, la sécurité des archives, les limites d'accès aux blocs et le typecheck complet restent à valider.
- Aucun test/build/migration réel n'a été exécuté. Ne pas fusionner dans main et ne pas clôturer les Jira.
