# Consolidation 05 — Référence immuable des sources PDF

## Changements
- Une référence déterministe est calculée depuis le contenu effectivement lu en base, l'identifiant du rapport, sa révision, son Sprint, son équipe, son modèle, son titre et sa langue.
- L'empreinte SHA-256 canonique est conservée dans le manifeste du PDF archivé, à côté de l'identifiant de document et de la révision.
- Les octets du PDF restent archivés avec la vérification SHA-256 historique.
- Le nouvel archivage ne modifie ni les anciennes archives, ni les brouillons.
- Tests unitaires écrits pour le déterminisme et la variation des identités de source.

## Garanties réelles et limites
Cette version associe un PDF à une empreinte précise du contenu source utilisé, et non encore à une ligne de snapshot JSON conservée séparément dans une table immuable. Elle ne fournit donc pas encore de reconstitution complète du JSON original.
Il reste à rendre atomiques la fixation du snapshot, son numéro Vn, la génération PDF et la création du manifeste. Un changement concurrent après la seconde vérification du brouillon ne peut pas modifier les octets du PDF déjà calculés, mais la sérialisation de la numérotation et l'historique explicite des snapshots doivent être implémentés.
La fidélité du PDF aux graphiques, tableaux, images, sommaires et pagination reste incomplète : ces blocs demeurent bloqués lorsqu'ils ne peuvent pas être restitués.
Aucun typecheck, test, build, ni essai PostgreSQL/PDF exécuté.
Statut : PR brouillon, aucune fusion main ni transition Jira.
