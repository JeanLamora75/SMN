# SMN-59 — Story 3.18 — Figer la capacité initiale à l'ouverture effective

**Ticket :** https://lmn24.atlassian.net/browse/SMN-59 · **Dépendances :** SMN-57 (référence dynamique), SMN-58 (saisie manuelle prioritaire et protection), futurs événements d'ouverture Sprint/Kanban (Epics 4/7).

## Contrat et critères d'acceptation

- **AC1 — aucune création à la consultation :** `GET /api/admin/development-capacity?start=...&end=...` lit seulement le résultat de référence, la surcharge et l'éventuel cliché `initialSnapshot`. Une date théorique ou une navigation dans le calendrier **ne provoque jamais d'ouverture**.
- **AC2 — déclenchement métier explicite :** un **événement d'ouverture effective** appelle `POST /api/admin/capacity-openings` avec `{start,end,eventId}` (UUID de l'événement). À la première ouverture, le service recueille la saisie manuelle **y compris 0** ou, en son absence, la référence **calculée fiable** SMN-57 dans **la même transaction REPEATABLE READ**, puis fige `initial_jh`, `provenance` (Saisie, Calcul ou Non renseigné), `actual_opened_at=now()` (horodatage serveur), `manual_revision` et l'identifiant d'événement. Le fait métier « ouverture effective » est proposé par un bouton d'Administrateur et peut être réutilisé par les futurs workflows qui déclencheront ce même service. La simple date de début n'est pas un signal d'ouverture.
- **AC3 — immutabilité :** les modifications ultérieures d'absences, même renommées « Prévues », ne changent pas le cliché. La référence recalculée reste dynamique et peut diverger. La table possède un trigger **BEFORE UPDATE OR DELETE** rejetant toute mutation des clichés (en plus du fait que le service ne fournit aucun UPDATE/DELETE). Les capacités figées ne sont pas reconstituées depuis les données à la date de consultation.
- **AC4 — rejeu idempotent :** verrou transactionnel `FOR UPDATE OF t` sur l'équipe, consultation de l'éventuel cliché **avant tout recalcul** et unicité PostgreSQL par `period_id` et `event_id`. Un rejeu retourne exactement l'ancien cliché, sa provenance et son horodatage, même si l'absence ou la référence a changé entre-temps. Aucune seconde ligne créée.
- **AC5 — période entièrement passée :** si `end < today` (jour métier `Europe/Paris` vérifié côté PostgreSQL), sans preuve originale déjà figée, le service **ne calcule jamais une capacité initiale rétroactive** ; lors d'une ouverture déclarée a posteriori, il enregistre `initial_jh=NULL`, `provenance="Non renseigné"`. Il ne convertit pas une saisie actuelle ou une nouvelle estimation en « initialement connu ». Aucun calcul ne se produit pendant la simple consultation. Une estimation explicite sourcée, si autorisée ultérieurement, exigerait un workflow spécifique distinct et identifiable.

## Schéma, protections et intégration SMN-58

Migration additive **v22 → v23** : `smn_capacity_initial_snapshot` avec `period_id UNIQUE` lié à `smn_capacity_period_override`, `event_id UNIQUE`, valeur nullable, provenance, dates `actual_opened_at` et `recorded_at`, acteur, révision manuelle. Contraintes SQL de cohérence entre valeur et provenance ; trigger d'immutabilité. Moteur de migration, diagnostic et Prisma alignés.

Au premier événement, l'ouverture **crée au besoin** la ligne de période SMN-58 avec `manual_jh=NULL`, `frozen_at=now()` puis le cliché ; sinon elle renseigne `frozen_at` sur la ligne existante et conserve la saisie précédente. **Ces actions sont atomiques.** Les écritures manuelles de SMN-58 vérifient `frozen_at` et `closed_at` et deviennent donc interdites après ouverture, y compris pour une période sans saisie antérieure. Aucun workflow de réouverture n'est créé dans SMN-59.

`readDevelopmentCapacity` SMN-57 accepte une option interne `externalTransaction` pour calculer la référence dans la transaction d'ouverture sans `BEGIN/COMMIT` imbriqué ; son comportement normal en lecture seule est inchangé.

Sécurité : `authorizeApi` `members:write` pour POST, réservé à l'Administrateur avec contrôle d'origine ; GET nominatif réservé à l'Administrateur. Validation stricte du corps et des dates. Une collision d'identifiant d'événement sur une autre période produit un conflit 409.

## Livrables et tests

- `src/server/capacity/opening.ts` — service idempotent, validation, lecture historique, horloge serveur et figement.
- `src/app/api/admin/capacity-openings/route.ts` — événement métier explicite.
- `src/app/api/admin/development-capacity/route.ts` — inclut `initialSnapshot` en GET sans mutation.
- `src/app/app/admin/development-capacity/development-capacity-view.tsx` — lecture du cliché et bouton d'ouverture réelle avec confirmation ; statut « Non ouvert » par défaut.
- `src/i18n/fr.json`, `en.json` — centralisation des libellés.
- `tests/capacity-initial-snapshot.test.ts` — AC1 à AC5, rejouabilité, 0 JH, protection SMN-58, rétroactivité et droits.

**Qualification :** contrôles statiques GitHub et tests écrits ; aucune compilation, migration PostgreSQL 18.6, test API HTTP ou recette navigateur exécuté dans cette conversation. GitHub Actions exclu par décision du projet. Conserver Jira **En cours**, BMAD **review** jusqu'à validation locale et raccordement des vrais workflows d'ouverture métier Epics 4/7. Runner BMAD `uv` non lancé depuis cet environnement connecteur ; adaptation manuelle du skill Amelia.
