# SMN — Tests, lots P1.3 et P1.4

Date : 4 novembre 2026. Travail via GitHub sur main.

## Lot 3 — Traçabilité
- `tests/coverage/requirements.json` relie les 22 scénarios RX du Dashboard Builder et 7 exigences critiques aux tests nommés.
- `scripts/coverage-matrix.mjs` récupère les 43 décisions UX/MAQ de la source officielle `acceptance-traceability.ts`, vérifie le catalogue et distingue preuve comportementale exécutée, contrôle statique et absence de vérification.
- La commande `pnpm test:coverage-matrix` exécute les tests métier ciblés et génère `audit-output/coverage-matrix.json`.
- La CI I0 archive le rapport sous `smn-bmad-coverage-matrix`.
- Une validation au niveau service ne constitue pas un test E2E navigateur. Les parcours UI complets restent à automatiser.

## Lot 4 — Nettoyage
- Les tests `smn-dashboard-slot-cockpit-modal.test.ts` et `dashboard-header-cockpit.test.ts` ne répètent plus certaines assertions déjà garanties par `smn-361`, `smn-362` et les nouvelles suites P1. Leurs contrôles spécifiques UI et droits demeurent.
- Les tests de migration historiques ne sont pas supprimés.
- `tests/coverage/historical-contracts.json` classe 12 tests anciens à conserver, et `tests/coverage-matrix.test.mjs` contrôle leur présence.

## Vérifications
Exécuter `pnpm test`, `pnpm test:coverage-matrix`, `pnpm typecheck`, `pnpm lint`, et vérifier Windows/Linux/PostgreSQL sur le même SHA.

Le rapport indique des lacunes de preuve sans les masquer derrière une CI verte. Le module BMAD `uv` n'a pas été exécuté ; les actions GitHub sont vérifiables directement dans les commits.

[GitHub Actions](https://github.com/JeanLamora75/SMN/actions?query=branch%3Amain)
