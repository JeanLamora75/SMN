# SMN-343 — Valeurs manuelles avec révision de cycle

Date : 01/11/2026 — implémentation Amelia.

## Livraison

- Service transactionnel `src/server/indicators/manual-values.ts` : `writeManualValues` et `readManualCycleValues`.
- API authentifiée `src/app/api/admin/indicators/manual-values/route.ts` : `PUT` pour un lot atomique, `GET` pour les valeurs et la révision.
- Schéma v33 de SMN-338, sans DDL supplémentaire ni création dynamique des tables.
- Toute valeur décimale est envoyée comme chaîne à PostgreSQL `NUMERIC` ; `NULL` représente un effacement, et `"0"` reste zéro. Pas de conversion float JavaScript.
- Une seule valeur courante par `(team_id, cycle_type, cycle_id, indicator_id)`, par `UPSERT`, sans historique de correction.
- Contrôle de révision commune `smn_indicator_cycle_revision` ; `conflict` en cas d'écriture concurrente. Incrément de `smn_indicator_system_revision` dans le même COMMIT.
- `BEGIN/COMMIT/ROLLBACK` strictement transactionnels ; verrou global puis verrou de cycle, cohérent avec les autres producteurs v33.
- Contrôles : installation v33 initialisée ; compte actif authentifié ayant changé son mot de passe initial ; cycle Scrum/Kanban appartenant à l'équipe, non supprimé et d'un mode compatible ; équipe non archivée ; indicateur sélectionné, actif, manuel et non archivé ; lot sans doublon.
- Les cycles `closed` restent modifiables pour les nouveaux indicateurs, sans toucher à leurs snapshots métiers anciens.
- Les lectures utilisent **une seule instruction SQL** pour récupérer valeurs et révision sur un instantané cohérent.

## Contrat API

`PUT /api/admin/indicators/manual-values`

```json
{
  "teamId": "team-a",
  "cycleType": "scrum",
  "cycleId": "sprint-a",
  "expectedRevision": 3,
  "changes": [
    {"indicatorId": "F01", "value": "0"},
    {"indicatorId": "F02", "value": null}
  ]
}
```

Retour succès : `{"ok":true,"revision":4}` (200). Échecs : 400 entrée invalide, 403 non autorisé, 404 cycle absent ou hors périmètre, 409 révision périmée, 422 indicateur indisponible, 503 erreur technique.

`GET /api/admin/indicators/manual-values?teamId=…&cycleType=scrum&cycleId=…` retourne `{revision,values}`.

**Habilitations :** la politique d'accès actuelle aux routes administrateur autorise les administrateurs globaux. Le service supporte une fonction d'habilitation par équipe **fournie côté serveur** pour les rôles `user`; l'API n'accepte aucun booléen de permission fourni par le client. L'activation des Scrum Masters non administrateurs exige une source autoritaire d'habilitations par équipe ; ne pas déduire la permission à partir d'un champ libre ou de la sélection d'équipe. Tant que cette source n'existe pas, l'API reste volontairement réservée aux administrateurs.

## Recette

- `pnpm test:smn-343` : contrat de valeur, précision, lot et entrée invalide.
- `pnpm db:test:smn-343` : création de base v33 temporaire, Scrum/Kanban clos, lecture, effacement, conflit, isolation, rôle non habilité, rôle habilité via fonction fiable, concurrence entre deux connexions, rollback d'un lot en cas d'erreur sur la deuxième valeur.
- `pnpm validate:smn-343` : toutes les recettes, TypeScript et ESLint.
- GitHub Actions `Vérification I0` exécute les tests sans PostgreSQL dans le job indépendant et les tests réels PostgreSQL sur base éphémère. La base principale `smn` n'est pas modifiée.

## Dépendances

SMN-338 pour le schéma v33 ; SMN-342 pour le calcul des impacts ; SMN-344 pour persistance et recalcul des résultats, dans les transactions futures. SMN-343 ne recalcule pas encore les indicateurs calculés : la Story SMN-344 fournit l'orchestrateur, et aucune publication automatique de résultats périmés ne doit être ajoutée ici.

## État de validation

Les résultats CI du dernier commit devront être constatés avant déclaration « Terminé ». Aucune migration de la base locale v32 de l'utilisateur n'a été effectuée.
