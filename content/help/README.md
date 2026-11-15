# Documentation du module Aide SMN

**État documentaire vérifié le 15 novembre 2026.** Le module dispose de **16 articles canoniques**, présents séparément en **français et anglais** : `content/help/fr/<articleId>.md` et `content/help/en/<articleId>.md`. Les identifiants et droits sont définis dans `src/lib/help-catalog.ts`. Les futures langues disposent de leur propre répertoire ; elles ne nécessitent pas de dupliquer les composants React ni de charger des guides longs dans `src/i18n/*.json`.

## Articles et parcours

- **Première configuration :** `overview`, `general-settings`, `teams`, `calendar`, `members`, `sprints`, `kanban-periods`, `reports` et `backup`.
- **Modules et dépannage :** `tickets`, `indicators`, `registries`, `jira-settings` et `faq`.
- La FAQ pointe directement vers le guide `overview` avec `/app/help?article=overview` ; le composant `SafeHelpMarkdown` autorise uniquement **cette forme exacte** de lien à paramètre, en plus des routes locales simples. Les autres requêtes et les liens externes restent non cliquables dans les articles.
- Le contrat CSV du guide Tickets correspond à `id,type,resume,priority,status,sp`. Les registres couvrent les six types canoniques ; les guides Rapports, Membres et Paramètres généraux documentent les opérations réellement présentes.

## Chargement, sécurité et langues

- `src/server/help-content.ts` charge **un article autorisé à la fois**, depuis le disque ; il applique les droits du catalogue et signale explicitement tout repli sur le français.
- `src/server/help-search.ts` lit l'index local de la langue active et filtre les résultats par autorisation. Le Centre d'aide et la modale contextuelle utilisent la même source Markdown.
- Les articles n'exécutent **aucune écriture métier ni SQL** ; `HelpSetupChecklist` mémorise uniquement les états déclaratifs de la checklist dans `localStorage`. Ces coches ne sont pas synchronisées d'un ordinateur à l'autre.
- Les liens des guides accessibles aux utilisateurs standards sont contrôlés pour éviter les destinations qui demandent des droits administrateur ou un mode Agile incompatible.

## Génération des index

Depuis la racine du dépôt, avec **Node.js** (aucun `uv`) :

```sh
node scripts/build-help-index.mjs
node scripts/build-help-index.mjs --check
```

Le script génère `content/help/.index/fr.json` et `en.json`. Toute modification des articles doit être accompagnée des index mis à jour ; le contrôle `--check` fait échouer la CI s'ils ne correspondent plus aux fichiers. Le format est versionné ; la livraison de nouvelles langues implique un index pour chacune.

## Tests automatiques réellement présents

- `tests/smn-459-help-catalog.test.ts` à `tests/smn-467-help-guides.test.ts` : catalogue, contenu localisé, Centre d'aide, recherche, modale, checklist, premiers pas et guides.
- `tests/smn-468-offline-help.test.mjs` : couverture et index dans les fichiers sources, copie d'un **répertoire de type distribution Windows**, rejet de fichiers/index manquants ou obsolètes, et contrat du packaging. **Ce test n'est pas une installation réelle sur un autre PC Windows.**
- `tests/smn-469-help-contract.test.ts` et `tests/smn-469-help-browser.test.ts` : sécurité, droits, recherche, checklist, et scénarios Chromium **sur fixtures**, répétés trois fois dans la CI.
- `tests/smn-470-camille-skill.test.mjs` et `scripts/camille-pilot.mjs` : configuration de Camille et pilote documentaire isolé.
- `tests/help-au01-kanban-access.test.ts`, `help-au02-context-entry.test.ts`, `help-au03-role-safe-links.test.ts`, `help-au04-registry-documentation.test.ts`, `help-au05-functional-guides.test.ts` et `help-au06-au07-maintenance.test.ts` : régressions des corrections de l'audit Camille.
- Workflow bloquant `.github/workflows/help-quality.yml` : vérification des index, tests de contrats, tests Chromium sur fixtures, skill/pilote Camille, TypeScript, contrôle i18n et build Next.js.

**Preuve avant AU-06/AU-07 :** [GitHub Actions — run 43690693920, terminé avec succès](https://github.com/JeanLamora75/SMN/actions/runs/43690693920). Le résultat spécifique d'AU-06/AU-07 doit être confirmé depuis un run ultérieur avant de le déclarer validé.

## Distribution hors ligne : ce qui est confirmé et ce qui reste à qualifier

Les tests du contrat `scripts/windows/verify-offline-help.mjs` vérifient les 16 articles FR/EN et leurs index dans l'arborescence de distribution. Le packaging inclut les fichiers locaux et vérifie leur intégrité documentaire. Le fonctionnement hors ligne est donc **contrôlé automatiquement pour la présence et la lecture des ressources**, mais **pas encore qualifié par une recette Windows réelle sur un deuxième ordinateur sans accès Internet**.

D'autres preuves restent nécessaires avant de parler de recette complète : navigation authentifiée sous plusieurs rôles et modes Scrum/Kanban avec PostgreSQL réel, contrôle de l'absence d'écriture SQL pendant la consultation, rendu accessible avec zoom de 200 %, et disponibilité de toutes les pages après installation de la distribution.

## Procédure de maintenance pour Camille

1. Vérifier le `articleId` et les droits dans `src/lib/help-catalog.ts`.
2. Vérifier dans les composants métier et les tests **le comportement livré** ; enregistrer dans le rapport les sources, la date de consultation, le statut de preuve et les changements. Jira ne prouve pas à lui seul la livraison.
3. Modifier les fichiers FR/EN ciblés sans changer leur ID ni insérer de secret ou de donnée utilisateur réelle.
4. Garder les liens internes autorisés, générer les index, puis les contrôler.
5. Exécuter les tests du workflow Aide et la CI ; reporter les erreurs, la conclusion terminale et les limites de vérification sans annoncer une recette réelle non réalisée.

**Rapports BMAD :** `_bmad-output/test-artifacts/help/` ; architecture `_bmad-output/planning-artifacts/ux-designs/ux-aide-smn-2026-11-14/ARCHITECTURE-CAMILLE-SMN-470.md`.
