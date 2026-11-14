# Contenu d'aide SMN

Chaque article utilise un identifiant canonique défini dans `src/lib/help-catalog.ts`.
Les dossiers `fr/`, `en/` puis les langues futures contiennent des fichiers `<articleId>.md`.
Les contenus ne sont **pas** ajoutés à `src/i18n/*.json` et ne comportent ni données utilisateur ni script.

Les quatre fichiers initiaux `overview` et `tickets` sont des introductions minimales de validation technique, et **pas** les guides fonctionnels complets. Leur enrichissement relève de SMN-466/467.

Le chargeur serveur `src/server/help-content.ts` ne lit que l'article autorisé, dans la langue demandée avec repli FR explicite ; aucune écriture en base ni dépendance réseau n'est autorisée.
La construction et le ZIP Windows devront explicitement emporter ce répertoire (SMN-468).
