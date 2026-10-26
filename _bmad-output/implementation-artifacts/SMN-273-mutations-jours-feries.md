# SMN-273 — Mutations manuelles des jours fériés nationaux

**Statut : code publié sur branche, non testé en intégration, non fusionné.**

## Références

- Jira : https://lmn24.atlassian.net/browse/SMN-273
- Base technique : `feat/smn-272-country-calendar-modal` (PR #192), issue de SMN-271 / SMN-270.
- Nouvelle branche : `feat/smn-273-manual-national-holidays`.

## Décisions de référence

- Calendriers nationaux uniquement, administrateur seulement.
- Couverture technique et validation administrative sont **distinctes**. Une modification réussie annule l'attestation administrative de toutes les années touchées, sans effacer par principe le statut de couverture historiquement `configured` utilisé par les capacités.
- Année sans aucun jour férié après suppression / déplacement : **Non configuré**, validation future interdite.
- Une correction de date traversant deux années invalide les attestations des **deux années**, et se fait dans une transaction unique.
- Les historiques et snapshots de capacités, rapports PDF et membres ne sont jamais réécrits par ces opérations.

## Contrat d'API

`POST /api/admin/countries/{code}/holidays`, corps JSON :

```json
{
  "action": "create",
  "date": "2026-05-01",
  "name": "Fête du Travail",
  "reason": "Correction du calendrier national",
  "expectedYears": {"2026": "<empreinte_sha256_de_la_lecture_annuelle>"}
}
```

- `action=update` : fournir `originalDate`, `date`, `name`, `reason`, `expectedYears` de toutes les années touchées. Une correction uniquement de libellé conserve `date=originalDate`.
- `action=delete` : fournir `originalDate`, `reason`, `expectedYears` de son année.
- `expectedYears` provient de `GET /api/admin/countries/calendar?country={code}&year={annee}` (champ `fingerprint`, plus `revision` et `status`). **Ne pas fabriquer l'empreinte côté client.**
- Réponse succès : `{ok:true,years:[{year,revision,status,count}]}`. Une modification sans effet retourne `years:[]`.
- Réponses d'échec : `invalid-input` (400), `forbidden` (403), `country-not-found` / `not-found` (404), `country-archived` / `date-conflict` / `conflict` (409), `service-unavailable` (503). Aucune erreur SQL renvoyée au client.

## Détails de l'implémentation

| AC | Fichiers et garanties |
| --- | --- |
| AC1 | `src/server/holidays/manual.ts` + `src/app/api/admin/countries/[code]/holidays/route.ts` : action explicite create/update/delete, contrôle date ISO réelle, pays ISO connu et non archivé, intitulé 1–120 caractères, motif requis. Pas de données régionales. |
| AC2 | Verrouillage transactionnel aligné sur préchargement/import CSV (verrous advisory 49 et 50), verrou du pays `FOR UPDATE`, contrôle unique pays/date ; correction de date atomique et annulation de toute la transaction en conflit. |
| AC3 | Couverture technique préservée si année toujours renseignée ; passage `not-configured` si elle est vidée. Colonnes `administrative_validated_at` et `validated_revision` remises à NULL pour chaque année réellement mutée. La validation explicite complète viendra dans SMN-275. |
| AC4 | `smn_national_calendar_coverage.revision` incrémentée par année manuellement modifiée, empreinte SHA-256 des dates/noms/statut/révision vérifiée avant chaque mutation. `smn_national_holiday_manual_audit` conserve acteur, horodatage, action, anciennes/nouvelles dates et noms, motif. |
| AC5 | Référence pays/code et membres conservées ; aucune écriture de snapshots ou rapports ; les lectures dynamiques existantes consultent les dates actualisées. |
| AC6 | Une année vidée vaut `Non configuré`, explicitement jamais « zéro férié confirmé ». Le champ d'attestation devient nul. |

### Migrations et préchargement

- `src/server/holidays/manual-migration.ts` : ajout différé, idempotent, sous verrou PostgreSQL, de `smn_country.archived_at`, des colonnes `revision`, `administrative_validated_at` et `validated_revision` dans `smn_national_calendar_coverage`, et création de l'audit manuel.
- `prisma/schema.prisma` aligné sur ces objets ; `src/server/installation/contract.ts` inscrit la nouvelle table dans la liste blanche strictement contrôlée.
- Lors d'un changement manuel, `source_file='manual'` dans la couverture. `src/server/holidays/preload.ts` saute les années marquées `manual`, afin de **ne pas réintroduire** un jour explicitement supprimé via le jeu local FR/DE/GB.
- Le GET existant de lecture annuelle prépare ce schéma additif avant de renvoyer `fingerprint`, `revision` et les dates.
- Les imports CSV/ICS restent inchangés dans cette story. Une empreinte de calendrier devenue obsolète (y compris après import) est refusée. L'invalidation d'une **validation administrative déjà attestée** par un import sera à intégrer à la story d'attestation (SMN-275), avant que de telles validations soient activées.

**Point d'attention :** la colonne `archived_at` est préparée maintenant pour refuser une mutation d'un pays archivé, mais l'archivage/réactivation réel reste entièrement réservé à SMN-279/280.

## Tests et recette Windows

Tests **écrits mais non exécutés** :
- `tests/national-holiday-manual.test.ts` : validation des entrées, conflit de dates, transfert sur deux années, année vidée, transaction/audit, concurrence par empreinte et pays archivé.
- `tests/national-holidays.test.ts` : protection des années modifiées manuellement contre les préchargements répétés.

**Aucun test d'application ni build réalisé via GitHub.** Comme décidé, l'utilisateur exécutera `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et la recette PostgreSQL sur son poste Windows. La base et ses références doivent être sauvegardées avant la première ouverture de cette branche (extension automatique additive au premier accès GET calendrier).

Recette API recommandée : obtenir une empreinte via GET sur une année réelle puis vérifier successivement ajout, renommage, déplacement interannuel, retrait de la dernière date, conflit avec un autre navigateur/import, refus non-admin et maintien des historiques. L'éditeur utilisateur sera introduit dans **SMN-274** ; il n'y a donc pas encore de boutons de mutation sur la page.

## Adaptation BMAD

Skill officiel Amelia lu ; le workflow `bmad-build` requiert le renderer `uv` et un checkout complet, non disponibles dans cette session connecteur. Son exécution officielle n'est **pas revendiquée**. Développement manuel via API GitHub, sans vérification exécutée. Conserver Jira En cours et PR brouillon jusqu'aux résultats de recette.
