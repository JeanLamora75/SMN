# SMN-275 — Validation annuelle explicite, versionnée et auditée

**Statut : code proposé en branche, aucun test d'exécution ni recette locale réalisé, non fusionné.**

## Références

- [SMN-275](https://lmn24.atlassian.net/browse/SMN-275)
- Branche : `feat/smn-275-annual-validation`.
- Branche de base : `feat/smn-274-holiday-editor` (PR #194), dépendant de SMN-273, 272, 271 et 270.
- Référentiel : `docs/UX-REFERENTIEL-BMAD.md`.
- Skill Amelia : `.agents/skills/bmad-agent-dev/SKILL.md`. Lecture directe depuis GitHub ; pas d'exécution de `uv` ni d'un workflow CLI officiel (checkout complet absent).

## Conception fonctionnelle

Une **couverture technique** (préchargement/import, y compris le statut historique `configured`) est différente d'une **attestation administrative**. Une année n'est affichée **« Configuré »** dans l'interface que si l'attestation concerne la révision actuelle du calendrier. Les anciens calendriers préchargés ou importés restent **« À vérifier »** tant que personne ne les a explicitement validés.

L'année vidée de ses dates devient **« Non configuré »**, jamais zéro férié confirmé. Les calendriers invalides ne peuvent pas être validés. Après correction manuelle, une année initialement invalide repasse à **partielle / À vérifier**, sans validation automatique ; il faut toujours un acte administratif explicite.

Les choix d'anomalies ci-dessous constituent le **contrat de départ proposé pour l'acceptation fonctionnelle** ; ils doivent être vérifiés pendant la recette.

| Anomalies bloquantes | Avertissements non bloquants |
| --- | --- |
| Pays archivé, année sans aucune date, couverture technique invalide, date impossible/hors de l'année, nom vide/invalide, date en doublon, incohérence entre nombre enregistré et compteur de couverture | Provenance/source manquante, remarque technique de couverture, caractère national seulement, impossibilité de démontrer automatiquement la complétude à partir du nombre de jours |

Le diagnostic contient `count` (nombre exact de dates), `status` technique, `source` (provenance enregistrée), `revision`, `fingerprint`, `blocking` et `warnings`. Chaque anomalie comporte un `code`, une `severity` et éventuellement une `details`.

## API : lecture et certification

**GET** `/api/admin/countries/{code}/calendar/validate?year=2026`

- Autorisation : rôle admin et lecture des paramètres (`settings/read`), contrôlée côté serveur.
- Retour : `{diagnostic:{country,year,count,status,source,revision,fingerprint,blocking,warnings,administrativeValidated,archived}}`.
- Aucune attestation automatique, aucune mutation de dates au GET. Les colonnes de schéma sont créées additivement si nécessaires.

**POST** `/api/admin/countries/{code}/calendar/validate`

```json
{
  "year": 2026,
  "fingerprint": "<empreinte SHA-256 obtenue depuis GET>",
  "confirmComplete": true,
  "source": "manual-review"
}
```

- L'administrateur affirme explicitement avoir contrôlé la **complétude nationale** de cette année.
- Un faux `confirmComplete`, une empreinte malformée, une source arbitraire ou un champ supplémentaire est refusé 400.
- Pays inconnu → 404 ; empreinte obsolète → 409 et **diagnostic actuel** ; anomalie bloquante → 422 avec diagnostic ; erreur serveur → 503.
- Succès 200 : `{ok:true,unchanged:false,diagnostic:<état actualisé>}`. Une attestation déjà courante rend `unchanged:true` sans audit supplémentaire.
- La transaction acquiert les mêmes verrous consultatifs que les imports et mutations manuelles, contrôle la révision et les dates, met la couverture technique à `configured`, enregistre révision validée, acteur, date et source, puis inscrit l'audit de validation dans **le même commit**.
- Aucun traitement des membres, snapshots de sprint ou PDF clôturés.

## Invalidation automatique des attestations

- **Édition manuelle SMN-273** : uniquement après changement réel des jours, mettre `administrative_validated_at`, `validated_revision`, `validated_by`, `validation_source` à NULL ; incrémenter `revision` par année réellement affectée ; une attestation précédemment courante génère un événement d'audit `invalidate/manual`.
- **CSV et ICS SMN-50/51** : mêmes règles par année réellement créée/remplacée, avec audit `invalidate/csv` ou `invalidate/ics`. Un aperçu, une ligne rejetée, un import sans changement ou un fichier identique **n'invalident pas**.
- **Préchargement local FR/DE/GB** : ignorer entièrement une année qui porte une attestation courante, ainsi que les années précédemment protégées par une mutation manuelle ; éviter de réintroduire des dates retirées.
- Conservation du statut technique `configured` après mutation d'une année autrefois attestée **si l'année demeure non vide**, afin de ne pas rompre la lecture technique historique utilisée par la capacité ; le **badge administratif** redevient « À vérifier ». Une nouvelle attestation est toujours explicite.
- Les simples lectures, annulations, erreurs et sauvegardes sans effet ne changent pas l'attestation.

## Schéma additif / audit

- `src/server/holidays/validation-migration.ts` : extension idempotente de `smn_national_calendar_coverage` avec `validated_by` et `validation_source`.
- Table `smn_national_calendar_validation_audit` : pays/année/action `validate|invalidate`/révision/empreinte/acteur/source/horodatage.
- `src/server/holidays/validation-audit.ts` : invalidations partagées, écrites dans la transaction métier.
- `prisma/schema.prisma` : modèle + relations Account/Country, colonnes de validation.
- `src/server/installation/contract.ts` : nouvelle table reconnue comme appartenant à SMN.
- Aucun changement de version initiale du schéma ni suppression de données ; extension à première utilisation.
- Une **sauvegarde PostgreSQL est recommandée avant le premier démarrage** de la chaîne de branches SMN-270..275.

## Fichiers développés ou modifiés

- Nouveau : `src/server/holidays/annual-validation.ts`
- Nouveau : `src/server/holidays/validation-migration.ts`
- Nouveau : `src/server/holidays/validation-audit.ts`
- Nouveau : `src/app/api/admin/countries/[code]/calendar/validate/route.ts`
- Modifiés : `src/server/holidays/manual.ts`, `csv-import.ts`, `preload.ts`, `prisma/schema.prisma`, `src/server/installation/contract.ts`.
- Tests nouveaux : `tests/national-calendar-validation.test.ts`.
- Tests de non-régression adaptés/complétés : `tests/national-holidays.test.ts`, `tests/holiday-csv-import.test.ts`.

## Vérifications effectuées / non effectuées

- **Contrôle statique des sources GitHub uniquement** : présence des garde-fous de confirmation, anomalies structurées, comparaison d'empreinte, autorisation admin, audit, invalidation d'import sur années touchées, protection du préchargement et relations Prisma.
- **Aucun test exécuté** : ni GitHub Actions, ni `pnpm lint`, ni `pnpm typecheck`, ni `pnpm test`, ni `pnpm build`, ni recette navigateur/PostgreSQL.
- L'interface de **confirmation** et ses traductions sont livrées dans **SMN-276**. SMN-275 livre intentionnellement les **contrats serveur** et le diagnostic pour SMN-276.
- SMN-275 reste **En cours** et la PR demeure **brouillon** tant que la recette locale de la chaîne n'est pas attestée.

## Recette Windows 11 proposée

1. Sur GitHub Desktop, sélectionner `feat/smn-275-annual-validation` après sauvegarde de la base portable ; démarrer SMN normalement. Cette branche contient SMN-270 à SMN-274.
2. Sur un pays configuré par import/preload, constater un statut initial **À vérifier**. Lire le diagnostic GET et ses avertissements.
3. Vérifier qu'une année sans jours est bloquée 422 ; qu'un calendrier invalide ou dont le compteur est incohérent est bloqué.
4. Vérifier qu'un utilisateur non administrateur reçoit 403 pour la lecture du diagnostic et le POST.
5. Vérifier les refus 400 sans confirmation explicite, et 409 pour une empreinte obsolète après modification concurrente.
6. Valider explicitement une année complète (sans anomalies bloquantes) : badge **Configuré**, acteur/date/source/révision dans la base, audit append-only ; rejouer l'appel identique et constater l'idempotence.
7. Modifier une fête via la modale SMN-274 : badge revenu **À vérifier** ; audit d'invalidation ; annuler une édition sans effet. Supprimer la dernière date : **Non configuré**.
8. Réattester puis importer un CSV/ICS identique : attestation conservée ; importer une vraie modification : attestation perdue sur l'année concernée uniquement, audit source CSV/ICS.
9. Réattester un millésime FR et lancer le préchargement : les dates attestées ne sont ni réinsérées ni remplacées.
10. Vérifier que les snapshots de sprint et rapports clôturés sont inchangés ; exécuter localement `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` et transmettre tout diagnostic.

**Aucune fusion de cette PR ni clôture Jira avant recette locale.**
