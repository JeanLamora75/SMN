# Fiche membre V2 — Historique, création, correction et suppression logique des absences

**Date :** 23 octobre 2026  
**Demande :** utilisateur, refonte de l'onglet Absences après Affectation et Calendrier.  
**Références :** [SMN-53](https://lmn24.atlassian.net/browse/SMN-53), [contrat fiche membre V2](../planning-artifacts/ux-designs/ux-equipe-membres-2026-10-22/FICHE-MEMBRE-V2-UX-CONTRAT.md), `docs/UX-REFERENTIEL-BMAD.md`.

## Contrat fonctionnel
1. L'onglet **Absences** est une page de consultation, pas un formulaire géant. Toutes les absences du membre sont visibles, triées par date de début décroissante, puis date de fin décroissante. Les sections **À venir et en cours** et **Passées** sont départagées par date de fin au regard du **jour courant Europe/Paris** (égal à aujourd'hui = en cours).
2. Une première ligne « + Ajouter une absence » lance une **modale Nouvelle absence**, contenant **uniquement** les champs d'une absence (dates, demi-journées, catégorie, motif, planifiée, Enregistrer/Annuler).
3. Sur chaque ligne active : **Corriger** charge la même modale avec les données existantes ; **Supprimer** demande confirmation puis effectue une **suppression logique et auditée**.
4. Une absence concernant au moins une date révolue déclenche un **avertissement non bloquant** pendant l'édition/suppression. La confirmation de suppression reste explicite et annulable.
5. Les absences supprimées restent présentes dans la **liste historique**, avec le statut **Supprimée**, sans actions ni incidence sur les conflits de dates, disponibilités et capacités calculées.
6. Toute création, correction ou suppression utilise l'API existante `POST /api/admin/members/[id]/absences`, garde les contrôles d'accès Administrateur, conflits de révision, protection membre archivé et traçabilité. Aucun champ/migration de base n'est nécessaire.

## Modèle de suppression logique sans migration
La migration SMN-53 existante (schéma v19, toujours inchangée à l'heure de cette correction) n'autorise dans l'audit que les opérations `create` et `update`, et la FK de l'historique interdit le `DELETE` physique de son parent. Afin de préserver la source de vérité et d'éviter une migration supplémentaire sur la base pilote :
- La requête `{action:"delete",id,revision}` verrouille le membre puis la ligne d'absence, vérifie le propriétaire, l'archivage, la version et l'absence d'une suppression préalable.
- La transaction incrémente la révision sur la ligne d'origine et ajoute une entrée append-only dans `smn_member_absence_history` avec `operation='update'` (valeur autorisée par la contrainte existante), `before_values` complet et `after_values` complet avec `deleted:true`.
- Le **marqueur métier de suppression** est exclusivement `after_values->>'deleted'='true'` pour la **dernière révision** de l'absence. L'API de chronologie globale convertit ce marqueur en `operation="delete"` pour les consommateurs.
- Les requêtes de recherche de chevauchements, capacité calculée et calendrier d'équipe **écartent** ces tombstones. L'onglet individuel les **affiche** pour l'audit. L'état `onDate` de l'API ignore les tombstones.

Ce contrat n'est **pas un effacement physique** ni une fonctionnalité de restauration. La traçabilité est permanente pour les données pilote ; une politique de rétention future serait une décision distincte.

## Calculs et historique figé
- `readDevelopmentCapacity` recalcule sa référence dynamique lors de chaque consultation, en lisant les absences actives. Après une écriture, l'API invalide les chemins de vues de capacité, du calendrier central et du tableau de bord via `revalidatePath`, puis l'écran des absences recharge la source enregistrée.
- Les capacités futures / non figées tiennent compte de l'ajout, de la correction (ancienne ET nouvelle plage) ou de la suppression **à la lecture suivante** ; les sources passées peuvent être recalculées pour une consultation dynamique.
- **Ne jamais altérer automatiquement** les `smn_capacity_initial_snapshot`, les `smn_capacity_actual_snapshot` clôturés, les métriques historiques gelées, les documents/PDF publiés ou un calcul manuel validé. Une correction rétrospective importante peut justifier une qualification métier séparée ; l'avertissement prévient explicitement de cette limite.
- Il n'existe **pas de job de recalcul asynchrone** : le moteur existant lit et calcule à la demande. Ne pas présenter l'invalidation de caches comme un traitement de masse déjà achevé.

## Fichiers modifiés/créés sur main
- `src/server/members/absence.ts` (parser action delete, audit append-only, version, tombstone et exclusions)
- `src/server/members/team-calendar.ts`, `src/server/capacity/engine.ts` (lecture sans absences logiquement supprimées)
- `src/app/api/admin/members/[id]/absences/route.ts` (jour Europe/Paris, filtrage disponibilité, invalidation de vues)
- `src/app/api/admin/members/[id]/history/route.ts`, `src/app/app/admin/members/[id]/member-history.tsx` (opération delete lisible)
- `src/app/app/admin/members/[id]/member-absence-summary.tsx` (liste descendante, sections, actions, état supprimé)
- `src/app/app/admin/members/member-absence-editor.tsx` (modale unique Nouvelle/Correction sans historique)
- `src/app/app/admin/members/[id]/member-detail.tsx` (intégration de la liste et modale)
- `src/i18n/fr.json`, `en.json` (traductions synchrones)
- `tests/member-absence.test.ts`, `tests/member-regional-absence.test.ts`, `tests/member-absence-ux.test.ts`.

## Recette pilote Windows 11
```powershell
pnpm exec tsx --test tests/member-absence.test.ts tests/member-regional-absence.test.ts tests/member-absence-ux.test.ts
pnpm i18n:check
pnpm typecheck
pnpm build
pnpm dev
```

**Jeux d'essai :**
- Une absence future, une absence passée, une absence couvrant aujourd'hui et une absence sur une seule demi-journée. Trier à date décroissante dans chaque section.
- Ouvrir **Ajouter** : une seule modale de création, pas d'historique, pas de calendrier, pas de second formulaire.
- Corriger une absence passée : avertissement visible mais enregistrement possible. Contrôle des révisions et du statut après enregistrement.
- Supprimer une absence future ou passée : confirmation explicite, nouvelle entrée d'audit, statut Supprimée visible ; aucune consommation de créneau dans la disponibilité/capacité recalculée.
- Recréer une absence sur le créneau libéré : autorisée si absence d'autre conflit actif. Confirmer l'état après F5.
- Membre archivé : liste lisible, boutons inactifs. Utilisateur non autorisé : HTTP 403.
- Capacités : comparaison avant/après sur une période non figée; période initiale figée et bilan clos doivent rester inchangés. Tester FR/EN, mobile, navigation clavier et double clic.

## Qualité et décisions à valider
Le code a été publié via connecteur GitHub. Les contrôles statiques de structure et d'imports ont été réalisés sur les fichiers du dépôt ; **les tests TS, lint, build, exécution PostgreSQL et recette navigateur n'ont pas été exécutés par l'assistant**. Les changements de capacité et la suppression doivent être qualifiés sur la base pilote. Aucun changement Jira n'a été appliqué (nécessite validation de l'utilisateur pour modifier la Story).

**Adaptation BMAD :** skill développeur/contrats lus ; lancement officiel `uv run --no-cache` non exécuté faute de checkout local et de `uv`. Implémentation via connecteurs, limites explicitement maintenues.
