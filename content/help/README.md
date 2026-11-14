# Contenu d'aide SMN

Chaque article utilise un identifiant stable défini dans `src/lib/help-catalog.ts`. Les guides sont stockés dans `content/help/<locale>/<articleId>.md` ; les nouvelles langues peuvent être ajoutées sans dupliquer les composants d'interface.

Le parcours de première configuration (SMN-466) est disponible en français et en anglais : `overview`, `general-settings`, `teams`, `calendar`, `members`, `sprints`, `kanban-periods`, `reports` et `backup`. Le guide `tickets` reste une introduction en attendant la documentation fonctionnelle détaillée.

Les étapes de la checklist correspondent aux identifiants canoniques de `src/lib/help-setup.ts` : `general`, `team`, `calendar`, `members`, `cadence`, `tickets`, `reports`, `backup`. `cadence` renvoie vers `sprints` ou `kanban-periods` selon le mode Agile. La progression reste dans `localStorage` ; les articles n'effectuent aucun appel d'écriture.

Ne jamais intégrer les guides longs dans `src/i18n/fr.json` ou `en.json`. Le chargeur `src/server/help-content.ts` impose les autorisations et charge un article à la fois, avec repli français signalé. Les liens dans les guides pointent vers des routes internes vérifiées.

Le script `node scripts/build-help-index.mjs` génère les index de recherche locaux ; `node scripts/build-help-index.mjs --check` vérifie leur cohérence. La livraison des contenus et index dans la distribution Windows sera qualifiée avec SMN-468.
