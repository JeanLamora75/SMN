# Correctif BMAD — Build Windows standard et droits de symlink (23/10/2026)

## Retour de recette

Commande exécutée par l'utilisateur sur Windows 11 sans droits administrateur : `pnpm build`.
La compilation Next.js 16.0.0, la vérification TypeScript et la génération des pages ont réussi, puis l'étape de création de `.next/standalone` a échoué : `EPERM: operation not permitted, symlink` pour des dépendances pnpm (`pg-connection-string`, `next`, `@next/env`, `pgpass` notamment). Plusieurs avertissements `baseline-browser-mapping` indépendants sont présents.

## Cause vérifiée dans le dépôt

`next.config.ts` imposait `output: "standalone"` pour toutes les plateformes.
Le mode standalone génère un répertoire de distribution incluant des liens symboliques, bloqués par la politique du poste. Le programme `pnpm start` utilise directement `next start` et n'a pas besoin de `.next/standalone`.
Le packaging pilote `scripts/windows/package-portable.mjs` exige, en revanche, `.next/standalone/server.js`. Son workflow Windows installe déjà les dépendances avec npm pour éviter la topologie de symlinks de pnpm.

## Correction publiée sur main

- `next.config.ts` : `standaloneOutputFor(platform, requestedByPackaging)` sélectionne la sortie standard pour les builds Windows non dédiés au packaging, conserve standalone ailleurs et permet un opt-in explicite sur Windows.
- `.github/workflows/portable-package.yml` : option `SMN_BUILD_STANDALONE=1` uniquement pour l'étape de compilation du paquet ; fonctionnement historique du packaging préservé.
- `tests/build-output-mode.test.ts` : quatre scénarios purs sur les plateformes et l'activation de la configuration.
- `docs/INSTALLATION.md` : diagnostic et procédure de recette PowerShell sans privilèges élevés ni actions sur les données.

## Critères de recette à exécuter

1. `pnpm exec tsx --test tests/build-output-mode.test.ts` : quatre scénarios réussis.
2. `pnpm typecheck` et `pnpm build` sur Windows 11 standard : exit code 0 et aucune erreur EPERM dans `.next/standalone`.
3. `pnpm start` : port 3003 en loopback, accès au contenu attendu de SMN.
4. Vérification distincte du packaging autonome uniquement quand les moyens Windows adaptés seront disponibles. Ne pas considérer le paquet autonome attesté par le build local normal.
5. Avertissement `baseline-browser-mapping` : non bloquant et séparé. Ne pas mettre à jour les dépendances verrouillées sans vérification distincte.

## Preuves et limites

Les logs de l'utilisateur prouvent la réussite de la compilation et de TypeScript avant l'erreur initiale.
Analyse de source et commits GitHub effectués via connecteur ; aucun build Next, test `tsx` ou lancement de serveur réel exécuté dans cet environnement. Aucun résultat de GitHub Actions invoqué (indisponibles selon la politique SMN). Ce correctif reste **à recetter** sur le poste Windows utilisateur.

**Aucune migration PostgreSQL, modification Jira ou altération de données métier.**
