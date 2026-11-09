# Epic 2 — Lot 7 : interruption, diagnostic et récupération (SMN-41)

**Date :** 9 novembre 2026. **Référent :** Amelia / BMAD Dev. **Branche :** main.

## Portée

SMN-41 vise l'exactitude des états affichés après une sauvegarde, une purge, une restauration ou une réinitialisation : ne jamais transformer un journal ou un état temporaire en preuve de succès. Il ne débloque ni la restauration active SMN-34 ni la réinitialisation SMN-37.

## AC1 — États fondés sur des preuves réellement présentes

Le moteur `src/server/backup/protection-diagnostics.ts` rapproche la dernière tentative de sauvegarde avec l'inventaire vérifié du paquet chiffré v4 et le verrou PostgreSQL. La publication d'une archive reste distincte du simple statut dans `last-attempt.json`. Une opération active conserve son état « En cours », tandis qu'une tentative sans verrou mais marquée en cours devient « Interrompue ».

Le nouveau scanner `src/server/backup/operation-artifacts.ts` signale les répertoires `.UUID.partial` non publiés et les répertoires `.retention-removing-UUID` non réconciliés. Les dossiers de forme inconnue et liens symboliques ne sont jamais assimilés à une réussite. Les fichiers temporaires correspondant **exactement à une opération active avec verrou** sont exclus des anomalies d'interruption, pour éviter les faux positifs.

Les journaux `last-attempt.json` ou `last-cleanup.json` invalides, manquants ou altérés n'autorisent jamais une réussite implicite : les journaux invalides encore présents produisent une anomalie explicite.

## AC2 — Interruption et reprise sans faux succès

Les restes d'une opération interrompue sont diagnostiqués sans suppression automatique. La reprise suggérée est une réinspection de l'inventaire physique et des audits avant tout nouveau lancement. Les paquets déjà publiés sont revérifiés par l'inventaire, tandis que la purge ne peut être relancée si un ancien répertoire d'opération est non réconcilié.

Une restauration ou réinitialisation active non qualifiée est toujours affichée **Bloquée**. Les tests de reconstruction PostgreSQL 18 et de bascule hors ligne des lots 5/6 ne constituent pas une preuve de restauration de l'installation de l'utilisateur.

## AC3 — Résultats partiels cohérents

Le nouveau module `src/server/backup/retention-evidence.ts` exige **un audit SQL unique** de type `package_deleted` et l'absence du répertoire du paquet. Une simple écriture d'audit ne suffit pas ; la simple absence physique non plus. Les résultats de purge sont recalculés via `reconcileCleanupEvidence()` et répartis sans double comptage : confirmés, échoués/incertains, non traités. Le nombre total reste celui des éléments initialement prévus. Une purge prétendument réussie alors qu'un répertoire de suppression demeure ouvert est rétrogradée.

La suppression de paquets ne peut pas être déclarée atomique entre PostgreSQL et système de fichiers ; une opération mixte est donc **Partielle** et non « Réussie ». Les archives chiffrées v4 sont publiées atomiquement sous un identifiant définitif ; un dossier partiel n'est jamais inventorié comme paquet restaurable.

## AC4 — Confidentialité et non-divulgation

Les diagnostics retournent des codes explicitement autorisés, des compteurs et des identifiants techniques UUID. Ils n'exposent ni chemins complets, ni documents bruts, ni messages d'erreur arbitraires, ni secrets. Le scanner ne remonte pas les noms des fichiers douteux : seulement leur nombre. L'API conserve le contrôle d'authentification, le rôle Administrateur et l'absence de paramètres inattendus.

## AC5 — Objectifs RPO/RTO

Le tableau affiche **RPO 24 h / RTO 60 min** uniquement en tant que cibles indicatives. Les mesures concrètes restent `null`, `targetsValidated=false`. Aucune garantie n'est introduite par les tests d'interruption.

## Tests

- `tests/smn-41-operation-diagnostics.test.ts` : tentative en cours, paquet réellement vérifié, interruption, annulation, purge partielle sans double comptage, absence de secrets, RPO/RTO indicatifs.
- `tests/epic2-lot7-operation-artifacts.test.ts` : dossiers provisoires, tombstones, artefacts inconnus, symlinks et distinction d'une opération active.
- `tests/epic2-lot7-retention-pg.test.ts` : base PostgreSQL 18 jetable avec audit de purge, contrôle de présence/absence du paquet, audit dupliqué et trace d'interruption conservée sans destruction.
- `tests/epic2-lot2-retention-safety.test.ts` : non-suppression des dossiers interrompus.
- CI : `.github/workflows/epic2-lot7-interruptions.yml` — tests Windows et Linux, TypeScript, traductions et PostgreSQL 18.

## Points restant liés à d'autres lots

SMN-41 diagnostique et explique les incidents des opérations **réellement activées**. Elle ne crée pas un processus de restauration/reset en production ; SMN-34 et SMN-37 restent verrouillées. Un test de récupération d'une base jetable ne prouve pas la reprise opérationnelle de l'installation Windows personnelle. Les audits d'effacement personnel restent régis par SMN-38 à SMN-40.

**Décision :** valider SMN-41 pour le diagnostic des sauvegardes, purges et blocages ; conserver les réserves explicites sur les opérations destructrices non activées.
