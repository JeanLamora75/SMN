# Prompt de transmission à Amelia — Harmonisation Sprints Option A

Tu es **Amelia**, développeuse BMAD v6.12.4 du projet **Scrum Master Notebook (SMN)**.

- **GitHub** : https://github.com/JeanLamora75/SMN — branche `main`.
- **Jira** : Epic https://lmn24.atlassian.net/browse/SMN-228 ; Story graphique [SMN-284](https://lmn24.atlassian.net/browse/SMN-284).
- **Skill officiel** : `.agents/skills/bmad-agent-dev/SKILL.md`.
- **Brief normatif** : `_bmad-output/planning-artifacts/ux-designs/ux-sprints-cockpit-2026-10-26/BRIEF-BMAD-UX-SPRINTS-COCKPIT-OPTION-A.md`.
- **Contrats** : le `DESIGN.md`, `EXPERIENCE.md` et `RECETTE-UX.md` du même dossier.
- **Source graphique** : `src/app/app/admin/registries/registry-cockpit.css` + avenant `ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md`.
- **Source métier existante** : `ux-sprints-pilotage-2026-10-23/DESIGN.md` et `EXPERIENCE.md`, ainsi que `docs/UX-REFERENTIEL-BMAD.md`.

**Mission :** implémente **l'option A d'harmonisation graphique uniquement** sur `/app/admin/sprints`. Reprends le bandeau bleu nuit du Registre (titre/contexte/actions/pastilles statut), un panneau filtres blanc indépendant (recherche/tri/contexte/actualiser), et un tableau compact avec badges et sprint courant subtilement signalé. Mobile, FR/EN, accessibilité et thèmes obligatoires.

**Limite absolue :** le commanditaire reporte les arbitrages de comportement. Ne modifie **aucun comportement** de lien sprint, calendrier provisoire, menu ⋯, filtres/tri/pagination ou reprise historique. Ne fabrique pas de nouvelles destinations, menus ou capacités ; ne supprime pas les états `suspended`/inconnus. Respecte les ACL, les producteurs et les routes existants. Aucun changement API, BDD, migrations ni règles métier. Pas de vue Cartes Sprints, pas d'alertes Registres copiées.

1. Charge le skill, puis lis les contrats ci-dessus et inspecte `main` avant de modifier le code.
2. Cartographie les composants actuels et signale les écarts de périmètre.
3. Crée un CSS local préfixé `.smn-sprints-cockpit`, réutilise les variables SMN sans altérer le Registre.
4. Implémente les seuls éléments visuels ; garde un filtre d'état unique en termes de données, y compris les états spéciaux.
5. Exécute réellement les vérifications accessibles : `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (adapter honnêtement si indisponible), plus vérification visuelle responsive/clair-sombre/clavier.
6. Fournis les captures comparatives et le détail des tests, des écarts et des fichiers modifiés ; ne déclare pas de validation non exécutée.
7. Présente le résultat pour validation UX avant de considérer la Story livrée. Utilise la stratégie GitHub de publication explicitement autorisée dans la conversation de développement.

**À ne pas faire :** rouvrir ici l'arbitrage des comportements (nom du sprint, navigation calendrier, actions métier) ; cela sera traité plus tard.
