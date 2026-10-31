# SMN — Migration, validation et traçabilité des indicateurs
Statut : stratégie documentaire ; aucune migration exécutée.

## Migration et préconditions
Source vérifiée : baseline native v32, `scripts/db-upgrade.ts` et `scripts/generate-v32-baseline.ts`. Le script `db:upgrade` consulté refuse les migrations historiques automatiques ; ne pas supposer la mise à niveau prise en charge. Concevoir une migration de remplacement explicite et une baseline native cohérente avec le nouvel état cible.
1. Inventorier toutes les tables SQL, vues, fonctions, appels API, composants, tests et exports historiques ; classer « indicateur à supprimer », « capacité/calendrier à préserver », « snapshot métier à préserver ».
2. Sauvegarder, vérifier version et état installation, prévisualiser les objets destructifs, établir les dépendances et les contrats de réversibilité.
3. Retirer les structures propres aux anciens indicateurs *uniquement après preuve de classement* ; ne pas détruire par simple ressemblance de nom les capacités ou les métriques Kanban.
4. Créer les huit tables, CHECK, FK ordinaires, unicités et index ; intégrer les migrations à l'installateur et au diagnostic ; prévoir mise à niveau installation existante et installation vierge.
5. Assurer convergence des schémas et invariants de données ; comparer les signatures attendues, journaliser l'opération, interdire état « installé » sur schéma incomplet.
6. Remplacer interfaces, API et calculs, sans placeholder temporaire ; réaliser la recette locale Windows 11 avec acceptation explicite avant bascule fonctionnelle.

## Tests indispensables
- **Maths** : parseur AST sûr, priorités, MIN/MAX/ROUND, puissance, %, domaine, arrondi HALF_UP, précision décimale, budgets.
- **Graphe** : cycle interdit, topologie, impacts inverses, grands graphes itératifs, sources implicites.
- **SQL** : FK ordinaires, CHECK/UNIQUE, cycle polymorphe par service TS, nettoyage transactionnel, interdiction suppression référencée, archivage conservateur.
- **Concurrence** : saisie par révision de cycle, révision globale, simulation obsolète, ordre de verrouillage, relances bornées.
- **Calendrier** : fermeture/absence/capacité et indicateurs dans une transaction commune, rollback total ; snapshots indépendants non modifiés.
- **UI** : habilitations multiéquipe, tous statuts, modale et aperçu, null distinct zéro, rapports et tendances, affichage Cockpit Agile.
- **Migration** : installation existante et neuve, mode échec, cohérence version/baseline, non-régression sur historiques.
- **Performance** : calibrer budgets selon tests, aucun seuil chiffré inventé ; gros recalcul global COMMIT/ROLLBACK unique.
- **Livraison** : tests bloquants puis recette locale Windows 11 et acceptation utilisateur explicite.

## Traçabilité de haut niveau
| Exigences | Décisions | Contrôles |
|---|---|---|
| Catalogue, tags, archive | IND-01..03, IND-19, ADR-12/20/21, ARCH-02 | validations catalogue, suppressions |
| Sélection/affichage | IND-04,09,10,12,15, ARCH-02.4 | isolation équipes, sources masquées |
| Valeurs/cycles | IND-05,06,20, ARCH-02.1/2.5/2.6 | NULL/0, après clôture, révisions |
| Formules | IND-13,14,16,17, ARCH-03.1..3.9 | mathématiques, invalidité, graphe |
| Calendrier | IND-26,30, ADR-02/10/18, REV-01 | réutilisation clients et rollback |
| Publication | IND-23, ADR-03/23, REV-02/04, ARCH-03.10..12 | simulation, stale, budgets |
| Démantèlement | IND-27..29, ADR-11/29 | migration et baseline, tests régression |
| Recette | ADR-27/28/30 | tests locaux et acceptation explicite |

## Réserves pré-implémentation
L'inventaire exhaustif du dépôt n'est pas prouvé ; aucun DROP SQL final ni seuil de budget exact n'est établi. Bibliothèque décimale et connecteurs du calendrier à qualifier. Le workflow BMAD officiel reste à localiser. Voir `SMN-IND-REVUE-TECHNIQUE.md`.
