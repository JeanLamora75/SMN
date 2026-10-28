# SMN-321 — File persistante de recalcul

À chaque création, modification ou annulation de fermeture v31, une demande est écrite dans `smn_company_capacity_recalc` **dans la même transaction** que la modification et son audit. Les dates de l'ancien et du nouvel intervalle sont réunies.

Le consommateur sélectionne les périodes enregistrées dans `smn_capacity_period_override` concernant les membres de l'entreprise ; il exclut les périodes figées, clôturées et les saisies manuelles. Il calcule une référence et conserve le résultat JSON dans la file. Il ne modifie jamais les snapshots historiques ni les corrections humaines.

Pour traiter une demande sur la base v31 :

```powershell
pnpm exec tsx scripts/process-company-recalculations.ts --once
```

Le traitement doit être invoqué de façon répétée pour vider la file. Les échecs sont réessayables (au plus 10 tentatives, délai croissant) et les traitements `running` abandonnés sont récupérés après 15 min.

**Limite d'intégration :** ce lot introduit le worker et une commande manuelle ; aucun service automatique permanent n'est encore lancé, et les lecteurs de capacités ne consomment pas tous les résultats persistés. Les périodes non encore enregistrées ne sont pas matérialisées. L'ordonnancement et l'affichage d'alertes administrateur restent nécessaires avant recette fonctionnelle finale.

Aucun test ni migration PostgreSQL n'a été exécuté depuis ChatGPT.
