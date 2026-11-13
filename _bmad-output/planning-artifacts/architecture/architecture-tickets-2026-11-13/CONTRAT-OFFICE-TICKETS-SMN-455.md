# SMN-455 — Contrat Office des photographies Tickets

Date : 13 novembre 2026. Statut : développement publié, qualification automatisée à confirmer.

## Dépendances et périmètre

Le Centre Rapports Office existant (Word DOCX / PowerPoint PPTX) conserve ses générateurs, son stockage et ses contrôles d'accès. Les tickets proviennent uniquement des fichiers CSV privés sélectionnés pour l'équipe et le sprint autorisés, jamais de PostgreSQL. Les calculs sont ceux de SMN-449/450/451. La génération Office courante est limitée aux sprints **Scrum** : le support Office Kanban ne doit pas être annoncé sans extension validée du moteur existant.

Le Centre Rapports > Modèles propose la photographie principale et, facultativement, une photographie **strictement antérieure** pour la comparaison. Les données ne sont lues que si le modèle demande une source ou un tag de provenance Tickets. Les références fournies contiennent la date métier, l'identifiant immutable de version et le SHA-256. Un fichier absent, remplacé ou dont l'empreinte diffère provoque un refus explicite. La génération n'interroge pas Jira et ne modifie aucun indicateur v33.

## Sources ROW acceptées dans Word et PowerPoint

Les champs sont à insérer dans la même ligne de tableau que le marqueur `{{ROW:SOURCE}}`, ou dans une zone de texte PowerPoint compatible :

| Source | Champs disponibles |
|---|---|
| `TICKETS` | `TICKET_ID`, `TICKET_TYPE`, `TICKET_TITLE`, `TICKET_PRIORITY`, `TICKET_STATUS`, `TICKET_SP` |
| `TICKET_SUMMARY` | `TICKET_COUNT`, `TICKET_COMPLETED`, `TICKET_SP_SUM`, `TICKET_SP_NUMERIC`, `TICKET_SP_MISSING`, `TICKET_SP_INVALID` |
| `TICKET_BY_TYPE` | `TICKET_GROUP_VALUE`, `TICKET_GROUP_COUNT` |
| `TICKET_BY_STATUS` | `TICKET_GROUP_VALUE`, `TICKET_GROUP_COUNT` |
| `TICKET_BY_PREFIX` | `TICKET_GROUP_VALUE`, `TICKET_GROUP_COUNT` |
| `TICKET_CHANGES` | `TICKET_ID`, `TICKET_CHANGE_TYPES`, `TICKET_OLD_TITLE`, `TICKET_NEW_TITLE`, `TICKET_OLD_STATUS`, `TICKET_NEW_STATUS`, `TICKET_OLD_SP`, `TICKET_NEW_SP`, `TICKET_FIELDS_CHANGED` |
| `TICKET_COMPARE_SUMMARY` | `TICKET_OLD_COUNT`, `TICKET_NEW_COUNT`, `TICKET_ADDED`, `TICKET_REMOVED`, `TICKET_COMPLETED`, `TICKET_REOPENED`, `TICKET_SP_CHANGED`, `TICKET_OTHER_CHANGED`, `TICKET_CHANGED_DISTINCT`, `TICKET_UNCHANGED` |

Les sept sources sont acceptées par les générateurs de tableaux Word et PowerPoint. `TICKET_SP_SUM` est `N/D` lorsqu'aucun Story Point numérique n'existe, et non zéro. Le nombre distinct de tickets modifiés n'est pas la somme des catégories.

Exemple : `{{ROW:TICKETS}}{{TICKET_ID}}` et `{{TICKET_TITLE}}` dans les cellules de la ligne. Un tri du type `{{ROW:TICKETS|SORT=TICKET_ID:ASC}}` utilise les règles de tri Office existantes.

## Provenance

Les tags scalaires optionnels suivants sont disponibles quand une sélection Tickets a été fournie :
`{{TICKET_SOURCE_DATE}}`, `{{TICKET_SOURCE_ID}}`, `{{TICKET_SOURCE_SHA256}}`, `{{TICKET_SOURCE_IMPORTED_AT}}`, `{{TICKET_PREVIOUS_DATE}}`, `{{TICKET_PREVIOUS_ID}}`, `{{TICKET_PREVIOUS_SHA256}}`.

Ces champs sont également injectés dans les lignes de sources Tickets. Un modèle qui n'utilise qu'un tag de provenance déclenche lui aussi la vérification de source. Aucune provenance n'est inventée si le CSV est absent.

## Sécurité et fichiers produits

Le endpoint `/api/admin/reports/office-templates/generate` valide le modèle et l'accès à l'équipe/sprint par le mécanisme SMN existant avant lecture des fichiers. Les exports Tickets sauvegardés sur le serveur utilisent obligatoirement un **nom encore libre** ; un ancien rapport n'est pas remplacé, même après confirmation d'écrasement. Les téléchargements conservent le mécanisme Office existant.

Les moteurs `generateWordTables`, `generatePowerPointTables` et `generateScalarOffice` restent les générateurs de référence.

## Recette restant à réaliser

- `pnpm exec tsx --test tests/smn-455-office-tickets.test.ts`
- `pnpm typecheck` ; `pnpm lint`
- Génération de vrais DOCX/PPTX avec tableaux et tags scalaires, vérifiée dans Word et PowerPoint
- Tests des sources manquantes, fichiers remplacés, archives corrompues et autorisations
- Test non-écrasement avec nom déjà présent, puis nouveau nom
- Vérification d'absence d'écriture v33
