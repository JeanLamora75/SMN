# BRIEF BMAD — Mode Agile Scrum/Kanban par équipe

**Agent d'origine :** John, Product Manager, BMAD v6.12.4
**Date :** 2026-10-27 · **Epic :** [SMN-287](https://lmn24.atlassian.net/browse/SMN-287)
**Statut :** cadrage fonctionnel approuvé, compléments d'archivage identifiés comme recommandations.

## Objectif
Une installation SMN peut contenir plusieurs équipes indépendantes, dont certaines Scrum et d'autres Kanban. L'identité produit et le mode sont propres à chaque équipe. Les rubriques, cycles, indicateurs, capacités, cérémonies, registres, rapports et paramètres métier doivent suivre l'équipe active sans fuite ni perte d'historique. Réutiliser SMN-282 et conserver le Cockpit Agile.

## Décisions validées par le Product Owner

| Décision | Règle |
|---|---|
| D-AGILE-01 | Le mode Scrum/Kanban est une propriété de l'équipe. L'admin peut le modifier seulement avant toute création de cycle ; un cycle historiquement créé le verrouille, même supprimé/archivé. |
| D-AGILE-02 | Changement d'équipe : cycle courant ; sinon **le plus récent** ; sinon aucun cycle. |
| D-AGILE-03 | Écrans, indicateurs et fonctionnalités suivent l'équipe sélectionnée. |
| D-AGILE-04 | Seul l'administrateur définit/modifie le mode Agile. |
| D-AGILE-05 | Le choix Scrum/Kanban est obligatoire à la création, sans présélection implicite. |
| D-AGILE-06 | Le verrouillage survit à la suppression/l'archivage de cycles. |
| D-AGILE-07 | Le mode choisi à l'installation initialise la première équipe, puis n'est plus un paramètre métier global. |
| D-AGILE-08 | Conserver le mode fiable des équipes historiques ; à défaut, **Scrum par défaut**. |
| D-AGILE-09 | Conserver la rubrique équivalente au changement d'équipe, sinon retour au tableau de bord. |
| D-AGILE-10 | Mémoriser la dernière équipe accessible par utilisateur. |
| D-AGILE-11 | Badge Scrum/Kanban dans l'en-tête ou près du nom ; choix dans la création/édition d'équipe. |
| D-AGILE-12 | Libellé « Sprints » en Scrum et « Périodes » en Kanban. |
| D-AGILE-13 | Cycles simultanément courants : avertir, choisir celui commencé le plus récemment, sans changer la base. |
| D-AGILE-14 | Si équipe active inaccessible/archivée : autre équipe autorisée ; sinon sélection explicite. |
| D-AGILE-15 | Garder le Cockpit Agile ; seuls les KPI pertinents au mode sont visibles. |
| D-AGILE-16 | Registres communs, isolés par équipe, liens au cycle de son mode. |
| D-AGILE-17 | Modèles de cérémonies propres à l'équipe ; aucune cérémonie imposée à la création. |
| D-AGILE-18 | Masquer les fonctions Scrum inadaptées en Kanban ; pas de valeurs fictives ; conserver l'historique. |
| D-AGILE-19 | Paramètres métier par équipe ; préférences d'application et catalogues nationaux globaux. |
| D-AGILE-20 | Rapports/données propres à l'équipe ; modèles génériques ou compatibles avec le mode. |
| D-AGILE-21 | Import historique seulement si mode du fichier compatible avec celui de l'équipe. |
| D-AGILE-22 | Pas de rapport consolidé Scrum+Kanban au MVP. |
| D-AGILE-23 | Contrôle serveur systématique installation + teamId + autorisations + cycles + ressources. |
| D-AGILE-24 | Prévoir une extensibilité future, sans implémentation SAFe au MVP. |

## Archivage/réactivation — demande supplémentaire validée
- L'administrateur peut **archiver** une équipe et la **réactiver**.
- Une équipe archivée ne figure plus dans le sélecteur global de l'en-tête.
- Elle reste visible dans Paramètres > Équipes pour être réactivée.
- Aucune perte ni effacement des données, identifiants, historiques ou références ; le mode et son verrouillage sont conservés.

### Recommandations NON ENCORE VALIDÉES
- Autoriser la consultation des historiques archivés seulement dans une interface administrateur dédiée.
- Interdire les écritures métier sur les équipes archivées.
- Interdire l'archivage de la dernière équipe active de l'installation.
Ces règles demandent validation du Product Owner avant spécification comme critères de recette définitifs.

## Limites et existant
- SMN-282 a livré un socle de création/modification et sélection d'équipe, mais plusieurs verrous de mise en service subsistent.
- Le produit demeure indépendant par équipe, facultatif ; nom/vision/but du produit facultatifs selon SMN-282.
- Les protections des brouillons et la priorité des liens explicites autorisés sont héritées de SMN-282.
- Habilitations multiéquipes des comptes `user` et migration de leurs anciens droits : **reportées à V1**.
- Exclusions : SAFe, conversion après premier cycle, suppression physique d'équipe, fusion de données, consolidation Scrum+Kanban, métriques Kanban fictives.

## Critères de succès du nouvel Epic
1. Alpha Scrum et Beta Kanban coexistent dans une installation ; chaque page affiche son mode et ses données.
2. L'équipe créée exige un choix ; une équipe avec un cycle ancien ne peut plus changer de mode.
3. Changement d'équipe sans fuite d'ID/URL ni de données en cache ; cycles sélectionnés selon D-AGILE-02.
4. Équipe archivée masquée du sélecteur, réactivation non destructive.
5. Migration versionnée, sauvegarde/restauration testées ; historiques inchangés.
6. Isolation et non-régression réellement testées sur Windows 11 avant activation.

**Traçabilité :** [SMN-287](https://lmn24.atlassian.net/browse/SMN-287), [SMN-282](https://lmn24.atlassian.net/browse/SMN-282), `docs/UX-REFERENTIEL-BMAD.md`.
