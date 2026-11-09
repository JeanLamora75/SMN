# Epic SMN-2 — Lot 8 : recette transversale et décision de clôture

**Date de revue :** 2026-11-09 (Europe/Paris)  
**Agent :** Amelia / BMAD Dev  
**Référence figée examinée :** `main` à `a0bde73311bd98ad0118f903de0bb79e74b29197` (16:50:42 UTC).  
**Nature :** audit de preuves GitHub Actions, documents BMAD et statut Jira ; aucune opération destructive sur les données utilisateur.

## Verdict

**NON CONFORME pour la clôture intégrale de l'Epic 2.** Les contrats de sauvegarde, reconstruction isolée, audit, protection et diagnostic ont des preuves automatisées, mais ni la restauration active de l'installation Windows, ni la réinitialisation destructive, ni l'effacement complet des membres historiques et archives non inspectables ne sont qualifiés. La vérification générale I0 échoue sur la référence examinée. Les 13 Stories restent ouvertes tant que leurs critères non prouvés ne sont pas acceptés formellement.

Un résultat vert d'un workflow ciblé sur un ancien commit **ne vaut pas une recette transversale verte sur main actuel**. Les liens ci-dessous référencent des exécutions réellement constatées, pas de nouveaux tests exécutés par cet audit.

## Preuves d'exécution vérifiées

| Périmètre | Run GitHub Actions | Commit testé | Constat | Limite |
|---|---|---|---|---|
| Reconstruction v33 / paquet v4 | [42622151491](https://github.com/JeanLamora75/SMN/actions/runs/42622151491) | `a5bb507e` | Success Windows, Linux et PostgreSQL 18 | Quarantaine, pas de bascule Windows réelle |
| Sauvegardes v4 après lot 5 | [42651636833](https://github.com/JeanLamora75/SMN/actions/runs/42651636833) | `b8032398` | Success | Pas de snapshot DB/fichiers absolu face aux producteurs externes |
| Effacement borné / garde anti-réintroduction | [42645650065](https://github.com/JeanLamora75/SMN/actions/runs/42645650065) | `63589b45` | Success sur 3 jobs | Membres historiques, binaires, chemins de suppression non couverts |
| Simulation de restauration coordonnée | [42651152399](https://github.com/JeanLamora75/SMN/actions/runs/42651152399) | `276700c1` | Success sur 3 jobs | Installation personnelle non restaurée |
| Réinitialisation indépendante | [42654491272](https://github.com/JeanLamora75/SMN/actions/runs/42654491272) | `367b5cd6` | Success sur 3 jobs | POST de réinitialisation active reste bloqué |
| Diagnostic des interruptions | [42658557608](https://github.com/JeanLamora75/SMN/actions/runs/42658557608) | `4b91015b` | Success sur 3 jobs | RPO/RTO non mesurés en réel |
| Vérification générale I0 sur main figé | [42658838171](https://github.com/JeanLamora75/SMN/actions/runs/42658838171) | `a0bde733` | **Failure** | Voir anomalies ci-dessous |
| Quatre workflows v33 spécialisés sur main figé | [SMN-348](https://github.com/JeanLamora75/SMN/actions/runs/42658838261), [349](https://github.com/JeanLamora75/SMN/actions/runs/42658838287), [350](https://github.com/JeanLamora75/SMN/actions/runs/42658838265), [351](https://github.com/JeanLamora75/SMN/actions/runs/42658838274) | `a0bde733` | Success chacun | Ne couvrent pas la recette complète Epic 2 |

## Anomalies transversales vérifiées sur I0

- **P0 — Critère de sortie transversal non atteint :** workflow I0 `42658838171` en échec sur Linux, Windows et job de qualité TypeScript indépendant.
- **P1 — ESLint React :** `src/app/app/admin/backups/protection-operations.tsx:32`, appel `void load()` dans `useEffect`, règle `react-hooks/set-state-in-effect` (1 erreur, 4 warnings dans le job indépendant). La génération des types et le typecheck précédant lint ont réussi, mais la commande qualité s'est arrêtée sur lint.
- **P1 — Tests Windows généralistes :** au moins les assertions de `tests` concernant le renderer `SMN-410` échouent car `.smn-410-poc/node_modules/@resvg/resvg-js` est absent dans le runner ; des assertions de rendu de données Office, préférences indicateurs, colonnes, tags et dossiers Office échouent également. Les tests unitaires Windows généraux ne sont donc pas verts.
- **P1 — RPO/RTO :** cibles indicatives 24 h / 60 min ; mesures d'exploitation et preuve de conformité absentes.

Ne pas résoudre ces écarts par suppression de tests, masquage des erreurs ou déclaration d'une conformité supposée.

## Matrice des 13 Stories

Légende : **P** = preuves partielles exécutées sur runners isolés ; **R** = reste à qualifier fonctionnellement/sécurité ; **B** = blocage sécurité délibéré. Les critères de sortie par Story requièrent des vérifications sur installation représentative et les preuves détaillées de leur ticket Jira.

| Story | Preuve / périmètre vérifié | Réserve à lever | Avis clôture |
|---|---|---|---|
| [SMN-29](https://lmn24.atlassian.net/browse/SMN-29) | Audit PostgreSQL, routes admin, [lot 1](epic2-lot1-hardening-audit.md) | Inventaire exhaustif des mutations sensibles des modules v33/Office/liens/Dashboard Builder | R |
| [SMN-30](https://lmn24.atlassian.net/browse/SMN-30) | Sauvegarde chiffrée v4, [lot 2](epic2-lot2-complete-backups.md), run 42651636833 | Validation locale chemins/fichiers et écrivains externes | P |
| [SMN-31](https://lmn24.atlassian.net/browse/SMN-31) | Vérification des archives, inventaire et reconstruction PG18 | Tests d'archives réelles personnelles et revue Windows | P |
| [SMN-32](https://lmn24.atlassian.net/browse/SMN-32) | Contrats de rétention, refus de purges interrompues | Vérification locale des incidents et de la politique 30 jours | P |
| [SMN-33](https://lmn24.atlassian.net/browse/SMN-33) | Prévisualisation et quarantaine | Confrontation aux données réelles, cas de vieilles sauvegardes | P |
| [SMN-34](https://lmn24.atlassian.net/browse/SMN-34) | Bascule/rollback jetables, [lot 5](epic2-lot5-controlled-restoration.md) | Pas d'activation en production, couverture SMN-40 incomplète, recette Windows absente | **B** |
| [SMN-35](https://lmn24.atlassian.net/browse/SMN-35) | Immuabilité et atomicité contractuelle, [lot 1](epic2-lot1-hardening-audit.md) | Vérifier les mutations sensibles récemment ajoutées et migrations sur installation représentative | P |
| [SMN-36](https://lmn24.atlassian.net/browse/SMN-36) | Archive/suppression, migrations additives | Contrôle global des anciens chemins de suppression et révisions | R |
| [SMN-37](https://lmn24.atlassian.net/browse/SMN-37) | Installation neuve indépendante + rollback jetable [lot 6](epic2-lot6-controlled-installation-reset.md) | Réinitialisation active toujours refusée ; redémarrage et reprise Windows non prouvés | **B** |
| [SMN-38](https://lmn24.atlassian.net/browse/SMN-38) | Inventaire FK, archives, analyses HMAC [lot 4](epic2-lot4-privacy-erasure-control.md) | Revue manuelle des binaires et règles de conservation/expurgation des historiques | **B** |
| [SMN-39](https://lmn24.atlassian.net/browse/SMN-39) | Effacement transactionnel limité aux membres provisoires sans cycle, reçu SQL/HMAC | Pas d'effacement général des membres historiques/exports | **B** |
| [SMN-40](https://lmn24.atlassian.net/browse/SMN-40) | Refus des restaurations risquées, contrôle ciblé des suppressions | `completeHistory` global non démontré, restauration v4 expurgée non qualifiée | **B** |
| [SMN-41](https://lmn24.atlassian.net/browse/SMN-41) | États incidents, purge et tests interruption [lot 7](epic2-lot7-interruptions-recovery.md) | Mesures RPO/RTO réelles manquantes ; comportements des opérations encore bloquées non observables | P |

Les 13 tickets restent accessibles, le 09/11/2026, avec 12 statuts **En cours** et SMN-41 **À faire**. Ce fait ne signifie pas que SMN-41 n'a pas de code : son workflow spécialisé est vert.

## Matrice v33 / Office / Dashboard / multiéquipes

| Dimension | Niveau de preuve | Non attesté |
|---|---|---|
| Schéma natif v33 et PostgreSQL 18 | Reconstruction isolée 2 équipes/3 sprints, hashes de toutes les tables | Redémarrage sur installation Windows personnelle |
| Indicateurs dynamiques v33 | Valeurs, dépendances, recalcul ciblé 13 → 26, workflows v33 spécialisés verts | Exhaustivité de toutes les fonctions et saisies UX |
| Dashboard Builder | Layout JSONB préservé et hash SQL après reconstruction | Ouverture graphique et interactions dans un navigateur |
| Office DOCX | Modèle et fichier sauvegardés et un DOCX à tags simples régénéré | Microsoft Word réel, graphismes complexes et PowerPoint |
| PDF, rapports et fichiers | Archives contrôlées au niveau composants et références | Lecture/expurgation visuelle des PDF scannés et objets incorporés |
| Liens et registres | Données de portée équipe/transverse, commentaires et FK préservés | Parcours de navigation UI et droits de toutes les portées |
| Windows/Linux | Runners spécialisés verts sur anciens commits | Régression **générale** I0 verte sur la référence figée |

## Conditions impératives avant acceptation/clôture

1. Corriger la qualité de `protection-operations.tsx` et qualifier les échecs Windows de I0 sans dégrader les contrôles ; obtenir un run transversal vert sur **un même commit**.
2. Compléter la couverture d'audit et des chemins de suppression récents (SMN-29/35/36).
3. Qualifier avec règles validées l'effacement des membres historiques et les archives non inspectables, avec revue humaine, versions expurgées et couverture exhaustive des chemins d'accès (SMN-38/39).
4. Démontrer une restitution depuis **un paquet chiffré v4 post-effacement** et l'absence de réintroduction ; rendre `completeHistory` réellement prouvable avant tout déverrouillage (SMN-40).
5. Qualifier restauration active et réinitialisation contrôlée dans un banc Windows isolé, avec coupures, redémarrage, rollback et sessions ; ne jamais tester sur la base de travail (SMN-34/37).
6. Documenter mesures observables de reprise et arbitrage explicite RPO/RTO (SMN-41).
7. Obtenir l'acceptation fonctionnelle de l'utilisateur puis seulement envisager les transitions Jira.

**Aucune transition Jira de clôture autorisée par cette revue.** Les API destructives doivent demeurer bloquées sur les périmètres non démontrés.

## Méthodologie et limites de cette exécution

Audit exécuté via connecteurs GitHub/Jira : lecture du commit, des documents, du journal de jobs et de leurs conclusions. L'agent n'a **pas** exécuté localement `pnpm test`, `pnpm typecheck`, `pnpm build`, PostgreSQL 18, Microsoft Office ou Windows 11 et n'a pas effectué de suppression/restauration de données réelles. Aucun script `uv` BMAD exécuté.

Toute correction de code doit être soumise à sa propre CI sur le commit résultant. Un résultat de workflow déjà vert reste une preuve historique sur son SHA, non une garantie sur les futurs commits.
