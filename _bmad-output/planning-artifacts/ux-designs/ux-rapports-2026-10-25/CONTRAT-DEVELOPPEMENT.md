# SMN — Contrat de développement de la refonte Studio de rapports

**Agent ciblé :** Amelia — BMAD v6.12.4 · **Date :** 2026-10-25 · **Epic :** [SMN-228](https://lmn24.atlassian.net/browse/SMN-228)

## 1. Sources de vérité et ordre de priorité

1. Sources métier réelles et contrats déjà validés de l'Epic 6 : SMN-113 à SMN-135, snapshots Vn, protections admin/user et règles des indicateurs.
2. Ce lot UX : [DESIGN.md](DESIGN.md) — aspect, [EXPERIENCE.md](EXPERIENCE.md) — comportements, synthèse des 21 décisions ; ces contrats prévalent sur le prototype illustratif.
3. Stories [SMN-254 à SMN-269](DECOUPAGE-JIRA.md), leurs critères d'acceptation et [RECETTE-UX.md](RECETTE-UX.md) ; divergences documentées et soumises au commanditaire.
4. Référentiel transversal [docs/UX-REFERENTIEL-BMAD.md](../../../../docs/UX-REFERENTIEL-BMAD.md), PRD, architecture et règles actuelles. Une maquette ne justifie jamais d'altérer le métier.

## 2. Étape initiale obligatoire — SMN-254

Avant toute migration ou nouveau composant, inspecter sur `main` : modèles de rapport, snapshots et archives, routes/API, tables et migrations PostgreSQL, droits, schémas de sections/blocs, provenance des métriques, rendu HTML/PDF et tests. Documenter une matrice *existant / à conserver / à étendre / risques de régression*. Identifier les scénarios d'installation vierge et de migration des données existantes ; prévoir une stratégie réversible/cohérente. Ne pas réécrire les archives.

Si une incertitude touche au contrat métier, demander arbitrage **avant** mutation irréversible ; sinon développer la plus petite tranche vérifiable, sans inventer d'état serveur ni route factice. Ne pas déclarer SMN-254 terminée sur la seule existence d'une migration.

## 3. Lots de réalisation et portes de validation

| Vague | Stories | Produit vérifiable | Gate |
|---|---|---|---|
| S0 | [SMN-254](https://lmn24.atlassian.net/browse/SMN-254) | Schéma/contrat d'indépendance + compatibilité archives | Tests migration, admin/user, rapports A/B |
| S1 | [SMN-255](https://lmn24.atlassian.net/browse/SMN-255), [SMN-256](https://lmn24.atlassian.net/browse/SMN-256) | Centre contextuel et modèles système/personnalisés | États vides, filtres, droits, réutilisation Epic 6 |
| S2 | [SMN-257](https://lmn24.atlassian.net/browse/SMN-257), [SMN-258](https://lmn24.atlassian.net/browse/SMN-258) | Version de modèle épinglée et création préremplie | Deux rapports indépendants, valeurs nulles/provenance |
| S3 | [SMN-259](https://lmn24.atlassian.net/browse/SMN-259), [SMN-260](https://lmn24.atlassian.net/browse/SMN-260), [SMN-263](https://lmn24.atlassian.net/browse/SMN-263) | Studio fonctionnel, blocs, sauvegarde | Undo/redo session, dernier enregistrement gagnant, ordre des requêtes |
| S4 | [SMN-261](https://lmn24.atlassian.net/browse/SMN-261), [SMN-262](https://lmn24.atlassian.net/browse/SMN-262), [SMN-264](https://lmn24.atlassian.net/browse/SMN-264), [SMN-265](https://lmn24.atlassian.net/browse/SMN-265) | KPI fidèles, rédaction/IA externe, fraîcheur, charte | Sources, historiques, sélection IA volontaire, A4 unique |
| S5 | [SMN-266](https://lmn24.atlassian.net/browse/SMN-266), [SMN-267](https://lmn24.atlassian.net/browse/SMN-267), [SMN-268](https://lmn24.atlassian.net/browse/SMN-268) | Pagination, qualité non intrusive, export et gel | Aucun tableau coupé, PDF direct, archives immuables |
| S6 | [SMN-269](https://lmn24.atlassian.net/browse/SMN-269) | Recette responsive/a11y/i18n + non-régression | Revue desktop/tablette/mobile, FR/EN, droits, 33 cas |

Les vagues ne constituent pas des sprints calendaires ; une Story peut être replanifiée sans modifier son contrat. Les contrôles FR/EN, accessibilité et autorisations sont **transversaux dès S0**, pas reportés exclusivement à S6.

## 4. Règles UX non négociables

- Un Sprint peut avoir plusieurs brouillons distincts ; un changement de modèle/rubrique/commentaire sur A n'impacte pas B.
- Modèles système protégés ; versions de modèles volontaires ; préremplissage sans valeur inventée.
- Édition hybride trois modes, panneau plan / document / propriétés, avec alternatives clavier au déplacement.
- Graphique, tableau ou mixte ; historiques fiables et unités explicites ; IA sur page de briefs séparée et insertion volontaire seulement.
- Sauvegarde auto **sans snapshots intermédiaires** ; **dernier enregistrement accepté** entre sessions (perte possible), mais ordre monotone des modifications issues d'une même session.
- Sources mises à jour sur confirmation après comparaison ; ne jamais écraser commentaire/IA ; pas d'actualisation automatique d'autres rapports ou archives.
- A4 portrait **ou** paysage par document, jamais mixte ; couverture et sommaire personnalisables sans modifier le modèle partagé.
- Longues tables réparties avec en-têtes ; éléments indivisibles maintenus ; aucune donnée masquée automatiquement.
- Contrôle qualité automatique non intrusif ; avertissements non bloquants, erreurs techniques bloquantes ; PDF direct sans archivage, gel/archivage volontaire indépendant.
- Desktop plein studio, tablette édition complète par panneaux escamotables, mobile lecture/commentaires/corrections légères et export.

## 5. Stratégie technique à décider par Amelia, sans préjuger de l'existant

- Réutiliser l'existant Next.js/React/Bootstrap, contrats JSON FR/EN, PostgreSQL, génération PDF et API du reporting. Vérifier avant de prescrire de nouvelles tables, packages, dépendances ou routes.
- Audit de fraîcheur : identifier la signature/version des producteurs réellement disponibles ; ne pas promettre un diff exact sans provenance attestée.
- PDF : éprouver le CSS `@page`, l'impression des tableaux et le sommaire ; un rendu HTML qui semble correct ne suffit pas.
- Risque assumé : dernier enregistrement prioritaire entre sessions. Séquencer le client pour éviter des réponses périmées de la **même session** ; ne pas ajouter de verrou, fusion ou historique durable non validé.
- Ne pas masquer les données individuelles sensibles par simple CSS : filtrage côté projection/API et droits serveur.
- Les anciennes URLs fonctionnelles restent opérationnelles durant la bascule ; aucune désactivation avant tests de parité.

## 6. Gates de recette, preuves et statuts

Livrer **une Story à la fois** ou un incrément explicitement regroupé : modifications de fichiers identifiées, migration contrôlée, tests ciblés, `pnpm typecheck`, `pnpm build`, tests existants, revue manuelle et compte rendu de ce qui a réellement été exécuté. Les commandes impossibles doivent être signalées comme non exécutées. GitHub Actions est désactivé ; ne pas la présenter comme vérification.

**Statut documentaire :** choix UX et synthèse validés ; maquettes démonstratives, ajustements visuels finaux non approuvés au pixel ; implémentation et recette non attestées. Ne pas marquer Jira Done avant validation des AC.
