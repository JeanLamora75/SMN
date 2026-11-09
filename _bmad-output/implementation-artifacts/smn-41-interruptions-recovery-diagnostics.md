# SMN-41 — Diagnostiquer les interruptions et résultats de récupération

**Jira :** https://lmn24.atlassian.net/browse/SMN-41  
**Date :** 9 novembre 2026  
**État :** développement de diagnostics publié sur `main` ; tests rédigés, qualification Windows/PostgreSQL non exécutée. Story **partiellement réalisée**, ne pas clôturer.

## Constat sur l'existant
- Avant ce lot, `last-attempt.json` enregistrait surtout « Réussie/Échec ». Une coupure pendant une sauvegarde pouvait laisser un `.partial` ou un paquet publié sans statut récent.
- Les sauvegardes sont publiées par renommage de `.partial` vers leur UUID et `verification.ts` vérifie le contenu réel chiffré.
- La purge de rétention (`retention.ts`) peut supprimer plusieurs paquets en série : l'opération n'est **pas atomique entre le système de fichiers et PostgreSQL**. Une panne entre suppression physique et écriture de son audit pouvait masquer un résultat partiel.
- Les restaurations SMN-34 et réinitialisations SMN-37 restent volontairement non exécutables ; SMN-40 bloque la réintroduction de données effacées.

## Travaux sur main
1. `src/server/backup/operation-diagnostics.ts` — contrat de diagnostic sans contenu personnel. Statuts : en cours, réussie, échec, annulée, interrompue, partielle, bloquée ; codes explicatifs et marche à suivre, compteurs traité/restant/échoué/incertain. Les objectifs RPO 24 h et RTO 60 min sont **indicatifs** ; aucune mesure n'est disponible, `targetsValidated:false`.
2. `runner.ts` — marqueur d'intention `running` persisté **après acquisition du verrou** et avant capture, puis statut final. Si une seconde sauvegarde échoue avant le verrou, son échec n'écrase pas la tentative déjà en cours. La présence d'un marqueur `success` ne constitue pas une preuve de réussite.
3. `retention.ts` — journal `last-cleanup.json`, atomicité du fichier de journal par remplacement, identification des paquets prévus, confirmés et du paquet en cours ; une interruption ou erreur écrit `partial/failed` lorsque possible, sans prétendre effacer l'incertitude d'un crash.
4. `src/server/backup/protection-diagnostics.ts` — relecture du marqueur, de la liste des paquets et du verrou PostgreSQL (type de processus : sauvegarde / purge). Une sauvegarde n'est `succeeded` **que si le paquet passe de nouveau `inspectBackup`**. Une purge n'est `succeeded` que si chaque suppression confirmée a un audit SQL et un paquet physiquement absent. Sinon, statut interrompu/partiel et obligation de contrôler l'inventaire avant de relancer. Les statuts de restauration/réinitialisation demeurent bloqués, jamais réussis artificiellement.
5. `GET /api/admin/backups/operations` — diagnostic accessible aux seuls Administrateurs autorisés ; réponses sans mot de passe, phrase de récupération, texte libre privé, noms effacés ou URI SQL.
6. `GET /api/admin/backups` — l'étiquette « Dernière tentative » est désormais réconciliée avec la preuve vérifiée ; un vieux marqueur `success` sans paquet reconnu affiche non vérifiable, pas réussite.
7. `src/app/app/admin/backups/protection-operations.tsx` — nouvel écran sous Administration → Sauvegardes, avec statuts, cause, reprise proposée et compteurs de purge, en FR/EN.
8. `tests/smn-41-operation-diagnostics.test.ts` — tests de politique du faux succès, de l'interruption, du caractère partiel, des codes fermés, de l'annulation conceptuelle et du RPO/RTO non garanti.

## Critères d'acceptation
| AC | Couverture | Reste |
|---|---|---|
| AC1 statuts conformes à la persistance | Sauvegarde et purge réconciliées, restauration/reset explicitement bloqués | Recette de coupure du processus et vérification des états réels |
| AC2 interruption et reprise | Marqueurs persistés, verrou réel, absence de faux succès, consignes de relance prudentes | Reprise crash-safe des purges et consolidation des anciens états historiques |
| AC3 résultats mixtes | Purge avec UUIDs de paquets enregistrés et vérification audit + disque ; compteurs traités/restants/incertains | Récupération automatisée des fichiers en répertoire `.retention-removing-*` après crash ; la purge n'est pas une transaction DB+disque |
| AC4 confidentialité | Diagnostic à codes fermés, compteurs et identifiants techniques ; API protégée | Tests d'intrusion et d'absence de secrets dans les journaux Windows |
| AC5 RPO/RTO | 24 h / 60 min affichés **uniquement comme cibles indicatives** ; aucune mesure fictive | Essai réel chronométré puis acceptation formelle |

## Validation à exécuter
```powershell
pnpm exec tsx --test tests/smn-41-operation-diagnostics.test.ts
pnpm typecheck
pnpm i18n:check
pnpm test
pnpm build
```
Recettes Windows/PostgreSQL recommandées : sauvegarde avec interruption avant et après publication, redémarrage du serveur, clé locale absente, vérification d'un paquet modifié, purge en 3 paquets avec échec sur le 2e, réconciliation avec `smn_backup_retention_audit`, vérification d'absence de données nominatives dans l'API. **Ces commandes et scénarios n'ont pas été exécutés depuis la session connecteur GitHub.**

## Restrictions
La réparation automatique d'une purge partielle **n'est pas activée** : elle demande un arbitrage avant réessai pour ne pas masquer des fichiers manquants. Un statut `interrupted` ou `partial` ne devient pas `succeeded` sans contrôles. La restauration et la réinitialisation restent bloquées par SMN-34/37/40 ; ce lot ne rend aucune opération destructive supplémentaire disponible.

## Adaptation BMAD
Le skill `.agents/skills/bmad-build/SKILL.md` a été lu sur GitHub. Il demande `uv run --no-cache ... render_skill.py` ; `uv` et l'arborescence exécutable de SMN n'étant pas disponibles dans le connecteur GitHub, la procédure officielle n'a pas été exécutée. Adaptation documentaire GitHub/Jira, sans prétendre à des validations BMAD ni des tests non réalisés.

## Précisions du contrôle après revue statique
- Le processus de purge prend temporairement l'`application_name` PostgreSQL `smn-retention-cleanup` ; le diagnostic distingue ainsi une purge réellement active de la modification de la politique de rétention, qui partage le même verrou.
- Chaque journal de purge inclut les UUID des paquets prévus/confirmés et un UUID `inFlight`. Les UUID restent des identifiants techniques, sans contenu de sauvegarde ni données personnelles.
- Pour chaque retrait déclaré confirmé, la lecture des preuves compare `smn_backup_retention_audit` avec l'absence du paquet dans `packages/`. Une divergence ou une erreur de consultation rend le résultat partiel ou incertain ; la simple présence de `status:success` ne suffit pas.
- Le bandeau existant « Dernière tentative » dans `GET /api/admin/backups` suit désormais la classification **vérifiée** des sauvegardes. Une trace historique avec `success` mais sans UUID/preuve donne « Non vérifiable ».
- Les statuts de restauration/réinitialisation sont présentés comme **bloqués**, pas comme annulés ou réussis.
