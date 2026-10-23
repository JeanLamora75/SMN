# SMN-126 — Confidentialité des rapports collectifs

Jira : https://lmn24.atlassian.net/browse/SMN-126 — Story 6.16.

## Publié sur main

- Contrats d'autorisation par liste blanche `src/lib/report-privacy.ts` : contexte collectif Sprint (identifiant, équipe, produit, dates, statut) et éléments affichables seulement, sans propager les champs auxiliaires des objets sources.
- Filtre de faits : exclusion des fiches masquées et invalidées ; responsable métier possible sous forme de son nom uniquement, sans courriel ni données personnelles supplémentaires.
- Protection contre le détournement du moteur de rapport vers le brief TXT/IA : la fonction de décision `reportExportAllowed` ne reconnaît que HTML et PDF. Aucun endpoint TXT/IA n'est ajouté.
- Le moteur HTML utilise explicitement les listes blanches avant le rendu. Les contrôles existants Admin interdisent l'accès direct à la prévisualisation pour les profils non autorisés.
- Tests de contrat `tests/smn-126-report-privacy.test.ts`.

## Limites de conformité

- Les notes et champs libres sont des contenus rédactionnels potentiellement identifiants : ils ne sont pas automatiquement anonymisés. Une politique de classification et une recette de confidentialité restent nécessaires avant diffusion publique.
- Le filtre d'autorisation PDF et TXT est une fonction de contrat ; le générateur PDF n'existe pas encore, son futur endpoint devra l'imposer côté serveur.
- L'éditeur HTML conserve volontairement les faits qualitatifs non vérifiés masqués jusqu'à intégration sûre des droits Epic 5. La détection exhaustive de données nominatives enfouies dans les textes et sources doit être auditée.
- Les tests n'ont pas été exécutés ; aucune recette PostgreSQL, navigateur ou analyse de sécurité exhaustive n'a été réalisée. Jira demeure ouverte.

Vérifications : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-126-report-privacy.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
