---
story: SMN-21
status: in-progress
implementation: first-ux-iteration
language: fr
date: 2026-10-20
---
# SMN-21 — First dashboard iteration

## Intent vérifié
Lire l'identité du produit, de l'équipe et le mode réellement enregistrés ; présenter une première expérience post-connexion sans faux cycles ni fausses métriques ; maintenir la confidentialité du profil Utilisateur. Le périmètre d'AC2/AC3 continuera à s'enrichir avec les Stories productrices de cycles et indicateurs.

## Artefacts modifiés
- `src/server/dashboard/read.ts` — contrat collectif en lecture seule, champs personnels absents.
- `src/app/app/page.tsx` — interface responsive, sections et navigation.
- `src/app/dashboard.css`, `src/app/layout.tsx` — présentation.
- `tests/dashboard-read.test.ts`, `scripts/verify-http-ci.mjs` — contrôles.
- `docs/TABLEAU-DE-BORD-SMN-21.md` — recette et limites.

## Restrictions
Aucune création automatique de cycle ni mutation métier. Aucune vérification d'AC2 avec données de cycles n'est possible avant la livraison de leur modèle et interfaces. Les modules non livrés sont identifiés comme futurs. Les deux seuls profils restent admin et user.

## Workflow
Implémentation incrémentale via connecteur GitHub, publication directe sur main comme décidé pour le pilote. La commande BMAD de rendu du skill ne peut pas être exécutée depuis le seul connecteur GitHub ; ne pas assimiler cette adaptation à l'exécution complète du workflow officiel. La validation complète attend le retour ergonomique utilisateur et les futurs producteurs.
