# Scrum Master Notebook — Règles de publication BMAD / Jira

**Mise à jour :** 19 octobre 2026  
**Source :** décisions explicites de l'utilisateur en conversation avec John (Product Manager BMAD).  
**Jira :** https://lmn24.atlassian.net/jira/software/projects/SMN  
**GitHub :** `JeanLamora75/SMN`  
**Workflow :** `.agents/skills/bmad-create-epics-and-stories/`, BMAD v6.12.4, Step 3 en cours.

## Autorisations de publication

1. Les **10 Epics MVP** ont été approuvées et publiées : `SMN-1` à `SMN-10`.
2. Le 19/10/2026, les **18 Stories de l'Epic 1** (`SMN-11` à `SMN-28`, numéros fonctionnels Story 1.1–1.18) ont été **approuvées globalement sans réserve**. Toutes portent désormais le label `fonctionnel-valide`.
3. L'utilisateur a autorisé la **création directe de toutes les Stories de l'Epic 2 sans validation individuelle préalable**, suivie d'une **revue groupée directement dans Jira**. Les 13 Stories 2.1 à 2.13 sont publiées sous `SMN-29` à `SMN-41` et **ont été approuvées globalement sans réserve le 19/10/2026**. Toutes portent le label `fonctionnel-valide`.
4. **Ne plus ajouter d'étiquette Jira « À relire »** (`a-relire`) ni `proposition-fonctionnelle` aux Stories publiées, quelle que soit l'Epic. L'absence de ces étiquettes **ne vaut pas approbation** : distinguer l'autorisation de publication du statut de validation métier.
5. L'utilisateur ayant validé l'Epic 2 et demandé la création groupée de l'Epic « 2 » déjà entièrement rédigée, cette répétition a été **interprétée contextuellement comme la demande de préparer l'Epic 3**, suivante dans le Step 3 BMAD. Les 23 Stories 3.1 à 3.23 ont été publiées sous `SMN-42` à `SMN-64` et **ont été approuvées globalement sans réserve le 19/10/2026** ; elles portent `fonctionnel-valide`. En cas de divergence avec cette interprétation, demander à l'utilisateur de le signaler et réconcilier les tickets.
6. L'utilisateur a autorisé le 19/10/2026 la **publication directe de toutes les Stories de l'Epic 4**. Les **24 Stories 4.1 à 4.24** ont été créées sur Jira sous `SMN-65` à `SMN-88` et **approuvées globalement sans réserve le 19/10/2026** ; toutes portent `fonctionnel-valide`. Aucun label « À relire » n'est utilisé.
7. L'utilisateur a expressément autorisé le 19/10/2026 la **publication directe et groupée de toutes les Stories de l'Epic 5**, sans approbation préalable individuelle. Les **24 Stories 5.1 à 5.24** publiées sous `SMN-89` à `SMN-112` **ont été approuvées globalement sans réserve le 19/10/2026** ; chacune porte `fonctionnel-valide`. Ne pas ajouter `a-relire`.
8. L'utilisateur a autorisé la **création directe de toutes les Stories de l'Epic 6**, sans approbation individuelle préalable. Les **23 Stories 6.1 à 6.23** sont publiées sous `SMN-113` à `SMN-135` et **ont été approuvées globalement sans réserve le 19/10/2026** ; chacune porte le label `fonctionnel-valide`. Aucun tag `a-relire` n'est ajouté. L'Epic 6 a été approuvée globalement sans réserve le 19/10/2026 ; aucun développement ni test attesté.
9. Le 19/10/2026, l'utilisateur a autorisé la **création directe des 23 Stories de l'Epic 7**, publiées sur Jira sous `SMN-136` à `SMN-158`, numérotées 7.1 à 7.23. Les 23 Stories ont **été approuvées globalement sans réserve le 19/10/2026** ; toutes portent `fonctionnel-valide` et aucune étiquette `a-relire`.
10. Le 19/10/2026, l'utilisateur a autorisé la **création directe des 20 Stories de l'Epic 8** (SMN-159 à SMN-178), numérotées 8.1 à 8.20, **avant toute validation individuelle**. Elles restent en attente de **revue et validation fonctionnelles globales**. Ne pas ajouter `a-relire`. Les arbitrages D-PRD-130/A1–A4 sont conservés ; la reprise historique complète Kanban n'est pas incluse automatiquement dans le MVP.
11. Pour les autres Epics, l'autorisation générale reste : **publier chaque Story après validation fonctionnelle**. Une publication groupée avant validation nécessite une nouvelle demande ou autorisation explicite par Epic (ou générale).
12. GitHub peut désormais recevoir les **mises à jour documentaires BMAD** liées au travail en cours, préférablement sur `docs/bmad-arbitrages-metier-valides-20261019` ou branche documentaire dédiée, sans modifier `main` ni procéder à une fusion sans demande expresse. Cette décision ne commande **aucun développement, déploiement, test ou merge**.

## Références et continuité

- Livrable canonique BMAD : `_bmad-output/planning-artifacts/epics.md` sur la branche documentaire.
- Epic 1 : https://lmn24.atlassian.net/browse/SMN-1 — Stories validées, détails et critères consultables.
- Epic 2 : https://lmn24.atlassian.net/browse/SMN-2 — 13 Stories validées.
- Epic 3 : https://lmn24.atlassian.net/browse/SMN-3 — 23 Stories validées.
- Epic 4 : https://lmn24.atlassian.net/browse/SMN-4 — 24 Stories validées globalement.
- Epic 5 : https://lmn24.atlassian.net/browse/SMN-5 — 24 Stories validées globalement.
- Epic 6 : https://lmn24.atlassian.net/browse/SMN-6 — 23 Stories validées globalement.
- Epic 7 : https://lmn24.atlassian.net/browse/SMN-7 — 23 Stories validées globalement.
- Epic 8 : https://lmn24.atlassian.net/browse/SMN-8 — 20 Stories publiées pour revue groupée, approbation fonctionnelle attendue.
- Au retour dans une autre conversation, relire ce document et les Epics Jira avant de proposer une nouvelle création ou correction.
- Ne pas déclarer le Step 3 terminé avant d'avoir traité les 10 Epics et reçu la commande de continuation `C` prévue par le workflow BMAD.
