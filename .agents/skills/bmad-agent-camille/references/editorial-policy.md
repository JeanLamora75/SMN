# Politique éditoriale Camille — SMN

## Priorité des preuves
1. **Code existant et comportement accessible** : `src/lib/help-catalog.ts`, routes réelles, règles de droits, validations.
2. **Résultats de tests réellement exécutés** : commit, identifiant de run et conclusion ; ne jamais assimiler la seule présence d'un test à sa réussite.
3. **Jira, PRD, BMAD et UX** : définition du besoin, pas preuve de disponibilité.

L'absence de preuve donne le statut **non-attesté** ; une preuve limitée au code donne **partiel** pour les parcours utilisateurs non exécutés ; `vérifié` ne signifie que les caractéristiques effectivement attestées.

## Registre de vérification (note de travail, pas article)
| Champ | Contenu |
|---|---|
| `articleId` | ID présent dans le catalogue |
| `locale` | code de langue validé |
| `fonctionnalité` | capacité décrite |
| `sources` | fichiers/commits exacts |
| `preuve` | résultat de test/CI ou « code seul » |
| `vérifié_le` | date ISO de consultation des sources |
| `statut` | `vérifié` / `partiel` / `non-attesté` |
| `action` | `créer` / `modifier` / `ne-pas-publier` |

Un chemin non confirmé, un bouton supposé ou une fonctionnalité seulement planifiée impose `ne-pas-publier` pour l'instruction concernée. Les divergences sont relevées dans une section **Écart documentaire** de la note de travail.

## Confidentialité et UX
Écrire des procédures compréhensibles sans nom de client, adresse privée, email, jeton, mot de passe ou capture utilisateur réelle. Pour les exemples utiliser des noms fictifs neutres et des identifiants non sensibles. Les liens d'aide utilisables sont internes (`/app/...`), vérifiés, et accompagnés des prérequis de rôle. Ne jamais contourner les protections serveur. Garder une structure H1/H2 claire et des listes courtes ; différencier les parcours Scrum et Kanban.

## Internationalisation
Le même `articleId` doit conserver le même sens dans toutes les locales. FR et EN sont les deux langues livrées initialement ; les futures locales doivent employer les mêmes chemins, sans changement des composants React. Si une traduction n'est pas disponible, enregistrer la dette et annoncer le repli français clairement, jamais silencieusement. Ne pas inclure le corps des articles dans `src/i18n/*.json`.

## Publication et tests
Valider les liens, les IDs, la cohérence FR/EN et les index. Contrôler avec `node scripts/build-help-index.mjs --check` après génération des index. Un test ou une CI non exécuté doit être noté « non exécuté », sans promesse de résultat.
