# Contrats des workflows Camille

Les cinq modes opèrent sur des fichiers et preuves du dépôt, jamais sur PostgreSQL ou sur le runtime SMN. Charger `editorial-policy.md` puis les sources spécifiques.

## CR — Créer
**Entrée :** `articleId`, locales FR/EN, objectifs, story éventuelle. Vérifier que l'ID est présent dans `src/lib/help-catalog.ts`, que sa route existe et que les permissions sont correctes. Lire la fonctionnalité dans son code et les tests associés. **Sortie :** deux brouillons Markdown `content/help/fr/<articleId>.md` et `content/help/en/<articleId>.md`, ou rapport de blocage ; registre des preuves et diff. Ne pas écraser un article déjà existant : passer en **MA**.

## MA — Mettre à jour
**Entrée :** article existant, changement fonctionnel vérifiable et langues concernées. Lire l'ancienne version et les fichiers métiers. Ne modifier que les paragraphes touchés ; conserver ID, titre fonctionnel, informations non concernées et liens valides. Mettre à jour l'EN lorsque le FR change et inversement, ou consigner explicitement la traduction à reprendre. **Sortie :** diff ciblé, sources datées, note des écarts et index régénérés. Refuser un changement portant sur une fonctionnalité non attestée.

## AU — Auditer
**Entrée :** catalogue, fichiers `content/help/<locale>/`, `.index/<locale>.json`, routes et droits. Comparer les IDs présents, les traductions, les titres, les liens autorisés, les index et les sources de comportements. **Sortie :** matrice ID × locale × statut, articles absents, liens incorrects et preuve manquante ; ne jamais considérer un guide « complet » sur la seule existence du fichier.

## AC — Aide contextuelle
**Entrée :** `articleId`, écran et chemin actuel. Vérifier le mapping dans `helpArticleForContext` et `help-catalog.ts` et les droits. Déduire un texte concis du **même Markdown** que celui du Centre d'aide, sans copie parallèle. **Sortie :** proposition éditoriale et diff si nécessaire ; tout changement React, autorisation ou modale relève d'Amelia/Sally.

## RV — Notes de version
**Entrée :** période, commits GitHub, story Jira et preuves CI disponibles. Établir une table `livré et vérifié` / `présent mais non qualifié` / `prévu`. **Sortie :** brouillon de notes de version FR, EN si demandé, avec liens vers preuves et exclusions explicites. **Jamais de publication automatique** ; demander validation du responsable produit.

## Frontières de responsabilité
- **John** : valider la portée métier et les évolutions de stories Jira.
- **Sally** : UX, accessibilité et captures.
- **Winston** : architecture, catalogue canonique, routes et invariants.
- **Amelia** : développement, tests techniques, index et intégration du skill.
- **Murat** : couverture, tests réels, stabilité et décision qualité.
- **Camille** : vérification documentaire, création, révision, audit et notes factuelles uniquement.

## Contrôles de fin de workflow
Une procédure est publiable uniquement si l'ID est canonique, que ses assertions sont attestées, que les routes/permissions sont vérifiées, que les locales nécessaires sont couvertes, que les index sont synchronisés et que ni secret ni donnée personnelle n'est introduit. En cas de manque, produire un **rapport de blocage vérifiable**, pas un guide inventé.
