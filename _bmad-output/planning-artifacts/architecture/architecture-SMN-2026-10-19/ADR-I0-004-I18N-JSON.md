# ADR-I0-004 — Internationalisation centralisée dans des catalogues JSON

**Décision approuvée par l'utilisateur : 20 octobre 2026.**  
**Statut : ADOPTÉ — règle d'architecture transversale obligatoire pour toutes les Epics et Stories SMN.**  
**Nature :** amendement documentaire d'architecture, sans mise en œuvre ni recette dans cette intervention.  
**S'appuie sur :** FR-59, FR-63, FR-72, UX-DR12/14, D-PRD-127, AD-28/31 et [Story 1.14 — SMN-27](https://lmn24.atlassian.net/browse/SMN-27).

## Décision normative

1. **Une source unique de traduction par langue.** Tous les textes d'interface maintenus par SMN sont référencés par des clés sémantiques et définis dans **un fichier JSON par langue**. Structure cible validée : `src/i18n/fr.json` et `src/i18n/en.json`. Cette arborescence est une **cible de développement, pas une déclaration de fichiers déjà créés**.
2. **Aucun libellé utilisateur codé en dur dans les pages/composants.** Menus, titres, navigation, formulaires, boutons, aides, placeholders, états vides, notifications, validations, erreurs, confirmations, messages d'installation et d'administration utilisent des clés de traduction. Éviter les conditions de rendu de type `lang === "en" ? "..." : "..."` contenant du texte utilisateur. Seuls le contenu saisi par les personnes, les données externes non traduites et les noms propres/valeurs métiers ne sont pas des traductions statiques.
3. **Même contrat pour tous les supports.** Les libellés et rubriques standardisés des tableaux de bord, écrans Scrum et Kanban, calendriers, registres, rapports HTML/PDF, briefs TXT, archives et parcours de sauvegarde/restauration sont issus du même modèle de catalogues. Un document exporté respecte **sa langue de sortie sélectionnée** sans changer les textes métiers originaux ; le langage de l'interface et celui d'un export peuvent être distincts lorsque le besoin le prévoit.
4. **MVP français et anglais uniquement**, avec `fr` comme repli déterministe pour les clés absentes ou langues indisponibles. Les deux catalogues doivent partager la même structure et couvrir les mêmes clés ; les traductions manquantes sont détectées par les tests et ne font jamais apparaître de clés brutes ou chaînes techniques à l'écran. L'ajout futur d'une langue se fera par l'ajout d'un fichier JSON et sa déclaration explicite dans le registre des langues prises en charge, sans recopier les textes dans chaque page.
5. **Préférences persistées :** intégrer la valeur `locale` déjà sauvegardée par SMN-18 ; le mécanisme effectif de sélection et de rendu doit respecter la Story SMN-27, avec cohérence de la langue du document (`lang`), accessibilité/focus et conservation du choix. Aucune modification de la langue ne traduit ou ne modifie rétroactivement les commentaires, descriptions, objectifs, historiques, snapshots ou autres textes libres.
6. **Interpolation et sécurité :** utiliser des paramètres nommés pour les messages dynamiques (nombres, dates, nom de produit) avec échappement approprié, formatage localisé et **jamais** des erreurs SQL/brutes, secrets ou informations individuelles dans une traduction. Les clés de diagnostic techniques restent internes aux API ; seules leurs formulations visibles sont localisées.
7. **Conception, revue et tests requis :** chaque nouvelle Story ou modification d'écran doit identifier les clés nécessaires, alimenter `fr.json` et `en.json`, vérifier l'absence de textes visibles codés en dur, tester le changement de langue, la parité des clés, le repli, les erreurs, l'accessibilité et, lorsqu'applicable, l'export HTML/PDF/TXT. La centralisation est une **Definition of Done transversale**, sans être confondue avec une recette effectivement exécutée.
8. **Migration contrôlée :** l'existant contient `src/lib/messages.ts` (quelques traductions centralisées) et des textes directement dans les fichiers `src/app/**`. La mise en conformité est à planifier et développer dans **SMN-27** et ses tâches de migration, **pas lors de la présente décision documentaire**. Les nouvelles Stories de toutes les Epics respectent néanmoins ce contrat dès leur implémentation.

## Impact BMAD / Jira

- **Toutes les Epics SMN-1 à SMN-10** reçoivent un amendement transversal pointant ici, sans changement de portée métier, d'estimation, de rôle ou de statut.
- **Story SMN-27** porte la réalisation du socle centralisé, le passage des pages existantes aux clés, la sélection de langue à partir de la préférence, la stratégie de repli et les tests du socle. Les Stories métier à venir consomment ce socle.
- **Epic 6 / SMN-6** : même contrat pour les libellés des restitutions HTML/PDF ; pas de traduction automatique des textes libres.
- **Epic 9 / SMN-9** : libellés standard des briefs et de leur administration centralisés ; contenu libre inchangé.
- **Epic 10 / SMN-10** : preuves de tests fr/en et parité des clés dans la recette MVP.
- Les documents de référence `ARCHITECTURE-SPINE.md`, `epics.md`, `prd.md` et `docs/PROJECT-CONTEXT.md` portent l'arbitrage pour les agents BMAD (Analyst, PM, Architect, Scrum Master, Developer, QA).

## Critères de mise en œuvre à vérifier ultérieurement

- Un fichier **JSON indépendant par langue** et aucun catalogue de texte utilisateur dispersé en TSX ou JSX.
- Une clé donnée produit les libellés corrects en fr et en en, sans code conditionnel répétitif et sans textes techniques bruts.
- La préférence SMN-18 conduit au rendu voulu ; `fr` reste le repli déclaré et documenté.
- Les données libres restent inchangées et aucune migration/écriture d'historique n'est causée par le changement de langue.
- Les exports standard sont cohérents avec la langue de sortie demandée.
- Vérification automatique de présence/structure des clés et tests de la sélection, des erreurs et des parcours accessibles.

**État de preuve : décision/documentation publiées uniquement. Aucune création de catalogues JSON, traduction des pages, exécution de tests ou recette n'est revendiquée.**
