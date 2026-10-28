# ARCHITECTURE — Entreprises et disponibilités — SMN
**BMAD v6.12.4 — Winston, System Architect — 28 octobre 2026**  
**Statut : ARCH-ENT-01 à ARCH-ENT-09 approuvées, audit d'intégration et tests restant à exécuter.**  
**Sources :** Brief John `_bmad-output/planning-artifacts/briefs/entreprises-disponibilites-2026-10-28/BRIEF-BMAD-PM.md`, contrats Sally `_bmad-output/planning-artifacts/ux-designs/ux-entreprises-2026-10-28/{DESIGN,EXPERIENCE}.md`.

## Objectif et invariants
Catalogue d'entreprises global à l'installation, association facultative de chaque membre à une entreprise, fermetures en journées entières, capacités Scrum/Kanban recalculées sans double déduction. Préserver les corrections manuelles, les valeurs initiales figées et les bilans clôturés. Aucune gestion de transfert d'entreprise. PostgreSQL/TypeScript/Next.js existants ; aucun service externe requis.

## Décisions validées
- **ARCH-ENT-01 :** aucune conversion des anciennes fermetures ; migration autorisée uniquement après vérification que la table concernée **et ses références historiques pertinentes** sont vides. Refuser sans destruction si préconditions non remplies.
- **ARCH-ENT-02 :** `company_id` nullable directement sur `smn_member` ; pas de table de liaison. Association uniquement à la création, entreprise archivée non sélectionnable mais références existantes préservées.
- **ARCH-ENT-03 :** étendre le **moteur de capacité existant**, pas de calcul parallèle ; union des indisponibilités par jour/période pour éviter les doubles déductions.
- **ARCH-ENT-04 :** recalcul **ciblé** aux membres de l'entreprise, à leurs équipes et cycles ouverts recoupant les **anciennes ou nouvelles** dates de fermeture.
- **ARCH-ENT-05 :** calcul automatique distinct de la correction manuelle ; conserver la correction en vigueur, exposer l'écart et permettre de revenir explicitement au calcul automatique ; ne toucher ni aux références initiales figées ni aux bilans clôturés.
- **ARCH-ENT-06 :** transaction atomique comprenant modification de fermeture, audit et **demande de recalcul persistée** ; traitement après commit, idempotent et récupérable après erreur.
- **ARCH-ENT-07 :** catalogue consultable par les utilisateurs autorisés en lecture seule, mutations réservées à l'administrateur ; listes et **compteurs** des membres filtrés aux droits des équipes.
- **ARCH-ENT-08 :** file persistée en PostgreSQL, relances bornées, verrou de traitement avec expiration ; suivi discret « Actualisation en cours », alerte administrateur et action Réessayer en échec persistant.
- **ARCH-ENT-09 :** actualisation légère périodique des indicateurs après traitement, **sans rechargement de page ni écrasement des champs en cours de saisie**.

## Schéma cible proposé (à confirmer avec migrations existantes)
### `smn_company`
`id`, `installation_id`, `name` (obligatoire, unique sous forme normalisée **dans une installation**), `comment` nullable, `color` (token de palette autorisée), `archived_at` nullable, `revision`, `created_at`, `updated_at`, `created_by`, `updated_by`. Aucun delete physique exposé.
### `smn_member`
Ajouter `company_id UUID NULL` avec clé étrangère et validation de même installation. Choix facultatif lors de la création, non modifiable ensuite depuis les parcours/API ; pas de réaffectation automatique.
### `smn_company_closure`
Remplacer le rattachement `team_id` par `company_id` (après garde de migration). Colonnes : `id`, `company_id`, `name`, `start_on`, `end_on`, `is_active`, `revision`, métadonnées auteur/horodatage. Plages inclusives, jours entiers ; chevauchements des fermetures actives **d'une même entreprise** interdits en concurrence ; fermetures annulées conservées.
### `smn_company_closure_history`
Conserver l'historisation versionnée et l'audit des créations, modifications et annulations ; adapter la relation sans pertes.
### Demandes de recalcul
Créer ou réutiliser une table persistante (nom provisoire `smn_capacity_recalc_job`) : `id`, `installation_id`, `company_id`, plage impactée, version source, `status` pending/running/completed/failed, `attempt_count`, `next_attempt_at`, `locked_until`, `last_error`, horodatages. Vérifier d'abord si SMN possède déjà un ordonnanceur/job store.

## Transaction de fermeture
Authentifier puis vérifier l'autorisation ; valider les dates et la révision ; BEGIN ; verrouiller la ressource par entreprise ; refuser les chevauchements concurrents, idéalement par contrainte SQL en plus de la vérification du service ; enregistrer la fermeture ; historiser ; insérer la demande de recalcul idempotente ; COMMIT. Tout échec avant commit annule l'ensemble. La période recalculée inclut la plage précédente et la nouvelle lors d'une modification, et l'ancienne lors d'une annulation.

## Moteur et recalcul ciblé
Résoudre d'abord le calendrier de travail du membre, ses jours fériés nationaux, absences et fermetures actives applicables sur la période ; **unir** les indisponibilités avant de calculer les heures/jours réellement déductibles. Une fermeture sur un jour férié, un weekend ou une absence complète ne se soustrait pas deux fois. Respecter absences partielles et coefficients déjà implémentés. Évaluer seulement les membres associés, leurs affectations de périodes et les cycles ouverts concernés. Ne recalculer **que les valeurs automatiques dynamiques** ; maintenir les surcharges manuelles et les snapshots historiques. Un job rejoué reconstruit le calcul à partir des sources plutôt qu'ajouter/soustraire une valeur cumulée.

## Exécution différée et UX
Traitements persistés : pending → running → completed, reprise après expiration du verrou et délai exponentiel, puis failed après nombre borné de tentatives. Indiquer explicitement un état obsolète/en cours, sans promettre une synchronisation immédiate après enregistrement. Une lecture périodique légère du statut ou de la version de capacités déclenche le rafraîchissement des seuls indicateurs non édités. Ne pas perdre les formulaires, filtres ou onglets. Aucun WebSocket nécessaire.

## API proposées (routes définitives à aligner sur le routeur existant)
- `GET/POST /api/admin/companies`
- `GET/PATCH /api/admin/companies/{id}`
- `POST /api/admin/companies/{id}/archive`, `/reactivate`
- `GET/POST /api/admin/companies/{id}/closures`
- `PATCH /api/admin/companies/{id}/closures/{closureId}`
- `POST /api/admin/companies/{id}/closures/{closureId}/cancel`
- Création de membre : `companyId` nullable, validé serveur ; lecture de membre : identité d'entreprise selon droits ; interdiction de changement pour membre existant.
- Calendrier : événements informatifs de fermeture + membres/compteurs accessibles seulement au périmètre de l'équipe.
- Statut de recalcul : endpoint léger sans divulgation de données hors périmètre.

Erreurs usuelles : 400 (validation), 401/403 (authentification/autorisation), 404 (absent ou hors périmètre), 409 (conflit/révision/chevauchement), 503 (indisponibilité). Traductions FR/EN côté UI. Les actions interdites sont masquées mais également refusées côté serveur.

## Migration contrôlée
Numéroter suivant migrations réelles et vérifier version source ; précontrôler lignes de fermeture et dépendances historiques ; créer catalogue ; ajouter `company_id` nullable membre ; adapter fermetures/contraintes/historique ; ajouter ou réutiliser les jobs persistés ; indexer accès installation, entreprise, période et statut ; vérifier diagnostics. **Ne jamais supprimer silencieusement des données.** Les schémas SQL exacts et le calendrier des migrations nécessitent vérification.

## Code existant vérifié sur GitHub
- `src/server/closures/service.ts` : `team_id`, contrôle de chevauchement, transaction, audit et révisions.
- `src/app/api/admin/company-closures/route.ts` : API sous `withLegacyTeamApi`.
- `src/server/teams/legacy.ts` : refuse explicitement les schémas version >27 ; doit être retiré du nouveau parcours multiéquipes.
- `src/server/members/assignment.ts` : `smn_member`, affectations et versions d'affectation ; vérifier l'intégration `company_id` sans altérer les versions.

## Tests et critères de sortie
- Migration sur base compatible, échec contrôlé si fermetures ou dépendances non vides.
- CRUD entreprise, archivage/réactivation, FK et unicité par installation.
- Nouveau membre sans entreprise ou avec entreprise active, impossibilité de nouvelle affectation à une archivée, aucun transfert.
- Fermetures : chevauchements actifs (y compris concurrence), historique et conflit de révision, annulation.
- Jours fériés + fermetures + absences + non travaillés : aucune double déduction.
- Recalcul ciblé multiéquipes, modification de dates, annulation, retraitement idempotent.
- Conservation des corrections manuelles, capacités figées et bilans clôturés.
- Résilience jobs : crash après commit, reprise, expiration de bail, échec persistant, relance admin.
- Permissions : administration seule en écriture ; filtres sur membres et compteurs.
- Calendrier et polling : état « Actualisation en cours », actualisation sans perte des saisies, FR/EN, responsive.

## Plan de livraison proposé
A. Schéma et migration ; B. catalogue/API/membres/fermetures ; C. moteur capacités et tests ; D. traitements fiables et état de synchronisation ; E. Cockpit Agile/calendrier ; F. recette et non-régression.

## Points bloquants à auditer avant développement
Schéma et dernières migrations réelles ; moteur de capacité existant ; corrections manuelles et snapshots ; stockage des jobs existants ; autorisations multiéquipes ; cycle de vie membre/affectation ; accès legacy dépendant du schéma ; cohérence des fermetures historiques déclarées absentes. **Aucune migration, test ou exécution sur une base locale n'est prétendue réalisée.**

**Statut final : contrat de solution approuvé dans son principe ; audit d'intégration et recette nécessaires avant validation de l'implémentation.**
