# SMN-321 — Recalcul ciblé et file persistante

Toute modification de fermeture v31 enregistre un job dans `smn_company_capacity_recalc` lors de la **même transaction PostgreSQL** que la fermeture et son historique. Une tentative de traitement est lancée immédiatement **après COMMIT**. Un échec ne remet pas en cause la fermeture validée : la demande reste en base.

Le worker `processCompanyRecalculation` récupère des jobs avec `FOR UPDATE SKIP LOCKED`, détecte les cycles Scrum et Kanban présents dans la base et recalcule uniquement les périodes recoupant les dates avant/après modification. Il ignore les périodes gelées, clôturées et les valeurs saisies manuellement. Les résultats calculés (référence J/H, membres concernés, état du calcul) sont conservés dans le champ `result` de l'outbox ; les capacités historiques et corrections manuelles ne sont jamais réécrites. Les lecteurs opérationnels exploitent déjà `readDevelopmentCapacity` et recalculent la référence courante à la demande : les résultats de l'outbox sont une trace d'actualisation, pas une nouvelle source comptable prioritaire.

### Supervision et reprise
- `GET /api/admin/companies/recalculations?companyId=<uuid>` : statut et résultats des trente derniers jobs (administrateur ou lecteur habilité).
- `POST /api/admin/companies/recalculations` : tente de traiter un job, administrateur uniquement.
- `pnpm exec tsx scripts/process-company-recalculations.ts --once` : traitement explicite d'un job, sur schéma v31 uniquement.
- Les tentatives infructueuses disposent d'un délai avant reprise et les jobs interrompus passent automatiquement à `failed` lors d'un appel ultérieur du worker. Dix tentatives maximum.

**Exploitation :** les nouvelles fermetures déclenchent automatiquement une tentative après validation. En l'absence de nouvelles fermetures, les jobs en échec ont besoin d'un lancement périodique du worker (ou d'une relance administrateur). Il n'existe pas de planificateur autonome fourni par cette story.

### Contrôles avant application en base
```powershell
pnpm exec tsx --test tests/company-capacity-outbox.test.ts
pnpm exec tsc --noEmit
pnpm db:diagnose
```

Ne pas appliquer la migration v31 sans sauvegarde et vérification des dépendances historiques. Tests PostgreSQL, de reprise et charge à réaliser localement. **Aucun test n'a été exécuté ici.**
