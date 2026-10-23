# SMN-234 — D4 : Cérémonies de la fiche Sprint

**Date :** 23 octobre 2026 · **Branche :** `main` · **Epic :** SMN-228 · **État :** code publié, module pur vérifié isolément, **recette globale à effectuer**.

## Résultat fonctionnel

L'onglet **Cérémonies** de `/app/admin/sprints/[sprintId]?tab=ceremonies` présente **toutes les réunions enregistrées du Sprint**, quel que soit leur type :

- **Standards** : Planning, Daily, Review, Rétrospective et toutes leurs occurrences historiques encore stockées ;
- **Personnalisées** : occurrences créées à partir des modèles de réunions Scrum ;
- **Exceptionnelles** : réunions ajoutées directement pendant le Sprint.

Chaque ligne affiche le titre/type, une icône Bootstrap, la catégorie source, les dates et heures dans le **fuseau IANA de l'équipe**, la **durée prévue** et la **durée réelle** lorsque celle-ci est effectivement enregistrée. Un lien **Voir la réunion** ouvre la route existante `/app/team-calendar/meeting/[kind]/[id]`. Un lien depuis cette fiche permet de retourner à l'onglet Cérémonies du Sprint (sans perdre l'ID).

### Statuts : ne pas déduire une participation à tort

Badges **Prévue**, **Tenue**, **Non tenue**, **Annulée**, **Statut inconnu**, respectant les valeurs réelles `scheduled` / `held` / `not_held` / `cancelled`. Un état `held` accompagné de `status_explicit=false` est distingué par **Tenue déduite automatiquement** ; un `held` dans un ancien snapshot n'ayant pas `status_explicit` est assorti d'une **confirmation inconnue**. Une réunion issue d'une génération historique porte le badge **Reconstituée**. La création d'une réunion reconstituée ne prouve pas qu'elle a été tenue.

**Arbitrage non inclus :** « Ajournée/Reportée » ne correspond pas encore à un état persistant du modèle `attendance.ts`. **Aucune correspondance fictive** avec `not_held` ou `cancelled` n'a été créée. Ce statut et son éventuelle date de report devront faire l'objet d'une décision métier et d'une évolution spécifique si souhaités.

### Exhaustivité, historique, sécurité

- **Tri chronologique stable**, ascendant, puis type d'occurrence et identifiant ; **25 lignes/page, compteur exact et pages précédente/suivante**. Aucun `LIMIT 5`, `LIMIT 200` ou limite finale implicite : un Sprint de plus de 200 cérémonies est paginé.
- La lecture active s'appuie sur les **trois tables** et vérifie les colonnes disponibles sur les installations anciennes. Si une ou plusieurs sources n'existent pas, un **avertissement liste partielle** est affiché ; si aucune source n'est accessible, le résultat est indisponible et non une fausse liste vide.
- La lecture est **exclusivement SELECT-only** dans la transaction `REPEATABLE READ READ ONLY` de la fiche. Filtre obligatoire `sprint_id` et contrôle du **`team_id`**. Aucune réconciliation automatique, génération, migration, actualisation ou inférence d'état de présence lors de la lecture.
- Pour un **Sprint clôturé**, lecture du dernier snapshot de clôture Vn : `ceremonies`, `customMeetings`, `exceptionalMeetings`. Aucun retour aux valeurs courantes en cas de source historique absente ; absence de snapshot = `history-missing`.
- **Rôle user** : consultation collective autorisée, **aucun formulaire de modification** ni accès élargi aux anciennes API admin. La page Réunion n'a pas reçu de crayon factice ; les actions de modification des statuts/durées restent dans les workflows métier admin existants, qui préservent leurs gardes.
- La **page Réunion existante** ne force plus `unknown` pour les cérémonies standards lorsque `occurrence_status` existe. Elle consulte conditionnellement les colonnes de statut disponibles, localise les dates en FR/EN dans le fuseau du Sprint, affiche un avertissement « tenue déduite » si connu et possède un retour vers le Sprint. Les différences des anciennes installations sont traitées sans DDL.

### Fichiers concernés

| Fichier | Livraison |
|---|---|
| `src/lib/sprint-ceremony-detail.ts` | **Nouveau** contrat, normalisation des statuts et durées, provenance de tenue, tri et pagination des snapshots |
| `src/server/sprints/ceremonies-detail-read.ts` | **Nouveau** lecteur SQL complet et paginé, scope équipe, lecture historique Vn, compatibilité schémas |
| `src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-panel.tsx` | **Nouvelle** liste responsive, badges, durées, liens, compteurs, pagination et avertissements |
| `src/app/app/admin/sprints/[sprintId]/page.tsx` | Raccordement de l'onglet et paramètre de page, lecture conditionnelle sur Cérémonies |
| `src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx` | Réparation du statut réel et de la date locale, retour vers le Sprint |
| `src/i18n/fr.json`, `src/i18n/en.json` | Nouveaux libellés Cérémonies, statuts et pagination |
| `tests/smn-234-sprint-ceremonies-d4.test.ts` | Tests ciblés : 205 réunions, pagination/tri, scope, provenance, snapshots, schéma absent, statut réel |

**D1–D3 ne sont pas supprimés ni remplacés.** Le lecteur limité à cinq événements dans le dashboard reste inchangé : il répond au besoin de la carte récapitulative et ne doit pas être utilisé dans la fiche.

## Vérifications réellement exécutées

**Sur GitHub :** présence et lecture de 8 fichiers ; **18 contrôles statiques de cohérence réussis sur 18**, portant sur les sources, le tri, l'absence de DDL, l'équipe, la lecture des snapshots, les libellés FR/EN, les durées, les liens et la correction du statut dans la page Réunion.

**Module pur réellement vérifié :** la copie locale de `src/lib/sprint-ceremony-detail.ts` possède le SHA Git **`c2d4c2cde37f39bdfca002c263f64afd1dc53c20`**, identique au blob sur `main`. Le module a été compilé avec `tsc --target ES2022 --module commonjs --skipLibCheck --strict` : **succès**. **14 assertions isolées exécutées et réussies sous Node.js 22** : états, tenue confirmée / inférée / non attestée, reconstitution, durées prévues/réelles et pagination de 205 événements.

**Non exécutés :** `pnpm typecheck` global, `pnpm exec tsx --test tests/smn-234-sprint-ceremonies-d4.test.ts`, `pnpm i18n:check`, `pnpm build`, parcours PostgreSQL/Next.js réels et recette navigateur. Le dépôt n'a pas pu être cloné dans le conteneur d'exécution (`github.com` non résolu) et `pnpm` n'y est pas disponible. Les 14 assertions isolées **ne constituent pas** le résultat du fichier de tests intégré. Les scripts BMAD `uv` n'ont pas été exécutés, et le workflow a été adapté au connecteur GitHub.

## Recette locale Windows 11 (GitHub Desktop + PowerShell)

Synchroniser `main` sur l'installation de test :

```powershell
pnpm typecheck
pnpm exec tsx --test tests/smn-234-sprint-ceremonies-d4.test.ts tests/smn-234-sprint-indicators-d3.test.ts tests/smn-234-sprint-objectives-d2.test.ts tests/smn-234-sprint-detail-d1.test.ts tests/smn-237-dashboard-events.test.ts
pnpm i18n:check
pnpm build
pnpm dev
```

Tester en navigateur : Sprints → fiche → Cérémonies. Vérifier 0/1/30/205+ réunions de types variés, ordre et pagination, dates dans Europe/Paris y compris les changements d'heure, les quatre statuts, tenue déduite vs confirmée, badge de reconstitution, durées prévues et durées réellement renseignées, lien vers réunion puis retour au Sprint ; Sprint clôturé/snapshot ancien et compte `user` en lecture seule. Tester une base ancienne où une table facultative est absente : la liste **ne doit pas** être présentée comme exhaustive. Vérifier enfin que les cinq événements du dashboard demeurent inchangés.

**Point connu :** la route de détail d'une réunion est alimentée par la table opérationnelle courante ; pour un Sprint clôturé, **la liste** respecte le snapshot Vn, mais une fiche Réunion ouverte depuis cette liste peut diverger si le Sprint a été rouvert/modifié après ce snapshot. L'accès détail historique strict devra être envisagé ultérieurement si nécessaire ; aucune fidélité historique de la fiche individuelle non implémentée n'est revendiquée.

**Conclusion :** D4 est **codé et publié**, contrôlé statiquement et via un test isolé du module pur, **pas encore recetté complètement**. SMN-234 doit rester ouverte. Le prochain lot est **D5 — Capacité et membres** avec distinction impérative entre J/H de présence et J/H de développement.

## Références
- [SMN-234 Jira](https://lmn24.atlassian.net/browse/SMN-234)
- [Contrat UX](../planning-artifacts/ux-designs/ux-sprints-pilotage-2026-10-23/FICHE-SPRINT-CONTRAT.md)
- [Audit D0](audit-d0-fiche-sprint-smn-234-2026-10-23.md)
- [Plan de développement](plan-developpement-fiche-sprint-smn-234-2026-10-23.md)
