# SMN-11 — Lancement officiel des trois relectures indépendantes BMAD

**État :** prêts à exécuter, **non exécutés**. Date : 20/10/2026.

- PR : https://github.com/JeanLamora75/SMN/pull/10
- Snapshot du code et de la documentation examiné : `cc9a08cc6517cc47029309779a943998743297c5`
- Baseline : `9f6cc9ba1a1a23d47234511d7801e5a0cc54fe86`
- Périmètre : tous les changements de la PR à ce commit, **hors les trois prompts de revue** eux-mêmes, pour éviter leur auto-référence.
- Vérifications techniques antérieures, non assimilées à une revue indépendante : https://github.com/JeanLamora75/SMN/actions/runs/39388328841 (23 tests réussis, lint, typecheck, build, contrôle HTTP 3000 + 3003 sur runner Linux).
- Recette Windows : accueil et diagnostic affichés, refus visuel /app et /setup confirmé ; les deux projets démarrent alternativement selon choix utilisateur. Pas de création de base PostgreSQL utilisateur.

## Procédure

1. Ouvrir **trois conversations séparées**, sans transmettre aux reviewers les résultats des autres.
2. Pour chaque conversation, faire lire le prompt de revue correspondant directement sur la branche `dev/bmad-i0-20261020` ; le fichier inclut le diff et les instructions nécessaires. **Ne pas autoriser ces sessions à modifier le dépôt/Jira**, simplement à rendre leurs constats.
3. Rapporter les résultats des trois conversations à l'agent développeur SMN initial pour triage BMAD étape 04, correction éventuelle, nouvel essai de validation, puis étape 05. **Ne pas déclarer la Story terminée sans les trois revues.**

## Liens vers les trois prompts

- [Blind Hunter](review-smn-11-blind-hunter.md)
- [Edge Case Hunter](review-smn-11-edge-case-hunter.md)
- [Verification Gap Reviewer](review-smn-11-verification-gap.md)

**Note de fidélité :** le fallback prévu par le workflow officiel BMAD impose cette étape manuelle lorsque les sous-agents indépendants ne sont pas disponibles. Les prompts sont préparés sur GitHub ; ils n'ont pas encore été exécutés.
