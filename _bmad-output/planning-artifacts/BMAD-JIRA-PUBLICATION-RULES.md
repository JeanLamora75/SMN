# Scrum Master Notebook — Règles de publication BMAD / Jira

**Mise à jour :** 19 octobre 2026  
**Source :** décisions explicites de l'utilisateur en conversation avec John (Product Manager BMAD).  
**Jira :** https://lmn24.atlassian.net/jira/software/projects/SMN  
**GitHub :** `JeanLamora75/SMN`  
**Workflow :** `.agents/skills/bmad-create-epics-and-stories/`, BMAD v6.12.4, Step 3 en cours.

## Autorisations de publication

1. Les **10 Epics MVP** ont été approuvées et publiées : `SMN-1` à `SMN-10`.
2. Le 19/10/2026, les **18 Stories de l'Epic 1** (`SMN-11` à `SMN-28`, numéros fonctionnels Story 1.1–1.18) ont été **approuvées globalement sans réserve**. Toutes portent désormais le label `fonctionnel-valide`.
3. L'utilisateur a autorisé la **création directe de toutes les Stories de l'Epic 2 sans validation individuelle préalable**, suivie d'une **revue groupée directement dans Jira**. Les 13 Stories 2.1 à 2.13 sont publiées sous `SMN-29` à `SMN-41`, **mais ne sont pas encore validées fonctionnellement**. Les corrections seront demandées globalement après lecture.
4. **Ne plus ajouter d'étiquette Jira « À relire »** (`a-relire`) ni `proposition-fonctionnelle` aux Stories publiées, quelle que soit l'Epic. L'absence de ces étiquettes **ne vaut pas approbation** : distinguer l'autorisation de publication du statut de validation métier.
5. Pour les autres Epics, l'autorisation générale reste : **publier chaque Story après validation fonctionnelle**. Une publication groupée avant validation nécessite une nouvelle demande ou autorisation explicite par Epic (ou générale).
6. GitHub peut désormais recevoir les **mises à jour documentaires BMAD** liées au travail en cours, préférablement sur `docs/bmad-arbitrages-metier-valides-20261019` ou branche documentaire dédiée, sans modifier `main` ni procéder à une fusion sans demande expresse. Cette décision ne commande **aucun développement, déploiement, test ou merge**.

## Références et continuité

- Livrable canonique BMAD : `_bmad-output/planning-artifacts/epics.md` sur la branche documentaire.
- Epic 1 : https://lmn24.atlassian.net/browse/SMN-1 — Stories validées, détails et critères consultables.
- Epic 2 : https://lmn24.atlassian.net/browse/SMN-2 — 13 Stories publiées pour revue groupée, attente d'un retour utilisateur.
- Au retour dans une autre conversation, relire ce document et les Epics Jira avant de proposer une nouvelle création ou correction.
- Ne pas déclarer le Step 3 terminé avant d'avoir traité les 10 Epics et reçu la commande de continuation `C` prévue par le workflow BMAD.
