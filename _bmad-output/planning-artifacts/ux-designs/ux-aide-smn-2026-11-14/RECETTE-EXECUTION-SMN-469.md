# SMN-469 — Matrice de recette et relevé des preuves

## Périmètre et honnêteté des résultats

Ce registre documente la traçabilité des 30 contrôles de la spécification `RECETTE-UX.md`. **La présence d'un test dans GitHub ne prouve pas son exécution ni sa réussite.** La colonne « État réel » reste **Non attesté** tant qu'un run vert du commit concerné ou une preuve manuelle horodatée n'est pas disponible. Ne pas confondre test de composant isolé, test HTTP serveur, test PostgreSQL et recette du ZIP réellement installé.

Workflow automatisé : [SMN-469 — Recette Aide FR-EN et hors ligne](https://github.com/JeanLamora75/SMN/actions/workflows/help-quality.yml).

## HELP-01 à HELP-30

| ID | Contrôle automatisé déclaré (fichier dans `tests/`) | Preuve de recette complémentaire attendue | État réel |
|---|---|---|---|
| HELP-01 | smn-461-help-center.test.ts | Sidebar réduite à contrôler en navigateur réel | Non attesté |
| HELP-02 | smn-459-help-catalog.test.ts / smn-469-help-contract.test.ts | Compte réel non-admin à vérifier | Non attesté |
| HELP-03 | smn-461-help-center.test.ts | Capture desktop Cockpit et CSS réel à obtenir | Non attesté |
| HELP-04 | smn-462-help-search.test.ts / smn-469-help-contract.test.ts | Recherche dans application authentifiée à vérifier | Non attesté |
| HELP-05 | smn-466-help-first-setup.test.ts / smn-467-help-guides.test.ts | Vérifier les actions avec utilisateur réel | Non attesté |
| HELP-06 | smn-464-help-header.test.ts | Placement des actions sur écran réel à vérifier | Non attesté |
| HELP-07 | smn-463-help-context-dialog.test.ts / smn-469-help-browser.test.ts | Valider la bonne correspondance article-écran réel | Non attesté |
| HELP-08 | smn-463-help-context-dialog.test.ts / smn-469-help-browser.test.ts | Piège Tab et Shift+Tab manuel ou scénario additionnel | Non attesté |
| HELP-09 | smn-464-help-browser.test.ts / smn-469-help-browser.test.ts | Scénario double modale réel à vérifier | Non attesté |
| HELP-10 | smn-467-help-guides.test.ts / smn-469-help-contract.test.ts | Même chargeur vérifié structurellement | Non attesté |
| HELP-11 | smn-465-help-checklist.test.ts / smn-465-help-checklist-browser.test.ts | Étiquettes et prérequis à valider visuellement | Non attesté |
| HELP-12 | smn-465-help-checklist.test.ts | Parcours navigation réelle à vérifier | Non attesté |
| HELP-13 | smn-465-help-checklist-browser.test.ts | Échec quota Chromium requis | Non attesté |
| HELP-14 | smn-465-help-checklist-browser.test.ts | Reconnexion réelle et remise à zéro globale à vérifier | Non attesté |
| HELP-15 | smn-469-help-contract.test.ts | Équipe Scrum/Kanban réelle à vérifier | Non attesté |
| HELP-16 | smn-469-help-contract.test.ts | Journal SQL et preuve absence d'écriture en base réelle à obtenir | Non attesté |
| HELP-17 | smn-469-help-contract.test.ts / smn-462-help-search.test.ts | Rejeu auth session réelle requis | Non attesté |
| HELP-18 | smn-460-help-content.test.ts / smn-463-help-context-dialog.test.ts | Indisponibilité réseau de serveur local à tester | Non attesté |
| HELP-19 | smn-469-help-browser.test.ts | Palettes, 200 % zoom, tablette et captures manuelles à obtenir | Non attesté |
| HELP-20 | smn-468-offline-help.test.mjs | Vérifier second PC réseau externe coupé | Non attesté |
| HELP-21 | smn-469-help-contract.test.ts | Audit SQL réel de consultation et checklist à obtenir | Non attesté |
| HELP-22 | smn-465-help-checklist-browser.test.ts | Reconnexion et autre PC à vérifier | Non attesté |
| HELP-23 | smn-465-help-checklist-browser.test.ts | Refus de quota contrôlé par navigateur | Non attesté |
| HELP-24 | smn-467-help-guides.test.ts / smn-468-offline-help.test.mjs | Vérifier absence d'ajout aux catalogues i18n | Non attesté |
| HELP-25 | smn-463-help-context-dialog.test.ts / smn-469-help-browser.test.ts | Mesure réelle du bundle initial à obtenir | Non attesté |
| HELP-26 | smn-462-help-search.test.ts / smn-469-help-contract.test.ts | Profil réseau navigateur et absence DB à instrumenter | Non attesté |
| HELP-27 | smn-460-help-content.test.ts / smn-467-help-guides.test.ts | Traductions futures à qualifier | Non attesté |
| HELP-28 | smn-468-offline-help.test.mjs et Windows portable-package.yml | ZIP installé et recherche+modale hors Internet à tester | Non attesté |
| HELP-29 | smn-460-help-content.test.ts / smn-463-help-context-dialog.test.ts | Vérifier bannière de repli en navigateur | Non attesté |
| HELP-30 | smn-465-help-checklist.test.ts / smn-469-help-contract.test.ts | Inspecter localStorage navigateur réel | Non attesté |

## HELP-AD-01 à HELP-AD-08

Les huit contrats de l'architecture Aide doivent faire l'objet d'un contrôle croisé avec `ARCHITECTURE-AIDE.md` : séparation contenu/locale, absence d'écriture PostgreSQL, `localStorage` versionné, permissions, mode, chargement à la demande, ZIP offline et observabilité des erreurs. **Revue architecturale non exécutée : résultat à vérifier.**

## Recette manuelle d'intégration nécessaire

1. Sur deux profils authentifiés **administrateur** et **utilisateur**, sélectionner alternativement une équipe **Scrum** et une équipe **Kanban**. Relever pour chacun la page, les articles accessibles, la recherche et le nombre d'étapes applicables.
2. Ouvrir une aide contextuelle depuis un formulaire modifié non enregistré ; vérifier titre, article, focus initial, Tab, Shift+Tab, Escape, restitution du focus, valeur du brouillon et filtres après fermeture ; ne pas ouvrir deux modales.
3. Tester deux locales (FR, EN), clair/sombre, les palettes Cockpit disponibles, largeur desktop/tablette/mobile, zoom 200 %, absence de scroll horizontal, lisibilité et captures.
4. Dans un navigateur vierge, constater l'absence d'étape terminée ; déclarer manuellement une étape, actualiser et se reconnecter. Simuler l'indisponibilité/quota du stockage et confirmer que la dernière valeur persistée reste affichée.
5. Instrumenter les requêtes **PostgreSQL réelles** et l'onglet Réseau durant la consultation du Centre d'aide et de la checklist. Aucune écriture SQL ou API mutante ne doit être causée par le module Aide (les actions métier restent autorisées).
6. Mesurer les **octets JS effectivement transférés au premier affichage** du Centre d'aide et confirmer que les corps Markdown et locales non demandées ne sont pas transférés. Consigner le HAR ou mesure équivalente : aucun seuil n'est revendiqué sans résultat réel.
7. Installer le **ZIP Windows réel**, démarrer SMN, couper Internet externe, puis vérifier Centre d'aide, recherche, FAQ, article FR/EN et modale en session. Consigner le commit et la version du ZIP, les fichiers `app/content/help/fr`, `en`, `.index` et les captures. **Ne pas réutiliser une preuve de simple répertoire temporaire.**

## Commandes reproductibles sans uv

- `pnpm exec tsx --test tests/smn-469-help-contract.test.ts tests/smn-469-help-browser.test.ts`
- `pnpm exec tsx --test tests/smn-459-help-catalog.test.ts tests/smn-460-help-content.test.ts tests/smn-461-help-center.test.ts tests/smn-462-help-search.test.ts tests/smn-463-help-context-dialog.test.ts tests/smn-464-help-header.test.ts tests/smn-465-help-checklist.test.ts tests/smn-466-help-first-setup.test.ts tests/smn-467-help-guides.test.ts`
- `node --test tests/smn-468-offline-help.test.mjs`
- `node scripts/build-help-index.mjs --check`
- `pnpm typecheck && pnpm build`

Les commandes ci-dessus sont **proposées à la reproductibilité**, pas présentées comme exécutées localement. Les résultats GitHub Actions sont la référence d'exécution lorsqu'ils seront disponibles.

## Critères d'entrée en Done

Aucun contrôle applicable avec preuve manquante ou test rouge ; typecheck/build réussis ; ZIP vérifié et réellement installé ; captures/thèmes/permissions et mesure de chargement consignées. Une CI en cours, annulée ou rouge interdit le statut « terminé ».
