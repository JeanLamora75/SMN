# SMN-286 — Centre Rapports : harmonisation Cockpit Agile

**Date :** 26 octobre 2026
**Périmètre :** uniquement /app/reports
**Story :** https://lmn24.atlassian.net/browse/SMN-286
**Conception approuvée :** [Avenant Option A](../planning-artifacts/ux-designs/ux-rapports-2026-10-25/AVENANT-GRAPHIQUE-CENTRE-RAPPORTS-OPTION-A-2026-10-26.md)

## Développement
- Bandeau thématisé, trois onglets contextuels et création réservée à l'administrateur.
- Filtres GET existants conservés et présentés en panneau indépendant ; remise à zéro explicite.
- Tableaux dans des panneaux visuels avec statuts, dates locales formatées, actions réelles ; états vides et contrôles de droits conservés.
- Formulaire de création transféré dans une modale native HTML dialog : fermeture Annuler/X/Escape, focus clavier natif, blocage du fond, conservation du POST et de son requestId.
- CSS isolé à l'index Rapports : palette et thème hérités, responsive, sans toucher aux routes API, au schéma SQL ni au Studio.

## Fichiers ciblés
- src/app/app/reports/page.tsx
- src/app/app/reports/new-report-form.tsx
- src/app/app/reports/report-center-cockpit.css
- src/lib/report-center-date.ts
- src/i18n/fr.json et src/i18n/en.json
- tests/smn-286-report-center.test.ts

## Validation
Le code est publié pour vérification sur Windows 11. Le connecteur GitHub donne accès au dépôt, mais **pas à l'environnement Node 24/pnpm 12 de ce projet, ni à sa base et à son navigateur**.
Tests non exécutés dans l'environnement Windows utilisateur, et **aucun résultat vert présumé**.

À exécuter sur le poste :
1. Synchroniser main dans GitHub Desktop.
2. Dans PowerShell au répertoire SMN :
   - pnpm i18n:check
   - pnpm lint
   - pnpm typecheck
   - pnpm test
   - pnpm build
3. Lancer pnpm dev puis contrôler les vues Rapports / Modèles / Archives avec un compte admin et un compte user, filtres, ouverture-fermeture de la modale, création effective et parcours PDF.
4. Contrôler sur largeurs 320/375/390/768/1024/1440, zoom 200 %, thèmes/palettes et navigation au clavier. Recueillir la preuve avant clôture Jira.

**Adaptation BMAD :** les skills et contrats ont été lus par le connecteur. Le runner uv de bmad-build n'a pas été exécuté (dépôt non monté dans le runtime local) ; étapes de cadrage, analyse, implémentation et contrôles sources conduites manuellement, sans simuler un workflow/script.
