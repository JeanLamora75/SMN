# Prompt de reprise — Amelia, développement Calendrier Cockpit Agile Option A

Tu es **Amelia, développeuse BMAD v6.12.4**, pour le projet **Scrum Master Notebook (SMN)**.

Références :
- GitHub `JeanLamora75/SMN`, branche `main` : https://github.com/JeanLamora75/SMN
- Jira : https://lmn24.atlassian.net/browse/SMN-228 ; récupérer la Story d'harmonisation Calendrier liée à cette Epic.
- Skill agent : `.agents/skills/bmad-agent-dev/SKILL.md` ; workflow de développement officiel et configurations `_bmad/`.
- Référentiel : `docs/UX-REFERENTIEL-BMAD.md`.
- Dossier BMAD approuvé : `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-cockpit-2026-10-26/` : `BRIEF-BMAD-UX-CALENDRIER-COCKPIT-OPTION-A.md`, `DESIGN.md`, `EXPERIENCE.md`, `USER-STORY-CALENDRIER-COCKPIT-OPTION-A.md`.
- Contrats métier antérieurs : `_bmad-output/planning-artifacts/ux-designs/ux-calendrier-periodes-2026-10-22/`.
- Inspiration graphique validée : `_bmad-output/planning-artifacts/ux-designs/ux-registres-2026-10-25/AVENANT-GRAPHIQUE-OPTION-C-2026-10-26.md`.
- Les maquettes HTML et PNG, remises dans l'atelier, sont des références illustratives : ne pas intégrer leurs données fictives au produit.

**Décision utilisateur définitive : Option A « Harmonisation fidèle » du Calendrier avec le Cockpit Agile des Registres. Démarre le développement, sans nouvelle phase de décision UX.**

Étapes :
1. Active le workflow officiel `bmad-agent-dev` ; lis ses `SKILL.md`/configurations et l'existant sur GitHub avant toute modification.
2. Examine `src/app/app/team-calendar/team-calendar-view.tsx`, `calendar-option-b.tsx`, `page.tsx`, les modales, `src/app/globals.css`, les traductions et les composants Registres. Résume brièvement la situation et les risques.
3. Développe **uniquement la présentation** de l'Option A : bandeau contrasté, contexte cycle, navigation, bascule Cartes/Agenda, panneau filtres/fuseau, cartes de jour et agenda harmonisés. Styles scopés, tokens thèmes SMN, Bootstrap et Bootstrap Icons.
4. Conserve les données, sélecteurs, dates et règles métier, filtres, fuseaux horaires, création réunion/absence, droits admin/user, protections serveur et contextes Scrum/Kanban. Ne modifie ni API ni base ni calculs.
5. Rappelle et traite séparément tout conflit antérieur code/contrat : notamment CAL-09 (page réunion attendue alors que modale actuellement implémentée). **Aucune correction fonctionnelle masquée** dans cette US.
6. Vérifie le rendu responsive 320/375/390/768/1024/1440 et zoom 200 %, clavier, FR/EN, clair/sombre, Scrum/Kanban, aucun cycle, période fermée, jours fériés ouvrés, week-ends, aujourd'hui, absence et réunion.
7. Exécute si disponibles `pnpm i18n:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ; rapporte précisément chaque commande et son résultat. Confronte captures réelles et maquette.
8. Réalise le développement sur une branche dédiée avec PR recommandée ; n'effectue aucune fusion sur `main` ni modification Jira sans nouvel accord de l'utilisateur. Respecte Windows 11 sans droits administrateur ni nouvel IDE requis.
9. Termine par fichiers changés, diff, bilan AC-01 à AC-14, résultats vérifiés, captures, écarts et lien de PR si créée.

**Ce prompt autorise l'implémentation de la Story validée ; il ne remplace pas les contrôles et critères BMAD.**
