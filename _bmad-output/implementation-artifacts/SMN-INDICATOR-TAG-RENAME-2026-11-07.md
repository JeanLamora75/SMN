# SMN — Renommage des tags des indicateurs dynamiques (7 novembre 2026)

## Besoin et contrat

Depuis Paramètres > Indicateurs > Catalogue, l'administrateur peut modifier le tag d'un indicateur manuel ou calculé, sans recréer l'indicateur. Le tag est normalisé en majuscules et doit être unique, valide et distinct des tags réservés au calendrier.

- Le renommage conserve l'identifiant immuable de l'indicateur.
- Les préférences d'affichage, sélections d'équipe, emplacements de dashboard classique et sources Dashboard Builder référencent cet identifiant : aucune remise en configuration n'est nécessaire.
- Les formules actives et archivées qui contiennent l'ancien tag sont réécrites par jeton entier, y compris les fonctions historiques ; les rôles entre guillemets ne changent pas.
- Le graphe des dépendances doit rester valide avant publication. Renommage + formules + révision système sont atomiques dans une transaction PostgreSQL.
- Aucun recalcul métier n'est imposé par un changement de libellé de tag : les résultats et les révisions de formule sont préservés, puisque l'identité et la sémantique du calcul ne changent pas.
- Les exports et rapports figés déjà émis ne sont jamais réécrits.
- Les fichiers Word/PowerPoint externes qui contiennent littéralement l'ancien tag ne sont pas modifiés : ces modèles doivent être mis à jour manuellement pour les prochaines générations. Les tags ne sont pas des références à identifiant stable dans les fichiers Office.

## Développement

- `src/server/indicators/tag-rename.ts` : projection et validation des références.
- `src/server/indicators/catalog.ts` : mutation atomique et refus des collisions.
- `src/app/app/admin/indicators/catalog-client.tsx` : édition du tag et confirmation d'impact.
- `tests/smn-indicator-tag-rename.test.ts` : tests métier, intégrité des dépendances, associations Dashboard Builder.

## Validation

Les modifications ont été publiées sur GitHub `main`. La suite de tests, le typecheck et la recette navigateur/PostgreSQL ne sont **pas attestés** dans cette intervention. Vérifier `pnpm exec tsx --test tests/smn-indicator-tag-rename.test.ts`, `pnpm typecheck`, et la mise à jour d'un indicateur réellement utilisé par un Dashboard Builder et par des formules dépendantes avant clôture de la recette.

Aucune User Story Jira n'a été créée ni modifiée dans cette intervention.
