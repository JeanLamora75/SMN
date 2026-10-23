# SMN-134 — En-tête professionnel et logo facultatif

Jira : https://lmn24.atlassian.net/browse/SMN-134 — Story 6.15.

## Livré sur main

- En-tête de prévisualisation regroupant les informations du produit, de l'équipe, du Sprint, de ses dates, de son statut, de la version historique et de la date de génération.
- Indication explicite d'un rapport provisoire sur les périodes non clôturées (déjà présente, conservée).
- Logo facultatif PNG/JPEG (256 Ko max) configurable sur la préparation, stocké en `bytea` dans PostgreSQL sous le Sprint ; aucune ressource externe requise.
- Endpoint administratif GET/PATCH et contrôle serveur sur taille, base64, signature PNG/JPEG et périmètre de l'équipe ; aucune modification des indicateurs ou sections pendant cette opération.
- L'image est rendue avec un texte alternatif. Une légende et des en-têtes accessibles sont ajoutés au tableau des tendances.
- Tests de contrat du logo préparés.

## Limites et recette

- Le logo est attaché au brouillon du Sprint, pas encore à une configuration d'équipe ou à un rapport exporté immuable. Son gel et sa reprise dans le manifeste d'archive PDF restent à réaliser lors de SMN-127/128.
- La validation de signature protège contre de simples extensions malveillantes, mais ne remplace pas un décodage complet des images ; ce contrôle reste à renforcer avant diffusion large.
- La fidélité et l'accessibilité du PDF serveur ne peuvent pas être prouvées : moteur PDF encore manquant.
- Aucun typecheck, tests, build, ni recette PostgreSQL/navigateur n'a été exécuté depuis les connecteurs.

Vérification Windows : `git pull` ; `pnpm typecheck` ; `pnpm exec tsx --test tests/smn-134-report-logo.test.ts` ; `pnpm i18n:check` ; `pnpm build`.
