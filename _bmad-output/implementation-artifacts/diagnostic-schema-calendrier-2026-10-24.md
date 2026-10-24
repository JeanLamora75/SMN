# Diagnostic SMN — table d'historique des déplacements du calendrier

**Date :** 24 octobre 2026 · **Correctif :** branche `main` · **Statut :** code publié, vérification PostgreSQL locale requise.

## Constat

La commande `pnpm db:diagnose` signalait :
- `schema-incompatible` ;
- `public.smn_calendar_meeting_schedule_history:r` comme seul objet inconnu ;
- installation `initialized`, version enregistrée 27, migrations terminées 27/27 ;
- absence de lecture du marqueur par le diagnostic principal après découverte d'un objet inconnu.

## Cause vérifiée dans les sources

`src/server/sprints/calendar-meeting-reschedule.ts` crée au premier déplacement d'une réunion la table **native** `public.smn_calendar_meeting_schedule_history`, utilisée pour l'audit des horaires avant/après et l'auteur. Cette table avait été oubliée dans l'inventaire strict `INSTALLATION_RELATIONS` de `src/server/installation/contract.ts`. Le contrôle refuse donc à raison toute relation non répertoriée, même créée par le code SMN.

## Correction

1. Ajouter uniquement `public.smn_calendar_meeting_schedule_history:r` à `INSTALLATION_RELATIONS`, au voisinage des autres tables d'historisation des cérémonies.
2. Ajouter un test de provenance dans `tests/installation-relations-inventory.test.ts` : le DDL natif doit exister, l'objet doit être autorisé, et une table tierce doit rester rejetée.
3. Ne modifier ni la base de données, ni les données d'historique, ni la valeur `schema_version`, ni le compteur de migrations. Cette table est une table différée, créée par SMN au premier usage, comme d'autres tables d'audit déjà autorisées.

## Vérifications

Relecture via connecteur GitHub : six vérifications structurelles conformes (entrée unique, DDL correspondant, inventaire préservé, test positif/négatif). **La commande `pnpm db:diagnose` n'a pas été exécutée sur la base Windows de l'utilisateur ; pas de succès PostgreSQL revendiqué.**

Après synchronisation de `main` :

```powershell
pnpm exec tsx --test tests/installation-relations-inventory.test.ts tests/installation-diagnostic.test.ts
pnpm db:diagnose
pnpm typecheck
```

**Résultat attendu :** aucun objet inconnu, version du schéma lisible (27) et `Diagnostic: initialized` si toutes les autres validations de schéma et migrations sont satisfaites. En cas de statut différent, conserver la sortie pour diagnostic avant toute mutation.

Aucun changement Jira, aucune opération destructive ou migration SQL exécutée.
