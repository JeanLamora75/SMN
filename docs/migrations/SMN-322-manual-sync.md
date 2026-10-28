# SMN-322 — Corrections manuelles et synchronisation

Le calcul référence n'écrase pas les valeurs manuelles de capacité. La file de recalcul conserve ses résultats séparément des tables de corrections et des snapshots.

## Consultation
L'API `GET /api/admin/capacity/synchronization?teamId=...&start=YYYY-MM-DD&end=YYYY-MM-DD` est réservée aux administrateurs pour une équipe résolue côté serveur. Elle expose :
- `status` : `up-to-date`, `pending`, `running`, `failed`, `not-available`.
- `pending`, `running`, `failed`, `latestCompletedAt`.
- `manualOverride` : une valeur manuelle existe pour la période.
- `protectedPeriod` : la période est gelée ou clôturée.

L'API n'effectue aucune écriture et ne démarre pas le worker. Les états « échec » et « en attente » ne sont jamais maquillés en « synchronisé ». `up-to-date` signifie absence de job en attente/en erreur dans le périmètre interrogé, **pas** garantie que chaque calcul historique a été rejoué.

## Recette locale nécessaire
```powershell
pnpm exec tsx --test tests/capacity-synchronization.test.ts
pnpm exec tsx --test tests/company-capacity-outbox.test.ts
pnpm exec tsc --noEmit
pnpm db:diagnose
```

La migration v31 demeure une opération explicite. L'écran Cockpit Agile peut utiliser cette API pour afficher les états de synchronisation, mais son intégration graphique complète reste à tester et adapter dans SMN-323/324.
