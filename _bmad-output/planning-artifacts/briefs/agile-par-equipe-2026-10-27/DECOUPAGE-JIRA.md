# Découpage BMAD / Jira — Mode Agile par équipe

**Epic : [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)** — MVP Scrum/Kanban multiéquipes
**Dépendance fondatrice : [SMN-282](https://lmn24.atlassian.net/browse/SMN-282)**.
**Statut :** les tickets sont créés, à faire ; leur création ne signifie pas implémentation ni tests.

| Réf. PM | Jira | Besoin et critère principal | Dépendances |
|---|---|---|---|
| US-AGILE-01 | [SMN-288](https://lmn24.atlassian.net/browse/SMN-288) | Mode par équipe, migration additive sûre, Scrum de secours, protection de l'historique | SMN-282 |
| US-AGILE-02 | [SMN-289](https://lmn24.atlassian.net/browse/SMN-289) | Choix obligatoire en création, édition seulement avant le premier cycle, verrou irréversible | 288 |
| US-AGILE-03 | [SMN-290](https://lmn24.atlassian.net/browse/SMN-290) | Archivage/réactivation non destructifs, masquer des sélecteurs | 288, SMN-282 |
| US-AGILE-04 | [SMN-291](https://lmn24.atlassian.net/browse/SMN-291) | Sélecteur, mode et cycle adaptés, brouillons protégés | 288, 290, 296 |
| US-AGILE-05 | [SMN-292](https://lmn24.atlassian.net/browse/SMN-292) | Menu Sprints/Périodes et interfaces métier réelles | 291, 296 |
| US-AGILE-06 | [SMN-293](https://lmn24.atlassian.net/browse/SMN-293) | Paramètres, modèles et capacités métier indépendants | 288, 291, 296 |
| US-AGILE-07 | [SMN-294](https://lmn24.atlassian.net/browse/SMN-294) | KPI fiables et capacité contextualisée Scrum/Kanban | 291, 292, 293, 296 |
| US-AGILE-08 | [SMN-295](https://lmn24.atlassian.net/browse/SMN-295) | Registres, documents, PDF, archives et imports compatibles | 288, 291, 292, 296 |
| US-AGILE-09 | [SMN-296](https://lmn24.atlassian.net/browse/SMN-296) | Isolation serveur, permissions, concurrence, fail-closed | 288, SMN-282 |
| US-AGILE-10 | [SMN-297](https://lmn24.atlassian.net/browse/SMN-297) | Migration restaurable, trois équipes de modes différents, recette Windows | Toutes |

## Lots conseillés
- **Lot 0 — Qualifier SMN-282** : état réel de la base v27/v28, migration non présumée, gardes, tests existants.
- **Lot 1 — Fondations P0** : SMN-288, SMN-289 et contrôles transversaux SMN-296.
- **Lot 2 — Vie et navigation** : SMN-290, SMN-291.
- **Lot 3 — Présentation et métier** : SMN-292, SMN-293, SMN-294.
- **Lot 4 — Historique et reporting** : SMN-295.
- **Lot 5 — Recette complète** : SMN-297, avec tests incrémentaux à chaque lot.

## Dépendances fonctionnelles héritées
- Le mode de création n'est pas présélectionné même si **Scrum par défaut** est retenu en migration lorsque l'origine n'est pas fiable.
- Archivage/réactivation approuvés ; règles fines d'accès aux historiques, écritures et dernière équipe encore à confirmer.
- La priorité actuelle de cycle = courant, sinon plus récent (diffère d'un contrat SMN-282 initial).
- Autorisations d'accès d'un compte `user` par équipe et sort des comptes historiques sont reportés à V1.
- Dans SMN-282, les services multiéquipes sont présents mais leur activation effective et la recette restent à confirmer.

## Critères transversaux de clôture
Pour chaque Story : besoin testable, isolation par installation/équipe et rôle, aucune valeur fictive, FR/EN et design Cockpit Agile, contrôle des erreurs, transactions/audit lorsque nécessaire, migration compatible et preuve réelle de validation. Les fonctions non déployées ne doivent pas être présentées comme opérationnelles.
