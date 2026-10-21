# SMN-51 — Story 3.10 : importer et sélectionner les jours fériés d'un fichier iCalendar (ICS)

**Jira** : https://lmn24.atlassian.net/browse/SMN-51 · Epic 3 · antécédents [SMN-48](https://lmn24.atlassian.net/browse/SMN-48) et [SMN-50](https://lmn24.atlassian.net/browse/SMN-50).

## Décisions fonctionnelles et techniques

- **AC1 — Lecture sans écriture :** écran Administration → Pays → Import ICS, choix explicite du pays, fichier local `.ics` UTF-8 (≤ 1 Mio). `POST /api/admin/countries/import-ics`, étape `inspect` : liste des événements `VEVENT` numérotés avec date, nom et diagnostic. L'analyse ne crée aucune date nationale.
- **AC2 — Sélection humaine :** tous les événements sont montrés, aucun précoché au chargement. L'Administrateur coche les seuls événements correspondant réellement à des jours fériés. Les événements non admissibles sont désactivés. Un second aperçu des **événements retenus** montre créés/remplacés/refusés et les raisons ; la confirmation est une opération distincte.
- **AC3 — Interprétation prudente :** seuls `DTSTART;VALUE=DATE:YYYYMMDD` de jour entier et éventuellement `DTEND;VALUE=DATE` correspondant précisément au **lendemain** (fin exclusive RFC 5545) sont admissibles. Sans `DTEND`, un jour entier s'étend par définition sur un jour. `RRULE`, `RDATE`, `EXDATE`, `RECURRENCE-ID`, `DURATION`, `STATUS:CANCELLED`, événements horaires, fuseaux `TZID`, dates impossibles et plages multi-jours sont refusés individuellement avec motif explicite. Aucune occurrence n'est générée artificiellement.
- **AC4 — Pays, conflits, journal :** pour la sélection admissible, génération interne d'un CSV conforme au schéma SMN, puis délégation au moteur transactionnel SMN-50. Politique `skip` par défaut ou `replace` explicite, doublons en fichier et en base, empreinte de confirmation réévaluée sous verrou, HTTP 409 si état différent. Seul le pays choisi est persisté. La migration additive v17→v18 élargit `smn_national_holiday_audit.origin` de `csv` à `csv|ics` sans toucher aux jours historiques, aux capacités figées ni aux PDF.
- **AC5 — Local uniquement :** le serveur n'effectue aucun `fetch` externe ; les URL d'abonnement, abonnements et synchronisations automatiques ne sont pas gérés. Le contrat de requête refuse les attributs supplémentaires, notamment `url`.

## Fichiers techniques

`src/server/holidays/ics-import.ts` : parseur iCalendar de sécurité, normalisation et sélection ;
`src/server/holidays/csv-import.ts` : origine paramétrée `csv` ou `ics` ;
`src/server/holidays/ics-migration.ts`, `prisma/migrations/20261021_smn51_national_holidays_ics/migration.sql` : schéma v18 ;
`src/app/api/admin/countries/import-ics/route.ts` : endpoint administrateur, validateur origine de requête et plafond de corps HTTP ;
`src/app/app/admin/countries/holiday-ics-import.tsx` : interface de sélection, aperçu, confirmation, bilan ;
`src/app/app/admin/countries/country-admin.tsx` : accès à la section ;
`src/i18n/fr.json` et `en.json` : libellés centralisés ;
`tests/holiday-ics-import.test.ts` : contrats de validation, non-régression et audit.

## Validation et limites

Les tests de contrat sont rédigés. Les contrôles statiques de cohérence sont réalisables depuis les connecteurs ; **pas de compilation, test pnpm, exécution PostgreSQL ni recette Windows attestés**. GitHub Actions n'est plus un outil de qualification dans SMN. Conserver la Story dans Jira **En cours** et le suivi BMAD sur `review` jusqu'à la recette pilote.

La procédure native de rendu du workflow BMAD (`uv run --no-cache ... render_skill.py`) ne peut pas être exécutée depuis les seuls connecteurs et sans checkout local : développement adapté par consultation des fichiers `SKILL.md` sur GitHub, sans prétendre à une exécution BMAD automatisée.
