# SMN-325 — Recette transversale Entreprises et disponibilités

**État initial : NON VALIDÉ.** Ce document et le script associé sont publiés sans exécution des tests sur la machine de l'utilisateur. Aucun succès ne doit être déduit de leur présence.

## 1. Préparation non destructive
- Sur Windows 11, synchroniser la branche `main` via GitHub Desktop.
- Conserver une sauvegarde PostgreSQL avant toute migration. **Ne pas lancer v31 dans le cadre de cette recette sans contrôle explicite du schéma et des données historiques.**
- Démarrer SMN et noter la version `pnpm db:diagnose`. Les tests de fonctions peuvent tourner sans v31 ; les tests intégrés v31 nécessitent un environnement compatible.
- Lancer `powershell -ExecutionPolicy Bypass -File scripts/validate-smn-325.ps1 -IncludeBuild` depuis la racine (ou `pwsh -File ...`).
- Archiver les fichiers `artifacts/smn-325/*.log` et `results.json` ; les journaux peuvent contenir des chemins locaux, les relire avant publication.

## 2. Matrice d'acceptation
| AC | Vérification | Automatique | Manuel |
|---|---|---|---|
| AC01 | Refus migration historique, état du schéma, checksum, diagnostic | company-schema-migration, db-diagnostic | Sauvegarde et préconditions v31 |
| AC02 | CRUD, archivage, doublons, acteurs, concurrence | company-catalog, member-company, company-closures | Comptes admin et user, 2 entreprises et 2 équipes |
| AC02 | Chevauchements, membres sans entreprise, capacité Scrum/Kanban | company-capacity, capacity-regression | Comparer J/H avant/après fermeture, aucun double retrait |
| AC03 | Valeur manuelle prioritaire, cycles figés, file/retry | capacity-synchronization, company-recalculation | Erreur puis relance ; aucune mutation de snapshot |
| AC03 | Calendrier privé multiéquipes | calendar-company-closures | Afficher modale lecture seule et basculer entre équipes |
| AC04 | Lint, TypeScript, build | lint, typecheck, build | FR/EN, clair/sombre, mobile/tablette/desktop |

## 3. Recette fonctionnelle (à cocher, preuves obligatoires)
- [ ] Entreprise créée, renommée, archivée et réactivée ; doublon refusé
- [ ] Membre sans entreprise : calendrier et capacité inchangés
- [ ] Deux membres dans la même équipe, entreprises différentes : fermeture appliquée uniquement au membre concerné
- [ ] Changement d'équipe : aucune fuite de membres ni de fermeture d'une équipe non autorisée
- [ ] Fermeture chevauchant jour férié et absence : déduction une seule fois par demi-journée
- [ ] Cycle Scrum et Kanban ouverts : recalcul ciblé ; période manuellement modifiée inchangée
- [ ] Période clôturée/figée : snapshot et valeurs inchangés
- [ ] Job en erreur, relance et statut : échec visible jusqu'au traitement confirmé
- [ ] Calendrier Cartes et Agenda : couleur entreprise, période, effectif, noms accessibles, modale lecture seule
- [ ] Affichage FR et EN : aucun texte coupé ou non traduit
- [ ] Thèmes clair et sombre : lisibilité des couleurs et de la modale
- [ ] Responsive 375px, 768px, 1440px : pas de débordement, modale utilisable au clavier

## 4. Trace de validation
Pour chaque point : date, compte/équipe/jeu d'essai, résultat PASS/FAIL/BLOCKED, capture ou journal, ticket d'anomalie.
Ne marquer Jira **Terminé** qu'après tests réellement exécutés, anomalies bloquantes corrigées et validation utilisateur.

## 5. Restes à vérifier
Le runner ne remplace pas une base PostgreSQL de recette v31 ni les scénarios UI automatisés. Les tests de services simulés ne démontrent pas à eux seuls la correction des SQL exécutés contre PostgreSQL. Aucun test local n'a été lancé dans ChatGPT.
