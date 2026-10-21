# SMN-64 — Story 3.23 — Calendrier central partagé, filtrable et non destructif

**Jira :** https://lmn24.atlassian.net/browse/SMN-64 · Epic 3 · UX-DR06, UX-05 · FR-62 / FR-60 · AD-14/15/18/31.

## État réel du projet et décisions

SMN possède déjà **un calendrier d'équipe central** (`/app/team-calendar`) et ses producteurs vérifiés : affectations de membres, absences individuelles, catégories/couleurs, congés et indisponibilités, jours fériés nationaux, fermetures collectives. Le modèle de données actuel **ne possède pas encore d'entité de cycle Scrum/Kanban ni de réunion Agile**. Les périodes techniques de capacité SMN-57 à SMN-62 ne doivent donc **pas** être présentées comme des Sprints réels.

Le calendrier central est **une projection de lecture** des producteurs existants, jamais une copie d'événements. La navigation propose le calendrier aux rôles Administrateur et Utilisateur. Les autres entrées « Événements » et « Cycles » restent volontairement inactives jusqu'à leurs véritables livraisons.

## Critères d'acceptation

### AC1 — Indisponibilités connues, légendes, sources

- `GET /api/team-calendar` reste l'unique API collective utilisée. `readTeamCalendar` récupère les données réelles et `projectCentralCalendar` ajoute `central.items` : fermetures, indisponibilités et jours fériés **réellement présents**, chacun avec sa date ISO `YYYY-MM-DD`, son type, une légende textuelle et, lorsqu'une route source autorisée existe, un lien vers la fiche source.
- Pour l'Administrateur, `absence` comporte identité du membre, catégorie, couleur et statut prévue/imprévue, **mais pas le champ `reason`** dans cette projection. Le lien source ouvre le registre des membres et le bouton central « Créer ou corriger » réutilise l'éditeur d'absence existant sur la date et le membre sélectionnés. Il n'existe **aucune duplication ni INSERT** de la fiche d'absence.
- Pour l'Utilisateur, seules les indisponibilités **agrégées par date** sont exposées (`aggregateCount`) : ni identifiant de membre, ni nom, ni catégorie individuelle, ni motif médical, ni zone de localisation par membre. Les fermetures collectives publiques sont visibles comme dans la vue de synthèse existante. Le lien d'une indisponibilité globale pointe vers la synthèse collective.
- `cyclesAvailable=false` et `meetingsAvailable=false` tant qu'aucun producteur métier n'est connecté ; aucun exemple ni cycle synthétique n'est renvoyé par l'API réelle.

### AC2 — Réunions Agile : statut de source, jamais déduit du temps

- Le contrat optionnel `MeetingSource` accepte uniquement une réunion **fournie par un producteur réel** avec `startsAtUtc` UTC, `timeZone` IANA, `status` `scheduled|held|cancelled|null`, titre et source. `null` est exposé sous `unknown`. Le simple passage de l'heure ou de la date ne transforme **jamais** `scheduled/unknown` en `held`.
- Aucun producteur de réunions n'étant actuellement stocké dans le schéma, le flux d'API passe volontairement un tableau vide et l'interface indique qu'aucune réunion n'est enregistrée. Les futurs producteurs des Epics 4/7 pourront être raccordés après livraison et validation des droits.

### AC3 — Filtres sans écriture ni doublons

- Les périodes 7/14/28 jours, les filtres de membre, catégorie et absence prévue/imprévue préexistants restent opérants selon le rôle (le serveur **rejette** les requêtes utilisateurs tentant de filtrer par identité). Un filtre visuel supplémentaire par `absence|closure|holiday|cycle|meeting|all` ne fait que sélectionner des éléments en mémoire, **sans mutation ni nouvelle requête POST**.
- Le filtre d'équipe reflète l'équipe réellement installée, actuellement **seule équipe autorisée du MVP** ; il est non modifiable dans cette configuration, afin de ne pas laisser choisir une équipe non autorisée. Le serveur vérifie aussi `teamId` s'il est transmis.
- Déduplication à l'affichage par triplet `type/id/date` ; si deux jours sont concernés, deux cases date distinctes affichent **une seule fiche source**.

### AC4 — Instants UTC / fuseaux IANA et dates métier

- Les absences et fermetures sont des **dates civiles métier** ; elles ne sont jamais converties en heure locale du navigateur. `calendarDates` calcule ces jours par opérations UTC sur `YYYY-MM-DD` pour ne pas provoquer un saut de date au changement d'heure.
- Pour une éventuelle réunion réellement horodatée, `formatMemberEvent` existant résout sa date/heure locale depuis l'instant UTC et la zone IANA **de la source**, jamais depuis le fuseau du navigateur. L'agenda peut afficher simultanément UTC, zone et libellé local. Les tests de contrat couvrent le changement d'heure Europe/Paris (heure répétée à l'automne, heure sautée au printemps) et le franchissement de minuit local.

### AC5 — Confidentialité et absence de déplacement implicite

- La route conserve `authorizeApi("read",{type:"collective",exists:true,inScope:true})`. Les comptes `user` ne reçoivent **jamais** le bloc `admin` ni d'absence individuelle; le moteur central redouble ce cloisonnement. Il ne sérialise même pas la raison d'absence pour l'Administrateur dans les nouveaux éléments centraux.
- Aucune zone de glisser-déposer, aucun événement `onDrag* / onDrop`, aucune API d'écriture ou migration. Le clic de lecture et les filtres ne déplacent aucune date source. L'éditeur existant, réservé aux Administrateurs, conserve son POST propre et ses validations indépendantes.

## Livrables et vérification

- `src/server/members/central-calendar.ts` — modèle de projection pure, déduplication, filtres, statut et IANA.
- `src/app/api/team-calendar/route.ts` — sérialisation collective `central` en un seul GET.
- `src/app/app/team-calendar/team-calendar-view.tsx` — agenda daté, légendes, sources, filtres visibles aux rôles autorisés et messages honnêtes en l'absence de réunions/cycles.
- `src/lib/private-navigation.ts` — accès à `/app/team-calendar` depuis le menu commun.
- `src/i18n/fr.json` / `en.json` — libellés centralisés.
- `tests/central-calendar.test.ts` — contrats AC1 à AC5 (confidentialité, fiabilité du statut, dates DST, filtre, déduplication).
- `docs/CALENDRIER-CENTRAL-SMN-64.md` — guide de recette.

**Aucune migration PostgreSQL** : pure vue dérivée. Le projet reste monoéquipe Scrum/Kanban. Quand les véritables cycles et événements seront livrés, leur exposition devra s'effectuer par producteurs métier **autorisés**, jamais à partir de périodes capacitaires ni de faux états historiques.

**Vérifications :** revue statique du code et du schéma ; tests de contrat rédigés **non exécutés**. `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, navigateur Windows, PostgreSQL 18.6 restent à vérifier localement. GitHub Actions indisponible et non utilisé. Jira **En cours**, BMAD `review` jusqu'à la recette. Exécution BMAD `uv` non disponible dans ce contexte de connecteurs : workflow adapté manuellement, sans prétendre exécuter le runner.
