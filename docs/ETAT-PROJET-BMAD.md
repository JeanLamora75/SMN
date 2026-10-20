# SMN — État du projet et de BMAD

**Situation vérifiée le 19 octobre 2026.** Synthèse documentaire ; Jira demeure la référence de l'avancement des tickets.

## Jalons

| Étape | État et preuve |
| --- | --- |
| Brainstorming | [124 décisions F validées](DECISIONS-FONCTIONNELLES.md) |
| Product Brief — Mary | [Final, phase complete, approuvé le 18/10](../_bmad-output/planning-artifacts/briefs/brief-SMN-2026-10-18/brief.md) |
| PRD — John | [Final](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/prd.md), 81 FR et décisions jusqu'à D-PRD-136 |
| Architecture — Winston | [Contrat final AD-1 à AD-31](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ARCHITECTURE-SPINE.md), réserves techniques maintenues |
| Create Epics and Stories | [Final](../_bmad-output/planning-artifacts/epics.md), quatre étapes achevées, confirmation utilisateur C — Complete Workflow |
| Jira | 10 Epics / 212 Stories après D-PRD-137 ; 222 tickets À faire lors de la relecture du 19/10 |
| Sprint Planning | Poursuite sous CONCERNS autorisée le 19/10 à 22:41 ; [suivi généré et validé](../_bmad-output/implementation-artifacts/sprint-status.yaml), 212 Stories backlog |
| Développement / recette / pilote | Aucune implémentation applicative, campagne de recette ou aptitude au pilote attestée |

Le découpage final déclare la couverture des 81 FR, 3 NFR et 18 UX-DR. Il s'agit de couverture documentaire, pas de résultats de tests.

## Décisions applicables et réserves

A7 (criticité), A8 (faits automatiques), A10 (archives PDF), A11 (données personnelles) sont **validés**. AD-31 est corrigé à **deux rôles Administrateur/Utilisateur** par [D-PRD-132 à 136](../_bmad-output/planning-artifacts/prds/prd-SMN-2026-10-18/arbitrages-metier-valides-2026-10-19.md). Les anciennes propositions à trois rôles et leurs blocages métier sont historiques.

Restent à traiter aux portes prévues : A5 (seuils et protocoles NFR), A12 (preuve de restitution multitemporelle), POC I0 Windows/PostgreSQL/PDF, choix et versions des bibliothèques, migrations, sessions, concurrence, sauvegarde/restauration, sécurité et cohérence temporelle. Le lint officiel et le Reviewer Gate indépendant d'architecture ne sont pas attestés. A9 (création rétrospective complète de périodes Kanban) demeure hors engagement MVP.

Les décisions UX sont documentées dans le PRD et les UX-DR ; aucun livrable autonome du workflow bmad-ux n'est présent. Ce workflow est facultatif dans le catalogue installé.

## Prochaine étape officielle

**Sprint Planning poursuivi sous CONCERNS avec accord explicite d'Eric.** Le [compte rendu](../_bmad-output/planning-artifacts/sprint-planning-2026-10-19.md) et le suivi sont générés. 10 Epics et 212 Stories backlog, 10 rétrospectives optional ; aucune Story ready-for-dev ou en cours. C3/C4 restent tracés.

Affiner le premier Sprint selon capacité et disponibilités, puis préparer le premier travail via bmad-build sous mandat de construction distinct. Aucun Sprint Jira créé/démarré, aucune fusion ni implémentation.

## Sources réunies

| Source | Contenu retenu |
| --- | --- |
| main au début de la consolidation : 6186a4e2a55c32f36fdfc1c0d8300ccfc0ad872b | Skills/configuration BMAD et cadrage initial |
| docs/bmad-product-brief-smn-20261018 | Product Brief et journal |
| docs/bmad-arbitrages-metier-valides-20261019 | Versions actualisées du PRD, de l'architecture, des annexes et des Epics/Stories |
| docs/bmad-prd-smn-20261018 et docs/bmad-architecture-smn-20261019 | Comparées ; leurs fichiers sont repris ou amendés dans la branche des arbitrages |

Les branches d'origine et journaux sont conservés. La PR historique du Product Brief reste une trace de sa transmission initiale ; l'index présent donne accès à sa copie consolidée.



## Préparation technique — complément du 19/10/2026 à 22:29

Politique de sessions D-PRD-138 et principe de récupération locale D-PRD-139 validés. Stack désormais retenue sous réserve des essais I0 : [ADR-I0-001](../_bmad-output/planning-artifacts/architecture/architecture-SMN-2026-10-19/ADR-I0-001-STACK.md). Node 24.21.0 et pnpm 12.10.0 sont déclarés ; PostgreSQL serveur reste à confirmer. C3 reste ouvert pour mécanismes, compatibilité exacte et preuves ; C4 reste ouvert pour ordre de livraison. Prochaine conception : migrations et secrets. Aucun développement, test applicatif, génération de suivi ou fusion attesté.


## Actualisation du poste — 20/10/2026 à 08:36 (Europe/Paris)

PostgreSQL **18.6** déclaré par Eric ; le numéro remplace l'information manquante du complément historique du 19 octobre. Le serveur effectif, la connexion, les droits et la compatibilité exacte restent à vérifier : voir l'[inventaire actualisé](../_bmad-output/planning-artifacts/preparation-technique-i0.md). Aucune recherche web ni essai DB effectué. CONCERNS maintenu. Le premier Sprint d'une semaine est prévu du 20 au 26 octobre, sur 40 heures nominales ; aucun Sprint Jira n'est démarré.


**Complément du 20/10/2026 à 08:39 (Europe/Paris) :** Eric rapporte `SHOW server_version;` → **18.6**. Numéro du serveur interrogé confirmé par ce résultat utilisateur ; requête non exécutée par l'assistant. Connexion SMN, droits, migrations et compatibilité restent à éprouver. Voir l'inventaire technique actualisé ; CONCERNS maintenu.

## Développement I0 — état opérationnel du 20 octobre 2026

La Story [SMN-11](https://lmn24.atlassian.net/browse/SMN-11) est **En cours** sur Jira et `in-review` dans son artefact BMAD. La branche `dev/bmad-i0-20261020` est présentée dans la [PR nº 10](https://github.com/JeanLamora75/SMN/pull/10) (brouillon, non fusionnée).

**Contrainte de coexistence confirmée par l'utilisateur :** l'autre projet utilise les ports locaux 3000, 3001 et 3002. SMN a été déplacé au **port 3003** pour les démarrages développement et production, avec `SMN_PORT` personnalisable hors des ports réservés. Le [guide Windows](../docs/INSTALLATION.md) a été actualisé.

**Preuve Linux CI** : [exécution GitHub Actions](https://github.com/JeanLamora75/SMN/actions/runs/39388328841), 23 tests réussis sur 23, lint/typecheck/build et tests HTTP. La CI a maintenu un serveur simulé sur le port 3000 tout en vérifiant SMN sur 3003. **Non attesté** : usage simultané des deux projets sur le PC Windows 11, permissions PostgreSQL locales et revues BMAD indépendantes ; CONCERNS maintenu. L'ancien état « aucun développement » décrit la situation à sa date historique et ne s'applique plus à cette section.


## Actualisation — livraison pilote directement sur `main` (20 octobre 2026)

Le jalon plus haut, indiquant SMN-11 sur branche et PR brouillon, est **historique et dépassé**. [SMN-11](https://lmn24.atlassian.net/browse/SMN-11) est terminée et [PR nº 10](https://github.com/JeanLamora75/SMN/pull/10) fusionnée.

[SMN-12](https://lmn24.atlassian.net/browse/SMN-12) : installation Express (Scrum/Kanban, produit, équipe, Administrateur) livrée sur `main` via [PR nº 11](https://github.com/JeanLamora75/SMN/pull/11), CI Linux/PostgreSQL 18 et Windows réussie (37/37 tests Linux). **La Story n'est pas encore déclarée terminée : recette sur PostgreSQL 18.6 Windows personnel à confirmer.** L'option A reste appliquée : sans connexion ni tableau de bord avant SMN-14.

L'ancienne [PR nº 7](https://github.com/JeanLamora75/SMN/pull/7) Product Brief est **clôturée sans merge**, ses lignes étant déjà incluses dans `main`, qui contient en outre l'arbitrage D-PRD-137. Aucune suppression de contenu.

**Processus souhaité pendant le pilote** : à compter des prochains travaux, commits directement sur `main` sans cycle de branches/PR, en conservant tests CI, traçabilité Git/Jira et garde-fous des migrations. Dans GitHub Desktop, sélectionner `main` puis Fetch/Pull.
