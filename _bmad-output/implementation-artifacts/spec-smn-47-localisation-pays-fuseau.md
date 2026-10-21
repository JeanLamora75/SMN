# SMN-47 — Story 3.6 : Localiser un membre par pays et fuseau horaire

**Jira :** https://lmn24.atlassian.net/browse/SMN-47 · **Epic :** SMN-3 · **PRD :** FR-9, FR-8, FR-61 ; D-PRD-014/021/137 ; AD-12/14/31.

## Décisions et périmètre

L'identité métier `smn_member.id` représente une personne **distincte du compte utilisateur**. Le MVP ne possède qu'une équipe Scrum/Kanban. Une localisation se rattache directement à cette identité et ne modifie ni la langue d'interface `smn_general_settings.locale`, ni les calendriers hebdomadaires, ni les affectations d'autres membres.

Aucune dépendance bloquante au catalogue de pays SMN-48 : un code de pays à deux lettres est contrôlé et utilisable avant la mise à disposition du catalogue administrable. Les pays/régions de type `EU`, `ZZ` et autres regroupements géographiques ne sont pas traités comme des pays ISO attribués. La liste suggérée de fuseaux n'est **pas** exhaustive, la validation réelle utilise les zones supportées par la base IANA de l'environnement Node/ICU.

## Critères d'acceptation

**AC1 — Pays de référence, saisie facultative.** La création rapide de SMN-42 lit `smn_general_settings.reference_country`. S'il s'agit d'un pays valide, chaque nouvelle identité reçoit une première version `smn_member_location` datée du jour PostgreSQL, `source='installation-default'`, avec pays seul : région, ville et fuseau demeurent `NULL`. Cette écriture appartient à **la même transaction** que la création des membres. Si aucun pays de référence n'est renseigné, **aucune localisation fictive n'est insérée**. Pour les personnes déjà créées, la valeur du paramètre courant est seulement `suggestedCountryIso2` : la première version doit être confirmée manuellement. Aucun champ nouveau n'est exigé dans l'installation Express.

**AC2 — Modification indépendante.** Formulaire Administration → Membres → Localisation : `countryIso2` facultatif, code de pays valide, ville/région facultatives (longueur ≤120), fuseau facultatif IANA (≤128), date d'effet et révision. Normalisation des codes ISO en majuscules et de la zone IANA en nom canonique. Aucune modification des autres identités, comptes, préférences de langue ou affectations. La localisation individuelle est une donnée personnelle réservée à l'Administrateur.

**AC3 — Heure locale sans mutation de l'instant.** `formatMemberEvent(instant,zone)` utilise `Intl.DateTimeFormat` avec une zone IANA et le décalage UTC applicable : les conversions prennent en charge les changements d'heure réels de la base IANA/ICU. Le résultat contient `utc` conservé et un libellé local, avec composants année/mois/jour/heure/minute. `GET /api/admin/members/[id]/location?at=<ISO UTC Z>` résout la localisation **valable le jour UTC de l'événement**, puis affiche cet instant dans son fuseau. En l'absence de fuseau daté, `display=null` : aucune heure locale n'est devinée. La lecture datée `?onDate=YYYY-MM-DD` est distincte, et les deux options ne peuvent être combinées.

**AC4 — Historique reconstructible.** Nouvelle table append-only `smn_member_location`, clé étrangère membre `ON DELETE RESTRICT`, `revision` croissante par membre, `effective_from`, attributs complets (pays/région/ville/zone), provenance, auteur et horodatage. Les écritures commencent **aujourd'hui au plus tôt** et jamais avant la date de la dernière version, avec révision optimiste et verrouillage `FOR UPDATE OF m`. Les corrections datées le même jour produisent une nouvelle version. `resolveMemberLocation` sélectionne la dernière version applicable sans réutiliser la localisation présente pour une période antérieure. **Les fiches historiques avant première version restent explicitement inconnues** (pas de backfill arbitraire de localisation). Aucune référence de capacité historique figée n'est recalculée.

**AC5 — Calendriers nationaux uniquement.** L'API déclare `holidayCalendarScope='national-only'`, `regionalHolidayAuto=false` et `holidayDataAvailable=false` tant que les Stories de catalogue/import n'ont pas chargé de calendrier. Les particularités régionales seront enregistrées par le système d'absences individuelles catégorisées (Stories ultérieures), et **aucun calendrier régional automatique** n'est généré. Cette Story ne produit ni jour férié national fictif, ni absence, ni capacité calculée.

## Architecture, fichiers et migration

- PostgreSQL **v13 → v14**, migration additive `src/server/members/location-migration.ts`, miroir `prisma/migrations/20261021_smn47_member_location/migration.sql`.
- `src/server/members/location.ts` : validation ISO/IANA, lecture historisée, résolution date d'effet, conversion UTC→zone IANA, transaction d'écriture avec rollback et conflits.
- `src/server/members/quick-create.ts` : pays de référence enregistré pour les nouveaux membres, sans extrapoler ville/fuseau.
- `src/app/api/admin/members/[id]/location/route.ts` : lecture datée et aperçu événementiel, écriture réservée à l'Administrateur, réponse privée et contrôle d'origine POST.
- `src/app/app/admin/members/member-location-editor.tsx` et `quick-members-admin.tsx` : formulaire, historique, aperçu horodaté, messages, contrôle des saisies non enregistrées ; FR/EN dans JSON.
- `src/server/members/lifecycle.ts` : historique de localisation comptabilisé dans l'analyse d'impact de suppression de SMN-45.
- `prisma/schema.prisma`, `src/server/accounts/migration.ts`, `src/server/installation/contract.ts`, `src/server/installation/diagnostic.ts`, `src/server/db/probe.ts` : schéma, migration et diagnostic v14.

## Tests et réserves

**Tests rédigés** : `tests/member-location.test.ts` (validation, provenance, DST Paris/New York, historique, rollback, membre archivé, refus de modifier langue/affectations), mise à jour `tests/quick-team-members.test.ts` (5 pays initiaux, aucun fuseau fabriqué, pays absent) et `scripts/verify-http-ci.mjs` (migration, rejet valeurs invalides, 403, versions FR→CA à date future, historique, changement d'heure, SQL).

**Non attesté tant qu'aucune exécution réelle :** `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, scripts HTTP/PG, recette Windows 11/PostgreSQL 18.6. Ne pas clôturer Jira ou qualifier la Story de « terminée » sans preuves. Le lanceur natif du workflow BMAD `bmad-build` (`uv run --no-cache` sur checkout local) n'a pas été exécuté depuis les connecteurs ; adaptation manuelle documentée.

**Risques à suivre :** fichiers IANA/ICU de l'environnement cible, cohérence des règles de jours fériés nationaux livrées par SMN-48 et Stories suivantes, période historique antérieure à l'enregistrement d'une localisation (état « inconnu »). Toute migration sur des données importantes attend une sauvegarde/restauration réellement qualifiée.
