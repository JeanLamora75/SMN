# SMN-28 — BMAD Story 1.17, gestion des brouillons

- **Source normative :** Jira https://lmn24.atlassian.net/browse/SMN-28 ; FR-64/72/65, UX-DR08/09/15, NFR-2, AD-3/4/26/31, D-PRD-071–074/118/127.
- **Choix de périmètre :** traiter les formulaires administratifs **réellement existants** ; ne pas introduire de cycles, bilans, lots, aperçus métiers ou fausse persistance.
- **Règle des changements :** différencier état serveur confirmé et brouillon local, avertir avant sortie/rechargement, ne pas supprimer d'autres brouillons lors de la sauvegarde d'une seule ligne.
- **Règle de l'API :** conserver la validation côté serveur ; le client ne confirme jamais un succès avant une réponse de persistance positive. En cas d'incertitude, afficher une erreur, préserver le contenu de saisie et laisser la recette vérifier la base.
- **Sécurité :** aucun mot de passe ou champ sensible dans les URL ou un stockage local ; traductions centralisées FR/EN dans `src/i18n/*.json`.
- **Validation :** tests `tests/unsaved-changes.test.ts` écrits ; tests `pnpm` et vérifications de navigation navigateur/Windows à exécuter, sans prétendre aux avoir passés.

[Documentation et recette](../../docs/BROUILLONS-SMN-28.md).
