# Consolidation 02 — Audit statique TypeScript (première passe)

## Points vérifiés
- `src/i18n/client.tsx` expose bien `useTranslation` et les traductions sont déclarées dans les catalogues FR/EN.
- `prepareSprintReport` expose `projection.scrum`, `source` et `snapshotVersion`, utilisés à la création des brouillons.
- La structure des rubriques créée par `defaultSectionOptions` correspond aux champs `key` et `visible` attendus par le Studio.
- Contrôle des contrats des routes PATCH de brouillon, comparaison des métriques, PDF et modèles.

## Correctifs publiés
- Typage explicite de `FormEvent<HTMLFormElement>` dans `new-report-form.tsx`.
- Typage de l'intercepteur des requêtes Chrome dans `studio-pdf-render.ts`.
- Protection contre un contenu de document non objet à l'entrée du moteur HTML/PDF.

## Validation non obtenue
Cet audit est une lecture statique ciblée, **pas un résultat de compilation**. Aucun `pnpm typecheck`, `pnpm build`, test automatisé, PostgreSQL ni rendu PDF réel exécuté. L'environnement ne permet pas d'accéder directement au dépôt local ; les modifications sont faites via le connecteur GitHub.

## Anomalies de fond toujours ouvertes
- Coordination complète de l'export PDF avec les dernières modifications du Studio non sauvegardées.
- Fidélité graphique, tableaux et images du rendu PDF ; numéros de pages.
- Contrôle de sécurité/droits et validation serveur détaillée des blocs.
- Recette responsive et accessibilité à 200 %.
- Suite de PR empilées #146 à #162 non fusionnées.

**Statut : étape incrémentale, aucune validation de Story ni fusion dans main.**
